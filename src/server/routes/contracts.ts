/**
 * Rute API domain contracts.
 *
 * Dipisah dari `server/index.ts` supaya berkas rute tetap ringkas dan
 * terbaca sebagai daftar endpoint; kerangka aplikasi (CORS, auth, error
 * handler, fallback aset) tetap tinggal di `index.ts`.
 */
import type { Hono } from 'hono';
import {
  BAD_ID,
  BAD_JSON,
  NOT_FOUND_CONTRACT,
  auditActor,
  auditLog,
  badValidation,
  buildContractPreview,
  cariRental,
  db,
  isContractActive,
  isContractSigned,
  parseId,
  readJsonBody,
  renderContractHtml,
  validateContractRenewal,
  validateContractSignature,
} from '../context';
import type {
  Contract,
  Payment,
  Rental,
  RoleName,
} from '../context';
import type { AppEnv } from '../http';

export function daftarContracts(app: Hono<AppEnv>): void {
// Contracts API — Kontrak Digital & Tanda Tangan Elektronik
// ---------------------------------------------------------------------------

/**
 * Kontrak yang sudah diperkaya data terkaitnya.
 *
 * Pratinjau dibentuk di server agar kode, nama penandatangan, dan waktu
 * yang tampil di dokumen tidak bisa menyimpang dari data tersimpan.
 *
 * PERBAIKAN KEAMANAN (IDOR): pelanggan hanya menerima kontrak miliknya.
 */
app.get('/api/contracts', async (c) => {
  const items = await db.getContracts();

  const terlihat =
    c.get('role') === 'CUSTOMER'
      ? items.filter((kontrak) => kontrak.customer_id === c.get('userId'))
      : items;

  const payload = terlihat.map((kontrak) => ({
    ...kontrak,
    preview: buildContractPreview({ contract: kontrak }),
  }));

  return c.json({ success: true, data: payload, meta: { total: payload.length } });
});

/** Pratinjau satu kontrak (kode, para pihak, syarat, tanda tangan). */
app.get('/api/contracts/:id/preview', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  const items = await db.getContracts();
  const kontrak = items.find((x) => x.id === id);
  if (!kontrak) return c.json(NOT_FOUND_CONTRACT, 404);

  // Dokumen kontrak memuat identitas & nilai transaksi pihak lain.
  // Pelanggan hanya boleh melihat kontraknya sendiri; dijawab 404 agar
  // keberadaan kontrak milik orang lain tidak bisa ditebak dari kode status.
  if (c.get('role') === 'CUSTOMER' && kontrak.customer_id !== c.get('userId')) {
    return c.json(NOT_FOUND_CONTRACT, 404);
  }

  const preview = buildContractPreview({
    contract: kontrak,
    rental: await cariRental(kontrak.rental_id),
  });

  return c.json({
    success: true,
    data: {
      ...preview,
      // Berkas HTML disusun di server agar hasil cetak identik dengan
      // pratinjau di layar — bukan dua implementasi yang perlahan beda.
      html: renderContractHtml(preview),
    },
  });
});

/**
 * Menentukan apakah pengguna boleh menandatangani kontrak ini.
 *
 * Pelanggan hanya boleh menandatangani kontrak MILIKNYA — tanpa pemeriksaan
 * ini, pelanggan dapat membubuhkan tanda tangan (dan karena itu mengesahkan
 * kewajiban finansial) atas kontrak pelanggan lain hanya dengan menebak ID.
 * Admin & Staf Operasional bertindak atas nama perusahaan, jadi diizinkan.
 */
async function maySignContract(
  kontrak: Pick<Contract, 'customer_id'>,
  role: RoleName,
  userId: number
): Promise<boolean> {
  if (role === 'ADMIN' || role === 'STAFF') return true;
  return kontrak.customer_id === userId;
}

