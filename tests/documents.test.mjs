/**
 * Uji modul dokumen resmi (BAST OUT / BAST IN / Surat Jalan).
 *
 * Fokus:
 *   - penomoran dokumen & nama berkas,
 *   - perbedaan rincian tiap jenis dokumen,
 *   - perhitungan denda keterlambatan pada BAST IN,
 *   - escaping HTML (nama pelanggan dengan karakter berbahaya),
 *   - struktur berkas HTML A4 siap cetak,
 *   - ketahanan terhadap data kosong / tidak valid.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const doc = await import('../.tmp_documents.mjs');
const { stateStore } = await import('../.tmp_db.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

/**
 * Transaksi contoh. Dibuat eksplisit (bukan diambil mentah dari stateStore)
 * karena `rentals` di dalam store tidak membawa nama pelanggan — padahal
 * rincian itulah yang diuji pada dokumen.
 */
const rental = {
  ...stateStore.rentals[0],
  customer_name: 'Budi Santoso',
  company_name: 'PT. Aneka Tambang Kalimantan',
};
const equipment = stateStore.equipments.find((e) => e.id === rental.equipment_id) ?? null;
const TANGGAL_TETAP = '2026-05-05T10:30:00.000Z';

// ---------------------------------------------------------------------------
console.log('\n== Konstanta & Penomoran Dokumen ==');
t('tiga jenis dokumen terdaftar', doc.DOCUMENT_KINDS.length === 3);
t('urutan: BAST_OUT, BAST_IN, SURAT_JALAN',
  doc.DOCUMENT_KINDS[0] === 'BAST_OUT' &&
  doc.DOCUMENT_KINDS[1] === 'BAST_IN' &&
  doc.DOCUMENT_KINDS[2] === 'SURAT_JALAN');

t('isDocumentKind menerima BAST_IN', doc.isDocumentKind('BAST_IN') === true);
t('isDocumentKind menolak FINANCIAL_SUMMARY', doc.isDocumentKind('FINANCIAL_SUMMARY') === false);
t('isDocumentKind menolak string kosong', doc.isDocumentKind('') === false);

t('documentKindFromReportType(BAST_OUT) → BAST_OUT',
  doc.documentKindFromReportType('BAST_OUT') === 'BAST_OUT');
t('documentKindFromReportType(FINANCIAL_SUMMARY) → null',
  doc.documentKindFromReportType('FINANCIAL_SUMMARY') === null);

const kodeOut = doc.buildDocumentCode('BAST_OUT', '2026-05-05T10:30:00.000Z', 1);
t(`kode BAST_OUT = REP-BASTOUT-20260505-001 (dapat ${kodeOut})`,
  kodeOut === 'REP-BASTOUT-20260505-001');

const kodeIn = doc.buildDocumentCode('BAST_IN', '2026-05-05T10:30:00.000Z', 7);
t(`kode BAST_IN urut 7 → ...-007 (dapat ${kodeIn})`, kodeIn === 'REP-BASTIN-20260505-007');

const kodeSj = doc.buildDocumentCode('SURAT_JALAN', '2026-12-31T00:00:00.000Z', 99);
t(`kode SURAT_JALAN = REP-SJ-20261231-099 (dapat ${kodeSj})`, kodeSj === 'REP-SJ-20261231-099');

t('urutan negatif diklem ke 001',
  doc.buildDocumentCode('BAST_OUT', '2026-05-05T00:00:00.000Z', -5).endsWith('-001'));

t('tanggal rusak tidak membuat kode NaN',
  !doc.buildDocumentCode('BAST_OUT', 'bukan-tanggal', 1).includes('NaN'));

// ---------------------------------------------------------------------------
console.log('\n== Judul & Label ==');
t('judul BAST_OUT mengandung "SERAH TERIMA"',
  doc.getDocumentTitle('BAST_OUT').includes('SERAH TERIMA'));
t('judul BAST_IN mengandung "PENGEMBALIAN"',
  doc.getDocumentTitle('BAST_IN').includes('PENGEMBALIAN'));
t('judul SURAT_JALAN mengandung "SURAT JALAN"',
  doc.getDocumentTitle('SURAT_JALAN').includes('SURAT JALAN'));
