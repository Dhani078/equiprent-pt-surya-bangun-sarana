/**
 * Modul Validasi Terpusat — EquipRent MS
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * MURNI (tanpa DOM, tanpa database, tanpa impor sirkuler) supaya bisa dipakai
 * dua arah:
 *   1. Sisi server (`src/server/index.ts`) — sumber kebenaran.
 *   2. Sisi klien (form Admin) — umpan balik cepat, pesannya identik.
 *
 * Desain: setiap validator mengembalikan `ValidationResult` berbentuk
 * discriminated union. Kode galat (`code`) stabil dan bisa diuji, sedangkan
 * `message` siap ditampilkan langsung ke pengguna (bahasa Indonesia).
 */

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
// Batasan Field — disamakan dengan skema tabel TiDB
// (lihat tidb_schema_and_data.sql)
// ---------------------------------------------------------------------------

export const LIMIT_USERNAME_MIN = 3;
export const LIMIT_USERNAME_MAX = 50;
export const LIMIT_EMAIL_MAX = 100;
export const LIMIT_NAME_MAX = 150;
export const LIMIT_PHONE_MAX = 20;
export const LIMIT_ADDRESS_MAX = 255;
export const LIMIT_COMPANY_MAX = 150;
export const LIMIT_EQUIPMENT_CODE_MAX = 50;
export const LIMIT_EQUIPMENT_NAME_MAX = 150;
export const LIMIT_MODEL_MAX = 50;
export const LIMIT_BRAND_MAX = 50;
export const LIMIT_TYPE_MAX = 50;
export const LIMIT_DESCRIPTION_MAX = 500;

/** HM tidak mungkin 0 pada unit bekas, dan 99.999 jam sudah sangat ekstrem. */
export const LIMIT_HOUR_METER_MIN = 0;
export const LIMIT_HOUR_METER_MAX = 99_999;

/** Tarif sewa per hari: Rp 0 (unit internal) sampai Rp 100 juta. */
export const LIMIT_RATE_MIN = 0;
export const LIMIT_RATE_MAX = 100_000_000;

/** Kategori alat berat yang diakui sistem (sinkron dengan seed & form). */
export const EQUIPMENT_TYPES: readonly string[] = [
  'Excavator',
  'Bulldozer',
  'Wheel Loader',
  'Crane',
  'Vibro Roller',
  'Dump Truck',
  'Motor Grader',
];

export const EQUIPMENT_STATUSES = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE'] as const;
export type EquipmentStatusValue = (typeof EQUIPMENT_STATUSES)[number];

export const USER_ROLE_IDS = [1, 2, 3] as const;
export type UserRoleId = (typeof USER_ROLE_IDS)[number];

/**
 * Jenis pemeliharaan yang diakui skema tabel `maintenance`.
 *
 * Daftar ini sengaja ADA di sini (satu sumber kebenaran) karena form
 * Maintenance sebelumnya menawarkan opsi `INSPECTION` yang tidak ada di
 * skema — jika tersimpan, kolom ENUM akan menolaknya atau menyimpan nilai
 * kosong, dan laporan perawatan kehilangan barisnya.
 */
export const MAINTENANCE_TYPES = ['PREVENTIVE', 'CORRECTIVE', 'OVERHAUL'] as const;
export type MaintenanceTypeValue = (typeof MAINTENANCE_TYPES)[number];

/**
 * Keterangan singkat tiap jenis pemeliharaan untuk ditampilkan di form.
 * Dipisah dari `MAINTENANCE_TYPES` agar nilai yang tersimpan tetap murni
 * ENUM (bukan teks gabungan seperti "PREVENTIVE (Rutin)").
 */
export const MAINTENANCE_TYPE_LABEL: Record<MaintenanceTypeValue, string> = {
  PREVENTIVE: 'Rutin / Berkala',
  CORRECTIVE: 'Perbaikan Kerusakan',
  OVERHAUL: 'Overhaul / Turun Mesin',
};

