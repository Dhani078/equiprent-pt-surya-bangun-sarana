import React from 'react';
import { Payment } from '../../../types';
import { Check, Eye, Search, X } from 'lucide-react';
import { formatRupiah, formatRupiahRingkas, formatTanggal } from '../../../lib/businessRules';
import { Paginator, usePagination } from '../../../components/Paginator';
import { StatusBadge } from '../../../components/StatusBadge';
import { getPaymentStatusLabel, isPaymentFinal, type PaymentQueueSummary } from '../../../lib/paymentWorkflow';

const PAGE_SIZE_PAYMENTS = 20;

interface PaymentVerificationTableProps {
  /** Daftar pembayaran yang sudah tersaring pencarian. */
  payments: Payment[];
  antrean: PaymentQueueSummary;
  paymentSearch: string;
  onSearchChange: (v: string) => void;
  /** ID yang sedang diproses — tombol dinonaktifkan (cegah klik ganda). */
  processingId: number | null;
  onViewProof: (p: Payment) => void;
  onVerify: (p: Payment) => void;
  onReject: (p: Payment) => void;
}

/**
 * Tabel verifikasi pembayaran staf: pencarian, banner nilai tertahan,
 * bukti struk, jejak peninjau, dan tombol lunas/tolak.
 */
export const PaymentVerificationTable: React.FC<PaymentVerificationTableProps> = ({
  payments,
  antrean,
  paymentSearch,
  onSearchChange,
  processingId,
  onViewProof,
  onVerify,
  onReject,
}) => {
  const [page, setPage] = React.useState(1);
  React.useEffect(() => setPage(1), [paymentSearch]);
  const paged = usePagination(payments, PAGE_SIZE_PAYMENTS, page);

  return (
    <div className="card-premium" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 14px 0', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          Daftar Pembayaran & Bukti Transfer Klien
        </h3>

        {/* Ringkasan antrean: memisahkan yang siap diverifikasi dari
            yang masih menunggu bukti, agar staf tidak mengklik tombol
            verifikasi yang pasti gagal. */}
        <span style={{ fontSize: '11.5px', color: 'var(--color-secondary)' }}>
          {antrean.pendingCount} menunggu · {antrean.readyToVerifyCount} siap verifikasi ·{' '}
          {antrean.awaitingProofCount} menunggu bukti · {antrean.paidCount} lunas
        </span>

        <div style={{ marginLeft: 'auto', position: 'relative', minWidth: '220px' }}>
          <Search
            size={14}
            aria-hidden="true"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }}
          />
          <input
            type="search"
            className="input-premium"
            value={paymentSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari kode bayar, klien, atau kontrak..."
            aria-label="Cari pembayaran"
            style={{ paddingLeft: '32px', fontSize: '12.5px' }}
          />
        </div>
      </div>

      {antrean.pendingAmount > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            padding: '10px 14px',
            marginBottom: '14px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-amber-soft)',
            border: '1px solid var(--border-amber-soft)',
            fontSize: '12.5px',
          }}
        >
          <span style={{ color: 'var(--fg-warning-deep)', fontWeight: 600 }}>
            Nilai tagihan menunggu verifikasi
          </span>
          <span className="serial-code" style={{ fontWeight: 800, color: 'var(--fg-warning-deep)' }} title={formatRupiah(antrean.pendingAmount)}>
            {formatRupiahRingkas(antrean.pendingAmount).ringkas}
          </span>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode Bayar</th>
              <th>Klien Pembayar</th>
              <th>Jumlah Tagihan</th>
              <th>Metode Bayar</th>
              <th>Bukti Struk</th>
              <th>Status</th>
              <th>Aksi Verifikasi</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                  {paymentSearch.trim() === ''
                    ? 'Belum ada tagihan pembayaran yang tercatat.'
                    : `Tidak ada pembayaran yang cocok dengan "${paymentSearch}".`}
                </td>
              </tr>
            ) : (
              paged.map((p) => {
                const adaBukti = typeof p.payment_proof_path === 'string' && p.payment_proof_path.trim() !== '';
                const siapVerifikasi = p.status === 'PENDING_VERIFICATION' && adaBukti;
                const sedangDiproses = processingId === p.id;

                return (
                  <tr key={p.id}>
                    <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                      {p.payment_code}
                    </td>
                    <td>
                      <strong>{p.customer_name || 'Pelanggan SBS'}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{p.contract_code}</div>
                    </td>
                    <td className="serial-code" style={{ fontWeight: 700, fontSize: '13.5px' }} title={formatRupiah(Number(p.amount))}>
                      {formatRupiahRingkas(Number(p.amount)).ringkas}
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      {p.payment_method}
                    </td>
                    <td>
                      {adaBukti ? (
                        <button
                          type="button"
                          onClick={() => onViewProof(p)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          aria-label={`Lihat bukti transfer ${p.payment_code}`}
                        >
                          <Eye size={12} />
                          <span>Lihat Bukti</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--fg-warning-deep)', fontWeight: 600 }}>
                          Belum dilampirkan
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge kind="payment" status={p.status} />
                      {/* Jejak peninjau: siapa & kapan tagihan ini disahkan/ditolak. */}
                      {p.verified_at && (
                        <div style={{ fontSize: '10.5px', color: 'var(--color-secondary)', marginTop: '3px' }}>
                          {p.status === 'FAILED' ? 'Ditolak' : 'Diverifikasi'} {p.verified_by_name || 'Staf'} ·{' '}
                          {formatTanggal(p.verified_at)}
                        </div>
                      )}
                    </td>
                    <td>
                      {siapVerifikasi ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            disabled={sedangDiproses}
                            onClick={() => onVerify(p)}
                            className="btn-primary"
                            style={{ padding: '5px 12px', fontSize: '12px', backgroundColor: '#10B981', opacity: sedangDiproses ? 0.6 : 1 }}
                            aria-label={`Verifikasi lunas ${p.payment_code}`}
                          >
                            <Check size={13} />
                            <span>{sedangDiproses ? 'Memproses...' : 'Verifikasi Lunas'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={sedangDiproses}
                            onClick={() => onReject(p)}
                            className="btn-secondary"
                            style={{ padding: '5px 12px', fontSize: '12px', color: 'var(--fg-danger)' }}
                            aria-label={`Tolak bukti transfer ${p.payment_code}`}
                          >
                            <X size={13} />
                            <span>Tolak</span>
                          </button>
                        </div>
                      ) : p.status === 'PENDING_VERIFICATION' ? (
                        <span style={{ fontSize: '11.5px', color: 'var(--fg-warning-deep)', fontWeight: 600 }}>
                          Menunggu bukti klien
                        </span>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--color-secondary)', fontWeight: 600 }}>
                          {isPaymentFinal(p.status) ? 'Status final' : getPaymentStatusLabel(p.status)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Paginator
          total={payments.length}
          page={page}
          limit={PAGE_SIZE_PAYMENTS}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};
