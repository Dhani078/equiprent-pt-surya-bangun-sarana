import React, { useState, useMemo } from 'react';
import { Equipment, Rental, Contract, Payment, User, GpsTracking } from '../../types';
import { Truck, ClipboardList, FileCheck, CreditCard, Check, Upload, ArrowRight, ShieldCheck, PenTool, Calendar, DollarSign, FileText, CheckCircle, MapPin, Crosshair } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { ContractPanel } from '../../components/ContractPanel';
import { LeafletMap } from '../../components/LeafletMap';
import { getEquipmentImage, STITCH_IMAGES } from '../../lib/stitchAssets';
import { formatRupiah, formatWaktu } from '../../lib/businessRules';
import { getPaymentStatusLabel, isPaymentFinal, validatePaymentProofPath } from '../../lib/paymentWorkflow';
import {
  buildCatalog,
  buildRentalJourney,
  checkRentalRequest,
  summarizeBilling,
  selectMyContracts,
  selectMyPayments,
  selectMyRentals,
  CATALOG_AVAILABILITY_LABEL,
  CATALOG_AVAILABILITY_TONE,
  RENTAL_JOURNEY_LABEL,
  RENTAL_JOURNEY_TONE,
  RENTAL_NEXT_ACTION_LABEL,
  DEFAULT_CATALOG_FILTER,
} from '../../lib/customerPortal';
import type { CatalogFilter } from '../../lib/customerPortal';
import {
  buildFleetTelemetry,
  formatCoordinate,
  formatSpeed,
  getFuelLabel,
  getMovementLabel,
} from '../../lib/fleetTelemetry';

interface CustomerPortalProps {
  currentUser: User;
  equipments: Equipment[];
  rentals: Rental[];
  contracts: Contract[];
  payments: Payment[];
  /** Titik telemetri mentah seluruh armada; disaring ke miliknya sendiri. */
  trackingData: GpsTracking[];
  onAddRental: (item: Omit<Rental, 'id' | 'rental_code'>) => Promise<void>;
  onSignContract: (contractId: number, signerName: string, signature: string) => Promise<void>;
  onUploadPaymentProof: (paymentId: number, proofPath: string) => Promise<void>;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  currentUser,
  equipments,
  rentals,
  contracts,
  payments,
  trackingData,
  onAddRental,
  onSignContract,
  onUploadPaymentProof
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_rentals' | 'contracts' | 'payments' | 'tracking'>('catalog');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);

  // Payment Upload Modal
  const [uploadingPayment, setUploadingPayment] = useState<Payment | null>(null);
  const [proofFile, setProofFile] = useState('uploads/proofs/transfer_mandiri_resmi.png');
  /** Pesan galat validasi bukti (aturan sama dengan server). */
  const [proofError, setProofError] = useState<string | null>(null);
  /** Menandai berkas bukti sedang dikirim — mencegah klik ganda. */
  const [sendingProof, setSendingProof] = useState(false);

  // Rent Booking Form State
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState('Pekerjaan proyek penataan lahan di wilayah Kalimantan Selatan');
  const [rentError, setRentError] = useState<string | null>(null);

  // Penentuan "milik siapa" dipusatkan di modul `customerPortal` dan DIUJI:
  // basisnya `customer_id`, dengan cadangan pencocokan nama untuk baris
  // impor lama yang kehilangan ID. Menulis ulang `==` di sini berisiko
  // membocorkan data pelanggan lain bila satu kolom saja berbeda.
  const myRentals = useMemo(() => selectMyRentals(rentals, currentUser), [rentals, currentUser]);
  const myContracts = useMemo(() => selectMyContracts(contracts, currentUser), [contracts, currentUser]);
  const myPayments = useMemo(() => selectMyPayments(payments, currentUser), [payments, currentUser]);

  /**
   * Pelacakan GPS HANYA untuk unit yang sedang pelanggan ini sewa.
   *
   * Pembatasan dihitung oleh modul `fleetTelemetry` — mesin yang sama
   * dipakai edge API `GET /api/tracking`. Tanpa penyaringan ini pelanggan
   * dapat melihat posisi seluruh armada, termasuk unit pelanggan lain.
   */
  const unitSewaSaya = useMemo(
    () =>
      myRentals
        .filter(r => r.status === 'ON_GOING' || r.status === 'APPROVED')
        .map(r => r.equipment_id),
    [myRentals]
  );

  const lacakView = useMemo(
    () =>
      buildFleetTelemetry(
        trackingData,
        { role: 'CUSTOMER', equipmentIds: unitSewaSaya }
      ),
    [trackingData, unitSewaSaya]
  );

