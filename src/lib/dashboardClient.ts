/**
 * Klien data dashboard eksekutif.
 *
 * Strategi identik dengan `reportsClient.ts`:
 *   1. Coba ambil dari edge API `/api/dashboard/stats` (sumber kebenaran).
 *   2. Bila API belum tersedia (mode dev tanpa worker), hitung lokal dari
 *      state aplikasi memakai modul `dashboard.ts` yang SAMA persis.
 *
 * Karena rumusnya satu modul, angka yang tampil di layar tidak pernah
 * berbeda antara jalur API dan jalur lokal.
 */

import type { AdminDashboardStats } from '../types';
import { buildDashboardStats } from './dashboard';
import type { DashboardDataSource } from './dashboard';
import { db } from './db';

/** Hasil panggilan dashboard. Discriminated union — wajib dicek sebelum dipakai. */
export type DashboardFetchResult =
  | { ok: true; stats: AdminDashboardStats; source: 'API' | 'LOKAL' }
  | { ok: false; message: string };

/** Asal data, ditampilkan sebagai badge agar dosen tahu sumber angkanya. */
export type DashboardSource = 'API' | 'LOKAL' | null;

interface DashboardApiResponse {
  success?: boolean;
  data?: unknown;
  error?: { code?: string; message?: string };
}

/**
 * Type guard untuk agregat dashboard.
 * Respons JSON tidak pernah dipercaya mentah-mentah: field bisa hilang bila
 * versi worker berbeda dengan klien.
 */
function isAdminDashboardStats(value: unknown): value is AdminDashboardStats {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  const angkaWajib = [
    'totalRevenue',
    'pendingPaymentAmount',
    'pendingPaymentCount',
    'totalEquipments',
    'availableEquipments',
    'rentedEquipments',
    'maintenanceEquipments',
    'unavailableEquipments',
    'activeRentals',
    'pendingRentals',
    'completedRentals',
    'totalCustomers',
    'serviceDueCount',
    'serviceApproachingCount',
    'pendingMaintenanceCount',
  ];

  for (const kunci of angkaWajib) {
    if (typeof v[kunci] !== 'number') return false;
  }

  return (
    Array.isArray(v.serviceDueCodes) &&
    Array.isArray(v.recentRentals) &&
    Array.isArray(v.serviceQueue) &&
    typeof v.generatedAt === 'string'
  );
}

/** Mengambil agregat dari edge API. Melempar bila gagal. */
async function fetchFromApi(signal: AbortSignal): Promise<AdminDashboardStats> {
  const res = await fetch('/api/dashboard/stats', {
    headers: { Accept: 'application/json' },
    signal,
  });

  const body: unknown = await res.json().catch(() => null);
  const payload = (body ?? {}) as DashboardApiResponse;

  if (!res.ok || !isAdminDashboardStats(payload.data)) {
    throw new Error(payload.error?.message ?? `Server menjawab status ${res.status}.`);
  }

  return payload.data;
}

/** Menghitung agregat dari state aplikasi (fallback tanpa API). */
async function buildLocally(): Promise<AdminDashboardStats> {
  const source: DashboardDataSource = {
    equipments: await db.getEquipments(),
    rentals: await db.getRentals(),
    maintenance: await db.getMaintenance(),
    payments: await db.getPayments(),
    users: await db.getUsers(),
  };
  return buildDashboardStats(source);
}

/**
 * Mengambil agregat dashboard dengan strategi API → lokal.
 *
 * Tidak pernah melempar: kegagalan dikembalikan sebagai `{ ok: false }`
 * agar komponen bisa menampilkan pesan galat dan tombol coba ulang.
 */
export async function fetchDashboardStats(
  signal: AbortSignal
): Promise<DashboardFetchResult> {
  try {
    return { ok: true, stats: await fetchFromApi(signal), source: 'API' };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, message: 'PERMINTAAN_DIBATALKAN' };
    }
  }

  try {
    return { ok: true, stats: await buildLocally(), source: 'LOKAL' };
  } catch {
    return {
      ok: false,
      message: 'Gagal memuat ringkasan dashboard. Periksa koneksi basis data Anda.',
    };
  }
}
