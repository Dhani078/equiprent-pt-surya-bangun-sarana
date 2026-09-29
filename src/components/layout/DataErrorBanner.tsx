import React from 'react';

interface DataErrorBannerProps {
  pesan: string;
  onRetry: () => void;
}

/** Kartu merah galat pemuatan data awal — bisa dicoba ulang. */
export const DataErrorBanner: React.FC<DataErrorBannerProps> = ({ pesan, onRetry }) => (
  <div
    role="alert"
    className="card-premium animate-fade-in"
    style={{
      marginBottom: '20px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
      borderLeft: '4px solid var(--color-error)',
    }}
  >
    <span style={{ fontSize: '13px', fontWeight: 600, color: '#991B1B', flex: '1 1 240px' }}>
      {pesan}
    </span>
    <button
      type="button"
      className="btn-secondary"
      onClick={onRetry}
      style={{ padding: '7px 14px', fontSize: '12.5px' }}
    >
      Coba Ulang
    </button>
  </div>
);
