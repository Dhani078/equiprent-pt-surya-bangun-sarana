import { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, FileSignature, FileText, PenLine, Search, X } from 'lucide-react';
import { Modal } from './Modal';
import { SignatureCanvas } from './SignatureCanvas';
import { ContractViewer } from './ContractViewer';
import {
  buildContractPreview,
  getContractSignatureStatus,
  getContractStatusLabel,
  getContractStatusTone,
  isContractSigned,
} from '../lib/contracts';
import { validateContractSignature } from '../lib/validators';
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

/** Warna badge status mengikuti design system §7. */
const TONE_STYLE: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
  success: { backgroundColor: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' },
  warning: { backgroundColor: '#FFFBEB', color: '#92400E', borderColor: '#FDE68A' },
  info: { backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' },
  neutral: { backgroundColor: '#F1F5F9', color: '#475569', borderColor: '#E2E8F0' },
};

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
  | { kind: 'sign'; contract: Contract };

export const ContractPanel: React.FC<ContractPanelProps> = ({
  contracts,
  rentals,
  equipments,
  users,
  onCreateContract,
  onSignContract,
  title = 'Manajemen Kontrak Digital',
  canIssue = true,
  canSign = true,
}) => {
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SIGNED' | 'AWAITING'>('ALL');
  const [modal, setModal] = useState<ActiveModal>({ kind: 'none' });

  // Form tanda tangan
  const [signerName, setSignerName] = useState('');
  const [signature, setSignature] = useState('');
  const [signError, setSignError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (filterStatus !== 'ALL' && getContractSignatureStatus(kontrak) !== filterStatus) return false;
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
            <strong style={{ color: jumlahMenunggu > 0 ? '#92400E' : '#065F46' }}>
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

      {/* Pencarian & penyaringan */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search
            size={15}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
            }}
          />
          <input
            type="search"
            className="input-premium"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari kode kontrak, pelanggan, atau unit..."
            aria-label="Cari kontrak"
            style={{ paddingLeft: '32px', width: '100%' }}
          />
        </div>

        <select
          className="input-premium"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'SIGNED' | 'AWAITING')}
          aria-label="Saring status tanda tangan"
          style={{ width: 'auto', minWidth: '190px' }}
        >
          <option value="ALL">Semua Status</option>
          <option value="AWAITING">Menunggu Tanda Tangan</option>
          <option value="SIGNED">Telah Ditandatangani</option>
        </select>
      </div>

      {/* Tabel kontrak */}
      {daftarKontrak.length === 0 ? (
        <div
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            border: '1px dashed var(--color-border)',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
          }}
        >
          <FileText size={30} style={{ color: '#CBD5E1', marginBottom: '10px' }} />
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
            {contracts.length === 0
              ? 'Belum ada kontrak yang diterbitkan.'
              : 'Tidak ada kontrak yang cocok dengan pencarian.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', color: 'var(--color-secondary)' }}>Kode Kontrak</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-secondary)' }}>Transaksi</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-secondary)' }}>Pelanggan</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-secondary)' }}>Berlaku Sampai</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-secondary)' }}>Status</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-secondary)', textAlign: 'right' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {daftarKontrak.map((kontrak) => {
                const status = getContractSignatureStatus(kontrak);
                const tone = TONE_STYLE[getContractStatusTone(status)] ?? TONE_STYLE.neutral;
                const rental = rentals.find((r) => r.id === kontrak.rental_id);

                return (
                  <tr key={kontrak.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: 700 }}>
                      {kontrak.contract_code}
                    </td>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: '11.5px' }}>
                      {kontrak.rental_code ?? '-'}
                      {rental !== undefined && (
                        <div style={{ fontFamily: 'inherit', color: 'var(--color-secondary)' }}>
                          {rental.equipment_name ?? '-'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px' }}>{kontrak.customer_name ?? '-'}</td>
                    <td style={{ padding: '10px 8px' }}>{kontrak.valid_until ?? '-'}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: `1px solid ${tone.borderColor}`,
                          ...tone,
                        }}
                      >
                        {getContractStatusLabel(status)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setModal({ kind: 'preview', contract: kontrak })}
                          aria-label={`Tinjau kontrak ${kontrak.contract_code}`}
                          style={{ padding: '5px 9px', fontSize: '11.5px' }}
                        >
                          <FileText size={13} />
                          <span>Tinjau</span>
                        </button>

                        {canSign && !isContractSigned(kontrak) && (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => bukaTandaTangan(kontrak)}
                            aria-label={`Tanda tangani kontrak ${kontrak.contract_code}`}
                            style={{ padding: '5px 9px', fontSize: '11.5px' }}
                          >
                            <PenLine size={13} />
                            <span>Tanda Tangani</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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

      {/* Modal: Tanda tangan elektronik */}
      {modal.kind === 'sign' && (
        <Modal
          isOpen={true}
          onClose={tutupModal}
          title={`Penandatanganan Kontrak: ${modal.contract.contract_code}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '12px',
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: '0 0 6px 0' }}>
                Dengan membubuhkan tanda tangan elektronik di bawah ini,{' '}
                <strong>{modal.contract.customer_name ?? 'Pelanggan'}</strong> menyetujui seluruh
                ketentuan sewa alat berat PT. Surya Bangun Sarana Banjarmasin, termasuk tanggung
                jawab operasional dan jadwal mobilisasi.
              </p>
              <p style={{ margin: 0, color: 'var(--color-secondary)', fontSize: '11px' }}>
                Legalitas dokumen dijamin sah berdasarkan UU ITE Pasal 11 tentang Tanda Tangan
                Elektronik.
              </p>
            </div>

            <div>
              <label
                htmlFor="signer-name"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}
              >
                Nama Penandatangan Resmi (Sesuai KTP / Perusahaan)
              </label>
              <input
                id="signer-name"
                type="text"
                className="input-premium"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                aria-invalid={formErrors.signerName !== undefined}
                aria-describedby={formErrors.signerName !== undefined ? 'signer-name-error' : undefined}
                style={{
                  width: '100%',
                  borderColor: formErrors.signerName !== undefined ? '#DC2626' : undefined,
                }}
              />
              {formErrors.signerName !== undefined && (
                <p id="signer-name-error" style={{ margin: '5px 0 0 0', fontSize: '11.5px', color: '#DC2626' }}>
                  {formErrors.signerName}
                </p>
              )}
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Goresan Tanda Tangan Digital
              </span>
              <SignatureCanvas
                onChange={setSignature}
                ariaLabel="Kanvas tanda tangan elektronik kontrak"
              />
              {formErrors.signature !== undefined && (
                <p style={{ margin: '5px 0 0 0', fontSize: '11.5px', color: '#DC2626' }}>
                  {formErrors.signature}
                </p>
              )}
            </div>

            {signError !== null && (
              <div
                role="alert"
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  fontSize: '12px',
                }}
              >
                {signError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={tutupModal} className="btn-secondary">
                Tinjau Kembali
              </button>
              <button
                type="button"
                onClick={() => void handleSign()}
                className="btn-primary"
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
              >
                <CheckCircle2 size={15} />
                <span>{isSubmitting ? 'Menyimpan...' : 'Bubuhkan Tanda Tangan Digital'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Terbitkan kontrak */}
      {modal.kind === 'issue' && (
        <Modal isOpen={true} onClose={tutupModal} title="Terbitkan Kontrak Baru">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {rentalsTanpaKontrak.length === 0 ? (
              <div
                style={{
                  padding: '28px 20px',
                  textAlign: 'center',
                  border: '1px dashed var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: '#F8FAFC',
                }}
              >
                <CheckCircle2 size={28} style={{ color: '#CBD5E1', marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-secondary)' }}>
                  Semua transaksi sewa yang disetujui sudah memiliki kontrak.
                </p>
              </div>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--color-secondary)', lineHeight: 1.6 }}>
                  Pilih transaksi sewa yang akan diterbitkan kontraknya. Nomor kontrak dibuat
                  otomatis dengan format <code>SBS/CONTRACT/YYYY/MM/SEQ</code>. Hanya transaksi
                  yang sudah disetujui dan belum punya kontrak yang ditampilkan.
                </p>

                <div>
                  <label
                    htmlFor="rental-pilih"
                    style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}
                  >
                    Transaksi Sewa
                  </label>
                  <select
                    id="rental-pilih"
                    className="input-premium"
                    value={selectedRentalId ?? ''}
                    onChange={(e) => setSelectedRentalId(e.target.value === '' ? null : Number(e.target.value))}
                    style={{ width: '100%' }}
                  >
                    {rentalsTanpaKontrak.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.rental_code} — {r.customer_name ?? 'Pelanggan'} — {r.equipment_name ?? '-'}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {issueError !== null && (
              <div
                role="alert"
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  fontSize: '12px',
                }}
              >
                {issueError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={tutupModal} className="btn-secondary">
                <X size={15} />
                <span>Batal</span>
              </button>
              {rentalsTanpaKontrak.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleIssue()}
                  className="btn-primary"
                  disabled={isIssuing || selectedRentalId === null}
                  style={{ opacity: isIssuing || selectedRentalId === null ? 0.6 : 1 }}
                >
                  <FileSignature size={15} />
                  <span>{isIssuing ? 'Menerbitkan...' : 'Terbitkan Kontrak'}</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContractPanel;
