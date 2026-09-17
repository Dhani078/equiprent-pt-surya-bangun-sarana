/**
 * Smoke test render: skeleton loading di halaman Equipment & Rental (T-0046).
 *
 * Memastikan keadaan `isLoading` benar-benar menggantikan tabel/data asli
 * (tidak ada "flash of empty content"), dan keadaan data/empty tetap utuh.
 * Menangkap regresi yang tidak terlihat type-check:
 *   - prop `isLoading` terlewat dipakai,
 *   - skeleton dirender bersamaan dengan tabel,
 *   - empty state tertelan oleh skeleton.
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const { stateStore } = await import('../.tmp_db.mjs');
const { EquipmentManagement } = await import('../.tmp_eqpage.mjs');
const { RentalManagement } = await import('../.tmp_rentpage.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };
const nope = () => {};
const nopeAsync = async () => {};

// ---------------------------------------------------------------------------
console.log('\n== Equipment: Skeleton Loading ==');
let html = renderToStaticMarkup(React.createElement(EquipmentManagement, {
  equipments: stateStore.equipments,
  onAddEquipment: nopeAsync,
  onUpdateEquipment: nopeAsync,
  onDeleteEquipment: nopeAsync,
  onNotify: nope,
  isLoading: true,
}));
t('aria-busy terpasang', html.includes('aria-busy="true"'));
t('grid 6 kartu skeleton dirender', (html.match(/skeleton-base/g) || []).length >= 10);
t('tabel asli tidak dirender', !html.includes('<table'));
t('tombol "Tambah Alat Baru" tidak dirender', !html.includes('Tambah Alat Baru'));

// ---------------------------------------------------------------------------
console.log('\n== Equipment: Data Ada ==');
html = renderToStaticMarkup(React.createElement(EquipmentManagement, {
  equipments: stateStore.equipments,
  onAddEquipment: nopeAsync,
  onUpdateEquipment: nopeAsync,
  onDeleteEquipment: nopeAsync,
  onNotify: nope,
  isLoading: false,
}));
t('tabel dirender', html.includes('<table'));
t('kode unit pertama tampil', html.includes(stateStore.equipments[0].equipment_code));
t('tombol "Tambah Alat Baru" tampil', html.includes('Tambah Alat Baru'));
t('tidak ada skeleton tersisa', !html.includes('aria-busy="true"'));

// ---------------------------------------------------------------------------
console.log('\n== Rental: Skeleton Loading ==');
html = renderToStaticMarkup(React.createElement(RentalManagement, {
  rentals: stateStore.rentals,
  equipments: stateStore.equipments,
  users: stateStore.users,
  contracts: stateStore.contracts,
  onAddRental: nopeAsync,
  onUpdateRentalStatus: nopeAsync,
  onCreateContract: nopeAsync,
  onSignContract: nopeAsync,
  isLoading: true,
}));
t('aria-busy terpasang', html.includes('aria-busy="true"'));
t('tepat 5 baris skeleton', (html.match(/skeleton-base/g) || []).length === 5);
t('tabel asli tidak dirender', !html.includes('<table'));
// Empty state tidak boleh muncul saat loading — itulah "flash of empty content".
t('empty state tidak tampil', !html.includes('Tidak ada transaksi'));

// ---------------------------------------------------------------------------
console.log('\n== Rental: Data Ada ==');
html = renderToStaticMarkup(React.createElement(RentalManagement, {
  rentals: stateStore.rentals,
  equipments: stateStore.equipments,
  users: stateStore.users,
  contracts: stateStore.contracts,
  onAddRental: nopeAsync,
  onUpdateRentalStatus: nopeAsync,
  onCreateContract: nopeAsync,
  onSignContract: nopeAsync,
  isLoading: false,
}));
t('tabel dirender', html.includes('<table'));
t('kode sewa pertama tampil', html.includes(stateStore.rentals[0].rental_code));

// ---------------------------------------------------------------------------
console.log('\n== Rental: Empty State (bukan loading) ==');
html = renderToStaticMarkup(React.createElement(RentalManagement, {
  rentals: [],
  equipments: [],
  users: stateStore.users,
  contracts: [],
  onAddRental: nopeAsync,
  onUpdateRentalStatus: nopeAsync,
  onCreateContract: nopeAsync,
  onSignContract: nopeAsync,
  isLoading: false,
}));
t('empty state tampil', html.includes('Tidak ada transaksi yang cocok'));
t('skeleton tidak tampil saat kosong', !html.includes('aria-busy="true"'));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
