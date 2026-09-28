// Pulihkan valid_until kontrak 38..50 dari seed kanonik hanya_isi_data.sql.
// Terjadi karena harness verifikasi siklus 73 memperpanjang SEMUA kontrak
// kedaluwarsa saat mencari kasus "kontrak masih berlaku".
import fs from 'node:fs';
import { connect } from '@tidbcloud/serverless';

const vars = fs.readFileSync('.dev.vars', 'utf8');
const url = vars.match(/DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/)[1];
const conn = connect({ url });

const want = JSON.parse(fs.readFileSync('STATE/_restore_contracts.json', 'utf8'));
for (const [id, validUntil] of Object.entries(want)) {
  await conn.execute('UPDATE `contracts` SET `valid_until` = ? WHERE `id` = ?', [validUntil, Number(id)]);
}

const rows = await conn.execute(
  "SELECT `id`, `valid_until`, `is_signed_customer` FROM `contracts` WHERE `id` BETWEEN 38 AND 50 ORDER BY `id`"
);
for (const r of rows) {
  const flag = r.is_signed_customer ? 'signed' : (String(r.valid_until).slice(0, 10) < '2026-09-28' ? 'kedaluwarsa' : 'BERLAKU');
  console.log(r.id, String(r.valid_until).slice(0, 10), flag);
}
const n = await conn.execute('SELECT COUNT(*) AS n FROM `contracts`');
console.log('total contracts:', n[0].n);