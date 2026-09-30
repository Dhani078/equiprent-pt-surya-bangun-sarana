/**
 * Modul Keamanan Terpusat — EquipRent MS
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Menyediakan: hashing password, pembuatan & verifikasi session token,
 * serta helper Role-Based Access Control (RBAC) untuk sisi server.
 *
 * CATATAN AKADEMIS:
 * Sistem berjalan di Cloudflare Workers (V8 isolate) yang tidak memiliki
 * modul `bcrypt`/`argon2` native. Karena itu digunakan PBKDF2-SHA256
 * dari Web Crypto API — algoritma yang direkomendasikan NIST untuk
 * password hashing (SP 800-132) dan tersedia secara native di edge runtime.
 */

import type { RoleName, User } from '../../types';

// ---------------------------------------------------------------------------
// RBAC Helper
// ---------------------------------------------------------------------------

/** Matriks hak akses: endpoint prefix → role yang diizinkan (per metode). */
const RBAC_MATRIX: ReadonlyArray<{
  prefix: string;
  roles: readonly RoleName[];
  /** Metode HTTP yang dicakup; default = semua. */
  methods?: readonly string[];
}> = [
  // Ganti password diri sendiri boleh dilakukan semua role.
  { prefix: '/api/auth/change-password', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  // Semua role boleh MEMPERBARUI profil dirinya sendiri (kepemilikan dicek
  // eksplisit di route PUT /api/users/:id); operasi users lain Admin-only.
  { prefix: '/api/users', roles: ['ADMIN', 'STAFF', 'CUSTOMER'], methods: ['PUT'] },
  { prefix: '/api/users', roles: ['ADMIN'] },
  // Katalog unit boleh DIBACA semua role (portal pelanggan menampilkan
  // katalog & form sewa); tulis tetap wewenang Admin (dicek juga eksplisit
  // di route-nya — ini lapisan kedua).
  { prefix: '/api/equipments', roles: ['ADMIN', 'STAFF', 'CUSTOMER'], methods: ['GET'] },
  { prefix: '/api/equipments', roles: ['ADMIN'] },
  { prefix: '/api/audit-log', roles: ['ADMIN'] },
  { prefix: '/api/maintenance', roles: ['ADMIN', 'STAFF'] },
  { prefix: '/api/reports', roles: ['ADMIN', 'STAFF'] },
  { prefix: '/api/contracts', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  { prefix: '/api/payments', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  { prefix: '/api/rentals', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  { prefix: '/api/tracking', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  // Titik GPS mentah untuk cermin browser; route-nya mempersempit isi
  // (CUSTOMER hanya unit sewanya) — daftar ini hanya gerbang role.
  // Audit RBAC production 2026-09-27: `/api/dashboard/analytics` ternyata
  // membocorkan topCustomers (nama + nilai kontrak pesaing) ke CUSTOMER,
  // padahal komentar di route-nya sendiri mensyaratkan ADMIN & STAFF.
  // Statistik internal bukan konsumsi portal pelanggan.
  { prefix: '/api/gps', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  { prefix: '/api/dashboard', roles: ['ADMIN', 'STAFF'] },
];

/**
 * Endpoint yang memang terbuka tanpa sesi (dicek sebelum RBAC).
 * Disimpan di sini agar satu daftar dipakai bersama lapisan API.
 */
export const PUBLIC_API_PATHS: readonly string[] = ['/api/health', '/api/auth/login'];

/**
 * Menentukan apakah suatu role boleh mengakses path tertentu.
 *
 * PERBAIKAN KEAMANAN: sebelumnya endpoint yang tidak terdaftar pada matriks
 * diizinkan secara default, sehingga endpoint baru (mis. `/api/audit-log`)
 * otomatis terbuka untuk semua role. Sekarang berlaku DEFAULT-DENY: hanya
 * path publik dan path yang terdaftar eksplisit yang diizinkan.
 */
export function isPathAllowedForRole(
  path: string,
  role: RoleName,
  method: string = 'GET'
): boolean {
  if (PUBLIC_API_PATHS.includes(path)) return true;

  for (const rule of RBAC_MATRIX) {
    if (rule.methods && !rule.methods.includes(method)) continue;
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`) || path.startsWith(`${rule.prefix}?`)) {
      return rule.roles.includes(role);
    }
  }

  // Tidak dikenal → tolak. Endpoint baru harus didaftarkan secara sadar.
  return false;
}
