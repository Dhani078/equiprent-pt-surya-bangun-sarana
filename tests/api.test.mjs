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

r = await req('PUT', '/api/rentals/1/status', { token: T_ADMIN, body: { status: 'APPROVED' } });
t('status rental sah → 200', r.status === 200);

r = await req('POST', '/api/maintenance', { token: T_ADMIN, body: {} });
t('body maintenance kosong → 400', r.status === 400);

r = await req('POST', '/api/maintenance', { token: T_ADMIN, body: { equipment_id: 999999, scheduled_date: '2026-10-01' } });
t('maintenance unit tidak ada → 404', r.status === 404);

r = await req('POST', '/api/maintenance', { token: T_ADMIN, body: { equipment_id: 1, scheduled_date: 'bukan-tanggal' } });
t('maintenance tanggal rusak → 400', r.status === 400);

r = await req('POST', '/api/maintenance', { token: T_ADMIN, body: { equipment_id: 1, scheduled_date: '2026-10-01' } });
t('maintenance valid → 201', r.status === 201);

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
console.log('\n== Dashboard Stats ==');
r = await req('GET', '/api/dashboard/stats', { token: T_ADMIN });
t('stats → 200', r.status === 200);
t('stats punya totalRevenue', typeof r.body?.totalRevenue === 'number');
t('stats punya totalEquipments = 50', r.body?.totalEquipments === 50);

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
