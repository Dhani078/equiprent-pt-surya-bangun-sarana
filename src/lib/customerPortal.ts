/**
 * Mesin Portal Pelanggan (T-0011)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Modul MURNI: tidak menyentuh DOM, tidak memanggil jaringan, tidak
 * mengambil data sendiri. Dipakai bersama oleh:
 *   1. Antarmuka `src/pages/customer/CustomerPortal.tsx`
 *   2. Edge API  `GET /api/portal/ringkasan`  (nilai yang sama persis)
 *
 * Alasan modul ini ada
 * --------------------
 * Sebelum T-0011, logika portal tersebar di dalam komponen:
 *   - katalog menampilkan SEMUA 50 unit, padahal kriteria penerimaan
 *     menyaratkan hanya unit yang bisa disewa (unit `maintenance` /
 *     `retired` dilarang oleh aturan bisnis §4.3 poin 2);
 *   - pengajuan sewa memakai `buildEquipmentAvailability([satu unit])`,
 *     sehingga katalog tidak pernah memberi tahu unit mana yang sedang
 *     bentrok pada periode yang dipilih;
 *   - "Tagihan Saya" memakai `payments.filter(p => p.customer_id === user.id)`
 *     — benar, tetapi tidak pernah diuji, dan ringkasannya (total tagihan,
 *     yang sudah jatuh tempo) tidak ada di mana pun;
 *   - ringkasan kartu tab dihitung inline sehingga tidak bisa diuji.
 *
 * Modul ini memusatkan: penentuan kepemilikan, penyusunan katalog
 * (status unit + bentrokan jadwal + kata kunci + kategori + urutan harga),
 * ringkasan perjalanan sewa (kontrak & tagihan per sewa), ringkasan tagihan,
 * dan validasi pengajuan sewa.
 *
 * Catatan perhitungan harga: `calculateRentalCost()` dipakai sebagai SATU
 * sumber kebenaran hari & biaya. Portal tidak lagi menghitung
 * `(end - start) / 86400000` sendiri, karena rumus lama memakai `Math.round`
 * dan bisa menghasilkan 0 hari untuk sewa di hari yang sama, sementara
 * dokumen & laporan memakai rumus `ceil + 1` (minimal 1 hari). Perbedaan
 * 1 hari = selisih jutaan rupiah pada tagihan.
 */

import type { Contract, Equipment, Payment, Rental } from '../types';
import {
  buildEquipmentAvailability,
  isUnitOutOfService,
  normalizeBookingRange,
} from './availability';
import type { EquipmentAvailability } from './availability';
import { calculateRentalCost, formatTanggal } from './businessRules';
import { getRentalStatusLabel, getRentalStatusTone } from './rentalWorkflow';
import type { RentalLifecycleTone, RentalStatus } from './rentalWorkflow';
import { getPaymentStatusLabel, getPaymentStatusTone, isPaymentFinal } from './paymentWorkflow';
import type { PaymentStatus, PaymentTone } from './paymentWorkflow';

// ---------------------------------------------------------------------------
// Konstanta
// ---------------------------------------------------------------------------

/**
 * Batas maksimum hari sewa yang dapat diajukan pelanggan.
 *
 * Sewa alat berat harian pada umumnya memakai kontrak mingguan / bulanan.
 * Batas ini mencegah kesalahan ketik tanggal (misal tahun 2099) yang akan
 * mengunci unit selama puluhan tahun dan merusak laporan utilisasi.
 */
export const BATAS_HARI_SEWA_MAKSIMAL = 365;

/** Panjang maksimum kata kunci pencarian katalog. */
export const BATAS_KATA_KUNCI = 80;

/** Kata kunci yang tidak mengandung karakter alfanumerik dianggap kosong. */
const POLA_KATA_KUNCI = /[a-z0-9]/i;

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

/** Filter katalog yang dipilih pelanggan. */
export interface CatalogFilter {
  /** Kata kunci: nama unit, kode unit, merek, model, atau kategori. */
  search: string;
  /** Kategori alat berat. String kosong = semua kategori. */
  category: string;
  /** Arah urutan harga sewa per hari. */
  sort: 'TERMURAH' | 'TERMAHAL' | 'TERBARU';
}

