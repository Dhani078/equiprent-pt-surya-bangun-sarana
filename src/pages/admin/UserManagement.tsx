import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { User, RoleName } from '../../types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { validateUserInput } from '../../lib/validators';
import type { ValidatedUserInput } from '../../lib/validators';
import { exportTable } from '../../lib/tableExport';
import type { ExportColumn, ExportFormat } from '../../lib/tableExport';
import { UserFilterBar } from './user/UserFilterBar';
import { UserTable } from './user/UserTable';
import { AddUserModal } from './user/AddUserModal';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => Promise<void>;
  onToggleStatus: (id: number) => Promise<void>;
  /** Menampilkan pesan sukses/gagal di tingkat aplikasi. */
  onNotify?: (message: string, tone: 'success' | 'error') => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onToggleStatus,
  onNotify
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  /** User yang sedang menunggu konfirmasi toggle status. */
  const [confirmToggleUser, setConfirmToggleUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** Galat per-field dari validator terpusat. */
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ValidatedUserInput, string>>>({});
  /** Galat tingkat form, misal username sudah dipakai (dari server). */
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    role_id: 3,
    username: '',
    email: '',
    full_name: '',
    phone: '',
    address: 'Banjarmasin, Kalimantan Selatan',
    company_name: '',
    status: 'ACTIVE' as User['status']
  });

  /** Menutup modal sekaligus membersihkan penanda galat. */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormErrors({});
    setFormError(null);
  };

  /** Ubah satu field form + bersihkan galat field terkait. */
  const handleFieldChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validasi memakai modul yang sama dengan server → pesan galat identik.
    const hasil = validateUserInput(formData);
    if (!hasil.ok) {
      setFormErrors(hasil.errors);
      setFormError(null);
      return;
    }

    setFormErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const input: ValidatedUserInput = hasil.value;
    const roleName: RoleName = input.role_id === 1 ? 'ADMIN' : input.role_id === 2 ? 'STAFF' : 'CUSTOMER';

    try {
      await onAddUser({ ...input, role_name: roleName, status: 'ACTIVE' });
      onNotify?.(`Pengguna ${input.username} berhasil didaftarkan.`, 'success');
      setIsModalOpen(false);
      setFormData({
        role_id: 3,
        username: '',
        email: '',
        full_name: '',
        phone: '',
        address: 'Banjarmasin, Kalimantan Selatan',
        company_name: '',
        status: 'ACTIVE'
      });
      setFormErrors({});
      setFormError(null);
    } catch (err) {
      const pesan =
        err instanceof Error && err.message ? err.message : 'Gagal mendaftarkan pengguna.';
      setFormError(pesan);
      onNotify?.(pesan, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.company_name && u.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'ALL' || u.role_name === filterRole;
    return matchesSearch && matchesRole;
  });

  /** Kolom ekspor daftar pengguna (tanpa data sensitif seperti hash password). */
  const kolomEkspor: ExportColumn<User>[] = [
    { header: 'Nama Lengkap', value: (u) => u.full_name },
    { header: 'Username', value: (u) => u.username },
    { header: 'Hak Akses', value: (u) => u.role_name ?? '-' },
    { header: 'Email', value: (u) => u.email },
    { header: 'Telepon', value: (u) => u.phone },
    { header: 'Perusahaan', value: (u) => u.company_name ?? '-' },
    { header: 'Status', value: (u) => u.status },
  ];

  /** Mengekspor pengguna sesuai filter yang sedang aktif. */
  const handleExport = (format: ExportFormat) => {
    const hasil = exportTable(format, filteredUsers, kolomEkspor, {
      title: 'Daftar Pengguna Sistem',
      subtitle: `Ditampilkan ${filteredUsers.length} dari ${users.length} pengguna`,
      filename: 'daftar-pengguna',
    });
    onNotify?.(hasil.message, hasil.ok ? 'success' : 'error');
  };

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

      <UserFilterBar
        searchTerm={searchTerm}
        filterRole={filterRole}
        onSearchChange={(v) => { setSearchTerm(v); setPage(1); }}
        onRoleChange={(v) => { setFilterRole(v); setPage(1); }}
        onExport={handleExport}
      />

      <UserTable
        filteredUsers={filteredUsers}
        page={page}
        onPageChange={setPage}
        onAskToggle={setConfirmToggleUser}
        onResetFilter={() => { setSearchTerm(''); setFilterRole('ALL'); setPage(1); }}
        onOpenAddModal={() => setIsModalOpen(true)}
        hasActiveFilter={Boolean(searchTerm) || filterRole !== 'ALL'}
      />

      <AddUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        formData={formData}
        onFieldChange={handleFieldChange}
        formErrors={formErrors}
        formError={formError}
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
      />

      {/* Konfirmasi Toggle Status Akun */}
      <ConfirmDialog
        open={confirmToggleUser !== null}
        title={confirmToggleUser?.status === 'ACTIVE' ? 'Nonaktifkan Akun Pengguna' : 'Aktifkan Akun Pengguna'}
        message={
          <>
            {confirmToggleUser?.status === 'ACTIVE'
              ? <>Nonaktifkan akun <strong>{confirmToggleUser?.full_name}</strong> ({confirmToggleUser?.username})? Pengguna tidak akan bisa login sampai diaktifkan kembali.</>
              : <>Aktifkan kembali akun <strong>{confirmToggleUser?.full_name}</strong> ({confirmToggleUser?.username})?</>
            }
          </>
        }
        confirmLabel={confirmToggleUser?.status === 'ACTIVE' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        tone={confirmToggleUser?.status === 'ACTIVE' ? 'danger' : 'warning'}
        onConfirm={() => {
          if (!confirmToggleUser) return;
          const u = confirmToggleUser;
          setConfirmToggleUser(null);
          onToggleStatus(u.id).catch((err: unknown) => {
            const pesan =
              err instanceof Error && err.message ? err.message : 'Gagal mengubah status akun.';
            onNotify?.(pesan, 'error');
          });
        }}
        onCancel={() => setConfirmToggleUser(null)}
      />
    </div>
  );
};
