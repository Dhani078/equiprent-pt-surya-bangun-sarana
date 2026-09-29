import React, { useState } from 'react';
import { User as UserIcon, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useTerjemahan } from '../../lib/i18n';

interface LoginFormProps {
  username: string;
  password: string;
  loading: boolean;
  rolePlaceholder: string;
  fieldLabel: string;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/** Form kredensial: nama pengguna + password + ingat perangkat + CTA masuk. */
export const LoginForm: React.FC<LoginFormProps> = ({
  username, password, loading, rolePlaceholder, fieldLabel,
  onUsernameChange, onPasswordChange, onSubmit,
}) => {
  const { t } = useTerjemahan();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <label style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
          {fieldLabel}
        </label>
        <div style={{ position: 'relative' }}>
          <UserIcon
            size={16}
            style={{
              position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--color-secondary-light)',
            }}
          />
          <input
            type="text"
            required
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder={rolePlaceholder}
            className="input-premium"
            style={{ paddingLeft: '38px', height: '42px', fontSize: '13.5px' }}
          />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--color-primary)' }}>
            {t('login.kata_sandi')}
          </label>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Silakan hubungi IT Helpdesk PT. Surya Bangun Sarana Banjarmasin di nomor hotline (0511) 325-SBS atau email support@suryaequipment.co.id untuk pemulihan akses akun.');
            }}
            style={{
              fontSize: 'var(--fs-xs)', color: 'var(--color-primary)', fontWeight: 400,
              textDecoration: 'underline', textUnderlineOffset: '2px',
            }}
          >
            {t('login.lupa_sandi')}
          </a>
        </div>
        <div style={{ position: 'relative' }}>
          <Lock
            size={16}
            style={{
              position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--color-secondary-light)',
            }}
          />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="********"
            className="input-premium"
            style={{ paddingLeft: '38px', paddingRight: '38px', height: '42px', fontSize: '13.5px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-secondary-light)', display: 'flex', alignItems: 'center',
            }}
            title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Remember Device — target sentuh 44px (audit aksesibilitas). */}
      <label
        htmlFor="rememberDevice"
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          minHeight: '44px', padding: '0 4px', cursor: 'pointer',
          userSelect: 'none', borderRadius: '8px',
        }}
      >
        <input
          type="checkbox"
          id="rememberDevice"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
          style={{
            width: '18px', height: '18px', accentColor: 'var(--color-primary)',
            cursor: 'pointer', margin: 0, flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)' }}>
          {t('login.ingat_saya')}
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="btn-cta"
        style={{
          height: '46px', fontSize: 'var(--fs-body)', fontWeight: 800,
          letterSpacing: '0.04em', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 'var(--space-2)',
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
  );
};
