# CHANGELOG — Autonomous Agent Log

> Format: `## [CYCLE n] <ISO timestamp> — <task_id> — <priority> — <status>`
> Append-only. Jangan pernah menghapus entri lama.

---

## [CYCLE 0] 2026-09-04T19:00:00Z — BOOTSTRAP — DONE
**Catatan:** Agent siap dijalankan dengan bootstrap prompt di §13 AGENT24T.md.

---

## [CYCLE 1] 2026-09-04T19:20:00Z — T-0003 — P0 — DONE
**Judul:** Perbaikan kritis auth — password kini diverifikasi + RBAC server-side
**Perubahan:**
- `src/lib/auth.ts` (BARU): hashing PBKDF2 600.000 iterasi SHA-256,
  session token HMAC-SHA256 ber-TTL 8 jam, helper `isPathAllowedForRole`
- `src/server/index.ts`: verifikasi password di `/api/auth/login`,
  middleware autentikasi + otorisasi per-role, rate limit 5x/15 menit
- `src/lib/db.ts`: `verifyCredentials()`; perbaiki bug status `REJECTED`
  yang membuat unit terkunci selamanya (tidak kembali ke AVAILABLE)
- `src/pages/Login.tsx`: validasi dan kirim password ke server
**Bug yang diperbaiki:**
1. Login hanya mencocokkan username — siapa pun bisa login sebagai admin
2. Tidak ada RBAC — endpoint seperti `/api/users` terbuka untuk umum
3. Rental `REJECTED` tidak mengembalikan unit menjadi AVAILABLE
**Verifikasi:** 25/25 auth test PASS · 13/13 rental-status test PASS · typecheck + build PASS

---

## [CYCLE 2] 2026-09-04T19:35:00Z — T-0003b — P0 — DONE
**Judul:** Aktifkan TypeScript strict mode + kembalikan type union yang aman
**Perubahan:**
- `tsconfig.json`: `"strict": false` → `true`, tambah `forceConsistentCasingInFileNames`.
  Hapus komentar `/* Linting */` karena membuat file gagal divalidasi sebagai JSON.
- `src/pages/admin/MaintenanceManagement.tsx` baris 66: tambah guard
  `m.equipment_name &&` sebelum `.toLowerCase()` — satu-satunya error strict.
- `src/lib/auth.ts` + `src/lib/db.ts`: kembalikan `VerifyResult` & `AuthCheck` ke
  discriminated union (sekarang narrowing bekerja berkat strict mode).
- `src/server/index.ts` + `src/pages/Login.tsx`: hapus semua workaround
  `as User` / `as SessionPayload` / `?? 'UNAUTHORIZED'` yang kini tidak diperlukan.
**Verifikasi:** `tsc --noEmit` PASS (strict) · `npm run build` PASS · 12/12 regresi test PASS

---

## [CYCLE 3] 2026-09-04T19:50:00Z — T-0014 — P1 — DONE
**Judul:** Implementasi aturan servis preventif 250 HM + seed data realistis
**Perubahan:**
- `src/lib/businessRules.ts` (BARU): `SERVICE_INTERVAL_HM = 250`,
  `SERVICE_WARNING_THRESHOLD_HM = 50`, `LATE_PENALTY_PER_DAY = 500_000`,
  `getServiceStatus()`, `getUnitsDueForService()`, `calculateRentalCost()`,
  `formatRupiah()`, `formatTanggal()`, `formatWaktu()`
- `src/lib/seedGenerator.ts` (BARU): 50 user, 50 equipment, 50 rental,
  50 contract, 50 payment, 25 maintenance, 55 GPS, 20 report —
  deterministik, integritas referensial terjamin
- `src/pages/admin/MaintenanceManagement.tsx`: panel peringatan unit
  yang sudah/mendekati jadwal servis
- `tests/`: 3 suite smoke test permanen + `npm test`
**Bug logika yang diperbaiki saat pengujian:**
1. Awalnya memakai "kelipatan 250 berikutnya", padahal aturan adalah
   `HM_terakhir_service + 250`
