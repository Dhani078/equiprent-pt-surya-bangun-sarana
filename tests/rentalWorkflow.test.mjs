/**
 * Uji mesin alur status penyewaan (src/lib/rentalWorkflow.ts) + T-0006.
 *
 * Fokus:
 *   1. Matriks transisi — lompatan status & status akhir ditolak.
 *   2. Denda keterlambatan — konsisten dengan tarif, aman pada data rusak.
 *   3. Dampak terhadap unit — kunci RENTED hanya saat ON_GOING.
 *   4. Konsistensi dengan data nyata — semua rental seed lolos uji denda.
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const wf = await import('../.tmp_rentalWorkflow.mjs');
const br = await import('../.tmp_businessRules.mjs');
const { stateStore } = await import('../.tmp_db.mjs');
const S = stateStore;

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

// ---------------------------------------------------------------------------
console.log('\n== Validasi Status ==');
t('PENDING dikenali', wf.isRentalStatus('PENDING'));
t('ON_GOING dikenali', wf.isRentalStatus('ON_GOING'));
t('status palsu ditolak', !wf.isRentalStatus('SELESAI'));
t('huruf kecil ditolak', !wf.isRentalStatus('pending'));
t('angka ditolak', !wf.isRentalStatus(1));
t('null ditolak', !wf.isRentalStatus(null));
t('daftar status = 5', wf.RENTAL_STATUSES.length === 5);
t('setiap status punya label', wf.RENTAL_STATUSES.every(s =>
  typeof wf.getRentalStatusLabel(s) === 'string' && wf.getRentalStatusLabel(s).length > 0));
t('setiap status punya tone', wf.RENTAL_STATUSES.every(s =>
  ['neutral', 'info', 'success', 'warning', 'danger'].includes(wf.getRentalStatusTone(s))));

// ---------------------------------------------------------------------------
console.log('\n== Matriks Transisi yang Diizinkan ==');
const boleh = (a, b) => wf.canTransition(a, b).allowed;

t('PENDING → APPROVED diizinkan', boleh('PENDING', 'APPROVED'));
t('PENDING → REJECTED diizinkan', boleh('PENDING', 'REJECTED'));
t('PENDING → ON_GOING DITOLAK (wajib disetujui dulu)', !boleh('PENDING', 'ON_GOING'));
t('PENDING → COMPLETED DITOLAK (loncat status)', !boleh('PENDING', 'COMPLETED'));
t('APPROVED → ON_GOING diizinkan', boleh('APPROVED', 'ON_GOING'));
t('APPROVED → REJECTED diizinkan', boleh('APPROVED', 'REJECTED'));
t('APPROVED → PENDING DITOLAK (tidak bisa mundur)', !boleh('APPROVED', 'PENDING'));
t('APPROVED → COMPLETED DITOLAK (loncat status)', !boleh('APPROVED', 'COMPLETED'));
t('ON_GOING → COMPLETED diizinkan', boleh('ON_GOING', 'COMPLETED'));
t('ON_GOING → REJECTED DITOLAK (unit sedang di tangan pelanggan)', !boleh('ON_GOING', 'REJECTED'));
t('ON_GOING → PENDING DITOLAK', !boleh('ON_GOING', 'PENDING'));
t('COMPLETED adalah status akhir', wf.getAllowedNextStatuses('COMPLETED').length === 0);
t('REJECTED adalah status akhir', wf.getAllowedNextStatuses('REJECTED').length === 0);
t('COMPLETED → ON_GOING ditolak', !boleh('COMPLETED', 'ON_GOING'));
t('REJECTED → PENDING ditolak', !boleh('REJECTED', 'PENDING'));

console.log('\n== Transisi ke Status yang Sama ==');
const sama = wf.canTransition('APPROVED', 'APPROVED');
t('status sama ditolak', !sama.allowed);
t('pesan menyebut sudah berstatus', !sama.allowed && sama.reason.includes('sudah'));

console.log('\n== Pesan Penolakan ==');
const loncat = wf.canTransition('PENDING', 'COMPLETED');
t('penolakan punya alasan', !loncat.allowed && loncat.reason.length > 0);
t('alasan menyebut kedua status', !loncat.allowed &&
  loncat.reason.includes('Menunggu Persetujuan') && loncat.reason.includes('Selesai'));

// ---------------------------------------------------------------------------
console.log('\n== Dampak Transisi terhadap Unit ==');
t('ON_GOING mengunci unit RENTED', wf.getTransitionEffect('ON_GOING').equipmentStatus === 'RENTED');
t('COMPLETED membebaskan unit', wf.getTransitionEffect('COMPLETED').equipmentStatus === 'AVAILABLE');
t('REJECTED membebaskan unit', wf.getTransitionEffect('REJECTED').equipmentStatus === 'AVAILABLE');
t('APPROVED belum mengunci unit', wf.getTransitionEffect('APPROVED').equipmentStatus === null);
t('PENDING tidak menyentuh unit', wf.getTransitionEffect('PENDING').equipmentStatus === null);

console.log('\n== Status Pengunci Unit ==');
t('PENDING mengunci unit', wf.isRentalLocking('PENDING'));
t('APPROVED mengunci unit', wf.isRentalLocking('APPROVED'));
t('ON_GOING mengunci unit', wf.isRentalLocking('ON_GOING'));
t('COMPLETED tidak mengunci', !wf.isRentalLocking('COMPLETED'));
t('REJECTED tidak mengunci', !wf.isRentalLocking('REJECTED'));

// ---------------------------------------------------------------------------
console.log('\n== Denda Keterlambatan ==');
const r1 = { status: 'ON_GOING', start_date: '2026-09-01', end_date: '2026-09-05' };
const pada = new Date('2026-09-08T00:00:00Z');

const telat = wf.getLateReturnInfo(r1, { referenceAt: pada });
console.log(`  hari telat: ${telat.lateDays} · denda: ${br.formatRupiah(telat.penalty)}`);
t('lewat 3 hari → 3 hari telat', telat.lateDays === 3);
t('denda = hari x tarif', telat.penalty === 3 * br.LATE_PENALTY_PER_DAY);
t('ditandai terlambat', telat.isLate === true);

const tepat = wf.getLateReturnInfo(r1, { referenceAt: new Date('2026-09-05T00:00:00Z') });
t('kembali tepat waktu → 0 hari', tepat.lateDays === 0);
t('kembali tepat waktu → denda 0', tepat.penalty === 0);
t('kembali tepat waktu → tidak terlambat', tepat.isLate === false);

const sebelum = wf.getLateReturnInfo(r1, { referenceAt: new Date('2026-09-02T00:00:00Z') });
t('kembali lebih awal → denda 0', sebelum.penalty === 0);

console.log('\n== Denda: Status yang Tidak Dikenakan Denda ==');
t('PENDING tidak kena denda', wf.getLateReturnInfo(
  { status: 'PENDING', start_date: '2026-09-01', end_date: '2026-09-05' },
  { referenceAt: pada }
).penalty === 0);
t('REJECTED tidak kena denda', wf.getLateReturnInfo(
  { status: 'REJECTED', start_date: '2026-09-01', end_date: '2026-09-05' },
  { referenceAt: pada }
).penalty === 0);
t('APPROVED tidak kena denda (belum berjalan)', wf.getLateReturnInfo(
  { status: 'APPROVED', start_date: '2026-09-01', end_date: '2026-09-05' },
  { referenceAt: pada }
).penalty === 0);

console.log('\n== Denda: Ketahanan terhadap Data Rusak ==');
t('end_date rusak → denda 0', wf.getLateReturnInfo(
  { status: 'ON_GOING', start_date: '2026-09-01', end_date: 'bukan-tanggal' },
  { referenceAt: pada }
).penalty === 0);
t('end_date kosong → denda 0', wf.getLateReturnInfo(
  { status: 'ON_GOING', start_date: '2026-09-01', end_date: '' },
  { referenceAt: pada }
).penalty === 0);
t('COMPLETED tanpa returnDate → pakai end_date (0 denda)', wf.getLateReturnInfo(
  { status: 'COMPLETED', start_date: '2026-09-01', end_date: '2026-09-05' }
).penalty === 0);
t('COMPLETED dengan returnDate telat → kena denda', wf.getLateReturnInfo(
  { status: 'COMPLETED', start_date: '2026-09-01', end_date: '2026-09-05' },
  { returnDate: '2026-09-07' }
).lateDays === 2);
t('denda tidak pernah negatif', wf.getLateReturnInfo(
  { status: 'ON_GOING', start_date: '2026-09-01', end_date: '2026-12-31' },
  { referenceAt: pada }
).penalty >= 0);

// ---------------------------------------------------------------------------
console.log('\n== Ringkasan Denda Kolektif ==');
const contoh = [
  { status: 'ON_GOING', start_date: '2026-09-01', end_date: '2026-09-05' },
  { status: 'ON_GOING', start_date: '2026-09-01', end_date: '2026-09-07' },
  { status: 'ON_GOING', start_date: '2026-09-01', end_date: '2026-09-30' },
  { status: 'COMPLETED', start_date: '2026-09-01', end_date: '2026-09-02' },
  { status: 'PENDING', start_date: '2026-09-01', end_date: '2026-09-02' },
];
const ringkas = wf.summarizeLatePenalties(contoh, pada);
console.log(`  terlambat: ${ringkas.lateCount} · total: ${br.formatRupiah(ringkas.penaltyTotal)}`);
t('hanya ON_GOING yang dihitung', ringkas.lateCount === 2);
t('total = (3 + 1) x tarif', ringkas.penaltyTotal === 4 * br.LATE_PENALTY_PER_DAY);
t('koleksi kosong → 0', wf.summarizeLatePenalties([], pada).penaltyTotal === 0);
t('koleksi tanpa status → 0', wf.summarizeLatePenalties(
  [{ status: 'COMPLETED', start_date: '2026-09-01', end_date: '2026-09-02' }], pada
).penaltyTotal === 0);

// ---------------------------------------------------------------------------
console.log('\n== Konsistensi dengan Data Nyata (50 rental seed) ==');
const ringkasNyata = wf.summarizeLatePenalties(S.rentals);
console.log(`  rental ON_GOING terlambat: ${ringkasNyata.lateCount} · total denda: ${br.formatRupiah(ringkasNyata.penaltyTotal)}`);
t('setiap rental punya status yang dikenali', S.rentals.every(r => wf.isRentalStatus(r.status)));
t('denda merupakan kelipatan tarif', ringkasNyata.penaltyTotal % br.LATE_PENALTY_PER_DAY === 0);
t('denda tidak negatif', ringkasNyata.penaltyTotal >= 0);
t('jumlah terlambat <= jumlah ON_GOING',
  ringkasNyata.lateCount <= S.rentals.filter(r => r.status === 'ON_GOING').length);
t('rental COMPLETED tidak dihitung sebagai terlambat',
  !S.rentals.some(r => r.status === 'COMPLETED' && wf.getLateReturnInfo(r).isLate));

console.log('\n== countLateDays (helper bersama) ==');
t('tanpa tanggal kembali → 0', br.countLateDays('2026-09-05', null) === 0);
t('tanggal kembali kosong → 0', br.countLateDays('2026-09-05', '') === 0);
t('lewat 1 hari → 1', br.countLateDays('2026-09-05', '2026-09-06') === 1);
t('tanggal rusak → 0', br.countLateDays('xyz', '2026-09-06') === 0);
t('kalender konsisten dengan calculateRentalCost', (() => {
  const biaya = br.calculateRentalCost(1_000_000, '2026-09-01', '2026-09-05', '2026-09-08');
  return biaya.lateDays === 3 && biaya.penalty === 3 * br.LATE_PENALTY_PER_DAY;
})());

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
