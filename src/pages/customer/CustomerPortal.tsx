import React, { useEffect, useState, useMemo } from 'react';
import { Equipment, Rental, Contract, Payment, User, GpsTracking } from '../../types';
import { RentBookingModal } from './RentBookingModal';
import { PaymentProofModal } from './PaymentProofModal';
import { ContractPanel } from '../../components/ContractPanel';
import { PortalHeader } from './portal/PortalHeader';
import { CatalogTab } from './portal/CatalogTab';
import { MyRentalsTab } from './portal/MyRentalsTab';
import { PaymentsTab } from './portal/PaymentsTab';
import { TrackingTab } from './portal/TrackingTab';
import { validatePaymentProofPath } from '../../lib/paymentWorkflow';
import {
  buildCatalog,
  buildRentalJourney,
  checkRentalRequest,
  summarizeBilling,
  selectMyContracts,
  selectMyPayments,
  selectMyRentals,
  DEFAULT_CATALOG_FILTER,
} from '../../lib/portal';
import type { CatalogFilter } from '../../lib/portal';
import { buildFleetTelemetry } from '../../lib/fleetTelemetry';

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
  /** Memperpanjang masa berlaku kontrak kedaluwarsa (Admin/Staf saja). */
  onRenewContract?: (contractId: number, validUntil: string) => Promise<void>;
  onUploadPaymentProof: (paymentId: number, proofPath: string) => Promise<void>;
  /** Tab menu sidebar — sinkronkan konten portal saat user klik nav. */
  activeMenu?: string;
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
  onRenewContract,
  onUploadPaymentProof,
  activeMenu
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_rentals' | 'contracts' | 'payments' | 'tracking'>('catalog');

  /* Nav sidebar "Penyewaan Saya"/"Kontrak Digital Saya"/dst dulu hanya highlight
     tanpa mengubah konten (temuan audit cycle 58) — kini sinkron. */
  useEffect(() => {
    const map: Record<string, 'catalog' | 'my_rentals' | 'contracts' | 'payments' | 'tracking'> = {
      dashboard: 'catalog', rentals: 'my_rentals', contracts: 'contracts', payments: 'payments', tracking: 'tracking'
    };
    if (activeMenu && map[activeMenu]) setActiveTab(map[activeMenu]);
  }, [activeMenu]);
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
      <PortalHeader
        namaPengguna={currentUser.full_name}
        perusahaan={currentUser.company_name ?? null}
        activeTab={activeTab}
        onSelect={setActiveTab}
        jumlahKontrak={myContracts.length}
        jumlahSewa={myRentals.length}
        jumlahTagihan={myPayments.length}
        jumlahUnitBeroperasi={lacakView.rows.length}
        unitSiapSewa={katalog.summary.bookable}
        tagihanBelumBayar={ringkasanTagihan.belumBayarCount}
      />

      {/* Tab: Katalog — filter + kartu unit (portal/CatalogTab). */}
      {activeTab === 'catalog' && (
        <CatalogTab
          katalog={katalog}
          totalArmada={equipments.length}
          filter={catalogFilter}
          onFilterChange={setCatalogFilter}
          startDate={startDate}
          endDate={endDate}
          onChangeTanggal={(m, s) => { setStartDate(m); setEndDate(s); }}
          tampilkanTerpesan={tampilkanTerpesan}
          onToggleTerpesan={() => setTampilkanTerpesan((v) => !v)}
          onSewa={handleOpenRent}
        />
      )}

      {/* Tab: Riwayat sewa (portal/MyRentalsTab). */}
      {activeTab === 'my_rentals' && (
        <MyRentalsTab perjalanan={perjalananSewa} onOpenTab={(tab) => setActiveTab(tab)} />
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
          onRenewContract={onRenewContract}
          title="Kontrak Sewa Digital & Tanda Tangan Elektronik"
          canIssue={false}
          canSign={true}
        />
      )}

      {/* Tab: Tagihan (portal/PaymentsTab). */}
      {activeTab === 'payments' && (
        <PaymentsTab
          payments={myPayments}
          ringkasan={ringkasanTagihan}
          onUploadProof={(p) => { setProofError(null); setUploadingPayment(p); }}
        />
      )}

      {/* Tab: Lacak unit (portal/TrackingTab, Leaflet lazy di dalamnya). */}
      {activeTab === 'tracking' && (
        <TrackingTab
          view={lacakView}
          namaPenyewa={currentUser.company_name || currentUser.full_name}
          selectedUnitId={selectedTrackedUnit}
          onSelectUnit={setSelectedTrackedUnit}
        />
      )}

      {/* Modal pengajuan sewa — komponen RentBookingModal. */}
      {selectedEquipment && isRentModalOpen && (
        <RentBookingModal
          equipment={selectedEquipment}
          startDate={startDate}
          endDate={endDate}
          notes={notes}
          estimasi={estimasi}
          rentError={rentError}
          onChangeTanggal={(m, s) => { setStartDate(m); setEndDate(s); }}
          onChangeCatatan={setNotes}
          onClose={() => setIsRentModalOpen(false)}
          onSubmit={handleConfirmRent}
        />
      )}

      {/* Modal bukti transfer — komponen PaymentProofModal. */}
      {uploadingPayment && (
        <PaymentProofModal
          payment={uploadingPayment}
          proofFile={proofFile}
          proofError={proofError}
          sending={sendingProof}
          onChangeFile={setProofFile}
          onClose={() => { setUploadingPayment(null); setProofError(null); }}
          onSend={kirimBuktiTransfer}
        />
      )}
    </div>
  );
};
