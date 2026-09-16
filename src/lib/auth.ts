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

import type { RoleName, User } from '../types';

// ---------------------------------------------------------------------------
// Konstanta Keamanan
// ---------------------------------------------------------------------------

/** Jumlah iterasi PBKDF2. Sesuai rekomendasi OWASP minimum 600.000 untuk SHA-256. */
const PBKDF2_ITERATIONS = 600_000;

/** Panjang salt dalam byte (16 byte = 128 bit). */
const SALT_BYTES = 16;

/**
 * Masa berlaku session token: 4 jam (dalam detik).
 *
 * Token bersifat stateless (tidak ada daftar pencabutan), sehingga masa
 * berlaku sengaja dipendekkan agar jendela penyalahgunaan token yang
 * tercuri ikut mengecil.
 */
export const SESSION_TTL_SECONDS = 4 * 60 * 60;

/** Nama header yang membawa session token. */
export const SESSION_HEADER = 'X-SBS-Session';

/** Panjang minimum kunci penanda tangan token. */
export const MIN_SESSION_SECRET_LENGTH = 32;

// ---------------------------------------------------------------------------
// Kunci Penanda Tangan Token
// ---------------------------------------------------------------------------
//
// PERBAIKAN KEAMANAN:
// Versi sebelumnya memakai nilai cadangan yang ditulis langsung di dalam
// source code (`SBS-DEV-INSECURE-FALLBACK-...`). Karena `process.env` tidak
// tersedia di Cloudflare Workers, nilai cadangan itulah yang SELALU dipakai
// di produksi — siapa pun yang membaca repositori ini dapat menempa session
// token untuk role ADMIN.
//
// Sekarang kunci diambil dari environment (`SESSION_SECRET`, diteruskan oleh
// lapisan API melalui `configureSessionSecret()`). Bila belum dikonfigurasi,
// dibuat kunci ACAK saat proses berjalan: tidak ada rahasia yang ikut
// ter-commit, dengan konsekuensi seluruh sesi gugur setiap kali isolate baru
// dimuat (pengguna cukup login ulang).

let configuredSecret: string | null = null;
let ephemeralSecret: string | null = null;
let cachedKey: CryptoKey | null = null;
let cachedKeySecret: string | null = null;

/** Membaca SESSION_SECRET dari environment bila runtime menyediakannya. */
function readEnvSecret(): string | null {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const value = proc?.env?.SESSION_SECRET;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length >= MIN_SESSION_SECRET_LENGTH ? trimmed : null;
}

/**
 * Menetapkan kunci penanda tangan token dari environment binding Workers.
 * Dipanggil lapisan API pada setiap request (nilai dicache, jadi murah).
 *
 * @returns `true` bila kunci diterima, `false` bila kosong/terlalu pendek.
 */
export function configureSessionSecret(secret: string | null | undefined): boolean {
  if (typeof secret !== 'string') return false;
  const trimmed = secret.trim();
  if (trimmed.length < MIN_SESSION_SECRET_LENGTH) return false;

  if (configuredSecret !== trimmed) {
    configuredSecret = trimmed;
    cachedKey = null;
    cachedKeySecret = null;
  }
  return true;
}

/** Kunci yang sedang dipakai: dari environment, atau kunci acak sementara. */
function getTokenSecret(): string {
  if (configuredSecret) return configuredSecret;

  const fromEnv = readEnvSecret();
  if (fromEnv) {
    configuredSecret = fromEnv;
    return configuredSecret;
  }

  if (!ephemeralSecret) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    ephemeralSecret = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return ephemeralSecret;
}

/**
 * `true` bila server masih memakai kunci acak sementara (SESSION_SECRET belum
 * dikonfigurasi). Dilaporkan oleh endpoint /api/health agar operator sadar
 * sesi akan gugur saat isolate berganti.
 */
export function isSessionSecretEphemeral(): boolean {
  return configuredSecret === null;
}

// ---------------------------------------------------------------------------
// Demo Password Hash (hanya untuk akun seed saat database belum terhubung)
// ---------------------------------------------------------------------------

/**
 * Hash password untuk akun demo (admin/staff/user).
 *
 * PENTING: Gunakan PBKDF2 dengan salt statis HANYA untuk akun demo yang
 * kredensialnya memang dipublikasikan di layar login untuk keperluan uji coba.
 * Password asli pengguna yang terdaftar melalui registrasi WAJIB
 * menggunakan `hashPassword()` dengan salt acak.
 */
const DEMO_SALT = 'SBS-DEMO-ACCOUNT-SALT';

