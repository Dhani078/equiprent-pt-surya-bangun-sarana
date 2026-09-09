/**
 * Uji mesin ketersediaan unit (pencegahan double booking).
 *
 * Fokus:
 *   1. Deteksi bentrokan rentang (ujung bersentuhan, beririsan, terpisah)
 *   2. Status rental yang mengunci vs yang membebaskan unit
 *   3. Unit dirawat / nonaktif tidak bisa dipesan kapan pun
 *   4. Rentang terbalik ditukar, rentang rusak ditolak tanpa mengunci semua unit
 *   5. Pesan galat berbahasa Indonesia dan tidak pernah NaN/undefined
 */

const {
  buildEquipmentAvailability,
  describeBlockedReason,
  getRentalConflicts,
  isBlockingStatus,
  isUnitOutOfService,
  normalizeBookingRange,
  summarizeAvailability,
} = await import('../.tmp_availability.mjs');

let pass = 0, fail = 0;
const t = (nama, ok) => {
  if (ok) { console.log(`  PASS  ${nama}`); pass++; }
  else { console.error(`  FAIL  ${nama}`); fail++; }
};

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const unit = (id, status = 'AVAILABLE') => ({
  id,
  equipment_code: `EXC-${String(id).padStart(3, '0')}`,
  name: `Excavator ${id}`,
  type: 'Excavator',
  model: 'PC200',
  brand: 'Komatsu',
  hour_meter: 1000,
  rental_price_per_day: 2_500_000,
  status,
  last_maintenance_date: null,
});

const rental = (over) => ({
  id: over.id ?? 1,
  rental_code: over.rental_code ?? 'RNT-001',
  customer_id: 9,
  customer_name: 'PT Borneo',
  equipment_id: over.equipment_id ?? 1,
  booking_date: '2026-01-01',
  start_date: over.start_date ?? '2026-09-01',
  end_date: over.end_date ?? '2026-09-10',
  total_days: 10,
  subtotal: 25_000_000,
  status: over.status ?? 'ON_GOING',
});

// ---------------------------------------------------------------------------
console.log('\n== Normalisasi Rentang ==');

t('rentang normal dipertahankan',
  JSON.stringify(normalizeBookingRange('2026-09-01', '2026-09-10')) ===
  JSON.stringify({ from: '2026-09-01', to: '2026-09-10' }));

t('rentang terbalik ditukar otomatis',
  JSON.stringify(normalizeBookingRange('2026-09-10', '2026-09-01')) ===
  JSON.stringify({ from: '2026-09-01', to: '2026-09-10' }));

t('tanggal rusak → null',
  normalizeBookingRange('bukan-tanggal', '2026-09-10') === null);

t('tanggal kosong → null',
  normalizeBookingRange('', '2026-09-10') === null);

t('satu tanggal saja → null',
  normalizeBookingRange('2026-09-10', '') === null);

t('hari yang sama dianggap rentang valid (1 hari)',
  JSON.stringify(normalizeBookingRange('2026-09-10', '2026-09-10')) ===
  JSON.stringify({ from: '2026-09-10', to: '2026-09-10' }));

// ---------------------------------------------------------------------------
console.log('\n== Status yang Mengunci Unit ==');

t('PENDING mengunci', isBlockingStatus('PENDING'));
t('APPROVED mengunci', isBlockingStatus('APPROVED'));
t('ON_GOING mengunci', isBlockingStatus('ON_GOING'));
t('COMPLETED membebaskan', !isBlockingStatus('COMPLETED'));
t('REJECTED membebaskan', !isBlockingStatus('REJECTED'));

// ---------------------------------------------------------------------------
console.log('\n== Status Unit di Luar Layanan ==');

t('MAINTENANCE tidak bisa disewa', isUnitOutOfService('MAINTENANCE'));
t('UNAVAILABLE tidak bisa disewa', isUnitOutOfService('UNAVAILABLE'));
t('AVAILABLE bisa disewa', !isUnitOutOfService('AVAILABLE'));
t('RENTED masih bisa dipesan untuk periode lain', !isUnitOutOfService('RENTED'));

// ---------------------------------------------------------------------------
console.log('\n== Deteksi Bentrokan ==');

const existing = [rental({ id: 1, equipment_id: 1, start_date: '2026-09-01', end_date: '2026-09-10' })];

t('beririsan penuh → bentrok',
  getRentalConflicts(1, '2026-09-01', '2026-09-10', existing).length === 1);

