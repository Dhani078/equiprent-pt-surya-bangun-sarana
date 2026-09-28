// Pulihkan payments id 38..50 (terhapus tak sengaja oleh harness verifikasi)
// dari sumber seed kanonik hanya_isi_data.sql. Deterministik: baris 1..37
// sudah diverifikasi identik dengan SQL ini, jadi sisa barisnya juga.
import fs from 'node:fs';
import { connect } from '@tidbcloud/serverless';

const vars = fs.readFileSync('.dev.vars', 'utf8');
const url = vars.match(/DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/)[1];
const conn = connect({ url });

const sql = fs.readFileSync('hanya_isi_data.sql', 'utf8');
const i = sql.indexOf('INSERT INTO `payments`');
const seg = sql.slice(i, sql.indexOf(';', i));
const body = seg.slice(seg.indexOf('VALUES') + 6);

const tups = [];
let depth = 0, cur = '';
for (const ch of body) {
  if (ch === '(') { depth++; if (depth === 1) { cur = ''; continue; } }
  else if (ch === ')') { depth--; if (depth === 0) { tups.push(cur); continue; } }
  if (depth > 0) cur += ch;
}

const rows = tups.filter(t => {
  const id = parseInt(t, 10);
  return id >= 38 && id <= 50;
});
console.log('baris akan dipulihkan:', rows.length);

for (const t of rows) {
  // ganti NULL literal -> NULL tetap valid di SQL; kutip string apa adanya
  await conn.execute(
    'INSERT INTO `payments` (`id`, `payment_code`, `contract_id`, `customer_id`, `amount`, `payment_method`, `payment_proof_path`, `status`, `payment_date`, `verified_by`, `verified_at`) VALUES (' +
      t.replace(/^\s*/, '') + ')'
  );
}

const cek = await conn.execute('SELECT COUNT(*) AS n FROM `payments`');
console.log('payments sekarang:', cek[0].n);
const st = await conn.execute(
  "SELECT `status`, COUNT(*) AS n FROM `payments` GROUP BY `status` ORDER BY `status`"
);
console.log(JSON.stringify(st));