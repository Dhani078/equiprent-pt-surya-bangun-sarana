import { EMAIL_PATTERN, EQUIPMENT_STATUSES, PHONE_PATTERN, USERNAME_PATTERN, EQUIPMENT_TYPES, EquipmentStatusValue, LIMIT_ADDRESS_MAX, LIMIT_BRAND_MAX, LIMIT_COMPANY_MAX, LIMIT_EMAIL_MAX, LIMIT_EQUIPMENT_CODE_MAX, LIMIT_EQUIPMENT_NAME_MAX, LIMIT_HOUR_METER_MAX, LIMIT_HOUR_METER_MIN, LIMIT_MODEL_MAX, LIMIT_NAME_MAX, LIMIT_PHONE_MAX, LIMIT_RATE_MAX, LIMIT_RATE_MIN, LIMIT_TYPE_MAX, LIMIT_USERNAME_MAX, LIMIT_USERNAME_MIN, MAINTENANCE_TYPES, MaintenanceTypeValue, USER_ROLE_IDS, UserRoleId } from './rules';
import { ValidationResult, fail, sanitizeText, toNumber, validateText, ok } from './core';

// ---------------------------------------------------------------------------
// Validator: Field Perorangan + Unit Alat Berat
// ---------------------------------------------------------------------------

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
 * Memastikan string `YYYY-MM-DD` benar-benar ada di kalender.
 *
 * `new Date('2027-02-31')` TIDAK gagal di JavaScript — nilainya bergulir
 * menjadi 3 Maret. Tanggal seperti itu harus ditolak, bukan diterima
 * diam-diam sebagai tanggal lain.
 */
export function parseTanggalNyata(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  // Bandingkan balik: tanggal bergulir menghasilkan tanggal yang berbeda.
  return parsed.toISOString().slice(0, 10) === value ? parsed : null;
}

/**
 * Tanggal servis terakhir (`YYYY-MM-DD`). Opsional: unit baru boleh belum
 * pernah diservis.
 */
export function validateMaintenanceDate(raw: unknown, fieldLabel = 'Tanggal servis terakhir'): ValidationResult<string | null> {
  const value = sanitizeText(raw);
  if (value === '') return ok(null);

  const parsed = parseTanggalNyata(value);
  if (parsed === null) {
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
