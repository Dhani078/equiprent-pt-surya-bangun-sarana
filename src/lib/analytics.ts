/**
 * Mesin Analytics Operasional (T-0061) — PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Modul MURNI: tidak menyentuh DOM, tidak memanggil jaringan, tidak membaca
 * basis data. Dipakai bersama oleh:
 *   1. Dashboard Admin      (`src/pages/admin/AdminDashboard.tsx`)
 *   2. Edge API             `GET /api/dashboard/analytics` (penyanding server)
 *
 * Mengapa modul ini ada:
 * dashboard yang ada menampilkan pendapatan per bulan & top unit, tetapi
 * keduanya tidak menjawab dua pertanyaan yang paling sering ditanya manajemen:
 *   1. "Bulan mana yang armadanya paling tidak produktif?"
 *      (utilisasi = unit tersewa ÷ total unit per bulan)
 *   2. "Pelanggan mana yang paling banyak menyewa?"
 *      (kontribusi pendapatan kotor per pelanggan)
 *
 * Keduanya adalah sinyal early-warning:utilisasi turun = armada menganggur,
 * konsentrasi pelanggan tinggi = risiko kehilangan pemasukan besar bila satu
 * pelanggan berhenti.
 */

import type { Equipment, Payment, Rental, User } from '../types';

// ---------------------------------------------------------------------------
// Konstanta & Tipe
// ---------------------------------------------------------------------------

/** Banyaknya bulan yang ditampilkan grafik utilisasi. */
export const UTILISASI_BULAN_TAMPIL = 12;

/** Banyaknya pelanggan pada daftar top customer. */
export const TOP_CUSTOMER_LIMIT = 5;

/** Status rental yang dianggap sebagai unit sedang disewa. */
const STATUS_SEWA: readonly Rental['status'][] = ['APPROVED', 'ON_GOING'];

/** Label bulan singkat Bahasa Indonesia. */
const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Satu titik data utilisasi armada per bulan.
 */
export interface UtilisasiBulananItem {
  /** Label bulan + tahun, misal "Sep 26". */
  label: string;
  /** Tahun (YYYY). */
  year: number;
  /** Bulan (1–12). */
  month: number;
  /** Banyaknya unit unik yang disewa pada bulan ini. */
  unitDisewa: number;
  /** Total unit armada pada bulan ini (lihat catatan di fungsi). */
  totalUnit: number;
  /** Persentase unitDisewa / totalUnit (0–100). */
  persentase: number;
}

/** Baris top pelanggan berdasarkan kontribusi penyewaan. */
export interface TopCustomerRow {
  /** ID pelanggan (User). */
  customer_id: number;
  /** Nama lengkap atau nama perusahaan (yang lebih informatif dipakai). */
  nama: string;
  /** Nama perusahaan — null bila pelanggan perorangan. */
  company_name: string | null;
  /** Banyaknya transaksi sewa (semua status kecuali REJECTED). */
  jumlahRental: number;
  /** Total nilai sewa (subtotal seluruh transaksi, Rupiah). */
  totalNilai: number;
}

