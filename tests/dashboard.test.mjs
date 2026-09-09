/**
 * Uji mesin agregat dashboard eksekutif (src/lib/dashboard.ts).
 *
 * Menjamin bahwa angka dashboard dihitung dari DATA NYATA yang diberikan,
 * bukan konstanta — syarat utama T-0005 ("semua angka real dari DB").
 */

const { buildDashboardStats, emptyDashboardStats, RECENT_RENTAL_LIMIT, SERVICE_QUEUE_LIMIT } =
  await import('../.tmp_dashboard.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

/** Menyusun satu unit dengan aman (field wajib diisi, sisanya override). */
const unit = (id, over = {}) => ({
  id,
  equipment_code: `EXC-${String(id).padStart(2, '0')}`,
  name: `Excavator Komatsu PC200-${id}`,
  type: 'Excavator',
  model: 'PC200',
  brand: 'Komatsu',
  hour_meter: 1000,
  rental_price_per_day: 5_000_000,
  status: 'AVAILABLE',
  last_maintenance_date: '2026-01-05',
  ...over,
});

const sewa = (id, over = {}) => ({
  id,
  rental_code: `RNT-SBS-20260101-${String(id).padStart(3, '0')}`,
  customer_id: 100 + id,
  equipment_id: 1,
  booking_date: '2026-01-10 08:00:00',
  start_date: '2026-01-12',
  end_date: '2026-01-20',
  total_days: 9,
  subtotal: 45_000_000,
  status: 'PENDING',
  ...over,
});

const servis = (id, over = {}) => ({
  id,
  maintenance_code: `MNT-SBS-20260101-${String(id).padStart(3, '0')}`,
  equipment_id: 1,
  equipment_name: 'Excavator Komatsu PC200',
  equipment_code: 'EXC-01',
  scheduled_date: '2026-02-01',
  completion_date: null,
  maintenance_type: 'PREVENTIVE',
  hour_meter_at_maintenance: 900,
  description: 'Servis preventif',
  cost: 3_000_000,
  status: 'SCHEDULED',
  ...over,
});

const bayar = (id, status, amount) => ({
  id,
  payment_code: `PAY-${id}`,
  contract_id: id,
  customer_id: 100 + id,
  amount,
  payment_method: 'TRANSFER',
  status,
  payment_date: '2026-01-15',
});

const pelanggan = (id, roleId, roleName) => ({
  id,
  role_id: roleId,
  role_name: roleName,
  username: `u${id}`,
  email: `u${id}@mail.co.id`,
  full_name: `Pelanggan ${id}`,
  phone: '081234567890',
  address: 'Banjarmasin',
  company_name: 'PT. Contoh',
  status: 'ACTIVE',
});

// ---------------------------------------------------------------------------
console.log('\n== Sumber Kosong ==');
let s = buildDashboardStats({ equipments: [], rentals: [], maintenance: [], payments: [], users: [] });
t('total pendapatan 0', s.totalRevenue === 0);
t('total armada 0', s.totalEquipments === 0);
t('tidak ada transaksi terbaru', s.recentRentals.length === 0);
t('tidak ada antrean servis', s.serviceQueue.length === 0);
t('generatedAt terisi', typeof s.generatedAt === 'string' && s.generatedAt.length > 0);

const kosong = emptyDashboardStats();
t('emptyDashboardStats semua 0', kosong.totalEquipments === 0 && kosong.totalRevenue === 0);
t('emptyDashboardStats array kosong',
  Array.isArray(kosong.recentRentals) && kosong.recentRentals.length === 0);

// ---------------------------------------------------------------------------
console.log('\n== Agregat Keuangan ==');
s = buildDashboardStats({
  equipments: [],
  rentals: [],
  maintenance: [],
  payments: [
    bayar(1, 'PAID', 100_000_000),
    bayar(2, 'PAID', 50_000_000),
    bayar(3, 'PENDING_VERIFICATION', 25_000_000),
    bayar(4, 'UNPAID', 999_000_000),
    bayar(5, 'FAILED', 888_000_000),
  ],
  users: [],
});
t('pendapatan hanya dari PAID', s.totalRevenue === 150_000_000);
t('UNPAID & FAILED tidak dihitung', s.totalRevenue !== 150_000_000 + 999_000_000 + 888_000_000);
t('nilai menunggu verifikasi', s.pendingPaymentAmount === 25_000_000);
t('jumlah menunggu verifikasi', s.pendingPaymentCount === 1);

// Amount berbentuk string (umum pada driver MySQL) tetap dihitung benar.
s = buildDashboardStats({
  equipments: [], rentals: [], maintenance: [],
  payments: [{ ...bayar(1, 'PAID', 0), amount: '75000000' }],
  users: [],
});
t('amount string dikonversi jadi angka', s.totalRevenue === 75_000_000);

// Amount rusak tidak boleh menghasilkan NaN.
s = buildDashboardStats({
  equipments: [], rentals: [], maintenance: [],
  payments: [
    { ...bayar(1, 'PAID', 0), amount: 'bukan-angka' },
    bayar(2, 'PAID', 10_000_000),
  ],
  users: [],
});
t('amount tidak valid diabaikan (bukan NaN)', Number.isFinite(s.totalRevenue));
t('amount valid tetap terhitung', s.totalRevenue === 10_000_000);

// ---------------------------------------------------------------------------
console.log('\n== Distribusi Armada ==');
s = buildDashboardStats({
  equipments: [
    unit(1, { status: 'AVAILABLE' }),
    unit(2, { status: 'AVAILABLE' }),
    unit(3, { status: 'RENTED' }),
    unit(4, { status: 'MAINTENANCE' }),
    unit(5, { status: 'UNAVAILABLE' }),
  ],
  rentals: [], maintenance: [], payments: [], users: [],
});
t('total armada 5', s.totalEquipments === 5);
t('tersedia 2', s.availableEquipments === 2);
t('tersewa 1', s.rentedEquipments === 1);
t('dalam servis 1', s.maintenanceEquipments === 1);
t('tidak tersedia 1', s.unavailableEquipments === 1);
t('distribusi menjumlahkan total',
  s.availableEquipments + s.rentedEquipments + s.maintenanceEquipments + s.unavailableEquipments
    === s.totalEquipments);

// ---------------------------------------------------------------------------
console.log('\n== Status Transaksi Sewa ==');
s = buildDashboardStats({
  equipments: [],
  rentals: [
    sewa(1, { status: 'PENDING' }),
    sewa(2, { status: 'APPROVED' }),
    sewa(3, { status: 'ON_GOING' }),
    sewa(4, { status: 'COMPLETED' }),
    sewa(5, { status: 'REJECTED' }),
  ],
  maintenance: [], payments: [], users: [],
});
t('aktif = APPROVED + ON_GOING', s.activeRentals === 2);
t('pending 1', s.pendingRentals === 1);
t('selesai 1', s.completedRentals === 1);
t('REJECTED tidak dihitung sebagai aktif', s.activeRentals !== 3);

// ---------------------------------------------------------------------------
console.log('\n== Servis Preventif 250 HM ==');
// Unit 1: servis terakhir HM 900 → target 1150, HM sekarang 1200 → lewat.
// Unit 2: servis terakhir HM 900 → target 1150, HM sekarang 1120 → dekat.
// Unit 3: HM 500, belum pernah servis → target 750, tidak due.
// Unit 4: berstatus MAINTENANCE → tidak dihitung meski HM lewat.
s = buildDashboardStats({
  equipments: [
    unit(1, { hour_meter: 1200 }),
    unit(2, { hour_meter: 1120 }),
    unit(3, { hour_meter: 500 }),
    unit(4, { hour_meter: 5000, status: 'MAINTENANCE' }),
  ],
  rentals: [],
  maintenance: [
    servis(1, { equipment_id: 1, hour_meter_at_maintenance: 900, status: 'COMPLETED' }),
    servis(2, { equipment_id: 2, hour_meter_at_maintenance: 900, status: 'COMPLETED' }),
    servis(3, { equipment_id: 4, hour_meter_at_maintenance: 100, status: 'COMPLETED' }),
  ],
  payments: [], users: [],
});
t('1 unit lewat jadwal servis', s.serviceDueCount === 1);
t('1 unit mendekati servis', s.serviceApproachingCount === 1);
t('kode unit yang lewat tercatat', s.serviceDueCodes.includes('EXC-01'));
t('unit MAINTENANCE tidak diperingatkan', !s.serviceDueCodes.includes('EXC-04'));
t('batas pratinjau kode servis 5', s.serviceDueCodes.length <= 5);

// ---------------------------------------------------------------------------
console.log('\n== Antrean Servis & Jumlah Tertunda ==');
s = buildDashboardStats({
  equipments: [unit(1)], rentals: [], payments: [], users: [],
  maintenance: [
    servis(1, { status: 'SCHEDULED', scheduled_date: '2026-03-10' }),
    servis(2, { status: 'IN_PROGRESS', scheduled_date: '2026-02-01' }),
    servis(3, { status: 'COMPLETED', scheduled_date: '2026-01-01' }),
    servis(4, { status: 'CANCELLED', scheduled_date: '2026-01-02' }),
  ],
});
t('servis tertunda = SCHEDULED + IN_PROGRESS', s.pendingMaintenanceCount === 2);
t('COMPLETED & CANCELLED tidak masuk antrean', s.serviceQueue.length === 2);
t('antrean diurutkan paling dekat dulu', s.serviceQueue[0]?.id === 2);
t('antrean dibatasi 4 baris', s.serviceQueue.length <= SERVICE_QUEUE_LIMIT);

// ---------------------------------------------------------------------------
console.log('\n== Transaksi Terbaru ==');
s = buildDashboardStats({
  equipments: [unit(1)], maintenance: [], payments: [],
  users: [pelanggan(101, 3, 'CUSTOMER')],
  rentals: [
    sewa(1, { booking_date: '2026-01-01 08:00:00', customer_id: 101 }),
    sewa(2, { booking_date: '2026-03-01 08:00:00', customer_id: 101 }),
    sewa(3, { booking_date: '2026-02-01 08:00:00', customer_id: 101 }),
    sewa(4, { booking_date: '2026-05-01 08:00:00', customer_id: 101 }),
    sewa(5, { booking_date: '2026-04-01 08:00:00', customer_id: 101 }),
    sewa(6, { booking_date: '2026-06-01 08:00:00', customer_id: 101 }),
  ],
});
t('transaksi terbaru dibatasi 5', s.recentRentals.length === RECENT_RENTAL_LIMIT);
t('urutan terbaru di atas', s.recentRentals[0]?.id === 6);
// booking_date: id1=Jan, id2=Mar, id3=Feb, id4=Mei, id5=Apr, id6=Jun
// → terbaru ke terlama: 6 (Jun), 4 (Mei), 5 (Apr), 2 (Mar), 3 (Feb)
t('urutan menurun benar',
  s.recentRentals.map((r) => r.id).join() === '6,4,5,2,3');
t('nama pelanggan diisi dari tabel users',
  s.recentRentals[0]?.customer_name === 'Pelanggan 101');
t('perusahaan pelanggan diisi', s.recentRentals[0]?.company_name === 'PT. Contoh');

// Rental tanpa booking_date jatuh ke start_date, tidak boleh NaN.
s = buildDashboardStats({
  equipments: [unit(1)], maintenance: [], payments: [], users: [],
  rentals: [
    sewa(1, { booking_date: '', start_date: '2026-02-01' }),
    sewa(2, { booking_date: '2026-01-01 08:00:00', start_date: '2026-01-05' }),
  ],
});
t('booking_date kosong jatuh ke start_date', s.recentRentals[0]?.id === 1);
t('tidak ada NaN pada pengurutan', s.recentRentals.length === 2);

// Pelanggan tidak dikenal tidak boleh membuat halaman error.
s = buildDashboardStats({
  equipments: [unit(1)], maintenance: [], payments: [], users: [],
  rentals: [sewa(1, { customer_id: 999 })],
});
t('pelanggan tak dikenal → "-"', s.recentRentals[0]?.customer_name === '-');
t('perusahaan null bila tak ada data', s.recentRentals[0]?.company_name === null);

// ---------------------------------------------------------------------------
console.log('\n== Jumlah Pelanggan ==');
s = buildDashboardStats({
  equipments: [], rentals: [], maintenance: [], payments: [],
  users: [
    pelanggan(1, 1, 'ADMIN'),
    pelanggan(2, 2, 'STAFF'),
    pelanggan(3, 3, 'CUSTOMER'),
    pelanggan(4, 3, 'CUSTOMER'),
    // Baris tanpa role_name (kolom tidak ikut di-SELECT) tetap terhitung
    // lewat role_id — penting agar angka tidak turun tiba-tiba.
    { ...pelanggan(5, 3, 'CUSTOMER'), role_name: undefined },
  ],
});
t('jumlah pelanggan 3', s.totalCustomers === 3);
t('ADMIN & STAFF tidak dihitung pelanggan', s.totalCustomers !== 5);

// ---------------------------------------------------------------------------
console.log('\n== Ketahanan (Fuzzing Ringan) ==');
let tidakMelempar = true;
for (const sumber of [
  { equipments: [], rentals: [], maintenance: [], payments: [], users: [] },
  { equipments: [unit(1, { hour_meter: -5 })], rentals: [sewa(1)], maintenance: [servis(1)], payments: [bayar(1, 'PAID', 0)], users: [pelanggan(1, 3, 'CUSTOMER')] },
  { equipments: [unit(1, { hour_meter: 0 })], rentals: [sewa(1, { booking_date: 'bukan-tanggal', start_date: 'juga-bukan' })], maintenance: [servis(1, { scheduled_date: 'bukan-tanggal' })], payments: [], users: [] },
]) {
  try {
    const hasil = buildDashboardStats(sumber);
    if (!Number.isFinite(hasil.totalRevenue) || !Number.isFinite(hasil.totalEquipments)) {
      tidakMelempar = false;
    }
  } catch {
    tidakMelempar = false;
  }
}
t('nilai aneh tidak melempar & tidak menghasilkan NaN', tidakMelempar);

// ---------------------------------------------------------------------------
console.log('\n== Konsistensi dengan Data Nyata (stateStore) ==');
const { stateStore } = await import('../.tmp_db.mjs');
s = buildDashboardStats({
  equipments: stateStore.equipments,
  rentals: stateStore.rentals,
  maintenance: stateStore.maintenance,
  payments: stateStore.payments,
  users: stateStore.users,
});
t('armada seed terbaca (50 unit)', s.totalEquipments === 50);
t('pendapatan seed > 0', s.totalRevenue > 0);
// Seed: 7 CUSTOMER inti (id 9–15) + 35 pelanggan tambahan (id 16–50).
t('pelanggan seed terbaca (42 akun)', s.totalCustomers === 42);
t('transaksi terbaru terisi', s.recentRentals.length === RECENT_RENTAL_LIMIT);
t('distribusi armada konsisten',
  s.availableEquipments + s.rentedEquipments + s.maintenanceEquipments + s.unavailableEquipments === 50);

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