t('label BAST_OUT = "BAST Out"', doc.getDocumentKindLabel('BAST_OUT') === 'BAST Out');
t('label SURAT_JALAN = "Surat Jalan"', doc.getDocumentKindLabel('SURAT_JALAN') === 'Surat Jalan');

// ---------------------------------------------------------------------------
console.log('\n== Penyusunan Dokumen: BAST OUT ==');
const bastOut = doc.buildDocument({
  kind: 'BAST_OUT',
  rental,
  equipment,
  issuedAt: TANGGAL_TETAP,
  sequence: 1,
});

t('jenis tersimpan', bastOut.kind === 'BAST_OUT');
t('nomor dokumen tersusun', bastOut.code === 'REP-BASTOUT-20260505-001');
t('kode rental terbawa', bastOut.rentalCode === rental.rental_code);
t('nama unit terbawa', bastOut.unitName === rental.equipment_name);
t('nilai sewa sama dengan rental', bastOut.rentalValue === rental.subtotal);
t('BAST OUT tidak menghitung denda', bastOut.penalty === 0);
t('BAST OUT tidak menghitung hari telat', bastOut.lateDays === 0);

const labelOut = bastOut.fields.map((f) => f.label);
t('BAST OUT mencantumkan "Tanggal Penyerahan"', labelOut.includes('Tanggal Penyerahan'));
t('BAST OUT mencantumkan "Lokasi Penyerahan"', labelOut.includes('Lokasi Penyerahan'));
t('BAST OUT mencantumkan "Kondisi Unit Diserahkan"',
  labelOut.includes('Kondisi Unit Diserahkan'));
t('BAST OUT tidak mencantumkan "Tanggal Pengembalian"',
  !labelOut.includes('Tanggal Pengembalian'));
t('setiap field punya label & nilai terisi',
  bastOut.fields.every((f) => f.label !== '' && f.value !== ''));
t('penerbit default = Hendra Wijaya', bastOut.issuedBy === 'Hendra Wijaya');
t('dua kolom tanda tangan tersedia',
  bastOut.signatures.left.name !== '' && bastOut.signatures.right.name !== '');
t('waktu terbit terformat', bastOut.issuedAtLabel.length > 0);

// ---------------------------------------------------------------------------
console.log('\n== Penyusunan Dokumen: BAST IN (terlambat) ==');
const batas = new Date(rental.end_date).getTime();
const telat3Hari = new Date(batas + 3 * 24 * 60 * 60 * 1000).toISOString();

const bastIn = doc.buildDocument({
  kind: 'BAST_IN',
  rental,
  equipment,
  issuedAt: telat3Hari,
  returnDate: telat3Hari,
});

t('BAST IN menghitung 3 hari terlambat', bastIn.lateDays === 3);
t('BAST IN menghitung denda 3 x 500.000', bastIn.penalty === 1_500_000);
t('BAST IN mencantumkan "Tanggal Pengembalian"',
  bastIn.fields.map((f) => f.label).includes('Tanggal Pengembalian'));
t('BAST IN mencantumkan "Denda Keterlambatan" saat terlambat',
  bastIn.fields.map((f) => f.label).includes('Denda Keterlambatan'));
t('nilai denda terformat Rupiah',
  bastIn.fields.find((f) => f.label === 'Denda Keterlambatan')?.value.startsWith('Rp'));

const bastInTepat = doc.buildDocument({
  kind: 'BAST_IN',
  rental,
  equipment,
  issuedAt: TANGGAL_TETAP,
  returnDate: rental.end_date,
});
t('kembali tepat waktu → 0 hari telat', bastInTepat.lateDays === 0);
t('kembali tepat waktu → tanpa denda', bastInTepat.penalty === 0);
t('kembali tepat waktu → tanpa baris denda',
  !bastInTepat.fields.map((f) => f.label).includes('Denda Keterlambatan'));

// ---------------------------------------------------------------------------
console.log('\n== Penyusunan Dokumen: Surat Jalan ==');
const suratJalan = doc.buildDocument({
  kind: 'SURAT_JALAN',
  rental,
  equipment,
  issuedAt: TANGGAL_TETAP,
});

