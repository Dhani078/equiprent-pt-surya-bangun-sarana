/**
 * Tab "Tagihan": kartu ringkasan + tabel pembayaran dengan aksi unggah bukti.
 * Ringkasan dihitung induk lewat `summarizeBilling` (modul yang sama dengan API).
 */
import { Upload } from 'lucide-react';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatRupiah, formatRupiahRingkas } from '../../../lib/businessRules';
import { isPaymentFinal } from '../../../lib/paymentWorkflow';
import type { BillingSummary } from '../../../lib/portal';
import type { Payment } from '../../../types';

interface Props {
  payments: Payment[];
  ringkasan: BillingSummary;
  onUploadProof: (p: Payment) => void;
}

export const PaymentsTab: React.FC<Props> = ({ payments, ringkasan, onUploadProof }) => (
  <div className="card-premium" style={{ padding: '20px' }}>
    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 16px 0' }}>
      Tagihan Pembayaran Sewa & Bukti Transfer
    </h3>

    {/* Ringkasan tagihan. Sengaja dihitung oleh modul (bukan inline)
        agar angkanya tidak pernah berbeda dengan yang dihitung API. */}
    {payments.length > 0 && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-raised)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Total Tagihan</div>
          <div className="serial-code" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-primary)' }} title={formatRupiah(ringkasan.totalAmount)}>
            {formatRupiahRingkas(ringkasan.totalAmount).ringkas}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{ringkasan.total} tagihan</div>
        </div>

        <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-green-soft)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Sudah Lunas</div>
          <div className="serial-code" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--fg-success-deep)' }} title={formatRupiah(ringkasan.lunasAmount)}>
            {formatRupiahRingkas(ringkasan.lunasAmount).ringkas}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{ringkasan.lunasCount} tagihan</div>
        </div>

        <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-amber-soft)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Menunggu Verifikasi</div>
          <div className="serial-code" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--fg-warning-deep)' }} title={formatRupiah(ringkasan.menungguVerifikasiAmount)}>
            {formatRupiahRingkas(ringkasan.menungguVerifikasiAmount).ringkas}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{ringkasan.menungguVerifikasiCount} tagihan</div>
        </div>

        <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-red-soft)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Belum Dibayar</div>
          <div className="serial-code" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--fg-danger)' }} title={formatRupiah(ringkasan.belumBayarAmount)}>
            {formatRupiahRingkas(ringkasan.belumBayarAmount).ringkas}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
            {ringkasan.belumBayarCount} tagihan
            {ringkasan.ditolakCount > 0 && ` (${ringkasan.ditolakCount} bukti ditolak)`}
          </div>
        </div>
      </div>
    )}

    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Kode Pembayaran</th>
            <th>Total Tagihan</th>
            <th>Metode Pembayaran</th>
            <th>Waktu Bayar</th>
            <th>Status Pembayaran</th>
            <th>Aksi Unggah Bukti</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                Belum ada tagihan pembayaran aktif.
              </td>
            </tr>
          ) : (
            payments.map((p) => {
              // Tagihan yang sudah final (lunas) tidak bisa dilampiri
              // ulang buktinya — tombol unggah karenanya disembunyikan.
              const bisaUnggah = !isPaymentFinal(p.status);
              return (
                <tr key={p.id}>
                  <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                    {p.payment_code}
                  </td>
                  <td className="serial-code" style={{ fontWeight: 700, fontSize: '13.5px' }}>
                    {formatRupiah(Number(p.amount))}
                  </td>
                  <td style={{ fontSize: '12.5px' }}>{p.payment_method}</td>
                  <td style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>{p.payment_date}</td>
                  <td>
                    <StatusBadge kind="payment" status={p.status} />
                    {p.status === 'FAILED' && (
                      <div style={{ fontSize: '10.5px', color: 'var(--fg-danger-deep)', marginTop: '3px', fontWeight: 600 }}>
                        Bukti ditolak — silakan lampirkan ulang
                      </div>
                    )}
                  </td>
                  <td>
                    {bisaUnggah ? (
                      <button
                        type="button"
                        onClick={() => onUploadProof(p)}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        aria-label={`Unggah bukti transfer ${p.payment_code}`}
                      >
                        <Upload size={13} />
                        <span>{p.status === 'FAILED' ? 'Unggah Ulang Bukti' : 'Unggah Bukti Transfer'}</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--fg-success-deep)', fontWeight: 600 }}>
                        Pembayaran Lunas
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);
