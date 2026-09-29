import React from 'react';
import { Plus, Shield, ToggleLeft, ToggleRight, Users as UsersIcon } from 'lucide-react';
import { User } from '../../../types';
import { getUserAvatar } from '../../../lib/stitchAssets';
import { Paginator, usePagination } from '../../../components/Paginator';
import { EmptyState } from '../../../components/EmptyState';

const PAGE_SIZE_USERS = 20;

interface UserTableProps {
  /** Sudah difilter (pencarian + peran) oleh induk. */
  filteredUsers: User[];
  page: number;
  onPageChange: (p: number) => void;
  onAskToggle: (u: User) => void;
  onResetFilter: () => void;
  onOpenAddModal: () => void;
  hasActiveFilter: boolean;
}

/** Tabel pengguna multi-role + paginasi + empty state. */
export const UserTable: React.FC<UserTableProps> = ({
  filteredUsers, page, onPageChange, onAskToggle, onResetFilter, onOpenAddModal, hasActiveFilter,
}) => (
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
        {usePagination(filteredUsers, PAGE_SIZE_USERS, page).map((u) => {
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
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-strong)' }}>{u.full_name}</div>
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
                  onClick={() => onAskToggle(u)}
                  className="btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  title={u.status === 'ACTIVE' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                  aria-label={u.status === 'ACTIVE' ? `Nonaktifkan akun ${u.full_name}` : `Aktifkan akun ${u.full_name}`}
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
    {filteredUsers.length === 0 && (
      <EmptyState
        pesan={hasActiveFilter ? 'Tidak ada pengguna yang cocok' : 'Belum ada pengguna terdaftar'}
        keterangan={hasActiveFilter
          ? 'Ubah kata kunci pencarian atau pilih hak akses lain pada penyaring di atas.'
          : 'Tambahkan pengguna pertama untuk mulai mengatur hak akses sistem.'}
        ariaLabel="Daftar pengguna kosong"
        ikon={UsersIcon}
        aksi={hasActiveFilter ? (
          <button type="button" className="btn-secondary" onClick={onResetFilter} style={{ marginTop: '4px', padding: '7px 14px', fontSize: '12.5px' }}>
            Reset Penyaring
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={onOpenAddModal} style={{ marginTop: '4px', padding: '7px 14px', fontSize: '12.5px' }}>
            <Plus size={14} /> Tambah Pengguna Baru
          </button>
        )}
      />
    )}
    <Paginator total={filteredUsers.length} page={page} limit={PAGE_SIZE_USERS} onPageChange={onPageChange} />
  </div>
);
