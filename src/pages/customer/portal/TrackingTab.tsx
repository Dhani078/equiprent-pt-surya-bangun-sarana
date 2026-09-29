/**
 * Tab "Lacak Unit Saya": peta Leaflet (lazy) + daftar telemetri unit yang
 * sedang/akan disewa pelanggan ini. Pembatasan unit dihitung induk lewat
 * `buildFleetTelemetry` — mesin yang sama dengan `GET /api/tracking`.
 */
import { Suspense, lazy } from 'react';
import { Crosshair } from 'lucide-react';
import { formatCoordinate, formatSpeed, getFuelLabel, getMovementLabel } from '../../../lib/fleetTelemetry';
import type { FleetTelemetryView } from '../../../lib/fleetTelemetry';
import { formatWaktu } from '../../../lib/businessRules';

// Lazy: Leaflet berat (~140KB), hanya dipakai di tab pelacakan — jangan masuk bundle awal
const LeafletMap = lazy(() => import('../../../components/LeafletMap').then((m) => ({ default: m.LeafletMap })));

interface Props {
  /** Nama perusahaan/penyewa untuk kalimat keterangan. */
  namaPenyewa: string;
  view: FleetTelemetryView;
  selectedUnitId: number | null;
  onSelectUnit: (id: number) => void;
}

export const TrackingTab: React.FC<Props> = ({ view, namaPenyewa, selectedUnitId, onSelectUnit }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div className="card-premium" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 4px 0' }}>
        Pelacakan Posisi Unit Sewa Anda
      </h3>
      <p style={{ fontSize: '12.5px', color: 'var(--color-secondary)', margin: 0 }}>
        Hanya unit yang sedang beroperasi atas nama {namaPenyewa} yang ditampilkan.
      </p>
    </div>

    {/* Empty state: pelanggan belum punya unit beroperasi */}
    {view.rows.length === 0 ? (
      <div className="card-premium" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <Crosshair size={40} color="var(--color-border)" style={{ marginBottom: '12px' }} />
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '6px' }}>
          Belum ada unit yang dapat dilacak
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--color-secondary-light)', maxWidth: '420px', margin: '0 auto' }}>
          Posisi unit dapat dipantau setelah pengajuan sewa Anda disetujui dan unit berstatus beroperasi
          (ON_GOING). Ajukan sewa terlebih dahulu melalui menu Katalog Alat.
        </div>
      </div>
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div className="card-premium" style={{ padding: '12px' }}>
          <Suspense fallback={<div style={{ height: '400px', display: 'grid', placeItems: 'center', color: 'var(--color-secondary)', fontSize: '13px' }}>Memuat peta...</div>}>
            <LeafletMap
              trackingData={view.rows}
              selectedUnitId={selectedUnitId}
              onSelectUnit={onSelectUnit}
            />
          </Suspense>
        </div>

        <div className="card-premium" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>
            Unit Beroperasi ({view.rows.length})
          </div>

          {view.rows.map((row) => (
            <div
              key={row.id}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: selectedUnitId === row.equipmentId ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: selectedUnitId === row.equipmentId ? 'var(--bg-blue-soft)' : 'var(--color-surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-strong)' }}>{row.equipmentName}</div>
                  <div className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>
                    {row.equipmentCode}
                  </div>
                </div>
                <span className={`badge badge-${row.engineStatus === 'ON' ? 'active' : 'suspended'}`} style={{ fontSize: '10px' }}>
                  MESIN {row.engineStatus}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', color: 'var(--color-secondary)' }}>
                <div>Kecepatan: <strong>{formatSpeed(row.speed)}</strong></div>
                <div>BBM: <strong>{row.fuelLevelPercent}% ({getFuelLabel(row.fuel)})</strong></div>
                <div>Status: <strong>{getMovementLabel(row.movement)}</strong></div>
                <div>Direkam: <strong>{formatWaktu(row.recordedAt)}</strong></div>
              </div>

              <div className="gps-coordinates" style={{ fontSize: '11px', color: 'var(--color-secondary-light)', marginTop: '8px' }}>
                {formatCoordinate(row.latitude)}, {formatCoordinate(row.longitude)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
