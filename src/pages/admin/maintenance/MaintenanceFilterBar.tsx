import React from 'react';
import { Maintenance } from '../../../types';
import { Search, Download, FileSpreadsheet, FileText } from 'lucide-react';
import type { ExportFormat } from '../../../lib/tableExport';

interface MaintenanceFilterBarProps {
  searchTerm: string;
  filterStatus: string;
  onSearch: (v: string) => void;
  onFilterStatus: (v: string) => void;
  onExport: (format: ExportFormat) => void;
}

const STATUS_SERVIS: Array<[Maintenance['status'] | 'ALL', string]> = [
  ['ALL', 'Semua Status Perawatan'],
  ['SCHEDULED', 'Dijadwalkan'],
  ['IN_PROGRESS', 'Sedang Dikerjakan'],
  ['COMPLETED', 'Selesai'],
];

/** Bar cari + penyaring status + ekspor (CSV/Excel/PDF) jadwal & riwayat servis. */
export const MaintenanceFilterBar: React.FC<MaintenanceFilterBarProps> = ({
  searchTerm, filterStatus, onSearch, onFilterStatus, onExport,
}) => (
  <div className="card-premium" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ position: 'relative', flex: '1 1 300px' }}>
      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }} />
      <input
        type="text"
        className="input-premium"
        placeholder="Cari kode servis, nama alat berat, atau nama mekanik..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        style={{ paddingLeft: '36px', height: '40px' }}
        aria-label="Cari data perawatan"
      />
    </div>

    <select
      className="input-premium"
      style={{ width: 'auto', height: '40px', padding: '0 12px' }}
      value={filterStatus}
      onChange={(e) => onFilterStatus(e.target.value)}
      aria-label="Saring perawatan berdasarkan status"
    >
      {STATUS_SERVIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>

    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button type="button" className="btn-secondary" onClick={() => onExport('csv')} title="Unduh CSV"
        style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
        <Download size={15} /> CSV
      </button>
      <button type="button" className="btn-secondary" onClick={() => onExport('excel')} title="Unduh Excel"
        style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
        <FileSpreadsheet size={15} /> Excel
      </button>
      <button type="button" className="btn-secondary" onClick={() => onExport('pdf')} title="Cetak / simpan PDF"
        style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
        <FileText size={15} /> PDF
      </button>
    </div>
  </div>
);
