import React from 'react';
import { Hourglass } from 'lucide-react';
import { formatRupiah, getLatePenaltyPerDay } from '../../../lib/businessRules';
import { summarizeLatePenalties } from '../../../lib/rentalWorkflow';

/** Kartu ringkasan denda keterlambatan berjalan (unit lewat tempo + total tarif). */
export const LatePenaltySummaryBar: React.FC<{ denda: ReturnType<typeof summarizeLatePenalties> }> = ({ denda }) => (
  <div
    className="card-premium"
    style={{
      padding: '14px 16px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '8px 18px',
      borderLeft: `4px solid ${denda.lateCount > 0 ? '#EF4444' : '#10B981'}`,
    }}
    aria-label="Ringkasan denda keterlambatan berjalan"
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Hourglass size={16} style={{ color: 'var(--color-primary)' }} />
      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
        Denda Keterlambatan Berjalan
      </span>
    </div>
    <span style={{ fontSize: '12.5px', color: 'var(--color-secondary)' }}>
      {denda.lateCount} unit lewat jatuh tempo · tarif {formatRupiah(getLatePenaltyPerDay())}/hari
    </span>
    <strong
      style={{
        marginLeft: 'auto',
        fontSize: '15px',
        fontFamily: 'monospace',
        color: denda.penaltyTotal > 0 ? 'var(--fg-danger-deep)' : 'var(--fg-success-deep)',
      }}
    >
      {formatRupiah(denda.penaltyTotal)}
    </strong>
  </div>
);
