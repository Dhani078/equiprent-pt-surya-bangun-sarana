import { EquipmentStatusValue, UserRoleId } from './rules';
import { ValidationResult } from './core';
import { validateAddress, validateBrand, validateCompanyName, validateEmail, validateEquipmentCode, validateEquipmentName, validateEquipmentStatus, validateEquipmentType, validateFullName, validateHourMeter, validateMaintenanceDate, validateModel, validatePhone, validateRentalRate, validateRoleId, validateThumbnailUrl, validateUsername } from './fields';

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
export function collect<K extends string>(
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
export function unwrap<T>(result: ValidationResult<T>): T {
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
