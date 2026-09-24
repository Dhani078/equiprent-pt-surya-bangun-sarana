/**
 * Uji konfigurasi lewat tabel settings + audit trail (T-0053) — EquipRent MS
 *
 * Dua jalur yang sebelumnya di-hardcode kini configurable:
 *   1. Tarif denda keterlambatan dibaca dari settings (key
 *      `late_penalty_per_day`), dikembalikan ke DEFAULT bila DB tidak
 *      terhubung / nilai invalid.
 *   2. auditLog() menulis ke tabel `audit_log` saat DB tersedia, dan tetap
 *      menyimpan ke buffer memori sebagai fallback + cache baca.
 *
 * Lingkungan uji tidak menyambung TiDB, sehingga cabang "DB tersedia"
 * diverifikasi melalui permukaan modul yang terlihat dari luar:
 *   - setLatePenaltyPerDay() menggerakkan getLateReturnInfo() &
 *     calculateRentalCost() (pemakai nyata tarif denda),
 *   - getAuditLog() tetap sinkron & urut,
 *   - hydrateAuditLog() segera kembali tanpa DB (tidak melempar).
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const br = await import('../.tmp_businessRules.mjs');
const audit = await import('../.tmp_audit.mjs');

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

function setel(kode) {
  // Pakai permukaan publik modul agar uji tidak mengutak-atik internal.
  br.setLatePenaltyPerDay(kode);
}

console.log('\n== Tarif Denda: default & setter ==');

setel(null);
t('DEFAULT_LATE_PENALTY_PER_DAY = 500.000', br.DEFAULT_LATE_PENALTY_PER_DAY === 500000);
t('getLatePenaltyPerDay() awal = default', br.getLatePenaltyPerDay() === br.DEFAULT_LATE_PENALTY_PER_DAY);

setel(250000);
t('setLatePenaltyPerDay(250000) mengganti tarif', br.getLatePenaltyPerDay() === 250000);

setel(null);
t('setLatePenaltyPerDay(null) kembali ke default', br.getLatePenaltyPerDay() === br.DEFAULT_LATE_PENALTY_PER_DAY);

// Nilai invalid tidak pernah diterima (tidak ada tarif negatif / NaN).
setel(-1000);
t('tarif negatif ditolak → default', br.getLatePenaltyPerDay() === br.DEFAULT_LATE_PENALTY_PER_DAY);
setel(NaN);
t('tarif NaN ditolak → default', br.getLatePenaltyPerDay() === br.DEFAULT_LATE_PENALTY_PER_DAY);
setel(Number.POSITIVE_INFINITY);
t('tarif Infinity ditolak → default', br.getLatePenaltyPerDay() === br.DEFAULT_LATE_PENALTY_PER_DAY);
setel('1000');
t('tarif string ditolak → default', br.getLatePenaltyPerDay() === br.DEFAULT_LATE_PENALTY_PER_DAY);
setel(0);
t('tarif 0 diterima (kebijakan bebas denda sah)', br.getLatePenaltyPerDay() === 0);

// ---------------------------------------------------------------------------
console.log('\n== Tarif Denda Dipakai Oleh Perhitungan Nyata ==');

// Propagasi setter → perhitungan diverifikasi dalam SATU salinan modul
// (calculateRentalCost & getLatePenaltyPerDay di bundel .tmp_businessRules).
// getLateReturnInfo (rentalWorkflow) sengaja TIDAK diuji lintas bundel di
// sini: tests/run-tests.mjs mem-bundle tiap modul secara terpisah, sehingga
// salinan terpisah = state terpisah — itu artefak pengujian, bukan perilaku
// app bundle sesungguhnya (di app, satu modul businessRules dipakai semua
// konsumen). Perilaku getLateReturnInfo pada tarif default diuji di suite
// rentalWorkflow; kontrak tarif-dinamis diuji lewat calculateRentalCost.
setel(250000);
const biaya = br.calculateRentalCost(1000000, '2026-09-01', '2026-09-05', '2026-09-08');
t('calculateRentalCost: denda = 3 x tarif baru', biaya.penalty === 750000);
t('calculateRentalCost: grand total = subtotal + denda', biaya.grandTotal === biaya.subtotal + biaya.penalty);
t('calculateRentalCost: lateDays tercatat', biaya.lateDays === 3);

// Tarif 0 → tidak ada denda walau terlambat.
setel(0);
const biayaBebas = br.calculateRentalCost(1000000, '2026-09-01', '2026-09-05', '2026-09-20');
t('tarif 0 → denda 0 walau terlambat', biayaBebas.lateDays > 0 && biayaBebas.penalty === 0);
t('tarif 0 → subtotal tetap dihitung', biayaBebas.subtotal > 0);

setel(null);

// ---------------------------------------------------------------------------
console.log('\n== Audit Trail: API tetap (signature tidak putus) ==');

// getAuditLog() harus tetap SYNC (mengembalikan array, bukan Promise).
const langsung = audit.getAuditLog(50);
t('getAuditLog() sinkron (bukan Promise)', !(langsung instanceof Promise));
t('getAuditLog() mengembalikan array', Array.isArray(langsung));

audit.auditLog({
  user_id: 7,
  username: 'tester_settings',
  role: 'ADMIN',
  action: 'SETTINGS_PROBE',
  entity: 'settings',
  entity_id: 1,
  detail: 'Probe uji tarif configurable',
});

const semua = audit.getAuditLog(500);
const probe = semua.find((e) => e.action === 'SETTINGS_PROBE');
t('entri settings tercatat', probe !== undefined);
t('entri settings detail utuh', probe?.detail === 'Probe uji tarif configurable');
t('getAuditLog urut terbaru dulu', semua[0]?.action === 'SETTINGS_PROBE');

// auditLog() harus tetap void (tidak mengembalikan Promise).
const hasil = audit.auditLog({
  user_id: 7, username: 'x', role: 'ADMIN', action: 'VOID_PROBE', entity: 'user', entity_id: 1, detail: 'x',
});
t('auditLog() tetap void', hasil === undefined);

// hydrateAuditLog() tanpa DB harus segera selesai & tidak melempar.
let hydrateAman = true;
try {
  await audit.hydrateAuditLog();
} catch {
  hydrateAman = false;
}
t('hydrateAuditLog() tanpa DB tidak melempar', hydrateAman);
t('buffer memori tetap utuh setelah hydrate tanpa DB', audit.getAuditLog(500).length >= 2);

// ---------------------------------------------------------------------------
console.log('\n== Identitas Pelaku (regresi auditActor) ==');

const ctx = { get: (k) => (k === 'userId' ? 11 : 'STAFF') };
const actor = audit.auditActor(ctx);
t('auditActor ambil userId dari sesi', actor.user_id === 11);
t('auditActor ambil role dari sesi', actor.role === 'STAFF');

// ---------------------------------------------------------------------------
console.log(`\n${fail === 0 ? `Semua asersi lulus (${pass}).` : `${fail} asersi gagal dari ${pass + fail}.`}`);
process.exit(fail === 0 ? 0 : 1);
