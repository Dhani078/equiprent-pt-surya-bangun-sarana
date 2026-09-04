import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GpsTracking } from '../types';

interface LeafletMapProps {
  trackingData: GpsTracking[];
  selectedUnitId?: number | null;
  onSelectUnit?: (unitId: number) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ trackingData, selectedUnitId, onSelectUnit }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: number]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Centered around South Kalimantan (Banjarmasin / Banjarbaru / Liang Anggang)
    const map = L.map(mapContainerRef.current, {
      center: [-3.324391, 114.558394],
      zoom: 10,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | PT. Surya Bangun Sarana Telemetry',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    trackingData.forEach((item) => {
      const isSelected = selectedUnitId === item.equipment_id;
      const isEngineOn = item.engine_status === 'ON';

      // Custom Industrial SVG Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background: ${isEngineOn ? '#003366' : '#64748B'};
            color: #FFFFFF;
            width: ${isSelected ? '36px' : '28px'};
            height: ${isSelected ? '36px' : '28px'};
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            transition: all 0.2s ease;
          ">
            ${item.equipment_id}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([Number(item.latitude), Number(item.longitude)], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: 'Hanken Grotesk', sans-serif; padding: 4px;">
            <div style="font-size: 13px; font-weight: 700; color: #003366; margin-bottom: 4px;">
              ${item.equipment_name || `Unit #${item.equipment_id}`}
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
              Kode: <strong>${item.equipment_code || 'EXCA-PC200'}</strong>
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
              Mesin: <span style="font-weight: 700; color: ${isEngineOn ? '#10B981' : '#EF4444'}">${item.engine_status}</span>
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
              Kecepatan: <strong>${item.speed} km/jam</strong>
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              Bahan Bakar: <strong>${item.fuel_level_percent}%</strong>
            </div>
            <div style="font-family: monospace; font-size: 10px; color: #64748B;">
              ${Number(item.latitude).toFixed(6)}, ${Number(item.longitude).toFixed(6)}
            </div>
          </div>
        `);

      marker.on('click', () => {
        if (onSelectUnit) onSelectUnit(item.equipment_id);
      });

      markersRef.current[item.equipment_id] = marker;
    });

    // Pan to selected unit
    if (selectedUnitId && markersRef.current[selectedUnitId]) {
      const selected = trackingData.find(t => t.equipment_id === selectedUnitId);
      if (selected) {
        map.flyTo([Number(selected.latitude), Number(selected.longitude)], 13, { duration: 1.2 });
        markersRef.current[selectedUnitId].openPopup();
      }
    }
  }, [trackingData, selectedUnitId]);

  return <div ref={mapContainerRef} className="map-container" />;
};
