import React, { useState } from 'react';
import { User, RoleName } from '../../types';
import { Plus, Search, Shield, ToggleLeft, ToggleRight, UserCheck, Mail, Phone, Building2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { getUserAvatar } from '../../lib/stitchAssets';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => Promise<any>;
  onToggleStatus: (id: number) => Promise<any>;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onToggleStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    role_id: 3,
    role_name: 'CUSTOMER' as RoleName,
    username: '',
    email: '',
    full_name: '',
    phone: '',
    address: 'Banjarmasin, Kalimantan Selatan',
    company_name: '',
    status: 'ACTIVE' as User['status']
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const roleName: RoleName = formData.role_id === 1 ? 'ADMIN' : formData.role_id === 2 ? 'STAFF' : 'CUSTOMER';
    await onAddUser({
      ...formData,
      role_name: roleName
    });
    setIsModalOpen(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.company_name && u.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'ALL' || u.role_name === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            Manajemen Pengguna Sistem (Multi-Role RBAC)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary)', margin: '4px 0 0 0' }}>
            Akses kontrol pengguna: Administrator, Staf Operasional, dan Akun Korporasi Pelanggan PT. SBS.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '9px 16px', fontSize: '13.5px' }}>
          <Plus size={16} />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card-premium" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }} />
          <input
            type="text"
            className="input-premium"
            placeholder="Cari nama pengguna, username, email, atau perusahaan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <select
          className="input-premium"
          style={{ width: 'auto', height: '40px', padding: '0 12px' }}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="ALL">Semua Hak Akses</option>
          <option value="ADMIN">ADMIN (Superuser)</option>
          <option value="STAFF">STAFF (Staf Operasional)</option>
          <option value="CUSTOMER">CUSTOMER (Pelanggan Sewa)</option>
        </select>
      </div>

      {/* Users Table with Avatars */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pengguna & Profil</th>
              <th>Username</th>
              <th>Peran / Role</th>
              <th>Kontak & Perusahaan</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'center' }}>Aksi Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const avatar = getUserAvatar(u.role_name);
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={avatar}
                        alt={u.full_name}
                        style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#1E293B' }}>{u.full_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '12.5px' }}>
                    {u.username}
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={11} />
                      {u.role_name}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    <div>{u.company_name || 'Pelanggan Perorangan'}</div>
                    <div style={{ color: 'var(--color-secondary)', fontSize: '11px' }}>{u.phone || '-'}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={u.status === 'ACTIVE' ? 'badge badge-available' : 'badge badge-unavailable'}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => onToggleStatus(u.id)}
                      className="btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      title={u.status === 'ACTIVE' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                    >
                      {u.status === 'ACTIVE' ? (
                        <span style={{ color: '#EF4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ToggleRight size={16} /> Nonaktifkan
                        </span>
                      ) : (
                        <span style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ToggleLeft size={16} /> Aktifkan
                        </span>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Add User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pendaftaran Pengguna Baru"
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              className="input-premium"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Username Login
              </label>
              <input
                type="text"
                required
                placeholder="budisantoso"
                className="input-premium"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Hak Akses (Role)
              </label>
              <select
                className="input-premium"
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
              >
                <option value={1}>ADMIN (Administrator Superuser)</option>
                <option value={2}>STAFF (Staf Operasional Lapangan)</option>
                <option value={3}>CUSTOMER (Pelanggan / Perusahaan)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Alamat Email Resmi
              </label>
              <input
                type="email"
                required
                placeholder="budi@antang.co.id"
                className="input-premium"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="tel"
                placeholder="08115009876"
                className="input-premium"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Nama Instansi / Perusahaan (Opsional untuk Pelanggan)
            </label>
            <input
              type="text"
              placeholder="PT. Aneka Tambang Kalimantan"
              className="input-premium"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Simpan & Daftarkan Pengguna
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
