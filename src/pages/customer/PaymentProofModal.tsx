/**
 * Modal konfirmasi transfer: detail tagihan, contoh struk, nama berkas,
 * pesan galat, dan tombol kirim. Logika kirim & state tetap di induk.
 */
import React from 'react';
import { Upload } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { formatRupiah } from '../../lib/businessRules';
import { STITCH_IMAGES } from '../../lib/stitchAssets';
import type { Payment } from '../../types';

interface Props {
  payment: Payment;
  proofFile: string;
  proofError: string | null;
  sending: boolean;
  onChangeFile: (v: string) => void;
  onClose: () => void;
  onSend: () => void;
}

export const PaymentProofModal: React.FC<Props> = ({
  payment,
  proofFile,
  proofError,
  sending,
  onChangeFile: setProofFile,
  onClose,
  onSend: kirimBuktiTransfer,
}) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title={`Konfirmasi Transfer: ${payment.payment_code}`}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ padding: '14px', backgroundColor: 'var(--bg-raised)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
        <div>Jumlah Tagihan: <strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>{formatRupiah(Number(payment.amount))}</strong></div>
        <div>Metode: <strong>{payment.payment_method}</strong></div>
        <div>Rekening Tujuan: <strong>Bank Mandiri 031-00-1234567-8 a/n PT. Surya Bangun Sarana</strong></div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
          Pratinjau Struk / Bukti Transfer
        </label>
        <div style={{
          height: '160px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={STITCH_IMAGES.PAYMENT_PROOF}
            alt="Struk Transfer Mockup"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60';
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
          Nama Berkas Bukti Transfer
        </label>
        <input
          type="text"
          className="input-premium"
          value={proofFile}
          onChange={(e) => setProofFile(e.target.value)}
          aria-label="Nama berkas bukti transfer"
          aria-invalid={proofError !== null}
          aria-describedby="petunjuk-bukti-transfer"
        />
        <div id="petunjuk-bukti-transfer" style={{ fontSize: '11px', color: 'var(--color-secondary)', marginTop: '4px' }}>
          Unggah bukti mutasi bank transfer atau struk setor resmi (PNG, JPG, WebP, atau PDF).
        </div>
        {proofError && (
          <div role="alert" style={{ fontSize: '11.5px', color: 'var(--fg-danger)', fontWeight: 600, marginTop: '6px' }}>
            {proofError}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
        <button type="button" onClick={onClose} className="btn-secondary">
          Batal
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={kirimBuktiTransfer}
          className="btn-primary"
          style={{ opacity: sending ? 0.6 : 1 }}
          aria-label="Kirim bukti pembayaran untuk diverifikasi"
        >
          <Upload size={14} />
          <span>{sending ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}</span>
        </button>
      </div>
    </div>
  </Modal>
);
