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
