/**
 * Cermin browser <- Edge API (Worker <- TiDB).
 *
 * stateStore di browser hanyalah cermin tampilan. Setelah login, setiap
 * koleksi di bawah ditarik dari Worker; mutasi diteruskan lewat jembatan di
 * db.ts. Saat Worker tidak aktif (dev murni), fungsi mengembalikan data
 * lokal — bukan array kosong yang menyesatkan.
 */

import { stateStore } from './db';
import { headerSesi } from './authClient';
import type {
  User, Equipment, Rental, Contract, Payment, Maintenance, ReportItem, GpsTracking,
} from '../types';

/** path GET -> key stateStore yang ditimpa. */
const KOLEKSI: ReadonlyArray<{ path: string; key: keyof typeof stateStore }> = [
  { path: '/api/users', key: 'users' },
  { path: '/api/equipments', key: 'equipments' },
  { path: '/api/rentals', key: 'rentals' },
  { path: '/api/contracts', key: 'contracts' },
  { path: '/api/payments', key: 'payments' },
  { path: '/api/maintenance', key: 'maintenance' },
  { path: '/api/gps', key: 'gps' },
  { path: '/api/reports', key: 'reports' },
];

/**
 * Tarik semua koleksi dari Worker ke stateStore.
 *
 * Koleksi yang ditolak role (mis. /api/users untuk CUSTOMER) dilewati diam-
 * diam — bukan error. Dikembalikan jumlah koleksi yang berhasil disegarkan.
 */
export async function sinkronCermin(signal?: AbortSignal): Promise<number> {
  const hasil = await Promise.allSettled(
    KOLEKSI.map(async ({ path, key }) => {
      const res = await fetch(path, { headers: headerSesi(), signal });
      if (!res.ok) return null;
      const body = await res.json().catch(() => null);
      const arr = Array.isArray(body)
        ? body
        : (body as { data?: unknown } | null)?.data;
      return Array.isArray(arr) ? (arr as never[]) : null;
    })
  );
  let terisi = 0;
  hasil.forEach((h, i) => {
    if (h.status === 'fulfilled' && h.value && h.value.length > 0) {
      // koleksinya diganti utuh, bukan merge, agar baris yang dihapus
      // Worker (delete) ikut hilang dari cermin.
      (stateStore as unknown as Record<string, unknown[]>)[KOLEKSI[i].key] = h.value;
      terisi++;
    }
  });
  return terisi;
}

/** API lama: satu koleksi saja (dipakai App saat bootstrap awal). */
export async function fetchCollectionOrLocal(
  name: 'equipments' | 'rentals',
  signal?: AbortSignal
): Promise<User[] | Equipment[] | Rental[] | Contract[] | Payment[] | Maintenance[] | ReportItem[] | GpsTracking[]> {
  try {
    const res = await fetch(`/api/${name}`, { headers: headerSesi(), signal });
    if (!res.ok) throw new Error(String(res.status));
    const body = await res.json();
    return Array.isArray(body) ? body : (body?.data ?? []);
  } catch {
    return (stateStore as unknown as Record<string, never[]>)[name] ?? [];
  }
}
