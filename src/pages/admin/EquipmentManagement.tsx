import React, { useState } from 'react';
import { Equipment, Maintenance } from '../../types';
import { Plus, Search, LayoutGrid, Rows3 } from 'lucide-react';
import { EquipmentFormModal } from './equipment/EquipmentFormModal';
import { EquipmentBentoStats } from './equipment/EquipmentBentoStats';
import { EquipmentCardGrid } from './equipment/EquipmentCardGrid';
import { EquipmentTable } from './equipment/EquipmentTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { validateEquipmentInput, EQUIPMENT_TYPES } from '../../lib/validators';
import type { ValidatedEquipmentInput } from '../../lib/validators';
import { usePagination } from '../../components/Paginator';
import { Skeleton } from '../../components/Skeleton';
import { exportTable } from '../../lib/tableExport';
import type { ExportColumn, ExportFormat } from '../../lib/tableExport';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { getServiceStatus, SERVICE_INTERVAL_HM } from '../../lib/businessRules';

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

  // Mini Bento Stats dihitung sendiri oleh <EquipmentBentoStats />.

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
            Inventaris Alat Berat &amp; Pemantauan Armada
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
      <EquipmentBentoStats equipments={equipments} />

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
        <EquipmentCardGrid
          items={pagedEquipments}
          maintenance={maintenance}
          schedulingId={schedulingId}
          onEdit={handleOpenEdit}
          onQuickSchedule={handleQuickSchedule}
        />
      ) : (
        <EquipmentTable
          items={pagedEquipments}
          totalFiltered={filteredEquipments.length}
          page={equipPage}
          pageSize={PAGE_SIZE_EQUIPMENT}
          onPageChange={setEquipPage}
          onEdit={handleOpenEdit}
          onDelete={setConfirmDeleteItem}
        />
      )}

      <EquipmentFormModal
        open={isAddModalOpen}
        editingItem={editingItem}
        values={formData}
        onChange={setFormData}
        errors={formErrors}
        onErrorsChange={setFormErrors}
        error={formError}
        submitting={isSubmitting}
        onSubmit={handleFormSubmit}
        onClose={handleCloseModal}
      />

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
