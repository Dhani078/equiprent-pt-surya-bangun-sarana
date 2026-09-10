/**
 * Mesin Laporan Operasional — EquipRent MS
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Memuat 11 jenis laporan skripsi yang logikanya disesuaikan dari referensi
 * `KODINGAN_UNTUK_LAPORAN/6_*.php`. Semua agregasi dipusatkan di sini agar:
 *   - bisa diuji tanpa merender React,
 *   - konsisten antara tampilan tabel dan berkas ekspor CSV,
 *   - tidak ada lagi perhitungan finansial yang tersebar di komponen UI.
 *
 * CATATAN: modul ini murni (pure). Tidak menyentuh DOM dan tidak memanggil
 * database, sehingga aman dipakai di browser, edge worker, maupun Node.
 */

import type {
  DateRangeFilter,
  Equipment,
  GpsTracking,
  Maintenance,
  Payment,
  ReportCellValue,
  ReportColumn,
  ReportId,
  ReportItem,
  ReportResult,
  ReportSummary,
  Rental,
  User,
} from '../types';
import { formatRupiah, formatTanggal, formatWaktu } from './businessRules';

// ---------------------------------------------------------------------------
// Konstanta Laporan
// ---------------------------------------------------------------------------

/**
 * Tarif pajak & biaya operasional yang dipotong dari pendapatan kotor
 * pada Laporan Pendapatan Bersih. Mengikuti referensi
 * `6_3_report_pendapatan_bersih_slim.php` (10%).
 */
export const OPERATIONAL_TAX_RATE = 0.1;

/**
 * Batas panjang kata kunci pencarian (lihat `normalizeKeyword`).
 * Dipakai untuk mencegah pencarian yang sangat panjang menguras CPU
 * tanpa menghasilkan manfaat bagi pengguna.
 */
export const MAX_KEYWORD_LENGTH = 100;

/**
 * Status rental yang diakui sebagai pendapatan.
 * Referensi PHP hanya memakai `APPROVED`; daftar ini diperluas dengan
 * `ON_GOING` dan `COMPLETED` karena keduanya juga merupakan pesanan yang
 * sudah disetujui dan menghasilkan penerimaan nyata.
 */
const REVENUE_STATUSES: readonly Rental['status'][] = ['APPROVED', 'ON_GOING', 'COMPLETED'];

/** Status pembayaran yang masih menjadi piutang (belum diterima). */
const RECEIVABLE_STATUSES: readonly Payment['status'][] = ['UNPAID', 'PENDING_VERIFICATION'];

// ---------------------------------------------------------------------------
// Katalog Laporan
// ---------------------------------------------------------------------------

export interface ReportDefinition {
  id: ReportId;
  title: string;
  description: string;
  /** False bila laporan bersifat snapshot (tidak bergantung rentang tanggal). */
  supportsDateFilter: boolean;
}

/** 11 laporan operasional sesuai dokumen skripsi. */
export const REPORT_CATALOG: readonly ReportDefinition[] = [
  {
    id: 'RENTAL_BULANAN',
    title: 'Laporan Rental Bulanan',
    description: 'Seluruh transaksi sewa berdasarkan tanggal mulai sewa.',
    supportsDateFilter: true,
  },
  {
    id: 'PEMBAYARAN_PIUTANG',
    title: 'Laporan Pembayaran & Piutang',
    description: 'Rekapitulasi penerimaan dan tagihan yang belum lunas.',
    supportsDateFilter: true,
  },
  {
    id: 'PENDAPATAN_BERSIH',
    title: 'Laporan Pendapatan Bersih',
    description: 'Laba rugi per periode setelah biaya servis dan pajak operasional.',
    supportsDateFilter: true,
  },
  {
    id: 'MAINTENANCE_SERVIS',
    title: 'Laporan Maintenance & Servis',
    description: 'Seluruh jadwal dan riwayat perawatan unit alat berat.',
    supportsDateFilter: true,
  },
  {
    id: 'UTILISASI_HM',
    title: 'Laporan Utilisasi & Hour Meter',
    description: 'Akumulasi jam operasi (HM) dan servis terakhir tiap unit.',
    supportsDateFilter: false,
  },
  {
    id: 'KERUSAKAN_UNIT',
    title: 'Laporan Kerusakan Unit',
    description: 'Perbaikan korektif beserta biaya penanganannya.',
    supportsDateFilter: true,
  },
  {
    id: 'TELEMETRI_GPS',
    title: 'Laporan Histori Telemetri GPS',
    description: 'Rekaman posisi, kecepatan, dan status mesin armada.',
    supportsDateFilter: true,
  },
  {
    id: 'KINERJA_STAF',
    title: 'Laporan Kinerja Staf & Operator',
    description: 'Beban kerja staf: verifikasi pembayaran dan penanganan servis.',
    supportsDateFilter: true,
  },
  {
    id: 'SUKU_CADANG',
    title: 'Laporan Pemakaian Suku Cadang',
    description: 'Komponen yang diganti beserta biaya penggantiannya.',
    supportsDateFilter: true,
  },
  {
    id: 'KEPUASAN_PELANGGAN',
    title: 'Laporan Kepuasan & Umpan Balik Pelanggan',
    description: 'Catatan evaluasi yang ditinggalkan pelanggan pada transaksi sewa.',
    supportsDateFilter: true,
  },
  {
    id: 'AUDIT_TRAIL',
    title: 'Laporan Audit Trail & Log Sistem',
    description: 'Jejak dokumen resmi yang diterbitkan beserta penerbitnya.',
    supportsDateFilter: true,
  },
];

/** Definisi laporan berdasarkan id. `undefined` bila id tidak dikenal. */
export function getReportDefinition(id: ReportId): ReportDefinition | undefined {
  return REPORT_CATALOG.find((r) => r.id === id);
}

// ---------------------------------------------------------------------------
// Helper Tanggal & Rentang
// ---------------------------------------------------------------------------

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Mengambil bagian tanggal (YYYY-MM-DD) dari nilai yang bisa berupa
 * tanggal saja (`2026-09-04`) maupun tanggal+waktu (`2026-09-04 14:30:00`).
 */
