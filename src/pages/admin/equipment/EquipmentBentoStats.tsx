/**
 * Panel kartu agregat inventaris (Total / Tersedia / Disewa / Maintenance).
 *
 * Dipisah dari `EquipmentManagement.tsx`; menghitung sendiri jumlah per status
 * dari `equipments` supaya induk tidak membawa angka turunan.
 */
import type React from 'react';
import type { Equipment } from '../../../types';

interface Props {
  equipments: Equipment[];
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-secondary)',
  textTransform: 'uppercase',
  fontWeight: 700,
  margin: '0 0 6px 0',
  fontFamily: 'monospace',
};

const VALUE_STYLE: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 800,
};

export const EquipmentBentoStats: React.FC<Props> = ({ equipments }) => {
  const count = (status: Equipment['status']) =>
    equipments.filter((e) => e.status === status).length;

  const items: { label: string; total: number; color: string }[] = [
    { label: 'Total Unit', total: equipments.length, color: 'var(--color-primary)' },
    { label: 'Tersedia', total: count('AVAILABLE'), color: 'var(--fg-success-deep)' },
    { label: 'Disewa (Aktif)', total: count('RENTED'), color: 'var(--color-info)' },
    { label: 'Maintenance', total: count('MAINTENANCE'), color: 'var(--fg-amber)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '14px',
    }}>
      {items.map((it) => (
        <div key={it.label} className="card-premium" style={{ padding: '16px' }}>
          <p style={{ ...LABEL_STYLE, color: it.color }}>{it.label}</p>
          <div className="serial-code" style={{ ...VALUE_STYLE, color: it.color }}>
            {it.total} Unit
          </div>
        </div>
      ))}
    </div>
  );
};
