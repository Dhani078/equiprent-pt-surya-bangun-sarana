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

---

## [CYCLE 15] 2026-09-09T10:15:00Z — T-0025 — P1 — DONE
**Judul:** Panel 11 laporan operasional (pemilih, filter periode, ekspor CSV)
**Fitur baru:**
- `src/lib/reports.ts` — mesin 11 laporan (sudah ada di working tree dari siklus
  sebelumnya, kini terverifikasi penuh oleh test). Termasuk `REPORT_CATALOG`,
  `buildReport`, `normalizeRange`, `formatCell`, `buildCsv`, `buildCsvFilename`.
- `src/lib/reportsClient.ts` (BARU) — klien data: coba edge API
  `/api/reports/analytics`, bila gagal jatuh ke perhitungan lokal dari state
  agar demo tidak pernah menampilkan halaman kosong. Mengembalikan
  discriminated union `{ok:true,...} | {ok:false,...}`, tidak pernah melempar.
- `src/components/ReportAnalyticsPanel.tsx` (BARU) — pemilih 11 laporan,
  filter rentang tanggal (disembunyikan untuk laporan snapshot `UTILISASI_HM`),
  tabel dinamis mengikuti definisi kolom, ringkasan agregat, tombol Ekspor CSV.
- `src/pages/admin/ReportsPage.tsx` — memuat panel; `useEffect` + `AbortController`
  membatalkan permintaan lama agar hasil kedaluwarsa tidak menimpa yang baru.
- `src/server/index.ts` — endpoint `GET /api/reports/analytics` (id/from/to),
  RBAC mewarisi prefix `/api/reports` → hanya ADMIN & STAFF.
- `src/index.css` — keyframe `sbs-shimmer` untuk skeleton loading.
**Perilaku yang dijaga:**
- Angka diekspor mentah ke CSV (tanpa "Rp" & tanpa titik ribuan) agar bisa
  dijumlahkan di Excel; pemisah `;` dan BOM UTF-8 untuk locale Indonesia.
- Nama berkas: `Laporan_<Jenis>_<YYYY-MM-DD>.csv`.
- Filter tanggal rusak diabaikan, `from > to` ditukar otomatis.
**Pengujian:**
- `tests/reports.test.mjs` (BARU): 89 pemeriksaan — struktur 11 laporan, filter
  periode, format sel, escape CSV (titik koma, kutip ganda, baris baru),
  nama berkas, ketahanan terhadap sumber data kosong.
- `tests/smokeRender.test.mjs` (BARU): 26 pemeriksaan render SSR — loading,
  error + retry, empty state, semua 11 laporan, atribut aksesibilitas.
- `tests/api.test.mjs`: 13 pemeriksaan baru untuk endpoint analytics
  (default, id sah, id palsu → 400, rentang rusak → 200, customer → 403).
**Verifikasi:** typecheck PASS · build PASS (508 KB) · `npm test` 10/10 suite PASS

---

## [CYCLE 16] 2026-09-09T11:58:00Z — T-0024 — P1 — DONE
**Judul:** Ekspor dokumen BAST IN / BAST OUT / Surat Jalan siap cetak A4 (F3.2)
**Fitur baru:**
- `src/lib/documents.ts` (BARU) — mesin dokumen MURNI (tanpa DOM/DB):
  DOCUMENT_KINDS, isDocumentKind, documentKindFromReportType, getDocumentTitle,
  getDocumentKindLabel, buildDocumentCode, buildDocumentFilename, buildDocument,
  escapeHtml, renderDocumentHtml.
  Nomor dokumen: REP-<BASTOUT|BASTIN|SJ>-<YYYYMMDD>-<SEQ-3digit>.
- `src/lib/documentPrinter.ts` (BARU) — satu-satunya tempat yang menyentuh DOM:
  membuka jendela baru, menulis HTML, lalu print(). Mengembalikan discriminated
  union {ok:true} | {ok:false,message}, tidak pernah melempar.
- `src/components/DocumentPreview.tsx` (BARU) — pratinjau di layar yang isinya
  identik dengan berkas cetak (kop surat, rincian, catatan, tanda tangan).
- `src/components/DocumentPrintPanel.tsx` (BARU) — panel penerbitan: pilih
  transaksi, pilih jenis dokumen, pratinjau, lalu cetak. Transaksi PENDING /
  REJECTED disaring di tingkat data; empty state bila tidak ada yang layak.
- `src/pages/admin/ReportsPage.tsx` — panel dokumen + tombol "Cetak A4" pada
  setiap baris arsip; pratinjau arsip menyusun ulang dokumen dari transaksi
  aslinya. FINANCIAL_SUMMARY jatuh ke window.print() (bukan dokumen BAST).
- `src/index.css` — blok @media print dengan @page { size: A4 portrait;
  margin: 15mm 14mm }; navbar/sidebar/tombol disembunyikan, modal pratinjau
  tetap utuh, break-inside: avoid agar baris tabel tidak terpotong.
- `src/App.tsx` — ReportsPage kini menerima prop equipments.
**Perilaku yang dijaga:**
- Denda hanya dihitung pada BAST IN, dari tanggal pengembalian vs end_date
  (LATE_PENALTY_PER_DAY per hari) — BAST OUT & Surat Jalan selalu 0.