function toDay(value: string | null | undefined): string {
  if (typeof value !== 'string' || value.length < 10) return '';
  const day = value.slice(0, 10);
  return ISO_DAY.test(day) ? day : '';
}

/** Rentang kosong — berarti tanpa batas tanggal. */
export const EMPTY_RANGE: DateRangeFilter = { from: '', to: '' };

/**
 * Menormalisasi rentang tanggal:
 * - nilai bukan format `YYYY-MM-DD` dibuang (dianggap tidak difilter),
 * - bila `from` lebih besar dari `to`, keduanya ditukar agar filter tetap masuk akal.
 */
export function normalizeRange(from: string, to: string): DateRangeFilter {
  const a = ISO_DAY.test(from) ? from : '';
  const b = ISO_DAY.test(to) ? to : '';
  return a && b && a > b ? { from: b, to: a } : { from: a, to: b };
}

/** Apakah rentang ini membatasi data? */
function hasRange(range: DateRangeFilter): boolean {
  return range.from !== '' || range.to !== '';
}

/** Uji keanggotaan sebuah hari dalam rentang. Hari kosong selalu gagal bila ada filter. */
function inRange(day: string, range: DateRangeFilter): boolean {
  if (!hasRange(range)) return day !== '';
  if (day === '') return false;
  if (range.from !== '' && day < range.from) return false;
  if (range.to !== '' && day > range.to) return false;
  return true;
}

/** Label periode untuk kepala tabel, misal `01 Jan 2026 – 31 Des 2026`. */
function buildPeriodLabel(range: DateRangeFilter): string {
  if (!hasRange(range)) return 'Semua periode';
  if (range.from !== '' && range.to !== '') {
    return `${formatTanggalSingkat(range.from)} – ${formatTanggalSingkat(range.to)}`;
  }
  return range.from !== ''
    ? `Mulai ${formatTanggalSingkat(range.from)}`
    : `Sampai ${formatTanggalSingkat(range.to)}`;
}

/** Format tanggal ringkas `04 Sep 2026` untuk label periode. */
function formatTanggalSingkat(value: string): string {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/** Kunci periode bulanan `YYYY-MM` dari sebuah tanggal. */
function monthKey(day: string): string {
  return day.slice(0, 7);
}

/** Label periode `2026-09` menjadi `September 2026`. */
function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(d.getTime())) return key;
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);
}

/** Pembulatan ke 2 desimal untuk menghindari artefak floating point. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// Helper Agregasi Baris
// ---------------------------------------------------------------------------

/**
 * Ringkasan laporan DIHITUNG DARI BARIS, bukan dari sumber mentah.
 *
 * Alasannya: setelah baris disaring kata kunci (lihat `filterReportRows`),
 * ringkasan harus menggambarkan baris yang masih terlihat. Bila ringkasan
 * dihitung dari sumber aslinya, pengguna yang mencari satu pelanggan akan
 * melihat nilai total seluruh transaksi — kesalahan fatal pada laporan
 * keuangan yang akan langsung dipertanyakan penguji.
 */

/** Menjumlahkan nilai numerik pada satu indeks kolom. Sel bermasalah diabaikan. */
function sumColumn(rows: readonly ReportCellValue[][], index: number): number {
  let total = 0;
  for (const row of rows) {
    const value = Number(row[index]);
    if (Number.isFinite(value)) total += value;
  }
  return total;
}

/** Menghitung baris yang nilainya pada kolom `index` persis sama dengan `needle`. */
function countWhere(
  rows: readonly ReportCellValue[][],
  index: number,
  needle: string
): number {
  let n = 0;
  for (const row of rows) {
    if (String(row[index] ?? '') === needle) n += 1;
  }
  return n;
}

// ---------------------------------------------------------------------------
// Sumber Data Laporan
// ---------------------------------------------------------------------------

export interface ReportDataSource {
  rentals: readonly Rental[];
  equipments: readonly Equipment[];
  users: readonly User[];
  payments: readonly Payment[];
  maintenance: readonly Maintenance[];
  gps: readonly GpsTracking[];
  reports: readonly ReportItem[];
}

/** Peta id pengguna → nama lengkap, dipakai untuk mengganti id dengan nama. */
function buildUserMap(users: readonly User[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const u of users) map.set(u.id, u.full_name);
  return map;
}

/** Peta id unit → nama unit. */
function buildEquipmentMap(equipments: readonly Equipment[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const e of equipments) map.set(e.id, e.name);
  return map;
}

/** Nama pelanggan dari rental, dengan fallback aman bila data tidak lengkap. */
function customerName(rental: Rental, users: Map<number, string>): string {
  return rental.customer_name ?? users.get(rental.customer_id) ?? `Pelanggan #${rental.customer_id}`;
}

/** Nama unit dari rental, dengan fallback kode unit bila nama tidak tersedia. */
function equipmentName(
  equipmentId: number,
  rental: Pick<Rental, 'equipment_name' | 'equipment_code'>,
  equipments: Map<number, string>
): string {
  return rental.equipment_name ?? equipments.get(equipmentId) ?? `Unit #${equipmentId}`;
}

/** Terjemahan status ke label bahasa Indonesia. */
const RENTAL_STATUS_LABEL: Readonly<Record<Rental['status'], string>> = {
  PENDING: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  ON_GOING: 'Berjalan',
  COMPLETED: 'Selesai',
  REJECTED: 'Ditolak',
};

const PAYMENT_STATUS_LABEL: Readonly<Record<Payment['status'], string>> = {
  UNPAID: 'Belum Dibayar',
  PENDING_VERIFICATION: 'Menunggu Verifikasi',
  PAID: 'Lunas',
  FAILED: 'Gagal',
};

const MAINTENANCE_TYPE_LABEL: Readonly<Record<Maintenance['maintenance_type'], string>> = {
  PREVENTIVE: 'Preventif',
  CORRECTIVE: 'Korektif',
  OVERHAUL: 'Overhaul',
};

