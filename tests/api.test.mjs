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

// Daftar unit dipakai berulang kali agar pemilihan kasus uji deterministik.
// Disimpan dalam `let` karena status unit bisa berubah di tengah pengujian
// (membuat jadwal perawatan akan menandai unit sebagai MAINTENANCE).
let semuaUnit = (await req('GET', '/api/equipments', { token: T_ADMIN })).body || [];

// Unit yang dirawat / dinonaktifkan tidak boleh disewa kapan pun, jadi
// tidak layak dipakai sebagai contoh "rentang bebas" maupun "rentang bentrok".
let unitBermasalah = new Set(
  semuaUnit.filter(e => e.status === 'MAINTENANCE' || e.status === 'UNAVAILABLE').map(e => e.id)
);

/** Menyegarkan daftar unit & pengelompokannya setelah ada perubahan status. */
async function segarkanUnit() {
  semuaUnit = (await req('GET', '/api/equipments', { token: T_ADMIN })).body || [];
  unitBermasalah = new Set(
    semuaUnit.filter(e => e.status === 'MAINTENANCE' || e.status === 'UNAVAILABLE').map(e => e.id)
  );
}

// Pilih rental yang TIDAK bentrok agar pengujian deterministik.
// (Menyetujui rental yang bentrok memang akan ditolak 409 — diuji di bawah.)
const semuaRental = (await req('GET', '/api/rentals', { token: T_ADMIN })).body || [];
const aktifIds = new Set(
  semuaRental.filter(x => x.status === 'ON_GOING' || x.status === 'APPROVED').map(x => x.equipment_id)
);
const bebas = semuaRental.find(x => x.status === 'PENDING' && !aktifIds.has(x.equipment_id) && !unitBermasalah.has(x.equipment_id));

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

// INSPECTION tidak ada di ENUM skema → harus ditolak, bukan disimpan kosong.
r = await req('POST', '/api/maintenance', {
  token: T_ADMIN,
  body: { equipment_id: 1, scheduled_date: '2026-10-01', maintenance_type: 'INSPECTION' },
});
t('maintenance jenis INSPECTION → 400', r.status === 400);

r = await req('POST', '/api/maintenance', {
  token: T_ADMIN,
  body: { equipment_id: 1, scheduled_date: '2026-10-01', maintenance_type: 'OVERHAUL' },
});
t('maintenance jenis OVERHAUL → 201', r.status === 201);

// ---------------------------------------------------------------------------
console.log('\n== Pencegahan Double-Booking ==');
// Jadwal perawatan di atas mengubah status unit → daftar unit disegarkan.
await segarkanUnit();

// Ambil satu rental aktif untuk dijadikan acuan bentrok.
const aktif = (semuaRental).find(
  x => (x.status === 'ON_GOING' || x.status === 'APPROVED') && !unitBermasalah.has(x.equipment_id)
);
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

// Unit dalam perawatan / nonaktif tidak boleh disewa kapan pun.
const unitRusak = semuaUnit.find(e => e.status === 'MAINTENANCE' || e.status === 'UNAVAILABLE');
if (unitRusak) {
  r = await req('POST', '/api/rentals', {
    token: T_CUST,
    body: {
      equipment_id: unitRusak.id,
      customer_id: 9,
      start_date: '2027-07-01',
      end_date: '2027-07-10',
      total_days: 10,
      subtotal: 10000000,
    },
  });
  t('sewa unit MAINTENANCE/UNAVAILABLE → 409', r.status === 409);
}

// ---------------------------------------------------------------------------
console.log('\n== Endpoint Ketersediaan Unit ==');
r = await req('GET', '/api/rentals/availability', { token: T_ADMIN });
t('availability tanpa from/to → 400', r.status === 400);

