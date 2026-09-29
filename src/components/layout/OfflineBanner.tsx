import React from 'react';
import type { InfoKoneksi } from '../../lib/connectionState';

interface OfflineBannerProps {
  koneksi: InfoKoneksi;
  jumlahAntre: number;
}

/** Banner kuning saat Worker tak terjangkau + badge jumlah mutasi tertahan. */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({ koneksi, jumlahAntre }) => {
  if (koneksi.status !== 'OFFLINE') return null;
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 24px',
        background: 'rgba(217, 119, 6, 0.12)',
        borderBottom: '1px solid rgba(217, 119, 6, 0.35)',
        color: 'var(--color-warning-text, #B45309)',
        fontSize: '12.5px',
        fontWeight: 600,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      <span>{koneksi.pesan}</span>
      {jumlahAntre > 0 && (
        <span
          style={{
            marginLeft: 'auto',
            background: 'rgba(217, 119, 6, 0.18)',
            border: '1px solid rgba(217, 119, 6, 0.4)',
            borderRadius: '999px',
            padding: '2px 10px',
            fontSize: '11.5px',
            fontWeight: 700,
          }}
        >
          {jumlahAntre} perubahan tertahan
        </span>
      )}
    </div>
  );
};
