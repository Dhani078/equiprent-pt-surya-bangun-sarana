/**
 * Grid 8 widget metrik cepat dashboard admin (pendapatan, armada, sewa, servis,
 * verifikasi, pelanggan, pengajuan, utilisasi).
 *
 * Dipisah dari `AdminDashboard.tsx`; seluruh angka dari `AdminDashboardStats`
 * (agregat server) — komponen ini hanya memformat dan mengarahkan navigasi.
 */
import { ClipboardList, DollarSign, Gauge, Hourglass, Truck, Users, Wrench } from 'lucide-react';
import { StatCard } from '../../../components/StatCard';
import { useTerjemahan } from '../../../lib/i18n';
import { formatRupiahRingkas } from '../../../lib/businessRules';
import type { AdminDashboardStats } from '../../../types';

interface Props {
  stats: AdminDashboardStats;
  onNavigate: (tab: string) => void;
}

export const DashboardStatGrid: React.FC<Props> = ({ stats, onNavigate }) => {
  const { t } = useTerjemahan();
  const persenUtilisasi =
    stats.totalEquipments === 0
      ? 0
      : Math.round((stats.rentedEquipments / stats.totalEquipments) * 100);

  const totalRevenue = formatRupiahRingkas(stats.totalRevenue);
  const menunggu = formatRupiahRingkas(stats.pendingPaymentAmount);
  const servisTetutup = stats.maintenanceEquipments + stats.unavailableEquipments;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
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
          servisTetutup > 0
            ? t('dashboard.armada_sub', { siap: stats.availableEquipments, tersewa: stats.rentedEquipments, servis: servisTetutup })
            : t('dashboard.armada_subsimpel', { siap: stats.availableEquipments, tersewa: stats.rentedEquipments })
        }
        icon={Truck}
        iconTone="info"
        badgeText={servisTetutup > 0 ? 'Sebagian Servis' : 'Operasional'}
        badgeType={servisTetutup > 0 ? 'warning' : 'success'}
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
    </div>
  );
};
