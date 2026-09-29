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
