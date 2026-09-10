import React, { useState, useMemo, useCallback } from 'react';
import { GpsTracking } from '../../types';
import { LeafletMap } from '../../components/LeafletMap';
import {
  MapPin,
  Navigation,
  Fuel,
  Power,
  Radio,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import {
  DEFAULT_FLEET_FILTER,
  buildFleetTelemetry,
  formatCoordinate,
  formatSpeed,
  getFuelLabel,
  getMovementLabel,
  SEARCH_MAX_LENGTH,
} from '../../lib/fleetTelemetry';
import type {
  FleetTelemetryFilter,
  FleetTelemetryRow,
  FleetTelemetrySummary,
} from '../../lib/fleetTelemetry';

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
 * Kartu ringkasan agregat di kepala halaman.
 * Dipisah menjadi komponen kecil agar badan halaman tetap mudah dibaca.
 */
function SummaryCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  icon: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    primary: 'var(--color-primary)',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    neutral: 'var(--color-secondary)',
  };
  const warna = colors[tone ?? 'neutral'];

  return (
    <div
      style={{
        padding: '12px 14px',
        backgroundColor: '#F8FAFC',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-secondary-light)', fontWeight: 600 }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ fontSize: '19px', fontWeight: 800, color: warna, lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  );
}

/** Badge status mesin mengikuti design system (hijau=ON, abu=OFF). */
function EngineBadge({ status }: { status: 'ON' | 'OFF' }) {
  return (
    <span className={`badge badge-${status === 'ON' ? 'active' : 'suspended'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
      MESIN {status}
    </span>
  );
}

/** Badge kelas bahan bakar — merah kritis, kuning rendah, hijau aman. */
function FuelBadge({ kelas }: { kelas: FleetTelemetryRow['fuel'] }) {
  const gaya: Record<FleetTelemetryRow['fuel'], { latar: string; teks: string }> = {
    KRITIS: { latar: '#FEF2F2', teks: '#991B1B' },
    RENDAH: { latar: '#FFFBEB', teks: '#92400E' },
    NORMAL: { latar: '#ECFDF5', teks: '#065F46' },
  };
  const s = gaya[kelas];
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: s.latar,
        color: s.teks,
      }}
    >
      {getFuelLabel(kelas)}
    </span>
  );
}

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

  /**
   * Tampilan telemetri dihitung dari SATU modul murni
   * (`src/lib/fleetTelemetry.ts`) — mesin yang sama dipakai edge API
   * `GET /api/tracking`. Karena itu apa yang tampil di layar tidak pernah
   * berbeda dengan keputusan server.
   */
  const view = useMemo(
    () => buildFleetTelemetry(trackingData, { role: 'ADMIN', equipmentIds: null }, filter),
    [trackingData, filter]
  );

  const { rows, summary } = view;

  // Unit yang dipilih mengikuti baris yang tersisa setelah penyaringan.
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const selectedUnit = rows.find(r => r.equipmentId === selectedUnitId) ?? rows[0];

  const ubahFilter = useCallback(
    (perubahan: Partial<FleetTelemetryFilter>) => setFilter((lama) => ({ ...lama, ...perubahan })),
    []
  );

  const resetFilter = useCallback(() => {
    setFilter(DEFAULT_FLEET_FILTER);
    setSelectedUnitId(null);
  }, []);

  const tidakAdaData = trackingData.length === 0;
  const hasilKosong = !tidakAdaData && rows.length === 0;

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
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#065F46'
        }}>
          <Radio size={14} className="animate-pulse" />
          <span>Sinyal GPS Satelit Aktif</span>
        </div>
      </div>

      {/* Ringkasan Agregat */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-eight)',
        border: '1px solid var(--color-border)',
      }}>
        <SummaryCard
          label="Unit Terlacak"
          value={`${summary.totalUnits} Unit`}
          tone="primary"
          icon={<MapPin size={12} color="var(--color-primary)" />}
        />
        <SummaryCard
          label="Mesin Menyala"
          value={`${summary.engineOnCount} / ${summary.totalUnits}`}
          tone="success"
          icon={<Power size={12} color="#059669" />}
        />
        <SummaryCard
          label="Sedang Bergerak"
          value={`${summary.movingCount} Unit`}
          tone="primary"
          icon={<Navigation size={12} color="var(--color-primary)" />}
        />
        <SummaryCard
          label="Rata-rata Kecepatan"
          value={formatSpeed(summary.averageSpeed)}
          tone="neutral"
          icon={<Gauge size={12} color="var(--color-secondary)" />}
        />
        <SummaryCard
          label="Rata-rata BBM"
          value={`${String(summary.averageFuel).replace('.', ',')}%`}
          tone={summary.averageFuel < 25 ? 'warning' : 'success'}
          icon={<Fuel size={12} color="#F59E0B" />}
        />
        <SummaryCard
          label="BBM Kritis / Rendah"
          value={`${summary.criticalFuelCount} / ${summary.lowFuelCount}`}
          tone={summary.criticalFuelCount > 0 ? 'danger' : 'neutral'}
          icon={<AlertTriangle size={12} color={summary.criticalFuelCount > 0 ? '#DC2626' : 'var(--color-secondary)'} />}
        />
        <SummaryCard
          label="Titik Usang (>6 jam)"
          value={`${summary.staleCount} Unit`}
          tone={summary.staleCount > 0 ? 'warning' : 'neutral'}
          icon={<Clock size={12} color="#D97706" />}
        />
      </div>

      {/* Panel Penyaringan */}
      <div className="card-premium" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>
          <Filter size={13} />
          <span>Penyaringan Telemetri</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label htmlFor="filter-engine" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Status Mesin
            </label>
            <select
              id="filter-engine"
              className="input-premium"
              value={filter.engine}
              onChange={(e) => ubahFilter({ engine: e.target.value as FleetTelemetryFilter['engine'] })}
              aria-label="Saring berdasarkan status mesin"
            >
              <option value="ALL">Semua Status Mesin</option>
              <option value="ON">Mesin Menyala (ON)</option>
              <option value="OFF">Mesin Mati (OFF)</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-movement" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Pergerakan Unit
            </label>
            <select
              id="filter-movement"
              className="input-premium"
              value={filter.movement}
              onChange={(e) => ubahFilter({ movement: e.target.value as FleetTelemetryFilter['movement'] })}
              aria-label="Saring berdasarkan pergerakan unit"
            >
              <option value="ALL">Semua Pergerakan</option>
              <option value="BERGERAK">Sedang Bergerak</option>
              <option value="DIAM">Tidak Bergerak</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-fuel" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Level Bahan Bakar
            </label>
            <select
              id="filter-fuel"
              className="input-premium"
              value={filter.fuel}
              onChange={(e) => ubahFilter({ fuel: e.target.value as FleetTelemetryFilter['fuel'] })}
              aria-label="Saring berdasarkan level bahan bakar"
            >
              <option value="ALL">Semua Level BBM</option>
              <option value="KRITIS">BBM Kritis (&lt; 15%)</option>
              <option value="RENDAH">BBM Rendah (15–24%)</option>
              <option value="NORMAL">BBM Aman (≥ 25%)</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-search" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Cari Unit
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }}
              />
              <input
                id="filter-search"
                type="search"
                className="input-premium"
                style={{ paddingLeft: '32px' }}
                value={filter.search}
                maxLength={SEARCH_MAX_LENGTH}
                onChange={(e) => ubahFilter({ search: e.target.value })}
                placeholder="Kode unit, nama, atau ID"
                aria-label="Cari unit berdasarkan kode, nama, atau ID"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--color-secondary)' }}>
          <span>
            Menampilkan <strong>{rows.length}</strong> unit dari{' '}
            <strong>{view.rawPointCount}</strong> titik rekam telemetri.
          </span>
          <button type="button" onClick={resetFilter} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} aria-label="Reset semua penyaringan telemetri">
            <RefreshCw size={13} />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Telemetry Sidebar & Leaflet Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
        {/* Unit Telemetry List & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Unit Telemetry Card */}
          {selectedUnit && (
            <div className="card-premium" style={{ padding: '20px', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                <span className="serial-code" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {selectedUnit.equipmentCode}
                </span>
                <EngineBadge status={selectedUnit.engineStatus} />
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: '0 0 12px 0' }}>
                {selectedUnit.equipmentName}
              </h3>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <FuelBadge kelas={selectedUnit.fuel} />
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: selectedUnit.movement === 'BERGERAK' ? '#EFF6FF' : '#F1F5F9',
                    color: selectedUnit.movement === 'BERGERAK' ? 'var(--color-primary)' : 'var(--color-secondary)',
                  }}
                >
                  {getMovementLabel(selectedUnit.movement)}
                </span>
                {/* Titik yang sudah usang ditandai agar operator tidak
                    mengira posisinya masih aktual. */}
                {selectedUnit.isStale && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#FFFBEB',
                      color: '#92400E',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <AlertTriangle size={10} />
                    Titik Usang
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-secondary-light)', marginBottom: '4px' }}>
                    <Navigation size={12} color="var(--color-primary)" />
                    <span>Kecepatan</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {String(selectedUnit.speed).replace('.', ',')} <span style={{ fontSize: '12px', fontWeight: 500 }}>km/h</span>
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-secondary-light)', marginBottom: '4px' }}>
                    <Fuel size={12} color="#F59E0B" />
                    <span>Level Solar</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#F59E0B' }}>
                    {selectedUnit.fuelLevelPercent}%
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--color-border)' }}>
                  <span>Latitude:</span>
                  <span className="gps-coordinates" style={{ fontWeight: 600 }}>{formatCoordinate(selectedUnit.latitude)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--color-border)' }}>
                  <span>Longitude:</span>
                  <span className="gps-coordinates" style={{ fontWeight: 600 }}>{formatCoordinate(selectedUnit.longitude)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Pembaruan Terakhir:</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>{selectedUnit.recordedAt}</span>
                </div>
              </div>
            </div>
          )}

          {/* Unit List Selection */}
          <div className="card-premium" style={{ padding: '16px', maxHeight: '380px', overflowY: 'auto' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>
              Daftar Armada Terhubung ({rows.length} Unit)
            </div>

            {/* Empty state: tidak ada titik sama sekali */}
            {tidakAdaData && (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--color-secondary)', fontSize: '12.5px' }}>
                Belum ada data telemetri GPS yang diterima dari perangkat armada.
              </div>
            )}

            {/* Empty state: ada data, tetapi tersaring habis */}
            {hasilKosong && (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--color-secondary)', fontSize: '12.5px' }}>
                Tidak ada unit yang cocok dengan penyaringan ini. Ubah filter atau tekan <strong>Reset Filter</strong>.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rows.map((item) => {
                const isSelected = selectedUnit?.equipmentId === item.equipmentId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedUnitId(item.equipmentId)}
                    aria-label={`Pilih unit ${item.equipmentCode} ${item.equipmentName}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'var(--transition-base)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--color-primary)' : '#1E293B' }}>
                        {item.equipmentName}
                      </div>
                      <div className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>
                        {item.equipmentCode}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                      <EngineBadge status={item.engineStatus} />
                      <span style={{ fontSize: '10px', color: 'var(--color-secondary-light)' }}>
                        {formatSpeed(item.speed)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interactive Leaflet Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card-premium" style={{ padding: '12px' }}>
            <LeafletMap
              trackingData={rows}
              selectedUnitId={selectedUnit?.equipmentId ?? null}
              onSelectUnit={(id) => setSelectedUnitId(id)}
            />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '10px 16px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-eight)',
            border: '1px solid var(--color-border)',
            fontSize: '12px',
            color: 'var(--color-secondary)'
          }}>
            <span>Klik marker pin pada peta untuk melihat data telemetri rinci unit.</span>
            <span>Wilayah Operasional: <strong>Kalsel (Banjarmasin - Banjarbaru - Batola - Tanah Bumbu - Tabalong)</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
