/**
 * Modul Dokumen Resmi — EquipRent MS
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Menyatukan pembuatan tiga dokumen operasional yang wajib bisa dicetak:
 *   - BAST OUT  — Berita Acara Serah Terima unit KELUAR ke pelanggan
 *   - BAST IN   — Berita Acara Pengembalian unit KEMBALI ke perusahaan
 *   - SURAT JALAN — dokumen pengantar pengiriman unit ke site proyek
 *
 * Modul ini MURNI (pure): tidak menyentuh DOM dan tidak memanggil database,
 * sehingga aman dipakai di browser, edge worker, maupun Node (untuk test).
 * Hasilnya berupa model data `OfficialDocument` yang bisa:
 *   - dipreview di layar (React), dan
 *   - dirender menjadi satu berkas HTML mandiri ukuran A4 siap cetak.
 */

import type { Equipment, Rental, ReportItem } from '../types';
import {
  getLatePenaltyPerDay,
  formatRupiah,
  formatTanggal,
  formatWaktu,
} from './businessRules';

// ---------------------------------------------------------------------------
// Konstanta Perusahaan & Dokumen
// ---------------------------------------------------------------------------

/** Identitas perusahaan yang dicetak pada kop surat. */
export const COMPANY = {
  name: 'PT. SURYA BANGUN SARANA BANJARMASIN',
  tagline: 'Heavy Equipment Rental, Earthmoving Contractor & Fleet Monitoring System',
  address: 'Jl. Ahmad Yani KM 5, Banjarmasin, Kalimantan Selatan',
  phone: '(0511) 7890123',
  /** Penandatangan default di sisi perusahaan (staf operasional & logistik). */
  signatory: 'Hendra Wijaya',
  signatoryRole: 'Staf Operasional & Logistik',
} as const;

/** Jenis dokumen operasional yang bisa dicetak. */
export type DocumentKind = 'BAST_IN' | 'BAST_OUT' | 'SURAT_JALAN';

/** Urutan tampilan tombol cetak pada tabel dokumen. */
export const DOCUMENT_KINDS: readonly DocumentKind[] = ['BAST_OUT', 'BAST_IN', 'SURAT_JALAN'];

interface DocumentKindMeta {
  /** Judul dokumen yang dicetak di bawah kop surat. */
  title: string;
  /** Singkatan yang dipakai pada nomor dokumen (mengikuti format mock data). */
  codeSlug: string;
  /** Moda pengiriman default untuk Surat Jalan. */
  label: string;
}

