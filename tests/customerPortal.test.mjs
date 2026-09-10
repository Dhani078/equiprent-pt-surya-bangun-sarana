/**
 * Pengujian Mesin Portal Pelanggan (T-0011)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Modul `src/lib/customerPortal.ts` adalah tempat berkumpulnya aturan yang
 * paling sering dilanggar pada portal pelanggan. Karena itu pengujiannya
 * difokuskan pada HAL-HAL YANG PERNAH SALAH:
 *
 *   1. Katalog menampilkan unit `maintenance` / `retired` (kriteria
 *      penerimaan: "Katalog hanya tampilkan unit available").
 *   2. Katalog mengabaikan bentrokan jadwal → pelanggan mengajukan unit
 *      yang sudah dipesan orang lain.
 *   3. Riwayat sewa menampilkan data pelanggan lain (kebocoran lintas akun).
 *   4. Estimasi biaya berbeda dengan angka yang tercetak pada dokumen
 *      (perbedaan rumus hari: `round` vs `ceil + 1`).
 *   5. Tanda tangan & unggah bukti ditawarkan pada status yang salah.
 */

import assert from 'node:assert/strict';
import * as cp from '../.tmp_customerPortal.mjs';
import * as av from '../.tmp_availability.mjs';

// ---------------------------------------------------------------------------
// Mini Test Runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function t(nama, fn) {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failed += 1;
    failures.push([nama, err?.message ?? String(err)]);
  }
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const TODAY = '2026-09-10';
const BESOK = '2026-09-11';
const SEMINGGU = '2026-09-17';
const JAUH = '2026-12-01';
const JAUH_AKHIR = '2026-12-10';

