/**
 * Bentuk sumber data laporan + peta label status/tipe.
 *
 * Bagian dari mesin laporan operasional (dipecah dari `reports.ts` agar tiap
 * berkas tetap di bawah ~300 baris dan mudah ditelusuri). Modul tetap MURNI:
 * tanpa DOM, tanpa database.
 */
import type {
  Equipment,
  GpsTracking,
  Maintenance,
  Payment,
  Rental,
  ReportItem,
  User,
} from '../../types';


// ---------------------------------------------------------------------------
// Sumber Data Laporan
// ---------------------------------------------------------------------------

export interface ReportDataSource {
  rentals: readonly Rental[];
  equipments: readonly Equipment[];
  users: readonly User[];
  payments: readonly Payment[];
  maintenance: readonly Maintenance[];
  gps: readonly GpsTracking[];
  reports: readonly ReportItem[];
}

/** Peta id pengguna → nama lengkap, dipakai untuk mengganti id dengan nama. */
export function buildUserMap(users: readonly User[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const u of users) map.set(u.id, u.full_name);
  return map;
}

/** Peta id unit → nama unit. */
export function buildEquipmentMap(equipments: readonly Equipment[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const e of equipments) map.set(e.id, e.name);
  return map;
}

/** Nama pelanggan dari rental, dengan fallback aman bila data tidak lengkap. */
export function customerName(rental: Rental, users: Map<number, string>): string {
  return rental.customer_name ?? users.get(rental.customer_id) ?? `Pelanggan #${rental.customer_id}`;
}

/** Nama unit dari rental, dengan fallback kode unit bila nama tidak tersedia. */
export function equipmentName(
  equipmentId: number,
  rental: Pick<Rental, 'equipment_name' | 'equipment_code'>,
  equipments: Map<number, string>
): string {
  return rental.equipment_name ?? equipments.get(equipmentId) ?? `Unit #${equipmentId}`;
}

/** Terjemahan status ke label bahasa Indonesia. */
export const RENTAL_STATUS_LABEL: Readonly<Record<Rental['status'], string>> = {
  PENDING: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  ON_GOING: 'Berjalan',
  COMPLETED: 'Selesai',
  REJECTED: 'Ditolak',
};

export const PAYMENT_STATUS_LABEL: Readonly<Record<Payment['status'], string>> = {
  UNPAID: 'Belum Dibayar',
  PENDING_VERIFICATION: 'Menunggu Verifikasi',
  PAID: 'Lunas',
  FAILED: 'Gagal',
};

export const MAINTENANCE_TYPE_LABEL: Readonly<Record<Maintenance['maintenance_type'], string>> = {
  PREVENTIVE: 'Preventif',
  CORRECTIVE: 'Korektif',
  OVERHAUL: 'Overhaul',
};

export const MAINTENANCE_STATUS_LABEL: Readonly<Record<Maintenance['status'], string>> = {
  SCHEDULED: 'Terjadwal',
  IN_PROGRESS: 'Dikerjakan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const EQUIPMENT_STATUS_LABEL: Readonly<Record<Equipment['status'], string>> = {
  AVAILABLE: 'Tersedia',
  RENTED: 'Disewa',
  MAINTENANCE: 'Perawatan',
  UNAVAILABLE: 'Tidak Tersedia',
};

export const PAYMENT_METHOD_LABEL: Readonly<Record<string, string>> = {
  BANK_TRANSFER: 'Transfer Bank',
  QRIS: 'QRIS',
  CASH: 'Tunai',
};

/** Terjemahan metode pembayaran; nilai tak dikenal dikembalikan apa adanya. */
export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABEL[method] ?? method;
}
