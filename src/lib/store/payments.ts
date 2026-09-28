/**
 * Operasi tagihan: bukti, verifikasi, penolakan, penghapusan berjenjang.
 *
 * Dipisah dari `db.ts`; seluruh konteks bersama (stateStore, jalur tulis,
 * cermin TiDB) datang dari `./internal`.
 */
import { nextId, stateStore, tidbClient, wt } from './internal';
import { lewatJembatan } from './internal';
import type { Rental, Contract, Payment, Maintenance } from '../../types';
import { canChangePaymentStatus } from '../paymentWorkflow';

export const payments = {
  getPayments: async () => stateStore.payments,

  /** Hapus tagihan (UNPAID/FAILED/PENDING) beserta jejaknya. */
  hapusPayment: async (paymentId: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Payment>('DELETE', `/api/payments/${paymentId}`);
    }
    const idx = stateStore.payments.findIndex(x => x.id === paymentId);
    if (idx === -1) return undefined;
    await wt('DELETE FROM `payments` WHERE `id` = ?', [paymentId], 'hapusPayment');
    const [hapus] = stateStore.payments.splice(idx, 1);
    return hapus;
  },

  /** Hapus kontrak (belum lunas ditangani; dipanggil berurutan dgn tagihannya). */
  hapusKontrak: async (contractId: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Contract>('DELETE', `/api/contracts/${contractId}`);
    }
    const idx = stateStore.contracts.findIndex(x => x.id === contractId);
    if (idx === -1) return undefined;
    await wt('DELETE FROM `contracts` WHERE `id` = ?', [contractId], 'hapusKontrak');
    const [hapus] = stateStore.contracts.splice(idx, 1);
    return hapus;
  },

  /** Hapus pengajuan sewa (PENDING/Ditolak saja — dijaga rute). */
  hapusRental: async (rentalId: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Rental>('DELETE', `/api/rentals/${rentalId}`);
    }
    const idx = stateStore.rentals.findIndex(x => x.id === rentalId);
    if (idx === -1) return undefined;
    await wt('DELETE FROM `rentals` WHERE `id` = ?', [rentalId], 'hapusRental');
    const [hapus] = stateStore.rentals.splice(idx, 1);
    return hapus;
  },

  /**
   * Mengesahkan pembayaran menjadi PAID.
   *
   * Penjaga aturan bisnis (satu sumber kebenaran: `src/lib/paymentWorkflow.ts`):
   *   1. Transisi status harus sah (PENDING_VERIFICATION → PAID);
   *   2. Bukti transfer wajib sudah dilampirkan.
   *
   * Tanpa dua pemeriksaan ini, staf dapat mengesahkan tagihan yang belum
   * pernah dibayar — pendapatan pada laporan keuangan lalu fiktif.
   */
  verifyPayment: async (paymentId: number, staffUserId: number, staffName: string) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Payment>('POST', `/api/payments/${paymentId}/verify`, { staffId: staffUserId, staffName });
    }
    const p = stateStore.payments.find(x => x.id === paymentId);
    if (!p) return undefined;

    const transisi = canChangePaymentStatus(p.status, 'PAID');
    if (!transisi.allowed) throw new Error(transisi.code);

    // Hanya pembayaran yang menunggu verifikasi DAN sudah melampirkan bukti
    // transfer yang boleh ditandai PAID.
    const adaBukti = typeof p.payment_proof_path === 'string' && p.payment_proof_path.trim() !== '';
    if (!adaBukti) {
      throw new Error('BUKTI_TRANSFER_BELUM_ADA');
    }

    const verifiedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `payments` SET `status` = ?, `verified_by` = ?, `verified_at` = ? WHERE `id` = ?',
      ['PAID', staffUserId, verifiedAt, paymentId],
      'verifyPayment'
    );
    p.status = 'PAID';
    p.verified_by = staffUserId;
    p.verified_by_name = staffName;
    p.verified_at = verifiedAt;
    return p;
  },

  /**
   * Menolak bukti transfer yang tidak sah (PENDING_VERIFICATION → FAILED).
   *
   * Tagihan yang ditolak dapat dilampiri ulang bukti oleh pelanggan,
   * sehingga statusnya kembali PENDING_VERIFICATION (bukan status akhir).
   *
   * Kolom `verified_by*` dipakai sebagai jejak peninjau (bukan "verifikator"
   * semata): UI merender "Ditolak oleh …" untuk status FAILED, sehingga
   * tidak perlu menambah kolom baru pada skema yang sudah dimigrasi.
   */
  rejectPayment: async (paymentId: number, staffUserId: number, staffName: string) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Payment>('POST', `/api/payments/${paymentId}/reject`, { staffName });
    }
    const p = stateStore.payments.find(x => x.id === paymentId);
    if (!p) return undefined;

    const transisi = canChangePaymentStatus(p.status, 'FAILED');
    if (!transisi.allowed) throw new Error(transisi.code);

    const verifiedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `payments` SET `status` = ?, `verified_by` = ?, `verified_at` = ? WHERE `id` = ?',
      ['FAILED', staffUserId, verifiedAt, paymentId],
      'rejectPayment'
    );
    p.status = 'FAILED';
    p.verified_by = staffUserId;
    p.verified_by_name = staffName;
    p.verified_at = verifiedAt;
    return p;
  },

  /**
   * Melampirkan bukti transfer (UNPAID / FAILED → PENDING_VERIFICATION).
   *
   * `proofPath` sudah divalidasi oleh `validatePaymentProofPath()` di
   * lapisan API sebelum sampai ke sini.
   */
  addPaymentProof: async (paymentId: number, proofPath: string) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Payment>('POST', `/api/payments/${paymentId}/proof`, { paymentProofPath: proofPath });
    }
    const p = stateStore.payments.find(x => x.id === paymentId);
    if (!p) return undefined;

    const transisi = canChangePaymentStatus(p.status, 'PENDING_VERIFICATION');
    if (!transisi.allowed) throw new Error(transisi.code);

    // Lampiran baru membatalkan peninjauan lama: nama & waktu pemeriksa
    // sebelumnya tidak lagi menggambarkan berkas yang sedang ditinjau.
    const buktiBerubah = (p.payment_proof_path ?? '') !== proofPath;

    const bayarPada = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `payments` SET `payment_proof_path` = ?, `status` = ?, `payment_date` = ?, `verified_by` = NULL, `verified_at` = NULL WHERE `id` = ?',
      [proofPath, 'PENDING_VERIFICATION', bayarPada, paymentId],
      'addPaymentProof'
    );
    p.payment_proof_path = proofPath;
    p.status = 'PENDING_VERIFICATION';
    p.payment_date = bayarPada;

    if (buktiBerubah) {
      p.verified_by = null;
      p.verified_by_name = undefined;
      p.verified_at = null;
    }
    return p;
  },

  // Maintenance
};
