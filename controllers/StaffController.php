<?php
/**
 * ============================================================================
 * CONTROLLER: StaffController — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Mengendalikan alur request penayangan dashboard Staf operasional utama.
 * Memastikan proteksi hak akses berbasis peran (STAFF) secara ketat, serta
 * menyuplai data metrik finansial-operasional riil ke layar View.
 */

class StaffController {
    private $dashboardModel;
    private $userModel;

    public function __construct() {
        // Inisialisasi model statistik dashboard dan user
        $this->dashboardModel = new DashboardModel();
        $this->userModel = new UserModel();
    }

    /**
     * Memproses pemanggilan antarmuka Dashboard Staf utama
     */
    public function dashboard() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'STAFF') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('STAFF', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya diizinkan untuk Staf Operasional.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // 2. Ekstraksi metrik statistik, daftar transaksi terbaru, dan agenda pemeliharaan kritis
        $stats = $this->dashboardModel->getAdminStats();
        $recentRentals = $this->dashboardModel->getRecentRentals();
        $urgentMaintenance = $this->dashboardModel->getUrgentMaintenance();
        $monthlyRentalTrend = $this->dashboardModel->getMonthlyRentalTrend();

        // 3. Merender berkas visualisasi dashboard utama Staf
        require_once 'views/staff/dashboard.php';
    }

    /**
     * Memproses pemanggilan antarmuka Pengaturan Akun Staf
     */
    public function settings() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'STAFF') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('STAFF', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya diizinkan untuk Staf Operasional.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        $userId = $_SESSION['user_id'];

        // 2. Memproses request POST jika tombol simpan diklik
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $fullName = filter_input(INPUT_POST, 'full_name', FILTER_DEFAULT);
            $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
            $phone = filter_input(INPUT_POST, 'phone', FILTER_DEFAULT);
            $address = filter_input(INPUT_POST, 'address', FILTER_DEFAULT);
            $newPassword = filter_input(INPUT_POST, 'new_password', FILTER_DEFAULT);

            if (empty($fullName) || !$email) {
                $_SESSION['error'] = "Mohon lengkapi nama dan format email yang valid.";
            } else {
                $passwordHash = null;
                if (!empty($newPassword)) {
                    $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
                }

                $success = $this->userModel->updateProfile($userId, $fullName, $email, $phone, $address, $passwordHash);
                if ($success) {
                    $_SESSION['full_name'] = $fullName; // Perbarui session global
                    $_SESSION['success'] = "Pengaturan profil berhasil diperbarui secara aman.";
                } else {
                    $_SESSION['error'] = "Gagal memperbarui pengaturan profil ke database.";
                }
            }
            header("Location: index.php?page=staff_settings");
            exit;
        }

        // 3. Mengambil data user staff dari database
        $user = $this->userModel->getUserById($userId);
        if (!$user) {
            $_SESSION['error'] = "Data pengguna tidak ditemukan.";
            header("Location: index.php?page=staff_dashboard");
            exit;
        }

        $fullName = $user['full_name'];
        $role = $user['role_name'];

        // 4. Merender antarmuka Pengaturan Staf
        require_once 'views/staff/settings.php';
    }
}
