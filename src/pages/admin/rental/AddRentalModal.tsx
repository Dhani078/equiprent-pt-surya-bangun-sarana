/**
 * Formulir pembuatan transaksi penyewaan baru (Admin/Staf).
 *
 * Komponen ini murni tampilan: seluruh keadaan form dimiliki induk supaya
 * nilai yang dikirim ke server tidak pernah berbeda dari yang tampil.
 */
import { TriangleAlert } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { formatRupiah } from '../../../lib/businessRules';
import type { Equipment, Rental, User } from '../../../types';
import type { EquipmentAvailability } from '../../../lib/availability';
import type { AvailabilitySummary } from '../../../lib/availability';

interface Props {
  open: boolean;
  customers: readonly User[];
  equipments: readonly Equipment[];
  availability: readonly EquipmentAvailability[];
  availabilitySummary: AvailabilitySummary;
  selectedAvailability: EquipmentAvailability | null;
  values: {
    customer_id: number;
    equipment_id: number;
    start_date: string;
    end_date: string;
    notes: string;
  };
  onChange: (values: {
    customer_id: number;
    equipment_id: number;
    start_date: string;
    end_date: string;
    notes: string;
  }) => void;
  error: string | null;
  /** Menyetel/membersihkan pesan galat form (dipakai saat menyunting ulang). */
  onSetError: (message: string | null) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  describeBlockedReason: (a: EquipmentAvailability) => string;
}

export const AddRentalModal: React.FC<Props> = ({
  open: isAddModalOpen,
  customers,
  equipments,
  availability,
  availabilitySummary,
  selectedAvailability,
  values: formData,
  onChange: setFormData,
  error: formError,
  onSetError: setFormError,
  submitting: isSubmitting = false,
  onSubmit: handleFormSubmit,
  onClose: tutupModal,
  describeBlockedReason,
}) => (
  <Modal
  isOpen={isAddModalOpen}
  onClose={tutupModal}
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
          backgroundColor: 'var(--bg-red-soft)',
          border: '1px solid var(--border-red-soft)',
          color: 'var(--fg-danger-deep)',
          fontSize: '12.5px',
          lineHeight: 1.5,
        }}
      >
        <TriangleAlert size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <strong>Unit tidak dapat dipesan.</strong>{' '}
          {describeBlockedReason(selectedAvailability)}
          {selectedAvailability.conflicts.length > 0 && (
            <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--banner-danger-fg)' }}>
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
          backgroundColor: 'var(--bg-red-soft)',
          border: '1px solid var(--border-red-soft)',
          color: 'var(--fg-danger-deep)',
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
          tutupModal();
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
);
