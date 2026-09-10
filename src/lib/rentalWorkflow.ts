/**
 * Mesin Alur Status Penyewaan (T-0006)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Modul MURNI: tidak menyentuh DOM, tidak mengambil data sendiri, tidak
 * memanggil jaringan. Dipakai bersama oleh:
 *   1. Edge API  `PUT /api/rentals/:id/status` — sumber kebenaran.
 *   2. Halaman   `RentalManagement`            — umpan balik cepat & label UI.
 *
 * Alasan modul ini ada:
 * sebelumnya aturan transisi status tersebar di komponen (tombol apa yang
 * muncul) dan di server (status apa yang diterima), sehingga keduanya bisa
 * menyimpang. Sekarang hanya ada SATU matriks transisi yang diuji.
 */

import type { Rental } from '../types';
import { countLateDays, LATE_PENALTY_PER_DAY } from './businessRules';

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

export type RentalStatus = Rental['status'];

/** Status yang masih mengunci unit (belum selesai / belum ditolak). */
export type RentalLifecycleTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Label siap tampil untuk satu status. */
export interface RentalStatusMeta {
  label: string;
  tone: RentalLifecycleTone;
}

/** Hasil evaluasi: apakah sebuah transisi status diizinkan. */
export type TransitionCheck =
  | { allowed: true; next: RentalStatus; label: string }
  | { allowed: false; reason: string };

/**
 * Ringkasan keterlambatan sebuah rental.
 *
 * `referenceAt` dibawa ikut agar UI (yang menghitung dengan `Date.now()`)
 * dan server (yang menghitung saat permintaan diproses) bisa dibandingkan
 * tanpa perbedaan jam yang membingungkan.
 */
export interface LateReturnInfo {
  /** Jumlah hari keterlambatan. 0 bila tidak terlambat. */
  lateDays: number;
  /** Total denda (Rupiah). */
  penalty: number;
  /** True bila rental masih berjalan padahal jatuh tempo sudah lewat. */
  isLate: boolean;
}

/** Dampak sebuah transisi terhadap unit & status yang diturunkan. */
export interface TransitionEffect {
  nextStatus: RentalStatus;
  /**
   * Status unit setelah transisi. `null` bila unit tidak boleh diubah
   * (misalnya menyetujui sewa yang akan berjalan besok — unit baru
   * dikunci saat ON_GOING).
   */
  equipmentStatus: 'RENTED' | 'AVAILABLE' | null;
}

// ---------------------------------------------------------------------------
// Matriks Transisi Status
// ---------------------------------------------------------------------------

/**
 * Transisi yang DIIZINKAN.
 *
 * PENDING   → APPROVED (disetujui)   | REJECTED (ditolak)
 * APPROVED  → ON_GOING (mobilisasi)  | REJECTED (dibatalkan)
 * ON_GOING  → COMPLETED (unit kembali)
 * COMPLETED → (status akhir, tidak bisa diubah)
 * REJECTED  → (status akhir, tidak bisa diubah)
 *
 * Catatan bisnis:
 * - PENDING tidak boleh langsung ON_GOING: unit wajib disetujui dulu.
 * - COMPLETED & REJECTED adalah status akhir (terminal) — tidak ada jalan
 *   kembali, supaya audit trail dan laporan keuangan tidak bisa diubah-ubah.
 */
const ALLOWED_TRANSITIONS: Readonly<Record<RentalStatus, readonly RentalStatus[]>> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['ON_GOING', 'REJECTED'],
  ON_GOING: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
};

