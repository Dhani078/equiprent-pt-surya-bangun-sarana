/**
 * Tabel ringkas inventaris unit + paginasi (alternatif tampilan kartu).
 *
 * Dipisah dari `EquipmentManagement.tsx`; aksi edit/hapus diserahkan ke induk.
 */
import { Edit, Gauge, Trash2 } from 'lucide-react';
import { Paginator } from '../../../components/Paginator';
import { StatusBadge } from '../../../components/StatusBadge';
import { getEquipmentImage } from '../../../lib/stitchAssets';
import { formatRupiah, formatRupiahRingkas } from '../../../lib/businessRules';
import type { Equipment } from '../../../types';

interface Props {
  /** Unit pada halaman aktif (sudah difilter & dipaginasi induk). */
  items: Equipment[];
  totalFiltered: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (eq: Equipment) => void;
  onDelete: (eq: Equipment) => void;
}

/** Unit yang tidak boleh dihapus: sedang disewa / dirawat (memutus riwayat). */
const isProtected = (status: Equipment['status']): boolean =>
  status === 'RENTED' || status === 'MAINTENANCE';

export const EquipmentTable: React.FC<Props> = ({
  items,
  totalFiltered,
  page,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
}) => (
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr>
          <th>Kode Alat</th>
          <th>Nama & Visual Unit</th>
          <th>Kategori</th>
          <th>Hour Meter (HM)</th>
          <th style={{ textAlign: 'right' }}>Harga Sewa / Hari</th>
          <th style={{ textAlign: 'center' }}>Status</th>
          <th style={{ textAlign: 'center' }}>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {items.map((eq) => {
          const imgUrl = eq.thumbnail_url || getEquipmentImage(eq.equipment_code, eq.type);
          const protectedUnit = isProtected(eq.status);
          return (
            <tr key={eq.id} className="hover:bg-surface-container-low transition-colors">
              <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                {eq.equipment_code}
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={imgUrl}
                    alt={eq.name}
                    onError={(e) => { const t = e.currentTarget; if (t.dataset.fb) return; t.dataset.fb = '1'; t.src = getEquipmentImage(eq.equipment_code, eq.type); }}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      backgroundColor: 'var(--color-border)',
                      border: '1px solid var(--color-border)',
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-strong)' }}>{eq.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--color-secondary)' }}>
                      {eq.brand} &bull; {eq.model}
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
                {eq.type}
              </td>
              <td className="hour-meter" style={{ fontSize: '13px', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Gauge size={14} color="var(--color-primary)" />
                  <span>{Number(eq.hour_meter).toFixed(2)} jam</span>
                </div>
              </td>
              <td className="serial-code" style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: '13.5px', textAlign: 'right' }} title={formatRupiah(Number(eq.rental_price_per_day))}>
                {formatRupiahRingkas(Number(eq.rental_price_per_day)).ringkas}
              </td>
              <td style={{ textAlign: 'center' }}>
                <StatusBadge kind="equipment" status={eq.status} />
              </td>
              <td style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button
                    onClick={() => onEdit(eq)}
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    title="Ubah Rincian Unit"
                  >
                    <Edit size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onDelete(eq)}
                    disabled={protectedUnit}
                    className="btn-secondary"
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      color: 'var(--fg-danger)',
                      opacity: protectedUnit ? 0.45 : 1,
                      cursor: protectedUnit ? 'not-allowed' : 'pointer',
                    }}
                    title={
                      protectedUnit
                        ? 'Unit sedang disewa — selesaikan transaksinya dulu'
                        : 'Hapus Unit'
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    <Paginator
      total={totalFiltered}
      page={page}
      limit={pageSize}
      onPageChange={onPageChange}
    />
  </div>
);
