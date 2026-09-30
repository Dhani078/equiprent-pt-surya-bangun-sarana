/**
 * Modal pengajuan sewa pelanggan: ringkasan unit, tanggal, catatan,
 * estimasi biaya (dari mesin yang sama dengan server) + peringatan.
 *
 * Semua state & submit tetap di CustomerPortal; komponen ini murni render.
 */
import React from 'react';
import { Modal } from '../../components/Modal';
import { formatRupiah } from '../../lib/businessRules';
import { getEquipmentImage, resolveEquipmentThumbnail, getEquipmentCategoryFallback } from '../../lib/stitchAssets';
import type { RentalRequestCheck } from '../../lib/portal';
import type { Equipment } from '../../types';

interface Props {
  equipment: Equipment;
  startDate: string;
  endDate: string;
  notes: string;
  estimasi: RentalRequestCheck;
  rentError: string | null;
  onChangeTanggal: (mulai: string, selesai: string) => void;
  onChangeCatatan: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const label: React.CSSProperties = { display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' };

export const RentBookingModal: React.FC<Props> = ({
  equipment: eq,
  startDate,
  endDate,
  notes,
  estimasi,
  rentError,
  onChangeTanggal: setTanggal,
  onChangeCatatan: setNotes,
  onClose,
  onSubmit: handleConfirmRent,
}) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title={`Pengajuan Sewa: ${eq.name}`}
  >
    <form onSubmit={handleConfirmRent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '14px', padding: '12px', backgroundColor: 'var(--bg-raised)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
        <img
          src={resolveEquipmentThumbnail(eq.thumbnail_url, eq.equipment_code, eq.type)}
          alt={eq.name}
          loading="lazy"
          onError={(e) => { const t = e.currentTarget; if (t.dataset.fb) return; t.dataset.fb = '1'; t.src = getEquipmentCategoryFallback(eq.equipment_code, eq.type); }}
          style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
        />
        <div style={{ fontSize: '13px' }}>
          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{eq.name}</div>
          <div style={{ color: 'var(--color-secondary)', fontSize: '11.5px', marginBottom: '4px' }}>
            Kode: <span className="serial-code">{eq.equipment_code}</span> &bull; {eq.brand} {eq.model}
          </div>
          <div className="serial-code" style={{ fontWeight: 800, color: 'var(--text-strong)' }}>
            {formatRupiah(Number(eq.rental_price_per_day))} / hari
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={label}>Tanggal Mulai Sewa</label>
          <input
            type="date"
            required
            className="input-premium"
            value={startDate}
            onChange={(e) => setTanggal(e.target.value, endDate)}
          />
        </div>
        <div>
          <label style={label}>Tanggal Selesai Sewa</label>
          <input
            type="date"
            required
            className="input-premium"
            value={endDate}
            onChange={(e) => setTanggal(startDate, e.target.value)}
          />
        </div>
      </div>

      <div>
        <label style={label}>Catatan Lokasi / Proyek Pekerjaan</label>
        <textarea
          rows={2}
          className="input-premium"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: Pekerjaan cut & fill Pelabuhan Trisakti Banjarmasin"
        />
      </div>

      {rentError && (
        <div
          role="alert"
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: 'var(--fg-danger)',
            fontSize: '12.5px',
            fontWeight: 600,
          }}
        >
          {rentError}
        </div>
      )}

      <div style={{ padding: '12px', backgroundColor: 'var(--bg-blue-soft)', borderRadius: '8px', border: '1px solid var(--border-blue-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-secondary)' }}>
          <span>Durasi: <strong>{estimasi.ok ? `${estimasi.rentalDays} Hari` : '-'}</strong></span>
          <span>Tarif: <strong>{formatRupiah(Number(eq.rental_price_per_day))}</strong>/hari</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)' }}>
          <span>Total Estimasi Biaya Sewa:</span>
          <span className="serial-code">{estimasi.ok ? formatRupiah(estimasi.subtotal) : '-'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" onClick={onClose} className="btn-secondary">
          Batal
        </button>
        <button type="submit" className="btn-primary">
          Ajukan Permohonan Sewa
        </button>
      </div>
    </form>
  </Modal>
);
