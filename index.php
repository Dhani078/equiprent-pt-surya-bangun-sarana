<?php
/**
 * ============================================================================
 * FRONT CONTROLLER: index.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 *
 * Berkas ini bertindak sebagai gerbang masuk utama (Single Entry Point) aplikasi.
 * Seluruh HTTP Request diarahkan ke berkas ini untuk dikelola alur routing-nya.
 *
 * DESAIN ARSITEKTUR MVC (MODEL-VIEW-CONTROLLER):
 * 1. Bootstrapping: Menginisialisasi session global untuk memonitor status login.
 * 2. Autoloader: Memuat konfigurasi database, models, dan controllers utama.
 * 3. Router: Membaca parameter URL `?page=` dan memicu handler controller.
 *
 * PERBAIKAN KEAMANAN:
 * - Sesi dimulai lewat `sbs_secure_session_start()` (cookie HttpOnly +
 *   SameSite + Secure, batas idle, rotasi ID sesi).
 * - Seluruh request POST wajib lolos pemeriksaan same-origin / token CSRF.
 * - Aksi yang MENGUBAH data (tanda tangan kontrak) tidak lagi bisa dipicu
 *   lewat GET, sehingga tidak dapat dipaksa oleh tautan/gambar pihak ketiga.
 * - Nilai yang berasal dari sesi selalu di-escape sebelum dicetak ke HTML.
 */

// 1. Bootstrap keamanan + sesi (harus sebelum output apa pun)
require_once 'config/security.php';
sbs_secure_session_start();
sbs_send_security_headers();
sbs_require_valid_post();

// 2. Memuat komponen dasar arsitektur MVC (Model-View-Controller) secara terstruktur
require_once 'config/database.php';
require_once 'views/system_pages.php';
require_once 'models/UserModel.php';
require_once 'models/GpsModel.php';
require_once 'models/DashboardModel.php';
require_once 'models/EquipmentModel.php';
require_once 'models/RentalModel.php';
require_once 'models/MaintenanceModel.php';
require_once 'models/ReportModel.php';
require_once 'models/CustomerDashboardModel.php';
require_once 'controllers/AuthController.php';
require_once 'controllers/TrackingController.php';
require_once 'controllers/AdminController.php';
require_once 'controllers/CustomerController.php';
require_once 'controllers/StaffController.php';

// 3. Membaca parameter routing URL, dengan fallback default ke halaman login ('login')
$page = filter_input(INPUT_GET, 'page', FILTER_DEFAULT) ?? 'login';

// 4. Inisialisasi Controller utama
$authController = new AuthController();

// ---------------------------------------------------------------------------
// 5. Gerbang otorisasi per kelompok halaman (dicek SEBELUM controller jalan)
//    Sebelumnya setiap controller diandalkan memeriksa perannya sendiri;
//    satu controller yang lupa memanggil checkAccess() berarti halaman
//    internal terbuka untuk pelanggan.
// ---------------------------------------------------------------------------
$halamanPublik = ['login', 'logout'];

$halamanAdminSaja = [
    'users', 'export_users_pdf', 'admin_settings',
];

$halamanInternal = [
    'tracking', 'admin_dashboard', 'equipment', 'rentals', 'maintenance',
    'contracts', 'reports', 'payments', 'print_report', 'print_contract',
    'export_rentals_pdf', 'export_rentals_excel', 'export_maintenance_pdf',
    'export_maintenance_csv', 'export_reports_excel', 'export_reports_pdf',
    'export_payments_csv', 'export_contracts_csv',
    'staff_dashboard', 'staff_settings',
];

$halamanPelanggan = [
    'customer_dashboard', 'customer_rentals', 'customer_payments',
    'customer_contracts', 'customer_sign_contract', 'customer_profile',
    'customer_update_profile', 'customer_change_password',
];

if (!in_array($page, $halamanPublik, true)) {
    if (!sbs_is_logged_in()) {
        $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
        header("Location: index.php?page=login");
        exit;
    }

    if (in_array($page, $halamanAdminSaja, true) && !sbs_has_any_role('ADMIN')) {
        renderAccessDenied('ADMIN', sbs_current_role());
        exit;
    }

    if (in_array($page, $halamanInternal, true) && !sbs_has_any_role('ADMIN', 'STAFF')) {
        renderAccessDenied('ADMIN / STAFF', sbs_current_role());
        exit;
    }

    if (in_array($page, $halamanPelanggan, true) && !sbs_has_any_role('CUSTOMER')) {
        renderAccessDenied('CUSTOMER', sbs_current_role());
        exit;
    }
}