- Semua teks yang disisipkan ke HTML di-escape, sehingga nama pelanggan
  berbahaya tidak dapat menyisipkan tag.
- Tanggal rusak / unit tidak ditemukan tidak pernah menghasilkan NaN atau
  undefined — diganti "-" agar dokumen tetap bisa dicetak.
- Berkas HTML berdiri sendiri (CSS inline) agar hasil cetak identik di semua
  browser, tanpa bergantung stylesheet aplikasi.
**Pengujian:**
- `tests/documents.test.mjs` (BARU): 121 pemeriksaan — penomoran & nama berkas,
  perbedaan rincian tiap jenis dokumen, denda 3 hari = Rp 1.500.000, kasus
  kembali tepat waktu, ketahanan data kosong/rusak, escaping HTML, struktur
  @page A4, serta render SSR pratinjau & panel (termasuk empty state dan
  penolakan status PENDING).
- `tests/run-tests.mjs` — menambahkan bundle .tmp_documents.mjs,
  .tmp_preview.mjs, .tmp_printpanel.mjs dan suite baru.
**Verifikasi:** typecheck PASS · build PASS (529 KB) · npm test 11/11 suite PASS


---

## [CYCLE 18] 2026-09-09T14:30:00Z — T-0030 — P1 — DONE
**Judul:** Validasi unavailability unit pada form rental (cegah double booking) (F2.1)
**Fitur baru:**
- `src/lib/availability.ts` (BARU) — mesin ketersediaan MURNI (tanpa DOM/DB):
  `isBlockingStatus`, `isUnitOutOfService`, `normalizeBookingRange`,
  `getRentalConflicts`, `buildEquipmentAvailability`, `describeBlockedReason`,
  `summarizeAvailability`. Satu-satunya tempat aturan bentrokan ditulis, agar
  pesan galat UI & API selalu identik.
  - Dua rentang bentrok bila `start <= rEnd && end >= rStart` (ujung yang
    bersentuhan tetap bentrok: unit butuh waktu mobilisasi & demobilisasi).
  - Tanggal diparse ke UTC tengah hari (`T12:00:00Z`) agar zona waktu tidak
    menggeser tanggal — masalah klasik `new Date('2026-09-01')`.
  - Status RENTED sengaja TIDAK mengunci unit: status adalah keadaan hari ini,
    sedangkan pemesanan menyangkut masa depan. Yang menentukan: bentrokan rentang.
- `src/server/index.ts`:
  - `POST /api/rentals` — menolak 409 `EQUIPMENT_UNAVAILABLE` bila unit berstatus
    MAINTENANCE/UNAVAILABLE atau rentangnya bentrok dengan sewa aktif.
  - `PUT /api/rentals/:id/status` — persetujuan (APPROVED / ON_GOING) ikut
    divalidasi; rental yang bersangkutan dikecualikan agar tidak bentrok dengan
    dirinya sendiri.
  - `GET /api/rentals/availability` — ringkasan semua unit atau satu unit
    (`equipmentId`), dengan `excludeRentalId` untuk mode edit.
  - `GET /api/rentals/bookable` — daftar unit yang benar-benar bisa dipesan pada
    rentang tertentu, lengkap dengan harga sewa per hari.
- `src/pages/admin/RentalManagement.tsx` — form kini menyaring pilihan unit
  berdasarkan rentang tanggal, menampilkan ringkasan "N dari M unit tersedia",
  dan menandai unit yang terkunci beserta alasannya.
- `src/pages/customer/CustomerPortal.tsx` — portal pelanggan memakai aturan yang
  sama, sehingga pelanggan tidak bisa mengajukan sewa pada unit yang bentrok.
**Pengujian:**
- `tests/availability.test.mjs` (BARU) — uji mesin bentrokan murni.
- `tests/api.test.mjs` — 25+ pemeriksaan baru: sewa bentrok → 409, sewa rentang
  berbeda → 201, unit MAINTENANCE → 409, endpoint availability & bookable,
  penolakan akses tanpa token.
- Perbaikan stabilitas: `semuaUnit` kini disegarkan setelah pembuatan jadwal
  perawatan (yang mengubah status unit menjadi MAINTENANCE), sehingga pemilihan
  kasus uji tidak lagi bergantung pada urutan eksekusi.
**Verifikasi:** typecheck PASS · build PASS (533 KB) · npm test 12/12 suite PASS


---

## [CYCLE 19] 2026-09-09T16:30:00Z — T-0004 — P1 — DONE
**Judul:** CRUD master users & equipments (Admin) (F1.2, F1.3)
**Fitur baru:**
- `src/lib/validators.ts` (BARU) — modul validasi TERPUSAT & MURNI (tanpa DOM/DB).
  Dipakai dua arah: sisi server sebagai sumber kebenaran, sisi klien untuk
  umpan balik cepat. Karena satu modul, pesan galat di layar identik dengan
  respons API — tidak ada lagi dua versi aturan yang perlahan menyimpang.
  - `ValidationResult<T>` berbentuk discriminated union (`ok: true/false`)
    dengan kode galat stabil: REQUIRED, TOO_SHORT, TOO_LONG, INVALID_FORMAT,
    OUT_OF_RANGE, NOT_INTEGER.
  - Batasan panjang disamakan dengan skema tabel TiDB (varchar), sehingga
    galat muncul di form, bukan sebagai kegagalan INSERT misterius.
  - `sanitizeText()` membuang karakter kontrol (NUL, escape) yang bisa
    merusak query atau tampilan tabel, lalu merapikan spasi di ujung.
  - Kategori alat berat dipusatkan di `EQUIPMENT_TYPES` (Excavator,
    Bulldozer, Wheel Loader, Crane, Vibro Roller, Dump Truck, Motor Grader) —
    sinkron dengan `seedGenerator.ts`. Kategori lama "Vibratory Roller"
    kini ditolak dengan pesan jelas.
  - `MAINTENANCE_TYPES` = PREVENTIVE / CORRECTIVE / OVERHAUL. `INSPECTION`
    yang pernah ditawarkan form TIDAK ada di ENUM skema, karenanya ditolak
    alih-alih disimpan sebagai nilai kosong (barisnya hilang dari laporan).
  - `validateThumbnailUrl()` hanya mengizinkan http(s) — menutup celah
    skema berbahaya seperti `javascript:`.