/** Filter bawaan katalog — tanpa penyaringan, urutan termurah. */
export const DEFAULT_CATALOG_FILTER: CatalogFilter = {
  search: '',
  category: '',
  sort: 'TERMURAH',
};

/**
 * Mengapa sebuah unit tidak dapat diajukan.
 *
 * `TERSEDIA`       → bebas dipesan pada periode yang dipilih.
 * `SEDANG_DISEWA`  → unit tersedia secara umum, tetapi bentrok dengan sewa
 *                    lain pada periode yang dipilih pelanggan.
 * `TIDAK_DISEWA_KAN` → unit sedang dirawat atau dinonaktifkan.
 * `PERIODE_TIDAK_VALID` → rentang tanggal yang diminta tidak dapat diparse.
 */
export type CatalogAvailabilityCode =
  | 'TERSEDIA'
  | 'SEDANG_DISEWA'
  | 'TIDAK_DISEWA_KAN'
  | 'PERIODE_TIDAK_VALID';

/** Label siap tampil untuk tiap kode ketersediaan. */
export const CATALOG_AVAILABILITY_LABEL: Readonly<Record<CatalogAvailabilityCode, string>> = {
  TERSEDIA: 'Tersedia',
  SEDANG_DISEWA: 'Sedang Disewa',
  TIDAK_DISEWA_KAN: 'Tidak Disewakan',
  PERIODE_TIDAK_VALID: 'Periode Tidak Valid',
};

/** Nada warna badge mengikuti design system §7. */
export type CatalogTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

/** Nada warna badge untuk tiap kode ketersediaan. */
export const CATALOG_AVAILABILITY_TONE: Readonly<Record<CatalogAvailabilityCode, CatalogTone>> = {
  TERSEDIA: 'success',
  SEDANG_DISEWA: 'warning',
  TIDAK_DISEWA_KAN: 'danger',
  PERIODE_TIDAK_VALID: 'neutral',
};

/** Satu unit di katalog, lengkap dengan status ketersediaannya. */
export interface CatalogItem {
  equipment: Equipment;
  /** Bisa diajukan pada periode yang sedang dipilih. */
  isBookable: boolean;
  /** Alasan bila tidak bisa diajukan. */
  availability: CatalogAvailabilityCode;
  /** Jumlah sewa lain yang bentrok (0 bila tidak bentrok). */
  conflictCount: number;
  /**
   * Kode sewa pertama yang bentrok — ditampilkan agar pelanggan tahu unit
   * ini sedang dipakai, bukan sekadar "tidak tersedia".
   */
  conflictRentalCode: string | null;
  /** Pesan siap tampil mengapa unit tidak bisa diajukan. */
  blockedMessage: string | null;
}

/** Hasil penyusunan katalog. */
export interface CatalogView {
  items: CatalogItem[];
  /** Kategori yang tersedia pada seluruh armada (untuk dropdown filter). */
  categories: string[];
  /** Ringkasan yang ditampilkan di kepala katalog. */
  summary: {
    total: number;
    bookable: number;
    blockedBySchedule: number;
    blockedByUnitStatus: number;
  };
}

/** Status kelengkapan dokumen untuk satu perjalanan sewa. */
export type RentalJourneyStage =
  /** Menunggu keputusan Admin / Staf Operasional. */
  | 'MENUNGGU_PERSETUJUAN'
  /** Disetujui tetapi kontrak belum diterbitkan. */
  | 'MENUNGGU_KONTRAK'
  /** Kontrak sudah ada, menunggu tanda tangan pelanggan. */
  | 'MENUNGGU_TANDA_TANGAN'
  /** Kontrak ditandatangani, tagihan belum lunas. */
  | 'MENUNGGU_PEMBAYARAN'
  /** Tagihan menunggu verifikasi staf. */
  | 'MENUNGGU_VERIFIKASI'
  /** Unit sedang di tangan pelanggan. */
  | 'BEROPERASI'
  /** Sewa selesai. */
  | 'SELESAI'
  /** Pengajuan ditolak. */
  | 'DITOLAK';

