/**
 * Banner peringatan servis preventif (aturan 250 HM) untuk dashboard admin.
 *
 * Dipisah dari `AdminDashboard.tsx`; hanya tampil bila ada unit telat/mendekat.
 */
import { AlertTriangle } from 'lucide-react';
import type { AdminDashboardStats } from '../../../types';

interface Props {
  stats: AdminDashboardStats;
  onNavigate: (tab: string) => void;
}

/**
 * Merangkai daftar kode unit menjadi kalimat lengkap tanpa potongan "+N lainnya".
 * Daftar lengkap dipakai supaya narasi banner selalu cocok dengan jumlah unit
 * yang dinyatakan (lihat audit D3: banner bilang 5 tapi cuma 2 kode tampil).
 */
function gabungKode(kode: readonly string[]): string {
  if (kode.length === 0) return '-';
  if (kode.length === 1) return kode[0];
  return `${kode.slice(0, -1).join(', ')} dan ${kode[kode.length - 1]}`;
}

export const ServiceAlertBanner: React.FC<Props> = ({ stats, onNavigate }) => {
  if (stats.serviceDueCount <= 0 && stats.serviceApproachingCount <= 0) return null;
  return (
    <div
      className="animate-fade-in"
      role="alert"
      style={{
        padding: '14px 18px',
        borderRadius: '14px',
        border: '1px solid var(--banner-danger-border)',
        background: 'var(--banner-danger-bg)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <AlertTriangle size={20} color="var(--banner-danger-icon)" />
      <div style={{ flex: 1, minWidth: '240px' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--banner-danger-fg)' }}>
          {stats.serviceDueCount + stats.serviceApproachingCount} unit perlu perhatian
          {stats.serviceDueCount > 0 ? `: ${stats.serviceDueCount} telat jadwal servis` : ''}
          {stats.serviceApproachingCount > 0 ? `, ${stats.serviceApproachingCount} mendekati 250 HM` : ''}
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--banner-danger-fg)' }}>
          {stats.serviceDueCount > 0
            ? `Telat: ${gabungKode(stats.serviceDueCodes)}`
            : 'Belum ada unit yang melewati jadwal — jadwalkan inspeksi sebelum jatuh tempo.'}
          {stats.serviceDueCount > 0 && stats.serviceApproachingCount > 0
            ? `  •  Mendekati: ${gabungKode(stats.serviceApproachingCodes)}`
            : ''}
        </p>
      </div>
      <button
        onClick={() => onNavigate('maintenance')}
        className="btn-primary"
        style={{ fontSize: '12px', padding: '8px 14px', flexShrink: 0 }}
      >
        Jadwalkan Servis
      </button>
    </div>
  );
};
