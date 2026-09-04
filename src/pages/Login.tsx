import React, { useState } from 'react';
import { RoleName, User } from '../types';
import { Truck, Shield, Lock, Eye, EyeOff, User as UserIcon, CheckCircle, X, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { db } from '../lib/db';
import { STITCH_IMAGES } from '../lib/stitchAssets';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<RoleName>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Register Fleet Access Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [regForm, setRegForm] = useState({
    fullname: '',
    company: '',
    phone: '',
    role: 'CUSTOMER'
  });

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

  const handleQuickFill = (role: RoleName, u: string, p: string) => {
    setSelectedRole(role);
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const user = await db.getUserByUsername(username.trim());
      if (!user) {
        setErrorMsg('Username tidak ditemukan dalam database sistem TiDB Cloud.');
        setLoading(false);
        return;
      }

      // Check role matching
      if (user.role_name !== selectedRole) {
        setErrorMsg(`Akun "${username}" terdaftar sebagai role ${user.role_name}, bukan ${selectedRole}. Silakan pilih tab role yang sesuai.`);
        setLoading(false);
        return;
      }

      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg('Gagal memverifikasi login. Periksa koneksi basis data TiDB.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSubmitting(true);
    setTimeout(() => {
      setRegisterSubmitting(false);
      setRegisterSuccess(true);
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegisterSuccess(false);
        setRegForm({ fullname: '', company: '', phone: '', role: 'CUSTOMER' });
      }, 2500);
    }, 800);
  };

  const getRoleLabel = () => {
    if (selectedRole === 'ADMIN') return 'Admin Username';
    if (selectedRole === 'STAFF') return 'Employee ID / Staff Username';
    return 'Customer ID or Username';
  };

  const getRolePlaceholder = () => {
    if (selectedRole === 'ADMIN') return 'Masukkan username admin (contoh: admin)';
    if (selectedRole === 'STAFF') return 'Masukkan username staf (contoh: staff)';
    return 'Masukkan username pelanggan (contoh: user)';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F1F5F9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      {/* Container Utama: 2-Column Split Screen Replikasi Stitch */}
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '1050px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        boxShadow: '0 25px 50px -12px rgba(0, 51, 102, 0.15)',
        border: '1px solid #E2E8F0',
        minHeight: '620px'
      }}>
        
        {/* PANEL KIRI: Ilustrasi & Branding Perusahaan (Deep Blue) */}
        <div style={{
          flex: '1 1 50%',
          backgroundColor: '#001E40',
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          position: 'relative'
        }} className="hidden md:flex">
          
          {/* Logo & Judul Sistem */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Truck size={26} color="#93C5FD" />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
                  EquipRent MS
                </h1>
                <p style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '4px 0 0 0' }}>
                  PT. SURYA BANGUN SARANA
                </p>
              </div>
            </div>

            {/* Tagline Besar */}
            <h2 style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em', margin: '0 0 14px 0' }}>
              Reliability in every <span style={{ color: '#93C5FD' }}>heavy operation.</span>
            </h2>
            
            {/* Deskripsi Sistem */}
            <p style={{ fontSize: '14.5px', color: '#CBD5E1', lineHeight: 1.6, margin: 0, maxWidth: '420px' }}>
              Enterprise-grade fleet management for construction, logistics, and heavy machinery operations di Kalimantan Selatan.
            </p>
          </div>

          {/* Gambar Alat Berat Komatsu/Caterpillar Asli Stitch Prototype */}
          <div style={{
            margin: '28px 0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 20px 30px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            maxHeight: '220px'
          }}>
            <img
              src={STITCH_IMAGES.LOGIN_HERO}
              alt="Heavy Equipment Excavator Fleet"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Info Versi Terminal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(203, 213, 225, 0.7)' }}>
            <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              Fleet Manager Terminal v4.2.0
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={12} color="#10B981" /> TiDB Cloud Serverless
            </span>
          </div>
        </div>

        {/* PANEL KANAN: Card Form Login */}
        <div style={{
          flex: '1 1 50%',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{ maxWidth: '380px', margin: '0 auto', width: '100%' }}>
            
            {/* Header Form */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 6px 0' }}>
                Welcome Back
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--color-secondary)', margin: 0 }}>
                Pilih peran dan masukkan kredensial untuk masuk ke terminal.
              </p>
            </div>

            {/* Error Box */}
            {errorMsg && (
              <div style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #F87171',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#991B1B',
                fontSize: '12.5px',
                lineHeight: 1.4
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ROLE SELECTOR TABS (ADMIN, STAFF, CUSTOMER) */}
            <div style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              padding: '4px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid var(--color-border)'
            }}>
              {(['ADMIN', 'STAFF', 'CUSTOMER'] as RoleName[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    textAlign: 'center',
                    borderRadius: '6px',
                    border: 'none',
                    fontFamily: 'monospace',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: selectedRole === role ? '#FFFFFF' : 'transparent',
                    color: selectedRole === role ? 'var(--color-primary)' : 'var(--color-secondary)',
                    boxShadow: selectedRole === role ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Form Login */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Field: Username */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
                  {getRoleLabel()}
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={getRolePlaceholder()}
                    className="input-premium"
                    style={{ paddingLeft: '38px', height: '42px', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              {/* Field: Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Password
                  </label>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); alert('Silakan hubungi IT Helpdesk PT. Surya Bangun Sarana Banjarmasin di nomor hotline (0511) 325-SBS atau email support@suryaequipment.co.id untuk pemulihan akses akun.'); }}
                    style={{ fontSize: '11.5px', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Lupa Password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-premium"
                    style={{ paddingLeft: '38px', paddingRight: '38px', height: '42px', fontSize: '13.5px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-secondary-light)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Device */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="rememberDevice"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="rememberDevice" style={{ fontSize: '12.5px', color: 'var(--color-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                  Ingat perangkat ini
                </label>
              </div>

              {/* Tombol Submit Login */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  height: '44px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px'
                }}
              >
                {loading ? (
                  <span>AUTHENTICATING...</span>
                ) : (
                  <>
                    <span>MASUK TERMINAL</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Registration Link */}
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-secondary)', margin: 0 }}>
                Operator atau penyewa baru?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  Register Fleet Access
                </button>
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* REGISTER FLEET ACCESS MODAL DIALOG */}
      {isRegisterModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="card-premium animate-fade-in" style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            padding: '28px',
            borderRadius: '12px',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              style={{
                position: 'absolute',
                right: '20px',
                top: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--color-secondary-light)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <Shield size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  Registrasi Akses Fleet
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--color-secondary)', margin: 0 }}>
                  PT. SURYA BANGUN SARANA BANJARMASIN
                </p>
              </div>
            </div>

            {/* Success Toast */}
            {registerSuccess && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
                color: '#065F46'
              }}>
                <CheckCircle size={20} color="#059669" />
                <div style={{ fontSize: '12px' }}>
                  <div style={{ fontWeight: 700 }}>Pengajuan Akses Berhasil Dikirim!</div>
                  <div>Tim IT PT. SBS Banjarmasin akan memverifikasi permohonan dalam 1x24 jam.</div>
                </div>
              </div>
            )}

            <p style={{ fontSize: '12.5px', color: 'var(--color-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Lengkapi formulir permohonan mandiri akun fleet di bawah ini. Akun operasional akan diproses untuk verifikasi resmi.
            </p>

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                  Nama Lengkap Pemohon
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hendra Wijaya"
                  value={regForm.fullname}
                  onChange={(e) => setRegForm({ ...regForm, fullname: e.target.value })}
                  className="input-premium"
                  style={{ height: '38px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                    Nama Instansi / Perusahaan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT. Mulia Jaya"
                    value={regForm.company}
                    onChange={(e) => setRegForm({ ...regForm, company: e.target.value })}
                    className="input-premium"
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                    Nomor WhatsApp Aktif
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 0811500XXXX"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className="input-premium"
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                  Hak Akses yang Diajukan
                </label>
                <select
                  value={regForm.role}
                  onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                  className="input-premium"
                  style={{ height: '38px', fontSize: '13px' }}
                >
                  <option value="CUSTOMER">PELANGGAN (Customer Portal — Sewa & Kontrak)</option>
                  <option value="STAFF">STAF SBS (Staff Operational — Verifikasi & Monitoring)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--color-secondary)' }}>
                  Hotline: (0511) 325-SBS
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={registerSubmitting}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    {registerSubmitting ? 'Mengirim...' : 'Ajukan Akses'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
