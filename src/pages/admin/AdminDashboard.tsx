import React, { useCallback, useEffect, useState } from 'react';
import { StatCard } from '../../components/StatCard';
import { useTerjemahan } from '../../lib/i18n';
import {
  DollarSign,
  Truck,
  ClipboardList,
  Wrench,
  Users,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  RefreshCw,
  Hourglass,
  Gauge,
  Trophy,
  MapPin,
} from 'lucide-react';
import type { AdminDashboardStats } from '../../types';
import { getEquipmentImage } from '../../lib/stitchAssets';
import { formatRupiah, formatRupiahRingkas, formatTanggal } from '../../lib/businessRules';
import { fetchDashboardStats } from '../../lib/dashboardClient';
import type { DashboardSource } from '../../lib/dashboardClient';
import { stateStore } from '../../lib/db';
import { Skeleton } from '../../components/Skeleton';
import { TrendChart, ringkasAngka } from '../../components/TrendChart';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  buildOperationalAnalytics,
  getTingkatUtilisasi,
} from '../../lib/analytics';
import type { OperationalAnalytics } from '../../lib/analytics';
import { PanelTopCustomer, PanelUtilisasiBulanan } from './dashboard/panels';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

/** Judul status servis dalam bahasa Indonesia formal. */
const LABEL_JENIS_SERVIS: Record<string, string> = {
  PREVENTIVE: 'Servis Preventif',
  CORRECTIVE: 'Perbaikan Korektif',
  OVERHAUL: 'Overhaul',
};

/**
 * Merangkai daftar kode unit menjadi kalimat lengkap tanpa potongan "+N lainnya".
 * Daftar lengkap dipakai supaya narasi banner selalu cocok dengan jumlah unit
 * yang dinyatakan (lihat audit D3: banner bilang 5 tapi cuma 2 kode tampil).
 */
function gabungKode(kode: readonly string[]): string {
  if (kode.length === 0) return '-';
  if (kode.length === 1) return kode[0];
  return `${kode.slice(0, -1).join(', ')} dan ${kode[kode.length - 1]}`;
}

