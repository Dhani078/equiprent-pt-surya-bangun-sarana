import React from 'react';
import { User, RoleName } from '../types';
import { LogOut, Bell, Shield, UserCircle, RefreshCw } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchRole: (role: RoleName) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout, onSwitchRole }) => {
  return (
    <header style={{
      height: '64px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Title / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          backgroundColor: 'var(--color-primary)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 800,
          fontSize: '16px'
        }}>
          SBS
        </div>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0, lineHeight: 1.2 }}>
            PT. SURYA BANGUN SARANA BANJARMASIN
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--color-secondary-light)', margin: 0 }}>
            Sistem Informasi Monitoring & Rental Alat Berat
          </p>
        </div>
      </div>

      {/* Role Switcher & User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Quick Role Switcher for Academic Demo / Sidang Skripsi */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#F1F5F9',
          padding: '4px 8px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          fontSize: '12px'
        }}>
          <span style={{ color: 'var(--color-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} /> Peran:
          </span>
          <button
            onClick={() => onSwitchRole('ADMIN')}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              backgroundColor: currentUser.role_name === 'ADMIN' ? 'var(--color-primary)' : 'transparent',
              color: currentUser.role_name === 'ADMIN' ? '#FFFFFF' : 'var(--color-secondary)'
            }}
          >
            Admin
          </button>
          <button
            onClick={() => onSwitchRole('STAFF')}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              backgroundColor: currentUser.role_name === 'STAFF' ? 'var(--color-primary)' : 'transparent',
              color: currentUser.role_name === 'STAFF' ? '#FFFFFF' : 'var(--color-secondary)'
            }}
          >
            Staff
          </button>
          <button
            onClick={() => onSwitchRole('CUSTOMER')}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              backgroundColor: currentUser.role_name === 'CUSTOMER' ? 'var(--color-primary)' : 'transparent',
              color: currentUser.role_name === 'CUSTOMER' ? '#FFFFFF' : 'var(--color-secondary)'
            }}
          >
            Customer
          </button>
        </div>

        {/* User Info Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <UserCircle size={22} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
              {currentUser.full_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-secondary-light)' }}>
              <Shield size={10} color="var(--color-primary)" />
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{currentUser.role_name}</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="btn-secondary"
          title="Keluar Terminal"
          style={{ padding: '6px 12px', fontSize: '13px' }}
        >
          <LogOut size={14} />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
};
