/**
 * Keadaan kosong seragam untuk seluruh halaman & panel (design system §7).
 *
 * Sebelumnya komponen ini hanya hidup di AdminDashboard.tsx (tidak diekspor),
 * sehingga halaman lain merasa bebas membuat markup empty state masing-masing
 * — gaya jadi tidak seragam. Sekarang satu sumber kebenaran di sini.
 */
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  /** Judul singkat (contoh: "Tidak ada transaksi"). */
  pesan: string;
  /** Penjelasan atau ajakan bertindak. */
  keterangan?: string;
  ariaLabel?: string;
  /** Ikon di atas judul; default ikon kotak masuk netral. */
  ikon?: LucideIcon;
  /** Node aksi opsional (tombol "Muat ulang", dsb). */
  aksi?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  pesan,
  keterangan,
  ariaLabel,
  ikon: Ikon = Inbox,
  aksi,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '36px 18px',
      border: '1px dashed var(--color-border)',
      borderRadius: 'var(--radius-eight)',
      textAlign: 'center',
    }}
    aria-label={ariaLabel}
    role="status"
  >
    <Ikon size={28} color="#94A3B8" aria-hidden />
    <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--color-secondary)' }}>
      {pesan}
    </p>
    {keterangan && (
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-secondary-light)', maxWidth: '340px' }}>
        {keterangan}
      </p>
    )}
    {aksi}
  </div>
);
