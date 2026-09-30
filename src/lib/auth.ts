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
 *
 * Struktur (dipecah 2026-09-30 dari 525 baris):
 *   - auth/password.ts  : PBKDF2 hashing + akun demo + utilitas encoding.
 *   - auth/session.ts   : pembuatan & verifikasi session token (HMAC-SHA256).
 *   - auth/rbac.ts      : matriks RBAC + isPathAllowedForRole (default-deny).
 */

export {
  SESSION_TTL_SECONDS,
  SESSION_HEADER,
  MIN_SESSION_SECRET_LENGTH,
  configureSessionSecret,
  isSessionSecretEphemeral,
  createSessionToken,
  verifySessionToken,
} from './auth/session';

export {
  DEMO_PASSWORD_HASHES,
  isDemoAccount,
  isStoredPasswordHash,
  hashPassword,
  verifyPassword,
} from './auth/password';

export {
  PUBLIC_API_PATHS,
  isPathAllowedForRole,
} from './auth/rbac';

export type { SessionPayload, VerifyResult } from './auth/session';
