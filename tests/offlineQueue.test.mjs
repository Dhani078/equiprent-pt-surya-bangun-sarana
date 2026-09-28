/**
 * Uji antrean mutasi offline (siklus 70) — src/lib/offlineQueue.ts + flush.
 *
 * Lapisan:
 *   1. Unit murni antrean: FIFO, batas kapasitas, buang indeks, langganan.
 *   2. Integrasi jembatan db.ts: mutasi saat fetch gagal jaringan -> masuk
 *      antrean; flush saat pulih -> terkirim FIFO; tolakan server -> dibuang
 *      dengan pesan; jaringan belum pulih -> antrean utuh.
 */

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

// ---------------------------------------------------------------------------
// 1) Unit murni offlineQueue (fallback memori saat localStorage tak ada)
// ---------------------------------------------------------------------------
const q = await import('../.tmp_offlineQueue.mjs');

q.bersihkanAntrean();
t('antrean awal kosong', q.jumlahAntrean() === 0);

t('tambah masuk ekor', q.tambahAntrean({ method: 'POST', path: '/api/a', body: { i: 1 }, dibuatAt: 1 }) === true);
q.tambahAntrean({ method: 'PUT', path: '/api/b', body: { i: 2 }, dibuatAt: 2 });
const isi = q.bacaAntrean();
t('FIFO: urutan tetap a lalu b', isi.length === 2 && isi[0].path === '/api/a' && isi[1].path === '/api/b');

let dipanggil = 0;
const lepas = q.berlanggananAntrean(() => { dipanggil++; });
q.tambahAntrean({ method: 'DELETE', path: '/api/c', dibuatAt: 3 });
t('pelanggan diberi tahu saat berubah', dipanggil === 1);
lepas();
q.tambahAntrean({ method: 'DELETE', path: '/api/d', dibuatAt: 4 });
t('pelanggan tak diberi tahu setelah lepas', dipanggil === 1);

q.bersihkanAntrean();
for (let i = 0; i < 100; i++) q.tambahAntrean({ method: 'POST', path: '/x' + i, dibuatAt: i });
t('antrean penuh di 100', q.jumlahAntrean() === 100);
t('item ke-101 ditolak (false)', q.tambahAntrean({ method: 'POST', path: '/x101', dibuatAt: 101 }) === false);
q.buangAntreanKe(0);
t('buang indeks 0 menggeser kepala', q.bacaAntrean()[0].path === '/x1');
q.buangAntreanKe(999);
t('buang indeks di luar rentang diam saja', q.jumlahAntrean() === 99);
q.bersihkanAntrean();

// ---------------------------------------------------------------------------
// 2) Integrasi db.ts: tulisGagalJaringan -> antre; flush -> terkirim FIFO
// ---------------------------------------------------------------------------
class LocalStoragePalsu {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
const ls = new LocalStoragePalsu();
globalThis.window = {};
globalThis.localStorage = ls;
globalThis.sessionStorage = ls;

/** Mode fetch yang dikendalikan test. */
let mode = 'jaringan';
const permintaan = [];
globalThis.fetch = async (url, opts = {}) => {
  permintaan.push({ url: String(url), method: opts.method || 'GET', body: opts.body });
  if (mode === 'jaringan') throw new TypeError('Failed to fetch');
  if (mode === 'tolak') {
    return { ok: false, status: 409, json: async () => ({ error: { message: 'Kode unit sudah terdaftar.' } }) };
  }
  // mode 'sukses': jawab endpoint koleksi & mutasi
  const p = String(url);
  if (p.includes('/api/equipments') && (opts.method || 'GET') === 'POST') {
    return { ok: true, status: 201, json: async () => ({ success: true, item: { id: 99, equipment_code: 'OFFQ-T', name: 'UJI' } }) };
  }
  return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) };
};

const dbMod = await import('../.tmp_db.mjs');

