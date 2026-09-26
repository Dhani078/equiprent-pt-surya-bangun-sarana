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
