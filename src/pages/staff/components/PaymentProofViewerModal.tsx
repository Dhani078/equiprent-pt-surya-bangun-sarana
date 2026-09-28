/**
 * Modal pratinjau bukti transfer + aksi verifikasi/tolak (dashboard staf).
 *
 * Aksi tetap dieksekusi induk (`jalankanAksi` + callback onVerify/onReject);
 * komponen ini hanya merinci data tagihan, gambar struk, dan tombol.
 */
import React from 'react';
import { Check, X } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { formatRupiah } from '../../../lib/businessRules';
import { getPaymentStatusLabel } from '../../../lib/paymentWorkflow';
import { STITCH_IMAGES } from '../../../lib/stitchAssets';
import type { Payment } from '../../../types';

interface Props {
  payment: Payment;
  processingId: number | null;
  onClose: () => void;
  onVerify: () => void;
  onReject: () => void;
}

export const PaymentProofViewerModal: React.FC<Props> = ({
  payment: p,
  processingId,
  onClose,
  onVerify,
  onReject,
}) => {
  const busy = processingId === p.id;
  return (
    <Modal isOpen={true} onClose={onClose} title={`Bukti Transfer: ${p.payment_code}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-raised)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12.5px' }}>
          <div>Klien: <strong>{p.customer_name || 'Pelanggan'}</strong></div>
          <div>Jumlah: <strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>{formatRupiah(Number(p.amount))}</strong></div>
          <div>Kontrak: <strong>{p.contract_code || '—'}</strong></div>
          <div>Status: <strong>{getPaymentStatusLabel(p.status)}</strong></div>
          <div>
            Berkas bukti:{' '}
            <span className="serial-code" style={{ fontSize: '11.5px' }}>
              {p.payment_proof_path || 'Belum dilampirkan'}
            </span>
          </div>
        </div>

        <div style={{ height: '240px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', backgroundColor: '#000' }}>
          <img
            src={STITCH_IMAGES.PAYMENT_PROOF}
            alt="Struk Bukti Transfer"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60';
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Tutup
          </button>
          {p.status === 'PENDING_VERIFICATION' && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onReject}
                className="btn-secondary"
                style={{ color: 'var(--fg-danger)', opacity: busy ? 0.6 : 1 }}
                aria-label={`Tolak bukti transfer ${p.payment_code}`}
              >
                <X size={14} />
                <span>Tolak Bukti</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onVerify}
                className="btn-primary"
                style={{ backgroundColor: '#10B981', opacity: busy ? 0.6 : 1 }}
                aria-label={`Verifikasi lunas ${p.payment_code}`}
              >
                <Check size={14} />
                <span>Verifikasi Lunas Sekarang</span>
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
