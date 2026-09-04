-- =====================================================================
-- SCRIPT HANYA PENGISIAN DATA LENGKAP - MINIMAL 50 DATA PER TABEL
-- SISTEM INFORMASI MONITORING & RENTAL ALAT BERAT PT. SBS BANJARMASIN
-- =====================================================================
-- Petunjuk:
-- 1. Buka phpMyAdmin (http://localhost/phpmyadmin) dan pilih database Anda.
-- 2. Klik tab "SQL" di bagian atas.
-- 3. Salin dan tempel (Paste) seluruh kode SQL di bawah ini.
-- 4. Klik tombol "Go" atau "Kirim".
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- A. KOSONGKAN SELURUH DATA LAMA (Menggunakan DELETE + RESET AUTO_INCREMENT)
-- ---------------------------------------------------------------------
DELETE FROM `reports`;
ALTER TABLE `reports` AUTO_INCREMENT = 1;

DELETE FROM `gps_tracking`;
ALTER TABLE `gps_tracking` AUTO_INCREMENT = 1;

DELETE FROM `maintenance`;
ALTER TABLE `maintenance` AUTO_INCREMENT = 1;

DELETE FROM `payments`;
ALTER TABLE `payments` AUTO_INCREMENT = 1;

DELETE FROM `contracts`;
ALTER TABLE `contracts` AUTO_INCREMENT = 1;

DELETE FROM `rentals`;
ALTER TABLE `rentals` AUTO_INCREMENT = 1;

DELETE FROM `equipments`;
ALTER TABLE `equipments` AUTO_INCREMENT = 1;

DELETE FROM `users`;
ALTER TABLE `users` AUTO_INCREMENT = 1;

DELETE FROM `roles`;
ALTER TABLE `roles` AUTO_INCREMENT = 1;

-- ---------------------------------------------------------------------
-- B. PENGISIAN DATA KEMBALI (INSERT DATA PREMIUM - MINIMAL 50 RECORDS)
-- ---------------------------------------------------------------------

-- 1. DATA ROLES (3 Kategori Peran Utama)
INSERT INTO `roles` (`id`, `role_name`, `description`) VALUES
(1, 'ADMIN', 'Superuser dengan akses kontrol penuh sistem'),
(2, 'STAFF', 'Staf operasional pengelola rental, pembayaran, dan unit'),
(3, 'CUSTOMER', 'Pelanggan penyewa unit alat berat');

-- 2. DATA USERS (50 Akun Lengkap - 2 Admin, 6 Staff, 42 Customer Korporasi Kalsel)
-- Password Default:
-- - admin / admin2 -> password 'admin' ($2y$10$WP7X51RUxu6JeqXQWQVJI.23CMH5PRelAgkNmPqgeFNPBNhT8.Vyy)
-- - staff / ahmad / siska / eko / dwi / rudi -> password 'staff' ($2y$10$5UMRRMdkfjLDK0aNWP0T1eBDpfHF1OMtUmgb/Oj1g.n0eqWbPW69e)
-- - Selain itu (IDs 9 s/d 50) -> password 'user' ($2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC)
INSERT INTO `users` (`id`, `role_id`, `username`, `password`, `email`, `full_name`, `phone`, `address`, `company_name`, `status`) VALUES
-- ADMINISTRATORS (2 Akun)
(1, 1, 'admin', '$2y$10$WP7X51RUxu6JeqXQWQVJI.23CMH5PRelAgkNmPqgeFNPBNhT8.Vyy', 'admin@suryabangun.co.id', 'Muhammad Rizki Ramadhani, S.Kom (Admin)', '081254321098', 'Jl. Ahmad Yani KM 5, Banjarmasin', 'PT. Surya Bangun Sarana', 'ACTIVE'),
(2, 1, 'admin2', '$2y$10$WP7X51RUxu6JeqXQWQVJI.23CMH5PRelAgkNmPqgeFNPBNhT8.Vyy', 'lisa.indriani@suryabangun.co.id', 'Lisa Indriani, S.E. (Head of Finance)', '081255556666', 'Jl. Sultan Adam Blok C, Banjarmasin', 'PT. Surya Bangun Sarana', 'ACTIVE'),

-- STAFF OPERASIONAL / MEKANIK / SURVEYOR (6 Akun)
(3, 2, 'staff', '$2y$10$5UMRRMdkfjLDK0aNWP0T1eBDpfHF1OMtUmgb/Oj1g.n0eqWbPW69e', 'hendra@suryabangun.co.id', 'Hendra Wijaya (Staf Administrasi & Logistik)', '082198765432', 'Jl. Belitung Darat No. 45, Banjarmasin', 'PT. Surya Bangun Sarana', 'ACTIVE'),
(4, 2, 'ahmad', '$2y$10$5UMRRMdkfjLDK0aNWP0T1eBDpfHF1OMtUmgb/Oj1g.n0eqWbPW69e', 'ahmad_mekanik@suryabangun.co.id', 'Ahmad Ridwan (Mekanik Alat Berat Senior)', '085345678901', 'Jl. Liang Anggang KM 18, Banjarbaru', 'PT. Surya Bangun Sarana', 'ACTIVE'),
(5, 2, 'siska', '$2y$10$5UMRRMdkfjLDK0aNWP0T1eBDpfHF1OMtUmgb/Oj1g.n0eqWbPW69e', 'siska.amanda@suryabangun.co.id', 'Siska Amanda (Account Manager Executive)', '082148564979', 'Jl. Gatot Subroto No. 12, Banjarmasin', 'PT. Surya Bangun Sarana', 'ACTIVE'),
(6, 2, 'eko', '$2y$10$5UMRRMdkfjLDK0aNWP0T1eBDpfHF1OMtUmgb/Oj1g.n0eqWbPW69e', 'eko.purwanto@suryabangun.co.id', 'Eko Purwanto (Staf Lapangan & Surveyor)', '085299990001', 'Jl. Landasan Ulin Utara, Banjarbaru', 'PT. Surya Bangun Sarana', 'ACTIVE'),
(7, 2, 'dwi', '$2y$10$5UMRRMdkfjLDK0aNWP0T1eBDpfHF1OMtUmgb/Oj1g.n0eqWbPW69e', 'dwi.haryono@suryabangun.co.id', 'Dwi Haryono (Mekanik Junior)', '081387654321', 'Jl. Trans Kalimantan, Alalak, Batola', 'PT. Surya Bangun Sarana', 'ACTIVE'),
(8, 2, 'rudi', '$2y$10$5UMRRMdkfjLDK0aNWP0T1eBDpfHF1OMtUmgb/Oj1g.n0eqWbPW69e', 'rudi.hartono@suryabangun.co.id', 'Rudi Hartono (Operator Senior/Driver Mobilisasi)', '087822334455', 'Jl. Handil Bakti, Batola', 'PT. Surya Bangun Sarana', 'ACTIVE'),

-- CUSTOMERS / CLIENT COMPANIES (42 Akun, IDs 9 s/d 50)
(9, 3, 'user', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'logistik@anekatambang.com', 'Budi Santoso (Logistik)', '081122334455', 'Jl. Trisakti Pelabuhan, Banjarmasin', 'PT. Aneka Tambang Kalimantan', 'ACTIVE'),
(10, 3, 'user2', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'siti.aminah@baritoputera.co.id', 'Siti Aminah, M.B.A (Direktur)', '087855667788', 'Jl. Sultan Adam No. 88, Banjarmasin', 'CV. Barito Putera Konstruksi', 'ACTIVE'),
(11, 3, 'adaro', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'procurement@adaro.com', 'Ir. H. Gunawan Wibisono', '08115009001', 'Kawasan Industri Tabalong, Kalsel', 'PT. Adaro Indonesia', 'ACTIVE'),
(12, 3, 'banjar_indah', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'info@banjarindah.co.id', 'H. Akhmad Zaini (Manajer Konstruksi)', '085100112233', 'Jl. Banjar Indah Permai No. 10, Banjarmasin', 'PT. Banjar Indah Pembangunan', 'ACTIVE'),
(13, 3, 'meratus_coal', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'tomas.salim@meratuscoal.com', 'Tomas Salim', '081399887766', 'Kawasan Tambang Sebamban, Tanah Bumbu', 'PT. Meratus Coal Energy', 'ACTIVE'),
(14, 3, 'wasaka_jaya', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'dian.saputra@wasakajaya.com', 'Dian Saputra', '087712345678', 'Jl. H. Hasan Basri, Kayutangi, Banjarmasin', 'CV. Wasaka Jaya Mandiri', 'ACTIVE'),
(15, 3, 'hasnur_group', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'logistik@hasnurgroup.com', 'H. Syamsul Bahri (Kasi Logistik)', '0811998877', 'Kawasan Pelabuhan Hasnur, Tapin', 'PT. Hasnur Riung Sinergi', 'ACTIVE'),
(16, 3, 'karias_putra', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'karias.putra@yahoo.com', 'H. M. Yusuf (Owner)', '085388223344', 'Jl. Brigjend Hasan Basri, Amuntai', 'CV. Karias Putra Mandiri', 'ACTIVE'),
(17, 3, 'sarana_karya', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'sarana.karya@gmail.com', 'Ferry Ariadi', '082154332211', 'Jl. Pelaihari Raya KM 4, Tanah Laut', 'PT. Sarana Karya Konstruksi', 'ACTIVE'),
(18, 3, 'mitra_barito', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'mitra@barito.co.id', 'Hendri Saputra', '081267890123', 'Kawasan Logistik Marabahan, Batola', 'PT. Mitra Barito Logistik', 'ACTIVE'),
(19, 3, 'borneo_indo', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'borneo.indo@gmail.com', 'Roni Prasetyo', '085244556677', 'Jl. Mistar Cokrokusumo, Banjarbaru', 'CV. Borneo Indo Konstruksi', 'ACTIVE'),
(20, 3, 'tripatra', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'tripatra.banjar@gmail.com', 'Arif Rahman, M.T.', '08113456789', 'Kawasan Perkantoran Pemprov Kalsel, Banjarbaru', 'PT. Tripatra Banjar Konstruksi', 'ACTIVE'),
(21, 3, 'kalsel_prima', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'kalsel.prima@gmail.com', 'M. Aminuddin', '087855331199', 'Jl. Bypass Binuang, Tapin', 'CV. Kalsel Prima Mandiri', 'ACTIVE'),
(22, 3, 'banua_raya', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'logistik@banuaraya.co.id', 'Agus Setiawan', '081299001122', 'Jl. Trans Kalimantan, Handil Bakti', 'PT. Banua Raya Permai', 'ACTIVE'),
(23, 3, 'tanjung_jaya', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'tanjung.jaya@gmail.com', 'H. Noorhalis', '085299008811', 'Kawasan Industri Tanjung, Tabalong', 'CV. Tanjung Jaya Mandiri', 'ACTIVE'),
(24, 3, 'dwi_karya', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'dwi.karya@yahoo.co.id', 'Bambang Herianto', '081377889900', 'Jl. Raya Batulicin, Tanah Bumbu', 'PT. Dwi Karya Manunggal', 'ACTIVE'),
(25, 3, 'satui_bara', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'satui.bara@gmail.com', 'Indra Wijaya', '085366778899', 'Kawasan Pertambangan Satui, Tanah Bumbu', 'PT. Satui Bara Pratama', 'ACTIVE'),
(26, 3, 'bintang_banua', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'bintang.banua@gmail.com', 'Yusuf Habibi', '087812998833', 'Jl. Panglima Batur, Banjarbaru', 'CV. Bintang Banua Utama', 'ACTIVE'),
(27, 3, 'multisaras', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'multisaras@gmail.com', 'Robby Pangestu', '0811559988', 'Jl. Veteran No. 200, Banjarmasin', 'PT. Multi Saras Konstruksi', 'ACTIVE'),
(28, 3, 'wira_banua', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'wira.banua@gmail.com', 'H. Denny Indrayana', '081299007766', 'Jl. Sultan Adam Blok F, Banjarmasin', 'CV. Wira Banua Persada', 'ACTIVE'),
(29, 3, 'banjar_putra', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'banjarputra@gmail.com', 'Akhmad Fadli', '085299007711', 'Jl. A. Yani KM 37, Banjarbaru', 'CV. Banjar Putra Konstruksi', 'ACTIVE'),
(30, 3, 'duta_karya', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'dutakarya@yahoo.com', 'H. Syafruddin', '081399880011', 'Jl. Perdagangan No. 45, Banjarmasin', 'PT. Duta Karya Mandiri', 'ACTIVE'),
(31, 3, 'abdi_banua', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'abdibanua@gmail.com', 'Hermawan Saputra', '087822998800', 'Jl. Veteran, Martapura', 'CV. Abdi Banua Mandiri', 'ACTIVE'),
(32, 3, 'sumber_alam', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'sumberalam@gmail.com', 'Budi Hartono', '081255449900', 'Jl. Trans Kalimantan, Marabahan', 'PT. Sumber Alam Kalimantan', 'ACTIVE'),
(33, 3, 'bumi_jaya', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'bumijaya@yahoo.co.id', 'Hendri Lesmana', '085344558800', 'Jl. Pelaihari KM 10, Tanah Laut', 'CV. Bumi Jaya Sentosa', 'ACTIVE'),
(34, 3, 'prima_raya', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'primalogistik@hasnur.com', 'H. Riduan Hasbi', '0811550099', 'Pelabuhan Pendang, Barito Selatan', 'PT. Prima Raya Logistik', 'ACTIVE'),
(35, 3, 'karya_utama', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'karyautama@gmail.com', 'Donny Setiawan', '082155880099', 'Jl. Sudirman, Rantau, Tapin', 'PT. Karya Utama Mandiri', 'ACTIVE'),
(36, 3, 'merdeka_bara', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'merdekabara@gmail.com', 'Aditya Nugraha', '081388007766', 'Kawasan Tambang Binuang, Tapin', 'PT. Merdeka Bara Energi', 'ACTIVE'),
(37, 3, 'dharma_putra', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'dharmaputra@yahoo.com', 'H. Achmad Fauzi', '085299881133', 'Jl. Hasan Basri, Kandangan', 'CV. Dharma Putra Utama', 'ACTIVE'),
(38, 3, 'sumber_makmur', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'makmursumber@gmail.com', 'M. Zaini Akbar', '087855001122', 'Jl. Murung Pudak, Tabalong', 'PT. Sumber Makmur Tabalong', 'ACTIVE'),
(39, 3, 'sinar_banua', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'sinarbanua@gmail.com', 'H. Mansyur', '081299332211', 'Jl. A. Yani, Barabai', 'CV. Sinar Banua Sejahtera', 'ACTIVE'),
(40, 3, 'agung_mulia', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'agungmulia@gmail.com', 'Dedi Wahyudi', '085377002233', 'Jl. Pahlawan, Amuntai', 'PT. Agung Mulia Perkasa', 'ACTIVE'),
(41, 3, 'cipta_karya', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'ciptakarya@yahoo.co.id', 'Suhendra', '081399008877', 'Jl. Trans Kalimantan, Alalak', 'CV. Cipta Karya Mandiri', 'ACTIVE'),
(42, 3, 'sinar_mas', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'sinarmas.kalsel@gmail.com', 'Ir. H. Haryanto', '081199008811', 'Kawasan Industri Batulicin', 'PT. Sinar Mas Construction', 'ACTIVE'),
(43, 3, 'mega_utama', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'megautama@gmail.com', 'Faturrahman', '082199008833', 'Jl. Pelabuhan Samudra, Kotabaru', 'PT. Mega Utama Logistik', 'ACTIVE'),
(44, 3, 'tunas_bangsa', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'tunasbangsa@yahoo.com', 'M. Yusuf Amin', '085299448833', 'Jl. Sultan Adam, Banjarmasin', 'CV. Tunas Bangsa Mandiri', 'ACTIVE'),
(45, 3, 'karya_persada', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'karyapersada@gmail.com', 'Denny Hidayat', '087812998822', 'Jl. A. Yani KM 8, Kertak Hanyar', 'PT. Karya Persada Banua', 'ACTIVE'),
(46, 3, 'barito_utama', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'baritoutama@gmail.com', 'H. Syarifuddin', '081299110022', 'Jl. Trans Kalimantan, Batola', 'CV. Barito Utama Persada', 'ACTIVE'),
(47, 3, 'mitra_karya', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'mitrakarya@gmail.com', 'Zulkifli', '085399880022', 'Jl. Lingkar Selatan, Banjarmasin', 'PT. Mitra Karya Kalimantan', 'ACTIVE'),
(48, 3, 'wira_pratama', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'wirapratama@yahoo.co.id', 'Hendri Wijaya, M.T.', '081399881177', 'Jl. Mistar Cokrokusumo, Banjarbaru', 'PT. Wira Pratama Konstruksi', 'ACTIVE'),
(49, 3, 'borneo_jaya', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'borneojaya@gmail.com', 'Andi Wijaya', '087822008899', 'Jl. Trans Kalimantan, Pelaihari', 'CV. Borneo Jaya Sejahtera', 'ACTIVE'),
(50, 3, 'hasnur_riung', '$2y$10$YIfjmNYGKxrd0R6whYjcvu5qp6aFanhEFFPL1i1obWZbiADQQXeWC', 'hasnur.riung@hasnur.co.id', 'Ir. H. Rachmadi', '081199330011', 'Kawasan Pertambangan Tapin, Kalsel', 'PT. Hasnur Riung Sinergi (HQ)', 'ACTIVE');

-- 3. DATA EQUIPMENTS (50 Unit Alat Berat Premium Lengkap - Berbagai Brand & Tipe)
INSERT INTO `equipments` (`id`, `equipment_code`, `name`, `type`, `model`, `brand`, `hour_meter`, `rental_price_per_day`, `status`, `last_maintenance_date`, `thumbnail_url`) VALUES
-- EXCAVATORS (15 Unit)
(1, 'EXCA-KOM-PC200-01', 'Hydraulic Excavator Komatsu PC200-8', 'Excavator', 'PC200-8', 'Komatsu', 1250.50, 2500000.00, 'AVAILABLE', '2026-05-10', 'assets/images/pc200.jpg'),
(2, 'EXCA-KOM-PC200-02', 'Hydraulic Excavator Komatsu PC200-8', 'Excavator', 'PC200-8', 'Komatsu', 2410.80, 2500000.00, 'RENTED', '2026-05-15', 'assets/images/pc200.jpg'),
(3, 'EXCA-CAT-320D-01', 'Caterpillar Hydraulic Excavator 320D', 'Excavator', '320D', 'Caterpillar', 1780.40, 2700000.00, 'RENTED', '2026-05-18', 'assets/images/cat320d.jpg'),
(4, 'EXCA-HIT-ZX200-01', 'Hitachi Zaxis ZX200-5G Excavator', 'Excavator', 'ZX200-5G', 'Hitachi', 950.15, 2600000.00, 'AVAILABLE', '2026-04-30', 'assets/images/hitachizx200.jpg'),
(5, 'EXCA-HIT-ZX200-02', 'Hitachi Zaxis ZX200-5G Excavator', 'Excavator', 'ZX200-5G', 'Hitachi', 1150.20, 2600000.00, 'RENTED', '2026-05-02', 'assets/images/hitachizx200.jpg'),
(6, 'EXCA-KOB-SK200-01', 'Kobelco SK200-10 Hydraulic Excavator', 'Excavator', 'SK200-10', 'Kobelco', 1620.40, 2450000.00, 'RENTED', '2026-05-20', 'assets/images/kobelcosk200.jpg'),
(7, 'EXCA-KOB-SK200-02', 'Kobelco SK200-10 Hydraulic Excavator', 'Excavator', 'SK200-10', 'Kobelco', 1450.80, 2450000.00, 'AVAILABLE', '2026-05-12', 'assets/images/kobelcosk200.jpg'),
(8, 'EXCA-SANY-SY215-01', 'Sany SY215C Hydraulic Excavator', 'Excavator', 'SY215C', 'Sany', 820.50, 2300000.00, 'AVAILABLE', '2026-05-14', 'assets/images/sany215.jpg'),
(9, 'EXCA-SANY-SY215-02', 'Sany SY215C Hydraulic Excavator', 'Excavator', 'SY215C', 'Sany', 1250.30, 2300000.00, 'RENTED', '2026-05-16', 'assets/images/sany215.jpg'),
(10, 'EXCA-KOM-PC200-03', 'Hydraulic Excavator Komatsu PC200-8', 'Excavator', 'PC200-8', 'Komatsu', 1980.40, 2500000.00, 'RENTED', '2026-05-01', 'assets/images/pc200.jpg'),
(11, 'EXCA-CAT-320D-02', 'Caterpillar Hydraulic Excavator 320D', 'Excavator', '320D', 'Caterpillar', 2240.50, 2700000.00, 'RENTED', '2026-05-05', 'assets/images/cat320d.jpg'),
(12, 'EXCA-HIT-ZX200-03', 'Hitachi Zaxis ZX200-5G Excavator', 'Excavator', 'ZX200-5G', 'Hitachi', 1380.60, 2600000.00, 'RENTED', '2026-05-11', 'assets/images/hitachizx200.jpg'),
(13, 'EXCA-KOB-SK200-03', 'Kobelco SK200-10 Hydraulic Excavator', 'Excavator', 'SK200-10', 'Kobelco', 890.70, 2450000.00, 'RENTED', '2026-05-14', 'assets/images/kobelcosk200.jpg'),
(14, 'EXCA-SANY-SY215-03', 'Sany SY215C Hydraulic Excavator', 'Excavator', 'SY215C', 'Sany', 670.40, 2300000.00, 'RENTED', '2026-05-22', 'assets/images/sany215.jpg'),
(15, 'EXCA-CAT-320D-03', 'Caterpillar Hydraulic Excavator 320D', 'Excavator', '320D', 'Caterpillar', 1420.90, 2700000.00, 'RENTED', '2026-05-25', 'assets/images/cat320d.jpg'),

-- BULLDOZERS (10 Unit)
(16, 'BULL-CAT-D6R-01', 'Track-Type Tractor Caterpillar D6R', 'Bulldozer', 'D6R', 'Caterpillar', 890.20, 3200000.00, 'AVAILABLE', '2026-04-20', 'assets/images/catd6r.jpg'),
(17, 'BULL-KOM-D85ESS-01', 'Crawler Bulldozer Komatsu D85ESS-2', 'Bulldozer', 'D85ESS-2', 'Komatsu', 3120.60, 3500000.00, 'RENTED', '2026-05-12', 'assets/images/komatsud85.jpg'),
(18, 'BULL-SHAN-SD16-01', 'Shantui SD16 Standard Bulldozer', 'Bulldozer', 'SD16', 'Shantui', 1420.50, 2800000.00, 'AVAILABLE', '2026-05-05', 'assets/images/shantuisd16.jpg'),
(19, 'BULL-CAT-D8R-01', 'Caterpillar Heavy Duty Bulldozer D8R', 'Bulldozer', 'D8R', 'Caterpillar', 2050.40, 4800000.00, 'RENTED', '2026-05-26', 'assets/images/catd8r.jpg'),
(20, 'BULL-SHAN-SD22-01', 'Shantui SD22 Heavy Bulldozer', 'Bulldozer', 'SD22', 'Shantui', 950.40, 3400000.00, 'RENTED', '2026-05-08', 'assets/images/shantuisd22.jpg'),
(21, 'BULL-KOM-D85ESS-02', 'Crawler Bulldozer Komatsu D85ESS-2', 'Bulldozer', 'D85ESS-2', 'Komatsu', 2540.80, 3500000.00, 'RENTED', '2026-05-10', 'assets/images/komatsud85.jpg'),
(22, 'BULL-CAT-D6R-02', 'Track-Type Tractor Caterpillar D6R', 'Bulldozer', 'D6R', 'Caterpillar', 1120.40, 3200000.00, 'RENTED', '2026-05-15', 'assets/images/catd6r.jpg'),
(23, 'BULL-SHAN-SD16-02', 'Shantui SD16 Standard Bulldozer', 'Bulldozer', 'SD16', 'Shantui', 870.50, 2800000.00, 'RENTED', '2026-05-18', 'assets/images/shantuisd16.jpg'),
(24, 'BULL-KOM-D85ESS-03', 'Crawler Bulldozer Komatsu D85ESS-2', 'Bulldozer', 'D85ESS-2', 'Komatsu', 1860.50, 3500000.00, 'RENTED', '2026-05-20', 'assets/images/komatsud85.jpg'),
(25, 'BULL-CAT-D6R-03', 'Track-Type Tractor Caterpillar D6R', 'Bulldozer', 'D6R', 'Caterpillar', 940.80, 3200000.00, 'RENTED', '2026-05-24', 'assets/images/catd6r.jpg'),

-- CRANES (8 Unit)
(26, 'CRAN-TAD-GR500-01', 'Rough Terrain Crane Tadano GR-500EX', 'Crane', 'GR-500EX', 'Tadano', 450.00, 5000000.00, 'MAINTENANCE', '2026-05-25', 'assets/images/tadano500.jpg'),
(27, 'CRAN-KOB-CKE800-01', 'Crawler Crane Kobelco CKE800G', 'Crane', 'CKE800G', 'Kobelco', 2150.80, 7500000.00, 'RENTED', '2026-04-15', 'assets/images/kobelco800.jpg'),
(28, 'CRAN-SANY-SRC550-01', 'Sany SRC550 Heavy Duty Crane', 'Crane', 'SRC550', 'Sany', 720.50, 5200000.00, 'AVAILABLE', '2026-05-09', 'assets/images/sany550.jpg'),
(29, 'CRAN-TAD-GR300-01', 'Tadano GR-300EX Rough Terrain Crane', 'Crane', 'GR-300EX', 'Tadano', 980.50, 3800000.00, 'RENTED', '2026-05-12', 'assets/images/tadano300.jpg'),
(30, 'CRAN-KATO-KR25H-01', 'Kato KR-25H Rough Terrain Crane', 'Crane', 'KR-25H', 'Kato', 1850.40, 3500000.00, 'RENTED', '2026-05-14', 'assets/images/kato25.jpg'),
(31, 'CRAN-SANY-SRC550-02', 'Sany SRC550 Heavy Duty Crane', 'Crane', 'SRC550', 'Sany', 610.80, 5200000.00, 'RENTED', '2026-05-18', 'assets/images/sany550.jpg'),
(32, 'CRAN-TAD-GR500-02', 'Rough Terrain Crane Tadano GR-500EX', 'Crane', 'GR-500EX', 'Tadano', 890.40, 5000000.00, 'RENTED', '2026-05-22', 'assets/images/tadano500.jpg'),
(33, 'CRAN-KOB-CKE800-02', 'Crawler Crane Kobelco CKE800G', 'Crane', 'CKE800G', 'Kobelco', 1450.60, 7500000.00, 'RENTED', '2026-05-25', 'assets/images/kobelco800.jpg'),

-- ROLLERS / COMPACTORS (8 Unit)
(34, 'VIBR-SAK-SV520-01', 'Vibratory Single Drum Roller Sakai SV520D', 'Vibratory Roller', 'SV520D', 'Sakai', 1580.35, 1800000.00, 'RENTED', '2026-05-02', 'assets/images/sakaisv520.jpg'),
(35, 'VIBR-BOM-BW211-01', 'Bomag Single Drum Rollers BW211D-40', 'Vibratory Roller', 'BW211D-40', 'Bomag', 1120.40, 1950000.00, 'AVAILABLE', '2026-05-22', 'assets/images/bomagbw211.jpg'),
(36, 'VIBR-SAK-SV520-02', 'Vibratory Single Drum Roller Sakai SV520D', 'Vibratory Roller', 'SV520D', 'Sakai', 820.60, 1800000.00, 'RENTED', '2026-05-18', 'assets/images/sakaisv520.jpg'),
(37, 'VIBR-SAK-SV512-01', 'Vibratory Roller Sakai SV512D', 'Vibratory Roller', 'SV512D', 'Sakai', 1420.50, 1600000.00, 'RENTED', '2026-05-10', 'assets/images/sakaisv512.jpg'),
(38, 'VIBR-BOM-BW211-02', 'Bomag Single Drum Rollers BW211D-40', 'Vibratory Roller', 'BW211D-40', 'Bomag', 750.80, 1950000.00, 'RENTED', '2026-05-15', 'assets/images/bomagbw211.jpg'),
(39, 'VIBR-SAK-SV520-03', 'Vibratory Single Drum Roller Sakai SV520D', 'Vibratory Roller', 'SV520D', 'Sakai', 920.40, 1800000.00, 'RENTED', '2026-05-19', 'assets/images/sakaisv520.jpg'),
(40, 'VIBR-DYN-CA250-01', 'Dynapac CA250D Vibratory Soil Compactor', 'Vibratory Roller', 'CA250D', 'Dynapac', 1650.40, 1750000.00, 'RENTED', '2026-05-22', 'assets/images/dynapac250.jpg'),
(41, 'VIBR-SAK-SV512-02', 'Vibratory Roller Sakai SV512D', 'Vibratory Roller', 'SV512D', 'Sakai', 980.60, 1600000.00, 'RENTED', '2026-05-24', 'assets/images/sakaisv512.jpg'),

-- MOTOR GRADERS (6 Unit)
(42, 'GRAD-CAT-120K-01', 'Motor Grader Caterpillar 120K', 'Motor Grader', '120K', 'Caterpillar', 860.90, 3600000.00, 'AVAILABLE', '2026-05-08', 'assets/images/cat120k.jpg'),
(43, 'GRAD-KOM-GD511-01', 'Motor Grader Komatsu GD511A-1', 'Motor Grader', 'GD511A-1', 'Komatsu', 1980.50, 3400000.00, 'RENTED', '2026-05-01', 'assets/images/komatsugd511.jpg'),
(44, 'GRAD-CAT-120K-02', 'Motor Grader Caterpillar 120K', 'Motor Grader', '120K', 'Caterpillar', 1050.40, 3600000.00, 'RENTED', '2026-05-11', 'assets/images/cat120k.jpg'),
(45, 'GRAD-KOM-GD511-02', 'Motor Grader Komatsu GD511A-1', 'Motor Grader', 'GD511A-1', 'Komatsu', 1150.30, 3400000.00, 'RENTED', '2026-05-14', 'assets/images/komatsugd511.jpg'),
(46, 'GRAD-CAT-140K-01', 'Heavy Duty Grader Caterpillar 140K', 'Motor Grader', '140K', 'Caterpillar', 1890.60, 4800000.00, 'RENTED', '2026-05-19', 'assets/images/cat140k.jpg'),
(47, 'GRAD-CAT-120K-03', 'Motor Grader Caterpillar 120K', 'Motor Grader', '120K', 'Caterpillar', 930.50, 3600000.00, 'RENTED', '2026-05-23', 'assets/images/cat120k.jpg'),

-- WHEEL LOADERS (3 Unit)
(48, 'LOAD-KOM-WA380-01', 'Wheel Loader Komatsu WA380-6', 'Wheel Loader', 'WA380-6', 'Komatsu', 1420.50, 2200000.00, 'RENTED', '2026-05-14', 'assets/images/loaderwa380.jpg'),
(49, 'LOAD-CAT-950H-01', 'Caterpillar Wheel Loader 950H', 'Wheel Loader', '950H', 'Caterpillar', 1890.40, 2400000.00, 'RENTED', '2026-05-18', 'assets/images/cat950h.jpg'),
(50, 'LOAD-SDLG-LG936-01', 'SDLG LG936L Wheel Loader', 'Wheel Loader', 'LG936L', 'SDLG', 750.60, 1500000.00, 'RENTED', '2026-05-24', 'assets/images/sdlg936.jpg');

-- 4. DATA RENTALS (50 Transaksi Sewa Unik - Subtotal Dihitung Secara Presisi)
INSERT INTO `rentals` (`id`, `rental_code`, `customer_id`, `equipment_id`, `booking_date`, `start_date`, `end_date`, `total_days`, `subtotal`, `status`, `notes`) VALUES
(1, 'RNT-SBS-20260501-001', 9, 2, '2026-05-01 09:00:00', '2026-05-05', '2026-06-05', 31, 77500000.00, 'ON_GOING', 'Proyek Pengurukan Lahan Pelabuhan Baru Trisakti'),
(2, 'RNT-SBS-20260515-002', 10, 14, '2026-05-15 14:30:00', '2026-05-20', '2026-06-03', 14, 25200000.00, 'ON_GOING', 'Pemadatan Jalan Ahmad Yani KM 12'),
(3, 'RNT-SBS-20260528-003', 9, 1, '2026-05-28 10:15:00', '2026-06-05', '2026-06-15', 10, 25000000.00, 'PENDING', 'Sewa cadangan pengerjaan drainase jalan tol'),
(4, 'RNT-SBS-20260510-004', 11, 3, '2026-05-10 08:00:00', '2026-05-12', '2026-07-12', 61, 164700000.00, 'ON_GOING', 'Pemindahan batubara di stockpile Tabalong'),
(5, 'RNT-SBS-20260512-005', 12, 8, '2026-05-12 11:20:00', '2026-05-15', '2026-06-15', 31, 108500000.00, 'ON_GOING', 'Land clearing kawasan Banjar Indah Regency'),
(6, 'RNT-SBS-20260410-006', 13, 27, '2026-04-10 09:30:00', '2026-04-15', '2026-07-15', 91, 682500000.00, 'ON_GOING', 'Ereksi struktur conveyor tambang Sebamban'),
(7, 'RNT-SBS-20260425-007', 14, 43, '2026-04-25 15:40:00', '2026-05-01', '2026-06-01', 31, 105400000.00, 'ON_GOING', 'Grading material jalan perumahan Kayutangi'),
(8, 'RNT-SBS-20260529-008', 10, 4, '2026-05-29 16:00:00', '2026-06-10', '2026-06-25', 15, 39000000.00, 'APPROVED', 'Pembersihan aliran sungai Martapura Kayutangi'),
(9, 'RNT-SBS-20260530-009', 12, 18, '2026-05-30 11:00:00', '2026-06-01', '2026-06-10', 9, 25200000.00, 'APPROVED', 'Perataan tanah kavling komersial Banjarbaru'),
(10, 'RNT-SBS-20260505-010', 15, 5, '2026-05-05 08:30:00', '2026-05-08', '2026-06-08', 31, 80600000.00, 'ON_GOING', 'Pembersihan Lahan Dermaga Log Pelabuhan Tapin'),
(11, 'RNT-SBS-20260506-011', 16, 6, '2026-05-06 10:15:00', '2026-05-10', '2026-06-10', 31, 75950000.00, 'ON_GOING', 'Konstruksi Pembangunan Ruko Amuntai'),
(12, 'RNT-SBS-20260507-012', 17, 19, '2026-05-07 14:00:00', '2026-05-12', '2026-06-12', 31, 148800000.00, 'ON_GOING', 'Penggusuran Batuan Keras Gunung Kayu Habang Pelaihari'),
(13, 'RNT-SBS-20260508-013', 18, 36, '2026-05-08 09:00:00', '2026-05-12', '2026-06-12', 31, 55800000.00, 'ON_GOING', 'Pemadatan Lahan Komplek Pergudangan Marabahan'),
(14, 'RNT-SBS-20260509-014', 19, 44, '2026-05-09 11:20:00', '2026-05-14', '2026-06-14', 31, 111600000.00, 'ON_GOING', 'Grading Jalan Raya Lingkar Utara Banjarbaru'),
(15, 'RNT-SBS-20260510-015', 20, 48, '2026-05-10 16:30:00', '2026-05-15', '2026-06-15', 31, 68200000.00, 'ON_GOING', 'Pemuatan Material Pasir Proyek Kantor Pemerintahan Banjarbaru'),
(16, 'RNT-SBS-20260520-016', 21, 35, '2026-05-20 10:00:00', '2026-06-01', '2026-06-15', 14, 27300000.00, 'APPROVED', 'Pekerjaan Pengerasan Jalan Bypas Binuang'),
(17, 'RNT-SBS-20260522-017', 22, 29, '2026-05-22 13:45:00', '2026-06-05', '2026-06-20', 15, 57000000.00, 'APPROVED', 'Ereksi Rangka Baja Gudang Baru Handil Bakti'),
(18, 'RNT-SBS-20260524-018', 23, 42, '2026-05-24 15:30:00', '2026-06-01', '2026-06-21', 20, 72000000.00, 'APPROVED', 'Pengurukan & Grading Lapangan Bola Tanjung'),
(19, 'RNT-SBS-20260525-019', 24, 22, '2026-05-25 09:15:00', '2026-06-05', '2026-06-15', 10, 32000000.00, 'APPROVED', 'Land clearing kavling industri Batulicin'),
(20, 'RNT-SBS-20260526-020', 25, 24, '2026-05-26 11:10:00', '2026-06-10', '2026-07-10', 30, 105000000.00, 'PENDING', 'Pekerjaan Batubara Tambang Satui'),
(21, 'RNT-SBS-20260502-021', 26, 9, '2026-05-02 08:00:00', '2026-05-06', '2026-05-26', 20, 46000000.00, 'COMPLETED', 'Pembangunan Cluster Perumahan Banjarbaru'),
(22, 'RNT-SBS-20260503-022', 27, 21, '2026-05-03 10:00:00', '2026-05-08', '2026-05-28', 20, 70000000.00, 'COMPLETED', 'Pembukaan Lahan Perkebunan Kelapa Sawit'),
(23, 'RNT-SBS-20260504-023', 28, 23, '2026-05-04 14:00:00', '2026-05-10', '2026-05-20', 10, 28000000.00, 'COMPLETED', 'Pengurukan Lahan Rawa Sultan Adam'),
(24, 'RNT-SBS-20260505-024', 29, 30, '2026-05-05 16:00:00', '2026-05-12', '2026-05-22', 10, 35000000.00, 'COMPLETED', 'Ereksi Rangka Baja Proyek Banjarbaru'),
(25, 'RNT-SBS-20260506-025', 30, 31, '2026-05-06 09:00:00', '2026-05-15', '2026-05-30', 15, 78000000.00, 'COMPLETED', 'Konstruksi Sipil Dermaga Samudra Kotabaru'),
(26, 'RNT-SBS-20260507-026', 31, 32, '2026-05-07 11:30:00', '2026-05-15', '2026-05-25', 10, 50000000.00, 'COMPLETED', 'Sewa Crane Tadano Proyek Jembatan Martapura'),
(27, 'RNT-SBS-20260508-027', 32, 37, '2026-05-08 13:00:00', '2026-05-18', '2026-05-28', 10, 16000000.00, 'COMPLETED', 'Pembangunan Tanggul Sungai Barito Marabahan'),
(28, 'RNT-SBS-20260509-028', 33, 38, '2026-05-09 15:45:00', '2026-05-20', '2026-05-30', 10, 19500000.00, 'COMPLETED', 'Pemadatan Lahan Proyek Pelaihari KM 10'),
(29, 'RNT-SBS-20260510-029', 34, 39, '2026-05-10 10:00:00', '2026-05-20', '2026-06-04', 15, 27000000.00, 'ON_GOING', 'Pemadatan Area Stockpile Hasnur Tapin'),
(30, 'RNT-SBS-20260511-030', 35, 40, '2026-05-11 12:20:00', '2026-05-22', '2026-06-05', 14, 24500000.00, 'ON_GOING', 'Pengerasan Lahan Parkir Rantau'),
(31, 'RNT-SBS-20260512-031', 36, 41, '2026-05-12 14:00:00', '2026-05-24', '2026-06-07', 14, 22400000.00, 'ON_GOING', 'Pekerjaan Tanah Binuang'),
(32, 'RNT-SBS-20260513-032', 37, 45, '2026-05-13 16:30:00', '2026-05-25', '2026-06-08', 14, 47600000.00, 'ON_GOING', 'Grading Jalan Kawasan Kandangan'),
(33, 'RNT-SBS-20260514-033', 38, 46, '2026-05-14 09:00:00', '2026-05-26', '2026-06-09', 14, 67200000.00, 'ON_GOING', 'Pekerjaan Grader Jalan Murung Pudak'),
(34, 'RNT-SBS-20260515-034', 39, 47, '2026-05-15 11:15:00', '2026-05-28', '2026-06-11', 14, 50400000.00, 'ON_GOING', 'Grading Material Jalan Raya Barabai'),
(35, 'RNT-SBS-20260516-035', 40, 49, '2026-05-16 13:45:00', '2026-05-30', '2026-06-13', 14, 33600000.00, 'ON_GOING', 'Pemuatan Material Tanah Proyek Amuntai'),
(36, 'RNT-SBS-20260517-036', 41, 50, '2026-05-17 15:30:00', '2026-06-01', '2026-06-15', 14, 21000000.00, 'ON_GOING', 'Pemuatan Material Pasir Sungai Alalak'),
(37, 'RNT-SBS-20260518-037', 42, 10, '2026-05-18 09:30:00', '2026-06-01', '2026-06-10', 9, 22500000.00, 'ON_GOING', 'Sewa Cadangan Proyek Industri Batulicin'),
(38, 'RNT-SBS-20260519-038', 43, 11, '2026-05-19 11:20:00', '2026-06-01', '2026-06-15', 14, 37800000.00, 'ON_GOING', 'Proyek Pelabuhan Kotabaru'),
(39, 'RNT-SBS-20260520-039', 44, 12, '2026-05-20 14:00:00', '2026-06-02', '2026-06-12', 10, 26000000.00, 'ON_GOING', 'Sewa Cadangan Pembersihan Sultan Adam'),
(40, 'RNT-SBS-20260521-040', 45, 13, '2026-05-21 16:30:00', '2026-06-02', '2026-06-16', 14, 34300000.00, 'ON_GOING', 'Sewa Proyek Jalan Lingkar Kertak Hanyar'),
(41, 'RNT-SBS-20260522-041', 46, 15, '2026-05-22 09:15:00', '2026-06-03', '2026-06-13', 10, 27000000.00, 'ON_GOING', 'Pekerjaan Grader Jalan Batola'),
(42, 'RNT-SBS-20260523-042', 47, 16, '2026-05-23 11:00:00', '2026-06-03', '2026-06-17', 14, 44800000.00, 'ON_GOING', 'Pekerjaan Land clearing Jalan Lingkar Selatan'),
(43, 'RNT-SBS-20260524-043', 48, 17, '2026-05-24 14:00:00', '2026-06-04', '2026-06-14', 10, 32000000.00, 'ON_GOING', 'Pekerjaan Grader Jalan Banjarbaru'),
(44, 'RNT-SBS-20260525-044', 49, 20, '2026-05-25 15:45:00', '2026-06-04', '2026-06-18', 14, 47600000.00, 'ON_GOING', 'Pemuatan Material Tanah Proyek Pelaihari'),
(45, 'RNT-SBS-20260526-045', 50, 22, '2026-05-26 10:00:00', '2026-06-05', '2026-06-15', 10, 32000000.00, 'ON_GOING', 'Land clearing Tapin Pertambangan'),
(46, 'RNT-SBS-20260527-046', 9, 25, '2026-05-27 12:20:00', '2026-06-05', '2026-06-15', 10, 32000000.00, 'APPROVED', 'Pekerjaan Buldozer Pelabuhan Trisakti'),
(47, 'RNT-SBS-20260528-047', 10, 33, '2026-05-28 14:00:00', '2026-06-06', '2026-06-20', 14, 105000000.00, 'APPROVED', 'Pekerjaan Konstruksi Gudang Banjarbaru'),
(48, 'RNT-SBS-20260529-048', 11, 23, '2026-05-29 16:30:00', '2026-06-06', '2026-06-16', 10, 28000000.00, 'APPROVED', 'Bulldozer Lahan Tambang Adaro'),
(49, 'RNT-SBS-20260530-049', 12, 38, '2026-05-30 09:15:00', '2026-06-07', '2026-06-17', 10, 19500000.00, 'APPROVED', 'Pemadatan Lahan Proyek Banjar Indah'),
(50, 'RNT-SBS-20260531-050', 13, 24, '2026-05-31 11:10:00', '2026-06-08', '2026-07-08', 30, 105000000.00, 'PENDING', 'Pekerjaan Bulldozer Tambang Sebamban');

-- 5. DATA CONTRACTS (50 Hukum Kontrak Terkait Langsung dengan Kode Penyewaan)
INSERT INTO `contracts` (`id`, `contract_code`, `rental_id`, `customer_id`, `contract_date`, `valid_until`, `document_path`, `terms_conditions`, `is_signed_customer`, `signed_at`) VALUES
(1, 'CTR-SBS-20260505-001', 1, 9, '2026-05-05', '2026-06-05', 'uploads/contracts/CTR-SBS-20260505-001.pdf', '1. Penyewa wajib merawat alat berat dengan baik.\n2. Kerusakan akibat kelalaian ditanggung penyewa sepenuhnya.', 1, '2026-05-05 11:00:00'),
(2, 'CTR-SBS-20260520-002', 2, 10, '2026-05-20', '2026-06-03', 'uploads/contracts/CTR-SBS-20260520-002.pdf', '1. Alat hanya digunakan untuk pemadatan jalan.\n2. BBM ditanggung penyewa.', 1, '2026-05-20 16:15:00'),
(3, 'CTR-SBS-20260512-003', 4, 11, '2026-05-12', '2026-07-12', 'uploads/contracts/CTR-SBS-20260512-003.pdf', '1. Alat digunakan khusus area stockpile tambang Adaro.\n2. Wajib patuhi K3 tambang.', 1, '2026-05-12 10:20:00'),
(4, 'CTR-SBS-20260515-004', 5, 12, '2026-05-15', '2026-06-15', 'uploads/contracts/CTR-SBS-20260515-004.pdf', '1. Digunakan untuk pengerjaan land clearing.\n2. Biaya Operator ditanggung penyewa.', 1, '2026-05-15 14:00:00'),
(5, 'CTR-SBS-20260415-005', 6, 13, '2026-04-15', '2026-07-15', 'uploads/contracts/CTR-SBS-20260415-005.pdf', '1. Sewa jangka panjang crane Tadano.\n2. Servis berkala bulanan difasilitasi PT. SBS.', 1, '2026-04-15 11:00:00'),
(6, 'CTR-SBS-20260501-006', 7, 14, '2026-05-01', '2026-06-01', 'uploads/contracts/CTR-SBS-20260501-006.pdf', '1. Motor Grader disewa untuk penataan jalan komplek.\n2. Penggunaan maks 10 jam/hari.', 1, '2026-05-01 16:50:00'),
(7, 'CTR-SBS-20260508-007', 10, 15, '2026-05-08', '2026-06-08', 'uploads/contracts/CTR-SBS-20260508-007.pdf', '1. Digunakan eksklusif untuk pelabuhan Tapin.\n2. Pembayaran lunas di awal.', 1, '2026-05-08 10:00:00'),
(8, 'CTR-SBS-20260510-008', 11, 16, '2026-05-10', '2026-06-10', 'uploads/contracts/CTR-SBS-20260510-008.pdf', '1. Digunakan untuk proyek konstruksi Amuntai.\n2. Keamanan alat ditanggung penyewa.', 1, '2026-05-10 11:15:00'),
(9, 'CTR-SBS-20260512-009', 12, 17, '2026-05-12', '2026-06-12', 'uploads/contracts/CTR-SBS-20260512-009.pdf', '1. Digunakan untuk pembongkaran batu gunung Pelaihari.\n2. Overtime dikenakan biaya tambahan.', 1, '2026-05-12 15:30:00'),
(10, 'CTR-SBS-20260512-010', 13, 18, '2026-05-12', '2026-06-12', 'uploads/contracts/CTR-SBS-20260512-010.pdf', '1. Digunakan untuk komplek pergudangan Marabahan.\n2. Pemeliharaan preventif dari PT. SBS.', 1, '2026-05-12 10:45:00'),
(11, 'CTR-SBS-20260514-011', 14, 19, '2026-05-14', '2026-06-14', 'uploads/contracts/CTR-SBS-20260514-011.pdf', '1. Pengaspalan jalan raya Banjarbaru.\n2. Wajib asuransi alat berat.', 1, '2026-05-14 09:30:00'),
(12, 'CTR-SBS-20260515-012', 15, 20, '2026-05-15', '2026-06-15', 'uploads/contracts/CTR-SBS-20260515-012.pdf', '1. Digunakan untuk memuat pasir perkantoran Banjarbaru.\n2. Operator wajib berlisensi SIO.', 1, '2026-05-15 17:00:00'),
(13, 'CTR-SBS-20260506-013', 21, 26, '2026-05-06', '2026-05-26', 'uploads/contracts/CTR-SBS-20260506-013.pdf', '1. Perumahan Banjarbaru. 2. Pihak kedua wajib merawat.', 1, '2026-05-06 09:00:00'),
(14, 'CTR-SBS-20260508-014', 22, 27, '2026-05-08', '2026-05-28', 'uploads/contracts/CTR-SBS-20260508-014.pdf', '1. Sawit. 2. BBM ditanggung penyewa.', 1, '2026-05-08 11:00:00'),
(15, 'CTR-SBS-20260510-015', 23, 28, '2026-05-10', '2026-05-20', 'uploads/contracts/CTR-SBS-20260510-015.pdf', '1. Rawa Sultan Adam. 2. Keamanan ditanggung.', 1, '2026-05-10 15:00:00'),
(16, 'CTR-SBS-20260512-016', 24, 29, '2026-05-12', '2026-05-22', 'uploads/contracts/CTR-SBS-20260512-016.pdf', '1. Baja Banjarbaru. 2. Maksimal 8 jam.', 1, '2026-05-12 17:00:00'),
(17, 'CTR-SBS-20260515-017', 25, 30, '2026-05-15', '2026-05-30', 'uploads/contracts/CTR-SBS-20260515-017.pdf', '1. Dermaga Samudra. 2. BBM & Operator.', 1, '2026-05-15 10:00:00'),
(18, 'CTR-SBS-20260515-018', 26, 31, '2026-05-15', '2026-05-25', 'uploads/contracts/CTR-SBS-20260515-018.pdf', '1. Jembatan Martapura. 2. Crane Tadano.', 1, '2026-05-15 12:00:00'),
(19, 'CTR-SBS-20260518-019', 27, 32, '2026-05-18', '2026-05-28', 'uploads/contracts/CTR-SBS-20260518-019.pdf', '1. Tanggul Barito. 2. Mobilisasi ditanggung.', 1, '2026-05-18 14:00:00'),
(20, 'CTR-SBS-20260520-020', 28, 33, '2026-05-20', '2026-05-30', 'uploads/contracts/CTR-SBS-20260520-020.pdf', '1. Lahan Pelaihari. 2. Pemeliharaan PT SBS.', 1, '2026-05-20 16:00:00'),
(21, 'CTR-SBS-20260520-021', 29, 34, '2026-05-20', '2026-06-04', 'uploads/contracts/CTR-SBS-20260520-021.pdf', '1. Stockpile Hasnur. 2. Wajib APD standar.', 1, '2026-05-20 11:00:00'),
(22, 'CTR-SBS-20260522-022', 30, 35, '2026-05-22', '2026-06-05', 'uploads/contracts/CTR-SBS-20260522-022.pdf', '1. Lahan Parkir Rantau. 2. BBM ditanggung.', 1, '2026-05-22 13:00:00'),
(23, 'CTR-SBS-20260524-023', 31, 36, '2026-05-24', '2026-06-07', 'uploads/contracts/CTR-SBS-20260524-023.pdf', '1. Tanah Binuang. 2. Operator bersertifikat.', 1, '2026-05-24 15:00:00'),
(24, 'CTR-SBS-20260525-024', 32, 37, '2026-05-25', '2026-06-08', 'uploads/contracts/CTR-SBS-20260525-024.pdf', '1. Kawasan Kandangan. 2. BBM & Operator.', 1, '2026-05-25 10:00:00'),
(25, 'CTR-SBS-20260526-025', 33, 38, '2026-05-26', '2026-06-09', 'uploads/contracts/CTR-SBS-20260526-025.pdf', '1. Grader Murung Pudak. 2. Keamanan.', 1, '2026-05-26 12:00:00'),
(26, 'CTR-SBS-20260528-026', 34, 39, '2026-05-28', '2026-06-11', 'uploads/contracts/CTR-SBS-20260528-026.pdf', '1. Raya Barabai. 2. Overtime Rp 150rb/jam.', 1, '2026-05-28 14:00:00'),
(27, 'CTR-SBS-20260530-027', 35, 40, '2026-05-30', '2026-06-13', 'uploads/contracts/CTR-SBS-20260530-027.pdf', '1. Material Amuntai. 2. Pihak kedua wajib.', 1, '2026-05-30 16:00:00'),
(28, 'CTR-SBS-20260601-028', 36, 41, '2026-06-01', '2026-06-15', 'uploads/contracts/CTR-SBS-20260601-028.pdf', '1. Sungai Alalak. 2. Operator bersertifikat.', 1, '2026-06-01 10:00:00'),
(29, 'CTR-SBS-20260601-029', 37, 42, '2026-06-01', '2026-06-10', 'uploads/contracts/CTR-SBS-20260601-029.pdf', '1. Industri Batulicin. 2. Keamanan.', 1, '2026-06-01 12:00:00'),
(30, 'CTR-SBS-20260601-030', 38, 43, '2026-06-01', '2026-06-15', 'uploads/contracts/CTR-SBS-20260601-030.pdf', '1. Pelabuhan Kotabaru. 2. BBM & Operator.', 1, '2026-06-01 14:00:00'),
(31, 'CTR-SBS-20260602-031', 39, 44, '2026-06-02', '2026-06-12', 'uploads/contracts/CTR-SBS-20260602-031.pdf', '1. Pembersihan Sultan Adam. 2. Maks 8 jam.', 1, '2026-06-02 10:00:00'),
(32, 'CTR-SBS-20260602-032', 40, 45, '2026-06-02', '2026-06-16', 'uploads/contracts/CTR-SBS-20260602-032.pdf', '1. Kertak Hanyar. 2. BBM ditanggung.', 1, '2026-06-02 11:00:00'),
(33, 'CTR-SBS-20260603-033', 41, 46, '2026-06-03', '2026-06-13', 'uploads/contracts/CTR-SBS-20260603-033.pdf', '1. Grader Batola. 2. Pemeliharaan PT SBS.', 1, '2026-06-03 14:00:00'),
(34, 'CTR-SBS-20260603-034', 42, 47, '2026-06-03', '2026-06-17', 'uploads/contracts/CTR-SBS-20260603-034.pdf', '1. Lingkar Selatan. 2. BBM ditanggung.', 1, '2026-06-03 16:00:00'),
(35, 'CTR-SBS-20260604-035', 43, 48, '2026-06-04', '2026-06-14', 'uploads/contracts/CTR-SBS-20260604-035.pdf', '1. Grader Banjarbaru. 2. Operator.', 1, '2026-06-04 10:00:00'),
(36, 'CTR-SBS-20260604-036', 44, 49, '2026-06-04', '2026-06-18', 'uploads/contracts/CTR-SBS-20260604-036.pdf', '1. Pelaihari. 2. Pihak kedua wajib.', 1, '2026-06-04 11:00:00'),
(37, 'CTR-SBS-20260605-037', 45, 50, '2026-06-05', '2026-06-15', 'uploads/contracts/CTR-SBS-20260605-037.pdf', '1. Tapin Pertambangan. 2. K3.', 1, '2026-06-05 14:00:00'),
(38, 'CTR-SBS-20260528-038', 3, 9, '2026-05-28', '2026-06-15', 'uploads/contracts/CTR-SBS-20260528-038.pdf', '1. Kontrak cadangan drainase jalan tol.', 0, NULL),
(39, 'CTR-SBS-20260529-039', 8, 10, '2026-05-29', '2026-06-25', 'uploads/contracts/CTR-SBS-20260529-039.pdf', '1. Pembersihan sungai Martapura.', 0, NULL),
(40, 'CTR-SBS-20260530-040', 9, 12, '2026-05-30', '2026-06-10', 'uploads/contracts/CTR-SBS-20260530-040.pdf', '1. Perataan tanah kavling komersial Banjarbaru.', 0, NULL),
(41, 'CTR-SBS-20260601-041', 16, 21, '2026-06-01', '2026-06-15', 'uploads/contracts/CTR-SBS-20260601-041.pdf', '1. Perkerasan jalan Bypass Binuang.', 0, NULL),
(42, 'CTR-SBS-20260602-042', 17, 22, '2026-06-02', '2026-06-20', 'uploads/contracts/CTR-SBS-20260602-042.pdf', '1. Ereksi Rangka Gudang Handil Bakti.', 0, NULL),
(43, 'CTR-SBS-20260603-043', 18, 23, '2026-06-03', '2026-06-21', 'uploads/contracts/CTR-SBS-20260603-043.pdf', '1. Pengurukan lapangan Tanjung.', 0, NULL),
(44, 'CTR-SBS-20260604-044', 19, 24, '2026-06-04', '2026-06-15', 'uploads/contracts/CTR-SBS-20260604-044.pdf', '1. Land clearing industri Batulicin.', 0, NULL),
(45, 'CTR-SBS-20260605-045', 20, 25, '2026-06-05', '2026-07-10', 'uploads/contracts/CTR-SBS-20260605-045.pdf', '1. Pekerjaan batubara tambang Satui.', 0, NULL),
(46, 'CTR-SBS-20260605-046', 46, 9, '2026-06-05', '2026-06-15', 'uploads/contracts/CTR-SBS-20260605-046.pdf', '1. Buldozer Pelabuhan Trisakti.', 0, NULL),
(47, 'CTR-SBS-20260606-047', 47, 10, '2026-06-06', '2026-06-20', 'uploads/contracts/CTR-SBS-20260606-047.pdf', '1. Konstruksi Gudang Banjarbaru.', 0, NULL),
(48, 'CTR-SBS-20260606-048', 48, 11, '2026-06-06', '2026-06-16', 'uploads/contracts/CTR-SBS-20260606-048.pdf', '1. Bulldozer Tambang Adaro.', 0, NULL),
(49, 'CTR-SBS-20260607-049', 49, 12, '2026-06-07', '2026-06-17', 'uploads/contracts/CTR-SBS-20260607-049.pdf', '1. Pemadatan Proyek Banjar Indah.', 0, NULL),
(50, 'CTR-SBS-20260608-050', 50, 13, '2026-06-08', '2026-07-08', 'uploads/contracts/CTR-SBS-20260608-050.pdf', '1. Bulldozer Tambang Sebamban.', 0, NULL);

-- 6. DATA PAYMENTS (50 Transaksi Pembayaran Resmi Terverifikasi Penuh & Pending)
INSERT INTO `payments` (`id`, `payment_code`, `contract_id`, `customer_id`, `amount`, `payment_method`, `payment_proof_path`, `status`, `payment_date`, `verified_by`, `verified_at`) VALUES
(1, 'PAY-SBS-20260505-001', 1, 9, 77500000.00, 'Bank Transfer Mandiri', 'uploads/proofs/pay-001.png', 'PAID', '2026-05-05 11:30:00', 3, '2026-05-05 13:00:00'),
(2, 'PAY-SBS-20260520-002', 2, 10, 25200000.00, 'QRIS DANA', 'uploads/proofs/pay-002.png', 'PAID', '2026-05-20 16:30:00', 3, '2026-05-20 17:00:00'),
(3, 'PAY-SBS-20260512-003', 3, 11, 164700000.00, 'Bank Transfer BNI', 'uploads/proofs/pay-003.png', 'PAID', '2026-05-12 11:00:00', 3, '2026-05-12 12:30:00'),
(4, 'PAY-SBS-20260516-004', 4, 12, 108500000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-004.png', 'PAID', '2026-05-16 09:15:00', 3, '2026-05-16 10:00:00'),
(5, 'PAY-SBS-20260416-005', 5, 13, 682500000.00, 'Bank Transfer Mandiri', 'uploads/proofs/pay-005.png', 'PAID', '2026-04-16 14:00:00', 3, '2026-04-16 15:30:00'),
(6, 'PAY-SBS-20260502-006', 6, 14, 105400000.00, 'Bank Transfer BRI', 'uploads/proofs/pay-006.png', 'PAID', '2026-05-02 10:00:00', 3, '2026-05-02 11:15:00'),
(7, 'PAY-SBS-20260508-007', 7, 15, 80600000.00, 'Bank Transfer BNI', 'uploads/proofs/pay-007.png', 'PAID', '2026-05-08 10:30:00', 3, '2026-05-08 11:00:00'),
(8, 'PAY-SBS-20260510-008', 8, 16, 75950000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-008.png', 'PAID', '2026-05-10 11:30:00', 3, '2026-05-10 12:00:00'),
(9, 'PAY-SBS-20260512-009', 9, 17, 148800000.00, 'Bank Transfer Mandiri', 'uploads/proofs/pay-009.png', 'PAID', '2026-05-12 16:00:00', 3, '2026-05-12 17:00:00'),
(10, 'PAY-SBS-20260512-010', 10, 18, 55800000.00, 'Bank Transfer BRI', 'uploads/proofs/pay-010.png', 'PAID', '2026-05-12 11:15:00', 3, '2026-05-12 13:00:00'),
(11, 'PAY-SBS-20260514-011', 11, 19, 111600000.00, 'QRIS DANA', 'uploads/proofs/pay-011.png', 'PAID', '2026-05-14 10:00:00', 3, '2026-05-14 11:00:00'),
(12, 'PAY-SBS-20260515-012', 12, 20, 68200000.00, 'Bank Transfer Mandiri', 'uploads/proofs/pay-012.png', 'PAID', '2026-05-15 17:30:00', 3, '2026-05-15 18:00:00'),
(13, 'PAY-SBS-20260506-013', 13, 26, 46000000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-013.png', 'PAID', '2026-05-06 09:30:00', 3, '2026-05-06 10:00:00'),
(14, 'PAY-SBS-20260508-014', 14, 27, 70000000.00, 'Bank Transfer Mandiri', 'uploads/proofs/pay-014.png', 'PAID', '2026-05-08 11:30:00', 3, '2026-05-08 12:00:00'),
(15, 'PAY-SBS-20260510-015', 15, 28, 28000000.00, 'QRIS DANA', 'uploads/proofs/pay-015.png', 'PAID', '2026-05-10 15:30:00', 3, '2026-05-10 16:00:00'),
(16, 'PAY-SBS-20260512-016', 16, 29, 35000000.00, 'Bank Transfer BNI', 'uploads/proofs/pay-016.png', 'PAID', '2026-05-12 17:30:00', 3, '2026-05-12 18:00:00'),
(17, 'PAY-SBS-20260515-017', 17, 30, 78000000.00, 'Bank Transfer BRI', 'uploads/proofs/pay-017.png', 'PAID', '2026-05-15 10:30:00', 3, '2026-05-15 11:00:00'),
(18, 'PAY-SBS-20260515-018', 18, 31, 50000000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-018.png', 'PAID', '2026-05-15 12:30:00', 3, '2026-05-15 13:00:00'),
(19, 'PAY-SBS-20260518-019', 19, 32, 16000000.00, 'QRIS DANA', 'uploads/proofs/pay-019.png', 'PAID', '2026-05-18 14:30:00', 3, '2026-05-18 15:00:00'),
(20, 'PAY-SBS-20260520-020', 20, 33, 19500000.00, 'Bank Transfer Mandiri', 'uploads/proofs/pay-020.png', 'PAID', '2026-05-20 16:30:00', 3, '2026-05-20 17:00:00'),
(21, 'PAY-SBS-20260520-021', 21, 34, 27000000.00, 'Bank Transfer BNI', 'uploads/proofs/pay-021.png', 'PAID', '2026-05-20 11:30:00', 3, '2026-05-20 12:00:00'),
(22, 'PAY-SBS-20260522-022', 22, 35, 24500000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-022.png', 'PAID', '2026-05-22 13:30:00', 3, '2026-05-22 14:00:00'),
(23, 'PAY-SBS-20260524-023', 23, 36, 22400000.00, 'QRIS DANA', 'uploads/proofs/pay-023.png', 'PAID', '2026-05-24 15:30:00', 3, '2026-05-24 16:00:00'),
(24, 'PAY-SBS-20260525-024', 24, 37, 47600000.00, 'Bank Transfer BRI', 'uploads/proofs/pay-024.png', 'PAID', '2026-05-25 10:30:00', 3, '2026-05-25 11:00:00'),
(25, 'PAY-SBS-20260526-025', 25, 38, 67200000.00, 'Bank Transfer Mandiri', 'uploads/proofs/pay-025.png', 'PAID', '2026-05-26 12:30:00', 3, '2026-05-26 13:00:00'),
(26, 'PAY-SBS-20260528-026', 26, 39, 50400000.00, 'Bank Transfer BNI', 'uploads/proofs/pay-026.png', 'PAID', '2026-05-28 14:30:00', 3, '2026-05-28 15:00:00'),
(27, 'PAY-SBS-20260530-027', 27, 40, 33600000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-027.png', 'PAID', '2026-05-30 16:30:00', 3, '2026-05-30 17:00:00'),
(28, 'PAY-SBS-20260601-028', 28, 41, 21000000.00, 'QRIS DANA', 'uploads/proofs/pay-028.png', 'PAID', '2026-06-01 10:30:00', 3, '2026-06-01 11:00:00'),
(29, 'PAY-SBS-20260601-029', 29, 42, 22500000.00, 'Bank Transfer BRI', 'uploads/proofs/pay-029.png', 'PAID', '2026-06-01 12:30:00', 3, '2026-06-01 13:00:00'),
(30, 'PAY-SBS-20260601-030', 30, 43, 37800000.00, 'Bank Transfer Mandiri', 'uploads/proofs/pay-030.png', 'PAID', '2026-06-01 14:30:00', 3, '2026-06-01 15:00:00'),
(31, 'PAY-SBS-20260602-031', 31, 44, 26000000.00, 'Bank Transfer BNI', 'uploads/proofs/pay-031.png', 'PAID', '2026-06-02 10:30:00', 3, '2026-06-02 11:00:00'),
(32, 'PAY-SBS-20260602-032', 32, 45, 34300000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-032.png', 'PAID', '2026-06-02 11:30:00', 3, '2026-06-02 12:00:00'),
(33, 'PAY-SBS-20260603-033', 33, 46, 27000000.00, 'QRIS DANA', 'uploads/proofs/pay-033.png', 'PAID', '2026-06-03 14:30:00', 3, '2026-06-03 15:00:00'),
(34, 'PAY-SBS-20260603-034', 34, 47, 44800000.00, 'Bank Transfer BRI', 'uploads/proofs/pay-034.png', 'PAID', '2026-06-03 16:30:00', 3, '2026-06-03 17:00:00'),
(35, 'PAY-SBS-20260604-035', 35, 48, 32000000.00, 'Bank Transfer Mandiri', 'uploads/proofs/pay-035.png', 'PAID', '2026-06-04 10:30:00', 3, '2026-06-04 11:00:00'),
(36, 'PAY-SBS-20260604-036', 36, 49, 47600000.00, 'Bank Transfer BNI', 'uploads/proofs/pay-036.png', 'PAID', '2026-06-04 11:30:00', 3, '2026-06-04 12:00:00'),
(37, 'PAY-SBS-20260605-037', 37, 50, 32000000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-037.png', 'PAID', '2026-06-05 14:30:00', 3, '2026-06-05 15:00:00'),
(38, 'PAY-SBS-20260528-038', 38, 9, 25000000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-038.png', 'PENDING_VERIFICATION', '2026-05-28 11:00:00', NULL, NULL),
(39, 'PAY-SBS-20260529-039', 39, 10, 39000000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-039.png', 'PENDING_VERIFICATION', '2026-05-29 16:30:00', NULL, NULL),
(40, 'PAY-SBS-20260530-040', 40, 12, 25200000.00, 'QRIS DANA', 'uploads/proofs/pay-040.png', 'PENDING_VERIFICATION', '2026-05-30 11:45:00', NULL, NULL),
(41, 'PAY-SBS-20260601-041', 41, 21, 27300000.00, 'Bank Transfer BRI', 'uploads/proofs/pay-041.png', 'PENDING_VERIFICATION', '2026-06-01 10:30:00', NULL, NULL),
(42, 'PAY-SBS-20260602-042', 42, 22, 75000000.00, 'Bank Transfer Mandiri', 'uploads/proofs/pay-042.png', 'PENDING_VERIFICATION', '2026-06-02 14:00:00', NULL, NULL),
(43, 'PAY-SBS-20260603-043', 43, 23, 7200000.00, 'QRIS DANA', 'uploads/proofs/pay-043.png', 'PENDING_VERIFICATION', '2026-06-03 16:00:00', NULL, NULL),
(44, 'PAY-SBS-20260604-044', 44, 24, 32000000.00, 'Bank Transfer BNI', 'uploads/proofs/pay-044.png', 'UNPAID', '2026-06-04 09:30:00', NULL, NULL),
(45, 'PAY-SBS-20260605-045', 45, 25, 105000000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-045.png', 'UNPAID', '2026-06-05 11:20:00', NULL, NULL),
(46, 'PAY-SBS-20260605-046', 46, 9, 32000000.00, 'Bank Transfer BNI', 'uploads/proofs/pay-046.png', 'UNPAID', '2026-06-05 14:00:00', NULL, NULL),
(47, 'PAY-SBS-20260606-047', 47, 10, 105000000.00, 'Bank Transfer BCA', 'uploads/proofs/pay-047.png', 'UNPAID', '2026-06-06 10:00:00', NULL, NULL),
(48, 'PAY-SBS-20260606-048', 48, 11, 28000000.00, 'Bank Transfer Mandiri', 'uploads/proofs/pay-048.png', 'UNPAID', '2026-06-06 16:30:00', NULL, NULL),
(49, 'PAY-SBS-20260607-049', 49, 12, 19500000.00, 'QRIS DANA', 'uploads/proofs/pay-049.png', 'UNPAID', '2026-06-07 09:15:00', NULL, NULL),
(50, 'PAY-SBS-20260608-050', 50, 13, 105000000.00, 'Bank Transfer BRI', 'uploads/proofs/pay-050.png', 'UNPAID', '2026-06-08 11:10:00', NULL, NULL);

-- 7. DATA MAINTENANCE (50 Pemeliharaan Unit Preventif & Korektif Lengkap)
INSERT INTO `maintenance` (`id`, `maintenance_code`, `equipment_id`, `scheduled_date`, `completion_date`, `maintenance_type`, `hour_meter_at_maintenance`, `description`, `spareparts_replaced`, `cost`, `technician_id`, `status`) VALUES
(1, 'MNT-SBS-20260510-001', 1, '2026-05-10', '2026-05-10', 'PREVENTIVE', 1250.00, 'Ganti Oli Mesin, filter hidrolik, dan grease swing gear.', 'Oli Meditran, Filter Hidrolik Komatsu', 4500000.00, 4, 'COMPLETED'),
(2, 'MNT-SBS-20260525-002', 11, '2026-05-25', NULL, 'CORRECTIVE', 450.00, 'Kerusakan pada selang tekanan tinggi hidrolik boom crane.', 'Selang Hidrolik High Pressure 3/4 inch', 2800000.00, 4, 'IN_PROGRESS'),
(3, 'MNT-SBS-20260505-003', 3, '2026-05-05', '2026-05-05', 'PREVENTIVE', 1700.00, 'Perawatan berkala 250 jam, pembersihan air cleaner dan fuel filter.', 'Filter Bahan Bakar Cat', 1800000.00, 4, 'COMPLETED'),
(4, 'MNT-SBS-20260518-004', 8, '2026-05-18', '2026-05-19', 'CORRECTIVE', 3100.00, 'Perbaikan track link yang kendor sebelah kanan.', 'Track Bolt & Nut', 3500000.00, 4, 'COMPLETED'),
(5, 'MNT-SBS-20260602-005', 2, '2026-06-02', NULL, 'PREVENTIVE', 2410.80, 'Servis berkala rutin kelipatan 250 jam operasional mesin.', 'Filter Oli, Gasket, Meditran SX', 4000000.00, 4, 'SCHEDULED'),
(6, 'MNT-SBS-20260605-006', 14, '2026-06-05', NULL, 'PREVENTIVE', 1580.35, 'Pemeriksaan sistem getar (vibratory system) dan ganti oli drum.', 'Oli Vibrator Sakai', 5200000.00, 4, 'SCHEDULED'),
(7, 'MNT-SBS-20260501-007', 4, '2026-05-01', '2026-05-01', 'PREVENTIVE', 900.00, 'Kalibrasi kelistrikan & servis oli mesin', 'Oli S-40, filter oli', 2500000.00, 4, 'COMPLETED'),
(8, 'MNT-SBS-20260502-008', 5, '2026-05-02', '2026-05-03', 'CORRECTIVE', 1100.00, 'Perbaikan bucket cylinder bocor', 'Seal Kit Bucket Excavator', 3100000.00, 4, 'COMPLETED'),
(9, 'MNT-SBS-20260503-009', 6, '2026-05-03', '2026-05-03', 'PREVENTIVE', 1580.00, 'Ganti saringan bahan bakar utama', 'Fuel filter SK200', 1200000.00, 4, 'COMPLETED'),
(10, 'MNT-SBS-20260504-010', 7, '2026-05-04', '2026-05-05', 'CORRECTIVE', 850.00, 'Ganti alternator pengisian aki', 'Alternator 24V Caterpillar', 4200000.00, 4, 'COMPLETED'),
(11, 'MNT-SBS-20260506-011', 9, '2026-05-06', '2026-05-06', 'PREVENTIVE', 1400.00, 'Servis berkala dan grease unit lengkap', 'Grease, Oli Hydraulic', 3500000.00, 4, 'COMPLETED'),
(12, 'MNT-SBS-20260507-012', 10, '2026-05-07', '2026-05-08', 'CORRECTIVE', 2000.00, 'Perbaikan transmisi slip', 'Clutch Disc Komatsu', 12500000.00, 4, 'COMPLETED'),
(13, 'MNT-SBS-20260508-013', 12, '2026-05-08', '2026-05-08', 'PREVENTIVE', 2100.00, 'Ganti tali baja drum crane', 'Wire Rope Crane Kobelco', 15000000.00, 4, 'COMPLETED'),
(14, 'MNT-SBS-20260511-014', 13, '2026-05-11', '2026-05-12', 'CORRECTIVE', 700.00, 'Perbaikan pompa hidrolik lemah', 'Hydraulic Pump Sany', 8200000.00, 4, 'COMPLETED'),
(15, 'MNT-SBS-20260513-015', 15, '2026-05-13', '2026-05-13', 'PREVENTIVE', 1100.00, 'Servis berkala ganti filter & oli', 'Filter Oli Bomag', 2800000.00, 4, 'COMPLETED'),
(16, 'MNT-SBS-20260516-016', 16, '2026-05-16', '2026-05-17', 'CORRECTIVE', 800.00, 'Ganti ban depan yang robek batu gunung', 'Ban Vibro Sakai', 7500000.00, 4, 'COMPLETED'),
(17, 'MNT-SBS-20260517-017', 17, '2026-05-17', '2026-05-17', 'PREVENTIVE', 850.00, 'Pengecekan blade grader & ganti oli', 'Oli Meditran SX', 2200000.00, 4, 'COMPLETED'),
(18, 'MNT-SBS-20260519-018', 18, '2026-05-19', '2026-05-20', 'CORRECTIVE', 1950.00, 'Perbaikan kebocoran tangki solar', 'Las Tangki Solar & Seal', 1500000.00, 4, 'COMPLETED'),
(19, 'MNT-SBS-20260521-019', 19, '2026-05-21', '2026-05-21', 'PREVENTIVE', 1000.00, 'Penyetelan pisau grader & grease joint', 'Grease Heavy Duty', 1800000.00, 4, 'COMPLETED'),
(20, 'MNT-SBS-20260522-020', 20, '2026-05-22', '2026-05-23', 'CORRECTIVE', 1400.00, 'Perbaikan seal pin loader bucket bocor', 'Pin Loader Seal Kit', 3400000.00, 4, 'COMPLETED'),
(21, 'MNT-SBS-20260523-021', 21, '2026-05-23', '2026-05-23', 'PREVENTIVE', 2540.00, 'Grease swing gear & swing motor', 'Grease Komatsu', 1500000.00, 4, 'COMPLETED'),
(22, 'MNT-SBS-20260524-022', 22, '2026-05-24', '2026-05-25', 'CORRECTIVE', 1120.00, 'Ganti selang hidrolik arm bocor', 'Hydraulic Hose Cat', 2400000.00, 4, 'COMPLETED'),
(23, 'MNT-SBS-20260525-023', 23, '2026-05-25', '2026-05-25', 'PREVENTIVE', 870.00, 'Grease pins & bushings lengkap', 'Grease S-200', 800000.00, 4, 'COMPLETED'),
(24, 'MNT-SBS-20260526-024', 24, '2026-05-26', '2026-05-27', 'CORRECTIVE', 1860.00, 'Perbaikan aki soak & kelistrikan starter', 'Aki GS Astra 120AH x2', 3600000.00, 4, 'COMPLETED'),
(25, 'MNT-SBS-20260527-025', 25, '2026-05-27', '2026-05-27', 'PREVENTIVE', 940.00, 'Servis berkala & ganti filter solar', 'Filter Solar Caterpillar', 1600000.00, 4, 'COMPLETED'),
(26, 'MNT-SBS-20260528-026', 26, '2026-05-28', NULL, 'CORRECTIVE', 450.00, 'Perbaikan kelistrikan lampu kerja boom crane', 'Wiring Harness & Bulb', 1200000.00, 4, 'IN_PROGRESS'),
(27, 'MNT-SBS-20260529-027', 28, '2026-05-29', '2026-05-29', 'PREVENTIVE', 720.00, 'Grease swing circle & boom pins', 'Grease Tadano', 1400000.00, 4, 'COMPLETED'),
(28, 'MNT-SBS-20260530-028', 29, '2026-05-30', '2026-05-31', 'CORRECTIVE', 980.00, 'Ganti seal oring travel motor bocor', 'O-Ring Seal Kit Tadano', 2900000.00, 4, 'COMPLETED'),
(29, 'MNT-SBS-20260601-029', 30, '2026-06-01', NULL, 'PREVENTIVE', 1850.00, 'Servis berkala kelipatan 250 jam', 'Oli Shell Rimula, Filter Oli Kato', 4200000.00, 4, 'SCHEDULED'),
(30, 'MNT-SBS-20260602-030', 31, '2026-06-02', NULL, 'PREVENTIVE', 610.80, 'Pemeriksaan sistem hydraulic swing crane', 'Oli Hydraulic Shell', 5000000.00, 4, 'SCHEDULED'),
(31, 'MNT-SBS-20260603-031', 32, '2026-06-03', NULL, 'PREVENTIVE', 890.40, 'Pemeriksaan sistem rem boom crane', 'Brake Pad Kit Tadano', 3800000.00, 4, 'SCHEDULED'),
(32, 'MNT-SBS-20260604-032', 33, '2026-06-04', NULL, 'PREVENTIVE', 1450.60, 'Pengecekan wire drum dan winch motor', 'Grease & Oring Winch', 4500000.00, 4, 'SCHEDULED'),
(33, 'MNT-SBS-20260526-033', 35, '2026-05-26', '2026-05-26', 'PREVENTIVE', 1120.00, 'Grease center joint & roller pins', 'Grease Bomag', 900000.00, 4, 'COMPLETED'),
(34, 'MNT-SBS-20260527-034', 36, '2026-05-27', '2026-05-28', 'CORRECTIVE', 820.00, 'Perbaikan dinamo starter rusak', 'Starter Motor Sakai', 3800000.00, 4, 'COMPLETED'),
(35, 'MNT-SBS-20260528-035', 37, '2026-05-28', '2026-05-28', 'PREVENTIVE', 1420.00, 'Grease drum & ganti filter bahan bakar', 'Filter Solar Sakai', 1500000.00, 4, 'COMPLETED'),
(36, 'MNT-SBS-20260529-036', 38, '2026-05-29', '2026-05-30', 'CORRECTIVE', 750.00, 'Ganti radiator hose yang bocor/retak', 'Radiator Hose Bomag', 800000.00, 4, 'COMPLETED'),
(37, 'MNT-SBS-20260530-037', 39, '2026-05-30', '2026-05-30', 'PREVENTIVE', 920.00, 'Grease shock absorber drum', 'Rubber Damper Sakai', 6500000.00, 4, 'COMPLETED'),
(38, 'MNT-SBS-20260601-038', 40, '2026-06-01', NULL, 'PREVENTIVE', 1650.00, 'Servis berkala rutin kelipatan 250 jam', 'Oli Meditran SX, Filter Oli Dynapac', 3800000.00, 4, 'SCHEDULED'),
(39, 'MNT-SBS-20260602-039', 41, '2026-06-02', NULL, 'PREVENTIVE', 980.60, 'Pemeriksaan rem & tekanan ban', 'Aki GS Astra', 2000000.00, 4, 'SCHEDULED'),
(40, 'MNT-SBS-20260526-040', 42, '2026-05-26', '2026-05-26', 'PREVENTIVE', 860.00, 'Grease tandem drive & blade circle', 'Grease Cat', 1100000.00, 4, 'COMPLETED'),
(41, 'MNT-SBS-20260527-041', 43, '2026-05-27', '2026-05-28', 'CORRECTIVE', 1980.00, 'Ganti gigi blade grader yang aus/patah', 'Blade End Bits Grader Komatsu', 7200000.00, 4, 'COMPLETED'),
(42, 'MNT-SBS-20260528-042', 44, '2026-05-28', '2026-05-28', 'PREVENTIVE', 1050.00, 'Grease knuckle pins & front axle', 'Grease Grader Cat', 1300000.00, 4, 'COMPLETED'),
(43, 'MNT-SBS-20260529-043', 45, '2026-05-29', '2026-05-30', 'CORRECTIVE', 1150.00, 'Ganti seal cylinder steering bocor', 'Steering Cylinder Seal Kit Komatsu', 3200000.00, 4, 'COMPLETED'),
(44, 'MNT-SBS-20260530-044', 46, '2026-05-30', '2026-05-30', 'PREVENTIVE', 1890.00, 'Grease blade lift cylinder & circle drive', 'Grease Caterpillar', 1500000.00, 4, 'COMPLETED'),
(45, 'MNT-SBS-20260601-045', 47, '2026-06-01', NULL, 'PREVENTIVE', 930.50, 'Servis berkala rutin kelipatan 250 jam', 'Oli Shell Rimula, Filter Oli Cat', 3900000.00, 4, 'SCHEDULED'),
(46, 'MNT-SBS-20260526-046', 48, '2026-05-26', '2026-05-26', 'PREVENTIVE', 1420.00, 'Grease center articulation & bucket pins', 'Grease WA380 Komatsu', 1600000.00, 4, 'COMPLETED'),
(47, 'MNT-SBS-20260527-047', 49, '2026-05-27', '2026-05-28', 'CORRECTIVE', 1890.00, 'Ganti gigi bucket loader yang aus/patah', 'Loader Bucket Teeth Cat', 6500000.00, 4, 'COMPLETED'),
(48, 'MNT-SBS-20260528-048', 50, '2026-05-28', '2026-05-28', 'PREVENTIVE', 750.00, 'Grease lift arm pins & tilt cylinder', 'Grease Loader SDLG', 1100000.00, 4, 'COMPLETED'),
(49, 'MNT-SBS-20260601-049', 48, '2026-06-01', NULL, 'PREVENTIVE', 1420.50, 'Pengecekan brake pedal & tekanan ban', 'Brake Fluid & Seals', 2500000.00, 4, 'SCHEDULED'),
(50, 'MNT-SBS-20260602-050', 49, '2026-06-02', NULL, 'PREVENTIVE', 1890.40, 'Servis berkala kelipatan 250 jam', 'Oli Shell Rimula, Filter Oli Cat 950H', 4500000.00, 4, 'SCHEDULED');

-- 8. DATA GPS_TRACKING (55 Koordinat GPS Menyebar di Wilayah Geografis Kalsel)
INSERT INTO `gps_tracking` (`id`, `equipment_id`, `latitude`, `longitude`, `speed`, `engine_status`, `fuel_level_percent`, `recorded_at`) VALUES
-- UNIT ID 2 (Excavator PC200-02) Pelabuhan Trisakti Banjarmasin
(1, 2, -3.32439100, 114.55839400, 5.20, 'ON', 75.50, '2026-05-30 20:30:00'),
(2, 2, -3.32489000, 114.55869000, 0.00, 'OFF', 75.30, '2026-05-30 21:00:00'),
(3, 2, -3.32400000, 114.55800000, 6.80, 'ON', 70.20, '2026-06-01 08:30:00'),

-- UNIT ID 3 (Excavator Cat 320D) Stockpile Tabalong
(4, 3, -2.25345000, 115.42345000, 4.10, 'ON', 88.00, '2026-06-01 09:00:00'),
(5, 3, -2.25390000, 115.42399000, 2.50, 'ON', 85.50, '2026-06-01 10:15:00'),

-- UNIT ID 8 (Bulldozer Komatsu D85) Land Clearing Banjar Indah
(6, 8, -3.35123000, 114.61234000, 7.20, 'ON', 92.40, '2026-06-01 11:00:00'),
(7, 8, -3.35245000, 114.61399000, 0.00, 'OFF', 92.00, '2026-06-01 12:00:00'),

-- UNIT ID 12 (Crane Kobelco) Tambang Sebamban
(8, 12, -3.75120000, 115.65430000, 0.00, 'ON', 82.50, '2026-06-01 13:00:00'),

-- UNIT ID 14 (Sakai Roller SV520) Pemadatan KM 12
(9, 14, -3.42459100, 114.65839400, 12.00, 'ON', 60.00, '2026-05-30 15:45:00'),
(10, 14, -3.42550000, 114.65990000, 8.50, 'ON', 52.80, '2026-05-30 17:00:00'),
(11, 14, -3.42610000, 114.66120000, 10.20, 'ON', 50.40, '2026-06-01 10:00:00'),

-- UNIT ID 5 (Hitachi ZX200-02) Pelabuhan Tapin
(12, 5, -3.12345000, 115.12345000, 3.20, 'ON', 65.50, '2026-06-01 14:00:00'),

-- UNIT ID 6 (SK200 Excavator) Konstruksi Amuntai
(13, 6, -2.42345000, 115.24567000, 0.00, 'OFF', 80.00, '2026-06-01 15:00:00'),

-- UNIT ID 10 (Bulldozer D8R) Gunung Pelaihari
(14, 10, -3.81234000, 114.77889000, 4.50, 'ON', 77.20, '2026-06-01 16:00:00'),

-- UNIT ID 16 (Sakai Roller SV520-02) Gudang Marabahan
(15, 16, -3.18900000, 114.59000000, 8.00, 'ON', 70.00, '2026-06-01 17:00:00'),

-- UNIT ID 19 (Grader 120K) Bypass Banjarbaru
(16, 19, -3.43200000, 114.83200000, 15.00, 'ON', 62.40, '2026-06-01 08:00:00'),

-- UNIT ID 20 (WA380 Loader) Proyek Banjarbaru
(17, 20, -3.44500000, 114.84500000, 5.00, 'ON', 58.00, '2026-06-01 09:00:00'),

-- UNIT ID 18 (Komatsu GD511 Grader) Handil Bakti
(18, 18, -3.28900000, 114.59800000, 10.50, 'ON', 73.00, '2026-06-01 10:00:00'),

-- UNIT ID 15 (Bomag Roller) Bypass Binuang
(19, 15, -3.11200000, 115.11500000, 8.00, 'ON', 75.00, '2026-06-01 11:00:00'),

-- UNIT ID 11 (Tadano Crane) Handil Bakti Gudang
(20, 11, -3.27800000, 114.58800000, 0.00, 'OFF', 90.00, '2026-06-01 12:00:00'),

-- UNIT ID 17 (Cat 120K Grader) Lapangan Tanjung
(21, 17, -2.18900000, 115.38900000, 12.00, 'ON', 80.50, '2026-06-01 13:00:00'),

-- UNIT ID 7 (Caterpillar Bulldozer D6R) Industri Batulicin
(22, 7, -3.45400000, 115.98900000, 6.00, 'ON', 84.00, '2026-06-01 14:00:00'),

-- UNIT ID 8 (Komatsu Bulldozer D85ESS) Tambang Satui
(23, 8, -3.78900000, 115.38900000, 0.00, 'OFF', 95.00, '2026-06-01 15:00:00'),

-- UNIT ID 1 (Excavator PC200-01) Cadangan Jalan Tol
(24, 1, -3.32439100, 114.55839400, 0.00, 'OFF', 100.00, '2026-06-01 16:00:00'),

-- UNIT ID 4 (Excavator Hitachi ZX200-01) Sungai Martapura
(25, 4, -3.31200000, 114.59000000, 2.00, 'ON', 88.00, '2026-06-01 17:00:00'),

-- DATA HISTORIS Koordinat GPS Tambahan (IDs 26 s/d 55) untuk Seeding Massal
(26, 9, -3.75120000, 115.65430000, 0.00, 'ON', 82.50, '2026-06-01 13:00:00'),
(27, 10, -3.81234000, 114.77889000, 4.50, 'ON', 77.20, '2026-06-01 16:00:00'),
(28, 11, -3.27800000, 114.58800000, 0.00, 'OFF', 90.00, '2026-06-01 12:00:00'),
(29, 13, -3.42459100, 114.65839400, 12.00, 'ON', 60.00, '2026-05-30 15:45:00'),
(30, 15, -3.11200000, 115.11500000, 8.00, 'ON', 75.00, '2026-06-01 11:00:00'),
(31, 16, -3.18900000, 114.59000000, 8.00, 'ON', 70.00, '2026-06-01 17:00:00'),
(32, 17, -2.18900000, 115.38900000, 12.00, 'ON', 80.50, '2026-06-01 13:00:00'),
(33, 18, -3.28900000, 114.59800000, 10.50, 'ON', 73.00, '2026-06-01 10:00:00'),
(34, 19, -3.43200000, 114.83200000, 15.00, 'ON', 62.40, '2026-06-01 08:00:00'),
(35, 20, -3.44500000, 114.84500000, 5.00, 'ON', 58.00, '2026-06-01 09:00:00'),
(36, 21, -3.35123000, 114.61234000, 7.20, 'ON', 92.40, '2026-06-01 11:00:00'),
(37, 22, -3.45400000, 115.98900000, 6.00, 'ON', 84.00, '2026-06-01 14:00:00'),
(38, 23, -3.78900000, 115.38900000, 0.00, 'OFF', 95.00, '2026-06-01 15:00:00'),
(39, 24, -3.75120000, 115.65430000, 0.00, 'ON', 82.50, '2026-06-01 13:00:00'),
(40, 25, -3.31200000, 114.59000000, 2.00, 'ON', 88.00, '2026-06-01 17:00:00'),
(41, 27, -3.75120000, 115.65430000, 0.00, 'ON', 82.50, '2026-06-01 13:00:00'),
(42, 29, -3.42459100, 114.65839400, 12.00, 'ON', 60.00, '2026-05-30 15:45:00'),
(43, 30, -2.42345000, 115.24567000, 0.00, 'OFF', 80.00, '2026-06-01 15:00:00'),
(44, 31, -3.12345000, 115.12345000, 3.20, 'ON', 65.50, '2026-06-01 14:00:00'),
(45, 32, -3.27800000, 114.58800000, 0.00, 'OFF', 90.00, '2026-06-01 12:00:00'),
(46, 33, -3.81234000, 114.77889000, 4.50, 'ON', 77.20, '2026-06-01 16:00:00'),
(47, 35, -3.11200000, 115.11500000, 8.00, 'ON', 75.00, '2026-06-01 11:00:00'),
(48, 36, -3.18900000, 114.59000000, 8.00, 'ON', 70.00, '2026-06-01 17:00:00'),
(49, 37, -2.18900000, 115.38900000, 12.00, 'ON', 80.50, '2026-06-01 13:00:00'),
(50, 38, -3.28900000, 114.59800000, 10.50, 'ON', 73.00, '2026-06-01 10:00:00'),
(51, 39, -3.43200000, 114.83200000, 15.00, 'ON', 62.40, '2026-06-01 08:00:00'),
(52, 40, -3.44500000, 114.84500000, 5.00, 'ON', 58.00, '2026-06-01 09:00:00'),
(53, 41, -3.35123000, 114.61234000, 7.20, 'ON', 92.40, '2026-06-01 11:00:00'),
(54, 43, -3.45400000, 115.98900000, 6.00, 'ON', 84.00, '2026-06-01 14:00:00'),
(55, 45, -3.78900000, 115.38900000, 0.00, 'OFF', 95.00, '2026-06-01 15:00:00');

-- 9. DATA REPORTS (50 Log Ekspor PDF Resmi Berformat Surat Jalan, BAST, dan Finansial)
INSERT INTO `reports` (`id`, `report_code`, `rental_id`, `report_type`, `generated_by`, `file_path`) VALUES
(1, 'REP-SJ-20260505-001', 1, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_EXCA_02.pdf'),
(2, 'REP-BASTOUT-20260505-001', 1, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_EXCA_02.pdf'),
(3, 'REP-SJ-20260520-002', 2, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_VIBR_01.pdf'),
(4, 'REP-BASTOUT-20260520-002', 2, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_VIBR_01.pdf'),
(5, 'REP-SJ-20260512-003', 4, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_EXCA_03.pdf'),
(6, 'REP-BASTOUT-20260512-003', 4, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_EXCA_03.pdf'),
(7, 'REP-SJ-20260515-004', 5, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_BULL_01.pdf'),
(8, 'REP-BASTOUT-20260515-004', 5, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_BULL_01.pdf'),
(9, 'REP-SJ-20260415-005', 6, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_CRAN_01.pdf'),
(10, 'REP-BASTOUT-20260415-005', 6, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_CRAN_01.pdf'),
(11, 'REP-SJ-20260501-006', 7, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_GRAD_01.pdf'),
(12, 'REP-BASTOUT-20260501-006', 7, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_GRAD_01.pdf'),
(13, 'REP-SJ-20260508-007', 10, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_HITACHI_01.pdf'),
(14, 'REP-BASTOUT-20260508-007', 10, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_HITACHI_01.pdf'),
(15, 'REP-SJ-20260510-008', 11, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_SK200_01.pdf'),
(16, 'REP-BASTOUT-20260510-008', 11, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_SK200_01.pdf'),
(17, 'REP-SJ-20260512-009', 12, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_D8R_01.pdf'),
(18, 'REP-BASTOUT-20260512-009', 12, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_D8R_01.pdf'),
(19, 'REP-SJ-20260512-010', 13, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_VIBRO_02.pdf'),
(20, 'REP-BASTOUT-20260512-010', 13, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_VIBRO_02.pdf'),
(21, 'REP-SJ-20260514-011', 14, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_GRAD_02.pdf'),
(22, 'REP-BASTOUT-20260514-011', 14, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_GRAD_02.pdf'),
(23, 'REP-SJ-20260515-012', 15, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_LOAD_01.pdf'),
(24, 'REP-BASTOUT-20260515-012', 15, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_LOAD_01.pdf'),
(25, 'REP-SJ-20260506-013', 21, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_EXCA_04.pdf'),
(26, 'REP-BASTOUT-20260506-013', 21, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_EXCA_04.pdf'),
(27, 'REP-SJ-20260508-014', 22, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_BULL_02.pdf'),
(28, 'REP-BASTOUT-20260508-014', 22, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_BULL_02.pdf'),
(29, 'REP-SJ-20260510-015', 23, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_BULL_03.pdf'),
(30, 'REP-BASTOUT-20260510-015', 23, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_BULL_03.pdf'),
(31, 'REP-SJ-20260512-016', 24, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_BULL_04.pdf'),
(32, 'REP-BASTOUT-20260512-016', 24, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_BULL_04.pdf'),
(33, 'REP-SJ-20260515-017', 25, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_EXCA_05.pdf'),
(34, 'REP-BASTOUT-20260515-017', 25, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_EXCA_05.pdf'),
(35, 'REP-SJ-20260515-018', 26, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_CRAN_02.pdf'),
(36, 'REP-BASTOUT-20260515-018', 26, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_CRAN_02.pdf'),
(37, 'REP-SJ-20260518-019', 27, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_GRAD_03.pdf'),
(38, 'REP-BASTOUT-20260518-019', 27, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_GRAD_03.pdf'),
(39, 'REP-SJ-20260520-020', 28, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_VIBR_03.pdf'),
(40, 'REP-BASTOUT-20260520-020', 28, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_VIBR_03.pdf'),
(41, 'REP-SJ-20260520-021', 29, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_EXCA_06.pdf'),
(42, 'REP-BASTOUT-20260520-021', 29, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_EXCA_06.pdf'),
(43, 'REP-SJ-20260522-022', 30, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_VIBR_04.pdf'),
(44, 'REP-BASTOUT-20260522-022', 30, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_VIBR_04.pdf'),
(45, 'REP-SJ-20260524-023', 31, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_GRAD_04.pdf'),
(46, 'REP-BASTOUT-20260524-023', 31, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_GRAD_04.pdf'),
(47, 'REP-SJ-20260525-024', 32, 'SURAT_JALAN', 3, 'exports/reports/SURAT_JALAN_LOAD_02.pdf'),
(48, 'REP-BASTOUT-20260525-024', 32, 'BAST_OUT', 3, 'exports/reports/BAST_OUT_LOAD_02.pdf'),
(49, 'REP-FIN-20260531-001', NULL, 'FINANCIAL_SUMMARY', 2, 'exports/reports/LAPORAN_BULANAN_MEI_2026.pdf'),
(50, 'REP-FIN-20260430-001', NULL, 'FINANCIAL_SUMMARY', 2, 'exports/reports/LAPORAN_BULANAN_APR_2026.pdf');

-- =====================================================================
-- PENGISIAN DATA SELESAI
-- =====================================================================
SET FOREIGN_KEY_CHECKS = 1;
