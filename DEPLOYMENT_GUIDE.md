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
  "compatibility_date": "2025-09-04",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "build": {
    "command": "npm run build"
  },
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS"
  },
  "observability": {
    "enabled": true
  }
}
```

### Poin Penting:
- `"build": { "command": "npm run build" }`: Memastikan TypeScript dikompilasi oleh `tsc` dan aset di-bundle oleh `vite build` sebelum worker diunggah.
- `"assets": { "directory": "./dist" }`: Cloudflare secara otomatis menyajikan file HTML, JS, dan CSS hasil build melalui CDN global.

---

## 4. PENGATURAN VARIABEL LINGKUNGAN (ENVIRONMENT VARIABLES / SECRETS)

Untuk menjaga keamanan kredensial database agar tidak bocor di GitHub, kredensial dimasukkan melalui Cloudflare Dashboard:

1. Buka **Cloudflare Dashboard** &rarr; **Compute (Workers & Pages)**.
2. Pilih Worker **equiprent-pt-surya-bangun-sarana**.
3. Buka tab **Settings** &rarr; **Variables and Secrets**.
4. Tambahkan variabel berikut:

| Nama Variabel | Tipe | Nilai Contoh |
| :--- | :--- | :--- |
| `TIDB_HOST` | Plaintext | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` |
| `TIDB_PORT` | Plaintext | `4000` |
| `TIDB_USER` | Plaintext | `3ajUHv8otax7qCG.root` |
| `TIDB_PASSWORD` | **Secret (Encrypted)** | *(Password database TiDB Anda)* |
| `TIDB_DATABASE` | Plaintext | `test` |

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
