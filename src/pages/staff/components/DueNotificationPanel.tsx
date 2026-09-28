/**
 * Panel notifikasi jatuh tempo & keterlambatan (dashboard staf).
 *
 * Baris dihitung induk lewat `useMemo` (dueNotifications); komponen ini
 * hanya merender 6 teratas + total denda + tombol lompat ke tab Sewa.
 */
import React from 'react';
import { Bell } from 'lucide-react';
import { formatRupiah, formatRupiahRingkas, formatTanggal, getLatePenaltyPerDay } from '../../../lib/businessRules';

/** Satu baris notifikasi yang dihitung induk. */
export interface DueNotificationRow {
  rental: { id: number; rental_code: string; customer_name?: string; end_date?: string | null; equipment_name?: string; equipment_id: number };
  selisihHari: number;
  terlambat: boolean;
  hariTerlambat: number;
  denda: number;
  segeraJatuhTempo: boolean;
}

interface Props {
  rows: readonly DueNotificationRow[];
  totalDenda: number;
  jumlahTerlambat: number;
  onTindakLanjut: () => void;
}

export const DueNotificationPanel: React.FC<Props> = ({ rows: dueNotifications, totalDenda, jumlahTerlambat, onTindakLanjut }) => {
  if (dueNotifications.length === 0) return null;
  return (
    <div
      className="card-premium animate-fade-in"
      style={{ padding: '16px 18px', borderLeft: `4px solid ${jumlahTerlambat > 0 ? 'var(--fg-danger)' : '#F59E0B'}` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <Bell size={18} color={jumlahTerlambat > 0 ? 'var(--fg-danger)' : '#F59E0B'} />
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          Notifikasi Jatuh Tempo & Keterlambatan
        </h3>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: jumlahTerlambat > 0 ? 'var(--bg-rose-soft)' : 'var(--bg-cream-soft)',
            color: jumlahTerlambat > 0 ? 'var(--fg-danger-deep)' : 'var(--fg-warning-deep)',
          }}
        >
          {jumlahTerlambat} terlambat · {dueNotifications.length - jumlahTerlambat} segera jatuh tempo
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {dueNotifications.slice(0, 6).map(({ rental, terlambat, hariTerlambat, denda, selisihHari }) => (
          <div
            key={rental.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              backgroundColor: terlambat ? 'var(--bg-red-soft)' : 'var(--bg-amber-soft)',
              borderRadius: '8px',
              border: `1px solid ${terlambat ? 'var(--border-red-soft)' : 'var(--border-amber-soft)'}`,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {rental.equipment_name || `Unit #${rental.equipment_id}`}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-secondary)' }}>
                {rental.rental_code} · {rental.customer_name}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
              Jatuh tempo: <strong>{formatTanggal(rental.end_date)}</strong>
            </div>

            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '6px',
                backgroundColor: terlambat ? 'var(--fg-danger)' : '#F59E0B',
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
              }}
            >
              {terlambat ? `TERLAMBAT ${hariTerlambat} HARI` : `${selisihHari} HARI LAGI`}
            </span>

            {terlambat && (
              <span
                className="serial-code"
                style={{ fontSize: '12px', fontWeight: 800, color: 'var(--fg-danger-deep)', whiteSpace: 'nowrap' }}
              >
                Denda {formatRupiah(denda)}
              </span>
            )}

            <button
              type="button"
              onClick={onTindakLanjut}
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '11.5px' }}
            >
              Tindak Lanjut
            </button>
          </div>
        ))}
      </div>

      {jumlahTerlambat > 0 && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--fg-danger-deep)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>Total estimasi denda keterlambatan (tarif {formatRupiah(getLatePenaltyPerDay())}/hari)</span>
          <span className="serial-code" title={formatRupiah(totalDenda)}>{formatRupiahRingkas(totalDenda).ringkas}</span>
        </div>
      )}
    </div>
  );
};
