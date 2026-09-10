/**
 * Mesin Verifikasi Pembayaran (T-0008)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Modul MURNI: tidak menyentuh DOM, tidak mengambil data sendiri, tidak
 * memanggil jaringan. Dipakai bersama oleh:
 *   1. Edge API  `POST /api/payments/:id/proof`  & `/verify` & `/reject`
 *   2. Lapisan data `src/lib/db.ts`              (penjaga aturan bisnis)
 *   3. Antarmuka Staf & Pelanggan                (label & alasan penolakan)
 *
 * Alasan modul ini ada:
 * sebelum T-0008, unggah bukti dan verifikasi hanya menyetel status secara
 * langsung di dua tempat berbeda tanpa pemeriksaan kepemilikan maupun
 * aturan "sewa hanya boleh beroperasi bila pembayaran lunas". Akibatnya
 *   - staf dapat mengesahkan pembayaran yang belum pernah dibayar;
 *   - pelanggan dapat mengunggah bukti atas tagihan pelanggan lain;
 *   - rental dapat beroperasi (ON_GOING) walau uang belum diterima.
 * Sekarang hanya ada SATU definisi status & transisi yang diuji.
 */

import type { Payment, Rental } from '../types';

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

export type PaymentStatus = Payment['status'];

/** Status final yang tidak bisa diubah lagi. */
export type PaymentTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Label siap tampil untuk satu status pembayaran. */
export interface PaymentStatusMeta {
  label: string;
  tone: PaymentTone;
}

/** Hasil evaluasi: apakah sebuah aksi atas pembayaran diizinkan. */
export type PaymentActionCheck =
  | { allowed: true }
  | { allowed: false; code: PaymentRejectionCode; message: string };

/**
 * Kode penolakan.
 *
 * Dikirim apa adanya ke klien pada field `error.code` supaya UI dapat
 * menampilkan pesan yang tepat tanpa harus menebak dari teks bebas.
 */
export type PaymentRejectionCode =
  | 'BUKTI_TIDAK_VALID'
  | 'PEMBAYARAN_SUDAH_FINAL'
  | 'STATUS_PEMBAYARAN_TIDAK_VALID'
  | 'BUKTI_TRANSFER_BELUM_ADA'
  | 'BUKAN_PEMILIK_PEMBAYARAN'
  | 'TAGIHAN_BELUM_LUNAS';

// ---------------------------------------------------------------------------
// Transisi Status Pembayaran
// ---------------------------------------------------------------------------

/**
 * Transisi yang DIIZINKAN.
 *
 * UNPAID → PENDING_VERIFICATION : pelanggan melampirkan bukti transfer
 * PENDING_VERIFICATION → PAID   : staf memverifikasi bukti
 * PENDING_VERIFICATION → FAILED : staf menolak bukti (transfer tidak sah)
 * FAILED → PENDING_VERIFICATION : pelanggan mengunggah ulang bukti yang sah
 * PAID   → (status final, tidak bisa diubah)
 *
 * Catatan bisnis:
 * - Bukti hanya dapat dilampirkan pada tagihan yang belum lunas.
 * - PAID bersifat final agar pendapatan pada laporan keuangan tidak bisa
 *   diubah-ubah setelah disahkan.
 */
const TRANSISI_DIIZINKAN: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> = {
  UNPAID: ['PENDING_VERIFICATION'],
  PENDING_VERIFICATION: ['PAID', 'FAILED'],
  PAID: [],
  FAILED: ['PENDING_VERIFICATION'],
};

/** Label & nada warna badge untuk tiap status (mengikuti design system §7). */
export const PAYMENT_STATUS_META: Readonly<Record<PaymentStatus, PaymentStatusMeta>> = {
  UNPAID: { label: 'Belum Dibayar', tone: 'neutral' },
  PENDING_VERIFICATION: { label: 'Menunggu Verifikasi', tone: 'warning' },
  PAID: { label: 'Lunas', tone: 'success' },
  FAILED: { label: 'Ditolak', tone: 'danger' },
};

