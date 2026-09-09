import React, { useState, useMemo } from 'react';
import { Rental, Contract, Payment, Maintenance, User } from '../../types';
import { ClipboardCheck, CreditCard, FileCheck, Check, Clock, AlertCircle, CheckCircle, XCircle, Eye, Bell } from 'lucide-react';
import { getEquipmentImage, STITCH_IMAGES } from '../../lib/stitchAssets';
import { Modal } from '../../components/Modal';
import { formatRupiah, LATE_PENALTY_PER_DAY } from '../../lib/businessRules';

interface StaffDashboardProps {
  rentals: Rental[];
  contracts: Contract[];
  payments: Payment[];
  maintenance: Maintenance[];
  currentUser: User;
  onVerifyPayment: (paymentId: number, staffId: number, staffName: string) => Promise<any>;
  onUpdateRentalStatus: (id: number, status: Rental['status']) => Promise<any>;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  rentals,
  contracts,
  payments,
  maintenance,
  currentUser,
  onVerifyPayment,
  onUpdateRentalStatus
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'payments' | 'contracts' | 'rentals'>('payments');
  const [viewingPaymentProof, setViewingPaymentProof] = useState<Payment | null>(null);

  const pendingPayments = payments.filter(p => p.status === 'PENDING_VERIFICATION');
  const pendingRentals = rentals.filter(r => r.status === 'PENDING');

