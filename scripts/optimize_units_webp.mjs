import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const unitsDir = path.resolve(__dirname, '../public/images/units');

if (!fs.existsSync(unitsDir)) {
  console.error(`Folder tidak ditemukan: ${unitsDir}`);
  process.exit(1);
}

// Hapus file tes lama jika ada
['EXCA-KOM-PC200-01_test.webp', 'EXCA-KOM-PC200-01_test720.webp'].forEach((f) => {
  const p = path.join(unitsDir, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

const files = fs.readdirSync(unitsDir).filter((f) => f.endsWith('.png') && !f.includes('_test'));

console.log('==============================================================');
console.log('  OPTIMASI FOTO ARMADA ALAT BERAT KE WEBP (SUPER HD & RINGAN)');
console.log(`  Total file sumber: ${files.length} file PNG`);
console.log('==============================================================\n');

let totalOriginalBytes = 0;
let totalWebpBytes = 0;

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const pngPath = path.join(unitsDir, file);
  const webpName = file.replace(/\.png$/i, '.webp');
  const webpPath = path.join(unitsDir, webpName);

  const origStat = fs.statSync(pngPath);
  totalOriginalBytes += origStat.size;

  // Konversi ke WebP tajam (width: 760px, aspect ratio terjaga, quality: 80)
  await sharp(pngPath)
    .resize({ width: 760, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(webpPath);

  const webpStat = fs.statSync(webpPath);
  totalWebpBytes += webpStat.size;

  const savingPct = (((origStat.size - webpStat.size) / origStat.size) * 100).toFixed(1);

  console.log(
    `[${i + 1}/${files.length}] ${file} -> ${webpName} | ${(origStat.size / 1024).toFixed(0)} KB -> ${(webpStat.size / 1024).toFixed(0)} KB (hemat ${savingPct}%)`
  );
}

console.log('\n==============================================================');
console.log('HASIL OPTIMASI AKHIR:');
console.log(`  Ukuran Awal (PNG) : ${(totalOriginalBytes / (1024 * 1024)).toFixed(2)} MB`);
console.log(`  Ukuran Baru(WebP) : ${(totalWebpBytes / (1024 * 1024)).toFixed(2)} MB`);
console.log(`  Total Penghematan : ${(((totalOriginalBytes - totalWebpBytes) / totalOriginalBytes) * 100).toFixed(1)}%`);
console.log('==============================================================');