const MAINTENANCE_STATUS_LABEL: Readonly<Record<Maintenance['status'], string>> = {
  SCHEDULED: 'Terjadwal',
  IN_PROGRESS: 'Dikerjakan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const EQUIPMENT_STATUS_LABEL: Readonly<Record<Equipment['status'], string>> = {
  AVAILABLE: 'Tersedia',
  RENTED: 'Disewa',
  MAINTENANCE: 'Perawatan',
  UNAVAILABLE: 'Tidak Tersedia',
};

const PAYMENT_METHOD_LABEL: Readonly<Record<string, string>> = {
  BANK_TRANSFER: 'Transfer Bank',
  QRIS: 'QRIS',
  CASH: 'Tunai',
};

/** Terjemahan metode pembayaran; nilai tak dikenal dikembalikan apa adanya. */
function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABEL[method] ?? method;
}

// ---------------------------------------------------------------------------
// Perangkum Ringkasan (satu definisi per laporan)
// ---------------------------------------------------------------------------

/**
 * Ringkasan dihitung HANYA dari baris yang tersedia.
 *
 * Konsekuensi penting: bila baris disaring kata kunci, `applyKeywordFilter`
 * memanggil perangkum yang sama dengan baris hasil penyaringan, sehingga
 * angka pada kartu ringkasan mengikuti apa yang terlihat di tabel.
 *
 * `baseline` adalah jumlah baris SEBELUM penyaringan. Ia dipakai hanya oleh
 * metrik rasio (misal "Cakupan Umpan Balik") yang membandingkan sebagian
 * terhadap keseluruhan periode, bukan terhadap dirinya sendiri.
 */
type Summarizer = (rows: readonly ReportCellValue[][], baseline: number) => ReportSummary[];

function summarizeRentalBulanan(rows: readonly ReportCellValue[][], _baseline: number): ReportSummary[] {
  const totalNilai = sumColumn(rows, 6);
  const totalHari = sumColumn(rows, 5);
  return [
    { label: 'Total Transaksi', value: `${rows.length} sewa` },
    { label: 'Total Nilai Sewa', value: formatRupiah(totalNilai), tone: 'positive' },
    {
      label: 'Rata-rata Nilai Sewa',
      value: formatRupiah(rows.length === 0 ? 0 : totalNilai / rows.length),
    },
    { label: 'Akumulasi Hari Sewa', value: `${totalHari} hari` },
  ];
}

function summarizePembayaranPiutang(rows: readonly ReportCellValue[][], _baseline: number): ReportSummary[] {
  const totalTagihan = sumColumn(rows, 3);
  const totalLunas = sumColumn(
    rows.filter((row) => row[4] === PAYMENT_STATUS_LABEL.PAID),
    3
  );
  const totalPiutang = sumColumn(
    rows.filter((row) => RECEIVABLE_STATUSES.some((s) => PAYMENT_STATUS_LABEL[s] === row[4])),
    3
  );
  return [
    { label: 'Total Tagihan', value: formatRupiah(totalTagihan) },
    { label: 'Sudah Diterima', value: formatRupiah(totalLunas), tone: 'positive' },
    { label: 'Piutang Berjalan', value: formatRupiah(totalPiutang), tone: 'negative' },
    {
      label: 'Rasio Penerimaan',
      value: totalTagihan === 0 ? '0%' : `${Math.round((totalLunas / totalTagihan) * 100)}%`,
    },
  ];
}

function summarizePendapatanBersih(rows: readonly ReportCellValue[][], _baseline: number): ReportSummary[] {
  const totalGross = sumColumn(rows, 1);
  const totalMaint = sumColumn(rows, 2);
  const totalTax = sumColumn(rows, 3);
  const totalNet = sumColumn(rows, 4);
  return [
    { label: 'Pendapatan Kotor', value: formatRupiah(totalGross), tone: 'positive' },
    { label: 'Biaya Servis', value: formatRupiah(totalMaint), tone: 'negative' },
    { label: 'Pajak & Operasional', value: formatRupiah(totalTax), tone: 'negative' },
    {
      label: 'Laba Bersih',
      value: formatRupiah(totalNet),
      tone: totalNet >= 0 ? 'positive' : 'negative',
    },
  ];
}

function summarizeMaintenanceServis(rows: readonly ReportCellValue[][], _baseline: number): ReportSummary[] {
  const totalBiaya = sumColumn(rows, 5);
  const preventif = countWhere(rows, 2, MAINTENANCE_TYPE_LABEL.PREVENTIVE);
  const korektif =
    countWhere(rows, 2, MAINTENANCE_TYPE_LABEL.CORRECTIVE) +
    countWhere(rows, 2, MAINTENANCE_TYPE_LABEL.OVERHAUL);
  return [
    { label: 'Total Pekerjaan', value: `${rows.length} servis` },
    { label: 'Total Biaya', value: formatRupiah(totalBiaya), tone: 'negative' },
    { label: 'Servis Preventif', value: `${preventif} pekerjaan` },
    { label: 'Servis Korektif/Overhaul', value: `${korektif} pekerjaan` },
  ];
}

function summarizeUtilisasiHm(rows: readonly ReportCellValue[][], _baseline: number): ReportSummary[] {
  const totalHm = sumColumn(rows, 3);
  const rataHm = rows.length === 0 ? 0 : totalHm / rows.length;
  return [
    { label: 'Total Unit', value: `${rows.length} unit` },
    { label: 'Akumulasi HM', value: `${round2(totalHm)} jam` },
    { label: 'Rata-rata HM per Unit', value: `${round2(rataHm)} jam` },
    {
      // Baris sudah terurut menurun berdasarkan HM, jadi baris pertama
      // adalah unit dengan jam operasi tertinggi di antara yang tampil.
      label: 'HM Tertinggi',
      value:
        rows.length === 0 ? '-' : `${String(rows[0][0])} · ${round2(Number(rows[0][3]))} jam`,
    },
  ];
}

