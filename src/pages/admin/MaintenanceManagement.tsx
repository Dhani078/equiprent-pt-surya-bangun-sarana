import React, { useState } from 'react';
import { Maintenance, Equipment, User } from '../../types';
import { Plus, Search, Wrench, CheckCircle, Clock, Calendar } from 'lucide-react';
import { Modal } from '../../components/Modal';

interface MaintenanceManagementProps {
  maintenance: Maintenance[];
  equipments: Equipment[];
  users: User[];
  onScheduleMaintenance: (item: Omit<Maintenance, 'id' | 'maintenance_code'>) => Promise<any>;
}

export const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({
  maintenance,
  equipments,
  users,
  onScheduleMaintenance
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const technicians = users.filter(u => u.role_id === 2); // Staff / Mekanik

  const [formData, setFormData] = useState({
    equipment_id: equipments[0]?.id || 1,
    scheduled_date: new Date().toISOString().slice(0, 10),
    maintenance_type: 'PREVENTIVE' as Maintenance['maintenance_type'],
    hour_meter_at_maintenance: 1250.0,
    description: 'Servis berkala rutin ganti oli & filter hidrolik',
    spareparts_replaced: 'Oli Meditran SX, Filter Oli Komatsu',
    cost: 4500000,
    technician_id: technicians[0]?.id || 4
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eq = equipments.find(e => e.id === Number(formData.equipment_id));
    const tech = users.find(u => u.id === Number(formData.technician_id));

    await onScheduleMaintenance({
      equipment_id: Number(formData.equipment_id),
      equipment_name: eq?.name,
      equipment_code: eq?.equipment_code,
      scheduled_date: formData.scheduled_date,
      maintenance_type: formData.maintenance_type,
      hour_meter_at_maintenance: Number(formData.hour_meter_at_maintenance),
      description: formData.description,
      spareparts_replaced: formData.spareparts_replaced,
      cost: Number(formData.cost),
      technician_id: Number(formData.technician_id),
      technician_name: tech?.full_name,
      status: 'SCHEDULED'
    });

    setIsModalOpen(false);
  };

  const filteredItems = maintenance.filter((m) => {
    const matchesSearch = m.maintenance_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.equipment_name && m.equipment_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'ALL' || m.maintenance_type === filterType;
    return matchesSearch && matchesType;
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
            Manajemen Pemeliharaan & Servis Mesin
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-light)', margin: '4px 0 0 0' }}>
            Jadwal perawatan preventif, kalibrasi Hour Meter, dan riwayat pergantian spare parts unit.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '9px 16px', fontSize: '13.5px' }}>
          <Plus size={16} />
          <span>Jadwalkan Servis</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card-premium" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }} />
          <input
            type="text"
            className="input-premium"
            placeholder="Cari kode servis (MNT-SBS...), alat berat, atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <select
          className="input-premium"
          style={{ width: 'auto', height: '40px', padding: '0 12px' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">Semua Jenis Perawatan</option>
          <option value="PREVENTIVE">PREVENTIVE (Rutin Berkala)</option>
          <option value="CORRECTIVE">CORRECTIVE (Perbaikan Kerusakan)</option>
          <option value="OVERHAUL">OVERHAUL (Turun Mesin Total)</option>
        </select>
      </div>

      {/* Maintenance Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode Servis</th>
              <th>Unit Alat Berat</th>
              <th>Tipe & Hour Meter</th>
              <th>Deskripsi & Spareparts</th>
              <th>Teknisi Bertugas</th>
              <th>Biaya Servis</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((m) => (
              <tr key={m.id}>
                <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                  {m.maintenance_code}
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#1E293B' }}>{m.equipment_name}</div>
                  <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>{m.equipment_code}</span>
                </td>
                <td>
                  <span className="badge badge-info" style={{ fontSize: '10.5px' }}>
                    {m.maintenance_type}
                  </span>
                  <div className="hour-meter" style={{ fontSize: '11.5px', color: 'var(--color-secondary)', marginTop: '4px' }}>
                    HM: {m.hour_meter_at_maintenance} jam
                  </div>
                </td>
                <td style={{ maxWidth: '280px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{m.description}</div>
                  {m.spareparts_replaced && (
                    <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)', marginTop: '2px' }}>
                      Part: {m.spareparts_replaced}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: '12.5px' }}>
                  <strong>{m.technician_name || 'Tim Mekanik SBS'}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>Jadwal: {m.scheduled_date}</div>
                </td>
                <td style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                  {formatRupiah(Number(m.cost))}
                </td>
                <td>
                  <span className={`badge badge-${m.status.toLowerCase()}`}>
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Schedule Maintenance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jadwalkan Pemeliharaan Alat Berat"
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Pilih Unit Alat Berat
            </label>
            <select
              className="input-premium"
              value={formData.equipment_id}
              onChange={(e) => {
                const eqId = Number(e.target.value);
                const eq = equipments.find(x => x.id === eqId);
                setFormData({
                  ...formData,
                  equipment_id: eqId,
                  hour_meter_at_maintenance: Number(eq?.hour_meter || 0)
                });
              }}
            >
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.equipment_code} - {eq.name} (HM: {eq.hour_meter} jam)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Tanggal Pelaksanaan
              </label>
              <input
                type="date"
                className="input-premium"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Kategori Servis
              </label>
              <select
                className="input-premium"
                value={formData.maintenance_type}
                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value as any })}
              >
                <option value="PREVENTIVE">PREVENTIVE (Servis Rutin Berkala)</option>
                <option value="CORRECTIVE">CORRECTIVE (Perbaikan Kerusakan)</option>
                <option value="OVERHAUL">OVERHAUL (Perombakan Besar)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Hour Meter Saat Servis
              </label>
              <input
                type="number"
                step="0.1"
                className="input-premium"
                required
                value={formData.hour_meter_at_maintenance}
                onChange={(e) => setFormData({ ...formData, hour_meter_at_maintenance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Estimasi Biaya Servis (IDR)
              </label>
              <input
                type="number"
                className="input-premium"
                required
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Teknisi / Mekanik Bertanggung Jawab
            </label>
            <select
              className="input-premium"
              value={formData.technician_id}
              onChange={(e) => setFormData({ ...formData, technician_id: Number(e.target.value) })}
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Deskripsi Pekerjaan Servis
            </label>
            <textarea
              className="input-premium"
              rows={2}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Daftar Suku Cadang Diganti (Spareparts)
            </label>
            <input
              type="text"
              className="input-premium"
              value={formData.spareparts_replaced}
              onChange={(e) => setFormData({ ...formData, spareparts_replaced: e.target.value })}
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
              Simpan Jadwal Servis
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
