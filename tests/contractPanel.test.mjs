/**
 * Uji render panel kontrak digital (src/components/ContractPanel.tsx).
 *
 * Mengapa perlu: type-check tidak menangkap regresi render. Panel ini kini
 * dipakai di TIGA tempat (Admin, Staf, Pelanggan) dengan kombinasi props
 * berbeda — sebuah kombinasi yang salah bisa membuat halaman kosong atau
 * tombol mati tanpa satu pun error TypeScript.
 *
 * Fokus:
 *   1. Render pada data nyata, kosong, dan hasil pencarian nihil.
 *   2. Hak akses: `canIssue` menyembunyikan tombol terbit bagi Pelanggan.
 *   3. Kontrak yang sudah ditandatangani tidak lagi menawarkan e-sign.
 *   4. Aksesibilitas: aria-label pada kontrol utama.
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const { ContractPanel } = await import('../.tmp_contractpanel.mjs');
const { stateStore } = await import('../.tmp_db.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

const S = stateStore;
const tidakAda = async () => {};

/** Render panel; props bisa ditimpa sebagian. */
function render(override = {}) {
  return renderToStaticMarkup(
    React.createElement(ContractPanel, {
      contracts: S.contracts,
      rentals: S.rentals,
      equipments: S.equipments,
      users: S.users,
      onCreateContract: tidakAda,
      onSignContract: tidakAda,
      ...override,
    })
  );
}

// ---------------------------------------------------------------------------
console.log('\n== Render: Data Nyata ==');
let html = render();
t('panel dapat dirender tanpa error', typeof html === 'string' && html.length > 0);
t('judul bawaan tampil', html.includes('Manajemen Kontrak Digital'));
t('jumlah kontrak tercatat tampil', html.includes(`${S.contracts.length} kontrak tercatat`));
t('tabel kontrak dirender', html.includes('<table'));
t('kepala kolom kode kontrak tampil', html.includes('Kode Kontrak'));
t('kode kontrak berformat SBS/CONTRACT tampil', html.includes('SBS/CONTRACT/'));
t('tombol terbit tersedia (default Admin/Staf)', html.includes('Terbitkan Kontrak'));
t('tombol tinjau tersedia', html.includes('Tinjau'));

// ---------------------------------------------------------------------------
console.log('\n== Hak Akses: Pelanggan ==');
html = render({ canIssue: false });
t('tombol terbit disembunyikan bagi pelanggan', !html.includes('Terbitkan Kontrak'));
t('tabel tetap tampil bagi pelanggan', html.includes('<table'));

// ---------------------------------------------------------------------------
console.log('\n== Kontrak Sudah Ditandatangani ==');
const semuaSigned = S.contracts.map((c) => ({ ...c, is_signed_customer: 1 }));
html = render({ contracts: semuaSigned });
t('tombol tanda tangan hilang bila semua sudah ditandatangani', !html.includes('Tanda Tangani'));
t('badge status "Telah Ditandatangani" tampil', html.includes('Telah Ditandatangani'));

const semuaBelum = S.contracts.map((c) => ({ ...c, is_signed_customer: 0 }));
html = render({ contracts: semuaBelum });
t('tombol tanda tangan tampil bila belum ditandatangani', html.includes('Tanda Tangani'));
t('badge status "Menunggu Tanda Tangan" tampil', html.includes('Menunggu Tanda Tangan'));

// ---------------------------------------------------------------------------
console.log('\n== Empty State ==');
html = render({ contracts: [] });
t('empty state tampil bila belum ada kontrak', html.includes('Belum ada kontrak yang diterbitkan.'));
t('tabel tidak dirender pada keadaan kosong', !html.includes('<table'));

// Tombol terbit dinonaktifkan hanya bila TIDAK ADA sewa yang layak
// diterbitkan kontraknya — bukan sekadar karena daftar kontrak kosong.
html = render({ contracts: [], rentals: [] });
t('tombol terbit nonaktif bila tidak ada sewa yang layak', html.includes('disabled'));

// ---------------------------------------------------------------------------
console.log('\n== Aksesibilitas ==');
html = render();
t('ada label pada kotak pencarian', html.includes('aria-label="Cari kontrak"'));
t('ada label pada penyaring status', html.includes('aria-label="Saring status tanda tangan"'));
t('ada label pada tombol terbit', html.includes('aria-label="Terbitkan kontrak baru"'));
t('ada label aria pada tombol tinjau per kontrak', /aria-label="Tinjau kontrak SBS\/CONTRACT/.test(html));

// ---------------------------------------------------------------------------
console.log('\n== Ketahanan Data Rusak ==');
let tangguh = true;
try {
  render({
    contracts: [
      {
        id: 1,
        contract_code: 'SBS/CONTRACT/2026/09/0001',
        rental_id: 999999,
        rental_code: null,
        customer_id: 999999,
        customer_name: null,
        contract_date: 'bukan-tanggal',
        valid_until: null,
        terms_conditions: '',
        is_signed_customer: 0,
        signed_at: null,
        signer_name: null,
        signature_data_url: null,
      },
    ],
    rentals: [],
    equipments: [],
    users: [],
  });
} catch {
  tangguh = false;
}
t('panel tidak crash pada kontrak dengan rujukan rusak', tangguh);

// Kontrak dengan goresan berbahaya tidak boleh menyisipkan atribut src mentah.
html = render({
  contracts: [
    {
      id: 2,
      contract_code: 'SBS/CONTRACT/2026/09/0002',
      rental_id: 1,
      rental_code: 'RNT-1',
      customer_id: 1,
      customer_name: 'Uji',
      contract_date: '2026-09-01',
      valid_until: '2026-09-30',
      terms_conditions: '',
      is_signed_customer: 1,
      signed_at: '2026-09-01 10:00:00',
      signer_name: 'Uji',
      signature_data_url: 'javascript:alert(1)',
    },
  ],
});
t('goresan berbahaya tidak disematkan ke atribut src', !html.includes('src="javascript:'));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
