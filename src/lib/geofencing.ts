/**
 * Mesin Geofencing Armada (T-0060) — PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Modul MURNI: tidak menyentuh DOM, tidak memanggil jaringan, tidak membaca
 * basis data. Menerima koordinat & zona, mengembalikan pelanggaran.
 * Dipakai bersama oleh:
 *   1. Halaman pelacakan GPS  (`src/pages/admin/GpsTrackingPage.tsx`)
 *   2. Edge API               `GET /api/tracking`  (penyanding server)
 *
 * Mengapa modul ini ada:
 * sewaan harian keluar dari area proyek yang disepakati adalah indikator
 * penyalahgunaan unit paling awal yang bisa dideteksi sistem — sebelum
 * keterlambatan pengembalian, sebelum lonjakan HM. Tanpa geofencing,
 * operator hanya tahu setelah unit terlambat. Dengan geofencing, operator
 * tahu saat unit keluar zona.
 *
 * Pendekatan: jarak haversine terhadap titik tengah zona (bukan polygon).
 * Pertimbangan: site proyek alat berat padat karya (tambang, tol, bendungan)
 * selalu didefinisikan sebagai radius operasional dari titik koordinasi
 * site, dan data yang dipakai aplikasi adalah titik rekam GPS diskrit.
 * Ray-casting polygon butuh array titik berurut per zona (input yang tidak
 * dimiliki sistem), sedangkan haversine hanya butuh lat/lng/radius meter
 * yang sudah ada di tiap baris telemetri.
 *
 *   ponytail: hanya cek keluar MASUK zona (point-in-circle).
 *   Zona tidak bertumpuk → unit dianggap keluar dari zona terluar yang
 *   masih memuatnya. Naik ke polygon + ray-casting bila site proyek
 *   berbentuk tidak beraturan dan punya daftar titik sudut.
 */

import type { FleetTelemetryRow } from './fleetTelemetry';

// ---------------------------------------------------------------------------
// Konstanta & Tipe
// ---------------------------------------------------------------------------

/**
 * Radius default zona site (meter) bila zona tidak menentukan sendiri.
 * 2 km adalah jangkauan operasional wajar sebuah site proyek alat berat.
 */
export const DEFAULT_SITE_RADIUS_M = 2000;

/**
 * Jarak minimum (meter) yang dianggap "di dalam" zona dengan toleransi.
 *
 * GPS memiliki akurasi beberapa meter (5–10 m pada perangkat baik, lebih
 * pada perangkat murah). Tanpa toleransi, unit yang beroperasi tepat di
 * batas zona memunculkan puluhan false positive karena noise satelit.
 * 50 meter membuang noise navigasi sipil tanpa menyembunyikan perpindahan
 * sungguhan sejauh beberapa ratus meter.
 */
export const GEOFENCE_TOLERANCE_M = 50;

/** Jenis zona geofencing. */
export type SiteZoneKind = 'PROYEK' | 'BENGKEL' | 'DEPO';

/** Definisi zona site — lingkaran dengan titik tengah & radius. */
export interface SiteZone {
  /** Identitas stabil zona (untuk React key & laporan). */
  id: string;
  /** Nama site yang tampil di UI. */
  nama: string;
  kind: SiteZoneKind;
  latitude: number;
  longitude: number;
  /** Radius zona dalam meter. */
  radius_m: number;
}

/**
 * Satu pelanggaran geofencing: unit terdeteksi di luar semua zona yang
 * seharusnya memuatnya.
 */
export interface GeofenceBreach {
  /** ID baris telemetri (titik rekam terbaru unit). */
  id: number;
  equipmentId: number;
  equipmentName: string;
  equipmentCode: string;
  latitude: number;
  longitude: number;
  /** Jarak (meter) ke zona terdekat. */
  jarakMeter: number;
  /** Zona terdekat — fallback ke "Tidak Ada Zona" bila tidak ada zona sama sekali. */
  zonaTerdekat: string;
  /** Waktu rekam titik (string basis data apa adanya). */
  recordedAt: string;
}

// ---------------------------------------------------------------------------
// Zona Bawaan Wilayah Operasional (Kalsel)
// ---------------------------------------------------------------------------

