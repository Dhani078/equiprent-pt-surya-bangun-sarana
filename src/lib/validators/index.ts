/**
 * Modul Validasi Terpusat — EquipRent MS (PT. SURYA BANGUN SARANA BANJARMASIN).
 *
 * MURNI (tanpa DOM, tanpa database, tanpa impor sirkuler) supaya bisa dipakai
 * dua arah: sumber kebenaran di Worker (`src/server`), pesan identik di form
 * Admin. Dipecah per kelompok: core (tipe+helper), rules (batasan+enum+pola),
 * fields (validator tunggal), forms (validator form), contract (e-signature).
 *
 * Consumer lama mengimpor `../lib/validators` — tetap berlaku lewat barrel ini.
 */
export { fail, ok, sanitizeText, toNumber, validateText } from './core';
export type { ValidationErrorCode, ValidationResult } from './core';
export { EMAIL_PATTERN, EQUIPMENT_STATUSES, EQUIPMENT_TYPES, LIMIT_ADDRESS_MAX, LIMIT_BRAND_MAX, LIMIT_COMPANY_MAX, LIMIT_DESCRIPTION_MAX, LIMIT_EMAIL_MAX, LIMIT_EQUIPMENT_CODE_MAX, LIMIT_EQUIPMENT_NAME_MAX, LIMIT_HOUR_METER_MAX, LIMIT_HOUR_METER_MIN, LIMIT_MODEL_MAX, LIMIT_NAME_MAX, LIMIT_PHONE_MAX, LIMIT_RATE_MAX, LIMIT_RATE_MIN, LIMIT_SIGNATURE_CHARS_MAX, LIMIT_SIGNER_NAME_MAX, LIMIT_SIGNER_NAME_MIN, LIMIT_TERMS_MAX, LIMIT_TYPE_MAX, LIMIT_USERNAME_MAX, LIMIT_USERNAME_MIN, MAINTENANCE_TYPES, MAINTENANCE_TYPE_LABEL, PHONE_PATTERN, USERNAME_PATTERN, USER_ROLE_IDS } from './rules';
export type { EquipmentStatusValue, MaintenanceTypeValue, UserRoleId } from './rules';
export { parseTanggalNyata, validateAddress, validateBrand, validateCompanyName, validateEmail, validateEquipmentCode, validateEquipmentName, validateEquipmentStatus, validateEquipmentType, validateFullName, validateHourMeter, validateMaintenanceDate, validateMaintenanceType, validateModel, validatePhone, validateRentalRate, validateRoleId, validateThumbnailUrl, validateUsername } from './fields';
export { collect, unwrap, validateEquipmentInput, validateUserInput } from './forms';
export type { FieldErrors, FormValidationResult, ValidatedEquipmentInput, ValidatedUserInput } from './forms';
export { validateContractRenewal, validateContractSignature, validateContractTerms, validateContractValidUntil, validateSignatureDataUrl, validateSignerName } from './contract';
export type { ValidatedContractRenewal, ValidatedContractSignature } from './contract';
