/**
 * Modul Kontrak Sewa Digital — titik masuk paket `src/lib/contracts`.
 *
 * SATU sumber kebenaran untuk: penomoran kontrak
 * (`SBS/CONTRACT/<YYYY>/<MM>/<SEQ-4>`), syarat & ketentuan baku, status
 * penandatanganan, pratinjau, dan render HTML siap cetak A4. MURNI (tanpa
 * DOM/DB/jaringan) — aman di browser, edge worker, dan Node (tes).
 */

export { COMPANY, CONTRACT_PREFIX, CONTRACT_TERMS_TEXT, FALLBACK_DATE, FALLBACK_DATE_UTC, MAX_SEQUENCE, SEQUENCE_WIDTH, buildContractTerms, buildContractTermsText } from './constants';
export { buildContractCode, contractPeriodKey, generateContractCode, isValidContractCode, nextContractSequence } from './numbering';
export { getContractLifecycleStatus, getContractSignatureStatus, getContractStatusLabel, getContractStatusTone, isContractActive, isContractSigned } from './status';
export type { ContractSignatureStatus } from './status';
export { buildContractPreview } from './preview';
export type { ContractField, ContractParty, ContractPreview, ContractPreviewInput } from './preview';
export { buildContractFilename, escapeContractHtml, isSafeSignatureDataUrl, renderContractHtml } from './render';
