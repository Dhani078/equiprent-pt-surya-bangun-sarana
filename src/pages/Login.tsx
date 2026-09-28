import React, { useState } from 'react';
import { RoleName, User } from '../types';
import { Truck, Shield, Lock, Eye, EyeOff, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { simpanTokenSesi } from '../lib/authClient';
import { db, loginApi, setApiBridgeToken, stateStore } from '../lib/db';
import { STITCH_IMAGES } from '../lib/stitchAssets';
import { useTerjemahan } from '../lib/i18n';
import { RegisterModal } from './login/RegisterModal';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { t } = useTerjemahan();
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

    // Validasi sisi klien (untuk UX). Validasi sesungguhnya tetap di server.
    if (!username.trim()) {
      setErrorMsg('Nama pengguna wajib diisi.');
      setLoading(false);
      return;
    }
    if (!password) {
      setErrorMsg('Password wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      // Jalur utama: Edge API (Worker -> TiDB). Identitas & token berasal
      // dari server, bukan cermin lokal — ini yang menutup 401 senyap di
      // dashboard/laporan (temuan audit production 2026-09-27).
      const hasilApi = await loginApi(username, password);
      if (hasilApi.ok) {
        simpanTokenSesi(hasilApi.token);
        setApiBridgeToken(hasilApi.token);
        const { sinkronCermin } = await import('../lib/fetchCollection');
        await sinkronCermin();
        const userApi = hasilApi.user;
        if (userApi.role !== selectedRole) {
          setErrorMsg(`Akun "${username}" terdaftar sebagai role ${userApi.role}, bukan ${selectedRole}. Silakan pilih tab role yang sesuai.`);
          setLoading(false);
          return;
        }
        const user = stateStore.users.find(u => u.id === userApi.id) ?? stateStore.users.find(
          u => u.username.toLowerCase() === username.toLowerCase()
        );
        if (!user) {
          setErrorMsg('Data pengguna tidak ditemukan di server.');
          setLoading(false);
          return;
        }
        onLoginSuccess(user);
        return;
      }
      if (!hasilApi.offline) {
        // Server menolak dengan pesan spesifik (rate limit, akun nonaktif, dsb.)
        setErrorMsg(hasilApi.message);
        setLoading(false);
        return;
      }

      // Worker tidak terjangkau (dev murni tanpa wrangler) -> verifikasi lokal.
      const check = await db.verifyCredentials(username, password);

      if (!check.ok) {
        if (check.reason === 'SUSPENDED') {
          setErrorMsg('Akun Anda telah dinonaktifkan. Silakan hubungi administrator PT. Surya Bangun Sarana.');
        } else {
          setErrorMsg('Nama pengguna atau password salah. Silakan periksa kembali kredensial Anda.');
        }
        setLoading(false);
        return;
      }

      const user = check.user;

      // Pastikan role yang dipilih sesuai dengan role akun sebenarnya.
      if (user.role_name !== selectedRole) {
        setErrorMsg(`Akun "${username}" terdaftar sebagai role ${user.role_name}, bukan ${selectedRole}. Silakan pilih tab role yang sesuai.`);
        setLoading(false);
        return;
      }

      onLoginSuccess(user);
    } catch {
      setErrorMsg('Gagal memverifikasi login. Periksa koneksi jaringan Anda.');
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

  /** Label field statik netral — tidak mengulang nama tab peran yang dipilih. */
  const LABEL_FIELD = t('login.nama_pengguna');

  const getRoleLabel = () => LABEL_FIELD;

  const getRolePlaceholder = () => {
    if (selectedRole === 'ADMIN') return t('login.placeholder.ADMIN');
    if (selectedRole === 'STAFF') return t('login.placeholder.STAFF');
    return t('login.placeholder.CUSTOMER');
  };

  /** Label tab peran — mengikuti bahasa aktif. */
  const LABEL_TAB_PERAN: Readonly<Record<RoleName, string>> = {
    ADMIN: t('login.peran.ADMIN'),
    STAFF: t('login.peran.STAFF'),
    CUSTOMER: t('login.peran.CUSTOMER'),
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      {/* Container Utama: 2-Column Split Screen Replikasi Stitch */}
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '1050px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        boxShadow: '0 25px 50px -12px rgba(0, 51, 102, 0.15)',
        border: '1px solid var(--color-border)',
        minHeight: '620px'
      }}>
        
        {/* PANEL KIRI: Ilustrasi & Branding Perusahaan (Deep Blue) */}
        <div style={{
          flex: '1 1 50%',
          backgroundColor: 'var(--text-heading)',
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
            <h2 style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em', margin: '0 0 14px 0', textWrap: 'balance' } as React.CSSProperties}>
              Andal di setiap <span style={{ color: '#93C5FD' }}>operasi alat berat.</span>
            </h2>

            {/* Deskripsi Sistem */}
            <p style={{ fontSize: '14.5px', color: '#CBD5E1', lineHeight: 1.6, margin: 0, maxWidth: '420px' }}>
              Sistem manajemen armada kelas perusahaan untuk operasi konstruksi, logistik, dan alat berat di Kalimantan Selatan.
            </p>
          </div>

          {/* Gambar Alat Berat Komatsu/Caterpillar Asli Stitch Prototype */}
          <div style={{
            margin: '28px 0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 20px 30px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            maxHeight: '220px',
            position: 'relative'
          }}>
            <img
              src={STITCH_IMAGES.LOGIN_HERO}
              alt="Armada excavator alat berat"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Overlay gradien: kurangi plastisitas foto & satukan dengan panel navy. */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,30,64,0.02) 0%, rgba(0,30,64,0.6) 100%)' }} />
          </div>

          {/* Info Aplikasi — hanya nomor produk & jaminan data; nama perusahaan
              sudah ada di logo panel kiri (hindari duplikasi branding). */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(203, 213, 225, 0.7)' }}>
            <span style={{ letterSpacing: '0.05em' }}>
              &copy; 2026 EquipRent MS
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={12} color="#10B981" /> Data Terlindungi
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
          backgroundColor: 'var(--color-surface)'
        }}>
          <div style={{ maxWidth: '380px', margin: '0 auto', width: '100%' }}>
            
            {/* Header Form */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--fs-display)', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                {t('login.selamat_datang')}
              </h3>
              <p style={{ fontSize: 'var(--fs-body)', color: 'var(--color-secondary)', margin: 0 }}>
                {t('login.instruksi')}
              </p>
            </div>

            {/* Error Box — role="alert" agar pembaca layar menyuarakannya
                segera (keadaan galat adalah umpan balik wajib §5.2). */}
            {errorMsg && (
              <div
                role="alert"
                style={{
                backgroundColor: 'var(--bg-rose-soft)',
                border: '1px solid #F87171',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--fg-danger-deep)',
                fontSize: '12.5px',
                lineHeight: 1.4
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* PILIH PERAN (tablist ARIA) — label Bahasa Indonesia */}
            <div
              role="tablist"
              aria-label="Pilih peran pengguna"
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-subtle)',
                padding: '4px',
                borderRadius: 'var(--radius-eight)',
                marginBottom: 'var(--space-4)',
                border: '1px solid var(--color-border)',
                gap: '2px',
              }}
            >
              {(['ADMIN', 'STAFF', 'CUSTOMER'] as RoleName[]).map((role) => {
                const aktif = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    role="tab"
                    aria-selected={aktif}
                    onClick={() => handleRoleSelect(role)}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      textAlign: 'center',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontFamily: 'var(--font-primary)',
                      fontSize: 'var(--fs-sm)',
                      fontWeight: aktif ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: aktif ? '#FFFFFF' : 'transparent',
                      color: aktif ? 'var(--color-primary)' : 'var(--text-body)',
                      boxShadow: aktif ? '0 2px 6px rgba(0,51,102,0.12)' : 'none',
                      outline: aktif ? '1px solid rgba(0, 51, 102, 0.25)' : 'none',
                      outlineOffset: aktif ? '-1px' : 0,
                    }}
                  >
                    {LABEL_TAB_PERAN[role]}
                  </button>
                );
              })}
            </div>

            {/* Form Login */}
            {/* Form Login — gap seragam 16px (grid 8pt) antar blok field */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              {/* Field: Nama Pengguna */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {t('login.kata_sandi')}
                  </label>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); alert('Silakan hubungi IT Helpdesk PT. Surya Bangun Sarana Banjarmasin di nomor hotline (0511) 325-SBS atau email support@suryaequipment.co.id untuk pemulihan akses akun.'); }}
                    style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-primary)', fontWeight: 400, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                  >
                    {t('login.lupa_sandi')}
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

              {/* Remember Device — target sentuh 44px (audit aksesibilitas).
                  Blok label menyerap tinggi target; jangan tambah margin yang
                  memutus ritme 8pt (sebelumnya -6px membuat gap jadi 40px). */}
              <label
                htmlFor="rememberDevice"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  minHeight: '44px',
                  padding: '0 4px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  borderRadius: '8px',
                }}
              >
                <input
                  type="checkbox"
                  id="rememberDevice"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer', margin: 0, flexShrink: 0 }}
                />
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)' }}>
                  {t('login.ingat_saya')}
                </span>
              </label>

              {/* Tombol Submit Login.
                  Klasifikasi CTA: gradient biru khusus agar paling dominan,
                  sementara heading & aksen lain tetap navy datar (--color-primary). */}
              <button
                type="submit"
                disabled={loading}
                className="btn-cta"
                style={{
                  height: '46px',
                  fontSize: 'var(--fs-body)',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                {loading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <span>{t('login.masuk')}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Registration Link — satu penekanan saja (bold, tanpa underline) */}
            <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
              <p style={{ fontSize: 'var(--fs-body)', color: 'var(--color-secondary)', margin: 0 }}>
                {t('login.staf_baru')}{" "}
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {t('login.daftar_pelanggan')}
                </button>
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Modal pengajuan akses — komponen RegisterModal. */}
      {isRegisterModalOpen && (
        <RegisterModal
          form={regForm}
          onChange={setRegForm}
          submitting={registerSubmitting}
          success={registerSuccess}
          onClose={() => setIsRegisterModalOpen(false)}
          onSubmit={handleRegisterSubmit}
        />
      )}

    </div>
  );
};