- `src/server/index.ts`:
  - `POST /api/users` (BARU) — pendaftaran identitas oleh Admin. Password
    TIDAK diterima lewat endpoint ini: `password_hash` disetel `null` dan
    pemilik akun menetapkan password sendiri lewat alur registrasi yang
    memanggil `hashPassword()`. Menghilangkan `any` pada kontrak komponen.
  - Pemeriksaan keunikan username & email (keduanya identitas login) → 409
    dengan galat per-field, bukan 500 dari constraint database.
  - `ringkasUser()` — whitelist field publik yang TERpusat. `password_hash`
    tidak pernah ikut dalam satu pun respons.
  - `POST /api/equipments` — validasi terpusat + kode unit unik (dipakai
    sebagai identitas di dokumen & CSV) + thumbnail otomatis bila kosong.
  - `PUT /api/equipments/:id` — validasi, kode unik (kecuali miliknya
    sendiri), serta pengecekan role ADMIN secara eksplisit.
  - `DELETE /api/equipments/:id` — menolak 409 `EQUIPMENT_IN_USE` bila unit
    masih tercatat dalam sewa APPROVED/ON_GOING: menghapusnya akan memutus
    referensi riwayat rental & laporan.
  - `POST /api/maintenance` — jenis pemeliharaan kini divalidasi terhadap
    ENUM skema.
- `src/pages/admin/EquipmentManagement.tsx` — form memakai validator yang
  sama dengan server; galat per-field ditampilkan di bawah input
  (border merah + `aria-invalid`), plus ringkasan galat untuk penolakan
  server (kode unit sudah dipakai). Tombol hapus dinonaktifkan pada unit
  RENTED/MAINTENANCE. Kode saran memakai `maks(id)+1` agar tidak bentrok.
- `src/pages/admin/UserManagement.tsx` — galat per-field, pesan sukses/gagal,
  penjelasan bahwa password tidak ditetapkan di sini, dan `Promise<void>`
  menggantikan `Promise<any>` pada kontrak props.
- `src/pages/admin/MaintenanceManagement.tsx` — opsi jenis pemeliharaan
  dibangkitkan dari `MAINTENANCE_TYPES` (cast `as any` dihapus).
- `src/App.tsx` — notifikasi global (toast) sukses/gagal untuk aksi master data.
- `src/lib/db.ts` — `nextId()` memakai `maksimum + 1`, bukan `panjang + 1`:
  bila sebuah baris dihapus, ID lama tidak dipakai ulang.
- `src/types/index.ts` — `password_hash?: string | null` didokumentasikan
  sebagai field yang tidak pernah dikirim ke klien.
**Perilaku yang dijaga:**
- Menulis ke unit yang tidak ada kini menjawab 404, bukan 400: keberadaan
  unit diperiksa SEBELUM validasi isi (sebelumnya body `{status:...}` yang
  tidak lengkap memicu 400 dan menutupi 404).
- Form Admin memakai modul yang sama dengan server, sehingga pesan galat
  konsisten dan tidak ada aturan yang hanya berlaku di satu sisi.
**Pengujian:**
- `tests/validators.test.mjs` (BARU) — 95 pemeriksaan: tiap validator
  (nama, username, email, telepon, alamat, instansi, role, kode unit, HM,
  tarif, status, kategori, jenis pemeliharaan, tanggal, URL foto), form
  lengkap pengguna & unit, serta fuzzing ringan (12 nilai aneh × 18
  validator tidak boleh melempar).
- `tests/api.test.mjs` — 34 pemeriksaan baru: pendaftaran pengguna (201,
  duplikat 409, validasi 400, staff 403, tanpa token 401, password_hash
  tidak bocor), master unit (tambah/ubah/hapus, kode duplikat 409, HM
  negatif 400, URL berbahaya 400, customer 403, hapus unit yang disewa 409),
  serta penolakan `maintenance_type: INSPECTION`.
- `tests/run-tests.mjs` — menambahkan bundle `.tmp_validators.mjs` & suite
  baru (total 13 suite).
**Verifikasi:** typecheck PASS · build PASS (545 KB) · npm test 13/13 suite PASS


