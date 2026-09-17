import React, { useCallback, useEffect, useState } from 'react';
import { StatCard } from '../../components/StatCard';
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
  Inbox,
  Hourglass,
  Gauge,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import type { AdminDashboardStats } from '../../types';
import { getEquipmentImage } from '../../lib/stitchAssets';
import { formatRupiah, formatTanggal } from '../../lib/businessRules';
import { fetchDashboardStats } from '../../lib/dashboardClient';
import type { DashboardSource } from '../../lib/dashboardClient';
import { Skeleton } from '../../components/Skeleton';
import { TrendChart } from '../../components/TrendChart';

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
 * Dashboard Eksekutif Administrator.
 *
 * Semua angka berasal dari `GET /api/dashboard/stats` (agregat dihitung
 * server melalui `src/lib/dashboard.ts`). Bila edge API belum tersedia,
 * klien menghitung lokal dengan modul yang sama — jadi tidak ada lagi
 * angka buatan (mock) di halaman ini.
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<DashboardSource>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}
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
        <AlertTriangle size={34} color="#dc2626" />
        <div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#991B1B' }}>
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
          aria-label="Coba muat ulang ringkasan dashboard"
        >
          <RefreshCw size={15} />
          <span>Coba Ulang</span>
        </button>
      </div>
    );
  }

  const persenUtilisasi =
    stats.totalEquipments === 0
      ? 0
      : Math.round((stats.rentedEquipments / stats.totalEquipments) * 100);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            Dashboard Eksekutif Administrator
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary)', margin: '4px 0 0 0' }}>
            Pemantauan performa finansial, utilisasi armada alat berat, dan agenda pemeliharaan PT. SBS Banjarmasin.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span
            className="badge"
            aria-label="Sumber data ringkasan"
            style={{
              fontSize: '11px',
              background: source === 'API' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: source === 'API' ? '#059669' : '#B45309',
            }}
          >
            {source === 'API' ? 'Sumber: Edge API' : 'Sumber: Perhitungan lokal'}
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '8px 14px' }}
            aria-label="Muat ulang ringkasan dashboard"
          >
            <RefreshCw size={15} />
            <span>Muat Ulang</span>
          </button>
          <button onClick={() => onNavigate('equipment')} className="btn-primary" style={{ fontSize: '13px', padding: '8px 14px' }}>
            <Truck size={15} />
            <span>Kelola Unit</span>
          </button>
          <button onClick={() => onNavigate('tracking')} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 14px' }}>
            <span>Live GPS Map</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>

      {/* Peringatan Servis Preventif (aturan 250 HM) */}
      {stats.serviceDueCount > 0 && (
        <div
          className="animate-fade-in"
          role="alert"
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            background: 'rgba(220, 38, 38, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <AlertTriangle size={20} color="#dc2626" />
          <div style={{ flex: 1, minWidth: '240px' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>
              {stats.serviceDueCount} unit telah melewati jadwal servis 250 HM
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-secondary)' }}>
              {stats.serviceDueCodes.join(', ')}
              {stats.serviceDueCount > stats.serviceDueCodes.length
                ? ` +${stats.serviceDueCount - stats.serviceDueCodes.length} lainnya`
                : ''}
            </p>
          </div>
          <button
            onClick={() => onNavigate('maintenance')}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '8px 14px' }}
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
          gap: '16px',
        }}
      >
        <StatCard
          title="Total Pendapatan Terbayar"
          value={formatRupiah(stats.totalRevenue)}
          subtitle="Akumulasi pembayaran sewa lunas"
          icon={DollarSign}
          badgeText="Lunas"
          badgeType="success"
        />
        <StatCard
          title="Total Armada Alat Berat"
          value={`${stats.totalEquipments} Unit`}
          subtitle={`${stats.availableEquipments} siap sewa, ${stats.rentedEquipments} tersewa`}
          icon={Truck}
          badgeText="Operasional"
          badgeType="info"
        />
        <StatCard
          title="Transaksi Sewa Aktif"
          value={`${stats.activeRentals} Kontrak`}
          subtitle="Unit beroperasi di lapangan"
          icon={ClipboardList}
          badgeText="On Going"
          badgeType="info"
        />
        <StatCard
          title="Jadwal Servis Mendesak"
          value={`${stats.pendingMaintenanceCount} Unit`}
          subtitle={
            stats.serviceApproachingCount > 0
              ? `${stats.serviceApproachingCount} unit mendekati 250 HM`
              : 'Perlu inspeksi teknisi mekanik'
          }
          icon={Wrench}
          badgeText="Penting"
          badgeType="warning"
        />
      </div>

      {/* Baris kedua: piutang, pelanggan, utilisasi, penyewa selesai */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          title="Menunggu Verifikasi"
          value={formatRupiah(stats.pendingPaymentAmount)}
          subtitle={`${stats.pendingPaymentCount} pembayaran belum diverifikasi`}
          icon={Hourglass}
          badgeText="Pending"
          badgeType="warning"
        />
        <StatCard
          title="Pelanggan Terdaftar"
          value={`${stats.totalCustomers} Akun`}
          subtitle="Perusahaan penyewa aktif"
          icon={Users}
          badgeText="Customer"
          badgeType="info"
        />
        <StatCard
          title="Pengajuan Masuk"
          value={`${stats.pendingRentals} Pengajuan`}
          subtitle="Menunggu persetujuan staf"
          icon={ClipboardList}
          badgeText="PENDING"
          badgeType="warning"
        />
        <StatCard
          title="Tingkat Utilisasi Armada"
          value={`${persenUtilisasi}%`}
          subtitle={`${stats.rentedEquipments} dari ${stats.totalEquipments} unit tersewa`}
          icon={Gauge}
          badgeText={persenUtilisasi >= 60 ? 'Tinggi' : 'Normal'}
          badgeType={persenUtilisasi >= 60 ? 'success' : 'info'}
        />
      </div>

      {/* Two Column Grid: Recent Rentals & Urgent Maintenance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Recent Rentals Card */}
        <div className="card-premium" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                Transaksi Penyewaan Terbaru
              </h3>
            </div>
            <button
              onClick={() => onNavigate('rentals')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Lihat Semua Transaksi &rarr;
            </button>
          </div>

          {stats.recentRentals.length === 0 ? (
            <EmptyState
              pesan="Belum ada transaksi penyewaan"
              keterangan="Transaksi akan muncul di sini setelah pelanggan mengajukan sewa."
              ariaLabel="Belum ada transaksi penyewaan"
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kode Sewa</th>
                    <th>Klien Perusahaan</th>
                    <th>Alat Berat</th>
                    <th>Subtotal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentRentals.map((r) => {
                    const imgUrl = getEquipmentImage(r.equipment_code);
                    return (
                      <tr key={r.id}>
                        <td className="serial-code" style={{ fontWeight: 600, fontSize: '12px', color: 'var(--color-primary)' }}>
                          {r.rental_code}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.company_name || r.customer_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{r.customer_name}</div>
                        </td>
                        <td style={{ fontSize: '12.5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={imgUrl} alt={r.equipment_name} style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} />
                            <div>
                              <div>{r.equipment_name}</div>
                              <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{r.equipment_code}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '13px', fontFamily: 'monospace' }}>
                          {formatRupiah(r.subtotal)}
                        </td>
                        <td>
                          <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
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
                  Antrean Servis & Pemeliharaan
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
                pesan="Tidak ada antrean servis"
                keterangan="Semua unit tercatat dalam kondisi baik. Jadwalkan servis bila diperlukan."
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
                        backgroundColor: '#F8FAFC',
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
                          <span className={`badge badge-${m.status.toLowerCase()}`} style={{ fontSize: '10px' }}>
                            {m.status}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#1E293B' }}>
                          {m.equipment_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)', marginTop: '1px' }}>
                          {LABEL_JENIS_SERVIS[m.maintenance_type] ?? m.maintenance_type}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                          <span>HM: <strong>{m.hour_meter_at_maintenance} jam</strong></span>
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
              backgroundColor: '#EFF6FF',
              borderRadius: 'var(--radius-eight)',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                GPS Telemetri Aktif Kalimantan Selatan
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                Pelabuhan Trisakti, Banjarbaru, Tabalong
              </div>
            </div>
            <button onClick={() => onNavigate('tracking')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '11.5px' }}>
              Buka Peta
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
              Top 5 Unit Paling Sering Disewa
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
            pesan="Belum ada data penyewaan"
            keterangan="Peringkat unit akan muncul setelah ada transaksi sewa yang tercatat."
            ariaLabel="Belum ada data top unit tersewa"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.topEquipments.map((item, idx) => {
              const imgUrl = getEquipmentImage(item.equipment_code);
              const medalColors = ['#F59E0B', '#94A3B8', '#CD7F32'];
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
                    backgroundColor: idx === 0 ? 'rgba(245, 158, 11, 0.05)' : '#F8FAFC',
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
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.equipment_name}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-primary)', flexShrink: 0 }}>
                        {item.rental_count}× sewa
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
      {/* Grafik tren interaktif (SVG, tanpa pustaka pihak ketiga) */}
      {stats.revenueTrend.length > 0 && (
        <div className="card-premium" style={{ padding: '20px' }}>
          <TrendChart
            title="Kurva Pendapatan 12 Bulan"
            subtitle="Arahkan kursor ke titik untuk melihat nilai per bulan"
            data={stats.revenueTrend.map((d) => ({ label: d.label, value: d.amount }))}
            formatValue={formatRupiah}
          />
        </div>
      )}

      {/* Revenue Trend — bar chart CSS-only 12 bulan */}
      <div className="card-premium" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
              Tren Pendapatan 12 Bulan Terakhir
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
            Hanya pembayaran berstatus LUNAS
          </span>
        </div>

        {stats.revenueTrend.length === 0 ? (
          <EmptyState
            pesan="Belum ada data pendapatan"
            keterangan="Grafik akan muncul setelah ada pembayaran yang diverifikasi lunas."
            ariaLabel="Belum ada data tren pendapatan"
          />
        ) : (() => {
          const maxAmount = Math.max(...stats.revenueTrend.map(d => d.amount), 1);
          return (
            <div
              role="img"
              aria-label="Bar chart tren pendapatan 12 bulan terakhir"
              style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', paddingBottom: '28px', position: 'relative' }}
            >
              {stats.revenueTrend.map((item) => {
                const pct = Math.round((item.amount / maxAmount) * 100);
                const isCurrentMonth = item.amount === maxAmount && maxAmount > 0;
                return (
                  <div
                    key={`${item.year}-${item.month}`}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}
                  >
                    {/* Nilai rupiah di atas bar — hanya tampil bila ada */}
                    {item.amount > 0 && (
                      <span
                        title={formatRupiah(item.amount)}
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: isCurrentMonth ? 'var(--color-primary)' : 'var(--color-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          maxWidth: '100%',
                          textAlign: 'center',
                          lineHeight: 1.2,
                        }}
                      >
                        {item.amount >= 1_000_000_000
                          ? `${(item.amount / 1_000_000_000).toFixed(1)}M`
                          : `${Math.round(item.amount / 1_000_000)}jt`}
                      </span>
                    )}
                    {/* Batang */}
                    <div
                      style={{
                        width: '100%',
                        height: `${Math.max(pct, item.amount > 0 ? 4 : 0)}%`,
                        borderRadius: '4px 4px 0 0',
                        background: isCurrentMonth
                          ? 'var(--color-primary)'
                          : item.amount > 0
                            ? 'rgba(0,51,102,0.45)'
                            : 'var(--color-border)',
                        transition: 'height 0.4s cubic-bezier(0.25,0.8,0.25,1)',
                        minHeight: item.amount > 0 ? '4px' : '2px',
                      }}
                      role="presentation"
                    />
                    {/* Label bulan */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        fontSize: '9.5px',
                        color: 'var(--color-secondary)',
                        textAlign: 'center',
                        width: `calc(${100 / stats.revenueTrend.length}% - 6px)`,
                        lineHeight: 1,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Komponen kecil pendukung
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  pesan: string;
  keterangan: string;
  ariaLabel: string;
}

/** Keadaan kosong seragam untuk panel dashboard. */
const EmptyState: React.FC<EmptyStateProps> = ({ pesan, keterangan, ariaLabel }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '36px 18px',
      border: '1px dashed var(--color-border)',
      borderRadius: 'var(--radius-eight)',
      textAlign: 'center',
    }}
    aria-label={ariaLabel}
  >
    <Inbox size={28} color="#94A3B8" />
    <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--color-secondary)' }}>
      {pesan}
    </p>
    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-secondary-light)', maxWidth: '340px' }}>
      {keterangan}
    </p>
  </div>
);
