/**
 * Generator Data Demo — EquipRent MS
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Menghasilkan data demo yang realistis dan KONSISTEN secara relasional
 * untuk keperluan uji coba dan demonstrasi sidang skripsi.
 *
 * Prinsip yang dipegang:
 * - Referensial valid: setiap rental menunjuk ke customer & unit yang nyata.
 * - Konsisten: status unit selaras dengan rental yang berjalan.
 * - Realistis: HM, koordinat GPS, dan nominal mengikuti kondisi operasi Kalsel.
 * - Deterministik: memakai PRNG berseed agar hasil selalu sama (reproducible).
 *
 * CATATAN: File ini hanya dipakai sebagai fallback ketika TiDB Cloud belum
 * terhubung. Saat database aktif, data diambil dari tabel sesungguhnya.
 */

import type {
  User, Equipment, Rental, Contract, Payment,
  Maintenance, GpsTracking, ReportItem,
} from '../../types';
import { SYARAT_KONTRAK } from './shared';

// ---------------------------------------------------------------------------
// PRNG Deterministik (Mulberry32)
// ---------------------------------------------------------------------------

function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(20260904);

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const between = (min: number, max: number): number => min + rng() * (max - min);
const intBetween = (min: number, max: number): number => Math.floor(between(min, max + 1));

