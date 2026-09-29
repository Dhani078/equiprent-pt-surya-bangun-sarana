import { getLatePenaltyPerDay, formatRupiah } from '../businessRules';

// Konstanta perusahaan + syarat & ketentuan baku kontrak.

// Konstanta Perusahaan & Kontrak
// ---------------------------------------------------------------------------

/** Identitas perusahaan yang dicetak pada kop kontrak. */
export const COMPANY = {
  name: 'PT. SURYA BANGUN SARANA BANJARMASIN',
  tagline: 'Heavy Equipment Rental, Earthmoving Contractor & Fleet Monitoring System',
  address: 'Jl. Ahmad Yani KM 5, Banjarmasin, Kalimantan Selatan',
  phone: '(0511) 7890123',
  /** Penandatangan di sisi perusahaan. */
  signatory: 'Hendra Wijaya',
  signatoryRole: 'Staf Operasional & Logistik',
} as const;

/** Awalan kode kontrak. */
export const CONTRACT_PREFIX = 'SBS/CONTRACT';

/** Lebar nomor urut pada kode kontrak (4 digit, misal `0042`). */
export const SEQUENCE_WIDTH = 4;

/** Nilai urut maksimal yang bisa ditampung 4 digit. */
export const MAX_SEQUENCE = 9_999;

/** Tanggal dasar bila tanggal kontrak tidak valid (zona netral). */
export const FALLBACK_DATE_UTC = '1970-01-01T00:00:00.000Z';
export const FALLBACK_DATE = '1970-01-01';

/**
 * Syarat & ketentuan baku kontrak sewa alat berat.
 *
 * Disimpan sebagai array baris (bukan satu string panjang) supaya bisa
 * dirender sebagai daftar bernomor di layar maupun di dokumen cetak.
 *
 * Berupa FUNGSI, bukan konstanta: baris denda memakai tarif dari
 * `getLatePenaltyPerDay()` yang dapat diubah saat runtime lewat tabel
 * settings. Array konstanta akan membekukan tarif pada saat impor pertama
 * (sebelum settings terbaca), sehingga dokumen tak mencerminkan tarif baru.
 */
export function buildContractTerms(): readonly string[] {
  return [
    'Penyewa wajib menyediakan operator bersertifikat yang berpengalaman pada unit yang disewa.',
    'Biaya bahan bakar, pelumas, dan operator sepenuhnya ditanggung penyewa selama masa sewa.',
    'Kerusakan unit akibat kelalaian penyewa menjadi tanggung jawab penyewa, termasuk biaya perbaikan dan waktu henti operasional.',
    `Keterlambatan pengembalian unit dikenakan denda ${formatRupiah(getLatePenaltyPerDay())} per hari keterlambatan.`,
    'Perpanjangan masa sewa wajib dikonfirmasi paling lambat H-3 sebelum kontrak berakhir.',
    'Penyewa dilarang memindahkan unit ke lokasi di luar wilayah yang disepakati tanpa persetujuan tertulis.',
    'Pemeriksaan unit dilakukan bersama pada saat penyerahan (BAST OUT) dan pengembalian (BAST IN).',
  ];
}

/** Gabungan syarat & ketentuan dalam bentuk teks panjang (untuk kolom DB). */
export function buildContractTermsText(): string {
  return buildContractTerms().join('\n');
}

/** @deprecated Pakai `buildContractTermsText()` — mengikuti settings aktif. */
export const CONTRACT_TERMS_TEXT: string = buildContractTermsText();
