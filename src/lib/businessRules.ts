/**
 * Modul Aturan Bisnis Operasional Armada
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Menampung perhitungan yang sebelumnya tersebar / di-hardcode di dalam
 * komponen UI. Dipusatkan agar bisa diuji dan dipakai ulang oleh API.
 */

import type { Equipment, Maintenance, Rental } from '../types';

// ---------------------------------------------------------------------------
// Konstanta Operasional
// ---------------------------------------------------------------------------

/**
 * Interval servis preventif dalam Hour Meter (HM).
 * Setiap kelipatan 250 HM, unit wajib masuk jadwal servis.
 * Konstanta ini sengaja tidak di-hardcode di komponen agar mudah diubah
 * bila kebijakan perusahaan berubah.
 */
export const SERVICE_INTERVAL_HM = 250;

/** Ambang peringatan: unit dianggap "mendekati servis" jika sisa HM <= nilai ini. */
export const SERVICE_WARNING_THRESHOLD_HM = 50;

/** Tarif denda keterlambatan per hari (Rupiah). */
export const LATE_PENALTY_PER_DAY = 500_000;

// ---------------------------------------------------------------------------
// Hour Meter & Servis Preventif
// ---------------------------------------------------------------------------

export interface ServiceStatus {
  /** HM saat ini. */
  currentHM: number;
  /** HM terakhir kali unit diservis. 0 bila belum pernah. */
  lastServiceHM: number;
  /** HM yang sudah ditempuh sejak servis terakhir. */
  hmSinceLastService: number;
  /** HM tersisa sebelum servis berikutnya (bisa negatif bila sudah lewat). */
  hmUntilNextService: number;
  /** True bila HM sudah melewati interval servis. */
  isDue: boolean;
  /** True bila mendekati interval servis (dalam ambang peringatan). */
  isApproaching: boolean;
  /** Kelipatan interval berikutnya yang menjadi target servis. */
  nextServiceTargetHM: number;
}

/**
 * Menghitung status servis preventif sebuah unit berbasis Hour Meter.
 *
 * ATURAN BISNIS:
 * Servis berikutnya jatuh pada kelipatan SERVICE_INTERVAL_HM terdekat
 * SETELAH HM terakhir kali unit diservis.
 * Contoh: servis terakhir di HM 1200 dan interval 250
 *         → target servis berikutnya HM 1450.
 */
export function getServiceStatus(
  equipment: Equipment,
  maintenanceHistory: readonly Maintenance[]
): ServiceStatus {
  const currentHM = equipment.hour_meter;

  // Cari HM tertinggi dari riwayat servis yang sudah SELESAI untuk unit ini.
  const completed = maintenanceHistory.filter(
    (m) => m.equipment_id === equipment.id && m.status === 'COMPLETED'
  );

  const hasServiceHistory = completed.length > 0;

  // Bila unit belum pernah diservis, jadwalkan servis 250 HM ke depan
  // dari HM saat ini (kondisi unit baru). Tanpa ini, semua unit baru akan
  // dianggap "lewat jadwal" sejak HM pertama — tidak realistis.
  const baselineHM = hasServiceHistory
    ? Math.max(...completed.map((m) => m.hour_meter_at_maintenance))
    : currentHM;

  const lastServiceHM = hasServiceHistory ? baselineHM : 0;

  const hmSinceLastService = Math.max(0, currentHM - lastServiceHM);

  // Servis berikutnya = HM saat servis terakhir + interval operasional.
  // (Bukan kelipatan tetap, karena servis bisa saja terlambat dilakukan —
  //  yang penting adalah jarak 250 HM sejak servis terakhir.)
  const nextServiceTargetHM = hasServiceHistory
    ? lastServiceHM + SERVICE_INTERVAL_HM
    : currentHM + SERVICE_INTERVAL_HM;

  const hmUntilNextService = nextServiceTargetHM - currentHM;

  return {
    // Dibulatkan 2 desimal agar tidak muncul angka seperti 1162.6100000000001 di UI.
    currentHM: Math.round(currentHM * 100) / 100,
    lastServiceHM: Math.round(lastServiceHM * 100) / 100,
    hmSinceLastService: Math.round(hmSinceLastService * 100) / 100,
    hmUntilNextService: Math.round(hmUntilNextService * 100) / 100,
    isDue: hmUntilNextService <= 0,
    isApproaching:
      hmUntilNextService > 0 && hmUntilNextService <= SERVICE_WARNING_THRESHOLD_HM,
    nextServiceTargetHM: Math.round(nextServiceTargetHM * 100) / 100,
  };
}

/**
 * Mengembalikan daftar unit yang sudah waktunya diservis.
 * Unit berstatus MAINTENANCE tidak dimasukkan (sedang/telah ditangani).
 */
