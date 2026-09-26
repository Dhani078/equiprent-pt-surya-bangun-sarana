import React, { useEffect, useState } from 'react';
import { User, RoleName } from '../types';
import { LogOut, Shield, Moon, Sun, ChevronDown, Languages } from 'lucide-react';
import { getUserAvatar } from '../lib/stitchAssets';
import { useTerjemahan, type Bahasa } from '../lib/i18n';
import { NotificationCenter } from './NotificationCenter';
import type { NotificationItem } from '../lib/notifications';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  /**
   * Pengganti peran cepat (pola dev/impersonation). Tidak dirender lagi di
   * UI produksi — tetap diterima agar App tidak perlu menghapus handlernya.
   */
  onSwitchRole?: (role: RoleName) => void;
  /** Notifikasi siap tampil (hasil `buildNotifications`). */
  notifications?: readonly NotificationItem[];
  /** Dipanggil saat notifikasi diklik, dengan id tab tujuan. */
  onSelectTab?: (tab: string) => void;
}

const STORAGE_KEY = 'sbs-theme';

/** Label peran dalam Bahasa Indonesia untuk header & profil. */
const ROLE_LABEL: Readonly<Record<string, string>> = {
  ADMIN: 'Administrator',
  STAFF: 'Staf Operasional',
  CUSTOMER: 'Pelanggan',
};

function initTheme(): boolean {
  const saved = localStorage.getItem(STORAGE_KEY);
  const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  return dark;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  notifications = [],
  onSelectTab,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dark, setDark] = useState(() => initTheme());
  const { bahasa, aturBahasa } = useTerjemahan();
  const avatarUrl = getUserAvatar(currentUser.role_name);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Title / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          backgroundColor: 'var(--color-primary)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 800,
          fontSize: '16px',
          boxShadow: '0 2px 6px rgba(0, 51, 102, 0.25)'
        }}>
          SBS
        </div>
        <div>
          <h1 style={{ fontSize: 'var(--fs-h2)', fontWeight: 800, color: 'var(--color-primary)', margin: 0, lineHeight: 1.2 }}>
            PT. SURYA BANGUN SARANA BANJARMASIN
          </h1>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-secondary)', margin: 0 }}>
            Sistem Monitoring &amp; Rental Alat Berat
          </p>
        </div>
      </div>

      {/* Role Switcher & User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

        {/* Pusat Notifikasi */}
        {onSelectTab && <NotificationCenter items={notifications} onNavigate={onSelectTab} />}

        {/* Pemilih Bahasa (T-0063) */}
        <button
          type="button"
          onClick={() => aturBahasa(bahasa === 'id' ? 'en' : 'id')}
          className="btn-secondary"
          title={bahasa === 'id' ? 'Switch to English' : 'Beralih ke Bahasa Indonesia'}
          aria-label={bahasa === 'id' ? 'Switch to English' : 'Beralih ke Bahasa Indonesia'}
          style={{ padding: '6px 10px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Languages size={15} />
          <span style={{ fontSize: '11.5px', fontWeight: 600 }}>{bahasa === 'id' ? 'ID' : 'EN'}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="btn-secondary"
          title={dark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
          aria-label={dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          style={{ padding: '6px 10px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
          <span style={{ fontSize: '11.5px', fontWeight: 600 }}>{dark ? 'Terang' : 'Gelap'}</span>
        </button>

        {/* Penanda peran aktif — read-only. Penggantian peran adalah pola dev
            (impersonation); di produksi pengguna harus masuk kembali dengan
            akun yang sesuai, jadi tidak ada tombol pindah peran di top bar. */}
        <div
          title={`Anda masuk sebagai ${currentUser.role_name}. Keluar lalu masuk kembali untuk berganti peran.`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'var(--color-surface-hover, #F1F5F9)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--color-secondary)',
            fontWeight: 700,
          }}
        >
          <Shield size={12} color="var(--color-primary)" />
          <span>{ROLE_LABEL[currentUser.role_name ?? ''] ?? currentUser.role_name}</span>
        </div>

        {/* User Profile Avatar with Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid transparent',
              background: dropdownOpen ? 'var(--color-surface-hover)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <img
              src={avatarUrl}
              alt={currentUser.full_name}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--color-primary)'
              }}
            />
            <div style={{ textAlign: 'left' }} className="hidden sm:block">
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
                {currentUser.full_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: 'var(--color-secondary)' }}>
                <Shield size={10} color="var(--color-primary)" />
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{ROLE_LABEL[currentUser.role_name ?? ''] ?? currentUser.role_name}</span>
              </div>
            </div>
            <ChevronDown size={14} color="var(--color-secondary)" />
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '200px',
                backgroundColor: 'var(--color-surface)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                border: '1px solid var(--color-border)',
                padding: '6px',
                zIndex: 1000
              }}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-surface-hover)', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>{currentUser.full_name}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{currentUser.email}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#DC2626',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-danger-soft, #FEE2E2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogOut size={14} />
                <span>Keluar Terminal</span>
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="btn-secondary"
          title="Keluar Terminal"
          style={{ padding: '6px 12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <LogOut size={14} color="#EF4444" />
          <span style={{ color: '#EF4444', fontWeight: 600 }}>Keluar</span>
        </button>

      </div>
    </header>
  );
};
