import type { Contract, Equipment, Rental, User } from '../../types';
import { getLatePenaltyPerDay, formatRupiah, formatTanggal, formatWaktu } from '../businessRules';
import { COMPANY, buildContractTerms } from './constants';
import { getContractSignatureStatus, getContractStatusLabel, type ContractSignatureStatus } from './status';

// Model Pratinjau Kontrak
// ---------------------------------------------------------------------------

/** Baris keterangan pada badan kontrak. */
export interface ContractField {
  label: string;
  value: string;
  /** True bila nilai dicetak dengan font monospace (kode, nomor). */
  mono?: boolean;
}

/** Pihak yang menandatangani kontrak. */
export interface ContractParty {
  label: string;
  name: string;
  role: string;
  /** Data URL tanda tangan (opsional). */
  signature?: string | null;
  /** Waktu penandatanganan terformat (opsional). */
  signedAtLabel?: string | null;
}

/** Model kontrak siap pratinjau & cetak. */
export interface ContractPreview {
  /** Kode kontrak, misal `SBS/CONTRACT/2026/09/0042`. */
  code: string;
  /** Kode transaksi sewa yang menjadi dasar kontrak. */
  rentalCode: string;
  /** Judul resmi kontrak. */
  title: string;
  /** Paragraf pembuka kontrak. */
  intro: string;
  /** Baris keterangan para pihak & objek sewa. */
  fields: ContractField[];
  /** Syarat & ketentuan yang berlaku. */
  terms: readonly string[];
  /** Catatan penutup kontrak. */
  notes: string;
  /** Dua kolom tanda tangan: penyewa & perusahaan. */
  parties: { left: ContractParty; right: ContractParty };
  /** Nilai sewa (Rupiah). */
  rentalValue: number;
  /** Label nilai sewa terformat. */
  rentalValueLabel: string;
  /** Waktu terbit terformat. */
  issuedAtLabel: string;
  /** Status penandatanganan. */
  status: ContractSignatureStatus;
  /** Label status penandatanganan. */
  statusLabel: string;
}

/** Input penyusunan pratinjau kontrak. */
export interface ContractPreviewInput {
  /** Kontrak yang akan ditampilkan. */
  contract: Contract;
  /** Transaksi sewa terkait (opsional bila tidak ditemukan). */
  rental?: Rental | null;
  /** Unit terkait (opsional). */
  equipment?: Equipment | null;
  /** Pelanggan terkait (opsional). */
  customer?: User | null;
  /** Nama pihak perusahaan yang menandatangani. Default: staf operasional. */
  companySignatory?: string;
}

/**
 * Menyusun model pratinjau kontrak dari kontrak + data terkait.
 *
 * Tidak pernah melempar exception: bila rental/unit/pelanggan tidak ada,
 * nilai terkait diganti '-' agar kontrak tetap dapat dipratinjau & dicetak.
 */
export function buildContractPreview(input: ContractPreviewInput): ContractPreview {
  const { contract } = input;
  const rental = input.rental ?? null;
  const equipment = input.equipment ?? null;
  const customer = input.customer ?? null;
  const companySignatory = input.companySignatory ?? COMPANY.signatory;

  const status = getContractSignatureStatus(contract);

  const customerName = contract.customer_name ?? customer?.full_name ?? rental?.customer_name ?? '-';
  const companyName = customer?.company_name ?? rental?.company_name ?? '';
  const pelanggan = companyName === '' ? customerName : `${customerName} — ${companyName}`;

  const unitName = rental?.equipment_name ?? equipment?.name ?? '-';
  const unitCode = rental?.equipment_code ?? equipment?.equipment_code ?? '-';

  const startDate = rental?.start_date ?? contract.contract_date;
  const endDate = rental?.end_date ?? contract.valid_until;

  const totalDays = rental?.total_days ?? 0;
  const periode =
    totalDays > 0
      ? `${formatTanggal(startDate)} s.d. ${formatTanggal(endDate)} (${totalDays} hari)`
      : `${formatTanggal(startDate)} s.d. ${formatTanggal(endDate)}`;

  const fields: ContractField[] = [
    { label: 'Nomor Kontrak', value: contract.contract_code, mono: true },
    { label: 'Kode Transaksi Sewa', value: contract.rental_code ?? rental?.rental_code ?? '-', mono: true },
    { label: 'Tanggal Kontrak', value: formatTanggal(contract.contract_date) },
    { label: 'Berlaku Sampai', value: formatTanggal(contract.valid_until) },
    { label: 'Pihak Penyewa', value: pelanggan },
    { label: 'Unit Alat Berat', value: unitName },
    { label: 'Kode Unit', value: unitCode, mono: true },
    {
      label: 'Merek / Model',
      value: equipment ? `${equipment.brand} ${equipment.model}`.trim() : '-',
    },
    { label: 'Periode Sewa', value: periode },
    { label: 'Nilai Sewa', value: formatRupiah(rental?.subtotal ?? 0) },
  ];

  const intro =
    `Pada hari ini ${formatTanggal(contract.contract_date)}, bertempat di Kantor Operasional ` +
    `${COMPANY.name}, kedua belah pihak sepakat mengadakan perjanjian sewa-menyewa unit alat ` +
    `berat dengan rincian sebagai berikut.`;

  const notes =
    status === 'SIGNED'
      ? 'Kontrak ini sah dan mengikat kedua belah pihak sejak dibubuhkannya tanda tangan elektronik, sesuai UU ITE Pasal 11 tentang Tanda Tangan Elektronik.'
      : 'Kontrak ini menunggu pembubuhan tanda tangan elektronik dari pihak penyewa sebelum dapat dinyatakan sah dan mengikat.';

  const signedAtLabel =
    typeof contract.signed_at === 'string' && contract.signed_at !== ''
      ? formatWaktu(contract.signed_at)
      : null;

  return {
    code: contract.contract_code,
    rentalCode: contract.rental_code ?? rental?.rental_code ?? '-',
    title: 'KONTRAK SEWA-MENYEWA ALAT BERAT',
    intro,
    fields,
    terms: buildContractTerms(),
    notes,
    parties: {
      left: {
        label: 'Pihak Penyewa / Rekanan',
        name: contract.signer_name ?? customerName,
        role: 'Pimpinan Proyek Lapangan',
        signature: contract.signature_data_url ?? null,
        signedAtLabel,
      },
      right: {
        label: COMPANY.name,
        name: companySignatory,
        role: COMPANY.signatoryRole,
        signature: null,
        signedAtLabel: null,
      },
    },
    rentalValue: rental?.subtotal ?? 0,
    rentalValueLabel: formatRupiah(rental?.subtotal ?? 0),
    issuedAtLabel: formatWaktu(contract.contract_date),
    status,
    statusLabel: getContractStatusLabel(status),
  };
}

// ---------------------------------------------------------------------------
