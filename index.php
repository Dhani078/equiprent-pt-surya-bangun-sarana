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
 * 2. Autoloader: Memuat konfigurasi database, models, dan controllers utama secara berkala.
 * 3. Router: Membaca parameter URL `?page=` dan memicu handler controller yang sesuai.
 */

// 1. Inisialisasi session global di bagian teratas untuk memonitor status autentikasi aktor
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 2. Memuat komponen dasar arsitektur MVC (Model-View-Controller) secara terstruktur
require_once 'config/database.php';
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

// 5. Blok Router: Memetakan modul berdasarkan parameter URL
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
        // Memproses penandatanganan kontrak digital secara hukum riil
        if (!isset($_SESSION['user_id']) || strtoupper(trim($_SESSION['role'] ?? '')) !== 'CUSTOMER') {
            header("Location: index.php?page=login");
            exit;
        }
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if ($id) {
            $db = Database::getConnection();
            $stmt = $db->prepare("UPDATE contracts SET is_signed_customer = 1, signed_at = NOW() WHERE id = :id AND customer_id = :cust_id");
            $stmt->execute([':id' => $id, ':cust_id' => $_SESSION['user_id']]);
            $_SESSION['success'] = "Kontrak berhasil ditandatangani secara digital!";
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
        if (!isset($_SESSION['user_id']) || strtoupper(trim($_SESSION['role'] ?? '')) !== 'CUSTOMER') {
            header("Location: index.php?page=login");
            exit;
        }
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
                    $_SESSION['success'] = "Profil Anda berhasil diperbarui secara hukum.";
                } else {
                    $_SESSION['error'] = "Gagal memperbarui data profil ke basis data.";
                }
            }
        }
        header("Location: index.php?page=customer_profile");
        exit;

    case 'customer_change_password':
        // Memproses aksi ubah kata sandi customer
        if (!isset($_SESSION['user_id']) || strtoupper(trim($_SESSION['role'] ?? '')) !== 'CUSTOMER') {
            header("Location: index.php?page=login");
            exit;
        }
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $oldPassword = filter_input(INPUT_POST, 'old_password', FILTER_DEFAULT);
            $newPassword = filter_input(INPUT_POST, 'new_password', FILTER_DEFAULT);

            if (empty($oldPassword) || empty($newPassword)) {
                $_SESSION['error'] = "Seluruh bidang kata sandi wajib diisi.";
            } else {
                $db = Database::getConnection();
                $stmt = $db->prepare("SELECT password FROM users WHERE id = :id LIMIT 1");
                $stmt->execute([':id' => $_SESSION['user_id']]);
                $user = $stmt->fetch();

                if ($user && password_verify($oldPassword, $user['password'])) {
                    $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
                    $stmtUpdate = $db->prepare("UPDATE users SET password = :pw WHERE id = :id");
                    $stmtUpdate->execute([':pw' => $passwordHash, ':id' => $_SESSION['user_id']]);
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
 * Jika peran tidak cocok, menampilkan halaman Akses Ditolak daripada melempar kembali ke login (menghindari ERR_TOO_MANY_REDIRECTS).
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
        // Jika sudah login tapi perannya tidak sesuai, tampilkan halaman error penolakan (memutus loop redirect)
        renderAccessDenied($requiredRole, $currentRole);
        exit;
    }
}

/**
 * Menampilkan Halaman Error Penolakan Akses Premium (Access Denied / Forbidden)
 * Memutus siklus looping redirect tak terbatas antara routing index dan login controller.
 * 
 * @param string $requiredRole - Peran yang dibutuhkan oleh halaman
 * @param string $currentRole - Peran yang saat ini dimiliki oleh sesi user
 */
