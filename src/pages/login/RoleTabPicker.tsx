import React from 'react';
import { RoleName } from '../../types';

interface RoleTabPickerProps {
  selectedRole: RoleName;
  onSelect: (role: RoleName) => void;
  /** Label tab peran — mengikuti bahasa aktif (i18n). */
  labelTabPeran: Readonly<Record<RoleName, string>>;
}

/** Tablist ARIA pemilih peran — label Bahasa Indonesia. */
export const RoleTabPicker: React.FC<RoleTabPickerProps> = ({ selectedRole, onSelect, labelTabPeran }) => (
  <div
    role="tablist"
    aria-label="Pilih peran pengguna"
    style={{
      display: 'flex',
      backgroundColor: 'var(--bg-subtle)',
      padding: '4px',
      borderRadius: 'var(--radius-eight)',
      marginBottom: 'var(--space-4)',
      border: '1px solid var(--color-border)',
      gap: '2px',
    }}
  >
    {(['ADMIN', 'STAFF', 'CUSTOMER'] as RoleName[]).map((role) => {
      const aktif = selectedRole === role;
      return (
        <button
          key={role}
          type="button"
          role="tab"
          aria-selected={aktif}
          onClick={() => onSelect(role)}
          style={{
            flex: 1,
            padding: '10px 4px',
            textAlign: 'center',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontFamily: 'var(--font-primary)',
            fontSize: 'var(--fs-sm)',
            fontWeight: aktif ? 800 : 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: aktif ? '#FFFFFF' : 'transparent',
            color: aktif ? 'var(--color-primary)' : 'var(--text-body)',
            boxShadow: aktif ? '0 2px 6px rgba(0,51,102,0.12)' : 'none',
            outline: aktif ? '1px solid rgba(0, 51, 102, 0.25)' : 'none',
            outlineOffset: aktif ? '-1px' : 0,
          }}
        >
          {labelTabPeran[role]}
        </button>
      );
    })}
  </div>
);
