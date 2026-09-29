import type { Contract } from '../../types';

// Status Penandatanganan
// ---------------------------------------------------------------------------

/** Status penandatanganan kontrak dalam bentuk terstruktur. */
export type ContractSignatureStatus = 'SIGNED' | 'AWAITING' | 'EXPIRED';

/**
 * Normalisasi `is_signed_customer`.
 *
 * Nilai kolom bisa berupa boolean (klien baru) maupun 0/1 (dari MySQL),
 * sehingga dibaca melalui helper ini agar tidak ada perbandingan yang
 * keliru di antara keduanya.
 */
export function isContractSigned(kontrak: Pick<Contract, 'is_signed_customer'>): boolean {
  return kontrak.is_signed_customer === 1 || kontrak.is_signed_customer === true;
}

/** Status penandatanganan kontrak. */
export function getContractSignatureStatus(
  kontrak: Pick<Contract, 'is_signed_customer'>
): ContractSignatureStatus {
  return isContractSigned(kontrak) ? 'SIGNED' : 'AWAITING';
}

/** Label siap tampil untuk status penandatanganan. */
export function getContractStatusLabel(status: ContractSignatureStatus): string {
  if (status === 'SIGNED') return 'Telah Ditandatangani';
  if (status === 'EXPIRED') return 'Kedaluwarsa';
  return 'Menunggu Tanda Tangan';
}

/** Nada warna badge mengikuti design system §7 (hijau=sah, kuning=pending, merah=kedaluwarsa). */
export function getContractStatusTone(status: ContractSignatureStatus): 'success' | 'warning' | 'danger' {
  if (status === 'SIGNED') return 'success';
  if (status === 'EXPIRED') return 'danger';
  return 'warning';
}

/**
 * Status daur-hidup kontrak: SAH (sudah ditandatangani) > KEDALUWARSA
 * (belum ditandatangani dan melewati batas berlaku) > MENUNGGU.
 *
 * Kontrak yang sudah ditandatangani tidak menjadi kedaluwarsa: tandatangan
 * adalah bukti persetujuan, bukan sesuatu yang gugur oleh tanggal tampil.
 */
export function getContractLifecycleStatus(
  kontrak: Pick<Contract, 'is_signed_customer' | 'valid_until'>,
  now: Date = new Date()
): ContractSignatureStatus {
  if (isContractSigned(kontrak)) return 'SIGNED';
  if (!isContractActive({ valid_until: kontrak.valid_until }, now)) return 'EXPIRED';
  return 'AWAITING';
}

/**
 * Apakah kontrak masih berlaku hari ini.
 *
 * Kontrak tanpa `valid_until` dianggap tidak memiliki batas akhir.
 */
export function isContractActive(kontrak: Pick<Contract, 'valid_until'>, now: Date = new Date()): boolean {
  if (typeof kontrak.valid_until !== 'string' || kontrak.valid_until === '') return true;
  const batas = new Date(kontrak.valid_until);
  if (Number.isNaN(batas.getTime())) return true;
  return batas.getTime() >= now.getTime();
}

// ---------------------------------------------------------------------------
