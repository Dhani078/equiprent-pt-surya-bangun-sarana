import React, { useMemo, useState } from 'react';
import { Rental, Equipment, User, Contract } from '../../types';
import { ContractPanel } from '../../components/ContractPanel';
import { StatusConfirmModal } from './rental/StatusConfirmModal';
import { AddRentalModal } from './rental/AddRentalModal';
import { RentalTable } from './rental/RentalTable';
import { RentalFilterBar } from './rental/RentalFilterBar';
import { LatePenaltySummaryBar } from './rental/LatePenaltySummaryBar';
import { Plus } from 'lucide-react';
import {
  buildEquipmentAvailability,
  describeBlockedReason,
  summarizeAvailability,
} from '../../lib/availability';
import {
  getLateReturnInfo,
  summarizeLatePenalties,
} from '../../lib/rentalWorkflow';
import type { RentalStatus } from '../../lib/rentalWorkflow';
import { exportTable } from '../../lib/tableExport';
import type { ExportColumn, ExportFormat } from '../../lib/tableExport';

interface RentalManagementProps {
  rentals: Rental[];
  equipments: Equipment[];
  users: User[];
  /** Kontrak yang sudah diterbitkan — panel kontrak butuh ini untuk menandai sewa yang sudah punya kontrak. */
  contracts: Contract[];
  onAddRental: (item: Omit<Rental, 'id' | 'rental_code'>) => Promise<void>;
  onUpdateRentalStatus: (id: number, status: Rental['status']) => Promise<void>;
  /** Menerbitkan kontrak untuk transaksi sewa. */
  onCreateContract: (rentalId: number) => Promise<void>;
  /** Membubuhkan tanda tangan elektronik (Admin/Staf bertindak atas nama perusahaan). */
  onSignContract: (contractId: number, signerName: string, signature: string) => Promise<void>;
  /** Memperpanjang masa berlaku kontrak kedaluwarsa (Admin/Staf saja). */
  onRenewContract?: (contractId: number, validUntil: string) => Promise<void>;
  /** Menampilkan pesan sukses/gagal di tingkat aplikasi. */
  onNotify?: (message: string, tone: 'success' | 'error') => void;
  /** Tampilkan skeleton saat data sedang dimuat. */
  isLoading?: boolean;
}

/** Tab di dalam halaman: daftar transaksi atau panel kontrak digital. */
type SubTab = 'transaksi' | 'kontrak';

/** Daftar sub-tab beserta label siap tampil. */
const SUB_TABS: readonly { id: SubTab; label: string }[] = [
  { id: 'transaksi', label: 'Daftar Transaksi' },
  { id: 'kontrak', label: 'Kontrak Digital' },
];

