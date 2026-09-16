/**
 * Mesin Agregat Dashboard Eksekutif Administrator
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Modul MURNI: tidak menyentuh jaringan, tidak memakai React, dan tidak
 * membaca state global. Semua angka dihitung dari sumber data yang
 * diberikan pemanggil.
 *
 * Mengapa dipisahkan dari komponen?
 *   1. Bisa diuji dengan data buatan (lihat `tests/dashboard.test.mjs`).
 *   2. Dipakai dua kali — oleh edge API (`GET /api/dashboard/stats`) dan
 *      oleh klien sebagai fallback — sehingga angka di layar SELALU sama
 *      dengan yang dihitung server. Tidak ada lagi dua rumus berbeda.
 *   3. Mencegah komponen UI mengimpor `mockData` karena data realistis
 *      bisa disuntikkan lewat parameter.
 */

import type {
  AdminDashboardStats,
  DashboardRentalRow,
  DashboardRevenueTrendItem,
  DashboardServiceRow,
  DashboardTopEquipmentRow,
  Equipment,
  Maintenance,
  Payment,
  Rental,
  User,
} from '../types';
import { getServiceStatus } from './businessRules';

/** Sumber data yang dibutuhkan untuk menyusun agregat dashboard. */
export interface DashboardDataSource {
  equipments: readonly Equipment[];
  rentals: readonly Rental[];
  maintenance: readonly Maintenance[];
  payments: readonly Payment[];
  users: readonly User[];
}

/** Jumlah baris pada tabel "Transaksi Penyewaan Terbaru". */
export const RECENT_RENTAL_LIMIT = 5;

/** Jumlah baris pada panel "Antrean Servis & Pemeliharaan". */
export const SERVICE_QUEUE_LIMIT = 4;

/** Jumlah unit pada panel "Top Unit Tersewa". */
export const TOP_EQUIPMENT_LIMIT = 5;

/** Jumlah kode unit yang ditampilkan pada peringatan servis. */
const SERVICE_CODE_PREVIEW_LIMIT = 5;

/** Status rental yang dihitung sebagai "sedang berjalan". */
const AKTIF: readonly Rental['status'][] = ['APPROVED', 'ON_GOING'];

/** Status servis yang masih menggantung (belum selesai). */
const SERVIS_TERTUNDA: readonly Maintenance['status'][] = ['SCHEDULED', 'IN_PROGRESS'];

function isAktif(status: Rental['status']): boolean {
  return AKTIF.includes(status);
}

function isServisTertunda(status: Maintenance['status']): boolean {
  return SERVIS_TERTUNDA.includes(status);
}

/**
 * Waktu acuan sebuah rental untuk pengurutan.
 * `booking_date` bisa kosong pada data lama, maka jatuh ke `start_date`.
 */