/** Membuat unit dengan nilai bawaan yang masuk akal. */
function unit(overrides = {}) {
  return {
    id: 1,
    equipment_code: 'EXC-001',
    name: 'Excavator PC200',
    type: 'Excavator',
    model: 'PC200-8',
    brand: 'Komatsu',
    hour_meter: 4200,
    rental_price_per_day: 2_500_000,
    status: 'AVAILABLE',
    last_maintenance_date: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function rental(overrides = {}) {
  return {
    id: 1,
    rental_code: 'RNT-0001',
    customer_id: 900,
    customer_name: 'Bapak Anton Wijaya',
    equipment_id: 1,
    booking_date: '2026-09-01',
    start_date: TODAY,
    end_date: SEMINGGU,
    total_days: 8,
    subtotal: 20_000_000,
    status: 'APPROVED',
    ...overrides,
  };
}

function kontrak(overrides = {}) {
  return {
    id: 10,
    contract_code: 'CTR-0010',
    rental_id: 1,
    customer_id: 900,
    customer_name: 'Bapak Anton Wijaya',
    contract_date: '2026-09-05',
    valid_until: '2026-09-30',
    terms_conditions: 'Syarat standar.',
    is_signed_customer: 0,
    signed_at: null,
    ...overrides,
  };
}

function tagihan(overrides = {}) {
  return {
    id: 20,
    payment_code: 'PAY-0020',
    contract_id: 10,
    customer_id: 900,
    customer_name: 'Bapak Anton Wijaya',
    amount: 20_000_000,
    payment_method: 'TRANSFER',
    status: 'UNPAID',
    payment_date: '2026-09-06',
    ...overrides,
  };
}

const PELANGGAN_A = { id: 900, full_name: 'Bapak Anton Wijaya' };
const PELANGGAN_B = { id: 901, full_name: 'Ibu Siti Rahmawati' };

// ---------------------------------------------------------------------------
// 1. Kepemilikan — dinding terpenting antar pelanggan
// ---------------------------------------------------------------------------

t('sewa milik sendiri lolos berdasarkan customer_id', () => {
  assert.equal(cp.isOwnedBy(rental({ customer_id: 900 }), PELANGGAN_A), true);
});

t('sewa pelanggan lain TIDAK pernah lolos (ID berbeda & nama berbeda)', () => {
  const baris = rental({ customer_id: 901, customer_name: 'Ibu Siti Rahmawati' });
  assert.equal(cp.isOwnedBy(baris, PELANGGAN_A), false);
});

t('baris tanpa customer_id cocok lewat nama (sapaan diabaikan)', () => {
  // Nama pengguna "Bapak Anton Wijaya" vs kolom sewa "CV Anton Wijaya
  // Sejahtera" — sapaan & bentuk badan usaha tidak boleh memutus riwayat.
  const baris = rental({ customer_id: 0, customer_name: 'CV Anton Wijaya Sejahtera' });
  assert.equal(cp.isOwnedBy(baris, PELANGGAN_A), true);
});

t('dua baris tanpa ID & tanpa nama TIDAK saling cocok', () => {
  // Dulu `customer_id === 0` langsung dianggap cocok → pelanggan dapat
  // melihat baris milik pelanggan lain yang kebetulan sama-sama kehilangan ID.
  const baris = rental({ customer_id: 0, customer_name: 'Ibu Siti Rahmawati' });
  assert.equal(cp.isOwnedBy(baris, PELANGGAN_A), false);
});

t('nama yang hanya beririsan sebagian tidak pernah cocok', () => {
  const baris = rental({ customer_id: 0, customer_name: 'Anton Kurniawan' });
  assert.equal(cp.isOwnedBy(baris, PELANGGAN_A), false);
});

t('nama pelanggan kosong tidak mengklaim semua baris', () => {
  const baris = rental({ customer_id: 0, customer_name: 'CV Anton Wijaya' });
  assert.equal(cp.isOwnedBy(baris, { id: 0, full_name: '   ' }), false);
});

t('baris tanpa customer_name tidak diklaim lewat nama', () => {
  const baris = rental({ customer_id: 0 });
  delete baris.customer_name;
  assert.equal(cp.isOwnedBy(baris, PELANGGAN_A), false);
});

t('selectMyRentals hanya mengembalikan milik pelanggan ini', () => {
  const semua = [
    rental({ id: 1, customer_id: 900, booking_date: '2026-09-01' }),
    rental({ id: 2, customer_id: 901, booking_date: '2026-09-02', customer_name: 'Ibu Siti Rahmawati' }),
    rental({ id: 3, customer_id: 900, booking_date: '2026-09-03' }),
  ];
  const punya = cp.selectMyRentals(semua, PELANGGAN_A);
  assert.equal(punya.length, 2);
  assert.deepEqual(punya.map((r) => r.id), [3, 1]); // terbaru di atas
});

t('selectMyPayments / selectMyContracts ikut aturan kepemilikan yang sama', () => {
  const tagihanSemua = [
    tagihan({ id: 1, customer_id: 900, payment_date: '2026-09-01' }),
    tagihan({ id: 2, customer_id: 901, payment_date: '2026-09-02', customer_name: 'Ibu Siti Rahmawati' }),
  ];
  assert.deepEqual(cp.selectMyPayments(tagihanSemua, PELANGGAN_A).map((p) => p.id), [1]);
  assert.deepEqual(cp.selectMyPayments(tagihanSemua, PELANGGAN_B).map((p) => p.id), [2]);

  const kontrakSemua = [
    kontrak({ id: 1, customer_id: 900, contract_date: '2026-09-01' }),
    kontrak({ id: 2, customer_id: 901, contract_date: '2026-09-02', customer_name: 'Ibu Siti Rahmawati' }),
  ];
  assert.deepEqual(cp.selectMyContracts(kontrakSemua, PELANGGAN_B).map((c) => c.id), [2]);
});

// ---------------------------------------------------------------------------
// 2. Katalog — hanya unit yang benar-benar bisa disewa
// ---------------------------------------------------------------------------

t('unit maintenance TIDAK pernah tampil di katalog', () => {
  const armada = [
    unit({ id: 1, status: 'AVAILABLE' }),
    unit({ id: 2, equipment_code: 'EXC-002', status: 'MAINTENANCE' }),
    unit({ id: 3, equipment_code: 'EXC-003', status: 'UNAVAILABLE' }),
  ];
  const hasil = cp.buildCatalog(armada, [], JAUH, JAUH_AKHIR);
  assert.deepEqual(hasil.items.map((i) => i.equipment.id), [1]);
  assert.equal(hasil.summary.blockedByUnitStatus, 2);
});

t('unit RENTED tetap dipertimbangkan — keputusan ada pada rentang tanggal', () => {
  // Unit berstatus RENTED untuk sewa yang SUDAH SELESAI harus tetap
  // ditawarkan untuk periode depan. Inilah alasan katalog tidak boleh
  // sekadar memakai `status === 'AVAILABLE'`.
  const armada = [unit({ id: 1, status: 'RENTED' })];
  const sewaLampau = [
    rental({ id: 1, equipment_id: 1, start_date: '2026-01-01', end_date: '2026-01-10', status: 'COMPLETED' }),
  ];
  const hasil = cp.buildCatalog(armada, sewaLampau, JAUH, JAUH_AKHIR);
  assert.equal(hasil.items.length, 1);
  assert.equal(hasil.items[0].isBookable, true);
});

t('unit yang bentrok TIDAK ditampilkan secara bawaan', () => {
  const armada = [unit({ id: 1, status: 'AVAILABLE' })];
  const sewaAktif = [
    rental({ id: 1, equipment_id: 1, start_date: BESOK, end_date: SEMINGGU, status: 'ON_GOING' }),
  ];
  const hasil = cp.buildCatalog(armada, sewaAktif, BESOK, SEMINGGU);
  assert.equal(hasil.items.length, 0);
  // …tetapi jumlahnya tetap dilaporkan agar UI bisa menjelaskannya.
  assert.equal(hasil.summary.blockedBySchedule, 1);
  assert.equal(hasil.summary.bookable, 0);
});

t('unit bentrok bisa diminta tampil dengan includeBlocked (badge + alasan)', () => {
  const armada = [unit({ id: 1, status: 'AVAILABLE' })];
  const sewaAktif = [
    rental({ id: 1, equipment_id: 1, start_date: BESOK, end_date: SEMINGGU, status: 'ON_GOING' }),
  ];
  const hasil = cp.buildCatalog(armada, sewaAktif, BESOK, SEMINGGU, cp.DEFAULT_CATALOG_FILTER, {
    includeBlocked: true,
  });
  assert.equal(hasil.items.length, 1);
  assert.equal(hasil.items[0].availability, 'SEDANG_DISEWA');
  assert.equal(hasil.items[0].isBookable, false);
  assert.equal(hasil.items[0].conflictCount, 1);
  assert.equal(hasil.items[0].conflictRentalCode, 'RNT-0001');
  assert.match(hasil.items[0].blockedMessage, /EXC-001/);
});

t('unit maintenance tetap disembunyikan walau includeBlocked', () => {
  const armada = [unit({ id: 1, status: 'MAINTENANCE' })];
  const hasil = cp.buildCatalog(armada, [], JAUH, JAUH_AKHIR, cp.DEFAULT_CATALOG_FILTER, {
    includeBlocked: true,
  });
  assert.equal(hasil.items.length, 0);
  assert.equal(hasil.summary.blockedByUnitStatus, 1);
});

t('periode tidak valid → seluruh unit ditolak dengan alasan jelas', () => {
  const armada = [unit({ id: 1 })];
  const hasil = cp.buildCatalog(armada, [], '2026-13-45', 'bukan-tanggal');
  assert.equal(hasil.summary.bookable, 0);
  assert.equal(hasil.summary.total, 1);
});

t('sewa REJECTED tidak menghalangi katalog', () => {
  const armada = [unit({ id: 1 })];
  const ditolak = [
    rental({ id: 1, equipment_id: 1, start_date: BESOK, end_date: SEMINGGU, status: 'REJECTED' }),
  ];
  const hasil = cp.buildCatalog(armada, ditolak, BESOK, SEMINGGU);
  assert.equal(hasil.items.length, 1);
  assert.equal(hasil.items[0].isBookable, true);
});

t('kata kunci menyaring pada nama, kode, merek, model, dan kategori', () => {
  const armada = [
    unit({ id: 1, name: 'Excavator PC200', equipment_code: 'EXC-001', brand: 'Komatsu', model: 'PC200-8' }),
    unit({ id: 2, name: 'Bulldozer D65', equipment_code: 'BDZ-001', brand: 'Caterpillar', model: 'D65', type: 'Bulldozer' }),
  ];
  const cari = (kw) => cp.buildCatalog(armada, [], JAUH, JAUH_AKHIR, { ...cp.DEFAULT_CATALOG_FILTER, search: kw }).items.map((i) => i.equipment.id);

  assert.deepEqual(cari('excavator'), [1]);
  assert.deepEqual(cari('EXC-001'), [1]);       // kode unit, huruf besar/kecil diabaikan
  assert.deepEqual(cari('komatsu'), [1]);
  assert.deepEqual(cari('D65'), [2]);           // model
  assert.deepEqual(cari('bull'), [2]);          // kategori
  assert.deepEqual(cari('   '), [1, 2]);        // spasi saja = tanpa saringan
  assert.deepEqual(cari('!!!'), [1, 2]);        // tanda baca saja = tanpa saringan
  assert.deepEqual(cari('zzz-tidak-ada'), []);
});

t('filter kategori hanya mengembalikan kategori itu', () => {
  const armada = [
    unit({ id: 1, type: 'Excavator' }),
    unit({ id: 2, equipment_code: 'BDZ-001', type: 'Bulldozer' }),
  ];
  const hasil = cp.buildCatalog(armada, [], JAUH, JAUH_AKHIR, {
    ...cp.DEFAULT_CATALOG_FILTER,
    category: 'Bulldozer',
  });
  assert.deepEqual(hasil.items.map((i) => i.equipment.id), [2]);
});

t('daftar kategori unik & terurut alfabetis', () => {
  const armada = [
    unit({ id: 1, type: 'Crane' }),
    unit({ id: 2, type: 'Excavator' }),
    unit({ id: 3, type: 'Crane' }),
  ];
  assert.deepEqual(cp.listCatalogCategories(armada), ['Crane', 'Excavator']);
});

t('pengurutan TERMURAH / TERMAHAL / TERBARU bekerja', () => {
  const armada = [
    unit({ id: 1, rental_price_per_day: 3_000_000, created_at: '2026-01-01T00:00:00.000Z' }),
    unit({ id: 2, equipment_code: 'EXC-002', rental_price_per_day: 1_000_000, created_at: '2026-03-01T00:00:00.000Z' }),
    unit({ id: 3, equipment_code: 'EXC-003', rental_price_per_day: 2_000_000, created_at: '2026-02-01T00:00:00.000Z' }),
  ];
  const urut = (sort) =>
    cp.buildCatalog(armada, [], JAUH, JAUH_AKHIR, { ...cp.DEFAULT_CATALOG_FILTER, sort }).items.map((i) => i.equipment.id);

  assert.deepEqual(urut('TERMURAH'), [2, 3, 1]);
  assert.deepEqual(urut('TERMAHAL'), [1, 3, 2]);
  assert.deepEqual(urut('TERBARU'), [2, 3, 1]);
});

t('ringkasan katalodi konsisten dengan availability bawaan', () => {
  const armada = [
    unit({ id: 1, status: 'AVAILABLE' }),
    unit({ id: 2, equipment_code: 'EXC-002', status: 'AVAILABLE' }),
    unit({ id: 3, equipment_code: 'EXC-003', status: 'MAINTENANCE' }),
  ];
  const sewa = [rental({ id: 1, equipment_id: 1, start_date: BESOK, end_date: SEMINGGU, status: 'ON_GOING' })];
  const hasil = cp.buildCatalog(armada, sewa, BESOK, SEMINGGU);

  assert.equal(hasil.summary.total, 3);
  assert.equal(hasil.summary.bookable, 1);
  assert.equal(hasil.summary.blockedBySchedule, 1);
  assert.equal(hasil.summary.blockedByUnitStatus, 1);
  // Hanya unit yang bebas yang ditampilkan — 2 unit lainnya "hilang" dari
  // daftar, tetapi jejaknya ada pada ringkasan di atas.
  assert.equal(hasil.items.length, 1);
  assert.equal(hasil.items[0].equipment.id, 2);
});

t('ringkasan TIDAK berubah saat kata kunci diketik', () => {
  // Kalau pelanggan mengetik, yang berubah hanya daftar unit — bukan
  // pernyataan "N dari M unit siap sewa".
  const armada = [unit({ id: 1 }), unit({ id: 2, equipment_code: 'BDZ-001', name: 'Bulldozer', type: 'Bulldozer' })];
  const dasar = cp.buildCatalog(armada, [], JAUH, JAUH_AKHIR);
  const disaring = cp.buildCatalog(armada, [], JAUH, JAUH_AKHIR, {
    ...cp.DEFAULT_CATALOG_FILTER,
    search: 'excavator',
  });
  assert.deepEqual(dasar.summary, disaring.summary);
  assert.equal(dasar.items.length, 2);
  assert.equal(disaring.items.length, 1);
});

t('normalizeCatalogFilter menolak nilai ngawur', () => {
  assert.deepEqual(cp.normalizeCatalogFilter(null), cp.DEFAULT_CATALOG_FILTER);
  assert.deepEqual(cp.normalizeCatalogFilter({ sort: 'ngawur', search: 42, category: 99 }), {
    search: '',
    category: '',
    sort: 'TERMURAH',
  });
  assert.deepEqual(cp.normalizeCatalogFilter({ sort: 'termahal', search: '  excavator  ' }), {
    search: 'excavator',
    category: '',
    sort: 'TERMAHAL',
  });
});

// ---------------------------------------------------------------------------
// 3. Validasi Pengajuan Sewa
// ---------------------------------------------------------------------------

t('pengajuan valid mengembalikan hari & biaya', () => {
  const hasil = cp.checkRentalRequest(unit({ rental_price_per_day: 1_000_000 }), [], '2026-09-01', '2026-09-05');
  assert.equal(hasil.ok, true);
  assert.equal(hasil.rentalDays, 5);          // ceil+1, bukan round
  assert.equal(hasil.subtotal, 5_000_000);
});

t('estimasi portal IDENTIK dengan rumus dokumen (calculateRentalCost)', () => {
  // Inilah inti perbaikan T-0011: portal dulu memakai Math.round sehingga
  // sewa 1 hari bisa menghasilkan 0 hari → selisih jutaan rupiah.
  const hasil = cp.checkRentalRequest(unit({ rental_price_per_day: 2_500_000 }), [], '2026-09-01', '2026-09-05');
  assert.equal(hasil.ok, true);
  assert.equal(hasil.subtotal, 2_500_000 * 5);
});

t('sewa di hari yang sama tetap dihitung 1 hari (bukan 0)', () => {
  const hasil = cp.checkRentalRequest(unit({ rental_price_per_day: 1_000_000 }), [], '2026-09-01', '2026-09-01');
  assert.equal(hasil.ok, true);
  assert.equal(hasil.rentalDays, 1);
  assert.equal(hasil.subtotal, 1_000_000);
});

t('unit null ditolak', () => {
  const hasil = cp.checkRentalRequest(null, [], '2026-09-01', '2026-09-05');
  assert.equal(hasil.ok, false);
  assert.equal(hasil.code, 'UNIT_TIDAK_TERSEDIA');
});

t('periode tidak valid ditolak', () => {
  const hasil = cp.checkRentalRequest(unit(), [], '2026-09-10', '2026-09-01');
  assert.equal(hasil.ok, false);
  assert.equal(hasil.code, 'PERIODE_TIDAK_VALID');
});

t('unit maintenance ditolak walau tidak ada sewa sama sekali', () => {
  const hasil = cp.checkRentalRequest(unit({ status: 'MAINTENANCE' }), [], JAUH, JAUH_AKHIR);
  assert.equal(hasil.ok, false);
  assert.equal(hasil.code, 'UNIT_TIDAK_TERSEDIA');
  assert.match(hasil.message, /perawatan/i);
});

t('unit yang bentrok ditolak & pesannya menyebut periode bentrok', () => {
  const sewa = [rental({ id: 7, rental_code: 'RNT-0007', equipment_id: 1, start_date: '2026-12-05', end_date: '2026-12-20', status: 'APPROVED' })];
  const hasil = cp.checkRentalRequest(unit({ id: 1 }), sewa, JAUH, JAUH_AKHIR);
  assert.equal(hasil.ok, false);
  assert.equal(hasil.code, 'UNIT_TIDAK_TERSEDIA');
  assert.match(hasil.message, /EXC-001/);
});

t('durasi melebihi batas ditolak', () => {
  const hasil = cp.checkRentalRequest(unit(), [], '2026-01-01', '2028-01-01');
  assert.equal(hasil.ok, false);
  assert.equal(hasil.code, 'DURASI_MELEBIHI_BATAS');
  assert.match(hasil.message, /365/);
});

// ---------------------------------------------------------------------------
// 4. Tahap Perjalanan Sewa
// ---------------------------------------------------------------------------

t('PENDING → MENUNGGU_PERSETUJUAN, tanpa tindakan pelanggan', () => {
  assert.equal(cp.resolveRentalStage(rental({ status: 'PENDING' }), null, null), 'MENUNGGU_PERSETUJUAN');
  assert.equal(cp.resolveNextAction(rental({ status: 'PENDING' }), null, null), null);
});

t('REJECTED → DITOLAK (tidak tertukar dengan SELESAI)', () => {
  assert.equal(cp.resolveRentalStage(rental({ status: 'REJECTED' }), kontrak(), tagihan()), 'DITOLAK');
});

t('ON_GOING → BEROPERASI walau kontrak belum ditandatangani', () => {
  // Unit sudah di tangan pelanggan; tahap dokumen tidak lagi relevan.
  assert.equal(cp.resolveRentalStage(rental({ status: 'ON_GOING' }), kontrak({ is_signed_customer: 0 }), tagihan()), 'BEROPERASI');
});

t('COMPLETED → SELESAI', () => {
  assert.equal(cp.resolveRentalStage(rental({ status: 'COMPLETED' }), kontrak(), tagihan({ status: 'PAID' })), 'SELESAI');
});

t('APPROVED tanpa kontrak → MENUNGGU_KONTRAK', () => {
  assert.equal(cp.resolveRentalStage(rental({ status: 'APPROVED' }), null, null), 'MENUNGGU_KONTRAK');
  assert.equal(cp.resolveNextAction(rental({ status: 'APPROVED' }), null, null), null);
});

t('APPROVED + kontrak belum ttd → MENUNGGU_TANDA_TANGAN & aksi tanda tangan', () => {
  const r = rental({ status: 'APPROVED' });
  const c = kontrak({ is_signed_customer: 0 });
  assert.equal(cp.resolveRentalStage(r, c, null), 'MENUNGGU_TANDA_TANGAN');
  assert.equal(cp.resolveNextAction(r, c, null), 'TANDA_TANGAN_KONTRAK');
});

t('is_signed_customer bernilai true (bukan 1) tetap dianggap sudah ttd', () => {
  const r = rental({ status: 'APPROVED' });
  const c = kontrak({ is_signed_customer: true });
  assert.equal(cp.resolveRentalStage(r, c, null), 'MENUNGGU_PEMBAYARAN');
  assert.equal(cp.resolveNextAction(r, c, null), 'UNGGAH_BUKTI_BAYAR');
});

t('APPROVED + ttd + tagihan UNPAID → MENUNGGU_PEMBAYARAN', () => {
  const r = rental({ status: 'APPROVED' });
  const c = kontrak({ is_signed_customer: 1 });
  assert.equal(cp.resolveRentalStage(r, c, tagihan({ status: 'UNPAID' })), 'MENUNGGU_PEMBAYARAN');
  assert.equal(cp.resolveNextAction(r, c, tagihan({ status: 'UNPAID' })), 'UNGGAH_BUKTI_BAYAR');
});

t('APPROVED + tagihan PENDING_VERIFICATION → MENUNGGU_VERIFIKASI', () => {
  const r = rental({ status: 'APPROVED' });
  const c = kontrak({ is_signed_customer: 1 });
  const p = tagihan({ status: 'PENDING_VERIFICATION' });
  assert.equal(cp.resolveRentalStage(r, c, p), 'MENUNGGU_VERIFIKASI');
  assert.equal(cp.resolveNextAction(r, c, p), 'TUNGGU_VERIFIKASI');
});

t('tagihan FAILED meminta unggah ulang', () => {
  const c = kontrak({ is_signed_customer: 1 });
  assert.equal(cp.resolveNextAction(rental({ status: 'APPROVED' }), c, tagihan({ status: 'FAILED' })), 'UNGGAH_BUKTI_BAYAR');
});

t('tagihan PAID → tidak ada tindakan lagi', () => {
  const c = kontrak({ is_signed_customer: 1 });
  assert.equal(cp.resolveNextAction(rental({ status: 'APPROVED' }), c, tagihan({ status: 'PAID' })), null);
});

t('setiap tahap punya label & nada warna', () => {
  for (const tahap of Object.keys(cp.RENTAL_JOURNEY_LABEL)) {
    assert.equal(typeof cp.RENTAL_JOURNEY_LABEL[tahap], 'string');
    assert.ok(['success', 'info', 'warning', 'danger', 'neutral'].includes(cp.RENTAL_JOURNEY_TONE[tahap]));
  }
});

t('label aksi tersedia untuk setiap aksi yang mungkin', () => {
  assert.equal(cp.RENTAL_NEXT_ACTION_LABEL.TANDA_TANGAN_KONTRAK, 'Tanda Tangani Kontrak');
  assert.equal(cp.RENTAL_NEXT_ACTION_LABEL.UNGGAH_BUKTI_BAYAR, 'Unggah Bukti Bayar');
  assert.equal(cp.RENTAL_NEXT_ACTION_LABEL.TUNGGU_VERIFIKASI, 'Menunggu Verifikasi');
});

// ---------------------------------------------------------------------------
// 5. Penyusunan Riwayat (relasi per-ID, bukan teks)
// ---------------------------------------------------------------------------

t('kontrak & tagihan terpasang pada sewa yang tepat', () => {
  const sewa = [rental({ id: 1 }), rental({ id: 2 })];
  const kontrakList = [kontrak({ id: 10, rental_id: 1 }), kontrak({ id: 11, rental_id: 2 })];
  const tagihanList = [tagihan({ id: 20, contract_id: 11, status: 'PAID' })];

  const baris = cp.buildRentalJourney(sewa, kontrakList, tagihanList);
  assert.equal(baris.length, 2);

  assert.equal(baris[0].contract?.id, 10);
  assert.equal(baris[0].payment, null);

  assert.equal(baris[1].contract?.id, 11);
  assert.equal(baris[1].payment?.id, 20);
  assert.equal(baris[1].paymentStatusLabel, 'Lunas');
  assert.equal(baris[1].paymentStatusTone, 'success');
});

t('sewa tanpa kontrak tidak pernah punya tagihan', () => {
  const baris = cp.buildRentalJourney([rental({ id: 1 })], [], [tagihan({ id: 20, contract_id: 10 })]);
  assert.equal(baris[0].contract, null);
  assert.equal(baris[0].payment, null);
  assert.equal(baris[0].paymentStatusLabel, null);
});

t('baris riwayat membawa label status sewa siap tampil', () => {
  const baris = cp.buildRentalJourney([rental({ status: 'ON_GOING' })], [], []);
  assert.equal(baris[0].statusLabel, 'Beroperasi');
  assert.equal(baris[0].statusTone, 'info');
  assert.equal(baris[0].stageLabel, 'Beroperasi');
});

t('kontrak ganda untuk satu sewa → hanya yang pertama dipakai', () => {
  const sewa = [rental({ id: 1 })];
  const kontrakList = [
    kontrak({ id: 10, rental_id: 1, contract_date: '2026-09-05' }),
    kontrak({ id: 11, rental_id: 1, contract_date: '2026-09-06' }),
  ];
  const baris = cp.buildRentalJourney(sewa, kontrakList, []);
  assert.equal(baris[0].contract?.id, 10);
});

// ---------------------------------------------------------------------------
// 6. Ringkasan Tagihan
// ---------------------------------------------------------------------------

t('ringkasan menghitung tiap status dengan benar', () => {
  const ringkasan = cp.summarizeBilling([
    tagihan({ id: 1, status: 'PAID', amount: 10_000_000 }),
    tagihan({ id: 2, status: 'PAID', amount: 5_000_000 }),
    tagihan({ id: 3, status: 'PENDING_VERIFICATION', amount: 7_000_000 }),
    tagihan({ id: 4, status: 'UNPAID', amount: 3_000_000 }),
    tagihan({ id: 5, status: 'FAILED', amount: 2_000_000 }),
  ]);

  assert.equal(ringkasan.total, 5);
  assert.equal(ringkasan.totalAmount, 27_000_000);
  assert.equal(ringkasan.lunasCount, 2);
  assert.equal(ringkasan.lunasAmount, 15_000_000);
  assert.equal(ringkasan.menungguVerifikasiCount, 1);
  assert.equal(ringkasan.menungguVerifikasiAmount, 7_000_000);
  // FAILED ikut terhitung sebagai kewajiban yang belum lunas.
  assert.equal(ringkasan.belumBayarCount, 2);
  assert.equal(ringkasan.belumBayarAmount, 5_000_000);
  assert.equal(ringkasan.ditolakCount, 1);
});

t('ringkasan tagihan memenuhi invariant: total = lunas + verifikasi + belum bayar', () => {
  const daftar = [
    tagihan({ id: 1, status: 'PAID', amount: 10_000_000 }),
    tagihan({ id: 2, status: 'PENDING_VERIFICATION', amount: 7_000_000 }),
    tagihan({ id: 3, status: 'UNPAID', amount: 3_000_000 }),
    tagihan({ id: 4, status: 'FAILED', amount: 2_000_000 }),
  ];
  const r = cp.summarizeBilling(daftar);

  assert.equal(
    r.totalAmount,
    r.lunasAmount + r.menungguVerifikasiAmount + r.belumBayarAmount
  );
  assert.equal(r.total, r.lunasCount + r.menungguVerifikasiCount + r.belumBayarCount);
  // `ditolakCount` adalah subset dari `belumBayarCount`, bukan kategori baru.
  assert.ok(r.ditolakCount <= r.belumBayarCount);
});

t('bisaUnggah mencakup semua tagihan yang belum final', () => {
  const ringkasan = cp.summarizeBilling([
    tagihan({ id: 1, status: 'UNPAID' }),
    tagihan({ id: 2, status: 'FAILED' }),
    tagihan({ id: 3, status: 'PENDING_VERIFICATION' }),
    tagihan({ id: 4, status: 'PAID' }),
  ]);
  assert.equal(ringkasan.bisaUnggahCount, 3);
});

t('tagihan lunas tidak bisa diunggah lagi (aturan sama dengan server)', () => {
  assert.equal(cp.canUploadProof('PAID'), false);
  assert.equal(cp.canUploadProof('UNPAID'), true);
  assert.equal(cp.canUploadProof('FAILED'), true);
  assert.equal(cp.canUploadProof('PENDING_VERIFICATION'), true);
});

t('ringkasan tahan terhadap nilai amount yang rusak', () => {
  const ringkasan = cp.summarizeBilling([
    tagihan({ id: 1, status: 'UNPAID', amount: Number.NaN }),
    tagihan({ id: 2, status: 'UNPAID', amount: Number.POSITIVE_INFINITY }),
    tagihan({ id: 3, status: 'UNPAID', amount: 1_000_000 }),
  ]);
  assert.equal(Number.isFinite(ringkasan.totalAmount), true);
  assert.equal(ringkasan.totalAmount, 1_000_000);
});

t('ringkasan kosong aman', () => {
  const ringkasan = cp.summarizeBilling([]);
  assert.equal(ringkasan.total, 0);
  assert.equal(ringkasan.totalAmount, 0);
});

// ---------------------------------------------------------------------------
// 7. Kesesuaian dengan Modul Ketersediaan
// ---------------------------------------------------------------------------

t('katalog memakai definisi bentrokan yang sama dengan availability', () => {
  const armada = [unit({ id: 1 }), unit({ id: 2, equipment_code: 'EXC-002' })];
  const sewa = [rental({ id: 1, equipment_id: 1, start_date: BESOK, end_date: SEMINGGU, status: 'APPROVED' })];

  const availability = av.buildEquipmentAvailability(armada, sewa, BESOK, SEMINGGU);
  const katalog = cp.buildCatalog(armada, sewa, BESOK, SEMINGGU);

  const bentrok = availability.filter((a) => !a.isBookable).length;
  assert.equal(katalog.summary.bookable, availability.length - bentrok);
});

// ---------------------------------------------------------------------------
// Ringkasan
// ---------------------------------------------------------------------------

console.log(`\n  ${passed} lulus, ${failed} gagal`);
if (failed > 0) {
  console.log('\n  RINCIAN KEGAGALAN:');
  for (const [nama, pesan] of failures) {
    console.log(`   ✗ ${nama}\n     ${pesan}`);
  }
  process.exit(1);
}
