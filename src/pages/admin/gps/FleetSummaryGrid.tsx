import React from 'react';
import { AlertTriangle, Clock, Fuel, Gauge, MapPin, Navigation, Power, ShieldAlert } from 'lucide-react';
import type { FleetTelemetryRow, FleetTelemetrySummary } from '../../../lib/fleetTelemetry';
import { formatSpeed, getFuelLabel } from '../../../lib/fleetTelemetry';
import type { GeofenceSummary } from '../../../lib/geofencing';

/** Badge status mesin mengikuti design system (hijau=ON, abu=OFF). */
export function EngineBadge({ status }: { status: 'ON' | 'OFF' }) {
  return (
    <span className={`badge badge-${status === 'ON' ? 'active' : 'suspended'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
      MESIN {status}
    </span>
  );
}

/** Badge kelas bahan bakar — merah kritis, kuning rendah, hijau aman. */
export function FuelBadge({ kelas }: { kelas: FleetTelemetryRow['fuel'] }) {
  const gaya: Record<FleetTelemetryRow['fuel'], { latar: string; teks: string }> = {
    KRITIS: { latar: 'var(--bg-red-soft)', teks: 'var(--fg-danger-deep)' },
    RENDAH: { latar: 'var(--bg-amber-soft)', teks: 'var(--fg-warning-deep)' },
    NORMAL: { latar: 'var(--bg-green-soft)', teks: 'var(--fg-success-deeper)' },
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

/** Kartu ringkasan agregat kecil (label + angka bernada warna). */
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
    success: 'var(--fg-success-deep)',
    warning: 'var(--fg-amber)',
    danger: 'var(--fg-danger)',
    neutral: 'var(--color-secondary)',
  };
  const warna = colors[tone ?? 'neutral'];

  return (
    <div
      style={{
        padding: '12px 14px',
        backgroundColor: 'var(--bg-raised)',
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

interface FleetSummaryGridProps {
  summary: FleetTelemetrySummary;
  geofence: GeofenceSummary;
}

/** Grid 8 kartu agregat armada di kepala halaman GPS. */
export const FleetSummaryGrid: React.FC<FleetSummaryGridProps> = ({ summary, geofence }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'var(--color-surface)',
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
      icon={<Power size={12} color="var(--fg-success-deep)" />}
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
      icon={<AlertTriangle size={12} color={summary.criticalFuelCount > 0 ? 'var(--fg-danger)' : 'var(--color-secondary)'} />}
    />
    <SummaryCard
      label="Titik Data Lama (>6 jam)"
      value={`${summary.staleCount} Unit`}
      tone={summary.staleCount > 0 ? 'warning' : 'neutral'}
      icon={<Clock size={12} color="var(--fg-amber)" />}
    />
    <SummaryCard
      label="Keluar Zona Site"
      value={`${geofence.jumlahBreach} Unit`}
      tone={geofence.jumlahBreach > 0 ? 'danger' : 'success'}
      icon={<ShieldAlert size={12} color={geofence.jumlahBreach > 0 ? 'var(--fg-danger)' : 'var(--fg-success-deep)'} />}
    />
  </div>
);