// 6. Blok Router: Memetakan modul berdasarkan parameter URL
switch ($page) {
    case 'login':
        // Memproses penayangan login atau validasi submit data POST
        $authController->login();
        break;

    case 'logout':
        // Memproses pemutusan sesi pengguna secara aman dan terproteksi
        $authController->logout();
        break;

    case 'tracking':
        // Memproses halaman pelacakan GPS alat berat real-time (Leaflet.js)
        $trackingController = new TrackingController();
        $trackingController->index();
        break;

    case 'admin_dashboard':
        // Memproses halaman Dashboard Utama Admin riil terhubung basis data
        $adminController = new AdminController();
        $adminController->dashboard();
        break;

    case 'equipment':
        // Memproses halaman Manajemen Inventori Alat Berat
        $adminController = new AdminController();
        $adminController->equipment();
        break;

    case 'rentals':
        // Memproses halaman Manajemen Rental Orders
        $adminController = new AdminController();
        $adminController->rentals();
        break;

    case 'maintenance':
        // Memproses halaman Manajemen Pemeliharaan Alat Berat
        $adminController = new AdminController();
        $adminController->maintenance();
        break;

    case 'contracts':
        // Memproses halaman Manajemen Kontrak Digital (Staff & Admin)
        $adminController = new AdminController();
        $adminController->contracts();
        break;

    case 'users':
        // Memproses halaman Manajemen Pengguna
        $adminController = new AdminController();
        $adminController->users();
        break;

    case 'export_users_pdf':
        // Memproses cetak/ekspor PDF user management
        $adminController = new AdminController();
        $adminController->exportUsersPdf();
        break;

    case 'export_rentals_pdf':
        // Memproses cetak/ekspor PDF data rental orders
        $adminController = new AdminController();
        $adminController->exportRentalsPdf();
        break;

    case 'export_rentals_excel':
        // Memproses ekspor Excel data rental orders
        $adminController = new AdminController();
        $adminController->exportRentalsExcel();
        break;

    case 'export_maintenance_pdf':
        // Memproses cetak/ekspor PDF data pemeliharaan alat berat
        $adminController = new AdminController();
        $adminController->exportMaintenancePdf();
        break;

    case 'export_maintenance_csv':
        // Memproses ekspor CSV data pemeliharaan alat berat
        $adminController = new AdminController();
        $adminController->exportMaintenanceCsv();
        break;

    case 'export_reports_excel':
        // Memproses ekspor Excel data laporan operasional
        $adminController = new AdminController();
        $adminController->exportReportsExcel();
        break;

    case 'export_reports_pdf':
        // Memproses cetak/ekspor PDF laporan resmi operasional
        $adminController = new AdminController();
        $adminController->exportReportsPdf();
        break;

    case 'print_report':
        // Memproses pencetakan laporan resmi (BAST/Surat Jalan)
        $adminController = new AdminController();
        $adminController->printReport();
        break;

    case 'reports':
        // Memproses halaman Laporan & Dokumentasi
        $adminController = new AdminController();
        $adminController->reports();
        break;

    case 'payments':
        // Memproses halaman Manajemen Pembayaran Keuangan (Staff & Admin)
        $adminController = new AdminController();
        $adminController->payments();
        break;

    case 'export_payments_csv':
        // Memproses ekspor CSV data payments
        $adminController = new AdminController();
        $adminController->exportPaymentsCsv();
        break;

    case 'export_contracts_csv':
        // Memproses ekspor CSV data contracts
        $adminController = new AdminController();
        $adminController->exportContractsCsv();
        break;

    case 'print_contract':
        // Mencetak dokumen kontrak resmi dalam HTML siap cetak
        $adminController = new AdminController();
        $adminController->printContract();
        break;

    case 'admin_settings':
        // Memproses halaman Pengaturan Akun Admin
        $adminController = new AdminController();
        $adminController->settings();
        break;

    case 'staff_dashboard':
        // Memproses halaman Dashboard Staf riil terhubung basis data
        $staffController = new StaffController();
        $staffController->dashboard();
        break;

    case 'staff_settings':
        // Memproses halaman Pengaturan Akun Staf
        $staffController = new StaffController();
        $staffController->settings();
        break;

    case 'customer_dashboard':
        // Memproses halaman Dashboard Customer riil terhubung basis data
        $customerController = new CustomerController();
        $customerController->dashboard();
        break;

    case 'customer_rentals':
        // Memproses halaman Rental Saya milik Customer
        $customerController = new CustomerController();
        $customerController->rentals();
        break;

    case 'customer_payments':
        // Memproses halaman Pembayaran Saya milik Customer
        $customerController = new CustomerController();
        $customerController->payments();
        break;

    case 'customer_contracts':
        // Memproses halaman Kontrak Saya milik Customer
        $customerController = new CustomerController();
        $customerController->contracts();
        break;

    case 'customer_sign_contract':
        // Memproses penandatanganan kontrak digital secara hukum riil.
        //
        // WAJIB POST: tanda tangan adalah tindakan hukum yang mengubah data.
        // Selama masih bisa dipicu lewat GET, cukup memuat sebuah <img> dari
        // situs lain untuk membuat pelanggan menandatangani kontrak tanpa sadar.
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            $_SESSION['error'] = "Penandatanganan kontrak harus dikirim melalui formulir resmi.";
            header("Location: index.php?page=customer_contracts");
            exit;
        }

        $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT)
            ?: filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

        if (!$id) {
            $_SESSION['error'] = "Kontrak yang dimaksud tidak valid.";
            header("Location: index.php?page=customer_contracts");
            exit;
        }

        $db = Database::getConnection();

        // Nama penandatangan diambil dari sesi — bukan dari input — agar
        // identitas pada dokumen tidak dapat dipalsukan.
        $namaPenandatangan = (string) ($_SESSION['full_name'] ?? $_SESSION['username'] ?? '');

        // `is_signed_customer = 0` pada klausa WHERE mencegah tanda tangan
        // menimpa bukti waktu penandatanganan yang sudah ada.
        $stmt = $db->prepare(
            "UPDATE contracts
                SET is_signed_customer = 1,
                    signed_at = NOW(),
                    signer_name = :signer
              WHERE id = :id
                AND customer_id = :cust_id
                AND (is_signed_customer = 0 OR is_signed_customer IS NULL)"
        );
        $stmt->execute([
            ':signer'  => $namaPenandatangan,
            ':id'      => $id,
            ':cust_id' => $_SESSION['user_id'],
        ]);

        if ($stmt->rowCount() > 0) {
            $_SESSION['success'] = "Kontrak berhasil ditandatangani secara digital!";
        } else {
            // Bukan milik pelanggan ini, tidak ada, atau sudah ditandatangani.
            // Pesannya disamakan agar keberadaan kontrak orang lain tidak bocor.
            $_SESSION['error'] = "Kontrak tidak dapat ditandatangani. Kemungkinan kontrak sudah ditandatangani sebelumnya.";
        }

        header("Location: index.php?page=customer_contracts");
        exit;

    case 'customer_profile':
        // Memproses halaman Profil Pelanggan
        $customerController = new CustomerController();
        $customerController->profile();
        break;

    case 'customer_update_profile':
        // Memproses aksi edit profil customer
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $fullName = filter_input(INPUT_POST, 'full_name', FILTER_DEFAULT);
            $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
            $phone = filter_input(INPUT_POST, 'phone', FILTER_DEFAULT);
            $companyName = filter_input(INPUT_POST, 'company_name', FILTER_DEFAULT);
            $address = filter_input(INPUT_POST, 'address', FILTER_DEFAULT);

            if (empty($fullName) || !$email) {
                $_SESSION['error'] = "Nama dan alamat email wajib diisi dengan format yang benar.";
            } else {
                $db = Database::getConnection();
                $stmt = $db->prepare("UPDATE users SET full_name = :fn, email = :em, phone = :ph, company_name = :cn, address = :addr WHERE id = :id");
                $success = $stmt->execute([
                    ':fn' => $fullName,
                    ':em' => $email,
                    ':ph' => $phone,
                    ':cn' => $companyName,
                    ':addr' => $address,
                    ':id' => $_SESSION['user_id']
                ]);

                if ($success) {
                    $_SESSION['full_name'] = $fullName;
                    $_SESSION['success'] = "Profil Anda berhasil diperbarui.";
                } else {
                    $_SESSION['error'] = "Gagal memperbarui data profil ke basis data.";
                }
            }
        }
        header("Location: index.php?page=customer_profile");
        exit;

    case 'customer_change_password':
        // Memproses aksi ubah kata sandi customer
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $oldPassword = (string) ($_POST['old_password'] ?? '');
            $newPassword = (string) ($_POST['new_password'] ?? '');

            if ($oldPassword === '' || $newPassword === '') {
                $_SESSION['error'] = "Seluruh bidang kata sandi wajib diisi.";
            } elseif (strlen($newPassword) < 8) {
                // Kata sandi pendek adalah penyebab utama pembajakan akun.
                $_SESSION['error'] = "Kata sandi baru minimal 8 karakter.";
            } elseif ($newPassword === $oldPassword) {
                $_SESSION['error'] = "Kata sandi baru harus berbeda dari kata sandi lama.";
            } else {
                $db = Database::getConnection();
                $stmt = $db->prepare("SELECT password FROM users WHERE id = :id LIMIT 1");
                $stmt->execute([':id' => $_SESSION['user_id']]);
                $user = $stmt->fetch();

                // `password` boleh NULL untuk akun yang belum ditetapkan
                // sandinya — password_verify() dengan hash NULL memicu galat
                // dan pada PHP lama bisa menghasilkan perbandingan longgar.
                $hashTersimpan = is_array($user) ? ($user['password'] ?? null) : null;

                if (is_string($hashTersimpan) && $hashTersimpan !== '' && password_verify($oldPassword, $hashTersimpan)) {
                    $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
                    $stmtUpdate = $db->prepare("UPDATE users SET password = :pw WHERE id = :id");
                    $stmtUpdate->execute([':pw' => $passwordHash, ':id' => $_SESSION['user_id']]);

                    // Ganti sandi = rotasi sesi, agar sesi lama yang mungkin
                    // sudah dicuri tidak lagi berlaku.
                    session_regenerate_id(true);
                    $_SESSION['rotated_at'] = time();

                    $_SESSION['success'] = "Kata sandi login Anda berhasil diperbarui secara aman!";
                } else {
                    $_SESSION['error'] = "Kata sandi saat ini yang Anda masukkan salah.";
                }
            }
        }
        header("Location: index.php?page=customer_profile");
        exit;

    default:
        // Jika halaman tidak terdaftar, usir kembali ke gerbang login secara otomatis
        header("Location: index.php?page=login");
        exit;
}

