import type { Contract, Equipment, Payment, Rental } from '../../types';
import {
  buildEquipmentAvailability,
  isUnitOutOfService,
  normalizeBookingRange,
} from '../availability';
import type { EquipmentAvailability } from '../availability';
import { calculateRentalCost, formatTanggal } from '../businessRules';
import { getRentalStatusLabel, getRentalStatusTone } from '../rentalWorkflow';
import type { RentalLifecycleTone, RentalStatus } from '../rentalWorkflow';
import { getPaymentStatusLabel, getPaymentStatusTone, isPaymentFinal } from '../paymentWorkflow';
import type { PaymentStatus, PaymentTone } from '../paymentWorkflow';

// ---------------------------------------------------------------------------
// Konstanta
// ---------------------------------------------------------------------------

/**
 * Batas maksimum hari sewa yang dapat diajukan pelanggan.
 *
 * Sewa alat berat harian pada umumnya memakai kontrak mingguan / bulanan.
 * Batas ini mencegah kesalahan ketik tanggal (misal tahun 2099) yang akan
 * mengunci unit selama puluhan tahun dan merusak laporan utilisasi.
 */
export const BATAS_HARI_SEWA_MAKSIMAL = 365;

/** Panjang maksimum kata kunci pencarian katalog. */
export const BATAS_KATA_KUNCI = 80;

/** Kata kunci yang tidak mengandung karakter alfanumerik dianggap kosong. */
const POLA_KATA_KUNCI = /[a-z0-9]/i;

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

/** Filter katalog yang dipilih pelanggan. */
export interface CatalogFilter {
  /** Kata kunci: nama unit, kode unit, merek, model, atau kategori. */
  search: string;
  /** Kategori alat berat. String kosong = semua kategori. */
  category: string;
  /** Arah urutan harga sewa per hari. */
  sort: 'TERMURAH' | 'TERMAHAL' | 'TERBARU';
}

/** Filter bawaan katalog — tanpa penyaringan, urutan termurah. */
export const DEFAULT_CATALOG_FILTER: CatalogFilter = {
  search: '',
  category: '',
  sort: 'TERMURAH',
};

/**
 * Mengapa sebuah unit tidak dapat diajukan.
 *
 * `TERSEDIA`       → bebas dipesan pada periode yang dipilih.
 * `SEDANG_DISEWA`  → unit tersedia secara umum, tetapi bentrok dengan sewa
 *                    lain pada periode yang dipilih pelanggan.
 * `TIDAK_DISEWA_KAN` → unit sedang dirawat atau dinonaktifkan.
 * `PERIODE_TIDAK_VALID` → rentang tanggal yang diminta tidak dapat diparse.
 */
export type CatalogAvailabilityCode =
  | 'TERSEDIA'
  | 'SEDANG_DISEWA'
  | 'TIDAK_DISEWA_KAN'
  | 'PERIODE_TIDAK_VALID';

/** Label siap tampil untuk tiap kode ketersediaan. */
export const CATALOG_AVAILABILITY_LABEL: Readonly<Record<CatalogAvailabilityCode, string>> = {
  TERSEDIA: 'Tersedia',
  SEDANG_DISEWA: 'Sedang Disewa',
  TIDAK_DISEWA_KAN: 'Tidak Disewakan',
  PERIODE_TIDAK_VALID: 'Periode Tidak Valid',
};

/** Nada warna badge mengikuti design system §7. */
export type CatalogTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

/** Nada warna badge untuk tiap kode ketersediaan. */
export const CATALOG_AVAILABILITY_TONE: Readonly<Record<CatalogAvailabilityCode, CatalogTone>> = {
  TERSEDIA: 'success',
  SEDANG_DISEWA: 'warning',
  TIDAK_DISEWA_KAN: 'danger',
  PERIODE_TIDAK_VALID: 'neutral',
};

/** Satu unit di katalog, lengkap dengan status ketersediaannya. */
export interface CatalogItem {
  equipment: Equipment;
  /** Bisa diajukan pada periode yang sedang dipilih. */
  isBookable: boolean;
  /** Alasan bila tidak bisa diajukan. */
  availability: CatalogAvailabilityCode;
  /** Jumlah sewa lain yang bentrok (0 bila tidak bentrok). */
  conflictCount: number;
  /**
   * Kode sewa pertama yang bentrok — ditampilkan agar pelanggan tahu unit
   * ini sedang dipakai, bukan sekadar "tidak tersedia".
   */
  conflictRentalCode: string | null;
  /** Pesan siap tampil mengapa unit tidak bisa diajukan. */
  blockedMessage: string | null;
}

