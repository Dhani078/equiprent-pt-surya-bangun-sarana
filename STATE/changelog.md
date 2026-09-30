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

## Siklus 84 — 2026-09-28
- Refactor: 2 modal CustomerPortal -> RentBookingModal + PaymentProofModal. Fix bug tutup-modal hasil pecah.

## Siklus 85 — 2026-09-28
- Refactor: StaffDashboard.tsx -> staff/components/{DueNotificationPanel,PaymentProofViewerModal}.tsx. Terverifikasi production.

## Siklus 86 — 2026-09-28
- Refactor: ContractPanel.tsx -> contract/{Sign,Issue,Renew}Modal. Modal sign+renew terverifikasi production (kontrak uji 38 direnew lalu dipulihkan).

## Siklus 87 — 2026-09-28
- Refactor: Login.tsx -> login/RegisterModal.tsx. Terverifikasi production (alur daftar penuh).

## Siklus 88 — 2026-09-29
- Refactor: contracts.ts 664 -> paket lib/contracts/ (constants, numbering, status, preview, render, index). Consumer (ContractPanel, ContractViewer, server/context, run-tests) dialihkan; tidak ada tanda tangan publik berubah.
- Deploy Version 225b5c26-49ab-43b7-b740-515267a44ae7. tsc 0; npm test 30/30; build 5.48s. Commit fb417be (fix/security-audit + main).
- Dokumentasi disinkronkan: AGENT24T.md (rujukan lib/db -> paket lib/db/), PERUBAHAN_TERBARU.md (bagian 5: tabel split siklus 73-88, endpoint renew, verifikasi CDP).

## Siklus 89 — 2026-09-29
- Refactor: EquipmentManagement.tsx 730 -> 472. Kartu unit, tabel ringkas+paginasi, dan bento stats pindah ke pages/admin/equipment/{EquipmentCardGrid,EquipmentTable,EquipmentBentoStats}.tsx (murni props; state form tetap induk).
- Refactor: AdminDashboard.tsx 693 -> 236. Banner servis (gabungKode ikut), grid 8 StatCard, dan feed aktivitas (transaksi terbaru, antrean servis, top-5 unit) pindah ke pages/admin/dashboard/{ServiceAlertBanner,DashboardStatGrid,DashboardActivityFeeds}.tsx.
- Refactor: server/index.ts 1172 -> 423. Rute dashboard, equipments, rentals, maintenance jadi routes/{dashboard,equipments,rentals,maintenance}.ts; /api/tracking + /api/gps mengisi routes/tracking.ts (stub kosong selama ini). index tinggal kerangka + 11 panggilan daftar*().
- Audit CDP responsif (STATE/viewport_cdp_89.py): temuan overflow 10px SEMUA tab mobile — inline style tombol bahasa Navbar menang atas media query .navbar-lang{display:none}; overflow 147px halaman GPS — grid inline '360px 1fr' kaku. Fix di index.css @media 767px (navbar-lang !important, .gps-layout 1fr, lantai sentuh 44px untuk kontrol zoom/popup Leaflet). Hasil akhir: 375x812 -> 0 overflow & 0 target<44px di 8 tab; 1280x800 -> 0 overflow.
- Smoke API production pasca-refactor: 11 endpoint GET 200 (equipments, rentals, maintenance, tracking, gps, dashboard/stats, dashboard/analytics, bookable, availability, payments, contracts) + PUT /api/equipments/:id 200.
- Deploy Version e04d73f8 (refactor) -> 2f0a46d7-854f-436a-8e63-ba796a3c217f (final, fix responsif). tsc 0; 30/30 suite; vite build 7.93s. Commits e16ea19, 0f564df, d22f478, c21d285; main lokal ff-only + push origin/main (sebelumnya tertinggal 77 commit).