function renderAccessDenied($requiredRole, $currentRole) {
    ?>
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Akses Ditolak | EquipRent MS</title>
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@500&family=Material+Symbols+Outlined&display=swap" rel="stylesheet">
        <style>
            :root {
                --color-primary: #003366;
                --color-secondary: #475569;
                --color-error: #ba1a1a;
                --radius-eight: 8px;
            }
            body {
                font-family: 'Hanken Grotesk', sans-serif;
                background-color: #f7f9fb;
                margin: 0;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }
            .error-card {
                background: #ffffff;
                border: 1px solid #ffdad6;
                border-radius: var(--radius-eight);
                padding: 40px;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 10px 25px rgba(186, 26, 26, 0.05);
                text-align: center;
                animation: fadeInUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
            }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .error-icon {
                font-size: 48px;
                color: var(--color-error);
                margin-bottom: 20px;
            }
            h1 {
                color: #93000a;
                font-size: 22px;
                margin: 0 0 12px 0;
                font-weight: 700;
            }
            p {
                color: var(--color-secondary);
                font-size: 14px;
                line-height: 1.6;
                margin: 0 0 24px 0;
            }
            .details {
                background: #fff5f5;
                border: 1px solid #ffdad6;
                border-radius: var(--radius-eight);
                padding: 16px;
                text-align: left;
                margin-bottom: 24px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 13px;
            }
            .btn-group {
                display: flex;
                gap: 12px;
            }
            .btn {
                flex: 1;
                height: 40px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                border-radius: var(--radius-eight);
                font-weight: 600;
                font-size: 13px;
                text-decoration: none;
                transition: all 0.25s ease;
                cursor: pointer;
            }
            .btn-primary {
                background-color: var(--color-primary);
                color: #ffffff;
                border: none;
                box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15);
            }
            .btn-primary:hover {
                background-color: #001e40;
                transform: translateY(-1.5px);
            }
            .btn-secondary {
                background-color: #f1f5f9;
                color: var(--color-secondary);
                border: 1px solid #e2e8f0;
            }
            .btn-secondary:hover {
                background-color: #e2e8f0;
            }
        </style>
    </head>
    <body>
        <div class="error-card">
            <span class="material-symbols-outlined error-icon">gpp_maybe</span>
            <h1>Akses Terminal Ditolak</h1>
            <p>Sesi aktif Anda tidak memiliki wewenang untuk membuka halaman ini. Hal ini disebabkan oleh pembatasan keamanan berbasis peran (Role-Based Access Control).</p>
            
            <div class="details">
                <div>Akses Dibutuhkan: <span style="color:#ba1a1a; font-weight:700;"><?= $requiredRole ?></span></div>
                <div style="margin-top:6px;">Otoritas Sesi Anda: <span style="color:#003366; font-weight:700;"><?= $currentRole ?></span></div>
            </div>
            
            <div class="btn-group">
                <a href="index.php?page=<?= strtolower($currentRole) ?>_dashboard" class="btn btn-primary">Kembali ke Dashboard</a>
                <a href="index.php?page=logout" class="btn btn-secondary">Keluar Sesi</a>
            </div>
        </div>
    </body>
    </html>
    <?php
}

/**
 * Renders an Elegant Success Mockup Dashboard (Try-Catch / Success Layout)
 * Membuktikan keberhasilan login multi-role riil terhubung ke database.
 * 
 * @param string $roleName - Nama role aktor yang sedang aktif
 */