function summarizeKerusakanUnit(rows: readonly ReportCellValue[][], _baseline: number): ReportSummary[] {
  const totalBiaya = sumColumn(rows, 4);
  return [
    { label: 'Total Kejadian', value: `${rows.length} kasus`, tone: 'negative' },
    { label: 'Total Biaya Perbaikan', value: formatRupiah(totalBiaya), tone: 'negative' },
    {
      label: 'Rata-rata Biaya',
      value: formatRupiah(rows.length === 0 ? 0 : totalBiaya / rows.length),
    },
  ];
}

function summarizeTelemetriGps(rows: readonly ReportCellValue[][], _baseline: number): ReportSummary[] {
  const mesinMenyala = countWhere(rows, 4, 'Menyala');
  const totalBbm = sumColumn(rows, 5);
  const rataBbm = rows.length === 0 ? 0 : totalBbm / rows.length;
  return [
    { label: 'Total Titik Rekam', value: `${rows.length} titik` },
    { label: 'Mesin Menyala', value: `${mesinMenyala} titik`, tone: 'positive' },
    { label: 'Rata-rata BBM', value: `${round2(rataBbm)}%` },
    {
      label: 'Utilisasi Mesin',
      value: rows.length === 0 ? '0%' : `${Math.round((mesinMenyala / rows.length) * 100)}%`,
    },
  ];
}

function summarizeKinerjaStaf(rows: readonly ReportCellValue[][], _baseline: number): ReportSummary[] {
  const totalVerifikasi = sumColumn(rows, 5);
  const totalServis = sumColumn(rows, 6);
  return [
    { label: 'Total Akun Staf', value: `${rows.length} akun` },
    { label: 'Total Verifikasi', value: `${totalVerifikasi} pembayaran`, tone: 'positive' },
    { label: 'Total Servis', value: `${totalServis} pekerjaan`, tone: 'positive' },
    {
      label: 'Rata-rata Beban Kerja',
      value:
        rows.length === 0
          ? '0'
          : `${round2((totalVerifikasi + totalServis) / rows.length)} tugas`,
    },
  ];
}

function summarizeSukuCadang(rows: readonly ReportCellValue[][], _baseline: number): ReportSummary[] {
  const totalBiaya = sumColumn(rows, 3);
  return [
    { label: 'Total Penggantian', value: `${rows.length} item` },
    { label: 'Total Biaya', value: formatRupiah(totalBiaya), tone: 'negative' },
    {
      label: 'Rata-rata Biaya',
      value: formatRupiah(rows.length === 0 ? 0 : totalBiaya / rows.length),
    },
  ];
}

function summarizeKepuasanPelanggan(
  rows: readonly ReportCellValue[][],
  baseline: number
): ReportSummary[] {
  return [
    { label: 'Total Umpan Balik', value: `${rows.length} catatan`, tone: 'positive' },
    {
      label: 'Pelanggan Memberi Catatan',
      value: `${new Set(rows.map((row) => String(row[1]))).size} pelanggan`,
    },
    {
      // Cakupan dibandingkan terhadap SELURUH transaksi pada periode
      // (baseline), bukan terhadap baris yang lolos penyaringan — kalau
      // tidak, angkanya akan selalu 100% dan tidak bermakna.
      label: 'Cakupan Umpan Balik',
      value: baseline === 0 ? '0%' : `${Math.round((rows.length / baseline) * 100)}%`,
    },
  ];
}

function summarizeAuditTrail(rows: readonly ReportCellValue[][], _baseline: number): ReportSummary[] {
  const perJenis = new Map<string, number>();
  for (const row of rows) {
    const key = String(row[2] ?? '');
    perJenis.set(key, (perJenis.get(key) ?? 0) + 1);
  }
  const jenisTerbanyak = [...perJenis.entries()].sort((a, b) => b[1] - a[1])[0];
  return [
    { label: 'Total Dokumen', value: `${rows.length} dokumen` },
    { label: 'Jenis Dokumen', value: `${perJenis.size} jenis` },
    {
      label: 'Terbanyak',
      value: jenisTerbanyak ? `${jenisTerbanyak[0]} (${jenisTerbanyak[1]})` : '-',
    },
    {
      label: 'Penerbit Aktif',
      value: `${new Set(rows.map((row) => String(row[1]))).size} pengguna`,
    },
  ];
}

/** Perangkum ringkasan per jenis laporan. Kunci harus lengkap & unik. */
const SUMMARIZERS: Readonly<Record<ReportId, Summarizer>> = {
  RENTAL_BULANAN: summarizeRentalBulanan,
  PEMBAYARAN_PIUTANG: summarizePembayaranPiutang,
  PENDAPATAN_BERSIH: summarizePendapatanBersih,
  MAINTENANCE_SERVIS: summarizeMaintenanceServis,
  UTILISASI_HM: summarizeUtilisasiHm,
  KERUSAKAN_UNIT: summarizeKerusakanUnit,
  TELEMETRI_GPS: summarizeTelemetriGps,
  KINERJA_STAF: summarizeKinerjaStaf,
  SUKU_CADANG: summarizeSukuCadang,
  KEPUASAN_PELANGGAN: summarizeKepuasanPelanggan,
  AUDIT_TRAIL: summarizeAuditTrail,
};

// ---------------------------------------------------------------------------
// Pembangun 11 Laporan
// ---------------------------------------------------------------------------