/**
 * Dashboard Eksekutif Administrator.
 *
 * Semua angka berasal dari `GET /api/dashboard/stats` (agregat dihitung
 * server melalui `src/lib/dashboard.ts`). Bila edge API belum tersedia,
 * klien menghitung lokal dengan modul yang sama — jadi tidak ada lagi
 * angka buatan (mock) di halaman ini.
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { t } = useTerjemahan();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<DashboardSource>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /**
   * Analytics operasional (T-0061): utilisasi per bulan + top customer.
   *
   * Sengaja dihitung LOKAL dari stateStore, bukan dari edge API, karena
   * data rentals/equipments/users sudah dimuat oleh App.tsx ke stateStore
   * — memanggil endpoint lain hanya mengulang pengambilan yang sama.
   * `buildOperationalAnalytics` adalah modul murni yang sama dipakai server,
   * jadi hasilnya tidak bisa menyimpang dari `GET /api/dashboard/analytics`.
   */
  const [analytics, setAnalytics] = useState<OperationalAnalytics | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    let aktif = true;
    setLoading(true);
    setError(null);

    fetchDashboardStats(controller.signal).then((hasil) => {
      if (!aktif) return;

      if (hasil.ok) {
        setStats(hasil.stats);
        setSource(hasil.source);
        setError(null);
      } else if (hasil.message !== 'PERMINTAAN_DIBATALKAN') {
        setError(hasil.message);
        setStats(null);
        setSource(null);
      }
      setLoading(false);
    });

    // Analytics tidak bergantung hasil API — bisa dihitung bersamaan.
    setAnalytics(
      buildOperationalAnalytics({
        rentals: stateStore.rentals,
        equipments: stateStore.equipments,
        users: stateStore.users,
      })
    );

    return () => {
      aktif = false;
      controller.abort();
    };
  }, [reloadKey]);

  const handleRetry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  // -------------------------------------------------------------------------
  // Loading skeleton — ukurannya mengikuti layout asli agar tidak melompat.
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div
        className="animate-fade-in"
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        aria-busy="true"
        aria-label="Memuat ringkasan dashboard"
      >
        <Skeleton height="76px" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '16px',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height="132px" />
          ))}
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap: '20px' }}
        >
          <Skeleton height="340px" />
          <Skeleton height="340px" />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error + tombol coba ulang
  // -------------------------------------------------------------------------
  if (error || !stats) {
    return (
      <div
        className="card-premium animate-fade-in"
        role="alert"
        style={{
          padding: '40px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          textAlign: 'center',
        }}
      >
        <AlertTriangle size={34} color="var(--fg-danger)" />
        <div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--fg-danger-deep)' }}>
            Ringkasan dashboard gagal dimuat
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--color-secondary)', maxWidth: '460px' }}>
            {error ?? 'Data agregat tidak tersedia.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="btn-primary"
          style={{ padding: '9px 16px', fontSize: '13px' }}
          aria-label={t('dashboard.coba_ulang_aria')}
        >
          <RefreshCw size={15} />
          <span>{t('dashboard.coba_ulang')}</span>
        </button>
      </div>
    );
  }

  const persenUtilisasi =
    stats.totalEquipments === 0
      ? 0
      : Math.round((stats.rentedEquipments / stats.totalEquipments) * 100);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--fs-display)', fontWeight: 800, color: 'var(--color-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {t('dashboard.judul')}
          </h2>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--color-secondary)', margin: '4px 0 0 0' }}>
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleRetry}
            className="btn-secondary"
            style={{ fontSize: 'var(--fs-body)', padding: '8px 14px' }}
            aria-label={t('dashboard.muat_ulang_aria')}
            title={source === 'API' ? 'Dihitung langsung oleh server' : 'Dihitung dari salinan data di perangkat (server tidak terjangkau)'}
          >
            <RefreshCw size={15} />
            <span>{t('dashboard.muat_ulang')}</span>
          </button>
          <button onClick={() => onNavigate('equipment')} className="btn-primary" style={{ fontSize: 'var(--fs-body)', padding: '8px 14px' }}>
            <Truck size={15} />
            <span>{t('dashboard.kelola_unit')}</span>
          </button>
          <button onClick={() => onNavigate('tracking')} className="btn-secondary" style={{ fontSize: 'var(--fs-body)', padding: '8px 14px' }}>
            <MapPin size={15} />
            <span>{t('dashboard.peta_gps')}</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>

      {/* Peringatan Servis Preventif (aturan 250 HM).
          Narasi menyatu: banner hanya muncul bila ada unit telat, dan
          langsung menyatakan total perlu-perhatian = telat + mendekati.
          Kontras ditingkatkan: teks gelap di atas pink muda, tombol navy solid. */}
      {(stats.serviceDueCount > 0 || stats.serviceApproachingCount > 0) && (
        <div
          className="animate-fade-in"
          role="alert"
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            border: '1px solid var(--banner-danger-border)',
            background: 'var(--banner-danger-bg)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <AlertTriangle size={20} color="var(--banner-danger-icon)" />
          <div style={{ flex: 1, minWidth: '240px' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--banner-danger-fg)' }}>
              {stats.serviceDueCount + stats.serviceApproachingCount} unit perlu perhatian
              {stats.serviceDueCount > 0 ? `: ${stats.serviceDueCount} telat jadwal servis` : ''}
              {stats.serviceApproachingCount > 0 ? `, ${stats.serviceApproachingCount} mendekati 250 HM` : ''}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--banner-danger-fg)' }}>
              {stats.serviceDueCount > 0
                ? `Telat: ${gabungKode(stats.serviceDueCodes)}`
                : 'Belum ada unit yang melewati jadwal — jadwalkan inspeksi sebelum jatuh tempo.'}
              {stats.serviceDueCount > 0 && stats.serviceApproachingCount > 0
                ? `  •  Mendekati: ${gabungKode(stats.serviceApproachingCodes)}`
                : ''}
            </p>
          </div>
          <button
            onClick={() => onNavigate('maintenance')}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '8px 14px', flexShrink: 0 }}
          >
            Jadwalkan Servis
          </button>
        </div>
      )}

      {/* Top 4 Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {(() => {
          const totalRevenue = formatRupiahRingkas(stats.totalRevenue);
          const menunggu = formatRupiahRingkas(stats.pendingPaymentAmount);
          return (
            <>
              <StatCard
                title={t('dashboard.total_pendapatan')}
                value={totalRevenue.ringkas}
                valueTitle={totalRevenue.full}
                subtitle={t('dashboard.pendapatan_sub')}
                icon={DollarSign}
                iconTone="success"
                badgeText="Lunas"
                badgeType="success"
                onClick={() => onNavigate('reports')}
              />
              <StatCard
                title={t('dashboard.total_armada')}
                value={t('dashboard.unit', { n: stats.totalEquipments })}
                subtitle={
                  stats.maintenanceEquipments + stats.unavailableEquipments > 0
                    ? t('dashboard.armada_sub', { siap: stats.availableEquipments, tersewa: stats.rentedEquipments, servis: stats.maintenanceEquipments + stats.unavailableEquipments })
                    : t('dashboard.armada_subsimpel', { siap: stats.availableEquipments, tersewa: stats.rentedEquipments })
                }
                icon={Truck}
                iconTone="info"
                badgeText={stats.maintenanceEquipments + stats.unavailableEquipments > 0 ? 'Sebagian Servis' : 'Operasional'}
                badgeType={stats.maintenanceEquipments + stats.unavailableEquipments > 0 ? 'warning' : 'success'}
                onClick={() => onNavigate('equipment')}
              />
              <StatCard
                title={t('dashboard.sewa_aktif')}
                value={t('dashboard.sewa_aktif_value', { n: stats.activeRentals })}
                subtitle={t('dashboard.sewa_aktif_sub')}
                icon={ClipboardList}
                iconTone="info"
                badgeText={t('dashboard.badge_berjalan')}
                badgeType="info"
                onClick={() => onNavigate('rentals')}
              />
              <StatCard
                title={t('dashboard.servis_mendesak')}
                value={t('dashboard.unit', { n: stats.serviceDueCount + stats.serviceApproachingCount })}
                subtitle={
                  stats.serviceDueCount > 0
                    ? t('dashboard.servis_alert_kombinasi', { telat: stats.serviceDueCount, mendekat: stats.serviceApproachingCount })
                    : stats.serviceApproachingCount > 0
                      ? t('dashboard.servis_mendekat_sub', { n: stats.serviceApproachingCount })
                      : t('dashboard.servis_perlu_inspeksi')
                }
                icon={Wrench}
                iconTone={stats.serviceDueCount > 0 ? 'danger' : 'warning'}
                badgeText={stats.serviceDueCount > 0 ? t('dashboard.badge_telat') : t('dashboard.badge_mendesak')}
                badgeType={stats.serviceDueCount > 0 ? 'danger' : 'warning'}
                onClick={() => onNavigate('maintenance')}
              />
              <StatCard
                title={t('dashboard.menunggu_verifikasi')}
                value={menunggu.ringkas}
                valueTitle={menunggu.full}
                subtitle={t('dashboard.verifikasi_sub', { n: stats.pendingPaymentCount })}
                icon={Hourglass}
                iconTone="warning"
                badgeText={t('dashboard.badge_pembayaran')}
                badgeType="neutral"
                onClick={() => onNavigate('rentals')}
              />
              <StatCard
                title={t('dashboard.pelanggan_terdaftar')}
                value={t('dashboard.pelanggan_value', { n: stats.totalCustomers })}
                subtitle={t('dashboard.pelanggan_sub')}
                icon={Users}
                iconTone="neutral"
                badgeText={t('dashboard.badge_pelanggan')}
                badgeType="neutral"
                onClick={() => onNavigate('users')}
              />
              <StatCard
                title={t('dashboard.pengajuan_masuk')}
                value={t('dashboard.pengajuan_value', { n: stats.pendingRentals })}
                subtitle={t('dashboard.pengajuan_sub')}
                icon={ClipboardList}
                iconTone="warning"
                badgeText={t('dashboard.badge_pengajuan')}
                badgeType="neutral"
                onClick={() => onNavigate('rentals')}
              />
              <StatCard
                title={t('dashboard.utilisasi')}
                value={`${persenUtilisasi}%`}
                subtitle={t('dashboard.utilisasi_sub', { tersewa: stats.rentedEquipments, total: stats.totalEquipments })}
                icon={Gauge}
                iconTone={persenUtilisasi >= 60 ? 'success' : 'warning'}
                badgeText={persenUtilisasi >= 60 ? 'Tinggi' : 'Rendah'}
                badgeType={persenUtilisasi >= 60 ? 'success' : 'warning'}
                onClick={() => onNavigate('equipment')}
              />
            </>
          );
        })()}
      </div>

      {/* Grafik tren pendapatan (SVG interaktif, tanpa pustaka pihak ketiga).
          Diletakkan SETELAH baris pertama StatCard (bukan setelah 2 baris)
          agar sebagian besar grafik terlihat tanpa menggulir. */}
      {stats.revenueTrend.length > 0 && (
        <TrendChart
          title={t('dashboard.tren_judul')}
          subtitle={t('dashboard.tren_sub')}
          data={stats.revenueTrend.map((d) => ({ label: d.label, value: d.amount }))}
          formatValue={formatRupiah}
          formatAxisValue={ringkasAngka}
          height={180}
        />
      )}

      {/* Analytics operasional (T-0061).
          Dua panel berdampingan: produktivitas armada per bulan (kiri) dan
          kontribusi pelanggan teratas (kanan). Keduanya dibangun dari modul
          murni `src/lib/analytics.ts` — rumus yang sama dipakai edge API. */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(460px, 100%), 1fr))', gap: '20px' }}>
          <PanelUtilisasiBulanan data={analytics.utilisasiBulanan} />
          <PanelTopCustomer data={analytics.topCustomers} />
        </div>
      )}

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
                  {stats.recentRentals.map((r) => {
                    return (
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
                    );
                  })}
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
                <AlertTriangle size={18} color="#F59E0B" />
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
            <Trophy size={18} color="#F59E0B" />
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
              const medalColors = ['#F59E0B', 'var(--text-faint)', '#CD7F32'];
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
                    backgroundColor: idx === 0 ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-raised)',
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
    </div>
  );
};
