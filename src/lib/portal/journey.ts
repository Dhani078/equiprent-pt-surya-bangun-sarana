import { Contract, Payment, Rental } from '../../types';
import { getRentalStatusLabel, getRentalStatusTone } from '../rentalWorkflow';
import { getPaymentStatusLabel, getPaymentStatusTone } from '../paymentWorkflow';
import { RENTAL_JOURNEY_LABEL, RENTAL_JOURNEY_TONE, RentalJourneyRow, RentalJourneyStage, RentalNextAction, isSigned } from './core';

/**
 * Menentukan tahap perjalanan sewa dari status sewa + kontrak + tagihan.
 *
 * Urutan pemeriksaan sengaja mengikuti alur operasional nyata:
 * ditolak → selesai → beroperasi → kontrak → pembayaran.
 */
export function resolveRentalStage(
  rental: Rental,
  contract: Contract | null,
  payment: Payment | null
): RentalJourneyStage {
  if (rental.status === 'REJECTED') return 'DITOLAK';
  if (rental.status === 'COMPLETED') return 'SELESAI';
  if (rental.status === 'ON_GOING') return 'BEROPERASI';
  if (rental.status === 'PENDING') return 'MENUNGGU_PERSETUJUAN';

  // Status APPROVED — perjalanan berlanjut ke kontrak & pembayaran.
  if (!contract) return 'MENUNGGU_KONTRAK';
  if (!isSigned(contract)) return 'MENUNGGU_TANDA_TANGAN';
  if (!payment) return 'MENUNGGU_PEMBAYARAN';
  if (payment.status === 'PAID') return 'MENUNGGU_PERSETUJUAN';
  if (payment.status === 'PENDING_VERIFICATION') return 'MENUNGGU_VERIFIKASI';
  return 'MENUNGGU_PEMBAYARAN';
}

/** Tindakan berikutnya yang diharapkan dari pelanggan untuk sewa ini. */
export function resolveNextAction(
  rental: Rental,
  contract: Contract | null,
  payment: Payment | null
): RentalNextAction {
  if (rental.status !== 'APPROVED') return null;
  if (!contract) return null;
  if (!isSigned(contract)) return 'TANDA_TANGAN_KONTRAK';
  if (!payment || payment.status === 'UNPAID' || payment.status === 'FAILED') {
    return 'UNGGAH_BUKTI_BAYAR';
  }
  if (payment.status === 'PENDING_VERIFICATION') return 'TUNGGU_VERIFIKASI';
  return null;
}

/**
 * Menyusun baris riwayat sewa pelanggan.
 *
 * Kontrak & tagihan dicari berdasarkan relasi yang tersimpan (bukan teks
 * kode) agar riwayat tidak putus bila nomor kontrak berubah format.
 */
export function buildRentalJourney(
  rentals: readonly Rental[],
  contracts: readonly Contract[],
  payments: readonly Payment[]
): RentalJourneyRow[] {
  const kontrakPerSewa = new Map<number, Contract>();
  for (const kontrak of contracts) {
    if (!kontrakPerSewa.has(kontrak.rental_id)) {
      kontrakPerSewa.set(kontrak.rental_id, kontrak);
    }
  }

  const tagihanPerKontrak = new Map<number, Payment>();
  for (const tagihan of payments) {
    if (!tagihanPerKontrak.has(tagihan.contract_id)) {
      tagihanPerKontrak.set(tagihan.contract_id, tagihan);
    }
  }

  return rentals.map((rental) => {
    const contract = kontrakPerSewa.get(rental.id) ?? null;
    const payment = contract ? tagihanPerKontrak.get(contract.id) ?? null : null;
    const stage = resolveRentalStage(rental, contract, payment);

    return {
      rental,
      status: rental.status,
      statusLabel: getRentalStatusLabel(rental.status),
      statusTone: getRentalStatusTone(rental.status),
      stage,
      stageLabel: RENTAL_JOURNEY_LABEL[stage],
      stageTone: RENTAL_JOURNEY_TONE[stage],
      contract,
      payment,
      paymentStatusLabel: payment ? getPaymentStatusLabel(payment.status) : null,
      paymentStatusTone: payment ? getPaymentStatusTone(payment.status) : null,
      nextAction: resolveNextAction(rental, contract, payment),
    };
  });
}