/**
 * Pola email sederhana & toleran: satu `@`, ada titik di domain, tanpa spasi.
 * Sengaja tidak memakai regex raksasa — yang penting menangkap typo kasar
 * tanpa menolak alamat yang sah.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Username: huruf, angka, titik, atau garis bawah. */
const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

/** Nomor telepon Indonesia: `0` + 8–14 angka, boleh berawalan `+62`. */
const PHONE_PATTERN = /^(\+62|0)[0-9]{8,14}$/;

// ---------------------------------------------------------------------------
// Helper Internal
// ---------------------------------------------------------------------------

function fail(code: ValidationErrorCode, message: string): { ok: false; code: ValidationErrorCode; message: string } {
  return { ok: false, code, message };
}

function ok<T>(value: T): { ok: true; value: T } {
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
function sanitizeText(raw: unknown): string {
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
function validateText(
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
function toNumber(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Validator: Field Perorangan
// ---------------------------------------------------------------------------

/** Nama lengkap pengguna / penanggung jawab. */
export function validateFullName(raw: unknown): ValidationResult<string> {
  return validateText(raw, 'Nama lengkap', {
    required: true,
    min: 3,
    max: LIMIT_NAME_MAX,
  });
}

/** Username login — unik, dipakai untuk verifikasi password. */
export function validateUsername(raw: unknown): ValidationResult<string> {
  const base = validateText(raw, 'Username', {
    required: true,
    min: LIMIT_USERNAME_MIN,
    max: LIMIT_USERNAME_MAX,
  });
  if (!base.ok) return base;

  if (!USERNAME_PATTERN.test(base.value)) {
    return fail(
      'INVALID_FORMAT',
      'Username hanya boleh berisi huruf, angka, titik (.), atau garis bawah (_).'
    );
  }

  return base;
}

/** Alamat email resmi. */
export function validateEmail(raw: unknown): ValidationResult<string> {
  const base = validateText(raw, 'Alamat email', {
    required: true,
    min: 5,
    max: LIMIT_EMAIL_MAX,
  });
  if (!base.ok) return base;

  if (!EMAIL_PATTERN.test(base.value)) {
    return fail('INVALID_FORMAT', 'Format alamat email tidak valid (contoh: nama@perusahaan.co.id).');
  }

  return base;
}

/**
 * Nomor telepon / WhatsApp. Boleh kosong, tetapi bila diisi harus
 * mengikuti format Indonesia.
 */
export function validatePhone(raw: unknown): ValidationResult<string> {
  const base = validateText(raw, 'Nomor telepon', {
    required: false,
    min: 0,
    max: LIMIT_PHONE_MAX,
  });
  if (!base.ok) return base;
  if (base.value === '') return ok('');

  if (!PHONE_PATTERN.test(base.value)) {
    return fail('INVALID_FORMAT', 'Nomor telepon harus format Indonesia (contoh: 081234567890 atau +6281234567890).');
  }

  return base;
}

/** Alamat domisili / kantor. */
export function validateAddress(raw: unknown): ValidationResult<string> {
  return validateText(raw, 'Alamat', {
    required: true,
    min: 5,
    max: LIMIT_ADDRESS_MAX,
  });
}

/** Nama instansi. Opsional — pelanggan perorangan boleh tanpa perusahaan. */
export function validateCompanyName(raw: unknown): ValidationResult<string | null> {
  const base = validateText(raw, 'Nama instansi', {
    required: false,
    min: 0,
    max: LIMIT_COMPANY_MAX,
  });
  if (!base.ok) return base;
  return ok(base.value === '' ? null : base.value);
}

/** Role ID: 1 = ADMIN, 2 = STAFF, 3 = CUSTOMER. */
export function validateRoleId(raw: unknown): ValidationResult<UserRoleId> {
  const num = toNumber(raw);
  if (num === null) return fail('REQUIRED', 'Hak akses (role) wajib dipilih.');
  if (!Number.isInteger(num)) return fail('NOT_INTEGER', 'Hak akses (role) tidak valid.');

  const match = USER_ROLE_IDS.find(r => r === num);
  if (match === undefined) return fail('OUT_OF_RANGE', 'Hak akses (role) tidak dikenali.');

  return ok(match);
}

// ---------------------------------------------------------------------------
// Validator: Unit Alat Berat
// ---------------------------------------------------------------------------

/** Kode registrasi unit (misal `EXCA-KOM-PC200-01`). */
export function validateEquipmentCode(raw: unknown): ValidationResult<string> {
  const base = validateText(raw, 'Kode unit', {
    required: true,
    min: 3,
    max: LIMIT_EQUIPMENT_CODE_MAX,
  });
  if (!base.ok) return base;

  // Kode unit dipakai di nama berkas dokumen & CSV → tidak boleh ada spasi.
  if (/\s/.test(base.value)) {
    return fail('INVALID_FORMAT', 'Kode unit tidak boleh mengandung spasi.');
  }

  return base;
}

/** Nama lengkap alat berat. */
export function validateEquipmentName(raw: unknown): ValidationResult<string> {
  return validateText(raw, 'Nama alat berat', {
    required: true,
    min: 3,
    max: LIMIT_EQUIPMENT_NAME_MAX,
  });
}

/** Merek / brand unit. */
export function validateBrand(raw: unknown): ValidationResult<string> {
  return validateText(raw, 'Merk', { required: true, min: 2, max: LIMIT_BRAND_MAX });
}

/** Model / seri mesin. */
export function validateModel(raw: unknown): ValidationResult<string> {
  return validateText(raw, 'Model', { required: true, min: 1, max: LIMIT_MODEL_MAX });
}

/** Kategori alat berat — harus salah satu dari `EQUIPMENT_TYPES`. */
export function validateEquipmentType(raw: unknown): ValidationResult<string> {
  const base = validateText(raw, 'Kategori alat', {
    required: true,
    min: 2,
    max: LIMIT_TYPE_MAX,
  });
  if (!base.ok) return base;

  if (!EQUIPMENT_TYPES.includes(base.value)) {
    return fail('INVALID_FORMAT', `Kategori alat tidak dikenali. Pilih salah satu: ${EQUIPMENT_TYPES.join(', ')}.`);
  }

  return base;
}

/** Hour Meter (HM) — jumlah jam operasi mesin. */
export function validateHourMeter(raw: unknown): ValidationResult<number> {
  const num = toNumber(raw);
  if (num === null) return fail('REQUIRED', 'Hour Meter (HM) wajib diisi.');
  if (num < LIMIT_HOUR_METER_MIN || num > LIMIT_HOUR_METER_MAX) {
    return fail(
      'OUT_OF_RANGE',
      `Hour Meter (HM) harus antara ${LIMIT_HOUR_METER_MIN} dan ${LIMIT_HOUR_METER_MAX} jam.`
    );
  }
  return ok(Number(num.toFixed(2)));
}

/** Tarif sewa per hari dalam Rupiah. */
export function validateRentalRate(raw: unknown): ValidationResult<number> {
  const num = toNumber(raw);
  if (num === null) return fail('REQUIRED', 'Tarif sewa per hari wajib diisi.');
  if (!Number.isInteger(num)) return fail('NOT_INTEGER', 'Tarif sewa per hari harus angka bulat (tanpa desimal).');
  if (num < LIMIT_RATE_MIN || num > LIMIT_RATE_MAX) {
    return fail(
      'OUT_OF_RANGE',
      `Tarif sewa per hari harus antara Rp ${LIMIT_RATE_MIN.toLocaleString('id-ID')} dan Rp ${LIMIT_RATE_MAX.toLocaleString('id-ID')}.`
    );
  }
  return ok(num);
}

/** Status operasional unit. */
export function validateEquipmentStatus(raw: unknown): ValidationResult<EquipmentStatusValue> {
  const value = sanitizeText(raw);
  const match = EQUIPMENT_STATUSES.find(s => s === value);
  if (match === undefined) {
    return fail('INVALID_FORMAT', `Status unit tidak valid. Pilih salah satu: ${EQUIPMENT_STATUSES.join(', ')}.`);
  }
  return ok(match);
}

/**
 * Jenis pemeliharaan — harus salah satu nilai ENUM yang diakui skema.
 *
 * Catatan: `INSPECTION` yang pernah ditawarkan form Maintenance TIDAK valid
 * (tidak ada di tipe `Maintenance['maintenance_type']`) dan karenanya ditolak
 * di sini alih-alih disimpan sebagai nilai yang tidak dikenali.
 */
export function validateMaintenanceType(raw: unknown): ValidationResult<MaintenanceTypeValue> {
  const value = sanitizeText(raw).toUpperCase();
  const match = MAINTENANCE_TYPES.find(t => t === value);
  if (match === undefined) {
    return fail(
      'INVALID_FORMAT',
      `Jenis pemeliharaan tidak valid. Pilih salah satu: ${MAINTENANCE_TYPES.join(', ')}.`
    );
  }
  return ok(match);
}

/**
 * Tanggal servis terakhir (`YYYY-MM-DD`). Opsional: unit baru boleh belum
 * pernah diservis.
 */
export function validateMaintenanceDate(raw: unknown, fieldLabel = 'Tanggal servis terakhir'): ValidationResult<string | null> {
  const value = sanitizeText(raw);
  if (value === '') return ok(null);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fail('INVALID_FORMAT', `${fieldLabel} harus berformat YYYY-MM-DD.`);
  }

  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return fail('INVALID_FORMAT', `${fieldLabel} bukan tanggal yang valid.`);
  }

  // Cegah tanggal di masa depan — servis terakhir tidak mungkin besok.
  const hariIni = new Date();
  const batasAtas = new Date(Date.UTC(hariIni.getUTCFullYear(), hariIni.getUTCMonth(), hariIni.getUTCDate()) + 86_400_000);
  if (parsed >= batasAtas) {
    return fail('OUT_OF_RANGE', `${fieldLabel} tidak boleh di masa depan.`);
  }

  return ok(value);
}

/** URL thumbnail unit (boleh kosong → akan diganti aset resmi Stitch). */
export function validateThumbnailUrl(raw: unknown): ValidationResult<string> {
  const value = sanitizeText(raw);
  if (value === '') return ok('');

  if (value.length > 500) {
    return fail('TOO_LONG', 'URL foto unit maksimal 500 karakter.');
  }

  // Hanya izinkan http(s) — mencegah skema berbahaya seperti `javascript:`.
  if (!/^https?:\/\//i.test(value)) {
    return fail('INVALID_FORMAT', 'URL foto unit harus berawalan http:// atau https://.');
  }

  return ok(value);
}

// ---------------------------------------------------------------------------
// Tipe Hasil Validasi Bentuk (Form Lengkap)
// ---------------------------------------------------------------------------

/** Field yang divalidasi untuk pengguna baru. */
export interface ValidatedUserInput {
  role_id: UserRoleId;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  company_name: string | null;
}

/** Field yang divalidasi untuk unit alat berat (tambah & ubah). */
export interface ValidatedEquipmentInput {
  equipment_code: string;
  name: string;
  type: string;
  model: string;
  brand: string;
  hour_meter: number;
  rental_price_per_day: number;
  status: EquipmentStatusValue;
  last_maintenance_date: string | null;
  thumbnail_url: string;
}

/**
 * Kumpulan galat per-field. Kunci objek = nama field, nilai = pesan galat.
 * Bentuk ini langsung bisa dipakai form React untuk menandai input bermasalah.
 */
export type FieldErrors<K extends string> = Partial<Record<K, string>>;

/** Hasil validasi form: daftar galat per-field atau nilai yang sudah bersih. */
export type FormValidationResult<T, K extends string> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldErrors<K> };

// ---------------------------------------------------------------------------
// Validator: Form Lengkap
// ---------------------------------------------------------------------------

/**
 * Menjalankan banyak validator sekaligus dan mengumpulkan SEMUA galat.
 * Sengaja tidak berhenti di galat pertama: pengguna ingin melihat semua
 * field yang salah sekaligus, bukan satu per satu.
 */
function collect<K extends string>(
  checks: ReadonlyArray<[K, ValidationResult<unknown>]>
): FieldErrors<K> | null {
  const errors: FieldErrors<K> = {};
  let adaGalat = false;

  for (const [field, result] of checks) {
    if (!result.ok) {
      errors[field] = result.message;
      adaGalat = true;
    }
  }

  return adaGalat ? errors : null;
}

/**
 * Mengambil nilai hasil validasi.
 *
 * Aman dipanggil setelah `collect()` memastikan tidak ada galat — jadi cabang
 * `throw` ini tidak akan pernah tercapai. Dilempar agar TypeScript tahu nilai
 * pasti ada tanpa perlu `as` (cast), yang dapat menyembunyikan bug nyata.
 */
function unwrap<T>(result: ValidationResult<T>): T {
  if (!result.ok) {
    throw new Error(`Validasi gagal: ${result.code} — ${result.message}`);
  }
  return result.value;
}

/**
 * Memvalidasi seluruh field form pengguna.
 *
 * Catatan: password TIDAK divalidasi di sini. Pembuatan akun oleh Admin
 * tidak menetapkan password — pemilik akun menetapkannya sendiri melalui
 * alur registrasi yang memanggil `hashPassword()`.
 */
export function validateUserInput(raw: unknown): FormValidationResult<ValidatedUserInput, keyof ValidatedUserInput> {
  const src: Record<string, unknown> =
    typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  const roleId = validateRoleId(src.role_id);
  const username = validateUsername(src.username);
  const email = validateEmail(src.email);
  const fullName = validateFullName(src.full_name);
  const phone = validatePhone(src.phone);
  const address = validateAddress(src.address);
  const companyName = validateCompanyName(src.company_name);

  const errors = collect<keyof ValidatedUserInput>([
    ['role_id', roleId],
    ['username', username],
    ['email', email],
    ['full_name', fullName],
    ['phone', phone],
    ['address', address],
    ['company_name', companyName],
  ]);

  if (errors !== null) return { ok: false, errors };

  return {
    ok: true,
    value: {
      role_id: unwrap(roleId),
      username: unwrap(username),
      email: unwrap(email),
      full_name: unwrap(fullName),
      phone: unwrap(phone),
      address: unwrap(address),
      company_name: unwrap(companyName),
    },
  };
}

/**
 * Memvalidasi seluruh field form unit alat berat.
 *
 * `requireCode` disetel `false` pada mode ubah bila kode tidak diubah:
 * cukup memastikan kode tidak kosong, validasi keunikan dilakukan terpisah.
 */
export function validateEquipmentInput(
  raw: unknown
): FormValidationResult<ValidatedEquipmentInput, keyof ValidatedEquipmentInput> {
  const src: Record<string, unknown> =
    typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  const code = validateEquipmentCode(src.equipment_code);
  const name = validateEquipmentName(src.name);
  const type = validateEquipmentType(src.type);
  const model = validateModel(src.model);
  const brand = validateBrand(src.brand);
  const hourMeter = validateHourMeter(src.hour_meter);
  const rate = validateRentalRate(src.rental_price_per_day);
  const status = validateEquipmentStatus(src.status);
  const lastMaintenance = validateMaintenanceDate(src.last_maintenance_date);
  const thumbnail = validateThumbnailUrl(src.thumbnail_url);

  const errors = collect<keyof ValidatedEquipmentInput>([
    ['equipment_code', code],
    ['name', name],
    ['type', type],
    ['model', model],
    ['brand', brand],
    ['hour_meter', hourMeter],
    ['rental_price_per_day', rate],
    ['status', status],
    ['last_maintenance_date', lastMaintenance],
    ['thumbnail_url', thumbnail],
  ]);

  if (errors !== null) return { ok: false, errors };

  return {
    ok: true,
    value: {
      equipment_code: unwrap(code),
      name: unwrap(name),
      type: unwrap(type),
      model: unwrap(model),
      brand: unwrap(brand),
      hour_meter: unwrap(hourMeter),
      rental_price_per_day: unwrap(rate),
      status: unwrap(status),
      last_maintenance_date: unwrap(lastMaintenance),
      thumbnail_url: unwrap(thumbnail),
    },
  };
}
