import React, { useState, useMemo } from 'react';
import { Maintenance, Equipment, User } from '../../types';
import { MAINTENANCE_TYPES, MAINTENANCE_TYPE_LABEL } from '../../lib/validators';
import { MaintenanceFormModal } from './maintenance/MaintenanceFormModal';
import { ServiceDueAlertPanel } from './maintenance/ServiceDueAlertPanel';
import { SparepartAlertPanel } from './maintenance/SparepartAlertPanel';
import { MaintenanceFilterBar } from './maintenance/MaintenanceFilterBar';
import { ServiceHistoryPanel } from './maintenance/ServiceHistoryPanel';
import type { MaintenanceTypeValue } from '../../lib/validators';
import { Plus, Wrench } from 'lucide-react';
import { getEquipmentImage } from '../../lib/stitchAssets';
import { getUnitsDueForService, formatRupiah, formatRupiahRingkas } from '../../lib/businessRules';
import { exportTable } from '../../lib/tableExport';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import type { ExportColumn, ExportFormat } from '../../lib/tableExport';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

interface MaintenanceManagementProps {
  maintenance: Maintenance[];
  equipments: Equipment[];
  users: User[];
  onScheduleMaintenance: (item: Omit<Maintenance, 'id' | 'maintenance_code'>) => Promise<void>;
  /** Menampilkan pesan sukses/gagal di tingkat aplikasi. */
  onNotify?: (message: string, tone: 'success' | 'error') => void;
}

