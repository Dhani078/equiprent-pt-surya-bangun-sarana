/**
 * Uji mesin telemetri armada (src/lib/fleetTelemetry.ts) + T-0010.
 *
 * Fokus:
 *   1. Reduksi deret waktu — satu titik TERBARU per unit.
 *   2. Klasifikasi pergerakan, bahan bakar, dan keusangan titik.
 *   3. Penyaringan (status mesin, pergerakan, BBM, kata kunci).
 *   4. RBAC — pelanggan hanya melihat unit yang ia sewa.
 *   5. Ketahanan data — koordinat rusak / waktu kosong tidak merusak halaman.
 *   6. Konsistensi dengan data seed nyata (55 titik GPS).
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const ft = await import('../.tmp_fleetTelemetry.mjs');
const { stateStore } = await import('../.tmp_db.mjs');
const S = stateStore;

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

// ---------------------------------------------------------------------------
console.log('\n== Konstanta & Klasifikasi Pergerakan ==');
t('ambang kecepatan bergerak = 0.5', ft.MOVING_SPEED_THRESHOLD === 0.5);
t('ambang BBM rendah = 25', ft.FUEL_LOW_THRESHOLD === 25);
t('ambang BBM kritis = 15', ft.FUEL_CRITICAL_THRESHOLD === 15);
t('batas usia titik = 6 jam', ft.STALE_HOURS === 6);
t('kecepatan 0 → DIAM', ft.classifyMovement(0) === 'DIAM');
t('kecepatan 0.4 → DIAM', ft.classifyMovement(0.4) === 'DIAM');
t('kecepatan 0.5 → BERGERAK', ft.classifyMovement(0.5) === 'BERGERAK');
t('kecepatan 42 → BERGERAK', ft.classifyMovement(42) === 'BERGERAK');
t('kecepatan negatif → DIAM', ft.classifyMovement(-5) === 'DIAM');
t('kecepatan NaN → DIAM', ft.classifyMovement(NaN) === 'DIAM');
t('kecepatan string → DIAM (bukan error)', ft.classifyMovement('abc') === 'DIAM');

console.log('\n== Klasifikasi Bahan Bakar ==');
t('BBM 0 → KRITIS', ft.classifyFuel(0) === 'KRITIS');
t('BBM 14.9 → KRITIS', ft.classifyFuel(14.9) === 'KRITIS');
t('BBM 15 → RENDAH', ft.classifyFuel(15) === 'RENDAH');
t('BBM 24 → RENDAH', ft.classifyFuel(24) === 'RENDAH');
t('BBM 25 → NORMAL', ft.classifyFuel(25) === 'NORMAL');
t('BBM 100 → NORMAL', ft.classifyFuel(100) === 'NORMAL');
t('BBM negatif → KRITIS', ft.classifyFuel(-10) === 'KRITIS');
t('BBM NaN → KRITIS (aman)', ft.classifyFuel(NaN) === 'KRITIS');
t('label BBM KRITIS', ft.getFuelLabel('KRITIS') === 'BBM Kritis');
t('label BBM RENDAH', ft.getFuelLabel('RENDAH') === 'BBM Rendah');
t('label BBM NORMAL', ft.getFuelLabel('NORMAL') === 'BBM Aman');
t('label pergerakan BERGERAK', ft.getMovementLabel('BERGERAK') === 'Sedang Bergerak');
t('label pergerakan DIAM', ft.getMovementLabel('DIAM') === 'Tidak Bergerak');

console.log('\n== Format Tampilan (Locale Indonesia) ==');
t('koordinat pakai koma desimal', ft.formatCoordinate(-3.324391) === '-3,324391');
t('koordinat 6 desimal', ft.formatCoordinate(114.5).split(',')[1].length === 6);
t('koordinat NaN aman', ft.formatCoordinate(NaN) === '0,000000');
t('kecepatan pakai koma', ft.formatSpeed(12.4) === '12,4 km/jam');
t('kecepatan dibulatkan 1 desimal', ft.formatSpeed(12.44) === '12,4 km/jam');
t('kecepatan 0 → "0 km/jam"', ft.formatSpeed(0) === '0 km/jam');

// ---------------------------------------------------------------------------
console.log('\n== Normalisasi Filter ==');
t('filter default tanpa penyaringan', ft.DEFAULT_FLEET_FILTER.engine === 'ALL');
t('engine ON diterima', ft.normalizeFleetFilter({ engine: 'ON' }).engine === 'ON');
t('engine OFF diterima', ft.normalizeFleetFilter({ engine: 'OFF' }).engine === 'OFF');
t('engine palsu → ALL', ft.normalizeFleetFilter({ engine: 'NYALA' }).engine === 'ALL');
t('engine huruf kecil → ALL', ft.normalizeFleetFilter({ engine: 'on' }).engine === 'ALL');
t('movement BERGERAK diterima', ft.normalizeFleetFilter({ movement: 'BERGERAK' }).movement === 'BERGERAK');
t('movement palsu → ALL', ft.normalizeFleetFilter({ movement: 'JALAN' }).movement === 'ALL');
t('fuel KRITIS diterima', ft.normalizeFleetFilter({ fuel: 'KRITIS' }).fuel === 'KRITIS');
t('fuel palsu → ALL', ft.normalizeFleetFilter({ fuel: 'KOSONG' }).fuel === 'ALL');
t('search dipangkas spasi', ft.normalizeFleetFilter({ search: '  EXCA  ' }).search === 'EXCA');
t('search dibatasi 60 karakter', ft.normalizeFleetFilter({ search: 'x'.repeat(200) }).search.length === 60);
t('search non-string → kosong', ft.normalizeFleetFilter({ search: 123 }).search === '');
t('filter kosong → semua ALL', (() => {
  const f = ft.normalizeFleetFilter({});
  return f.engine === 'ALL' && f.movement === 'ALL' && f.fuel === 'ALL' && f.search === '';
})());

// ---------------------------------------------------------------------------
console.log('\n== Reduksi Deret Waktu: Satu Titik per Unit ==');
const titikContoh = [
  { id: 1, equipment_id: 7, equipment_name: 'Ex A', equipment_code: 'EX-A', latitude: -3.3, longitude: 114.5, speed: 10, engine_status: 'ON', fuel_level_percent: 50, recorded_at: '2026-09-04 08:00:00' },
  { id: 2, equipment_id: 7, equipment_name: 'Ex A', equipment_code: 'EX-A', latitude: -3.4, longitude: 114.6, speed: 20, engine_status: 'OFF', fuel_level_percent: 40, recorded_at: '2026-09-04 12:00:00' },
  { id: 3, equipment_id: 7, equipment_name: 'Ex A', equipment_code: 'EX-A', latitude: -3.5, longitude: 114.7, speed: 30, engine_status: 'ON', fuel_level_percent: 30, recorded_at: '2026-09-04 10:00:00' },
  { id: 4, equipment_id: 8, equipment_name: 'Ex B', equipment_code: 'EX-B', latitude: -3.6, longitude: 114.8, speed: 5, engine_status: 'OFF', fuel_level_percent: 80, recorded_at: '2026-09-04 09:00:00' },
];
const reduksi = ft.pickLatestPerUnit(titikContoh);
t('4 titik → 2 unit unik', reduksi.length === 2);
t('titik terbaru unit 7 terpilih (12:00)', reduksi.some(p => p.id === 2));
t('titik lama unit 7 dibuang', !reduksi.some(p => p.id === 1 || p.id === 3));
t('unit 8 tetap muncul', reduksi.some(p => p.id === 4));
t('hasil diurutkan per equipment_id', reduksi[0].equipment_id <= reduksi[1].equipment_id);

console.log('\n== Ketahanan Data Rusak ==');
const titikRusak = [
  { id: 1, equipment_id: 7, equipment_name: 'Ex A', equipment_code: 'EX-A', latitude: -3.3, longitude: 114.5, speed: 10, engine_status: 'ON', fuel_level_percent: 50, recorded_at: '2026-09-04 08:00:00' },
  { id: 2, equipment_id: 7, equipment_name: 'Ex A', equipment_code: 'EX-A', latitude: 999, longitude: 114.5, speed: 10, engine_status: 'ON', fuel_level_percent: 50, recorded_at: '2026-09-04 12:00:00' },
  { id: 3, equipment_id: 8, equipment_name: 'Ex B', equipment_code: 'EX-B', latitude: -3.3, longitude: 114.5, speed: 10, engine_status: 'ON', fuel_level_percent: 50, recorded_at: 'bukan-tanggal' },
  { id: 4, equipment_id: 9, equipment_name: 'Ex C', equipment_code: 'EX-C', latitude: -3.3, longitude: 114.5, speed: 10, engine_status: 'ON', fuel_level_percent: 50, recorded_at: '2026-09-04 08:00:00' },
  { id: 5, equipment_id: 0, equipment_name: 'Ex D', equipment_code: 'EX-D', latitude: -3.3, longitude: 114.5, speed: 10, engine_status: 'ON', fuel_level_percent: 50, recorded_at: '2026-09-04 08:00:00' },
];
const tahan = ft.pickLatestPerUnit(titikRusak);
t('titik latitude 999 dibuang', !tahan.some(p => p.id === 2));
t('titik waktu rusak dibuang', !tahan.some(p => p.id === 3));
t('titik equipment_id 0 dibuang', tahan.length > 0 && !tahan.some(p => p.id === 5));
t('titik valid tetap dipakai', tahan.some(p => p.id === 1) && tahan.some(p => p.id === 4));

// ---------------------------------------------------------------------------
console.log('\n== RBAC Telemetri ==');
const SEMUA = { role: 'ADMIN', equipmentIds: null };
t('ADMIN melihat seluruh titik', ft.applyTelemetryAccess(titikContoh, SEMUA).length === 4);
t('STAFF melihat seluruh titik', ft.applyTelemetryAccess(titikContoh, { role: 'STAFF', equipmentIds: null }).length === 4);
t('CUSTOMER hanya unit sewanya', ft.applyTelemetryAccess(titikContoh, { role: 'CUSTOMER', equipmentIds: [8] }).length === 1);
t('CUSTOMER tanpa sewa → 0 titik', ft.applyTelemetryAccess(titikContoh, { role: 'CUSTOMER', equipmentIds: [] }).length === 0);
t('CUSTOMER dengan daftar null → 0 titik (aman)', ft.applyTelemetryAccess(titikContoh, { role: 'CUSTOMER', equipmentIds: null }).length === 0);
t('CUSTOMER multi-unit', ft.applyTelemetryAccess(titikContoh, { role: 'CUSTOMER', equipmentIds: [7, 8] }).length === 4);

// ---------------------------------------------------------------------------
console.log('\n== Bangun Tampilan Telemetri ==');
const NOW = new Date('2026-09-04T13:00:00Z').getTime();
const view = ft.buildFleetTelemetry(titikContoh, SEMUA, ft.DEFAULT_FLEET_FILTER, NOW);
t('2 unit pada tampilan', view.rows.length === 2);
t('ringkasan total = 2', view.summary.totalUnits === 2);
t('ringkasan hitung unit diam', view.summary.idleCount + view.summary.movingCount === 2);
t('rawPointCount = 4 (titik mentah)', view.rawPointCount === 4);
t('baris punya kelas pergerakan', view.rows.every(r => r.movement === 'BERGERAK' || r.movement === 'DIAM'));
t('baris punya kelas BBM', view.rows.every(r => ['KRITIS', 'RENDAH', 'NORMAL'].includes(r.fuel)));
t('baris punya nama unit', view.rows.every(r => typeof r.equipmentName === 'string' && r.equipmentName.length > 0));
t('kecepatan tidak negatif', view.rows.every(r => r.speed >= 0));
t('BBM dibatasi 0–100', view.rows.every(r => r.fuelLevelPercent >= 0 && r.fuelLevelPercent <= 100));

console.log('\n== Penandaan Titik Usang ==');
const titikUsang = [
  { id: 1, equipment_id: 7, equipment_name: 'Ex A', equipment_code: 'EX-A', latitude: -3.3, longitude: 114.5, speed: 0, engine_status: 'OFF', fuel_level_percent: 50, recorded_at: '2026-09-04 02:00:00' },
  { id: 2, equipment_id: 8, equipment_name: 'Ex B', equipment_code: 'EX-B', latitude: -3.3, longitude: 114.5, speed: 0, engine_status: 'OFF', fuel_level_percent: 50, recorded_at: '2026-09-04 12:00:00' },
];
const vUsang = ft.buildFleetTelemetry(titikUsang, SEMUA, ft.DEFAULT_FLEET_FILTER, NOW);
const barisLama = vUsang.rows.find(r => r.equipmentId === 7);
const barisBaru = vUsang.rows.find(r => r.equipmentId === 8);
t('titik 11 jam lalu → usang', barisLama !== undefined && barisLama.isStale === true);
t('titik 1 jam lalu → segar', barisBaru !== undefined && barisBaru.isStale === false);
t('ringkasan hitung titik usang', vUsang.summary.staleCount === 1);

console.log('\n== Penyaringan ==');
const campuran = [
  { id: 1, equipment_id: 1, equipment_name: 'Excavator A', equipment_code: 'EXCA-01', latitude: -3.3, longitude: 114.5, speed: 30, engine_status: 'ON', fuel_level_percent: 80, recorded_at: '2026-09-04 12:00:00' },
  { id: 2, equipment_id: 2, equipment_name: 'Dozer B', equipment_code: 'DOZR-02', latitude: -3.3, longitude: 114.5, speed: 0, engine_status: 'OFF', fuel_level_percent: 10, recorded_at: '2026-09-04 12:00:00' },
  { id: 3, equipment_id: 3, equipment_name: 'Loader C', equipment_code: 'LOAD-03', latitude: -3.3, longitude: 114.5, speed: 0, engine_status: 'ON', fuel_level_percent: 20, recorded_at: '2026-09-04 12:00:00' },
];
const vSemua = ft.buildFleetTelemetry(campuran, SEMUA, ft.DEFAULT_FLEET_FILTER, NOW);
t('tanpa filter → 3 unit', vSemua.rows.length === 3);

const vOn = ft.buildFleetTelemetry(campuran, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, engine: 'ON' }, NOW);
t('filter mesin ON → 2 unit', vOn.rows.length === 2);
t('filter mesin ON hanya berisi ON', vOn.rows.every(r => r.engineStatus === 'ON'));

const vOff = ft.buildFleetTelemetry(campuran, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, engine: 'OFF' }, NOW);
t('filter mesin OFF → 1 unit', vOff.rows.length === 1);

const vDiam = ft.buildFleetTelemetry(campuran, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, movement: 'DIAM' }, NOW);
t('filter DIAM → 2 unit', vDiam.rows.length === 2);

const vGerak = ft.buildFleetTelemetry(campuran, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, movement: 'BERGERAK' }, NOW);
t('filter BERGERAK → 1 unit', vGerak.rows.length === 1);

const vKritis = ft.buildFleetTelemetry(campuran, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, fuel: 'KRITIS' }, NOW);
t('filter BBM KRITIS → 1 unit', vKritis.rows.length === 1);

const vRendah = ft.buildFleetTelemetry(campuran, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, fuel: 'RENDAH' }, NOW);
t('filter BBM RENDAH → 1 unit', vRendah.rows.length === 1);

const vCari = ft.buildFleetTelemetry(campuran, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, search: 'dozr' }, NOW);
t('pencarian tidak sensitif huruf → 1 unit', vCari.rows.length === 1);
t('pencarian cocok kode unit', vCari.rows[0].equipmentCode === 'DOZR-02');

const vCariNama = ft.buildFleetTelemetry(campuran, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, search: 'Loader' }, NOW);
t('pencarian cocok nama unit', vCariNama.rows.length === 1 && vCariNama.rows[0].equipmentId === 3);

const vCariId = ft.buildFleetTelemetry(campuran, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, search: '2' }, NOW);
t('pencarian cocok ID unit', vCariId.rows.length === 1 && vCariId.rows[0].equipmentId === 2);

const vCariKosong = ft.buildFleetTelemetry(campuran, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, search: 'ZZZ' }, NOW);
t('pencarian tanpa hasil → 0 unit', vCariKosong.rows.length === 0);
t('ringkasan aman saat kosong', vCariKosong.summary.totalUnits === 0);
t('rata-rata aman saat kosong', vCariKosong.summary.averageFuel === 0 && vCariKosong.summary.averageSpeed === 0);

const vGabung = ft.buildFleetTelemetry(campuran, SEMUA, { engine: 'ON', movement: 'DIAM', fuel: 'RENDAH', search: 'LOAD' }, NOW);
t('filter gabungan → 1 unit tepat', vGabung.rows.length === 1 && vGabung.rows[0].equipmentId === 3);

// ---------------------------------------------------------------------------
console.log('\n== Ringkasan Agregat ==');
const vRingkas = ft.buildFleetTelemetry(campuran, SEMUA, ft.DEFAULT_FLEET_FILTER, NOW);
t('total unit = 3', vRingkas.summary.totalUnits === 3);
t('mesin ON = 2', vRingkas.summary.engineOnCount === 2);
t('mesin OFF = 1', vRingkas.summary.engineOffCount === 1);
t('bergerak = 1', vRingkas.summary.movingCount === 1);
t('diam = 2', vRingkas.summary.idleCount === 2);
t('BBM kritis = 1', vRingkas.summary.criticalFuelCount === 1);
t('BBM rendah = 1', vRingkas.summary.lowFuelCount === 1);
t('rata-rata BBM = 36,7', vRingkas.summary.averageFuel === 36.7);
t('rata-rata kecepatan hanya unit menyala (15)', vRingkas.summary.averageSpeed === 15);

// ---------------------------------------------------------------------------
console.log('\n== Konsistensi Data Seed Nyata ==');
t('seed GPS = 55 titik', S.gps.length === 55);
t('koordinat seed valid', S.gps.every(p =>
  Number.isFinite(p.latitude) && Number.isFinite(p.longitude) &&
  Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180));
t('kecepatan seed tidak negatif', S.gps.every(p => Number(p.speed) >= 0));
t('BBM seed dalam rentang 0–100', S.gps.every(p => Number(p.fuel_level_percent) >= 0 && Number(p.fuel_level_percent) <= 100));
t('mesin OFF selalu kecepatan 0 pada seed', S.gps.every(p => p.engine_status !== 'OFF' || Number(p.speed) === 0));

const seedView = ft.buildFleetTelemetry(S.gps, SEMUA, ft.DEFAULT_FLEET_FILTER);
const unitUnik = new Set(S.gps.map(p => p.equipment_id)).size;
t('reduksi seed → sesuai jumlah unit unik', seedView.rows.length === unitUnik);
t('reduksi seed tidak melebihi titik mentah', seedView.rows.length <= S.gps.length);
t('seed: ringkasan total = jumlah baris', seedView.summary.totalUnits === seedView.rows.length);
t('seed: ON + OFF = total', seedView.summary.engineOnCount + seedView.summary.engineOffCount === seedView.summary.totalUnits);
t('seed: gerak + diam = total', seedView.summary.movingCount + seedView.summary.idleCount === seedView.summary.totalUnits);
t('seed: rata-rata BBM masuk akal', seedView.summary.averageFuel > 0 && seedView.summary.averageFuel <= 100);
t('seed: setiap baris punya ID titik', seedView.rows.every(r => Number.isFinite(r.id)));
t('seed: tidak ada equipment_id duplikat', new Set(seedView.rows.map(r => r.equipmentId)).size === seedView.rows.length);

console.log('\n== Filter pada Data Nyata ==');
const seedOn = ft.buildFleetTelemetry(S.gps, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, engine: 'ON' }, NOW);
t('seed: filter ON mengurangi atau sama dengan total', seedOn.rows.length <= seedView.rows.length);
t('seed: filter ON hanya berisi ON', seedOn.rows.every(r => r.engineStatus === 'ON'));
const seedGerak = ft.buildFleetTelemetry(S.gps, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, movement: 'BERGERAK' }, NOW);
t('seed: filter BERGERAK konsisten', seedGerak.rows.every(r => r.speed >= ft.MOVING_SPEED_THRESHOLD));
const seedCari = ft.buildFleetTelemetry(S.gps, SEMUA, { ...ft.DEFAULT_FLEET_FILTER, search: 'EXCA' }, NOW);
t('seed: pencarian EXCA menghasilkan baris', seedCari.rows.length > 0);
t('seed: hasil pencarian cocok kata kunci',
  seedCari.rows.every(r => r.equipmentCode.toLowerCase().includes('exca')));

console.log('\n== Isolasi Pelanggan pada Data Nyata ==');
const pelangganKosong = ft.buildFleetTelemetry(S.gps, { role: 'CUSTOMER', equipmentIds: [] }, ft.DEFAULT_FLEET_FILTER);
t('pelanggan tanpa sewa → 0 baris', pelangganKosong.rows.length === 0);
t('pelanggan tanpa sewa → ringkasan kosong', pelangganKosong.summary.totalUnits === 0);
const pelangganSatu = ft.buildFleetTelemetry(S.gps, { role: 'CUSTOMER', equipmentIds: [1] }, ft.DEFAULT_FLEET_FILTER);
t('pelanggan 1 unit → maksimal 1 baris', pelangganSatu.rows.length <= 1);
t('pelanggan hanya melihat unitnya', pelangganSatu.rows.every(r => r.equipmentId === 1));

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