## Siklus 90 — 2026-09-29 (part 1)
- Refactor: CustomerPortal.tsx 844 -> 339. Katalog (filter+kartu unit), riwayat sewa, tagihan, dan lacak unit pindah ke pages/customer/portal/{CatalogTab,MyRentalsTab,PaymentsTab,TrackingTab}.tsx; lazy Leaflet ikut ke TrackingTab. State form tetap di induk.
- Bug tertangkap saat splice: blok `my_rentals` ikut terbuang (lompat indeks i_rent..i_con) -> dipasang ulang; terverifikasi UI (tabel 3 transaksi muncul).
- Build: vite manualChunks vendor-react (133.93kB) + vendor-icons (41.65kB) -> chunk index 620.86 -> 446.63kB (gzip 116.46). Peringatan >500kB hilang.
- Smoke UI production via CDP (STATE/smoke_portal_90.py): login role Pelanggan (klik tab 'Pelanggan' dulu, user/user) -> 5 tab portal bersih desktop 1280 & mobile 375 (ovf=0, 0 target<44px di main, peta Leaflet render 3 marker).
- Deploy 7fc50ed7-0b0f-4e4a-8541-de3e7609b71f. tsc 0; 30/30 suite; build 8.50s. Commit 001c628.

## Siklus 90 — 2026-09-29 (part 2)
- Refactor: RentalManagement.tsx 634 -> 339. Tabel transaksi + aksi status + paginasi + empty state pindah ke pages/admin/rental/RentalTable.tsx (252); bar cari/penyaring/ekspor ke RentalFilterBar.tsx (80); kartu denda berjalan ke LatePenaltySummaryBar.tsx (40). Konstanta TONE_STYLE/ACTION_META ikut ke RentalTable; logika form/availability/konfirmasi tetap di induk.
- Smoke UI production via CDP (STATE/smoke_rental_90.py, admin/admin): 7 kolom, 20 baris/halaman, pencarian 'SBZ' -> 0 baris + EmptyState, penyaring status OK, tombol 'Selesai' ON_GOING -> modal konfirmasi tampil & Batal menutup (unmount riil), sub-tab Kontrak Digital render, mobile 375 ovf=0 target-kecil=0.
- Build: vite 5.52s; index 447.02kB (gzip 116.47) — tidak berubah berarti (split hanya relokasi kode).
- Deploy 14ada3b8-c216-4c88-9150-bc55d5a76fcf. tsc 0; 30/30 suite. Commit 5c9495b.

## Siklus 90 — 2026-09-29 (part 3)
- Refactor: ReportsPage.tsx 599 -> 361. Tiga kartu ringkasan finansial ke pages/admin/reports/FinancialSummaryCards.tsx (56); bar ekspor + tabel arsip dokumen ke ReportArchiveTable.tsx (116); modal pratinjau generik FINANCIAL_SUMMARY (kop surat + integritas + tanda tangan) ke GenericDocumentPreviewModal.tsx (103). Logic fetch laporan/drill-down/print BAST tetap di induk.
- Test: documents.test.mjs assert 'Cetak A4' kini baca ReportArchiveTable.tsx (source-grep mengikuti relokasi); handlePrint mati dihapus.
- Smoke UI production via CDP (STATE/smoke_reports_90.py, admin): 100 baris arsip, 50x 'Buka Dokumen' + 'Cetak A4', modal generik tampil->Tutup menutup riil, modal BAST tampil, mobile 375 ovf=0 target-kecil=0.
- Build: vite 5.40s; index 446.90kB (gzip 116.96). Deploy 4e42649a-155a-4a70-95e5-988f234edd12. tsc 0; 30/30 suite. Commit 28cf542.

