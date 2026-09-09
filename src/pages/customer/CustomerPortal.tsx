import React, { useState } from 'react';
import { Equipment, Rental, Contract, Payment, User } from '../../types';
import { Truck, ClipboardList, FileCheck, CreditCard, Check, Upload, ArrowRight, ShieldCheck, PenTool, Calendar, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { getEquipmentImage, STITCH_IMAGES } from '../../lib/stitchAssets';
import { formatRupiah } from '../../lib/businessRules';

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
  const [signatureName, setSignatureName] = useState(currentUser.full_name);

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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Customer Header Banner */}
      <div style={{
        padding: '24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src={STITCH_IMAGES.CUSTOMER_AVATAR}
            alt={currentUser.full_name}
            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                Selamat Datang, {currentUser.full_name}
              </h2>
              <span className="badge badge-info" style={{ fontSize: '11px' }}>
                {currentUser.company_name || 'Pelanggan Terverifikasi'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-secondary)', margin: '4px 0 0 0' }}>
              Portal Pemesanan Alat Berat, Penandatanganan Kontrak Digital, dan Konfirmasi Pembayaran Sewa.
            </p>
          </div>
        </div>

        {/* Dedicated Account Manager Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid var(--color-border)'
        }}>
          <img
            src={STITCH_IMAGES.MANAGER_AVATAR}
            alt="Account Manager PT SBS"
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              Account Manager Anda
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
              Rahmat Hidayat, S.T.
            </div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              WA: +62 811-500-8899 (Online)
            </div>
          </div>
        </div>
      </div>

      {/* 4 Interactive Navigation Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '14px',
            borderRadius: '8px',
            border: activeTab === 'catalog' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'catalog' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'catalog' ? 'var(--color-primary)' : '#F1F5F9',
            color: activeTab === 'catalog' ? '#FFFFFF' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Truck size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: activeTab === 'catalog' ? 'var(--color-primary)' : '#1E293B' }}>
              Katalog Alat
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
              {equipments.filter(e => e.status === 'AVAILABLE').length} Unit Siap Sewa
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_rentals')}
          style={{
            padding: '14px',
            borderRadius: '8px',
            border: activeTab === 'my_rentals' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'my_rentals' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'my_rentals' ? 'var(--color-primary)' : '#F1F5F9',
            color: activeTab === 'my_rentals' ? '#FFFFFF' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ClipboardList size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: activeTab === 'my_rentals' ? 'var(--color-primary)' : '#1E293B' }}>
              Sewa Saya
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
              {myRentals.length} Transaksi
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contracts')}
          style={{
            padding: '14px',
            borderRadius: '8px',
            border: activeTab === 'contracts' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'contracts' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'contracts' ? 'var(--color-primary)' : '#F1F5F9',
            color: activeTab === 'contracts' ? '#FFFFFF' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileCheck size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: activeTab === 'contracts' ? 'var(--color-primary)' : '#1E293B' }}>
              Kontrak & E-Sign
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
              {myContracts.length} Berkas Kontrak
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '14px',
            borderRadius: '8px',
            border: activeTab === 'payments' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'payments' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'payments' ? 'var(--color-primary)' : '#F1F5F9',
            color: activeTab === 'payments' ? '#FFFFFF' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CreditCard size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: activeTab === 'payments' ? 'var(--color-primary)' : '#1E293B' }}>
              Tagihan & Transfer
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
              {myPayments.length} Pembayaran
            </div>
          </div>
        </button>
      </div>

      {/* Tab: Catalog Alat Berat with Authentic Stitch Images */}
      {activeTab === 'catalog' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
              Katalog Alat Berat Siap Mobilisasi
            </h3>
            <span style={{ fontSize: '12.5px', color: 'var(--color-secondary)' }}>
              Armada standar pertambangan & konstruksi PT. SBS Banjarmasin
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {equipments.map((eq) => {
              const isAvailable = eq.status === 'AVAILABLE';
              const imgUrl = eq.thumbnail_url || getEquipmentImage(eq.equipment_code, eq.type);

              return (
                <div key={eq.id} className="card-premium" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ height: '175px', width: '100%', overflow: 'hidden', position: 'relative', backgroundColor: '#E2E8F0' }}>
                    <img
                      src={imgUrl}
                      alt={eq.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <span className={`badge badge-${eq.status.toLowerCase()}`}>
                        {isAvailable ? 'Tersedia' : eq.status === 'RENTED' ? 'Disewa' : eq.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary)', marginBottom: '4px' }}>
                        {eq.equipment_code}
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                        {eq.name}
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginBottom: '12px' }}>
                        Merk: <strong>{eq.brand}</strong> &bull; Model: <strong>{eq.model}</strong>
                      </div>
                    </div>

                    <div>
                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Tarif Sewa:</div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                            {formatRupiah(Number(eq.rental_price_per_day))}
                            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-secondary)' }}> /hari</span>
                          </div>
                        </div>

                        <button
                          type="button"
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
                {myRentals.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                      Belum ada transaksi sewa. Silakan pilih alat pada menu Katalog Alat.
                    </td>
                  </tr>
                ) : (
                  myRentals.map((r) => {
                    const imgUrl = getEquipmentImage(r.equipment_code);
                    return (
                      <tr key={r.id}>
                        <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                          {r.rental_code}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={imgUrl} alt={r.equipment_name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{r.equipment_name}</div>
                              <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{r.equipment_code}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {r.start_date} s/d {r.end_date}
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          <strong>{r.total_days} Hari</strong>
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A', fontFamily: 'monospace' }}>
                          {formatRupiah(Number(r.subtotal))}
                        </td>
                        <td>
                          <span className={`badge badge-${r.status.toLowerCase()}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
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
                {myContracts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                      Belum ada kontrak yang diterbitkan untuk akun ini.
                    </td>
                  </tr>
                ) : (
                  myContracts.map((c) => (
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
                          <span className="badge badge-available" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} />
                            Telah Ditandatangani
                          </span>
                        ) : (
                          <span className="badge badge-pending" style={{ fontSize: '11px' }}>
                            Menunggu Tanda Tangan
                          </span>
                        )}
                      </td>
                      <td>
                        {!c.is_signed_customer ? (
                          <button
                            type="button"
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
                  ))
                )}
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
                {myPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                      Belum ada tagihan pembayaran aktif.
                    </td>
                  </tr>
                ) : (
                  myPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                        {p.payment_code}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '13.5px', fontFamily: 'monospace' }}>
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
                            type="button"
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
                  ))
                )}
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
          title={`Pengajuan Sewa: ${selectedEquipment.name}`}
        >
          <form onSubmit={handleConfirmRent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '14px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <img
                src={selectedEquipment.thumbnail_url || getEquipmentImage(selectedEquipment.equipment_code, selectedEquipment.type)}
                alt={selectedEquipment.name}
                style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div style={{ fontSize: '13px' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{selectedEquipment.name}</div>
                <div style={{ color: 'var(--color-secondary)', fontSize: '11.5px', marginBottom: '4px' }}>
                  Kode: <span className="serial-code">{selectedEquipment.equipment_code}</span> &bull; {selectedEquipment.brand} {selectedEquipment.model}
                </div>
                <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                  {formatRupiah(Number(selectedEquipment.rental_price_per_day))} / hari
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                  Tanggal Mulai Sewa
                </label>
                <input
                  type="date"
                  required
                  className="input-premium"
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
                  required
                  className="input-premium"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Catatan Lokasi / Proyek Pekerjaan
              </label>
              <textarea
                rows={2}
                className="input-premium"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pekerjaan cut & fill Pelabuhan Trisakti Banjarmasin"
              />
            </div>

            <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-secondary)' }}>
                <span>Durasi: <strong>{calculateDays(startDate, endDate)} Hari</strong></span>
                <span>Tarif: <strong>{formatRupiah(Number(selectedEquipment.rental_price_per_day))}</strong>/hari</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)' }}>
                <span>Total Estimasi Biaya Sewa:</span>
                <span style={{ fontFamily: 'monospace' }}>{formatRupiah(calculateDays(startDate, endDate) * Number(selectedEquipment.rental_price_per_day))}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setIsRentModalOpen(false)} className="btn-secondary">
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Ajukan Permohonan Sewa
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12.5px', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 6px 0' }}>
                Dengan membubuhkan tanda tangan elektronik di bawah ini, <strong>{currentUser.full_name}</strong> atas nama <strong>{currentUser.company_name || 'Pelanggan'}</strong> menyetujui seluruh ketentuan sewa alat berat PT. Surya Bangun Sarana Banjarmasin, termasuk tanggung jawab operasional dan jadwal mobilisasi.
              </p>
              <p style={{ margin: 0, color: 'var(--color-secondary)', fontSize: '11px' }}>
                Legalitas dokumen dijamin sah berdasarkan UU ITE Pasal 11 tentang Tanda Tangan Elektronik.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Nama Penandatangan Resmi (Sesuai KTP / Perusahaan)
              </label>
              <input
                type="text"
                className="input-premium"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
              />
            </div>

            {/* E-Signature Canvas Mockup */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Goresan Tanda Tangan Digital
              </label>
              <div style={{
                height: '110px',
                border: '2px dashed var(--color-primary)',
                borderRadius: '8px',
                backgroundColor: '#FAFAFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <div style={{ fontFamily: 'Brush Script MT, cursive, serif', fontSize: '32px', color: 'var(--color-primary)', transform: 'rotate(-3deg)' }}>
                  {signatureName}
                </div>
                <span style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '10px', color: 'var(--color-secondary)', fontFamily: 'monospace' }}>
                  TIMESTAMP: {new Date().toISOString()}
                </span>
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
            <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
              <div>Jumlah Tagihan: <strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>{formatRupiah(Number(uploadingPayment.amount))}</strong></div>
              <div>Metode: <strong>{uploadingPayment.payment_method}</strong></div>
              <div>Rekening Tujuan: <strong>Bank Mandiri 031-00-1234567-8 a/n PT. Surya Bangun Sarana</strong></div>
            </div>

            {/* Visual Struk Transfer Mockup Asli Stitch Prototype */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Pratinjau Struk / Bukti Transfer
              </label>
              <div style={{
                height: '160px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                backgroundColor: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
                Lokasi / Nama Berkas Bukti Transfer
              </label>
              <input
                type="text"
                className="input-premium"
                value={proofFile}
                onChange={(e) => setProofFile(e.target.value)}
              />
              <div style={{ fontSize: '11px', color: 'var(--color-secondary)', marginTop: '4px' }}>
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
