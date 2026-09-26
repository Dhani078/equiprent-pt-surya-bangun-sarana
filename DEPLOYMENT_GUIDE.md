# PANDUAN DEPLOYMENT CI/CD (DEPLOYMENT_GUIDE.md)
### Cloudflare Workers & TiDB Cloud Serverless — PT. SURYA BANGUN SARANA

Dokumen ini memandu langkah-langkah implementasi otomasi deployment (CI/CD) dari repositori GitHub ke **Cloudflare Workers Edge Network**.

---

## 1. ALUR KERJA DEPLOYMENT OTOMATIS (CI/CD PIPELINE)

Setiap perubahan kode program yang di-push ke branch `main` pada GitHub akan memicu build otomatis di server Cloudflare:

```
[ Developer Commit ] ──> [ git push origin main ]
                                  │
                                  ▼
                    [ GitHub Repository ]
          (Dhani078/equiprent-pt-surya-bangun-sarana)
                                  │
                                  ▼ Webhook Trigger
                    [ Cloudflare Build Pipeline ]
           1. Cloning repository...
           2. Installing dependencies (npm clean-install)
           3. Executing custom build (npm run build: tsc && vite build)
           4. Bundling Edge Worker (npx wrangler deploy)
           5. Publishing Static Assets to Cloudflare Global CDN
                                  │
                                  ▼
           [ Live URL ] https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev
```

---

## 2. PRASYARAT LINGKUNGAN (PREREQUISITES)

1. **Node.js**: Versi LTS 18.x, 20.x, atau 22.x (Cloudflare CI menggunakan Node v24).
2. **NPM**: Versi 9.x atau 10.x.
3. **Akun Cloudflare**: Memiliki domain Workers aktif (contoh: `dhanisepeda.workers.dev`).
4. **Akun TiDB Cloud Serverless**: Cluster aktif di AWS Singapore (`ap-southeast-1`).

---

## 3. KONFIGURASI `wrangler.jsonc`

Berkas konfigurasi utama `wrangler.jsonc` mengatur proses kompilasi dan penyajian berkas statis:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "equiprent-pt-surya-bangun-sarana",
  "main": "src/server/index.ts",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "build": {
    "command": "npm run build"
  },
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application"
  },
  "observability": {
    "enabled": true
  }
}
```

### Poin Penting:
- `"build": { "command": "npm run build" }`: Memastikan TypeScript dikompilasi oleh `tsc` dan aset di-bundle oleh `vite build` sebelum worker diunggah.
- `"assets": { "directory": "./dist" }`: Cloudflare secara otomatis menyajikan file HTML, JS, dan CSS hasil build melalui CDN global.
- `"not_found_handling": "single-page-application"`: Rute React (mis. `/admin/rentals`) dijawab dengan `index.html` sehingga *client-side routing* tidak pecah saat halaman dibuka langsung atau dimuat ulang.
- `"compatibility_flags": ["nodejs_compat"]`: Wajib karena `@tidbcloud/serverless` memakai API Node yang butuh shim compat Workers.

---

## 4. PENGATURAN VARIABEL LINGKUNGAN (ENVIRONMENT VARIABLES / SECRETS)

Untuk menjaga keamanan kredensial database agar tidak bocor di GitHub, kredensial dimasukkan melalui Cloudflare Dashboard:

1. Buka **Cloudflare Dashboard** &rarr; **Compute (Workers & Pages)**.
2. Pilih Worker **equiprent-pt-surya-bangun-sarana**.
3. Buka tab **Settings** &rarr; **Variables and Secrets**.
4. Tambahkan variabel berikut. Daftar lengkap lihat `.env.example` §4.

| Nama Variabel | Tipe | Wajib? | Keterangan |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Secret (Encrypted)** | **YA** | String koneksi TiDB Cloud Serverless lengkap dengan parameter SSL. Format: `mysql://<user>:<password>@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/<database>?ssl={"rejectUnauthorized":true}`. Ini satu-satunya variabel database yang benar-benar dibaca Worker (`src/lib/db.ts`). |
| `SESSION_SECRET` | **Secret (Encrypted)** | **YA** | Kunci HMAC-SHA256 untuk menandatangani session token. Minimal 32 karakter acak: `openssl rand -hex 32`. Bila tidak diisi, server memakai kunci acak sementara &rarr; semua sesi gugur setiap isolate dimuat ulang (pengguna harus login ulang tanpa sebab yang jelas). Statusnya dilaporkan oleh `GET /api/health`. |
| `ALLOWED_ORIGINS` | Plaintext | opsional | Daftar origin yang boleh memanggil API (CORS), dipisah koma. **Kosongkan** bila SPA dan API satu domain (kasus default Worker + static assets). Saat kosong, tidak ada header `Access-Control-Allow-Origin` yang dikirim. |
| `ALLOW_DEMO_ACCOUNTS` | Plaintext | opsional | Setel `false` di produksi agar login demo (`admin`/`admin`, `staff`/`staff`, `user`/`user`) ditolak. Default `true`. |

### 4.1 Peringatan Keamanan Variabel

- **JANGAN gunakan prefiks `VITE_`** untuk variabel rahasia apa pun. Vite
  menyuntikkan setiap variabel `VITE_*` ke dalam bundle JavaScript klien yang
  diunduh browser. Konsekuensinya kredensial database dapat dibaca publik
  (lihat commit `fix(db): ... fix VITE_DATABASE_URL`). Ini sudah diperbaiki;
  jangan mengulang.
- **`.env` tidak dibaca oleh Workers.** Berkas `.env` hanya untuk pengembangan
  lokal (lapisan PHP & Node). Worker Cloudflare hanya membaca binding/secret
  yang didaftarkan di dashboard atau `wrangler secret put`.
- Skema database (`tidb_schema_and_data.sql`, 11 tabel + 13 indeks) harus
  sudah dijalankan di cluster TiDB sebelum Worker pertama kali menyambung.
  Selama `DATABASE_URL` belum sah, aplikasi berjalan pada mode
  `IN_MEMORY_DEMO` yang dilaporkan jujur oleh `GET /api/health`.

### 4.2 Memasang Secret lewat Wrangler CLI

```bash
# Setiap perintah membuka prompt nilai (nilai tidak tercetak di terminal).
npx wrangler secret put DATABASE_URL
npx wrangler secret put SESSION_SECRET

# Verifikasi: daftar nama secret (nilai tidak pernah ditampilkan).
npx wrangler secret list
```

---

## 5. DEPLOYMENT MANUAL DARI KOMPUTER LOKAL (CLI)

Jika Anda ingin melakukan deploy langsung dari terminal komputer tanpa menunggu GitHub CI:

```bash
# 1. Login ke akun Cloudflare Anda
npx wrangler login

# 2. Uji coba dry-run tanpa publish
npx wrangler deploy --dry-run

# 3. Jalankan deploy produksi
npm run deploy
```

---

## 6. PANDUAN PEMECAHAN MASALAH (TROUBLESHOOTING)

### Masalah 1: `npm error code EUSAGE / Invalid lock file`
- **Penyebab**: `package.json` dan `package-lock.json` tidak sinkron saat Cloudflare menjalankan `npm clean-install` (`npm ci`).
- **Solusi**: Jalankan `npm install` secara lokal, lalu commit dan push `package-lock.json` ke GitHub.

### Masalah 2: `Worker Startup Time Timeout`
- **Penyebab**: Kode level global melakukan blocking I/O sebelum handler menerima request.
- **Solusi**: Pastikan koneksi TiDB dibuat secara *lazy-loaded* atau menggunakan HTTP connection driver `@tidbcloud/serverless`.