/** Label siap tampil untuk tiap tahap. */
export const RENTAL_JOURNEY_LABEL: Readonly<Record<RentalJourneyStage, string>> = {
  MENUNGGU_PERSETUJUAN: 'Menunggu Persetujuan',
  MENUNGGU_KONTRAK: 'Menunggu Kontrak',
  MENUNGGU_TANDA_TANGAN: 'Menunggu Tanda Tangan',
  MENUNGGU_PEMBAYARAN: 'Menunggu Pembayaran',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  BEROPERASI: 'Beroperasi',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
};

/** Nada warna badge untuk tiap tahap. */
export const RENTAL_JOURNEY_TONE: Readonly<Record<RentalJourneyStage, CatalogTone>> = {
  MENUNGGU_PERSETUJUAN: 'warning',
  MENUNGGU_KONTRAK: 'warning',
  MENUNGGU_TANDA_TANGAN: 'warning',
  MENUNGGU_PEMBAYARAN: 'warning',
  MENUNGGU_VERIFIKASI: 'warning',
  BEROPERASI: 'info',
  SELESAI: 'success',
  DITOLAK: 'danger',
};

/**
 * Langkah berikutnya yang perlu dilakukan pelanggan.
 *
 * `null` berarti tidak ada tindakan yang diharapkan dari pelanggan
 * (misalnya sewa yang sudah selesai).
 */
export type RentalNextAction =
  /** Tidak ada tindakan; tunggu tindakan Admin / Staf. */
  | null
  /** Buka tab kontrak dan bubuhkan tanda tangan. */
  | 'TANDA_TANGAN_KONTRAK'
  /** Buka tab tagihan dan lampirkan bukti transfer. */
  | 'UNGGAH_BUKTI_BAYAR'
  /** Tagihan menunggu verifikasi staf. */
  | 'TUNGGU_VERIFIKASI';

/** Label tombol aksi pada kartu perjalanan sewa. */
export const RENTAL_NEXT_ACTION_LABEL: Readonly<
  Record<Exclude<RentalNextAction, null>, string>
> = {
  TANDA_TANGAN_KONTRAK: 'Tanda Tangani Kontrak',
  UNGGAH_BUKTI_BAYAR: 'Unggah Bukti Bayar',
  TUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
};

/** Satu baris riwayat sewa pelanggan, lengkap dengan dokumen terkaitnya. */
export interface RentalJourneyRow {
  rental: Rental;
  status: RentalStatus;
  statusLabel: string;
  statusTone: RentalLifecycleTone;
  /** Tahap perjalanan sewa (turunan dari status + kontrak + tagihan). */
  stage: RentalJourneyStage;
  stageLabel: string;
  stageTone: CatalogTone;
  /** Kontrak yang terbit untuk sewa ini (bila ada). */
  contract: Contract | null;
  /** Tagihan kontrak ini (bila ada). */
  payment: Payment | null;
  /** Label status tagihan siap tampil. */
  paymentStatusLabel: string | null;
  paymentStatusTone: PaymentTone | null;
  /** Tindakan berikutnya yang diharapkan dari pelanggan. */
  nextAction: RentalNextAction;
}

/**
 * Ringkasan tagihan pada tab "Tagihan & Transfer".
 *
 * Invariant yang dijaga (dan diuji):
 *   totalAmount === lunasAmount + menungguVerifikasiAmount + belumBayarAmount
 *   total       === lunasCount  + menungguVerifikasiCount  + belumBayarCount
 *   belumBayar  === UNPAID + FAILED   (tagihan yang masih jadi kewajiban
 *                                      pelanggan; FAILED berarti bukti
 *                                      ditolak → harus bayar ulang)
 */
export interface BillingSummary {
  total: number;
  /** Nilai seluruh tagihan (Rupiah). */
  totalAmount: number;
  lunasCount: number;
  lunasAmount: number;
  menungguVerifikasiCount: number;
  menungguVerifikasiAmount: number;
  /** Jumlah tagihan yang belum lunas: `UNPAID` + `FAILED`. */
  belumBayarCount: number;
  /** Nilai tagihan yang belum lunas: `UNPAID` + `FAILED`. */
  belumBayarAmount: number;
  /** Jumlah tagihan `FAILED` (subset dari `belumBayarCount`). */
  ditolakCount: number;
  /** Tagihan yang masih bisa dilampiri buktinya (belum status final). */
  bisaUnggahCount: number;
}

