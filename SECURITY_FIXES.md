# Ringkasan Perbaikan Keamanan

Dokumen ini merangkum perbaikan pada branch `fix/security-audit` dan apa yang
masih harus Anda konfigurasi sendiri setelah merge.

## 1. Autentikasi & sesi (`src/lib/auth.ts`)

| Sebelum | Sesudah |
| --- | --- |
| Secret HMAC token punya nilai bawaan yang ikut ter-commit, sehingga siapa pun yang membaca repo bisa membuat token admin palsu. | Secret hanya dari `SESSION_SECRET` (minimal 32 karakter). Bila belum diisi, dipakai kunci acak sementara — sesi tidak bisa dipalsukan, tapi pengguna harus login ulang saat isolate berganti. Statusnya dilaporkan `/api/health`. |
| `verifyPassword` mencocokkan hash demo lebih dulu, jadi password asli pengguna bisa terlewat. | Hash tersimpan milik pengguna diperiksa lebih dulu; hash demo hanya dipakai bila akun belum punya password dan akun demo diizinkan (`ALLOW_DEMO_ACCOUNTS`). |
| RBAC *default-allow*: path yang belum terdaftar di matriks otomatis boleh diakses semua peran. | RBAC *default-deny*: hanya path yang terdaftar yang boleh diakses; hanya `/api/health` dan `/api/auth/login` yang publik. |
| Masa aktif sesi 8 jam. | 4 jam. |

## 2. Kebocoran data antar pelanggan (IDOR) — `src/server/index.ts`

Sebelumnya `GET /api/rentals`, `GET /api/contracts`, dan `GET /api/payments`
mengirim **seluruh** data seluruh pelanggan kepada siapa pun yang punya sesi,
termasuk akun pelanggan. Sekarang pelanggan hanya menerima datanya sendiri.

Perbaikan lain pada lapisan API:

- `POST /api/rentals` memaksa `customer_id` = pemilik sesi, sehingga transaksi
  tidak bisa dibuat atas nama pelanggan lain.
- Verifikasi/penolakan pembayaran tidak lagi jatuh ke `staffId = 3` bila sesi
  tidak membawa identitas — sekarang dijawab 401. Sebelumnya pengesahan bisa
  tercatat atas nama staf yang salah.
- Pemeriksaan kepemilikan pada unggah bukti transfer sekarang benar-benar
  menghentikan eksekusi (sebelumnya respons 403 disusun tapi perubahan data
  tetap berjalan).
- CORS tidak lagi mengizinkan semua origin; gunakan `ALLOWED_ORIGINS`.
- Rincian jadwal bentrok pada `/api/rentals/availability` disembunyikan dari
  pelanggan (memuat data transaksi pihak lain).
- Kesalahan internal dicatat ke log server; respons ke klien tetap generik.
- Endpoint baru: `POST /api/users/:id/password` (ADMIN) dan
  `POST /api/auth/change-password` (perlu password lama). Tanpa ini, akun yang
  dibuat lewat `POST /api/users` tidak pernah punya password dan tidak bisa login.

## 3. Lapisan PHP

- `config/database.php`: kredensial dibaca dari environment, bukan ditanam di
  source (`root` + kata sandi kosong sebelumnya ter-commit). Detail
  `PDOException` tidak ditampilkan bila `APP_ENV=production`.
- `config/security.php` (baru): cookie sesi `HttpOnly` + `SameSite=Lax` +
  `Secure` di HTTPS, batas idle 2 jam, rotasi ID sesi, token CSRF, dan
  pemeriksaan same-origin untuk POST.
- `index.php`: otorisasi dicek di router untuk setiap kelompok halaman (tidak
  lagi bergantung pada tiap controller memanggil `checkAccess` sendiri).
  Penandatanganan kontrak kini **wajib POST**, menolak kontrak yang sudah
  ditandatangani, dan menyimpan nama penandatangan dari sesi.
- `views/system_pages.php` (baru): halaman sistem dipindah keluar dari router,
  dan `$requiredRole` / `$currentRole` / `$roleName` kini di-escape (sebelumnya
  dicetak mentah ke HTML → celah XSS).
- `AuthController`: akun tanpa hash password ditolak eksplisit, akun
  nonaktif ditolak, percobaan login dibatasi 5 kali / 15 menit.

## 4. Yang masih harus Anda lakukan

1. **Setel secret sesi** (wajib, jika tidak semua sesi gugur berkala):
   ```bash
   npx wrangler secret put SESSION_SECRET   # isi dengan: openssl rand -hex 32
   ```
2. **Setel `ALLOWED_ORIGINS`** hanya bila front-end berada di domain berbeda.
3. **Matikan akun demo di produksi**: `ALLOW_DEMO_ACCOUNTS=false`.
4. **Isi `DATABASE_URL` TiDB**. Selama kosong, `/api/health` melaporkan
   `data_mode: "IN_MEMORY_DEMO"` dan semua perubahan data hilang saat isolate diganti.
5. **Untuk lapisan PHP**, isi `DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASS` dan
   `APP_ENV=production` di server, serta sisipkan `sbs_csrf_field()` ke dalam
   form POST yang ada di `views/`.
6. **Ganti kredensial yang pernah ter-commit** (akun MySQL lokal dan kredensial
   apa pun di berkas dump SQL) — riwayat Git tetap menyimpannya.