export function getUnitsDueForService(
  equipments: readonly Equipment[],
  maintenanceHistory: readonly Maintenance[]
): Array<{ equipment: Equipment; status: ServiceStatus }> {
  return equipments
    .filter((e) => e.status !== 'MAINTENANCE')
    .map((equipment) => ({ equipment, status: getServiceStatus(equipment, maintenanceHistory) }))
    .filter((entry) => entry.status.isDue || entry.status.isApproaching)
    .sort((a, b) => a.status.hmUntilNextService - b.status.hmUntilNextService);
}

// ---------------------------------------------------------------------------
// Denda Keterlambatan & Perhitungan Sewa
// ---------------------------------------------------------------------------

export interface RentalCost {
  /** Jumlah hari sewa. */
  days: number;
  /** Subtotal sewa (hari x tarif). */
  subtotal: number;
  /** Jumlah hari terlambat. 0 bila tidak terlambat. */
  lateDays: number;
  /** Total denda keterlambatan. */
  penalty: number;
  /** Total yang harus dibayar (subtotal + denda). */
  grandTotal: number;
}

/**
 * Menghitung jumlah hari keterlambatan pengembalian.
 *
 * Konvensi: jatuh tempo adalah pukul 00:00 UTC pada `endDate`. Unit yang
 * kembali pada hari yang sama dengan jatuh tempo TIDAK dihitung terlambat.
 * Nilai tanggal yang rusak tidak pernah menghasilkan denda (dikembalikan 0)
 * agar satu baris data yang tidak valid tidak memunculkan tagihan fiktif.
 */
export function countLateDays(endDate: string, returnDate: string | null): number {
  if (typeof returnDate !== 'string' || returnDate === '') return 0;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const end = new Date(endDate).getTime();
  const returned = new Date(returnDate).getTime();

  if (!Number.isFinite(end) || !Number.isFinite(returned)) return 0;
  if (returned <= end) return 0;

  return Math.ceil((returned - end) / MS_PER_DAY);
}

/**
 * Menghitung biaya sewa + denda keterlambatan.
 *
 * @param dailyRate  Tarif sewa per hari (Rupiah).
 * @param startDate  Tanggal mulai sewa (format ISO date).
 * @param endDate    Tanggal rencana selesai (format ISO date).
 * @param actualReturnDate Tanggal pengembalian nyata. Null bila belum kembali.
 */
export function calculateRentalCost(
  dailyRate: number,
  startDate: string,
  endDate: string,
  actualReturnDate: string | null
): RentalCost {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  // Minimal 1 hari sewa.
  const days = Math.max(1, Math.ceil((end - start) / MS_PER_DAY) + 1);

  const subtotal = days * dailyRate;

  const lateDays = countLateDays(endDate, actualReturnDate);

  const penalty = lateDays * LATE_PENALTY_PER_DAY;

  return {
    days,
    subtotal,
    lateDays,
    penalty,
    grandTotal: subtotal + penalty,
  };
}

/**
 * Menentukan apakah sebuah rental sedang berjalan pada tanggal tertentu.
 * Dipakai untuk mencegah double-booking pada unit yang sama.
 */
export function isRentalActiveOn(rental: Rental, date: Date): boolean {
  if (rental.status === 'REJECTED' || rental.status === 'COMPLETED') return false;

  const start = new Date(rental.start_date).getTime();
  const end = new Date(rental.end_date).getTime();
  const target = date.getTime();

  return target >= start && target <= end;
}

/**
 * Memeriksa apakah unit tersedia pada rentang tanggal tertentu.
 * Mengembalikan false bila ada rental aktif yang bentrok.
 */
export function isEquipmentAvailable(
  equipmentId: number,
  startDate: string,
  endDate: string,
  existingRentals: readonly Rental[]
): boolean {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  const conflict = existingRentals.some((r) => {
    if (r.equipment_id !== equipmentId) return false;
    if (r.status === 'REJECTED' || r.status === 'COMPLETED') return false;

    const rStart = new Date(r.start_date).getTime();
    const rEnd = new Date(r.end_date).getTime();

    // Dua rentang bentrok bila saling beririsan.
    return start <= rEnd && end >= rStart;
  });

  return !conflict;
}

// ---------------------------------------------------------------------------
// Format Helper (dipakai bersama agar konsisten di seluruh UI)
// ---------------------------------------------------------------------------

/** Format angka menjadi Rupiah, misal: Rp 1.250.000 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format tanggal menjadi `04 September 2026`. */
export function formatTanggal(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Format tanggal+waktu menjadi `04 September 2026, 14:30`. */
export function formatWaktu(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