// ---------------------------------------------------------------------------
// Helper Internal
// ---------------------------------------------------------------------------

/** Mengubah nilai menjadi angka finansial yang aman (tanpa NaN/Infinity). */
function toSafeNumber(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

/** Memotong & membersihkan kata kunci; mengembalikan '' bila tidak bermakna. */
function normalizeSearch(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim().slice(0, BATAS_KATA_KUNCI);
  // Kata kunci yang hanya berisi tanda baca tidak boleh menyaring semua unit.
  return POLA_KATA_KUNCI.test(trimmed) ? trimmed : '';
}

/** Mengubah nilai boolean-ish pada `is_signed_customer` menjadi boolean. */
function isSigned(contract: Contract): boolean {
  return contract.is_signed_customer === 1 || contract.is_signed_customer === true;
}

/**
 * Mengubah nilai tanggal menjadi timestamp UTC tengah hari.
 *
 * Disalin dari modul `availability` karena helper itu tidak diekspor, dan
 * portal harus memakai cara parse yang SAMA — memakai `new Date('2026-09-01')`
 * di sini akan menggeser tanggal satu hari pada zona waktu tertentu dan
 * membuat "tanggal selesai lebih awal dari tanggal mulai" lolos.
 */
function toSafeTime(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || value === '') return null;
  const time = new Date(`${value.slice(0, 10)}T12:00:00Z`).getTime();
  return Number.isFinite(time) ? time : null;
}

/**
 * Gelar & sapaan yang bukan bagian dari nama orang.
 *
 * Nama pelanggan tersimpan lengkap dengan sapaan ("Bapak Anton Wijaya"),
 * sedangkan kolom `customer_name` pada sewa/kontrak/tagihan kerap hanya
 * berisi nama badan usaha ("CV Anton Wijaya Sejahtera"). Tanpa membuang
 * sapaan ini, pencocokan nama selalu gagal dan pelanggan kehilangan
 * riwayatnya hanya karena perbedaan sapaan.
 */
const SAPAAN = new Set([
  'bapak',
  'ibu',
  'sdr',
  'sdri',
  'saudara',
  'saudari',
  'bpk',
  'mr',
  'mrs',
  'ms',
  'pt',
  'cv',
  'ud',
  'tbk',
]);

/** Token bermakna dari sebuah nama: tanpa sapaan, tanpa kata terlalu pendek. */
function nameTokens(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !SAPAAN.has(token));
}

// ---------------------------------------------------------------------------
// Kepemilikan
// ---------------------------------------------------------------------------

/**
 * Menyeleksi baris yang menjadi MILIK pelanggan ini.
 *
 * Basis utama adalah `customer_id`. Baris dengan `customer_id` 0 / tidak
 * valid jatuh ke pencocokan nama (`customer_name` memuat nama lengkap) —
 * data impor lama sering kehilangan ID, dan pelanggan tidak boleh kehilangan
 * riwayatnya hanya karena satu kolom kosong.
 */
export function isOwnedBy<T extends { customer_id: number; customer_name?: string }>(
  row: T,
  customer: { id: number; full_name: string }
): boolean {
  // ID 0 / negatif berarti "tidak diketahui" pada baris impor lama. Tanpa
  // penjagaan ini, dua baris yang sama-sama kehilangan ID akan saling cocok
  // dan pelanggan bisa melihat data pelanggan lain.
  if (customer.id > 0 && row.customer_id === customer.id) return true;

  const nama = customer.full_name.trim();
  if (nama.length === 0) return false;
  if (typeof row.customer_name !== 'string') return false;

  // Pencocokan nama memakai token bermakna, bukan substring utuh: nama
  // pengguna tersimpan "Bapak Anton Wijaya" sedangkan kolom pada sewa bisa
  // "CV Anton Wijaya Sejahtera". Seluruh token nama harus hadir, sehingga
  // nama yang hanya beririsan sebagian tidak pernah dianggap sama.
  const tokenNama = nameTokens(nama);
  if (tokenNama.length === 0) return false;

  const tokenBaris = new Set(nameTokens(row.customer_name));
  return tokenNama.every((token) => tokenBaris.has(token));
}

