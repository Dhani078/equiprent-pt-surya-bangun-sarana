import { Payment } from '../../types';
import { isPaymentFinal, PaymentStatus } from '../paymentWorkflow';
import { BillingSummary, toSafeNumber } from './core';

/** Menghitung ringkasan tagihan pelanggan untuk kepala tab pembayaran. */
export function summarizeBilling(payments: readonly Payment[]): BillingSummary {
  const ringkasan: BillingSummary = {
    total: payments.length,
    totalAmount: 0,
    lunasCount: 0,
    lunasAmount: 0,
    menungguVerifikasiCount: 0,
    menungguVerifikasiAmount: 0,
    belumBayarCount: 0,
    belumBayarAmount: 0,
    ditolakCount: 0,
    bisaUnggahCount: 0,
  };

  for (const tagihan of payments) {
    const nilai = toSafeNumber(tagihan.amount);
    ringkasan.totalAmount += nilai;

    switch (tagihan.status) {
      case 'PAID':
        ringkasan.lunasCount += 1;
        ringkasan.lunasAmount += nilai;
        break;
      case 'PENDING_VERIFICATION':
        ringkasan.menungguVerifikasiCount += 1;
        ringkasan.menungguVerifikasiAmount += nilai;
        break;
      case 'FAILED':
        // Bukti ditolak → uang belum diterima → masih jadi kewajiban
        // pelanggan, jadi masuk `belumBayar` sekaligus `ditolak`.
        ringkasan.ditolakCount += 1;
        ringkasan.belumBayarCount += 1;
        ringkasan.belumBayarAmount += nilai;
        break;
      case 'UNPAID':
        ringkasan.belumBayarCount += 1;
        ringkasan.belumBayarAmount += nilai;
        break;
    }

    if (!isPaymentFinal(tagihan.status)) ringkasan.bisaUnggahCount += 1;
  }

  return ringkasan;
}

/**
 * Menentukan apakah sebuah tagihan masih boleh dilampiri bukti transfer.
 *
 * Tagihan yang sudah final (lunas) dikunci — aturan yang sama dengan
 * `POST /api/payments/:id/proof` di server.
 */
export function canUploadProof(status: PaymentStatus): boolean {
  return !isPaymentFinal(status);
}
