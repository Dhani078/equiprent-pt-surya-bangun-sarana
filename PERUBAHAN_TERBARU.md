# Perubahan Terbaru — EquipRent PT. Surya Bangun Sarana

Dokumen ini merangkum seluruh perbaikan dan fitur baru yang ditambahkan pada paket terakhir.

---

## 1. Perbaikan (Fix)

| # | Masalah | Perbaikan |
|---|---------|-----------|
| 1 | `tsc` gagal: `TS2882 Cannot find module ... './index.css'` | Menambahkan `src/vite-env.d.ts` berisi referensi tipe Vite |
| 2 | Halaman Pengaturan (Settings) hanya placeholder kosong | Diganti halaman `AccountSettings` yang benar-benar menyimpan data |
| 3 | Profil pengguna tidak bisa diubah dari aplikasi | Ditambahkan `db.updateUser()` + sinkronisasi sesi (`sessionStorage`) |
| 4 | Tidak ada cara mengganti password sendiri | Form ganti password (min. 8 karakter + konfirmasi) di halaman Pengaturan |
| 5 | Data tabel tidak bisa dibawa keluar aplikasi | Ekspor CSV / Excel / PDF pada 5 halaman utama |
| 6 | Tidak ada peringatan aktif untuk item mendesak | Pusat Notifikasi di navbar dengan badge jumlah item mendesak |
| 7 | Ekspor CSV rawan *formula injection* di Excel | Sel yang diawali `= + - @` dinetralkan otomatis |
| 8 | Cakupan uji belum menyentuh modul utilitas baru | 3 suite uji baru (total **25 suite**, sebelumnya 22) |

Status verifikasi: `npm run type-check` → **0 error**, `npm test` → **Semua suite lulus (25/25)**.

---

## 2. Fitur Baru

### a. Ekspor data (CSV / Excel / PDF)
- `src/lib/tableExport.ts` — mesin ekspor: CSV (pemisah `;`, ramah Excel Indonesia), Excel `.xls` berkop perusahaan, dan PDF via dialog cetak A4 lanskap.
- Tersedia di: **Manajemen Unit**, **Manajemen Pengguna**, **Transaksi Penyewaan**, **Perawatan Unit**, dan **Arsip Laporan**.
- Yang diekspor selalu mengikuti filter & pencarian yang sedang aktif.

### b. Pusat Notifikasi
- `src/lib/notifications.ts` + `src/components/NotificationCenter.tsx`.
- Admin/Staf: pembayaran menunggu verifikasi, pengajuan sewa baru, servis hari ini/terlewat, sewa telat.
- Pelanggan: tagihan belum dibayar/ditolak, kontrak belum ditandatangani, sewa mendekati jatuh tempo.
- Notifikasi diurutkan dari paling mendesak dan bisa diklik untuk langsung membuka tab terkait.

### c. Grafik tren interaktif
- `src/components/TrendChart.tsx` — kurva pendapatan 12 bulan pada Dashboard Admin, lengkap dengan tooltip dan format Rupiah.

### d. Command Palette (Ctrl / ⌘ + K)
- `src/components/CommandPalette.tsx` — pencarian perintah antar halaman sesuai peran, navigasi keyboard (↑ ↓ Enter Esc).

### e. Halaman Pengaturan Akun
- `src/pages/AccountSettings.tsx` — ubah nama, email, telepon, perusahaan, alamat; ganti password dengan validasi.

### f. Utilitas tabel terpadu
- `src/lib/tableControls.ts` — pencarian multi-kata (logika AND lintas kolom), pengurutan stabil (angka/tanggal/teks), siklus urut naik → turun → mati, filter rentang tanggal, ringkasan filter aktif.
- `src/components/TableToolbar.tsx` — bilah alat tabel siap pakai (cari, filter, ekspor, reset, hitungan baris).

---

## 3. Uji Otomatis Baru

| Suite | Cakupan |
|-------|---------|
| `tests/tableControls.test.mjs` | Normalisasi teks, pencarian multi-kata, perbandingan nilai, urutan & siklus klik header, filter |
| `tests/tableExport.test.mjs` | Struktur CSV, pelolosan karakter, anti CSV-injection, penamaan berkas, HTML cetak & Excel |
| `tests/notifications.test.mjs` | Pemisahan notifikasi per peran, isolasi data antar pelanggan, prioritas urutan, keunikan id |

