/**
 * Rate limiting sederhana untuk endpoint login (anti brute-force).
 *
 * Counter per-isolate (bukan global) — keterbatasan ini sengaja dipertahankan
 * agar tidak menambah dependensi penyimpanan eksternal.
 */
const loginAttempts = new Map<string, { count: number; firstAt: number }>();
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 menit

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  // Jendela baru (atau percobaan pertama) — hitungan dimulai dari nol.
  if (!entry || now - entry.firstAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAt: now });
    return false;
  }

  // Sudah melewati batas: jangan menambah hitungan lagi supaya jendela
  // blokir tidak ikut memanjang tanpa batas selama penyerang terus mencoba.
  if (entry.count > LOGIN_MAX_ATTEMPTS) return true;

  entry.count += 1;
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

export function clearRateLimit(key: string): void {
  loginAttempts.delete(key);
}
