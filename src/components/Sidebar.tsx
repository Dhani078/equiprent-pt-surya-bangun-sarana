import React from 'react';
import { RoleName } from '../types';
import { 
  LayoutDashboard, 
  Truck, 
  ClipboardList, 
  Wrench, 
  MapPin, 
  FileText, 
  Users, 
  Settings, 
  FileCheck, 
  CreditCard, 
  UserCircle,
  ShieldCheck
} from 'lucide-react';

export interface SidebarBadges {
  /** Jumlah pembayaran menunggu verifikasi. */
  payments?: number;
  /** Jumlah unit jatuh tempo servis. */
  maintenance?: number;
  /** Jumlah rental menunggu persetujuan. */
  rentals?: number;
}

interface SidebarProps {
  role: RoleName;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  badges?: SidebarBadges;
}

/** Dot badge bulat kecil di pojok kanan atas menu item. */
function Badge({ count, tone }: { count: number; tone: 'error' | 'warning' }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} item memerlukan perhatian`}
      style={{
        marginLeft: 'auto',
        minWidth: '20px',
        height: '20px',
        padding: '0 5px',
        borderRadius: '999px',
        fontSize: '10.5px',
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tone === 'error' ? '#DC2626' : '#F59E0B',
        color: '#FFFFFF',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, onSelectTab, badges = {} }) => {
  const getMenuItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
          { id: 'equipment', label: 'Inventaris Alat Berat', icon: Truck },
          { id: 'rentals', label: 'Transaksi Rental', icon: ClipboardList, badge: badges.rentals, badgeTone: 'warning' as const },
          { id: 'maintenance', label: 'Perawatan & Servis', icon: Wrench, badge: badges.maintenance, badgeTone: 'warning' as const },
          { id: 'tracking', label: 'Pelacakan GPS Telemetri', icon: MapPin },
          { id: 'reports', label: 'Laporan & Dokumen', icon: FileText },
          { id: 'users', label: 'Manajemen Pengguna', icon: Users },
          { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
          { id: 'settings', label: 'Pengaturan Sistem', icon: Settings },
        ];
      case 'STAFF':
        return [
          { id: 'dashboard', label: 'Dashboard Operasional', icon: LayoutDashboard },
          { id: 'rentals', label: 'Rental Orders', icon: ClipboardList, badge: badges.rentals, badgeTone: 'warning' as const },
          { id: 'contracts', label: 'Kontrak Sewa Digital', icon: FileCheck },
          { id: 'payments', label: 'Verifikasi Pembayaran', icon: CreditCard, badge: badges.payments, badgeTone: 'error' as const },
          { id: 'maintenance', label: 'Penjadwalan Servis', icon: Wrench, badge: badges.maintenance, badgeTone: 'warning' as const },
          { id: 'tracking', label: 'Monitoring Posisi GPS', icon: MapPin },
          { id: 'reports', label: 'Cetak Laporan BAST', icon: FileText },
          { id: 'settings', label: 'Pengaturan Akun', icon: Settings },
        ];
      case 'CUSTOMER':
        return [
          { id: 'dashboard', label: 'Katalog Alat Berat', icon: Truck },
          { id: 'rentals', label: 'Penyewaan Saya', icon: ClipboardList },
          { id: 'contracts', label: 'Kontrak Digital Saya', icon: FileCheck },
          { id: 'payments', label: 'Pembayaran & Tagihan', icon: CreditCard },
          { id: 'tracking', label: 'Lacak Lokasi Unit', icon: MapPin },
          { id: 'profile', label: 'Profil Perusahaan', icon: UserCircle },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid var(--color-border)',
      height: 'calc(100vh - 64px)',
      position: 'sticky',
      top: '64px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 12px',
      overflowY: 'auto'
    }}>
      <div>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--color-secondary-light)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          padding: '0 12px 10px 12px'
        }}>
          Menu {role}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-eight)',
                  border: 'none',
                  textAlign: 'left',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--color-secondary)',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'var(--transition-base)',
                  boxShadow: isActive ? '0 4px 12px rgba(0, 51, 102, 0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-secondary)';
                  }
                }}
              >
                <Icon size={18} color={isActive ? '#FFFFFF' : 'currentColor'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge count={item.badge} tone={item.badgeTone ?? 'warning'} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info in sidebar */}
      <div style={{
        padding: '12px',
        backgroundColor: '#F8FAFC',
        borderRadius: 'var(--radius-eight)',
        border: '1px solid var(--color-border)',
        fontSize: '11.5px',
        color: 'var(--color-secondary)'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '2px' }}>
          PT. SBS Banjarmasin
        </div>
        <div style={{ fontSize: '10.5px', color: 'var(--color-secondary-light)' }}>
          Versi Edge Worker 2026.1<br/>
          TiDB Cloud Serverless
        </div>
      </div>
    </aside>
  );
};