---

## 4. Catatan Penting Sebelum Deploy

1. Setel rahasia sesi di Cloudflare: `npx wrangler secret put SESSION_SECRET` (minimal 32 karakter).
2. **Ganti/rotasi semua kredensial** yang pernah masuk ke repositori (database, token). Anggap yang lama sudah bocor.
3. Isi `.env` lokal mengikuti `.env.example`; jangan pernah commit `.env`.
4. Perintah kerja: `npm install`, `npm run dev`, `npm run type-check`, `npm test`, `npm run build`.
5. Di PowerShell Windows gunakan `;` sebagai pemisah perintah (bukan `&&`) dan bungkus path berspasi dengan tanda kutip.

---

## 5. Refactor Modular Besar — Siklus 73–88 (September 2026)

Seluruh berkas >600 baris dipecah menjadi paket modul terfokus. **Tidak ada tanda tangan fungsi publik yang berubah** — semua consumer tetap resolve lewat barrel `index.ts`.

### a. Paket `src/lib/`
| Modul lama | Jadi | Isi |
|---|---|---|
| `validators.ts` (820) | `validators/` | `core` (tipe `ValidationResult`/`FormValidationResult`), `rules` (batas kolom TiDB + regex), `fields`, `forms`, `contract`, `index` |
| `customerPortal.ts` (829) | `portal/` | `core`, `ownership`, `catalog`, `requestCheck`, `journey`, `billing`, `index` |
| `contracts.ts` (664) | `contracts/` | `constants`, `numbering`, `status`, `preview`, `render`, `index` |
| `reports.ts` (1278) | `reports/` | 13 submodule (kpi, chart, export, pivot, forecast, anomaly, insights, alert, drilldown, dashboard, range, index) |
| `db.ts` (1202) | `db/` | `index` + `store/` (9 berkas, maks 358 baris) |

### b. Komponen UI terpisah
| Halaman | Baris | Modul baru |
|---|---|---|
| `admin/RentalManagement.tsx` | 907 → 634 | `rental/AddRentalModal.tsx`, `rental/StatusConfirmModal.tsx` |
| `admin/MaintenanceManagement.tsx` | 808 → 581 | `maintenance/ServiceHistoryPanel.tsx`, `maintenance/MaintenanceFormModal.tsx` |
| `admin/GpsTrackingPage.tsx` | 745 → 590 | `gps/GeofenceAlertBanner.tsx`, `gps/TelemetryFilterPanel.tsx` |
| `customer/CustomerPortal.tsx` | 1013 → 844 | `customer/RentBookingModal.tsx`, `customer/PaymentProofModal.tsx` |
| `staff/StaffDashboard.tsx` | 761 → 587 | `staff/components/DueNotificationPanel.tsx`, `staff/components/PaymentProofViewerModal.tsx` |
| `components/ContractPanel.tsx` | 760 → 538 | `contract/ContractSignModal.tsx`, `contract/ContractIssueModal.tsx`, `contract/ContractRenewModal.tsx` |
| `pages/Login.tsx` | 696 → 533 | `login/RegisterModal.tsx` |
| `server/index.ts` | 423 → 70 | `server/middleware.ts` (CORS+security+auth/RBAC+health+error), `server/rateLimit.ts`, `server/authRoutes.ts` (login+change-password) |

### c. Fitur baru terkait kontrak
- `POST /api/contracts/:id/renew` — perpanjang kontrak kedaluwarsa (ADMIN/STAFF saja; tolak `409` bila kontrak sudah ditandatangani, `400` bila tanggal tidak nyata).
- Pratinjau kontrak viewer: badge `Belum ditandatangani` (amber) vs `Ditandatangani` (hijau), nama + waktu tanda tangan, kartu `Perpanjang Kontrak` di dashboard admin.
- Modal tanda tangan digital customer (canvas + nama penanda tangan), modal terbitkan kontrak (dropdown sewa disetujui tanpa kontrak, disabled saat kosong — perilaku benar).

### d. Verifikasi
- `npm run type-check` → 0 error, `npm test` → **30/30 suite** lulus.
- Audit visual CDP production (chrome `--remote-debugging-port=9222`) tiap siklus: 0 overflow horizontal, konsol bersih, tiap modal & alur dibuka lewat UI asli.
- `bundle()` di `tests/run-tests.mjs` kini menunjuk `validators/index.ts`, `portal/index.ts`, `contracts/index.ts`.
---

