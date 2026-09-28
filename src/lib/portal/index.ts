/**
 * Mesin Portal Pelanggan (T-0011) — titik masuk paket `src/lib/portal`.
 *
 * Modul MURNI: tanpa DOM, tanpa jaringan, dipakai UI portal + endpoint
 * `GET /api/portal/ringkasan` supaya angkanya identik. Dipecah per tanggung
 * jawab: core (konstanta/tipe/helper), ownership (kepemilikan), catalog,
 * requestCheck (validasi pengajuan), journey (perjalanan sewa), billing.
 */

export { BATAS_HARI_SEWA_MAKSIMAL, BATAS_KATA_KUNCI, CATALOG_AVAILABILITY_LABEL, CATALOG_AVAILABILITY_TONE, DEFAULT_CATALOG_FILTER, RENTAL_JOURNEY_LABEL, RENTAL_JOURNEY_TONE, RENTAL_NEXT_ACTION_LABEL, isSigned, nameTokens, normalizeSearch, toSafeNumber, toSafeTime } from './core';
export type { BillingSummary, CatalogAvailabilityCode, CatalogFilter, CatalogItem, CatalogTone, CatalogView, RentalJourneyRow, RentalJourneyStage, RentalNextAction } from './core';
export { isOwnedBy, selectMyContracts, selectMyPayments, selectMyRentals } from './ownership';
export { buildCatalog, listCatalogCategories, normalizeCatalogFilter, summarizeCatalog } from './catalog';
export { checkRentalRequest } from './requestCheck';
export type { RentalRequestCheck } from './requestCheck';
export { buildRentalJourney, resolveNextAction, resolveRentalStage } from './journey';
export { canUploadProof, summarizeBilling } from './billing';
