/**
 * Modal pengajuan akses mandiri (register) di halaman Login.
 *
 * State form & simulated submit tetap di Login (induk); komponen ini murni
 * render. Terjemahan judul diambil sendiri lewat `useTerjemahan`.
 */
import React from 'react';
import { CheckCircle, Shield, X } from 'lucide-react';
import { useTerjemahan } from '../../lib/i18n';

export interface RegFormState {
  fullname: string;
  company: string;
  phone: string;
  role: string;
}

interface Props {
  form: RegFormState;
  onChange: (form: RegFormState) => void;
  submitting: boolean;
  success: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' };
const inputStyle: React.CSSProperties = { height: '38px', fontSize: '13px' };

export const RegisterModal: React.FC<Props> = ({
  form: regForm,
  onChange: setRegForm,
  submitting: registerSubmitting,
  success: registerSuccess,
  onClose,
  onSubmit: handleRegisterSubmit,
}) => {
  const { t } = useTerjemahan();
  return (
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
        backgroundColor: 'var(--color-surface)',
        padding: '28px',
        borderRadius: '12px',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '20px',
            top: '20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-secondary)',
            padding: 0
          }}
          aria-label="Tutup formulir pengajuan akses"
        >
          <X size={18} />
        </button>

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
              {t('login.daftar_judul')}
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--color-secondary)', margin: 0 }}>
              PT. SURYA BANGUN SARANA BANJARMASIN
            </p>
          </div>
        </div>

        {registerSuccess && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-green-soft)',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            color: 'var(--fg-success-deeper)'
          }}>
            <CheckCircle size={20} color="var(--fg-success-deep)" />
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
            <label style={labelStyle}>Nama Lengkap Pemohon</label>
            <input
              type="text"
              required
              placeholder="Contoh: Hendra Wijaya"
              value={regForm.fullname}
              onChange={(e) => setRegForm({ ...regForm, fullname: e.target.value })}
              className="input-premium"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Nama Instansi / Perusahaan</label>
              <input
                type="text"
                required
                placeholder="Contoh: PT. Mulia Jaya"
                value={regForm.company}
                onChange={(e) => setRegForm({ ...regForm, company: e.target.value })}
                className="input-premium"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Nomor WhatsApp Aktif</label>
              <input
                type="tel"
                required
                placeholder="Contoh: 0811500XXXX"
                value={regForm.phone}
                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                className="input-premium"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Hak Akses yang Diajukan</label>
            <select
              value={regForm.role}
              onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
              className="input-premium"
              style={inputStyle}
            >
              <option value="CUSTOMER">Pelanggan — Portal Sewa & Kontrak</option>
              <option value="STAFF">Staf SBS — Verifikasi & Monitoring</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--color-secondary)' }}>
              Hotline: (0511) 325-SBS
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
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
  );
};