// 2a. mutasi saat jaringan putus -> melempar pesan antre + masuk localStorage
let pesanGalat = '';
try {
  await dbMod.db.addEquipment({ equipment_code: 'OFFQ-T', name: 'UJI', type: 'Excavator', model: 'X', brand: 'Y', hour_meter: 1, rental_price_per_day: 1, status: 'AVAILABLE', last_maintenance_date: '2026-01-01' });
} catch (e) {
  pesanGalat = String(e.message);
}
const antreanRaw = JSON.parse(ls.getItem('sbs_mutasi_antrean') || '[]');
t('jaringan putus -> pesan antre ke pemanggil', /antrean.*pulih/i.test(pesanGalat));
t('mutasi masuk antrean (1 POST)', antreanRaw.length === 1 && antreanRaw[0].method === 'POST' && antreanRaw[0].path === '/api/equipments');

// 2b. flush saat masih putus -> antrean utuh, tidak mengirim
mode = 'jaringan';
permintaan.length = 0;
let hasilFlush = await dbMod.flushAntreanOffline();
t('flush saat masih putus -> 0 terkirim', hasilFlush.terkirim === 0);
t('antrean tetap utuh (1 item)', JSON.parse(ls.getItem('sbs_mutasi_antrean')).length === 1);

// 2c. pulih -> flush FIFO terkirim, antrean kosong
mode = 'sukses';
permintaan.length = 0;
hasilFlush = await dbMod.flushAntreanOffline();
t('flush saat pulih -> 1 terkirim', hasilFlush.terkirim === 1 && hasilFlush.ditolak.length === 0);
t('antrean kosong setelah flush', JSON.parse(ls.getItem('sbs_mutasi_antrean')).length === 0);
const kirim = permintaan.find((r) => r.method === 'POST' && r.url.includes('/api/equipments'));
t('payload asli dikirim ulang utuh', kirim && JSON.parse(kirim.body).equipment_code === 'OFFQ-T');

// 2d. dua mutasi berurutan -> urutanflush FIFO (PUT setelah POST)
mode = 'jaringan';
const tambahLagi = await (async () => {
  const out = [];
  for (const [method, path] of [['POST', '/api/rentals'], ['PUT', '/api/rentals/7/status']]) {
    try {
      if (method === 'POST') await dbMod.db.addRental({ rental_code: 'RNT-Q', customer_id: 2, equipment_id: 3, start_date: '2026-09-01', end_date: '2026-09-05', total_days: 4, subtotal: 1, status: 'PENDING' });
      else await dbMod.db.updateRentalStatus(7, 'APPROVED');
    } catch { out.push(method); }
  }
  return out;
})();
t('dua mutasi putus -> dua antre', tambahLagi.length === 2 && JSON.parse(ls.getItem('sbs_mutasi_antrean')).length === 2);
mode = 'sukses';
permintaan.length = 0;
hasilFlush = await dbMod.flushAntreanOffline();
const urutanMutasi = permintaan.filter((r) => r.method !== 'GET').map((r) => r.method + ' ' + r.url);
t('flush menjaga urutan FIFO', hasilFlush.terkirim === 2 && urutanMutasi[0].startsWith('POST') && urutanMutasi[1].startsWith('PUT'));

// 2e. tolakan definitif server -> dibuang + dilaporkan
mode = 'jaringan';
try { await dbMod.db.addEquipment({ equipment_code: 'OFFQ-X', name: 'Ganda', type: 'Excavator', model: 'X', brand: 'Y', hour_meter: 1, rental_price_per_day: 1, status: 'AVAILABLE', last_maintenance_date: '2026-01-01' }); } catch { /* antre */ }
t('item tertolak-awal masuk antrean (1)', JSON.parse(ls.getItem('sbs_mutasi_antrean')).length === 1);
mode = 'tolak';
hasilFlush = await dbMod.flushAntreanOffline();
t('server menolak -> dibuang dari antrean', hasilFlush.terkirim === 0 && hasilFlush.ditolak.length === 1 && JSON.parse(ls.getItem('sbs_mutasi_antrean')).length === 0);
t('pesan tolakan diteruskan', /sudah terdaftar/i.test(hasilFlush.ditolak[0]));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