function waktuAcuan(r: Rental): number {
  const sumber = r.booking_date || r.start_date;
  const ms = new Date(sumber).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/** Menyusun agregat dashboard dari sumber data nyata. */
export function buildDashboardStats(
  source: DashboardDataSource,
  now: Date = new Date()
): AdminDashboardStats {
  const { equipments, rentals, maintenance, payments, users } = source;

  // ---------------------------------------------------------------------
  // Keuangan
  // ---------------------------------------------------------------------
  let totalRevenue = 0;
  let pendingPaymentAmount = 0;
  let pendingPaymentCount = 0;

  for (const p of payments) {
    // `amount` bisa datang sebagai string dari driver MySQL — paksa jadi angka.
    const nilai = Number(p.amount);
    if (!Number.isFinite(nilai)) continue;

    if (p.status === 'PAID') {
      totalRevenue += nilai;
    } else if (p.status === 'PENDING_VERIFICATION') {
      pendingPaymentAmount += nilai;
      pendingPaymentCount += 1;
    }
  }

  // ---------------------------------------------------------------------
  // Armada
  // ---------------------------------------------------------------------
  let availableEquipments = 0;
  let rentedEquipments = 0;
  let maintenanceEquipments = 0;
  let unavailableEquipments = 0;

  for (const e of equipments) {
    if (e.status === 'AVAILABLE') availableEquipments += 1;
    else if (e.status === 'RENTED') rentedEquipments += 1;
    else if (e.status === 'MAINTENANCE') maintenanceEquipments += 1;
    else unavailableEquipments += 1;
  }

  // ---------------------------------------------------------------------
  // Servis preventif berbasis 250 HM (aturan bisnis §4.3)
  // ---------------------------------------------------------------------

  // Pre-group riwayat servis SELESAI per unit: O(maintenance) sekali,
  // bukan O(equipment × maintenance) di dalam loop.
  // ponytail: index DB pada (equipment_id, status) saat data > 10k baris.
  const maintSelesaiPerUnit = new Map<number, Maintenance[]>();
  for (const m of maintenance) {
    if (m.status !== 'COMPLETED') continue;
    const bucket = maintSelesaiPerUnit.get(m.equipment_id);
    if (bucket) bucket.push(m);
    else maintSelesaiPerUnit.set(m.equipment_id, [m]);
  }

  let serviceDueCount = 0;
  let serviceApproachingCount = 0;
  const serviceDueCodes: string[] = [];

  for (const e of equipments) {
    // Unit yang sedang/telah ditangani tidak perlu diperingatkan lagi.
    if (e.status === 'MAINTENANCE') continue;

    const status = getServiceStatus(e, maintSelesaiPerUnit.get(e.id) ?? []);
    if (status.isDue) {
      serviceDueCount += 1;
      if (serviceDueCodes.length < SERVICE_CODE_PREVIEW_LIMIT) {
        serviceDueCodes.push(e.equipment_code);
      }
    } else if (status.isApproaching) {
      serviceApproachingCount += 1;
    }
  }

  // ---------------------------------------------------------------------
  // Transaksi sewa
  // ---------------------------------------------------------------------
  let activeRentals = 0;
  let pendingRentals = 0;
  let completedRentals = 0;

  for (const r of rentals) {
    if (isAktif(r.status)) activeRentals += 1;
    else if (r.status === 'PENDING') pendingRentals += 1;
    else if (r.status === 'COMPLETED') completedRentals += 1;
  }

  // ---------------------------------------------------------------------
  // Pengguna
  // ---------------------------------------------------------------------
  // role_id 3 = CUSTOMER. `role_name` dipakai sebagai pelengkap bila ada,
  // karena tidak semua baris hasil query ikut mengembalikan nama role.
  const totalCustomers = users.filter(
    (u) => u.role_id === 3 || u.role_name === 'CUSTOMER'
  ).length;

  // ---------------------------------------------------------------------
  // Top N unit tersewa — hitung frekuensi, ambil top N, gabung nama unit
  // ---------------------------------------------------------------------
  const rentalCountPerUnit = new Map<number, number>();
  for (const r of rentals) {
    rentalCountPerUnit.set(r.equipment_id, (rentalCountPerUnit.get(r.equipment_id) ?? 0) + 1);
  }

  const equipmentById = new Map<number, Equipment>();
  for (const e of equipments) equipmentById.set(e.id, e);

  const topEquipments: DashboardTopEquipmentRow[] = [...rentalCountPerUnit.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, TOP_EQUIPMENT_LIMIT)
    .map(([equipment_id, rental_count]) => {
      const e = equipmentById.get(equipment_id);
      return {
        equipment_id,
        equipment_code: e?.equipment_code ?? `ID-${equipment_id}`,
        equipment_name: e?.name ?? '-',
        rental_count,
      };
    });

  // ---------------------------------------------------------------------
  // Tren pendapatan 12 bulan terakhir (PAID, urut lama→baru)
  // ---------------------------------------------------------------------
  const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                         'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Kumpulkan jumlah per bulan dari payments PAID
  const revenuePerBulan = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== 'PAID') continue;
    const nilai = Number(p.amount);
    if (!Number.isFinite(nilai)) continue;
    // payment_date bisa berupa string YYYY-MM-DD atau datetime
    const tgl = new Date(p.payment_date);
    if (Number.isNaN(tgl.getTime())) continue;
    const key = `${tgl.getFullYear()}-${String(tgl.getMonth() + 1).padStart(2, '0')}`;
    revenuePerBulan.set(key, (revenuePerBulan.get(key) ?? 0) + nilai);
  }

  // Bangun 12 slot bulan terakhir (now – 11 bulan s.d. now), isi 0 bila kosong
  const revenueTrend: DashboardRevenueTrendItem[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    revenueTrend.push({
      label: `${BULAN_SINGKAT[m - 1]} ${String(y).slice(2)}`,
      year: y,
      month: m,
      amount: revenuePerBulan.get(key) ?? 0,
    });
  }

  // ---------------------------------------------------------------------
  // Tabel turunan
  // ---------------------------------------------------------------------
  const namaPelanggan = new Map<number, User>();
  for (const u of users) namaPelanggan.set(u.id, u);

  const recentRentals: DashboardRentalRow[] = [...rentals]
    .sort((a, b) => waktuAcuan(b) - waktuAcuan(a) || b.id - a.id)
    .slice(0, RECENT_RENTAL_LIMIT)
    .map((r) => {
      const pelanggan = namaPelanggan.get(r.customer_id);
      return {
        id: r.id,
        rental_code: r.rental_code,
        customer_name: r.customer_name ?? pelanggan?.full_name ?? '-',
        company_name: r.company_name ?? pelanggan?.company_name ?? null,
        equipment_name: r.equipment_name ?? '-',
        equipment_code: r.equipment_code ?? '-',
        subtotal: Number.isFinite(Number(r.subtotal)) ? Number(r.subtotal) : 0,
        status: r.status,
        start_date: r.start_date,
        booking_date: r.booking_date,
      };
    });

  let pendingMaintenanceCount = 0;
  for (const m of maintenance) {
    if (isServisTertunda(m.status)) pendingMaintenanceCount += 1;
  }

  const serviceQueue: DashboardServiceRow[] = maintenance
    .filter((m) => isServisTertunda(m.status))
    .sort((a, b) => {
      const ta = new Date(a.scheduled_date).getTime();
      const tb = new Date(b.scheduled_date).getTime();
      const aman = Number.isNaN(ta) ? Number.MAX_SAFE_INTEGER : ta;
      const bman = Number.isNaN(tb) ? Number.MAX_SAFE_INTEGER : tb;
      return aman - bman || a.id - b.id;
    })
    .slice(0, SERVICE_QUEUE_LIMIT)
    .map((m) => ({
      id: m.id,
      maintenance_code: m.maintenance_code,
      equipment_name: m.equipment_name ?? '-',
      equipment_code: m.equipment_code ?? '-',
      maintenance_type: m.maintenance_type,
      hour_meter_at_maintenance: m.hour_meter_at_maintenance,
      scheduled_date: m.scheduled_date,
      status: m.status,
    }));

  return {
    totalRevenue,
    pendingPaymentAmount,
    pendingPaymentCount,
    totalEquipments: equipments.length,
    availableEquipments,
    rentedEquipments,
    maintenanceEquipments,
    unavailableEquipments,
    activeRentals,
    pendingRentals,
    completedRentals,
    totalCustomers,
    serviceDueCount,
    serviceApproachingCount,
    serviceDueCodes,
    pendingMaintenanceCount,
    recentRentals,
    serviceQueue,
    topEquipments,
    revenueTrend,
    generatedAt: now.toISOString(),
  };
}

/** Agregat kosong — dipakai saat sumber data benar-benar tidak tersedia. */
export function emptyDashboardStats(now: Date = new Date()): AdminDashboardStats {
  return {
    totalRevenue: 0,
    pendingPaymentAmount: 0,
    pendingPaymentCount: 0,
    totalEquipments: 0,
    availableEquipments: 0,
    rentedEquipments: 0,
    maintenanceEquipments: 0,
    unavailableEquipments: 0,
    activeRentals: 0,
    pendingRentals: 0,
    completedRentals: 0,
    totalCustomers: 0,
    serviceDueCount: 0,
    serviceApproachingCount: 0,
    serviceDueCodes: [],
    pendingMaintenanceCount: 0,
    recentRentals: [],
    serviceQueue: [],
    topEquipments: [],
    revenueTrend: [],
    generatedAt: now.toISOString(),
  };
}