  const [selectedTrackedUnit, setSelectedTrackedUnit] = useState<number | null>(null);

  // Penyaring katalog: kata kunci, kategori, dan urutan harga.
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>(DEFAULT_CATALOG_FILTER);

  /**
   * Secara bawaan katalog hanya menampilkan unit yang bebas pada periode
   * yang dipilih (kriteria penerimaan T-0011). Tombol pada kepala katalog
   * dapat memunculkan unit yang sedang disewa — dengan badge "Sedang
   * Disewa" dan tombol nonaktif — bila pelanggan ingin melihat seluruh
   * armada. Unit dalam perawatan tetap tidak pernah ditampilkan.
   */
  const [tampilkanTerpesan, setTampilkanTerpesan] = useState(false);

  /**
   * Katalog yang hanya berisi unit yang BISA DISEWA pada periode yang
   * sedang dipilih. Penyaringan dilakukan oleh modul `customerPortal`
   * (satu definisi ketersediaan dengan API), bukan oleh `status === 'AVAILABLE'`
   * yang hanya menggambarkan keadaan hari ini.
   */
  const katalog = useMemo(
    () => buildCatalog(equipments, rentals, startDate, endDate, catalogFilter, {
      includeBlocked: tampilkanTerpesan,
    }),
    [equipments, rentals, startDate, endDate, catalogFilter, tampilkanTerpesan]
  );

  /**
   * Riwayat sewa lengkap dengan kontrak & tagihan terpasang.
   * `buildRentalJourney` mengembalikan `rental` yang sama persis dengan
   * `myRentals`, sehingga urutan & isi tabel tidak berubah.
   */
  const perjalananSewa = useMemo(
    () => buildRentalJourney(myRentals, myContracts, myPayments),
    [myRentals, myContracts, myPayments]
  );

  /** Ringkasan tab tagihan — dihitung oleh modul yang sama dengan API. */
  const ringkasanTagihan = useMemo(() => summarizeBilling(myPayments), [myPayments]);

  /**
   * Estimasi biaya pada modal pengajuan — memakai pemeriksa yang sama
   * dengan tombol "Ajukan Sewa", sehingga angka di layar tidak mungkin
   * berbeda dengan nilai yang akhirnya tersimpan pada sewa.
   */
  const estimasi = useMemo(
    () => checkRentalRequest(selectedEquipment, rentals, startDate, endDate),
    [selectedEquipment, rentals, startDate, endDate]
  );