/** Label & warna badge untuk tiap status (mengikuti design system §7). */
export const RENTAL_STATUS_META: Readonly<Record<RentalStatus, RentalStatusMeta>> = {
  PENDING: { label: 'Menunggu Persetujuan', tone: 'warning' },
  APPROVED: { label: 'Disetujui', tone: 'info' },
  ON_GOING: { label: 'Beroperasi', tone: 'info' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
  REJECTED: { label: 'Ditolak', tone: 'danger' },
};

/** Semua status rental yang diakui, dipakai untuk validasi input. */
export const RENTAL_STATUSES: readonly RentalStatus[] = [
  'PENDING',
  'APPROVED',
  'ON_GOING',
  'COMPLETED',
  'REJECTED',
];

/** Type guard: nilai dari JSON tidak boleh dipercaya mentah-mentah. */
export function isRentalStatus(value: unknown): value is RentalStatus {
  return typeof value === 'string' && RENTAL_STATUSES.includes(value as RentalStatus);
}

/** Label badge untuk status rental. */
export function getRentalStatusLabel(status: RentalStatus): string {
  return RENTAL_STATUS_META[status].label;
}

/** Nada warna badge untuk status rental. */
export function getRentalStatusTone(status: RentalStatus): RentalLifecycleTone {
  return RENTAL_STATUS_META[status].tone;
}

/** Status yang masih mengunci unit (dipakai konsistensi & laporan). */
export function isRentalLocking(status: RentalStatus): boolean {
  return status === 'PENDING' || status === 'APPROVED' || status === 'ON_GOING';
}

/**
 * Dampak transisi terhadap status unit.
 *
 * - APPROVED  → unit BELUM dikunci. Sewa bisa disetujui jauh hari sebelum
 *   mobilisasi; mengunci unit sejak persetujuan membuatnya tidak bisa
 *   dipesan untuk periode lain yang sah.
 * - ON_GOING  → unit dikunci menjadi RENTED (sedang di tangan pelanggan).
 * - COMPLETED / REJECTED → unit dibebaskan menjadi AVAILABLE.
 */
export function getTransitionEffect(next: RentalStatus): TransitionEffect {
  if (next === 'ON_GOING') {
    return { nextStatus: next, equipmentStatus: 'RENTED' };
  }
  if (next === 'COMPLETED' || next === 'REJECTED') {
    return { nextStatus: next, equipmentStatus: 'AVAILABLE' };
  }
  return { nextStatus: next, equipmentStatus: null };
}

/**
 * Memeriksa apakah sebuah perubahan status diizinkan.
 *
 * `now` disuntikkan (bukan `Date.now()` di dalam) supaya hasilnya
 * deterministik dan dapat diuji untuk kasus batas.
 */
export function canTransition(
  current: RentalStatus,
  next: RentalStatus
): TransitionCheck {
  if (current === next) {
    return { allowed: false, reason: `Status sewa sudah ${getRentalStatusLabel(current)}.` };
  }

  const allowedNext = ALLOWED_TRANSITIONS[current];
  if (!allowedNext.includes(next)) {
    return {
      allowed: false,
      reason: `Perubahan status ${getRentalStatusLabel(current)} → ${getRentalStatusLabel(next)} tidak diizinkan.`,
    };
  }

  return { allowed: true, next, label: getRentalStatusLabel(next) };
}

/** Daftar status tujuan yang sah dari status saat ini. */
export function getAllowedNextStatuses(current: RentalStatus): readonly RentalStatus[] {
  return ALLOWED_TRANSITIONS[current];
}

// ---------------------------------------------------------------------------
// Keterlambatan & Denda
// ---------------------------------------------------------------------------

/**
 * Menghitung keterlambatan pengembalian sebuah rental.
 *
 * ATURAN BISNIS (§4.3 poin 7): denda dihitung per hari keterlambatan
 * dengan tarif `LATE_PENALTY_PER_DAY` yang TIDAK di-hardcode di sini.
 *
 * - Rental yang sudah COMPLETED memakai `returnDate` bila tersedia;
 *   bila kosong, memakai `endDate` (dianggap kembali tepat waktu).
 * - Rental yang masih berjalan (ON_GOING / APPROVED) dievaluasi terhadap
 *   `referenceAt` — denda berjalan hari per hari sampai unit kembali.
 * - Status PENDING / REJECTED tidak pernah dikenakan denda.
 */
export function getLateReturnInfo(
  rental: Pick<Rental, 'status' | 'start_date' | 'end_date'>,
  options: { returnDate?: string | null; referenceAt?: Date } = {}
): LateReturnInfo {
  const { returnDate = null, referenceAt } = options;

  const menghasilkanDenda = rental.status === 'ON_GOING' || rental.status === 'COMPLETED';
  if (!menghasilkanDenda) {
    return { lateDays: 0, penalty: 0, isLate: false };
  }

  const tanggalKembali =
    returnDate ??
    (rental.status === 'COMPLETED' ? rental.end_date : (referenceAt ?? new Date()).toISOString());

  const lateDays = countLateDays(rental.end_date, tanggalKembali);

  return {
    lateDays,
    penalty: lateDays * LATE_PENALTY_PER_DAY,
    isLate: lateDays > 0,
  };
}

/**
 * Total denda keterlambatan berjalan (hanya rental yang masih ON_GOING).
 *
 * Dipakai ringkasan finansial halaman sewa agar angkanya identik dengan
 * yang dihitung server — rumus tidak lagi ditulis dua kali.
 */
export function summarizeLatePenalties(
  rentals: ReadonlyArray<Pick<Rental, 'status' | 'start_date' | 'end_date'>>,
  referenceAt: Date = new Date()
): { penaltyTotal: number; lateCount: number } {
  let penaltyTotal = 0;
  let lateCount = 0;

  for (const rental of rentals) {
    if (rental.status !== 'ON_GOING') continue;
    const info = getLateReturnInfo(rental, { referenceAt });
    if (info.lateDays <= 0) continue;
    lateCount += 1;
    penaltyTotal += info.penalty;
  }

  return { penaltyTotal, lateCount };
}
