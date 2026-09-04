import React, { useState } from 'react';
import { Equipment } from '../../types';
import { Plus, Search, Filter, Edit, Trash2, Gauge, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/Modal';

interface EquipmentManagementProps {
  equipments: Equipment[];
  onAddEquipment: (item: Omit<Equipment, 'id'>) => Promise<void>;
  onUpdateEquipment: (id: number, data: Partial<Equipment>) => Promise<void>;
  onDeleteEquipment: (id: number) => Promise<void>;
}

export const EquipmentManagement: React.FC<EquipmentManagementProps> = ({
  equipments,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    equipment_code: '',
    name: '',
    type: 'Excavator',
    model: '',
    brand: 'Komatsu',
    hour_meter: 0,
    rental_price_per_day: 2500000,
    status: 'AVAILABLE' as Equipment['status'],
    last_maintenance_date: new Date().toISOString().slice(0, 10),
    thumbnail_url: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&auto=format&fit=crop&q=80'
  });

  const handleOpenAdd = () => {
    const nextNum = equipments.length + 1;
    setFormData({
      equipment_code: `EQ-SBS-2026-${String(nextNum).padStart(3, '0')}`,
      name: '',
      type: 'Excavator',
      model: '',
      brand: 'Komatsu',
      hour_meter: 0,
      rental_price_per_day: 2500000,
      status: 'AVAILABLE',
      last_maintenance_date: new Date().toISOString().slice(0, 10),
      thumbnail_url: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&auto=format&fit=crop&q=80'
    });
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: Equipment) => {
    setEditingItem(item);
    setFormData({
      equipment_code: item.equipment_code,
      name: item.name,
      type: item.type,
      model: item.model,
      brand: item.brand,
      hour_meter: item.hour_meter,
      rental_price_per_day: item.rental_price_per_day,
      status: item.status,
      last_maintenance_date: item.last_maintenance_date || new Date().toISOString().slice(0, 10),
      thumbnail_url: item.thumbnail_url || ''
    });
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await onUpdateEquipment(editingItem.id, formData);
    } else {
      await onAddEquipment(formData);
    }
    setIsAddModalOpen(false);
  };

  const filteredEquipments = equipments.filter((eq) => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.equipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || eq.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || eq.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
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
            Manajemen Inventaris Alat Berat
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-light)', margin: '4px 0 0 0' }}>
            Data unit alat berat operasional, status kesiapan sewa, dan akumulasi Hour Meter (HM) PT. SBS.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary" style={{ padding: '9px 16px', fontSize: '13.5px' }}>
          <Plus size={16} />
          <span>Tambah Unit Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-premium" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }} />
            <input
              type="text"
              className="input-premium"
              placeholder="Cari kode unit, tipe mesin, atau merk (Komatsu, Cat, Sakai)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', height: '40px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="input-premium"
            style={{ width: 'auto', height: '40px', padding: '0 12px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Semua Tipe Alat</option>
            <option value="Excavator">Excavator</option>
            <option value="Bulldozer">Bulldozer</option>
            <option value="Crane">Crane</option>
            <option value="Vibratory Roller">Vibratory Roller</option>
            <option value="Motor Grader">Motor Grader</option>
            <option value="Wheel Loader">Wheel Loader</option>
          </select>

          <select
            className="input-premium"
            style={{ width: 'auto', height: '40px', padding: '0 12px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Semua Status</option>
            <option value="AVAILABLE">AVAILABLE (Tersedia)</option>
            <option value="RENTED">RENTED (Disewa)</option>
            <option value="MAINTENANCE">MAINTENANCE (Servis)</option>
            <option value="UNAVAILABLE">UNAVAILABLE (Nonaktif)</option>
          </select>
        </div>
      </div>

      {/* Equipments Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode Unit</th>
              <th>Nama & Tipe Mesin</th>
              <th>Brand & Model</th>
              <th>Hour Meter (HM)</th>
              <th>Tarif Sewa / Hari</th>
              <th>Status Unit</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipments.map((eq) => (
              <tr key={eq.id}>
                <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                  {eq.equipment_code}
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#1E293B' }}>{eq.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-secondary-light)' }}>{eq.type}</div>
                </td>
                <td style={{ fontSize: '13px' }}>
                  <strong>{eq.brand}</strong> &bull; {eq.model}
                </td>
                <td className="hour-meter" style={{ fontSize: '13px', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Gauge size={14} color="var(--color-primary)" />
                    <span>{Number(eq.hour_meter).toFixed(2)} jam</span>
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px' }}>
                  {formatRupiah(Number(eq.rental_price_per_day))}
                </td>
                <td>
                  <span className={`badge badge-${eq.status.toLowerCase()}`}>
                    {eq.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEdit(eq)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      title="Ubah Rincian Unit"
                    >
                      <Edit size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus unit ${eq.equipment_code}?`)) {
                          onDeleteEquipment(eq.id);
                        }
                      }}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px', color: '#EF4444' }}
                      title="Hapus Unit"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingItem ? `Perbarui Data Alat Berat: ${editingItem.equipment_code}` : 'Tambah Unit Alat Berat Baru'}
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Kode Registrasi Unit
              </label>
              <input
                type="text"
                className="input-premium"
                required
                value={formData.equipment_code}
                onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Tipe Alat
              </label>
              <select
                className="input-premium"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Excavator">Excavator</option>
                <option value="Bulldozer">Bulldozer</option>
                <option value="Crane">Crane</option>
                <option value="Vibratory Roller">Vibratory Roller</option>
                <option value="Motor Grader">Motor Grader</option>
                <option value="Wheel Loader">Wheel Loader</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Nama Lengkap Unit Alat Berat
            </label>
            <input
              type="text"
              className="input-premium"
              required
              placeholder="Contoh: Hydraulic Excavator Komatsu PC200-8"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Merk / Brand
              </label>
              <input
                type="text"
                className="input-premium"
                required
                placeholder="Komatsu / Caterpillar / Tadano"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Model / Seri
              </label>
              <input
                type="text"
                className="input-premium"
                required
                placeholder="PC200-8 / D6R / GR-500EX"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Akumulasi Hour Meter (HM)
              </label>
              <input
                type="number"
                step="0.1"
                className="input-premium"
                required
                value={formData.hour_meter}
                onChange={(e) => setFormData({ ...formData, hour_meter: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Tarif Sewa Harian (IDR)
              </label>
              <input
                type="number"
                className="input-premium"
                required
                value={formData.rental_price_per_day}
                onChange={(e) => setFormData({ ...formData, rental_price_per_day: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Status Operasional Saat Ini
            </label>
            <select
              className="input-premium"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Equipment['status'] })}
            >
              <option value="AVAILABLE">AVAILABLE (Tersedia & Siap Sewa)</option>
              <option value="RENTED">RENTED (Sedang Digunakan Proyek)</option>
              <option value="MAINTENANCE">MAINTENANCE (Dalam Perawatan Mekanik)</option>
              <option value="UNAVAILABLE">UNAVAILABLE (Tidak Dapat Dioperasikan)</option>
            </select>
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
              {editingItem ? 'Simpan Perubahan' : 'Daftarkan Alat Berat'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