## [CYCLE 20] 2026-09-09T18:10:00Z — T-0005 — P1 — DONE
**Judul:** Dashboard Admin — semua angka real dari DB (bukan mock)
**Perubahan:**
-  (BARU) — mesin agregat MURNI (tanpa React, tanpa
  jaringan).  menghitung 19 metrik dari sumber data
  yang diberikan: pendapatan (hanya PAID), piutang menunggu verifikasi,
  distribusi armada (AVAILABLE/RENTED/MAINTENANCE/UNAVAILABLE), sewa aktif
  (APPROVED + ON_GOING), pengajuan PENDING, sewa selesai, jumlah pelanggan,
  unit jatuh tempo & mendekati servis 250 HM, serta tabel turunan
  (5 transaksi terbaru + 4 antrean servis). Termasuk .
  Anti-NaN:  berbentuk string (umum pada driver MySQL) dikonversi,
  nilai tidak valid diabaikan;  kosong jatuh ke .
-  (BARU) — klien dengan strategi API → lokal,
  mengikuti pola . Respons JSON divalidasi type guard
   (17 field angka wajib) sebelum dipakai, dan
  kegagalan tidak pernah melempar (dikembalikan sebagai ).
-  —  tidak lagi menulis
  rumusnya sendiri: cukup memanggil . Respons kini
  konsisten . Pengambilan 5 tabel dibuat paralel
  dengan  (sebelumnya berurutan).
-  — ditulis ulang. Kini mandiri
  mengambil datanya sendiri (tidak lagi menerima props array), dengan
  loading skeleton berukuran sesuai layout, error + tombol coba ulang,
  empty state per panel, tombol Muat Ulang, dan badge sumber data
  (Edge API / Perhitungan lokal). Tambahan 4 stat card: menunggu verifikasi,
  pelanggan terdaftar, pengajuan masuk, tingkat utilisasi armada.
  Tanggal antrean servis kini diformat .
-  — pemanggilan  disederhanakan menjadi
   saja.
-  — tambah ,
  ,  (pusat, bukan file baru).
**Perilaku yang dijaga:**
- Angka dari API dan angka dari fallback lokal dijamin identik karena
  keduanya memanggil SATU modul yang sama — menghilangkan kelas bug
  "dashboard berbeda antara server dan klien".
- Endpoint tetap terproteksi: tanpa token 401; STAFF diizinkan
  (role CUSTOMER ditolak oleh matriks RBAC yang sudah ada).
- Tidak ada , tidak ada concat SQL, tidak ada import mockData.
**Pengujian:**
-  (BARU) — 50 pemeriksaan: sumber kosong,
  agregat keuangan (PAID vs UNPAID/FAILED, amount string, amount rusak),
  distribusi armada, status sewa, servis 250 HM (unit MAINTENANCE
  tidak diperingatkan), antrean servis, transaksi terbaru (urutan, batas 5,
  pelanggan tak dikenal → "-"), jumlah pelanggan (baris tanpa role_name
  tetap terhitung via role_id), fuzzing ringan, dan konsistensi terhadap
  data seed nyata (50 unit, 42 pelanggan).
-  — 9 pemeriksaan baru: envelope ,
  distribusi armada menjumlahkan total, batas 5 transaksi terbaru,
  akses STAFF 200, dan tanpa token 401.
-  — bundle  + suite baru (14 suite).
**Verifikasi:** typecheck PASS · build PASS (553 KB) · npm test 14/14 suite PASS
**Catatan:** Menyelesaikan pula T-0027 (ringkasan utilisasi armada) karena
seluruh kriteria penerimaannya terpenuhi oleh kartu "Tingkat Utilisasi
Armada" pada dashboard yang sama.

## [CYCLE 20] 2026-09-09T18:10:00Z — T-0005 — P1 — DONE
**Judul:** Dashboard Admin — semua angka real dari DB (bukan mock)
**Perubahan:**
- `src/lib/dashboard.ts` (BARU) — mesin agregat MURNI (tanpa React, tanpa
  jaringan). `buildDashboardStats()` menghitung 19 metrik dari sumber data
  yang diberikan: pendapatan (hanya PAID), piutang menunggu verifikasi,
  distribusi armada (AVAILABLE/RENTED/MAINTENANCE/UNAVAILABLE), sewa aktif
  (APPROVED + ON_GOING), pengajuan PENDING, sewa selesai, jumlah pelanggan,
  unit jatuh tempo & mendekati servis 250 HM, serta tabel turunan
  (5 transaksi terbaru + 4 antrean servis). Termasuk `emptyDashboardStats()`.
  Anti-NaN: `amount` berbentuk string (umum pada driver MySQL) dikonversi,
  nilai tidak valid diabaikan; `booking_date` kosong jatuh ke `start_date`.
- `src/lib/dashboardClient.ts` (BARU) — klien dengan strategi API → lokal,
  mengikuti pola `reportsClient.ts`. Respons JSON divalidasi type guard
  `isAdminDashboardStats()` (17 field angka wajib) sebelum dipakai, dan
  kegagalan tidak pernah melempar (dikembalikan sebagai `{ ok: false }`).
- `src/server/index.ts` — `GET /api/dashboard/stats` tidak lagi menulis
  rumusnya sendiri: cukup memanggil `buildDashboardStats()`. Respons kini
  konsisten `{ success: true, data }`. Pengambilan 5 tabel dibuat paralel
  dengan `Promise.all` (sebelumnya berurutan).
