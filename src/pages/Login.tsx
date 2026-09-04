import React, { useState } from 'react';
import { RoleName, User } from '../types';
import { Shield, Truck, Key, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { db } from '../lib/db';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<RoleName>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: RoleName) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'ADMIN') {
      setUsername('admin');
      setPassword('admin');
    } else if (role === 'STAFF') {
      setUsername('staff');
      setPassword('staff');
    } else {
      setUsername('user');
      setPassword('user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const user = await db.getUserByUsername(username);
      if (!user) {
        setErrorMsg('Username tidak ditemukan dalam database sistem.');
        setLoading(false);
        return;
      }

      // Check role matching
      if (user.role_name !== selectedRole) {
        setErrorMsg(`Akun ini terdaftar sebagai ${user.role_name}, bukan ${selectedRole}.`);
        setLoading(false);
        return;
      }

      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg('Gagal memverifikasi login. Periksa koneksi basis data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F1F5F9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
      backgroundSize: '24px 24px'
    }}>
      <div className="card-premium animate-fade-in" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '36px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        border: '1px solid var(--color-border)'
      }}>
        {/* Company Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            boxShadow: '0 8px 16px rgba(0, 51, 102, 0.25)'
          }}>
            <Truck size={28} />
          </div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 800,
            color: 'var(--color-primary)',
            margin: '0 0 4px 0',
            letterSpacing: '-0.01em'
          }}>
            PT. SURYA BANGUN SARANA
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'var(--color-secondary)',
            margin: 0,
            fontWeight: 500
          }}>
            Heavy Equipment Monitoring & Rental System
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          backgroundColor: '#F1F5F9',
          padding: '4px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          {(['ADMIN', 'STAFF', 'CUSTOMER'] as RoleName[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleSelect(role)}
              style={{
                padding: '9px 4px',
                borderRadius: '6px',
                border: 'none',
                fontFamily: 'var(--font-primary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'var(--transition-base)',
                backgroundColor: selectedRole === role ? 'var(--color-primary)' : 'transparent',
                color: selectedRole === role ? '#FFFFFF' : 'var(--color-secondary)',
                boxShadow: selectedRole === role ? '0 2px 8px rgba(0, 51, 102, 0.2)' : 'none'
              }}
            >
              {role === 'ADMIN' ? 'Administrator' : role === 'STAFF' ? 'Staf Operasional' : 'Pelanggan'}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 'var(--radius-eight)',
            color: '#991B1B',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Username Akses ({selectedRole})
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-premium"
              required
              placeholder="Masukkan username"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Kata Sandi (Password)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-premium"
              required
              placeholder="Masukkan password"
            />
          </div>

          {/* Quick Credential Hint for Skripsi Presentation */}
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#F8FAFC',
            border: '1px dashed var(--color-border)',
            borderRadius: '6px',
            fontSize: '11.5px',
            color: 'var(--color-secondary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Akun Sidang Skripsi: <strong>{username}</strong></span>
            <span>Sandi: <strong>{password}</strong></span>
          </div>

          <button
            type="submit"
            className="btn-primary active-press"
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: '14.5px', marginTop: '6px' }}
          >
            {loading ? (
              <span>Memvalidasi...</span>
            ) : (
              <>
                <span>Masuk ke Terminal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div style={{
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'var(--color-secondary-light)'
        }}>
          <span>Database: </span>
          <strong style={{ color: 'var(--color-primary)' }}>TiDB Cloud Serverless (MySQL Compatible)</strong>
          <br />
          <span>Cloudflare Workers Edge Architecture</span>
        </div>
      </div>
    </div>
  );
};
