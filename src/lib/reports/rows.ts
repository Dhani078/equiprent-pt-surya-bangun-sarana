/**
 * Pencarian & penyaringan baris laporan.
 *
 * Bagian dari mesin laporan operasional — tetap MURNI (tanpa DOM/DB).
 */
import type { ReportCellValue, ReportResult } from '../../types';
import { MAX_KEYWORD_LENGTH } from './catalog';
import { SUMMARIZERS } from './summaries';

// ---------------------------------------------------------------------------
// Pencarian & Penyaringan Baris
// ---------------------------------------------------------------------------

/**
 * Menormalkan kata kunci pencarian:
 *   - nilai bukan string (null/undefined/angka) menjadi '',
 *   - spasi di awal/akhir dibuang, spasi ganda dirapatkan,
 *   - huruf dikecilkan dengan locale Indonesia sehingga "EXCAVATOR" sama
 *     dengan "excavator",
 *   - kata kunci yang lebih panjang dari `MAX_KEYWORD_LENGTH` dipotong agar
 *     input ekstrem tidak menguras CPU (sama seperti perlakuan filter GPS).
 */
export function normalizeKeyword(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed === '') return '';
  return trimmed.slice(0, MAX_KEYWORD_LENGTH).toLocaleLowerCase('id-ID');
}

/** Bentuk nilai sel yang dicari: angka apa adanya, teks ternormalisasi. */
function toSearchable(value: ReportCellValue): string {
  if (typeof value === 'number') return String(value);
  return String(value ?? '').toLocaleLowerCase('id-ID');
}

/**
 * Menyaring baris laporan berdasarkan kata kunci.
 *
 * Pencarian bersifat GLOBAL: sebuah baris lolos bila salah satu selnya
 * memuat kata kunci. Kata kunci kosong mengembalikan seluruh baris
 * (tidak ada baris yang dibuang), sehingga pemanggil tidak perlu
 * bercabang antara "sedang mencari" dan "tidak mencari".
 *
 * Baris tidak pernah diubah — hanya dipilih — sehingga data asli tetap utuh.
 */
export function filterReportRows(
  rows: readonly ReportCellValue[][],
  keyword: string
): ReportCellValue[][] {
  const needle = normalizeKeyword(keyword);
  if (needle === '') return rows.map((row) => [...row]);

  const matched: ReportCellValue[][] = [];
  for (const row of rows) {
    let cocok = false;
    for (const cell of row) {
      if (toSearchable(cell).includes(needle)) {
        cocok = true;
        break;
      }
    }
    if (cocok) matched.push([...row]);
  }
  return matched;
}

/**
 * Menerapkan kata kunci pada sebuah laporan yang sudah tersusun.
 *
 * Ringkasan dihitung ULANG dari baris hasil penyaringan, sehingga angka
 * pada kartu ringkasan selalu menjumlahkan baris yang terlihat. Tanpa ini,
 * pengguna yang mencari satu pelanggan akan melihat total seluruh periode —
 * kesalahan fatal pada laporan keuangan.
 *
 * Kata kunci kosong mengembalikan laporan apa adanya (tanpa menyalin baris
 * yang tidak perlu).
 */
export function applyKeywordFilter(result: ReportResult, keyword: string): ReportResult {
  if (normalizeKeyword(keyword) === '') return result;

  const rows = filterReportRows(result.rows, keyword);
  // Denominator ringkasan diwarisi dari laporan asli: untuk laporan rasio
  // (Cakupan Umpan Balik) itu adalah seluruh transaksi periode ini, bukan
  // jumlah baris hasil saringan — kalau tidak, persentasenya selalu 100%.
  const baseline = result.baselineRows ?? result.totalRows;

  return {
    ...result,
    rows,
    totalRows: rows.length,
    summaries: SUMMARIZERS[result.id](rows, baseline),
  };
}
