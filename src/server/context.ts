/**
 * Titik impor tunggal untuk modul rute.
 *
 * Modul rute TIDAK mengimpor langsung dari belasan modul lib/* satu per satu —
 * semuanya lewat berkas ini. Keuntungannya: menambah ketergantungan bersama
 * hanya mengubah satu berkas, dan setiap modul rute tetap ringkas serta
 * terbaca sebagai daftar endpoint.
 */
import type { Rental } from '../types';
import { db } from '../lib/db';

export {
  configureDatabaseUrl,
  db,
  getDataMode,
  hydrasiDariTiDB,
  isDatabaseConnected,
  warmSettings,
} from '../lib/db';

export {
  configureSessionSecret,
  createSessionToken,
  isSessionSecretEphemeral,
  verifySessionToken,
  isPathAllowedForRole,
  PUBLIC_API_PATHS,
  SESSION_HEADER,
  SESSION_TTL_SECONDS,
} from '../lib/auth';

export {
  buildEquipmentAvailability,
  describeBlockedReason,
  getRentalConflicts,
  isUnitOutOfService,
  summarizeAvailability,
} from '../lib/availability';
export type { BlockedReason, EquipmentAvailability } from '../lib/availability';

export {
  validateEquipmentInput,
  validateUserInput,
  validateEquipmentCode,
  validateEquipmentStatus,
  validateHourMeter,
  validateRentalRate,
  validateMaintenanceType,
  validateContractRenewal,
  validateContractSignature,
} from '../lib/validators';
export type { ValidatedEquipmentInput, ValidatedUserInput } from '../lib/validators';

export { isContractActive, isContractSigned, buildContractPreview, renderContractHtml } from '../lib/contracts';

export {
  FIELD_BUKTI,
  checkPaymentGate,
  getAllowedPaymentTransitions,
  mayTouchPayment,
  mayVerifyPayment,
  summarizePaymentQueue,
  summarizeRentalPayment,
  validatePaymentProofPath,
} from '../lib/paymentWorkflow';

export { getEquipmentImage } from '../lib/stitchAssets';

export {
  applyKeywordFilter,
  buildReport,
  isReportId,
  normalizeRange,
  REPORT_CATALOG,
} from '../lib/reports';
export type { ReportDataSource } from '../lib/reports';

export { buildDashboardStats } from '../lib/dashboard';
export { buildOperationalAnalytics, buildTopCustomers, buildUtilisasiBulanan } from '../lib/analytics';
export { auditLog, getAuditLog, auditActor, hydrateAuditLog } from '../lib/auditLog';
export type { AuditEntry } from '../lib/auditLog';
export { buildFleetTelemetry, normalizeFleetFilter } from '../lib/fleetTelemetry';

export {
  canTransition,
  getAllowedNextStatuses,
  getLateReturnInfo,
  getTransitionEffect,
  isRentalStatus,
  RENTAL_STATUSES,
} from '../lib/rentalWorkflow';
export type { RoleName, ReportId, User, Contract, Equipment, Rental, Maintenance, Payment } from '../types';
export type { RentalStatus } from '../lib/rentalWorkflow';

export * from './http';

/**
 * Mencari transaksi sewa berdasarkan ID.
 * Mengembalikan null bila tidak ada — dipakai untuk memperkaya kontrak
 * dengan rincian unit & periode tanpa menggagalkan seluruh permintaan.
 */
export async function cariRental(rentalId: number): Promise<Rental | null> {
  const rentals = await db.getRentals();
  return rentals.find((r) => r.id === rentalId) ?? null;
}