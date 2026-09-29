import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { User } from '../../../types';
import type { ValidatedUserInput } from '../../../lib/validators';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    role_id: number;
    username: string;
    email: string;
    full_name: string;
    phone: string;
    address: string;
    company_name: string;
    status: User['status'];
  };
  onFieldChange: (field: string, value: string | number) => void;
  formErrors: Partial<Record<keyof ValidatedUserInput, string>>;
  formError: string | null;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' };
const errStyle: React.CSSProperties = { margin: '4px 0 0 0', fontSize: '11.5px', color: 'var(--fg-danger)' };
const errBorder = { borderColor: '#F87171' };

/** Modal pendaftaran pengguna baru (identitas saja; password via alur registrasi). */
export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen, onClose, formData, onFieldChange, formErrors, formError, isSubmitting, onSubmit,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Pendaftaran Pengguna Baru">
    <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {formError && (
        <div
          role="alert"
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px',
            borderRadius: '8px', backgroundColor: 'var(--bg-red-soft)', border: '1px solid var(--border-red-soft)',
            color: 'var(--fg-danger-deep)', fontSize: '12.5px', lineHeight: 1.5,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{formError}</span>
        </div>
      )}
      <p
        style={{
          margin: 0, padding: '10px 12px', borderRadius: '8px',
          backgroundColor: 'var(--bg-blue-soft)', border: '1px solid var(--border-blue-soft)',
          color: '#1E40AF',
          fontSize: '12px', lineHeight: 1.5,
        }}
      >
        Password tidak ditetapkan di sini. Admin mendaftarkan identitas akun,
        lalu pemilik akun menetapkan password sendiri melalui alur registrasi
        (disimpan sebagai hash PBKDF2, tidak pernah dalam bentuk teks biasa).
      </p>
      <div>
        <label style={labelStyle}>Nama Lengkap</label>
        <input
          type="text" required placeholder="Contoh: Budi Santoso" className="input-premium"
          value={formData.full_name}
          onChange={(e) => onFieldChange('full_name', e.target.value)}
          aria-invalid={Boolean(formErrors.full_name)}
          aria-label="Nama lengkap pengguna"
          style={formErrors.full_name ? errBorder : undefined}
        />
        {formErrors.full_name && <p style={errStyle}>{formErrors.full_name}</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Username Login</label>
          <input
            type="text" required placeholder="budisantoso" className="input-premium"
            value={formData.username}
            onChange={(e) => onFieldChange('username', e.target.value)}
            aria-invalid={Boolean(formErrors.username)}
            aria-label="Username login"
            style={formErrors.username ? errBorder : undefined}
          />
          {formErrors.username && <p style={errStyle}>{formErrors.username}</p>}
        </div>
        <div>
          <label style={labelStyle}>Hak Akses (Role)</label>
          <select
            className="input-premium"
            value={formData.role_id}
            onChange={(e) => onFieldChange('role_id', Number(e.target.value))}
            aria-label="Hak akses pengguna"
          >
            <option value={1}>ADMIN (Administrator Superuser)</option>
            <option value={2}>STAFF (Staf Operasional Lapangan)</option>
            <option value={3}>CUSTOMER (Pelanggan / Perusahaan)</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Alamat Email Resmi</label>
          <input
            type="email" required placeholder="budi@antang.co.id" className="input-premium"
            value={formData.email}
            onChange={(e) => onFieldChange('email', e.target.value)}
            aria-invalid={Boolean(formErrors.email)}
            aria-label="Alamat email resmi"
            style={formErrors.email ? errBorder : undefined}
          />
          {formErrors.email && <p style={errStyle}>{formErrors.email}</p>}
        </div>
        <div>
          <label style={labelStyle}>Nomor Telepon / WhatsApp</label>
          <input
            type="tel" placeholder="08115009876" className="input-premium"
            value={formData.phone}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            aria-invalid={Boolean(formErrors.phone)}
            aria-label="Nomor telepon"
            style={formErrors.phone ? errBorder : undefined}
          />
          {formErrors.phone && <p style={errStyle}>{formErrors.phone}</p>}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Alamat Domisili / Kantor</label>
        <input
          type="text" required placeholder="Jl. Ahmad Yani KM 5, Banjarmasin" className="input-premium"
          value={formData.address}
          onChange={(e) => onFieldChange('address', e.target.value)}
          aria-invalid={Boolean(formErrors.address)}
          aria-label="Alamat"
          style={formErrors.address ? errBorder : undefined}
        />
        {formErrors.address && <p style={errStyle}>{formErrors.address}</p>}
      </div>
      <div>
        <label style={labelStyle}>Nama Instansi / Perusahaan (Opsional untuk Pelanggan)</label>
        <input
          type="text" placeholder="PT. Aneka Tambang Kalimantan" className="input-premium"
          value={formData.company_name}
          onChange={(e) => onFieldChange('company_name', e.target.value)}
          aria-label="Nama instansi"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
        <button
          type="submit" className="btn-primary" disabled={isSubmitting}
          style={isSubmitting ? { opacity: 0.6, cursor: 'wait' } : undefined}
        >
          {isSubmitting ? 'Mendaftarkan...' : 'Simpan & Daftarkan Pengguna'}
        </button>
      </div>
    </form>
  </Modal>
);