function buildRentalBulanan(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const users = buildUserMap(source.users);
  const units = buildEquipmentMap(source.equipments);

  const filtered = source.rentals.filter((r) => inRange(toDay(r.start_date), range));
  const ordered = [...filtered].sort((a, b) => (a.start_date < b.start_date ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((r) => [
    r.rental_code,
    customerName(r, users),
    equipmentName(r.equipment_id, r, units),
    toDay(r.start_date),
    toDay(r.end_date),
    r.total_days,
    Number(r.subtotal),
    RENTAL_STATUS_LABEL[r.status],
  ]);

  return {
    id: 'RENTAL_BULANAN',
    title: 'Laporan Rental Bulanan',
    description: 'Seluruh transaksi sewa berdasarkan tanggal mulai sewa.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'rental_code', label: 'Kode Sewa' },
      { key: 'customer', label: 'Pelanggan' },
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'start_date', label: 'Mulai', format: 'date' },
      { key: 'end_date', label: 'Selesai', format: 'date' },
      { key: 'total_days', label: 'Hari', align: 'right', format: 'integer' },
      { key: 'subtotal', label: 'Nilai Sewa', align: 'right', format: 'currency' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    summaries: summarizeRentalBulanan(rows, rows.length),
    totalRows: rows.length,
  };
}

function buildPembayaranPiutang(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const users = buildUserMap(source.users);

  const filtered = source.payments.filter((p) => inRange(toDay(p.payment_date), range));
  const ordered = [...filtered].sort((a, b) => (a.payment_date < b.payment_date ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((p) => [
    p.payment_code,
    p.customer_name ?? users.get(p.customer_id) ?? `Pelanggan #${p.customer_id}`,
    paymentMethodLabel(p.payment_method),
    Number(p.amount),
    PAYMENT_STATUS_LABEL[p.status],
    toDay(p.payment_date),
  ]);

  return {
    id: 'PEMBAYARAN_PIUTANG',
    title: 'Laporan Pembayaran & Piutang',
    description: 'Rekapitulasi penerimaan dan tagihan yang belum lunas.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'payment_code', label: 'Kode Invoice' },
      { key: 'customer', label: 'Pelanggan' },
      { key: 'method', label: 'Metode' },
      { key: 'amount', label: 'Jumlah', align: 'right', format: 'currency' },
      { key: 'status', label: 'Status' },
      { key: 'payment_date', label: 'Tanggal', format: 'date' },
    ],
    rows,
    summaries: summarizePembayaranPiutang(rows, rows.length),
    totalRows: rows.length,
  };
}

function buildPendapatanBersih(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  /**
   * Pendapatan digabung per bulan berdasarkan tanggal mulai sewa.
   * Biaya servis dialokasikan ke periode penyelesaian servis
   * (`completion_date`, fallback `scheduled_date`) — lebih akurat daripada
   * referensi PHP yang menjumlahkan seluruh biaya servis ke setiap periode.
   */
  const pendapatan = new Map<string, number>();
  for (const r of source.rentals) {
    if (!REVENUE_STATUSES.includes(r.status)) continue;
    const day = toDay(r.start_date);
    if (!inRange(day, range)) continue;
    const key = monthKey(day);
    pendapatan.set(key, (pendapatan.get(key) ?? 0) + Number(r.subtotal));
  }

  const biayaServis = new Map<string, number>();
  for (const m of source.maintenance) {
    if (m.status !== 'COMPLETED') continue;
    const day = toDay(m.completion_date) || toDay(m.scheduled_date);
    if (!inRange(day, range)) continue;
    const key = monthKey(day);
    biayaServis.set(key, (biayaServis.get(key) ?? 0) + Number(m.cost));
  }

  const periods = [...new Set([...pendapatan.keys(), ...biayaServis.keys()])].sort((a, b) =>
    a < b ? -1 : 1
  );

  const rows: ReportCellValue[][] = periods.map((key) => {
    const gross = pendapatan.get(key) ?? 0;
    const maint = biayaServis.get(key) ?? 0;
    const tax = gross * OPERATIONAL_TAX_RATE;
    return [monthLabel(key), gross, maint, Math.round(tax), Math.round(gross - maint - tax)];
  });

  return {
    id: 'PENDAPATAN_BERSIH',
    title: 'Laporan Pendapatan Bersih',
    description: 'Laba rugi per periode setelah biaya servis dan pajak operasional.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'period', label: 'Periode' },
      { key: 'gross', label: 'Pendapatan Kotor', align: 'right', format: 'currency' },
      { key: 'maintenance', label: 'Biaya Servis', align: 'right', format: 'currency' },
      {
        key: 'tax',
        label: `Pajak & Ops (${Math.round(OPERATIONAL_TAX_RATE * 100)}%)`,
        align: 'right',
        format: 'currency',
      },
      { key: 'net', label: 'Laba Bersih', align: 'right', format: 'currency' },
    ],
    rows,
    summaries: summarizePendapatanBersih(rows, rows.length),
    totalRows: rows.length,
  };
}

function buildMaintenanceServis(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const units = buildEquipmentMap(source.equipments);

  const filtered = source.maintenance.filter((m) => inRange(toDay(m.scheduled_date), range));
  const ordered = [...filtered].sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((m) => [
    m.maintenance_code,
    m.equipment_name ?? units.get(m.equipment_id) ?? `Unit #${m.equipment_id}`,
    MAINTENANCE_TYPE_LABEL[m.maintenance_type],
    Number(m.hour_meter_at_maintenance),
    m.description,
    Number(m.cost),
    MAINTENANCE_STATUS_LABEL[m.status],
  ]);

  return {
    id: 'MAINTENANCE_SERVIS',
    title: 'Laporan Maintenance & Servis',
    description: 'Seluruh jadwal dan riwayat perawatan unit alat berat.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'maintenance_code', label: 'Kode Servis' },
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'type', label: 'Jenis' },
      { key: 'hour_meter', label: 'HM Saat Servis', align: 'right', format: 'decimal' },
      { key: 'description', label: 'Uraian Pekerjaan' },
      { key: 'cost', label: 'Biaya', align: 'right', format: 'currency' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    summaries: summarizeMaintenanceServis(rows, rows.length),
    totalRows: rows.length,
  };
}

// Laporan Utilisasi HM adalah snapshot kondisi armada, sehingga rentang
// tanggal tidak berlaku. Parameter ditulis `_range` agar maksudnya eksplisit.
function buildUtilisasiHm(source: ReportDataSource, _range: DateRangeFilter): ReportResult {
  /** Tanggal servis terakhir tiap unit (completion_date lebih diutamakan). */
  const lastService = new Map<number, string>();
  for (const m of source.maintenance) {
    if (m.status !== 'COMPLETED') continue;
    const day = toDay(m.completion_date) || toDay(m.scheduled_date);
    if (day === '') continue;
    const current = lastService.get(m.equipment_id);
    if (!current || day > current) lastService.set(m.equipment_id, day);
  }

  const ordered = [...source.equipments].sort((a, b) => b.hour_meter - a.hour_meter);

  const rows: ReportCellValue[][] = ordered.map((e) => [
    e.equipment_code,
    e.name,
    e.type,
    round2(e.hour_meter),
    lastService.get(e.id) ?? 'Belum Pernah',
    EQUIPMENT_STATUS_LABEL[e.status],
  ]);

  return {
    id: 'UTILISASI_HM',
    title: 'Laporan Utilisasi & Hour Meter',
    description: 'Akumulasi jam operasi (HM) dan servis terakhir tiap unit.',
    periodLabel: 'Kondisi armada saat ini',
    columns: [
      { key: 'equipment_code', label: 'Kode Unit' },
      { key: 'name', label: 'Nama Unit' },
      { key: 'type', label: 'Tipe' },
      { key: 'hour_meter', label: 'Hour Meter (jam)', align: 'right', format: 'decimal' },
      { key: 'last_service', label: 'Servis Terakhir' },
      { key: 'status', label: 'Status Unit' },
    ],
    rows,
    summaries: summarizeUtilisasiHm(rows, rows.length),
    totalRows: rows.length,
  };
}

function buildKerusakanUnit(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const units = buildEquipmentMap(source.equipments);

  const filtered = source.maintenance.filter(
    (m) => m.maintenance_type === 'CORRECTIVE' && inRange(toDay(m.scheduled_date), range)
  );
  const ordered = [...filtered].sort((a, b) => Number(b.cost) - Number(a.cost));

  const rows: ReportCellValue[][] = ordered.map((m) => [
    m.equipment_name ?? units.get(m.equipment_id) ?? `Unit #${m.equipment_id}`,
    m.maintenance_code,
    m.spareparts_replaced ?? '-',
    m.description,
    Number(m.cost),
  ]);

  return {
    id: 'KERUSAKAN_UNIT',
    title: 'Laporan Kerusakan Unit',
    description: 'Perbaikan korektif beserta biaya penanganannya.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'maintenance_code', label: 'Kode Servis' },
      { key: 'spareparts', label: 'Sparepart Diganti' },
      { key: 'description', label: 'Uraian Kerusakan' },
      { key: 'cost', label: 'Biaya Perbaikan', align: 'right', format: 'currency' },
    ],
    rows,
    summaries: summarizeKerusakanUnit(rows, rows.length),
    totalRows: rows.length,
  };
}

function buildTelemetriGps(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const units = buildEquipmentMap(source.equipments);

  const filtered = source.gps.filter((g) => inRange(toDay(g.recorded_at), range));
  const ordered = [...filtered].sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((g) => [
    g.equipment_name ?? units.get(g.equipment_id) ?? `Unit #${g.equipment_id}`,
    round2(g.latitude),
    round2(g.longitude),
    round2(g.speed),
    g.engine_status === 'ON' ? 'Menyala' : 'Mati',
    g.fuel_level_percent,
    g.recorded_at,
  ]);

  return {
    id: 'TELEMETRI_GPS',
    title: 'Laporan Histori Telemetri GPS',
    description: 'Rekaman posisi, kecepatan, dan status mesin armada.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'latitude', label: 'Latitude', align: 'right', format: 'decimal' },
      { key: 'longitude', label: 'Longitude', align: 'right', format: 'decimal' },
      { key: 'speed', label: 'Kecepatan (km/jam)', align: 'right', format: 'decimal' },
      { key: 'engine', label: 'Status Mesin' },
      { key: 'fuel', label: 'BBM (%)', align: 'right', format: 'integer' },
      { key: 'recorded_at', label: 'Waktu Rekam', format: 'datetime' },
    ],
    rows,
    summaries: summarizeTelemetriGps(rows, rows.length),
    totalRows: rows.length,
  };
}

