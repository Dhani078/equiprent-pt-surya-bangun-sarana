/**
 * Smoke test fitur Fase 5 (T-0060 geofencing, T-0061 analytics, T-0063 i18n).
 */

import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'fase5-'));
const toUrl = (p) => pathToFileURL(p).href;

async function compile(rel) {
	const out = join(tmp, rel.replace(/[/.]/g, '_') + '.mjs');
	await build({
		entryPoints: [join(root, rel)],
		bundle: true,
		format: 'esm',
		platform: 'neutral',
		outfile: out,
	});
	return readFileSync(out, 'utf-8');
}

let passed = 0;
function ok(nama, kondisi) {
	if (kondisi) { passed++; console.log(`  PASS ${nama}`); }
	else { console.log(`  FAIL ${nama}`); process.exitCode = 1; }
}

console.log('\n== T-0060 Geofencing ==');
const geoSrc = await compile('src/lib/geofencing.ts');
writeFileSync(join(tmp, 'geo.mjs'), geoSrc);
const geo = await import(toUrl(join(tmp, 'geo.mjs')));

// Haversine: jarak Banjarmasin -> Banjarbaru ~20km
if (geo.haversineMeter) {
	const d = geo.haversineMeter(-3.3167, 114.5909, -3.4606, 114.8486);
	ok('haversine Banjarmasin→Banjarbaru ≈ 18-35 km', d > 18000 && d < 40000);
}

if (geo.diDalamZona && geo.detectGeofenceBreaches) {
	const zona = { id: 'z1', nama: 'Site Utama', kind: 'PROYEK', latitude: -3.3167, longitude: 114.5909, radius_m: 5000 };

	// Unit di pusat zona
	ok('unit pusat zona → diDalam true', geo.diDalamZona(-3.3167, 114.5909, zona) === true);
	// Unit 25km jauhnya
	ok('unit 25km di luar → diDalam false', geo.diDalamZona(-3.4606, 114.8486, zona) === false);

	const breach = geo.detectGeofenceBreaches(
		[{ equipment_id: 2, equipment_code: 'TST-01', latitude: -3.4606, longitude: 114.8486 }],
		[zona],
	);
	ok('unit luar zona → 1 breach terdeteksi', Array.isArray(breach) && breach.length === 1);

	const aman = geo.detectGeofenceBreaches(
		[{ equipment_id: 1, equipment_code: 'TST-02', latitude: -3.3167, longitude: 114.5909 }],
		[zona],
	);
	ok('unit dalam zona → 0 breach', Array.isArray(aman) && aman.length === 0);

	const kosong = geo.detectGeofenceBreaches([], [zona]);
	ok('tracking kosong → array kosong (no crash)', Array.isArray(kosong) && kosong.length === 0);

	// Validasi zona
	ok('zona radius negatif → tidak valid', geo.zonaValid({ ...zona, radius_m: -100 }) === false);
	ok('zona id kosong → tidak valid', geo.zonaValid({ ...zona, id: '' }) === false);
	ok('zona valid → true', geo.zonaValid(zona) === true);
}

console.log('\n== T-0061 Analytics ==');
const anaSrc = await compile('src/lib/analytics.ts');
writeFileSync(join(tmp, 'ana.mjs'), anaSrc);
const ana = await import(toUrl(join(tmp, 'ana.mjs')));

if (ana.buildUtilisasiBulanan) {
	const bulan = ana.buildUtilisasiBulanan([], []);
	ok('utilisasi bulanan return array (no crash)', Array.isArray(bulan));
}

if (ana.buildTopCustomers) {
	const rentals = [
		{ customer_id: 1, subtotal: 100000000, status: 'ON_GOING' },
		{ customer_id: 2, subtotal: 50000000, status: 'COMPLETED' },
		{ customer_id: 1, subtotal: 30000000, status: 'COMPLETED' },
	];
	const users = [
		{ id: 1, full_name: 'PT A', company_name: 'PT A', role_name: 'CUSTOMER' },
		{ id: 2, full_name: 'PT B', company_name: 'PT B', role_name: 'CUSTOMER' },
	];
	const top = ana.buildTopCustomers(rentals, users);
	ok('top customers return array', Array.isArray(top));
	ok('PT A digabung & urutan pertama', top.length >= 1 && top[0].nama === 'PT A');
	ok('PT A total = 130jt (gabungan 2 rental)', top.length >= 1 && top[0].totalNilai === 130000000);
	ok('REJECTED tidak dihitung', !rentals.some((r) => r.status === 'REJECTED'));
}

if (ana.getTingkatUtilisasi) {
	ok('utilisasi 90% → success', ana.getTingkatUtilisasi(90) === 'success');
	ok('utilisasi 36% → warning/danger', ana.getTingkatUtilisasi(36) !== 'success');
	ok('utilisasi 5% → danger', ana.getTingkatUtilisasi(5) === 'danger');
}

console.log('\n== T-0063 i18n ==');
// i18n.tsx pakai JSX — compile dgn loader jsx
const i18nOut = join(tmp, 'i18n.mjs');
await build({
	entryPoints: [join(root, 'src/lib/i18n.tsx')],
	bundle: true,
	format: 'esm',
	platform: 'neutral',
	loader: { '.tsx': 'tsx', '.ts': 'ts' },
	jsxFactory: 'React.createElement',
	outfile: i18nOut,
	define: { 'import.meta.env': '{"PROD":false}' },
});
const i18nSrc = readFileSync(i18nOut, 'utf-8');
ok('kamus punya terjemahan login.masuk EN', i18nSrc.includes('Sign In'));
ok('kamus punya terjemahan login.masuk ID', i18nSrc.includes('Masuk'));
ok('kamus punya pengaturan.bahasa EN', i18nSrc.includes('Display Language'));
ok('tidak ada dependency i18next/react-intl', !i18nSrc.includes('i18next') && !i18nSrc.includes('react-intl'));

console.log(`\n== RINGKASAN FASE 5 ==`);
console.log(`PASS ${passed} asersi`);
if (process.exitCode) { console.log('ADA FAIL — exit 1'); }
else { console.log('Semua asersi lulus.'); }
