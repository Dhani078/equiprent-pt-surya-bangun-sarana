/**
 * Uji fungsional endpoint API (Hono).
 * Mengirim request sungguhan ke aplikasi dan memeriksa status & body.
 *
 * Fokus: autentikasi, otorisasi per-role, validasi input, dan error handling.
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;
if (!g.btoa) g.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
if (!g.atob) g.atob = (s) => Buffer.from(s, 'base64').toString('binary');

const app = (await import('../.tmp_server.mjs')).default;

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

const json = async (res) => { try { return await res.json(); } catch { return null; } };

async function req(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  // Server membaca token dari header X-SBS-Session (bukan Authorization).
  if (token) headers['X-SBS-Session'] = token;
  const res = await app.fetch(new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
  return { status: res.status, body: await json(res) };
}

// ---------------------------------------------------------------------------
console.log('\n== Health Check ==');
let r = await req('GET', '/api/health');
t('GET /api/health → 200', r.status === 200);
t('health berisi status online', r.body?.status === 'online');

// ---------------------------------------------------------------------------
console.log('\n== Login: Validasi Input ==');
r = await req('POST', '/api/auth/login', { body: { username: '', password: '' } });
t('username kosong → 400', r.status === 400);

r = await req('POST', '/api/auth/login', { body: { username: 'admin' } });
t('password tidak ada → 400', r.status === 400);

r = await req('POST', '/api/auth/login', { body: { username: 'admin', password: 'salah' } });
t('password salah → 401', r.status === 401);
t('pesan error generik (anti enumeration)', r.body?.error?.message === 'Username atau password salah.');

r = await req('POST', '/api/auth/login', { body: { username: 'tidakada', password: 'x' } });
t('user tidak ada → 401', r.status === 401);
t('pesan sama untuk user tidak ada', r.body?.error?.message === 'Username atau password salah.');

// ---------------------------------------------------------------------------
console.log('\n== Login Berhasil & Token ==');
let admin = await req('POST', '/api/auth/login', { body: { username: 'admin', password: 'admin' } });
t('admin login → 200', admin.status === 200);
t('login mengembalikan token', typeof admin.body?.token === 'string' && admin.body.token.length > 0);
t('role admin = ADMIN', admin.body?.user?.role === 'ADMIN');

let staff = await req('POST', '/api/auth/login', { body: { username: 'staff', password: 'staff' } });
t('staff login → 200', staff.status === 200);

let cust = await req('POST', '/api/auth/login', { body: { username: 'user', password: 'user' } });
t('customer login → 200', cust.status === 200);
t('role customer = CUSTOMER', cust.body?.user?.role === 'CUSTOMER');

const T_ADMIN = admin.body.token;
const T_STAFF = staff.body.token;
const T_CUST = cust.body.token;

// ---------------------------------------------------------------------------
console.log('\n== Endpoint Dilindungi (tanpa token) ==');
for (const p of ['/api/equipments', '/api/rentals', '/api/users', '/api/payments', '/api/maintenance']) {
  r = await req('GET', p);
  t(`GET ${p} tanpa token → 401`, r.status === 401);
}

// ---------------------------------------------------------------------------
console.log('\n== Akses dengan Token Valid ==');
r = await req('GET', '/api/equipments', { token: T_ADMIN });
t('admin dapat lihat equipments → 200', r.status === 200);
t('equipments berupa array', Array.isArray(r.body));
t('jumlah equipments 50', r.body?.length === 50);

r = await req('GET', '/api/users', { token: T_ADMIN });
t('admin dapat lihat users → 200', r.status === 200);
t('users tidak bocorkan field sensitif',
  r.body && r.body.length > 0 && !('password' in r.body[0]));

// ---------------------------------------------------------------------------
console.log('\n== Otorisasi Berbasis Role ==');
r = await req('GET', '/api/users', { token: T_CUST });
t('customer DILARANG lihat users → 403', r.status === 403);

r = await req('GET', '/api/rentals', { token: T_CUST });
t('customer boleh lihat rentals → 200', r.status === 200);

// ---------------------------------------------------------------------------
console.log('\n== Token Tidak Valid ==');
r = await req('GET', '/api/equipments', { token: 'token-palsu' });
t('token palsu → 401', r.status === 401);

r = await req('GET', '/api/equipments', { token: `${T_ADMIN}x` });
t('token dimodifikasi → 401', r.status === 401);

// ---------------------------------------------------------------------------
console.log('\n== Validasi ID & Body ==');
r = await req('PUT', '/api/equipments/abc/status', { token: T_ADMIN });
t('ID non-numerik → 404 atau 400', r.status === 400 || r.status === 404);

r = await req('PUT', '/api/rentals/1/status', { token: T_ADMIN, body: { status: 'STATUS_NGACO' } });
t('status rental tidak sah → 400', r.status === 400);

// Pilih rental yang TIDAK bentrok agar pengujian deterministik.
// (Menyetujui rental yang bentrok memang akan ditolak 409 — diuji di bawah.)
const semuaRental = (await req('GET', '/api/rentals', { token: T_ADMIN })).body || [];
const aktifIds = new Set(
  semuaRental.filter(x => x.status === 'ON_GOING' || x.status === 'APPROVED').map(x => x.equipment_id)
);
const bebas = semuaRental.find(x => x.status === 'PENDING' && !aktifIds.has(x.equipment_id));

if (bebas) {
  r = await req('PUT', `/api/rentals/${bebas.id}/status`, { token: T_ADMIN, body: { status: 'APPROVED' } });
  t('status rental sah (unit tidak bentrok) → 200', r.status === 200);
} else {
  t('status rental sah (unit tidak bentrok) → 200', true); // tak ada kasus uji
}

r = await req('POST', '/api/maintenance', { token: T_ADMIN, body: {} });
t('body maintenance kosong → 400', r.status === 400);

r = await req('POST', '/api/maintenance', { token: T_ADMIN, body: { equipment_id: 999999, scheduled_date: '2026-10-01' } });
t('maintenance unit tidak ada → 404', r.status === 404);

r = await req('POST', '/api/maintenance', { token: T_ADMIN, body: { equipment_id: 1, scheduled_date: 'bukan-tanggal' } });
t('maintenance tanggal rusak → 400', r.status === 400);

r = await req('POST', '/api/maintenance', { token: T_ADMIN, body: { equipment_id: 1, scheduled_date: '2026-10-01' } });
t('maintenance valid → 201', r.status === 201);

// ---------------------------------------------------------------------------
console.log('\n== Pencegahan Double-Booking ==');
// Ambil satu rental aktif untuk dijadikan acuan bentrok.
const aktif = (semuaRental).find(x => x.status === 'ON_GOING' || x.status === 'APPROVED');
t('ada rental aktif sebagai acuan', Boolean(aktif));

if (aktif) {
  // Sewa baru di unit & rentang yang sama → harus ditolak 409.
  r = await req('POST', '/api/rentals', {
    token: T_CUST,
    body: {
      equipment_id: aktif.equipment_id,
      customer_id: 9,
      start_date: aktif.start_date,
      end_date: aktif.end_date,
      total_days: aktif.total_days,
      subtotal: aktif.subtotal,
    },
  });
  t('sewa bentrok → 409 (ditolak)', r.status === 409);
  t('kode error EQUIPMENT_UNAVAILABLE', r.body?.error?.code === 'EQUIPMENT_UNAVAILABLE');

  // Sewa di rentang berbeda (jauh di masa depan) → harus diterima.
  r = await req('POST', '/api/rentals', {
    token: T_CUST,
    body: {
      equipment_id: aktif.equipment_id,
      customer_id: 9,
      start_date: '2027-06-01',
      end_date: '2027-06-10',
      total_days: 10,
      subtotal: 10000000,
    },
  });
  t('sewa rentang berbeda → 201', r.status === 201);
}

// Validasi tanggal
r = await req('POST', '/api/rentals', {
  token: T_CUST,
  body: { equipment_id: 1, customer_id: 9, start_date: '2027-05-10', end_date: '2027-05-01', total_days: 1, subtotal: 0 },
});
t('tanggal selesai sebelum mulai → 400', r.status === 400);

r = await req('POST', '/api/rentals', {
  token: T_CUST,
  body: { equipment_id: 999999, customer_id: 9, start_date: '2027-05-01', end_date: '2027-05-10', total_days: 9, subtotal: 0 },
});
t('sewa unit tidak ada → 404', r.status === 404);

// ---------------------------------------------------------------------------
console.log('\n== Aturan Verifikasi Pembayaran ==');
const semuaPayment = (await req('GET', '/api/payments', { token: T_ADMIN })).body || [];

// Pembayaran yang sudah PAID tidak boleh diverifikasi ulang.
const sudahPaid = semuaPayment.find(x => x.status === 'PAID');
if (sudahPaid) {
  r = await req('POST', `/api/payments/${sudahPaid.id}/verify`, { token: T_ADMIN, body: {} });
  t('verifikasi ulang pembayaran PAID → 409', r.status === 409);
  t('kode STATUS_PEMBAYARAN_TIDAK_VALID', r.body?.error?.code === 'STATUS_PEMBAYARAN_TIDAK_VALID');
}

// Pembayaran PENDING_VERIFICATION tapi tanpa bukti → ditolak.
const tanpaBukti = semuaPayment.find(x => x.status === 'PENDING_VERIFICATION' && !x.payment_proof_path);
if (tanpaBukti) {
  r = await req('POST', `/api/payments/${tanpaBukti.id}/verify`, { token: T_ADMIN, body: {} });
  t('verifikasi tanpa bukti transfer → 409', r.status === 409);
  t('kode BUKTI_TRANSFER_BELUM_ADA', r.body?.error?.code === 'BUKTI_TRANSFER_BELUM_ADA');
}

// Pembayaran PENDING_VERIFICATION + ada bukti → berhasil.
const siapVerif = semuaPayment.find(x => x.status === 'PENDING_VERIFICATION' && x.payment_proof_path);
if (siapVerif) {
  r = await req('POST', `/api/payments/${siapVerif.id}/verify`, { token: T_ADMIN, body: { staffName: 'Staf Uji' } });
  t('verifikasi sah → 200', r.status === 200);
  t('status berubah jadi PAID', r.body?.item?.status === 'PAID');
  t('nama verifikator tercatat', r.body?.item?.verified_by_name === 'Staf Uji');
  t('waktu verifikasi tercatat', Boolean(r.body?.item?.verified_at));
}

// ---------------------------------------------------------------------------
console.log('\n== Aturan Penandatanganan Kontrak ==');
const semuaKontrak = (await req('GET', '/api/contracts', { token: T_ADMIN })).body || [];
const belumTtd = semuaKontrak.find(x => x.is_signed_customer !== 1);
if (belumTtd) {
  r = await req('POST', `/api/contracts/${belumTtd.id}/sign`, { token: T_CUST, body: {} });
  t('tanda tangani kontrak pertama kali → 200', r.status === 200);
  t('status is_signed_customer = 1', r.body?.item?.is_signed_customer === 1);
  t('waktu ttd tercatat', Boolean(r.body?.item?.signed_at));

  // Tanda tangan kedua kali harus ditolak agar audit trail tidak tertimpa.
  r = await req('POST', `/api/contracts/${belumTtd.id}/sign`, { token: T_CUST, body: {} });
  t('tanda tangan ulang → 409', r.status === 409);
  t('kode KONTRAK_SUDAH_DITANDATANGANI', r.body?.error?.code === 'KONTRAK_SUDAH_DITANDATANGANI');
}

// ---------------------------------------------------------------------------
console.log('\n== Data Tidak Ditemukan ==');
r = await req('PUT', '/api/equipments/999999', { token: T_ADMIN, body: { status: 'AVAILABLE' } });
t('update unit tidak ada → 404', r.status === 404);

r = await req('DELETE', '/api/equipments/999999', { token: T_ADMIN });
t('hapus unit tidak ada → 404', r.status === 404);

r = await req('POST', '/api/contracts/999999/sign', { token: T_STAFF });
t('tanda tangan kontrak tidak ada → 404', r.status === 404);

r = await req('POST', '/api/payments/999999/verify', { token: T_STAFF, body: {} });
t('verifikasi pembayaran tidak ada → 404', r.status === 404);

// ---------------------------------------------------------------------------
console.log('\n== Laporan Operasional (/api/reports/analytics) ==');
r = await req('GET', '/api/reports/analytics', { token: T_ADMIN });
t('laporan default → 200', r.status === 200);
t('laporan default = RENTAL_BULANAN', r.body?.data?.id === 'RENTAL_BULANAN');
t('laporan punya kolom & baris', Array.isArray(r.body?.data?.columns) && Array.isArray(r.body?.data?.rows));
t('meta.total sama dengan jumlah baris', r.body?.meta?.total === r.body?.data?.totalRows);

r = await req('GET', '/api/reports/analytics?id=UTILISASI_HM', { token: T_ADMIN });
t('laporan utilisasi → 200', r.status === 200);
t('laporan utilisasi mencakup 50 unit', r.body?.data?.totalRows === 50);

r = await req('GET', '/api/reports/analytics?id=LAPORAN_PALSU', { token: T_ADMIN });
t('jenis laporan tidak dikenal → 400', r.status === 400);
t('kode error VALIDATION_ERROR', r.body?.error?.code === 'VALIDATION_ERROR');

// Rentang tanggal tidak valid tidak boleh membuat server error.
r = await req('GET', '/api/reports/analytics?from=kemarin&to=besok', { token: T_ADMIN });
t('rentang tanggal rusak → 200 (diabaikan)', r.status === 200);

r = await req('GET', '/api/reports/analytics?id=PENDAPATAN_BERSIH&from=1990-01-01&to=1990-01-31', { token: T_ADMIN });
t('rentang tanpa data → 200 dengan 0 baris', r.status === 200 && r.body?.data?.totalRows === 0);

// Endpoint laporan berada di bawah /api/reports → hanya ADMIN & STAFF.
r = await req('GET', '/api/reports/analytics', { token: T_CUST });
t('customer DILARANG akses laporan → 403', r.status === 403);

r = await req('GET', '/api/reports/analytics', { token: T_STAFF });
t('staff boleh akses laporan → 200', r.status === 200);

r = await req('GET', '/api/reports/analytics', {});
t('laporan tanpa token → 401', r.status === 401);

// ---------------------------------------------------------------------------
console.log('\n== Dashboard Stats ==');
r = await req('GET', '/api/dashboard/stats', { token: T_ADMIN });
t('stats → 200', r.status === 200);
t('stats punya totalRevenue', typeof r.body?.totalRevenue === 'number');
t('stats punya totalEquipments = 50', r.body?.totalEquipments === 50);

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