/** Sewa milik pelanggan ini, terbaru di atas. */
export function selectMyRentals(
  rentals: readonly Rental[],
  customer: { id: number; full_name: string }
): Rental[] {
  return rentals
    .filter((r) => isOwnedBy(r, customer))
    .sort((a, b) => String(b.booking_date).localeCompare(String(a.booking_date)));
}

/** Kontrak milik pelanggan ini, terbaru di atas. */
export function selectMyContracts(
  contracts: readonly Contract[],
  customer: { id: number; full_name: string }
): Contract[] {
  return contracts
    .filter((c) => isOwnedBy(c, customer))
    .sort((a, b) => String(b.contract_date).localeCompare(String(a.contract_date)));
}

/** Tagihan milik pelanggan ini, terbaru di atas. */
export function selectMyPayments(
  payments: readonly Payment[],
  customer: { id: number; full_name: string }
): Payment[] {
  return payments
    .filter((p) => isOwnedBy(p, customer))
    .sort((a, b) => String(b.payment_date).localeCompare(String(a.payment_date)));
}

// ---------------------------------------------------------------------------
// Katalog
// ---------------------------------------------------------------------------

/** Daftar kategori unik yang ada pada armada (diurutkan alfabetis). */
export function listCatalogCategories(equipments: readonly Equipment[]): string[] {
  const unik = new Set<string>();
  for (const eq of equipments) {
    const kategori = typeof eq.type === 'string' ? eq.type.trim() : '';
    if (kategori !== '') unik.add(kategori);
  }
  return [...unik].sort((a, b) => a.localeCompare(b, 'id-ID'));
}

/** Menormalkan filter katalog dari nilai yang tidak dapat dipercaya. */
export function normalizeCatalogFilter(raw: unknown): CatalogFilter {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_CATALOG_FILTER };
  const src = raw as Record<string, unknown>;

  const sortRaw = typeof src.sort === 'string' ? src.sort.toUpperCase() : '';
  const sort: CatalogFilter['sort'] =
    sortRaw === 'TERMAHAL' || sortRaw === 'TERBARU' ? sortRaw : 'TERMURAH';

  return {
    search: normalizeSearch(src.search),
    category: typeof src.category === 'string' ? src.category.trim().slice(0, 100) : '',
    sort,
  };
}

/**
 * Menyusun katalog: hanya unit yang BISA DISEWA yang tampil.
 *
 * Kriteria penerimaan T-0011: "Katalog hanya tampilkan unit available".
 * Implementasinya tidak cukup `status === 'AVAILABLE'` — status unit adalah
 * keadaan HARI INI, sedangkan pelanggan memesan untuk periode tertentu. Yang
 * benar: unit yang tidak dirawat/dinonaktifkan DAN tidak bentrok dengan sewa
 * lain pada periode yang dipilih.
 *
 * Unit yang bentrok TIDAK ditampilkan secara bawaan (`includeBlocked:
 * false`), sesuai kriteria penerimaan. Informasinya tidak hilang: jumlahnya
 * tetap dilaporkan pada `summary.blockedBySchedule` dan ditampilkan sebagai
 * keterangan di kepala katalog, sehingga pelanggan paham armada sedang sibuk
 * — bukan katalog yang kosong. `includeBlocked: true` mengembalikan unit
 * bentrok dengan badge "Sedang Disewa" dan tombol nonaktif.
 *
 * @param from Tanggal mulai sewa (YYYY-MM-DD) yang sedang dipilih pelanggan.
 * @param to   Tanggal selesai sewa (YYYY-MM-DD).
 */