/**
 * Zona site bawaan — titik koordinat area operasional utama perusahaan.
 *
 * Sumber: koordinat kota/wilayah di Kalimantan Selatan tempat unit
 * perusahaan beroperasi (lihat footer GpsTrackingPage: Banjarmasin,
 * Banjarbaru, Batola, Tanah Bumbu, Tabalong). Radius 15 km dipakai untuk
 * zona kota karena unit berpindah antar proyek dalam satu wilayah kota,
 * dan 1,5 km untuk bengkel pusat (gerakan hanya di dalam kompleks).
 *
 * Zona ini dipakai saat aplikasi tidak memiliki tabel zona di basis data;
 * pengelolaan zona lewat UI admin adalah tugas terpisah (lihat STATE).
 */
export const DEFAULT_SITE_ZONES: readonly SiteZone[] = [
  { id: 'BJM-PUSAT', nama: 'Banjarmasin Pusat', kind: 'PROYEK', latitude: -3.319437, longitude: 114.590832, radius_m: 15000 },
  { id: 'BJB-ANGGANG', nama: 'Banjarbaru / Liang Anggang', kind: 'PROYEK', latitude: -3.4555, longitude: 114.8112, radius_m: 15000 },
  { id: 'BTL-BARITO', nama: 'Kab. Barito Kuala', kind: 'PROYEK', latitude: -3.2875, longitude: 114.7750, radius_m: 15000 },
  { id: 'TNB-BUMBU', nama: 'Kab. Tanah Bumbu', kind: 'PROYEK', latitude: -3.7167, longitude: 115.5167, radius_m: 20000 },
  { id: 'TBL-ALONG', nama: 'Kab. Tabalong', kind: 'PROYEK', latitude: -1.8000, longitude: 115.2833, radius_m: 20000 },
  { id: 'SBS-BENGKEL', nama: 'Bengkel Pusat SBS', kind: 'BENGKEL', latitude: -3.324391, longitude: 114.558394, radius_m: 1500 },
];

// ---------------------------------------------------------------------------
// Matematika Bumi
// ---------------------------------------------------------------------------

/** Radius rata-rata bumi (meter) — nilai standar IUGG. */
const R_BUMI = 6371000;

/** Derajat → radian. */
function toRad(nilai: number): number {
  return (nilai * Math.PI) / 180;
}

/**
 * Jarak dua titik di permukaan bumi (meter) — rumus haversine.
 *
 * Haversine dipilih (bukan equirectangular) karena Kalsel berada beberapa
 * derajat dari katulistiwa namun aplikasi menghitung jarak hingga belasan
 * km; rumus ini akurat untuk jarak apapun yang relevan bagi alat berat.
 */
export function haversineMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_BUMI * c;
}

/**
 * Jarak unit ke sebuah zona (meter), diukung dari titik tengah zona.
 * `Infinity` bila koordinat zona tidak valid.
 */
export function jarakKeZona(
  latitude: number,
  longitude: number,
  zona: SiteZone
): number {
  if (!Number.isFinite(zona.latitude) || !Number.isFinite(zona.longitude)) return Infinity;
  return haversineMeter(latitude, longitude, zona.latitude, zona.longitude);
}

/**
 * Apakah sebuah titik berada di dalam zona (dengan toleransi GPS)?
 *
 * Toleransi ditarik KEDUA arah (masuk & keluar) sehingga unit di tepi
 * zona tidak terus-menerus toggle status antar titik rekam.
 */
export function diDalamZona(
  latitude: number,
  longitude: number,
  zona: SiteZone,
  toleransiMeter: number = GEOFENCE_TOLERANCE_M
): boolean {
  const radiusEfektif = zona.radius_m + toleransiMeter;
  return jarakKeZona(latitude, longitude, zona) <= radiusEfektif;
}

// ---------------------------------------------------------------------------
// Deteksi Pelanggaran
// ---------------------------------------------------------------------------

/**
 * Menyaring zona yang koordinatnya tidak valid atau konfigurasinya rusak.
 *
 * Zona tidak dipercaya mentah-mentah: data zona bisa datang dari basis
 * data, dan satu zona dengan radius negatif tidak boleh menggagalkan
 * seluruh perhitungan.
 */
export function zonaValid(zona: SiteZone): boolean {
  if (typeof zona.id !== 'string' || zona.id.trim() === '') return false;
  if (typeof zona.nama !== 'string' || zona.nama.trim() === '') return false;
  if (!Number.isFinite(zona.latitude) || Math.abs(zona.latitude) > 90) return false;
  if (!Number.isFinite(zona.longitude) || Math.abs(zona.longitude) > 180) return false;
  if (!Number.isFinite(zona.radius_m) || zona.radius_m <= 0) return false;
  return true;
}

/**
 * Mencari zona terdekat yang memuat sebuah titik.
 *
 * Mengembalikan `null` bila titik di luar semua zona (atau tidak ada zona
 * valid sama sekali) — itulah kondisi yang melahirkan sebuah breach.
 */