- `src/pages/admin/AdminDashboard.tsx` — ditulis ulang. Kini mandiri
  mengambil datanya sendiri (tidak lagi menerima props array), dengan
  loading skeleton berukuran sesuai layout, error + tombol coba ulang,
  empty state per panel, tombol Muat Ulang, dan badge sumber data
  (Edge API / Perhitungan lokal). Tambahan 4 stat card: menunggu verifikasi,
  pelanggan terdaftar, pengajuan masuk, tingkat utilisasi armada.
  Tanggal antrean servis kini diformat `04 September 2026`.
- `src/App.tsx` — pemanggilan `AdminDashboard` disederhanakan menjadi
  `onNavigate` saja.
- `src/types/index.ts` — tambah `AdminDashboardStats`, `DashboardRentalRow`,
  `DashboardServiceRow` (pusat, bukan file baru).
**Perilaku yang dijaga:**
- Angka dari API dan angka dari fallback lokal dijamin identik karena
  keduanya memanggil SATU modul yang sama — menghilangkan kelas bug
  "dashboard berbeda antara server dan klien".
- Endpoint tetap terproteksi: tanpa token 401; STAFF diizinkan
  (role CUSTOMER ditolak oleh matriks RBAC yang sudah ada).
- Tidak ada `any`, tidak ada concat SQL, tidak ada import mockData.
**Pengujian:**
- `tests/dashboard.test.mjs` (BARU) — 50 pemeriksaan: sumber kosong,
  agregat keuangan (PAID vs UNPAID/FAILED, amount string, amount rusak),
  distribusi armada, status sewa, servis 250 HM (unit MAINTENANCE
  tidak diperingatkan), antrean servis, transaksi terbaru (urutan, batas 5,
  pelanggan tak dikenal → "-"), jumlah pelanggan (baris tanpa role_name
  tetap terhitung via role_id), fuzzing ringan, dan konsistensi terhadap
  data seed nyata (50 unit, 42 pelanggan).
- `tests/api.test.mjs` — 9 pemeriksaan baru: envelope `{ success, data }`,
  distribusi armada menjumlahkan total, batas 5 transaksi terbaru,
  akses STAFF 200, dan tanpa token 401.
- `tests/run-tests.mjs` — bundle `dashboard.ts` + suite baru (14 suite).
**Verifikasi:** typecheck PASS · build PASS (553 KB) · npm test 14/14 suite PASS
**Catatan:** Menyelesaikan pula T-0027 (ringkasan utilisasi armada) karena
seluruh kriteria penerimaannya terpenuhi oleh kartu "Tingkat Utilisasi
Armada" pada dashboard yang sama.

---

## [CYCLE 21] 2026-09-09T19:40:00Z — T-0006 — P1 — DONE
**Judul:** Manajemen Rental — mesin alur status + denda keterlambatan terpusat
**Perubahan:**
- `src/lib/rentalWorkflow.ts` (BARU) — mesin transisi MURNI (tanpa React,
  tanpa DB, tanpa jaringan) sebagai SATU sumber kebenaran: matriks transisi
  status rental, efek samping per transisi (penalti & status unit),
  pelabelan status, dan helper `countLateDays`.
- `src/lib/businessRules.ts` — ekstrak `countLateDays()` sebagai helper
  bersama; `calculateRentalCost` mengembalikan `subtotal`, `penalty`, dan
  `durationDays` sekaligus menjadi sumber denda tunggal.
- `src/server/index.ts` — `PUT /api/rentals/:id/status` kini memakai mesin
  transisi: tolak lompatan status & status akhir dengan `409
  INVALID_STATUS_TRANSITION` (beserta daftar transisi yang diizinkan),
  `404` bila rental tak ada, dan kembalikan `meta { lateDays, penalty,
  allowedNext }` agar UI bisa menampilkan denda tanpa menebak.
- `src/lib/db.ts` — `updateRentalStatus` diselaraskan ke matriks yang sama
  (ON_GOING mengunci unit RENTED; COMPLETED/REJECTED membebaskan unit).
- `src/pages/admin/RentalManagement.tsx` — ditulis ulang: filter status,
  pencarian, kartu ringkasan total denda keterlambatan, penanda visual
  keterlambatan, tombol aksi hanya untuk transisi yang sah, konfirmasi
  sebelum menyelesaikan, serta penanganan pesan error 409 yang jelas.
- `src/pages/staff/StaffDashboard.tsx` — `aria-label` pada tombol
  Setujui/Tolak (aksesibilitas).
**Perilaku yang dijaga:**
- Denda keterlambatan kini dihitung IDENTIK di UI, server, dan laporan
  karena ketiganya memanggil helper yang sama — menutup inkonsistensi
  lama (UI memakai tarif tetap 10% vs server memakai `LATE_PENALTY_PER_DAY`).
- Status akhir (COMPLETED, REJECTED) terkunci: tidak bisa dibuka lagi,
  mencegah unit "terpakai" setelah sewa selesai.
- Endpoint tetap terproteksi: tanpa token -> 401.
- Tidak ada `any`, tidak ada concat SQL (seluruhnya parameter `?`).
**Pengujian:**
- `tests/rentalWorkflow.test.mjs` (BARU) — 67 pemeriksaan: matriks
  transisi (jalur sah, lompatan ditolak, status akhir terkunci, transisi
  ke status sama ditolak), konsistensi denda terhadap `calculateRentalCost`,
  efek unit per transisi, agregat `summarizeLatePenalties`, dan konsistensi
  terhadap 50 rental seed nyata.
