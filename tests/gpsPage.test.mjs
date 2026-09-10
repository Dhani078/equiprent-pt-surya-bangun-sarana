/**
 * Smoke test render halaman Pelacakan GPS (T-0010).
 *
 * Menangkap regresi yang tidak terlihat oleh type-check:
 *   - akses properti undefined saat data kosong,
 *   - error saat hasil penyaringan 0 baris,
 *   - aria-label / empty state yang hilang.
 *
 * Catatan: Leaflet diganti dengan stub (lihat tests/stubs/leaflet.mjs)
 * karena pustaka asli menyentuh `window` saat dimuat. `useEffect` — tempat
 * Leaflet dipanggil — tidak berjalan pada `renderToStaticMarkup`, jadi yang
 * diuji adalah struktur & logika tampilan.
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const { GpsTrackingPage } = await import('../.tmp_gps.mjs');
const ft = await import('../.tmp_fleetTelemetry.mjs');
const { stateStore } = await import('../.tmp_db.mjs');
const S = stateStore;

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

/** Render halaman dengan data terkendali, kembalikan HTML. */
function render(trackingData) {
  return renderToStaticMarkup(
    React.createElement(GpsTrackingPage, { trackingData })
  );
}

/** Render dengan filter awal — dipakai untuk menguji cabang hasil kosong. */
function renderKosong(trackingData, initialFilter) {
  return renderToStaticMarkup(
    React.createElement(GpsTrackingPage, { trackingData, initialFilter })
  );
}

// ---------------------------------------------------------------------------
console.log('\n== Render: Data Seed Nyata ==');
let html = render(S.gps);
t('halaman dapat dirender', html.length > 0);
t('judul halaman tampil', html.includes('Pelacakan Telemetri GPS Alat Berat'));
t('panel penyaringan tampil', html.includes('Penyaringan Telemetri'));
t('filter status mesin ada', html.includes('Semua Status Mesin'));
t('filter pergerakan ada', html.includes('Semua Pergerakan'));
t('filter BBM ada', html.includes('Semua Level BBM'));
t('kotak pencarian ada', html.includes('Cari Unit'));
t('tombol reset ada', html.includes('Reset Filter'));
t('peta ikut dirender (kontainer)', html.includes('map-container'));

const view = ft.buildFleetTelemetry(S.gps, { role: 'ADMIN', equipmentIds: null });
t('jumlah unit tampil pada daftar', html.includes(`Daftar Armada Terhubung (${view.rows.length} Unit)`));
t('ringkasan unit terlacak tampil', html.includes('Unit Terlacak'));
t('ringkasan mesin menyala tampil', html.includes('Mesin Menyala'));
t('ringkasan BBM kritis tampil', html.includes('BBM Kritis / Rendah'));

// ---------------------------------------------------------------------------
console.log('\n== Aksesibilitas ==');
t('label pada pemilih status mesin', html.includes('aria-label="Saring berdasarkan status mesin"'));
t('label pada pemilih pergerakan', html.includes('aria-label="Saring berdasarkan pergerakan unit"'));
t('label pada pemilih BBM', html.includes('aria-label="Saring berdasarkan level bahan bakar"'));
t('label pada kotak pencarian', html.includes('aria-label="Cari unit berdasarkan kode, nama, atau ID"'));
t('label pada tombol reset', html.includes('aria-label="Reset semua penyaringan telemetri"'));
t('setiap tombol unit punya aria-label', html.includes('aria-label="Pilih unit '));
t('label for terhubung ke input', html.includes('for="filter-engine"'));

// ---------------------------------------------------------------------------
console.log('\n== Render: Data Kosong (Empty State) ==');
html = render([]);
t('halaman tidak error saat tanpa data', html.length > 0);
t('empty state tampil', html.includes('Belum ada data telemetri GPS'));
t('daftar menampilkan 0 unit', html.includes('Daftar Armada Terhubung (0 Unit)'));
t('ringkasan aman (0 unit)', html.includes('Unit Terlacak'));
t('tidak ada panel rincian unit', !html.includes('Pembaruan Terakhir'));
t('penyaringan tetap tampil', html.includes('Penyaringan Telemetri'));

// ---------------------------------------------------------------------------
console.log('\n== Render: Hasil Penyaringan Kosong ==');
// Kata kunci mustahil → data ADA, tetapi tersaring habis. Ini cabang yang
// berbeda dengan "belum ada data" dan punya pesannya sendiri.
html = renderKosong(S.gps, { search: 'zzzzz-tidak-mungkin-ada-zzzzz' });
t('penyaringan kosong tidak menampilkan empty state tanpa data',
  !html.includes('Belum ada data telemetri GPS'));
t('penyaringan kosong menampilkan pesan tersendiri',
  html.includes('Tidak ada unit yang cocok dengan penyaringan ini'));
t('penyaringan kosong tetap menyebut tombol Reset', html.includes('Reset Filter'));
t('daftar menunjukkan 0 unit', html.includes('Daftar Armada Terhubung (0 Unit)'));
t('halaman tidak error saat hasil kosong', html.length > 0);

// ---------------------------------------------------------------------------
console.log('\n== Render: Data Rusak Tidak Merusak Halaman ==');
const rusak = [
  { id: 1, equipment_id: 5, equipment_name: 'Unit Rusak', equipment_code: 'XX-01', latitude: 999, longitude: 999, speed: -10, engine_status: 'ON', fuel_level_percent: 500, recorded_at: 'bukan-tanggal' },
  { id: 2, equipment_id: 6, equipment_name: 'Unit Valid', equipment_code: 'OK-02', latitude: -3.3, longitude: 114.5, speed: 12, engine_status: 'ON', fuel_level_percent: 40, recorded_at: '2026-09-04 12:00:00' },
];
html = render(rusak);
t('halaman tetap dirender walau ada data rusak', html.length > 0);
t('unit valid tetap tampil', html.includes('OK-02'));
t('koordinat tidak valid dibuang/diamankan', !html.includes('999'));

// ---------------------------------------------------------------------------
console.log('\n== Render: Judul & Subjudul Kustom (Portal Pelanggan) ==');
html = renderToStaticMarkup(
  React.createElement(GpsTrackingPage, {
    trackingData: S.gps,
    title: 'Lacak Unit Saya',
    subtitle: 'Hanya unit yang sedang Anda sewa.',
  })
);
t('judul kustom dipakai', html.includes('Lacak Unit Saya'));
t('subjudul kustom dipakai', html.includes('Hanya unit yang sedang Anda sewa.'));
t('judul bawaan tidak tampil', !html.includes('Pelacakan Telemetri GPS Alat Berat'));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
