import { useCallback, useMemo, useState } from 'react';
import { FileSignature } from 'lucide-react';
import { Modal } from './Modal';
import { ContractRenewModal } from './contract/ContractRenewModal';
import { ContractSignModal } from './contract/ContractSignModal';
import { ContractIssueModal } from './contract/ContractIssueModal';
import { ContractFilterBar } from './contract/ContractFilterBar';
import { ContractTable } from './contract/ContractTable';
import { ContractViewer } from './ContractViewer';
import {
  buildContractPreview,
  getContractLifecycleStatus,
  isContractSigned,
} from '../lib/contracts/index';
import { validateContractRenewal, validateContractSignature } from '../lib/validators';
import type { Contract, Equipment, Rental, User } from '../types';

/**
 * Panel Manajemen Kontrak Digital
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Satu panel untuk seluruh siklus kontrak:
 *   1. Terbitkan kontrak untuk transaksi sewa yang belum punya kontrak
 *   2. Tinjau isi kontrak (pratinjau identik dengan hasil cetak A4)
 *   3. Bubuhkan tanda tangan elektronik lewat kanvas
 *   4. Unduh / cetak kontrak yang sudah sah
 *
 * Panel ini MURNI terhadap sumber data: ia tidak mengambil data sendiri,
 * melainkan menerima `contracts`, `rentals`, `equipments`, dan `users` dari
 * induknya. Karena itu panel dapat dipakai baik di halaman Admin/Staf
 * maupun di portal Pelanggan tanpa perubahan.
 */

export interface ContractPanelProps {
  /** Seluruh kontrak yang boleh dilihat pengguna ini. */
  contracts: Contract[];
  /** Transaksi sewa, dipakai untuk memperkaya pratinjau & daftar penerbitan. */
  rentals: Rental[];
  /** Unit, dipakai untuk melengkapi rincian objek sewa. */
  equipments: Equipment[];
  /** Pengguna, dipakai untuk melengkapi nama pelanggan. */
  users: User[];
  /** Menerbitkan kontrak baru. Melempar bila gagal — panel yang menampilkannya. */
  onCreateContract: (rentalId: number) => Promise<void>;
  /** Membubuhkan tanda tangan. Melempar bila gagal — panel yang menampilkannya. */
  onSignContract: (contractId: number, signerName: string, signature: string) => Promise<void>;
  /** Memperpanjang masa berlaku kontrak kedaluwarsa (Admin/Staf). */
  onRenewContract?: (contractId: number, validUntil: string) => Promise<void>;
  /** Judul panel. */
  title?: string;
  /** Tampilkan tombol "Terbitkan Kontrak" (Admin/Staf saja). */
  canIssue?: boolean;
  /** Tampilkan tombol tanda tangan (pelanggan menandatangani miliknya). */
  canSign?: boolean;
}

/** Keadaan modal yang sedang aktif. */
type ActiveModal =
  | { kind: 'none' }
  | { kind: 'issue' }
  | { kind: 'preview'; contract: Contract }
  | { kind: 'sign'; contract: Contract }
  | { kind: 'renew'; contract: Contract };

