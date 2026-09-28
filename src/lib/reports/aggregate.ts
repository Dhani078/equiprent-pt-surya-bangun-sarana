/**
 * Helper agregasi kolom yang dipakai seluruh ringkasan laporan.
 *
 * Bagian dari mesin laporan operasional (dipecah dari `reports.ts` agar tiap
 * berkas tetap di bawah ~300 baris dan mudah ditelusuri). Modul tetap MURNI:
 * tanpa DOM, tanpa database.
 */
import type {
  ReportCellValue,
} from '../../types';


// ---------------------------------------------------------------------------
// Helper Agregasi Baris
// ---------------------------------------------------------------------------

/**
 * Ringkasan laporan DIHITUNG DARI BARIS, bukan dari sumber mentah.
 *
 * Alasannya: setelah baris disaring kata kunci (lihat `filterReportRows`),
 * ringkasan harus menggambarkan baris yang masih terlihat. Bila ringkasan
 * dihitung dari sumber aslinya, pengguna yang mencari satu pelanggan akan
 * melihat nilai total seluruh transaksi — kesalahan fatal pada laporan
 * keuangan yang akan langsung dipertanyakan penguji.
 */

/** Menjumlahkan nilai numerik pada satu indeks kolom. Sel bermasalah diabaikan. */
export function sumColumn(rows: readonly ReportCellValue[][], index: number): number {
  let total = 0;
  for (const row of rows) {
    const value = Number(row[index]);
    if (Number.isFinite(value)) total += value;
  }
  return total;
}

/** Menghitung baris yang nilainya pada kolom `index` persis sama dengan `needle`. */
export function countWhere(
  rows: readonly ReportCellValue[][],
  index: number,
  needle: string
): number {
  let n = 0;
  for (const row of rows) {
    if (String(row[index] ?? '') === needle) n += 1;
  }
  return n;
}

// ---------------------------------------------------------------------------
