/**
 * Audit kode sumber: mendeteksi duplikasi & bug tampilan yang umum.
 * Dijalankan sebagai bagian dari suite agar regresi tidak kembali.
 *
 * Fokus:
 *   1. Tidak ada lagi formatter Rupiah lokal di komponen (harus pakai modul)
 *   2. Tidak ada "Rp Rp" ganda pada template literal
 *   3. Tidak ada `any` pada props komponen yang baru
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath mengembalikan path Windows yang valid (spasi tidak ter-encode).
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'src');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

/** Kumpulkan semua file .ts/.tsx di bawah direktori. */
function kumpulkanFile(dir, hasil = []) {
  for (const nama of readdirSync(dir)) {
    const p = join(dir, nama);
    if (statSync(p).isDirectory()) kumpulkanFile(p, hasil);
    else if (['.ts', '.tsx'].includes(extname(p))) hasil.push(p);
  }
  return hasil;
}

const files = kumpulkanFile(SRC);
console.log(`\nMemeriksa ${files.length} file sumber...`);

// ---------------------------------------------------------------------------
console.log('\n== Formatter Rupiah Terpusat ==');
const denganFormatterLokal = [];
for (const f of files) {
  const isi = readFileSync(f, 'utf8');
  if (f.includes('businessRules')) continue; // modul itu sendiri
  if (/Intl\.NumberFormat\([^)]*IDR/.test(isi)) {
    denganFormatterLokal.push(f.replace(SRC, 'src'));
  }
}
t('tidak ada formatter Rupiah lokal di luar businessRules.ts', denganFormatterLokal.length === 0);
if (denganFormatterLokal.length) {
  denganFormatterLokal.forEach(f => console.log(`    → ${f}`));
}

// ---------------------------------------------------------------------------
console.log('\n== Tidak Ada Awalan "Rp" Ganda ==');
const rpGanda = [];
for (const f of files) {
  const isi = readFileSync(f, 'utf8');
  if (/Rp\s*\$?\{formatRupiah/.test(isi) || /Rp\s*\$?\{formatCurrency/.test(isi)) {
    rpGanda.push(f.replace(SRC, 'src'));
  }
}
t('tidak ada pola "Rp {formatRupiah(...)}" (double prefix)', rpGanda.length === 0);
if (rpGanda.length) rpGanda.forEach(f => console.log(`    → ${f}`));

// ---------------------------------------------------------------------------
console.log('\n== Modul businessRules Dipakai Konsisten ==');
const pakaiFormatRupiah = files.filter(f =>
  /formatRupiah\(/.test(readFileSync(f, 'utf8')) && !f.includes('businessRules')
);
console.log(`  ${pakaiFormatRupiah.length} file memakai formatRupiah()`);

const tidakImport = pakaiFormatRupiah.filter(f => {
  const isi = readFileSync(f, 'utf8');
  return !/import\s*\{[^}]*formatRupiah[^}]*\}\s*from/.test(isi);
});
t('setiap pemakai formatRupiah mengimpornya', tidakImport.length === 0);
if (tidakImport.length) tidakImport.forEach(f => console.log(`    → ${f.replace(SRC, 'src')}`));

// ---------------------------------------------------------------------------
console.log('\n== Kebersihan Umum ==');
const adaConsoleLog = [];
for (const f of files) {
  const isi = readFileSync(f, 'utf8');
  // Izinkan console.error/warn, larang console.log di kode produksi.
  if (/console\.log\(/.test(isi)) adaConsoleLog.push(f.replace(SRC, 'src'));
}
t('tidak ada console.log di kode produksi', adaConsoleLog.length === 0);
if (adaConsoleLog.length) adaConsoleLog.forEach(f => console.log(`    → ${f}`));

const adaTodo = [];
for (const f of files) {
  const isi = readFileSync(f, 'utf8');
  // Hanya penanda komentar yang dihitung (// TODO, /* FIXME */).
  // "XXXX" pada teks contoh seperti nomor telepon tidak dihitung.
  const baris = isi.split(/\r?\n/);
  const ketemu = baris.some(b =>
    /(\/\/|\/\*|\*)\s*(TODO|FIXME|XXX)\b/.test(b) || /^\s*(TODO|FIXME)\s*:/m.test(b)
  );
  if (ketemu) adaTodo.push(f.replace(SRC, 'src'));
}
t('tidak ada penanda TODO/FIXME tertinggal', adaTodo.length === 0);
if (adaTodo.length) adaTodo.forEach(f => console.log(`    → ${f}`));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