t('beririsan sebagian di awal → bentrok',
  getRentalConflicts(1, '2026-08-28', '2026-09-03', existing).length === 1);

t('beririsan sebagian di akhir → bentrok',
  getRentalConflicts(1, '2026-09-08', '2026-09-15', existing).length === 1);

t('mencakup seluruh sewa lama → bentrok',
  getRentalConflicts(1, '2026-08-01', '2026-10-01', existing).length === 1);

t('ujung bersentuhan (09-10 s.d. 09-11) → bentrok',
  getRentalConflicts(1, '2026-09-10', '2026-09-11', existing).length === 1);

t('satu hari di tengah → bentrok',
  getRentalConflicts(1, '2026-09-05', '2026-09-05', existing).length === 1);

t('setelah sewa selesai → aman',
  getRentalConflicts(1, '2026-09-11', '2026-09-20', existing).length === 0);

t('sebelum sewa mulai → aman',
  getRentalConflicts(1, '2026-08-01', '2026-08-31', existing).length === 0);

t('unit berbeda → tidak pernah bentrok',
  getRentalConflicts(2, '2026-09-01', '2026-09-10', existing).length === 0);

// ---------------------------------------------------------------------------
console.log('\n== Sewa yang Tidak Mengunci ==');

t('sewa COMPLETED tidak mengunci',
  getRentalConflicts(1, '2026-09-01', '2026-09-10',
    [rental({ status: 'COMPLETED' })]).length === 0);

t('sewa REJECTED tidak mengunci',
  getRentalConflicts(1, '2026-09-01', '2026-09-10',
    [rental({ status: 'REJECTED' })]).length === 0);

// ---------------------------------------------------------------------------
console.log('\n== Pengecualian Rental Sendiri (mode edit) ==');

const duaSewa = [
  rental({ id: 1, rental_code: 'RNT-001', start_date: '2026-09-01', end_date: '2026-09-10' }),
  rental({ id: 2, rental_code: 'RNT-002', start_date: '2026-09-20', end_date: '2026-09-25' }),
];

t('tanpa exclude → 2 bentrokan pada rentang lebar',
  getRentalConflicts(1, '2026-09-01', '2026-09-25', duaSewa).length === 2);

t('exclude id 1 → hanya RNT-002 yang dihitung',
  getRentalConflicts(1, '2026-09-01', '2026-09-25', duaSewa, 1).length === 1);

t('exclude id 1 → yang tersisa adalah RNT-002',
  getRentalConflicts(1, '2026-09-01', '2026-09-25', duaSewa, 1)[0]?.rentalCode === 'RNT-002');

// ---------------------------------------------------------------------------
console.log('\n== Ketahanan Data Rusak ==');

t('tanggal sewa rusak tidak mengunci unit',
  getRentalConflicts(1, '2026-09-01', '2026-09-10',
    [rental({ start_date: 'rusak', end_date: 'juga-rusak' })]).length === 0);

t('tanggal sewa kosong tidak mengunci unit',
  getRentalConflicts(1, '2026-09-01', '2026-09-10',
    [rental({ start_date: '', end_date: '' })]).length === 0);

t('rentang permintaan rusak → tidak ada bentrokan (bukan error)',
  getRentalConflicts(1, 'rusak', 'rusak', existing).length === 0);

t('daftar sewa kosong → tidak bentrok',
  getRentalConflicts(1, '2026-09-01', '2026-09-10', []).length === 0);

// ---------------------------------------------------------------------------
console.log('\n== Ketersediaan per Unit ==');

const armada = [unit(1), unit(2), unit(3, 'MAINTENANCE'), unit(4, 'RENTED')];
const sewaArmada = [
  rental({ id: 10, equipment_id: 1, start_date: '2026-09-01', end_date: '2026-09-10' }),
  rental({ id: 11, equipment_id: 4, start_date: '2026-09-01', end_date: '2026-09-05' }),
];

const avail = buildEquipmentAvailability(armada, sewaArmada, '2026-09-02', '2026-09-04');

t('jumlah entri sama dengan jumlah unit', avail.length === 4);
t('unit 1 bentrok jadwal', avail[0].blockedReason === 'DATE_CONFLICT');
t('unit 1 menyertakan rincian sewa yang bentrok', avail[0].conflicts.length === 1);
t('unit 2 tersedia', avail[1].isBookable && avail[1].blockedReason === 'AVAILABLE');
t('unit 3 diblokir status (MAINTENANCE)', avail[2].blockedReason === 'UNIT_STATUS');
t('unit 4 bentrok (meski status RENTED, yang menentukan rentang)',
  avail[3].blockedReason === 'DATE_CONFLICT');

