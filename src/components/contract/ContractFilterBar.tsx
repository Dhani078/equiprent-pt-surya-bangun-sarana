import { Search } from 'lucide-react';

interface ContractFilterBarProps {
  keyword: string;
  filterStatus: 'ALL' | 'SIGNED' | 'AWAITING' | 'EXPIRED';
  onKeyword: (v: string) => void;
  onStatus: (v: 'ALL' | 'SIGNED' | 'AWAITING' | 'EXPIRED') => void;
}

/** Bar pencarian + penyaring status tanda tangan kontrak. */
export const ContractFilterBar = ({ keyword, filterStatus, onKeyword, onStatus }: ContractFilterBarProps) => (
  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
    <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
      <Search
        size={15}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-faint)',
        }}
      />
      <input
        type="search"
        className="input-premium"
        value={keyword}
        onChange={(e) => onKeyword(e.target.value)}
        placeholder="Cari kode kontrak, pelanggan, atau unit..."
        aria-label="Cari kontrak"
        style={{ paddingLeft: '32px', width: '100%' }}
      />
    </div>

    <select
      className="input-premium"
      value={filterStatus}
      onChange={(e) => onStatus(e.target.value as 'ALL' | 'SIGNED' | 'AWAITING')}
      aria-label="Saring status tanda tangan"
      style={{ width: 'auto', minWidth: '190px' }}
    >
      <option value="ALL">Semua Status</option>
      <option value="AWAITING">Menunggu Tanda Tangan</option>
      <option value="EXPIRED">Kedaluwarsa</option>
      <option value="SIGNED">Telah Ditandatangani</option>
    </select>
  </div>
);
