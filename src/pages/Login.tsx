import React, { useState } from 'react';
import { RoleName, User } from '../types';
import { simpanTokenSesi } from '../lib/authClient';
import { db, loginApi, setApiBridgeToken, stateStore } from '../lib/db';
import { useTerjemahan } from '../lib/i18n';
import { RegisterModal } from './login/RegisterModal';
import { LoginBrandPanel } from './login/LoginBrandPanel';
import { RoleTabPicker } from './login/RoleTabPicker';
import { LoginForm } from './login/LoginForm';
import { LoginErrorBox } from './login/LoginErrorBox';
import { RegisterLinkFooter } from './login/RegisterLinkFooter';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { t } = useTerjemahan();
  const [selectedRole, setSelectedRole] = useState<RoleName>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
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

        <LoginBrandPanel />

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

            {errorMsg && <LoginErrorBox message={errorMsg} />}

            <RoleTabPicker
              selectedRole={selectedRole}
              onSelect={handleRoleSelect}
              labelTabPeran={LABEL_TAB_PERAN}
            />

            <LoginForm
              username={username}
              password={password}
              loading={loading}
              rolePlaceholder={getRolePlaceholder()}
              fieldLabel={t('login.nama_pengguna')}
              onUsernameChange={setUsername}
              onPasswordChange={setPassword}
              onSubmit={handleSubmit}
            />

            <RegisterLinkFooter onOpenRegister={() => setIsRegisterModalOpen(true)} />

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
