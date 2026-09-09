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
} from '../types';

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

function generateUsers(): User[] {
  const users: User[] = [];

  // Akun inti untuk demo (password: admin / staff / user)
  users.push(
    { id: 1, role_id: 1, role_name: 'ADMIN', username: 'admin', email: 'admin@suryabangun.co.id', full_name: 'Muhammad Rizki Ramadhani, S.Kom (Admin)', phone: '081254321098', address: 'Jl. Ahmad Yani KM 5, Banjarmasin', company_name: 'PT. Surya Bangun Sarana', status: 'ACTIVE' },
    { id: 2, role_id: 1, role_name: 'ADMIN', username: 'admin2', email: 'lisa.indriani@suryabangun.co.id', full_name: 'Lisa Indriani, S.E. (Head of Finance)', phone: '081255556666', address: 'Jl. Sultan Adam Blok C, Banjarmasin', company_name: 'PT. Surya Bangun Sarana', status: 'ACTIVE' },
    { id: 3, role_id: 2, role_name: 'STAFF', username: 'staff', email: 'hendra@suryabangun.co.id', full_name: 'Hendra Wijaya (Staf Administrasi & Logistik)', phone: '082198765432', address: 'Jl. Belitung Darat No. 45, Banjarmasin', company_name: 'PT. Surya Bangun Sarana', status: 'ACTIVE' },
    { id: 4, role_id: 2, role_name: 'STAFF', username: 'ahmad', email: 'ahmad_mekanik@suryabangun.co.id', full_name: 'Ahmad Ridwan (Mekanik Senior)', phone: '085345678901', address: 'Jl. Liang Anggang KM 18, Banjarbaru', company_name: 'PT. Surya Bangun Sarana', status: 'ACTIVE' },
    { id: 5, role_id: 2, role_name: 'STAFF', username: 'siska', email: 'siska.amanda@suryabangun.co.id', full_name: 'Siska Amanda (Account Manager Executive)', phone: '082148564979', address: 'Jl. Gatot Subroto No. 12, Banjarmasin', company_name: 'PT. Surya Bangun Sarana', status: 'ACTIVE' },
    { id: 6, role_id: 2, role_name: 'STAFF', username: 'eko', email: 'eko.purwanto@suryabangun.co.id', full_name: 'Eko Purwanto (Staf Lapangan & Surveyor)', phone: '085299990001', address: 'Jl. Landasan Ulin Utara, Banjarbaru', company_name: 'PT. Surya Bangun Sarana', status: 'ACTIVE' },
    { id: 7, role_id: 2, role_name: 'STAFF', username: 'dwi', email: 'dwi.haryono@suryabangun.co.id', full_name: 'Dwi Haryono (Mekanik Junior)', phone: '081387654321', address: 'Jl. Trans Kalimantan, Alalak, Batola', company_name: 'PT. Surya Bangun Sarana', status: 'ACTIVE' },
    { id: 8, role_id: 2, role_name: 'STAFF', username: 'rudi', email: 'rudi.hartono@suryabangun.co.id', full_name: 'Rudi Hartono (Operator Senior)', phone: '087822334455', address: 'Jl. Handil Bakti, Batola', company_name: 'PT. Surya Bangun Sarana', status: 'ACTIVE' },
    { id: 9, role_id: 3, role_name: 'CUSTOMER', username: 'user', email: 'logistik@anekatambang.com', full_name: 'Budi Santoso (Logistik)', phone: '081122334455', address: 'Jl. Trisakti Pelabuhan, Banjarmasin', company_name: 'PT. Aneka Tambang Kalimantan', status: 'ACTIVE' },
    { id: 10, role_id: 3, role_name: 'CUSTOMER', username: 'user2', email: 'siti.aminah@baritoputera.co.id', full_name: 'Siti Aminah, M.B.A (Direktur)', phone: '087855667788', address: 'Jl. Sultan Adam No. 88, Banjarmasin', company_name: 'CV. Barito Putera Konstruksi', status: 'ACTIVE' },
    { id: 11, role_id: 3, role_name: 'CUSTOMER', username: 'adaro', email: 'procurement@adaro.com', full_name: 'Ir. H. Gunawan Wibisono', phone: '08115009001', address: 'Kawasan Industri Tabalong, Kalsel', company_name: 'PT. Adaro Indonesia', status: 'ACTIVE' },
    { id: 12, role_id: 3, role_name: 'CUSTOMER', username: 'banjar_indah', email: 'info@banjarindah.co.id', full_name: 'H. Akhmad Zaini (Manajer Konstruksi)', phone: '085100112233', address: 'Jl. Banjar Indah Permai No. 10, Banjarmasin', company_name: 'PT. Banjar Indah Pembangunan', status: 'ACTIVE' },
    { id: 13, role_id: 3, role_name: 'CUSTOMER', username: 'meratus_coal', email: 'tomas.salim@meratuscoal.com', full_name: 'Tomas Salim', phone: '081399887766', address: 'Kawasan Tambang Sebamban, Tanah Bumbu', company_name: 'PT. Meratus Coal Energy', status: 'ACTIVE' },
    { id: 14, role_id: 3, role_name: 'CUSTOMER', username: 'wasaka_jaya', email: 'dian.saputra@wasakajaya.com', full_name: 'Dian Saputra', phone: '087712345678', address: 'Jl. H. Hasan Basri, Kayutangi, Banjarmasin', company_name: 'CV. Wasaka Jaya Mandiri', status: 'ACTIVE' },
    { id: 15, role_id: 3, role_name: 'CUSTOMER', username: 'hasnur_group', email: 'logistik@hasnurgroup.com', full_name: 'H. Syamsul Bahri (Kasi Logistik)', phone: '0811998877', address: 'Kawasan Pelabuhan Hasnur, Tapin', company_name: 'PT. Hasnur Riung Sinergi', status: 'ACTIVE' },
  );

  // 35 pelanggan tambahan (id 16–50)
  const dipakai = new Set(users.map(u => u.username));
  for (let i = 16; i <= 50; i += 1) {
    const namaIdx = (i - 16) % NAMA_CUSTOMER.length;
    const nama = NAMA_CUSTOMER[namaIdx];
    const perusahaan = PERUSAHAAN[(i - 16) % PERUSAHAAN.length];

    // Username unik: nama depan kecil + angka
    let username = nama.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
    if (dipakai.has(username)) username = `${username}${i}`;
    dipakai.add(username);

    users.push({
      id: i,
      role_id: 3,
      role_name: 'CUSTOMER',
      username,
      email: `${username}@${perusahaan.toLowerCase().replace(/[^a-z]/g, '')}.co.id`,
      full_name: `${nama} (${pick(['Logistik', 'Direktur', 'Manajer Proyek', 'Kasi Operasional', 'Procurement'])})`,
      phone: `0812${String(10000000 + intBetween(0, 89999999)).slice(0, 10)}`,
      address: `${pick(JALAN_BANJARMASIN)} No. ${intBetween(1, 120)}, Banjarmasin`,
      company_name: perusahaan,
      // 1 dari 12 pelanggan disuspend agar halaman manajemen user punya variasi
      status: i % 12 === 0 ? 'SUSPENDED' : 'ACTIVE',
      created_at: isoDate(addDays(new Date('2025-01-15'), intBetween(0, 400))),
    });
  }

  return users;
}