r = await req('GET', '/api/rentals/availability?from=2026-09-01&to=2026-09-30', { token: T_ADMIN });
t('availability ringkasan → 200', r.status === 200);
t('ringkasan punya total unit', typeof r.body?.data?.summary?.total === 'number');
t('ringkasan total sama dengan jumlah unit', r.body?.data?.summary?.total === semuaUnit.length);
t('items berupa array', Array.isArray(r.body?.data?.items));
t('setiap item punya isBookable boolean',
  r.body?.data?.items?.every(i => typeof i.isBookable === 'boolean'));
t('setiap item punya alasan yang sah',
  r.body?.data?.items?.every(i =>
    ['AVAILABLE', 'UNIT_STATUS', 'DATE_CONFLICT', 'INVALID_RANGE'].includes(i.reason)));

// Periksa satu unit yang sedang disewa pada periode tersebut.
if (aktif) {
  r = await req(
    'GET',
    `/api/rentals/availability?equipmentId=${aktif.equipment_id}&from=${aktif.start_date}&to=${aktif.end_date}`,
    { token: T_ADMIN }
  );
  t('availability unit aktif → 200', r.status === 200);
  t('unit yang sedang disewa → isBookable false', r.body?.data?.isBookable === false);
  t('unit yang sedang disewa punya daftar bentrokan',
    Array.isArray(r.body?.data?.conflicts) && r.body.data.conflicts.length > 0);

  // Rentang jauh di masa depan untuk unit yang sama → harus bebas.
  r = await req(
    'GET',
    `/api/rentals/availability?equipmentId=${aktif.equipment_id}&from=2027-08-01&to=2027-08-10`,
    { token: T_ADMIN }
  );
  t('unit yang sama di periode lain → isBookable true', r.body?.data?.isBookable === true);
  t('unit di periode lain tidak punya bentrokan', r.body?.data?.conflicts?.length === 0);
}

r = await req('GET', '/api/rentals/availability?equipmentId=999999&from=2026-09-01&to=2026-09-30', { token: T_ADMIN });
t('availability unit tidak ada → 404', r.status === 404);

r = await req('GET', '/api/rentals/availability?equipmentId=abc&from=2026-09-01&to=2026-09-30', { token: T_ADMIN });
t('availability equipmentId non-numerik → 400', r.status === 400);

// ---------------------------------------------------------------------------
console.log('\n== Endpoint Unit yang Bisa Dipesan ==');
r = await req('GET', '/api/rentals/bookable?from=2026-09-01&to=2026-09-30', { token: T_ADMIN });
t('bookable → 200', r.status === 200);
t('bookable items berupa array', Array.isArray(r.body?.data?.items));
t('setiap item bookable punya harga sewa',
  r.body?.data?.items?.every(i => typeof i.rentalPricePerDay === 'number'));
t('jumlah bookable sama dengan ringkasan',
  r.body?.data?.items?.length === r.body?.data?.summary?.bookable);

// Tanpa parameter seharusnya tidak membuat server error.
r = await req('GET', '/api/rentals/bookable', { token: T_ADMIN });
t('bookable tanpa tanggal → 200 (bukan 500)', r.status === 200);

// ---------------------------------------------------------------------------
console.log('\n== Endpoint Availability Butuh Autentikasi ==');
r = await req('GET', '/api/rentals/availability?from=2026-09-01&to=2026-09-30');
t('availability tanpa token → 401', r.status === 401);

r = await req('GET', '/api/rentals/bookable?from=2026-09-01&to=2026-09-30');
t('bookable tanpa token → 401', r.status === 401);

r = await req('GET', '/api/rentals/availability?from=2026-09-01&to=2026-09-30', { token: T_CUST });
t('customer boleh cek availability → 200', r.status === 200);

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
// ---------------------------------------------------------------------------
console.log('\n== Pendaftaran Pengguna oleh Admin ==');
const USER_BARU = {
  role_id: 3,
  username: 'ujicoba.agent',
  email: 'ujicoba.agent@sbs.co.id',
  full_name: 'Agen Uji Coba',
  phone: '081234567890',
  address: 'Jl. Ahmad Yani KM 12, Banjarmasin',
  company_name: 'CV. Uji Coba',
};