/** Menerbitkan kontrak baru untuk sebuah transaksi sewa. */
app.post('/api/contracts', async (c) => {
  // Penerbitan kontrak adalah wewenang perusahaan: pelanggan tidak boleh
  // membuat dokumen kontrak sendiri.
  if (c.get('role') === 'CUSTOMER') {
    return c.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Penerbitan kontrak dilakukan oleh Admin atau Staf Operasional.',
        },
      },
      403
    );
  }

  const body = await readJsonBody<{ rentalId?: unknown }>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  const rentalIdRaw = typeof body.rentalId === 'string' ? body.rentalId : String(body.rentalId ?? '');
  const rentalId = parseId(rentalIdRaw);
  if (rentalId === null) {
    return c.json(
      { success: false, error: { code: 'INVALID_ID', message: 'ID transaksi sewa tidak valid.' } },
      400
    );
  }

  try {
    const kontrak = await db.createContract(rentalId);
    if (!kontrak) {
      return c.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transaksi sewa tidak ditemukan.' } },
        404
      );
    }

    // Audit trail: penerbitan dokumen kontrak oleh Admin/Staf.
    auditLog({
      ...auditActor(c),
      action: 'CONTRACT_CREATE',
      entity: 'contract',
      entity_id: kontrak.id,
      detail: `Kontrak ${kontrak.contract_code} diterbitkan untuk ${kontrak.rental_code}`,
    });

    return c.json({ success: true, item: kontrak }, 201);
  } catch (err) {
    // Satu kontrak per transaksi — mencegah duplikasi nomor kontrak.
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'KONTRAK_SUDAH_ADA') {
      return c.json(
        {
          success: false,
          error: {
            code: msg,
            message: 'Transaksi sewa ini sudah memiliki kontrak. Tidak dapat menerbitkan kontrak ganda.',
          },
        },
        409
      );
    }
    throw err;
  }
});

/** Hapus kontrak — hanya bila tagihannya sudah tiada / belum lunas. */
app.delete('/api/contracts/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (c.get('role') === 'CUSTOMER') {
    return c.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Penghapusan data dilakukan oleh Admin atau Staf Operasional.' } },
      403
    );
  }
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
  if (c.get('role') === 'CUSTOMER') {
    return c.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Penghapusan data dilakukan oleh Admin atau Staf Operasional.' } },
      403
    );
  }
  if (id === null) return c.json(BAD_ID, 400);
  const target = (await db.getRentals()).find((x) => x.id === id);
  if (!target) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Transaksi sewa tidak ditemukan.' } }, 404);
  if ((await db.getContracts()).some((x) => x.rental_id === id)) {
    return c.json({ success: false, error: { code: 'RENTAL_HAS_CONTRACT', message: 'Hapus kontrak terkait terlebih dahulu.' } }, 409);
  }
  // CONFIRMED tanpa kontrak = rumah-rapikan Admin (mis. pembatalan data uji);
  // role lain tetap dibatasi PENDING/REJECTED.
  if (!['PENDING', 'REJECTED'].includes(target.status) && c.get('role') !== 'ADMIN') {
    return c.json({ success: false, error: { code: 'RENTAL_ACTIVE', message: 'Sewa berjalan hanya dapat dihapus oleh Admin (tanpa kontrak terkait).' } }, 409);
  }
  await (db as unknown as { hapusRental: (id: number) => Promise<Rental | undefined> }).hapusRental(id);
  auditLog({ ...auditActor(c), action: 'RENTAL_DELETE', entity: 'rental', entity_id: id, detail: `Pengajuan ${target.rental_code} dihapus` });
  return c.json({ success: true });
});

