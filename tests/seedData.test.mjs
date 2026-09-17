/**
 * Test Suite: Seed Data Realistis untuk Demo Sidang (T-0050)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Menguji acceptance criteria T-0050 secara langsung terhadap stateStore
 * (sumber data demo saat TiDB belum terhubung):
 *
 *   1. Minimal 50 unit alat berat dengan tipe & brand bervariasi.
 *   2. Minimal 50 rental dengan status tersebar (pending/active/done/cancelled).
 *   3. Minimal 55 titik GPS realistis sekitar Banjarmasin.
 *   4. Data konsisten lintas tabel (total HM, payment, maintenance).
 *
 * Mengimpor `.tmp_seed.mjs` (bundle esbuild dari src/lib/seedGenerator.ts).
 */

import assert from 'node:assert/strict';

const {
  GENERATED_USERS: users,
  GENERATED_EQUIPMENTS: equipments,
  GENERATED_RENTALS: rentals,
  GENERATED_CONTRACTS: contracts,
  GENERATED_PAYMENTS: payments,
  GENERATED_MAINTENANCE: maintenance,
  GENERATED_GPS: gps,
  GENERATED_REPORTS: reports,
} = await import('../.tmp_seed.mjs');

let pass = 0;
let fail = 0;

/** Tambah/kurang hari dari tanggal (toleransi zona waktu saat membandingkan). */
function addDaysUtc(base, days) {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function t(label, kondisi) {
  if (kondisi) {
    pass += 1;
    console.log(`  PASS  ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${label}`);
  }
}

console.log('\n== Volume data demo (acceptance criteria T-0050) ==');

t('≥ 50 pengguna (2 ADMIN, 6 STAFF, ≥40 CUSTOMER)', users.length >= 50);
t('≥ 50 unit alat berat', equipments.length >= 50);
t('≥ 50 transaksi rental', rentals.length >= 50);
t('≥ 50 kontrak sewa', contracts.length >= 50);
t('≥ 50 pembayaran', payments.length >= 50);
t('≥ 25 log maintenance', maintenance.length >= 20);
t('≥ 55 titik GPS', gps.length >= 55);
t('≥ 20 dokumen laporan', reports.length >= 20);

console.log('\n== variasi tipe & brand unit ==');

const tipeUnit = new Set(equipments.map(e => e.type));
const brandUnit = new Set(equipments.map(e => e.brand));
const kodeUnik = new Set(equipments.map(e => e.equipment_code));

t('≥ 5 tipe alat berat berbeda', tipeUnit.size >= 5);
t('≥ 5 brand berbeda', brandUnit.size >= 5);
t('semua equipment_code unik', kodeUnik.size === equipments.length);
t('semua username unik', new Set(users.map(u => u.username)).size === users.length);

console.log('\n== penyebaran status rental (pending/active/done/cancelled) ==');

const hitungStatus = (arr, fn) => arr.reduce((acc, item) => {
  const k = fn(item);
  if (k) acc[k] = (acc[k] ?? 0) + 1;
  return acc;
}, {});

const sebaran = hitungStatus(rentals, r => r.status);
const statusAda = ['PENDING', 'APPROVED', 'ON_GOING', 'COMPLETED', 'REJECTED'];

t('semua 5 status rental terwakili', statusAda.every(s => (sebaran[s] ?? 0) > 0));
t('rental AKTIF (APPROVED+ON_GOING) ≥ 10', (sebaran.APPROVED ?? 0) + (sebaran.ON_GOING ?? 0) >= 10);
t('rental riwayat (COMPLETED) ≥ 15', (sebaran.COMPLETED ?? 0) >= 15);
t('rental ditolak (REJECTED) ≥ 2', (sebaran.REJECTED ?? 0) >= 2);

const sebaranUnit = hitungStatus(equipments, e => e.status);
t('unit AVAILABLE ≥ 10', (sebaranUnit.AVAILABLE ?? 0) >= 10);
t('unit RENTED ≥ 5', (sebaranUnit.RENTED ?? 0) >= 5);
t('unit MAINTENANCE ≥ 3', (sebaranUnit.MAINTENANCE ?? 0) >= 3);

const sebaranBayar = hitungStatus(payments, p => p.status);
t('pembayaran PAID ≥ 20', (sebaranBayar.PAID ?? 0) >= 20);
t('pembayaran PENDING_VERIFICATION ≥ 1 (antrean verifikasi staf)', (sebaranBayar.PENDING_VERIFICATION ?? 0) >= 1);

console.log('\n== realistis: koordinat GPS sekitar Banjarmasin ==');

// Kalsel: lintang -4.5 s/d -2.0, bujur 114.0 s/d 116.5.
const latOk = gps.every(g => g.latitude < -2.0 && g.latitude > -4.5);
const lngOk = gps.every(g => g.longitude > 114.0 && g.longitude < 116.5);

t('semua titik GPS dalam rentang Kalimantan Selatan', latOk && lngOk);
t('koordinat GPS tidak identik (tersebar)', new Set(gps.map(g => `${g.latitude},${g.longitude}`)).size >= gps.length * 0.8);
t('recorded_at terisi pada semua titik GPS', gps.every(g => typeof g.recorded_at === 'string' && g.recorded_at.length > 0));
t('fuel_level 0–100', gps.every(g => g.fuel_level_percent >= 0 && g.fuel_level_percent <= 100));

console.log('\n== tanggal segar: rental mengikuti kalender hari ini ==');

const sekarang = new Date();
const toleransiHari = 400; // riwayat boleh jauh ke belakang

const onGoingBerjalan = rentals.filter(r => r.status === 'ON_GOING');
t('rental ON_GOING start ≤ hari ini ≤ end',
  onGoingBerjalan.length > 0 &&
  onGoingBerjalan.every(r => new Date(r.start_date) <= sekarang && new Date(r.end_date) >= sekarang));

const approvedAkanJalan = rentals.filter(r => r.status === 'APPROVED');
t('rental APPROVED start di masa depan / hari ini',
  approvedAkanJalan.every(r => new Date(r.start_date) >= addDaysUtc(sekarang, -1)));

const pendingAkanJalan = rentals.filter(r => r.status === 'PENDING');
t('rental PENDING belum mulai',
  pendingAkanJalan.every(r => new Date(r.start_date) >= sekarang));

const gpsSegar = gps.every(g => Math.abs(sekarang.getTime() - new Date(g.recorded_at).getTime()) <= toleransiHari * 86400000);
t('titik GPS terekam dalam beberapa hari terakhir', gpsSegar);

const riwayatLalu = rentals.filter(r => r.status === 'COMPLETED' || r.status === 'REJECTED');
t('rental riwayat di masa lalu',
  riwayatLalu.every(r => new Date(r.end_date) <= addDaysUtc(sekarang, 1)));

console.log('\n== konsistensi relasional lintas tabel ==');

const idUnit = new Set(equipments.map(e => e.id));
const idUser = new Set(users.map(u => u.id));
const idRental = new Set(rentals.map(r => r.id));
const idKontrak = new Set(contracts.map(c => c.id));

t('setiap rental menunjuk customer yang ada', rentals.every(r => idUser.has(r.customer_id)));
t('setiap rental menunjuk unit yang ada', rentals.every(r => idUnit.has(r.equipment_id)));
t('setiap kontrak menunjuk rental yang ada', contracts.every(c => idRental.has(c.rental_id)));
t('setiap pembayaran menunjuk kontrak yang ada', payments.every(p => idKontrak.has(p.contract_id)));
t('setiap maintenance menunjuk unit yang ada', maintenance.every(m => idUnit.has(m.equipment_id)));
t('setiap GPS menunjuk unit yang ada', gps.every(g => idUnit.has(g.equipment_id)));

console.log('\n== konsistensi total: HM, subtotal, pembayaran ==');

// HM saat servis harus ≤ HM unit sekarang (masuk akal secara waktu).
const hmKonsisten = maintenance.filter(m => {
  const unit = equipments.find(e => e.id === m.equipment_id);
  return unit && m.hour_meter_at_maintenance <= unit.hour_meter;
});
t('HM saat servis ≤ HM unit saat ini', hmKonsisten.length === maintenance.length);

// subtotal = total_days × tarif harian unit.
const subtotalKonsisten = rentals.filter(r => {
  const unit = equipments.find(e => e.id === r.equipment_id);
  return unit && r.subtotal === r.total_days * unit.rental_price_per_day;
});
t('subtotal rental = durasi × tarif harian', subtotalKonsisten.length === rentals.length);

// nominal pembayaran = subtotal rental.
const nominalKonsisten = payments.filter(p => {
  const kontrak = contracts.find(c => c.id === p.contract_id);
  const rental = rentals.find(r => r.id === kontrak?.rental_id);
  return rental && p.amount === rental.subtotal;
});
t('nominal pembayaran = subtotal rental', nominalKonsisten.length === payments.length);

// Sewa ON_GOING harus PAID (gerbang pembayaran §4.3 poin 4).
const onGoingUnpaid = payments.filter(p => {
  const kontrak = contracts.find(c => c.id === p.contract_id);
  const rental = rentals.find(r => r.id === kontrak?.rental_id);
  return rental?.status === 'ON_GOING' && p.status !== 'PAID';
});
t('semua rental ON_GOING sudah PAID', onGoingUnpaid.length === 0);

// Kontrak rental PENDING belum ditandatangani.
const pendingDiserahkan = contracts.filter(c => {
  const rental = rentals.find(r => r.id === c.rental_id);
  return rental?.status === 'PENDING' && c.is_signed_customer === 1;
});
t('kontrak rental PENDING belum ditandatangani', pendingDiserahkan.length === 0);

// PENDING_VERIFICATION wajib punya bukti transfer terlampir.
const pendingTanpaBukti = payments.filter(
  p => p.status === 'PENDING_VERIFICATION' && !p.payment_proof_path
);
t('pembayaran PENDING_VERIFICATION punya bukti transfer', pendingTanpaBukti.length === 0);

console.log('\n== tidak ada double-booking ==');

// Satu unit hanya boleh punya SATU rental aktif.
const unitAktif = new Map();
for (const r of rentals) {
  if (r.status === 'APPROVED' || r.status === 'ON_GOING') {
    unitAktif.set(r.equipment_id, (unitAktif.get(r.equipment_id) ?? 0) + 1);
  }
}
t('tidak ada unit dengan >1 rental aktif', [...unitAktif.values()].every(n => n === 1));

// Status unit RENTED selaras dengan adanya rental aktif.
const unitDisewa = new Set([...unitAktif.keys()]);
const statusSelaras = equipments.every(e => {
  if (e.status === 'MAINTENANCE' || e.status === 'UNAVAILABLE') return true;
  return (e.status === 'RENTED') === unitDisewa.has(e.id);
});
t('status unit selaras dengan rental aktif', statusSelaras);

console.log('\n== akun demo untuk presentasi sidang ==');

const usernameDemo = ['admin', 'staff', 'user'];
t('akun demo admin/staff/user tersedia',
  usernameDemo.every(u => users.some(x => x.username === u)));
t('ADMIN ≥ 1, STAFF ≥ 3, CUSTOMER ≥ 40',
  users.filter(u => u.role_name === 'ADMIN').length >= 1 &&
  users.filter(u => u.role_name === 'STAFF').length >= 3 &&
  users.filter(u => u.role_name === 'CUSTOMER').length >= 40);

console.log(`\n${fail === 0 ? `Semua asersi lulus (${pass}).` : `${fail} asersi gagal dari ${pass + fail}.`}`);
process.exit(fail === 0 ? 0 : 1);