// Unit RENTED yang periode sewa lamanya sudah lewat → tetap bisa dipesan.
const availDepan = buildEquipmentAvailability(armada, sewaArmada, '2026-12-01', '2026-12-10');
t('unit 4 (RENTED) bisa dipesan untuk Desember', availDepan[3].isBookable);
t('unit 3 (MAINTENANCE) tetap diblokir di Desember',
  availDepan[2].blockedReason === 'UNIT_STATUS');

// Rentang tidak valid → tidak ada yang bisa dipesan, tanpa menuduh unit disewa.
const availRusak = buildEquipmentAvailability(armada, sewaArmada, 'rusak', 'rusak');
t('rentang rusak → semua unit tidak bisa dipesan', availRusak.every(a => !a.isBookable));
t('rentang rusak → alasan INVALID_RANGE',
  availRusak.every(a => a.blockedReason === 'INVALID_RANGE'));

// ---------------------------------------------------------------------------
console.log('\n== Ringkasan ==');

const ringkasan = summarizeAvailability(avail);
t('total unit dihitung benar', ringkasan.total === 4);
t('yang bisa dipesan dihitung benar', ringkasan.bookable === 1);
t('bentrok jadwal dihitung benar', ringkasan.blockedByDate === 2);
t('blokir status dihitung benar', ringkasan.blockedByStatus === 1);
t('jumlah kategori sama dengan total',
  ringkasan.bookable + ringkasan.blockedByDate + ringkasan.blockedByStatus === ringkasan.total);

// ---------------------------------------------------------------------------
console.log('\n== Pesan Galat untuk Manusia ==');

const pesanKonflik = describeBlockedReason(avail[0]);
t('pesan bentrok menyebut kode unit', pesanKonflik.includes('EXC-001'));
t('pesan bentrok menyebut kode sewa', pesanKonflik.includes('RNT-001'));
t('pesan bentrok menyebut kata "dipesan"', pesanKonflik.includes('dipesan'));
t('pesan bentrok tidak mengandung NaN', !pesanKonflik.includes('NaN'));
t('pesan bentrok tidak mengandung undefined', !pesanKonflik.includes('undefined'));

const pesanStatus = describeBlockedReason(avail[2]);
t('pesan status menyebut MAINTENANCE', pesanStatus.includes('Dalam perawatan'));
t('pesan status tidak mengandung undefined', !pesanStatus.includes('undefined'));

const pesanRusak = describeBlockedReason(availRusak[0]);
t('pesan rentang rusak jelas', pesanRusak.includes('Rentang tanggal tidak valid'));

const pesanBebas = describeBlockedReason(avail[1]);
t('pesan unit tersedia menyebut "tersedia"', pesanBebas.includes('tersedia'));

// ---------------------------------------------------------------------------
console.log('\n== Data Nyata Aplikasi (regresi) ==');

const { stateStore } = await import('../.tmp_db.mjs');
const semuaUnit = stateStore.equipments;
const semuaSewa = stateStore.rentals;

t('armada seed tersedia', semuaUnit.length > 0);
t('sewa seed tersedia', semuaSewa.length > 0);

const availNyata = buildEquipmentAvailability(semuaUnit, semuaSewa, '2026-09-01', '2026-09-30');
t('hasil untuk data nyata tidak error & lengkap', availNyata.length === semuaUnit.length);
t('setiap entri punya alasan yang sah',
  availNyata.every(a =>
    ['AVAILABLE', 'UNIT_STATUS', 'DATE_CONFLICT', 'INVALID_RANGE'].includes(a.blockedReason)
  ));

// Unit yang statusnya AVAILABLE dan tidak punya sewa aktif pasti bisa dipesan.
const aktifIds = new Set(
  semuaSewa
    .filter(r => isBlockingStatus(r.status))
    .map(r => r.equipment_id)
);
t('unit AVAILABLE tanpa sewa aktif selalu bisa dipesan',
  availNyata
    .filter(a => a.equipment.status === 'AVAILABLE' && !aktifIds.has(a.equipment.id))
    .every(a => a.isBookable));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
if (fail > 0) process.exit(1);
