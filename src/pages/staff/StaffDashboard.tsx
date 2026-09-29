import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Rental, Contract, Payment, Maintenance, User, Equipment } from '../../types';
import { ContractPanel } from '../../components/ContractPanel';
import { DueNotificationPanel } from './components/DueNotificationPanel';
import { PaymentProofViewerModal } from './components/PaymentProofViewerModal';
import { StaffActionBadges, type StaffSubTab } from './components/StaffActionBadges';
import { PaymentVerificationTable } from './components/PaymentVerificationTable';
import { RentalApprovalTable } from './components/RentalApprovalTable';
import { getLatePenaltyPerDay } from '../../lib/businessRules';
import { summarizePaymentQueue } from '../../lib/paymentWorkflow';

interface StaffDashboardProps {
  rentals: Rental[];
  contracts: Contract[];
  payments: Payment[];
  maintenance: Maintenance[];
  /** Unit alat berat — diperlukan panel kontrak untuk melengkapi rincian objek sewa. */
  equipments: Equipment[];
  users: User[];
  currentUser: User;
  onVerifyPayment: (paymentId: number, staffId: number, staffName: string) => Promise<void>;
  /** Menolak bukti transfer yang tidak sah (Pending Verification → FAILED). */
  onRejectPayment: (paymentId: number, staffId: number, staffName: string) => Promise<void>;
  onUpdateRentalStatus: (id: number, status: Rental['status']) => Promise<void>;
  /** Menerbitkan kontrak baru — wewenang Staf Operasional. */
  onCreateContract: (rentalId: number) => Promise<void>;
  /** Membubuhkan tanda tangan atas nama perusahaan. */
  onSignContract: (contractId: number, signerName: string, signature: string) => Promise<void>;
  /** Memperpanjang masa berlaku kontrak kedaluwarsa (Admin/Staf saja). */
  onRenewContract?: (contractId: number, validUntil: string) => Promise<void>;
  /** Umpan balik sederhana (sukses / galat) setelah sebuah aksi. */
  onNotify?: (message: string, tone: 'success' | 'error') => void;
  /** Tab sidebar aktif — sub-tab mengikuti saat user mengklik "Kontrak Sewa Digital" dsb. */
  activeMenu?: string;
}

/**
 * Terminal Staf Operasional.
 *
 * Render dipecah ke staff/components/: StaffActionBadges (pemilih sub-tab +
 * angka antrean), PaymentVerificationTable (verifikasi struk), RentalApprovalTable
 * (persetujuan booking). State aksi & pencarian tetap di induk.
 */
