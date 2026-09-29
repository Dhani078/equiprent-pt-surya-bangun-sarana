import { CalendarPlus, FileText, PenLine } from 'lucide-react';
import { Contract, Rental } from '../../types';
import {
  getContractLifecycleStatus,
  getContractStatusLabel,
  getContractStatusTone,
} from '../../lib/contracts/index';

/** Warna badge status mengikuti design system §7. */
const TONE_STYLE: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
  success: { backgroundColor: 'var(--bg-green-soft)', color: 'var(--fg-success-deeper)', borderColor: '#A7F3D0' },
  warning: { backgroundColor: 'var(--bg-amber-soft)', color: 'var(--fg-warning-deep)', borderColor: 'var(--border-amber-soft)' },
  info: { backgroundColor: 'var(--bg-blue-soft)', color: 'var(--fg-info-deep)', borderColor: 'var(--border-blue-soft)' },
  neutral: { backgroundColor: 'var(--bg-subtle)', color: 'var(--text-body)', borderColor: 'var(--color-border)' },
  danger: { backgroundColor: 'var(--bg-red-soft, #FEF2F2)', color: 'var(--fg-danger, #B42318)', borderColor: '#FECACA' },
};

interface ContractTableProps {
  /** Daftar kontrak yang sudah disaring dan diurutkan induk. */
  daftarKontrak: Contract[];
  /** true bila total kontrak nol (bedakan dari "tidak cocok pencarian"). */
  kosongTotal: boolean;
  rentals: Rental[];
  canIssue: boolean;
  canSign: boolean;
  canRenew: boolean;
  onPreview: (c: Contract) => void;
  onRenew: (c: Contract) => void;
  onSign: (c: Contract) => void;
}

/** Tabel daftar kontrak digital + aksi tinjau/perpanjang/tanda tangani. */
export const ContractTable = ({
  daftarKontrak, kosongTotal, rentals, canIssue, canSign, canRenew, onPreview, onRenew, onSign,
}: ContractTableProps) => {
  if (daftarKontrak.length === 0) {
    return (
      <div
        style={{
          padding: '36px 20px',
          textAlign: 'center',
          border: '1px dashed var(--color-border)',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-raised)',
        }}
      >
        <FileText size={30} style={{ color: '#CBD5E1', marginBottom: '10px' }} />
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
          {kosongTotal
            ? 'Belum ada kontrak yang diterbitkan.'
            : 'Tidak ada kontrak yang cocok dengan pencarian.'}
        </p>
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: '10px 8px', color: 'var(--color-secondary)' }}>Kode Kontrak</th>
            <th style={{ padding: '10px 8px', color: 'var(--color-secondary)' }}>Transaksi</th>
            <th style={{ padding: '10px 8px', color: 'var(--color-secondary)' }}>Pelanggan</th>
            <th style={{ padding: '10px 8px', color: 'var(--color-secondary)' }}>Berlaku Sampai</th>
            <th style={{ padding: '10px 8px', color: 'var(--color-secondary)' }}>Status</th>
            <th style={{ padding: '10px 8px', color: 'var(--color-secondary)', textAlign: 'right' }}>
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {daftarKontrak.map((kontrak) => {
            const status = getContractLifecycleStatus(kontrak);
            const tone = TONE_STYLE[getContractStatusTone(status)] ?? TONE_STYLE.neutral;
            const rental = rentals.find((r) => r.id === kontrak.rental_id);

            return (
              <tr key={kontrak.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: 700 }}>
                  {kontrak.contract_code}
                </td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: '11.5px' }}>
                  {kontrak.rental_code ?? '-'}
                  {rental !== undefined && (
                    <div style={{ fontFamily: 'inherit', color: 'var(--color-secondary)' }}>
                      {rental.equipment_name ?? '-'}
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px 8px' }}>{kontrak.customer_name ?? '-'}</td>
                <td style={{ padding: '10px 8px' }}>{kontrak.valid_until ?? '-'}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: `1px solid ${tone.borderColor}`,
                      ...tone,
                    }}
                  >
                    {getContractStatusLabel(status)}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => onPreview(kontrak)}
                      aria-label={`Tinjau kontrak ${kontrak.contract_code}`}
                      style={{ padding: '5px 9px', fontSize: '11.5px' }}
                    >
                      <FileText size={13} />
                      <span>Tinjau</span>
                    </button>

                    {canIssue && status === 'EXPIRED' && canRenew && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => onRenew(kontrak)}
                        aria-label={`Perpanjang kontrak ${kontrak.contract_code} yang kedaluwarsa`}
                        style={{ padding: '5px 9px', fontSize: '11.5px' }}
                      >
                        <CalendarPlus size={13} />
                        <span>Perpanjang</span>
                      </button>
                    )}

                    {canSign && status === 'AWAITING' && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => onSign(kontrak)}
                        aria-label={`Tanda tangani kontrak ${kontrak.contract_code}`}
                        style={{ padding: '5px 9px', fontSize: '11.5px' }}
                      >
                        <PenLine size={13} />
                        <span>Tanda Tangani</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