function renderDashboard($roleName) {
    $fullName = $_SESSION['full_name'] ?? 'Operator';
    $username = $_SESSION['username'] ?? 'User';
    $company = $_SESSION['company'] ?? 'PT. Surya Bangun Sarana';
    
    // Konfigurasi warna dinamis bertema industrial presisi premium
    ?>
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard <?= $roleName ?> | EquipRent MS</title>
        
        <!-- Google Fonts & Material Symbols -->
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@500&family=Material+Symbols+Outlined&display=swap" rel="stylesheet">
        
        <style>
            :root {
                --color-primary: #003366;       /* Industrial Deep Blue */
                --color-secondary: #475569;     /* Slate Gray */
                --radius-eight: 8px;            /* ROUND_EIGHT */
                --transition-premium: all 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            
            body {
                font-family: 'Hanken Grotesk', sans-serif;
                background-color: #f7f9fb;
                margin: 0;
                padding: 40px 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }
            
            .dashboard-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: var(--radius-eight);
                padding: 40px;
                max-width: 600px;
                width: 100%;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                text-align: center;
                animation: fadeInUp 0.45s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
            }
            
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .badge {
                display: inline-block;
                padding: 6px 16px;
                background-color: #d5e3ff;
                color: #001b3c;
                font-family: 'JetBrains Mono', monospace;
                font-size: 12px;
                font-weight: 600;
                border-radius: 9999px;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            h1 {
                color: var(--color-primary);
                font-size: 26px;
                margin: 0 0 8px 0;
                font-weight: 700;
            }
            
            p.subtitle {
                color: var(--color-secondary);
                font-size: 15px;
                margin: 0 0 30px 0;
                line-height: 1.5;
            }
            
            .info-box {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: var(--radius-eight);
                padding: 24px;
                text-align: left;
                margin-bottom: 30px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px dashed #e2e8f0;
            }
            
            .info-row:last-child {
                border-bottom: none;
                padding-bottom: 0;
            }
            
            .info-row:first-child {
                padding-top: 0;
            }
            
            .info-label {
                font-weight: 600;
                color: var(--color-secondary);
                font-size: 14px;
            }
            
            .info-val {
                font-family: 'JetBrains Mono', monospace;
                color: var(--color-primary);
                font-size: 14px;
                font-weight: 600;
            }
            
            .btn-group {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .tracking-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                height: 44px;
                background-color: var(--color-primary);
                color: #ffffff;
                border: none;
                border-radius: var(--radius-eight);
                font-weight: 600;
                font-size: 14px;
                text-decoration: none;
                transition: var(--transition-premium);
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15);
            }
            
            .tracking-btn:hover {
                background-color: #001e40;
                transform: translateY(-1.5px);
                box-shadow: 0 6px 16px rgba(0, 51, 102, 0.25);
            }
            
            .tracking-btn:active {
                transform: translateY(0.5px) scale(0.98);
                box-shadow: none;
            }
            
            .logout-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                height: 44px;
                background-color: #f1f5f9;
                color: var(--color-secondary);
                border: 1px solid #e2e8f0;
                border-radius: var(--radius-eight);
                font-weight: 600;
                font-size: 14px;
                text-decoration: none;
                transition: var(--transition-premium);
                cursor: pointer;
            }
            
            .logout-btn:hover {
                background-color: #e2e8f0;
                color: #EF4444;
            }
            
            .logout-btn:active {
                transform: translateY(0.5px) scale(0.98);
            }
        </style>
    </head>
    <body>
        <div class="dashboard-card">
            <!-- Badge Verifikasi Sesi Aktif -->
            <span class="badge"><?= $roleName ?> Access Verified</span>
            
            <h1>Otentikasi Berhasil!</h1>
            <p class="subtitle">Sesi Anda telah aman terdaftar di server database lokal XAMPP.</p>
            
            <!-- Box Detail Biodata User Skripsi -->
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Nama Lengkap:</span>
                    <span class="info-val"><?= htmlspecialchars($fullName) ?></span>
                </div>
                <div class="info-row">
                    <span class="info-label">ID Operator / Username:</span>
                    <span class="info-val">@<?= htmlspecialchars($username) ?></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Level Otoritas:</span>
                    <span class="info-val"><?= $roleName ?></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Perusahaan Afiliasi:</span>
                    <span class="info-val"><?= htmlspecialchars($company) ?></span>
                </div>
            </div>
            
            <!-- Grouping Action Buttons -->
            <div class="btn-group">
                <?php if ($roleName === 'ADMIN' || $roleName === 'STAFF'): ?>
                    <!-- Tombol Cepat Menuju Menu Tracking GPS -->
                    <a href="index.php?page=tracking" class="tracking-btn">
                        <span class="material-symbols-outlined" style="font-size:18px;">explore</span>
                        Buka Peta Tracking GPS Real-Time
                    </a>
                <?php endif; ?>
                
                <!-- Tombol Pemutusan Sesi (Logout) -->
                <a href="index.php?page=logout" class="logout-btn">
                    <span class="material-symbols-outlined" style="font-size:18px;">logout</span>
                    Keluar dari Terminal
                </a>
            </div>
        </div>
    </body>
    </html>
    <?php
}