/** Hasil lengkap analytics operasional. */
export interface OperationalAnalytics {
  utilisasiBulanan: UtilisasiBulananItem[];
  topCustomers: TopCustomerRow[];
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Mengambil bagian tanggal "YYYY-MM" dari nilai tanggal sewa.
 *
 * Mengembalikan string kosong bila tanggal tidak bisa diparse — baris dengan
 * tanggal rusak tidak boleh menghentikan agregat seluruh bulan.
 */
function keBulan(value: string | null | undefined): string {
  if (typeof value !== 'string' || value.length < 7) return '';
  const tahun = value.slice(0, 4);
  const bulan = value.slice(5, 7);
  if (!/^\d{4}$/.test(tahun) || !/^\d{2}$/.test(bulan)) return '';
  if (Number(bulan) < 1 || Number(bulan) > 12) return '';
  return `${tahun}-${bulan}`;
}

/**
 * Membangun 12 slot bulan terakhir dari tanggal acuan.
 *
 * Slot kosong diisi nol sehingga grafik selalu menampilkan 12 titik —
 * bulan tanpa sewa adalah informasi (armada menganggur), bukan data hilang.
 */
function slotBulan(now: Date, jumlahBulan: number): { year: number; month: number; label: string }[] {
  const slot: { year: number; month: number; label: string }[] = [];
  for (let i = jumlahBulan - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    slot.push({
      year,
      month,
      label: `${BULAN_SINGKAT[month - 1]} ${String(year).slice(2)}`,
    });
  }
  return slot;
}

/**
 * Membangun peta nama pelanggan: id → nama tampilan + perusahaan.
 *
 * `customer_name` pada baris rental lebih diutamakan karena sudah diisi oleh
 * server; fallback ke tabel users agar pelanggan tanpa nama tersimpan tetap
 * teridentifikasi.
 */
function buildCustomerMap(users: ReadonlyArray<User>): Map<number, { nama: string; company_name: string | null }> {
  const peta = new Map<number, { nama: string; company_name: string | null }>();
  for (const u of users) {
    if (u.role_id === 3 || u.role_name === 'CUSTOMER') {
      peta.set(u.id, { nama: u.full_name, company_name: u.company_name });
    }
  }
  return peta;
}

// ---------------------------------------------------------------------------
// Inti: Bangun Analytics Operasional
// ---------------------------------------------------------------------------

/**
 * Menghitung utilisasi armada per bulan.
 *
 * Definisi utilisasi: unit unik yang sedang disewa pada bulan X ÷ total unit
 * armada. Sebuah unit dihitung "disewa pada bulan X" bila ada rental
 * berstatus APPROVED/ON_GOING yang periode sewanya (start–end) memuat
 * salah satu hari di bulan tersebut.
 *
 * Catatan totalUnit: aplikasi tidak menyimpan snapshot armada per bulan,
 * sehingga total unit adalah jumlah unit yang ADA saat ini. Ini konsisten
 * dengan KPI "Tingkat Utilisasi Armada" yang sudah ada di dashboard, jadi
 * angka keduanya tidak pernah bertentangan.
 *
 *   ponytail: totalUnit = snapshot terbaru, bukan historis.
 *   Naik ke tabel equipment_snapshot bila laporan TREN armada per bulan
 *   menjadi kebutuhan (mis. untuk audit pertumbuhan armada).
 */
export function buildUtilisasiBulanan(
  rentals: ReadonlyArray<Rental>,
  equipments: ReadonlyArray<Equipment>,
  now: Date = new Date(),
  jumlahBulan: number = UTILISASI_BULAN_TAMPIL
): UtilisasiBulananItem[] {
  const slot = slotBulan(now, jumlahBulan);
  const totalUnit = Math.max(equipments.length, 1);

  // Hitung unit unik disewa per bulan.
  const unitPerBulan = new Map<string, Set<number>>();
  for (const r of rentals) {
    if (!STATUS_SEWA.includes(r.status)) continue;

    const mulai = new Date(r.start_date);
    const selesai = new Date(r.end_date);
    if (Number.isNaN(mulai.getTime()) || Number.isNaN(selesai.getTime())) continue;

    // Irisan periode sewa terhadap setiap slot bulan.
    for (const s of slot) {
      const awalBulan = new Date(s.year, s.month - 1, 1);
      const akhirBulan = new Date(s.year, s.month, 0, 23, 59, 59);
      if (mulai <= akhirBulan && selesai >= awalBulan) {
        const key = `${s.year}-${String(s.month).padStart(2, '0')}`;
        let himpunan = unitPerBulan.get(key);
        if (himpunan === undefined) {
          himpunan = new Set<number>();
          unitPerBulan.set(key, himpunan);
        }
        himpunan.add(r.equipment_id);
      }
    }
  }

  return slot.map((s) => {
    const key = `${s.year}-${String(s.month).padStart(2, '0')}`;
    const unitDisewa = unitPerBulan.get(key)?.size ?? 0;
    return {
      label: s.label,
      year: s.year,
      month: s.month,
      unitDisewa,
      totalUnit,
      persentase: Math.round((unitDisewa / totalUnit) * 100),
    };
  });
}

/**
 * Menghitung ranking pelanggan berdasarkan jumlah & nilai penyewaan.
 *
 * Rental dengan status REJECTED dikecualikan (penyewaan yang tidak terjadi),
 * tetapi CANCELLED tidak ada di model data ini — lihat tipe Rental.
 */
export function buildTopCustomers(
  rentals: ReadonlyArray<Rental>,
  users: ReadonlyArray<User>,
  limit: number = TOP_CUSTOMER_LIMIT
): TopCustomerRow[] {
  const customerMap = buildCustomerMap(users);

  // Akumulasi per pelanggan: hitung transaksi & jumlah nilai subtotal.
  const akumulasi = new Map<number, { jumlahRental: number; totalNilai: number }>();
  for (const r of rentals) {
    if (r.status === 'REJECTED') continue;

    const nilai = Number(r.subtotal);
    const totalNilai = Number.isFinite(nilai) ? nilai : 0;

    const saatIni = akumulasi.get(r.customer_id) ?? { jumlahRental: 0, totalNilai: 0 };
    saatIni.jumlahRental += 1;
    saatIni.totalNilai += totalNilai;
    akumulasi.set(r.customer_id, saatIni);
  }

  const rows: TopCustomerRow[] = [...akumulasi.entries()]
    .map(([customer_id, nilai]) => {
      const info = customerMap.get(customer_id);
      const namaTampilan = info?.company_name && info.company_name.trim() !== ''
        ? info.company_name
        : (info?.nama ?? `Pelanggan #${customer_id}`);
      return {
        customer_id,
        nama: namaTampilan,
        company_name: info?.company_name ?? null,
        jumlahRental: nilai.jumlahRental,
        totalNilai: nilai.totalNilai,
      };
    })
    // Urut: total nilai menurun, seri dipecahkan jumlah rental lalu id stabil.
    .sort((a, b) => b.totalNilai - a.totalNilai || b.jumlahRental - a.jumlahRental || a.customer_id - b.customer_id)
    .slice(0, Math.max(limit, 0));

  return rows;
}

/**
 * Menyusun seluruh analytics operasional dari sumber data.
 *
 * `now` disuntikkan (bukan dibaca langsung) agar rentang 12 bulan
 * deterministik dan dapat diuji pada tanggal berapa pun.
 */
export function buildOperationalAnalytics(
  source: { rentals: readonly Rental[]; equipments: readonly Equipment[]; users: readonly User[]; payments?: readonly Payment[] },
  now: Date = new Date()
): OperationalAnalytics {
  return {
    utilisasiBulanan: buildUtilisasiBulanan(source.rentals, source.equipments, now),
    topCustomers: buildTopCustomers(source.rentals, source.users),
  };
}

// ---------------------------------------------------------------------------
// Helper Tampilan
// ---------------------------------------------------------------------------

/**
 * Label nada utilisasi untuk pewarnaan konsisten dengan design system.
 *
 * Ambang mengikuti KPI "Tingkat Utilisasi Armada" yang sudah ada di
 * AdminDashboard (>= 60% = Tinggi) sehingga warna chart dan kartu KPI
 * tidak pernah bertentangan untuk angka yang sama.
 */
export function getTingkatUtilisasi(persentase: number): 'success' | 'warning' | 'danger' {
  if (persentase >= 60) return 'success';
  if (persentase >= 30) return 'warning';
  return 'danger';
}
