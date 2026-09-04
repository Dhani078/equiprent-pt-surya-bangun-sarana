# DOKUMENTASI REST API (API_DOCUMENTATION.md)
### Cloudflare Workers Edge API — PT. SURYA BANGUN SARANA BANJARMASIN

Dokumen ini adalah referensi lengkap endpoint RESTful API yang disediakan oleh **Cloudflare Workers** router (`src/server/index.ts`) menggunakan mesin **Hono.js**.

---

## 1. IKHTISAR API (OVERVIEW)

- **Production Base URL:** `https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev`
- **Format Pertukaran Data:** JSON (`Content-Type: application/json; charset=utf-8`)
- **Protokol Keamanan:** HTTPS dengan TLS 1.3
- **CORS Policy:** Didukung penuh untuk integrasi antarmuka klien.

### Format Respons Standar
```json
{
  "success": true,
  "data": { ... },
  "message": "Operasi berhasil dieksekusi",
  "timestamp": "2026-09-05T03:30:00.000Z"
}
```

---

## 2. ENDPOINT KESEHATAN SISTEM (SYSTEM HEALTH)

### `GET /api/health`
Memeriksa status operasional Edge Worker dan konektivitas basis data TiDB Cloud.

**Respons (200 OK):**
```json
{
  "status": "healthy",
  "worker": "equiprent-pt-surya-bangun-sarana",
  "runtime": "Cloudflare Workers (Edge)",
  "database": "TiDB Cloud Serverless",
  "timestamp": "2026-09-05T03:30:00.000Z"
}
```

---

## 3. MODUL DASHBOARD & STATISTIK (`/api/dashboard`)

### `GET /api/dashboard/stats`
Mengambil metrik ringkasan kinerja operasional dan finansial untuk Dashboard Eksekutif.

**Respons (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_revenue": 3270150000.00,
    "total_equipments": 50,
    "available_equipments": 32,
    "rented_equipments": 14,
    "maintenance_equipments": 4,
    "active_rentals": 14,
    "urgent_maintenance": 4,
    "total_customers": 42
  }
}
```

---

## 4. MODUL INVENTARIS ALAT BERAT (`/api/equipments`)

### `GET /api/equipments`
Mengambil daftar seluruh armada alat berat dengan filter opsional.

**Query Parameters:**
- `status` *(opsional)*: `AVAILABLE`, `RENTED`, `MAINTENANCE`, `UNAVAILABLE`
- `type` *(opsional)*: `Excavator`, `Bulldozer`, `Roller`, `Loader`, `Crane`
- `search` *(opsional)*: Kata kunci kode atau nama alat

**Respons (200 OK):**
```json
{
  "success": true,
  "total": 50,
  "data": [
    {
      "id": 1,
      "equipment_code": "EXCA-KOM-PC200-01",
      "name": "Hydraulic Excavator Komatsu PC200-8",
      "type": "Excavator",
      "model": "PC200-8",
      "brand": "Komatsu",
      "hour_meter": 1250.50,
      "rental_price_per_day": 2500000.00,
      "status": "AVAILABLE",
      "last_maintenance_date": "2026-05-10",
      "thumbnail_url": "https://lh3.googleusercontent.com/..."
    }
  ]
}
```

### `POST /api/equipments`
Mendaftarkan unit alat berat baru ke dalam sistem.

**Request Body:**
```json
{
  "equipment_code": "EXCA-KOM-PC200-05",
  "name": "Hydraulic Excavator Komatsu PC200-8 (#05)",
  "type": "Excavator",
  "model": "PC200-8",
  "brand": "Komatsu",
  "hour_meter": 0.00,
  "rental_price_per_day": 2500000.00,
  "status": "AVAILABLE",
  "last_maintenance_date": "2026-09-01"
}
```

### `PUT /api/equipments/:id`
Memperbarui rincian atau status alat berat yang sudah ada.

### `DELETE /api/equipments/:id`
Menghapus unit alat berat dari sistem berdasarkan ID.

---

## 5. MODUL TRANSAKSI PENYEWAAN (`/api/rentals`)

### `GET /api/rentals`
Mengambil daftar transaksi sewa. Mendukung filter `customer_id` atau `status`.

### `POST /api/rentals`
Membuat pengajuan sewa baru dari pelanggan.

**Request Body:**
```json
{
  "customer_id": 9,
  "equipment_id": 1,
  "start_date": "2026-09-10",
  "end_date": "2026-09-24",
  "total_days": 14,
  "subtotal": 35000000.00,
  "notes": "Pekerjaan reklamasi lahan pelabuhan baru"
}
```

### `PUT /api/rentals/:id/status`
Mengubah status sewa oleh staf operasional (`APPROVED`, `ON_GOING`, `COMPLETED`, `REJECTED`).

---

## 6. MODUL KONTRAK & E-SIGNATURE (`/api/contracts`)

### `GET /api/contracts`
Mengambil daftar kontrak sewa legal.

### `POST /api/contracts/:id/sign`
Membubuhkan tanda tangan elektronik resmi pada kontrak sewa.

**Request Body:**
```json
{
  "signer_name": "Budi Santoso",
  "signer_role": "Direktur Operasional PT. Antang",
  "ip_address": "114.125.40.12"
}
```

**Respons (200 OK):**
```json
{
  "success": true,
  "message": "Kontrak berhasil ditandatangani secara digital",
  "signed_at": "2026-09-05T03:32:15.000Z",
  "is_signed_customer": 1
}
```

---

## 7. MODUL PEMBAYARAN & BUKTI SETOR (`/api/payments`)

### `GET /api/payments`
Mengambil daftar riwayat tagihan dan pembayaran sewa.

### `POST /api/payments/:id/proof`
Mengunggah path/nama berkas struk bukti transfer dari pelanggan.

**Request Body:**
```json
{
  "payment_proof_path": "uploads/proofs/mandiri_transfer_ref_99214.png"
}
```

### `POST /api/payments/:id/verify`
Staf operasional memverifikasi bahwa dana telah masuk ke rekening Mandiri PT. SBS.

**Request Body:**
```json
{
  "staff_id": 2,
  "staff_name": "Hendra Wijaya"
}
```

---

## 8. MODUL TELEMETRI GPS LAPANGAN (`/api/tracking`)

### `GET /api/tracking`
Mengambil koordinat geospasial real-time seluruh armada alat berat yang sedang aktif untuk dipetakan pada Leaflet.js.

**Respons (200 OK):**
```json
{
  "success": true,
  "total_tracked": 55,
  "data": [
    {
      "equipment_id": 2,
      "equipment_name": "Komatsu PC200-8 (#02)",
      "equipment_code": "EXCA-KOM-PC200-02",
      "latitude": -3.32439100,
      "longitude": 114.55839400,
      "speed": 5.20,
      "engine_status": "ON",
      "fuel_level_percent": 75.50,
      "recorded_at": "2026-09-05 03:20:00"
    }
  ]
}
```

---

## 9. MODUL DOKUMEN RESMI BAST & SURAT JALAN (`/api/reports`)

### `GET /api/reports`
Mengambil log penerbitan Berita Acara Serah Terima (BAST) dan Surat Jalan Mobilisasi Alat.