/** Hasil penyusunan katalog. */
export interface CatalogView {
  items: CatalogItem[];
  /** Kategori yang tersedia pada seluruh armada (untuk dropdown filter). */
  categories: string[];
  /** Ringkasan yang ditampilkan di kepala katalog. */
  summary: {
    total: number;
    bookable: number;
    blockedBySchedule: number;
    blockedByUnitStatus: number;
  };
}

/** Status kelengkapan dokumen untuk satu perjalanan sewa. */
export type RentalJourneyStage =
  /** Menunggu keputusan Admin / Staf Operasional. */
  | 'MENUNGGU_PERSETUJUAN'
  /** Disetujui tetapi kontrak belum diterbitkan. */
  | 'MENUNGGU_KONTRAK'
  /** Kontrak sudah ada, menunggu tanda tangan pelanggan. */
  | 'MENUNGGU_TANDA_TANGAN'
  /** Kontrak ditandatangani, tagihan belum lunas. */
  | 'MENUNGGU_PEMBAYARAN'
  /** Tagihan menunggu verifikasi staf. */
  | 'MENUNGGU_VERIFIKASI'
  /** Unit sedang di tangan pelanggan. */
  | 'BEROPERASI'
  /** Sewa selesai. */
  | 'SELESAI'
  /** Pengajuan ditolak. */
  | 'DITOLAK';

/** Label siap tampil untuk tiap tahap. */
export const RENTAL_JOURNEY_LABEL: Readonly<Record<RentalJourneyStage, string>> = {
  MENUNGGU_PERSETUJUAN: 'Menunggu Persetujuan',
  MENUNGGU_KONTRAK: 'Menunggu Kontrak',
  MENUNGGU_TANDA_TANGAN: 'Menunggu Tanda Tangan',
  MENUNGGU_PEMBAYARAN: 'Menunggu Pembayaran',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  BEROPERASI: 'Beroperasi',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
};

/** Nada warna badge untuk tiap tahap. */
export const RENTAL_JOURNEY_TONE: Readonly<Record<RentalJourneyStage, CatalogTone>> = {
  MENUNGGU_PERSETUJUAN: 'warning',
  MENUNGGU_KONTRAK: 'warning',
  MENUNGGU_TANDA_TANGAN: 'warning',
  MENUNGGU_PEMBAYARAN: 'warning',
  MENUNGGU_VERIFIKASI: 'warning',
  BEROPERASI: 'info',
  SELESAI: 'success',
  DITOLAK: 'danger',
};

/**
 * Langkah berikutnya yang perlu dilakukan pelanggan.
 *
 * `null` berarti tidak ada tindakan yang diharapkan dari pelanggan
 * (misalnya sewa yang sudah selesai).
 */
export type RentalNextAction =
  /** Tidak ada tindakan; tunggu tindakan Admin / Staf. */
  | null
  /** Buka tab kontrak dan bubuhkan tanda tangan. */
  | 'TANDA_TANGAN_KONTRAK'
  /** Buka tab tagihan dan lampirkan bukti transfer. */
  | 'UNGGAH_BUKTI_BAYAR'
  /** Tagihan menunggu verifikasi staf. */
  | 'TUNGGU_VERIFIKASI';

/** Label tombol aksi pada kartu perjalanan sewa. */
export const RENTAL_NEXT_ACTION_LABEL: Readonly<
  Record<Exclude<RentalNextAction, null>, string>
> = {
  TANDA_TANGAN_KONTRAK: 'Tanda Tangani Kontrak',
  UNGGAH_BUKTI_BAYAR: 'Unggah Bukti Bayar',
  TUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
};

