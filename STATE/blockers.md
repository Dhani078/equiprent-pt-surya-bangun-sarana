# BLOCKERS — Butuh Intervensi Manusia

> Agent: jika kamu menemui hal di bawah, KERJAKAN TASK LAIN yang tidak terblokir. Jangan menunggu.

---

## BLOCKER-B001 — 2026-09-04 — STATUS: OPEN
**Butuh:** `DATABASE_URL` TiDB Cloud (koneksi production)
**Kenapa:** Tidak bisa menguji query live terhadap database nyata
**Dampak task:** T-0001, T-0002
**Workaround yang sudah dilakukan:** Pakai fallback `src/lib/mockData.ts` dengan penanda TODO
**Cara manusia menyelesaikan:**
```bash
npx wrangler secret put DATABASE_URL
# masukkan connection string TiDB Cloud Serverless
```

---

## BLOCKER-B002 — 2026-09-04 — STATUS: OPEN
**Butuh:** Konfirmasi tarif denda keterlambatan & tarif sewa per unit
**Kenapa:** Aturan bisnis §4.3 poin 7 melarang hardcode konstanta tarif
**Dampak task:** T-0006
**Workaround:** Nilai default disimpan di tabel `settings` dan bisa diubah Admin via UI
**Cara manusia menyelesaikan:** Isi nilai default di halaman Settings → atau biarkan agent memakai default rasional

---
