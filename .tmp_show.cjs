const arr = require('./.tmp_seed.cjs').GENERATED_PAYMENTS;
const lost = arr.filter(p => p.id >= 38 && p.id <= 51 && p.status !== 'PAID');
console.log('total', arr.length, '| hilang (non-PAID 38..51):', lost.length);
console.log(JSON.stringify(lost, null, 0));