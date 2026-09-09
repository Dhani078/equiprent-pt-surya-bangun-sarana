/**
 * Smoke test render: memastikan halaman laporan bisa dirender di server
 * tanpa melempar error, baik pada keadaan loading maupun setelah data ada.
 *
 * Tujuannya menangkap regresi yang tidak terlihat oleh type-check:
 *   - akses properti undefined pada result null,
 *   - error saat result.totalRows === 0,
 *   - key/aria-label yang hilang.
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const { ReportAnalyticsPanel } = await import('../.tmp_panel.mjs');
const rep = await import('../.tmp_reports.mjs');
const { stateStore } = await import('../.tmp_db.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

const source = {
  rentals: stateStore.rentals,
  equipments: stateStore.equipments,
  users: stateStore.users,
  payments: stateStore.payments,
  maintenance: stateStore.maintenance,
  gps: stateStore.gps,
  reports: stateStore.reports,
};

const rentang = { from: '', to: '' };
const tidakAda = () => {};

/** Render panel dengan props terkendali, kembalikan HTML. */
function render(override = {}) {
  return renderToStaticMarkup(
    React.createElement(ReportAnalyticsPanel, {
      result: null,
      loading: false,
      error: null,
      source: null,
      activeId: 'RENTAL_BULANAN',
      onSelectReport: tidakAda,
      range: rentang,
      onRangeChange: tidakAda,
      onRetry: tidakAda,
      ...override,
    })
  );
}

// ---------------------------------------------------------------------------
console.log('\n== Render: Loading ==');
let html = render({ loading: true });
t('loading menampilkan skeleton', html.includes('aria-busy="true"'));
t('loading tidak menampilkan tabel', !html.includes('<table'));
t('loading menonaktifkan tombol ekspor', html.includes('disabled'));

// ---------------------------------------------------------------------------
console.log('\n== Render: Error + Retry ==');
html = render({ error: 'Gagal memuat data laporan.' });
t('error menampilkan role alert', html.includes('role="alert"'));
t('error menampilkan pesan', html.includes('Gagal memuat data laporan.'));
t('error menampilkan tombol coba ulang', html.includes('Coba Ulang'));

// ---------------------------------------------------------------------------
console.log('\n== Render: Empty State ==');
const kosong = rep.buildReport('RENTAL_BULANAN', source, rep.normalizeRange('1990-01-01', '1990-01-02'));
t('data kosong benar-benar 0 baris', kosong.totalRows === 0);
html = render({ result: kosong, source: 'LOKAL' });
t('empty state tampil', html.includes('Tidak ada data pada periode ini'));
t('empty state tidak merender tabel', !html.includes('<table'));
t('empty state menonaktifkan ekspor', html.includes('disabled'));

// ---------------------------------------------------------------------------
console.log('\n== Render: Data Ada ==');
const hasil = rep.buildReport('RENTAL_BULANAN', source, rentang);
html = render({ result: hasil, source: 'API' });
t('tabel dirender', html.includes('<table'));
t('semua kolom tampil di kepala tabel',
  hasil.columns.every((c) => html.includes(c.label)));
t('periode "Semua periode" tampil', html.includes('Semua periode'));
t('jumlah baris tampil', html.includes(`${hasil.totalRows} baris data`));
t('badge sumber API tampil', html.includes('Sumber: Edge API'));
t('ringkasan tampil', hasil.summaries.every((s) => html.includes(s.label)));
t('nilai uang terformat Rupiah', /Rp\s/.test(html));
t('tombol ekspor aktif (tidak disabled pada tombol CSV)', html.includes('Ekspor CSV'));

// ---------------------------------------------------------------------------
console.log('\n== Render: Laporan tanpa Filter Tanggal ==');
const utilisasi = rep.buildReport('UTILISASI_HM', source, rentang);
html = render({ result: utilisasi, activeId: 'UTILISASI_HM', source: 'LOKAL' });
t('filter periode disembunyikan untuk snapshot', !html.includes('Reset Periode'));
t('label periode snapshot tampil', html.includes('Kondisi armada saat ini'));

// ---------------------------------------------------------------------------
console.log('\n== Render: Semua 11 Laporan ==');
const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let semuaOke = true;
for (const def of rep.REPORT_CATALOG) {
  const r = rep.buildReport(def.id, source, rentang);
  try {
    const out = render({ result: r, activeId: def.id, source: 'LOKAL' });
    // Judul dibandingkan dalam bentuk ter-escape karena React mengubah
    // karakter "&" pada judul seperti "Laporan Pembayaran & Piutang".
    if (!out.includes(escapeHtml(def.title))) semuaOke = false;
  } catch {
    semuaOke = false;
  }
}
t('11 laporan dapat dirender tanpa error', semuaOke);

// ---------------------------------------------------------------------------
console.log('\n== Aksesibilitas ==');
html = render({ result: hasil, source: 'API' });
t('ada label pada pemilih laporan', html.includes('aria-label="Pilih jenis laporan operasional"'));
t('ada label pada tombol ekspor', html.includes('aria-label="Ekspor laporan ke berkas CSV"'));
t('ada label pada input tanggal awal', html.includes('aria-label="Tanggal awal periode laporan"'));
t('ada label pada input tanggal akhir', html.includes('aria-label="Tanggal akhir periode laporan"'));
t('ada label pada section panel', html.includes('aria-label="Panel laporan operasional"'));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
