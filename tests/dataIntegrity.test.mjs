import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const br = await import('../.tmp_businessRules.mjs');
const { stateStore } = await import('../.tmp_db.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };
const S = stateStore;

console.log('\n== Jumlah Data (target sesuai dokumentasi) ==');
console.log(`  users: ${S.users.length}   equipments: ${S.equipments.length}   rentals: ${S.rentals.length}   contracts: ${S.contracts.length}`);
console.log(`  payments: ${S.payments.length}   maintenance: ${S.maintenance.length}   gps: ${S.gps.length}   reports: ${S.reports.length}`);
t('users = 50', S.users.length === 50);
t('equipments = 50', S.equipments.length === 50);
t('rentals = 50', S.rentals.length === 50);
t('contracts = 50', S.contracts.length === 50);
t('payments = 50', S.payments.length === 50);
t('maintenance = 25', S.maintenance.length === 25);
t('gps = 55', S.gps.length === 55);
t('reports = 20', S.reports.length === 20);

console.log('\n== Integritas Referensial ==');
const eqIds = new Set(S.equipments.map(e => e.id));
const userIds = new Set(S.users.map(u => u.id));
const custIds = new Set(S.users.filter(u => u.role_id === 3).map(u => u.id));
const rentalIds = new Set(S.rentals.map(r => r.id));
const contractIds = new Set(S.contracts.map(c => c.id));

t('semua rental → equipment valid', S.rentals.every(r => eqIds.has(r.equipment_id)));
t('semua rental → customer valid (role CUSTOMER)', S.rentals.every(r => custIds.has(r.customer_id)));
t('semua maintenance → equipment valid', S.maintenance.every(m => eqIds.has(m.equipment_id)));
t('semua gps → equipment valid', S.gps.every(p => eqIds.has(p.equipment_id)));
t('semua contract → rental valid', S.contracts.every(c => rentalIds.has(c.rental_id)));
t('semua payment → contract valid', S.payments.every(p => contractIds.has(p.contract_id)));
t('semua report → rental valid', S.reports.every(r => r.rental_id === null || rentalIds.has(r.rental_id)));

console.log('\n== Unik ID & Kode ==');
const unik = (arr, key) => new Set(arr.map(x => x[key])).size === arr.length;
t('id users unik', unik(S.users, 'id'));
t('id equipments unik', unik(S.equipments, 'id'));
t('equipment_code unik', unik(S.equipments, 'equipment_code'));
t('rental_code unik', unik(S.rentals, 'rental_code'));
t('contract_code unik', unik(S.contracts, 'contract_code'));
t('username unik', unik(S.users, 'username'));

console.log('\n== Kode Kontrak Sesuai Format SBS/CONTRACT/YYYY/MM/SEQ ==');
t('format contract_code benar', S.contracts.every(c => /^SBS\/CONTRACT\/\d{4}\/\d{2}\/\d{4}$/.test(c.contract_code)));

console.log('\n== Nilai Realistis ==');
t('hour_meter positif & wajar', S.equipments.every(e => e.hour_meter > 0 && e.hour_meter < 20000));
t('harga sewa positif', S.equipments.every(e => e.rental_price_per_day > 0));
t('subtotal = hari x tarif', S.rentals.every(r => {
  const eq = S.equipments.find(e => e.id === r.equipment_id);
  return eq && Math.abs(r.subtotal - r.total_days * eq.rental_price_per_day) < 1;
}));
t('end_date >= start_date', S.rentals.every(r => new Date(r.end_date) >= new Date(r.start_date)));
t('GPS di sekitar Kalimantan Selatan', S.gps.every(p =>
  p.latitude > -4.2 && p.latitude < -2.5 && p.longitude > 113.5 && p.longitude < 116.5));
t('fuel 0-100%', S.gps.every(p => p.fuel_level_percent >= 0 && p.fuel_level_percent <= 100));
t('mesin OFF → speed 0', S.gps.every(p => p.engine_status === 'ON' || p.speed === 0));

console.log('\n== Akun Demo Tetap Bisa Login ==');
const { db } = await import('../.tmp_db.mjs');
t('admin/admin', (await db.verifyCredentials('admin', 'admin')).ok === true);
t('staff/staff', (await db.verifyCredentials('staff', 'staff')).ok === true);
t('user/user', (await db.verifyCredentials('user', 'user')).ok === true);
t('password salah ditolak', (await db.verifyCredentials('admin', 'x')).ok === false);

console.log('\n== Panel Servis Kini Terisi ==');
const alerts = br.getUnitsDueForService(S.equipments, S.maintenance);
const overdue = alerts.filter(a => a.status.isDue).length;
console.log(`  unit butuh perhatian: ${alerts.length} (jatuh tempo: ${overdue})`);
t('panel tidak kosong', alerts.length > 0);
t('tidak semua unit masuk alert', alerts.length < S.equipments.length);
t('unit MAINTENANCE tidak muncul', !alerts.some(a => a.equipment.status === 'MAINTENANCE'));
console.log('  contoh 5 teratas:');
alerts.slice(0,5).forEach(a => console.log(`   - ${a.equipment.equipment_code} HM ${a.status.currentHM} → target ${a.status.nextServiceTargetHM} (${a.status.isDue?'LEWAT':'SISA'} ${Math.abs(Math.round(a.status.hmUntilNextService))})`));

console.log('\n== Distribusi Status (untuk variasi tampilan) ==');
const dist = (arr, k) => arr.reduce((m, x) => (m[x[k]] = (m[x[k]]||0)+1, m), {});
console.log('  equipment:', JSON.stringify(dist(S.equipments, 'status')));
console.log('  rental   :', JSON.stringify(dist(S.rentals, 'status')));
console.log('  payment  :', JSON.stringify(dist(S.payments, 'status')));
t('ada unit AVAILABLE', S.equipments.some(e => e.status === 'AVAILABLE'));
t('ada unit RENTED', S.equipments.some(e => e.status === 'RENTED'));
t('ada unit MAINTENANCE', S.equipments.some(e => e.status === 'MAINTENANCE'));
t('ada rental COMPLETED (untuk laporan)', S.rentals.some(r => r.status === 'COMPLETED'));
t('ada payment PAID (untuk pendapatan)', S.payments.some(p => p.status === 'PAID'));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