/**
 * Nilai hash di bawah dihasilkan dengan perintah:
 *   PBKDF2(password, salt = `${DEMO_SALT}:${username}`, 600000 iterasi, SHA-256)
 * Karena itu password demo TIDAK dapat dibaca balik dari source code.
 */
export const DEMO_PASSWORD_HASHES: Readonly<Record<string, string>> = Object.freeze({
  admin: 'pbkdf2$600000$ffcbaa0009aad8dcc331eb64d145e649c475898705729f95929636ad13ddaf4f',
  staff: 'pbkdf2$600000$f009bb4a3e8c564e6af5c67e54523e6183c15d098e83e4d237cd761c62a9246b',
  user: 'pbkdf2$600000$c487873e638cf1f65712847abb0a59cef267b5cdcdb2c1b8766b9c3d7f05856d',
});

/** Daftar akun yang menggunakan password demo. */
export function isDemoAccount(username: string): boolean {
  return username.toLowerCase() in DEMO_PASSWORD_HASHES;
}

/** `true` bila string benar-benar berbentuk hash PBKDF2 tersimpan. */
export function isStoredPasswordHash(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts = value.split('$');
  return parts.length === 4 && parts[0] === 'pbkdf2';
}

// ---------------------------------------------------------------------------
// Utilitas Encoding
// ---------------------------------------------------------------------------

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encode bytes ke Base64.
 * Menggunakan `btoa` yang tersedia di browser, Cloudflare Workers, dan Node 16+.
 * (Tidak memakai Buffer karena tidak tersedia di V8 isolate / edge runtime.)
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Decode Base64 ke bytes. */
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(): Promise<CryptoKey> {
  const secret = getTokenSecret();
  if (cachedKey && cachedKeySecret === secret) return cachedKey;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  cachedKey = key;
  cachedKeySecret = secret;
  return key;
}

// ---------------------------------------------------------------------------
// Password Hashing
// ---------------------------------------------------------------------------

/**
 * Menghasilkan hash PBKDF2-SHA256 dengan salt acak.
 * Format tersimpan: `pbkdf2$<iterations>$<saltB64>$<hexHash>`
 * Salt di-embed ke dalam proses derive bersama username agar tidak perlu
 * kolom terpisah (kompatibel dengan skema `users` yang sudah ada).
 */