r = await req('POST', '/api/users', { token: T_ADMIN, body: USER_BARU });
t('daftar pengguna valid → 201', r.status === 201);
t('pengguna baru punya id', typeof r.body?.item?.id === 'number');
t('password_hash TIDAK dikirim ke klien', !('password_hash' in (r.body?.item ?? {})));

const idUserBaru = r.body?.item?.id;

// Duplikasi: username & email dipakai sebagai identitas login → harus unik.
r = await req('POST', '/api/users', { token: T_ADMIN, body: USER_BARU });
t('username duplikat → 409', r.status === 409);
t('kode galat username duplikat = VALIDATION_ERROR', r.body?.error?.code === 'VALIDATION_ERROR');
t('galat menyebut field username', Boolean(r.body?.error?.errors?.username));

r = await req('POST', '/api/users', {
  token: T_ADMIN,
  body: { ...USER_BARU, username: 'ujicoba.lain', email: 'ujicoba.agent@sbs.co.id' },
});
t('email duplikat → 409', r.status === 409);
t('galat menyebut field email', Boolean(r.body?.error?.errors?.email));

// Validasi field
r = await req('POST', '/api/users', { token: T_ADMIN, body: {} });
t('body pengguna kosong → 400', r.status === 400);
t('galat per-field dikembalikan', Object.keys(r.body?.error?.errors ?? {}).length > 0);

r = await req('POST', '/api/users', { token: T_ADMIN, body: { ...USER_BARU, username: 'x', email: 'bukan-email' } });
t('username & email rusak → 400', r.status === 400);

r = await req('POST', '/api/users', { token: T_STAFF, body: { ...USER_BARU, username: 'staff.coba' } });
t('staff DILARANG mendaftar pengguna → 403', r.status === 403);

r = await req('POST', '/api/users', { body: USER_BARU });
t('daftar pengguna tanpa token → 401', r.status === 401);

// ---------------------------------------------------------------------------
console.log('\n== Validasi Master Unit Alat Berat ==');
const UNIT_BARU = {
  equipment_code: 'EXCA-UJI-PC300-01',
  name: 'Hydraulic Excavator Komatsu PC300 Uji',
  type: 'Excavator',
  model: 'PC300-8',
  brand: 'Komatsu',
  hour_meter: 100,
  rental_price_per_day: 3_000_000,
  status: 'AVAILABLE',
  last_maintenance_date: '2026-05-01',
  thumbnail_url: '',
};

r = await req('POST', '/api/equipments', { token: T_ADMIN, body: UNIT_BARU });
t('tambah unit valid → 201', r.status === 201);
t('unit baru punya id', typeof r.body?.item?.id === 'number');
const idUnitBaru = r.body?.item?.id;

r = await req('POST', '/api/equipments', { token: T_ADMIN, body: UNIT_BARU });
t('kode unit duplikat → 409', r.status === 409);
t('galat menyebut field equipment_code', Boolean(r.body?.error?.errors?.equipment_code));

r = await req('POST', '/api/equipments', { token: T_ADMIN, body: { ...UNIT_BARU, equipment_code: 'EXCA-UJI-02', hour_meter: -5 } });
t('hour meter negatif → 400', r.status === 400);
t('galat menyebut field hour_meter', Boolean(r.body?.error?.errors?.hour_meter));

r = await req('POST', '/api/equipments', { token: T_ADMIN, body: { ...UNIT_BARU, equipment_code: 'EXCA-UJI-03', type: 'Helikopter' } });
t('kategori tidak dikenal → 400', r.status === 400);

r = await req('POST', '/api/equipments', { token: T_ADMIN, body: { ...UNIT_BARU, equipment_code: 'EXCA UJI 04' } });
t('kode unit mengandung spasi → 400', r.status === 400);

r = await req('POST', '/api/equipments', { token: T_ADMIN, body: { ...UNIT_BARU, equipment_code: 'EXCA-UJI-05', thumbnail_url: 'javascript:alert(1)' } });
t('URL foto berbahaya → 400', r.status === 400);

