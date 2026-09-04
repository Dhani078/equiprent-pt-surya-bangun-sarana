import React, { useState } from 'react';
import { Equipment, Rental, Contract, Payment, User } from '../../types';
import { Truck, ClipboardList, FileCheck, CreditCard, Check, Upload, ArrowRight, ShieldCheck, PenTool } from 'lucide-react';
import { Modal } from '../../components/Modal';

interface CustomerPortalProps {
  currentUser: User;
  equipments: Equipment[];
  rentals: Rental[];
  contracts: Contract[];
  payments: Payment[];
  onAddRental: (item: Omit<Rental, 'id' | 'rental_code'>) => Promise<any>;
  onSignContract: (contractId: number) => Promise<any>;
  onUploadPaymentProof: (paymentId: number, proofPath: string) => Promise<any>;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  currentUser,
  equipments,
  rentals,
  contracts,
  payments,
  onAddRental,
  onSignContract,
  onUploadPaymentProof
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_rentals' | 'contracts' | 'payments'>('catalog');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);

  // E-Sign Modal
  const [signingContract, setSigningContract] = useState<Contract | null>(null);

  // Payment Upload Modal
  const [uploadingPayment, setUploadingPayment] = useState<Payment | null>(null);
  const [proofFile, setProofFile] = useState('uploads/proofs/transfer_mandiri_resmi.png');

  // Rent Booking Form State
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState('Pekerjaan proyek penataan lahan di wilayah Kalimantan Selatan');

  const myRentals = rentals.filter(r => r.customer_id === currentUser.id || r.customer_name?.includes(currentUser.full_name));
  const myContracts = contracts.filter(c => c.customer_id === currentUser.id);
  const myPayments = payments.filter(p => p.customer_id === currentUser.id);

