/**
 * Modal penerbitan kontrak baru untuk transaksi sewa yang disetujui.
 *
 * Daftar rental & submit dihitung/dipegang oleh ContractPanel (induk).
 */
import React from 'react';
import { CheckCircle2, FileSignature, X } from 'lucide-react';
import { Modal } from '../Modal';
import type { Rental } from '../../types';

interface Props {
  rentalsTanpaKontrak: readonly Rental[];
  selectedRentalId: number | null;
  onSelectRental: (id: number | null) => void;
  issueError: string | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const ContractIssueModal: React.FC<Props> = ({
  rentalsTanpaKontrak,
  selectedRentalId,
  onSelectRental: setSelectedRentalId,
  issueError,
  busy: isIssuing,
  onClose: tutupModal,
  onSubmit: handleIssue,
}) => (
  <Modal isOpen={true} onClose={tutupModal} title="Terbitkan Kontrak Baru">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {rentalsTanpaKontrak.length === 0 ? (
        <div
          style={{
            padding: '28px 20px',
            textAlign: 'center',
            border: '1px dashed var(--color-border)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-raised)',
          }}
        >
          <CheckCircle2 size={28} style={{ color: '#CBD5E1', marginBottom: '8px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-secondary)' }}>
            Semua transaksi sewa yang disetujui sudah memiliki kontrak.
          </p>
        </div>
      ) : (
        <>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--color-secondary)', lineHeight: 1.6 }}>
            Pilih transaksi sewa yang akan diterbitkan kontraknya. Nomor kontrak dibuat
            otomatis dengan format <code>SBS/CONTRACT/YYYY/MM/SEQ</code>. Hanya transaksi
            yang sudah disetujui dan belum punya kontrak yang ditampilkan.
          </p>

          <div>
            <label
              htmlFor="rental-pilih"
              style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}
            >
              Transaksi Sewa
            </label>
            <select
              id="rental-pilih"
              className="input-premium"
              value={selectedRentalId ?? ''}
              onChange={(e) => setSelectedRentalId(e.target.value === '' ? null : Number(e.target.value))}
              style={{ width: '100%' }}
            >
              {rentalsTanpaKontrak.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.rental_code} — {r.customer_name ?? 'Pelanggan'} — {r.equipment_name ?? '-'}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {issueError !== null && (
        <div
          role="alert"
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-red-soft)',
            border: '1px solid var(--border-red-soft)',
            color: 'var(--fg-danger-deep)',
            fontSize: '12px',
          }}
        >
          {issueError}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" onClick={tutupModal} className="btn-secondary">
          <X size={15} />
          <span>Batal</span>
        </button>
        {rentalsTanpaKontrak.length > 0 && (
          <button
            type="button"
            onClick={() => void handleIssue()}
            className="btn-primary"
            disabled={isIssuing || selectedRentalId === null}
            style={{ opacity: isIssuing || selectedRentalId === null ? 0.6 : 1 }}
          >
            <FileSignature size={15} />
            <span>{isIssuing ? 'Menerbitkan...' : 'Terbitkan Kontrak'}</span>
          </button>
        )}
      </div>
    </div>
  </Modal>
);
