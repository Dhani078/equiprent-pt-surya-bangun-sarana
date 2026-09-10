/**
 * Mesin Telemetri Armada GPS (T-0010)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Modul MURNI: tidak menyentuh DOM, tidak memanggil jaringan, tidak
 * mengambil data sendiri. Dipakai bersama oleh:
 *   1. Edge API  `GET /api/tracking`                 (sumber kebenaran)
 *   2. Halaman Pelacakan GPS Admin & Staf            (src/pages/admin/GpsTrackingPage.tsx)
 *   3. Portal Pelanggan                              (lacak unit miliknya sendiri)
 *
 * Alasan modul ini ada:
 * data GPS adalah DERET WAKTU — satu unit bisa memiliki banyak titik rekam.
 * Sebelum T-0010, halaman pelacakan mengambil `trackingData[0]` dan
 * menampilkan seluruh baris mentah apa adanya, sehingga
 *   - peta memunculkan banyak marker untuk unit yang sama;
 *   - tidak ada cara membedakan titik rekam terbaru dari yang sudah usang;
 *   - tidak ada filter status mesin (syarat kelulusan T-0010);
 *   - pelanggan berpotensi melihat posisi unit pelanggan lain.
 * Sekarang satu modul yang diuji menentukan titik terbaru, klasifikasi
 * pergerakan/bahan bakar, penyaringan, dan batas akses per peran.
 */

import type { GpsTracking } from '../types';

// ---------------------------------------------------------------------------
// Konstanta Operasional
// ---------------------------------------------------------------------------

/**
 * Ambang kecepatan (km/jam) yang membedakan unit bergerak dari unit diam.
 * 0.5 dipakai (bukan 0) karena pembacaan GPS diam sering berfluktuasi
 * beberapa desimal akibat noise satelit.
 */
export const MOVING_SPEED_THRESHOLD = 0.5;

/** Bahan bakar di bawah nilai ini (%) berstatus RENDAH. */
export const FUEL_LOW_THRESHOLD = 25;

/** Bahan bakar di bawah nilai ini (%) berstatus KRITIS. */
export const FUEL_CRITICAL_THRESHOLD = 15;

/**
 * Batas usia titik rekam (jam) sebelum dianggap usang.
 * Unit yang titiknya lebih tua dari ini ditandai agar operator tidak
 * mengira posisinya masih aktual.
 */
export const STALE_HOURS = 6;

/** Jumlah digit desimal koordinat yang ditampilkan. */
const COORDINATE_DIGITS = 6;

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

/** Pergerakan unit berdasar kecepatan & status mesin. */
export type MovementClass = 'BERGERAK' | 'DIAM';

/** Kelas bahan bakar untuk pewarnaan badge. */
export type FuelClass = 'KRITIS' | 'RENDAH' | 'NORMAL';

/** Filter yang dapat dipilih pengguna pada halaman pelacakan. */
export interface FleetTelemetryFilter {
  /** Status mesin: SEMUA, ON, atau OFF. */
  engine: 'ALL' | 'ON' | 'OFF';
  /** Pergerakan: SEMUA, BERGERAK, atau DIAM. */
  movement: 'ALL' | MovementClass;
  /** Kelas bahan bakar: SEMUA, KRITIS, RENDAH, atau NORMAL. */
  fuel: 'ALL' | FuelClass;
  /** Kata kunci bebas: kode unit, nama unit, atau ID titik. */
  search: string;
}

/** Filter bawaan — tidak ada penyaringan apa pun. */
export const DEFAULT_FLEET_FILTER: FleetTelemetryFilter = {
  engine: 'ALL',
  movement: 'ALL',
  fuel: 'ALL',
  search: '',
};

