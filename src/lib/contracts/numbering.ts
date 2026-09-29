import type { Contract } from '../../types';
import { CONTRACT_PREFIX, FALLBACK_DATE_UTC, MAX_SEQUENCE, SEQUENCE_WIDTH } from './constants';

// ---------------------------------------------------------------------------
// Helper Internal
// ---------------------------------------------------------------------------

/** Mengembalikan tanggal yang valid; fallback bila input rusak. */
function toSafeDate(raw: string | null | undefined): Date {
  if (typeof raw !== 'string' || raw === '') return new Date(FALLBACK_DATE_UTC);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date(FALLBACK_DATE_UTC) : parsed;
}

/** `2026` dari `2026-09-04` — memakai UTC agar tidak bergeser karena zona. */
function yearOf(raw: string | null | undefined): string {
  return String(toSafeDate(raw).getUTCFullYear()).padStart(4, '0');
}

/** `09` dari `2026-09-04`. */
function monthOf(raw: string | null | undefined): string {
  return String(toSafeDate(raw).getUTCMonth() + 1).padStart(2, '0');
}

/** `2026-09` dari `2026-09-04`, dipakai sebagai kunci periode urut. */
export function contractPeriodKey(raw: string | null | undefined): string {
  return `${yearOf(raw)}-${monthOf(raw)}`;
}

// ---------------------------------------------------------------------------
// Penomoran Kontrak
// ---------------------------------------------------------------------------

/**
 * Menyusun kode kontrak: `SBS/CONTRACT/<YYYY>/<MM>/<SEQ-4digit>`.
 *
 * Contoh: `SBS/CONTRACT/2026/09/0042`
 *
 * Nomor urut dijaga tetap 4 digit dan diklem ke rentang 1..9999 sehingga
 * kode tidak pernah melebihi lebar kolom maupun menghasilkan `0000`.
 */
export function buildContractCode(rawDate: string | null | undefined, sequence: number): string {
  const nomorUrut = Math.floor(sequence);
  const aman = Number.isFinite(nomorUrut) ? Math.min(Math.max(nomorUrut, 1), MAX_SEQUENCE) : 1;
  const seq = String(aman).padStart(SEQUENCE_WIDTH, '0');

  return `${CONTRACT_PREFIX}/${yearOf(rawDate)}/${monthOf(rawDate)}/${seq}`;
}

/**
 * Menghitung nomor urut berikutnya untuk periode (tahun-bulan) tertentu.
 *
 * Nomor urut dihitung PER PERIODE, bukan global — sesuai format kode yang
 * menyematkan tahun & bulan. Bila sudah ada kontrak pada periode yang sama,
 * urut berikutnya adalah `maksimum + 1`.
 *
 * Sengaja memakai `maksimum + 1` (bukan `jumlah + 1`): bila sebuah kontrak
 * dihapus, `jumlah` menyusut dan nomor lama akan dipakai ulang — dua kontrak
 * berbeda lalu berbagi satu kode, yang akan merusak audit trail.
 */
export function nextContractSequence(
  existing: readonly Contract[],
  rawDate: string | null | undefined,
  periode: string = contractPeriodKey(rawDate)
): number {
  let maksimum = 0;

  for (const kontrak of existing) {
    if (contractPeriodKey(kontrak.contract_date) !== periode) continue;

    const bagian = kontrak.contract_code.split('/');
    const urut = Number(bagian[bagian.length - 1]);
    if (Number.isFinite(urut) && urut > maksimum) maksimum = urut;
  }

  return Math.min(maksimum + 1, MAX_SEQUENCE);
}

/**
 * Menyusun kode kontrak baru yang bebas bentrok.
 *
 * Menggabungkan `nextContractSequence()` dan `buildContractCode()` agar
 * pemanggil tidak bisa lupa salah satunya.
 */
export function generateContractCode(
  existing: readonly Contract[],
  rawDate: string | null | undefined
): string {
  return buildContractCode(rawDate, nextContractSequence(existing, rawDate));
}

/** Memeriksa apakah sebuah string sudah berformat kode kontrak yang sah. */
export function isValidContractCode(value: string): boolean {
  return new RegExp(`^${CONTRACT_PREFIX}/\\d{4}/\\d{2}/\\d{${SEQUENCE_WIDTH}}$`).test(value);
}

// ---------------------------------------------------------------------------
