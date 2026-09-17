/**
 * Pengambil koleksi master dari edge API.
 *
 * Aplikasi memuat state lokal dari `stateStore` (db.ts) saat mulai, lalu
 * menyegarkannya dari `GET /api/<koleksi>` di Worker. Bila Worker tidak
 * aktif (mode dev tanpa `wrangler dev`), state lokal tetap dipakai —
 * fungsi ini mengembalikan array kosong, bukan melempar.
 *
 * Tanpa ini, halaman Equipment & Rental tidak pernah berada dalam keadaan
 * "sedang memuat" karena state init sudah sinkron.
 */

import { stateStore } from './db';
import type { Equipment, Rental } from '../types';

/** Koleksi yang bisa disegarkan dari edge API. */
export type CollectionName = 'equipments' | 'rentals';

/** Bentuk respons sukses endpoint GET koleksi (array polos, tanpa pembungkus). */
type CollectionResponse = unknown[];

/** Type guard untuk elemen koleksi: semua field wajib ada dan bertipe benar. */
function isEquipment(value: unknown): value is Equipment {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'number' &&
    typeof v.equipment_code === 'string' &&
    typeof v.name === 'string' &&
    typeof v.type === 'string' &&
    typeof v.brand === 'string' &&
    typeof v.model === 'string' &&
    typeof v.hour_meter === 'number' &&
    typeof v.rental_price_per_day === 'number' &&
    typeof v.status === 'string'
  );
}

function isRental(value: unknown): value is Rental {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'number' &&
    typeof v.rental_code === 'string' &&
    typeof v.customer_id === 'number' &&
    typeof v.equipment_id === 'number' &&
    typeof v.start_date === 'string' &&
    typeof v.end_date === 'string' &&
    typeof v.total_days === 'number' &&
    typeof v.subtotal === 'number' &&
    typeof v.status === 'string'
  );
}

/** Validasi elemen array JSON sebelum dipercaya sebagai koleksi. */
function validateCollection(name: CollectionName, items: unknown[]): Equipment[] | Rental[] {
  if (name === 'equipments') {
    return items.filter(isEquipment) as Equipment[];
  }
  return items.filter(isRental) as Rental[];
}

/**
 * Mengambil koleksi dari `GET /api/<name>`.
 *
 * Mengembalikan state lokal bila Worker tidak merespons (dev tanpa edge
 * runtime), sehingga pemanggil tidak pernah mendapat array kosong yang
 * menyesatkan saat demo.
 */
export async function fetchCollection(
  name: CollectionName,
  signal?: AbortSignal
): Promise<Equipment[] | Rental[]> {
  const res = await fetch(`/api/${name}`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Server menjawab status ${res.status}.`);
  }

  const body: unknown = await res.json().catch(() => null);
  if (!Array.isArray(body)) {
    throw new Error(`Respons /api/${name} bukan array.`);
  }

  return validateCollection(name, body);
}

/**
 * Versi aman: tidak pernah melempar.
 *
 * Dipakai App.tsx untuk pemuatan awal — kegagalan ditangani dengan
 * mempertahankan state lokal (yang sudah dimuat db.ts), sehingga aplikasi
 * tetap utuh saat Worker belum aktif.
 */
export async function fetchCollectionOrLocal(
  name: CollectionName,
  signal?: AbortSignal
): Promise<Equipment[] | Rental[]> {
  try {
    const hasil = await fetchCollection(name, signal);
    return hasil.length > 0 ? hasil : localCollection(name);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return localCollection(name);
    }
    return localCollection(name);
  }
}

/** Koleksi lokal saat ini, dari cache reaktif. */
function localCollection(name: CollectionName): Equipment[] | Rental[] {
  return name === 'equipments' ? stateStore.equipments : stateStore.rentals;
}
