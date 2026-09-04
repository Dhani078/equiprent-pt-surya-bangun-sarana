import React, { useState } from 'react';
import { User, RoleName } from '../../types';
import { Plus, Search, Shield, ToggleLeft, ToggleRight, UserCheck, Mail, Phone, Building2 } from 'lucide-react';
import { Modal } from '../../components/Modal';

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
    address: 'Banjarmasin, Kalsel',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            Manajemen Pengguna Sistem (Multi-Role RBAC)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-light)', margin: '4px 0 0 0' }}>
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

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID & Username</th>
              <th>Nama Lengkap & Jabatan</th>
              <th>Peran (Role)</th>
              <th>Kontak (Email & HP)</th>
              <th>Entitas Perusahaan</th>
              <th>Status Akun</th>
              <th>Kontrol Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td style={{ fontSize: '13px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>@{u.username}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>ID: #{u.id}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#1E293B' }}>{u.full_name}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-secondary-light)' }}>{u.address}</div>
                </td>
                <td>
                  <span className={`badge badge-${u.role_name === 'ADMIN' ? 'available' : u.role_name === 'STAFF' ? 'approved' : 'maintenance'}`} style={{ fontSize: '11px' }}>
                    <Shield size={11} />
                    {u.role_name}
                  </span>
                </td>
                <td style={{ fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} color="var(--color-secondary-light)" />
                    <span>{u.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Phone size={12} color="var(--color-secondary-light)" />
                    <span>{u.phone}</span>
                  </div>
                </td>
                <td style={{ fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Building2 size={13} color="var(--color-primary)" />
                    <strong>{u.company_name || 'Personal/Individu'}</strong>
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${u.status.toLowerCase()}`}>
                    {u.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => onToggleStatus(u.id)}
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '11.5px' }}
                    title={u.status === 'ACTIVE' ? 'Suspend Akun' : 'Aktifkan Akun'}
                  >
                    {u.status === 'ACTIVE' ? (
                      <>
                        <ToggleRight size={15} color="#10B981" />
                        <span>Aktif</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={15} color="#EF4444" />
                        <span style={{ color: '#EF4444' }}>Ditangguhkan</span>
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Daftarkan Pengguna Sistem Baru"
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Hak Akses (Role)
              </label>
              <select
                className="input-premium"
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
              >
                <option value={1}>ADMIN (Administrator Penuh)</option>
                <option value={2}>STAFF (Staf Operasional / Mekanik)</option>
                <option value={3}>CUSTOMER (Pelanggan / Klien)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Username Akses
              </label>
              <input
                type="text"
                className="input-premium"
                required
                placeholder="misal: ahmad_sbs"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Nama Lengkap Pengguna
            </label>
            <input
              type="text"
              className="input-premium"
              required
              placeholder="Contoh: H. M. Yusuf Amin, S.T."
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Alamat Email
              </label>
              <input
                type="email"
                className="input-premium"
                required
                placeholder="nama@email.com"
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
                className="input-premium"
                required
                placeholder="0812xxxxxxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Nama Perusahaan / Instansi (Opsional untuk Customer)
            </label>
            <input
              type="text"
              className="input-premium"
              placeholder="PT. / CV. / Instansi"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Alamat Domisili / Kantor
            </label>
            <textarea
              className="input-premium"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              Simpan Data Akun
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