2. Unit baru (belum pernah servis) sebelumnya dianggap "LEWAT 2871 HM";
   kini dijadwalkan `HM sekarang + 250`
3. Output desimal tidak dibulatkan (muncul `1162.6100000000001`)
**Verifikasi:** 37/37 business-rules PASS · 41/41 data-integrity PASS · 5/5 service-panel PASS

---

## [CYCLE 4] 2026-09-04T20:00:00Z — T-0009 — P1 — DONE
**Judul:** Perbaiki akun demo & distribusi status untuk keperluan demo
**Bug ditemukan:**
1. Akun demo `user/user` hilang (generator membuat `user2`, `user3`, dst.)
2. Distribusi status buruk: 43/50 rental COMPLETED, 0 PENDING/APPROVED —
   halaman antrean staf akan kosong saat demonstrasi
**Perubahan:**
- `seedGenerator.ts`: kembalikan akun demo `user`, tambah `user2`, `adaro`,
  `banjar_indah`, `meratus_coal`, `wasaka_jaya`, `hasnur_group`
- Alokasi status eksplisit: 7 PENDING, 8 APPROVED, 10 ON_GOING,
  21 COMPLETED, 4 REJECTED
- Payment: paksa sebagian menjadi `PENDING_VERIFICATION` agar antrean
  verifikasi staf selalu terisi
**Verifikasi:** 41/41 data-integrity PASS · ketiga akun demo login berhasil

---

## [CYCLE 5] 2026-09-04T20:10:00Z — T-0015 — P1 — DONE
**Judul:** Integrasi aturan bisnis ke dashboard & laporan
**Perubahan:**
- `AdminDashboard.tsx`: panel peringatan unit lewat jadwal servis 250 HM;
  format Rupiah terpusat (hapus duplikasi `Intl.NumberFormat`)
- `ReportsPage.tsx`: 3 kartu ringkasan finansial — pendapatan kotor,
  denda keterlambatan (Rp 500.000/hari), transaksi diproses + jumlah terlambat
- `tests/lateFee.test.mjs`: uji denda termasuk edge case
**Hasil:** Pendapatan kotor Rp 1.454.300.000 · 3 unit terlambat · denda Rp 5.000.000
**Catatan:** `Rental` tidak punya `actual_return_date`, sehingga denda dihitung
dari rental ON_GOING yang sudah lewat `end_date`.

---

## [CYCLE 6] 2026-09-09T06:40:00Z — T-0016 — P0 — DONE
**Judul:** Audit konsistensi lintas-tabel — temukan & perbaiki 5 bug data
**Bug ditemukan:**
1. Double-booking unit (unit 3, 10, 12, 44, 36, 5 punya 2-3 rental aktif bersamaan)
2. 8 unit berstatus RENTED tanpa rental aktif
3. 14 rental aktif menempati unit yang tidak berstatus RENTED
4. Unit MAINTENANCE ada yang sedang disewa
5. Test memakai field `maintenance_date` yang tidak ada (yang benar `scheduled_date`)
**Perubahan:**
- `seedGenerator.ts`: `sinkronkanStatusUnit()` — data rental+servis menjadi
  sumber kebenaran status unit (prioritas MAINTENANCE > RENTED > AVAILABLE/UNAVAILABLE)
- `seedGenerator.ts`: `generateRentals()` alokasi unit eksklusif,
  unit MAINTENANCE dikecualikan dari sewa aktif
- `tests/consistency.test.mjs`: audit 26 pemeriksaan integritas lintas-tabel
**Verifikasi:** 5/5 suite lulus (26/26 konsistensi) · build 468 KB

---

## [CYCLE 7] 2026-09-09T07:00:00Z — T-0017 — P0 — DONE
**Judul:** Perkeras validasi & keamanan endpoint API
**Perubahan:**
- `server/index.ts`: helper `readJsonBody<T>()` dan `parseId()`
- Semua endpoint mutasi: 400 untuk ID tidak valid / JSON rusak,
  404 untuk data tidak ditemukan
