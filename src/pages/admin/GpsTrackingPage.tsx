import React, { useState } from 'react';
import { GpsTracking } from '../../types';
import { LeafletMap } from '../../components/LeafletMap';
import { MapPin, Navigation, Fuel, Power, Radio, Clock } from 'lucide-react';

interface GpsTrackingPageProps {
  trackingData: GpsTracking[];
}

export const GpsTrackingPage: React.FC<GpsTrackingPageProps> = ({ trackingData }) => {
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(trackingData[0]?.equipment_id || null);

  const selectedUnit = trackingData.find(t => t.equipment_id === selectedUnitId) || trackingData[0];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            Pelacakan Telemetri GPS Alat Berat (Real-time)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-light)', margin: '4px 0 0 0' }}>
            Pemantauan koordinat satelit langsung, status mesin, kecepatan gerak, dan bahan bakar armada di Kalimantan Selatan.
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

      {/* Main Grid: Telemetry Sidebar & Leaflet Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
        {/* Unit Telemetry List & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Unit Telemetry Card */}
          {selectedUnit && (
            <div className="card-premium" style={{ padding: '20px', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="serial-code" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {selectedUnit.equipment_code}
                </span>
                <span className={`badge badge-${selectedUnit.engine_status === 'ON' ? 'active' : 'suspended'}`} style={{ fontSize: '11px' }}>
                  MESIN {selectedUnit.engine_status}
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: '0 0 16px 0' }}>
                {selectedUnit.equipment_name}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-secondary-light)', marginBottom: '4px' }}>
                    <Navigation size={12} color="var(--color-primary)" />
                    <span>Kecepatan</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {selectedUnit.speed} <span style={{ fontSize: '12px', fontWeight: 500 }}>km/h</span>
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-secondary-light)', marginBottom: '4px' }}>
                    <Fuel size={12} color="#F59E0B" />
                    <span>Level Solar</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#F59E0B' }}>
                    {selectedUnit.fuel_level_percent}%
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--color-border)' }}>
                  <span>Latitude:</span>
                  <span className="gps-coordinates" style={{ fontWeight: 600 }}>{Number(selectedUnit.latitude).toFixed(6)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--color-border)' }}>
                  <span>Longitude:</span>
                  <span className="gps-coordinates" style={{ fontWeight: 600 }}>{Number(selectedUnit.longitude).toFixed(6)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Pembaruan Terakhir:</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>{selectedUnit.recorded_at}</span>
                </div>
              </div>
            </div>
          )}

          {/* Unit List Selection */}
          <div className="card-premium" style={{ padding: '16px', maxHeight: '380px', overflowY: 'auto' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>
              Daftar Armada Terhubung ({trackingData.length} Unit)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {trackingData.map((item) => {
                const isSelected = selectedUnitId === item.equipment_id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedUnitId(item.equipment_id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
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
                        {item.equipment_name}
                      </div>
                      <div className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>
                        {item.equipment_code}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${item.engine_status === 'ON' ? 'active' : 'suspended'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {item.engine_status}
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
              trackingData={trackingData}
              selectedUnitId={selectedUnitId}
              onSelectUnit={(id) => setSelectedUnitId(id)}
            />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
