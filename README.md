# EquipRent MS — Heavy Equipment Monitoring & Rental System
### PT. SURYA BANGUN SARANA BANJARMASIN

[![Deploy to Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare%20Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev)
[![Database](https://img.shields.io/badge/Database-TiDB%20Cloud%20Serverless-007ACC?style=for-the-badge&logo=mysql&logoColor=white)](https://tidbcloud.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Bundler](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Styling](https://img.shields.io/badge/Styling-TailwindCSS%20%26%20Custom%20Tokens-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌐 Live Production URL
Aplikasi telah ter-deploy secara live di Cloudflare Edge Network:  
👉 **[https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev](https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev)**

---

## 📖 Ringkasan Proyek
**EquipRent MS** adalah Sistem Informasi Monitoring dan Penyewaan Alat Berat terintegrasi yang dirancang untuk **PT. SURYA BANGUN SARANA BANJARMASIN**. Sistem ini memfasilitasi pengelolaan armada alat berat (Excavator, Bulldozer, Vibratory Roller, Wheel Loader, Crane), pelacakan telemetri GPS langsung di wilayah proyek Kalimantan Selatan, akumulasi jam operasional mesin (*Hour Meter / HM*), alur kontrak digital dengan tanda tangan elektronik (*E-Signature*), serta verifikasi pembayaran sewa multi-role.

Sistem dibangun dengan arsitektur modern **Edge Computing** (Cloudflare Workers), antarmuka reaktif **React 18 + TypeScript**, dan basis data terdistribusi berskala global **TiDB Cloud Serverless** (MySQL 8.0 Compatible).

---

## 👥 Aktor Pengguna & Kredensial Akses Sistem

Sistem menyediakan 3 akun pengguna terkonfigurasi untuk masing-masing hak akses:

| Peran (Role) | Username | Password | Deskripsi Hak Akses |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin` | Superuser pengelola data master unit, tarif sewa, pengguna, kontrol armada, dan eksekutif dashboard finansial. |
| **STAFF** | `staff` | `staff` | Staf operasional yang memverifikasi bukti transfer pembayaran sewa, menerbitkan kontrak sewa, menyetujui booking, dan menjadwalkan servis. |
| **CUSTOMER** | `user` | `user` | Pelanggan/korporasi yang mengajukan permohonan sewa unit, menandatangani kontrak legal (*E-Sign*), dan mengunggah bukti pembayaran. |

---

## 🚀 Fitur Unggulan Sistem

### 1. Multi-Role Authentication & 2-Column Stitch Login
- Layar Login 2-kolom otentik sesuai desain Stitch Prototype (Latar Navy Industrial `#001E40` dan kartu otentikasi).
- Selektor tab peran dinamis (**ADMIN**, **STAFF**, **CUSTOMER**) dengan penggantian label dan placeholder kontekstual.
- Modal **Register Fleet Access** mandiri dengan feedback alert toast instan.
- Fitur Show/Hide Password dan Remember Device.

### 2. Manajemen Inventaris Alat Berat (Fleet Inventory)
- Pelacakan 50 unit alat berat riil operasional:
  - Hydraulic Excavator Komatsu PC200-8
  - Crawler Bulldozer Komatsu D85ESS / Cat D6
  - Vibratory Roller Sakai SV520
  - Wheel Loader Komatsu WA380
  - Rough Terrain Crane Tadano GR-700
- Mini Bento-Stats: Total Unit, Unit Tersedia, Unit Disewa, dan Unit Maintenance.
- Log akumulasi Hour Meter (HM) untuk menentukan ambang batas servis berkala.
- Pencarian dan filter kategori unit secara reaktif.

### 3. Peta Telemetri GPS Interaktif (Leaflet.js GIS)
- Integrasi peta geospasial interaktif Leaflet.js dengan penanda koordinat GPS armada di lokasi proyek riil Kalimantan Selatan (Pelabuhan Trisakti Banjarmasin, Banjarbaru, Tabalong, dll).
- Informasi telemetri: Latitude, Longitude, Kecepatan unit (km/jam), status mesin (*Engine ON/OFF*), dan tingkat bahan bakar (*Fuel Level %*).

### 4. Siklus Transaksi Sewa Lengkap (End-to-End Rental Workflow)
1. **Pengajuan Sewa (Customer Portal)**: Pelanggan memilih unit di katalog, mengisi tanggal mulai/selesai, dan sistem menghitung durasi serta total biaya secara otomatis.
2. **Persetujuan Staf (Staff Terminal)**: Staf meninjau ketersediaan unit dan menyetujui order sewa.
3. **Penerbitan Kontrak & E-Sign**: Pelanggan menandatangani kontrak sewa secara digital dengan visual goresan tanda tangan dan stempel waktu ISO.
4. **Pembayaran & Verifikasi**: Pelanggan mengonfirmasi nomor rekening Mandiri dan mengunggah struk bukti transfer; staf memverifikasi dengan 1 klik menjadi status **Lunas (PAID)**.
5. **Mobilisasi & BAST**: Unit berpindah ke status **ON_GOING** (Mobilisasi) dan dokumen resmi Berita Acara Serah Terima (BAST) diterbitkan.

### 5. Dokumen Resmi & Laporan BAST / Surat Jalan
- Pratinjau cetak dokumen Berita Acara Serah Terima (BAST) dan Surat Jalan Mobilisasi Alat Berat lengkap dengan Kop Surat resmi PT. Surya Bangun Sarana Banjarmasin, nomor registrasi, dan kolom legalisasi tanda tangan.

---

## 🛠️ Arsitektur Teknologi

```
+-----------------------------------------------------------------------------+
|                                KLIEN BROWSER                                |
|  React 18 + TypeScript + Vite + TailwindCSS + Lucide Icons + Leaflet.js     |
+-----------------------------------------------------------------------------+
                                       │
                         HTTPS Requests / REST API
                                       │
                                       ▼
+-----------------------------------------------------------------------------+
|                         CLOUDFLARE WORKERS EDGE                             |
|  • Edge Routing: Hono.js Engine                                             |
|  • Static Assets: HTML, JS, CSS served via Worker Assets Cache              |
|  • Driver: @tidbcloud/serverless (Edge HTTP Connector, Zero TCP Socket Issue)|
+-----------------------------------------------------------------------------+
                                       │
                           Secure HTTPS SQL Tunnel
                                       │
                                       ▼
+-----------------------------------------------------------------------------+
|                         TIDB CLOUD SERVERLESS                               |
|  • Cluster: gateway01.ap-southeast-1.prod.aws.tidbcloud.com                |
|  • Engine: Distributed MySQL 8.0 Compatible Database                       |
|  • 9 Relational Tables: roles, users, equipments, rentals, contracts,        |
|    payments, maintenance, gps_tracking, reports                             |
+-----------------------------------------------------------------------------+
```

---

## 💻 Panduan Menjalankan Secara Lokal (Local Development)

### 1. Kloning Repositori
```bash
git clone https://github.com/Dhani078/equiprent-pt-surya-bangun-sarana.git
cd equiprent-pt-surya-bangun-sarana
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi TiDB Cloud Serverless Anda:
```env
TIDB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_USER=3ajUHv8otax7qCG.root
TIDB_PASSWORD=your_password_here
TIDB_DATABASE=test
```
*(Catatan: Berkas `.env` telah didaftarkan dalam `.gitignore` sehingga aman dan tidak akan pernah terunggah ke repositori publik).*

### 4. Menjalankan Server Development
```bash
npm run dev
```
Buka browser pada alamat `http://localhost:5173/`.

### 5. Pengujian Build Produksi
```bash
npm run build
npm run preview
```

---

## 📚 Indeks Dokumentasi Teknis

Repositori ini dilengkapi dokumentasi lengkap untuk keperluan akademik dan pemeliharaan sistem:

1. [PANDUAN_SIDANG_SKRIPSI.md](file:///c:/xampp/htdocs/PT.%20SURYA%20BANGUN%20SARANA%20BANJARMASIN/PANDUAN_SIDANG_SKRIPSI.md) &mdash; Panduan demonstrasi sidang, naskah presentasi, dan jawaban FAQ dosen penguji.
2. [DATABASE_TIDB.md](file:///c:/xampp/htdocs/PT.%20SURYA%20BANGUN%20SARANA%20BANJARMASIN/DATABASE_TIDB.md) &mdash; Dokumentasi skema 9 tabel, relasi ERD, indeks, dan kueri analitik TiDB Cloud.
3. [API_DOCUMENTATION.md](file:///c:/xampp/htdocs/PT.%20SURYA%20BANGUN%20SARANA%20BANJARMASIN/API_DOCUMENTATION.md) &mdash; Spesifikasi lengkap endpoint REST API Cloudflare Workers.
4. [DEPLOYMENT_GUIDE.md](file:///c:/xampp/htdocs/PT.%20SURYA%20BANGUN%20SARANA%20BANJARMASIN/DEPLOYMENT_GUIDE.md) &mdash; Panduan setup CI/CD auto-deploy Cloudflare Workers dan GitHub integration.
5. [SECURITY_AND_RBAC.md](file:///c:/xampp/htdocs/PT.%20SURYA%20BANGUN%20SARANA%20BANJARMASIN/SECURITY_AND_RBAC.md) &mdash; Analisis keamanan, isolasi peran RBAC, dan kepatuhan hukum tanda tangan elektronik.
6. [DESIGN.md](file:///c:/xampp/htdocs/PT.%20SURYA%20BANGUN%20SARANA%20BANJARMASIN/DESIGN.md) &mdash; Dokumen spesifikasi desain antarmuka Stitch dan token visual.

---

## 📄 Lisensi & Hak Cipta
Hak Cipta &copy; 2026 **PT. SURYA BANGUN SARANA BANJARMASIN** & Tim Pengembang Skripsi.  
Seluruh hak dilindungi undang-undang.