/** Satu baris riwayat sewa pelanggan, lengkap dengan dokumen terkaitnya. */
export interface RentalJourneyRow {
  rental: Rental;
  status: RentalStatus;
  statusLabel: string;
  statusTone: RentalLifecycleTone;
  /** Tahap perjalanan sewa (turunan dari status + kontrak + tagihan). */
  stage: RentalJourneyStage;
  stageLabel: string;
  stageTone: CatalogTone;
  /** Kontrak yang terbit untuk sewa ini (bila ada). */
  contract: Contract | null;
  /** Tagihan kontrak ini (bila ada). */
  payment: Payment | null;
  /** Label status tagihan siap tampil. */
  paymentStatusLabel: string | null;
  paymentStatusTone: PaymentTone | null;
  /** Tindakan berikutnya yang diharapkan dari pelanggan. */
  nextAction: RentalNextAction;
}

/**
 * Ringkasan tagihan pada tab "Tagihan & Transfer".
 *
 * Invariant yang dijaga (dan diuji):
 *   totalAmount === lunasAmount + menungguVerifikasiAmount + belumBayarAmount
 *   total       === lunasCount  + menungguVerifikasiCount  + belumBayarCount
 *   belumBayar  === UNPAID + FAILED   (tagihan yang masih jadi kewajiban
 *                                      pelanggan; FAILED berarti bukti
 *                                      ditolak → harus bayar ulang)
 */
export interface BillingSummary {
  total: number;
  /** Nilai seluruh tagihan (Rupiah). */
  totalAmount: number;
  lunasCount: number;
  lunasAmount: number;
  menungguVerifikasiCount: number;
  menungguVerifikasiAmount: number;
  /** Jumlah tagihan yang belum lunas: `UNPAID` + `FAILED`. */
  belumBayarCount: number;
  /** Nilai tagihan yang belum lunas: `UNPAID` + `FAILED`. */
  belumBayarAmount: number;
  /** Jumlah tagihan `FAILED` (subset dari `belumBayarCount`). */
  ditolakCount: number;
  /** Tagihan yang masih bisa dilampiri buktinya (belum status final). */
  bisaUnggahCount: number;
}

// ---------------------------------------------------------------------------
// Helper Internal
// ---------------------------------------------------------------------------

/** Mengubah nilai menjadi angka finansial yang aman (tanpa NaN/Infinity). */
export function toSafeNumber(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

/** Memotong & membersihkan kata kunci; mengembalikan '' bila tidak bermakna. */
export function normalizeSearch(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim().slice(0, BATAS_KATA_KUNCI);
  // Kata kunci yang hanya berisi tanda baca tidak boleh menyaring semua unit.
  return POLA_KATA_KUNCI.test(trimmed) ? trimmed : '';
}

/** Mengubah nilai boolean-ish pada `is_signed_customer` menjadi boolean. */
export function isSigned(contract: Contract): boolean {
  return contract.is_signed_customer === 1 || contract.is_signed_customer === true;
}

/**
 * Mengubah nilai tanggal menjadi timestamp UTC tengah hari.
 *
 * Disalin dari modul `availability` karena helper itu tidak diekspor, dan
 * portal harus memakai cara parse yang SAMA — memakai `new Date('2026-09-01')`
 * di sini akan menggeser tanggal satu hari pada zona waktu tertentu dan
 * membuat "tanggal selesai lebih awal dari tanggal mulai" lolos.
 */
export function toSafeTime(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || value === '') return null;
  const time = new Date(`${value.slice(0, 10)}T12:00:00Z`).getTime();
  return Number.isFinite(time) ? time : null;
}

/**
 * Gelar & sapaan yang bukan bagian dari nama orang.
 *
 * Nama pelanggan tersimpan lengkap dengan sapaan ("Bapak Anton Wijaya"),
 * sedangkan kolom `customer_name` pada sewa/kontrak/tagihan kerap hanya
 * berisi nama badan usaha ("CV Anton Wijaya Sejahtera"). Tanpa membuang
 * sapaan ini, pencocokan nama selalu gagal dan pelanggan kehilangan
 * riwayatnya hanya karena perbedaan sapaan.
 */
const SAPAAN = new Set([
  'bapak',
  'ibu',
  'sdr',
  'sdri',
  'saudara',
  'saudari',
  'bpk',
  'mr',
  'mrs',
  'ms',
  'pt',
  'cv',
  'ud',
  'tbk',
]);

/** Token bermakna dari sebuah nama: tanpa sapaan, tanpa kata terlalu pendek. */
export function nameTokens(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !SAPAAN.has(token));
}
