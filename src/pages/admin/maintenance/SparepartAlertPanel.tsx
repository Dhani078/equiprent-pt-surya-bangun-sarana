import React from 'react';
import { AlertTriangle, Wrench } from 'lucide-react';

interface SparepartAlertPanelProps {
  /** Frekuensi pemakaian tiap suku cadang (nama -> jumlah). */
  freq: Map<string, number>;
  threshold: number;
  onThresholdChange: (val: number) => void;
}

/** Panel notifikasi suku cadang yang sering dipakai (>= ambang, tersimpan Admin). */
export const SparepartAlertPanel: React.FC<SparepartAlertPanelProps> = ({
  freq, threshold, onThresholdChange,
}) => {
  const alerts = [...freq.entries()]
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="card-premium" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <Wrench size={18} color="var(--fg-teal)" />
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          Notifikasi Suku Cadang
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--color-secondary)', marginLeft: 'auto' }}>
          Ambang pemakaian:
        </span>
        <input
          type="number"
          min={1}
          max={99}
          value={threshold}
          onChange={(e) => onThresholdChange(Number(e.target.value))}
          className="input-premium"
          aria-label="Ambang frekuensi suku cadang"
          style={{ width: '64px', height: '34px', padding: '4px 8px', fontSize: '13px', textAlign: 'center' }}
        />
        <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>× pemakaian</span>
      </div>

      {alerts.length === 0 ? (
        <p style={{ fontSize: '12.5px', color: 'var(--color-secondary)', margin: 0 }}>
          Tidak ada suku cadang yang mencapai ambang {threshold}× pemakaian.
          {freq.size > 0 && ` (${freq.size} jenis suku cadang tercatat)`}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map(([nama, count]) => {
            const persen = Math.min(100, Math.round((count / threshold) * 50));
            return (
              <div
                key={nama}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-amber-soft)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-amber-soft)',
                  flexWrap: 'wrap',
                }}
              >
                <AlertTriangle size={15} color="var(--fg-amber)" style={{ flexShrink: 0 }} />
                <div style={{ flex: '1 1 180px', fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)' }}>
                  {nama}
                </div>
                <div style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-cream-soft)', overflow: 'hidden' }}>
                    <div style={{ width: `${persen}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: '3px', transition: 'width 0.3s' }} />
                  </div>
                </div>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--bg-cream-soft)',
                  color: 'var(--fg-warning-deep)',
                  whiteSpace: 'nowrap',
                }}>
                  {count}× dipakai
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
