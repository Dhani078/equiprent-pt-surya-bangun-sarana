import React, { useState } from 'react';
import { Rental, Equipment, User } from '../../types';
import { Plus, Search, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { Modal } from '../../components/Modal';

interface RentalManagementProps {
  rentals: Rental[];
  equipments: Equipment[];
  users: User[];
  onAddRental: (item: Omit<Rental, 'id' | 'rental_code'>) => Promise<any>;
  onUpdateRentalStatus: (id: number, status: Rental['status']) => Promise<any>;
}

export const RentalManagement: React.FC<RentalManagementProps> = ({
  rentals,
  equipments,
  users,
  onAddRental,
  onUpdateRentalStatus
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer_id: users.find(u => u.role_id === 3)?.id || 9,
    equipment_id: equipments.find(e => e.status === 'AVAILABLE')?.id || 1,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    notes: 'Pekerjaan proyek konstruksi di wilayah Kalsel'
  });

  const availableEquipments = equipments.filter(e => e.status === 'AVAILABLE');
  const customers = users.filter(u => u.role_id === 3);

  const calculateDays = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diff / (1000 * 3600 * 24)));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = users.find(u => u.id === Number(formData.customer_id));
    const eq = equipments.find(e => e.id === Number(formData.equipment_id));
    const totalDays = calculateDays(formData.start_date, formData.end_date);
    const subtotal = totalDays * Number(eq?.rental_price_per_day || 2500000);

    await onAddRental({
      customer_id: Number(formData.customer_id),
      customer_name: customer?.full_name,
      company_name: customer?.company_name || 'Pelanggan Individu',
      equipment_id: Number(formData.equipment_id),
      equipment_name: eq?.name,
      equipment_code: eq?.equipment_code,
      booking_date: new Date().toISOString(),
      start_date: formData.start_date,
      end_date: formData.end_date,
      total_days: totalDays,
      subtotal,
      status: 'PENDING',
      notes: formData.notes
    });

    setIsAddModalOpen(false);
  };

  const filteredRentals = rentals.filter((r) => {
    const matchesSearch = r.rental_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.company_name && r.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.equipment_name && r.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            Manajemen Transaksi Penyewaan
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-light)', margin: '4px 0 0 0' }}>
            Daftar order sewa alat berat, durasi operasional proyek, dan kontrol status kontrak sewa.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ padding: '9px 16px', fontSize: '13.5px' }}>
          <Plus size={16} />
          <span>Buat Booking Sewa</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card-premium" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }} />
          <input
            type="text"
            className="input-premium"
            placeholder="Cari kode rental (RNT-SBS...), nama klien, atau nama unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <select
          className="input-premium"
          style={{ width: 'auto', height: '40px', padding: '0 12px' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Semua Status Rental</option>
          <option value="PENDING">PENDING (Menunggu Persetujuan)</option>
          <option value="APPROVED">APPROVED (Disetujui)</option>
          <option value="ON_GOING">ON_GOING (Sedang Berjalan)</option>
          <option value="COMPLETED">COMPLETED (Selesai)</option>
          <option value="REJECTED">REJECTED (Ditolak)</option>
        </select>
      </div>

      {/* Rentals Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode Sewa</th>
              <th>Klien Penyewa</th>
              <th>Unit Alat Berat</th>
              <th>Jadwal Sewa</th>
              <th>Durasi & Total</th>
              <th>Status</th>
              <th>Aksi Perubahan Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRentals.map((r) => (
              <tr key={r.id}>
                <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                  {r.rental_code}
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#1E293B' }}>{r.company_name || r.customer_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-secondary-light)' }}>{r.customer_name}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.equipment_name}</div>
                  <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>{r.equipment_code}</span>
                </td>
                <td style={{ fontSize: '12px' }}>
                  <div>Mulai: <strong>{r.start_date}</strong></div>
                  <div>Selesai: <strong>{r.end_date}</strong></div>
                </td>
                <td>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                    {formatRupiah(Number(r.subtotal))}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>
                    {r.total_days} hari operasional
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${r.status.toLowerCase()}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {r.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => onUpdateRentalStatus(r.id, 'APPROVED')}
                          className="btn-primary"
                          style={{ padding: '5px 10px', fontSize: '11.5px', backgroundColor: '#10B981' }}
                          title="Setujui Booking"
                        >
                          <CheckCircle size={12} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onUpdateRentalStatus(r.id, 'REJECTED')}
                          className="btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11.5px', color: '#EF4444' }}
                          title="Tolak Booking"
                        >
                          <XCircle size={12} />
                        </button>
                      </>
                    )}
                    {r.status === 'APPROVED' && (
                      <button
                        onClick={() => onUpdateRentalStatus(r.id, 'ON_GOING')}
                        className="btn-primary"
                        style={{ padding: '5px 10px', fontSize: '11.5px' }}
                      >
                        Mobilisasi (On Going)
                      </button>
                    )}
                    {r.status === 'ON_GOING' && (
                      <button
                        onClick={() => onUpdateRentalStatus(r.id, 'COMPLETED')}
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '11.5px', color: '#059669', borderColor: '#A7F3D0' }}
                      >
                        Selesai (Kembalikan)
                      </button>
                    )}
                    {r.status === 'COMPLETED' && (
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Tuntas</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add Booking */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Buat Transaksi Penyewaan Baru"
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Pilih Pelanggan / Korporasi
            </label>
            <select
              className="input-premium"
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: Number(e.target.value) })}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name || c.full_name} ({c.full_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Pilih Unit Alat Berat (Tersedia)
            </label>
            <select
              className="input-premium"
              value={formData.equipment_id}
              onChange={(e) => setFormData({ ...formData, equipment_id: Number(e.target.value) })}
            >
              {availableEquipments.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.equipment_code} - {eq.name} ({formatRupiah(Number(eq.rental_price_per_day))}/hari)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Tanggal Mulai Sewa
              </label>
              <input
                type="date"
                className="input-premium"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Tanggal Selesai Sewa
              </label>
              <input
                type="date"
                className="input-premium"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Catatan Lokasi & Pekerjaan Proyek
            </label>
            <textarea
              className="input-premium"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Terbitkan Order Sewa
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