export function buildCatalog(
  equipments: readonly Equipment[],
  rentals: readonly Rental[],
  from: string,
  to: string,
  filter: CatalogFilter = DEFAULT_CATALOG_FILTER,
  options: { includeBlocked?: boolean } = {}
): CatalogView {
  const includeBlocked = options.includeBlocked === true;
  const rentangValid = normalizeBookingRange(from, to) !== null;
  const availability = buildEquipmentAvailability(equipments, rentals, from, to);

  const kataKunci = normalizeSearch(filter.search).toLowerCase();
  const kategori = filter.category.trim();

  const items: CatalogItem[] = [];

  for (const entry of availability) {
    const { equipment, isBookable, blockedReason, conflicts } = entry;

    // Unit yang dirawat / dinonaktifkan tidak pernah tampil di katalog
    // pelanggan (aturan bisnis §4.3 poin 2).
    if (isUnitOutOfService(equipment.status)) continue;

    // Unit yang sedang disewa pada periode yang dipilih tidak ditawarkan.
    const kode: CatalogAvailabilityCode = !rentangValid
      ? 'PERIODE_TIDAK_VALID'
      : blockedReason === 'DATE_CONFLICT'
        ? 'SEDANG_DISEWA'
        : 'TERSEDIA';

    // Ringkasan `blockedBySchedule` tetap menghitung unit ini walau tidak
    // ditampilkan, agar kepala katalog bisa menjelaskan ke mana unit hilang.
    if (kode !== 'TERSEDIA' && !includeBlocked) continue;

    if (kategori !== '' && equipment.type !== kategori) continue;

    if (kataKunci !== '') {
      const cocok =
        equipment.name.toLowerCase().includes(kataKunci) ||
        equipment.equipment_code.toLowerCase().includes(kataKunci) ||
        equipment.brand.toLowerCase().includes(kataKunci) ||
        equipment.model.toLowerCase().includes(kataKunci) ||
        equipment.type.toLowerCase().includes(kataKunci);
      if (!cocok) continue;
    }

    const bentrokPertama = conflicts[0] ?? null;

    items.push({
      equipment,
      isBookable: isBookable && rentangValid,
      availability: kode,
      conflictCount: conflicts.length,
      conflictRentalCode: bentrokPertama ? bentrokPertama.rentalCode : null,
      blockedMessage: buildBlockedMessage(kode, equipment, bentrokPertama),
    });
  }

  const urut = (a: CatalogItem, b: CatalogItem): number => {
    if (filter.sort === 'TERMAHAL') {
      return toSafeNumber(b.equipment.rental_price_per_day) - toSafeNumber(a.equipment.rental_price_per_day);
    }
    if (filter.sort === 'TERBARU') {
      return String(b.equipment.created_at ?? '').localeCompare(String(a.equipment.created_at ?? ''));
    }
    return toSafeNumber(a.equipment.rental_price_per_day) - toSafeNumber(b.equipment.rental_price_per_day);
  };

  items.sort(urut);

  // Ringkasan dihitung dari SELURUH armada (sebelum penyaringan kata kunci)
  // agar angka "N unit siap sewa" tidak berubah saat pelanggan mengetik.
  return {
    items,
    categories: listCatalogCategories(equipments),
    summary: summarizeCatalog(availability, rentangValid),
  };
}

/**
 * Ringkasan katalog: berapa unit yang benar-benar bisa diajukan.
 * Dipisah dari `buildCatalog` agar bisa diuji tanpa merender komponen.
 */
export function summarizeCatalog(
  availability: readonly EquipmentAvailability[],
  rentangValid = true
): CatalogView['summary'] {
  let bookable = 0;
  let blockedBySchedule = 0;
  let blockedByUnitStatus = 0;

  for (const entry of availability) {
    if (isUnitOutOfService(entry.equipment.status)) {
      blockedByUnitStatus += 1;
      continue;
    }
    if (!rentangValid) continue;
    if (entry.blockedReason === 'DATE_CONFLICT') {
      blockedBySchedule += 1;
      continue;
    }
    bookable += 1;
  }

  return {
    total: availability.length,
    bookable,
    blockedBySchedule,
    blockedByUnitStatus,
  };
}

/** Pesan siap tampil mengapa sebuah unit tidak dapat diajukan. */
function buildBlockedMessage(
  kode: CatalogAvailabilityCode,
  equipment: Equipment,
  bentrok: { rentalCode: string; startDate: string; endDate: string } | null
): string | null {
  switch (kode) {
    case 'TERSEDIA':
      return null;
    case 'PERIODE_TIDAK_VALID':
      return 'Periode sewa belum dipilih dengan benar. Lengkapi tanggal mulai dan tanggal selesai.';
    case 'TIDAK_DISEWA_KAN':
      return `${equipment.equipment_code} sedang dalam perawatan dan belum dapat disewa.`;
    case 'SEDANG_DISEWA':
      return bentrok
        ? `${equipment.equipment_code} sudah dipesan pada ${formatTanggal(bentrok.startDate)} – ${formatTanggal(bentrok.endDate)}. Silakan pilih periode lain.`
        : `${equipment.equipment_code} sudah dipesan pada periode tersebut.`;
  }
}

