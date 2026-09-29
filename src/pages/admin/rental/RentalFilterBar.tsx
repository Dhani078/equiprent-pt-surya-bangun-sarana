import React from 'react';
import { Search, Download, FileSpreadsheet, FileText } from 'lucide-react';
import type { ExportFormat } from '../../../lib/tableExport';

interface RentalFilterBarProps {
  searchTerm: string;
  filterStatus: string;
  onSearch: (v: string) => void;
  onFilterStatus: (v: string) => void;
  onExport: (format: ExportFormat) => void;
}

/** Bar pencarian + penyaring status + tombol ekspor (CSV/Excel/PDF) transaksi sewa. */
export const RentalFilterBar: React.FC<RentalFilterBarProps> = ({
  searchTerm,
  filterStatus,
  onSearch,
  onFilterStatus,
  onExport,
}) => (
  <div className="card-premium" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ position: 'relative', flex: '1 1 300px' }}>
      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }} />
      <input
        type="text"
        className="input-premium"
        placeholder="Cari kode sewa, pelanggan, perusahaan, atau nama alat..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        style={{ paddingLeft: '36px', height: '40px' }}
        aria-label="Cari transaksi penyewaan"
      />
    </div>

    <select
      className="input-premium"
      style={{ width: 'auto', height: '40px', padding: '0 12px' }}
      value={filterStatus}
      onChange={(e) => onFilterStatus(e.target.value)}
      aria-label="Saring transaksi berdasarkan status"
    >
      <option value="ALL">Semua Status Transaksi</option>
      <option value="PENDING">Menunggu Persetujuan</option>
      <option value="APPROVED">Disetujui</option>
      <option value="ON_GOING">Sedang Berjalan</option>
      <option value="COMPLETED">Selesai</option>
      <option value="REJECTED">Ditolak</option>
    </select>

    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onExport('csv')}
        title="Unduh CSV"
        style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
      >
        <Download size={15} /> CSV
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onExport('excel')}
        title="Unduh Excel"
        style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
      >
        <FileSpreadsheet size={15} /> Excel
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onExport('pdf')}
        title="Cetak / simpan PDF"
        style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
      >
        <FileText size={15} /> PDF
      </button>
    </div>
  </div>
);
