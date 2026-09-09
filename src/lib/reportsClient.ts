/**
 * Klien data laporan operasional.
 *
 * Dipisahkan dari `reports.ts` (mesin murni) agar komponen UI tidak perlu
 * tahu dari mana data berasal:
 *   1. Coba ambil dari edge API `/api/reports/analytics` (sumber kebenaran).
 *   2. Bila API belum tersedia (mode dev tanpa worker), hitung lokal dari
 *      state yang sudah dimuat aplikasi.
 *
 * Dengan begitu halaman laporan tidak pernah menampilkan data kosong
 * saat demo, sekaligus tetap memakai jalur API di lingkungan produksi.
 */

import type { DateRangeFilter, ReportId, ReportResult } from '../types';
import { buildReport, normalizeRange } from './reports';
import type { ReportDataSource } from './reports';
import { db } from './db';

/** Hasil panggilan laporan. Discriminated union — wajib dicek sebelum dipakai. */
export type ReportFetchResult =
  | { ok: true; result: ReportResult; source: 'API' | 'LOKAL' }
  | { ok: false; message: string };

/** Bentuk respons sukses dari endpoint /api/reports/analytics. */
interface ReportApiResponse {
  success?: boolean;
  data?: ReportResult;
  error?: { code?: string; message?: string };
}

/** Type guard agar objek dari JSON tidak dipercaya mentah-mentah. */
function isReportResult(value: unknown): value is ReportResult {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    Array.isArray(v.columns) &&
    Array.isArray(v.rows) &&
    Array.isArray(v.summaries) &&
    typeof v.totalRows === 'number'
  );
}

/**
 * Menyusun laporan melalui API edge.
 * Melempar bila jaringan gagal atau server menolak — pemanggil yang
 * memutuskan apakah akan jatuh ke perhitungan lokal.
 */
async function fetchFromApi(
  id: ReportId,
  range: DateRangeFilter,
  signal: AbortSignal
): Promise<ReportResult> {
  const params = new URLSearchParams({ id });
  if (range.from !== '') params.set('from', range.from);
  if (range.to !== '') params.set('to', range.to);

  const res = await fetch(`/api/reports/analytics?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  const body: unknown = await res.json().catch(() => null);
  const payload = (body ?? {}) as ReportApiResponse;

  if (!res.ok || !isReportResult(payload.data)) {
    throw new Error(payload.error?.message ?? `Server menjawab status ${res.status}.`);
  }

  return payload.data;
}

/** Menyusun laporan dari state aplikasi (fallback tanpa API). */
async function buildLocally(id: ReportId, range: DateRangeFilter): Promise<ReportResult> {
  const source: ReportDataSource = {
    rentals: await db.getRentals(),
    equipments: await db.getEquipments(),
    users: await db.getUsers(),
    payments: await db.getPayments(),
    maintenance: await db.getMaintenance(),
    gps: await db.getGpsTracking(),
    reports: await db.getReports(),
  };
  return buildReport(id, source, range);
}

/**
 * Mengambil satu laporan dengan strategi API → lokal.
 *
 * Tidak pernah melempar: kegagalan dikembalikan sebagai `{ ok: false }`
 * agar komponen bisa menampilkan pesan error dan tombol coba ulang.
 */
export async function fetchReport(
  id: ReportId,
  range: DateRangeFilter,
  signal: AbortSignal
): Promise<ReportFetchResult> {
  // Rentang dinormalisasi di sini supaya nilai dari input <input type="date">
  // yang rusak tidak pernah sampai ke mesin laporan.
  const safeRange = normalizeRange(range.from, range.to);

  try {
    return { ok: true, result: await fetchFromApi(id, safeRange, signal), source: 'API' };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, message: 'PERMINTAAN_DIBATALKAN' };
    }
  }

  try {
    return { ok: true, result: await buildLocally(id, safeRange), source: 'LOKAL' };
  } catch {
    return { ok: false, message: 'Gagal memuat data laporan. Periksa koneksi basis data Anda.' };
  }
}

/**
 * Menyusun berkas CSV lalu memicu unduhan di browser.
 *
 * Memakai `URL.createObjectURL` agar tidak ada dependensi baru; objek URL
 * dibebaskan segera setelah tautan diklik supaya tidak ada kebocoran memori.
 */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