/** Menghapus draf/entri pembayaran (Admin; berjenjang dari kontrak). */
app.delete('/api/payments/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (c.get('role') === 'CUSTOMER') {
    return c.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Penghapusan data dilakukan oleh Admin atau Staf Operasional.' } },
      403
    );
  }
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
app.post('/api/contracts/:id/sign', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  const body = await readJsonBody<{ signerName?: unknown; signature?: unknown }>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  // Validasi terpusat — pesan galat identik dengan yang tampil di form klien.
  const hasil = validateContractSignature(body);
  if (!hasil.ok) return c.json(badValidation(hasil.errors), 400);

  // Otorisasi kepemilikan: pelanggan hanya boleh menandatangani kontraknya
  // sendiri. Dicek SETELAH validasi agar penyerang tidak bisa membedakan
  // "kontrak orang lain" dari "kontrak tidak ada" lewat kode status.
  const daftar = await db.getContracts();
  const kontrak = daftar.find((x) => x.id === id);
  if (!kontrak) return c.json(NOT_FOUND_CONTRACT, 404);

  const role = c.get('role');
  const userId = c.get('userId');

  // Daur-hidup: kontrak yang melewati batas berlaku tidak sah untuk
  // ditandatangani — dokumen harus diterbitkan ulang dengan tanggal baru.
  // Kontrakyang SUDAH sah dilewati di sini agar pesannya tetap akurat
  // ("sudah ditandatangani"), bukan terbaca seolah tanda tangannya gugur.
  if (!isContractSigned(kontrak) && !isContractActive(kontrak)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'CONTRACT_EXPIRED',
          message: `Kontrak ini kedaluwarsa per ${kontrak.valid_until}. Hubungi staf untuk penerbitan ulang.`,
        },
      },
      409
    );
  }

  if ((await maySignContract(kontrak, role, userId)) !== true) {
    return c.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Anda hanya dapat menandatangani kontrak atas nama akun Anda sendiri.',
        },
      },
      403
    );
  }

  try {
    const updated = await db.signContract(id, hasil.value.signerName, hasil.value.signature);
    if (!updated) return c.json(NOT_FOUND_CONTRACT, 404);

    // Audit trail: tanda tangan elektronik — bukti persetujuan pelanggan.
    auditLog({
      ...auditActor(c),
      action: 'CONTRACT_SIGN',
      entity: 'contract',
      entity_id: id,
      detail: `Kontrak #${id} ditandatangani oleh ${hasil.value.signerName}`,
    });

    return c.json({
      success: true,
      item: updated,
      meta: {
        signedAt: updated.signed_at ?? null,
        signerName: updated.signer_name ?? null,
        hasSignature: typeof updated.signature_data_url === 'string' && updated.signature_data_url !== '',
      },
    });
  } catch (err) {
    // Kontrak sudah ditandatangani sebelumnya → jangan timpa bukti waktu.
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'KONTRAK_SUDAH_DITANDATANGANI') {
      return c.json(
        { success: false, error: { code: msg, message: 'Kontrak ini sudah ditandatangani sebelumnya.' } },
        409
      );
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
/**
 * Perpanjang masa berlaku kontrak (khusus kontrak yang sudah kedaluwarsa).
 *
 * Dijalankan Admin/Staf: pelanggan tidak boleh mengubah tanggal dokumen.
 */
app.post('/api/contracts/:id/renew', async (c) => {
  if (c.get('role') === 'CUSTOMER') {
    return c.json(
      {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Perpanjangan kontrak dilakukan oleh Admin atau Staf Operasional.' },
      },
      403
    );
  }

  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  const body = await readJsonBody<{ validUntil?: unknown; reason?: unknown }>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  const hasil = validateContractRenewal(body);
  if (!hasil.ok) return c.json(badValidation(hasil.errors), 400);

  const kontrak = (await db.getContracts()).find((x) => x.id === id);
  if (!kontrak) return c.json(NOT_FOUND_CONTRACT, 404);

  // Hanya kontrak yang benar-benar kedaluwarsa (dan belum ditandatangani)
  // yang boleh diperpanjang — mencegah tanggal sah ditelan tanpa jejak.
  if (isContractSigned(kontrak)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'KONTRAK_SUDAH_DITANDATANGANI',
          message: 'Kontrak yang sudah ditandatangani tidak dapat diperpanjang; terbitkan dokumen baru.',
        },
      },
      409
    );
  }

  if (isContractActive(kontrak)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'KONTRAK_MASIH_BERLAKU',
          message: `Kontrak masih berlaku sampai ${kontrak.valid_until}. Perpanjangan hanya untuk kontrak kedaluwarsa.`,
        },
      },
      409
    );
  }

  const sebelumnya = kontrak.valid_until;
  const updated = await (db as unknown as {
    perpanjangKontrak: (contractId: number, validUntil: string) => Promise<typeof kontrak | undefined>;
  }).perpanjangKontrak(id, hasil.value.validUntil);

  if (!updated) return c.json(NOT_FOUND_CONTRACT, 404);

  auditLog({
    ...auditActor(c),
    action: 'CONTRACT_RENEW',
    entity: 'contract',
    entity_id: id,
    detail: `Kontrak ${updated.contract_code} diperpanjang dari ${sebelumnya} menjadi ${hasil.value.validUntil}`,
  });

  return c.json({
    success: true,
    item: updated,
    meta: { previousValidUntil: sebelumnya, reason: hasil.value.reason || null },
  });
});

}
