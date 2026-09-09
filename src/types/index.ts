export type RoleName = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: number;
  role_id: number;
  role_name?: RoleName;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  company_name: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at?: string;
  /**
   * Hash password PBKDF2 (format `pbkdf2$<iterasi>$<salt>$<hash>`).
   *
   * Sengaja TIDAK pernah dikirim ke klien — lihat whitelist field pada
   * `GET /api/users`. Nilai `null` berarti akun belum bisa login (akun demo
   * memakai hash bawaan di `src/lib/auth.ts`).
   */
  password_hash?: string | null;
}

export interface Equipment {
  id: number;
  equipment_code: string;
  name: string;
  type: string;
  model: string;
  brand: string;
  hour_meter: number;
  rental_price_per_day: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'UNAVAILABLE';
  last_maintenance_date: string | null;
  thumbnail_url?: string;
  created_at?: string;
}

export interface Rental {
  id: number;
  rental_code: string;
  customer_id: number;
  customer_name?: string;
  company_name?: string;
  equipment_id: number;
  equipment_name?: string;
  equipment_code?: string;
  booking_date: string;
  start_date: string;
  end_date: string;
  total_days: number;
  subtotal: number;
  status: 'PENDING' | 'APPROVED' | 'ON_GOING' | 'COMPLETED' | 'REJECTED';
  notes?: string;
}

export interface Contract {
  id: number;
  contract_code: string;
  rental_id: number;
  rental_code?: string;
  customer_id: number;
  customer_name?: string;
  contract_date: string;
  valid_until: string;
  document_path?: string;
  terms_conditions: string;
  is_signed_customer: boolean | number;
  signed_at?: string | null;
}

export interface Payment {
  id: number;
  payment_code: string;
  contract_id: number;
  contract_code?: string;
  customer_id: number;
  customer_name?: string;
  amount: number;
  payment_method: string;
  payment_proof_path?: string;
  status: 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'FAILED';
  payment_date: string;
  verified_by?: number | null;
  verified_by_name?: string;
  verified_at?: string | null;
}

export interface Maintenance {
  id: number;
  maintenance_code: string;
  equipment_id: number;
  equipment_name?: string;
  equipment_code?: string;
  scheduled_date: string;
  completion_date?: string | null;
  maintenance_type: 'PREVENTIVE' | 'CORRECTIVE' | 'OVERHAUL';
  hour_meter_at_maintenance: number;
  description: string;
  spareparts_replaced?: string;
  cost: number;
  technician_id?: number | null;
  technician_name?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface GpsTracking {
  id: number;
  equipment_id: number;
  equipment_name?: string;
  equipment_code?: string;
  latitude: number;
  longitude: number;
  speed: number;
  engine_status: 'ON' | 'OFF';
  fuel_level_percent: number;
  recorded_at: string;
}

export interface ReportItem {
  id: number;
  report_code: string;
  rental_id?: number | null;
  rental_code?: string;
  report_type: 'BAST_IN' | 'BAST_OUT' | 'SURAT_JALAN' | 'FINANCIAL_SUMMARY';
  generated_by: number;
  generated_by_name?: string;
  file_path: string;
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Modul Laporan Operasional (11 jenis laporan skripsi)
// ---------------------------------------------------------------------------

/** Identitas 11 jenis laporan operasional. */
export type ReportId =
  | 'RENTAL_BULANAN'
  | 'PEMBAYARAN_PIUTANG'
  | 'PENDAPATAN_BERSIH'
  | 'MAINTENANCE_SERVIS'
  | 'UTILISASI_HM'
  | 'KERUSAKAN_UNIT'
  | 'TELEMETRI_GPS'
  | 'KINERJA_STAF'
  | 'SUKU_CADANG'
  | 'KEPUASAN_PELANGGAN'
  | 'AUDIT_TRAIL';

/** Cara sebuah sel ditampilkan di tabel dan diekspor ke CSV. */
export type ReportColumnFormat =
  | 'text'
  | 'currency'
  | 'integer'
  | 'decimal'
  | 'date'
  | 'datetime';

export interface ReportColumn {
  /** Kunci kolom, dipakai sebagai identitas saat merender sel. */
  key: string;
  /** Judul kolom yang tampil di kepala tabel & baris pertama CSV. */
  label: string;
  /** Perataan sel. Angka selalu rata kanan mengikuti design system. */
  align?: 'left' | 'right';
  /** Format tampilan sel. */
  format?: ReportColumnFormat;
}

/** Nilai sel: angka disimpan mentah agar CSV bisa dijumlahkan di Excel. */
export type ReportCellValue = string | number;

export interface ReportSummary {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
}

/** Rentang tanggal laporan. String kosong berarti tanpa batas. */
export interface DateRangeFilter {
  from: string;
  to: string;
}

export interface ReportResult {
  id: ReportId;
  title: string;
  description: string;
  /** Label periode yang sedang difilter, misal `01 Jan 2026 – 31 Des 2026`. */
  periodLabel: string;
  columns: ReportColumn[];
  rows: ReportCellValue[][];
  summaries: ReportSummary[];
  totalRows: number;
}
