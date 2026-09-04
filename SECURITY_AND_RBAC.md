# SPESIFIKASI KEAMANAN & MATRIKS RBAC (SECURITY_AND_RBAC.md)
### PT. SURYA BANGUN SARANA BANJARMASIN

Dokumen ini menjelaskan kerangka kerja keamanan siber (*cybersecurity*), kontrol akses berbasis peran (*Role-Based Access Control / RBAC*), perlindungan data rahasia (*Secret Zero*), serta kepatuhan hukum modul tanda tangan elektronik.

---

## 1. MATRIKS HAK AKSES BERBASIS PERAN (RBAC MATRIX)

Sistem membagi pengguna ke dalam 3 entitas hak akses terisolasi untuk memastikan prinsip *Least Privilege* (hak akses seminimal mungkin yang diperlukan):

| Fitur / Modul Operasional | ADMINISTRATOR (Admin) | STAF OPERASIONAL (Staff) | PELANGGAN (Customer) |
| :--- | :---: | :---: | :---: |
| **Akses Eksekutif Finansial Dashboard** | ✅ Penuh (Omzet & Utilisasi) | ❌ Tidak Memiliki Akses | ❌ Tidak Memiliki Akses |
| **Manajemen Data Master Alat Berat** | ✅ Tambah, Edit, Hapus | 👁️ Hanya Baca (Read-Only) | 👁️ Hanya Katalog Publik |
| **Pembaruan Jam Operasi (Hour Meter)** | ✅ Penuh | ✅ Rekam HM Lapangan | ❌ Tidak Memiliki Akses |
| **Pemantauan Live GPS Telemetri** | ✅ Seluruh Armada Kalsel | ✅ Unit Operasional | 👁️ Unit yang Sedang Disewa |
| **Pengajuan Sewa Unit (Booking)** | ✅ Buat Booking Manual | ❌ Dikelola dari Klien | ✅ Ajukan via Katalog |
| **Persetujuan Permohonan Sewa** | ✅ Penuh | ✅ Verifikasi & Approve | ❌ Hanya Menunggu |
| **Penandatanganan Kontrak (E-Sign)** | 👁️ Meninjau Legalitas | 👁️ Meninjau Legalitas | ✅ Tanda Tangan Digital |
| **Verifikasi Pembayaran Transfer** | ✅ Hak Akses Penuh | ✅ Verifikasi Lunas | ❌ Hanya Mengunggah Bukti |
| **Pengelolaan Akun & Peran Pengguna** | ✅ Tambah / Nonaktifkan | ❌ Tidak Memiliki Akses | ❌ Hanya Edit Profil Sendiri |
| **Cetak Resmi BAST / Surat Jalan** | ✅ Seluruh Dokumen | ✅ Dokumen Lapangan | 👁️ Unduh BAST Miliknya |

---

## 2. PERLINDUNGAN KREDENSIAL & PRINSIP *SECRET ZERO*

Sistem menerapkan arsitektur *Secret Zero*, di mana tidak ada kata sandi, kunci privat, atau token koneksi database yang di-hardcode ke dalam kode program repositori:

1. **Aturan `.gitignore` Ketat**:
   Berkas `.env` yang memuat password database TiDB Cloud dilarang keras di-commit ke Git:
   ```gitignore
   node_modules/
   dist/
   .env
   .wrangler/
   ```
2. **Injeksi Lingkungan Terenkripsi**:
   Pada environment live Cloudflare Workers, kredensial dimasukkan via fitur *Encrypted Secrets* yang hanya didekripsi saat runtime eksekusi V8 Isolate berlangsung di memori.
3. **Pencegahan Data Sensitif**:
   Password pengguna dalam database disimpan menggunakan hash kuat terenkripsi untuk mencegah eksfiltrasi kredensial.

---

## 3. LEGALITAS HUKUM TANDA TANGAN ELEKTRONIK (E-SIGNATURE)

Modul **E-Sign Kontrak Sewa** pada sistem ini dirancang tunduk pada regulasi hukum Negara Republik Indonesia:

- **Dasar Hukum:** **Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE)** sebagaimana telah diubah dengan **UU Nomor 19 Tahun 2016**, khususnya **Pasal 11**:
  > *"Tanda Tangan Elektronik memiliki kekuatan hukum dan akibat hukum yang sah selama memenuhi persyaratan..."*

### Kriteria Legalitas yang Dipenuhi Sistem:
1. **Autentisitas Data Pembuat Tanda Tangan**: Penandatangan harus terautentikasi melalui akun terverifikasi (User ID dan kata sandi).
2. **Integritas Dokumen**: Naskah kontrak sewa digital disimpan secara unik dan dikunci dengan referensi `rental_id`.
3. **Perekaman Jejak Waktu (Digital Audit Trail)**: Waktu penandatanganan dicatat secara presisi menggunakan stempel waktu UTC berstandar ISO 8601 (`signed_at`), mencatat identitas penandatangan, serta IP address perangkat.

---

## 4. PERLINDUNGAN DARI ANCAMAN SIBER UTAMA

### 1. Pencegahan Serangan SQL Injection
- Kueri basis data pada driver `@tidbcloud/serverless` maupun backend PHP PDO menggunakan **Parameterized Queries** dan **Prepared Statements**.
- Nilai input dari pengguna tidak pernah digabungkan secara langsung (*string concatenation*) ke dalam klausa SQL.

### 2. Pencegahan Serangan Cross-Site Scripting (XSS)
- Seluruh antarmuka dibangun menggunakan **React 18** yang secara otomatis melakukan *escape sanitization* terhadap karakter berbahaya (seperti `<script>`, `<iframe>`, dan event handler jahat).
- Komponen dokumen PDF BAST menggunakan pemetaan entitas aman sebelum dicetak.

### 3. Perlindungan Serangan Brute-Force
- Form login membatasi percobaan ganda (*anti double-submit*) dan memvalidasi tipe peran secara ketat sebelum menerbitkan sesi.
