/**
 * Uji mesin 11 laporan operasional (src/lib/reports.ts).
 *
 * Fokus:
 *   1. Setiap id laporan menghasilkan struktur yang sah (kolom, baris, ringkasan)
 *   2. Filter rentang tanggal benar-benar mempersempit data
 *   3. Nilai uang diekspor mentah ke CSV (bisa dijumlahkan di Excel)
 *   4. Ekspor CSV aman dari karakter khusus (koma, kutip, baris baru)
 *   5. Nama berkas mengikuti format Laporan_<jenis>_<YYYY-MM-DD>.csv
 */

const { stateStore } = await import('../.tmp_db.mjs');
const rep = await import('../.tmp_reports.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

/** Sumber data laporan dari state nyata (hasil seedGenerator). */
const source = {
  rentals: stateStore.rentals,
  equipments: stateStore.equipments,
  users: stateStore.users,
  payments: stateStore.payments,
  maintenance: stateStore.maintenance,
  gps: stateStore.gps,
  reports: stateStore.reports,
};

// ---------------------------------------------------------------------------
console.log('\n== Katalog Laporan ==');
t('ada tepat 11 laporan', rep.REPORT_CATALOG.length === 11);

const ids = rep.REPORT_CATALOG.map((r) => r.id);
t('id laporan unik', new Set(ids).size === ids.length);
t('katalog lengkap berisi id laporan yang dikenal', ids.every((id) => rep.isReportId(id)));
t('id asing tidak dikenali', !rep.isReportId('LAPORAN_TIDAK_ADA'));
t('id bukan string tidak dikenali', !rep.isReportId(123) && !rep.isReportId(null));

// ---------------------------------------------------------------------------
console.log('\n== Struktur 11 Laporan ==');
for (const def of rep.REPORT_CATALOG) {
  const hasil = rep.buildReport(def.id, source);
  const kolomLengkap = hasil.columns.every(
    (c) => typeof c.key === 'string' && c.key !== '' && typeof c.label === 'string' && c.label !== ''
  );
  const barisSesuaiKolom = hasil.rows.every((row) => row.length === hasil.columns.length);
  const nilaiValid = hasil.rows.every((row) =>
    row.every((cell) => typeof cell === 'string' || typeof cell === 'number')
  );

  t(`${def.id}: kolom & baris valid`, kolomLengkap && barisSesuaiKolom && nilaiValid);
  t(`${def.id}: punya minimal 1 ringkasan`, hasil.summaries.length > 0);
  t(`${def.id}: judul sama dengan katalog`, hasil.title === def.title);
  t(`${def.id}: totalRows sama dengan jumlah baris`, hasil.totalRows === hasil.rows.length);
}

// ---------------------------------------------------------------------------
console.log('\n== Data Tampil Nyata (bukan mock kosong) ==');
const rentalBulanan = rep.buildReport('RENTAL_BULANAN', source);
t('laporan rental bulanan tidak kosong', rentalBulanan.rows.length > 0);
t('laporan rental punya 50 baris transaksi', rentalBulanan.rows.length === source.rentals.length);

const pembayaran = rep.buildReport('PEMBAYARAN_PIUTANG', source);
t('laporan pembayaran tidak kosong', pembayaran.rows.length > 0);

const utilitas = rep.buildReport('UTILISASI_HM', source);
t('laporan utilisasi mencakup seluruh unit', utilitas.rows.length === source.equipments.length);

const audit = rep.buildReport('AUDIT_TRAIL', source);
t('laporan audit trail tidak kosong', audit.rows.length > 0);

// ---------------------------------------------------------------------------
console.log('\n== Filter Rentang Tanggal ==');
const rentang = rep.normalizeRange('2026-01-01', '2026-01-31');
t('rentang valid dipertahankan', rentang.from === '2026-01-01' && rentang.to === '2026-01-31');
t('format tanggal tidak valid dibuang', rep.normalizeRange('kemarin', 'besok').from === '');
t('from > to ditukar otomatis', rep.normalizeRange('2026-03-01', '2026-01-01').from === '2026-01-01');
t('rentang kosong = tanpa batas', rep.EMPTY_RANGE.from === '' && rep.EMPTY_RANGE.to === '');

// Ambil satu bulan nyata dari data sewa, lalu pastikan filter menyempitkan hasil.
const hariSewa = source.rentals.map((r) => String(r.start_date).slice(0, 10)).sort();
const bulan = hariSewa[Math.floor(hariSewa.length / 2)].slice(0, 7);
const batas = rep.normalizeRange(`${bulan}-01`, `${bulan}-31`);
const terfilter = rep.buildReport('RENTAL_BULANAN', source, batas);

t('filter bulan menghasilkan lebih sedikit baris', terfilter.rows.length < rentalBulanan.rows.length);
t('filter bulan tidak menghasilkan baris di luar rentang',
  terfilter.rows.every((row) => {
    const mulai = String(row[3]);
    return mulai >= batas.from && mulai <= batas.to;
  })
);
t('label periode menampilkan rentang yang dipilih', !terfilter.periodLabel.includes('Semua periode'));
t('label periode memuat tahun rentang', terfilter.periodLabel.includes(bulan.slice(0, 4)));
t('label periode memuat pemisah rentang', terfilter.periodLabel.includes('–'));
t('label periode tanpa filter = "Semua periode"', rentalBulanan.periodLabel === 'Semua periode');

// Rentang yang pasti kosong harus menghasilkan nol baris, bukan error.
const kosong = rep.normalizeRange('1990-01-01', '1990-01-02');
t('rentang tanpa data menghasilkan 0 baris', rep.buildReport('RENTAL_BULANAN', source, kosong).rows.length === 0);
t('ringkasan tetap tersedia walau data kosong',
  rep.buildReport('RENTAL_BULANAN', source, kosong).summaries.length > 0);

// ---------------------------------------------------------------------------
console.log('\n== Format Sel ==');
t('format currency menghasilkan Rupiah', rep.formatCell(1500000, 'currency').startsWith('Rp'));
t('format integer memakai pemisah ribuan Indonesia', rep.formatCell(1234567, 'integer').includes('.'));
t('format date menghasilkan nama bulan Indonesia', /Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember/.test(rep.formatCell('2026-09-09', 'date')));
t('format text mengembalikan nilai apa adanya', rep.formatCell('BAST OUT', 'text') === 'BAST OUT');
t('nilai null pada teks tidak menghasilkan "null"', rep.formatCell('', 'text') === '');

// ---------------------------------------------------------------------------
console.log('\n== Ekspor CSV ==');
const csv = rep.buildCsv(rentalBulanan);
const barisCsv = csv.split('\r\n');

t('CSV diawali BOM UTF-8 (agar Excel baca karakter Indonesia)', csv.charCodeAt(0) === 0xfeff);
t('baris pertama adalah judul laporan', barisCsv[0].replace(/^\uFEFF/, '') === rentalBulanan.title);
t('baris ketiga berisi header kolom', barisCsv[3] === rentalBulanan.columns.map((c) => c.label).join(';'));
t('jumlah baris CSV = 4 metadata + data + ringkasan',
  barisCsv.length >= 4 + rentalBulanan.rows.length + rentalBulanan.summaries.length);

// Angka harus diekspor mentah: tanpa "Rp" dan tanpa titik ribuan.
const kolomUang = rentalBulanan.columns.findIndex((c) => c.format === 'currency');
const barisPertama = csv.split('\r\n')[4].split(';');
t('nilai uang diekspor tanpa awalan "Rp"', !barisPertama[kolomUang].includes('Rp'));
t('nilai uang diekspor tanpa titik ribuan', !barisPertama[kolomUang].includes('.'));
t('nilai uang diekspor sebagai angka murni', /^-?\d+$/.test(barisPertama[kolomUang]));

// Escape karakter khusus: nilai mengandung titik koma, kutip ganda, dan baris baru.
const hasilKhusus = {
  ...rentalBulanan,
  rows: [['A;B', 'Kata "penting"', 'baris\nsatu', 1000, 1, 2, 3, 'Status']],
};
const csvKhusus = rep.buildCsv(hasilKhusus);
t('nilai dengan titik koma diapit tanda kutip', csvKhusus.includes('"A;B"'));
t('kutip ganda di dalam nilai digandakan', csvKhusus.includes('"Kata ""penting"""'));
t('baris baru di dalam nilai diapit tanda kutip', /"baris\nsatu"/.test(csvKhusus));

// ---------------------------------------------------------------------------
console.log('\n== Nama Berkas Ekspor ==');
const nama = rep.buildCsvFilename(rentalBulanan, new Date('2026-09-09T00:00:00Z'));
t('nama berkas diawali "Laporan_"', nama.startsWith('Laporan_'));
t('nama berkas berakhiran .csv', nama.endsWith('.csv'));
t('nama berkas memuat tanggal YYYY-MM-DD', nama.includes('2026-09-09'));
t('nama berkas memuat jenis laporan', nama.includes('Rental_Bulanan'));
t('nama berkas tidak mengandung spasi', !nama.includes(' '));

// ---------------------------------------------------------------------------
console.log('\n== Ketahanan terhadap Data Rusak ==');
const sumberKosong = {
  rentals: [], equipments: [], users: [], payments: [],
  maintenance: [], gps: [], reports: [],
};
let gagal = false;
for (const def of rep.REPORT_CATALOG) {
  try {
    rep.buildReport(def.id, sumberKosong);
  } catch {
    gagal = true;
  }
}
t('semua laporan aman dengan sumber data kosong', !gagal);
t('laporan kosong punya 0 baris', rep.buildReport('RENTAL_BULANAN', sumberKosong).rows.length === 0);
t('CSV dari laporan kosong tetap punya header', rep.buildCsv(rep.buildReport('RENTAL_BULANAN', sumberKosong)).split('\r\n').length >= 4);

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
