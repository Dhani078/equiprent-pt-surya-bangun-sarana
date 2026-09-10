import React, { useMemo, useState } from 'react';
import { Rental, Equipment, User } from '../../types';
import { Plus, Search, CheckCircle, XCircle, Truck, CircleCheck, TriangleAlert, Hourglass } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { getEquipmentImage } from '../../lib/stitchAssets';
import { formatRupiah, formatTanggal, LATE_PENALTY_PER_DAY } from '../../lib/businessRules';
import {
  buildEquipmentAvailability,
  describeBlockedReason,
  summarizeAvailability,
} from '../../lib/availability';
import {
  getAllowedNextStatuses,
  getLateReturnInfo,
  getRentalStatusLabel,
  getRentalStatusTone,
  summarizeLatePenalties,
} from '../../lib/rentalWorkflow';
import type { RentalStatus } from '../../lib/rentalWorkflow';

interface RentalManagementProps {
  rentals: Rental[];
  equipments: Equipment[];
  users: User[];
  onAddRental: (item: Omit<Rental, 'id' | 'rental_code'>) => Promise<void>;
  onUpdateRentalStatus: (id: number, status: Rental['status']) => Promise<void>;
}

/** Warna badge mengikuti design system §7 (hijau=aktif, kuning=pending, dst). */
const TONE_STYLE: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
  success: { backgroundColor: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' },
  info: { backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' },
  warning: { backgroundColor: '#FFFBEB', color: '#92400E', borderColor: '#FDE68A' },
  danger: { backgroundColor: '#FEF2F2', color: '#991B1B', borderColor: '#FECACA' },
  neutral: { backgroundColor: '#F1F5F9', color: '#475569', borderColor: '#E2E8F0' },
};

/** Label & ikon untuk tombol aksi — mengikuti matriks transisi terpusat. */
const ACTION_META: Record<string, { label: string; tone: 'success' | 'danger' | 'info' | 'neutral' }> = {
  APPROVED: { label: 'Setujui', tone: 'success' },
  REJECTED: { label: 'Tolak', tone: 'danger' },
  ON_GOING: { label: 'Mobilisasi', tone: 'info' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
};

const TOMBOL_STYLE: Record<string, React.CSSProperties> = {
  success: { backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFFFFF' },
  danger: { backgroundColor: '#FFFFFF', borderColor: '#FECACA', color: '#EF4444' },
  info: { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#FFFFFF' },
  neutral: {},
};

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

  const filteredRentals = rentals.filter((r) => {
    const matchesSearch = r.rental_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.company_name && r.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.equipment_name && r.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  /** Baris status + tombol aksi untuk satu rental. */
  const renderAksi = (r: Rental) => {
    const tujuan = getAllowedNextStatuses(r.status);

    if (tujuan.length === 0) {
      return (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: r.status === 'COMPLETED' ? '#059669' : 'var(--color-secondary)',
          }}
        >
          {r.status === 'COMPLETED' ? 'Tuntas ✓' : 'Ditolak'}
        </span>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {tujuan.map((next) => {
          const meta = ACTION_META[next];
          const Ikon =
            next === 'APPROVED' ? CheckCircle
              : next === 'REJECTED' ? XCircle
                : next === 'ON_GOING' ? Truck
                  : CircleCheck;

          return (
            <button
              key={next}
              onClick={() => mintaKonfirmasi(r, next)}
              className={next === 'REJECTED' ? 'btn-secondary' : 'btn-primary'}
              style={{
                padding: '5px 10px',
                fontSize: '11.5px',
                ...TOMBOL_STYLE[meta.tone],
              }}
              aria-label={`${meta.label} transaksi ${r.rental_code}`}
              title={`${meta.label} — ${getRentalStatusLabel(next)}`}
            >
              <Ikon size={12} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>
    );
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
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ padding: '9px 16px', fontSize: '13.5px' }}>
          <Plus size={16} />
          <span>Buat Booking Sewa</span>
        </button>
      </div>

      {/* Ringkasan Keterlambatan Berjalan */}
      <div
        className="card-premium"
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px 18px',
          borderLeft: `4px solid ${dendaBerjalan.lateCount > 0 ? '#EF4444' : '#10B981'}`,
        }}
        aria-label="Ringkasan denda keterlambatan berjalan"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Hourglass size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
            Denda Keterlambatan Berjalan
          </span>
        </div>
        <span style={{ fontSize: '12.5px', color: 'var(--color-secondary)' }}>
          {dendaBerjalan.lateCount} unit lewat jatuh tempo · tarif {formatRupiah(LATE_PENALTY_PER_DAY)}/hari
        </span>
        <strong
          style={{
            marginLeft: 'auto',
            fontSize: '15px',
            fontFamily: 'monospace',
            color: dendaBerjalan.penaltyTotal > 0 ? '#B91C1C' : '#059669',
          }}
        >
          {formatRupiah(dendaBerjalan.penaltyTotal)}
        </strong>
      </div>

      {/* Filter Bar */}
      <div className="card-premium" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-light)' }} />
          <input
            type="text"
            className="input-premium"
            placeholder="Cari kode sewa, pelanggan, perusahaan, atau nama alat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px' }}
            aria-label="Cari transaksi penyewaan"
          />
        </div>

        <select
          className="input-premium"
          style={{ width: 'auto', height: '40px', padding: '0 12px' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Saring transaksi berdasarkan status"
        >
          <option value="ALL">Semua Status Transaksi</option>
          <option value="PENDING">PENDING (Menunggu Persetujuan)</option>
          <option value="APPROVED">APPROVED (Disetujui)</option>
          <option value="ON_GOING">ON_GOING (Mobilisasi / Beroperasi)</option>
          <option value="COMPLETED">COMPLETED (Selesai)</option>
          <option value="REJECTED">REJECTED (Ditolak)</option>
        </select>
      </div>

      {/* Table with Thumbnails */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode Sewa</th>
              <th>Pelanggan & Korporasi</th>
              <th>Unit Alat Berat</th>
              <th>Periode Sewa</th>
              <th style={{ textAlign: 'right' }}>Total Biaya</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'center' }}>Aksi Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRentals.map((r) => {
              const imgUrl = getEquipmentImage(r.equipment_code);
              const denda = petaDenda.get(r.id);
              const tone = getRentalStatusTone(r.status);
              const gaya = TONE_STYLE[tone] ?? TONE_STYLE.neutral;

              return (
                <tr key={r.id}>
                  <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                    {r.rental_code}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#1E293B' }}>{r.company_name || r.customer_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>{r.customer_name}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={imgUrl} alt={r.equipment_name} style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.equipment_name}</div>
                        <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{r.equipment_code}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    <div>Mulai: <strong>{formatTanggal(r.start_date)}</strong></div>
                    <div>Selesai: <strong>{formatTanggal(r.end_date)}</strong></div>
                    {denda && denda.isLate && (
                      <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#B91C1C', fontWeight: 600 }}>
                        Terlambat {denda.lateDays} hari
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A', fontFamily: 'monospace' }}>
                      {formatRupiah(Number(r.subtotal))}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                      {r.total_days} hari operasional
                    </div>
                    {denda && denda.isLate && (
                      <div style={{ fontSize: '11px', color: '#B91C1C', fontWeight: 600 }}>
                        Denda {formatRupiah(denda.penalty)}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        border: `1px solid ${gaya.borderColor}`,
                        backgroundColor: gaya.backgroundColor,
                        color: gaya.color,
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {r.status}
                    </span>
                    <div style={{ marginTop: '4px', fontSize: '10.5px', color: 'var(--color-secondary)' }}>
                      {getRentalStatusLabel(r.status)}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {renderAksi(r)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredRentals.length === 0 && (
          <div
            style={{
              padding: '40px 24px',
              textAlign: 'center',
              color: 'var(--color-secondary)',
              fontSize: '13px',
            }}
          >
            <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: '#1E293B' }}>
              Tidak ada transaksi yang cocok
            </p>
            <p style={{ margin: 0 }}>
              Ubah kata kunci pencarian atau pilih status lain pada penyaring di atas.
            </p>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Perubahan Status */}
      <Modal
        isOpen={pendingConfirm !== null}
        onClose={() => setPendingConfirm(null)}
        title="Konfirmasi Perubahan Status"
      >
        {pendingConfirm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: '#1E293B' }}>
              Ubah status transaksi{' '}
              <strong className="serial-code">{pendingConfirm.rental.rental_code}</strong> dari{' '}
              <strong>{getRentalStatusLabel(pendingConfirm.rental.status)}</strong> menjadi{' '}
              <strong>{getRentalStatusLabel(pendingConfirm.next)}</strong>?
            </p>

            {pendingConfirm.next === 'ON_GOING' && (
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--color-secondary)', lineHeight: 1.6 }}>
                Unit akan dikunci berstatus <strong>RENTED</strong> sampai transaksi diselesaikan.
              </p>
            )}

            {pendingConfirm.next === 'COMPLETED' && (
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--color-secondary)', lineHeight: 1.6 }}>
                Unit akan dibebaskan menjadi <strong>AVAILABLE</strong> dan dapat disewa kembali.
              </p>
            )}

            {pendingConfirm.next === 'REJECTED' && (
              <p style={{ margin: 0, fontSize: '12.5px', color: '#991B1B', lineHeight: 1.6 }}>
                Penolakan bersifat <strong>final</strong> — transaksi tidak dapat diproses kembali.
              </p>
            )}

            {pendingConfirm.next === 'COMPLETED' && (() => {
              const denda = getLateReturnInfo(pendingConfirm.rental);
              if (!denda.isLate) return null;
              return (
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
                  <TriangleAlert size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    Unit terlambat <strong>{denda.lateDays} hari</strong>. Denda sebesar{' '}
                    <strong>{formatRupiah(denda.penalty)}</strong> akan dibebankan kepada pelanggan.
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={jalankanPerubahan}
                className="btn-primary"
                style={
                  pendingConfirm.next === 'REJECTED'
                    ? { backgroundColor: '#EF4444', borderColor: '#EF4444', color: '#FFFFFF' }
                    : undefined
                }
              >
                Ya, {ACTION_META[pendingConfirm.next]?.label ?? 'Lanjutkan'}
              </button>
            </div>
          </div>
        )}
      </Modal>

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
              aria-label="Pilih pelanggan atau korporasi"
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
              Pilih Alat Berat
            </label>
            <select
              className="input-premium"
              value={formData.equipment_id}
              onChange={(e) => {
                setFormData({ ...formData, equipment_id: Number(e.target.value) });
                setFormError(null);
              }}
              aria-label="Pilih alat berat yang tersedia pada periode sewa"
            >
              {/* Semua unit tetap ditampilkan agar pengguna paham MENGAPA suatu
                  unit tidak bisa dipilih, lalu ditandai & dinonaktifkan. */}
              {availability.map(({ equipment, isBookable, blockedReason }) => (
                <option key={equipment.id} value={equipment.id} disabled={!isBookable}>
                  {equipment.equipment_code} - {equipment.name}{' '}
                  ({formatRupiah(Number(equipment.rental_price_per_day))}/hari)
                  {isBookable
                    ? ''
                    : blockedReason === 'DATE_CONFLICT'
                      ? ' — sudah dipesan pada periode ini'
                      : blockedReason === 'UNIT_STATUS'
                        ? ` — ${equipment.status}`
                        : ' — periode tidak valid'}
                </option>
              ))}
            </select>

            <div
              style={{
                marginTop: '6px',
                fontSize: '11.5px',
                color: 'var(--color-secondary)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 10px',
              }}
              aria-live="polite"
            >
              <span>
                <strong style={{ color: 'var(--color-primary)' }}>
                  {availabilitySummary.bookable}
                </strong>{' '}
                dari {availabilitySummary.total} unit tersedia pada periode ini
              </span>
              {availabilitySummary.blockedByDate > 0 && (
                <span>· {availabilitySummary.blockedByDate} unit bentrok jadwal</span>
              )}
              {availabilitySummary.blockedByStatus > 0 && (
                <span>· {availabilitySummary.blockedByStatus} unit dirawat / nonaktif</span>
              )}
            </div>
          </div>

          {/* Peringatan: unit terpilih tidak bisa dipesan pada periode ini */}
          {selectedAvailability && !selectedAvailability.isBookable && (
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
              <TriangleAlert size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong>Unit tidak dapat dipesan.</strong>{' '}
                {describeBlockedReason(selectedAvailability)}
                {selectedAvailability.conflicts.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#7F1D1D' }}>
                    Bentrok dengan:{' '}
                    {selectedAvailability.conflicts
                      .map(c => `${c.rentalCode} (${c.startDate} s.d. ${c.endDate})`)
                      .join('; ')}
                  </div>
                )}
                <div style={{ marginTop: '6px', fontSize: '11.5px' }}>
                  Ganti tanggal sewa atau pilih unit lain yang masih tersedia.
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '12.5px',
              }}
            >
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Tanggal Mulai Sewa
              </label>
              <input
                type="date"
                required
                className="input-premium"
                value={formData.start_date}
                onChange={(e) => {
                  setFormData({ ...formData, start_date: e.target.value });
                  setFormError(null);
                }}
                aria-label="Tanggal mulai sewa"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Tanggal Selesai Sewa
              </label>
              <input
                type="date"
                required
                className="input-premium"
                value={formData.end_date}
                onChange={(e) => {
                  setFormData({ ...formData, end_date: e.target.value });
                  setFormError(null);
                }}
                aria-label="Tanggal selesai sewa"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Catatan Proyek & Lokasi
            </label>
            <textarea
              rows={2}
              className="input-premium"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              aria-label="Catatan proyek dan lokasi"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setFormError(null);
              }}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!selectedAvailability?.isBookable}
              title={
                selectedAvailability?.isBookable
                  ? 'Terbitkan order sewa'
                  : 'Pilih unit lain atau ubah periode sewa'
              }
              style={
                selectedAvailability?.isBookable
                  ? undefined
                  : { opacity: 0.55, cursor: 'not-allowed' }
              }
            >
              Simpan & Terbitkan Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
