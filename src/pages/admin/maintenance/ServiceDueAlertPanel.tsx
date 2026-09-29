import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Equipment, Maintenance } from '../../../types';
import type { ServiceStatus } from '../../../lib/businessRules';
import { SERVICE_INTERVAL_HM, predictNextServiceDate } from '../../../lib/businessRules';

interface ServiceDueAlertPanelProps {
  alerts: Array<{ equipment: Equipment; status: ServiceStatus }>;
  overdueCount: number;
  /** Log servis selesai per unit — untuk prediksi tanggal (regresi linear HM). */
  maintenance: Maintenance[];
  onSchedule: (equipment: Equipment, currentHM: number) => void;
  onHistory: (equipmentId: number) => void;
}

/** Panel peringatan servis preventif berbasis interval 250 HM (maks 5 baris). */
export const ServiceDueAlertPanel: React.FC<ServiceDueAlertPanelProps> = ({
  alerts, overdueCount, maintenance, onSchedule, onHistory,
}) => {
  if (alerts.length === 0) return null;

  return (
    <div
      className="card-premium animate-fade-in"
      style={{
        padding: '16px 18px',
        borderLeft: `4px solid ${overdueCount > 0 ? 'var(--fg-danger)' : '#F59E0B'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <AlertTriangle size={18} color={overdueCount > 0 ? 'var(--fg-danger)' : '#F59E0B'} />
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          Peringatan Servis Preventif (interval {SERVICE_INTERVAL_HM} HM)
        </h3>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: overdueCount > 0 ? 'var(--bg-rose-soft)' : 'var(--bg-cream-soft)',
            color: overdueCount > 0 ? 'var(--fg-danger-deep)' : 'var(--fg-warning-deep)',
          }}
        >
          {overdueCount} unit jatuh tempo · {alerts.length - overdueCount} unit mendekati
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {alerts.slice(0, 5).map(({ equipment, status }) => (
          <div
            key={equipment.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              backgroundColor: 'var(--bg-raised)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {equipment.name}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-secondary)' }}>
                {equipment.equipment_code}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
              HM saat ini: <strong>{status.currentHM.toFixed(2)}</strong>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
              Servis berikutnya: <strong>{status.nextServiceTargetHM.toFixed(2)} HM</strong>
            </div>

            {/* Prediksi tanggal berbasis regresi linear tren HM */}
            {(() => {
              const selesai = maintenance.filter(
                (m) => m.equipment_id === equipment.id && m.status === 'COMPLETED'
              );
              const tgl = predictNextServiceDate(status.currentHM, status.nextServiceTargetHM, selesai);
              return tgl ? (
                <div style={{ fontSize: '11.5px', color: 'var(--fg-teal)', fontWeight: 600 }}>
                  ≈ {tgl.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              ) : null; /* data servis < 2 titik — jangan tampilkan placeholder kosong */
            })()}

            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '6px',
                backgroundColor: status.isDue ? 'var(--fg-danger)' : '#F59E0B',
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
              }}
            >
              {status.isDue
                ? `LEWAT ${Math.abs(Math.round(status.hmUntilNextService))} HM`
                : `SISA ${Math.round(status.hmUntilNextService)} HM`}
            </span>

            <button
              type="button"
              onClick={() => onSchedule(equipment, status.currentHM)}
              className="btn-primary"
              style={{ padding: '5px 12px', fontSize: '11.5px' }}
            >
              Jadwalkan
            </button>

            <button
              type="button"
              onClick={() => onHistory(equipment.id)}
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '11.5px' }}
              title={`Lihat riwayat servis ${equipment.equipment_code}`}
            >
              Riwayat
            </button>
          </div>
        ))}
      </div>

      {alerts.length > 5 && (
        <p style={{ fontSize: '11.5px', color: 'var(--color-secondary)', margin: '10px 0 0 0' }}>
          Dan {alerts.length - 5} unit lainnya memerlukan perhatian.
        </p>
      )}
    </div>
  );
};
