/**
 * Uji modul ekspor tabel (src/lib/tableExport.ts).
 *
 * Fokus pada fungsi murni: pembentukan CSV, pelolosan karakter berbahaya,
 * penamaan berkas, dan kelengkapan HTML cetak.
 */

const { buildCsv, escapeCsvCell, escapeHtml, buildExportFilename, buildPrintHtml, buildExcelHtml } =
  await import('../.tmp_tableExport.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

const baris = [
  { kode: 'EXC-01', nama: 'Excavator Komatsu', harga: 5000000 },
  { kode: 'BUL-02', nama: 'Bulldozer; Cat D6', harga: 7500000 },
];

const kolom = [
  { header: 'Kode', value: (r) => r.kode },
  { header: 'Nama', value: (r) => r.nama },
  { header: 'Harga', value: (r) => r.harga, numeric: true },
];

// --- CSV ---------------------------------------------------------------
const csv = buildCsv(baris, kolom);
const barisCsv = csv.trim().split('\n');

t('CSV memuat baris header + seluruh data', barisCsv.length === 3);
t('CSV header memakai judul kolom', barisCsv[0].includes('Kode') && barisCsv[0].includes('Harga'));
t('Sel bernilai pemisah dikutip agar tidak memecah kolom', barisCsv[2].includes('"Bulldozer; Cat D6"'));
t('CSV memakai titik koma sebagai pemisah kolom', barisCsv[0].includes('Kode;Nama;Harga'));

// --- Pelolosan karakter -------------------------------------------------
t('Tanda kutip ganda digandakan sesuai RFC 4180', escapeCsvCell('dia bilang "ya"') === '"dia bilang ""ya"""');
t('Sel biasa tidak dikutip tanpa perlu', escapeCsvCell('Komatsu') === 'Komatsu');
t('Formula CSV dinetralkan (anti CSV injection)', escapeCsvCell('=1+1').startsWith("'"));
t('HTML khusus dilolosi', escapeHtml('<b>&"x"</b>').includes('&lt;b&gt;'));

// --- Nama berkas --------------------------------------------------------
const nama = buildExportFilename('daftar unit', 'csv', new Date('2026-03-04T05:06:07Z'));
t('Nama berkas berakhiran .csv', nama.endsWith('.csv'));
t('Nama berkas tidak mengandung spasi', !nama.includes(' '));
t('Nama berkas memuat tanggal', /2026/.test(nama));

// --- HTML cetak & Excel -------------------------------------------------
const html = buildPrintHtml(baris, kolom, { title: 'Daftar Unit' }, '04/03/2026');
t('HTML cetak memuat judul dokumen', html.includes('Daftar Unit'));
t('HTML cetak memuat kop perusahaan', html.includes('SURYA BANGUN SARANA'));
t('HTML cetak memuat seluruh baris data', html.includes('EXC-01') && html.includes('BUL-02'));

const xls = buildExcelHtml(baris, kolom, { title: 'Daftar Unit' }, '04/03/2026');
t('HTML Excel berupa tabel utuh', xls.includes('<table') && xls.includes('</table>'));

console.log(`\nRingkasan tableExport: ${pass} lulus, ${fail} gagal.`);
if (fail > 0) process.exit(1);
