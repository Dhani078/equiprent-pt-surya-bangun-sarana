/**
 * StatusBadge — satu sumber kebenaran untuk label & warna status di seluruh UI.
 *
 * Audit visual menemukan label status berbahasa Inggris (ON GOING, LUNAS,
 * PENDING, SCHEDULED) dan warna yang sama untuk semua tingkat keparahan.
 * Modul ini memusatkan terjemahan + pemetaan nada semantik:
 *
 *   merah  = kritis / penting / ditolak
 *   hijau  = lunas / selesai / tersedia
 *   biru   = sedang berjalan / beroperasi
 *   kuning = menunggu
 *   abu    = netral
 */

import React from 'react';

export type StatusTone = 'danger' | 'success' | 'info' | 'warning' | 'neutral';

const TONE_CLASS: Readonly<Record<StatusTone, string>> = {
  danger: 'badge-sem-danger',
  success: 'badge-sem-success',
  info: 'badge-sem-info',
  warning: 'badge-sem-warning',
  neutral: 'badge-sem-neutral',
};

/** Label & nada untuk status sewa (Rental['status']). */
const RENTAL_META: Readonly<Record<string, { label: string; tone: StatusTone }>> = {
  PENDING: { label: 'Menunggu Persetujuan', tone: 'warning' },
  APPROVED: { label: 'Disetujui', tone: 'info' },
  ON_GOING: { label: 'Sedang Berjalan', tone: 'info' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
  REJECTED: { label: 'Ditolak', tone: 'danger' },
};

/** Versi pendek untuk konteks padat (tabel dashboard, kartu kecil). */
const RENTAL_SHORT: Readonly<Record<string, string>> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  ON_GOING: 'Berjalan',
  COMPLETED: 'Selesai',
  REJECTED: 'Ditolak',
};

/** Label & nada untuk status pembayaran (Payment['status']). */
const PAYMENT_META: Readonly<Record<string, { label: string; tone: StatusTone }>> = {
  UNPAID: { label: 'Belum Dibayar', tone: 'neutral' },
  PENDING_VERIFICATION: { label: 'Menunggu Verifikasi', tone: 'warning' },
  PAID: { label: 'Lunas', tone: 'success' },
  FAILED: { label: 'Ditolak', tone: 'danger' },
};

/** Label & nada untuk status perawatan (Maintenance['status']). */
const MAINTENANCE_META: Readonly<Record<string, { label: string; tone: StatusTone }>> = {
  SCHEDULED: { label: 'Dijadwalkan', tone: 'warning' },
  IN_PROGRESS: { label: 'Sedang Dikerjakan', tone: 'info' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
  CANCELLED: { label: 'Dibatalkan', tone: 'danger' },
};

/** Label & nada untuk status unit alat berat (Equipment['status']). */
const EQUIPMENT_META: Readonly<Record<string, { label: string; tone: StatusTone }>> = {
  AVAILABLE: { label: 'Tersedia', tone: 'success' },
  RENTED: { label: 'Sedang Disewa', tone: 'info' },
  MAINTENANCE: { label: 'Dalam Perawatan', tone: 'warning' },
  UNAVAILABLE: { label: 'Tidak Tersedia', tone: 'danger' },
};

const REGISTRY = {
  rental: RENTAL_META,
  payment: PAYMENT_META,
  maintenance: MAINTENANCE_META,
  equipment: EQUIPMENT_META,
} as const;

export type StatusKind = keyof typeof REGISTRY;

export interface StatusBadgeProps {
  kind: StatusKind;
  /** Nilai status asli dari DB, mis. 'ON_GOING'. */
  status: string;
  /** Ukuran font (px) opsional untuk konteks padat. */
  fontSize?: number;
  /** Tampilkan label pendek (mis. "Menunggu" alih-alih "Menunggu Persetujuan") untuk tabel padat. */
  short?: boolean;
}

/**
 * Merender badge status yang sudah diterjemahkan & diberi nada semantik.
 *
 * Nilai yang tidak dikenal (mis. status baru dari DB yang belum terdaftar)
 * tidak membuat layar error — label ditampilkan apa adanya dengan nada netral.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ kind, status, fontSize = 11, short = false }) => {
  const meta = REGISTRY[kind][status];
  const label = short && kind === 'rental' && RENTAL_SHORT[status]
    ? RENTAL_SHORT[status]
    : (meta?.label ?? status);
  const tone = meta?.tone ?? 'neutral';
  const full = meta?.label ?? status;
  // T-0073: `title` tidak sampai ke pembaca layar — sediakan nama lengkap
  // yang dapat diakses (aria-label) saat label dipersingkat.
  return (
    <span
      className={`badge ${TONE_CLASS[tone]}`}
      style={fontSize !== 11 ? { fontSize: `${fontSize}px` } : undefined}
      title={short && full !== label ? full : undefined}
      aria-label={short && full !== label ? full : undefined}
    >
      {label}
    </span>
  );
};