const DOCUMENT_KIND_META: Readonly<Record<DocumentKind, DocumentKindMeta>> = {
  BAST_OUT: {
    title: 'BERITA ACARA SERAH TERIMA UNIT (BAST OUT)',
    codeSlug: 'BASTOUT',
    label: 'BAST Out',
  },
  BAST_IN: {
    title: 'BERITA ACARA PENGEMBALIAN UNIT (BAST IN)',
    codeSlug: 'BASTIN',
    label: 'BAST In',
  },
  SURAT_JALAN: {
    title: 'SURAT JALAN PENGIRIMAN UNIT',
    codeSlug: 'SJ',
    label: 'Surat Jalan',
  },
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Model Dokumen
// ---------------------------------------------------------------------------

/** Baris keterangan pada badan dokumen. */
export interface DocumentField {
  label: string;
  value: string;
  /** True bila nilai dicetak dengan font monospace (kode unit, nomor dokumen). */
  mono?: boolean;
}

/** Pihak yang menandatangani dokumen. */
export interface DocumentParty {
  label: string;
  name: string;
  role: string;
}

export interface OfficialDocument {
  kind: DocumentKind;
  /** Judul resmi dokumen. */
  title: string;
  /** Nomor dokumen, misal `REP-BASTOUT-20260505-001`. */
  code: string;
  /** Kode transaksi sewa yang menjadi dasar dokumen. */
  rentalCode: string;
  /** Nama unit yang diserahkan / dikembalikan / dikirim. */
  unitName: string;
  /** Paragraf pembuka dokumen. */
  intro: string;
  /** Baris keterangan yang dicetak pada badan dokumen. */
  fields: DocumentField[];
  /** Catatan penutup dokumen. */
  notes: string;
  /** Nama petugas yang menerbitkan dokumen. */
  issuedBy: string;
  /** Waktu terbit dalam format Indonesia. */
  issuedAtLabel: string;
  /** Dua kolom tanda tangan: pihak penyewa & pihak perusahaan. */
  signatures: { left: DocumentParty; right: DocumentParty };
  /** Nilai sewa (Rupiah). */
  rentalValue: number;
  /** Denda keterlambatan (Rupiah). 0 bila tidak terlambat. */
  penalty: number;
  /** Jumlah hari terlambat. 0 bila tidak terlambat. */
  lateDays: number;
  /** Label pendek jenis dokumen, dipakai pada tombol & nama berkas. */
  kindLabel: string;
}

/** Input pembuatan dokumen. */
export interface DocumentInput {
  kind: DocumentKind;
  /** Transaksi sewa yang menjadi dasar dokumen. */
  rental: Rental;
  /** Unit terkait. Opsional — bila tidak ada, rincian unit dicetak '-'. */
  equipment?: Equipment | null;
  /** Nama penerbit dokumen. Default: staf operasional & logistik. */
  issuedBy?: string;
  /** Waktu terbit (ISO string). Default: waktu saat ini. */
  issuedAt?: string;
  /** Nomor urut dokumen pada hari yang sama. Default: 1. */
  sequence?: number;
  /**
   * Tanggal pengembalian nyata (ISO string).
   * Dipakai BAST IN untuk menghitung keterlambatan & denda.
   * Bila kosong, waktu terbit yang dipakai.
   */
  returnDate?: string | null;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Type guard: apakah sebuah string merupakan DocumentKind yang sah. */
export function isDocumentKind(value: string): value is DocumentKind {
  return value === 'BAST_IN' || value === 'BAST_OUT' || value === 'SURAT_JALAN';
}

/**
 * Memetakan `report_type` dari tabel `reports` ke DocumentKind.
 * Mengembalikan null bila jenis laporan bukan dokumen yang bisa dicetak
 * (misal `FINANCIAL_SUMMARY`).
 */
export function documentKindFromReportType(
  reportType: ReportItem['report_type']
): DocumentKind | null {
  return isDocumentKind(reportType) ? reportType : null;
}

/** Judul resmi sebuah jenis dokumen. */
export function getDocumentTitle(kind: DocumentKind): string {
  return DOCUMENT_KIND_META[kind].title;
}

/** Label pendek sebuah jenis dokumen, misal `BAST Out`. */
export function getDocumentKindLabel(kind: DocumentKind): string {
  return DOCUMENT_KIND_META[kind].label;
}

/**
 * Menyusun nomor dokumen: `REP-<SLUG>-<YYYYMMDD>-<SEQ-3digit>`.
 * Format mengikuti penomoran arsip yang sudah dipakai pada data seed.
 */
export function buildDocumentCode(
  kind: DocumentKind,
  issuedAt: string,
  sequence = 1
): string {
  const d = new Date(issuedAt);
  const basis = Number.isNaN(d.getTime()) ? new Date() : d;

  const yyyy = basis.getFullYear();
  const mm = String(basis.getMonth() + 1).padStart(2, '0');
  const dd = String(basis.getDate()).padStart(2, '0');

  const nomorUrut = Math.max(1, Math.floor(sequence));
  const seq = String(nomorUrut).padStart(3, '0');

  return `REP-${DOCUMENT_KIND_META[kind].codeSlug}-${yyyy}${mm}${dd}-${seq}`;
}

/**
 * Nama berkas cetak, misal `BAST_OUT_RNT-SBS-20260501-001_2026-09-09`.
 * Tanpa spasi dan tanpa karakter terlarang agar aman di semua OS.
 */
export function buildDocumentFilename(doc: OfficialDocument, now: Date): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const slug = DOCUMENT_KIND_META[doc.kind].codeSlug;
  const rental = doc.rentalCode.replace(/[^A-Za-z0-9-]/g, '');

  return `${slug}_${rental}_${yyyy}-${mm}-${dd}`;
}

/** Menghitung hari keterlambatan dari tanggal pengembalian terhadap jatuh tempo. */
function hitungHariTerlambat(endDate: string, returnDate: Date): number {
  const batas = new Date(endDate).getTime();
  if (!Number.isFinite(batas)) return 0;

  const selisih = returnDate.getTime() - batas;
  if (selisih <= 0) return 0;

  return Math.ceil(selisih / MS_PER_DAY);
}

// ---------------------------------------------------------------------------
// Pembuat Dokumen
// ---------------------------------------------------------------------------

/**
 * Menyusun model dokumen siap cetak dari transaksi sewa.
 *
 * Tidak pernah melempar exception: bila unit tidak ditemukan atau tanggal
 * tidak valid, nilai terkait diganti '-' / 0 agar dokumen tetap bisa dicetak.
 */
export function buildDocument(input: DocumentInput): OfficialDocument {
  const { kind, rental, equipment = null } = input;
  const issuedBy = input.issuedBy ?? COMPANY.signatory;
  const issuedAtRaw = input.issuedAt ?? new Date().toISOString();

  const issuedDate = new Date(issuedAtRaw);
  const issuedAt = Number.isNaN(issuedDate.getTime()) ? new Date() : issuedDate;
  const issuedAtIso = issuedAt.toISOString();

  const code = buildDocumentCode(kind, issuedAtIso, input.sequence ?? 1);

  const returnDateRaw = input.returnDate ?? issuedAtIso;
  const returnDate = new Date(returnDateRaw);
  const tanggalKembali = Number.isNaN(returnDate.getTime()) ? issuedAt : returnDate;

  const unitName = rental.equipment_name ?? equipment?.name ?? '-';
  const customerName = rental.customer_name ?? '-';
  const companyName = rental.company_name ?? '';

  const pelanggan = companyName === '' ? customerName : `${customerName} — ${companyName}`;
  const periode = `${formatTanggal(rental.start_date)} s.d. ${formatTanggal(rental.end_date)} (${rental.total_days} hari)`;

  // Keterlambatan hanya relevan untuk BAST IN (unit kembali ke perusahaan).
  const lateDays = kind === 'BAST_IN' ? hitungHariTerlambat(rental.end_date, tanggalKembali) : 0;
  const penalty = lateDays * getLatePenaltyPerDay();

  const lokasi = rental.notes ?? 'Lokasi proyek sesuai kontrak kerja sama';

  const fields: DocumentField[] = [
    { label: 'Nomor Dokumen', value: code, mono: true },
    { label: 'Kode Transaksi Sewa', value: rental.rental_code, mono: true },
    { label: 'Pelanggan / Penyewa', value: pelanggan },
    { label: 'Unit Alat Berat', value: unitName },
    { label: 'Kode Unit', value: rental.equipment_code ?? equipment?.equipment_code ?? '-', mono: true },
    {
      label: 'Merek / Model',
      value: equipment ? `${equipment.brand} ${equipment.model}`.trim() : '-',
    },
    {
      label: kind === 'BAST_IN' ? 'Hour Meter Akhir' : 'Hour Meter Awal',
      value: equipment ? `${equipment.hour_meter} HM` : '-',
    },
    { label: 'Periode Sewa', value: periode },
    { label: 'Nilai Sewa', value: formatRupiah(rental.subtotal) },
  ];

  if (kind === 'BAST_OUT') {
    fields.push(
      { label: 'Tanggal Penyerahan', value: formatTanggal(issuedAtIso) },
      { label: 'Lokasi Penyerahan', value: lokasi },
      { label: 'Kondisi Unit Diserahkan', value: 'Baik & siap operasi (uji fungsi lulus)' },
      { label: 'Kelengkapan', value: 'Kunci kontak, buku manual, tool kit standar' }
    );
  }

  if (kind === 'BAST_IN') {
    fields.push(
      { label: 'Tanggal Pengembalian', value: formatTanggal(tanggalKembali.toISOString()) },
      { label: 'Kondisi Unit Diterima', value: 'Diperiksa oleh mekanik & dinyatakan lengkap' },
      {
        label: 'Keterlambatan',
        value: lateDays > 0 ? `${lateDays} hari` : 'Tidak ada (sesuai jatuh tempo)',
      }
    );
    if (lateDays > 0) {
      fields.push({ label: 'Denda Keterlambatan', value: formatRupiah(penalty) });
    }
  }

  if (kind === 'SURAT_JALAN') {
    fields.push(
      { label: 'Tanggal Pengiriman', value: formatTanggal(issuedAtIso) },
      { label: 'Tujuan Pengiriman', value: lokasi },
      { label: 'Moda Pengiriman', value: 'Trailer lowbed — mobilisasi darat' },
      { label: 'Pengemudi / Operator', value: 'Rudi Hartono (Operator Senior)' }
    );
  }

  const intro =
    kind === 'BAST_OUT'
      ? `Pada hari ini ${formatTanggal(issuedAtIso)}, bertempat di Kantor Operasional ${COMPANY.name}, telah dilakukan penyerahan unit alat berat dari pihak perusahaan kepada pihak penyewa sebagaimana transaksi sewa tersebut di atas.`
      : kind === 'BAST_IN'
        ? `Pada hari ini ${formatTanggal(tanggalKembali.toISOString())}, bertempat di Pool Alat Berat ${COMPANY.name}, telah diterima kembali unit alat berat dari pihak penyewa dengan rincian sebagai berikut.`
        : `Bersama surat jalan ini, pihak ${COMPANY.name} mengirimkan satu unit alat berat dengan rincian sebagai berikut.`;

  const notes =
    kind === 'BAST_OUT'
      ? 'Unit menjadi tanggung jawab penyewa sejak dokumen ini ditandatangani, termasuk risiko kehilangan dan kerusakan di luar keausan normal.'
      : kind === 'BAST_IN'
        ? `Pemeriksaan unit dilakukan bersama oleh mekanik dan perwakilan penyewa.${lateDays > 0 ? ' Denda keterlambatan ditagihkan bersamaan dengan penyelesaian transaksi sewa.' : ''}`
        : 'Surat jalan ini merupakan bukti pengantar resmi pengiriman unit dan wajib dibawa selama perjalanan menuju lokasi proyek.';

  return {
    kind,
    title: DOCUMENT_KIND_META[kind].title,
    code,
    rentalCode: rental.rental_code,
    unitName,
    intro,
    fields,
    notes,
    issuedBy,
    issuedAtLabel: formatWaktu(issuedAtIso),
    signatures: {
      left: {
        label: 'Pihak Penyewa / Rekanan',
        name: customerName,
        role: 'Pimpinan Proyek Lapangan',
      },
      right: {
        label: COMPANY.name,
        name: issuedBy,
        role: COMPANY.signatoryRole,
      },
    },
    rentalValue: rental.subtotal,
    penalty,
    lateDays,
    kindLabel: DOCUMENT_KIND_META[kind].label,
  };
}


// ---------------------------------------------------------------------------
// Render HTML Siap Cetak (A4) — diimplementasikan di documentHtml.ts
// (dipisah 2026-09-30: documents.ts 575 -> ~360 baris).
// ---------------------------------------------------------------------------

export { escapeHtml, renderDocumentHtml } from './documentHtml';
