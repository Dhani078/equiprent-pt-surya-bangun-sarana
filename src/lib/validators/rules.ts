// ---------------------------------------------------------------------------
// Batasan Field + Enum + Pola — disamakan dengan skema tabel TiDB
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

/** Nama terang penandatangan kontrak (sesuai KTP / perusahaan). */
export const LIMIT_SIGNER_NAME_MIN = 3;
export const LIMIT_SIGNER_NAME_MAX = 150;

/**
 * Batas panjang data URL tanda tangan (satuan karakter).
 *
 * Kanvas tanda tangan berukuran wajar menghasilkan PNG puluhan kilobit,
 * sehingga batas ini jauh lebih dari cukup sekaligus mencegah klien nakal
 * mengirim gambar raksasa yang membebani basis data & pratinjau dokumen.
 */
export const LIMIT_SIGNATURE_CHARS_MAX = 200_000;

/** Panjang maksimal teks syarat & ketentuan kontrak. */
export const LIMIT_TERMS_MAX = 4_000;

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
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Username: huruf, angka, titik, atau garis bawah. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

/** Nomor telepon Indonesia: `0` + 8–14 angka, boleh berawalan `+62`. */
export const PHONE_PATTERN = /^(\+62|0)[0-9]{8,14}$/;