// ---------------------------------------------------------------------------
// Generator: Equipments (50 unit)
// ---------------------------------------------------------------------------

function generateEquipments(): Equipment[] {
  const equipments: Equipment[] = [];
  const counter: Record<string, number> = {};

  for (let i = 1; i <= 50; i += 1) {
    const spec = UNIT_SPECS[(i - 1) % UNIT_SPECS.length];
    counter[spec.prefix] = (counter[spec.prefix] ?? 0) + 1;

    const code = `${spec.prefix}-${String(counter[spec.prefix]).padStart(2, '0')}`;

    // Distribusi status: mayoritas tersedia, sebagian disewa/dalam servis.
    const roll = rng();
    let status: Equipment['status'];
    if (roll < 0.50) status = 'AVAILABLE';
    else if (roll < 0.78) status = 'RENTED';
    else if (roll < 0.94) status = 'MAINTENANCE';
    else status = 'UNAVAILABLE';

    equipments.push({
      id: i,
      equipment_code: code,
      name: `${spec.type} ${spec.brand} ${spec.model}`,
      type: spec.type,
      model: spec.model,
      brand: spec.brand,
      hour_meter: Number(between(250, 4200).toFixed(2)),
      rental_price_per_day: spec.rate,
      status,
      last_maintenance_date: isoDate(addDays(new Date('2026-01-05'), intBetween(0, 200))),
      thumbnail_url: THUMBNAILS[spec.type] ?? THUMBNAILS.Excavator,
      created_at: isoDate(addDays(new Date('2024-06-01'), intBetween(0, 500))),
    });
  }

  return equipments;
}

// ---------------------------------------------------------------------------
// Generator: Maintenance (25 log) — dihasilkan sebelum rental agar
// perhitungan Hour Meter memiliki riwayat servis yang realistis.
// ---------------------------------------------------------------------------

const TEKNISI_IDS: readonly number[] = [4, 7, 8];

const SPAREPARTS: readonly string[] = [
  'Oli Mesin Meditran SX 15W-40, Filter Oli, Filter Solar',
  'Filter Hidrolik Komatsu, Seal Kit Boom Cylinder',
  'Track Link Assembly, Sprocket Segment, Track Roller',
  'Baterai 12V 150Ah, Alternator Assembly',
  'Radiator Core, Water Pump, Thermostat',
  'Brake Pad Set, Brake Disc, Master Rem',
  'Boom Bushing, Swing Gear Grease, Hydraulic Hose',
  'Air Filter Element, Fuel Filter, Water Separator',
];

function generateMaintenance(equipments: readonly Equipment[]): Maintenance[] {
  const logs: Maintenance[] = [];

  for (let i = 1; i <= 25; i += 1) {
    const eq = equipments[intBetween(0, equipments.length - 1)];
    const isPreventive = rng() < 0.7;
    const status: Maintenance['status'] = rng() < 0.65 ? 'COMPLETED' : (rng() < 0.6 ? 'SCHEDULED' : 'IN_PROGRESS');

    const scheduled = addDays(new Date('2026-02-01'), intBetween(0, 180));
    const completed = status === 'COMPLETED' ? addDays(scheduled, intBetween(0, 3)) : null;

    // HM saat servis sedikit di bawah HM unit sekarang (masuk akal).
    const hmAtService = Number(Math.max(0, eq.hour_meter - between(0, 400)).toFixed(2));

    logs.push({
      id: i,
      maintenance_code: `MNT-SBS-${isoDate(scheduled).replace(/-/g, '')}-${String(i).padStart(3, '0')}`,
      equipment_id: eq.id,
      equipment_name: eq.name,
      equipment_code: eq.equipment_code,
      scheduled_date: isoDate(scheduled),
      completion_date: completed ? isoDate(completed) : null,
      maintenance_type: isPreventive ? 'PREVENTIVE' : (rng() < 0.7 ? 'CORRECTIVE' : 'OVERHAUL'),
      hour_meter_at_maintenance: hmAtService,
      description: isPreventive
        ? 'Servis preventif berkala sesuai interval 250 Hour Meter.'
        : 'Perbaikan kerusakan komponen yang ditemukan saat inspeksi lapangan.',
      spareparts_replaced: pick(SPAREPARTS),
      cost: isPreventive ? intBetween(2_500_000, 6_000_000) : intBetween(5_000_000, 18_000_000),
      technician_id: pick(TEKNISI_IDS),
      technician_name: pick(['Ahmad Ridwan', 'Dwi Haryono', 'Rudi Hartono']),
      status,
    });
  }

  return logs;
}

// ---------------------------------------------------------------------------
// Generator: Rentals (50 transaksi) — konsisten dengan status unit
// ---------------------------------------------------------------------------

const CATATAN: readonly string[] = [
  'Unit dikirim ke site Tambang Sebamban, Tanah Bumbu.',
  'Penggunaan untuk proyek normalisasi sungai di Banjarbaru.',
  'Mobilisasi alat ke pelabuhan Trisakti Banjarmasin.',
  'Diperlukan operator tambahan dari pihak penyewa.',
  'Unit beroperasi shift malam sesuai jadwal proyek.',
  'Pemakaian untuk land clearing kawasan industri.',
];

