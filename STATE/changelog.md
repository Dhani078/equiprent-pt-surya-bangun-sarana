# CHANGELOG — Autonomous Agent Log

> Format: `## [CYCLE n] <ISO timestamp> — <task_id> — <priority> — <status>`
> Append-only. Jangan pernah menghapus entri lama.

---

## [CYCLE 0] 2026-09-04T19:00:00Z — INIT — P0 — DONE
**Judul:** Inisialisasi sistem agent otonom 24 jam
**Perubahan:**
- Membuat `AGENT24T.md` (master instruction)
- Membuat `STATE/agent_state.json`
- Membuat `STATE/task_queue.json` (15 task awal FASE 1–3)
- Membuat `STATE/changelog.md`, `STATE/blockers.md`, `STATE/known_issues.md`
**Verifikasi:** Struktur direktori valid
**Catatan:** Agent siap dijalankan dengan bootstrap prompt di §13 AGENT24T.md.

---

## [CYCLE 1] 2026-09-04T19:20:00Z — T-0003 — P0 — DONE
**Judul:** Perbaikan kritis auth — password kini diverifikasi + RBAC server-side
**Perubahan:**
- `src/lib/auth.ts` (BARU, 376 baris): modul keamanan terpusat. PBKDF2-SHA256 600k iterasi,
  session token HMAC-SHA256 bertanda tangan, matriks RBAC, timing-safe compare.
- `src/lib/db.ts`: tambah `verifyCredentials()` (username+password+status akun),
  export `isDatabaseConnected()`, `AuthCheck` jadi interface (strict:false tidak bisa narrow union).
  **Perbaiki bug:** `updateRentalStatus` kini membebaskan unit saat status `REJECTED`
  (sebelumnya unit terkunci selamanya). Ditambah pengecekan rental aktif lain.
- `src/server/index.ts`: middleware auth+RBAC untuk semua `/api/*`, global error handler
  (tidak bocorkan stack trace), rate limiting login 5x/15 menit per IP,
  validasi input ketat, response format konsisten `{success, error:{code,message}}`.
- `src/pages/Login.tsx`: verifikasi password via `db.verifyCredentials`,
  hapus `any` di catch, tambah validasi field kosong.
- `.gitignore`: tambah `.dev.vars` dan pengecualian `!STATE/`.
**Verifikasi:** `tsc --noEmit` PASS · `npm run build` PASS · 25/25 auth test PASS · 13/13 db test PASS
**Temuan penting:** Percobaan pertama hash demo memakai SHA-256 biasa tapi verifier memakai
PBKDF2 → 4 test FAIL. Diperbaiki dengan menghitung ulang hash via PBKDF2 yang benar.
**Catatan:** `tsconfig.json` masih `strict: false` → discriminated union tidak bisa di-narrow.
Harus diaktifkan bertahap di cycle berikutnya (T-0003b).

---

## [CYCLE 3] 2026-09-04T19:50:00Z — T-0014 — P1 — DONE
**Judul...[truncated]
## [CYCLE 2] 2026-09-04T19:35:00Z — T-0003b — P0 — DONE
**Judul:** Aktifkan TypeScript strict mode + kembalikan type union yang aman
**Perubahan:**
- `tsconfig.json`: `"strict": false` → `true`, tambah `forceConsistentCasingInFileNames`.
  Hapus komentar `/* Linting */` karena membuat file gagal divalidasi sebagai JSON.
- `src/pages/admin/MaintenanceManagement.tsx` baris 66: tambah guard
  `m.equipment_name &&` sebelum `.toLowerCase()` — satu-satunya error strict.
- `src/lib/auth.ts` + `src/lib/db.ts`: kembalikan `VerifyResult` & `AuthCheck` ke
  discriminated union (sekarang narrowing bekerja berkat strict mode).
- `src/server/index.ts` + `src/pages/Login.tsx`: hapus semua workaround
  `as User` / `as SessionPayload` / `?? 'UNAUTHORIZED'` yang kini tidak diperlukan.
**Verifikasi:** `tsc --noEmit` PASS (strict) · `npm run build` PASS · 12/12 regresi test PASS
**Dampak:** Type error kini tertangkap saat compile, bukan saat runtime.
Ini fondasi wajib sebelum menambah fitur baru di Fase 2.

---