// ---------------------------------------------------------------------------
// Validasi Pengajuan Sewa
// ---------------------------------------------------------------------------

/** Hasil pemeriksaan kelayakan pengajuan sewa. */
export type RentalRequestCheck =
  | { ok: true; rentalDays: number; subtotal: number; totalDays: number }
  | { ok: false; code: 'UNIT_TIDAK_TERSEDIA' | 'PERIODE_TIDAK_VALID' | 'DURASI_MELEBIHI_BATAS'; message: string };

/**
 * Memeriksa kelayakan pengajuan sewa sebelum dikirim ke server.
 *
 * Validasi ini dijalankan ganda: di klien untuk umpan balik cepat, dan di
 * server sebagai sumber kebenaran (lihat `POST /api/rentals`). Keduanya
 * memanggil modul `availability` yang sama, sehingga pesannya identik.
 *
 * Biaya sewa dihitung oleh `calculateRentalCost()` — modul yang sama dengan
 * dokumen cetak & laporan, sehingga estimasi di layar tidak bisa berbeda
 * dengan angka pada tagihan.
 */
export function checkRentalRequest(
  equipment: Equipment | null | undefined,
  rentals: readonly Rental[],
  from: string,
  to: string
): RentalRequestCheck {
  if (!equipment) {
    return {
      ok: false,
      code: 'UNIT_TIDAK_TERSEDIA',
      message: 'Unit yang dipilih tidak tersedia. Silakan pilih unit lain pada katalog.',
    };
  }

  // Rentang tanggal terbalik DITOLAK: pada form pengajuan pelanggan,
  // `normalizeBookingRange` menukar tanggal secara diam-diam, sehingga
  // kesalahan ketik (selesai sebelum mulai) justru terkirim sebagai sewa
  // yang sah dan mengunci unit pada periode yang tidak diminta.
  const start = toSafeTime(from);
  const end = toSafeTime(to);
  if (start === null || end === null || start > end) {
    return {
      ok: false,
      code: 'PERIODE_TIDAK_VALID',
      message: 'Periode sewa tidak valid. Pastikan tanggal selesai tidak lebih awal dari tanggal mulai.',
    };
  }

  if (isUnitOutOfService(equipment.status)) {
    return {
      ok: false,
      code: 'UNIT_TIDAK_TERSEDIA',
      message: `${equipment.equipment_code} sedang dalam perawatan dan belum dapat disewa.`,
    };
  }

  const [availability] = buildEquipmentAvailability([equipment], rentals, from, to);
  if (!availability.isBookable) {
    const bentrok = availability.conflicts[0];
    return {
      ok: false,
      code: 'UNIT_TIDAK_TERSEDIA',
      message: bentrok
        ? `${equipment.equipment_code} sudah dipesan pada ${formatTanggal(bentrok.startDate)} – ${formatTanggal(bentrok.endDate)}. Silakan pilih periode lain.`
        : `${equipment.equipment_code} tidak tersedia pada periode tersebut.`,
    };
  }

  const biaya = calculateRentalCost(toSafeNumber(equipment.rental_price_per_day), from, to, null);

  if (biaya.days > BATAS_HARI_SEWA_MAKSIMAL) {
    return {
      ok: false,
      code: 'DURASI_MELEBIHI_BATAS',
      message: `Durasi sewa maksimal ${BATAS_HARI_SEWA_MAKSIMAL} hari. Silakan hubungi Account Manager Anda untuk kontrak jangka panjang.`,
    };
  }

  return {
    ok: true,
    rentalDays: biaya.days,
    subtotal: biaya.subtotal,
    totalDays: biaya.days,
  };
}

// ---------------------------------------------------------------------------
// Perjalanan Sewa (Riwayat + Tahap)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Ringkasan Tagihan
// ---------------------------------------------------------------------------

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