export const ContractPanel: React.FC<ContractPanelProps> = ({
  contracts,
  rentals,
  equipments,
  users,
  onCreateContract,
  onSignContract,
  onRenewContract,
  title = 'Manajemen Kontrak Digital',
  canIssue = true,
  canSign = true,
}) => {
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SIGNED' | 'AWAITING' | 'EXPIRED'>('ALL');
  const [modal, setModal] = useState<ActiveModal>({ kind: 'none' });

  // Form tanda tangan
  const [signerName, setSignerName] = useState('');
  const [signature, setSignature] = useState('');
  const [signError, setSignError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form perpanjangan
  const [renewDate, setRenewDate] = useState('');
  const [renewError, setRenewError] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  // Form penerbitan
  const [selectedRentalId, setSelectedRentalId] = useState<number | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);

  /** Peta cepat: rentalId → kontrak, untuk menandai sewa yang sudah punya kontrak. */
  const contractByRental = useMemo(() => {
    const map = new Map<number, Contract>();
    for (const kontrak of contracts) map.set(kontrak.rental_id, kontrak);
    return map;
  }, [contracts]);

  /** Transaksi sewa yang layak diterbitkan kontraknya (sudah disetujui & belum punya kontrak). */
  const rentalsTanpaKontrak = useMemo(
    () =>
      rentals.filter(
        (r) =>
          (r.status === 'APPROVED' || r.status === 'ON_GOING' || r.status === 'COMPLETED') &&
          !contractByRental.has(r.id)
      ),
    [rentals, contractByRental]
  );

  /** Menyusun pratinjau untuk sebuah kontrak lengkap dengan data terkait. */
  const buildPreview = useCallback(
    (kontrak: Contract) =>
      buildContractPreview({
        contract: kontrak,
        rental: rentals.find((r) => r.id === kontrak.rental_id) ?? null,
        equipment:
          equipments.find(
            (e) => e.id === (rentals.find((r) => r.id === kontrak.rental_id)?.equipment_id ?? -1)
          ) ?? null,
        customer: users.find((u) => u.id === kontrak.customer_id) ?? null,
      }),
    [rentals, equipments, users]
  );

  /** Daftar kontrak setelah penyaringan. */
  const daftarKontrak = useMemo(() => {
    const kata = keyword.trim().toLowerCase();

    return contracts
      .filter((kontrak) => {
        if (filterStatus !== 'ALL' && getContractLifecycleStatus(kontrak) !== filterStatus) return false;
        if (kata === '') return true;

        const rental = rentals.find((r) => r.id === kontrak.rental_id);
        return (
          kontrak.contract_code.toLowerCase().includes(kata) ||
          (kontrak.customer_name ?? '').toLowerCase().includes(kata) ||
          (kontrak.rental_code ?? '').toLowerCase().includes(kata) ||
          (rental?.equipment_name ?? '').toLowerCase().includes(kata)
        );
      })
      // Kontrak yang menunggu tanda tangan didahulukan — itulah yang
      // biasanya sedang menunggu tindakan.
      .sort((a, b) => {
        const aSigned = isContractSigned(a) ? 1 : 0;
        const bSigned = isContractSigned(b) ? 1 : 0;
        if (aSigned !== bSigned) return aSigned - bSigned;
        return b.id - a.id;
      });
  }, [contracts, filterStatus, keyword, rentals]);

  /** Jumlah kontrak yang menunggu tanda tangan. */
  const jumlahMenunggu = useMemo(
    () => contracts.filter((k) => !isContractSigned(k)).length,
    [contracts]
  );

  const tutupModal = useCallback(() => {
    setModal({ kind: 'none' });
    setSignError(null);
    setIssueError(null);
    setFormErrors({});
    setSignature('');
    setSignerName('');
    setSelectedRentalId(null);
    setRenewError(null);
    setFormErrors({});
  }, []);

  const bukaTandaTangan = useCallback(
    (kontrak: Contract) => {
      const pelanggan = users.find((u) => u.id === kontrak.customer_id);
      setSignerName(kontrak.signer_name ?? kontrak.customer_name ?? pelanggan?.full_name ?? '');
      setSignature('');
      setSignError(null);
      setFormErrors({});
      setModal({ kind: 'sign', contract: kontrak });
    },
    [users]
  );

  /** Mengirim tanda tangan ke server. */
  const handleSign = useCallback(async () => {
    if (modal.kind !== 'sign') return;

    // Validasi dipakai di dua sisi (klien & server) dari modul yang sama,
    // sehingga pesan galat tidak pernah berbeda.
    const hasil = validateContractSignature({ signerName, signature });
    if (!hasil.ok) {
      setFormErrors(hasil.errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    setSignError(null);

    try {
      await onSignContract(modal.contract.id, hasil.value.signerName, hasil.value.signature);
      tutupModal();
    } catch (err) {
      setSignError(err instanceof Error ? err.message : 'Tanda tangan gagal disimpan.');
    } finally {
      setIsSubmitting(false);
    }
  }, [modal, signerName, signature, onSignContract, tutupModal]);

  /** Membuka dialog perpanjangan untuk kontrak kedaluwarsa. */
  const bukaPerpanjang = useCallback((kontrak: Contract) => {
    // Usulan awal: sebulan setelah batas lama, supaya staf tidak menghitung
    // sendiri saat kebutuhan umumnya sekadar memperpanjang satu periode.
    const lama = new Date(`${kontrak.valid_until}T12:00:00Z`);
    const usul = new Date(lama.getTime() + 30 * 86_400_000);
    setRenewDate(usul.toISOString().slice(0, 10));
    setRenewError(null);
    setFormErrors({});
    setModal({ kind: 'renew', contract: kontrak });
  }, []);

  /** Mengirim perpanjangan ke server. */
  const handleRenew = useCallback(async () => {
    if (modal.kind !== 'renew' || onRenewContract === undefined) return;

    const hasil = validateContractRenewal({ validUntil: renewDate });
    if (!hasil.ok) {
      setFormErrors(hasil.errors);
      return;
    }

    setFormErrors({});
    setIsRenewing(true);
    setRenewError(null);
    try {
      await onRenewContract(modal.contract.id, hasil.value.validUntil);
      tutupModal();
    } catch (err) {
      setRenewError(err instanceof Error ? err.message : 'Perpanjangan gagal disimpan.');
    } finally {
      setIsRenewing(false);
    }
  }, [modal, renewDate, onRenewContract, tutupModal]);

  /** Menerbitkan kontrak baru. */
  const handleIssue = useCallback(async () => {
    if (selectedRentalId === null) {
      setIssueError('Pilih transaksi sewa terlebih dahulu.');
      return;
    }

    setIsIssuing(true);
    setIssueError(null);

    try {
      await onCreateContract(selectedRentalId);
      tutupModal();
    } catch (err) {
      setIssueError(err instanceof Error ? err.message : 'Kontrak gagal diterbitkan.');
    } finally {
      setIsIssuing(false);
    }
  }, [selectedRentalId, onCreateContract, tutupModal]);

  return (
    <div
      className="card fade-in"
      style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      {/* Kepala panel */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>
            {title}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--color-secondary)' }}>
            {contracts.length} kontrak tercatat &bull;{' '}
            <strong style={{ color: jumlahMenunggu > 0 ? 'var(--fg-warning-deep)' : 'var(--fg-success-deeper)' }}>
              {jumlahMenunggu} menunggu tanda tangan
            </strong>
          </p>
        </div>

        {canIssue && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setIssueError(null);
              setSelectedRentalId(rentalsTanpaKontrak[0]?.id ?? null);
              setModal({ kind: 'issue' });
            }}
            disabled={rentalsTanpaKontrak.length === 0}
            aria-label="Terbitkan kontrak baru"
            style={{
              padding: '8px 14px',
              fontSize: '12.5px',
              opacity: rentalsTanpaKontrak.length === 0 ? 0.5 : 1,
              cursor: rentalsTanpaKontrak.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <FileSignature size={15} />
            <span>Terbitkan Kontrak</span>
          </button>
        )}
      </div>

      <ContractFilterBar
        keyword={keyword}
        filterStatus={filterStatus}
        onKeyword={setKeyword}
        onStatus={setFilterStatus}
      />

      <ContractTable
        daftarKontrak={daftarKontrak}
        kosongTotal={contracts.length === 0}
        rentals={rentals}
        canIssue={canIssue}
        canSign={canSign}
        canRenew={onRenewContract !== undefined}
        onPreview={(c) => setModal({ kind: 'preview', contract: c })}
        onRenew={bukaPerpanjang}
        onSign={bukaTandaTangan}
      />

      {/* Modal: Tinjau kontrak */}
      {modal.kind === 'preview' && (
        <Modal
          isOpen={true}
          onClose={tutupModal}
          title={`Kontrak ${modal.contract.contract_code}`}
        >
          <ContractViewer preview={buildPreview(modal.contract)} />
        </Modal>
      )}

      {modal.kind === 'renew' && (
        <ContractRenewModal
          contract={modal.contract}
          renewDate={renewDate}
          onChangeDate={setRenewDate}
          error={renewError}
          fieldError={formErrors.validUntil}
          busy={isRenewing}
          onClose={tutupModal}
          onSubmit={() => void handleRenew()}
        />
      )}

      {modal.kind === 'sign' && (
        <ContractSignModal
          contract={modal.contract}
          signerName={signerName}
          signError={signError}
          formErrors={formErrors}
          busy={isSubmitting}
          onChangeSigner={setSignerName}
          onSignature={setSignature}
          onClose={tutupModal}
          onSubmit={() => void handleSign()}
        />
      )}

      {modal.kind === 'issue' && (
        <ContractIssueModal
          rentalsTanpaKontrak={rentalsTanpaKontrak}
          selectedRentalId={selectedRentalId}
          onSelectRental={setSelectedRentalId}
          issueError={issueError}
          busy={isIssuing}
          onClose={tutupModal}
          onSubmit={() => void handleIssue()}
        />
      )}
    </div>
  );
};

export default ContractPanel;
