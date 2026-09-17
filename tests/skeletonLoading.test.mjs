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
const { HmProgressBar, buildHmTooltip } = await import('../.tmp_hmbar.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };
const nope = () => {};
const nopeAsync = async () => {};

// Prop dasar yang dipakai semua render Equipment (T-0047/T-0048 menambah
// maintenance + onScheduleMaintenance).
const baseEqProps = {
  equipments: stateStore.equipments,
  maintenance: stateStore.maintenance,
  onAddEquipment: nopeAsync,
  onUpdateEquipment: nopeAsync,
  onDeleteEquipment: nopeAsync,
  onScheduleMaintenance: nopeAsync,
  onNotify: nope,
};

// ---------------------------------------------------------------------------
console.log('\n== Equipment: Skeleton Loading ==');
let html = renderToStaticMarkup(React.createElement(EquipmentManagement, {
  ...baseEqProps,
  isLoading: true,
}));
t('aria-busy terpasang', html.includes('aria-busy="true"'));
t('grid 6 kartu skeleton dirender', (html.match(/skeleton-base/g) || []).length >= 10);
t('tabel asli tidak dirender', !html.includes('<table'));
t('tombol "Tambah Alat Baru" tidak dirender', !html.includes('Tambah Alat Baru'));

// ---------------------------------------------------------------------------
console.log('\n== Equipment: Data Ada ==');
html = renderToStaticMarkup(React.createElement(EquipmentManagement, {
  ...baseEqProps,
  isLoading: false,
}));
t('kartu unit dirender (default)', html.includes(stateStore.equipments[0].equipment_code));
t('toggle tampilan kartu/tabel tampil', html.includes('aria-pressed'));
t('badge status di kartu unit', /badge-(available|rented|maintenance|unavailable)/.test(html));
t('label tarif per hari di kartu', html.includes('Tarif / Hari'));
t('label servis terakhir di kartu', html.includes('Servis terakhir'));
t('tombol "Tambah Alat Baru" tampil', html.includes('Tambah Alat Baru'));
t('tidak ada skeleton tersisa', !html.includes('aria-busy="true"'));

// ---------------------------------------------------------------------------
console.log('\n== Equipment: Quick-Action Jadwalkan Servis ==');
// Cari unit yang menurut aturan bisnis sudah/mendekati ambang 250 HM.
const { getServiceStatus } = await import('../.tmp_businessRules.mjs');
const yangButuhServis = stateStore.equipments
  .map((e) => ({ e, s: getServiceStatus(e, stateStore.maintenance) }))
  .filter(({ e, s }) => (s.isDue || s.isApproaching) && e.status !== 'MAINTENANCE');
t('ada minimal satu unit yang butuh servis', yangButuhServis.length > 0);
if (yangButuhServis.length) {
  html = renderToStaticMarkup(React.createElement(EquipmentManagement, {
    ...baseEqProps,
    isLoading: false,
  }));
  t('tombol "Jadwalkan Servis" muncul di kartu', html.includes('Jadwalkan Servis'));
  t('aria-label aksi servis menyebut kode unit',
    html.includes(`Jadwalkan servis ${yangButuhServis[0].e.equipment_code}`));
} else {
  console.log('  (lewati — tidak ada unit butuh servis di seed)');
}

// ---------------------------------------------------------------------------
console.log('\n== Equipment: Tampilan Tabel ==');
// Render ulang dengan view 'table' tidak bisa lewat prop (state internal),
// jadi pastikan saja toggle-nya hadir dan tabel tidak dirender bersama kartu.
t('hanya satu tata letak yang dirender',
  html.includes('Kartu') && html.includes('Tabel') && !html.includes('<table'));

// ---------------------------------------------------------------------------
console.log('\n== HmProgressBar (T-0047) ==');
const unit = stateStore.equipments[0];
const svcStatus = getServiceStatus(unit, stateStore.maintenance);
html = renderToStaticMarkup(React.createElement(HmProgressBar, {
  equipment: unit,
  maintenanceHistory: stateStore.maintenance,
}));
const warnaBar = html.match(/background-color:([^;"]+)/g) || [];
t('bar progress terrender', warnaBar.length >= 2);
t('tooltip berisi HM saat ini', (html.match(/title="[^"]*"/)?.[0] || '').includes('HM saat ini'));
t('aria-label tooltip dapat diakses', html.includes('aria-label'));
const tooltip = buildHmTooltip(svcStatus);
t('tooltip menyebut target servis', tooltip.includes('Target servis berikutnya'));
t('tooltip menyebut sisa HM', /Sisa \d|Lewat \d/.test(tooltip));
// Warna konsisten dengan status: hijau aman / kuning mendekati / merah lewat.
const tone = svcStatus.isDue ? '#DC2626' : svcStatus.isApproaching ? '#D97706' : '#059669';
t(`bar berwarna sesuai status (${tone})`, html.includes(tone.toLowerCase()));


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
