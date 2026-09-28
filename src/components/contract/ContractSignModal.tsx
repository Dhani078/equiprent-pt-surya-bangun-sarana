/**
 * Modal tanda tangan elektronik kontrak (nama penandatangan + kanvas goresan).
 *
 * Validasi & submit tetap di ContractPanel (induk); komponen ini murni render.
 */
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '../Modal';
import { SignatureCanvas } from '../SignatureCanvas';
import type { Contract } from '../../types';

interface Props {
  contract: Contract;
  signerName: string;
  signError: string | null;
  formErrors: Record<string, string | undefined>;
  busy: boolean;
  onChangeSigner: (v: string) => void;
  onSignature: (dataUrl: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const ContractSignModal: React.FC<Props> = ({
  contract,
  signerName,
  signError,
  formErrors,
  busy: isSubmitting,
  onChangeSigner: setSignerName,
  onSignature: setSignature,
  onClose: tutupModal,
  onSubmit: handleSign,
}) => (
  <Modal isOpen={true} onClose={tutupModal} title={`Penandatanganan Kontrak: ${contract.contract_code}`}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div
        style={{
          padding: '12px 14px',
          backgroundColor: 'var(--bg-raised)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          fontSize: '12px',
          lineHeight: 1.6,
        }}
      >
        <p style={{ margin: '0 0 6px 0' }}>
          Dengan membubuhkan tanda tangan elektronik di bawah ini,{' '}
          <strong>{contract.customer_name ?? 'Pelanggan'}</strong> menyetujui seluruh
          ketentuan sewa alat berat PT. Surya Bangun Sarana Banjarmasin, termasuk tanggung
          jawab operasional dan jadwal mobilisasi.
        </p>
        <p style={{ margin: 0, color: 'var(--color-secondary)', fontSize: '11px' }}>
          Legalitas dokumen dijamin sah berdasarkan UU ITE Pasal 11 tentang Tanda Tangan
          Elektronik.
        </p>
      </div>

      <div>
        <label
          htmlFor="signer-name"
          style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}
        >
          Nama Penandatangan Resmi (Sesuai KTP / Perusahaan)
        </label>
        <input
          id="signer-name"
          type="text"
          className="input-premium"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          aria-invalid={formErrors.signerName !== undefined}
          aria-describedby={formErrors.signerName !== undefined ? 'signer-name-error' : undefined}
          style={{
            width: '100%',
            borderColor: formErrors.signerName !== undefined ? 'var(--fg-danger)' : undefined,
          }}
        />
        {formErrors.signerName !== undefined && (
          <p id="signer-name-error" style={{ margin: '5px 0 0 0', fontSize: '11.5px', color: 'var(--fg-danger)' }}>
            {formErrors.signerName}
          </p>
        )}
      </div>

      <div>
        <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
          Goresan Tanda Tangan Digital
        </span>
        <SignatureCanvas
          onChange={setSignature}
          ariaLabel="Kanvas tanda tangan elektronik kontrak"
        />
        {formErrors.signature !== undefined && (
          <p style={{ margin: '5px 0 0 0', fontSize: '11.5px', color: 'var(--fg-danger)' }}>
            {formErrors.signature}
          </p>
        )}
      </div>

      {signError !== null && (
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
          {signError}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" onClick={tutupModal} className="btn-secondary">
          Tinjau Kembali
        </button>
        <button
          type="button"
          onClick={() => void handleSign()}
          className="btn-primary"
          disabled={isSubmitting}
          style={{ opacity: isSubmitting ? 0.6 : 1 }}
        >
          <CheckCircle2 size={15} />
          <span>{isSubmitting ? 'Menyimpan...' : 'Bubuhkan Tanda Tangan Digital'}</span>
        </button>
      </div>
    </div>
  </Modal>
);
