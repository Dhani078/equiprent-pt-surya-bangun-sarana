# EquipRent MS — Sistem Monitoring & Rental Alat Berat
**PT. SURYA BANGUN SARANA BANJARMASIN**

> Proyek Skripsi S1 Teknik Informatika — Production-Ready Full-Stack Web Application  
> Stack: React 18 + TypeScript + Hono.js + Cloudflare Workers + TiDB Cloud Serverless

**Live Demo:** https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev  
**Repo:** https://github.com/Dhani078/equiprent-pt-surya-bangun-sarana

---

## Kredensial Demo (Sidang Skripsi)

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `admin` |
| Staff Operasional | `staff` | `staff` |
| Customer / Penyewa | `user` | `user` |

---

## Fitur Utama

| Modul | Fitur |
|---|---|
| **Multi-Role Auth** | Login, session JWT, RBAC Admin/Staff/Customer |
| **Manajemen Alat Berat** | CRUD 50 unit (7 tipe, 9 brand), filter status |
| **Transaksi Rental** | Alur PENDING → APPROVED → ON_GOING → COMPLETED, cegah double-booking |
| **Kontrak Digital** | Generate otomatis, e-signature canvas, preview dokumen |
| **Pembayaran** | Upload bukti transfer, verifikasi Staff, gerbang pembayaran |
| **Hour Meter & Servis** | Jadwal preventif per 250 HM, prediksi tanggal regresi linear, notifikasi suku cadang |
| **GPS Telemetri** | Peta Leaflet.js real-time, 55 titik di Banjarmasin/Trisakti/Banjarbaru |
| **Audit Trail** | 16 aksi tercatat (user/role/timestamp), khusus Admin, filter + export CSV |
| **11 Laporan** | Filter rentang tanggal, export CSV, pencarian global |
| **Dokumen Resmi** | BAST IN, BAST OUT, Surat Jalan (print A4) |
| **Dark Mode** | Toggle Moon/Sun, persist localStorage |
| **Notifikasi Sidebar** | Badge counter real-time tanpa request tambahan |
| **Pagination** | 20 baris/halaman di tabel Equipment & Rental |

---

## Setup Lokal (Development)

### Prasyarat
- Node.js ≥ 18
- npm ≥ 9

### Langkah

```bash
# 1. Clone repo
git clone https://github.com/Dhani078/equiprent-pt-surya-bangun-sarana.git
cd equiprent-pt-surya-bangun-sarana

# 2. Install dependensi
npm install

# 3. Jalankan dev server (Vite + Wrangler)
npm run dev
# Buka http://localhost:5173
```

> **Catatan:** Tanpa `DATABASE_URL` TiDB Cloud, aplikasi otomatis menggunakan
> data seed lokal yang dihasilkan `src/lib/seedGenerator.ts`:
> **50 pengguna, 50 unit, 50 rental, 50 kontrak, 50 pembayaran,
> 25 log servis, 55 titik GPS, 20 dokumen** — semua konsisten lintas tabel
> dan tanggalnya selalu segar (mengikuti hari ini). Semua fitur tetap bisa
> didemonstrasikan.

---

## Deployment ke Cloudflare Workers

```bash
# Build + deploy sekaligus (memakai npx wrangler — resolusi biner lokal)
npm run deploy

# Atau uji dulu tanpa publish:
npm run deploy:dry

# Set secret database (sekali saja, dilakukan manusia)
npx wrangler secret put DATABASE_URL
# Masukkan connection string TiDB Cloud Serverless
```

Konfigurasi: `wrangler.jsonc` memakai Workers Assets (`directory: ./dist`,
`binding: ASSETS`, `not_found_handling: single-page-application`) agar refresh
route SPA tidak 404.

---

## Struktur Direktori

```
src/
  App.tsx                   ← routing & state utama
  types/index.ts            ← semua interface terpusat
  lib/
    db.ts                   ← koneksi TiDB + state lokal fallback
    seedGenerator.ts        ← generator data demo (50 unit/50 rental/55 GPS)
    auditLog.ts             ← audit trail (ring buffer 1000 entri)
    dashboard.ts            ← mesin agregat dashboard (murni/testable)
    businessRules.ts        ← aturan bisnis (HM, denda, prediksi)
    rentalWorkflow.ts       ← mesin transisi status rental
    paymentWorkflow.ts      ← gerbang pembayaran
    availability.ts         ← cek ketersediaan & cegah double-booking
    reports.ts              ← 11 jenis laporan + CSV export
    auth.ts                 ← PBKDF2, session, RBAC_MATRIX
  server/index.ts           ← Hono.js edge API (Cloudflare Workers)
  pages/
    admin/                  ← halaman Administrator
    staff/                  ← halaman Staff Operasional
    customer/               ← portal Customer
  components/               ← komponen reusable (Navbar, Sidebar, Modal, …)
tests/                      ← 27 test suite, 1.467 asersi (zero framework)
views/                      ← [LEGACY] PHP Native MVC (arsip skripsi, jangan diubah)
STATE/                      ← state agen autonomous (changelog, task queue, dll.)
```

---

## Quality Gate

```bash
npm run type-check   # tsc --noEmit — harus 0 error
npm test             # 27 suite, 1.467 asersi — harus semua lulus
npm run build        # Vite build — harus sukses
npm run deploy:dry   # Wrangler dry-run — verifikasi tanpa publish
```

---

## Database (TiDB Cloud)

9 tabel relasional: `roles`, `users`, `equipments`, `rentals`, `contracts`,
`payments`, `maintenance`, `gps_tracking`, `reports`.

Lihat `DATABASE_TIDB.md` untuk skema lengkap dan `tidb_schema_and_data.sql`
untuk seed data 50 unit.

---

## Panduan Demo Sidang (Urutan Klik Rekomendasi)

1. **Login sebagai `admin`** → tunjukkan Dashboard Eksekutif (angka real dari DB/seed)
2. **Inventaris Alat Berat** → filter status, lihat pagination
3. **Transaksi Rental** → setujui satu rental PENDING → lihat badge Sidebar hilang
4. **Perawatan & Servis** → tunjukkan panel 250 HM + prediksi tanggal + notifikasi suku cadang
5. **GPS Telemetri** → buka peta Leaflet, tunjukkan marker + popup telemetri
6. **Audit Trail** → buka menu perisai, tunjukkan jejak aksi lengkap (siapa, kapan, apa)
7. **Laporan** → pilih jenis laporan, filter tanggal, export CSV
8. **Logout → Login sebagai `staff`** → tunjukkan Verifikasi Pembayaran (badge merah)
9. **Logout → Login sebagai `user`** → ajukan sewa baru, tanda tangan kontrak digital

> Untuk naskah pembukaan, bank soal dosen penguji, ERD 9 tabel, flowchart
> alur rental, dan daftar lengkap 27 test suite, lihat
> **`PANDUAN_SIDANG_SKRIPSI.md`**.

---

## Screenshot

> Tempel hasil tangkapan layar di sini sebelum mencetak naskah sidang:
>
> | Layar | Status |
> |---|---|
> | Login 2-kolom | ☐ |
> | Admin Dashboard | ☐ |
> | Inventaris Alat Berat (grid kartu) | ☐ |
> | Live GPS Map (Leaflet) | ☐ |
> | Kontrak Digital + E-Sign | ☐ |
> | Audit Trail (Admin) | ☐ |
> | Laporan & BAST (print A4) | ☐ |
