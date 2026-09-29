import React from 'react';

interface ToastNotifProps {
  toast: { message: string; tone: 'success' | 'error' } | null;
}

/** Notifikasi global: muncul setelah aksi berhasil / gagal. */
export const ToastNotif: React.FC<ToastNotifProps> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        maxWidth: '380px',
        padding: '14px 18px',
        borderRadius: 'var(--radius-eight)',
        boxShadow: 'var(--shadow-lg)',
        backgroundColor: toast.tone === 'success' ? '#ECFDF5' : '#FEF2F2',
        border: `1px solid ${toast.tone === 'success' ? '#A7F3D0' : '#FECACA'}`,
        color: toast.tone === 'success' ? '#065F46' : '#991B1B',
        fontSize: '13px',
        fontWeight: 600,
        lineHeight: 1.5,
      }}
    >
      {toast.message}
    </div>
  );
};
