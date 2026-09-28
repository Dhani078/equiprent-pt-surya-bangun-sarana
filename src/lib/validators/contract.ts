import { LIMIT_SIGNATURE_CHARS_MAX, LIMIT_SIGNER_NAME_MAX, LIMIT_SIGNER_NAME_MIN, LIMIT_TERMS_MAX } from './rules';
import { ValidationResult, fail, sanitizeText, validateText, ok} from './core';
import { type FieldErrors, type FormValidationResult, collect, unwrap } from './forms';
import { parseTanggalNyata} from './fields';

// ---------------------------------------------------------------------------
// Validator: Tanda Tangan Elektronik Kontrak
// ---------------------------------------------------------------------------

/**
 * Nama terang penandatangan kontrak.
 *
 * Wajib diisi karena nama inilah yang tercetak pada dokumen — kontrak tanpa
 * nama penandatangan tidak dapat dipertanggungjawabkan secara hukum.
 */
export function validateSignerName(raw: unknown): ValidationResult<string> {
  return validateText(raw, 'Nama penandatangan', {
    required: true,
    min: LIMIT_SIGNER_NAME_MIN,
    max: LIMIT_SIGNER_NAME_MAX,
  });
}

/**
 * Tanggal berlaku baru untuk perpanjangan kontrak (`YYYY-MM-DD`).
 *
 * Berbeda dari `validateMaintenanceDate`, tanggal ini WAJIB ada dan HARUS
 * di masa depan: memperpanjang kontrak berarti menetapkan batas berlaku yang
 * belum terlewat, bukan mencatat kejadian yang sudah terjadi.
 */
export function validateContractValidUntil(raw: unknown, fieldLabel = 'Berlaku sampai'): ValidationResult<string> {
  const value = sanitizeText(raw);
  if (value === '') return fail('REQUIRED', `${fieldLabel} wajib diisi.`);

  const parsed = parseTanggalNyata(value);
  if (parsed === null) {
    return fail('INVALID_FORMAT', `${fieldLabel} bukan tanggal yang valid.`);
  }

  const hariIni = new Date();
  const batasBawah = new Date(Date.UTC(hariIni.getUTCFullYear(), hariIni.getUTCMonth(), hariIni.getUTCDate()) + 86_400_000);
  if (parsed < batasBawah) {
    return fail('OUT_OF_RANGE', `${fieldLabel} harus tanggal setelah hari ini.`);
  }

  return ok(value);
}

/**
 * Payload perpanjangan kontrak: tanggal berlaku baru + alasan (opsional).
 *
 * Kedua sisi (server & klien) memakai fungsi ini supaya pesan galat identik.
 */
export function validateContractRenewal(
  raw: unknown
): FormValidationResult<ValidatedContractRenewal, keyof ValidatedContractRenewal> {
  const src: Record<string, unknown> =
    typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  const validUntil = validateContractValidUntil(src.validUntil);
  const reason = validateText(src.reason, 'Alasan perpanjangan', {
    required: false,
    min: 0,
    max: LIMIT_TERMS_MAX,
  });

  const errors = collect<keyof ValidatedContractRenewal>([
    ['validUntil', validUntil],
    ['reason', reason],
  ]);

  if (errors) return { ok: false, errors };
  return {
    ok: true,
    value: { validUntil: unwrap(validUntil), reason: unwrap(reason) },
  };
}

/**
 * Goresan tanda tangan elektronik (`data:image/png;base64,...`).
 *
 * Boleh kosong: sistem tetap menerima kontrak yang disahkan tanpa goresan
 * (misalnya penandatanganan di atas kertas yang kemudian diunggah). Yang
 * DITOLAK adalah:
 *   - skema selain `data:image/...` — mencegah `javascript:` atau URL
 *     eksternal yang dapat dipakai untuk melacak pembuka dokumen;
 *   - payload melebihi batas wajar — mencegah pemborosan penyimpanan.
 *
 * Catatan: data URL tidak dibongkar-bongkar di sini agar validasi tetap
 * murah; yang penting adalah skemanya aman dan ukurannya masuk akal.
 */
export function validateSignatureDataUrl(raw: unknown): ValidationResult<string> {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value === '') return ok('');

  if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(value)) {
    return fail(
      'INVALID_FORMAT',
      'Berkas tanda tangan harus berupa gambar PNG, JPEG, atau WebP dalam format data URL.'
    );
  }

  if (value.length > LIMIT_SIGNATURE_CHARS_MAX) {
    return fail(
      'TOO_LONG',
      `Ukuran tanda tangan melewati batas ${LIMIT_SIGNATURE_CHARS_MAX.toLocaleString('id-ID')} karakter.`
    );
  }

  return ok(value);
}

/** Teks syarat & ketentuan kontrak (opsional, mengikuti batas kolom). */
export function validateContractTerms(raw: unknown): ValidationResult<string> {
  return validateText(raw, 'Syarat dan ketentuan', {
    required: false,
    min: 0,
    max: LIMIT_TERMS_MAX,
  });
}

/**
 * Memvalidasi seluruh field penandatanganan kontrak.
 *
 * Dipakai bersama oleh server (`POST /api/contracts/:id/sign`) dan klien
 * agar pesan galat identik di kedua sisi.
 */
export function validateContractSignature(
  raw: unknown
): FormValidationResult<ValidatedContractSignature, keyof ValidatedContractSignature> {
  const src: Record<string, unknown> =
    typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  const signerName = validateSignerName(src.signerName);

  // Goresan WAJIB ada. `validateSignatureDataUrl()` sendiri mengizinkan
  // nilai kosong (berguna untuk field opsional), tetapi pada aksi
  // penandatanganan kontrak tanda tangan tanpa goresan sama dengan dokumen
  // yang tidak ditandatangani — karena itu kekosongan ditolak di sini.
  const signature = validateSignatureDataUrl(src.signature);
  const wajibGoresan =
    signature.ok && signature.value === ''
      ? fail('REQUIRED', 'Goresan tanda tangan wajib dibubuhkan sebelum kontrak disahkan.')
      : signature;

  const errors = collect<keyof ValidatedContractSignature>([
    ['signerName', signerName],
    ['signature', wajibGoresan],
  ]);

  if (errors !== null) return { ok: false, errors };

  return {
    ok: true,
    value: {
      signerName: unwrap(signerName),
      signature: unwrap(signature),
    },
  };
}

/** Hasil validasi payload perpanjangan kontrak. */
export interface ValidatedContractRenewal {
  validUntil: string;
  reason: string;
}

/** Field yang divalidasi saat penandatanganan kontrak. */
export interface ValidatedContractSignature {
  /** Nama terang penandatangan. */
  signerName: string;
  /** Data URL PNG hasil kanvas; string kosong bila tidak ada goresan. */
  signature: string;
}
