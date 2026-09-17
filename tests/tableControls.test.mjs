/**
 * Uji utilitas pencarian, penyaringan, dan pengurutan tabel
 * (src/lib/tableControls.ts).
 */

const {
  normalisasiTeks,
  cocokPencarian,
  bandingkanNilai,
  urutkanBaris,
  sortBerikutnya,
  saringSamaDengan,
  saringRentangTanggal,
  ringkasFilter,
} = await import('../.tmp_tableControls.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

// --- Normalisasi --------------------------------------------------------
t('Teks dinormalkan jadi huruf kecil rapat', normalisasiTeks('  Excavator   KOMATSU ') === 'excavator komatsu');
t('Nilai null jadi string kosong', normalisasiTeks(null) === '');

// --- Pencarian multi kata ----------------------------------------------
const baris = { nama: 'Excavator Komatsu PC200', penyewa: 'Ahmad Rizky', kode: 'EXC-01' };
const fields = [(r) => r.nama, (r) => r.penyewa, (r) => r.kode];

t('Kueri kosong meloloskan semua baris', cocokPencarian(baris, '   ', fields));
t('Kata dari kolom berbeda tetap cocok (logika AND)', cocokPencarian(baris, 'excavator ahmad', fields));
t('Kata yang tidak ada membuat baris tersaring', !cocokPencarian(baris, 'excavator budi', fields));
t('Pencarian tidak peka huruf besar/kecil', cocokPencarian(baris, 'KOMATSU', fields));

// --- Perbandingan nilai -------------------------------------------------
t('Angka dibandingkan secara numerik', bandingkanNilai(9, 100) < 0);
t('Tanggal ISO urut kronologis', bandingkanNilai('2026-01-05', '2026-02-01') < 0);
t('Nilai kosong selalu ditempatkan di akhir', bandingkanNilai(null, 'A') > 0);

// --- Pengurutan ---------------------------------------------------------
const data = [
  { kode: 'C', hm: 300 },
  { kode: 'A', hm: 1200 },
  { kode: 'B', hm: 50 },
];
const accessors = { kode: (r) => r.kode, hm: (r) => r.hm };

const naik = urutkanBaris(data, { key: 'hm', direction: 'asc' }, accessors);
t('Urut naik berdasarkan angka', naik.map((r) => r.hm).join(',') === '50,300,1200');

const turun = urutkanBaris(data, { key: 'kode', direction: 'desc' }, accessors);
t('Urut turun berdasarkan teks', turun.map((r) => r.kode).join(',') === 'C,B,A');

t('Tanpa sort, urutan asli dipertahankan', urutkanBaris(data, null, accessors).map((r) => r.kode).join(',') === 'C,A,B');
t('Kunci tak dikenal tidak mengubah urutan', urutkanBaris(data, { key: 'xx', direction: 'asc' }, accessors)[0].kode === 'C');
t('Data sumber tidak dimutasi', data[0].kode === 'C');

// --- Siklus klik header -------------------------------------------------
const s1 = sortBerikutnya(null, 'kode');
const s2 = sortBerikutnya(s1, 'kode');
const s3 = sortBerikutnya(s2, 'kode');
t('Klik pertama mengurutkan naik', s1.direction === 'asc');
t('Klik kedua mengurutkan turun', s2.direction === 'desc');
t('Klik ketiga mematikan urutan', s3 === null);
t('Ganti kolom kembali ke urut naik', sortBerikutnya(s2, 'hm').key === 'hm');

// --- Filter -------------------------------------------------------------
t('Pilihan SEMUA melewatkan filter', saringSamaDengan('AVAILABLE', 'SEMUA'));
t('Filter kesamaan menolak nilai berbeda', !saringSamaDengan('RENTED', 'AVAILABLE'));
t('Rentang tanggal inklusif di batas bawah', saringRentangTanggal('2026-01-01', '2026-01-01', '2026-01-31'));
t('Tanggal di luar rentang ditolak', !saringRentangTanggal('2026-02-05', '2026-01-01', '2026-01-31'));
t('Batas kosong diabaikan', saringRentangTanggal('2026-05-09', '', ''));
t('Ringkasan filter menampilkan yang aktif saja', ringkasFilter({ Status: 'AVAILABLE', Jenis: 'SEMUA' }) === 'Status: AVAILABLE');
t('Tanpa filter aktif diberi label jelas', ringkasFilter({ Status: 'SEMUA' }) === 'Tanpa filter');

console.log(`\nRingkasan tableControls: ${pass} lulus, ${fail} gagal.`);
if (fail > 0) process.exit(1);