## Siklus 91–92 (2026-09-29/30) — Refactor Besar seluruh kode

### Ringkasan
Semua file `src/` kini **< 500 baris**. Pemecahan konsisten: panel presentasional keluar, state/logika/fetch tetap di induk.

### Fix bug nyata (bukan kosmetik)
| # | Masalah | Perbaikan |
|---|---------|-----------|
| 1 | 49/50 `thumbnail_url` seed mati (`assets/images/*.jpg` → SPA fallback HTML) | Bulk PUT `thumbnail_url:''` → auto `getEquipmentImage`; guard `onError` anti-loop di 4 komponen |
| 2 | Grid inventaris `repeat(3,1fr)` overflow 13px mobile | Ganti `auto-fit minmax(...)` |
| 3 | Tombol paginator `minWidth:32px` inline kalahkan CSS 44px | Inline `min-width:44px` (semua halaman berpaginasi) |
| 4 | Tab role login 90×37 / 31×37 / 68×37 < 44px (lubang `[role=tab]`) | Tambah `[role="tab"]` ke lantai sentuh 44px di `src/index.css` |
| 5 | Unit 18 punya rental AKTIF **dan** servis IN_PROGRESS → status konflik | Prioritas `sinkronkanStatusUnit` dibalik: RENTED > MAINTENANCE |
| 6 | Pembayaran PENDING_VERIFICATION tanpa bukti transfer (~1/4) | Bukti wajib (antrean verifikasi staf harus bisa diverifikasi) |

### Struktur baru
- `src/hooks/useAppData.ts` — 8 koleksi reaktif + 4 efek + 17 handler CRUD (dari App.tsx).
- `src/components/layout/` — OfflineBanner, ToastNotif, DataErrorBanner.
- `src/pages/login/` — LoginBrandPanel, RoleTabPicker, LoginForm, LoginErrorBox, RegisterLinkFooter.
- `src/pages/admin/maintenance/`, `src/pages/admin/user/`, `src/pages/admin/equipment/`, `src/pages/staff/`.
- `src/lib/seed/` — 8 generator domain + shared + index (dari seedGenerator.ts 639→140).
- `src/lib/auth/` — password, session, rbac (dari auth.ts 525→41).
- `src/lib/documentHtml.ts` — render HTML A4 (dari documents.ts 575→362).

### Verifikasi
- `npm run type-check` → 0 error, `npm test` → **30/30 suite** lulus.
- Smoke CDP tiap siklus: 0 overflow horizontal di 375×812 dan 1280×800, touch target ≥44px, semua modal dibuka via UI asli.
- Bundle: index 453.46 kB (gzip 119.04 kB).

---

## Siklus 93 (2026-09-30) — Generasi 50 Foto Armada Asli, Optimasi WebP 90%, & Deploy Live

### Ringkasan
Menyelesaikan issue aset visual unit (`ISSUE-I002` ditutup penuh). Seluruh 50 nomor & kode unit pada `STATE/unit_prompts.json` kini memiliki foto asli beresolusi tajam sesuai model dan merek aslinya (Komatsu, Caterpillar, Hitachi, Kobelco, Sany, Tadano, Sakai, Bomag, Dynapac, Shantui, SDLG), diproses ke format WebP super ringan, dan di-deploy ke Cloudflare Edge Workers.

### Detail Pembaruan
1. **Generasi Foto Unit Otentik Berdasarkan Prompt Lokal**:
   - Memanfaatkan model Google Imagen untuk memproduksi foto fotorealistik alat berat asli di lingkungan operasional Kalimantan Selatan (tambang batubara terbuka, stockpile berdebu, dermaga Sungai Martapura dengan kelotok/tongkang, proyek jalan raya Banjarmasin).
   - Seluruh logo merek asli (*KOMATSU, CAT, HITACHI, KOBELCO, SANY, TADANO, SAKAI, SHANTUI*) terbaca tajam tanpa cacat bentuk atau distorsi hidrolik.

2. **Pipeline Optimasi WebP Modern (Hemat 90.2% Bandwidth)**:
   - Dibuat script konversi cerdas `scripts/optimize_units_webp.mjs` memanfaatkan modul `sharp`.
   - Ukuran awal (PNG mentah): **49.83 MB**.
   - Ukuran setelah konversi WebP (760px lebar, kualitas 80): **4.90 MB**.
   - **Total penghematan kuota/bandwidth: 90.2%** (rata-rata cuma ~95 KB per foto).

