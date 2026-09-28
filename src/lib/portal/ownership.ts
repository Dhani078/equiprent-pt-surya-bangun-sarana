import { Contract, Payment, Rental } from '../../types';
import { nameTokens } from './core';

/**
 * Menyeleksi baris yang menjadi MILIK pelanggan ini.
 *
 * Basis utama adalah `customer_id`. Baris dengan `customer_id` 0 / tidak
 * valid jatuh ke pencocokan nama (`customer_name` memuat nama lengkap) —
 * data impor lama sering kehilangan ID, dan pelanggan tidak boleh kehilangan
 * riwayatnya hanya karena satu kolom kosong.
 */
export function isOwnedBy<T extends { customer_id: number; customer_name?: string }>(
  row: T,
  customer: { id: number; full_name: string }
): boolean {
  // ID 0 / negatif berarti "tidak diketahui" pada baris impor lama. Tanpa
  // penjagaan ini, dua baris yang sama-sama kehilangan ID akan saling cocok
  // dan pelanggan bisa melihat data pelanggan lain.
  if (customer.id > 0 && row.customer_id === customer.id) return true;

  const nama = customer.full_name.trim();
  if (nama.length === 0) return false;
  if (typeof row.customer_name !== 'string') return false;

  // Pencocokan nama memakai token bermakna, bukan substring utuh: nama
  // pengguna tersimpan "Bapak Anton Wijaya" sedangkan kolom pada sewa bisa
  // "CV Anton Wijaya Sejahtera". Seluruh token nama harus hadir, sehingga
  // nama yang hanya beririsan sebagian tidak pernah dianggap sama.
  const tokenNama = nameTokens(nama);
  if (tokenNama.length === 0) return false;

  const tokenBaris = new Set(nameTokens(row.customer_name));
  return tokenNama.every((token) => tokenBaris.has(token));
}

/** Sewa milik pelanggan ini, terbaru di atas. */
export function selectMyRentals(
  rentals: readonly Rental[],
  customer: { id: number; full_name: string }
): Rental[] {
  return rentals
    .filter((r) => isOwnedBy(r, customer))
    .sort((a, b) => String(b.booking_date).localeCompare(String(a.booking_date)));
}

/** Kontrak milik pelanggan ini, terbaru di atas. */
export function selectMyContracts(
  contracts: readonly Contract[],
  customer: { id: number; full_name: string }
): Contract[] {
  return contracts
    .filter((c) => isOwnedBy(c, customer))
    .sort((a, b) => String(b.contract_date).localeCompare(String(a.contract_date)));
}

/** Tagihan milik pelanggan ini, terbaru di atas. */
export function selectMyPayments(
  payments: readonly Payment[],
  customer: { id: number; full_name: string }
): Payment[] {
  return payments
    .filter((p) => isOwnedBy(p, customer))
    .sort((a, b) => String(b.payment_date).localeCompare(String(a.payment_date)));
}
