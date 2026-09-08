import React, { useState, useMemo } from 'react';
import { Maintenance, Equipment, User } from '../../types';
import { Plus, Search, Filter, Wrench, CheckCircle, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { getEquipmentImage } from '../../lib/stitchAssets';
import { getUnitsDueForService, formatRupiah, SERVICE_INTERVAL_HM } from '../../lib/businessRules';

interface MaintenanceManagementProps {
  maintenance: Maintenance[];
  equipments: Equipment[];
  users: User[];
  onScheduleMaintenance: (item: Omit<Maintenance, 'id' | 'maintenance_code'>) => Promise<void>;
}

export const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({
  maintenance,
  equipments,
  users,
  onScheduleMaintenance
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    equipment_id: equipments[0]?.id || 1,
    scheduled_date: new Date().toISOString().slice(0, 10),
    completion_date: '',
    maintenance_type: 'PREVENTIVE' as Maintenance['maintenance_type'],
    hour_meter_at_maintenance: 1200.0,
    description: 'Servis rutin kelipatan 250 jam kerja mesin',
    spareparts_replaced: 'Oli Meditran SX, Filter Oli Komatsu',
    cost: 3500000,
    technician_id: users.find(u => u.role_id === 2)?.id || 4,
    status: 'SCHEDULED' as Maintenance['status']
  });

  const technicians = users.filter(u => u.role_id === 2);

  /**
   * Unit yang sudah / mendekati jadwal servis berbasis aturan 250 HM.
   * Di-memo agar tidak dihitung ulang pada setiap render.
   */
  const serviceAlerts = useMemo(
    () => getUnitsDueForService(equipments, maintenance),
    [equipments, maintenance]
  );

  /** Jumlah unit yang sudah lewat batas (butuh tindakan segera). */
  const overdueCount = useMemo(
    () => serviceAlerts.filter(a => a.status.isDue).length,
    [serviceAlerts]
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eq = equipments.find(e => e.id === Number(formData.equipment_id));
    const tech = users.find(u => u.id === Number(formData.technician_id));

    await onScheduleMaintenance({
      equipment_id: Number(formData.equipment_id),
      equipment_name: eq?.name,
      equipment_code: eq?.equipment_code,
      scheduled_date: formData.scheduled_date,
      completion_date: formData.completion_date || null,
      maintenance_type: formData.maintenance_type,
      hour_meter_at_maintenance: Number(formData.hour_meter_at_maintenance),
      description: formData.description,
      spareparts_replaced: formData.spareparts_replaced,
      cost: Number(formData.cost),
      technician_id: Number(formData.technician_id),
      technician_name: tech?.full_name || 'Teknisi Lapangan',
      status: formData.status
    });

    setIsModalOpen(false);
  };

  const filteredMaintenance = maintenance.filter((m) => {
    const matchesSearch = m.maintenance_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.equipment_name && m.equipment_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.technician_name && m.technician_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            Manajemen Perawatan & Servis Armada (Hour Meter)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary)', margin: '4px 0 0 0' }}>
            Penjadwalan servis berkala kelipatan HM, perbaikan insidental (corrective), dan log pergantian suku cadang.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '9px 16px', fontSize: '13.5px' }}>
          <Plus size={16} />
          <span>Jadwalkan Perawatan</span>
        </button>
      </div>

      {/* Panel Peringatan Servis Berbasis 250 HM */}
      {serviceAlerts.length > 0 && (
        <div
          className="card-premium animate-fade-in"
          style={{
            padding: '16px 18px',
            borderLeft: `4px solid ${overdueCount > 0 ? '#DC2626' : '#F59E0B'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color={overdueCount > 0 ? '#DC2626' : '#F59E0B'} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
              Peringatan Servis Preventif (interval {SERVICE_INTERVAL_HM} HM)
            </h3>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                backgroundColor: overdueCount > 0 ? '#FEE2E2' : '#FEF3C7',
                color: overdueCount > 0 ? '#991B1B' : '#92400E',
              }}
            >
              {overdueCount} unit jatuh tempo · {serviceAlerts.length - overdueCount} unit mendekati
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {serviceAlerts.slice(0, 5).map(({ equipment, status }) => (
              <div
                key={equipment.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {equipment.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-secondary)' }}>
                    {equipment.equipment_code}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                  HM saat ini: <strong>{status.currentHM.toFixed(2)}</strong>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                  Servis berikutnya: <strong>{status.nextServiceTargetHM.toFixed(2)} HM</strong>
                </div>

                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    backgroundColor: status.isDue ? '#DC2626' : '#F59E0B',
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {status.isDue
                    ? `LEWAT ${Math.abs(Math.round(status.hmUntilNextService))} HM`
                    : `SISA ${Math.round(status.hmUntilNextService)} HM`}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      equipment_id: equipment.id,
                      hour_meter_at_maintenance: status.currentHM,
                    }));
                    setIsModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{ padding: '5px 12px', fontSize: '11.5px' }}
                >
                  Jadwalkan
                </button>
              </div>
            ))}
          </div>

          {serviceAlerts.length > 5 && (
            <p style={{ fontSize: '11.5px', color: 'var(--color-secondary)', margin: '10px 0 0 0' }}>
              Dan {serviceAlerts.length - 5} unit lainnya memerlukan perhatian.
            </p>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card-premium" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }} />
          <input
            type="text"
            className="input-premium"
            placeholder="Cari kode servis, nama alat berat, atau nama mekanik..."
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
          <option value="ALL">Semua Status Perawatan</option>
          <option value="SCHEDULED">SCHEDULED (Terjadwal)</option>
          <option value="IN_PROGRESS">IN_PROGRESS (Sedang Dikerjakan)</option>
          <option value="COMPLETED">COMPLETED (Selesai)</option>
        </select>
      </div>

      {/* Table with Thumbnails */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode Servis</th>
              <th>Unit Alat Berat</th>
              <th>Tipe Servis</th>
              <th>HM Saat Servis</th>
              <th>Rincian & Suku Cadang</th>
              <th>Mekanik Bertugas</th>
              <th>Biaya Servis</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaintenance.map((m) => {
              const imgUrl = getEquipmentImage(m.equipment_code);
              return (
                <tr key={m.id}>
                  <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                    {m.maintenance_code}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={imgUrl} alt={m.equipment_name} style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{m.equipment_name}</div>
                        <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{m.equipment_code}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: '11px' }}>
                      {m.maintenance_type}
                    </span>
                  </td>
                  <td className="hour-meter" style={{ fontSize: '13px', fontWeight: 600 }}>
                    {Number(m.hour_meter_at_maintenance).toFixed(2)} jam
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    <div>{m.description}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Part: {m.spareparts_replaced || '-'}</div>
                  </td>
                  <td style={{ fontSize: '12.5px' }}>
                    <strong>{m.technician_name || 'Ahmad Ridwan (Mekanik)'}</strong>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', fontFamily: 'monospace' }}>
                    {formatRupiah(Number(m.cost))}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge badge-${m.status.toLowerCase()}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Schedule Maintenance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jadwalkan Perawatan Alat Berat"
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Pilih Alat Berat
            </label>
            <select
              className="input-premium"
              value={formData.equipment_id}
              onChange={(e) => {
                const eq = equipments.find(item => item.id === Number(e.target.value));
                setFormData({
                  ...formData,
                  equipment_id: Number(e.target.value),
                  hour_meter_at_maintenance: eq?.hour_meter || 0
                });
              }}
            >
              {equipments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.equipment_code} - {e.name} (HM: {e.hour_meter} jam)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Jenis Pemeliharaan
              </label>
              <select
                className="input-premium"
                value={formData.maintenance_type}
                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value as any })}
              >
                <option value="PREVENTIVE">PREVENTIVE (Rutin / Berkala)</option>
                <option value="CORRECTIVE">CORRECTIVE (Perbaikan Kerusakan)</option>
                <option value="INSPECTION">INSPECTION (Inspeksi Fisik)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Hour Meter (HM) Unit
              </label>
              <input
                type="number"
                step="0.1"
                className="input-premium"
                value={formData.hour_meter_at_maintenance}
                onChange={(e) => setFormData({ ...formData, hour_meter_at_maintenance: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Tanggal Terjadwal
              </label>
              <input
                type="date"
                required
                className="input-premium"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Estimasi Biaya Servis (Rp)
              </label>
              <input
                type="number"
                className="input-premium"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Deskripsi & Keluhan Perbaikan
            </label>
            <textarea
              rows={2}
              className="input-premium"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Suku Cadang yang Diganti
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
