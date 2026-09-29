import React from 'react';
import { TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { formatRupiah, getLatePenaltyPerDay } from '../../../lib/businessRules';

export interface RingkasanFinansial {
  pendapatanKotor: number;
  totalDenda: number;
  terlambat: number;
  totalTransaksi: number;
}

const KARTO: React.CSSProperties = { padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' };
const ICN = (bg: string): React.CSSProperties => ({ width: '42px', height: '42px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' });

/** Tiga kartu ringkasan finansial: pendapatan kotor, denda berjalan, transaksi diproses. */
export const FinancialSummaryCards: React.FC<{ ringkasan: RingkasanFinansial }> = ({ ringkasan }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
    <div className="card-premium" style={KARTO}>
      <div style={ICN('rgba(5, 150, 105, 0.12)')}>
        <Wallet size={20} color="var(--fg-success-deep)" />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>PENDAPATAN KOTOR</p>
        <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>
          {formatRupiah(ringkasan.pendapatanKotor)}
        </p>
      </div>
    </div>

    <div className="card-premium" style={KARTO}>
      <div style={ICN('rgba(220, 38, 38, 0.12)')}>
        <AlertCircle size={20} color="var(--fg-danger)" />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>
          DENDA KETERLAMBATAN (Rp {getLatePenaltyPerDay().toLocaleString('id-ID')}/HARI)
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: 'var(--fg-danger)' }}>
          {formatRupiah(ringkasan.totalDenda)}
        </p>
      </div>
    </div>

    <div className="card-premium" style={KARTO}>
      <div style={ICN('rgba(37, 99, 235, 0.12)')}>
        <TrendingUp size={20} color="#2563eb" />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>TRANSAKSI DIPROSES</p>
        <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>
          {ringkasan.totalTransaksi} <span style={{ fontSize: '12px', fontWeight: 500 }}>({ringkasan.terlambat} terlambat)</span>
        </p>
      </div>
    </div>
  </div>
);
