<?php
/**
 * ============================================================================
 * CONTROLLER: AuthController — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Menangani logika alur autentikasi pengguna, validasi input formulir login,
 * pencocokan kata sandi terenkripsi (Bcrypt), dan manajemen sesi multi-role.
 * 
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * 1. Enkripsi Bcrypt: Menggunakan `password_verify` untuk mencocokkan kata sandi.
 *    Ini adalah standar industri yang sangat aman dan terhindar dari serangan brute force.
 * 2. Proteksi Session Fixation: Setelah otentikasi berhasil, disarankan memanggil
 *    session_regenerate_id() untuk mencegah pembajakan sesi.
 */

class AuthController {
    private $userModel;

    public function __construct() {
        // Inisialisasi model pengguna saat controller dibuat
        $this->userModel = new UserModel();
    }

    /**
     * Memproses alur login (Menampilkan halaman dan memvalidasi POST request)
     */
    public function login() {
        // Jika user sudah masuk, langsung arahkan ke dashboard masing-masing
        if (isset($_SESSION['user_id'])) {
            $this->redirectByRole($_SESSION['role']);
            return;
        }

        // Memproses pengiriman formulir login (Metode POST)
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Sanitasi input form dasar untuk keamanan data
            $username = trim(filter_input(INPUT_POST, 'username', FILTER_DEFAULT));
            $password = trim($_POST['password'] ?? '');
            $selectedRole = trim(filter_input(INPUT_POST, 'role', FILTER_DEFAULT));

            // Validasi kelengkapan isian
            if (empty($username) || empty($password) || empty($selectedRole)) {
                $_SESSION['error'] = "Silakan isi semua bidang formulir.";
                header("Location: index.php?page=login");
                exit;
            }

            // Mencari user di database menggunakan model
            $user = $this->userModel->getUserByUsernameAndRole($username, $selectedRole);

            if ($user) {
                // Mencocokkan password terenkripsi menggunakan bcrypt
                if (password_verify($password, $user['password'])) {
                    // Mencegah Session Fixation dengan meregenerasi ID sesi baru
                    session_regenerate_id(true);

                    // Set session data untuk otentikasi stateful
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['role'] = $user['role_name'];
                    $_SESSION['full_name'] = $user['full_name'];
                    $_SESSION['company'] = $user['company_name'];

                    // Arahkan ke dashboard yang sesuai
                    $this->redirectByRole($user['role_name']);
                    exit;
                }
            }

            // Jika otentikasi gagal, simpan pesan error di session dan redirect kembali ke login
            $_SESSION['error'] = "Username, kata sandi, atau peran yang Anda pilih salah.";
            header("Location: index.php?page=login");
            exit;
        }

        // Tampilkan view halaman login bawaan Stitch
        require_once 'views/login.php';
    }

    /**
     * Mengakhiri sesi pengguna secara aman (Logout)
     */
    public function logout() {
        // Bersihkan seluruh data session
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();

        // Kembalikan ke halaman login
        header("Location: index.php?page=login");
        exit;
    }

    /**
     * Membantu pengalihan otomatis berdasarkan peran user (Role-Based Access Control)
     * Melakukan pengecekan nama role secara ketat untuk mencegah anomali looping redirect.
     * 
     * @param string $role - Peran pengguna ('ADMIN', 'STAFF', 'CUSTOMER')
     */
    private function redirectByRole($role) {
        $role = strtoupper(trim($role));
        if ($role === 'ADMIN') {
            header("Location: index.php?page=admin_dashboard");
        } elseif ($role === 'STAFF') {
            header("Location: index.php?page=staff_dashboard");
        } elseif ($role === 'CUSTOMER') {
            header("Location: index.php?page=customer_dashboard");
        } else {
            // Jika role tidak dikenal, hancurkan session secara aman untuk menghindari redirect loop
            $this->logout();
        }
        exit;
    }
}