  /**
   * Notifikasi jatuh tempo & keterlambatan.
   * Fokus pada rental ON_GOING: segera jatuh tempo (≤ 3 hari) atau sudah
   * lewat end_date (berjalan, unit belum kembali).
   * Denda memakai tarif flat LATE_PENALTY_PER_DAY dari aturan bisnis.
   */
  const dueNotifications = useMemo(() => {
    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);

    const rows = rentals
      .filter(r => r.status === 'ON_GOING' && r.end_date)
      .map(r => {
        const akhir = new Date(r.end_date as string);
        akhir.setHours(0, 0, 0, 0);
        const selisihHari = Math.floor((akhir.getTime() - hariIni.getTime()) / 86400000);
        const terlambat = selisihHari < 0;
        return {
          rental: r,
          selisihHari,
          terlambat,
          hariTerlambat: terlambat ? Math.abs(selisihHari) : 0,
          denda: terlambat ? Math.abs(selisihHari) * LATE_PENALTY_PER_DAY : 0,
          segeraJatuhTempo: !terlambat && selisihHari <= 3,
        };
      })
      .filter(x => x.terlambat || x.segeraJatuhTempo)
      .sort((a, b) => (b.terlambat ? 1 : 0) - (a.terlambat ? 1 : 0) || b.hariTerlambat - a.hariTerlambat);

    return rows;
  }, [rentals]);

  const totalDenda = useMemo(
    () => dueNotifications.reduce((s, x) => s + x.denda, 0),
    [dueNotifications]
  );
  const jumlahTerlambat = useMemo(
    () => dueNotifications.filter(x => x.terlambat).length,
    [dueNotifications]
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
          Terminal Staf Operasional & Verifikasi
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-secondary)', margin: '4px 0 0 0' }}>
          Validasi bukti transfer pembayaran klien, penerbitan kontrak sewa, dan pengesahan order rental PT. SBS.
        </p>
      </div>

      {/* Panel Notifikasi Jatuh Tempo & Keterlambatan */}
      {dueNotifications.length > 0 && (
        <div
          className="card-premium animate-fade-in"
          style={{ padding: '16px 18px', borderLeft: `4px solid ${jumlahTerlambat > 0 ? '#DC2626' : '#F59E0B'}` }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <Bell size={18} color={jumlahTerlambat > 0 ? '#DC2626' : '#F59E0B'} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
              Notifikasi Jatuh Tempo & Keterlambatan
            </h3>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                backgroundColor: jumlahTerlambat > 0 ? '#FEE2E2' : '#FEF3C7',
                color: jumlahTerlambat > 0 ? '#991B1B' : '#92400E',
              }}
            >
              {jumlahTerlambat} terlambat · {dueNotifications.length - jumlahTerlambat} segera jatuh tempo
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dueNotifications.slice(0, 6).map(({ rental, terlambat, hariTerlambat, denda, selisihHari }) => (
              <div
                key={rental.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  backgroundColor: terlambat ? '#FEF2F2' : '#FFFBEB',
                  borderRadius: '8px',
                  border: `1px solid ${terlambat ? '#FECACA' : '#FDE68A'}`,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {rental.equipment_name || `Unit #${rental.equipment_id}`}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-secondary)' }}>
                    {rental.rental_code} · {rental.customer_name}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                  Jatuh tempo: <strong>{rental.end_date}</strong>
                </div>

                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    backgroundColor: terlambat ? '#DC2626' : '#F59E0B',
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {terlambat ? `TERLAMBAT ${hariTerlambat} HARI` : `${selisihHari} HARI LAGI`}
                </span>

                {terlambat && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: '#991B1B',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Denda {formatRupiah(denda)}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setActiveSubTab('rentals')}
                  className="btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '11.5px' }}
                >
                  Tindak Lanjut
                </button>
              </div>
            ))}
          </div>

          {jumlahTerlambat > 0 && (
            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: 800,
                color: '#991B1B',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span>Total estimasi denda keterlambatan (tarif {formatRupiah(LATE_PENALTY_PER_DAY)}/hari)</span>
              <span style={{ fontFamily: 'monospace' }}>{formatRupiah(totalDenda)}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Stat Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('payments')}
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-eight)',
            border: activeSubTab === 'payments' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeSubTab === 'payments' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
              Verifikasi Pembayaran
            </span>
            <CreditCard size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
            {pendingPayments.length} Menunggu
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rentals')}
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-eight)',
            border: activeSubTab === 'rentals' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeSubTab === 'rentals' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
              Permohonan Sewa Masuk
            </span>
            <ClipboardCheck size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
            {pendingRentals.length} Order
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('contracts')}
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-eight)',
            border: activeSubTab === 'contracts' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeSubTab === 'contracts' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
              Total Kontrak Aktif
            </span>
            <FileCheck size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
            {contracts.length} Dokumen
          </div>
        </button>
      </div>

      {/* Sub Tab: Payments Verification */}
      {activeSubTab === 'payments' && (
        <div className="card-premium" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 14px 0' }}>
            Daftar Pembayaran & Bukti Transfer Klien
          </h3>
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
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                      {p.payment_code}
                    </td>
                    <td>
                      <strong>{p.customer_name || 'Pelanggan SBS'}</strong>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '13.5px', fontFamily: 'monospace' }}>
                      {formatRupiah(Number(p.amount))}
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      {p.payment_method}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setViewingPaymentProof(p)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={12} />
                        <span>Lihat Bukti</span>
                      </button>
                    </td>
                    <td>
                      <span className={`badge badge-${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {p.status === 'PENDING_VERIFICATION' ? (
                        <button
                          type="button"
                          onClick={() => onVerifyPayment(p.id, currentUser.id, currentUser.full_name)}
                          className="btn-primary"
                          style={{ padding: '5px 12px', fontSize: '12px', backgroundColor: '#10B981' }}
                        >
                          <Check size={13} />
                          <span>Verifikasi Lunas</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                          ✓ Diverifikasi oleh {p.verified_by_name || 'Staf'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab: Rentals Approval with Thumbnails */}
      {activeSubTab === 'rentals' && (
        <div className="card-premium" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 14px 0' }}>
            Permohonan Booking Masuk dari Pelanggan
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode Sewa</th>
                  <th>Pelanggan</th>
                  <th>Alat Berat</th>
                  <th>Tanggal Sewa</th>
                  <th style={{ textAlign: 'right' }}>Total Biaya</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi Staf</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((r) => {
                  const imgUrl = getEquipmentImage(r.equipment_code);
                  return (
                    <tr key={r.id}>
                      <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                        {r.rental_code}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.customer_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{r.company_name}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={imgUrl} alt={r.equipment_name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.equipment_name}</div>
                            <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{r.equipment_code}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {r.start_date} s/d {r.end_date} ({r.total_days} hari)
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                        {formatRupiah(Number(r.subtotal))}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge badge-${r.status.toLowerCase()}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {r.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => onUpdateRentalStatus(r.id, 'APPROVED')}
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '11.5px', backgroundColor: '#10B981' }}
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateRentalStatus(r.id, 'REJECTED')}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11.5px', color: '#EF4444' }}
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                            {r.status} ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab: Contracts */}
      {activeSubTab === 'contracts' && (
        <div className="card-premium" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 14px 0' }}>
            Daftar Kontrak Sewa yang Telah Diterbitkan
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nomor Kontrak</th>
                  <th>ID Rental</th>
                  <th>Pelanggan</th>
                  <th>Masa Berlaku</th>
                  <th>Status Tanda Tangan</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                      {c.contract_code}
                    </td>
                    <td className="serial-code" style={{ fontSize: '12px' }}>
                      {c.rental_code || `RNT-SBS-${c.rental_id}`}
                    </td>
                    <td>
                      <strong>{c.customer_name || 'Pelanggan SBS'}</strong>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {c.contract_date} s/d {c.valid_until}
                    </td>
                    <td>
                      {c.is_signed_customer ? (
                        <span className="badge badge-available" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} />
                          Ditandatangani ({c.signed_at?.slice(0, 10)})
                        </span>
                      ) : (
                        <span className="badge badge-pending" style={{ fontSize: '11px' }}>
                          Menunggu E-Sign Klien
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal View Payment Proof */}
      {viewingPaymentProof && (
        <Modal
          isOpen={true}
          onClose={() => setViewingPaymentProof(null)}
          title={`Bukti Transfer: ${viewingPaymentProof.payment_code}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12.5px' }}>
              <div>Klien: <strong>{viewingPaymentProof.customer_name || 'Pelanggan'}</strong></div>
              <div>Jumlah: <strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>{formatRupiah(Number(viewingPaymentProof.amount))}</strong></div>
              <div>Status: <strong>{viewingPaymentProof.status}</strong></div>
            </div>

            <div style={{
              height: '240px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              backgroundColor: '#000'
            }}>
              <img
                src={STITCH_IMAGES.PAYMENT_PROOF}
                alt="Struk Bukti Transfer"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60';
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setViewingPaymentProof(null)}
                className="btn-secondary"
              >
                Tutup
              </button>
              {viewingPaymentProof.status === 'PENDING_VERIFICATION' && (
                <button
                  type="button"
                  onClick={async () => {
                    await onVerifyPayment(viewingPaymentProof.id, currentUser.id, currentUser.full_name);
                    setViewingPaymentProof(null);
                  }}
                  className="btn-primary"
                  style={{ backgroundColor: '#10B981' }}
                >
                  <Check size={14} />
                  <span>Verifikasi Lunas Sekarang</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