/** Baris telemetri yang sudah dinormalkan & diklasifikasi. */
export interface FleetTelemetryRow {
  /** ID titik rekam asli (dipakai sebagai key pada daftar & marker). */
  id: number;
  equipmentId: number;
  equipmentName: string;
  equipmentCode: string;
  latitude: number;
  longitude: number;
  /** Kecepatan dalam km/jam, sudah dibulatkan 1 desimal. */
  speed: number;
  engineStatus: GpsTracking['engine_status'];
  /** Bahan bakar dalam persen, sudah dibulatkan ke bilangan bulat. */
  fuelLevelPercent: number;
  recordedAt: string;
  movement: MovementClass;
  fuel: FuelClass;
  /** True bila titik rekam lebih tua dari STALE_HOURS. */
  isStale: boolean;
}

/** Ringkasan agregat yang ditampilkan di kepala halaman pelacakan. */
export interface FleetTelemetrySummary {
  totalUnits: number;
  engineOnCount: number;
  engineOffCount: number;
  movingCount: number;
  idleCount: number;
  lowFuelCount: number;
  criticalFuelCount: number;
  staleCount: number;
  /** Rata-rata bahan bakar seluruh unit terlihat (%). 0 bila kosong. */
  averageFuel: number;
  /** Rata-rata kecepatan unit yang mesinnya menyala (km/jam). */
  averageSpeed: number;
}

/** Hasil akhir yang dikirim API maupun dipakai komponen. */
export interface FleetTelemetryView {
  rows: FleetTelemetryRow[];
  summary: FleetTelemetrySummary;
  /** Filter yang benar-benar dipakai (sudah dinormalkan). */
  filter: FleetTelemetryFilter;
  /** Banyak titik mentah sebelum direduksi ke satu titik per unit. */
  rawPointCount: number;
}

/**
 * Batas akses per peran.
 *
 * `equipmentIds` berisi unit yang boleh dilihat. `null` berarti seluruh
 * armada — wewenang ADMIN & STAFF yang bertindak atas nama perusahaan.
 * Pelanggan menerima daftar unit yang SEDANG ia sewa; tanpa pembatasan ini
 * pelanggan dapat melihat posisi armada pelanggan lain.
 */
export interface TelemetryAccess {
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  equipmentIds: readonly number[] | null;
}

// ---------------------------------------------------------------------------
// Helper Aman (data GPS bisa rusak walau sudah divalidasi di pintu masuk)
// ---------------------------------------------------------------------------

/** Mengubah nilai tak dikenal menjadi angka valid; `fallback` bila gagal. */
function toSafeNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Mengubah nilai tak dikenal menjadi koordinat valid (atau null). */
function toCoordinate(value: unknown, batas: number): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > batas) return null;
  return n;
}

/**
 * Mengubah nilai waktu menjadi timestamp (ms).
 * Mengembalikan null bila tidak bisa diparse — titik rusak tidak boleh
 * menghentikan seluruh halaman.
 */
function toTimestamp(value: unknown): number | null {
  if (typeof value !== 'string' || value === '') return null;

  // Format basis data: "2026-09-04 08:30:00" (tanpa penanda zona).
  //
  // Dua masalah sekaligus diselesaikan di sini:
  //   1. Beberapa mesin JS menolak/memparse berbeda tanggal dengan spasi,
  //      sehingga spasi diganti "T".
  //   2. Tanpa penanda zona, JS menafsirkan sebagai waktu LOKAL sehingga
  //      hasilnya bergeser mengikuti zona server — jam 12:00 bisa terbaca
  //      sebagai 05:00 UTC dan unit tiba-tiba dianggap usang. Karena seluruh
  //      waktu sistem dibangkitkan dengan `toISOString()` (UTC), nilai tanpa
  //      penanda zona ditafsirkan sebagai UTC agar hasilnya deterministik di
  //      mesin mana pun.
  const punyaZona = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  const normal = value.includes('T') ? value : value.replace(' ', 'T');
  const time = new Date(punyaZona ? normal : `${normal}Z`).getTime();
  return Number.isFinite(time) ? time : null;
}

// ---------------------------------------------------------------------------
// Klasifikasi
// ---------------------------------------------------------------------------

/** Menentukan kelas pergerakan dari kecepatan. */
export function classifyMovement(speed: number): MovementClass {
  return toSafeNumber(speed, 0) >= MOVING_SPEED_THRESHOLD ? 'BERGERAK' : 'DIAM';
}

