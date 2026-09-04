import React, { useState } from 'react';
import { User, RoleName } from '../types';
import { LogOut, Shield, RefreshCw, UserCheck, ChevronDown, Settings, LayoutDashboard } from 'lucide-react';
import { getUserAvatar } from '../lib/stitchAssets';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchRole: (role: RoleName) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout, onSwitchRole }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const avatarUrl = getUserAvatar(currentUser.role_name);

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
          <h1 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)', margin: 0, lineHeight: 1.2 }}>
            PT. SURYA BANGUN SARANA BANJARMASIN
          </h1>
          <p style={{ fontSize: '11.5px', color: 'var(--color-secondary)', margin: 0 }}>
            Sistem Monitoring & Rental Alat Berat &bull; <span style={{ fontFamily: 'monospace', color: '#059669', fontWeight: 600 }}>TiDB Serverless</span>
          </p>
        </div>
      </div>

      {/* Role Switcher & User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        
        {/* Quick Role Switcher for Academic Demo / Sidang Skripsi */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: '#F1F5F9',
          padding: '3px 6px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          fontSize: '11.5px'
        }}>
          <span style={{ color: 'var(--color-secondary)', fontWeight: 600, padding: '0 4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={11} /> Peran:
          </span>
          {(['ADMIN', 'STAFF', 'CUSTOMER'] as RoleName[]).map((role) => {
            const isActive = currentUser.role_name === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => onSwitchRole(role)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--color-secondary)',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {role}
              </button>
            );
          })}
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
              background: dropdownOpen ? '#F1F5F9' : 'transparent',
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
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{currentUser.role_name}</span>
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
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                border: '1px solid var(--color-border)',
                padding: '6px',
                zIndex: 1000
              }}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #F1F5F9', marginBottom: '4px' }}>
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
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
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