function buildKinerjaStaf(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  /**
   * Beban kerja staf dihitung dari dua jejak nyata di data:
   *   - verifikasi pembayaran (`payments.verified_by`)
   *   - penanganan servis (`maintenance.technician_id`)
   * Bila rentang tanggal aktif, hanya jejak di dalam rentang yang dihitung.
   */
  const verificationCount = new Map<number, number>();
  for (const p of source.payments) {
    if (p.verified_by == null) continue;
    const day = toDay(p.verified_at);
    if (!inRange(day, range)) continue;
    verificationCount.set(p.verified_by, (verificationCount.get(p.verified_by) ?? 0) + 1);
  }

  const serviceCount = new Map<number, number>();
  for (const m of source.maintenance) {
    if (m.technician_id == null) continue;
    const day = toDay(m.completion_date) || toDay(m.scheduled_date);
    if (!inRange(day, range)) continue;
    serviceCount.set(m.technician_id, (serviceCount.get(m.technician_id) ?? 0) + 1);
  }

  const staf = source.users
    .filter((u) => u.role_name === 'ADMIN' || u.role_name === 'STAFF')
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'id-ID'));

  const rows: ReportCellValue[][] = staf.map((u) => [
    u.full_name,
    u.username,
    u.email,
    u.phone,
    u.role_name === 'ADMIN' ? 'Administrator' : 'Staf Operasional',
    verificationCount.get(u.id) ?? 0,
    serviceCount.get(u.id) ?? 0,
    u.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif',
  ]);

  return {
    id: 'KINERJA_STAF',
    title: 'Laporan Kinerja Staf & Operator',
    description: 'Beban kerja staf: verifikasi pembayaran dan penanganan servis.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'name', label: 'Nama Staf' },
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'No. Telepon' },
      { key: 'role', label: 'Peran' },
      { key: 'verifications', label: 'Verifikasi Pembayaran', align: 'right', format: 'integer' },
      { key: 'services', label: 'Servis Ditangani', align: 'right', format: 'integer' },
      { key: 'status', label: 'Status Akun' },
    ],
    rows,
    summaries: summarizeKinerjaStaf(rows, rows.length),
    totalRows: rows.length,
  };
}

