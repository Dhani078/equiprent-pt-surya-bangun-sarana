import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, MapPin, RefreshCw, Truck, AlertTriangle } from 'lucide-react';
import { useTerjemahan } from '../../lib/i18n';
import type { AdminDashboardStats } from '../../types';
import { formatRupiah } from '../../lib/businessRules';
import { fetchDashboardStats } from '../../lib/dashboardClient';
import type { DashboardSource } from '../../lib/dashboardClient';
import { stateStore } from '../../lib/db';
import { Skeleton } from '../../components/Skeleton';
import { TrendChart, ringkasAngka } from '../../components/TrendChart';
import {
  buildOperationalAnalytics,
} from '../../lib/analytics';
import type { OperationalAnalytics } from '../../lib/analytics';
import { PanelTopCustomer, PanelUtilisasiBulanan } from './dashboard/panels';
import { ServiceAlertBanner } from './dashboard/ServiceAlertBanner';
import { DashboardStatGrid } from './dashboard/DashboardStatGrid';
import { DashboardActivityFeeds } from './dashboard/DashboardActivityFeeds';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
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

      {/* Peringatan Servis Preventif (aturan 250 HM) — hanya tampil bila ada unit telat/mendekat. */}
      <ServiceAlertBanner stats={stats} onNavigate={onNavigate} />

      {/* Widget metrik cepat (StatCard). */}
      <DashboardStatGrid stats={stats} onNavigate={onNavigate} />

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

      {/* Feed aktivitas: transaksi terbaru, antrean servis, top 5 unit tersewa. */}
      <DashboardActivityFeeds stats={stats} onNavigate={onNavigate} />
    </div>
  );
};