  const handleOpenRent = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setRentError(null);
    setIsRentModalOpen(true);
  };

  /**
   * Mengirim bukti transfer setelah divalidasi dengan aturan yang SAMA
   * dengan server (`validatePaymentProofPath`). Validasi ganda seperti ini
   * membuat pelanggan langsung melihat kesalahan tanpa menunggu respons,
   * sekaligus tetap aman bila klien dimodifikasi.
   */
  const kirimBuktiTransfer = async (): Promise<void> => {
    if (!uploadingPayment || sendingProof) return;

    const hasil = validatePaymentProofPath(proofFile, { required: true });
    if (!hasil.ok) {
      setProofError(hasil.message);
      return;
    }

    setProofError(null);
    setSendingProof(true);
    try {
      await onUploadPaymentProof(uploadingPayment.id, hasil.value);
      setUploadingPayment(null);
    } catch {
      setProofError('Bukti transfer gagal dikirim. Periksa status tagihan, lalu coba lagi.');
    } finally {
      setSendingProof(false);
    }
  };

  const handleConfirmRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;

    // Satu pemeriksaan yang mencakup: unit ada, unit tidak dirawat, periode
    // masuk akal, tidak bentrok dengan sewa lain, dan durasi wajar. Biaya
    // dihitung oleh `calculateRentalCost` — rumus yang sama dengan dokumen
    // cetak & laporan, sehingga estimasi di layar tidak bisa berbeda dengan
    // angka pada tagihan.
    const hasil = checkRentalRequest(selectedEquipment, rentals, startDate, endDate);
    if (!hasil.ok) {
      setRentError(hasil.message);
      return;
    }

    setRentError(null);

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
      total_days: hasil.rentalDays,
      subtotal: hasil.subtotal,
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

      {/* 5 Interactive Navigation Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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
              {katalog.summary.bookable} Unit Siap Sewa
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
              {ringkasanTagihan.belumBayarCount > 0
                ? `${ringkasanTagihan.belumBayarCount} tagihan belum dibayar`
                : `${myPayments.length} Pembayaran`}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tracking')}
          style={{
            padding: '14px',
            borderRadius: '8px',
            border: activeTab === 'tracking' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'tracking' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
          aria-label="Lacak posisi unit sewa saya"
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'tracking' ? 'var(--color-primary)' : '#F1F5F9',
            color: activeTab === 'tracking' ? '#FFFFFF' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MapPin size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: activeTab === 'tracking' ? 'var(--color-primary)' : '#1E293B' }}>
              Lacak Unit Saya
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
              {lacakView.rows.length} Unit Beroperasi
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
              {katalog.summary.bookable} unit siap sewa dari {equipments.length} unit armada
            </span>
          </div>

          {/* Penyaring katalog: periode, kata kunci, kategori, urutan harga.
              Periode menentukan unit mana yang benar-benar bebas, sehingga
              dipasang di sini bukan di dalam modal pengajuan. */}
          <div
            className="card-premium"
            style={{
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'flex-end'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="portal-cari" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>
                Cari Unit
              </label>
              <input
                id="portal-cari"
                type="search"
                value={catalogFilter.search}
                onChange={(e) => setCatalogFilter((f) => ({ ...f, search: e.target.value }))}
                placeholder="Nama, kode, merk, atau kategori"
                className="form-input"
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="portal-kategori" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>
                Kategori
              </label>
              <select
                id="portal-kategori"
                value={catalogFilter.category}
                onChange={(e) => setCatalogFilter((f) => ({ ...f, category: e.target.value }))}
                className="form-input"
                style={{ width: '170px' }}
              >
                <option value="">Semua Kategori</option>
                {katalog.categories.map((kategori) => (
                  <option key={kategori} value={kategori}>{kategori}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="portal-urut" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>
                Urutkan
              </label>
              <select
                id="portal-urut"
                value={catalogFilter.sort}
                onChange={(e) =>
                  setCatalogFilter((f) => ({
                    ...f,
                    sort: e.target.value as CatalogFilter['sort'],
                  }))
                }
                className="form-input"
                style={{ width: '150px' }}
              >
                <option value="TERMURAH">Tarif Terendah</option>
                <option value="TERMAHAL">Tarif Tertinggi</option>
                <option value="TERBARU">Unit Terbaru</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="portal-mulai" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>
                Mulai Sewa
              </label>
              <input
                id="portal-mulai"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                style={{ width: '155px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="portal-selesai" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>
                Selesai Sewa
              </label>
              <input
                id="portal-selesai"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
                style={{ width: '155px' }}
              />
            </div>

            {(catalogFilter.search !== '' || catalogFilter.category !== '') && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12.5px' }}
                onClick={() => setCatalogFilter(DEFAULT_CATALOG_FILTER)}
              >
                Reset Filter
              </button>
            )}

            {/* Unit yang bentrok disembunyikan secara bawaan; tombol ini
                memunculkannya kembali tanpa membuka data perawatan. */}
            {katalog.summary.blockedBySchedule > 0 && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12.5px' }}
                aria-pressed={tampilkanTerpesan}
                onClick={() => setTampilkanTerpesan((v) => !v)}
              >
                {tampilkanTerpesan
                  ? `Sembunyikan ${katalog.summary.blockedBySchedule} unit terpesan`
                  : `Tampilkan ${katalog.summary.blockedBySchedule} unit terpesan`}
              </button>
            )}
          </div>

          {katalog.items.length === 0 ? (
            <div className="card-premium" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
                Tidak ada unit yang sesuai
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-secondary)' }}>
                {katalog.summary.blockedBySchedule > 0
                  ? `${katalog.summary.blockedBySchedule} unit sedang disewa pada periode ini. Coba geser tanggal mulai atau selesai.`
                  : 'Coba ubah kata kunci, kategori, atau periode sewa Anda.'}
              </div>
            </div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {katalog.items.map(({ equipment: eq, isBookable, availability, blockedMessage }) => {
              const imgUrl = eq.thumbnail_url || getEquipmentImage(eq.equipment_code, eq.type);
              const nada = CATALOG_AVAILABILITY_TONE[availability];

              return (
                <div key={eq.id} className="card-premium" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ height: '175px', width: '100%', overflow: 'hidden', position: 'relative', backgroundColor: '#E2E8F0' }}>
                    <img
                      src={imgUrl}
                      alt={eq.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <span className={`badge badge-${nada}`}>
                        {CATALOG_AVAILABILITY_LABEL[availability]}
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
                          disabled={!isBookable}
                          onClick={() => handleOpenRent(eq)}
                          className={isBookable ? 'btn-primary' : 'btn-secondary'}
                          style={{ padding: '7px 14px', fontSize: '12.5px', opacity: isBookable ? 1 : 0.6 }}
                        >
                          {isBookable ? 'Ajukan Sewa' : 'Tidak Tersedia'}
                        </button>
                      </div>

                      {/* Alasan penolakan ditampilkan di kartu — pelanggan tahu
                          unit ini sedang dipakai, bukan sekadar hilang. */}
                      {blockedMessage !== null && (
                        <div style={{ fontSize: '11.5px', color: '#B45309', lineHeight: 1.4 }}>
                          {blockedMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
              </div>
              )}
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
                  <th>Tahap Berikutnya</th>
                  </tr>
                  </thead>
                  <tbody>
                  {perjalananSewa.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                      Belum ada transaksi sewa. Silakan pilih alat pada menu Katalog Alat.
                    </td>
                  </tr>
                  ) : (
                  perjalananSewa.map(({ rental: r, statusLabel, statusTone, stage, stageLabel, stageTone, nextAction }) => {
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
                          <span className={`badge badge-${statusTone}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={`badge badge-${stageTone}`} style={{ fontSize: '11px' }}>
                              {stageLabel}
                            </span>
                            {/* Tindakan berikutnya hanya ditampilkan bila
                                giliran pelanggan bertindak. */}
                            {nextAction !== null && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveTab(
                                    nextAction === 'TANDA_TANGAN_KONTRAK' ? 'contracts' : 'payments'
                                  )
                                }
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  color: 'var(--color-primary)',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  textAlign: 'left'
                                }}
                              >
                                {RENTAL_NEXT_ACTION_LABEL[nextAction]}
                              </button>
                            )}
                          </div>
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
        <ContractPanel
          contracts={myContracts}
          rentals={rentals}
          equipments={equipments}
          users={[currentUser]}
          onCreateContract={async () => {
            // Pelanggan tidak dapat menerbitkan kontrak sendiri —
            // kontrak diterbitkan Admin/Staf setelah sewa disetujui.
            throw new Error('Penerbitan kontrak dilakukan oleh Admin atau Staf Operasional.');
          }}
          onSignContract={onSignContract}
          title="Kontrak Sewa Digital & Tanda Tangan Elektronik"
          canIssue={false}
          canSign={true}
        />
      )}

      {/* Tab: Payments */}
      {activeTab === 'payments' && (
        <div className="card-premium" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 16px 0' }}>
            Tagihan Pembayaran Sewa & Bukti Transfer
          </h3>

          {/* Ringkasan tagihan. Sengaja dihitung oleh modul (bukan inline)
              agar angkanya tidak pernah berbeda dengan yang dihitung API. */}
          {myPayments.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Total Tagihan</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                  {formatRupiah(ringkasanTagihan.totalAmount)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{ringkasanTagihan.total} tagihan</div>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Sudah Lunas</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                  {formatRupiah(ringkasanTagihan.lunasAmount)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{ringkasanTagihan.lunasCount} tagihan</div>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Menunggu Verifikasi</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#B45309', fontFamily: 'monospace' }}>
                  {formatRupiah(ringkasanTagihan.menungguVerifikasiAmount)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{ringkasanTagihan.menungguVerifikasiCount} tagihan</div>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Belum Dibayar</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#DC2626', fontFamily: 'monospace' }}>
                  {formatRupiah(ringkasanTagihan.belumBayarAmount)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                  {ringkasanTagihan.belumBayarCount} tagihan
                  {ringkasanTagihan.ditolakCount > 0 && ` (${ringkasanTagihan.ditolakCount} bukti ditolak)`}
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
                {myPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                      Belum ada tagihan pembayaran aktif.
                    </td>
                  </tr>
                ) : (
                  myPayments.map((p) => {
                    // Tagihan yang sudah final (lunas) tidak bisa dilampiri
                    // ulang buktinya — tombol unggah karenanya disembunyikan.
                    const bisaUnggah = !isPaymentFinal(p.status);

                    return (
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
                          {getPaymentStatusLabel(p.status)}
                        </span>
                        {p.status === 'FAILED' && (
                          <div style={{ fontSize: '10.5px', color: '#991B1B', marginTop: '3px', fontWeight: 600 }}>
                            Bukti ditolak — silakan lampirkan ulang
                          </div>
                        )}
                      </td>
                      <td>
                        {bisaUnggah ? (
                          <button
                            type="button"
                            onClick={() => {
                              setProofError(null);
                              setUploadingPayment(p);
                            }}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            aria-label={`Unggah bukti transfer ${p.payment_code}`}
                          >
                            <Upload size={13} />
                            <span>{p.status === 'FAILED' ? 'Unggah Ulang Bukti' : 'Unggah Bukti Transfer'}</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
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
      )}

      {/* Tab: Lacak Unit Saya (GPS Tracking) */}
      {activeTab === 'tracking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-premium" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 4px 0' }}>
              Pelacakan Posisi Unit Sewa Anda
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--color-secondary)', margin: 0 }}>
              Hanya unit yang sedang beroperasi atas nama {currentUser.company_name || currentUser.full_name} yang ditampilkan.
            </p>
          </div>

          {/* Empty state: pelanggan belum punya unit beroperasi */}
          {lacakView.rows.length === 0 ? (
            <div className="card-premium" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <Crosshair size={40} color="var(--color-border)" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '6px' }}>
                Belum ada unit yang dapat dilacak
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-secondary-light)', maxWidth: '420px', margin: '0 auto' }}>
                Posisi unit dapat dipantau setelah pengajuan sewa Anda disetujui dan unit berstatus beroperasi
                (ON_GOING). Ajukan sewa terlebih dahulu melalui menu Katalog Alat.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div className="card-premium" style={{ padding: '12px' }}>
                <LeafletMap
                  trackingData={lacakView.rows}
                  selectedUnitId={selectedTrackedUnit}
                  onSelectUnit={setSelectedTrackedUnit}
                />
              </div>

              <div className="card-premium" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>
                  Unit Beroperasi ({lacakView.rows.length})
                </div>

                {lacakView.rows.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: selectedTrackedUnit === row.equipmentId ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: selectedTrackedUnit === row.equipmentId ? '#EFF6FF' : '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{row.equipmentName}</div>
                        <div className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>
                          {row.equipmentCode}
                        </div>
                      </div>
                      <span className={`badge badge-${row.engineStatus === 'ON' ? 'active' : 'suspended'}`} style={{ fontSize: '10px' }}>
                        MESIN {row.engineStatus}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', color: 'var(--color-secondary)' }}>
                      <div>Kecepatan: <strong>{formatSpeed(row.speed)}</strong></div>
                      <div>BBM: <strong>{row.fuelLevelPercent}% ({getFuelLabel(row.fuel)})</strong></div>
                      <div>Status: <strong>{getMovementLabel(row.movement)}</strong></div>
                      <div>Direkam: <strong>{formatWaktu(row.recordedAt)}</strong></div>
                    </div>

                    <div className="gps-coordinates" style={{ fontSize: '11px', color: 'var(--color-secondary-light)', marginTop: '8px' }}>
                      {formatCoordinate(row.latitude)}, {formatCoordinate(row.longitude)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

            {/* Peringatan: unit tidak tersedia pada rentang tanggal dipilih */}
            {rentError && (
              <div
                role="alert"
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  color: '#dc2626',
                  fontSize: '12.5px',
                  fontWeight: 600
                }}
              >
                {rentError}
              </div>
            )}

            <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-secondary)' }}>
                <span>Durasi: <strong>{estimasi.ok ? `${estimasi.rentalDays} Hari` : '-'}</strong></span>
                <span>Tarif: <strong>{formatRupiah(Number(selectedEquipment.rental_price_per_day))}</strong>/hari</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)' }}>
                <span>Total Estimasi Biaya Sewa:</span>
                <span style={{ fontFamily: 'monospace' }}>
                  {estimasi.ok ? formatRupiah(estimasi.subtotal) : '-'}
                </span>
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
              {/* Pesan galat divalidasi dengan aturan yang SAMA dengan server,
                  sehingga pelanggan tidak mengirim berkas yang pasti ditolak. */}
              {proofError && (
                <div role="alert" style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 600, marginTop: '6px' }}>
                  {proofError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setUploadingPayment(null);
                  setProofError(null);
                }}
                className="btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sendingProof}
                onClick={kirimBuktiTransfer}
                className="btn-primary"
                style={{ opacity: sendingProof ? 0.6 : 1 }}
                aria-label="Kirim bukti pembayaran untuk diverifikasi"
              >
                <Upload size={14} />
                <span>{sendingProof ? 'Mengirim…' : 'Kirim Bukti Pembayaran'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