function buildSukuCadang(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const units = buildEquipmentMap(source.equipments);

  const filtered = source.maintenance.filter((m) => {
    const parts = m.spareparts_replaced?.trim() ?? '';
    return parts !== '' && inRange(toDay(m.scheduled_date), range);
  });
  const ordered = [...filtered].sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((m) => [
    m.maintenance_code,
    m.equipment_name ?? units.get(m.equipment_id) ?? `Unit #${m.equipment_id}`,
    m.spareparts_replaced ?? '-',
    Number(m.cost),
    toDay(m.scheduled_date),
  ]);

  return {
    id: 'SUKU_CADANG',
    title: 'Laporan Pemakaian Suku Cadang',
    description: 'Komponen yang diganti beserta biaya penggantiannya.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'maintenance_code', label: 'Kode Servis' },
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'spareparts', label: 'Suku Cadang' },
      { key: 'cost', label: 'Biaya Penggantian', align: 'right', format: 'currency' },
      { key: 'date', label: 'Tanggal Ganti', format: 'date' },
    ],
    rows,
    summaries: summarizeSukuCadang(rows, rows.length),
    totalRows: rows.length,
  };
}

function buildKepuasanPelanggan(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const users = buildUserMap(source.users);
  const units = buildEquipmentMap(source.equipments);
  const company = new Map<number, string>();
  for (const u of source.users) company.set(u.id, u.company_name ?? '-');

  const filtered = source.rentals.filter((r) => {
    const notes = r.notes?.trim() ?? '';
    return notes !== '' && inRange(toDay(r.start_date), range);
  });
  const ordered = [...filtered].sort((a, b) => (a.start_date < b.start_date ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((r) => [
    r.rental_code,
    customerName(r, users),
    company.get(r.customer_id) ?? '-',
    equipmentName(r.equipment_id, r, units),
    r.notes ?? '-',
    toDay(r.start_date),
  ]);

  return {
    id: 'KEPUASAN_PELANGGAN',
    title: 'Laporan Kepuasan & Umpan Balik Pelanggan',
    description: 'Catatan evaluasi yang ditinggalkan pelanggan pada transaksi sewa.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'rental_code', label: 'Kode Sewa' },
      { key: 'customer', label: 'Pelanggan' },
      { key: 'company', label: 'Perusahaan' },
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'notes', label: 'Catatan Evaluasi' },
      { key: 'date', label: 'Tanggal', format: 'date' },
    ],
    // `source.rentals.length` disimpan sebagai baseline agar persentase
    // cakupan tetap bermakna setelah baris disaring kata kunci.
    rows,
    summaries: summarizeKepuasanPelanggan(rows, source.rentals.length),
    totalRows: rows.length,
    baselineRows: source.rentals.length,
  };
}

function buildAuditTrail(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const filtered = source.reports.filter((r) => inRange(toDay(r.generated_at), range));
  const ordered = [...filtered].sort((a, b) => (a.generated_at < b.generated_at ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((r) => [
    r.report_code,
    r.generated_by_name ?? `Pengguna #${r.generated_by}`,
    r.report_type.replace(/_/g, ' '),
    r.file_path,
    r.generated_at,
  ]);

  return {
    id: 'AUDIT_TRAIL',
    title: 'Laporan Audit Trail & Log Sistem',
    description: 'Jejak dokumen resmi yang diterbitkan beserta penerbitnya.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'report_code', label: 'Kode Dokumen' },
      { key: 'actor', label: 'Diterbitkan Oleh' },
      { key: 'type', label: 'Jenis Ekspor' },
      { key: 'file_path', label: 'Berkas' },
      { key: 'generated_at', label: 'Waktu Terbit', format: 'datetime' },
    ],
    rows,
    summaries: summarizeAuditTrail(rows, rows.length),
    totalRows: rows.length,
  };
}

const BUILDERS: Readonly<Record<ReportId, (s: ReportDataSource, r: DateRangeFilter) => ReportResult>> = {
  RENTAL_BULANAN: buildRentalBulanan,
  PEMBAYARAN_PIUTANG: buildPembayaranPiutang,
  PENDAPATAN_BERSIH: buildPendapatanBersih,
  MAINTENANCE_SERVIS: buildMaintenanceServis,
  UTILISASI_HM: buildUtilisasiHm,
  KERUSAKAN_UNIT: buildKerusakanUnit,
  TELEMETRI_GPS: buildTelemetriGps,
  KINERJA_STAF: buildKinerjaStaf,
  SUKU_CADANG: buildSukuCadang,
  KEPUASAN_PELANGGAN: buildKepuasanPelanggan,
  AUDIT_TRAIL: buildAuditTrail,
};

/**
 * Menyusun satu laporan dari sumber data.
 *
 * @throws Tidak pernah melempar; id yang tidak dikenal jatuh ke laporan pertama.
 *        Pemanggil sebaiknya memvalidasi id lewat `isReportId` terlebih dulu.
 */
export function buildReport(
  id: ReportId,
  source: ReportDataSource,
  range: DateRangeFilter = EMPTY_RANGE
): ReportResult {
  const builder = BUILDERS[id] ?? buildRentalBulanan;
  return builder(source, hasRange(range) ? range : EMPTY_RANGE);
}

/** Apakah string ini merupakan id laporan yang dikenal? */
export function isReportId(value: unknown): value is ReportId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(BUILDERS, value);
}

// ---------------------------------------------------------------------------
// Pencarian & Penyaringan Baris
// ---------------------------------------------------------------------------

/**
 * Menormalkan kata kunci pencarian:
 *   - nilai bukan string (null/undefined/angka) menjadi '',
 *   - spasi di awal/akhir dibuang, spasi ganda dirapatkan,
 *   - huruf dikecilkan dengan locale Indonesia sehingga "EXCAVATOR" sama
 *     dengan "excavator",
 *   - kata kunci yang lebih panjang dari `MAX_KEYWORD_LENGTH` dipotong agar
 *     input ekstrem tidak menguras CPU (sama seperti perlakuan filter GPS).
 */
