# PANDUAN SIDANG SKRIPSI & DEMONSTRASI APLIKASI
### Sistem Informasi Monitoring & Rental Alat Berat — PT. SURYA BANGUN SARANA BANJARMASIN

Dokumen ini disusun khusus sebagai **buku panduan lapangan bagi mahasiswa** dalam menghadapi presentasi sidang skripsi, uji komprehensif, maupun demonstrasi aplikasi di hadapan Dosen Pembimbing dan Dosen Penguji.

---

## 📋 DAFTAR ISI
1. [Struktur Naskah Pembuka Sidang (Opening Script)](#1-struktur-naskah-pembuka-sidang-opening-script)
2. [Skenario Live Demo Aplikasi Berbasis 3 Aktor](#2-skenario-live-demo-aplikasi-berbasis-3-aktor)
   - [Skenario 1: Pelanggan (Customer Portal)](#skenario-1-pelanggan-customer-portal)
   - [Skenario 2: Staf Operasional (Staff Terminal)](#skenario-2-staf-operasional-staff-terminal)
   - [Skenario 3: Administrator (Admin Dashboard)](#skenario-3-administrator-admin-dashboard)
3. [Bank Soal Sidang Skripsi (FAQ Dosen Penguji & Jawaban Ilmiah)](#3-bank-soal-sidang-skripsi-faq-dosen-penguji--jawaban-ilmiah)
4. [Tabel Komparasi Ilmiah: Sistem Konvensional vs EquipRent MS](#4-tabel-komparasi-ilmiah-sistem-konvensional-vs-equiprent-ms)
5. [Tips & Trik Menghadapi Sidang](#5-tips--trik-menghadapi-sidang)

---

## 1. STRUKTUR NASKAH PEMBUKA SIDANG (OPENING SCRIPT)

Gunakan naskah di bawah ini saat diminta membuka sesi presentasi sistem (durasi &plusmn; 2-3 menit):

> *"Bismillahirrahmannirrahim. Selamat pagi/siang kepada Bapak/Ibu Dosen Penguji dan Dosen Pembimbing yang saya hormati.*
>
> *Terima kasih atas kesempatan yang diberikan. Pada kesempatan hari ini, saya akan mendemonstrasikan hasil penelitian skripsi saya berjudul **'Sistem Informasi Monitoring dan Rental Alat Berat Berbasis Web pada PT. Surya Bangun Sarana Banjarmasin'**.*
>
> *Sebagai latar belakang singkat, PT. Surya Bangun Sarana Banjarmasin merupakan perusahaan terkemuka di bidang penyewaan armada alat berat di Kalimantan Selatan. Selama ini, operasional rental masih menemui sejumlah kendala: pencatatan Hour Meter (HM) secara manual yang memicu keterlambatan servis mesin, tidak adanya pemantauan lokasi GPS alat berat secara real-time di area proyek, serta lambatnya siklus administrasi kontrak sewa dan verifikasi transfer bank.*
>
> *Untuk menyelesaikan permasalahan tersebut, saya merancang dan membangun sistem **EquipRent MS**. Sistem ini telah terdistribusi secara live di **Cloudflare Edge Network** dengan basis data **TiDB Cloud Serverless** terintegrasi, yang memfasilitasi 3 aktor utama: Administrator, Staf Operasional, dan Pelanggan.*
>
> *Izin saya memulai demonstrasi alur sistem end-to-end secara live."*

---

## 2. SKENARIO LIVE DEMO APLIKASI BERBASIS 3 AKTOR

Alur demonstrasi dirancang runut menggambarkan **siklus hidup penyewaan alat berat nyata**:

```
[PELANGGAN]                   [STAF OPERASIONAL]                 [ADMINISTRATOR]
1. Login Akun                 4. Verifikasi Pembayaran           7. Monitor Utilisasi HM
2. Pilih Unit Excavator          & Setujui Booking               8. Pantau Live GPS Map
3. Tanda Tangan E-Sign &      5. Periksa Dokumen Kontrak         9. Cetak Laporan Resmi
   Unggah Struk Transfer      6. Terbitkan Surat Jalan              BAST & Surat Jalan
```

---

### SKENARIO 1: PELANGGAN (CUSTOMER PORTAL)

1. **Akses Halaman Utama**:
   - Tunjukkan bahwa sistem dimulai dari **Layar Login 2-Kolom Otentik Stitch**.
   - Jelaskan: *"Sistem menerapkan isolasi peran. Untuk demo pelanggan, saya klik tombol pintas `User (user / user)` dan sistem otomatis memilih tab Customer dan mengisi kredensial."*
   - Tekan tombol **MASUK TERMINAL**.
2. **Katalog Alat Berat**:
   - Di tab **Katalog Alat**, tunjukkan ketersediaan unit alat berat: *Hydraulic Excavator Komatsu PC200-8, Bulldozer D85ESS, Vibratory Roller Sakai SV520*.
   - Jelaskan bahwa setiap kartu unit menampilkan foto mesin standar industri, tarif sewa per hari, spesifikasi model, dan status ketersediaan.
3. **Mengajukan Sewa Unit**:
   - Pilih salah satu unit berstatus *AVAILABLE* (misal: Excavator Komatsu PC200-8), klik **Ajukan Sewa**.
   - Pilih tanggal mulai dan selesai. Tunjukkan bahwa sistem menghitung durasi hari dan total biaya sewa secara otomatis dan presisi.
   - Klik **Ajukan Permohonan Sewa**. Sistem berpindah ke riwayat sewa dengan status awal `PENDING`.
4. **Penandatanganan Kontrak Digital (E-Sign)**:
   - Buka tab **Kontrak & E-Sign**.
   - Klik tombol **Tanda Tangan E-Sign**.
   - Jelaskan: *"Sistem menerapkan tanda tangan elektronik digital dengan legalitas waktu ISO. Pelanggan memvalidasi nama resmi dan menyetujui klausul pertanggungjawaban alat berat."*
   - Klik **Bubuhkan Tanda Tangan Digital**. Status berubah menjadi *Telah Ditandatangani*.
5. **Konfirmasi Pembayaran**:
   - Buka tab **Tagihan & Transfer**.
   - Klik **Unggah Bukti Transfer**. Tunjukkan nomor rekening resmi Bank Mandiri PT. SBS dan struk mutasi setor.
   - Klik **Kirim Bukti Pembayaran**. Status berpindah ke `PENDING_VERIFICATION`.
6. **Logout**:
   - Klik tombol **Keluar** di pojok kanan atas untuk kembali ke Layar Login.

---

### SKENARIO 2: STAF OPERASIONAL (STAFF TERMINAL)

1. **Login Staf**:
   - Pada halaman Login, klik tombol pintas `Staff (staff / staff)` lalu tekan **MASUK TERMINAL**.
2. **Verifikasi Pembayaran Masuk**:
   - Di tab **Verifikasi Pembayaran**, tunjukkan daftar pembayaran yang menunggu validasi.
   - Klik **Lihat Bukti** untuk meninjau struk transfer klien.
   - Tekan tombol **Verifikasi Lunas**.
   - Jelaskan: *"Begitu staf memvalidasi transfer dana, status pembayaran berubah seketika menjadi PAID dan tercatat oleh siapa verifikasi dilakukan beserta stempel waktunya."*
3. **Persetujuan Permohonan Sewa**:
   - Buka tab **Permohonan Sewa Masuk**.
   - Temukan order sewa yang baru diajukan pelanggan tadi.
   - Klik tombol **Setujui (Approve)**. Status sewa berubah menjadi `APPROVED`.
   - Lanjutkan klik tombol **Mobilisasi (On Going)** saat unit diberangkatkan ke lapangan. Unit alat berat kini resmi beroperasi.
4. **Keluar**:
   - Klik tombol **Keluar** untuk kembali ke Login.

---

### SKENARIO 3: ADMINISTRATOR (ADMIN DASHBOARD)

1. **Login Administrator**:
   - Klik tombol pintas `Admin (admin / admin)` lalu tekan **MASUK TERMINAL**.
2. **Eksekutif Dashboard Finansial**:
   - Tunjukkan 4 Card Bento Stat:
     - **Total Pendapatan Terbayar**: Akumulasi rupiah dari pembayaran sewa berstatus `PAID` secara real-time.
     - **Total Armada Alat Berat**: Jumlah unit aktif, tersedia, dan dalam perawatan.
     - **Transaksi Sewa Aktif**: Jumlah kontrak yang sedang berjalan di lapangan.
     - **Jadwal Servis Mendesak**: Unit yang mendekati ambang batas Hour Meter (HM).
3. **Inventaris Alat Berat (Hour Meter Tracking)**:
   - Navigasi ke menu **Kelola Unit**.
   - Tunjukkan tabel inventaris dengan foto asli Stitch, kode serial alat, kategori mesin, akumulasi jam kerja (*Hour Meter*), dan tarif sewa.
   - Tunjukkan tombol **Edit**, **Hapus**, dan **Tambah Alat Baru** yang responsif.
4. **Peta Live GPS Telemetri (Leaflet.js GIS)**:
   - Buka menu **Live GPS Map**.
   - Tunjukkan peta interaktif Kalimantan Selatan.
   - Jelaskan: *"Peta memetakan koordinat riil unit di lapangan, seperti di Pelabuhan Trisakti Banjarmasin, Banjarbaru, dan Tabalong. Saat marker diklik, muncul informasi nama operator, status mesin (Engine ON/OFF), kecepatan bergerak (km/jam), dan sisa bahan bakar solar."*
5. **Cetak Dokumen Resmi BAST & Surat Jalan**:
   - Buka menu **Laporan & Dokumen**.
   - Klik **Buka Dokumen** pada Berita Acara Serah Terima (BAST).
   - Tunjukkan tampilan pratinjau dokumen resmi ber-Kop Surat PT. SBS Banjarmasin, nomor surat, detail spesifikasi alat, dan tanda tangan legalitas.
   - Tunjukkan tombol cetak browser yang siap diekspor menjadi berkas PDF cetak.

---

## 3. BANK SOAL SIDANG SKRIPSI (FAQ DOSEN PENGUJI & JAWABAN ILMIAH)

### Q1: *"Mengapa memilih arsitektur Edge Computing (Cloudflare Workers) dan bukan shared hosting PHP biasa?"*
> **Jawaban:**  
> *"Arsitektur Cloudflare Workers mendistribusikan kode aplikasi ke lebih dari 300 titik data center (Point of Presence / PoP) di seluruh dunia. Waktu startup prosesnya hanya **13 milidetik**, mengeliminasi latency cold-start khas serverless konvensional. Selain itu, model komputasi Edge memberikan proteksi terintegrasi dari serangan DDoS Layer 7, sertifikat SSL TLS 1.3 otomatis, serta ketersediaan sistem mendekati 99.99% tanpa beban pemeliharaan server fisik di kantor PT. SBS."*

---

### Q2: *"Apa keunggulan TiDB Cloud Serverless dibandingkan basis data MySQL/XAMPP lokal?"*
> **Jawaban:**  
> *"TiDB Cloud Serverless adalah basis data relasional terdistribusi (Distributed SQL) yang kompatibel 100% dengan protokol dan dialek sintaks MySQL 8.0. Keunggulan utamanya adalah:
> 1. **Konektor Edge HTTPS Tanpa Batasan TCP Socket**: Cloudflare Workers berjalan di atas V8 Isolate yang tidak mendukung TCP raw socket konvensional. TiDB Serverless menyediakan HTTP Driver `@tidbcloud/serverless` sehingga kueri SQL dapat dijalankan langsung dari Edge secara efisien.
> 2. **Penskalaan Otomatis (Auto-scaling)**: Kapasitas penyimpanan dan komputasi database membesar secara elastis mengikuti volume transaksi sewa tanpa risiko database crash atau kehabisan memori."*

---

### Q3: *"Bagaimana legalitas hukum tanda tangan digital (E-Sign) pada modul kontrak sewa?"*
> **Jawaban:**  
> *"Tanda tangan elektronik yang diterapkan pada sistem ini memenuhi ketentuan **Undang-Undang Republik Indonesia Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE) Pasal 11**, di mana tanda tangan digital memiliki kekuatan hukum dan akibat hukum yang sah selama memenuhi persyaratan: identitas penandatangan terverifikasi melalui autentikasi akun, adanya persetujuan eksplisit atas naskah kontrak, serta perekaman jejak audit digital berupa timestamp berstandar ISO 8601 yang tidak dapat diubah."*

---

### Q4: *"Bagaimana konsep pemantauan Hour Meter (HM) alat berat mencegah kerusakan mesin?"*
> **Jawaban:**  
> *"Pada industri alat berat, servis mesin tidak dihitung berdasarkan kilometer jarak tempuh kendaraan roda empat, melainkan berdasarkan jam kerja mesin berputar atau **Hour Meter (HM)**. Sistem EquipRent MS menerapkan batasan pemeliharaan preventif pada kelipatan 250 jam, 500 jam, dan 1.000 jam HM. Setiap unit yang mendekati ambang batas jam kerja tersebut akan otomatis dikelompokkan ke dalam kategori alert 'Maintenance Mendesak' pada Dashboard Administrator, sehingga teknisi dapat melakukan penggantian oli dan filter hidrolik sebelum terjadi kegagalan mekanikal (breakdown di lapangan)."*

---

### Q5: *"Bagaimana pengamanan diterapkan agar data kredensial tidak bocor di GitHub?"*
> **Jawaban:**  
> *"Sistem memisahkan kode program dari data rahasia (*separation of concerns*). Seluruh informasi sensitif seperti kata sandi database TiDB Cloud dan token disimpan di berkas `.env` yang secara ketat didaftarkan dalam file `.gitignore`. Pada saat deployment, variabel lingkungan diinjeksikan secara terenkripsi melalui fitur Secrets Environment Cloudflare Workers, sehingga repositori publik GitHub tetap 100% aman dan bebas dari kebocoran kredensial."*

---

## 4. TABEL KOMPARASI ILMIAH: SISTEM KONVENSIONAL VS EQUIPRENT MS

Tabel ini sangat baik ditampilkan pada slide presentasi Anda:

| Parameter Evaluasi | Prosedur Operasional Konvensional | Sistem Informasi EquipRent MS |
| :--- | :--- | :--- |
| **Pencatatan Jam Operasi (HM)** | Buku catatan fisik / formulir kertas rawan hilang | Database relasional terpusat dengan log akumulasi otomatis |
| **Pemantauan Lokasi Alat** | Laporan telepon verbal sopir / operator | Peta Telemetri GIS Leaflet.js real-time |
| **Siklus Pembuatan Kontrak** | Mengetik manual di Word, cetak, tanda tangan fisik (2-3 hari) | Penerbitan kontrak digital instan & E-Sign dalam hitungan menit |
| **Validasi Pembayaran** | Pengecekan mutasi manual via buku rekening tabungan | Verifikasi bukti setor 1-klik dengan audit trail staf resmi |
| **Penerbitan BAST / Surat Jalan** | Dibuat ulang manual oleh admin kantor | Otomatis di-generate dari data transaksi sewa yang disetujui |
| **Infrastruktur Hosting** | Komputer lokal XAMPP yang tidak bisa diakses di luar kantor | Edge Network global Cloudflare Workers + TiDB Cloud Serverless |

---

## 5. TIPS & TRIK MENGHADAPI SIDANG

1. **Gunakan Tombol Demo 1-Click**: Jangan buang waktu mengetik username dan password secara manual saat demo di hadapan penguji. Manfaatkan tombol chip cepat yang telah disediakan di layar Login.
2. **Kuasai Alur Relasi Data**: Pahami bahwa permohonan sewa (`rentals`) melahirkan kontrak digital (`contracts`), yang kemudian menghasilkan tagihan pembayaran (`payments`), dan setelah lunas unit dimobilisasi dengan Berita Acara (`reports`).
3. **Pertahankan Ketenangan**: Jika dosen meminta mengubah data, tunjukkan fitur **Edit Unit** atau **Buat Booking Baru**. Seluruh tombol telah diuji dan berfungsi secara reaktif tanpa perlu me-refresh halaman browser.
4. **Tunjukkan URL Live**: Di akhir sesi, tunjukkan bahwa aplikasi bukan hanya sekadar berjalan di `localhost`, melainkan telah aktif online di `https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev`.
