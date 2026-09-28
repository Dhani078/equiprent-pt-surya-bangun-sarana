/**
 * Utilitas HTTP bersama untuk seluruh modul rute API.
 *
 * Dikumpulkan di satu tempat supaya bentuk respons galat identik di semua
 * endpoint — klien hanya perlu mengenali satu skema {success, error:{code,message}}.
 */
import type { ReportId, RoleName, User } from '../types';
import { REPORT_CATALOG } from '../lib/reports';

export type Bindings = {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  DATABASE_URL?: string;
  TIDB_HOST?: string;
  /** Kunci penanda tangan session token (wajib di produksi, minimal 32 karakter). */
  SESSION_SECRET?: string;
  /** Daftar origin yang boleh memanggil API lintas domain, dipisah koma. */
  ALLOWED_ORIGINS?: string;
  /** Setel "false" untuk mematikan login akun demo (admin/staff/user). */
  ALLOW_DEMO_ACCOUNTS?: string;
};

export type Variables = {
  /** Role pengguna yang sudah terverifikasi dari session token. */
  role: RoleName;
  userId: number;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };

/** Daftar origin yang diizinkan, dibaca dari binding `ALLOWED_ORIGINS`. */
export function daftarOriginDiizinkan(env: Bindings | undefined): string[] {
  const raw = env?.ALLOWED_ORIGINS;
  if (typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

/** `false` hanya bila operator mematikan akun demo secara eksplisit. */
export function bolehAkunDemo(env: Bindings | undefined): boolean {
  return String(env?.ALLOW_DEMO_ACCOUNTS ?? 'true').toLowerCase() !== 'false';
}

/** Laporan yang tampil pertama kali saat halaman dibuka (lihat REPORT_CATALOG). */
export const DEFAULT_REPORT_ID: ReportId = REPORT_CATALOG[0].id;

/** Panjang minimum password pengguna. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Bentuk pengguna yang aman dikirim ke klien.
 * Tidak memiliki `password_hash` — mencegah kebocoran kredensial.
 */
export interface PublicUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  company_name: string | null;
  role_id: number;
  role_name?: User['role_name'];
  status: User['status'];
}

/**
 * Helper: membaca body JSON dengan aman.
 * Mengembalikan null bila body tidak valid agar handler bisa merespons 400,
 * bukan membiarkan Worker melempar exception 500.
 */
export async function readJsonBody<T = Record<string, unknown>>(
  c: { req: { json: () => Promise<unknown> } }
): Promise<T | null> {
  try {
    return (await c.req.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Helper: mem-parsing parameter ID dari URL.
 * Mengembalikan null bila bukan angka bulat positif.
 */
export function parseId(raw: string | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const BAD_ID = { success: false, error: { code: 'INVALID_ID', message: 'ID tidak valid.' } } as const;
export const BAD_JSON = { success: false, error: { code: 'INVALID_JSON', message: 'Format request tidak valid.' } } as const;
export const NOT_FOUND_CONTRACT = {
  success: false,
  error: { code: 'NOT_FOUND', message: 'Kontrak tidak ditemukan.' },
} as const;

/**
 * Membentuk respons 400 untuk kegagalan validasi form.
 * `errors` berisi pesan per-field sehingga klien bisa menandai input yang salah.
 */
export function badValidation(
  errors: Record<string, string | undefined>
): { success: false; error: { code: string; message: string; errors: Record<string, string | undefined> } } {
  const pertama = Object.values(errors).find(m => typeof m === 'string' && m.length > 0) ?? 'Data tidak valid.';
  return {
    success: false,
    error: { code: 'VALIDATION_ERROR', message: pertama, errors },
  };
}

/** Mengubah `FieldErrors` (nilai boleh undefined) menjadi pesan per-field. */
export function toErrorBag<K extends string>(errors: Partial<Record<K, string>>): Record<string, string | undefined> {
  return { ...errors };
}

/**
 * Whitelist field pengguna yang boleh dikirim ke klien.
 *
 * Dibuat terpusat (bukan inline) agar tidak ada satu pun respons yang lupa
 * membuang `password_hash` — penyebab umum kebocoran kredensial.
 */
export function ringkasUser(u: {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  company_name: string | null;
  role_id: number;
  role_name?: User['role_name'];
  status: User['status'];
}): PublicUser {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.full_name,
    phone: u.phone,
    address: u.address,
    company_name: u.company_name,
    role_id: u.role_id,
    role_name: u.role_name,
    status: u.status,
  };
}