/**
 * Komponen placeholder shimmer seragam untuk keadaan memuat.
 *
 * Memakai keyframes `sbs-shimmer` + kelas `.skeleton-base` di `src/index.css`
 * (keduanya adaptif terhadap dark mode) — tidak ada dependensi baru.
 * Satu-satunya sumber skeleton di seluruh aplikasi, agar animasi, warna,
 * dan ukuran placeholder tidak drift antar halaman.
 */

import React from 'react';

export interface SkeletonProps {
  /** Tinggi balok. Menerima angka (px) maupun string CSS. */
  height?: string | number;
  /** Lebar balok. Default memenuhi kontainer. */
  width?: string | number;
  /** Radius sudut. Mengikuti design token `--radius-eight`. */
  radius?: string;
}

/**
 * Balok berdenyut. `aria-hidden` karena hanya dekorasi — pesan "memuat"
 * disampaikan oleh kontainer pembungkusnya yang memakai `aria-busy`.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ height = 18, width = '100%', radius = 'var(--radius-eight)' }) => (
  <div
    aria-hidden="true"
    className="skeleton-base"
    style={{ height, width, borderRadius: radius }}
  />
);

export interface SkeletonRowsProps {
  /** Jumlah baris placeholder. */
  count?: number;
  /** Tinggi tiap baris. */
  height?: string | number;
  /** Jarak antar baris (px). */
  gap?: number;
  /** Label terbaca untuk pembaca layar — wajib, konten ini tidak punya teks. */
  ariaLabel: string;
}

/**
 * Tumpukan baris placeholder untuk tabel & daftar.
 * Pembungkusnya menyandang `aria-busy` agar layar pembaca mengumumkan
 * bahwa data masih dimuat.
 */
export const SkeletonRows: React.FC<SkeletonRowsProps> = ({ count = 5, height = 18, gap = 10, ariaLabel }) => (
  <div
    aria-busy="true"
    aria-label={ariaLabel}
    style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}
  >
    {Array.from({ length: count }, (_, i) => (
      <Skeleton key={i} height={height} />
    ))}
  </div>
);
