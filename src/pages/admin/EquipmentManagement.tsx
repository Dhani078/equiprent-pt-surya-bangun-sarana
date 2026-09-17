import React, { useState } from 'react';
import { Equipment, Maintenance } from '../../types';
import { Plus, Search, Filter, Edit, Trash2, Gauge, AlertCircle, MapPin, Eye, LayoutGrid, Rows3, Wrench, CalendarClock } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { HmProgressBar } from '../../components/HmProgressBar';
import { getEquipmentImage } from '../../lib/stitchAssets';
import { formatRupiah, formatTanggal, getServiceStatus, SERVICE_INTERVAL_HM } from '../../lib/businessRules';
import { validateEquipmentInput, EQUIPMENT_TYPES } from '../../lib/validators';
import type { ValidatedEquipmentInput } from '../../lib/validators';
import { Paginator, usePagination } from '../../components/Paginator';
import { Skeleton } from '../../components/Skeleton';
import { exportTable } from '../../lib/tableExport';
import type { ExportColumn, ExportFormat } from '../../lib/tableExport';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';

const PAGE_SIZE_EQUIPMENT = 20;

type EquipmentView = 'cards' | 'table';

interface EquipmentManagementProps {
  equipments: Equipment[];
  maintenance: Maintenance[];
  onAddEquipment: (item: Omit<Equipment, 'id'>) => Promise<void>;
  onUpdateEquipment: (id: number, data: Partial<Equipment>) => Promise<void>;
  onDeleteEquipment: (id: number) => Promise<void>;
  /** Menjadwalkan servis preventif langsung dari kartu unit (T-0048). */
  onScheduleMaintenance: (item: Omit<Maintenance, 'id' | 'maintenance_code'>) => Promise<void>;
  /** Menampilkan pesan sukses/gagal di tingkat aplikasi. */
  onNotify?: (message: string, tone: 'success' | 'error') => void;
  onNavigateTracking?: () => void;
  /** Tampilkan skeleton saat data sedang dimuat. */
  isLoading?: boolean;
}