function generateRentals(equipments: readonly Equipment[], customerIds: readonly number[]): Rental[] {
  const rentals: Rental[] = [];
  const today = new Date('2026-09-04');

  /**
   * Alokasi status ditentukan di awal agar setiap halaman punya data saat demo:
   *   PENDING   → antrean persetujuan staf
   *   APPROVED  → menunggu berjalan
   *   ON_GOING  → sedang beroperasi (tracking GPS)
   *   COMPLETED → riwayat & laporan pendapatan
   *   REJECTED  → riwayat penolakan
   */
  const STATUS_ALOKASI: readonly Rental['status'][] = [
    ...Array<Rental['status']>(7).fill('PENDING'),
    ...Array<Rental['status']>(8).fill('APPROVED'),
    ...Array<Rental['status']>(10).fill('ON_GOING'),
    ...Array<Rental['status']>(21).fill('COMPLETED'),
    ...Array<Rental['status']>(4).fill('REJECTED'),
  ];

  /**
   * Unit yang sedang disewa dilacak agar TIDAK terjadi double-booking.
   * Setiap unit hanya boleh punya SATU rental aktif (APPROVED / ON_GOING).
   */
  const unitTerpakai = new Set<number>();

  // Unit yang boleh dipakai untuk rental AKTIF: tidak dalam perawatan.
  const kandidatAktif = equipments.filter(e => e.status !== 'MAINTENANCE');

  // Antrian unit dialokasikan bergilir agar penyebaran merata.
  let putaranAktif = 0;

  for (let i = 1; i <= 50; i += 1) {
    const customerId = pick(customerIds);
    const status: Rental['status'] = STATUS_ALOKASI[i - 1] ?? 'COMPLETED';
    const butuhUnitAktif = status === 'ON_GOING' || status === 'APPROVED';

    let eq: Equipment;

    if (butuhUnitAktif) {
      // Cari unit yang belum dipakai rental aktif lain.
      let ditemukan: Equipment | undefined;
      for (let percobaan = 0; percobaan < kandidatAktif.length; percobaan += 1) {
        const calon = kandidatAktif[(putaranAktif + percobaan) % kandidatAktif.length];
        if (calon && !unitTerpakai.has(calon.id)) {
          ditemukan = calon;
          putaranAktif = (putaranAktif + percobaan + 1) % kandidatAktif.length;
          break;
        }
      }
      // Bila semua unit sudah terpakai, pakai kandidat berikutnya apa adanya
      // (sangat jarang; hanya bila rental aktif melebihi jumlah unit).
      eq = ditemukan ?? kandidatAktif[putaranAktif % kandidatAktif.length];
      unitTerpakai.add(eq.id);
    } else {
      // Riwayat / pengajuan: bebas memilih unit apa pun.
      eq = pick(equipments);
    }

    const durasi = intBetween(3, 30);

    // Tanggal disesuaikan agar konsisten dengan status.
    const today = new Date('2026-09-04');
    let start: Date;
    let end: Date;

    if (status === 'COMPLETED' || status === 'REJECTED') {
      // Riwayat masa lalu
      start = addDays(today, -intBetween(40, 240));
      end = addDays(start, durasi);
    } else if (status === 'ON_GOING') {
      // Sedang berjalan: mulai sebelum hari ini, selesai setelahnya
      start = addDays(today, -intBetween(1, Math.max(1, durasi - 1)));
      end = addDays(start, durasi);
    } else if (status === 'APPROVED') {
      // Disetujui, akan berjalan: mulai hari ini atau besok
      start = addDays(today, intBetween(0, 3));
      end = addDays(start, durasi);
    } else {
      // PENDING: pengajuan baru, mulai beberapa hari ke depan
      start = addDays(today, intBetween(3, 21));
      end = addDays(start, durasi);
    }

    const booking = status === 'PENDING' ? addDays(today, -intBetween(0, 3)) : addDays(start, -intBetween(3, 14));

    rentals.push({
      id: i,
      rental_code: `RNT-SBS-${isoDate(booking).replace(/-/g, '')}-${String(i).padStart(3, '0')}`,
      customer_id: customerId,
      equipment_id: eq.id,
      equipment_name: eq.name,
      equipment_code: eq.equipment_code,
      booking_date: isoDateTime(booking),
      start_date: isoDate(start),
      end_date: isoDate(end),
      total_days: durasi,
      subtotal: durasi * eq.rental_price_per_day,
      status,
      notes: rng() < 0.4 ? pick(CATATAN) : undefined,
    });
  }

  return rentals;
}

// ---------------------------------------------------------------------------
// Generator: Contracts (50) & Payments (50) — mengikuti rental
// ---------------------------------------------------------------------------