3. **Integrasi Frontend & Lazy Loading**:
   - `src/lib/stitchAssets.ts`: Menambahkan fungsi `resolveEquipmentThumbnail` dan fallback cerdas `getEquipmentCategoryFallback`.
   - Menambahkan atribut `loading="lazy"` pada elemen `<img>` di **Katalog Pelanggan (`CatalogTab.tsx`)**, **Grid Kartu Admin (`EquipmentCardGrid.tsx`)**, **Tabel Inventaris (`EquipmentTable.tsx`)**, dan **Modal Booking (`RentBookingModal.tsx`)**.
   - Halaman terbuka secara instan dalam hitungan milidetik tanpa membebani kuota data pengguna.

4. **Verifikasi & Deployment Live**:
   - `npm run build` → Selesai dalam 6.23 detik.
   - `npm test` → **30/30 test suite LULUS 100% (1.552+ asersi)**.
   - `npx wrangler deploy` → Berhasil di-deploy ke produksi Cloudflare Workers:
     `https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev`
   - Git repository di-commit dan di-push ke GitHub (`Dhani078/equiprent-pt-surya-bangun-sarana`).


---

## 6. Siklus 94 (2026-10-05) — Audit Final Tata Letak, Desain, Tombol & Filter

Audit CDP production penuh (chrome headless) terhadap aplikasi live: **3 role (admin/staff/customer) × 20 halaman × 2 viewport (1280px PC, 390px HP)**.

### Bug ditemukan & diperbaiki

1. **Kelas CSS mati `.form-input`** — 5 input pada Katalog portal pelanggan (kolom cari, filter kategori, urutkan, tanggal mulai/selesai sewa) memakai kelas yang tidak pernah didefinisikan di `src/index.css`. Akibat: input render polos setinggi ~20px, jauh di bawah lantai sentuh 44px.
   - Fix: definisi `.form-input` lengkap (padding, border, radius, focus ring) + override dark mode.
   - Verified DOM: seluruh 5 input sekarang **44px** di mobile.

2. **StatCard: subtitle terjepit badge** — baris subtitle+badge memakai `justify-content: space-between` tanpa wrap. Badge 115px menggerus subtitle menjadi hanya **66px** sehingga teks "8 siap sewa, 40 tersewa, 2 dalam servis" terpotong vertikal menjadi 4-5 baris pecahan.
   - Fix: `flexWrap: wrap` + subtitle `flex: 1 1 auto; minWidth: 0` pada `src/components/StatCard.tsx`.
   - Verified DOM: subtitle **189px** penuh, tinggi 8 kartu statistik seragam (197/197/…).

3. **Lantai sentuh input/select** — media query mobile hanya mencakup `button` dan `[role=tab]`; semua kolom pencarian & dropdown filter berukuran 35-40px di HP.
   - Fix: `header input, main input, header select, main select { min-height: 44px }`.

### Verifikasi production (0 masalah tersisa)

| Aspek | Hasil |
|---|---|
| Overflow horizontal | **0 px** di 20 halaman (PC & HP) |
| Filter pencarian | Transaksi 20→0→reset 20; Pengguna 20→0→20; Inventaris 26→6→26; Laporan 100→50→100; Audit 5→0→5 |
| Filter select | Nilai bebas dipakai, reset kembali ke jumlah semula |
| Tombol aksi | 28 tombol (Selesai/Mobilisasi/Tolak) render & fungsional |
| Modal | Jadwalkan Servis, Tambah Pengguna, Register Pelanggan — buka/tutup riil, layout bersih |
| GPS | Peta Leaflet 40 marker + popup; 0 line-through, 0 overlap daftar armada |
| Dark mode | 0 kontras gagal, 0 elemen putih mentah (9 halaman admin) |
| Gambar unit | 0 broken image di seluruh halaman |
| Paginator | 44px di mobile |

### Gate & deploy
- `tsc` → **0 error**
- `npm run build` → 5.87 dtk (index 453.77 kB, gzip 119.18)
- `npm test` → **30/30 suite lulus** (1.552+ asersi, 0 FAIL)
- `wrangler deploy` → **Version `6a24e75c-4cc5-4976-b962-8990612c3805`** di https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev
