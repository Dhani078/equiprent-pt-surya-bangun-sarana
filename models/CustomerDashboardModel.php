<?php
/**
 * ============================================================================
 * MODEL: CustomerDashboardModel — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Model ini bertanggung jawab atas penyediaan data ringkasan dashboard customer:
 * - Ringkasan aktif (rental berjalan, tagihan pending)
 * - Daftar rental aktif customer
 * - Riwayat pembayaran customer
 * - Info kontrak aktif customer
 * 
 * KEAMANAN: Seluruh query menggunakan PDO Prepared Statements 
 * dengan binding parameter customer_id untuk isolasi data per-user.
 */

class CustomerDashboardModel {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Mengambil ringkasan aktif dashboard customer
     * 
     * @param int $customerId - ID user customer yang sedang login
     * @return array - [active_rentals, pending_amount]
     */
    public function getSummary($customerId) {
        try {
            $summary = [];

            // 1. Jumlah Rental Berjalan (status ON_GOING atau APPROVED)
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM rentals WHERE customer_id = :cid AND status IN ('ON_GOING', 'APPROVED')");
            $stmt->execute([':cid' => $customerId]);
            $summary['active_rentals'] = $stmt->fetchColumn() ?: 0;

            // 2. Total Tagihan Pending (pembayaran UNPAID / PENDING_VERIFICATION)
            $stmt = $this->db->prepare("
                SELECT COALESCE(SUM(p.amount), 0) 
                FROM payments p 
                WHERE p.customer_id = :cid AND p.status IN ('UNPAID', 'PENDING_VERIFICATION')
            ");
            $stmt->execute([':cid' => $customerId]);
            $summary['pending_amount'] = $stmt->fetchColumn() ?: 0;

            return $summary;
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getSummary): " . $e->getMessage());
            return ['active_rentals' => 0, 'pending_amount' => 0];
        }
    }

