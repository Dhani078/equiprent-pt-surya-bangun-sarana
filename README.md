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
| **Manajemen Alat Berat** | CRUD 50 unit (Excavator, Dozer, Roller, Loader, Crane), filter status |
| **Transaksi Rental** | Alur PENDING → APPROVED → ON_GOING → COMPLETED, cegah double-booking |
| **Kontrak Digital** | Generate otomatis, e-signature canvas, preview dokumen |
| **Pembayaran** | Upload bukti transfer, verifikasi Staff, riwayat |
| **Hour Meter & Servis** | Jadwal preventif per 250 HM, prediksi tanggal regresi linear, notifikasi suku cadang |
| **GPS Telemetri** | Peta Leaflet.js real-time, 55 titik di Banjarmasin/Trisakti/Banjarbaru |
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
> data seed lokal (50 unit, 50 rental, 50 kontrak, dst.) via `src/lib/mockData.ts`.
> Semua fitur tetap bisa didemonstrasikan.

---

## Deployment ke Cloudflare Workers

```bash
# Build produksi
npm run build

# Set secret database (sekali saja, dilakukan manusia)
npx wrangler secret put DATABASE_URL
# Masukkan connection string TiDB Cloud Serverless

# Deploy
npm run deploy:cloud
# atau: npx wrangler deploy
```

---

## Struktur Direktori

```
src/
  App.tsx                   ← routing & state utama
  types/index.ts            ← semua interface terpusat
  lib/
    db.ts                   ← koneksi TiDB + state lokal fallback
    dashboard.ts            ← mesin agregat dashboard (murni/testable)
    businessRules.ts        ← aturan bisnis (HM, denda, prediksi)
    reports.ts              ← 11 jenis laporan + CSV export
  server/index.ts           ← Hono.js edge API (Cloudflare Workers)
  pages/
    admin/                  ← halaman Administrator
    staff/                  ← halaman Staff Operasional
    customer/               ← portal Customer
  components/               ← komponen reusable (Navbar, Sidebar, Modal, …)
tests/                      ← 21 test suite, 900+ test cases
views/                      ← [LEGACY] PHP Native MVC (arsip skripsi, jangan diubah)
STATE/                      ← state agen autonomous (changelog, task queue, dll.)
```

---

## Quality Gate

```bash
npm run type-check   # tsc --noEmit — harus 0 error
npm test             # 21 suite, 900+ test cases
npm run build        # Vite build — harus sukses
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
6. **Laporan** → pilih jenis laporan, filter tanggal, export CSV
7. **Logout → Login sebagai `staff`** → tunjukkan Verifikasi Pembayaran (badge merah)
8. **Logout → Login sebagai `user`** → ajukan sewa baru, tanda tangan kontrak digital