/**
 * Fungsi Proteksi Akses (Role-Based Access Control - RBAC)
 * Memvalidasi apakah sesi aktif pengguna cocok dengan akses peran yang dituju.
 * Jika peran tidak cocok, menampilkan halaman Akses Ditolak daripada melempar
 * kembali ke login (menghindari ERR_TOO_MANY_REDIRECTS).
 *
 * @param string $requiredRole - Peran wajib yang diizinkan ('ADMIN', 'STAFF', 'CUSTOMER')
 */
function checkAccess($requiredRole) {
    if (!isset($_SESSION['user_id'])) {
        // Jika belum login sama sekali, usir ke gerbang login secara aman
        $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
        header("Location: index.php?page=login");
        exit;
    }

    // Konversi pembanding ke format uppercase untuk mencegah inkonsistensi huruf
    $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
    $requiredRole = strtoupper(trim($requiredRole));

    if ($currentRole !== $requiredRole) {
        // Jika sudah login tapi perannya tidak sesuai, tampilkan halaman error
        // penolakan (memutus loop redirect)
        renderAccessDenied($requiredRole, $currentRole);
        exit;
    }
}

/**
 * Varian `checkAccess` untuk halaman yang boleh diakses lebih dari satu peran.
 * Tanpa ini, halaman yang dipakai bersama Admin & Staf harus memilih salah
 * satu peran saja — dan biasanya akhirnya tidak diperiksa sama sekali.
 *
 * @param string ...$roles - Daftar peran yang diizinkan
 */
function checkAccessAny(string ...$roles) {
    if (!isset($_SESSION['user_id'])) {
        $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
        header("Location: index.php?page=login");
        exit;
    }

    if (!sbs_has_any_role(...$roles)) {
        renderAccessDenied(implode(' / ', array_map('strtoupper', $roles)), sbs_current_role());
        exit;
    }
}