/** Menentukan kelas bahan bakar dari persentase. */
export function classifyFuel(percent: number): FuelClass {
  const pct = toSafeNumber(percent, 0);
  if (pct < FUEL_CRITICAL_THRESHOLD) return 'KRITIS';
  if (pct < FUEL_LOW_THRESHOLD) return 'RENDAH';
  return 'NORMAL';
}

/** Label siap tampil untuk kelas bahan bakar. */
export function getFuelLabel(kelas: FuelClass): string {
  switch (kelas) {
    case 'KRITIS':
      return 'BBM Kritis';
    case 'RENDAH':
      return 'BBM Rendah';
    case 'NORMAL':
      return 'BBM Aman';
  }
}

/** Label siap tampil untuk kelas pergerakan. */
export function getMovementLabel(kelas: MovementClass): string {
  return kelas === 'BERGERAK' ? 'Sedang Bergerak' : 'Tidak Bergerak';
}

/** Format koordinat menjadi teks siap tampil, mis. `-3,324391`. */
export function formatCoordinate(value: number): string {
  const n = toSafeNumber(value, 0);
  // Koma desimal mengikuti penulisan Indonesia (§4.3 poin 9).
  return n.toFixed(COORDINATE_DIGITS).replace('.', ',');
}

/** Format kecepatan menjadi teks siap tampil, mis. `12,4 km/jam`. */
export function formatSpeed(value: number): string {
  const n = toSafeNumber(value, 0);
  return `${Math.round(n * 10) / 10}`.replace('.', ',') + ' km/jam';
}

// ---------------------------------------------------------------------------
// Normalisasi Filter
// ---------------------------------------------------------------------------

const ENGINE_OPTIONS: ReadonlyArray<FleetTelemetryFilter['engine']> = ['ALL', 'ON', 'OFF'];
const MOVEMENT_OPTIONS: ReadonlyArray<FleetTelemetryFilter['movement']> = ['ALL', 'BERGERAK', 'DIAM'];
const FUEL_OPTIONS: ReadonlyArray<FleetTelemetryFilter['fuel']> = ['ALL', 'KRITIS', 'RENDAH', 'NORMAL'];

/** Banyaknya karakter maksimal kata kunci pencarian. */
export const SEARCH_MAX_LENGTH = 60;

/** Mengambil nilai filter dari query string yang tidak bisa dipercaya. */
export function normalizeFleetFilter(raw: {
  engine?: unknown;
  movement?: unknown;
  fuel?: unknown;
  search?: unknown;
}): FleetTelemetryFilter {
  const engine = ENGINE_OPTIONS.find((o) => o === raw.engine) ?? 'ALL';
  const movement = MOVEMENT_OPTIONS.find((o) => o === raw.movement) ?? 'ALL';
  const fuel = FUEL_OPTIONS.find((o) => o === raw.fuel) ?? 'ALL';

  const search =
    typeof raw.search === 'string' ? raw.search.trim().slice(0, SEARCH_MAX_LENGTH) : '';

  return { engine, movement, fuel, search };
}

// ---------------------------------------------------------------------------
// Reduksi Deret Waktu: satu titik terbaru per unit
// ---------------------------------------------------------------------------

/** Baris mentah yang sudah lolos pemeriksaan koordinat & waktu. */
interface CleanPoint {
  id: number;
  equipmentId: number;
  equipmentName: string;
  equipmentCode: string;
  latitude: number;
  longitude: number;
  speed: number;
  engineStatus: GpsTracking['engine_status'];
  fuelLevelPercent: number;
  recordedAt: string;
  timestamp: number;
}

