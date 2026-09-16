/**
 * Dialog konfirmasi reusable untuk aksi destruktif.
 *
 * Berbeda dari Modal umum: ConfirmDialog khusus untuk pola
 * "Apakah kamu yakin?" — hanya dua tombol (konfirmasi + batal),
 * tone bisa danger atau warning, dan selalu punya focus trap.
 */
import React, { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  /** Apakah dialog ditampilkan. */
  open: boolean;
  /** Judul singkat dialog, maks ~60 karakter. */
  title: string;
  /** Pesan penjelas — boleh JSX agar bisa menebalkan nama item. */
  message: React.ReactNode;
  /** Teks tombol konfirmasi (default "Ya, Lanjutkan"). */
  confirmLabel?: string;
  /** Teks tombol batal (default "Batal"). */
  cancelLabel?: string;
  /** Warna semantik tombol konfirmasi. */
  tone?: 'danger' | 'warning';
  /** Dipanggil saat pengguna menekan tombol konfirmasi. */
  onConfirm: () => void;
  /** Dipanggil saat pengguna menekan Batal, ESC, atau overlay. */
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  tone = 'danger',
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Fokus ke tombol konfirmasi saat dialog terbuka
  useEffect(() => {
    if (open) {
      // Sedikit delay agar elemen sudah render
      const id = setTimeout(() => confirmBtnRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Tutup dengan ESC + focus trap
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key !== 'Tab') return;

      // Focus trap: tetap di dalam dialog
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = tone === 'danger';
  const iconColor = isDanger ? '#DC2626' : '#D97706';
  const confirmBg = isDanger ? '#DC2626' : '#D97706';
  const Icon = isDanger ? AlertTriangle : AlertCircle;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="animate-fade-in"
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '28px 24px 20px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Tutup dialog konfirmasi"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-secondary)',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <X size={16} />
        </button>

        {/* Icon + Judul */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div
            style={{
              flexShrink: 0,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isDanger ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} color={iconColor} />
          </div>
          <div>
            <h3
              id="confirm-dialog-title"
              style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: '0 0 6px 0' }}
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-desc"
              style={{ fontSize: '13px', color: 'var(--color-secondary)', margin: 0, lineHeight: 1.55 }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Tombol */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            style={{ padding: '9px 18px', fontSize: '13px' }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className="btn-primary"
            style={{ padding: '9px 18px', fontSize: '13px', backgroundColor: confirmBg, borderColor: confirmBg }}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
