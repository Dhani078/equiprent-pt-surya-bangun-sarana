<?php
/**
 * ============================================================================
 * CONTROLLER: AuthController — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 *
 * Menangani logika alur autentikasi pengguna, validasi input formulir login,
 * pencocokan kata sandi terenkripsi (Bcrypt), dan manajemen sesi multi-role.
 *
 * PERBAIKAN KEAMANAN:
 * 1. Akun tanpa hash kata sandi (`password` NULL/kosong) ditolak secara
 *    eksplisit — `password_verify()` dengan hash kosong memicu galat dan
 *    tidak boleh diandalkan sebagai penolakan.
 * 2. Percobaan login dibatasi (5 kali / 15 menit per sesi) untuk memperlambat
 *    serangan coba-coba kata sandi.
 * 3. Pesan galat dibuat seragam agar tidak membocorkan username yang valid.
 *
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * - Enkripsi Bcrypt: `password_verify` adalah standar industri.
 * - Proteksi Session Fixation: `session_regenerate_id(true)` setelah login.
 */

class AuthController {
    private $userModel;

    /** Batas percobaan login sebelum sesi diminta menunggu. */
    private const MAX_ATTEMPTS = 5;

    /** Panjang jendela pembatasan percobaan login (detik). */
    private const ATTEMPT_WINDOW = 900;

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
            // Pembatasan percobaan: memperlambat serangan kamus kata sandi.
            if ($this->isThrottled()) {
                $_SESSION['error'] = "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.";
                header("Location: index.php?page=login");
                exit;
            }

            // Sanitasi input form dasar untuk keamanan data
            $username = trim((string) filter_input(INPUT_POST, 'username', FILTER_DEFAULT));
            $password = (string) ($_POST['password'] ?? '');
            $selectedRole = trim((string) filter_input(INPUT_POST, 'role', FILTER_DEFAULT));

            // Validasi kelengkapan isian
            if ($username === '' || $password === '' || $selectedRole === '') {
                $_SESSION['error'] = "Silakan isi semua bidang formulir.";
                header("Location: index.php?page=login");
                exit;
            }

            // Mencari user di database menggunakan model
            $user = $this->userModel->getUserByUsernameAndRole($username, $selectedRole);

            // Hash yang tidak ada / kosong berarti akun belum boleh login.
            $hash = is_array($user) ? ($user['password'] ?? null) : null;
            $hashValid = is_string($hash) && $hash !== '';

            if ($user && $hashValid && password_verify($password, $hash)) {
                // Akun yang dinonaktifkan tidak boleh masuk meski sandinya benar.
                $status = strtoupper(trim((string) ($user['status'] ?? 'ACTIVE')));
                if ($status === 'SUSPENDED' || $status === 'INACTIVE') {
                    $_SESSION['error'] = "Akun Anda telah dinonaktifkan. Silakan hubungi administrator.";
                    header("Location: index.php?page=login");
                    exit;
                }

                // Mencegah Session Fixation dengan meregenerasi ID sesi baru
                session_regenerate_id(true);

                // Set session data untuk otentikasi stateful
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = $user['role_name'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['company'] = $user['company_name'];
                $_SESSION['rotated_at'] = time();
                $_SESSION['last_activity'] = time();

                // Hitungan percobaan direset setelah login yang sah.
                unset($_SESSION['login_attempts'], $_SESSION['login_attempt_at']);

                // Arahkan ke dashboard yang sesuai
                $this->redirectByRole($user['role_name']);
                exit;
            }

            // Jika otentikasi gagal, catat percobaan lalu kembali ke login.
            // Pesannya seragam agar tidak membocorkan username mana yang ada.
            $this->recordFailedAttempt();
            $_SESSION['error'] = "Username, kata sandi, atau peran yang Anda pilih salah.";
            header("Location: index.php?page=login");
            exit;
        }

        // Tampilkan view halaman login bawaan Stitch
        require_once 'views/login.php';
    }

    /** `true` bila sesi ini sudah melewati batas percobaan login. */
    private function isThrottled(): bool {
        $now = time();
        $pertama = (int) ($_SESSION['login_attempt_at'] ?? 0);

        if ($pertama === 0 || $now - $pertama > self::ATTEMPT_WINDOW) {
            // Jendela baru — hitungan lama tidak lagi relevan.
            unset($_SESSION['login_attempts'], $_SESSION['login_attempt_at']);
            return false;
        }

        return (int) ($_SESSION['login_attempts'] ?? 0) >= self::MAX_ATTEMPTS;
    }

    /** Mencatat satu percobaan login yang gagal. */
    private function recordFailedAttempt(): void {
        $now = time();
        $pertama = (int) ($_SESSION['login_attempt_at'] ?? 0);

        if ($pertama === 0 || $now - $pertama > self::ATTEMPT_WINDOW) {
            $_SESSION['login_attempt_at'] = $now;
            $_SESSION['login_attempts'] = 1;
            return;
        }

        $_SESSION['login_attempts'] = (int) ($_SESSION['login_attempts'] ?? 0) + 1;
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
        $role = strtoupper(trim((string) $role));
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
