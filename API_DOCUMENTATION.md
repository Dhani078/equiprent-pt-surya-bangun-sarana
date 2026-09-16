# API Documentation — EquipRent MS
**Base URL:** `https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev`  
**Runtime:** Hono.js on Cloudflare Workers  
**Auth:** Header `X-SBS-Session: <token>` (token diperoleh dari `/api/auth/login`)

---

## Autentikasi

### POST /api/auth/login
Login dan dapatkan session token.

**Request Body:**
```json
{ "username": "admin", "password": "admin" }
```

**Response 200:**
```json
{
  "token": "sbs_<base64>",
  "user": { "id": 1, "username": "admin", "full_name": "Administrator", "role": "ADMIN" }
}
```

**Error 400:** username/password kosong  
**Error 401:** kredensial salah

---

### POST /api/auth/logout
Hapus session.  
**Auth:** diperlukan  
**Response 200:** `{ "success": true }`

---

## Health Check

### GET /api/health
**Response 200:**
```json
{ "status": "online", "timestamp": "2026-09-16T02:00:00.000Z" }
```

---

## Dashboard

### GET /api/dashboard/stats
Agregat eksekutif Administrator.  
**Auth:** diperlukan

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 3270150000,
    "pendingPaymentAmount": 150000000,
    "pendingPaymentCount": 3,
    "totalEquipments": 50,
    "availableEquipments": 20,
    "rentedEquipments": 18,
    "maintenanceEquipments": 5,
    "activeRentals": 18,
    "pendingRentals": 4,
    "serviceDueCount": 2,
    "serviceDueCodes": ["EXC-01", "DZR-03"],
    "recentRentals": [...],
    "serviceQueue": [...],
    "generatedAt": "2026-09-16T02:00:00.000Z"
  }
}
```

---

## Alat Berat (Equipments)

### GET /api/equipments
Daftar semua unit.  
**Auth:** diperlukan  
**Response 200:** Array `Equipment[]`

### PUT /api/equipments/:id/status
Update status unit.  
**Auth:** Admin  
**Body:** `{ "status": "AVAILABLE" | "RENTED" | "MAINTENANCE" | "UNAVAILABLE" }`  
**Response 200:** `{ "success": true, "item": Equipment }`

---

## Transaksi Rental

### GET /api/rentals
Daftar semua rental.  
**Auth:** diperlukan (Customer hanya melihat miliknya)

### POST /api/rentals
Buat pengajuan sewa baru.  
**Auth:** diperlukan  
**Body:**
```json
{
  "equipment_id": 1,
  "customer_id": 9,
  "start_date": "2026-10-01",
  "end_date": "2026-10-10",
  "total_days": 10,
  "subtotal": 50000000
}
```
**Response 201:** `{ "success": true, "item": Rental }`  
**Error 409:** unit tidak tersedia / double-booking

### PUT /api/rentals/:id/status
Ubah status rental.  
**Auth:** Admin/Staff  
**Body:** `{ "status": "APPROVED" | "ON_GOING" | "COMPLETED" | "REJECTED" }`  
**Response 200:** `{ "success": true, "item": Rental, "meta": { "lateDays": 0, "allowedNext": [...] } }`  
**Error 409:** transisi status tidak sah

### GET /api/rentals/availability
Cek ketersediaan unit pada rentang tanggal.  
**Auth:** diperlukan  
**Query:** `?from=2026-10-01&to=2026-10-10[&equipmentId=1]`  
**Response 200:** `{ "success": true, "data": { "summary": {...}, "items": [...] } }`

### GET /api/rentals/bookable
Daftar unit yang bisa dipesan pada rentang tanggal.  
**Auth:** diperlukan  
**Query:** `?from=2026-10-01&to=2026-10-10`

---

## Kontrak

### GET /api/contracts
Daftar kontrak.  
**Auth:** diperlukan

### POST /api/contracts
Generate kontrak dari rental.  
**Body:** `{ "rental_id": 1 }`  
**Response 201:** `{ "success": true, "item": Contract }`

### POST /api/contracts/:id/sign
Tanda tangan kontrak (e-signature).  
**Body:** `{ "signerName": "Budi Santoso", "signature": "data:image/png;base64,..." }`  
**Response 200:** `{ "success": true, "item": Contract }`

---

## Pembayaran

### GET /api/payments
Daftar pembayaran + ringkasan antrean verifikasi.  
**Auth:** diperlukan  
**Response 200:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 50,
    "queue": { "pendingCount": 5, "readyToVerifyCount": 3, "awaitingProofCount": 2 }
  }
}
```