/** Membuang titik yang koordinatnya tidak valid agar peta tidak rusak. */
function toCleanPoint(point: GpsTracking, index: number): CleanPoint | null {
  const latitude = toCoordinate(point.latitude, 90);
  const longitude = toCoordinate(point.longitude, 180);
  if (latitude === null || longitude === null) return null;

  const timestamp = toTimestamp(point.recorded_at);
  if (timestamp === null) return null;

  const equipmentId = Math.trunc(toSafeNumber(point.equipment_id, 0));
  if (equipmentId <= 0) return null;

  return {
    id: Math.trunc(toSafeNumber(point.id, index + 1)),
    equipmentId,
    equipmentName:
      typeof point.equipment_name === 'string' && point.equipment_name.trim() !== ''
        ? point.equipment_name
        : `Unit #${equipmentId}`,
    equipmentCode:
      typeof point.equipment_code === 'string' && point.equipment_code.trim() !== ''
        ? point.equipment_code
        : `UNIT-${String(equipmentId).padStart(3, '0')}`,
    latitude,
    longitude,
    speed: Math.max(0, toSafeNumber(point.speed, 0)),
    engineStatus: point.engine_status === 'ON' ? 'ON' : 'OFF',
    fuelLevelPercent: Math.min(100, Math.max(0, toSafeNumber(point.fuel_level_percent, 0))),
    recordedAt: point.recorded_at,
    timestamp,
  };
}

/**
 * Memilih SATU titik terbaru untuk setiap unit.
 *
 * Tanpa reduksi ini peta akan memunculkan banyak marker bertumpuk untuk
 * unit yang sama dan panel telemetri bisa menunjukkan posisi yang sudah
 * berhari-hari lampau.
 */
export function pickLatestPerUnit(
  points: ReadonlyArray<GpsTracking>
): GpsTracking[] {
  const latest = new Map<number, { point: GpsTracking; timestamp: number }>();

  points.forEach((point, index) => {
    const clean = toCleanPoint(point, index);
    if (clean === null) return;

    const current = latest.get(clean.equipmentId);
    // Titik dengan waktu sama (bisa terjadi pada impor massal) diselesaikan
    // dengan ID lebih besar sebagai rekam yang lebih baru.
    if (
      current === undefined ||
      clean.timestamp > current.timestamp ||
      (clean.timestamp === current.timestamp && clean.id > current.point.id)
    ) {
      latest.set(clean.equipmentId, { point, timestamp: clean.timestamp });
    }
  });

  return [...latest.values()]
    .sort((a, b) => a.point.equipment_id - b.point.equipment_id)
    .map((entry) => entry.point);
}

// ---------------------------------------------------------------------------
// Akses Berbasis Peran (RBAC)
// ---------------------------------------------------------------------------

/**
 * Menyaring titik GPS berdasarkan hak akses.
 *
 * ADMIN & STAFF melihat seluruh armada. Pelanggan HANYA melihat unit yang
 * sedang ia sewa — diputuskan di server, bukan di klien.
 */
export function applyTelemetryAccess(
  points: ReadonlyArray<GpsTracking>,
  access: TelemetryAccess
): GpsTracking[] {
  if (access.role === 'ADMIN' || access.role === 'STAFF') return [...points];
  if (access.equipmentIds === null) return [];

  const allowed = new Set(access.equipmentIds);
  return points.filter((p) => allowed.has(p.equipment_id));
}

// ---------------------------------------------------------------------------
// Penyaringan & Ringkasan
// ---------------------------------------------------------------------------

/** Membuang spasi & huruf besar-kecil agar pencarian tidak sensitif. */
function normalizeSearchText(value: string): string {
  return value.toLowerCase();
}

/** Memeriksa apakah sebuah baris cocok dengan kata kunci pencarian. */
function matchesSearch(row: FleetTelemetryRow, keyword: string): boolean {
  if (keyword === '') return true;
  const target = normalizeSearchText(keyword);
  return (
    normalizeSearchText(row.equipmentCode).includes(target) ||
    normalizeSearchText(row.equipmentName).includes(target) ||
    String(row.equipmentId).includes(target)
  );
}

/** Menyaring baris telemetri sesuai filter yang dipilih pengguna. */
export function filterFleetRows(
  rows: ReadonlyArray<FleetTelemetryRow>,
  filter: FleetTelemetryFilter
): FleetTelemetryRow[] {
  return rows.filter((row) => {
    if (filter.engine !== 'ALL' && row.engineStatus !== filter.engine) return false;
    if (filter.movement !== 'ALL' && row.movement !== filter.movement) return false;
    if (filter.fuel !== 'ALL' && row.fuel !== filter.fuel) return false;
    return matchesSearch(row, filter.search);
  });
}