- `PUT /api/rentals/:id/status`: hanya menerima enum status yang sah
- `GET /api/users`: tidak lagi mengirim field sensitif ke klien
- `POST /api/users/:id/toggle`: cegah admin menonaktifkan akunnya sendiri (403)
**Verifikasi:** typecheck + build + `npm test` 5/5 PASS

---

## [CYCLE 8] 2026-09-09T07:20:00Z — T-0018 — P0 — DONE
**Judul:** Uji fungsional endpoint API
**Bug ditemukan:**
- `POST /api/maintenance` menerima body `{}` dan membuat log servis
  TANPA `equipment_id` / `scheduled_date` (respons 201 dengan data kosong)
**Perubahan:**
- `server/index.ts`: validasi `equipment_id` wajib ada & unit benar-benar
  terdaftar; validasi `scheduled_date` harus tanggal valid
- `tests/api.test.mjs`: 42 pemeriksaan — health, validasi login, login sukses +
  token, endpoint tanpa token (401), akses token valid, otorisasi per-role
  (customer dilarang lihat `/api/users`), token palsu/dimodifikasi,
  validasi ID & body, data tidak ditemukan (404), dashboard stats
**Catatan penting:** session header adalah `X-SBS-Session`, bukan `Authorization`.
**Verifikasi:** 6/6 suite lulus (42/42 API test) · typecheck + build PASS

---

## [CYCLE 9] 2026-09-09T07:45:00Z — T-0019 — P2 — DONE
**Judul:** Pusatkan formatter Rupiah + audit kualitas kode
**Bug ditemukan:**
- Dropdown unit di `RentalManagement.tsx` menampilkan "Rp Rp 100.000"
  (formatRupiah sudah menyertakan awalan "Rp", lalu ditambahi "Rp" lagi)
**Perubahan:**
- Hapus 4 formatter `Intl.NumberFormat(... IDR ...)` lokal di
  `CustomerPortal.tsx`, `StaffDashboard.tsx`, `RentalManagement.tsx`,
  `EquipmentManagement.tsx` — kini semua memakai `formatRupiah()` dari
  `src/lib/businessRules.ts` (7 file menggunakannya)
- `tests/codeQuality.test.mjs` (BARU): audit 25 file sumber — mendeteksi
  formatter lokal, awalan "Rp" ganda, impor yang hilang, `console.log`,
  dan penanda TODO/FIXME pada komentar
**Catatan:** Pemeriksaan TODO/FIXME hanya menghitung penanda dalam komentar
(`// TODO`, `/* FIXME */`) agar teks contoh seperti "0811500XXXX" tidak
terbaca sebagai false positive.
**Verifikasi:** 7/7 suite lulus · typecheck + build PASS (467 KB)

---

## [CYCLE 10] 2026-09-09T08:10:00Z — T-0020 — P2 — DONE
**Judul:** Cegah double-booking di level aplikasi (server + UI)
**Bug ditemukan:** `isEquipmentAvailable()` sudah ada di `businessRules.ts`
tetapi **tidak dipanggil di mana pun**. Validasi hanya mengandalkan data seed
yang konsisten — sewa baru lewat API/UI tetap bisa membuat bentrok meski data
awal bersih.
**Perubahan:**
- `POST /api/rentals`: tolak `409` bila unit bentrok dengan sewa aktif
  (`APPROVED` / `ON_GOING`), kode error `EQUIPMENT_UNAVAILABLE`
- `PUT /api/rentals/:id/status`: tolak `409` bila approval/aktivasi membuat bentrok
- Validasi tanggal: `end_date` harus setelah `start_date` → `400`
- Validasi unit benar-benar ada → `404`
- `CustomerPortal.tsx`: cek ketersediaan sebelum submit + panel peringatan
  merah di modal (state `rentError`, direset saat modal dibuka)
- 5 pemeriksaan baru di `tests/api.test.mjs`
**Catatan:** Satu test lama (`PUT /api/rentals/1/status → 200`) sempat gagal
karena rental #1 memang bentrok — validasi baru bekerja sesuai desain. Test
diperbaiki agar memilih rental `PENDING` yang unitnya sedang tidak disewa.
**Verifikasi:** 7/7 suite lulus (47/47 API) · typecheck + build PASS (468 KB)

