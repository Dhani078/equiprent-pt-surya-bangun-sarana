# KNOWN ISSUES — Bug yang Ditemukan & Belum Diperbaiki

> Agent: pindahkan ke `changelog.md` (sebagai DONE) setelah diperbaiki. Hapus dari sini.
> Format: `## ISSUE-I00X — <severity> — <status>`

---

## ISSUE-I001 — MEDIUM — OPEN
**Gejala:** Build Cloudflare gagal dengan `Could not detect a directory containing static files`
**Lokasi:** Deploy pipeline / `dist/` kosong
**Reproduksi:** `npx wrangler deploy` tanpa `npm run build` terlebih dahulu
**Hipotesis:** Folder `dist/` kosong atau tidak ter-generate
**Solusi:** Selalu jalankan `npm run build` sebelum `wrangler deploy`. Pastikan `wrangler.jsonc` punya blok `assets` dengan `directory: "./dist"`.
**Dampak task:** semua (deployment)

---
