import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const br = await import('../.tmp_businessRules.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

const eq = (id, hm) => ({ id, hour_meter: hm, status: 'AVAILABLE' });
const mnt = (eqid, hm, status = 'COMPLETED') => ({
  equipment_id: eqid, hour_meter_at_maintenance: hm, status,
});

console.log('\n== Aturan Servis 250 HM ==');
// Servis terakhir 1200 → target berikutnya 1450. HM 1250 → sisa 200, belum waktunya.
let s = br.getServiceStatus(eq(1, 1250), [mnt(1, 1200)]);
t('target servis = 1200 + 250 = 1450', s.nextServiceTargetHM === 1450);
t('sisa 200 HM', s.hmUntilNextService === 200);
t('belum waktunya servis', s.isDue === false);
t('isApproaching false (sisa > 50)', s.isApproaching === false);

// HM 1450 → tepat waktunya
s = br.getServiceStatus(eq(1, 1450), [mnt(1, 1200)]);
t('HM 1450 → sudah waktunya (isDue)', s.isDue === true);

// HM 1460 → lewat
s = br.getServiceStatus(eq(1, 1460), [mnt(1, 1200)]);
t('HM 1460 → isDue & sisa negatif', s.isDue === true && s.hmUntilNextService === -10);

// Unit baru (belum pernah servis) → servis dijadwalkan 250 HM ke depan.
s = br.getServiceStatus(eq(2, 100), []);
t('unit baru: target = HM saat ini + 250 = 350', s.nextServiceTargetHM === 350);
t('unit baru: sisa 250 HM', s.hmUntilNextService === 250);
t('unit baru: tidak dianggap jatuh tempo', s.isDue === false);
t('unit baru: lastServiceHM = 0', s.lastServiceHM === 0);

// Unit dengan riwayat servis → target dari HM servis terakhir + 250
s = br.getServiceStatus(eq(2, 1300), [mnt(2, 1200)]);
t('riwayat 1200, HM 1300 → sisa 150', s.hmUntilNextService === 150);
t('riwayat 1200, HM 1300 → belum waktunya', s.isDue === false);
s = br.getServiceStatus(eq(2, 1500), [mnt(2, 1200)]);
t('riwayat 1200, HM 1500 → jatuh tempo', s.isDue === true);

// Ambang peringatan 50 HM
s = br.getServiceStatus(eq(3, 1420), [mnt(3, 1200)]);
t('sisa 30 HM → isApproaching', s.isApproaching === true && s.isDue === false);

// Riwayat servis yang belum COMPLETED tidak dihitung
s = br.getServiceStatus(eq(4, 1300), [mnt(4, 1200, 'SCHEDULED')]);
t('servis SCHEDULED tidak dihitung sebagai servis terakhir', s.lastServiceHM === 0);

// Ambil nilai tertinggi bila ada beberapa riwayat
s = br.getServiceStatus(eq(5, 1500), [mnt(5, 1000), mnt(5, 1250), mnt(5, 1150)]);
t('dipakai riwayat HM tertinggi (1250)', s.lastServiceHM === 1250);
t('target setelah 1250 = 1500', s.nextServiceTargetHM === 1500);

console.log('\n== getUnitsDueForService ==');
const eqs = [
  eq(1, 1250),
  eq(2, 1460),
  eq(3, 200),
  { id: 4, hour_meter: 9999, status: 'MAINTENANCE' },
];
const due = br.getUnitsDueForService(eqs, [mnt(1, 1200), mnt(2, 1200), mnt(3, 0)]);
t('unit yang sudah waktunya masuk daftar', due.some(d => d.equipment.id === 2));
t('unit yang masih aman TIDAK masuk daftar', !due.some(d => d.equipment.id === 1));
t('unit sedang MAINTENANCE tidak masuk daftar', !due.some(d => d.equipment.id === 4));
t('diurutkan berdasarkan sisa HM', due.length > 1 ? due[0].status.hmUntilNextService <= due[1].status.hmUntilNextService : true);

console.log('\n== Hitung Biaya Sewa & Denda ==');
let c = br.calculateRentalCost(2_500_000, '2026-09-01', '2026-09-05', null);
t('5 hari x 2.5jt = 12.5jt', c.subtotal === 12_500_000);
t('tidak ada denda bila belum kembali', c.penalty === 0 && c.lateDays === 0);

c = br.calculateRentalCost(2_500_000, '2026-09-01', '2026-09-05', '2026-09-05');
t('kembali tepat waktu → 0 hari telat', c.lateDays === 0 && c.penalty === 0);

c = br.calculateRentalCost(2_500_000, '2026-09-01', '2026-09-05', '2026-09-08');
t('telat 3 hari', c.lateDays === 3);
t('denda 3 x 500rb = 1.5jt', c.penalty === 1_500_000);
t('grand total = 12.5jt + 1.5jt', c.grandTotal === 14_000_000);

console.log('\n== Deteksi Double-Booking ==');
const rentals = [
  { id: 1, equipment_id: 1, start_date: '2026-09-01', end_date: '2026-09-10', status: 'APPROVED' },
];
t('bentrok (irisan)', br.isEquipmentAvailable(1, '2026-09-05', '2026-09-08', rentals) === false);
t('bentrok (di dalam)', br.isEquipmentAvailable(1, '2026-09-03', '2026-09-04', rentals) === false);
t('bentrok (membungkus)', br.isEquipmentAvailable(1, '2026-08-25', '2026-09-15', rentals) === false);
t('AMAN (setelah)', br.isEquipmentAvailable(1, '2026-09-11', '2026-09-15', rentals) === true);
t('AMAN (sebelum)', br.isEquipmentAvailable(1, '2026-08-20', '2026-08-31', rentals) === true);
t('unit lain bebas', br.isEquipmentAvailable(2, '2026-09-05', '2026-09-08', rentals) === true);
t('rental REJECTED tidak menghalangi',
  br.isEquipmentAvailable(1, '2026-09-05', '2026-09-08',
    [{ id: 2, equipment_id: 1, start_date: '2026-09-01', end_date: '2026-09-10', status: 'REJECTED' }]) === true);

console.log('\n== Format Indonesia ==');
t('Rupiah', br.formatRupiah(1_250_000).includes('1.250.000'));
t('Tanggal', br.formatTanggal('2026-09-04').includes('September'));
t('Tanggal null → "-"', br.formatTanggal(null) === '-');

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