---

## [CYCLE 11] 2026-09-09T08:35:00Z — T-0021 — P1 — DONE
**Judul:** Amankan alur verifikasi pembayaran & tanda tangan kontrak
**Bug ditemukan:**
1. `verifyPayment` mengubah status jadi `PAID` **tanpa mengecek** status
   sebelumnya — staf bisa mengesahkan pembayaran yang belum pernah dibayar
2. `verifyPayment` tidak mewajibkan bukti transfer
3. `signContract` menimpa `signed_at` setiap dipanggil → audit trail rusak
4. `seedGenerator` **tidak pernah mengisi** `payment_proof_path` — dengan
   aturan baru, antrean verifikasi staf tidak bisa diproses sama sekali
**Perubahan:** validasi status + bukti di `db.ts`, penolakan tanda tangan
ulang, endpoint menangkap error aturan jadi `409` (bukan 500), seed mengisi
bukti transfer dengan ~1 dari 4 sengaja belum upload agar realistis.
**Verifikasi:** 7/7 suite lulus · 16 pemeriksaan baru · typecheck + build PASS

---

## [CYCLE 12] 2026-09-09T08:50:00Z — T-0002 — P1 — DONE
**Judul:** Diagnosis & perbaiki kegagalan deploy Cloudflare
**Root cause:** Log Cloudflare menunjukkan "No dependencies detected to cache",
lalu `npx wrangler deploy` dijalankan. Karena dependensi tidak ter-install,
`npm run build` gagal → `dist/` tidak pernah dibuat → wrangler melaporkan
"Could not detect a directory containing static files".
**Perbaikan:** tambah skrip `deploy:cloud` = `npm install && npm run build &&
wrangler deploy` agar dependensi terpasang sebelum build.
**Verifikasi:** `wrangler deploy --dry-run` berhasil membaca 4 berkas dari
`dist/` (147 KiB / gzip 37 KiB) dengan binding `env.ASSETS`.
**Status:** Konfigurasi valid. Deploy sungguhan butuh login Cloudflare.

---

## [CYCLE 13] 2026-09-09T09:10:00Z — T-0022 — P2 — DONE
**Judul:** Fitur baru — Riwayat Servis per Unit
**Perubahan:** Panel drill-down di `MaintenanceManagement.tsx`:
- Dropdown pilih unit (hanya unit yang punya catatan servis)
- Ringkasan: total servis, yang selesai, total biaya, rata-rata per servis, HM terakhir
- Tabel log: kode servis, tanggal, jenis, HM, suku cadang, biaya, status
- Tombol "Riwayat" di panel peringatan 250 HM untuk drill-down cepat
- Diurutkan dari servis terbaru (`scheduled_date` menurun)
**Verifikasi:** typecheck + build PASS (473 KB)

---

## [CYCLE 14] 2026-09-09T09:30:00Z — T-0023 — P2 — DONE
**Judul:** Notifikasi jatuh tempo & keterlambatan di dashboard staf
**Perubahan:** Panel notifikasi di `StaffDashboard.tsx`:
- Rental `ON_GOING` yang terlambat (> `end_date`) atau jatuh tempo ≤ 3 hari
- Denda otomatis: `hariTerlambat × LATE_PENALTY_PER_DAY` (Rp 500.000/hari)
- Total estimasi denda di footer panel; tombol "Tindak Lanjut" → tab rental
- `tests/dueNotifications.test.mjs` (BARU): 14 pemeriksaan, termasuk kasus
  batas (hari ini, 3 hari, 4 hari, terlambat 3 hari, COMPLETED, tanpa end_date)
**Catatan:** Tanggal acuan dibuat dinamis (`new Date()`) agar test tidak
perlu dipelihara setiap hari.
**Verifikasi:** 8/8 suite lulus · typecheck + build PASS (477 KB)