export const EquipmentManagement: React.FC<EquipmentManagementProps> = ({
  equipments,
  maintenance,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onScheduleMaintenance,
  onNotify,
  onNavigateTracking,
  isLoading = false,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  /** Unit yang sedang menunggu konfirmasi hapus. */
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<Equipment | null>(null);
  /** Galat per-field dari validator terpusat (kunci = nama field form). */
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ValidatedEquipmentInput, string>>>({});
  /** Galat tingkat form: misal kode unit sudah dipakai (dari server). */
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Tata letak kartu unit (default) atau tabel ringkas (T-0048). */
  const [view, setView] = useState<EquipmentView>('cards');
  /** Sedang menjadwalkan servis untuk unit ini (quick-action kartu). */
  const [schedulingId, setSchedulingId] = useState<number | null>(null);

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
    thumbnail_url: ''
  });

  const handleOpenAdd = () => {
    // Kode saran dibuat dari nomor urut maksimum + 1 agar tidak bentrok
    // dengan unit yang sudah ada (bahkan bila ada unit yang pernah dihapus).
    const nextNum = equipments.reduce((maks, e) => Math.max(maks, e.id), 0) + 1;
    setFormData({
      equipment_code: `EQ-SBS-2026-${String(nextNum).padStart(3, '0')}`,
      name: '',
      type: 'Excavator',
      model: 'PC200-8',
      brand: 'Komatsu',
      hour_meter: 0,
      rental_price_per_day: 2500000,
      status: 'AVAILABLE',
      last_maintenance_date: new Date().toISOString().slice(0, 10),
      thumbnail_url: ''
    });
    setEditingItem(null);
    setFormErrors({});
    setFormError(null);
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
    setFormErrors({});
    setFormError(null);
    setIsAddModalOpen(true);
  };

  /** Menutup modal sekaligus membersihkan seluruh penanda galat. */
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
    setFormErrors({});
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validasi memakai modul yang SAMA dengan server, sehingga pesan galat
    // di layar identik dengan respons API.
    const hasil = validateEquipmentInput(formData);
    if (!hasil.ok) {
      setFormErrors(hasil.errors);
      setFormError(null);
      return;
    }

    setFormErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const input: ValidatedEquipmentInput = hasil.value;

    try {
      if (editingItem) {
        await onUpdateEquipment(editingItem.id, input);
        onNotify?.(`Unit ${input.equipment_code} berhasil diperbarui.`, 'success');
      } else {
        await onAddEquipment(input);
        onNotify?.(`Unit ${input.equipment_code} berhasil ditambahkan ke armada.`, 'success');
      }
      handleCloseModal();
    } catch (err) {
      // Pesan dari server (misal kode unit sudah dipakai) ditampilkan apa adanya.
      const pesan = err instanceof Error && err.message ? err.message : 'Gagal menyimpan data unit.';
      setFormError(pesan);
      onNotify?.(pesan, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEquipments = equipments.filter((eq) => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.equipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || eq.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || eq.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const [equipPage, setEquipPage] = useState(1);
  // Reset ke halaman 1 bila filter berubah.
  React.useEffect(() => setEquipPage(1), [searchTerm, filterType, filterStatus]);
  const pagedEquipments = usePagination(filteredEquipments, PAGE_SIZE_EQUIPMENT, equipPage);

  // Mini Bento Stats
  const totalUnit = equipments.length;
  const availableUnit = equipments.filter(e => e.status === 'AVAILABLE').length;
  const rentedUnit = equipments.filter(e => e.status === 'RENTED').length;
  const maintenanceUnit = equipments.filter(e => e.status === 'MAINTENANCE').length;

  /**
   * Unit yang tidak boleh dihapus: sedang disewa atau sedang dirawat.
   * Menghapusnya akan memutus referensi riwayat rental & laporan.
   */
  /** Kolom yang ikut diekspor ke CSV/Excel/PDF. */
  const kolomEkspor: ExportColumn<Equipment>[] = [
    { header: 'Kode Unit', value: (e) => e.equipment_code },
    { header: 'Nama Alat', value: (e) => e.name },
    { header: 'Tipe', value: (e) => e.type },
    { header: 'Merk', value: (e) => e.brand },
    { header: 'Model', value: (e) => e.model },
    { header: 'Hour Meter', value: (e) => e.hour_meter, numeric: true },
    { header: 'Tarif / Hari', value: (e) => e.rental_price_per_day, numeric: true },
    { header: 'Status', value: (e) => e.status },
    { header: 'Servis Terakhir', value: (e) => e.last_maintenance_date ?? '-' },
  ];

  /** Mengekspor daftar unit yang sedang tampil (mengikuti filter aktif). */
  const handleExport = (format: ExportFormat) => {
    const hasil = exportTable(format, filteredEquipments, kolomEkspor, {
      title: 'Daftar Inventaris Alat Berat',
      subtitle: `Ditampilkan ${filteredEquipments.length} dari ${equipments.length} unit`,
      filename: 'inventaris-alat-berat',
    });
    onNotify?.(hasil.message, hasil.ok ? 'success' : 'error');
  };

  const isProtected = (status: Equipment['status']): boolean =>
    status === 'RENTED' || status === 'MAINTENANCE';

  /**
   * Quick-action dari kartu unit: jadwalkan servis preventif untuk unit yang
   * mendekati atau sudah lewat ambang 250 HM. Unit yang sedang diservis
   * tidak ditawari aksi ini (sudah ditangani di halaman Maintenance).
   */
  const handleQuickSchedule = async (eq: Equipment) => {
    if (schedulingId !== null) return;
    setSchedulingId(eq.id);
    try {
      const svc = getServiceStatus(eq, maintenance);
      await onScheduleMaintenance({
        equipment_id: eq.id,
        equipment_name: eq.name,
        equipment_code: eq.equipment_code,
        scheduled_date: new Date().toISOString().slice(0, 10),
        completion_date: null,
        maintenance_type: 'PREVENTIVE',
        hour_meter_at_maintenance: svc.currentHM,
        description: `Servis preventif kelipatan ${SERVICE_INTERVAL_HM} HM — dijadwalkan dari kartu unit (sisa ${svc.hmUntilNextService.toFixed(2)} HM).`,
        spareparts_replaced: '',
        cost: 0,
        technician_id: null,
        technician_name: '',
        status: 'SCHEDULED',
      });
      onNotify?.(`Servis preventif ${eq.equipment_code} berhasil dijadwalkan.`, 'success');
    } catch (err) {
      const pesan = err instanceof Error && err.message ? err.message : 'Gagal menjadwalkan servis.';
      onNotify?.(pesan, 'error');
    } finally {
      setSchedulingId(null);
    }
  };

  if (isLoading) {
    return (
      <div
        className="animate-fade-in"
        aria-busy="true"
        aria-label="Memuat data unit alat berat"
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        {/* Header placeholder — tinggi sama dengan header asli. */}
        <Skeleton height="60px" />
        {/* Bento mini stats — 4 kartu. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height="82px" />
          ))}
        </div>
        {/* Filter bar. */}
        <Skeleton height="72px" />
        {/* Grid 3 kolom × 6 kartu — meniru tata letak kartu unit sesungguhnya. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height="220px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            Equipment Inventory & Fleet Monitoring
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary)', margin: '4px 0 0 0' }}>
            Kelola dan pantau status seluruh unit alat berat PT. Surya Bangun Sarana Banjarmasin.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Beralih antara tampilan kartu unit (T-0048) dan tabel ringkas. */}
          <div
            role="group"
            aria-label="Tampilan daftar unit"
            className="card-premium"
            style={{ display: 'flex', padding: '3px', gap: '2px', borderRadius: '10px' }}
          >
            <button
              type="button"
              onClick={() => setView('cards')}
              className="btn-secondary"
              aria-pressed={view === 'cards'}
              aria-label="Tampilan kartu unit"
              title="Tampilan kartu unit"
              style={{
                padding: '7px 11px',
                fontSize: '12px',
                gap: '6px',
                opacity: view === 'cards' ? 1 : 0.55,
                boxShadow: view === 'cards' ? 'inset 0 0 0 1px var(--color-primary)' : 'none',
              }}
            >
              <LayoutGrid size={14} />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className="btn-secondary"
              aria-pressed={view === 'table'}
              aria-label="Tampilan tabel"
              title="Tampilan tabel"
              style={{
                padding: '7px 11px',
                fontSize: '12px',
                gap: '6px',
                opacity: view === 'table' ? 1 : 0.55,
                boxShadow: view === 'table' ? 'inset 0 0 0 1px var(--color-primary)' : 'none',
              }}
            >
              <Rows3 size={14} />
              <span>Tabel</span>
            </button>
          </div>
          <button onClick={handleOpenAdd} className="btn-primary" style={{ padding: '9px 16px', fontSize: '13.5px' }}>
            <Plus size={16} />
            <span>Tambah Alat Baru</span>
          </button>
        </div>
      </div>

      {/* Bento Mini Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        <div className="card-premium" style={{ padding: '16px' }}>
          <p style={{ fontSize: '11px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 6px 0', fontFamily: 'monospace' }}>
            Total Unit
          </p>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
            {totalUnit} Unit
          </div>
        </div>

        <div className="card-premium" style={{ padding: '16px' }}>
          <p style={{ fontSize: '11px', color: '#059669', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 6px 0', fontFamily: 'monospace' }}>
            Tersedia
          </p>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
            {availableUnit} Unit
          </div>
        </div>

        <div className="card-premium" style={{ padding: '16px' }}>
          <p style={{ fontSize: '11px', color: '#2563EB', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 6px 0', fontFamily: 'monospace' }}>
            Disewa (Aktif)
          </p>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>
            {rentedUnit} Unit
          </div>
        </div>

        <div className="card-premium" style={{ padding: '16px' }}>
          <p style={{ fontSize: '11px', color: '#D97706', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 6px 0', fontFamily: 'monospace' }}>
            Maintenance
          </p>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#D97706', fontFamily: 'monospace' }}>
            {maintenanceUnit} Unit
          </div>
        </div>
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
            <option value="ALL">Semua Kategori Alat</option>
            {EQUIPMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
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

          {/* Ekspor data sesuai filter aktif */}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleExport('csv')}
            title="Unduh CSV"
            style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
          >
            <Download size={15} /> CSV
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleExport('excel')}
            title="Unduh Excel"
            style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
          >
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleExport('pdf')}
            title="Cetak / simpan PDF"
            style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
          >
            <FileText size={15} /> PDF
          </button>
        </div>
      </div>

      {/* Daftar unit: kartu (T-0048) atau tabel ringkas */}
      {view === 'cards' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {pagedEquipments.map((eq) => {
            const imgUrl = eq.thumbnail_url || getEquipmentImage(eq.equipment_code, eq.type);
            const svc = getServiceStatus(eq, maintenance);
            const needsService = svc.isDue || svc.isApproaching;
            const busy = schedulingId === eq.id;
            return (
              <div
                key={eq.id}
                className="card-premium hover-lift"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '14px',
                  cursor: 'default',
                  borderColor: svc.isDue ? '#FECACA' : undefined,
                }}
              >
                {/* Header kartu: badge status + ringkasan identitas (T-0048) */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <img
                    src={imgUrl}
                    alt={eq.name}
                    loading="lazy"
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      backgroundColor: '#E2E8F0',
                      border: '1px solid var(--color-border)',
                      flexShrink: 0,
                    }}
                  />
                  <span className={`badge badge-${eq.status.toLowerCase()}`}>
                    {eq.status === 'AVAILABLE' ? 'Tersedia' : eq.status === 'RENTED' ? 'Disewa' : eq.status === 'MAINTENANCE' ? 'Servis' : 'Nonaktif'}
                  </span>
                </div>

                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-primary)', lineHeight: 1.3 }}>
                    {eq.name}
                  </div>
                  <div className="serial-code" style={{ fontSize: '11.5px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                    {eq.equipment_code}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                    {eq.brand} &bull; {eq.model} &bull; {eq.type}
                  </div>
                </div>

                {/* Bar progress HM + tooltip (T-0047) */}
                <HmProgressBar equipment={eq} maintenanceHistory={maintenance} />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: '10px',
                    borderTop: '1px dashed var(--color-border)',
                    paddingTop: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10.5px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Tarif / Hari
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A', fontFamily: 'monospace' }}>
                      {formatRupiah(Number(eq.rental_price_per_day))}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--color-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarClock size={11} />
                      <span>Servis terakhir: {eq.last_maintenance_date ? formatTanggal(eq.last_maintenance_date) : 'belum ada'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick action: hanya untuk unit yang butuh servis (T-0048) */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(eq)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '8px 10px', fontSize: '12px', gap: '6px' }}
                    title="Ubah Rincian Unit"
                  >
                    <Edit size={13} />
                    <span>Ubah</span>
                  </button>
                  {needsService && eq.status !== 'MAINTENANCE' && (
                    <button
                      type="button"
                      onClick={() => handleQuickSchedule(eq)}
                      disabled={busy}
                      className="btn-secondary"
                      aria-label={`Jadwalkan servis ${eq.equipment_code}`}
                      title={svc.isDue ? 'Sudah lewat jadwal servis — jadwalkan sekarang' : 'Mendekati ambang servis — jadwalkan'}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        fontSize: '12px',
                        gap: '6px',
                        color: svc.isDue ? '#DC2626' : '#B45309',
                        borderColor: svc.isDue ? '#FECACA' : '#FDE68A',
                        opacity: busy ? 0.6 : 1,
                        cursor: busy ? 'wait' : 'pointer',
                      }}
                    >
                      <Wrench size={13} />
                      <span>{busy ? 'Menjadwalkan…' : 'Jadwalkan Servis'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode Alat</th>
              <th>Nama & Visual Unit</th>
              <th>Kategori</th>
              <th>Hour Meter (HM)</th>
              <th style={{ textAlign: 'right' }}>Harga Sewa / Hari</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pagedEquipments.map((eq) => {
              const imgUrl = eq.thumbnail_url || getEquipmentImage(eq.equipment_code, eq.type);
              return (
                <tr key={eq.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                    {eq.equipment_code}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={imgUrl}
                        alt={eq.name}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          backgroundColor: '#E2E8F0',
                          border: '1px solid var(--color-border)',
                          flexShrink: 0
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#1E293B' }}>{eq.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-secondary)' }}>
                          {eq.brand} &bull; {eq.model}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
                    {eq.type}
                  </td>
                  <td className="hour-meter" style={{ fontSize: '13px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Gauge size={14} color="var(--color-primary)" />
                      <span>{Number(eq.hour_meter).toFixed(2)} jam</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {formatRupiah(Number(eq.rental_price_per_day))}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge badge-${eq.status.toLowerCase()}`}>
                      {eq.status === 'AVAILABLE' ? 'Tersedia' : eq.status === 'RENTED' ? 'Disewa' : eq.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
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
                        onClick={() => setConfirmDeleteItem(eq)}
                        disabled={isProtected(eq.status)}
                        className="btn-secondary"
                        style={{
                          padding: '6px 10px',
                          fontSize: '12px',
                          color: '#EF4444',
                          opacity: isProtected(eq.status) ? 0.45 : 1,
                          cursor: isProtected(eq.status) ? 'not-allowed' : 'pointer',
                        }}
                        title={
                          isProtected(eq.status)
                            ? 'Unit sedang disewa — selesaikan transaksinya dulu'
                            : 'Hapus Unit'
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Paginator
          total={filteredEquipments.length}
          page={equipPage}
          limit={PAGE_SIZE_EQUIPMENT}
          onPageChange={setEquipPage}
        />
      </div>
      )}

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? `Perbarui Data Alat Berat: ${editingItem.equipment_code}` : 'Tambah Unit Alat Berat Baru'}
      >
        <form onSubmit={handleFormSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Ringkasan galat: muncul bila server menolak (kode unit sudah dipakai). */}
          {formError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '12.5px',
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{formError}</span>
            </div>
          )}

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
                onChange={(e) => {
                  setFormData({ ...formData, equipment_code: e.target.value });
                  setFormErrors({ ...formErrors, equipment_code: undefined });
                }}
                aria-invalid={Boolean(formErrors.equipment_code)}
                aria-label="Kode registrasi unit"
                style={formErrors.equipment_code ? { borderColor: '#F87171' } : undefined}
              />
              {formErrors.equipment_code && (
                <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#DC2626' }}>
                  {formErrors.equipment_code}
                </p>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Kategori Alat
              </label>
              <select
                className="input-premium"
                value={formData.type}
                onChange={(e) => {
                  setFormData({ ...formData, type: e.target.value });
                  setFormErrors({ ...formErrors, type: undefined });
                }}
                aria-invalid={Boolean(formErrors.type)}
                aria-label="Kategori alat berat"
                style={formErrors.type ? { borderColor: '#F87171' } : undefined}
              >
                {EQUIPMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {formErrors.type && (
                <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#DC2626' }}>
                  {formErrors.type}
                </p>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Nama Lengkap Alat Berat
            </label>
            <input
              type="text"
              className="input-premium"
              required
              placeholder="Contoh: Hydraulic Excavator Komatsu PC200-8"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setFormErrors({ ...formErrors, name: undefined });
              }}
              aria-invalid={Boolean(formErrors.name)}
              aria-label="Nama lengkap alat berat"
              style={formErrors.name ? { borderColor: '#F87171' } : undefined}
            />
            {formErrors.name && (
              <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#DC2626' }}>
                {formErrors.name}
              </p>
            )}
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
                placeholder="Komatsu / Caterpillar / Sakai"
                value={formData.brand}
                onChange={(e) => {
                  setFormData({ ...formData, brand: e.target.value });
                  setFormErrors({ ...formErrors, brand: undefined });
                }}
                aria-invalid={Boolean(formErrors.brand)}
                aria-label="Merk alat berat"
                style={formErrors.brand ? { borderColor: '#F87171' } : undefined}
              />
              {formErrors.brand && (
                <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#DC2626' }}>
                  {formErrors.brand}
                </p>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Model / Seri Mesin
              </label>
              <input
                type="text"
                className="input-premium"
                required
                placeholder="PC200-8 / D85ESS-2 / SV520"
                value={formData.model}
                onChange={(e) => {
                  setFormData({ ...formData, model: e.target.value });
                  setFormErrors({ ...formErrors, model: undefined });
                }}
                aria-invalid={Boolean(formErrors.model)}
                aria-label="Model atau seri mesin"
                style={formErrors.model ? { borderColor: '#F87171' } : undefined}
              />
              {formErrors.model && (
                <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#DC2626' }}>
                  {formErrors.model}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Hour Meter (HM) Awal
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                className="input-premium"
                required
                value={formData.hour_meter}
                onChange={(e) => {
                  setFormData({ ...formData, hour_meter: Number(e.target.value) });
                  setFormErrors({ ...formErrors, hour_meter: undefined });
                }}
                aria-invalid={Boolean(formErrors.hour_meter)}
                aria-label="Hour Meter awal"
                style={formErrors.hour_meter ? { borderColor: '#F87171' } : undefined}
              />
              {formErrors.hour_meter && (
                <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#DC2626' }}>
                  {formErrors.hour_meter}
                </p>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Tarif Sewa Per Hari (Rp)
              </label>
              <input
                type="number"
                min={0}
                step={100000}
                className="input-premium"
                required
                value={formData.rental_price_per_day}
                onChange={(e) => {
                  setFormData({ ...formData, rental_price_per_day: Number(e.target.value) });
                  setFormErrors({ ...formErrors, rental_price_per_day: undefined });
                }}
                aria-invalid={Boolean(formErrors.rental_price_per_day)}
                aria-label="Tarif sewa per hari"
                style={formErrors.rental_price_per_day ? { borderColor: '#F87171' } : undefined}
              />
              {formErrors.rental_price_per_day && (
                <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#DC2626' }}>
                  {formErrors.rental_price_per_day}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Status Operasional
              </label>
              <select
                className="input-premium"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Equipment['status'] })}
              >
                <option value="AVAILABLE">AVAILABLE (Tersedia)</option>
                <option value="RENTED">RENTED (Disewa)</option>
                <option value="MAINTENANCE">MAINTENANCE (Perawatan)</option>
                <option value="UNAVAILABLE">UNAVAILABLE (Non-Aktif)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Tanggal Servis Terakhir
              </label>
              <input
                type="date"
                className="input-premium"
                value={formData.last_maintenance_date}
                onChange={(e) => {
                  setFormData({ ...formData, last_maintenance_date: e.target.value });
                  setFormErrors({ ...formErrors, last_maintenance_date: undefined });
                }}
                aria-invalid={Boolean(formErrors.last_maintenance_date)}
                aria-label="Tanggal servis terakhir"
                style={formErrors.last_maintenance_date ? { borderColor: '#F87171' } : undefined}
              />
              {formErrors.last_maintenance_date && (
                <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#DC2626' }}>
                  {formErrors.last_maintenance_date}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={isSubmitting ? { opacity: 0.6, cursor: 'wait' } : undefined}
            >
              <span>{isSubmitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Unit'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Konfirmasi Hapus Unit */}
      <ConfirmDialog
        open={confirmDeleteItem !== null}
        title="Hapus Unit Alat Berat"
        message={
          <>
            Hapus unit <strong>{confirmDeleteItem?.equipment_code}</strong> — {confirmDeleteItem?.name}?{' '}
            Tindakan ini tidak dapat dibatalkan dan akan menghapus data unit dari sistem.
          </>
        }
        confirmLabel="Ya, Hapus Unit"
        tone="danger"
        onConfirm={() => {
          if (!confirmDeleteItem) return;
          const item = confirmDeleteItem;
          setConfirmDeleteItem(null);
          onDeleteEquipment(item.id).catch((err: unknown) => {
            const pesan =
              err instanceof Error && err.message ? err.message : 'Gagal menghapus unit.';
            onNotify?.(pesan, 'error');
          });
        }}
        onCancel={() => setConfirmDeleteItem(null)}
      />
    </div>
  );
};
