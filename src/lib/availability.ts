/**
 * Mesin Ketersediaan Unit (Pencegahan Double Booking)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Modul MURNI: tidak menyentuh DOM, tidak mengambil data sendiri.
 * Dipakai bersama oleh UI (filter pilihan unit) dan API (validasi server)
 * supaya aturan "unit tidak boleh disewa pada rentang yang bentrok"
 hanya ditulis sekali.
 *
 * Alasan modul ini ada:
 * sebelumnya form rental hanya menyaring `status === 'AVAILABLE'`, sehingga
 * unit yang sedang disewa pada rentang tanggal tertentu tetap bisa dipilih
 * → double booking. Status unit adalah keadaan HARI INI, sedangkan bentrokan
 * sewa adalah keadaan pada RENTANG TANGGAL yang diminta.
 */

import type { Equipment, Rental } from '../types';
import { formatTanggal } from './businessRules';

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

/** Rentang sewa yang sudah memesan unit (penyebab bentrokan). */
export interface RentalPeriod {
  id: number;
  rentalCode: string;
  customerName: string;
  startDate: string;
  endDate: string;
  status: Rental['status'];
}

/** Mengapa sebuah unit tidak bisa dipilih. */
export type BlockedReason =
  /** Bebas dipesan pada rentang yang diminta. */
  | 'AVAILABLE'
  /** Unit sedang dirawat / dinonaktifkan, sehingga tidak boleh disewa kapan pun. */
  | 'UNIT_STATUS'
  /** Unit ada, tetapi rentang tanggal yang diminta beririsan dengan sewa lain. */
  | 'DATE_CONFLICT'
  /** Rentang tanggal yang diminta tidak valid. */
  | 'INVALID_RANGE';

/** Hasil pemeriksaan ketersediaan untuk SATU unit. */
export interface EquipmentAvailability {
  equipment: Equipment;
  /** True bila unit boleh dipilih pada rentang yang diminta. */
  isBookable: boolean;
  blockedReason: BlockedReason;
  /** Daftar sewa yang bentrok (kosong bila tidak bentrok). */
  conflicts: RentalPeriod[];
}

// ---------------------------------------------------------------------------
// Helper Tanggal
// ---------------------------------------------------------------------------

/**
 * Mengubah nilai tanggal menjadi timestamp UTC tengah hari.
 *
 * Tengah hari sengaja dipakai (bukan 00:00) agar zona waktu peramban tidak
 * menggeser tanggal satu hari ke belakang/maju — masalah klasik `new Date('2026-09-01')`.
 * Mengembalikan null bila tanggal tidak bisa diparse.
 */
function toSafeTime(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || value === '') return null;
  const time = new Date(`${value.slice(0, 10)}T12:00:00Z`).getTime();
  return Number.isFinite(time) ? time : null;
}

/** Status rental yang masih mengunci unit (belum selesai / belum ditolak). */
export function isBlockingStatus(status: Rental['status']): boolean {
  return status !== 'COMPLETED' && status !== 'REJECTED';
}

/**
 * Status unit yang membuatnya tidak boleh disewa kapan pun.
 *
 * RENTED sengaja TIDAK termasuk: status unit adalah keadaan hari ini,
 * sedangkan pemesanan menyangkut rentang tanggal di masa depan. Unit yang
 * sedang disewa bulan ini tetap sah dipesan untuk bulan depan — yang
 * menentukan adalah apakah rentangnya bentrok (lihat `getRentalConflicts`).
 */
export function isUnitOutOfService(status: Equipment['status']): boolean {
  return status === 'MAINTENANCE' || status === 'UNAVAILABLE';
}

/**
 * Menukar `from` & `to` bila terbalik dan membuang nilai yang tidak valid.
 * Mengembalikan null bila salah satu tanggal tidak bisa diparse.
 */
export function normalizeBookingRange(
  from: string,
  to: string
): { from: string; to: string } | null {
  const a = toSafeTime(from);
  const b = toSafeTime(to);
  if (a === null || b === null) return null;

  return a <= b
    ? { from: from.slice(0, 10), to: to.slice(0, 10) }
    : { from: to.slice(0, 10), to: from.slice(0, 10) };
}

// ---------------------------------------------------------------------------
// Inti: Deteksi Bentrokan
// ---------------------------------------------------------------------------

/**
 * Mengembalikan daftar sewa yang beririsan dengan rentang yang diminta.
 *
 * @param excludeRentalId  Dipakai saat MENGUBAH rental yang sudah ada agar
 *                         rental itu sendiri tidak dianggap bentrok dengan
 *                         dirinya sendiri.
 */
