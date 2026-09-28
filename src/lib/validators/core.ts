// ---------------------------------------------------------------------------
// Tipe Dasar + Helper Internal
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tipe Dasar
// ---------------------------------------------------------------------------

/** Hasil validasi: `ok` berarti lolos, kalau tidak ada `code` + `message`. */
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: ValidationErrorCode; message: string };

/**
 * Kode galat yang stabil.
 *
 * `REQUIRED`      → field wajib kosong.
 * `TOO_SHORT`     → panjang di bawah minimum.
 * `TOO_LONG`      → panjang melewati batas varchar kolom.
 * `INVALID_FORMAT`→ tidak sesuai pola (email, username, telepon).
 * `OUT_OF_RANGE`  → angka di luar batas yang diizinkan.
 * `NOT_INTEGER`   → angka harus bulat.
 */
export type ValidationErrorCode =
  | 'REQUIRED'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'INVALID_FORMAT'
  | 'OUT_OF_RANGE'
  | 'NOT_INTEGER';


// ---------------------------------------------------------------------------
// Helper Internal
// ---------------------------------------------------------------------------

export function fail(code: ValidationErrorCode, message: string): { ok: false; code: ValidationErrorCode; message: string } {
  return { ok: false, code, message };
}

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

/**
 * Membersihkan teks dari karakter kontrol (null byte, dsb) yang bisa
 * merusak query atau merusak tampilan tabel. Spasi di ujung dibuang.
 *
 * Karakter kontrol berbahaya dibuang, BUKAN di-escape: field teks bebas
 * seperti nama & alamat tidak pernah disisipkan ke HTML mentah — React
 * melakukan escaping secara otomatis.
 */
export function sanitizeText(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  // Buang karakter kontrol (NUL, bell, escape, dll) yang bisa merusak
  // query SQL atau tampilan tabel, lalu rapikan spasi di ujung.
  let hasil = '';
  for (const karakter of raw) {
    const kode = karakter.charCodeAt(0);
    if (kode > 31 && kode !== 127) hasil += karakter;
  }
  return hasil.trim();
}

/** Validasi panjang + wajib isi untuk field teks. */
export function validateText(
  raw: unknown,
  fieldLabel: string,
  options: { required: boolean; min: number; max: number }
): ValidationResult<string> {
  const value = sanitizeText(raw);

  if (value.length === 0) {
    return options.required
      ? fail('REQUIRED', `${fieldLabel} wajib diisi.`)
      : ok('');
  }

  if (value.length < options.min) {
    return fail('TOO_SHORT', `${fieldLabel} minimal ${options.min} karakter.`);
  }

  if (value.length > options.max) {
    return fail('TOO_LONG', `${fieldLabel} maksimal ${options.max} karakter.`);
  }

  return ok(value);
}

/** Mengubah nilai menjadi angka. String angka diterima, selain itu gagal. */
export function toNumber(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