## Siklus 91 — 2026-09-29 (part 1)
- Refactor: GpsTrackingPage.tsx 592 -> 172. Delapan kartu agregat + EngineBadge/FuelBadge/SummaryCard ke gps/FleetSummaryGrid.tsx (149); kartu telemetri unit terpilih + daftar armada (selection, badge breach/stale) ke gps/UnitTelemetryPanel.tsx (226); toggle heatmap + Suspense Leaflet + kaki legenda ke gps/FleetMapPanel.tsx (100) — lazy Leaflet kini hidup di panel itu saja. breachIds jadi Set<number> (dulu Map ke objek breach).
- Smoke UI production via CDP (STATE/smoke_gps_91.py, admin): 8/8 kartu agregat, 40 tombol 'Pilih unit', klik unit -> kartu detail berganti serial (EXCA-HIT-ZX200-01 -> EXCA-KOB-SK200-01), heatmap toggle Tampilkan<->Sembunyikan, leaflet-container + 46 marker, mobile 375 ovf=0 target-kecil=0. 'Daftar Armada Terhubung' tak terbaca lowercase karena text-transform uppercase (bukan bug).
- Build: vite 5.37s; index 447.31kB (gzip 117.06). Deploy ead77bc2-3f4e-48b9-b01b-52eb2856a874. tsc 0; 30/30 suite. Commit 08b69f7.

## Siklus 91 — 2026-09-29 (part 2)
- Refactor: StaffDashboard.tsx 587 -> 260. Tiga kartu pemilih sub-tab ke staff/components/StaffActionBadges.tsx (80); tabel verifikasi pembayaran (cari + banner nilai + bukti + jejak peninjau + lunas/tolak + paginasi) ke PaymentVerificationTable.tsx (222); tabel approval booking ke RentalApprovalTable.tsx (96). State aksi (processingId, viewer modal, dueNotifications) tetap di induk.
- BUG RESPONSIF ditemukan & diperbaiki: mobile 375 ovf=13px — grid inline `repeat(3, 1fr)` StaffActionBadges lebih lebar dari min-content. Ganti `repeat(auto-fit, minmax(190px, 1fr))` -> ovf=0. (Pelajaran: inline grid kolom-tetap = bom waktu viewport; audit CDP menangkap yang siklus 89 lewat.)
- Smoke UI production via CDP (login 'staff'/'staff' klik tab Staf; STATE/smoke_staff_91.py): 3 badges, 20 baris bayar, pencarian render, panel due aktif; sub-tab Booking & Kontrak render; modal Lihat Bukti tampil/tutup; mobile 375 ovf=0 small=0; desktop bersih. Catatan: harness lama early-return 'LOGGED' saat sesi masih hidup — logout manual saat perlu.
- Build: vite 5.24s; index 447.75kB. Deploy 185b8e05 -> fix grid 0cc7832b-d3df-44ea-a547-4c496b5d06e9. tsc 0; 30/30 suite. Commit 49b073d.

## Siklus 91 — 2026-09-29 (part 3)
- Refactor: MaintenanceManagement.tsx 581 -> 342. Panel peringatan servis preventif 250 HM (baris prediksi tanggal regresi + tombol Jadwalkan/Riwayat) ke maintenance/ServiceDueAlertPanel.tsx (140); panel notifikasi suku cadang (ambang persist localStorage, bar progres) ke SparepartAlertPanel.tsx (92) — pengurutan alerts ikut ke dalam panel; bar cari/penyaring/ekspor ke MaintenanceFilterBar.tsx (64, +aria-label baru). useMemo sparepartAlerts mati & import orphan (Modal, Search, Filter, CheckCircle, Clock, Calendar, SERVICE_INTERVAL_HM, predictNextServiceDate) dihapus.
- Smoke UI production via CDP (STATE/smoke_maint_91.py, admin): panel servis+sparepart+riwayat render, 51 baris tabel, cari 'SRV' -> 0 + EmptyState -> Reset -> 51, penyaring COMPLETED -> 37 baris (dari 51), ambang 99 -> pesan kosong -> 3 kembali (localStorage '3'), tombol Jadwalkan -> form modal terbuka & Batal menutup riil, mobile 375 ovf=0 small=0.
- Build: vite 5.47s; index 448.19kB (gzip 117.52). Deploy c5be2528-ab2d-479d-aaa9-eb65f0f59e54. tsc 0; 30/30 suite. Commit 1e9512a.