/** Semua status pembayaran yang diakui, dipakai untuk validasi input. */
export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'UNPAID',
  'PENDING_VERIFICATION',
  'PAID',
  'FAILED',
];

/** Type guard: nilai dari JSON tidak boleh dipercaya mentah-mentah. */
export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === 'string' && PAYMENT_STATUSES.includes(value as PaymentStatus);
}

/** Label badge untuk status pembayaran. */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_META[status].label;
}

/** Nada warna badge untuk status pembayaran. */
export function getPaymentStatusTone(status: PaymentStatus): PaymentTone {
  return PAYMENT_STATUS_META[status].tone;
}

/** Status yang sudah final — tidak menerima perubahan apa pun lagi. */
export function isPaymentFinal(status: PaymentStatus): boolean {
  return TRANSISI_DIIZINKAN[status].length === 0;
}

/**
 * Memeriksa apakah sebuah perubahan status pembayaran diizinkan.
 */
export function canChangePaymentStatus(
  current: PaymentStatus,
  next: PaymentStatus
): PaymentActionCheck {
  if (current === next) {
    return {
      allowed: false,
      code: 'STATUS_PEMBAYARAN_TIDAK_VALID',
      message: `Tagihan ini sudah berstatus ${getPaymentStatusLabel(current)}.`,
    };
  }

  if (!TRANSISI_DIIZINKAN[current].includes(next)) {
    return {
      allowed: false,
      code: 'PEMBAYARAN_SUDAH_FINAL',
      message: `Perubahan status ${getPaymentStatusLabel(current)} → ${getPaymentStatusLabel(next)} tidak diizinkan.`,
    };
  }

  return { allowed: true };
}

/**
 * Status yang boleh dipilih staf dari status saat ini.
 * Dipakai antarmuka agar tombol yang tampil selalu sejalan dengan server.
 */
export function getAllowedPaymentTransitions(current: PaymentStatus): readonly PaymentStatus[] {
  return TRANSISI_DIIZINKAN[current];
}

// ---------------------------------------------------------------------------
// Validasi Berkas Bukti Transfer
// ---------------------------------------------------------------------------

/**
 * Pola nama/path berkas bukti yang diterima.
 *
 * Sistem TIDAK menyimpan berkas (tidak ada layanan objek storage pada
 * scope skripsi ini). Yang disimpan adalah deskriptor lokasi/nama berkas,
 * sehingga nilainya dibatasi pada karakter yang aman — mencegah path
 * traversal (`../../etc/passwd`) dan URL berbahaya (`javascript:`) ikut
 * tersimpan dan kemudian ditampilkan pada antarmuka staf.
 */
const POLA_PATH_BUKTI = /^[\w./-]{1,255}$/;

/** Banyaknya karakter maksimal keterangan bukti. */
export const LIMIT_BUKTI_CHARS_MAX = 255;

/** Berkas dengan ekstensi ini yang diakui sebagai bukti transfer. */
export const EKSTENSI_BUKTI_DITERIMA: readonly string[] = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.pdf',
];

/** Kode galat untuk field bukti pada respons validasi form. */
export const FIELD_BUKTI = 'paymentProofPath';

/**
 * Memvalidasi deskriptor bukti transfer.
 *
 * `required = true` dipakai saat pelanggan melampirkan bukti (wajib ada),
 * sedangkan `false` dipakai saat memperbarui catatan (boleh dikosongkan).
 */