export const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({
  maintenance,
  equipments,
  users,
  onScheduleMaintenance,
  onNotify
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

  // ---------------------------------------------------------------------------
  // Fitur: Riwayat Servis per Unit (drill-down log servis)
  // ---------------------------------------------------------------------------
  const [historyUnitId, setHistoryUnitId] = useState<number | 'ALL'>('ALL');

  /** Unit yang punya minimal satu catatan servis, untuk pilihan dropdown. */
  const unitsWithHistory = useMemo(() => {
    const ids = new Set(maintenance.map(m => m.equipment_id));
    return equipments.filter(e => ids.has(e.id));
  }, [equipments, maintenance]);

  /** Riwayat servis unit terpilih, diurutkan dari yang paling baru. */
  const serviceHistory = useMemo(() => {
    if (historyUnitId === 'ALL') return [];
    return maintenance
      .filter(m => m.equipment_id === historyUnitId)
      .sort((a, b) => {
        const da = a.scheduled_date ?? '';
        const db = b.scheduled_date ?? '';
        return db.localeCompare(da);
      });
  }, [maintenance, historyUnitId]);

  /** Ringkasan biaya & HM untuk unit terpilih. */
  const historySummary = useMemo(() => {
    const done = serviceHistory.filter(m => m.status === 'COMPLETED');
    return {
      totalServis: serviceHistory.length,
      selesai: done.length,
      totalBiaya: serviceHistory.reduce((s, m) => s + Number(m.cost ?? 0), 0),
      rataBiaya: serviceHistory.length
        ? serviceHistory.reduce((s, m) => s + Number(m.cost ?? 0), 0) / serviceHistory.length
        : 0,
      hmAkhir: serviceHistory[0]?.hour_meter_at_maintenance ?? 0,
    };
  }, [serviceHistory]);

  /** Ambang pemakaian suku cadang (dapat diubah Admin); persist localStorage. */
  const [sparepartThreshold, setSparepartThreshold] = useState<number>(() => {
    const v = localStorage.getItem('sbs-sparepart-threshold');
    const n = v !== null ? Number(v) : 3;
    return Number.isFinite(n) && n > 0 ? n : 3;
  });

  /** Frekuensi pemakaian tiap suku cadang dari seluruh log servis. */
  const sparepartFreq = useMemo(() => {
    const freq = new Map<string, number>();
    for (const m of maintenance) {
      if (!m.spareparts_replaced) continue;
      for (const raw of m.spareparts_replaced.split(',')) {
        const nama = raw.trim();
        if (nama) freq.set(nama, (freq.get(nama) ?? 0) + 1);
      }
    }
    return freq;
  }, [maintenance]);

  const handleThresholdChange = (val: number) => {
    const safe = Math.max(1, Math.round(val));
    setSparepartThreshold(safe);
    localStorage.setItem('sbs-sparepart-threshold', String(safe));
  };

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

  /** Kolom ekspor riwayat & jadwal perawatan. */
  const kolomEkspor: ExportColumn<Maintenance>[] = [
    { header: 'Kode Servis', value: (m) => m.maintenance_code },
    { header: 'Unit', value: (m) => m.equipment_name ?? '-' },
    { header: 'Jenis', value: (m) => m.maintenance_type },
    { header: 'Tanggal Jadwal', value: (m) => m.scheduled_date },
    { header: 'Tanggal Selesai', value: (m) => m.completion_date ?? '-' },
    { header: 'HM Saat Servis', value: (m) => m.hour_meter_at_maintenance, numeric: true },
    { header: 'Deskripsi', value: (m) => m.description },
    { header: 'Sparepart', value: (m) => m.spareparts_replaced ?? '-' },
    { header: 'Biaya', value: (m) => m.cost, numeric: true },
    { header: 'Teknisi', value: (m) => m.technician_name ?? '-' },
    { header: 'Status', value: (m) => m.status },
  ];

  /** Mengekspor data perawatan sesuai filter aktif. */
  const handleExport = (format: ExportFormat) => {
    const hasil = exportTable(format, filteredMaintenance, kolomEkspor, {
      title: 'Jadwal & Riwayat Perawatan Unit',
      subtitle: `Ditampilkan ${filteredMaintenance.length} dari ${maintenance.length} data servis`,
      filename: 'perawatan-unit',
    });
    onNotify?.(hasil.message, hasil.ok ? 'success' : 'error');
  };

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

      <ServiceDueAlertPanel
        alerts={serviceAlerts}
        overdueCount={overdueCount}
        maintenance={maintenance}
        onSchedule={(equipment, currentHM) => {
          setFormData(prev => ({ ...prev, equipment_id: equipment.id, hour_meter_at_maintenance: currentHM }));
          setIsModalOpen(true);
        }}
        onHistory={setHistoryUnitId}
      />

      <SparepartAlertPanel
        freq={sparepartFreq}
        threshold={sparepartThreshold}
        onThresholdChange={handleThresholdChange}
      />

      <ServiceHistoryPanel
        equipments={equipments}
        unitDipilih={historyUnitId}
        onPilihUnit={setHistoryUnitId}
        unitsWithHistory={unitsWithHistory}
        serviceHistory={serviceHistory}
        historySummary={historySummary}
      />
      <MaintenanceFilterBar
        searchTerm={searchTerm}
        filterStatus={filterStatus}
        onSearch={setSearchTerm}
        onFilterStatus={setFilterStatus}
        onExport={handleExport}
      />

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
                  <td className="serial-code" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-strong)' }} title={formatRupiah(Number(m.cost))}>
                    {formatRupiahRingkas(Number(m.cost)).ringkas}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <StatusBadge kind="maintenance" status={m.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredMaintenance.length === 0 && (
          <EmptyState
            pesan={searchTerm || filterStatus !== 'ALL'
              ? 'Tidak ada jadwal perawatan yang cocok'
              : 'Belum ada riwayat perawatan unit'}
            keterangan={searchTerm || filterStatus !== 'ALL'
              ? 'Ubah kata kunci pencarian atau pilih status lain pada penyaring di atas.'
              : 'Jadwalkan perawatan pertama agar keadaan unit terpantau.'}
            ariaLabel="Daftar perawatan kosong"
            ikon={Wrench}
            aksi={searchTerm || filterStatus !== 'ALL' ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setSearchTerm(''); setFilterStatus('ALL'); }}
                style={{ marginTop: '4px', padding: '7px 14px', fontSize: '12.5px' }}
              >
                Reset Penyaring
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsModalOpen(true)}
                style={{ marginTop: '4px', padding: '7px 14px', fontSize: '12.5px' }}
              >
                <Plus size={14} /> Jadwalkan Perawatan
              </button>
            )}
          />
        )}
      </div>

      <MaintenanceFormModal
        open={isModalOpen}
        equipments={equipments}
        values={formData}
        onChange={setFormData}
        onSubmit={handleFormSubmit}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