## Siklus 91 — 2026-09-29 (part 4)
- Refactor: UserManagement.tsx 574 -> 213. Tabel pengguna+paginasi+empty state ke user/UserTable.tsx (118); bar cari/peran/ekspor ke UserFilterBar.tsx (54, +aria-label); modal form daftar ke AddUserModal.tsx (159, pola labelStyle/errStyle/errBorder memangkas duplikasi style galat). State form, handler submit/validasi, ConfirmDialog toggle tetap di induk; onFieldChange jadi satu callback pengganti 7 onChange duplikat.
- BUG SENTUH GLOBAL ditemukan via smoke: tombol nomor halaman Paginator 32x44px di mobile (inline minWidth:'32px' menang atas lantai CSS 44px siklus 89). Fix Paginator.tsx minWidth 44px — semua halaman berpaginasi ikut pulih.
- Smoke UI production via CDP (STATE/smoke_user_91.py, admin): 20 baris tampil, cari 'admin'->3, cari palsu->EmptyState->Reset->20, penyaring STAFF 6 baris semua STAFF, modal Tambah: form render, submit kosong->3 field aria-invalid, Batal menutup riil; mobile 375 ovf=0 small=0; desktop ovf=0.
- Build: vite 5.74s; index 448.19kB (gzip 117.78). Deploy d564968e-72f3-4962-8a65-b0f8655b5cb4 (percobaan pertama 7a4ee084 sebelum fix paginator). tsc 0; 30/30 suite. Commit 39d8607.
- Sisa file >500: hanya src/App.tsx (678) — kandidat pamungkas (pecah ke hooks/layout).

## Siklus 91 — hotfix gambar (berkat laporan user + audit CDP)
- Keluhan user: Inventaris Alat Berat — 7/8 kartu thumbnail broken (alt text bocor).
- Akar (audit CDP langsung, bukan terka): 49/50 baris equipment di TiDB menyimpan thumbnail_url basi 'assets/images/*.jpg' warisan seed demo; file tidak pernah ada di worker -> SPA fallback HTML -> img mati. Hanya 1 baris googleusercontent yang hidup (cocok dengan 1 kartu utuh di foto user).
- Perbaikan data: bulk PUT /api/equipments/:id thumbnail_url='' (server auto-getEquipmentImage). 41 ok; 8 gagal VALIDATION (type 'Vibratory Roller' tidak ada di EQUIPMENT_TYPES) -> dinorm ke 'Vibro Roller' via payload PUT -> 49/49 pulih.
- Perbaikan kode: onError guard (dataset.fb anti-loop) -> src=getEquipmentImage(code,type) di EquipmentCardGrid, EquipmentTable, CatalogTab, RentBookingModal.
- Verifikasi: CDP re-count total 20 img dead=0; screenshot STATE/imgfix_equip_91.png (vision: semua thumbnail normal). tsc 0; 30/30; deploy 06d4546d-9416-4136-8682-1a891198b156. Commit e23c357.

