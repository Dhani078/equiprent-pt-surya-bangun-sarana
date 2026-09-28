## Cycle 55 — Audit visual dark halaman tersisa + sweep istilah teknis (T-0078) (2026-09-26)
- GPS dark 8/10 (setelah fix): violation panel terbaca (teks detail #7F1D1D -> var), 'Titik Usang' -> 'Titik Data Lama', grid kartu yatim (orphan baris) -> auto-fit 2 baris seimbang.
- Pengguna dark: vision 4/10 tapi klaimnya SUDANG usang (pill white = sebelum fix T-0076). Verifikasi computed style DOM: badge-available = rgba hijau themed, input = gelap, avatar = ok, sidebar = TIDAK clipped. Ditolak dgn bukti.
- Laporan: bocor istilah dev: 'Sumber: Perhitungan lokal', footer kontrak 'basis data TiDB Cloud' (kontrak.ts, documents.ts, DocumentPreview), 'DATABASE TIDB CLOUD' (ReportsPage), 'edge worker' (AuditLog), tooltip AdminDashboard -> semua ke bahasa user. 'TIDB' string internal modeAccount dipertahankan (bukan UI).
- Verifikasi bundle: sisa 'TiDB' = header protokol driver @tidb-serverless (server-side), nol teks UI.
- 2 asersi test diperbarui mengikuti string baru (preseden sama).
- Gate: tsc 0, 29/29, build OK. Commits: 2fb04bf, ccb2e2f, ad6e819.

## Cycle 55 — Audit visual dark full-app + fix kontras GPS + sweep istilah teknis (2026-09-26)
- Sweep hex lolos: FEE2E2/FEF3C7/0F766E/7F1D1D -> token tema (badge jatuh tempo, pill dipakai, track bar, teks detail merah violation GPS + denda rental — kontras 2:1 -> themed).
- GpsTracking: label salaharti "Titik Usang" -> "Titik Data Lama"; grid stat minmax 150->230px (kartu yatim 7+1 -> 2 baris seimbang, terverifikasi DOM baris=2).
- De-jargon UI user-facing: "Sumber: Perhitungan lokal/Edge API" -> bahasa awam; footer kontrak "basis data TiDB Cloud" -> "sistem resmi"; AuditLogPanel "edge worker" -> "server"; ReportsPage "TIDB CLOUD" -> "SISTEM". Sisa "TiDB" di bundle hanya header protokol server (wajar) + konstanta internal AccountSettings (bukan bocor UI).
- Verifikasi dark mode via CDP screenshot: Servis, GPS (8/10), Pengguna (pill+input sudah themed post-T-0076), Laporan.
- Vision claim sidebar "terpotong" & avatar rusak TIDAK terbukti di DOM (scrollWidth<=clientWidth, img naturalWidth>0) — ditolak dgn bukti.
- Gate: tsc 0, 29/29, build OK.

## Cycle 56 — Audit visual Staff & Customer portal (T-0079) (2026-09-26)
- Login role STAFF/CUSTOMER via sessionStorage sbs_active_user — halaman yang belum pernah diaudit akhirnya ter-screenshot.
- BUG NYATA: 8 titik ternary '#FFFFFF' lolos sweep T-0076 (kartu quick-nav CustomerPortal x6, tab StaffDashboard x3, kartu unit GPS, tab Rental) -> var(--color-surface). Verified DOM: rgb(30,41,59).
- color-scheme light/dark di root+dark: date picker & select native ikut tema (sebelumnya putih mencolok).
- Staff: jatuh tempo ISO -> formatTanggal (inkonsistensi format tanggal nyata, vision menemukan dari dekat).
- Vision claim BAST "sidebar clipped/table overflow" TIDAK terbukti di DOM (scrollWidth<=clientWidth semua; .table-container sudah overflow-x auto) — JPEG lama, ditolak dgn bukti.
- Known limitation (bukan bug): foto unit generik per kategori (STITCH_IMAGES) — perlu aset foto asli per unit.
- Gate: tsc 0, 29/29, build OK. Commits 9befa0f + ini.

## Cycle 57 — Bug fungsional Staff (T-0080) (2026-09-26)
- Sidebar.tsx: width 260px tanpa flex-shrink -> menyusut 88px di halaman BAST bertabel 1483px (label terpotong, footer crop, tombol konten menindih nav). Fix: flexShrink:0. Verified aside=260px clip=0.
- StaffDashboard/App: menu "Kontrak Sewa Digital" & "Transaksi Penyewaan" hanya menandai aktif tanpa mengubah konten (selalu payments). Fix: prop activeMenu -> useEffect sinkron activeSubTab. Verified: panel kontrak tampil, 50 baris.
- Gate: tsc 0, 29/29, build OK. Commits c1bbe26, (staff sync).

## Cycle 58 — Pengaturan Akun (2026-09-26)
- Audit visual dark: kartu/input/pill/label sudah themed (klaim vision "putih" ditegakkan via computed style = bukan bug).
- AccountSettings.tsx: jargon 'MySQL 8.0 (Cloud)' -> 'Terpusat (Cloud)'; peringatan DATABASE_URL -> bahasa awam.
- Gate: tsc 0, 29/29, build OK.

## Cycle 58 selesai — Customer portal & settings (2026-09-26)
- CustomerPortal: nav "Penyewaan Saya"/"Tagihan"/"Lacak"/"Kontrak" dulu hanya highlight, konten tetap katalog -> activeMenu prop + peta menu->tab. Verified CDP: tiap klik ganti heading panel.
- AccountSettings: 'MySQL 8.0 (Cloud)'->'Terpusat (Cloud)', peringatan DATABASE_URL -> bahasa awam. Verified browser.
- StaffDashboard: tanggal sewa ISO -> formatTanggal.
- Klaim vision "date input putih / tile putih" ditegakkan via computed style (sudah dark; artifact screenshot lama).
- deleg_8dff4f3a mati (Connection error 322s) sebelum menyentuh tree — dikerjakan manual.
- Gate: tsc 0, 29/29, build OK. Commits: 666aec4, db879fa, 900aada, (tanggal lokal).

## Cycle 59 — KONEKSI TiDB NYATA (milestone) (2026-09-27)
- TiDB cluster user: DDL ternyata jalan di schema `test` (9 tabel terisi dari seeding lama) + `sys` diblokir khusus DDL. Lengkapi 11 tabel: tambah `audit_log` + `settings` (seed late_penalty_per_day=50000, company_name) via mysql client -> test.
- BUG ARSITEKTUR: worker declare binding DATABASE_URL tapi db.ts cuma baca import.meta/process.env -> secret tak pernah terbaca di Workers. Fix: configureDatabaseUrl() dari middleware /api/*.
- Bukti via wrangler dev lokal (.dev.vars gitignored): /api/health data_mode=TIDB; login admin = hash DB asli; 50 users/50 equipments/55 gps dari TiDB; CRUD equipment probe OK (51->50, delete bersih); audit LOGIN tercatat.
- Gate: tsc 0, 29/29, build 4.79s. Commit f4b42da.
- BELUM: deploy production (wrangler login CF expired — perlu user OAuth) + `wrangler secret put DATABASE_URL/SESSION_SECRET`.

## Cycle 59b — DEPLOY PRODUCTION + TiDB LIVE (2026-09-27)
- wrangler login OK (OAuth browser). Deploy `npm run deploy` -> versi baru di workers.dev.
- Secret DATABASE_URL+SESSION_SECRET dipasang (wrangler versions secret put -> deploy).
- BUG PRODUKSI: login 500. wrangler tail: PBKDF2 600000 iterasi ditolak Workers (maks 100000). Fix: konstanta 100k + hash demo regen. 
- Verified live: /api/health TIDB, session_secret permanen, admin login = baris DB asli, 50 equipment, revenue dari TiDB.
- Catatan: skema aplikasi ada di DB `test` cluster serverless (bukan sys). DDL di `sys` diblokir flag tapi tidak dipakai.

## Siklus 60 — 2026-09-27
- Akar: browser tidak pernah bicara API untuk mutasi & 4 halaman 401 senyap.
- Jembatan penuh login->token->cermin->write-through; RBAC method-aware; /api/gps + PUT profil.
- Verif production via CDP: 3 role, 401=0, persist UI->TiDB terbukti bolak-balik, tema gelap OK.

## Siklus 61 — 2026-09-28
- E2E alur sewa penuh production 9/9 (CDP UI asli): unit->sewa->approve->kontrak+tagihan otomatis->TTD->bukti->LUNAS.
- Cermin browser re-sync saat login; rute DELETE berjenjang; sanitasi GitHub main (username TiDB keluar, password tak pernah masuk git).

## Siklus 62 — 2026-09-28
- Audit Laporan+BAST production: preview 2 jenis, export blob, PrintToPDF A4, CSS print benar, 0 galat 4xx, kontras WCAG aman.

## Siklus 63 — 2026-09-28
- Audit semua tombol production pasca-jembatan: 198 klik, 0 error console/network/click-issue.
- Tabel analitik laporan tidak lagi overflow di lebar penuh (padding dirapatkan).

## Siklus 64 — 2026-09-28
- Fitur: preset periode cepat pada panel laporan (6 preset, aria-pressed, terverifikasi UI+API production).
- presetRange() + REPORT_PRESET_LABELS di lib/reports.ts; 9 unit test.

## Siklus 65 — 2026-09-28
- Fitur: live-sync cermin browser (interval 30s + refresh saat tab fokus; hemat saat tab tersembunyi).
- Teruji production dua arah (tambah & hapus unit lintas klien, tanpa reload).

## Siklus 66 — 2026-09-28
- Responsif HP: drawer sidebar + hamburger, topbar ringkas, main minWidth 0, grid anti-overflow.
- Sapuan CDP: 0 overflow di semua halaman (admin 9 + customer 6 + login) pada 390px & 1280px.

## Siklus 67 — 2026-09-28
- Aksesibilitas sentuh HP: lantai target 44px (header/main/dialog/sidebar) di <=767px.
- Audit 360/320px: 0 target kecil, 0 overflow, dialog form muat; 3 role.

## Siklus 68 — 2026-09-28
- Fitur: drill-down baris laporan (kode RNT) -> pratinjau dokumen BAST terkait + pesan tanpa-dokumen.

## Siklus 69 — 2026-09-28
- Fitur: banner peringatan offline (Worker tak terjangkau / perangkat putus), pulih otomatis.

## Siklus 70 — 2026-09-28
- Fitur: antrean mutasi offline FIFO + flush otomatis saat pulih + badge tertahan.

## Siklus 71 — 2026-09-28
- Test: suite offlineQueue 21 assert (FIFO, kapasitas, flush, guard re-antre).
- FIX bug: guard sedangFlush pada flushAntreanOffline (mencegah re-antre tak berujung saat server mati).

## Siklus 72 — 2026-09-28
- Fitur: daur-hidup kontrak - status Kedaluwarsa, guard tanda tangan 409, tombol disembunyikan, filter+badge.
- Insiden: 13 tagihan terhapus oleh harness; dipulihkan dari seed kanonik; harness diberi pengaman cakupan + sidik jari.

## Siklus 73 — 2026-09-28
- Refactor: server/index.ts dipecah jadi http.ts + context.ts + routes/* (7 domain).
- Fitur: perpanjangan kontrak kedaluwarsa + validator tanggal nyata (31 Feb ditolak).
- Insiden: harness memperpanjang 13 kontrak produksi; dipulihkan; harness diberi kontrak uji sendiri.

## Siklus 74 — 2026-09-28
- Refactor: reports.ts 1278 baris -> reports/ (13 berkas, maks 224 baris). API identik, verifikasi 11 laporan production.

## Siklus 75 — 2026-09-28
- Refactor: db.ts 1202 baris -> db/index.ts + store/ (9 berkas, maks 358 baris). Verifikasi tulis-baca TiDB production.

## Siklus 76 — 2026-09-28
- Refactor: CustomerPortal.tsx -> portal/PortalHeader.tsx (header + 5 tab). Verifikasi UI production 5 tab.

## Siklus 77 — 2026-09-28
- Refactor: EquipmentManagement.tsx -> equipment/EquipmentFormModal.tsx. Alur tulis via modal terverifikasi production.

## Siklus 78 — 2026-09-28
- Refactor: AdminDashboard.tsx -> dashboard/panels.tsx (2 panel analytics). Verifikasi UI production.

## Siklus 79 — 2026-09-28
- Refactor: RentalManagement.tsx -> rental/{StatusConfirmModal,AddRentalModal}.tsx. Kedua modal terverifikasi production.

## Siklus 80 — 2026-09-28
- Refactor: MaintenanceManagement.tsx -> maintenance/{ServiceHistoryPanel,MaintenanceFormModal}.tsx. Terverifikasi production.

## Siklus 81 — 2026-09-28
- Refactor: validators.ts -> validators/{core,rules,fields,forms,contract,index}. Barrel menjaga 8 consumer lama tanpa edit.

## Siklus 82 — 2026-09-28
- Refactor: customerPortal.ts -> paket src/lib/portal/ (6 modul + barrel). Portal terverifikasi production.

## Siklus 83 — 2026-09-28
- Refactor: GpsTrackingPage.tsx -> gps/{GeofenceAlertBanner,TelemetryFilterPanel}.tsx. Terverifikasi production.
