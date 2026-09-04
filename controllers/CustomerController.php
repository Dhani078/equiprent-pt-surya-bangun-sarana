<?php
/**
 * ============================================================================
 * CONTROLLER: CustomerController — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Controller ini bertanggung jawab atas seluruh endpoint antarmuka pelanggan (Customer).
 * Setiap metode menerapkan proteksi akses ketat (hanya CUSTOMER yang diizinkan).
 */

class CustomerController {

    /**
     * Memproses pemanggilan Dashboard Customer
     */
    public function dashboard() {
        // 1. Proteksi Hak Akses
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'CUSTOMER') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('CUSTOMER', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya untuk Customer.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // 2. Inisialisasi model & ambil data
        $customerId = $_SESSION['user_id'];
        $model = new CustomerDashboardModel();

        $summary = $model->getSummary($customerId);
        $activeRentals = $model->getActiveRentals($customerId);
        $paymentHistory = $model->getPaymentHistory($customerId);
        $latestContract = $model->getLatestContract($customerId);

        // 3. Render view
        require_once 'views/customer/dashboard.php';
    }

    /**
     * Memproses halaman Rental Saya (Daftar persewaan alat berat customer)
     */
    public function rentals() {
        // 1. Proteksi Hak Akses
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'CUSTOMER') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('CUSTOMER', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya untuk Customer.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // 2. Ambil data rental customer
        $customerId = $_SESSION['user_id'];
        $model = new CustomerDashboardModel();

        $stats = $model->getRentalStats($customerId);
        $activeRentals = $model->getAllActiveRentals($customerId);
        $completedRentals = $model->getCompletedRentals($customerId);

        // 3. Render view
        require_once 'views/customer/rentals.php';
    }

    /**
     * Memproses halaman Pembayaran Saya (Invoice dan tagihan customer)
     */
    public function payments() {
        // 1. Proteksi Hak Akses
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'CUSTOMER') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('CUSTOMER', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya untuk Customer.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // 2. Ambil data finansial customer
        $customerId = $_SESSION['user_id'];
        $model = new CustomerDashboardModel();

        $stats = $model->getPaymentStats($customerId);
        $payments = $model->getAllPayments($customerId);

        // 3. Render view
        require_once 'views/customer/payments.php';
    }

    /**
     * Memproses halaman Kontrak Saya (Daftar Kontrak Legal Customer)
     */
    public function contracts() {
        // 1. Proteksi Hak Akses
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'CUSTOMER') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('CUSTOMER', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya untuk Customer.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // 2. Ambil data kontrak customer
        $customerId = $_SESSION['user_id'];
        $model = new CustomerDashboardModel();

        $stats = $model->getContractStats($customerId);
        $contracts = $model->getAllContracts($customerId);
        $latestContract = $model->getLatestContract($customerId);

        // 3. Render view
        require_once 'views/customer/contracts.php';
    }

    /**
     * Memproses halaman Profil Pelanggan
     */
    public function profile() {
        // 1. Proteksi Hak Akses
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'CUSTOMER') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('CUSTOMER', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya untuk Customer.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // 2. Ambil data profil customer
        $customerId = $_SESSION['user_id'];
        $model = new CustomerDashboardModel();

        $profile = $model->getUserProfile($customerId);
        
        // Dapatkan total sewa unit
        $rentalStats = $model->getRentalStats($customerId);
        $totalRentals = $rentalStats['total'] ?? 0;

        // 3. Render view
        require_once 'views/customer/profile.php';
    }
}