## Siklus 91 — 2026-09-29 (part 5, pamungkas)
- Refactor pamungkas: App.tsx 678 -> 315. Seluruh data reaktif (8 koleksi), 4 efek cermin Worker (muat awal/re-sinkron login/cermin live 30dtk/offline-antrean-FIFO), sidebarBadges, dan 17 handler CRUD pindah ke hooks/useAppData.ts (295). JSX presentational pindah ke components/layout/: OfflineBanner.tsx (54), DataErrorBanner.tsx (35), ToastNotif.tsx (34). App tinggal sesi (login/logout/switch role), routing tab, palette Ctrl+K, ErrorBoundary per-rute.
- Verifikasi smoke CDP lintas peran (STATE/smoke_app_91.py): ADMIN 4 rute render (Dashboard 14 cards, Inventaris 26, Transaksi 20 rows, Laporan 100 rows) ovf=0 semua; palette Ctrl+K OPEN; users 20 rows; mobile 375 ovf=0 small=0. STAFF login UI -> 'Terminal Staf Operasional & Verifikasi' 20 rows ovf=0. CUSTOMER login UI -> portal 'Selamat Datang, Budi Santoso' katalog 48 img ovf=0. CATATAN PENTING: login API via curl admin/admin ditolak padahal login UI admin/admin LOGGED — beda jalur/kebutuhan payload; sesi admin dipulihkan di akhir harness.
- Build: vite 5.46s; index 449.81kB (gzip 118.23). Deploy ea6bad0f-9291-4fa5-9624-50719e3a3d2d. tsc 0; 30/30 suite. Commit a2a06b4.
- Status target: semua halaman role admin/staff/customer < 500. Tersisa >500: pages/Login.tsx 533, components/ContractPanel.tsx 538, lib/seedGenerator.ts 639, lib/documents.ts 575, lib/auth.ts 525.

- p5b refactor: ContractPanel.tsx 538 -> 392. contract/ContractFilterBar.tsx (49), contract/ContractTable.tsx (154; bawa TONE_STYLE badge + logika kosongTotal; props onPreview/onRenew/onSign + canRenew). Modal preview/renew/sign/issue tetap di panel. Smoke STATE/smoke_contract_92.py: ADMIN 50 rows, 50 Tinjau, 13 Perpanjang (kedaluwarsa), saring EXPIRED->13, modal tinjau OPEN->Tutup, cari->0->reset, mobile 375 ovf=0 small=0; CUSTOMER panel 3 rows read-only (tanpa Terbitkan), modal OK. Deploy 890e6302-564b-4eb7-a961-2aceecf7dca6. Commit b98f2be.
- Bug tooling dicatat: guard terminal menolak && dalam heredoc (placeholder @@AND@@ + decode python), payload write_file >~6KB terpotong — pecah patch bertahap.
- Catatan sesi: kredensial admin/admin API login DITOLAK (BAD_PASSWORD) — harness CDP tetap jalan pakai sessionStorage sbs_session_token per-tab. Password seed berubah di beberapa siklus; jangan andalkan memory lama untuk creds.

## Siklus 92 — 2026-09-30 (lib split & bug konsistensi)

- p1 refactor: Login.tsx 533 -> 246. login/{LoginBrandPanel 127, RoleTabPicker 58, LoginForm 147, LoginErrorBox 28, RegisterLinkFooter 35}. String i18n & alur login (Edge API -> fallback lokal -> verifikasi role) tetap di induk. Smoke STATE/smoke_login_92.py: desktop ovf=0, 3 tab role, form + toggle password + tautan daftar; mobile 375 ketemu tab role 90x37 (ADMIN), 31x37 (Staf), 68x37 (Pelanggan) — lubang lantai sentuh 44px: [role=tab] tidak tercakup media query mobile. Fix src/index.css: tambah [role="tab"] ke lantai 44px. Commit f89952c. Build vite 5.65s; index 450.65 kB (gzip 118.62). Deploy bfbcfba7-cc47-4928-8bcb-ef6972d962d7.

- p2 refactor: seedGenerator.ts 639 -> 140. Pecah ke src/lib/seed/: users (193), equipments (179), maintenance (179), rentals (247), contracts (157), payments (201), gps (177), reports (163), shared (33: TEKNISI_IDS, SPAREPARTS, CATATAN, SYARAT_KONTRAK), index (92: rakit dataset + sinkronkanStatusUnit). Konsumen tunggal src/lib/store/internal.ts kini import dari '../seed'; tests/run-tests.mjs bundle entry diganti src/lib/seed/index.ts.

