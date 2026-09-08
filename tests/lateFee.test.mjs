/**
 * Verifikasi perhitungan denda keterlambatan pada halaman Laporan.
 * Logika disalin persis dari ReportsPage.tsx agar perilakunya identik.
 *
 * Tujuannya memastikan angka denda TIDAK selalu 0 dan tidak meledak
 * melewati batas kewajaran.
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const br = await import('../.tmp_businessRules.mjs');
const { stateStore } = await import('../.tmp_db.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

function hitungRingkasan(rentals, sekarang = Date.now()) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const diproses = rentals.filter(r => r.status === 'COMPLETED' || r.status === 'ON_GOING');
  const pendapatanKotor = diproses.reduce((s, r) => s + Number(r.subtotal), 0);
  let totalDenda = 0;
  let terlambat = 0;
  for (const r of diproses) {
    if (r.status !== 'ON_GOING') continue;
    const batas = new Date(r.end_date).getTime();
    if (!Number.isFinite(batas) || sekarang <= batas) continue;
    const hariTelat = Math.ceil((sekarang - batas) / MS_PER_DAY);
    if (hariTelat <= 0) continue;
    terlambat += 1;
    totalDenda += hariTelat * br.LATE_PENALTY_PER_DAY;
  }
  return { pendapatanKotor, totalDenda, terlambat, totalTransaksi: diproses.length };
}

const S = stateStore;
console.log('\n== Tarif Denda ==');
console.log(`  LATE_PENALTY_PER_DAY = ${br.LATE_PENALTY_PER_DAY}`);
t('tarif denda = 500.000', br.LATE_PENALTY_PER_DAY === 500000);

console.log('\n== Ringkasan dengan Data Nyata ==');
const r = hitungRingkasan(S.rentals);
console.log(`  transaksi diproses : ${r.totalTransaksi}`);
console.log(`  pendapatan kotor   : ${br.formatRupiah(r.pendapatanKotor)}`);
console.log(`  unit terlambat     : ${r.terlambat}`);
console.log(`  total denda        : ${br.formatRupiah(r.totalDenda)}`);

t('pendapatan kotor > 0', r.pendapatanKotor > 0);
t('pendapatan kotor masuk akal (< 100 M)', r.pendapatanKotor < 100_000_000_000);
t('transaksi diproses > 0', r.totalTransaksi > 0);
t('denda tidak negatif', r.totalDenda >= 0);
t('jumlah terlambat <= total transaksi', r.terlambat <= r.totalTransaksi);
t('denda konsisten = hari x tarif', r.totalDenda % br.LATE_PENALTY_PER_DAY === 0);

console.log('\n== Uji Batas (edge case) ==');
const dummy = [
  { id: 1, status: 'ON_GOING', end_date: '2026-09-01', subtotal: 1000 },
  { id: 2, status: 'COMPLETED', end_date: '2026-09-01', subtotal: 2000 },
];
const pada = new Date('2026-09-04').getTime();
const e = hitungRingkasan(dummy, pada);
t('ON_GOING lewat 3 hari → 3 x tarif', e.totalDenda === 3 * br.LATE_PENALTY_PER_DAY);
t('COMPLETED tidak kena denda', e.terlambat === 1);
t('subtotal tetap dijumlah', e.pendapatanKotor === 3000);

const tepat = hitungRingkasan(
  [{ id: 3, status: 'ON_GOING', end_date: '2026-09-04', subtotal: 0 }],
  pada
);
t('kembali tepat waktu → denda 0', tepat.totalDenda === 0);

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
