import React, { Suspense, lazy } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import type { GpsTracking } from '../../../types';
import type { FleetTelemetryRow } from '../../../lib/fleetTelemetry';
import type { SiteZone, GeofenceSummary } from '../../../lib/geofencing';

/**
 * Peta Leaflet dimuat MALAMU (T-0064) — chunk terpisah, hanya diunduh
 * saat panel ini dirender.
 */
const LeafletMap = lazy(() => import('../../../components/LeafletMap').then((m) => ({ default: m.LeafletMap })));

interface FleetMapPanelProps {
  rows: FleetTelemetryRow[];
  selectedUnitId: number | null;
  onSelectUnit: (id: number) => void;
  heatmapData: GpsTracking[];
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  siteZones: readonly SiteZone[];
  geofence: GeofenceSummary;
}

/** Kolom kanan halaman GPS: toggle heatmap + peta Leaflet + kaki legenda. */
export const FleetMapPanel: React.FC<FleetMapPanelProps> = ({
  rows,
  selectedUnitId,
  onSelectUnit,
  heatmapData,
  showHeatmap,
  onToggleHeatmap,
  siteZones,
  geofence,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <div className="card-premium" style={{ padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button
          type="button"
          onClick={onToggleHeatmap}
          className={showHeatmap ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          aria-pressed={showHeatmap}
          aria-label="Toggle overlay heatmap kepadatan armada"
        >
          <Layers size={13} />
          <span>{showHeatmap ? 'Sembunyikan Heatmap' : 'Tampilkan Heatmap'}</span>
        </button>
      </div>
      <Suspense
        fallback={
          <div
            role="status"
            aria-busy="true"
            aria-label="Memuat peta pelacakan armada"
            className="map-container"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12.5px',
              color: 'var(--color-secondary)',
              backgroundColor: 'var(--bg-subtle)',
              gap: '8px',
            }}
          >
            <RefreshCw size={14} className="animate-pulse" />
            <span>Memuat peta armada...</span>
          </div>
        }
      >
        <LeafletMap
          trackingData={rows}
          selectedUnitId={selectedUnitId}
          onSelectUnit={onSelectUnit}
          heatmapData={heatmapData}
          showHeatmap={showHeatmap}
          siteZones={siteZones}
        />
      </Suspense>
    </div>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap',
      padding: '10px 16px',
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-eight)',
      border: '1px solid var(--color-border)',
      fontSize: '12px',
      color: 'var(--color-secondary)'
    }}>
      <span>Klik marker pin pada peta untuk melihat data telemetri rinci unit.</span>
      <span>Wilayah Operasional: <strong>Kalsel (Banjarmasin - Banjarbaru - Batola - Tanah Bumbu - Tabalong)</strong></span>
      <span>Zona site: <strong>{geofence.jumlahZona} zona geofencing aktif</strong></span>
    </div>
  </div>
);
