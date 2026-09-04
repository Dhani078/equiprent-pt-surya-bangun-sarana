import React, { useState } from 'react';
import { Rental, Contract, Payment, Maintenance, User, Equipment } from '../../types';
import { ClipboardCheck, CreditCard, FileCheck, Check, Clock, AlertCircle } from 'lucide-react';

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

  const pendingPayments = payments.filter(p => p.status === 'PENDING_VERIFICATION');
  const pendingRentals = rentals.filter(r => r.status === 'PENDING');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
          Terminal Staf Operasional & Verifikasi
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-secondary-light)', margin: '4px 0 0 0' }}>
          Validasi bukti transfer pembayaran klien, penerbitan kontrak sewa, dan pengesahan order rental.
        </p>
      </div>

      {/* Action Stat Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <button
          onClick={() => setActiveSubTab('payments')}
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-eight)',
            border: activeSubTab === 'payments' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeSubTab === 'payments' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'var(--transition-base)'
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
          onClick={() => setActiveSubTab('rentals')}
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-eight)',
            border: activeSubTab === 'rentals' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeSubTab === 'rentals' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'var(--transition-base)'
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
          onClick={() => setActiveSubTab('contracts')}
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-eight)',
            border: activeSubTab === 'contracts' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeSubTab === 'contracts' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'var(--transition-base)'
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
                  <th>Waktu Transfer</th>
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
                    <td style={{ fontWeight: 700, fontSize: '13.5px' }}>
                      {formatRupiah(Number(p.amount))}
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      {p.payment_method}
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--color-secondary)' }}>
                      {p.payment_date}
                    </td>
                    <td>
                      <span className={`badge badge-${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {p.status === 'PENDING_VERIFICATION' ? (
                        <button
                          onClick={() => onVerifyPayment(p.id, currentUser.id, currentUser.full_name)}
                          className="btn-primary"
                          style={{ padding: '5px 12px', fontSize: '12px', backgroundColor: '#10B981' }}
                        >
                          <Check size={13} />
                          <span>Verifikasi Lunas</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                          Diverifikasi oleh {p.verified_by_name || 'Staf'}
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

      {/* Sub Tab: Rentals Approval */}
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
                  <th>Total Biaya</th>
                  <th>Status</th>
                  <th>Aksi Staf</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((r) => (
                  <tr key={r.id}>
                    <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                      {r.rental_code}
                    </td>
                    <td>
                      <div><strong>{r.company_name || r.customer_name}</strong></div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-secondary-light)' }}>{r.customer_name}</div>
                    </td>
                    <td>
                      <div>{r.equipment_name}</div>
                      <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>{r.equipment_code}</span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {r.start_date} s/d {r.end_date}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '13px' }}>
                      {formatRupiah(Number(r.subtotal))}
                    </td>
                    <td>
                      <span className={`badge badge-${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => onUpdateRentalStatus(r.id, 'APPROVED')}
                            className="btn-primary"
                            style={{ padding: '5px 10px', fontSize: '11.5px', backgroundColor: '#10B981' }}
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => onUpdateRentalStatus(r.id, 'REJECTED')}
                            className="btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '11.5px', color: '#EF4444' }}
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                          {r.status === 'APPROVED' ? 'Telah Disetujui' : r.status}
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

      {/* Sub Tab: Contracts */}
      {activeSubTab === 'contracts' && (
        <div className="card-premium" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 14px 0' }}>
            Daftar Kontrak Sewa Digital & Perjanjian Legal
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode Kontrak</th>
                  <th>ID Rental</th>
                  <th>Klien Penandatangan</th>
                  <th>Masa Berlaku</th>
                  <th>Status Tanda Tangan Digital</th>
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
                      <strong>{c.customer_name || 'Pelanggan'}</strong>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {c.contract_date} s/d {c.valid_until}
                    </td>
                    <td>
                      {c.is_signed_customer ? (
                        <span className="badge badge-available" style={{ fontSize: '11px' }}>
                          <Check size={12} />
                          Telah Ditandatangani Klien
                        </span>
                      ) : (
                        <span className="badge badge-pending" style={{ fontSize: '11px' }}>
                          Menunggu Tanda Tangan
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
    </div>
  );
};