export function normalizeKeyword(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed === '') return '';
  return trimmed.slice(0, MAX_KEYWORD_LENGTH).toLocaleLowerCase('id-ID');
}

/** Bentuk nilai sel yang dicari: angka apa adanya, teks ternormalisasi. */
function toSearchable(value: ReportCellValue): string {
  if (typeof value === 'number') return String(value);
  return String(value ?? '').toLocaleLowerCase('id-ID');
}

/**
 * Menyaring baris laporan berdasarkan kata kunci.
 *
 * Pencarian bersifat GLOBAL: sebuah baris lolos bila salah satu selnya
 * memuat kata kunci. Kata kunci kosong mengembalikan seluruh baris
 * (tidak ada baris yang dibuang), sehingga pemanggil tidak perlu
 * bercabang antara "sedang mencari" dan "tidak mencari".
 *
 * Baris tidak pernah diubah — hanya dipilih — sehingga data asli tetap utuh.
 */
export function filterReportRows(
  rows: readonly ReportCellValue[][],
  keyword: string
): ReportCellValue[][] {
  const needle = normalizeKeyword(keyword);
  if (needle === '') return rows.map((row) => [...row]);

  const matched: ReportCellValue[][] = [];
  for (const row of rows) {
    let cocok = false;
    for (const cell of row) {
      if (toSearchable(cell).includes(needle)) {
        cocok = true;
        break;
      }
    }
    if (cocok) matched.push([...row]);
  }
  return matched;
}

/**
 * Menerapkan kata kunci pada sebuah laporan yang sudah tersusun.
 *
 * Ringkasan dihitung ULANG dari baris hasil penyaringan, sehingga angka
 * pada kartu ringkasan selalu menjumlahkan baris yang terlihat. Tanpa ini,
 * pengguna yang mencari satu pelanggan akan melihat total seluruh periode —
 * kesalahan fatal pada laporan keuangan.
 *
 * Kata kunci kosong mengembalikan laporan apa adanya (tanpa menyalin baris
 * yang tidak perlu).
 */
export function applyKeywordFilter(result: ReportResult, keyword: string): ReportResult {
  if (normalizeKeyword(keyword) === '') return result;

  const rows = filterReportRows(result.rows, keyword);
  // Denominator ringkasan diwarisi dari laporan asli: untuk laporan rasio
  // (Cakupan Umpan Balik) itu adalah seluruh transaksi periode ini, bukan
  // jumlah baris hasil saringan — kalau tidak, persentasenya selalu 100%.
  const baseline = result.baselineRows ?? result.totalRows;

  return {
    ...result,
    rows,
    totalRows: rows.length,
    summaries: SUMMARIZERS[result.id](rows, baseline),
  };
}

// ---------------------------------------------------------------------------
// Format Tampilan & Ekspor CSV
// ---------------------------------------------------------------------------

/**
 * Mengubah nilai sel menjadi teks siap tampil.
 * Angka dirawat sebagai angka agar bisa diformat Rupiah di UI.
 */
export function formatCell(value: ReportCellValue, format?: ReportColumn['format']): string {
  switch (format) {
    case 'currency':
      return formatRupiah(Number(value));
    case 'integer':
      return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(value));
    case 'decimal':
      return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(Number(value));
    case 'date':
      return formatTanggal(String(value));
    case 'datetime':
      return formatWaktu(String(value));
    default:
      return String(value ?? '');
  }
}

/**
 * Nilai mentah untuk ekspor CSV.
 * Angka diekspor TANPA titik pemisah ribuan agar langsung bisa dijumlahkan
 * di Excel; tanggal diekspor dalam format ISO agar bisa diurutkan.
 */
function toCsvValue(value: ReportCellValue, format?: ReportColumn['format']): string {
  switch (format) {
    case 'currency':
      return String(Math.round(Number(value)));
    case 'integer':
      return String(Math.round(Number(value)));
    case 'decimal':
      return String(round2(Number(value)));
    case 'date':
    case 'datetime':
      return String(value ?? '');
    default:
      return String(value ?? '');
  }
}

/**
 * Pemisah CSV. Memakai titik koma karena locale Indonesia memakai koma
 * sebagai pemisah desimal — titik koma menjaga angka tetap utuh di Excel.
 */
const CSV_DELIMITER = ';';

/** Mengapit nilai dengan tanda kutip bila mengandung karakter khusus CSV. */
function escapeCsv(value: string): string {
  if (/[";\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Menyusun isi berkas CSV dari sebuah laporan.
 *
 * Baris pertama adalah judul laporan (metadata), lalu header kolom, lalu data.
 * Diawali BOM UTF-8 agar Excel mengenali karakter Indonesia dengan benar.
 */
export function buildCsv(result: ReportResult): string {
  const lines: string[] = [];

  lines.push(escapeCsv(result.title));
  lines.push(escapeCsv(`Periode: ${result.periodLabel}`));
  lines.push('');
  lines.push(result.columns.map((c) => escapeCsv(c.label)).join(CSV_DELIMITER));

  for (const row of result.rows) {
    lines.push(
      row.map((cell, idx) => escapeCsv(toCsvValue(cell, result.columns[idx]?.format))).join(CSV_DELIMITER)
    );
  }

  for (const s of result.summaries) {
    lines.push(escapeCsv(`${s.label}: ${s.value}`));
  }

  // BOM + CRLF: kombinasi yang paling aman untuk Excel Indonesia.
  return `\uFEFF${lines.join('\r\n')}`;
}

/** Nama berkas ekspor, misal `Laporan_Rental_Bulanan_2026-09-09.csv`. */
export function buildCsvFilename(result: ReportResult, today: Date = new Date()): string {
  const day = today.toISOString().slice(0, 10);
  const slug = result.title.replace(/^Laporan\s+/i, '').replace(/[^a-zA-Z0-9]+/g, '_');
  return `Laporan_${slug}_${day}.csv`;
}
