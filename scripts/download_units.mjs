import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../STATE/unit_prompts.json');
const targetDir = path.resolve(__dirname, '../public/images/units');

if (!fs.existsSync(jsonPath)) {
  console.error(`File prompt tidak ditemukan: ${jsonPath}`);
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const rawData = fs.readFileSync(jsonPath, 'utf8');
const units = JSON.parse(rawData);

// Argumen baris perintah
const isTestMode = process.argv.includes('--test');
const limitArgIndex = process.argv.indexOf('--limit');
let limit = units.length;
if (isTestMode) {
  limit = 1;
} else if (limitArgIndex !== -1 && process.argv[limitArgIndex + 1]) {
  limit = parseInt(process.argv[limitArgIndex + 1], 10) || units.length;
}

const itemsToProcess = units.slice(0, limit);

console.log('==============================================================');
console.log('  PT. SURYA BANGUN SARANA BANJARMASIN - GENERATOR FOTO ARMADA');
console.log(`  Total Data Unit : ${units.length} unit`);
console.log(`  Target Eksekusi : ${itemsToProcess.length} unit`);
console.log(`  Folder Output   : ${targetDir}`);
console.log('==============================================================\n');

async function downloadAndProcessImage(url, outputPath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const rawBuffer = Buffer.from(await response.arrayBuffer());
      if (rawBuffer.length < 5000) {
        throw new Error(`Ukuran file terlalu kecil (${rawBuffer.length} bytes)`);
      }

      // Bersihkan watermark di sudut kanan bawah secara otomatis memakai sharp
      const meta = await sharp(rawBuffer).metadata();
      const cropHeight = Math.max(100, meta.height - 40); // Potong watermark 40px terbawah

      await sharp(rawBuffer)
        .extract({ left: 0, top: 0, width: meta.width, height: cropHeight })
        .png({ quality: 90, compressionLevel: 8 })
        .toFile(outputPath);

      const finalStat = fs.statSync(outputPath);
      return finalStat.size;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`    ⚠️ Percobaan ${attempt} gagal (${err.message}), mencoba lagi dalam 3 detik...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

async function run() {
  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (let i = 0; i < itemsToProcess.length; i++) {
    const item = itemsToProcess[i];
    const outputFile = path.join(targetDir, item.file);

    process.stdout.write(`[${i + 1}/${itemsToProcess.length}] Unit #${item.no}: ${item.kode} (${item.nama})... `);

    // Cek jika file bersih sudah ada
    if (fs.existsSync(outputFile)) {
      const stat = fs.statSync(outputFile);
      if (stat.size > 20000) {
        console.log(`⏩ Sudah ada (${(stat.size / 1024).toFixed(1)} KB)`);
        skippedCount++;
        continue;
      }
    }

    const seed = 55000 + item.no;
    const promptParam = encodeURIComponent(item.prompt);
    const apiUrl = `https://image.pollinations.ai/prompt/${promptParam}?model=flux&width=1024&height=768&seed=${seed}`;

    const startTime = Date.now();
    try {
      const sizeBytes = await downloadAndProcessImage(apiUrl, outputFile);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Selesai (${(sizeBytes / 1024).toFixed(1)} KB, ${duration}s, watermark removed)`);
      successCount++;
    } catch (error) {
      console.log(`❌ Gagal: ${error.message}`);
      failCount++;
    }

    // Jeda 2 detik antar gambar
    if (i < itemsToProcess.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log('\n==============================================================');
  console.log(`RINGKASAN:`);
  console.log(`  Berhasil : ${successCount}`);
  console.log(`  Dilewati : ${skippedCount}`);
  console.log(`  Gagal    : ${failCount}`);
  console.log('==============================================================');
}

run();