### POST /api/payments/:id/proof
Upload bukti transfer.  
**Auth:** diperlukan (Customer hanya untuk miliknya)  
**Body:** `{ "paymentProofPath": "uploads/proofs/bukti.jpg" }`  
**Response 200:** `{ "success": true, "item": Payment }`

### POST /api/payments/:id/verify
Verifikasi pembayaran (konfirmasi lunas).  
**Auth:** Admin/Staff  
**Body:** `{ "staffName": "Nama Staf" }`  
**Response 200:** `{ "success": true, "item": Payment, "meta": { "allowedNext": [] } }`

### POST /api/payments/:id/reject
Tolak bukti transfer.  
**Auth:** Admin/Staff  
**Body:** `{ "staffName": "Nama Staf" }`  
**Response 200:** `{ "success": true, "item": Payment }`

---

## Perawatan & Servis

### GET /api/maintenance
Daftar jadwal perawatan.  
**Auth:** diperlukan

### POST /api/maintenance
Buat jadwal perawatan baru.  
**Auth:** Admin/Staff  
**Body:**
```json
{
  "equipment_id": 1,
  "scheduled_date": "2026-10-15",
  "maintenance_type": "PREVENTIVE",
  "hour_meter_at_maintenance": 1250.5,
  "description": "Servis preventif 250 HM"
}
```
**Response 201:** `{ "success": true, "item": Maintenance }`  
**Error 400:** tanggal tidak valid / jenis tidak dikenal  
**Error 404:** unit tidak ditemukan

---

## GPS Telemetri

### GET /api/gps
Data telemetri semua unit.  
**Auth:** diperlukan  
**Response 200:** Array `GpsTracking[]` (55 titik koordinat Banjarmasin area)

---

## Laporan

### GET /api/reports/analytics
Hitung laporan operasional.  
**Auth:** diperlukan  
**Query:** `?type=RENTAL_BULANAN&from=2026-01-01&to=2026-12-31[&q=keyword]`  
**Tipe laporan:** `RENTAL_BULANAN`, `PEMBAYARAN_PIUTANG`, `PENDAPATAN_BERSIH`, `MAINTENANCE_SERVIS`, `UTILISASI_HM`, `KERUSAKAN_UNIT`, `TELEMETRI_GPS`, `KINERJA_STAF`, `SUKU_CADANG`, `KEPUASAN_PELANGGAN`, `AUDIT_TRAIL`

---

## Pengguna

### GET /api/users
Daftar pengguna (tanpa field `password`).  
**Auth:** Admin

### POST /api/users
Tambah pengguna baru.  
**Auth:** Admin

---

## Kode Error Standar

| Kode | Arti |
|---|---|
| `INVALID_ID` | ID tidak valid (bukan integer positif) |
| `INVALID_JSON` | Body request tidak valid JSON |
| `NOT_FOUND` | Resource tidak ditemukan |
| `UNAUTHORIZED` | Token tidak valid / tidak ada |
| `FORBIDDEN` | Role tidak punya akses |
| `EQUIPMENT_UNAVAILABLE` | Unit tidak tersedia (double-booking) |
| `STATUS_PEMBAYARAN_TIDAK_VALID` | Pembayaran sudah PAID, tidak bisa diulang |
| `BUKTI_TRANSFER_BELUM_ADA` | Verifikasi tanpa bukti transfer |
| `BUKAN_PEMILIK_PEMBAYARAN` | Customer akses tagihan orang lain |
