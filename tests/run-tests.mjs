/**
 * Test Runner - EquipRent MS
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Menjalankan seluruh smoke test di folder tests/.
 * Dipakai agent pada setiap siklus sebelum menyatakan tugas selesai.
 *
 * Cara pakai:
 *   npm test
 *
 * Catatan:
 *   Modul TypeScript di-bundle dulu dengan esbuild karena Node tidak bisa
 *   mengeksekusi .ts secara langsung.
 */

import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const testsDir = join(root, 'tests');

/** Bundle modul TS yang dibutuhkan test. */
function bundle(entry, out) {
  const outPath = join(root, out);
  execSync(
    `npx esbuild "${join(root, entry)}" --bundle --format=esm --outfile="${outPath}" --platform=neutral --external:@tidbcloud/serverless`,
    { cwd: root, stdio: 'ignore' }
  );
}

console.log('Menyiapkan bundle modul untuk pengujian...');
bundle('src/lib/businessRules.ts', '.tmp_businessRules.mjs');
bundle('src/lib/db.ts', '.tmp_db.mjs');
bundle('src/lib/reports.ts', '.tmp_reports.mjs');
bundle('src/server/index.ts', '.tmp_server.mjs');

// Panel laporan butuh JSX → sertakan loader .tsx dan jadikan React eksternal
// agar modul react/react-dom tidak ikut ter-bundle (cukup satu instans).
execSync(
  `npx esbuild "${join(root, 'src/components/ReportAnalyticsPanel.tsx')}" --bundle --format=esm --outfile="${join(root, '.tmp_panel.mjs')}" --platform=neutral --external:react --external:react-dom --external:@tidbcloud/serverless --loader:.tsx=tsx --jsx=automatic`,
  { cwd: root, stdio: 'ignore' }
);

const suites = [
  'businessRules.test.mjs',
  'dataIntegrity.test.mjs',
  'servicePanel.test.mjs',
  'lateFee.test.mjs',
  'consistency.test.mjs',
  'dueNotifications.test.mjs',
  'reports.test.mjs',
  'smokeRender.test.mjs',
  'api.test.mjs',
  'codeQuality.test.mjs',
];

let failed = 0;
const results = [];

for (const suite of suites) {
  const path = join(testsDir, suite);
  if (!existsSync(path)) {
    console.log(`LEWATI  ${suite} (tidak ditemukan)`);
    continue;
  }
  console.log(`\n>>> Menjalankan ${suite}`);
  try {
    execSync(`node "${path}"`, { cwd: root, stdio: 'inherit' });
    results.push([suite, 'PASS']);
  } catch {
    results.push([suite, 'FAIL']);
    failed += 1;
  }
}

// Bersihkan artefak bundle
for (const f of ['.tmp_businessRules.mjs', '.tmp_db.mjs', '.tmp_reports.mjs', '.tmp_panel.mjs', '.tmp_server.mjs']) {
  const p = join(root, f);
  if (existsSync(p)) rmSync(p);
}

console.log('\n=== RINGKASAN ===');
for (const [suite, status] of results) {
  console.log(`  ${status === 'PASS' ? 'PASS' : 'FAIL'}  ${suite}`);
}
console.log(
  failed === 0
    ? `\nSemua suite lulus (${results.length}/${results.length}).`
    : `\n${failed} dari ${results.length} suite gagal.`
);

process.exit(failed === 0 ? 0 : 1);
