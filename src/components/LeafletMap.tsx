import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { FleetTelemetryRow } from '../lib/fleetTelemetry';
import { formatCoordinate, formatSpeed, getMovementLabel } from '../lib/fleetTelemetry';

/**
 * Mengamankan teks sebelum disisipkan ke dalam HTML popup Leaflet.
 *
 * Popup diisi lewat `bindPopup(string)`, yang oleh Leaflet diterjemahkan
 * menjadi innerHTML — jadi nilai dari basis data (nama unit, kode unit)
 * WAJIB di-escape. Tanpa ini, satu baris data yang mengandung `<img
 * onerror=...>` akan dieksekusi di peramban operator (XSS).
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Peta pemantauan armada.
 *
 * Menerima baris telemetri YANG SUDAH DINORMALKAN (`FleetTelemetryRow`)
 * dari modul `fleetTelemetry`, bukan deret waktu mentah. Karena itu peta
 * otomatis menampilkan satu marker per unit (bukan banyak marker bertumpuk
 * untuk unit yang sama) dan mewarisi penyaringan & pembatasan akses yang
 * sama dengan panel di sebelahnya.
 */
interface LeafletMapProps {
  trackingData: FleetTelemetryRow[];
  selectedUnitId?: number | null;
  onSelectUnit?: (unitId: number) => void;
  /** Titik mentah untuk overlay heatmap kepadatan — semua raw GPS points. */
  heatmapData?: { latitude: number; longitude: number }[];
  /** Tampilkan overlay heatmap kepadatan atau tidak. */
  showHeatmap?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  trackingData,
  selectedUnitId,
  onSelectUnit,
  heatmapData = [],
  showHeatmap = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: number]: L.Marker }>({});
  const heatLayerRef = useRef<L.LayerGroup | null>(null);

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

  // Heatmap overlay — CircleMarker bertumpuk, opacity rendah, no library baru
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Bersihkan layer lama
    if (heatLayerRef.current) {
      heatLayerRef.current.remove();
      heatLayerRef.current = null;
    }

    if (!showHeatmap || heatmapData.length === 0) return;

    const group = L.layerGroup();

    // Hitung kepadatan sederhana: grid 0.01° (~1 km) → warna makin merah
    const cellCount = new Map<string, number>();
    for (const pt of heatmapData) {
      const key = `${(pt.latitude / 0.01).toFixed(0)}_${(pt.longitude / 0.01).toFixed(0)}`;
      cellCount.set(key, (cellCount.get(key) ?? 0) + 1);
    }
    const maxCount = Math.max(...cellCount.values(), 1);

    for (const pt of heatmapData) {
      const key = `${(pt.latitude / 0.01).toFixed(0)}_${(pt.longitude / 0.01).toFixed(0)}`;
      const density = (cellCount.get(key) ?? 1) / maxCount; // 0–1
      // Interpolasi hijau→kuning→merah
      const r = Math.round(density * 220);
      const g = Math.round((1 - density) * 180);
      const color = `rgb(${r},${g},40)`;
      L.circleMarker([pt.latitude, pt.longitude], {
        radius: 14,
        color: 'transparent',
        fillColor: color,
        fillOpacity: 0.18 + density * 0.22, // 0.18–0.40
        interactive: false,
      }).addTo(group);
    }

    group.addTo(map);
    heatLayerRef.current = group;
  }, [heatmapData, showHeatmap]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    trackingData.forEach((item) => {
      const isSelected = selectedUnitId === item.equipmentId;
      const isEngineOn = item.engineStatus === 'ON';

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
            ${escapeHtml(String(item.equipmentId))}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([item.latitude, item.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: 'Hanken Grotesk', sans-serif; padding: 4px;">
            <div style="font-size: 13px; font-weight: 700; color: #003366; margin-bottom: 4px;">
              ${escapeHtml(item.equipmentName)}
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
              Kode: <strong>${escapeHtml(item.equipmentCode)}</strong>
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
              Mesin: <span style="font-weight: 700; color: ${isEngineOn ? '#10B981' : '#EF4444'}">${escapeHtml(item.engineStatus)}</span>
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
              Kecepatan: <strong>${escapeHtml(formatSpeed(item.speed))}</strong>
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
              Bahan Bakar: <strong>${escapeHtml(String(item.fuelLevelPercent))}%</strong>
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              Status: <strong>${escapeHtml(getMovementLabel(item.movement))}</strong>
            </div>
            <div style="font-family: monospace; font-size: 10px; color: #64748B;">
              ${escapeHtml(formatCoordinate(item.latitude))}, ${escapeHtml(formatCoordinate(item.longitude))}
            </div>
            <div style="font-size: 10px; color: #64748B; margin-top: 3px;">
              Direkam: ${escapeHtml(item.recordedAt)}
            </div>
          </div>
        `);

      marker.on('click', () => {
        if (onSelectUnit) onSelectUnit(item.equipmentId);
      });

      markersRef.current[item.equipmentId] = marker;
    });

    // Pan to selected unit
    if (selectedUnitId !== null && selectedUnitId !== undefined && markersRef.current[selectedUnitId]) {
      const selected = trackingData.find(t => t.equipmentId === selectedUnitId);
      if (selected) {
        map.flyTo([selected.latitude, selected.longitude], 13, { duration: 1.2 });
        markersRef.current[selectedUnitId].openPopup();
      }
    }
  }, [trackingData, selectedUnitId]);

  return <div ref={mapContainerRef} className="map-container" />;
};
