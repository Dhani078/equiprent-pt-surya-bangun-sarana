import React from 'react';
import { useTerjemahan } from '../../lib/i18n';

/** Footer tautan pendaftaran akses pelanggan (satu penekanan: bold, tanpa underline). */
export const RegisterLinkFooter: React.FC<{ onOpenRegister: () => void }> = ({ onOpenRegister }) => {
  const { t } = useTerjemahan();
  return (
    <div
      style={{
        marginTop: 'var(--space-6)',
        paddingTop: 'var(--space-5)',
        borderTop: '1px solid var(--color-border)',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 'var(--fs-body)', color: 'var(--color-secondary)', margin: 0 }}>
        {t('login.staf_baru')}{' '}
        <button
          type="button"
          onClick={onOpenRegister}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {t('login.daftar_pelanggan')}
        </button>
      </p>
    </div>
  );
};
