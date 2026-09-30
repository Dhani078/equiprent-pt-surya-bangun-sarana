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
// Konstanta Keamanan
// ---------------------------------------------------------------------------

/** Jumlah iterasi PBKDF2. 100.000 = batas maksimum crypto.subtle di
 * Cloudflare Workers (BoringSSL menolak >100.000, error OperationError) —
 * sebelumnya 600.000 lolos di Node/browser tapi selalu 500 di produksi.
 * ponytail: naikkan lewat jalur verifikasi bertingkat bila perlu OWASP penuh. */
const PBKDF2_ITERATIONS = 100_000;

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