function zonaMemuat(
  latitude: number,
  longitude: number,
  zones: readonly SiteZone[]
): { zona: SiteZone; jarak: number } | null {
  let terbaik: { zona: SiteZone; jarak: number } | null = null;

  for (const zona of zones) {
    if (!zonaValid(zona)) continue;
    const jarak = jarakKeZona(latitude, longitude, zona);
    if (jarak > zona.radius_m + GEOFENCE_TOLERANCE_M) continue;

    // Bila beberapa zona bertumpuk, ambil zona terdekat (paling spesifik).
    if (terbaik === null || jarak < terbaik.jarak) {
      terbaik = { zona, jarak };
    }
  }

  return terbaik;
}

/**
 * Mendeteksi unit yang berada di luar seluruh zona site.
 *
 * Satu baris telemetri = satu unit (sudah direduksi oleh
 * `pickLatestPerUnit` di modul fleetTelemetry), sehingga hasilnya satu
 * breach per unit, bukan banyak breach untuk unit yang sama.
 *
 * Mengembalikan daftar terurut: pelanggaran terjauh dari zona lebih dulu
 * (unit yang paling jauh dari area operasional = prioritas tertinggi).
 */
export function detectGeofenceBreaches(
  rows: ReadonlyArray<FleetTelemetryRow>,
  zones: ReadonlyArray<SiteZone> = DEFAULT_SITE_ZONES
): GeofenceBreach[] {
  const zonaBersih = zones.filter(zonaValid);
  if (zonaBersih.length === 0) return [];

  const pelanggaran: GeofenceBreach[] = [];

  for (const row of rows) {
    if (!Number.isFinite(row.latitude) || !Number.isFinite(row.longitude)) continue;
    if (Math.abs(row.latitude) > 90 || Math.abs(row.longitude) > 180) continue;

    const tempat = zonaMemuat(row.latitude, row.longitude, zonaBersih);
    if (tempat !== null) continue; // unit di dalam zona → bukan pelanggaran

    // Unit di luar semua zona: cari zona terdekat untuk laporan jarak.
    let terdekat: { zona: SiteZone; jarak: number } | null = null;
    for (const zona of zonaBersih) {
      const jarak = jarakKeZona(row.latitude, row.longitude, zona);
      if (terdekat === null || jarak < terdekat.jarak) terdekat = { zona, jarak };
    }
    if (terdekat === null) continue;

    pelanggaran.push({
      id: row.id,
      equipmentId: row.equipmentId,
      equipmentName: row.equipmentName,
      equipmentCode: row.equipmentCode,
      latitude: row.latitude,
      longitude: row.longitude,
      jarakMeter: Math.round(terdekat.jarak),
      zonaTerdekat: terdekat.zona.nama,
      recordedAt: row.recordedAt,
    });
  }

  return pelanggaran.sort((a, b) => b.jarakMeter - a.jarakMeter);
}

/**
 * Ringkasan status geofencing armada untuk kepala halaman pelacakan.
 */
export interface GeofenceSummary {
  /** Banyak unit yang sedang di luar semua zona site. */
  jumlahBreach: number;
  /** Banyak zona valid yang dipakai perhitungan. */
  jumlahZona: number;
  /** Jarak (meter) pelanggaran terjauh dari zona terdekat. */
  jarakTerjauhMeter: number;
}

/** Menghitung ringkasan geofencing dari daftar pelanggaran. */
export function summarizeGeofence(
  breaches: ReadonlyArray<GeofenceBreach>,
  zones: ReadonlyArray<SiteZone> = DEFAULT_SITE_ZONES
): GeofenceSummary {
  const jarakTerjauhMeter = breaches.reduce((maks, b) => Math.max(maks, b.jarakMeter), 0);
  return {
    jumlahBreach: breaches.length,
    jumlahZona: zones.filter(zonaValid).length,
    jarakTerjauhMeter,
  };
}

/**
 * Memformat jarak (meter) menjadi teks siap tampil dalam Bahasa Indonesia.
 *
 * Mengikuti konvensi desimal koma yang dipakai seluruh aplikasi
 * (lihat `formatCoordinate` & `formatSpeed` di modul fleetTelemetry).
 */
export function formatJarakZona(meter: number): string {
  if (!Number.isFinite(meter)) return '-';
  if (meter < 1000) return `${Math.round(meter)} m`;
  const km = meter / 1000;
  return `${(Math.round(km * 10) / 10).toString().replace('.', ',')} km`;
}
