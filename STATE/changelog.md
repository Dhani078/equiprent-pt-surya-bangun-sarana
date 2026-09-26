## Cycle 53 — Sweep token tema global T-0076 (2026-09-26)
- 28 file tsx: hex warna hardcoded (#1E293B,#FEF2F2,#ECFDF5,dst) -> token CSS var (--text-strong, --bg-*-soft, --fg-*-deep, dst). Nilai light IDENTIK dengan hex lama (screenshot light terverifikasi tidak berubah).
- Token baru didefinisikan di :root + [data-theme=dark] dengan padanan gelap (teks terang, latar tint transparan).
- Dark override untuk SEMUA family badge: .badge-sem-* (pill StatusBadge) + .badge-available/rented/maintenance/uncovered lama (pill EquipmentManagement). Sebelumnya putih saat dark mode.
- Fix inkonsistensi bahasa: judul halaman Inventaris "Equipment Inventory & Fleet Monitoring" -> "Inventaris Alat Berat & Pemantauan Armada" (UI lain sudah ID).
- Verifikasi visual CDP: dashboard+inventaris dark (8/10 -> pills themed), light tidak regresi, DOM computed style cocok.
- Gate: type-check 0, 29/29 suite (1 asersi warna skeletonLoading diupdate ke token, preseden sama cycle 51), build OK.
