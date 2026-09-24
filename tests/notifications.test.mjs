/**
 * Uji penyusun Pusat Notifikasi (src/lib/notifications.ts).
 *
 * Memastikan notifikasi dibangun dari data nyata, dipisahkan per peran,
 * dan diurutkan dari yang paling mendesak.
 */

const { buildNotifications, hitungMendesak, selisihHari, AMBANG_JATUH_TEMPO_HARI, urutkanPerKategori, URUTAN_KATEGORI, LABEL_KATEGORI } =
  await import('../.tmp_notifications.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

const NOW = new Date('2026-03-10T08:00:00');

const sewa = (over = {}) => ({
  id: 1,
  rental_code: 'RNT-SBS-20260301-001',
  customer_id: 9,
  equipment_id: 1,
  booking_date: '2026-03-01 08:00:00',
  start_date: '2026-03-02',
  end_date: '2026-03-20',
  total_days: 19,
  subtotal: 50_000_000,
  status: 'ON_GOING',
  equipment_name: 'Excavator Komatsu PC200',
  customer_name: 'Ahmad Rizky',
  ...over,
});

const bayar = (over = {}) => ({
  id: 1,
  payment_code: 'PAY-SBS-20260301-001',
  rental_id: 1,
  customer_id: 9,
  amount: 50_000_000,
  payment_date: '2026-03-03',
  payment_method: 'TRANSFER',
  status: 'PENDING_VERIFICATION',
  ...over,
});

const servis = (over = {}) => ({
  id: 1,
  maintenance_code: 'MTC-SBS-20260301-001',
  equipment_id: 1,
  maintenance_type: 'SERVIS_RUTIN',
  scheduled_date: '2026-03-10',
  completion_date: null,
  hour_meter_at_maintenance: 1250,
  description: 'Ganti oli',
  spareparts_replaced: null,
  cost: 3_500_000,
  technician_id: 3,
  status: 'SCHEDULED',
  ...over,
});

const kontrak = (over = {}) => ({
  id: 1,
  contract_code: 'CTR-SBS-20260301-001',
  rental_id: 1,
  customer_id: 9,
  contract_date: '2026-03-01',
  valid_until: '2026-03-20',
  is_signed_customer: false,
  is_signed_company: true,
  ...over,
});

const kosong = { rentals: [], payments: [], maintenance: [], contracts: [] };

// --- Selisih hari -------------------------------------------------------
t('Selisih hari dihitung tepat', selisihHari(new Date('2026-03-10'), new Date('2026-03-13')) === 3);
t('Ambang jatuh tempo bernilai wajar', AMBANG_JATUH_TEMPO_HARI >= 1 && AMBANG_JATUH_TEMPO_HARI <= 7);

// --- Tanpa data ---------------------------------------------------------
t('Data kosong menghasilkan nol notifikasi', buildNotifications(kosong, 'ADMIN', 1, NOW).length === 0);

// --- Peran internal -----------------------------------------------------
const admin = buildNotifications(
  {
    rentals: [sewa({ id: 2, status: 'PENDING', rental_code: 'RNT-002' }), sewa({ id: 3, end_date: '2026-03-05' })],
    payments: [bayar()],
    maintenance: [servis()],
    contracts: [],
  },
  'ADMIN',
  1,
  NOW
);

t('Admin melihat pembayaran menunggu verifikasi', admin.some((i) => i.id === 'pay-verify-1'));
t('Admin melihat pengajuan sewa PENDING', admin.some((i) => i.id === 'rental-pending-2'));
t('Admin melihat perawatan hari ini', admin.some((i) => i.id === 'maint-1'));
t('Sewa lewat tanggal kembali ditandai telat', admin.some((i) => i.id === 'rental-late-3'));
t('Notifikasi telat berwarna danger', admin.find((i) => i.id === 'rental-late-3').tone === 'danger');
t('Kelompok pembayaran tampil paling awal (paling mendesak menurut bisnis)', admin[0].kategori === 'pembayaran');
t('Dalam kelompok, item danger didahulukan', (() => {
  const pengembalian = admin.filter((i) => i.kategori === 'pengembalian');
  return pengembalian[0].tone === 'danger';
})());
t('Setiap notifikasi punya kategori', admin.every((i) => typeof i.kategori === 'string' && i.kategori.length > 0));
t('Urutan kelompok mengikuti URUTAN_KATEGORI', (() => {
  const idx = (k) => URUTAN_KATEGORI.indexOf(k);
  const grupPertama = admin.findIndex((i) => i.kategori !== admin[0].kategori);
  if (grupPertama === -1) return true;
  return idx(admin[0].kategori) < idx(admin[grupPertama].kategori);
})());
t('urutkanPerKategori menjaga semua item tetap ada', urutkanPerKategori(admin).length === admin.length);
t('LABEL_KATEGORI punya label untuk setiap kategori', admin.every((i) => LABEL_KATEGORI[i.kategori].length > 0));
t('Setiap notifikasi punya tab tujuan', admin.every((i) => typeof i.tab === 'string' && i.tab.length > 0));
t('Id notifikasi unik', new Set(admin.map((i) => i.id)).size === admin.length);
t('hitungMendesak menghitung notifikasi danger', hitungMendesak(admin) === admin.filter((i) => i.tone === 'danger').length);

// --- Peran pelanggan ----------------------------------------------------
const pelanggan = buildNotifications(
  {
    rentals: [sewa({ id: 4, customer_id: 9, end_date: '2026-03-12' }), sewa({ id: 5, customer_id: 99, end_date: '2026-03-11' })],
    payments: [bayar({ id: 7, status: 'UNPAID', customer_id: 9 }), bayar({ id: 8, status: 'UNPAID', customer_id: 77 })],
    maintenance: [servis()],
    contracts: [kontrak()],
  },
  'CUSTOMER',
  9,
  NOW
);

t('Pelanggan melihat tagihan miliknya', pelanggan.some((i) => i.id === 'pay-due-7'));
t('Tagihan pelanggan lain tidak bocor', !pelanggan.some((i) => i.id === 'pay-due-8'));
t('Pelanggan diingatkan kontrak belum ditandatangani', pelanggan.some((i) => i.id === 'contract-1'));
t('Sewa pelanggan lain tidak muncul', !pelanggan.some((i) => i.id.endsWith('-5')));
t('Sewa mendekati jatuh tempo diingatkan', pelanggan.some((i) => i.id === 'rental-due-4'));
t('Pelanggan tidak menerima notifikasi perawatan internal', !pelanggan.some((i) => i.id.startsWith('maint-')));

console.log(`\nRingkasan notifications: ${pass} lulus, ${fail} gagal.`);
if (fail > 0) process.exit(1);