export function validatePaymentProofPath(
  raw: unknown,
  options: { required: boolean } = { required: true }
): { ok: true; value: string } | { ok: false; message: string } {
  const nilai = typeof raw === 'string' ? raw.trim() : '';

  if (nilai === '') {
    return options.required
      ? { ok: false, message: 'Nama berkas bukti transfer wajib diisi.' }
      : { ok: true, value: '' };
  }

  if (nilai.length > LIMIT_BUKTI_CHARS_MAX) {
    return {
      ok: false,
      message: `Nama berkas bukti transfer maksimal ${LIMIT_BUKTI_CHARS_MAX} karakter.`,
    };
  }

  // Tolak jalur absolut, traversal direktori, dan skema URL berbahaya.
  if (nilai.includes('..') || nilai.startsWith('/') || nilai.includes('\\') || nilai.includes(':')) {
    return {
      ok: false,
      message: 'Nama berkas bukti transfer tidak boleh berupa jalur absolut atau tautan.',
    };
  }

  if (!POLA_PATH_BUKTI.test(nilai)) {
    return {
      ok: false,
      message: 'Nama berkas bukti transfer hanya boleh berisi huruf, angka, titik, garis, atau garis miring.',
    };
  }

  const hurufKecil = nilai.toLowerCase();
  const ekstensiDikenal = EKSTENSI_BUKTI_DITERIMA.some((ekstensi) =>
    hurufKecil.endsWith(ekstensi)
  );
  if (!ekstensiDikenal) {
    return {
      ok: false,
      message: `Bukti transfer harus berupa berkas ${EKSTENSI_BUKTI_DITERIMA.join(', ')}.`,
    };
  }

  return { ok: true, value: nilai };
}

/**
 * Memeriksa apakah pelanggan berhak menyentuh tagihan ini.
 *
 * Admin & Staf bertindak atas nama perusahaan, jadi diizinkan. Pelanggan
 * HANYA boleh menyentuh tagihannya sendiri — tanpa pemeriksaan ini,
 * pelanggan dapat mengunggah bukti palsu atas tagihan pelanggan lain
 * hanya dengan menebak ID tagihan.
 */
export function mayTouchPayment(
  payment: Pick<Payment, 'customer_id'>,
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER',
  userId: number
): boolean {
  if (role === 'ADMIN' || role === 'STAFF') return true;
  return payment.customer_id === userId;
}

/** Memeriksa apakah peran ini boleh memverifikasi/menolak pembayaran. */
export function mayVerifyPayment(role: 'ADMIN' | 'STAFF' | 'CUSTOMER'): boolean {
  return role === 'ADMIN' || role === 'STAFF';
}

// ---------------------------------------------------------------------------
// Gerbang Pembayaran → Status Sewa (ATURAN BISNIS §4.3 poin 4)
// ---------------------------------------------------------------------------

/**
 * Status sewa yang mensyaratkan pembayaran sudah `PAID`.
 *
 * APPROVED → ON_GOING dikunci oleh aturan ini: unit boleh beroperasi hanya
 * bila uang sudah diterima. Pengecualian (override ADMIN) dinyatakan
 * eksplisit melalui argumen `override`.
 */
export const STATUS_SEWA_BUTUH_LUNAS: readonly Rental['status'][] = ['ON_GOING'];

/** Hasil evaluasi gerbang pembayaran sebelum sewa boleh berjalan. */
export type PaymentGateCheck =
  | { allowed: true; requiresPaid: false }
  | { allowed: true; requiresPaid: true; overrideUsed: boolean }
  | { allowed: false; code: PaymentRejectionCode; message: string };

/**
 * Menentukan apakah sebuah perubahan status sewa boleh dilakukan
 * ditinjau dari sisi pembayaran.
 *
 * `paymentStatus` boleh `null` — misalnya sewa yang belum diterbitkan
 * kontraknya sehingga belum punya tagihan. Kondisi itu diperlakukan sama
 * dengan "belum lunas" karena uang memang belum diterima.
 */
export function checkPaymentGate(
  nextStatus: Rental['status'],
  paymentStatus: PaymentStatus | null,
  options: { role?: 'ADMIN' | 'STAFF' | 'CUSTOMER'; override?: boolean } = {}
): PaymentGateCheck {
  const { role = 'ADMIN', override = false } = options;

  if (!STATUS_SEWA_BUTUH_LUNAS.includes(nextStatus)) {
    return { allowed: true, requiresPaid: false };
  }

  if (paymentStatus === 'PAID') {
    return { allowed: true, requiresPaid: true, overrideUsed: false };
  }

  // Override hanya wewenang ADMIN (§4.3 poin 4: "kecuali ada override ADMIN").
  const overrideSah = override && role === 'ADMIN';
  if (overrideSah) {
    return { allowed: true, requiresPaid: true, overrideUsed: true };
  }

  return {
    allowed: false,
    code: 'TAGIHAN_BELUM_LUNAS',
    message:
      'Pembayaran atas sewa ini belum terverifikasi lunas. Verifikasi bukti transfer terlebih dahulu sebelum unit dioperasikan.',
  };
}

