/**
 * Modal perpanjangan masa berlaku kontrak kedaluwarsa.
 *
 * State & submit milik ContractPanel (induk); komponen ini murni render.
 */
import React from 'react';
import { CalendarPlus } from 'lucide-react';
import { Modal } from '../Modal';
import type { Contract } from '../../types';

interface Props {
  contract: Contract;
  renewDate: string;
  onChangeDate: (v: string) => void;
  error: string | null;
  fieldError: string | undefined;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const ContractRenewModal: React.FC<Props> = ({
  contract,
  renewDate,
  onChangeDate: setRenewDate,
  error: renewError,
  fieldError,
  busy: isRenewing,
  onClose: tutupModal,
  onSubmit: handleRenew,
}) => (
  <Modal isOpen={true} onClose={tutupModal} title={`Perpanjang Kontrak: ${contract.contract_code}`}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div
        style={{
          padding: '12px 14px',
          backgroundColor: 'var(--bg-amber-soft)',
          border: '1px solid var(--border-amber-soft)',
          borderRadius: '8px',
          fontSize: '12.5px',
          lineHeight: 1.6,
          color: 'var(--fg-warning-deep)',
        }}
        role="status"
      >
        <strong>Kontrak ini kedaluwarsa per {contract.valid_until}.</strong>{' '}
        Menetapkan batas berlaku baru membuat dokumen dapat ditandatangani kembali oleh
        pelanggan. Kode kontrak dan tagihan yang sudah terbit tidak berubah.
      </div>

      <div>
        <label
          htmlFor="renew-valid-until"
          style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}
        >
          Berlaku sampai
        </label>
        <input
          id="renew-valid-until"
          type="date"
          className="input-premium"
          value={renewDate}
          min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
          onChange={(e) => setRenewDate(e.target.value)}
          style={{ width: '100%' }}
        />
        {fieldError !== undefined && (
          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--fg-danger, #B42318)' }}>
            {fieldError}
          </p>
        )}
      </div>

      {renewError !== null && (
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--fg-danger, #B42318)' }} role="alert">
          {renewError}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button type="button" className="btn-secondary" onClick={tutupModal} disabled={isRenewing}>
          Batal
        </button>
        <button type="button" className="btn-primary" onClick={handleRenew} disabled={isRenewing}>
          <CalendarPlus size={14} />
          <span>{isRenewing ? 'Menyimpan...' : 'Simpan Perpanjangan'}</span>
        </button>
      </div>
    </div>
  </Modal>
);