- `tests/api.test.mjs` — 12 pemeriksaan baru untuk alur status.
- `tests/run-tests.mjs` — bundle `rentalWorkflow.ts` + suite baru (15 suite).
**Verifikasi:** typecheck PASS · build PASS (560 KB) · npm test 15/15 suite PASS
**Catatan:** Blok uji alur status sengaja diletakkan PALING AKHIR di
`tests/api.test.mjs` karena bersifat mutasi (mengubah status rental).
Bila nanti ditambah uji yang bergantung pada status seed, letakkan
SEBELUM blok tersebut agar hasilnya tetap deterministik.

---

## [CYCLE 22] 2026-09-10T11:30:00Z — T-0007 — P1 — DONE
**Judul:** Manajemen Kontrak Digital + e-signature canvas (kode SBS/CONTRACT/YYYY/MM/SEQ)
**Perubahan:**
- `src/lib/contracts.ts` (BARU) — SATU sumber kebenaran kontrak: penomoran
  `SBS/CONTRACT/<YYYY>/<MM>/<SEQ-4digit>`, syarat & ketentuan baku, status
  penandatanganan, model pratinjau, dan render HTML cetak A4. Modul MURNI
  (tanpa DOM/DB/jaringan) sehingga aman dipakai browser, edge worker, & Node.
- `src/components/SignatureCanvas.tsx` (BARU) — kanvas tanda tangan: Pointer
  Events (stylus/layar sentuh bekerja), skala Device Pixel Ratio (goresan
  tidak pecah di layar retina), riwayat sapuan untuk tombol "Urungkan",
  `touch-action: none` agar halaman tidak ikut tergulung saat menggambar.
- `src/components/ContractPanel.tsx` (BARU) — satu panel untuk seluruh siklus
  kontrak: terbitkan, tinjau, tanda tangani, cetak. Props `canIssue`/`canSign`
  membuat panel bisa dipakai Admin, Staf, dan Pelanggan tanpa cabang kode.
- `src/components/ContractViewer.tsx` (BARU) — pratinjau identik dengan hasil
  cetak A4; pencetakan didelegasikan ke `printHtmlDocument()`.
- `src/lib/db.ts` — `createContract()` menolak kontrak ganda per transaksi
  (`KONTRAK_SUDAH_ADA`); `signContract(id, signerName, signature)` menyimpan
  nama penandatangan + goresan PNG dan menolak tanda tangan ulang
  (`KONTRAK_SUDAH_DITANDATANGANI`) agar bukti waktu audit tidak tertimpa.
- `src/lib/validators.ts` — `validateContractSignature()` terpusat: nama wajib,
  goresan wajib (bukan sekadar string kosong), format data URL gambar divalidasi,
  dan ukuran dibatasi 200.000 karakter.
- `src/lib/documentPrinter.ts` — `printHtmlDocument()` untuk dokumen yang sudah
  jadi HTML-nya (kontrak), tetap mengembalikan `PrintResult` tanpa melempar.
- `src/server/index.ts` — `GET /api/contracts` (envelope `{success,data,meta}`
  + pratinjau per kontrak), `GET /api/contracts/:id/preview` (HTML disusun
  server agar hasil cetak identik dengan pratinjau), `POST /api/contracts`
  (Admin/Staf saja; Pelanggan 403), `POST /api/contracts/:id/sign`.
- `src/types/index.ts` — field `signer_name` & `signature_data_url` pada `Contract`.
**Keamanan yang dijaga:**
- Pelanggan HANYA boleh menandatangani kontrak MILIKNYA (`maySignContract`),
  dicek SETELAH validasi agar penyerang tidak bisa membedakan "kontrak orang
  lain" dari "kontrak tidak ada" lewat kode status (403 vs 404).
- Goresan tanda tangan hanya diterima bila `data:image/(png|jpeg|webp);base64`
  — `javascript:` dan URL eksternal ditolak, mencegah XSS lewat tanda tangan.
- Semua teks kontrak di-escape sebelum masuk HTML cetak.
**Penyambungan UI (yang belum rampung di sesi sebelumnya):**
- `src/pages/admin/RentalManagement.tsx` — sub-tab baru "Kontrak Digital"
  (role=tablist, aria-selected) sehingga Admin dapat menerbitkan & menandatangani
  kontrak tanpa berpindah halaman.
- `src/pages/staff/StaffDashboard.tsx` — tabel kontrak pasif diganti
  `ContractPanel` (Staf dapat menerbitkan & meninjau; `canSign=false` karena
  yang berhak menandatangani adalah pihak penyewa). Empat `Promise<any>`
  pada props diganti `Promise<void>` (nol `any`).
- `src/App.tsx` — `handleCreateContract` baru; StaffDashboard & RentalManagement
  kini menerima `contracts`, `equipments`, `users`, `onCreateContract`,
  `onSignContract`.
**Pengujian:**
- `tests/contracts.test.mjs` (BARU) — modul kontrak: format penomoran, pengkleman
  nomor urut (0/negatif/NaN/ >9999), tanggal rusak jatuh ke 1970-01, nomor urut
  per periode (`maksimum+1`, bukan `jumlah+1`), normalisasi status 0/1 & boolean,
  pratinjau pada data kosong, escape HTML, penolakan data URL berbahaya.
