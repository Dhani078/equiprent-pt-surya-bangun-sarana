/**
 * Audit konsistensi seluruh state.
 * Mencari inkonsistensi yang bisa jadi bug: unit RENTED tanpa rental aktif,
 * unit AVAILABLE padahal sedang disewa, rental ON_GOING tanpa unit, dsb.
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const br = await import('../.tmp_businessRules.mjs');
const { stateStore } = await import('../.tmp_db.mjs');
const S = stateStore;

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

const rentalAktif = (r) => r.status === 'ON_GOING' || r.status === 'APPROVED';

console.log('\n== Konsistensi Status Unit vs Rental ==');

// Unit RENTED harus punya rental aktif
const rented = S.equipments.filter(e => e.status === 'RENTED');
const rentedTanpaRental = rented.filter(e =>
  !S.rentals.some(r => r.equipment_id === e.id && rentalAktif(r))
);
t('setiap unit RENTED punya rental aktif', rentedTanpaRental.length === 0);
if (rentedTanpaRental.length) console.log(`    → ${rentedTanpaRental.length} unit bermasalah: ${rentedTanpaRental.slice(0,5).map(e=>e.equipment_code).join(', ')}`);

// Rental aktif harus menempati unit berstatus RENTED
const aktif = S.rentals.filter(rentalAktif);
const rentalUnitSalah = aktif.filter(r => {
  const eq = S.equipments.find(e => e.id === r.equipment_id);
  return eq && eq.status !== 'RENTED';
});
t('setiap rental aktif menempati unit berstatus RENTED', rentalUnitSalah.length === 0);
if (rentalUnitSalah.length) console.log(`    → ${rentalUnitSalah.length} rental bermasalah`);

// Tidak ada double-booking: 1 unit tidak boleh punya 2 rental aktif
const perUnit = new Map();
for (const r of aktif) perUnit.set(r.equipment_id, (perUnit.get(r.equipment_id) || 0) + 1);
const dobel = [...perUnit.entries()].filter(([, n]) => n > 1);
t('tidak ada double-booking unit', dobel.length === 0);
if (dobel.length) console.log(`    → unit dobel: ${dobel.map(([id,n])=>`${id}(${n}x)`).join(', ')}`);

console.log('\n== Konsistensi Pembayaran ==');
const paidTanpaKontrak = S.payments.filter(p =>
  p.status === 'PAID' && !S.contracts.some(c => c.id === p.contract_id)
);
t('setiap pembayaran PAID punya kontrak', paidTanpaKontrak.length === 0);

const bayarLebih = S.payments.filter(p => {
  const c = S.contracts.find(x => x.id === p.contract_id);
  const r = c ? S.rentals.find(x => x.id === c.rental_id) : null;
  return r && Number(p.amount) > Number(r.subtotal) * 1.5;
});
t('tidak ada pembayaran melebihi 150% subtotal', bayarLebih.length === 0);

console.log('\n== Konsistensi Kontrak ==');
const kontrakTanpaSewa = S.contracts.filter(c => !S.rentals.some(r => r.id === c.rental_id));
t('setiap kontrak punya rental', kontrakTanpaSewa.length === 0);

const sewaAktifTanpaKontrak = S.rentals.filter(r =>
  rentalAktif(r) && !S.contracts.some(c => c.rental_id === r.id)
);
t('rental aktif punya kontrak', sewaAktifTanpaKontrak.length === 0);
if (sewaAktifTanpaKontrak.length) console.log(`    → ${sewaAktifTanpaKontrak.length} rental tanpa kontrak`);

console.log('\n== Konsistensi Servis ==');
const servisAktif = S.maintenance.filter(m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS');
const unitServis = S.equipments.filter(e => e.status === 'MAINTENANCE');
t('ada unit berstatus MAINTENANCE', unitServis.length > 0);
t('unit MAINTENANCE tidak sedang disewa',
  unitServis.every(e => !S.rentals.some(r => r.equipment_id === e.id && rentalAktif(r))));
t('log servis punya scheduled_date valid', S.maintenance.every(m => Number.isFinite(new Date(m.scheduled_date).getTime())));
t('completion_date (bila ada) valid', S.maintenance.every(m =>
  !m.completion_date || Number.isFinite(new Date(m.completion_date).getTime())));
t('completion_date tidak sebelum scheduled_date', S.maintenance.every(m =>
  !m.completion_date || new Date(m.completion_date) >= new Date(m.scheduled_date)));
t('biaya servis tidak negatif', S.maintenance.every(m => Number(m.cost) >= 0));

console.log('\n== Konsistensi GPS ==');
const unitAktif = S.equipments.filter(e => e.status === 'RENTED');
t('unit RENTED punya titik GPS', unitAktif.every(e => S.gps.some(p => p.equipment_id === e.id)));
t('koordinat GPS valid', S.gps.every(p =>
  Number.isFinite(p.latitude) && Number.isFinite(p.longitude) &&
  Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180));

console.log('\n== Integritas Pengguna ==');
t('setiap user punya role valid', S.users.every(u => [1,2,3].includes(u.role_id)));
t('role_id cocok dengan role_name', S.users.every(u =>
  (u.role_id === 1 && u.role_name === 'ADMIN') ||
  (u.role_id === 2 && u.role_name === 'STAFF') ||
  (u.role_id === 3 && u.role_name === 'CUSTOMER')));
t('ada minimal 1 admin', S.users.filter(u => u.role_id === 1).length >= 1);
t('ada minimal 1 staff', S.users.filter(u => u.role_id === 2).length >= 1);
t('ada banyak customer', S.users.filter(u => u.role_id === 3).length >= 10);
t('email mengandung @', S.users.every(u => u.email.includes('@')));

console.log('\n== Kode Unik Global ==');
const kodeUnik = (arr, k) => new Set(arr.map(x => x[k])).size === arr.length;
t('rental_code unik', kodeUnik(S.rentals, 'rental_code'));
t('contract_code unik', kodeUnik(S.contracts, 'contract_code'));
t('maintenance_code unik', kodeUnik(S.maintenance, 'maintenance_code'));
t('report_code unik', kodeUnik(S.reports, 'report_code'));
t('equipment_code unik', kodeUnik(S.equipments, 'equipment_code'));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