export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  rentals,
  contracts,
  payments,
  equipments,
  users,
  currentUser,
  onVerifyPayment,
  onRejectPayment,
  onUpdateRentalStatus,
  onCreateContract,
  onSignContract,
  onRenewContract,
  onNotify,
  activeMenu
}) => {
  const [activeSubTab, setActiveSubTab] = useState<StaffSubTab>('payments');

  /* Sidebar "Kontrak Sewa Digital"/"Transaksi Penyewaan" kini menggerakkan sub-tab;
     sebelumnya highlight nav tidak cocok dgn konten (bug audit visual cycle 57). */
  useEffect(() => {
    if (activeMenu === 'contracts' || activeMenu === 'rentals' || activeMenu === 'payments') {
      setActiveSubTab(activeMenu);
    }
  }, [activeMenu]);
  const [viewingPaymentProof, setViewingPaymentProof] = useState<Payment | null>(null);
  /** Pencarian pada tabel pembayaran: kode bayar, klien, atau kode kontrak. */
  const [paymentSearch, setPaymentSearch] = useState('');
  /** ID pembayaran yang sedang diproses — mencegah klik ganda. */
  const [processingId, setProcessingId] = useState<number | null>(null);

  const pendingPayments = payments.filter(p => p.status === 'PENDING_VERIFICATION');
  const pendingRentals = rentals.filter(r => r.status === 'PENDING');

  /** Ringkasan antrean verifikasi: siap diverifikasi vs menunggu bukti. */
  const antrean = useMemo(() => summarizePaymentQueue(payments), [payments]);

  /**
   * Daftar pembayaran yang tampil, mengikuti kotak pencarian.
   * Penyaringan tidak mengubah sumber data — hanya tampilan.
   */
  const visiblePayments = useMemo(() => {
    const kata = paymentSearch.trim().toLowerCase();
    if (kata === '') return payments;

    return payments.filter((p) =>
      [p.payment_code, p.customer_name ?? '', p.contract_code ?? '', p.payment_method]
        .join(' ')
        .toLowerCase()
        .includes(kata)
    );
  }, [payments, paymentSearch]);

  /**
   * Menjalankan aksi verifikasi/penolakan dengan penanganan galat.
   *
   * `db.*` melempar galat bila aturan bisnis dilanggar (misalnya tagihan
   * sudah final). Tanpa penanganan di sini, galat itu menjadi unhandled
   * promise rejection dan antarmuka terdiam tanpa penjelasan.
   */
  const jalankanAksi = useCallback(
    async (
      payment: Payment,
      aksi: 'verify' | 'reject',
      jalankan: () => Promise<void>
    ): Promise<void> => {
      if (processingId !== null) return;
      setProcessingId(payment.id);
      try {
        await jalankan();
        onNotify?.(
          aksi === 'verify'
            ? `Pembayaran ${payment.payment_code} ditandai lunas.`
            : `Bukti transfer ${payment.payment_code} ditolak. Pelanggan dapat melampirkan ulang bukti.`,
          'success'
        );
        setViewingPaymentProof(null);
      } catch {
        onNotify?.(
          aksi === 'verify'
            ? `Pembayaran ${payment.payment_code} gagal diverifikasi. Muat ulang dan coba lagi.`
            : `Bukti transfer ${payment.payment_code} gagal ditolak. Muat ulang dan coba lagi.`,
          'error'
        );
      } finally {
        setProcessingId(null);
      }
    },
    [onNotify, processingId]
  );

  /**
   * Notifikasi jatuh tempo & keterlambatan.
   * Fokus pada rental ON_GOING: segera jatuh tempo (≤ 3 hari) atau sudah
   * lewat end_date (berjalan, unit belum kembali).
   * Denda memakai tarif flat getLatePenaltyPerDay() dari aturan bisnis.
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
          denda: terlambat ? Math.abs(selisihHari) * getLatePenaltyPerDay() : 0,
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

      <DueNotificationPanel
        rows={dueNotifications}
        totalDenda={totalDenda}
        jumlahTerlambat={jumlahTerlambat}
        onTindakLanjut={() => setActiveSubTab('rentals')}
      />

      <StaffActionBadges
        activeSubTab={activeSubTab}
        onSelect={setActiveSubTab}
        pendingPayments={pendingPayments.length}
        readyToVerify={antrean.readyToVerifyCount}
        awaitingProof={antrean.awaitingProofCount}
        pendingRentals={pendingRentals.length}
        totalContracts={contracts.length}
      />

      {/* Sub Tab: Payments Verification */}
      {activeSubTab === 'payments' && (
        <PaymentVerificationTable
          payments={visiblePayments}
          antrean={antrean}
          paymentSearch={paymentSearch}
          onSearchChange={setPaymentSearch}
          processingId={processingId}
          onViewProof={setViewingPaymentProof}
          onVerify={(p) => void jalankanAksi(p, 'verify', () => onVerifyPayment(p.id, currentUser.id, currentUser.full_name))}
          onReject={(p) => void jalankanAksi(p, 'reject', () => onRejectPayment(p.id, currentUser.id, currentUser.full_name))}
        />
      )}

      {/* Sub Tab: Rentals Approval with Thumbnails */}
      {activeSubTab === 'rentals' && (
        <RentalApprovalTable rentals={rentals} onUpdateStatus={(id, status) => void onUpdateRentalStatus(id, status)} />
      )}

      {/* Sub Tab: Contracts */}
      {activeSubTab === 'contracts' && (
        <ContractPanel
          contracts={contracts}
          rentals={rentals}
          equipments={equipments}
          users={users}
          onCreateContract={onCreateContract}
          onSignContract={onSignContract}
          onRenewContract={onRenewContract}
          title="Kontrak Sewa Digital & Tanda Tangan Elektronik"
          canIssue={true}
          canSign={false}
        />
      )}

      {/* Modal pratinjau bukti transfer — komponen PaymentProofViewerModal. */}
      {viewingPaymentProof && (
        <PaymentProofViewerModal
          payment={viewingPaymentProof}
          processingId={processingId}
          onClose={() => setViewingPaymentProof(null)}
          onVerify={() =>
            jalankanAksi(viewingPaymentProof, 'verify', () =>
              onVerifyPayment(viewingPaymentProof.id, currentUser.id, currentUser.full_name)
            )
          }
          onReject={() =>
            jalankanAksi(viewingPaymentProof, 'reject', () =>
              onRejectPayment(viewingPaymentProof.id, currentUser.id, currentUser.full_name)
            )
          }
        />
      )}
    </div>
  );
};