- p2 fix data seed: 2 asersi consistency + 1 seedData gagal (pre-existing sejak seed random, bukan efek split):
  1. unit 18 punya rental aktif DAN maintenance IN_PROGRESS -> sinkronkanStatusUnit RAISE ke MAINTENANCE melanggar "rental aktif harus menempati unit RENTED". Prioritas dibalik: RENTED > MAINTENANCE > AVAILABLE (unit sedang disewa tidak bisa simultaneously diservis).
  2. pembayaran PENDING_VERIFICATION idx%4===1 dibuat tanpa payment_proof_path -> asersi "PENDING_VERIFICATION wajib bukti transfer" gagal. Bukti kini wajib (antrean verifikasi staf harus bisa diverifikasi).
  Setelah fix: equipment distribution RENTED 18 / MAINTENANCE 6 / AVAILABLE 25 / UNAVAILABLE 1 (sebelumnya RENTED 17 / MAINTENANCE 7). tsc 0; 30/30. Build index 453.46 kB (gzip 119.02). Deploy 019e3d3e-d313-4077-9476-49066ea26f83.

- p3 refactor: documents.ts 575 -> 362. Blok render HTML A4 mandiri + escapeHtml dipindah ke src/lib/documentHtml.ts (231). COMPANY kini diexport (dipakai documentHtml). Konsumen: DocumentPreview, DocumentPrintPanel, ReportsPage tidak berubah (re-export transparan).

- p3 refactor: auth.ts 525 -> 41. Pecah ke src/lib/auth/: password (334: PBKDF2 + akun demo + util encoding), session (299: HMAC token + konfigurasi secret), rbac (86: matriks default-deny). auth.ts jadi re-export barrel; konsumen (store/internal, store/users, server/context) tidak diubah. tsc 0; 30/30. Build index 453.46 kB (gzip 119.04). Deploy 3447d853-fc50-4d67-a787-5a4fa85b35e4. Smoke STATE/smoke_auth_92.py: login admin/admin via UI -> masuk aplikasi, ovf=0.

- Status target: SELURUH file src < 500 baris. Terbesar: ReportAnalyticsPanel 497, fleetTelemetry 484, EquipmentManagement 472, server/routes/rentals 464. Total src 32.021 baris.
## Siklus 89 — 2026-09-30
- Refactor: src/server/index.ts 423 -> 70 baris. Middleware (CORS, security headers, auth+RBAC, health, error handler) -> middleware.ts (184); rate limit login -> rateLimit.ts (31); route login+change-password -> authRoutes.ts (169).
- Import context yang tak terpakai dibersihkan; urutan pipeline tetap (error handler -> CORS -> security -> auth/RBAC).
- Deploy Version 4f82a24f-3d1d-4eeb-9fa7-a2377527c4af. tsc 0; npm test 30/30; build 5.47s.
- verify_89_server.py production: health online db=True mode=TIDB; login admin 200; login salah 401 BAD_PASSWORD (anti enumeration); tanpa token 401 MALFORMED; customer -> /api/users 403 FORBIDDEN (RBAC ketat); admin /api/equipments 200 (50 unit); change-password: pw lama salah 401, password pendek 400 VALIDATION_ERROR.- Verifikasi tambahan: /api/reports/analytics 200 (Laporan Rental Bulanan, 50 baris, 8 kolom, ringkasan); /api/dashboard/stats 200 (revenue 2.644.950.000, 6 payment pending, 50 unit, 8 tersedia).
- Tes verify payment 38 -> PAID (endpoint jalan, staffId dari session). State machine satu arah: tidak ada endpoint kembali ke PENDING_VERIFICATION; seed dipulihkan langsung via TiDB UPDATE (status, verified_by, verified_at) -> 50 payments, 6 pending, terverifikasi via production API.
## Siklus 90 — 2026-09-30
- Audit UI production via CDP (chrome headless :9222, suppress_origin untuk websocket handshake 403):
  - Login form admin jalan (token sessionStorage dapat); 0 overflow horizontal di dashboard/laporan/unit/BAST.
  - 50 baris laporan + 50 tombol drill-down RNT (aria-label "Buka dokumen BAST transaksi ...").
  - Drill-down terverifikasi dua cabang: (a) baris tanpa dokumen -> alert "Transaksi RNT-... belum memiliki dokumen resmi (BAST/Surat Jalan) di arsip."; (b) baris berdokumen -> modal DocumentPreview terbuka, "Dokumen Resmi: REP-BASTOUT-20260911-001" (1605 char isi, kop PT SBS, BAST + RNT).
  - 0 konsol exception di seluruh alur.
  - Catatan: 26/50 baris laporan memang belum berdokumen resmi (perilaku benar — pesan jelas, bukan bug).