/**
 * Menyimpulkan status pembayaran sebuah transaksi sewa.
 *
 * Sewa dapat memiliki lebih dari satu tagihan (cicilan/DP + pelunasan).
 * Status terburuk yang menang: bila ada satu saja tagihan yang belum lunas
 * atau gagal, sewa itu belum boleh beroperasi.
 */
export function summarizeRentalPayment(
  payments: ReadonlyArray<Pick<Payment, 'contract_id' | 'status'>>,
  contractIds: ReadonlyArray<number>
): PaymentStatus | null {
  const relevan = payments.filter((p) => contractIds.includes(p.contract_id));
  if (relevan.length === 0) return null;

  if (relevan.some((p) => p.status === 'FAILED')) return 'FAILED';
  if (relevan.some((p) => p.status === 'UNPAID')) return 'UNPAID';
  if (relevan.some((p) => p.status === 'PENDING_VERIFICATION')) return 'PENDING_VERIFICATION';

  return 'PAID';
}

/**
 * Menentukan apakah pembayaran sudah lunas.
 * Dipakai UI agar label tombol sama dengan keputusan server.
 */
export function isPaid(paymentStatus: PaymentStatus | null): boolean {
  return paymentStatus === 'PAID';
}

// ---------------------------------------------------------------------------
// Ringkasan Antrean Verifikasi (dipakai dashboard staf)
// ---------------------------------------------------------------------------

export interface PaymentQueueSummary {
  /** Banyak tagihan menunggu verifikasi. */
  pendingCount: number;
  /** Nilai tagihan menunggu verifikasi (Rupiah). */
  pendingAmount: number;
  /** Tagihan menunggu yang SUDAH melampirkan bukti & siap diverifikasi. */
  readyToVerifyCount: number;
  /** Tagihan menunggu yang BELUM melampirkan bukti. */
  awaitingProofCount: number;
  /** Banyak tagihan lunas. */
  paidCount: number;
  /** Nilai tagihan lunas (Rupiah). */
  paidAmount: number;
  /** Banyak tagihan ditolak. */
  failedCount: number;
}

/**
 * Menghitung ringkasan antrean verifikasi pembayaran.
 *
 * Pemisahan "siap diverifikasi" vs "menunggu bukti" penting untuk staf:
 * tanpa itu, semua tagihan tampak sama dan staf mengklik tombol verifikasi
 * yang pasti gagal karena buktinya belum ada.
 */
export function summarizePaymentQueue(
  payments: ReadonlyArray<Pick<Payment, 'status' | 'amount' | 'payment_proof_path'>>
): PaymentQueueSummary {
  const ringkasan: PaymentQueueSummary = {
    pendingCount: 0,
    pendingAmount: 0,
    readyToVerifyCount: 0,
    awaitingProofCount: 0,
    paidCount: 0,
    paidAmount: 0,
    failedCount: 0,
  };

  for (const p of payments) {
    const nilai = Number(p.amount);
    const aman = Number.isFinite(nilai) ? nilai : 0;

    if (p.status === 'PENDING_VERIFICATION') {
      ringkasan.pendingCount += 1;
      ringkasan.pendingAmount += aman;
      // Bukti dianggap ada bila terisi (bukan string kosong).
      const adaBukti = typeof p.payment_proof_path === 'string' && p.payment_proof_path.trim() !== '';
      if (adaBukti) ringkasan.readyToVerifyCount += 1;
      else ringkasan.awaitingProofCount += 1;
      continue;
    }

    if (p.status === 'PAID') {
      ringkasan.paidCount += 1;
      ringkasan.paidAmount += aman;
      continue;
    }

    if (p.status === 'FAILED') ringkasan.failedCount += 1;
  }

  return ringkasan;
}