export const RentalManagement: React.FC<RentalManagementProps> = ({
  rentals,
  equipments,
  users,
  contracts,
  onAddRental,
  onUpdateRentalStatus,
  onCreateContract,
  onSignContract,
  onRenewContract,
  onNotify,
  isLoading = false,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('transaksi');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  /** Pesan galat form: unit bentrok, unit dirawat, atau rentang tidak valid. */
  const [formError, setFormError] = useState<string | null>(null);
  /** Rental yang sedang menunggu konfirmasi (approve/reject/mobilisasi/selesai). */
  const [pendingConfirm, setPendingConfirm] = useState<{
    rental: Rental;
    next: RentalStatus;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customer_id: users.find(u => u.role_id === 3)?.id || 9,
    equipment_id: equipments.find(e => e.status === 'AVAILABLE')?.id || 1,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    notes: 'Pekerjaan proyek konstruksi di wilayah Kalsel'
  });

  const customers = users.filter(u => u.role_id === 3);

  /**
   * Ketersediaan SELURUH unit pada rentang tanggal yang sedang dipilih.
   * Dihitung ulang hanya bila tanggal atau daftar unit/sewa berubah.
   */
  const availability = useMemo(
    () => buildEquipmentAvailability(equipments, rentals, formData.start_date, formData.end_date),
    [equipments, rentals, formData.start_date, formData.end_date]
  );

  const availabilitySummary = useMemo(() => summarizeAvailability(availability), [availability]);

  /** Unit yang dipilih saat ini, lengkap dengan alasan bila tidak bisa dipesan. */
  const selectedAvailability = useMemo(
    () => availability.find(a => a.equipment.id === Number(formData.equipment_id)),
    [availability, formData.equipment_id]
  );

  /**
   * Ringkasan denda keterlambatan berjalan.
   * Modul yang sama dipakai server & dokumen cetak — angkanya tidak bisa beda.
   */
  const dendaBerjalan = useMemo(() => summarizeLatePenalties(rentals), [rentals]);

  /** Peta keterlambatan per rental, dipakai kolom tabel. */
  const petaDenda = useMemo(() => {
    const peta = new Map<number, ReturnType<typeof getLateReturnInfo>>();
    for (const r of rentals) {
      peta.set(r.id, getLateReturnInfo(r));
    }
    return peta;
  }, [rentals]);

  const calculateDays = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diff / (1000 * 3600 * 24)));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi client: unit yang bentrok tidak boleh dikirim ke server.
    // Server tetap memvalidasi ulang — ini hanya untuk umpan balik cepat.
    if (!selectedAvailability?.isBookable) {
      setFormError(
        selectedAvailability
          ? describeBlockedReason(selectedAvailability)
          : 'Unit yang dipilih tidak tersedia. Silakan pilih unit lain.'
      );
      return;
    }

    setFormError(null);
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

  /** Meminta konfirmasi sebelum perubahan status yang mengunci/menyelesaikan. */
  const mintaKonfirmasi = (rental: Rental, next: RentalStatus) => {
    setPendingConfirm({ rental, next });
  };

  const jalankanPerubahan = async () => {
    if (!pendingConfirm) return;
    const { rental, next } = pendingConfirm;
    setPendingConfirm(null);
    await onUpdateRentalStatus(rental.id, next);
  };

  /** Rental dari seed/edge tidak selalu membawa nama pelanggan — lengkapi via join users (bug kolom kosong). */
  const pelangganById = React.useMemo(() => new Map(users.map((u) => [u.id, u] as const)), [users]);
  const rentalsLengkap = React.useMemo(
    () =>
      rentals.map((r) => {
        if (r.customer_name) return r;
        const p = pelangganById.get(r.customer_id);
        return p ? { ...r, customer_name: p.full_name, company_name: r.company_name ?? p.company_name ?? undefined } : r;
      }),
    [rentals, pelangganById],
  );

  const filteredRentals = rentalsLengkap.filter((r) => {
    const matchesSearch = r.rental_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.company_name && r.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.equipment_name && r.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  /** Kolom ekspor transaksi sewa. */
  const kolomEkspor: ExportColumn<Rental>[] = [
    { header: 'Kode Sewa', value: (r) => r.rental_code },
    { header: 'Pelanggan', value: (r) => r.customer_name ?? '-' },
    { header: 'Perusahaan', value: (r) => r.company_name ?? '-' },
    { header: 'Unit', value: (r) => r.equipment_name ?? '-' },
    { header: 'Kode Unit', value: (r) => r.equipment_code ?? '-' },
    { header: 'Mulai', value: (r) => r.start_date },
    { header: 'Selesai', value: (r) => r.end_date },
    { header: 'Total Hari', value: (r) => r.total_days, numeric: true },
    { header: 'Subtotal', value: (r) => r.subtotal, numeric: true },
    { header: 'Status', value: (r) => r.status },
  ];

  /** Mengekspor transaksi sesuai filter aktif. */
  const handleExport = (format: ExportFormat) => {
    const hasil = exportTable(format, filteredRentals, kolomEkspor, {
      title: 'Daftar Transaksi Penyewaan',
      subtitle: `Ditampilkan ${filteredRentals.length} dari ${rentalsLengkap.length} transaksi`,
      filename: 'transaksi-penyewaan',
    });
    onNotify?.(hasil.message, hasil.ok ? 'success' : 'error');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            Manajemen Transaksi Penyewaan
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary)', margin: '4px 0 0 0' }}>
            Daftar order sewa alat berat, durasi operasional proyek, dan kontrol status kontrak sewa.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Pemilih sub-tab: daftar transaksi ↔ panel kontrak digital. */}
          <div
            role="tablist"
            aria-label="Bagian halaman transaksi penyewaan"
            style={{ display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)' }}
          >
            {SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={subTab === tab.id}
                onClick={() => setSubTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: subTab === tab.id ? 'var(--color-surface)' : 'transparent',
                  color: subTab === tab.id ? 'var(--color-primary)' : 'var(--color-secondary)',
                  boxShadow: subTab === tab.id ? '0 1px 3px rgba(0, 51, 102, 0.12)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {subTab === 'transaksi' && (
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ padding: '9px 16px', fontSize: '13.5px' }}>
              <Plus size={16} />
              <span>Buat Booking Sewa</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab: Kontrak digital (penerbitan, pratinjau, e-signature) */}
      {subTab === 'kontrak' && (
        <ContractPanel
          contracts={contracts}
          rentals={rentals}
          equipments={equipments}
          users={users}
          onCreateContract={onCreateContract}
          onSignContract={onSignContract}
          onRenewContract={onRenewContract}
          title="Kontrak Sewa Digital & Tanda Tangan Elektronik"
          canIssue={true}
          canSign={true}
        />
      )}

      {subTab === 'transaksi' && (
        <>
          <LatePenaltySummaryBar denda={dendaBerjalan} />

          <RentalFilterBar
            searchTerm={searchTerm}
            filterStatus={filterStatus}
            onSearch={setSearchTerm}
            onFilterStatus={setFilterStatus}
            onExport={handleExport}
          />

          <RentalTable
            rentals={filteredRentals}
            petaDenda={petaDenda}
            isLoading={isLoading}
            searchTerm={searchTerm}
            filterStatus={filterStatus}
            onResetFilter={() => { setSearchTerm(''); setFilterStatus('ALL'); }}
            onAskConfirm={mintaKonfirmasi}
          />

          <StatusConfirmModal
            pending={pendingConfirm}
            onClose={() => setPendingConfirm(null)}
            onConfirm={jalankanPerubahan}
            submitting={false}
          />

          <AddRentalModal
            open={isAddModalOpen}
            customers={customers}
            equipments={equipments}
            availability={availability}
            availabilitySummary={availabilitySummary}
            selectedAvailability={selectedAvailability ?? null}
            values={formData}
            onChange={setFormData}
            error={formError}
            onSetError={setFormError}
            submitting={false}
            onSubmit={handleFormSubmit}
            onClose={() => setIsAddModalOpen(false)}
            describeBlockedReason={describeBlockedReason}
          />
        </>
      )}
    </div>
  );
};
