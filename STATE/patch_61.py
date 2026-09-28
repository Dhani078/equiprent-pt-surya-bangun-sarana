# -*- coding: utf-8 -*-
"""Siklus 61: kontrak->tagihan otomatis; cermin segar per isolate (TTL);
route DELETE pembayaran/kontrak/sewa."""
import io

def rw(p, edits):
    s = io.open(p, encoding='utf-8', newline='').read()
    NL = '\r\n' if '\r\n' in s[:2000] else '\n'
    s = s.replace('\r\n', '\n')
    for old, new in edits:
        assert s.count(old) == 1, (p, old[:70], 'count=%d' % s.count(old))
        s = s.replace(old, new)
    io.open(p, 'w', encoding='utf-8', newline='').write(s.replace('\n', NL))
    print('OK', p)

# ---------- 1) db.ts ----------
edits_db = []

# 1a. helper kode pembayaran + tagihan otomatis saat kontrak terbit
edits_db.append((
"""    await wt(
      'INSERT INTO `contracts` (`id`, `contract_code`, `rental_id`, `customer_id`, `contract_date`, `valid_until`, `terms_conditions`, `is_signed_customer`) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [contract.id, contract.contract_code, contract.rental_id, contract.customer_id, contract.contract_date, contract.valid_until, contract.terms_conditions],
      'createContract'
    );
    stateStore.contracts.push(contract);
    return contract;
  },""",
"""    await wt(
      'INSERT INTO `contracts` (`id`, `contract_code`, `rental_id`, `customer_id`, `contract_date`, `valid_until`, `terms_conditions`, `is_signed_customer`) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [contract.id, contract.contract_code, contract.rental_id, contract.customer_id, contract.contract_date, contract.valid_until, contract.terms_conditions],
      'createContract'
    );
    stateStore.contracts.push(contract);

    // Tagihan resmi dibuat SEKALIGUS dengan penerbitan kontrak. Tanpa ini
    // kontrak baru tidak pernah punya payment -> tab Pembayaran pelanggan
    // kosong dan alur verifikasi staf mustahil (temuan E2E siklus 61).
    const eq = stateStore.equipments.find(x => x.id === (rental as { equipment_id?: number }).equipment_id);
    const hari = Math.max(1, Math.round(
      (new Date(rental.end_date).getTime() - new Date(rental.start_date).getTime()) / 86_400_000
    ) + 1);
    const tarif = eq?.rental_price_per_day ?? 0;
    const tagihan = buatTagihanKontrak(stateStore.payments, contract, hari * tarif);
    await wt(
      'INSERT INTO `payments` (`id`, `payment_code`, `contract_id`, `customer_id`, `amount`, `payment_method`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tagihan.id, tagihan.payment_code, tagihan.contract_id, tagihan.customer_id, tagihan.amount, tagihan.payment_method, tagihan.status],
      'createContract:tagihan'
    );
    stateStore.payments.push(tagihan);
    return contract;
  },"""))

# 1b. fungsi pembuat tagihan (module-level, di depan `export const db`)
edits_db.append((
"export const db = {",
"""/** Kode + baris tagihan (UNPAID) untuk kontrak yang baru terbit. */
function buatTagihanKontrak(
  existing: ReadonlyArray<Payment>,
  contract: Contract,
  amount: number
): Payment {
  const tgl = new Date();
  const ymd = tgl.toISOString().slice(0, 10).replace(/-/g, '');
  const pref = `PAY-SBS-${ymd}-`;
  const urut = existing.filter((p) => p.payment_code.startsWith(pref)).length + 1;
  return {
    id: nextId(existing),
    payment_code: `${pref}${String(urut).padStart(3, '0')}`,
    contract_id: contract.id,
    contract_code: contract.contract_code,
    customer_id: contract.customer_id,
    customer_name: contract.customer_name,
    amount,
    payment_method: 'Belum dibayar',
    status: 'UNPAID',
    payment_date: tgl.toISOString().replace('T', ' ').slice(0, 19),
  };
}

// ponytail: tagihan tunggal per kontrak. Naikkan ke multi-invoice (DP +
// pelunasan + penalti) saat kebutuhan faktur parsial masuk backlog produk.
export const db = {"""))

# 1c. TTL revalidation pada cermin (isolate warm tidak boleh basi)
edits_db.append((
"""export async function hydrasiDariTiDB(): Promise<void> {
  if (hidrasiDimuat || !tidbClient) return;
  hidrasiDimuat = true;
  try {
    await jalankanHidrasi();
  } catch (err) {""",
"""/** Batas umur cermin per isolate (detik) — lihat komentar fungsi. */
const UMUR_CERMIN = 5;
let cerminPada = 0;

/**
 * Muat Cermin TiDB ke stateStore. Dipanggil middleware sebelum route mana pun
 * menyentuh data. Cloudflare bisa punya BANYAK isolate hidup serentak: tanpa
 * TTL, isolate warm yang tidak kena cold-start lagi melayani salinan basi
 * (temuan E2E siklus 61 — unit yang baru ditulis isolat lain tak terlihat).
 * Revalidasi maksimal tiap `UMUR_CERMIN` detik; tulis-tembus isolate ini
 * sendiri sudah mutakhir, 9 SELECT cheap < 1 RTT extra. Mode demo no-op.
 */
export async function hydrasiDariTiDB(): Promise<void> {
  if (!tidbClient) return;
  const sekarang = Date.now();
  if (hidrasiDimuat && sekarang - cerminPada < UMUR_CERMIN * 1000) return;
  try {
    await jalankanHidrasi();
    hidrasiDimuat = true;
    cerminPada = sekarang;
  } catch (err) {"""))

rw('src/lib/db.ts', edits_db)