/** Format tanggal ISO (YYYY-MM-DD). */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Tambah hari ke tanggal tertentu. */
function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/** Format tanggal+waktu MySQL (YYYY-MM-DD HH:mm:ss). */
function isoDateTime(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Tanggal referensi demo.
 *
 * Pakai tanggal HARI INI (bukan konstanta) agar data selalu segar saat demo
 * sidang: rental ON_GOING sedang berjalan, PENDING/APPROVED di masa depan,
 * GPS tercatat beberapa hari terakhir. `new Date()` dipakai langsung karena
 * generator hanya berjalan sekali saat modul dimuat (seed deterministik untuk
 * HM/tarif/nama, sementara tanggal mengikuti kalender sebenarnya).
 */
const HARI_INI = new Date();

// ---------------------------------------------------------------------------
// Data Master Referensi
// ---------------------------------------------------------------------------

interface UnitSpec { type: string; brand: string; model: string; prefix: string; rate: number; }

const UNIT_SPECS: readonly UnitSpec[] = [
  { type: 'Excavator',  brand: 'Komatsu',     model: 'PC200-8',   prefix: 'EXCA-KOM-PC200', rate: 2_500_000 },
  { type: 'Excavator',  brand: 'Caterpillar', model: '320D',      prefix: 'EXCA-CAT-320D',  rate: 2_700_000 },
  { type: 'Excavator',  brand: 'Hitachi',     model: 'ZX200-5G',  prefix: 'EXCA-HIT-ZX200', rate: 2_600_000 },
  { type: 'Excavator',  brand: 'Kobelco',     model: 'SK200-10',  prefix: 'EXCA-KOB-SK200', rate: 2_450_000 },
  { type: 'Bulldozer',  brand: 'Komatsu',     model: 'D85ESS-2',  prefix: 'BULL-KOM-D85',   rate: 3_200_000 },
  { type: 'Bulldozer',  brand: 'Caterpillar', model: 'D6R',       prefix: 'BULL-CAT-D6R',   rate: 3_400_000 },
  { type: 'Wheel Loader', brand: 'Komatsu',   model: 'WA320-7',   prefix: 'LOAD-KOM-WA320', rate: 2_800_000 },
  { type: 'Wheel Loader', brand: 'Caterpillar', model: '966M',    prefix: 'LOAD-CAT-966M',  rate: 3_000_000 },
  { type: 'Crane',      brand: 'Kobelco',     model: 'CKE800',    prefix: 'CRAN-KOB-CKE800', rate: 4_500_000 },
  { type: 'Crane',      brand: 'Tadano',      model: 'GR-500EX',  prefix: 'CRAN-TAD-GR500', rate: 4_800_000 },
  { type: 'Vibro Roller', brand: 'Bomag',     model: 'BW213D-5',  prefix: 'ROLL-BOM-BW213', rate: 1_800_000 },
  { type: 'Vibro Roller', brand: 'Dynapac',   model: 'CA602D',    prefix: 'ROLL-DYN-CA602', rate: 1_900_000 },
  { type: 'Dump Truck', brand: 'Hino',        model: 'FM260JD',   prefix: 'DUMP-HINO-FM260', rate: 2_200_000 },
  { type: 'Dump Truck', brand: 'Mitsubishi',  model: 'Fuso FV',   prefix: 'DUMP-MIT-FUSO',  rate: 2_100_000 },
  { type: 'Motor Grader', brand: 'Komatsu',   model: 'GD655-5',   prefix: 'GRAD-KOM-GD655', rate: 2_900_000 },
];

const THUMBNAILS: Record<string, string> = {
  Excavator: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&auto=format&fit=crop&q=80',
  Bulldozer: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&auto=format&fit=crop&q=80',
  'Wheel Loader': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
  Crane: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=600&auto=format&fit=crop&q=80',
  'Vibro Roller': 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=600&auto=format&fit=crop&q=80',
  'Dump Truck': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80',
  'Motor Grader': 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=600&auto=format&fit=crop&q=80',
};

const NAMA_CUSTOMER: readonly string[] = [
  'Budi Santoso', 'Siti Aminah', 'Ir. H. Gunawan Wibisono', 'H. Akhmad Zaini',
  'Tomas Salim', 'H. Syamsul Bahri', 'Andi Wijaya Kusuma', 'Rina Kartika Sari',
  'Drs. Muhammad Yasin', 'Norhayati Rahmah', 'Fajar Nugroho', 'Dewi Anggraini',
  'Ir. Bambang Suryanto', 'Hj. Nurul Hidayah', 'Agus Salim Harahap', 'Yuniarti Puspita',
  'Khalid bin Abdullah', 'Sri Wahyuni', 'Joko Susilo', 'Maya Sari Dewi',
  'Rahmat Hidayat', 'Nur Aini Rahmawati', 'Sutrisno Wibowo', 'Linda Septiani',
  'Hendra Gunawan', 'Fitri Handayani', 'Zulkifli Hasan', 'Ratna Kusumawardani',
  'Bambang Pamungkas', 'Endang Sulistyowati', 'Arief Rahman Hakim', 'Wulan Sari',
  'Imam Sopingi', 'Retno Widyaningrum', 'Slamet Riyadi', 'Anisa Putri Ramadhani',
];

const PERUSAHAAN: readonly string[] = [
  'PT. Aneka Tambang Kalimantan', 'CV. Barito Putera Konstruksi', 'PT. Adaro Indonesia',
  'PT. Banjar Indah Pembangunan', 'PT. Meratus Coal Energy', 'PT. Hasnur Riung Sinergi',
  'CV. Kalimantan Jaya Mandiri', 'PT. Borneo Infrastruktur Nusantara',
  'PT. Tambang Batulicin Sejahtera', 'CV. Karya Banua Baiman',
  'PT. Sumber Alam Kalimantan', 'CV. Mitra Banjar Sejati',
];

const JALAN_BANJARMASIN: readonly string[] = [
  'Jl. Ahmad Yani KM 5', 'Jl. Sultan Adam', 'Jl. Belitung Darat',
  'Jl. Gatot Subroto', 'Jl. H. Hasan Basri', 'Jl. Trisakti',
  'Jl. Aneka Tambang', 'Jl. Pramuka', 'Jl. Simpang Lima',
];

// ---------------------------------------------------------------------------
// Generator: Users (50 akun)
// ---------------------------------------------------------------------------

export function generateContracts(rentals: readonly Rental[], users: readonly User[]): Contract[] {
  return rentals.map((r, idx) => {
    const customer = users.find(u => u.id === r.customer_id);
    const start = new Date(r.start_date);
    return {
      id: idx + 1,
      contract_code: `SBS/CONTRACT/${start.getUTCFullYear()}/${String(start.getUTCMonth() + 1).padStart(2, '0')}/${String(idx + 1).padStart(4, '0')}`,
      rental_id: r.id,
      rental_code: r.rental_code,
      customer_id: r.customer_id,
      customer_name: customer?.full_name,
      contract_date: isoDate(addDays(start, -2)),
      valid_until: r.end_date,
      terms_conditions: SYARAT_KONTRAK,
      // Kontrak rental yang sudah berjalan cenderung sudah ditandatangani.
      is_signed_customer: r.status === 'PENDING' ? 0 : (rng() < 0.85 ? 1 : 0),
      signed_at: r.status === 'PENDING' ? null : isoDateTime(addDays(start, -1)),
    };
  });
}