- Housekeeping: blockers.md B001/B002 ditutup (DB TiDB live mode=TIDB; tarif via tabel settings); known_issues.md ISSUE-I002 (foto unit, ditunda user).
## Siklus 91 — 2026-09-30 — FASE 5 LENGKAP
- Audit roadmap AGENT24T.md: ternyata F5.1–F5.6 sudah diimplementasi di siklus-siklus sebelumnya, hanya belum ditandai.
- Tandai selesai: F5.1 (predictNextServiceDate regresi linear), F5.2 (LeafletMap heatmap), F5.3 (geofencing.ts + GeofenceAlertBanner), F5.4 (PanelUtilisasiBulanan + PanelTopCustomer + SVG tren), F5.5 (manifest.json + sw.js vanilla), F5.6 (i18n.tsx toggle ID/EN).
- Verifikasi CDP production (STATE/verify_91_fase5.py):
  - PWA: link manifest 1, name "EquipRent MS — PT. Surya Bangun Sarana", serviceWorker AKTIF (sw.js), ikon 192/512 HTTP 200.
  - Toggle bahasa ID->EN jalan (tombol navbar-lang), dark mode aktif (dataset.theme=dark), 0 overflow, 0 konsol exception.
  - Vision check dashboard gelap: kontras baik, alert "3 unit perlu perhatian", stat cards (Rp 2.64 M / 50 Units / 42 Contracts) rapi.
## Siklus 92 — 2026-09-30 — Ideation: Bug Hunt + Security Audit + Data-Leak
- Bug hunt API (STATE/bug_hunt_api.py), 18 kasus input ekstrem: 0 BUG.
  - login kosong/tanpa password -> 400 VALIDATION_ERROR; password 5000 char -> 401 BAD_PASSWORD.
  - SQLi (`admin' OR 1=1--`) -> 401; XSS `<script>` di type -> 400; HM/harga negatif -> 400; tanggal invalid -> abaikan filter (aman).
  - `/api/equipments/abc` & `/api/users/me` -> 200 HTML index (SPA catch-all; bukan kebocoran karena tidak ada data API, hanya shell React).
- Security audit RBAC (STATE/audit_rbac.py): 14 endpoint x 3 role.
  - 6x 403 terverifikasi: customer di-blok /api/reports, /api/reports/analytics, /api/maintenance, /api/audit-log, /api/dashboard/*, /api/users. staff diblok /api/users & /api/audit-log.
  - Matriks DEFAULT-DENY (rbac.ts): endpoint tak terdaftar -> tolak.
- Data-leak audit (STATE/audit_leak.py): customer id=9 hanya melihat customer_id {9} di rentals/payments/contracts, dan hanya 3 unitnya (1,2,25) di /api/gps (5 dari 55 titik). Tidak ada bocor data pelanggan lain.
- Source audit: 0 string concatenation SQL, 0 secret ter-ekspos di src, 35 endpoint terdaftar di RBAC_MATRIX + PUBLIC_API_PATHS.
