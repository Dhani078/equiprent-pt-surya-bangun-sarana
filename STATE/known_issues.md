# KNOWN ISSUES — Bug yang Ditemukan & Belum Diperbaiki

> Agent: pindahkan ke `changelog.md` (sebagai DONE) setelah diperbaiki. Hapus dari sini.
> Format: `## ISSUE-I00X — <severity> — <status>`

---

_(Kosong — ISSUE-I001 sudah diperbaiki di cycle 46, lihat changelog.md)_

## ISSUE-I002 — sedang — OPEN (bukan bug, peningkatan aset)
**Fenomena:** 50 unit alat berat hanya memakai 5 URL foto Stitch yang dipakai bergantian.
**Rencana:** generate 50 foto unik per unit lewat 9Router `ag/gemini-3.1-flash-image`
(model paling akurat membaca brand+model), simpan ke `public/assets/units/`,
perbarui `thumbnail_url` lewat bulk PUT.
**Status:** ditunda atas permintaan user — kuota gateway image habis (reset ~4 jam).

---