  const calculateDays = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diff / (1000 * 3600 * 24)));
  };

  const handleOpenRent = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setIsRentModalOpen(true);
  };

  const handleConfirmRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;

    const days = calculateDays(startDate, endDate);
    const subtotal = days * Number(selectedEquipment.rental_price_per_day);

    await onAddRental({
      customer_id: currentUser.id,
      customer_name: currentUser.full_name,
      company_name: currentUser.company_name || 'Pelanggan Korporasi',
      equipment_id: selectedEquipment.id,
      equipment_name: selectedEquipment.name,
      equipment_code: selectedEquipment.equipment_code,
      booking_date: new Date().toISOString(),
      start_date: startDate,
      end_date: endDate,
      total_days: days,
      subtotal,
      status: 'PENDING',
      notes
    });

    setIsRentModalOpen(false);
    setActiveTab('my_rentals');
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Customer Header */}
      <div style={{
        padding: '24px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-eight)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
            Portal Pelanggan PT. SBS
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', margin: '4px 0 0 0' }}>
            Selamat Datang, {currentUser.full_name}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-light)', margin: '4px 0 0 0' }}>
            {currentUser.company_name || 'Penyewa Rekanan'} &bull; Sistem Monitoring & Rental Alat Berat
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('catalog')}
            className={activeTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <Truck size={15} />
            <span>Katalog Unit</span>
          </button>
          <button
            onClick={() => setActiveTab('my_rentals')}
            className={activeTab === 'my_rentals' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <ClipboardList size={15} />
            <span>Sewa Saya ({myRentals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={activeTab === 'contracts' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <FileCheck size={15} />
            <span>Kontrak Digital</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <CreditCard size={15} />
            <span>Tagihan & Bukti</span>
          </button>
        </div>
      </div>

      {/* Tab: Catalog */}
      {activeTab === 'catalog' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
              Katalog Alat Berat Siap Sewa
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
              Menampilkan armada berstandar industri siap mobilisasi
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {equipments.map((eq) => {
              const isAvailable = eq.status === 'AVAILABLE';
              return (
                <div key={eq.id} className="card-premium" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ height: '160px', width: '100%', overflow: 'hidden', position: 'relative', backgroundColor: '#E2E8F0' }}>
                    <img
                      src={eq.thumbnail_url || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&auto=format&fit=crop&q=80'}
                      alt={eq.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <span className={`badge badge-${eq.status.toLowerCase()}`}>
                        {eq.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary-light)', marginBottom: '4px' }}>
                        {eq.equipment_code}
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                        {eq.name}
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginBottom: '12px' }}>
                        Merk: <strong>{eq.brand}</strong> &bull; Tipe: <strong>{eq.type}</strong>
                      </div>
                    </div>

                    <div>
                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>Tarif Sewa:</div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {formatRupiah(Number(eq.rental_price_per_day))}
                            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-secondary-light)' }}> /hari</span>
                          </div>
                        </div>

                        <button
                          disabled={!isAvailable}
                          onClick={() => handleOpenRent(eq)}
                          className={isAvailable ? 'btn-primary' : 'btn-secondary'}
                          style={{ padding: '7px 14px', fontSize: '12.5px', opacity: isAvailable ? 1 : 0.6 }}
                        >
                          {isAvailable ? 'Ajukan Sewa' : 'Tidak Tersedia'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: My Rentals */}
      {activeTab === 'my_rentals' && (
        <div className="card-premium" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 16px 0' }}>
            Riwayat Permohonan & Transaksi Sewa Saya
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode Transaksi</th>
                  <th>Unit Alat Berat</th>
                  <th>Jadwal Operasional</th>
                  <th>Durasi Proyek</th>
                  <th>Estimasi Biaya</th>
                  <th>Status Sewa</th>
                </tr>
              </thead>
              <tbody>
                {myRentals.map((r) => (
                  <tr key={r.id}>
                    <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                      {r.rental_code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{r.equipment_name}</div>
                      <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>{r.equipment_code}</span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {r.start_date} s/d {r.end_date}
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      <strong>{r.total_days} Hari</strong>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                      {formatRupiah(Number(r.subtotal))}
                    </td>
                    <td>
                      <span className={`badge badge-${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Contracts */}
      {activeTab === 'contracts' && (
        <div className="card-premium" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 16px 0' }}>
            Kontrak Sewa Digital & Tanda Tangan Elektronik
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nomor Kontrak</th>
                  <th>ID Rental</th>
                  <th>Masa Berlaku</th>
                  <th>Status Tanda Tangan</th>
                  <th>Aksi Tanda Tangan</th>
                </tr>
              </thead>
              <tbody>
                {myContracts.map((c) => (
                  <tr key={c.id}>
                    <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                      {c.contract_code}
                    </td>
                    <td className="serial-code" style={{ fontSize: '12px' }}>
                      {c.rental_code || `RNT-SBS-${c.rental_id}`}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {c.contract_date} s/d {c.valid_until}
                    </td>
                    <td>
                      {c.is_signed_customer ? (
                        <span className="badge badge-available" style={{ fontSize: '11px' }}>
                          <Check size={12} />
                          Telah Ditandatangani
                        </span>
                      ) : (
                        <span className="badge badge-pending" style={{ fontSize: '11px' }}>
                          Belum Ditandatangani
                        </span>
                      )}
                    </td>
                    <td>
                      {!c.is_signed_customer ? (
                        <button
                          onClick={() => setSigningContract(c)}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <PenTool size={13} />
                          <span>Tanda Tangan E-Sign</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                          Sah & Legalisasi ({c.signed_at?.slice(0, 10)})
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

      {/* Tab: Payments */}
      {activeTab === 'payments' && (
        <div className="card-premium" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 16px 0' }}>
            Tagihan Pembayaran Sewa & Bukti Transfer
          </h3>
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
                {myPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                      {p.payment_code}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '13.5px' }}>
                      {formatRupiah(Number(p.amount))}
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      {p.payment_method}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                      {p.payment_date}
                    </td>
                    <td>
                      <span className={`badge badge-${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {p.status !== 'PAID' ? (
                        <button
                          onClick={() => setUploadingPayment(p)}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <Upload size={13} />
                          <span>Unggah Bukti Transfer</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                          Pembayaran Lunas
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

      {/* Modal: Rent Booking */}
      {selectedEquipment && (
        <Modal
          isOpen={isRentModalOpen}
          onClose={() => setIsRentModalOpen(false)}
          title={`Penyewaan Alat: ${selectedEquipment.name}`}
        >
          <form onSubmit={handleConfirmRent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {selectedEquipment.equipment_code} &bull; {selectedEquipment.brand}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                Tarif: {formatRupiah(Number(selectedEquipment.rental_price_per_day))} / hari
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                  Tanggal Mulai Sewa
                </label>
                <input
                  type="date"
                  className="input-premium"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                  Tanggal Selesai Sewa
                </label>
                <input
                  type="date"
                  className="input-premium"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-secondary)' }}>
                <span>Durasi Hari:</span>
                <strong>{calculateDays(startDate, endDate)} hari</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                <span>Total Estimasi:</span>
                <span>{formatRupiah(calculateDays(startDate, endDate) * Number(selectedEquipment.rental_price_per_day))}</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Lokasi & Catatan Proyek
              </label>
              <textarea
                className="input-premium"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setIsRentModalOpen(false)} className="btn-secondary">
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Kirim Permohonan Sewa
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: E-Sign Contract */}
      {signingContract && (
        <Modal
          isOpen={true}
          onClose={() => setSigningContract(null)}
          title={`Penandatanganan Kontrak: ${signingContract.contract_code}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px', lineHeight: 1.6 }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 8px 0' }}>
                Syarat & Ketentuan Kontrak Sewa PT. SBS:
              </h4>
              <p style={{ whiteSpace: 'pre-line', margin: 0, color: '#334155' }}>
                {signingContract.terms_conditions}
              </p>
            </div>

            <div style={{ padding: '16px', border: '2px dashed var(--color-primary)', borderRadius: '8px', textAlign: 'center', backgroundColor: '#EFF6FF' }}>
              <ShieldCheck size={32} color="var(--color-primary)" style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                Tanda Tangan Elektronik Sah (E-Sign)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-secondary-light)', marginTop: '4px' }}>
                Dengan menekan tombol setuju di bawah, Anda secara sadar mengikatkan diri dalam perjanjian sewa alat berat PT. Surya Bangun Sarana Banjarmasin.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setSigningContract(null)} className="btn-secondary">
                Tinjau Kembali
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onSignContract(signingContract.id);
                  setSigningContract(null);
                }}
                className="btn-primary"
              >
                <Check size={16} />
                <span>Bubuhkan Tanda Tangan Digital</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Upload Payment Proof */}
      {uploadingPayment && (
        <Modal
          isOpen={true}
          onClose={() => setUploadingPayment(null)}
          title={`Konfirmasi Transfer: ${uploadingPayment.payment_code}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
              <div>Jumlah Tagihan: <strong>{formatRupiah(Number(uploadingPayment.amount))}</strong></div>
              <div>Metode: <strong>{uploadingPayment.payment_method}</strong></div>
              <div>Rekening Tujuan: <strong>Bank Mandiri 031-00-1234567-8 a/n PT. Surya Bangun Sarana</strong></div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Lokasi / Nama Berkas Bukti Transfer
              </label>
              <input
                type="text"
                className="input-premium"
                value={proofFile}
                onChange={(e) => setProofFile(e.target.value)}
              />
              <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)', marginTop: '4px' }}>
                Unggah bukti mutasi bank transfer atau struk setor resmi.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setUploadingPayment(null)} className="btn-secondary">
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onUploadPaymentProof(uploadingPayment.id, proofFile);
                  setUploadingPayment(null);
                }}
                className="btn-primary"
              >
                <Upload size={14} />
                <span>Kirim Bukti Pembayaran</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