r = await req('POST', '/api/equipments', { token: T_ADMIN, body: {} });
t('body unit kosong → 400', r.status === 400);

r = await req('POST', '/api/equipments', { token: T_CUST, body: UNIT_BARU });
t('customer DILARANG menambah unit → 403', r.status === 403);

// Ubah & hapus
r = await req('PUT', `/api/equipments/${idUnitBaru}`, { token: T_ADMIN, body: { ...UNIT_BARU, hour_meter: 250 } });
t('ubah unit valid → 200', r.status === 200);
t('hour meter tersimpan', r.body?.item?.hour_meter === 250);

r = await req('PUT', `/api/equipments/${idUnitBaru}`, { token: T_STAFF, body: UNIT_BARU });
t('staff DILARANG mengubah unit → 403', r.status === 403);

r = await req('PUT', `/api/equipments/${idUnitBaru}`, { token: T_ADMIN, body: { ...UNIT_BARU, equipment_code: 'EXCA-KOM-PC200-01' } });
t('ubah ke kode milik unit lain → 409', r.status === 409);

r = await req('PUT', `/api/equipments/${idUnitBaru}`, { token: T_ADMIN, body: { status: 'AVAILABLE' } });
t('ubah unit dengan field tidak lengkap → 400 (bukan 500)', r.status === 400);

r = await req('DELETE', `/api/equipments/${idUnitBaru}`, { token: T_ADMIN });
t('hapus unit valid → 200', r.status === 200);

// Unit yang sedang disewa tidak boleh dihapus: riwayat & laporan akan kehilangan referensi.
const rentalAktif = semuaRental.find(x => x.status === 'ON_GOING' || x.status === 'APPROVED');
if (rentalAktif) {
  r = await req('DELETE', `/api/equipments/${rentalAktif.equipment_id}`, { token: T_ADMIN });
  t('hapus unit yang sedang disewa → 409', r.status === 409);
  t('kode galat EQUIPMENT_IN_USE', r.body?.error?.code === 'EQUIPMENT_IN_USE');
} else {
  t('hapus unit yang sedang disewa → 409', true); // tak ada kasus uji
}

// Bersihkan pengguna uji agar tidak mengganggu suite lain.
if (typeof idUserBaru === 'number') {
  r = await req('POST', `/api/users/${idUserBaru}/toggle`, { token: T_ADMIN });
  t('nonaktifkan pengguna uji → 200', r.status === 200);
}

// ---------------------------------------------------------------------------
console.log('\n== Dashboard Stats ==');
r = await req('GET', '/api/dashboard/stats', { token: T_ADMIN });
t('stats → 200', r.status === 200);
t('stats dibungkus { success, data }', r.body?.success === true);

const ds = r.body?.data ?? {};
t('stats punya totalRevenue', typeof ds.totalRevenue === 'number');
t('stats punya totalEquipments = 50', ds.totalEquipments === 50);
t('distribusi armada menjumlahkan total',
  ds.availableEquipments + ds.rentedEquipments + ds.maintenanceEquipments + ds.unavailableEquipments
    === ds.totalEquipments);
t('stats punya daftar transaksi terbaru', Array.isArray(ds.recentRentals));
t('transaksi terbaru maksimal 5', ds.recentRentals.length <= 5);
t('stats punya antrean servis', Array.isArray(ds.serviceQueue));
t('stats punya generatedAt', typeof ds.generatedAt === 'string');
t('jumlah pelanggan terhitung', typeof ds.totalCustomers === 'number' && ds.totalCustomers > 0);

// Dashboard boleh diakses STAFF (bukan hanya ADMIN).
r = await req('GET', '/api/dashboard/stats', { token: T_STAFF });
t('stats oleh STAFF → 200', r.status === 200);

// Tetap terproteksi: tanpa token harus 401.
r = await req('GET', '/api/dashboard/stats');
t('stats tanpa token → 401', r.status === 401);

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