const labelSj = suratJalan.fields.map((f) => f.label);
t('Surat Jalan mencantumkan "Tujuan Pengiriman"', labelSj.includes('Tujuan Pengiriman'));
t('Surat Jalan mencantumkan "Moda Pengiriman"', labelSj.includes('Moda Pengiriman'));
t('Surat Jalan mencantumkan "Pengemudi / Operator"', labelSj.includes('Pengemudi / Operator'));
t('Surat Jalan tidak menghitung denda', suratJalan.penalty === 0);
t('tiga dokumen menghasilkan nomor berbeda',
  new Set([bastOut.code, bastIn.code, suratJalan.code]).size === 2 ||
  new Set([bastOut.code, suratJalan.code]).size === 2);

// ---------------------------------------------------------------------------
console.log('\n== Ketahanan Data ==');
const tanpaUnit = doc.buildDocument({ kind: 'BAST_OUT', rental, equipment: null });
t('tanpa unit → dokumen tetap tersusun', tanpaUnit.fields.length > 0);
t('tanpa unit → kode unit "-"',
  tanpaUnit.fields.find((f) => f.label === 'Kode Unit')?.value !== undefined);
t('tanpa unit → merek "-"',
  tanpaUnit.fields.find((f) => f.label === 'Merek / Model')?.value === '-');

const rentalKosong = {
  ...rental,
  customer_name: undefined,
  company_name: undefined,
  equipment_name: undefined,
  equipment_code: undefined,
  notes: undefined,
};
const dokumenKosong = doc.buildDocument({ kind: 'BAST_OUT', rental: rentalKosong });
t('field kosong tidak menghasilkan "undefined"',
  !JSON.stringify(dokumenKosong.fields).includes('undefined'));
t('pelanggan kosong menjadi "-"',
  dokumenKosong.fields.find((f) => f.label === 'Pelanggan / Penyewa')?.value === '-');
t('catatan kosong diganti teks pengganti',
  dokumenKosong.fields.find((f) => f.label === 'Lokasi Penyerahan')?.value !== '');

const rentalRusak = { ...rental, start_date: 'bukan', end_date: 'bukan' };
const dokumenRusak = doc.buildDocument({ kind: 'BAST_OUT', rental: rentalRusak });
t('tanggal rusak tidak menghasilkan NaN pada dokumen',
  !JSON.stringify(dokumenRusak.fields).includes('NaN'));

const tanpaCustomerCompany = doc.buildDocument({
  kind: 'BAST_OUT',
  rental: { ...rental, company_name: undefined },
});
t('tanpa nama perusahaan → hanya nama pelanggan (tanpa "—")',
  tanpaCustomerCompany.fields
    .find((f) => f.label === 'Pelanggan / Penyewa')?.value === rental.customer_name);

// ---------------------------------------------------------------------------
console.log('\n== Nama Berkas Cetak ==');
const namaBerkas = doc.buildDocumentFilename(bastOut, new Date('2026-09-09T00:00:00.000Z'));
t(`nama berkas = BASTOUT_<kode>_2026-09-09 (dapat ${namaBerkas})`,
  namaBerkas.startsWith('BASTOUT_') && namaBerkas.endsWith('_2026-09-09'));