- `tests/contractPanel.test.mjs` (BARU) — 23 pemeriksaan render: data nyata,
  hak akses pelanggan, kontrak sudah/belum ditandatangani, empty state,
  aksesibilitas (aria-label), ketahanan pada rujukan rusak, dan goresan
  berbahaya tidak sampai ke atribut `src`.
- `tests/api.test.mjs` — uji kontrak ditulis ulang: envelope terstandar,
  400/403/404, penolakan tanda tangan atas kontrak pelanggan lain.
- `tests/run-tests.mjs` — bundle `ContractPanel.tsx` + suite baru (17 suite).
**Verifikasi:** typecheck PASS · build PASS (590 KB) · npm test 17/17 suite PASS
**Catatan:** Pratinjau cetak A4 kontrak (T-0029) kini sudah terpenuhi oleh
`ContractViewer` + `renderContractHtml()`; T-0029 dapat ditandai DONE pada
pemeriksaan berikutnya.


---

## Cycle 23 — 2026-09-10 · T-0008: Manajemen Pembayaran (unggah bukti + verifikasi staf)

**Status:** DONE · P1 · CORE

**Ringkasan:**
Mesin verifikasi pembayaran kini menjadi satu sumber kebenaran bagi server,
basis data, dan antarmuka. Sewa tidak dapat dioperasikan sebelum tagihannya
lunas, pelanggan dapat melampirkan bukti transfer, dan staf dapat mengesahkan
atau menolak bukti tersebut.

**Berkas baru:**
- `src/lib/paymentWorkflow.ts` (BARU, 409 baris) — modul MURNI: tidak menyentuh
  DOM, tidak mengambil data, tidak memanggil jaringan.
  - Matriks transisi: `UNPAID → PENDING_VERIFICATION → PAID | FAILED`,
    `FAILED → PENDING_VERIFICATION`, `PAID` adalah status akhir.
  - `validatePaymentProofPath()` — ekstensi `.png/.jpg/.jpeg/.webp/.pdf`,
    maksimal 255 karakter, menolak path traversal (`../../`), jalur absolut,
    backslash Windows, serta skema `javascript:` dan `data:`.
  - `mayTouchPayment()` — pelanggan hanya boleh menyentuh tagihannya sendiri;
    `mayVerifyPayment()` — hanya ADMIN/STAFF yang boleh mengesahkan.
  - `checkPaymentGate()` — mengunci `ON_GOING` sampai `PAID`; override hanya
    sah bila `role === 'ADMIN'` dan dinyatakan eksplisit.
  - `summarizeRentalPayment()` (status terburuk menang) dan
    `summarizePaymentQueue()` (siap diverifikasi vs menunggu bukti).

**Perubahan:**
- `src/lib/db.ts` — `verifyPayment` menolak verifikasi tanpa bukti
  (`BUKTI_TRANSFER_BELUM_ADA`) dan verifikasi ulang
  (`STATUS_PEMBAYARAN_TIDAK_VALID`); `rejectPayment` (BARU) menurunkan
  `PENDING_VERIFICATION → FAILED`; `addPaymentProof` membersihkan
  `verified_at`/`verified_by_name` bila bukti diganti agar peninjauan usang
  tidak melekat pada berkas baru; `updateRentalStatus` menerima
  `{ overrideUnpaid }` dan menjalankan gerbang pembayaran.
- `src/server/index.ts` — tiga endpoint RBAC-ketat baru:
  `POST /api/payments/:id/proof`, `/verify`, `/reject`, dengan pemetaan kode
  galat terpusat `toPaymentErrorResponse()`; `GET /api/payments` kini
  ber-envelope `{ success, data, meta: { total, queue } }`; endpoint status
  sewa meneruskan `overrideUnpaid` dan melaporkan `meta.paymentOverride`.
- `src/pages/staff/StaffDashboard.tsx` — panel verifikasi: pencarian, ringkasan
  antrean, penanda siap/belum bukti, aksi Tolak, pratinjau bukti yang lebih
  informatif, dan empty state.
- `src/pages/customer/CustomerPortal.tsx` — label status Bahasa Indonesia,
  validasi nama berkas sebelum dikirim, tombol unggah disembunyikan pada
  tagihan final, peringatan "Bukti ditolak — silakan lampirkan ulang".
- `src/App.tsx` — `handleRejectPayment` baru, diteruskan ke StaffDashboard.
- `src/lib/seedGenerator.ts` — sewa `ON_GOING` kini selalu `PAID` (status
  pembayaran tidak lagi bertentangan dengan gerbang bisnis §4.3 poin 4);
  `rng()` tetap dipanggil agar data turunan tidak bergeser.

**Pengujian:**
- `tests/paymentWorkflow.test.mjs` (BARU) — 121 pemeriksaan: matriks transisi,
  validasi berkas (23 kasus), RBAC, gerbang pembayaran + override, ringkasan
  status & antrean (aman pada `amount` rusak/`null`), konsistensi data nyata.
- `tests/api.test.mjs` — 43 pemeriksaan baru: unggah bukti, penolakan berkas
  berbahaya, kepemilikan tagihan (403), larangan pelanggan memverifikasi,
  penolakan bukti, unggah ulang setelah ditolak, dan gerbang pembayaran
  (409 `TAGIHAN_BELUM_LUNAS`, override STAFF ditolak, override ADMIN diizinkan).
