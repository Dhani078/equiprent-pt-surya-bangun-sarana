// Verifikasi panel peringatan servis menghasilkan data dari state nyata.
import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const br = await import('../.tmp_businessRules.mjs');
const { stateStore } = await import('../.tmp_db.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

const alerts = br.getUnitsDueForService(stateStore.equipments, stateStore.maintenance);
const overdue = alerts.filter(a => a.status.isDue).length;

console.log('\n== Panel Servis dengan Data Nyata (50 unit, 25 log servis) ==');
console.log(`  Total unit: ${stateStore.equipments.length}`);
console.log(`  Total log maintenance: ${stateStore.maintenance.length}`);
console.log(`  Unit butuh perhatian: ${alerts.length}`);
console.log(`  Unit sudah jatuh tempo: ${overdue}`);

t('ada minimal 1 unit yang butuh perhatian (panel tidak kosong)', alerts.length > 0);
t('panel tidak menampilkan SEMUA unit (hanya yang relevan)', alerts.length < stateStore.equipments.length);
t('unit berstatus MAINTENANCE tidak muncul', !alerts.some(a => a.equipment.status === 'MAINTENANCE'));
t('semua alert punya data lengkap', alerts.every(a =>
  typeof a.equipment.name === 'string' && typeof a.status.currentHM === 'number'
));
t('urutan: yang paling mendesak di atas',
  alerts.length > 1 ? alerts[0].status.hmUntilNextService <= alerts[alerts.length-1].status.hmUntilNextService : true);

console.log('\n  5 unit teratas:');
alerts.slice(0, 5).forEach(a => {
  console.log(`   - ${a.equipment.equipment_code} | HM ${a.status.currentHM} | target ${a.status.nextServiceTargetHM} | ${a.status.isDue ? 'LEWAT' : 'SISA'} ${Math.abs(Math.round(a.status.hmUntilNextService))} HM`);
});

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