t('nama berkas tanpa spasi', !namaBerkas.includes(' '));
t('nama berkas tanpa karakter terlarang Windows', !/[\\/:*?"<>|]/.test(namaBerkas));

// ---------------------------------------------------------------------------
console.log('\n== Escaping HTML ==');
t('escapeHtml mengamankan <', doc.escapeHtml('<b>') === '&lt;b&gt;');
t('escapeHtml mengamankan &', doc.escapeHtml('a & b') === 'a &amp; b');
t('escapeHtml mengamankan kutip ganda', doc.escapeHtml('"x"') === '&quot;x&quot;');
t('escapeHtml mengamankan kutip tunggal', doc.escapeHtml("'x'") === '&#39;x&#39;');

const berbahaya = doc.buildDocument({
  kind: 'BAST_OUT',
  rental: { ...rental, customer_name: '<img src=x onerror=alert(1)>' },
});
const htmlBerbahaya = doc.renderDocumentHtml(berbahaya);
t('nama pelanggan berbahaya tidak menyisipkan tag', !htmlBerbahaya.includes('<img'));
t('nama pelanggan berbahaya di-escape', htmlBerbahaya.includes('&lt;img'));

// ---------------------------------------------------------------------------
console.log('\n== Render HTML Siap Cetak A4 ==');
const html = doc.renderDocumentHtml(bastOut);

t('berkas dimulai dengan DOCTYPE html', html.startsWith('<!DOCTYPE html>'));
t('bahasa dokumen Indonesia', html.includes('lang="id"'));
t('charset utf-8', html.includes('charset="utf-8"'));
t('aturan @page size A4 ada', html.includes('size: A4 portrait'));
t('margin kertas ditentukan', /@page[\s\S]*?margin:\s*15mm 14mm/.test(html));
t('kop surat PT SBS tercetak', html.includes('PT. SURYA BANGUN SARANA BANJARMASIN'));
t('alamat perusahaan tercetak', html.includes('Jl. Ahmad Yani KM 5'));
t('nomor telepon tercetak', html.includes('(0511) 7890123'));
t('judul dokumen tercetak', html.includes(bastOut.title));
t('nomor dokumen tercetak', html.includes(bastOut.code));
t('kode transaksi tercetak', html.includes(rental.rental_code));
t('nama pelanggan tercetak', html.includes(String(rental.customer_name)));
t('nilai sewa tercetak dalam Rupiah', /Rp\s[\d.]+/.test(html));
t('bagian tanda tangan ada', html.includes('tanda-tangan'));
t('footer mencantumkan TiDB Cloud', html.includes('TiDB Cloud'));
t('media print menyesuaikan warna', html.includes('@media print'));
t('setiap baris rincian tercetak sebagai <tr>',
  (html.match(/<tr>/g) ?? []).length === bastOut.fields.length);
t('HTML seimbang: <table> dibuka & ditutup',
  html.includes('<table') && html.includes('</table>'));
t('HTML seimbang: </body> & </html> ada',
  html.includes('</body>') && html.includes('</html>'));

t('denda tercetak pada BAST IN yang terlambat',
  doc.renderDocumentHtml(bastIn).includes('Denda Keterlambatan'));
t('catatan kondisi unit tercetak pada BAST IN',
  doc.renderDocumentHtml(bastIn).includes('Kondisi Unit Diterima'));

// ---------------------------------------------------------------------------
console.log('\n== Kebersihan Kode Sumber ==');
const sumber = readFileSync(join(ROOT, 'src', 'lib', 'documents.ts'), 'utf8');
t('modul dokumen tidak memakai tipe any', !/:\s*any\b|\bas any\b|<any>/.test(sumber));
t('modul dokumen tidak memakai console.log', !/console\.log\(/.test(sumber));
t('modul dokumen tidak menulis ke DOM',
  !/document\.|window\./.test(sumber.replace(/\/\*[\s\S]*?\*\//g, '')));

const printer = readFileSync(join(ROOT, 'src', 'lib', 'documentPrinter.ts'), 'utf8');
t('modul pencetak tidak memakai tipe any', !/:\s*any\b|\bas any\b|<any>/.test(printer));
t('modul pencetak menangani popup diblokir', /popup|Pop-up|diblokir/i.test(printer));

const panel = readFileSync(join(ROOT, 'src', 'components', 'DocumentPrintPanel.tsx'), 'utf8');
t('panel cetak tidak memakai tipe any', !/:\s*any\b|\bas any\b|<any>/.test(panel));
t('panel cetak punia aria-label', /aria-label=/.test(panel));
t('panel cetak menolak status PENDING', /ELIGIBLE_STATUSES/.test(panel));

const pratinjau = readFileSync(join(ROOT, 'src', 'components', 'DocumentPreview.tsx'), 'utf8');
t('komponen pratinjau tidak memakai tipe any', !/:\s*any\b|\bas any\b|<any>/.test(pratinjau));

// ---------------------------------------------------------------------------
console.log('\n== Integrasi Halaman Laporan ==');
const halaman = readFileSync(join(ROOT, 'src', 'pages', 'admin', 'ReportsPage.tsx'), 'utf8');
t('halaman memuat panel dokumen', halaman.includes('DocumentPrintPanel'));
t('halaman memuat komponen pratinjau', halaman.includes('DocumentPreview'));
t('halaman memanggil printDocument', halaman.includes('printDocument'));
t('tombol cetak A4 ada pada tabel arsip', halaman.includes('Cetak A4'));
t('halaman menerima prop equipments', halaman.includes('equipments={equipments}'));

const css = readFileSync(join(ROOT, 'src', 'index.css'), 'utf8');
t('CSS punya aturan @page A4', /@page\s*\{\s*size:\s*A4/.test(css));

// ---------------------------------------------------------------------------
console.log('\n== Render SSR: Komponen Dokumen ==');
const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const { DocumentPreview } = await import('../.tmp_preview.mjs');
const { DocumentPrintPanel } = await import('../.tmp_printpanel.mjs');

const markupOut = renderToStaticMarkup(React.createElement(DocumentPreview, { doc: bastOut }));
t('pratinjau BAST OUT bisa dirender', markupOut.length > 0);
t('pratinjau memuat kop surat', markupOut.includes('PT. SURYA BANGUN SARANA BANJARMASIN'));
t('pratinjau memuat nomor dokumen', markupOut.includes(bastOut.code));
t('pratinjau memuat judul dokumen', markupOut.includes(bastOut.title));
t('pratinjau memuat nama pelanggan', markupOut.includes('Budi Santoso'));
t('pratinjau memuat nilai sewa Rupiah', /Rp/.test(markupOut));
t('pratinjau memuat bagian tanda tangan', markupOut.includes('Pimpinan Proyek Lapangan'));
t('pratinjau tidak mengandung "undefined"', !markupOut.includes('undefined'));
t('pratinjau tidak mengandung "NaN"', !markupOut.includes('NaN'));

const markupIn = renderToStaticMarkup(React.createElement(DocumentPreview, { doc: bastIn }));
t('pratinjau BAST IN memuat denda', markupIn.includes('Denda keterlambatan'));
t('pratinjau BAST IN memuat hari telat', markupIn.includes('3 hari'));

const markupSj = renderToStaticMarkup(
  React.createElement(DocumentPreview, { doc: suratJalan })
);
t('pratinjau Surat Jalan bisa dirender', markupSj.includes('SURAT JALAN'));

// Panel penerbitan dokumen
const rentalLayak = stateStore.rentals.map((r) => ({
  ...r,
  customer_name: 'Budi Santoso',
  status: 'ON_GOING',
}));

const panelProps = {
  rentals: rentalLayak,
  equipments: stateStore.equipments,
  issuedBy: 'Hendra Wijaya',
};

const markupPanel = renderToStaticMarkup(
  React.createElement(DocumentPrintPanel, panelProps)
);
t('panel cetak bisa dirender', markupPanel.length > 0);
t('panel cetak memuat judul', markupPanel.includes('Dokumen Operasional Siap Cetak'));
t('panel cetak memuat pemilih transaksi', markupPanel.includes('pilih-transaksi-dokumen'));
t('panel cetak memuat pemilih jenis dokumen', markupPanel.includes('pilih-jenis-dokumen'));
t('panel cetak memuat tiga opsi jenis dokumen',
  (markupPanel.match(/<option/g) ?? []).length > 3);
t('panel cetak memuat tombol cetak', markupPanel.includes('Cetak / Simpan PDF'));
t('panel cetak memuat tombol pratinjau', markupPanel.includes('Buka Pratinjau'));
t('panel cetak menonaktifkan tombol saat belum pilih transaksi',
  markupPanel.includes('disabled'));

const panelBelumDisetujui = renderToStaticMarkup(
  React.createElement(DocumentPrintPanel, {
    ...panelProps,
    rentals: rentalLayak.map((r) => ({ ...r, status: 'PENDING' })),
  })
);
t('panel menolak transaksi PENDING', panelBelumDisetujui.includes('Belum ada transaksi siap terbit'));
t('panel PENDING tidak memuat pemilih transaksi',
  !panelBelumDisetujui.includes('pilih-transaksi-dokumen'));

const panelKosong = renderToStaticMarkup(
  React.createElement(DocumentPrintPanel, { rentals: [], equipments: [] })
);
t('panel tanpa data menampilkan empty state', panelKosong.includes('Belum ada transaksi siap terbit'));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
