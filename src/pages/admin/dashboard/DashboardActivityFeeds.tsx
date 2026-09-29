/**
 * Feed aktivitas operasional dashboard admin: transaksi terbaru, antrean servis,
 * dan top 5 unit tersewa.
 *
 * Dipisah dari `AdminDashboard.tsx`; murni tampilan — data agregat lewat props.
 */
import { AlertTriangle, Clock, Trophy } from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import { StatusBadge } from '../../../components/StatusBadge';
import { useTerjemahan } from '../../../lib/i18n';
import { getEquipmentImage } from '../../../lib/stitchAssets';
import { formatRupiah, formatRupiahRingkas, formatTanggal } from '../../../lib/businessRules';
import type { AdminDashboardStats } from '../../../types';

/** Judul status servis dalam bahasa Indonesia formal. */
const LABEL_JENIS_SERVIS: Record<string, string> = {
  PREVENTIVE: 'Servis Preventif',
  CORRECTIVE: 'Perbaikan Korektif',
  OVERHAUL: 'Overhaul',
};

interface Props {
  stats: AdminDashboardStats;
  onNavigate: (tab: string) => void;
}

export const DashboardActivityFeeds: React.FC<Props> = ({ stats, onNavigate }) => {
  const { t } = useTerjemahan();
  return (
    <>
      {/* Two Column Grid: Recent Rentals & Urgent Maintenance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(460px, 100%), 1fr))', gap: '20px' }}>
        {/* Recent Rentals Card */}
        <div className="card-premium" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                {t('dashboard.transaksi_terbaru')}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('rentals')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              {t('dashboard.lihat_semua_transaksi')}
            </button>
          </div>

          {stats.recentRentals.length === 0 ? (
            <EmptyState
              pesan={t('dashboard.kosong_transaksi')}
              keterangan={t('dashboard.kosong_transaksi_sub')}
              ariaLabel={t('dashboard.kosong_transaksi')}
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ padding: '10px 10px' }}>{t('dashboard.kolom_kode')}</th>
                    <th style={{ padding: '10px 8px' }}>{t('dashboard.kolom_klien')}</th>
                    <th style={{ padding: '10px 10px' }}>{t('dashboard.kolom_subtotal')}</th>
                    <th style={{ padding: '10px 8px' }}>{t('dashboard.kolom_status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentRentals.map((r) => (
                    <tr key={r.id}>
                      <td className="serial-code" style={{ fontWeight: 600, fontSize: '11px', color: 'var(--color-primary)', whiteSpace: 'nowrap', padding: '10px 6px' }}>
                        {r.rental_code}
                      </td>
                      <td style={{ minWidth: '0', padding: '10px 6px', maxWidth: '0' }}>
                        <div style={{ fontWeight: 600, fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.company_name || r.customer_name}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--color-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.equipment_name}</div>
                      </td>
                      <td className="serial-code" style={{ fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', padding: '10px 6px' }} title={formatRupiah(r.subtotal)}>
                        {formatRupiahRingkas(r.subtotal).ringkas}
                      </td>
                      <td style={{ padding: '10px 6px', whiteSpace: 'nowrap' }}>
                        <StatusBadge kind="rental" status={r.status} short fontSize={10} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Urgent Maintenance Card */}
        <div className="card-premium" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="var(--fg-amber)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                  {t('dashboard.antrean_servis')}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('maintenance')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Atur Jadwal &rarr;
              </button>
            </div>

            {stats.serviceQueue.length === 0 ? (
              <EmptyState
                pesan={t('dashboard.kosong_antrean')}
                keterangan={t('dashboard.kosong_antrean_sub')}
                ariaLabel="Tidak ada antrean servis"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.serviceQueue.map((m) => {
                  const imgUrl = getEquipmentImage(m.equipment_code);
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-eight)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--bg-raised)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <img src={imgUrl} alt={m.equipment_name} style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="serial-code" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {m.maintenance_code}
                          </span>
                          <span>
                            <StatusBadge kind="maintenance" status={m.status} fontSize={10} />
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-strong)' }}>
                          {m.equipment_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)', marginTop: '1px' }}>
                          {LABEL_JENIS_SERVIS[m.maintenance_type] ?? m.maintenance_type}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                          <span>HM: <strong>{m.hour_meter_at_maintenance} {t('dashboard.hm_jam')}</strong></span>
                          <span>Tgl: {formatTanggal(m.scheduled_date)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Telemetry Summary */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-blue-soft)',
              borderRadius: 'var(--radius-eight)',
              border: '1px solid var(--border-blue-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {t('dashboard.telemetri_judul')}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                {t('dashboard.telemetri_lokasi')}
              </div>
            </div>
            <button onClick={() => onNavigate('tracking')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '11.5px' }}>
              {t('dashboard.buka_peta')}
            </button>
          </div>
        </div>
      </div>

      {/* Top 5 Unit Tersewa */}
      <div className="card-premium" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={18} color="var(--fg-amber)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
              {t('dashboard.top_unit')}
            </h3>
          </div>
          <button
            onClick={() => onNavigate('equipment')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            Lihat Semua Unit &rarr;
          </button>
        </div>

        {stats.topEquipments.length === 0 ? (
          <EmptyState
            pesan={t('dashboard.kosong_top')}
            keterangan={t('dashboard.kosong_top_sub')}
            ariaLabel="Belum ada data top unit tersewa"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.topEquipments.map((item, idx) => {
              const imgUrl = getEquipmentImage(item.equipment_code);
              const medalColors = ['var(--fg-amber)', 'var(--text-faint)', '#CD7F32'];
              const medalColor = medalColors[idx] ?? 'var(--color-secondary)';
              const barPct = Math.round(
                (item.rental_count / (stats.topEquipments[0]?.rental_count || 1)) * 100
              );
              return (
                <div
                  key={item.equipment_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-eight)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: idx === 0 ? 'var(--bg-amber-soft)' : 'var(--bg-raised)',
                  }}
                >
                  {/* Rank badge */}
                  <div
                    aria-label={`Peringkat ${idx + 1}`}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: medalColor,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '13px',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Foto unit */}
                  <img
                    src={imgUrl}
                    alt={item.equipment_name}
                    style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                  />

                  {/* Nama + bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.equipment_name}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-primary)', flexShrink: 0 }}>
                        {t('dashboard.sewa_kali', { n: item.rental_count })}
                      </span>
                    </div>
                    <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                      {item.equipment_code}
                    </span>
                    {/* Progress bar — CSS only, no library */}
                    <div
                      style={{ marginTop: '6px', height: '4px', borderRadius: '2px', background: 'var(--color-border)' }}
                      role="progressbar"
                      aria-valuenow={barPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${barPct}% dari unit tersewa terbanyak`}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${barPct}%`,
                          borderRadius: '2px',
                          background: medalColor,
                          transition: 'width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
