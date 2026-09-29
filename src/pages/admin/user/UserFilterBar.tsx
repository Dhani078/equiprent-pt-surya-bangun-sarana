import React from 'react';
import { Download, FileSpreadsheet, FileText, Search } from 'lucide-react';
import type { ExportFormat } from '../../../lib/tableExport';

interface UserFilterBarProps {
  searchTerm: string;
  filterRole: string;
  onSearchChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onExport: (format: ExportFormat) => void;
}

/** Bar pencarian, penyaring hak akses, dan ekspor daftar pengguna. */
export const UserFilterBar: React.FC<UserFilterBarProps> = ({
  searchTerm, filterRole, onSearchChange, onRoleChange, onExport,
}) => (
  <div className="card-premium" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ position: 'relative', flex: '1 1 300px' }}>
      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }} />
      <input
        type="text"
        className="input-premium"
        placeholder="Cari nama pengguna, username, email, atau perusahaan..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Cari nama pengguna, username, email, atau perusahaan..."
        style={{ paddingLeft: '36px', height: '40px' }}
      />
    </div>
    <select
      className="input-premium"
      style={{ width: 'auto', height: '40px', padding: '0 12px' }}
      value={filterRole}
      onChange={(e) => onRoleChange(e.target.value)}
      aria-label="Saring hak akses"
    >
      <option value="ALL">Semua Hak Akses</option>
      <option value="ADMIN">ADMIN (Superuser)</option>
      <option value="STAFF">STAFF (Staf Operasional)</option>
      <option value="CUSTOMER">CUSTOMER (Pelanggan Sewa)</option>
    </select>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button type="button" className="btn-secondary" onClick={() => onExport('csv')} title="Unduh CSV" aria-label="Unduh daftar pengguna CSV" style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
        <Download size={15} /> CSV
      </button>
      <button type="button" className="btn-secondary" onClick={() => onExport('excel')} title="Unduh Excel" aria-label="Unduh daftar pengguna Excel" style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
        <FileSpreadsheet size={15} /> Excel
      </button>
      <button type="button" className="btn-secondary" onClick={() => onExport('pdf')} title="Cetak / simpan PDF" aria-label="Cetak daftar pengguna PDF" style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
        <FileText size={15} /> PDF
      </button>
    </div>
  </div>
);
