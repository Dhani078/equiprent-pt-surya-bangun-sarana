import React from 'react';
import { AlertTriangle, Fuel, Navigation, ShieldAlert } from 'lucide-react';
import type { FleetTelemetryRow } from '../../../lib/fleetTelemetry';
import { formatCoordinate, formatSpeed, getMovementLabel } from '../../../lib/fleetTelemetry';
import { EngineBadge, FuelBadge } from './FleetSummaryGrid';

interface UnitTelemetryPanelProps {
  rows: FleetTelemetryRow[];
  selectedUnit: FleetTelemetryRow | undefined;
  /** Set unit yang berada di luar zona site (T-0060). */
  breachIds: Set<number>;
  onSelectUnit: (id: number) => void;
  /** Tidak ada telemetri sama sekali (vs tersaring habis). */
  noData: boolean;
}

/** Kolom kiri halaman GPS: kartu telemetri unit terpilih + daftar armada terhubung. */
export const UnitTelemetryPanel: React.FC<UnitTelemetryPanelProps> = ({
  rows,
  selectedUnit,
  breachIds,
  onSelectUnit,
  noData,
}) => {
  const hasilKosong = !noData && rows.length === 0;

  return (
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

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-strong)', margin: '0 0 12px 0' }}>
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
                backgroundColor: selectedUnit.movement === 'BERGERAK' ? 'var(--bg-blue-soft)' : 'var(--bg-subtle)',
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
                  backgroundColor: 'var(--bg-amber-soft)',
                  color: 'var(--fg-warning-deep)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <AlertTriangle size={10} />
                Titik Data Lama
              </span>
            )}
            {/* Unit di luar semua zona site (T-0060). */}
            {breachIds.has(selectedUnit.equipmentId) && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-red-soft)',
                  color: 'var(--fg-danger-deep)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <ShieldAlert size={10} />
                Keluar Zona
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-raised)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-secondary-light)', marginBottom: '4px' }}>
                <Navigation size={12} color="var(--color-primary)" />
                <span>Kecepatan</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>
                {String(selectedUnit.speed).replace('.', ',')} <span style={{ fontSize: '12px', fontWeight: 500 }}>km/h</span>
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'var(--bg-raised)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
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
        {noData && (
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
            const diLuarZona = breachIds.has(item.equipmentId);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectUnit(item.equipmentId)}
                aria-label={`Pilih unit ${item.equipmentCode} ${item.equipmentName}${diLuarZona ? ' — di luar zona site' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: diLuarZona
                    ? '2px solid var(--fg-danger)'
                    : isSelected
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                  backgroundColor: diLuarZona
                    ? 'var(--bg-red-soft)'
                    : isSelected
                      ? 'var(--bg-blue-soft)'
                      : 'var(--color-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition-base)'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: diLuarZona ? 'var(--fg-danger-deep)' : isSelected ? 'var(--color-primary)' : 'var(--text-strong)' }}>
                    {item.equipmentName}
                  </div>
                  <div className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>
                    {item.equipmentCode}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                  <EngineBadge status={item.engineStatus} />
                  {diLuarZona ? (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: 'var(--fg-danger-deep)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <ShieldAlert size={10} />
                      Keluar Zona
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', color: 'var(--color-secondary-light)' }}>
                      {formatSpeed(item.speed)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