    /**
     * Mengambil daftar rental aktif milik customer
     * 
     * @param int $customerId - ID user customer
     * @return array - Daftar rental aktif beserta detail alat
     */
    public function getActiveRentals($customerId) {
        try {
            $stmt = $this->db->prepare("
                SELECT r.*, e.name as equipment_name, e.equipment_code, e.type as equipment_type,
                       e.brand, e.model as equipment_model, e.thumbnail_url,
                       DATEDIFF(r.end_date, CURDATE()) as days_remaining,
                       DATEDIFF(r.end_date, r.start_date) as total_duration
                FROM rentals r
                JOIN equipments e ON r.equipment_id = e.id
                WHERE r.customer_id = :cid AND r.status IN ('ON_GOING', 'APPROVED', 'PENDING')
                ORDER BY r.start_date DESC
                LIMIT 3
            ");
            $stmt->execute([':cid' => $customerId]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getActiveRentals): " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil riwayat pembayaran milik customer
     * 
     * @param int $customerId - ID user customer
     * @return array - Daftar pembayaran customer
     */
    public function getPaymentHistory($customerId) {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, c.contract_code
                FROM payments p
                JOIN contracts c ON p.contract_id = c.id
                WHERE p.customer_id = :cid
                ORDER BY p.payment_date DESC
                LIMIT 5
            ");
            $stmt->execute([':cid' => $customerId]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getPaymentHistory): " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil kontrak aktif terbaru milik customer
     * 
     * @param int $customerId - ID user customer
     * @return array|false - Data kontrak terbaru atau false jika tidak ada
     */
    public function getLatestContract($customerId) {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, r.rental_code, e.name as equipment_name
                FROM contracts c
                JOIN rentals r ON c.rental_id = r.id
                JOIN equipments e ON r.equipment_id = e.id
                WHERE c.customer_id = :cid
                ORDER BY c.contract_date DESC
                LIMIT 1
            ");
            $stmt->execute([':cid' => $customerId]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getLatestContract): " . $e->getMessage());
            return false;
        }
    }

    /**
     * Mengambil statistik rental khusus customer ini
     * 
     * @param int $customerId
     * @return array
     */
    public function getRentalStats($customerId) {
        try {
            $stats = [];
            
            // Total Rental
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM rentals WHERE customer_id = :cid");
            $stmt->execute([':cid' => $customerId]);
            $stats['total'] = $stmt->fetchColumn() ?: 0;
            
            // Aktif & Berjalan
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM rentals WHERE customer_id = :cid AND status IN ('ON_GOING', 'APPROVED')");
            $stmt->execute([':cid' => $customerId]);
            $stats['active'] = $stmt->fetchColumn() ?: 0;
            
            // Selesai
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM rentals WHERE customer_id = :cid AND status = 'COMPLETED'");
            $stmt->execute([':cid' => $customerId]);
            $stats['completed'] = $stmt->fetchColumn() ?: 0;
            
            // Terlambat Kembali
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM rentals WHERE customer_id = :cid AND status = 'ON_GOING' AND end_date < CURDATE()");
            $stmt->execute([':cid' => $customerId]);
            $stats['overdue'] = $stmt->fetchColumn() ?: 0;
            
            return $stats;
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getRentalStats): " . $e->getMessage());
            return ['total' => 0, 'active' => 0, 'completed' => 0, 'overdue' => 0];
        }
    }

    /**
     * Mengambil semua rental aktif customer tanpa limit
     * 
     * @param int $customerId
     * @return array
     */
    public function getAllActiveRentals($customerId) {
        try {
            $stmt = $this->db->prepare("
                SELECT r.*, e.name as equipment_name, e.equipment_code, e.type as equipment_type,
                       e.brand, e.model as equipment_model, e.thumbnail_url,
                       DATEDIFF(r.end_date, CURDATE()) as days_remaining,
                       DATEDIFF(r.end_date, r.start_date) as total_duration
                FROM rentals r
                JOIN equipments e ON r.equipment_id = e.id
                WHERE r.customer_id = :cid AND r.status IN ('ON_GOING', 'APPROVED', 'PENDING')
                ORDER BY r.start_date DESC
            ");
            $stmt->execute([':cid' => $customerId]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getAllActiveRentals): " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil riwayat rental yang sudah selesai / batal
     * 
     * @param int $customerId
     * @return array
     */
    public function getCompletedRentals($customerId) {
        try {
            $stmt = $this->db->prepare("
                SELECT r.*, e.name as equipment_name, e.equipment_code, e.type as equipment_type,
                       e.brand, e.model as equipment_model, c.contract_code
                FROM rentals r
                JOIN equipments e ON r.equipment_id = e.id
                LEFT JOIN contracts c ON c.rental_id = r.id
                WHERE r.customer_id = :cid AND r.status IN ('COMPLETED', 'CANCELLED')
                ORDER BY r.end_date DESC
            ");
            $stmt->execute([':cid' => $customerId]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getCompletedRentals): " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil statistik pembayaran khusus customer ini
     * 
     * @param int $customerId
     * @return array
     */
    public function getPaymentStats($customerId) {
        try {
            $stats = [];

            // 1. Hutang Berjalan (status UNPAID)
            $stmt = $this->db->prepare("
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE customer_id = :cid AND status = 'UNPAID'
            ");
            $stmt->execute([':cid' => $customerId]);
            $stats['unpaid'] = $stmt->fetchColumn() ?: 0;

            // 2. Total Terbayar (Bulan Ini)
            $stmt = $this->db->prepare("
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE customer_id = :cid 
                  AND status = 'PAID' 
                  AND MONTH(payment_date) = MONTH(CURDATE()) 
                  AND YEAR(payment_date) = YEAR(CURDATE())
            ");
            $stmt->execute([':cid' => $customerId]);
            $stats['paid_month'] = $stmt->fetchColumn() ?: 0;

            // 3. Menunggu Verifikasi (status PENDING_VERIFICATION)
            $stmt = $this->db->prepare("
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE customer_id = :cid AND status = 'PENDING_VERIFICATION'
            ");
            $stmt->execute([':cid' => $customerId]);
            $stats['verification'] = $stmt->fetchColumn() ?: 0;

            return $stats;
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getPaymentStats): " . $e->getMessage());
            return ['unpaid' => 0, 'paid_month' => 0, 'verification' => 0];
        }
    }

    /**
     * Mengambil semua data pembayaran customer
     * 
     * @param int $customerId
     * @return array
     */
    public function getAllPayments($customerId) {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, c.contract_code
                FROM payments p
                LEFT JOIN contracts c ON p.contract_id = c.id
                WHERE p.customer_id = :cid
                ORDER BY p.payment_date DESC
            ");
            $stmt->execute([':cid' => $customerId]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getAllPayments): " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil statistik kontrak khusus customer ini
     * 
     * @param int $customerId
     * @return array
     */
    public function getContractStats($customerId) {
        try {
            $stats = [];

            // 1. Total Kontrak
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM contracts WHERE customer_id = :cid");
            $stmt->execute([':cid' => $customerId]);
            $stats['total'] = $stmt->fetchColumn() ?: 0;

            // 2. Kontrak Aktif (valid_until belum lewat DAN sudah ditandatangani)
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM contracts WHERE customer_id = :cid AND valid_until >= CURDATE() AND is_signed_customer = 1");
            $stmt->execute([':cid' => $customerId]);
            $stats['active'] = $stmt->fetchColumn() ?: 0;

            // 3. Akan Berakhir (dalam 30 hari ke depan)
            $stmt = $this->db->prepare("
                SELECT COUNT(*) 
                FROM contracts 
                WHERE customer_id = :cid 
                  AND is_signed_customer = 1 
                  AND valid_until <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
                  AND valid_until >= CURDATE()
            ");
            $stmt->execute([':cid' => $customerId]);
            $stats['expiring'] = $stmt->fetchColumn() ?: 0;

            // 4. Total Tertagih
            $stmt = $this->db->prepare("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE customer_id = :cid");
            $stmt->execute([':cid' => $customerId]);
            $stats['billed'] = $stmt->fetchColumn() ?: 0;

            return $stats;
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getContractStats): " . $e->getMessage());
            return ['total' => 0, 'active' => 0, 'expiring' => 0, 'billed' => 0];
        }
    }

    /**
     * Mengambil semua kontrak customer beserta nama alat dan rental code
     * 
     * @param int $customerId
     * @return array
     */
    public function getAllContracts($customerId) {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, r.rental_code, e.name as equipment_name
                FROM contracts c
                JOIN rentals r ON c.rental_id = r.id
                JOIN equipments e ON r.equipment_id = e.id
                WHERE c.customer_id = :cid
                ORDER BY c.contract_date DESC
            ");
            $stmt->execute([':cid' => $customerId]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getAllContracts): " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil detail profil lengkap pengguna dari database
     * 
     * @param int $userId
     * @return array|false
     */
    public function getUserProfile($userId) {
        try {
            $stmt = $this->db->prepare("
                SELECT u.*, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = :uid
            ");
            $stmt->execute([':uid' => $userId]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("CustomerDashboardModel Exception (getUserProfile): " . $e->getMessage());
            return false;
        }
    }
}
