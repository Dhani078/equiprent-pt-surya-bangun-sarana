/**
 * Banner pelanggaran geofencing (T-0060).
 *
 * Murni tampilan: daftar pelanggaran + ringkasan dihitung induk lewat
 * `detectGeofenceBreaches`/`summarizeGeofence`; komponen ini hanya
 * merendernya (maks 5 baris + hitungan sisanya).
 */
import { AlertTriangle } from 'lucide-react';
import { formatJarakZona } from '../../../lib/geofencing';
import type { GeofenceBreach, GeofenceSummary } from '../../../lib/geofencing';

interface Props {
  breaches: readonly GeofenceBreach[];
  summary: GeofenceSummary;
}

export const GeofenceAlertBanner: React.FC<Props> = ({ breaches: alertZona, summary: ringkasanZona }) => {
  if (alertZona.length === 0) return null;
  return (
  <div
    role="alert"
    aria-label={`${alertZona.length} unit terdeteksi di luar zona site`}
    className="card-premium animate-fade-in"
    style={{
      padding: '14px 16px',
      borderLeft: '4px solid var(--fg-danger)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
      <AlertTriangle size={16} color="var(--fg-danger)" />
      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--fg-danger-deep)', flex: '1 1 260px' }}>
        {alertZona.length} unit terdeteksi di luar zona site operasional
      </span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--fg-danger-deep)',
          backgroundColor: 'var(--bg-red-soft)',
          padding: '4px 10px',
          borderRadius: '999px',
          border: '1px solid var(--border-red-soft)',
        }}
      >
        Pelanggaran terjauh: {formatJarakZona(ringkasanZona.jarakTerjauhMeter)}
      </span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {alertZona.slice(0, 5).map((b) => (
        <div
          key={b.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: 'var(--banner-danger-fg)',
            flexWrap: 'wrap',
          }}
        >
          <span className="serial-code" style={{ fontWeight: 700, color: 'var(--fg-danger-deep)' }}>
            {b.equipmentCode}
          </span>
          <span style={{ fontWeight: 600, flex: '1 1 180px' }}>{b.equipmentName}</span>
          <span>Zona terdekat: <strong>{b.zonaTerdekat}</strong></span>
          <span style={{ fontWeight: 800 }}>
            {formatJarakZona(b.jarakMeter)} di luar batas
          </span>
        </div>
      ))}
    </div>
    {alertZona.length > 5 && (
      <div style={{ fontSize: '11px', color: 'var(--fg-danger-deep)', fontWeight: 600 }}>
        + {alertZona.length - 5} unit lainnya juga di luar zona.
      </div>
    )}
  </div>
  );
};
