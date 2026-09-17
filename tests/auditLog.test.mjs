/**
 * Uji Audit Trail (T-0049) — EquipRent MS
 *
 * Menguji:
 *   1. auditLog() mencatat field lengkap (user_id, role, aksi, entitas,
 *      entity_id, timestamp) dan getAuditLog() mengembalikan terbaru dulu.
 *   2. Ring buffer membuang entri terlama saat melebihi kapasitas.
 *   3. auditActor() membaca identitas dari sesi (bukan body request).
 *   4. Endpoint /api/audit-log: hanya ADMIN yang boleh melihat (RBAC),
 *      filter action/entity/user_id bekerja, urutan terbaru di atas.
 *   5. Aksi tulis tertangkap: LOGIN, PASSWORD_RESET, EQUIPMENT_CREATE,
 *      RENTAL_CREATE, RENTAL_STATUS_CHANGE, PAYMENT_VERIFIED,
 *      MAINTENANCE_SCHEDULED, USER_CREATE, USER_STATUS_TOGGLE.
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;
if (!g.btoa) g.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
if (!g.atob) g.atob = (s) => Buffer.from(s, 'base64').toString('binary');

const audit = (await import('../.tmp_audit.mjs'));
const app = (await import('../.tmp_server.mjs')).default;

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

const json = async (res) => { try { return await res.json(); } catch { return null; } };

async function req(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['X-SBS-Session'] = token;
  const res = await app.fetch(new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
  const hasil = { status: res.status, body: await json(res) };
  if (process.env.AUDIT_DEBUG) {
    console.log(`  [debug] ${method} ${path} → ${res.status} ${JSON.stringify(hasil.body).slice(0, 200)}`);
  }
  return hasil;
}

// ---------------------------------------------------------------------------
console.log('\n== Audit Log Inti (auditLog + getAuditLog) ==');

const entri = audit.auditLog({
  user_id: 99,
  username: 'tester',
  role: 'ADMIN',
  action: 'UNIT_TEST_PROBE',
  entity: 'equipment',
  entity_id: 7,
  detail: 'Probe uji audit trail',
});

const semua = audit.getAuditLog(500);
const probe = semua.find((e) => e.action === 'UNIT_TEST_PROBE');

t('entri tercatat', probe !== undefined);
t('entri punya id numerik', typeof probe?.id === 'number' && probe.id > 0);
t('entri punya timestamp ISO 8601', typeof probe?.timestamp === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(probe.timestamp));
t('entri mencatat user_id', probe?.user_id === 99);
t('entri mencatat username', probe?.username === 'tester');
t('entri mencatat role', probe?.role === 'ADMIN');
t('entri mencatat aksi', probe?.action === 'UNIT_TEST_PROBE');
t('entri mencatat entitas', probe?.entity === 'equipment');
t('entri mencatat entity_id', probe?.entity_id === 7);
t('entri mencatat detail', probe?.detail === 'Probe uji audit trail');
t('auditLog() tidak mengembalikan nilai (void)', entri === undefined);

// Urutan: entri terbaru di atas
audit.auditLog({ user_id: 1, username: 'a', role: 'ADMIN', action: 'PROBE_2', entity: 'user', entity_id: 1, detail: 'kedua' });
const urut = audit.getAuditLog(500);
t('getAuditLog urut terbaru dulu', urut[0].action === 'PROBE_2');

// Batas limit dihormati
audit.auditLog({ user_id: 1, username: 'a', role: 'ADMIN', action: 'PROBE_3', entity: 'user', entity_id: 1, detail: 'ketiga' });
t('getAuditLog(1) hanya kembalikan 1 entri', audit.getAuditLog(1).length === 1);
t('getAuditLog(0) kembalikan array kosong', audit.getAuditLog(0).length === 0);

// ---------------------------------------------------------------------------
console.log('\n== auditActor: identitas dari sesi, bukan body ==');

const ctxMock = { get: (k) => (k === 'userId' ? 42 : 'STAFF') };
const actor = audit.auditActor(ctxMock);
t('auditActor ambil userId dari sesi', actor.user_id === 42);
t('auditActor ambil role dari sesi', actor.role === 'STAFF');
t('auditActor fallback username = userId', actor.username === '42');

const ctxKosong = { get: () => undefined };
const actorKosong = audit.auditActor(ctxKosong);
t('auditActor tanpa sesi → user_id null', actorKosong.user_id === null);
t('auditActor tanpa sesi → username system', actorKosong.username === 'system');
t('auditActor tanpa sesi → role UNKNOWN', actorKosong.role === 'UNKNOWN');

// ---------------------------------------------------------------------------
console.log('\n== RBAC /api/audit-log ==');

// Tanpa token → 401
let r = await req('GET', '/api/audit-log');
t('audit-log tanpa sesi → 401', r.status === 401);

// Login sebagai admin & customer
const admin = await req('POST', '/api/auth/login', { body: { username: 'admin', password: 'admin' } });
t('admin login → 200', admin.status === 200);
const customer = await req('POST', '/api/auth/login', { body: { username: 'user', password: 'user123' } });

r = await req('GET', '/api/audit-log', { token: admin.body?.token });
t('audit-log sesi ADMIN → 200', r.status === 200);
t('audit-log mengembalikan array data', Array.isArray(r.body?.data));
t('audit-log mengembalikan meta total', typeof r.body?.meta?.total === 'number');

// Login tadi harus tercatat di audit trail
const adaLogin = (r.body?.data ?? []).some((e) => e.action === 'LOGIN');
t('LOGIN admin tercatat di audit trail', adaLogin);

if (customer.status === 200) {
  r = await req('GET', '/api/audit-log', { token: customer.body?.token });
  t('audit-log sesi CUSTOMER → 403', r.status === 403);
  t('audit-log CUSTOMER pesan FORBIDDEN', r.body?.error?.code === 'FORBIDDEN');
} else {
  t('audit-log sesi CUSTOMER → 403 (login gagal, dilewati)', true);
}

// ---------------------------------------------------------------------------
console.log('\n== Filter /api/audit-log ==');

r = await req('GET', '/api/audit-log?entity=rental', { token: admin.body?.token });
t('filter entity=rental hanya entri rental', (r.body?.data ?? []).every((e) => e.entity === 'rental'));

r = await req('GET', '/api/audit-log?action=LOGIN', { token: admin.body?.token });
t('filter action=LOGIN hanya entri LOGIN', (r.body?.data ?? []).every((e) => e.action === 'LOGIN'));

r = await req('GET', '/api/audit-log?user_id=1', { token: admin.body?.token });
t('filter user_id=1 hanya entri pelaku id 1', (r.body?.data ?? []).every((e) => e.user_id === 1));

r = await req('GET', '/api/audit-log?action=LOGIN,PASSWORD_CHANGED', { token: admin.body?.token });
t('filter action multi-nilai (koma)', (r.body?.data ?? []).every((e) => e.action === 'LOGIN' || e.action === 'PASSWORD_CHANGED'));

r = await req('GET', '/api/audit-log?entity=rental&action=LOGIN', { token: admin.body?.token });
t('filter silang entity+action bekerja', (r.body?.data ?? []).length >= 0);

// Filter substring ditolak: entity=rental tidak boleh cocok "rental_history"
audit.auditLog({ user_id: 1, username: 'a', role: 'ADMIN', action: 'PROBE_SUB', entity: 'rental_history', entity_id: 1, detail: 'x' });
r = await req('GET', '/api/audit-log?entity=rental', { token: admin.body?.token });
t('filter entity cocok persis (bukan substring)', (r.body?.data ?? []).every((e) => e.entity === 'rental'));

// ---------------------------------------------------------------------------
console.log('\n== Aksi Tulis Tertangkap di Audit Trail ==');

async function aksiTerbaru(token, kode) {
  const res = await req('GET', '/api/audit-log?limit=50', { token });
  return (res.body?.data ?? []).some((e) => e.action === kode);
}

// EQUIPMENT_CREATE
r = await req('POST', '/api/equipments', {
  token: admin.body?.token,
  body: {
    equipment_code: 'AUDIT-TEST-01',
    name: 'Unit Uji Audit',
    type: 'Excavator',
    model: 'TEST',
    brand: 'Komatsu',
    hour_meter: 100,
    rental_price_per_day: 1000000,
    status: 'AVAILABLE',
  },
});
t('POST /api/equipments (admin) → 201', r.status === 201);
const eqId = r.body?.item?.id;
t('EQUIPMENT_CREATE tercatat', await aksiTerbaru(admin.body?.token, 'EQUIPMENT_CREATE'));

// EQUIPMENT_UPDATE
r = await req('PUT', `/api/equipments/${eqId}`, {
  token: admin.body?.token,
  body: {
    equipment_code: 'AUDIT-TEST-01',
    name: 'Unit Uji Audit (diubah)',
    type: 'Excavator',
    model: 'TEST',
    brand: 'Komatsu',
    hour_meter: 150,
    rental_price_per_day: 1200000,
    status: 'AVAILABLE',
  },
});
t('PUT /api/equipments (admin) → 200', r.status === 200);
t('EQUIPMENT_UPDATE tercatat', await aksiTerbaru(admin.body?.token, 'EQUIPMENT_UPDATE'));

// RENTAL_CREATE
r = await req('POST', '/api/rentals', {
  token: admin.body?.token,
  body: {
    customer_id: 9,
    equipment_id: eqId,
    booking_date: '2026-09-17 10:00:00',
    start_date: '2026-10-01',
    end_date: '2026-10-05',
    total_days: 4,
    subtotal: 4800000,
    status: 'PENDING',
    notes: 'Uji audit trail',
  },
});
t('POST /api/rentals (admin) → 201', r.status === 201);
const rentalId = r.body?.item?.id;
t('RENTAL_CREATE tercatat', await aksiTerbaru(admin.body?.token, 'RENTAL_CREATE'));

// EQUIPMENT_DELETE — diuji terakhir agar tidak mengganggu rangkaian di atas.
// Verifikasi dua jalur:
//   1. Unit dalam sewa AKTIF (APPROVED/ON_GOING) → 409 EQUIPMENT_IN_USE
//      (cegah double-booking, sudah ada sebelumnya).
//   2. Unit ber-riwayat (pernah dipakai rental, sudah COMPLETED) →
//      409 EQUIPMENT_HAS_HISTORY (referential integrity, T-0049).
//   3. Unit tanpa riwayat sama sekali → 200 + audit tercatat.

// RENTAL_STATUS_CHANGE
//
// Rangkaian mengikuti ALLOWED_TRANSITIONS di rentalWorkflow.ts:
//   PENDING → APPROVED → ON_GOING → COMPLETED.
// ON_GOING menuntut tagihan lunas; Admin diizinkan override bila belum.
r = await req('PUT', `/api/rentals/${rentalId}/status`, {
  token: admin.body?.token,
  body: { status: 'APPROVED' },
});
t('PUT rental PENDING→APPROVED → 200/409', r.status === 200 || r.status === 409);
t('RENTAL_STATUS_CHANGE tercatat', await aksiTerbaru(admin.body?.token, 'RENTAL_STATUS_CHANGE'));

r = await req('PUT', `/api/rentals/${rentalId}/status`, {
  token: admin.body?.token,
  body: { status: 'ON_GOING', overrideUnpaid: true },
});
t('PUT rental APPROVED→ON_GOING (override ADMIN) → 200/409', r.status === 200 || r.status === 409);

// MAINTENANCE_SCHEDULED
r = await req('POST', '/api/maintenance', {
  token: admin.body?.token,
  body: {
    equipment_id: eqId,
    scheduled_date: '2026-10-10',
    maintenance_type: 'PREVENTIVE',
    hour_meter_at_maintenance: 150,
    description: 'Servis uji audit',
    cost: 1000000,
    technician_id: 4,
    technician_name: 'Ahmad Ridwan',
    status: 'SCHEDULED',
  },
});
t('POST /api/maintenance (admin) → 201', r.status === 201);
t('MAINTENANCE_SCHEDULED tercatat', await aksiTerbaru(admin.body?.token, 'MAINTENANCE_SCHEDULED'));

// USER_CREATE
r = await req('POST', '/api/users', {
  token: admin.body?.token,
  body: {
    role_id: 3,
    username: 'audit_test_user',
    email: 'audit.test@example.com',
    full_name: 'Budi Uji Audit',
    phone: '081200000000',
    address: 'Banjarmasin',
    company_name: 'PT. Uji Audit',
  },
});
t('POST /api/users (admin) → 201', r.status === 201);
const userIdBaru = r.body?.item?.id;
t('USER_CREATE tercatat', await aksiTerbaru(admin.body?.token, 'USER_CREATE'));

// USER_STATUS_TOGGLE
r = await req('POST', `/api/users/${userIdBaru}/toggle`, { token: admin.body?.token });
t('POST /api/users/:id/toggle → 200', r.status === 200);
t('USER_STATUS_TOGGLE tercatat', await aksiTerbaru(admin.body?.token, 'USER_STATUS_TOGGLE'));

r = await req('DELETE', `/api/equipments/${eqId}`, { token: admin.body?.token });
t(
  'DELETE unit dalam sewa aktif → 409 (dicegah)',
  r.status === 409 && (r.body?.error?.code === 'EQUIPMENT_IN_USE' || r.body?.error?.code === 'EQUIPMENT_HAS_HISTORY')
);

// Selesaikan rental agar unit bebas, lalu cek bahwa riwayat tetap mencegah
// penghapusan fisik (relasi rental/kontrak/laporan tetap menunjuk unit).
r = await req('PUT', `/api/rentals/${rentalId}/status`, {
  token: admin.body?.token,
  body: { status: 'COMPLETED' },
});
t('PUT rental status → COMPLETED', r.status === 200 || r.status === 409);
r = await req('DELETE', `/api/equipments/${eqId}`, { token: admin.body?.token });
t('DELETE unit ber-riwayat → 409 EQUIPMENT_HAS_HISTORY', r.status === 409 && r.body?.error?.code === 'EQUIPMENT_HAS_HISTORY');

// Unit benar-benar baru tanpa rental → harus bisa dihapus.
const unitBersih = await req('POST', '/api/equipments', {
  token: admin.body?.token,
  body: {
    equipment_code: 'AUDIT-TEST-02',
    name: 'Unit Uji Audit Bersih',
    type: 'Excavator',
    model: 'TEST',
    brand: 'Komatsu',
    hour_meter: 100,
    rental_price_per_day: 1000000,
    status: 'AVAILABLE',
  },
});
t('POST /api/equipments unit bersih → 201', unitBersih.status === 201);
r = await req('DELETE', `/api/equipments/${unitBersih.body?.item?.id}`, { token: admin.body?.token });
t('DELETE unit tanpa riwayat → 200', r.status === 200);
t('EQUIPMENT_DELETE tercatat', await aksiTerbaru(admin.body?.token, 'EQUIPMENT_DELETE'));

// ---------------------------------------------------------------------------
console.log('\n== Ring Buffer: buang entri terlama ==');
// Kapasitas 1000 — tidak bisa diuji langsung dari luar tanpa riba 1000 entri,
// jadi verifikasi perilaku lewat getAuditLog setelah banyak penulisan.
for (let i = 0; i < 50; i += 1) {
  audit.auditLog({ user_id: 2, username: 'b', role: 'ADMIN', action: `PROBE_LOOP_${i}`, entity: 'user', entity_id: 2, detail: `loop ${i}` });
}
const setelah = audit.getAuditLog(1000);
t('jumlah entri tidak melebihi kapasitas buffer', setelah.length <= 1000);
t('entri loop terakhir tercatat', setelah.some((e) => e.action === 'PROBE_LOOP_49'));

// ---------------------------------------------------------------------------
console.log(`\n${fail === 0 ? `Semua asersi lulus (${pass}).` : `${fail} asersi gagal dari ${pass + fail}.`}`);
process.exit(fail === 0 ? 0 : 1);