/** Menghitung ringkasan agregat dari baris yang tampil. */
export function summarizeFleet(
  rows: ReadonlyArray<FleetTelemetryRow>
): FleetTelemetrySummary {
  const withEngine = rows.filter((r) => r.engineStatus === 'ON');

  const totalFuel = rows.reduce((sum, r) => sum + r.fuelLevelPercent, 0);
  const totalSpeed = withEngine.reduce((sum, r) => sum + r.speed, 0);

  const round1 = (value: number): number => Math.round(value * 10) / 10;

  return {
    totalUnits: rows.length,
    engineOnCount: withEngine.length,
    engineOffCount: rows.length - withEngine.length,
    movingCount: rows.filter((r) => r.movement === 'BERGERAK').length,
    idleCount: rows.filter((r) => r.movement === 'DIAM').length,
    lowFuelCount: rows.filter((r) => r.fuel === 'RENDAH').length,
    criticalFuelCount: rows.filter((r) => r.fuel === 'KRITIS').length,
    staleCount: rows.filter((r) => r.isStale).length,
    averageFuel: rows.length === 0 ? 0 : round1(totalFuel / rows.length),
    averageSpeed: withEngine.length === 0 ? 0 : round1(totalSpeed / withEngine.length),
  };
}

// ---------------------------------------------------------------------------
// Inti: Bangun Tampilan Telemetri Armada
// ---------------------------------------------------------------------------

/**
 * Menyusun tampilan telemetri armada dari data mentah.
 *
 * Urutan pemrosesan:
 *   1. Batasi sesuai hak akses peran (RBAC di sisi server).
 *   2. Reduksi ke satu titik terbaru per unit.
 *   3. Klasifikasi pergerakan, bahan bakar, dan keusangan titik.
 *   4. Terapkan filter pengguna.
 *   5. Hitung ringkasan.
 *
 * `now` disuntikkan (bukan dibaca langsung) agar hasilnya deterministik dan
 * mudah diuji pada tanggal berapa pun.
 */
export function buildFleetTelemetry(
  points: ReadonlyArray<GpsTracking>,
  access: TelemetryAccess,
  filter: FleetTelemetryFilter = DEFAULT_FLEET_FILTER,
  now: number = Date.now()
): FleetTelemetryView {
  const visible = applyTelemetryAccess(points, access);
  const latest = pickLatestPerUnit(visible);

  const staleLimit = Number.isFinite(now) ? now - STALE_HOURS * 60 * 60 * 1000 : 0;

  const rows: FleetTelemetryRow[] = latest.map((point, index) => {
    const clean = toCleanPoint(point, index);
    const latitude = clean?.latitude ?? 0;
    const longitude = clean?.longitude ?? 0;
    const speed = Math.round(toSafeNumber(point.speed, 0) * 10) / 10;
    const fuelPercent = Math.round(toSafeNumber(point.fuel_level_percent, 0));
    const timestamp = clean?.timestamp ?? null;

    return {
      id: clean?.id ?? index + 1,
      equipmentId: clean?.equipmentId ?? 0,
      equipmentName: clean?.equipmentName ?? 'Unit tidak dikenal',
      equipmentCode: clean?.equipmentCode ?? '-',
      latitude,
      longitude,
      speed,
      engineStatus: clean?.engineStatus ?? 'OFF',
      fuelLevelPercent: fuelPercent,
      recordedAt: point.recorded_at,
      movement: classifyMovement(speed),
      fuel: classifyFuel(fuelPercent),
      isStale: timestamp !== null ? timestamp < staleLimit : true,
    };
  });

  const filtered = filterFleetRows(rows, filter);

  return {
    rows: filtered,
    summary: summarizeFleet(filtered),
    filter,
    rawPointCount: visible.length,
  };
}