export function getRentalConflicts(
  equipmentId: number,
  from: string,
  to: string,
  rentals: readonly Rental[],
  excludeRentalId?: number
): RentalPeriod[] {
  const range = normalizeBookingRange(from, to);
  if (range === null) return [];

  const start = toSafeTime(range.from);
  const end = toSafeTime(range.to);
  if (start === null || end === null) return [];

  return rentals
    .filter((r) => {
      if (r.equipment_id !== equipmentId) return false;
      if (excludeRentalId !== undefined && r.id === excludeRentalId) return false;
      if (!isBlockingStatus(r.status)) return false;

      const rStart = toSafeTime(r.start_date);
      const rEnd = toSafeTime(r.end_date);
      // Tanggal rusak pada data lama tidak boleh membuat seluruh unit terkunci.
      if (rStart === null || rEnd === null) return false;

      // Dua rentang bentrok bila saling beririsan (ujung yang bersentuhan
      // tetap dihitung bentrok: unit butuh waktu mobilisasi & demobilisasi).
      return start <= rEnd && end >= rStart;
    })
    .map((r) => ({
      id: r.id,
      rentalCode: r.rental_code,
      customerName: r.customer_name ?? r.company_name ?? 'Pelanggan',
      startDate: r.start_date,
      endDate: r.end_date,
      status: r.status,
    }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * Memeriksa ketersediaan SELURUH unit pada rentang yang diminta.
 * Urutan keluaran mengikuti urutan `equipments` agar stabil di UI.
 */
export function buildEquipmentAvailability(
  equipments: readonly Equipment[],
  rentals: readonly Rental[],
  from: string,
  to: string,
  excludeRentalId?: number
): EquipmentAvailability[] {
  const range = normalizeBookingRange(from, to);
  const rangeInvalid = range === null;

  return equipments.map((equipment) => {
    // Rentang tidak valid → tidak ada unit yang boleh dipilih, tetapi jangan
    // menuduh unit sedang disewa (pesan yang menyesatkan).
    if (rangeInvalid) {
      return { equipment, isBookable: false, blockedReason: 'INVALID_RANGE', conflicts: [] };
    }

    const conflicts = getRentalConflicts(
      equipment.id,
      range.from,
      range.to,
      rentals,
      excludeRentalId
    );

    if (conflicts.length > 0) {
      return { equipment, isBookable: false, blockedReason: 'DATE_CONFLICT', conflicts };
    }

    if (isUnitOutOfService(equipment.status)) {
      return { equipment, isBookable: false, blockedReason: 'UNIT_STATUS', conflicts: [] };
    }

    return { equipment, isBookable: true, blockedReason: 'AVAILABLE', conflicts: [] };
  });
}

// ---------------------------------------------------------------------------
// Pesan untuk Manusia
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<Equipment['status'], string> = {
  AVAILABLE: 'Tersedia',
  RENTED: 'Sedang disewa',
  MAINTENANCE: 'Dalam perawatan',
  UNAVAILABLE: 'Tidak tersedia',
};

/** Kalimat singkat yang menjelaskan mengapa unit tidak bisa dipilih. */
export function describeBlockedReason(availability: EquipmentAvailability): string {
  const code = availability.equipment.equipment_code;
  const name = availability.equipment.name;

  switch (availability.blockedReason) {
    case 'INVALID_RANGE':
      return 'Rentang tanggal tidak valid. Periksa kembali tanggal mulai dan tanggal selesai.';

    case 'UNIT_STATUS':
      return `${code} — ${name} berstatus ${STATUS_LABEL[availability.equipment.status]}, sehingga tidak dapat disewa.`;

    case 'DATE_CONFLICT': {
      const first = availability.conflicts[0];
      if (!first) return `${code} sudah dipesan pada rentang tersebut.`;
      return `${code} sudah dipesan ${first.rentalCode} (${formatTanggal(first.startDate)} – ${formatTanggal(first.endDate)}).`;
    }

    case 'AVAILABLE':
      return `${code} — ${name} tersedia.`;
  }
}

/**
 * Ringkasan yang ditampilkan di kepala form: berapa unit yang masih bisa
 * dipesan pada rentang tanggal yang sedang dipilih.
 */
export interface AvailabilitySummary {
  total: number;
  bookable: number;
  blockedByDate: number;
  blockedByStatus: number;
}

export function summarizeAvailability(
  availability: readonly EquipmentAvailability[]
): AvailabilitySummary {
  return {
    total: availability.length,
    bookable: availability.filter((a) => a.isBookable).length,
    blockedByDate: availability.filter((a) => a.blockedReason === 'DATE_CONFLICT').length,
    blockedByStatus: availability.filter((a) => a.blockedReason === 'UNIT_STATUS').length,
  };
}
