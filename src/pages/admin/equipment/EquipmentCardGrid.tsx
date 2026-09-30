/**
 * Grid kartu unit alat berat (tampilan default T-0048).
 *
 * Dipisah dari `EquipmentManagement.tsx`; murni tampilan — aksi edit dan
 * penjadwalan servis diserahkan ke induk lewat callback.
 */
import { CalendarClock, Edit, Wrench } from 'lucide-react';
import { HmProgressBar } from '../../../components/HmProgressBar';
import { StatusBadge } from '../../../components/StatusBadge';
import { getEquipmentImage, resolveEquipmentThumbnail, getEquipmentCategoryFallback } from '../../../lib/stitchAssets';
import { formatRupiah, formatTanggal, getServiceStatus } from '../../../lib/businessRules';
import type { Equipment, Maintenance } from '../../../types';

interface Props {
  /** Unit pada halaman aktif (sudah difilter & dipaginasi induk). */
  items: Equipment[];
  maintenance: Maintenance[];
  /** Unit yang sedang dijadwalkan servisnya (null = tidak ada). */
  schedulingId: number | null;
  onEdit: (eq: Equipment) => void;
  onQuickSchedule: (eq: Equipment) => void;
}

export const EquipmentCardGrid: React.FC<Props> = ({ items, maintenance, schedulingId, onEdit, onQuickSchedule }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
    }}
  >
    {items.map((eq) => {
      const imgUrl = resolveEquipmentThumbnail(eq.thumbnail_url, eq.equipment_code, eq.type);
      const svc = getServiceStatus(eq, maintenance);
      const needsService = svc.isDue || svc.isApproaching;
      const busy = schedulingId === eq.id;
      return (
        <div
          key={eq.id}
          className="card-premium hover-lift"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '14px',
            cursor: 'default',
            borderColor: svc.isDue ? 'var(--border-red-soft)' : undefined,
          }}
        >
          {/* Header kartu: badge status + ringkasan identitas (T-0048) */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <img
              src={imgUrl}
              alt={eq.name}
              onError={(e) => { const t = e.currentTarget; if (t.dataset.fb) return; t.dataset.fb = '1'; t.src = getEquipmentCategoryFallback(eq.equipment_code, eq.type); }}
              loading="lazy"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '10px',
                objectFit: 'cover',
                backgroundColor: 'var(--color-border)',
                border: '1px solid var(--color-border)',
                flexShrink: 0,
              }}
            />
            <StatusBadge kind="equipment" status={eq.status} fontSize={10} />
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-primary)', lineHeight: 1.3 }}>
              {eq.name}
            </div>
            <div className="serial-code" style={{ fontSize: '11.5px', color: 'var(--color-secondary)', marginTop: '2px' }}>
              {eq.equipment_code}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-secondary)', marginTop: '2px' }}>
              {eq.brand} &bull; {eq.model} &bull; {eq.type}
            </div>
          </div>

          {/* Bar progress HM + tooltip (T-0047) */}
          <HmProgressBar equipment={eq} maintenanceHistory={maintenance} />

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '10px',
              borderTop: '1px dashed var(--color-border)',
              paddingTop: '10px',
            }}
          >
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Tarif / Hari
              </div>
              <div className="serial-code" style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-strong)' }}>
                {formatRupiah(Number(eq.rental_price_per_day))}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--color-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CalendarClock size={11} />
                <span>Servis terakhir: {eq.last_maintenance_date ? formatTanggal(eq.last_maintenance_date) : 'belum ada'}</span>
              </div>
            </div>
          </div>

          {/* Quick action: hanya untuk unit yang butuh servis (T-0048) */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onEdit(eq)}
              className="btn-secondary"
              style={{ flex: 1, padding: '8px 10px', fontSize: '12px', gap: '6px' }}
              title="Ubah Rincian Unit"
            >
              <Edit size={13} />
              <span>Ubah</span>
            </button>
            {needsService && eq.status !== 'MAINTENANCE' && (
              <button
                type="button"
                onClick={() => onQuickSchedule(eq)}
                disabled={busy}
                className="btn-secondary"
                aria-label={`Jadwalkan servis ${eq.equipment_code}`}
                title={svc.isDue ? 'Sudah lewat jadwal servis — jadwalkan sekarang' : 'Mendekati ambang servis — jadwalkan'}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontSize: '12px',
                  gap: '6px',
                  color: svc.isDue ? 'var(--fg-danger)' : 'var(--fg-warning-deep)',
                  borderColor: svc.isDue ? 'var(--border-red-soft)' : 'var(--border-amber-soft)',
                  opacity: busy ? 0.6 : 1,
                  cursor: busy ? 'wait' : 'pointer',
                }}
              >
                <Wrench size={13} />
                <span>{busy ? 'Menjadwalkan...' : 'Jadwalkan Servis'}</span>
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
);
