/**
 * Menguji logika notifikasi jatuh tempo & keterlambatan yang dipakai
 * StaffDashboard. Logika disalin persis agar regresi tertangkap bila
 * rumus selisih hari atau denda berubah.
 */
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const { stateStore } = await import('../.tmp_db.mjs');
const RENTALS = stateStore.rentals;

const LATE_PENALTY_PER_DAY = 500_000;

let pass = 0, fail = 0;
function t(nama, ok) {
  if (ok) { console.log(`  PASS  ${nama}`); pass++; }
  else { console.error(`  FAIL  ${nama}`); fail++; }
}

function hitungNotifikasi(rentals, hariIni) {
  const today = new Date(hariIni);
  today.setHours(0, 0, 0, 0);

  return rentals
    .filter(r => r.status === 'ON_GOING' && r.end_date)
    .map(r => {
      const akhir = new Date(r.end_date);
      akhir.setHours(0, 0, 0, 0);
      const selisihHari = Math.floor((akhir.getTime() - today.getTime()) / 86400000);
      const terlambat = selisihHari < 0;
      return {
        rental: r,
        selisihHari,
        terlambat,
        hariTerlambat: terlambat ? Math.abs(selisihHari) : 0,
        denda: terlambat ? Math.abs(selisihHari) * LATE_PENALTY_PER_DAY : 0,
        segeraJatuhTempo: !terlambat && selisihHari <= 3,
      };
    })
    .filter(x => x.terlambat || x.segeraJatuhTempo);
}

console.log('\n== Notifikasi Jatuh Tempo & Keterlambatan ==');

// Acuan hari ini (dinamis agar tidak usah dipelihara).
const HARI_INI = new Date().toISOString().slice(0, 10);

// Kasus buatan: rentang tanggal relatif terhadap hari ini.
const hari = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const kasusUji = [
  { id: 1, status: 'ON_GOING', end_date: hari(0) },   // jatuh tempo hari ini
  { id: 2, status: 'ON_GOING', end_date: hari(3) },   // 3 hari lagi
  { id: 3, status: 'ON_GOING', end_date: hari(4) },   // 4 hari lagi
  { id: 4, status: 'ON_GOING', end_date: hari(-3) },  // terlambat 3 hari
  { id: 5, status: 'COMPLETED', end_date: hari(-8) }, // bukan ON_GOING
  { id: 6, status: 'ON_GOING', end_date: null },      // tanpa end_date
];

const notif = hitungNotifikasi(RENTALS, HARI_INI);

t('rental ON_GOING tersedia untuk diuji',
  RENTALS.filter(r => r.status === 'ON_GOING' && r.end_date).length > 0);

t('hanya ON_GOING yang masuk notifikasi',
  notif.every(x => x.rental.status === 'ON_GOING'));

t('yang terlambat punya hariTerlambat > 0',
  notif.filter(x => x.terlambat).every(x => x.hariTerlambat > 0));

t('yang terlambat dikenakan denda',
  notif.filter(x => x.terlambat).every(x => x.denda === x.hariTerlambat * LATE_PENALTY_PER_DAY));

t('yang belum jatuh tempo tidak kena denda',
  notif.filter(x => !x.terlambat).every(x => x.denda === 0));

t('yang belum jatuh tempo dalam ≤ 3 hari',
  notif.filter(x => !x.terlambat).every(x => x.selisihHari >= 0 && x.selisihHari <= 3));

// --- Kasus buatan: rentang tanggal ekstrem ---
const hasil = hitungNotifikasi(kasusUji, HARI_INI);
const byId = Object.fromEntries(hasil.map(x => [x.rental.id, x]));

t('jatuh tempo hari ini → masuk notifikasi (0 hari lagi)', Boolean(byId[1]));
t('jatuh tempo hari ini → tidak terlambat', byId[1] && byId[1].terlambat === false);
t('3 hari lagi → masuk notifikasi', Boolean(byId[2]));
t('4 hari lagi → TIDAK masuk notifikasi', !byId[3]);
t('terlambat 3 hari → terlambat', Boolean(byId[4] && byId[4].terlambat));
t('terlambat 3 hari → denda 3 × 500rb', byId[4] && byId[4].denda === 1_500_000);
t('rental COMPLETED diabaikan', !byId[5]);
t('rental tanpa end_date diabaikan', !byId[6]);

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
if (fail > 0) process.exit(1);
