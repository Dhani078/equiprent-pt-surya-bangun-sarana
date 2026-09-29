import React, { useState, useMemo, useCallback } from 'react';
import { GpsTracking } from '../../types';
import { Radio } from 'lucide-react';
import {
  DEFAULT_FLEET_FILTER,
  buildFleetTelemetry,
} from '../../lib/fleetTelemetry';
import type { FleetTelemetryFilter } from '../../lib/fleetTelemetry';
import {
  DEFAULT_SITE_ZONES,
  detectGeofenceBreaches,
  summarizeGeofence,
} from '../../lib/geofencing';
import type { SiteZone } from '../../lib/geofencing';
import { GeofenceAlertBanner } from './gps/GeofenceAlertBanner';
import { TelemetryFilterPanel } from './gps/TelemetryFilterPanel';
import { FleetSummaryGrid } from './gps/FleetSummaryGrid';
import { UnitTelemetryPanel } from './gps/UnitTelemetryPanel';
import { FleetMapPanel } from './gps/FleetMapPanel';

/**
 * Zona site yang dipakai halaman ini.
 *
 * ponytail: masih konstanta modul. Migrasi ke tabel `site_zones` &
 * UI manajemen zona bila pengelolaan radius per site menjadi kebutuhan
 * harian; mesin `geofencing.ts` menerima zona apa pun sebagai parameter.
 */
const SITE_ZONES: readonly SiteZone[] = DEFAULT_SITE_ZONES;

interface GpsTrackingPageProps {
  trackingData: GpsTracking[];
  /** Judul halaman — berbeda antara pelacakan internal & portal pelanggan. */
  title?: string;
  /** Kalimat penjelas di bawah judul. */
  subtitle?: string;
  /**
   * Filter awal. Opsional — bila tidak diisi, halaman memakai
   * DEFAULT_FLEET_FILTER dan mengelola filternya sendiri lewat useState.
   *
   * Disiapkan agar pengujian (dan pemakaian ulang di portal pelanggan yang
   * ingin membuka halaman langsung dalam keadaan tersaring) dapat menempatkan
   * halaman pada kondisi tertentu tanpa bergantung pada urutan komponen.
   */
  initialFilter?: Partial<FleetTelemetryFilter>;
}

/**
 * Halaman pelacakan GPS.
 *
 * Mesin tampilan (`fleetTelemetry.ts`) sama dengan edge API `GET /api/tracking`
 * — layar tidak pernah berbeda dari keputusan server. Render dipecah ke
 * gps/{FleetSummaryGrid, UnitTelemetryPanel, FleetMapPanel}; Leaflet lazy
 * hidup di FleetMapPanel.
 */
export const GpsTrackingPage: React.FC<GpsTrackingPageProps> = ({
  trackingData,
  title = 'Pelacakan Telemetri GPS Alat Berat (Real-time)',
  subtitle = 'Pemantauan koordinat satelit langsung, status mesin, kecepatan gerak, dan bahan bakar armada di Kalimantan Selatan.',
  initialFilter,
}) => {
  const [filter, setFilter] = useState<FleetTelemetryFilter>(() => ({
    ...DEFAULT_FLEET_FILTER,
    ...(initialFilter ?? {}),
  }));

  const view = useMemo(
    () => buildFleetTelemetry(trackingData, { role: 'ADMIN', equipmentIds: null }, filter),
    [trackingData, filter]
  );

  const { rows, summary } = view;

  // Unit yang dipilih mengikuti baris yang tersisa setelah penyaringan.
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const selectedUnit = rows.find(r => r.equipmentId === selectedUnitId) ?? rows[0];
  const [showHeatmap, setShowHeatmap] = useState(false);

  /**
   * Pelanggaran geofencing (T-0060) dihitung dari baris telemetri + zona
   * site sehingga banner selalu sinkron dengan data tampil — unit yang
   * tersaring hidup tidak pernah memunculkan false positive.
   */
  const alertZona = useMemo(
    () => detectGeofenceBreaches(rows, SITE_ZONES),
    [rows]
  );
  const ringkasanZona = useMemo(
    () => summarizeGeofence(alertZona, SITE_ZONES),
    [alertZona]
  );
  const breachIds = useMemo(
    () => new Set(alertZona.map((b) => b.equipmentId)),
    [alertZona]
  );

  const ubahFilter = useCallback(
    (perubahan: Partial<FleetTelemetryFilter>) => setFilter((lama) => ({ ...lama, ...perubahan })),
    []
  );

  const resetFilter = useCallback(() => {
    setFilter(DEFAULT_FLEET_FILTER);
    setSelectedUnitId(null);
  }, []);

  const tidakAdaData = trackingData.length === 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            {title}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-light)', margin: '4px 0 0 0', maxWidth: '720px' }}>
            {subtitle}
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: 'var(--bg-green-soft)',
          border: '1px solid #A7F3D0',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--fg-success-deeper)'
        }}>
          <Radio size={14} className="animate-pulse" />
          <span>Sinyal GPS Satelit Aktif</span>
        </div>
      </div>

      <FleetSummaryGrid summary={summary} geofence={ringkasanZona} />

      {/* Banner alert geofencing (T-0060). */}
      <GeofenceAlertBanner breaches={alertZona} summary={ringkasanZona} />

      <TelemetryFilterPanel
        filter={filter}
        onChange={ubahFilter}
        onReset={resetFilter}
        rowCount={rows.length}
        rawPointCount={view.rawPointCount}
      />

      {/* Main Grid: Telemetry Sidebar & Leaflet Map */}
      <div className="gps-layout" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
        <UnitTelemetryPanel
          rows={rows}
          selectedUnit={selectedUnit}
          breachIds={breachIds}
          onSelectUnit={setSelectedUnitId}
          noData={tidakAdaData}
        />
        <FleetMapPanel
          rows={rows}
          selectedUnitId={selectedUnit?.equipmentId ?? null}
          onSelectUnit={setSelectedUnitId}
          heatmapData={trackingData}
          showHeatmap={showHeatmap}
          onToggleHeatmap={() => setShowHeatmap((v) => !v)}
          siteZones={SITE_ZONES}
          geofence={ringkasanZona}
        />
      </div>
    </div>
  );
};
