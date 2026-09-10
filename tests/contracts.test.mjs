/**
 * Uji modul kontrak digital (src/lib/contracts.ts) + T-0007.
 *
 * Fokus:
 *   1. Penomoran `SBS/CONTRACT/<YYYY>/<MM>/<SEQ-4digit>` — urut per periode.
 *   2. Status penandatanganan — normalisasi boolean 0/1 & true/false.
 *   3. Pratinjau kontrak — lengkap, aman pada data kosong/rusak.
 *   4. Render HTML cetak — escape HTML & penolakan data URL berbahaya.
 */

const c = await import('../.tmp_contracts.mjs');
const { stateStore } = await import('../.tmp_db.mjs');
const S = stateStore;

let pass = 0, fail = 0;
const t = (n, k) => { k ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

// ---------------------------------------------------------------------------
console.log('\n== Penomoran Kontrak ==');
t('format dasar benar', c.buildContractCode('2026-09-04', 42) === 'SBS/CONTRACT/2026/09/0042');
t('nomor urut selalu 4 digit', c.buildContractCode('2026-01-01', 7) === 'SBS/CONTRACT/2026/01/0007');
t('bulan ikut serta dalam kode', c.buildContractCode('2026-12-31', 1) === 'SBS/CONTRACT/2026/12/0001');
t('urutan 9999 tetap 4 digit', c.buildContractCode('2026-09-04', 9999) === 'SBS/CONTRACT/2026/09/9999');
t('urutan di atas 9999 diklem', c.buildContractCode('2026-09-04', 100000) === 'SBS/CONTRACT/2026/09/9999');
t('urutan 0 diklem ke 1', c.buildContractCode('2026-09-04', 0) === 'SBS/CONTRACT/2026/09/0001');
t('urutan negatif diklem ke 1', c.buildContractCode('2026-09-04', -5) === 'SBS/CONTRACT/2026/09/0001');
t('urutan desimal dibulatkan', c.buildContractCode('2026-09-04', 3.9) === 'SBS/CONTRACT/2026/09/0003');
t('urutan NaN jatuh ke 1', c.buildContractCode('2026-09-04', NaN) === 'SBS/CONTRACT/2026/09/0001');
t('tanggal rusak jatuh ke 1970-01', c.buildContractCode('bukan-tanggal', 1) === 'SBS/CONTRACT/1970/01/0001');
t('tanggal null jatuh ke 1970-01', c.buildContractCode(null, 1) === 'SBS/CONTRACT/1970/01/0001');

t('kode valid dikenali', c.isValidContractCode('SBS/CONTRACT/2026/09/0042'));
t('kode tanpa awalan ditolak', !c.isValidContractCode('KONTRAK/2026/09/0042'));
t('kode 3 digit ditolak', !c.isValidContractCode('SBS/CONTRACT/2026/09/042'));
t('kode dengan sisipan ditolak', !c.isValidContractCode('X SBS/CONTRACT/2026/09/0042'));

// ---------------------------------------------------------------------------
console.log('\n== Nomor Urut Per Periode ==');
const contoh = [
  { contract_code: 'SBS/CONTRACT/2026/09/0001', contract_date: '2026-09-02' },
  { contract_code: 'SBS/CONTRACT/2026/09/0007', contract_date: '2026-09-20' },
  { contract_code: 'SBS/CONTRACT/2026/10/0001', contract_date: '2026-10-01' },
];
t('urut berikutnya = maksimum + 1', c.nextContractSequence(contoh, '2026-09-30') === 8);
t('periode baru mulai dari 1', c.nextContractSequence(contoh, '2026-11-01') === 1);
t('koleksi kosong mulai dari 1', c.nextContractSequence([], '2026-09-30') === 1);
t('generate gabungkan urut & kode', c.generateContractCode(contoh, '2026-09-30') === 'SBS/CONTRACT/2026/09/0008');
// Menghapus kontrak tidak boleh memakai ulang nomor lama (audit trail).
t('urut tidak turun walau data susut',
  c.nextContractSequence([{ contract_code: 'SBS/CONTRACT/2026/09/0007', contract_date: '2026-09-20' }], '2026-09-30') === 8);

// ---------------------------------------------------------------------------
console.log('\n== Status Penandatanganan ==');
t('is_signed 1 dianggap sah', c.isContractSigned({ is_signed_customer: 1 }));
t('is_signed true dianggap sah', c.isContractSigned({ is_signed_customer: true }));
t('is_signed 0 belum sah', !c.isContractSigned({ is_signed_customer: 0 }));
t('is_signed false belum sah', !c.isContractSigned({ is_signed_customer: false }));
t('status SIGNED', c.getContractSignatureStatus({ is_signed_customer: 1 }) === 'SIGNED');
t('status AWAITING', c.getContractSignatureStatus({ is_signed_customer: 0 }) === 'AWAITING');
t('label SIGNED', c.getContractStatusLabel('SIGNED') === 'Telah Ditandatangani');
t('label AWAITING', c.getContractStatusLabel('AWAITING') === 'Menunggu Tanda Tangan');
t('tone SIGNED = success', c.getContractStatusTone('SIGNED') === 'success');
t('tone AWAITING = warning', c.getContractStatusTone('AWAITING') === 'warning');

t('kontrak tanpa batas akhir dianggap aktif', c.isContractActive({ valid_until: '' }) === true);
t('kontrak yang belum jatuh tempo aktif',
  c.isContractActive({ valid_until: '2999-01-01' }) === true);
t('kontrak yang sudah lewat tidak aktif',
  c.isContractActive({ valid_until: '2000-01-01' }) === false);

// ---------------------------------------------------------------------------
console.log('\n== Syarat & Ketentuan ==');
t('syarat tidak kosong', c.CONTRACT_TERMS.length > 0);
t('syarat menyebut denda', c.CONTRACT_TERMS.some(x => x.toLowerCase().includes('denda')));
t('teks syarat dipisah baris baru', c.CONTRACT_TERMS_TEXT.includes('\n'));
t('teks syarat tidak melebihi batas kolom', c.CONTRACT_TERMS_TEXT.length <= 4000);

// ---------------------------------------------------------------------------
console.log('\n== Keamanan: Escape & Data URL ==');
t('escape &', c.escapeContractHtml('a & b') === 'a &amp; b');
t('escape kurung', c.escapeContractHtml('<script>') === '&lt;script&gt;');
t('escape kutip', c.escapeContractHtml('"x"') === '&quot;x&quot;');
t('escape tidak mengubah teks aman', c.escapeContractHtml('Budi Santoso') === 'Budi Santoso');

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
t('data URL PNG aman', c.isSafeSignatureDataUrl(PNG));
t('data URL JPEG aman', c.isSafeSignatureDataUrl('data:image/jpeg;base64,AAAA'));
t('skema javascript ditolak', !c.isSafeSignatureDataUrl('javascript:alert(1)'));
t('URL eksternal ditolak', !c.isSafeSignatureDataUrl('https://evil.example/x.png'));
t('data URL teks ditolak', !c.isSafeSignatureDataUrl('data:text/html;base64,AAAA'));
t('string kosong ditolak', !c.isSafeSignatureDataUrl(''));
t('null ditolak', !c.isSafeSignatureDataUrl(null));

// ---------------------------------------------------------------------------
console.log('\n== Pratinjau Kontrak ==');
const kontrak = {
  id: 1, contract_code: 'SBS/CONTRACT/2026/09/0042', rental_id: 1, rental_code: 'RNT-001',
  customer_id: 9, customer_name: 'Budi Santoso', contract_date: '2026-09-04',
  valid_until: '2026-10-04', terms_conditions: c.CONTRACT_TERMS_TEXT,
  is_signed_customer: 0, signed_at: null, signer_name: null, signature_data_url: null,
};
const rental = {
  id: 1, rental_code: 'RNT-001', customer_id: 9, customer_name: 'Budi Santoso',
  equipment_id: 1, equipment_name: 'Excavator PC200', equipment_code: 'EXC-001',
  start_date: '2026-09-05', end_date: '2026-09-20', total_days: 15, subtotal: 45000000,
  status: 'APPROVED',
};
const preview = c.buildContractPreview({ contract: kontrak, rental });

t('kode kontrak ikut pratinjau', preview.code === 'SBS/CONTRACT/2026/09/0042');
t('judul kontrak terisi', preview.title.length > 0);
t('ada baris nomor kontrak', preview.fields.some(f => f.label === 'Nomor Kontrak'));
t('nilai sewa terformat Rupiah', preview.rentalValueLabel.startsWith('Rp'));
t('nilai sewa sama dengan transaksi', preview.rentalValue === 45000000);
t('periode menyertakan jumlah hari', preview.fields.some(f => f.label === 'Periode Sewa' && f.value.includes('15 hari')));
t('dua pihak menandatangani', Boolean(preview.parties.left && preview.parties.right));
t('status AWAITING', preview.status === 'AWAITING');
t('catatan AWAITING menyebut menunggu', preview.notes.toLowerCase().includes('menunggu'));

const signed = c.buildContractPreview({
  contract: { ...kontrak, is_signed_customer: 1, signed_at: '2026-09-04 10:30:00', signer_name: 'Budi Santoso', signature_data_url: PNG },
  rental,
});
t('status SIGNED', signed.status === 'SIGNED');
t('catatan SIGNED menyebut UU ITE', signed.notes.includes('ITE'));
t('tanda tangan tersemat', signed.parties.left.signature === PNG);
t('waktu tanda tangan terformat', typeof signed.parties.left.signedAtLabel === 'string');

// Ketahanan terhadap data kosong.
const kosong = c.buildContractPreview({
  contract: { id: 2, contract_code: 'SBS/CONTRACT/2026/09/0043', rental_id: 99, is_signed_customer: 0 },
});
t('pratinjau tanpa data terkait tidak error', typeof kosong.code === 'string');
t('field pengganti "-" dipakai', kosong.fields.some(f => f.value === '-'));
t('pratinjau tanpa rental nilai 0', kosong.rentalValue === 0);

// ---------------------------------------------------------------------------
console.log('\n== Render HTML Cetak A4 ==');
const html = c.renderContractHtml(preview);
t('HTML berupa dokumen penuh', html.trimStart().startsWith('<!DOCTYPE html>'));
t('memuat aturan cetak A4', html.includes('@page') && html.includes('A4'));
t('memuat kode kontrak', html.includes('SBS/CONTRACT/2026/09/0042'));
t('memuat seluruh syarat', c.CONTRACT_TERMS.every(s => html.includes(s.slice(0, 30))));
t('tanda tangan kosong tidak menyisipkan src', !html.includes('<img class="goresan"'));

const htmlTtd = c.renderContractHtml(signed);
t('tanda tangan sah disematkan', htmlTtd.includes('<img class="goresan"'));
t('nama penandatangan tercetak', htmlTtd.includes('( Budi Santoso )'));

// Injeksi harus dinetralkan, bukan dijalankan.
const jahat = c.buildContractPreview({
  contract: { ...kontrak, customer_name: '<script>alert(1)</script>' },
  rental: { ...rental, equipment_name: '<img onerror=alert(1)>' },
});
const htmlJahat = c.renderContractHtml(jahat);
t('injeksi script dinetralkan', !htmlJahat.includes('<script>alert(1)</script>'));
t('injeksi img dinetralkan', !htmlJahat.includes('<img onerror=alert(1)>'));
t('injeksi tetap tampil sebagai teks', htmlJahat.includes('&lt;script&gt;'));

// Nama berkas cetak.
t('nama berkas mengandung kode', c.buildContractFilename(preview).includes('0042'));
t('nama berkas tanpa karakter terlarang', !/[\\/:*?"<>|]/.test(c.buildContractFilename(preview)));

// ---------------------------------------------------------------------------
console.log('\n== Konsistensi dengan Data Nyata ==');
t('seed punya 50 kontrak', S.contracts.length === 50);
t('semua kode kontrak valid', S.contracts.every(k => c.isValidContractCode(k.contract_code)));
t('kode kontrak unik', new Set(S.contracts.map(k => k.contract_code)).size === S.contracts.length);
t('satu kontrak per transaksi', new Set(S.contracts.map(k => k.rental_id)).size === S.contracts.length);
t('semua kontrak punya pratinjau', S.contracts.every(k => {
  const p = c.buildContractPreview({ contract: k });
  return p.code === k.contract_code;
}));
t('semua pratinjau bisa dirender', S.contracts.every(k =>
  c.renderContractHtml(c.buildContractPreview({ contract: k })).includes('<!DOCTYPE html>')));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
if (fail > 0) process.exit(1);