export async function hashPassword(password: string, username: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const saltB64 = bytesToBase64(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Salt efektif = salt acak + username (mencegah hash collision lintas akun)
  const effectiveSalt = encoder.encode(`${saltB64}:${username.toLowerCase()}`);

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: effectiveSalt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltB64}$${toHex(derived)}`;
}

/**
 * Memverifikasi password terhadap hash tersimpan.
 * Menggunakan perbandingan constant-time untuk mencegah timing attack.
 *
 * PERBAIKAN KEAMANAN: hash milik pengguna diperiksa LEBIH DULU. Jalur akun
 * demo hanya dipakai bila akun memang belum memiliki hash sendiri dan mode
 * demo diizinkan (`options.allowDemoAccounts`, bawaan: diizinkan). Dengan
 * begitu, pengguna bernama `admin` yang sudah menyetel password sendiri tidak
 * bisa lagi ditembus memakai password demo.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  username: string,
  options: { allowDemoAccounts?: boolean } = {}
): Promise<boolean> {
  const encoder = new TextEncoder();

  // ---- Akun tanpa hash tersimpan: pertimbangkan jalur akun demo ----
  if (!isStoredPasswordHash(storedHash)) {
    const allowDemo = options.allowDemoAccounts !== false;
    if (!allowDemo || !isDemoAccount(username)) return false;

    const demoHash = DEMO_PASSWORD_HASHES[username.toLowerCase()];
    if (!demoHash) return false;

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    // Salt harus identik dengan yang dipakai saat menghasilkan DEMO_PASSWORD_HASHES.
    const effectiveSalt = encoder.encode(`${DEMO_SALT}:${username.toLowerCase()}`);
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: effectiveSalt, iterations: 600_000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    const candidate = toHex(derived);
    const expected = demoHash.split('$')[2] ?? '';
    return timingSafeEqual(candidate, expected);
  }

  // ---- Akun normal: parse format pbkdf2$iterations$salt$hash ----
  const parts = storedHash.split('$');
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  const saltB64 = parts[2];
  const expectedHash = parts[3];
  if (!saltB64 || !expectedHash) return false;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const effectiveSalt = encoder.encode(`${saltB64}:${username.toLowerCase()}`);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: effectiveSalt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  return timingSafeEqual(toHex(derived), expectedHash);
}

/** Perbandingan string constant-time. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// ---------------------------------------------------------------------------
// Session Token
// ---------------------------------------------------------------------------

export interface SessionPayload {
  /** ID user. */
  uid: number;
  /** Username. */
  usr: string;
  /** Role user. */
  rol: RoleName;
  /** Waktu kedaluwarsa (Unix epoch, detik). */
  exp: number;
}

/**
 * Membuat session token bertanda tangan (HMAC-SHA256).
 * Format: `v1.<base64url(payload)>.<base64url(signature)>`
 */
export async function createSessionToken(user: User): Promise<string> {
  const payload: SessionPayload = {
    uid: user.id,
    usr: user.username,
    rol: user.role_name ?? 'CUSTOMER',
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = bytesToBase64(new TextEncoder().encode(payloadJson))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const key = await importHmacKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadB64)
  );
  const sigB64 = bytesToBase64(new Uint8Array(signature))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `v1.${payloadB64}.${sigB64}`;
}

/**
 * Hasil verifikasi token.
 * Discriminated union — TS akan memaksa pemanggil mengecek `valid`
 * sebelum menyentuh `payload`.
 */
export type VerifyResult =
  | { valid: true; payload: SessionPayload }
  | { valid: false; reason: 'MALFORMED' | 'BAD_SIGNATURE' | 'EXPIRED' };

/**
 * Memverifikasi session token: cek format, tanda tangan, dan masa berlaku.
 * Tidak pernah melempar exception — selalu mengembalikan VerifyResult.
 */
export async function verifySessionToken(token: string | null | undefined): Promise<VerifyResult> {
  if (!token) return { valid: false, reason: 'MALFORMED' };

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') {
    return { valid: false, reason: 'MALFORMED' };
  }

  const [, payloadB64, sigB64] = parts;

  // Verifikasi tanda tangan terlebih dahulu (sebelum mem-parse payload)
  const normalizedSig = sigB64.replace(/-/g, '+').replace(/_/g, '/');
  const normalizedPayload = payloadB64.replace(/-/g, '+').replace(/_/g, '/');

  let signatureOk = false;
  try {
    const key = await importHmacKey();
    const sigBytes = base64ToBytes(normalizedSig);
    // Salin ke ArrayBuffer murni agar tipe cocok dengan signature WebCrypto
    const sigBuffer = new Uint8Array(sigBytes).buffer;
    signatureOk = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuffer,
      new TextEncoder().encode(payloadB64)
    );
  } catch {
    return { valid: false, reason: 'BAD_SIGNATURE' };
  }

  if (!signatureOk) return { valid: false, reason: 'BAD_SIGNATURE' };

  // Parse payload
  let payload: SessionPayload;
  try {
    const json = new TextDecoder().decode(base64ToBytes(normalizedPayload));
    const parsed: unknown = JSON.parse(json);
    if (!isSessionPayload(parsed)) return { valid: false, reason: 'MALFORMED' };
    payload = parsed;
  } catch {
    return { valid: false, reason: 'MALFORMED' };
  }

  // Cek kedaluwarsa
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp < nowSeconds) {
    return { valid: false, reason: 'EXPIRED' };
  }

  return { valid: true, payload };
}

/** Type guard untuk SessionPayload. */
function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.uid === 'number' &&
    typeof v.usr === 'string' &&
    (v.rol === 'ADMIN' || v.rol === 'STAFF' || v.rol === 'CUSTOMER') &&
    typeof v.exp === 'number'
  );
}

// ---------------------------------------------------------------------------
// RBAC Helper
// ---------------------------------------------------------------------------

/** Matriks hak akses: endpoint prefix → role yang diizinkan. */
const RBAC_MATRIX: ReadonlyArray<{ prefix: string; roles: readonly RoleName[] }> = [
  // Ganti password diri sendiri boleh dilakukan semua role.
  { prefix: '/api/auth/change-password', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  { prefix: '/api/users', roles: ['ADMIN'] },
  { prefix: '/api/equipments', roles: ['ADMIN'] },
  { prefix: '/api/audit-log', roles: ['ADMIN'] },
  { prefix: '/api/maintenance', roles: ['ADMIN', 'STAFF'] },
  { prefix: '/api/reports', roles: ['ADMIN', 'STAFF'] },
  { prefix: '/api/contracts', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  { prefix: '/api/payments', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  { prefix: '/api/rentals', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  { prefix: '/api/tracking', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  { prefix: '/api/dashboard', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
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
export function isPathAllowedForRole(path: string, role: RoleName): boolean {
  if (PUBLIC_API_PATHS.includes(path)) return true;

  for (const rule of RBAC_MATRIX) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`) || path.startsWith(`${rule.prefix}?`)) {
      return rule.roles.includes(role);
    }
  }

  // Tidak dikenal → tolak. Endpoint baru harus didaftarkan secara sadar.
  return false;
}
