/**
 * Dialog konfirmasi perubahan status transaksi sewa.
 *
 * Perubahan status mengunci/membebaskan unit terkait, jadi wajib dikonfirmasi
 * lebih dulu. Komponen ini murni tampilan; keputusan diambil lewat `onConfirm`.
 */
import { TriangleAlert } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { formatRupiah } from '../../../lib/businessRules';
import type { Rental } from '../../../types';
import { getLateReturnInfo, getRentalStatusLabel } from '../../../lib/rentalWorkflow';
import type { RentalStatus } from '../../../lib/rentalWorkflow';

/** Nama aksi yang tampil di tombol konfirmasi. */
export const ACTION_META: Record<string, { label: string; tone: 'success' | 'danger' | 'info' | 'neutral' }> = {
  APPROVED: { label: 'Setujui', tone: 'success' },
  REJECTED: { label: 'Tolak', tone: 'danger' },
  ON_GOING: { label: 'Mobilisasi', tone: 'info' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
};

interface Props {
  pending: { rental: Rental; next: RentalStatus } | null;
  onClose: () => void;
  onConfirm: (rental: Rental, next: RentalStatus) => void;
  submitting: boolean;
}

export const StatusConfirmModal: React.FC<Props> = ({
  pending: pendingConfirm,
  onClose: tutupDialog,
  onConfirm,
  submitting: isSubmitting,
}) => (
      <Modal
  isOpen={pendingConfirm !== null}
  onClose={tutupDialog}
  title="Konfirmasi Perubahan Status"
>
  {pendingConfirm && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-strong)' }}>
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
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--fg-danger-deep)', lineHeight: 1.6 }}>
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
              backgroundColor: 'var(--bg-red-soft)',
              border: '1px solid var(--border-red-soft)',
              color: 'var(--fg-danger-deep)',
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
          onClick={() => tutupDialog()}
          className="btn-secondary"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={() => pendingConfirm && onConfirm(pendingConfirm.rental, pendingConfirm.next)}
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
);