- `tests/run-tests.mjs` — bundle `paymentWorkflow.ts` + suite baru (18 suite).

**Verifikasi:** typecheck PASS · build PASS (597,90 KB) · npm test 18/18 suite PASS
**Catatan:** Nol `any`, nol penyambungan string SQL, tanpa kredensial pada berkas.

---

## Cycle 24 — 2026-09-10 — T-0010: GPS Tracking: peta real-time + popup telemetry

**Status:** SELESAI (P1, CORE) — seluruh kriteria penerimaan terpenuhi.

**Inti perubahan — satu sumber kebenaran untuk telemetri armada:**
- `src/lib/fleetTelemetry.ts` (BARU, 476 baris) — modul MURNI: tidak menyentuh
  DOM, tidak memanggil jaringan, tidak mengambil data sendiri. Dipakai bersama
  oleh edge API dan antarmuka, sehingga apa yang tampil di layar tidak pernah
  berbeda dengan keputusan server. Isinya:
  - **Reduksi deret waktu** — data GPS adalah deret waktu (55 titik pada 50
    unit), bukan satu baris per unit. Modul memilih tepat SATU titik TERBARU
    per unit; tanpa ini peta memunculkan banyak marker bertumpuk.
  - **Klasifikasi** — pergerakan (`BERGERAK`/`DIAM`), bahan bakar
    (`KRITIS`/`RENDAH`/`NORMAL`), dan keusangan sinyal (`SEGAR`/`WASPADA`/`USANG`)
    dari umur titik rekam.
  - **Normalisasi** — nilai kolom string dibersihkan (spasi ganda, huruf, koma
    desimal) dan tanggal basis data `YYYY-MM-DD HH:mm:ss` diparse sebagai UTC
    agar tidak bergeser hari di mesin berzona berbeda.
  - `normalizeFleetFilter()` — memotong kata kunci pada `SEARCH_MAX_LENGTH` dan
    menolak nilai filter tak dikenal (dinormalkan, bukan menyebabkan 500).
  - Pembantu tampilan: `formatCoordinate`, `formatSpeed`, `formatRelativeTime`,
    `getMovementLabel`, `getFuelLabel`, `getStalenessLabel`.

**API:**
- `src/server/index.ts` — `GET /api/tracking` ditulis ulang: kini ber-envelope
  `{ success, data: { rows, summary }, meta: { total, scope, raw_points } }` dan
  ber-RBAC ketat. ADMIN/STAFF → `SELURUH_ARMADA`; CUSTOMER → `UNIT_SEWA_SAYA`
  (hanya `equipment_id` dari rental `ON_GOING`/`APPROVED` miliknya sendiri).
  Endpoint tetap terproteksi (401 tanpa token).

**Antarmuka:**
- `src/pages/admin/GpsTrackingPage.tsx` — ditulis ulang (523 baris): panel
  penyaringan (status mesin, pergerakan, level BBM, pencarian) lengkap dengan
  `aria-label` di setiap kontrol, kartu ringkasan agregat, peta, dan daftar
  armada. Mendukung props `title` / `subtitle` / `initialFilter` sehingga bisa
  dipakai ulang di portal pelanggan.
- `src/components/LeafletMap.tsx` — kini menerima `FleetTelemetryRow` (bukan
  `GpsTracking` mentah); isi popup di-escape agar nama unit tidak dapat
  menyuntik HTML.
- `src/pages/customer/CustomerPortal.tsx` — tab kelima **Lacak Unit Saya**,
  memakai ulang halaman yang sama dengan judul & subjudul pelanggan.
- `src/App.tsx` — meneruskan `trackingData` ke CustomerPortal.

**Pengujian (2 suite baru, 20 suite total):**
- `tests/fleetTelemetry.test.mjs` (BARU) — 117 pemeriksaan: reduksi satu titik
  per unit, klasifikasi gerak/BBM/keusangan, normalisasi filter, dan ketahanan
  pada data rusak (`null`, `NaN`, koordinat di luar rentang bumi).
- `tests/gpsPage.test.mjs` (BARU) — 37 pemeriksaan smoke render, termasuk empty
  state, cabang "hasil penyaringan kosong" (berbeda dari "belum ada data"),
  data rusak, serta judul/subjudul kustom portal pelanggan. Leaflet diganti stub
  (`tests/stubs/leaflet.mjs`) karena pustaka asli menyentuh `window` saat dimuat;
  `useEffect` tidak berjalan pada render statis sehingga peta tidak dibuat.
- `tests/api.test.mjs` — ~28 pemeriksaan baru: proteksi endpoint, envelope,
  reduksi, keabsahan kelas, filter `engine=ON/OFF`, filter tak dikenal
  dinormalkan, pencarian (termasuk 500 karakter), dan RBAC pelanggan yang
  diverifikasi terhadap rental aktifnya.
- `tests/run-tests.mjs` — bundle `fleetTelemetry.ts` + halaman GPS (alias
  Leaflet ke stub) + 2 suite baru.

**Verifikasi:** typecheck PASS · build PASS (614,72 KB) · npm test 20/20 suite PASS
**Catatan:** Nol `any`, nol penyambungan string SQL, tanpa kredensial pada berkas.