# ---------- 2) server/index.ts : DELETE payments, contracts, rentals ----------
edits_srv = []
edits_srv.append((
"""/** Membubuhkan tanda tangan elektronik pada kontrak. */
app.post('/api/contracts/:id/sign', async (c) => {""",
"""/** Menghapus draf/entri pembayaran (Admin; berjenjang dari kontrak). */
app.delete('/api/payments/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);
  const target = (await db.getPayments()).find((x) => x.id === id);
  if (!target) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Pembayaran tidak ditemukan.' } }, 404);
  if (target.status === 'PAID') {
    return c.json({ success: false, error: { code: 'PAID_IMMUTABLE', message: 'Pembayaran lunas tidak dapat dihapus (audit keuangan).' } }, 409);
  }
  await (db as unknown as { hapusPayment: (id: number) => Promise<Payment | undefined> }).hapusPayment(id);
  auditLog({ ...auditActor(c), action: 'PAYMENT_DELETE', entity: 'payment', entity_id: id, detail: `Tagihan ${target.payment_code} dihapus` });
  return c.json({ success: true });
});

/** Membubuhkan tanda tangan elektronik pada kontrak. */
app.post('/api/contracts/:id/sign', async (c) => {"""))

rw('src/server/index.ts', edits_srv)

# ---------- 3) db.ts : mutator hapus pembayaran + kontrak + sewa ----------
edits_db2 = [
("""  // Payments
  getPayments: async () => stateStore.payments,""",
"""  // Payments
  getPayments: async () => stateStore.payments,

  /** Hapus tagihan (UNPAID/FAILED/PENDING) beserta jejaknya. */
  hapusPayment: async (paymentId: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Payment>('DELETE', `/api/payments/${paymentId}`);
    }
    const idx = stateStore.payments.findIndex(x => x.id === paymentId);
    if (idx === -1) return undefined;
    await wt('DELETE FROM `payments` WHERE `id` = ?', [paymentId], 'hapusPayment');
    const [hapus] = stateStore.payments.splice(idx, 1);
    return hapus;
  },

  /** Hapus kontrak (belum lunas ditangani; dipanggil berurutan dgn tagihannya). */
  hapusKontrak: async (contractId: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Contract>('DELETE', `/api/contracts/${contractId}`);
    }
    const idx = stateStore.contracts.findIndex(x => x.id === contractId);
    if (idx === -1) return undefined;
    await wt('DELETE FROM `contracts` WHERE `id` = ?', [contractId], 'hapusKontrak');
    const [hapus] = stateStore.contracts.splice(idx, 1);
    return hapus;
  },

  /** Hapus pengajuan sewa (PENDING/Ditolak saja — dijaga rute). */
  hapusRental: async (rentalId: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Rental>('DELETE', `/api/rentals/${rentalId}`);
    }
    const idx = stateStore.rentals.findIndex(x => x.id === rentalId);
    if (idx === -1) return undefined;
    await wt('DELETE FROM `rentals` WHERE `id` = ?', [rentalId], 'hapusRental');
    const [hapus] = stateStore.rentals.splice(idx, 1);
    return hapus;
  },"""),
]
rw('src/lib/db.ts', edits_db2)

# ---------- 4) server : rute kontrak & rentals DELETE (guard berjenjang) ----------
edits_srv2 = [
("""/** Menghapus draf/entri pembayaran (Admin; berjenjang dari kontrak). */""",
"""/** Hapus kontrak — hanya bila tagihannya sudah tiada / belum lunas. */
app.delete('/api/contracts/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);
  const target = (await db.getContracts()).find((x) => x.id === id);
  if (!target) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Kontrak tidak ditemukan.' } }, 404);
  const bayar = (await db.getPayments()).filter((p) => p.contract_id === id);
  if (bayar.some((p) => p.status === 'PAID')) {
    return c.json({ success: false, error: { code: 'CONTRACT_HAS_PAID', message: 'Kontrak dengan pembayaran lunas tidak dapat dihapus.' } }, 409);
  }
  await (db as unknown as { hapusKontrak: (id: number) => Promise<Contract | undefined> }).hapusKontrak(id);
  auditLog({ ...auditActor(c), action: 'CONTRACT_DELETE', entity: 'contract', entity_id: id, detail: `Kontrak ${target.contract_code} dihapus` });
  return c.json({ success: true });
});

/** Hapus pengajuan sewa — hanya PENDING/REJECTED; blokir bila ada kontrak aktif. */
app.delete('/api/rentals/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);
  const target = (await db.getRentals()).find((x) => x.id === id);
  if (!target) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Transaksi sewa tidak ditemukan.' } }, 404);
  if (!['PENDING', 'REJECTED'].includes(target.status)) {
    return c.json({ success: false, error: { code: 'RENTAL_ACTIVE', message: 'Sewa berjalan/selesai tidak dapat dihapus — gunakan penolakan/pengembalian.' } }, 409);
  }
  if ((await db.getContracts()).some((x) => x.rental_id === id)) {
    return c.json({ success: false, error: { code: 'RENTAL_HAS_CONTRACT', message: 'Hapus kontrak terkait terlebih dahulu.' } }, 409);
  }
  await (db as unknown as { hapusRental: (id: number) => Promise<Rental | undefined> }).hapusRental(id);
  auditLog({ ...auditActor(c), action: 'RENTAL_DELETE', entity: 'rental', entity_id: id, detail: `Pengajuan ${target.rental_code} dihapus` });
  return c.json({ success: true });
});

/** Menghapus draf/entri pembayaran (Admin; berjenjang dari kontrak). */"""),
]
rw('src/server/index.ts', edits_srv2)

print('== patch 61 selesai ==')