const SYARAT_KONTRAK =
  '1. Penyewa wajib menyediakan operator bersertifikat.\n' +
  '2. Biaya bahan bakar dan operator ditanggung penyewa.\n' +
  '3. Kerusakan akibat kelalaian penyewa menjadi tanggung jawab penyewa.\n' +
  '4. Keterlambatan pengembalian dikenakan denda Rp 500.000 per hari.\n' +
  '5. Perpanjangan sewa wajib dikonfirmasi minimal H-3 sebelum berakhir.';

function generateContracts(rentals: readonly Rental[], users: readonly User[]): Contract[] {
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

function generatePayments(contracts: readonly Contract[], rentals: readonly Rental[]): Payment[] {
  return contracts.map((c, idx) => {
    const rental = rentals.find(r => r.id === c.rental_id);
    const amount = rental?.subtotal ?? 0;

    /**
     * Status pembayaran mengikuti status rental, DENGAN variasi agar fitur
     * verifikasi pembayaran staf bisa didemonstrasikan.
     */
    let status: Payment['status'];
    if (rental?.status === 'COMPLETED') status = 'PAID';
    else if (rental?.status === 'ON_GOING') status = rng() < 0.8 ? 'PAID' : 'PENDING_VERIFICATION';
    else if (rental?.status === 'APPROVED') status = rng() < 0.5 ? 'PAID' : 'PENDING_VERIFICATION';
    else if (rental?.status === 'REJECTED') status = 'FAILED';
    else status = 'UNPAID';

    // Paksa sebagian menjadi PENDING_VERIFICATION supaya antrean verifikasi
    // staf selalu terisi saat demonstrasi sidang.
    if (idx % 9 === 3 && status !== 'FAILED') status = 'PENDING_VERIFICATION';

    const paid = status === 'PAID';
    const verified = paid && rng() < 0.9;

    return {
      id: idx + 1,
      payment_code: `PAY-SBS-${c.contract_date.replace(/-/g, '')}-${String(idx + 1).padStart(3, '0')}`,
      contract_id: c.id,
      contract_code: c.contract_code,
      customer_id: c.customer_id,
      customer_name: c.customer_name,
      amount,
      payment_method: rng() < 0.7 ? 'BANK_TRANSFER' : 'QRIS',
      status,
      payment_date: paid ? isoDate(addDays(new Date(c.contract_date), intBetween(0, 5))) : isoDate(new Date(c.contract_date)),
      verified_by: verified ? pick(TEKNISI_IDS) : null,
      verified_by_name: verified ? pick(['Hendra Wijaya', 'Siska Amanda']) : undefined,
      verified_at: verified ? isoDateTime(addDays(new Date(c.contract_date), intBetween(1, 6))) : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Generator: GPS Tracking (55 titik di sekitar Banjarmasin & site tambang)
// ---------------------------------------------------------------------------

const GPS_SITES: ReadonlyArray<{ lat: number; lng: number; label: string }> = [
  { lat: -3.3167, lng: 114.5900, label: 'Banjarmasin' },
  { lat: -3.4400, lng: 114.8300, label: 'Banjarbaru' },
  { lat: -3.2800, lng: 114.5800, label: 'Trisakti' },
  { lat: -3.7000, lng: 115.2000, label: 'Tanah Bumbu' },
  { lat: -3.1500, lng: 114.6000, label: 'Alalak' },
];

function generateGps(equipments: readonly Equipment[]): GpsTracking[] {
  const rows: GpsTracking[] = [];

  for (let i = 1; i <= 55; i += 1) {
    const eq = equipments[(i - 1) % equipments.length];
    const site = GPS_SITES[i % GPS_SITES.length];
    const recorded = addDays(new Date('2026-09-04'), -intBetween(0, 3));
    recorded.setHours(intBetween(6, 20), intBetween(0, 59), 0, 0);

    // Unit yang disewa/dalam servis cenderung mesin menyala.
    const aktif = eq.status === 'RENTED' || eq.status === 'MAINTENANCE';
    const engineOn = aktif ? rng() < 0.7 : rng() < 0.15;

    rows.push({
      id: i,
      equipment_id: eq.id,
      equipment_name: eq.name,
      equipment_code: eq.equipment_code,
      latitude: Number((site.lat + between(-0.035, 0.035)).toFixed(6)),
      longitude: Number((site.lng + between(-0.035, 0.035)).toFixed(6)),
      speed: engineOn ? Number(between(0, 42).toFixed(1)) : 0,
      engine_status: engineOn ? 'ON' : 'OFF',
      fuel_level_percent: intBetween(15, 100),
      recorded_at: isoDateTime(recorded),
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Generator: Reports (20 dokumen BAST & Surat Jalan)
// ---------------------------------------------------------------------------

function generateReports(rentals: readonly Rental[]): ReportItem[] {
  const types: ReadonlyArray<ReportItem['report_type']> = ['BAST_OUT', 'BAST_IN', 'SURAT_JALAN', 'FINANCIAL_SUMMARY'];
  const rows: ReportItem[] = [];

  for (let i = 1; i <= 20; i += 1) {
    const r = rentals[(i - 1) % rentals.length];
    const generated = addDays(new Date(r.start_date), intBetween(0, 5));

    rows.push({
      id: i,
      report_code: `DOC-SBS-${isoDate(generated).replace(/-/g, '')}-${String(i).padStart(3, '0')}`,
      rental_id: r.id,
      rental_code: r.rental_code,
      report_type: types[(i - 1) % types.length],
      generated_by: pick([3, 5]),
      generated_by_name: pick(['Hendra Wijaya', 'Siska Amanda']),
      file_path: `/dokumen/SBS/${isoDate(generated)}-${String(i).padStart(3, '0')}.pdf`,
      generated_at: isoDateTime(generated),
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Ekspor Data Final
// ---------------------------------------------------------------------------

const USERS = generateUsers();
const CUSTOMER_IDS = USERS.filter(u => u.role_id === 3).map(u => u.id);
const EQUIPMENTS = generateEquipments();
const MAINTENANCE = generateMaintenance(EQUIPMENTS);
const RENTALS = generateRentals(EQUIPMENTS, CUSTOMER_IDS);

/**
 * Sinkronisasi status unit dengan data rental & servis.
 *
 * Ini adalah SUMBER KEBENARAN untuk status unit. Status acak di
 * generateEquipments() hanya titik awal; setelah rental diketahui,
 * status disesuaikan agar tidak ada inkonsistensi:
 *   - unit dengan rental AKTIF (APPROVED/ON_GOING) → RENTED
 *   - unit yang sedang diservis (IN_PROGRESS) → MAINTENANCE
 *   - unit lainnya → AVAILABLE (atau UNAVAILABLE bila ditandai demikian)
 *
 * Prioritas: MAINTENANCE > RENTED > AVAILABLE/UNAVAILABLE.
 */
function sinkronkanStatusUnit(
  equipments: Equipment[],
  rentals: readonly Rental[],
  maintenance: readonly Maintenance[]
): Equipment[] {
  const unitSedangDisewa = new Set<number>();
  for (const r of rentals) {
    if (r.status === 'ON_GOING' || r.status === 'APPROVED') {
      unitSedangDisewa.add(r.equipment_id);
    }
  }

  // Unit dengan servis yang belum selesai (sedang berjalan).
  const unitDalamServis = new Set<number>();
  for (const m of maintenance) {
    if (m.status === 'IN_PROGRESS') unitDalamServis.add(m.equipment_id);
  }

  for (const eq of equipments) {
    if (unitDalamServis.has(eq.id)) {
      eq.status = 'MAINTENANCE';
    } else if (unitSedangDisewa.has(eq.id)) {
      eq.status = 'RENTED';
    } else if (eq.status === 'RENTED') {
      // Tidak ada rental aktif lagi → kembalikan ke tersedia.
      eq.status = 'AVAILABLE';
    }
    // UNAVAILABLE dipertahankan apa adanya.
  }

  return equipments;
}

sinkronkanStatusUnit(EQUIPMENTS, RENTALS, MAINTENANCE);

const CONTRACTS = generateContracts(RENTALS, USERS);
const PAYMENTS = generatePayments(CONTRACTS, RENTALS);
const GPS = generateGps(EQUIPMENTS);
const REPORTS = generateReports(RENTALS);

export {
  USERS as GENERATED_USERS,
  EQUIPMENTS as GENERATED_EQUIPMENTS,
  RENTALS as GENERATED_RENTALS,
  CONTRACTS as GENERATED_CONTRACTS,
  PAYMENTS as GENERATED_PAYMENTS,
  MAINTENANCE as GENERATED_MAINTENANCE,
  GPS as GENERATED_GPS,
  REPORTS as GENERATED_REPORTS,
};
