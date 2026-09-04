<?php
/**
 * ============================================================================
 * MODEL: RentalModel — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Mengelola seluruh transaksi data persewaan alat berat (tabel `rentals`).
 * Terkoneksi secara aman via PDO untuk mengambil statistik agregasi bento,
 * daftar transaksi, update status, dan integrasi dengan tabel pendukung.
 * 
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * 1. Tanpa Data Dummy: Query menarik data riil dari skema database MySQL.
 * 2. Prepared Statements: Mencegah celah SQL Injection dengan parameter binding.
 */

class RentalModel {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Menghitung rangkuman statistik rental untuk panel bento atas
     * 
     * @return array
     */
    public function getRentalStats() {
        $stats = [
            'active' => 0,
            'due_today' => 0,
            'overdue' => 0
        ];

        try {
            // 1. Total Active: APPROVED atau ON_GOING
            $stmt = $this->db->query("SELECT COUNT(*) FROM `rentals` WHERE `status` IN ('APPROVED', 'ON_GOING')");
            $stats['active'] = $stmt->fetchColumn();

            // 2. Due Today: Berakhir HARI INI dan berstatus ON_GOING
            $stmt = $this->db->query("SELECT COUNT(*) FROM `rentals` WHERE `end_date` = CURRENT_DATE() AND `status` = 'ON_GOING'");
            $stats['due_today'] = $stmt->fetchColumn();

            // 3. Overdue Returns: Tanggal kembali terlampaui dan status masih ON_GOING
            $stmt = $this->db->query("SELECT COUNT(*) FROM `rentals` WHERE `end_date` < CURRENT_DATE() AND `status` = 'ON_GOING'");
            $stats['overdue'] = $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Gagal mengambil statistik rental: " . $e->getMessage());
        }

        return $stats;
    }

    /**
     * Mengambil daftar rental dengan filter pencarian, status, dan range tanggal
     * 
     * @param string $search - Kata kunci pencarian nama customer/perusahaan/kode rental/nama alat
     * @param string $status - Filter status spesifik
     * @param string $startDate - Filter tanggal awal sewa
     * @param string $endDate - Filter tanggal akhir sewa
     * @return array
     */
    public function getRentals($search = '', $status = '', $startDate = '', $endDate = '') {
        try {
            $query = "SELECT r.*, 
                             u.full_name AS customer_name, u.company_name AS customer_company,
                             e.name AS equipment_name, e.equipment_code, e.brand, e.thumbnail_url
                      FROM `rentals` r
                      JOIN `users` u ON r.customer_id = u.id
                      JOIN `equipments` e ON r.equipment_id = e.id
                      WHERE 1=1";
            
            $params = [];

            // Filter Pencarian
            if (!empty($search)) {
                $query .= " AND (r.rental_code LIKE :search1 
                                 OR u.full_name LIKE :search2 
                                 OR u.company_name LIKE :search3 
                                 OR e.name LIKE :search4 
                                 OR e.equipment_code LIKE :search5)";
                $params[':search1'] = "%{$search}%";
                $params[':search2'] = "%{$search}%";
                $params[':search3'] = "%{$search}%";
                $params[':search4'] = "%{$search}%";
                $params[':search5'] = "%{$search}%";
            }

            // Filter Status
            if (!empty($status) && $status !== 'ALL') {
                $query .= " AND r.status = :status";
                $params[':status'] = $status;
            }

            // Filter Tanggal Mulai
            if (!empty($startDate)) {
                $query .= " AND r.start_date >= :start_date";
                $params[':start_date'] = $startDate;
            }

            // Filter Tanggal Selesai
            if (!empty($endDate)) {
                $query .= " AND r.end_date <= :end_date";
                $params[':end_date'] = $endDate;
            }

            $query .= " ORDER BY r.booking_date DESC";
            
            $stmt = $this->db->prepare($query);
            foreach ($params as $key => &$val) {
                $stmt->bindParam($key, $val);
            }
            
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Gagal mengambil daftar rental: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil detail satu rental berdasarkan ID
     * 
     * @param int $id
     * @return array|null
     */
    public function getRentalById($id) {
        try {
            $query = "SELECT r.*, 
                             u.full_name AS customer_name, u.company_name AS customer_company, u.email AS customer_email, u.phone AS customer_phone,
                             e.name AS equipment_name, e.equipment_code, e.brand, e.model, e.rental_price_per_day, e.thumbnail_url
                      FROM `rentals` r
                      JOIN `users` u ON r.customer_id = u.id
                      JOIN `equipments` e ON r.equipment_id = e.id
                      WHERE r.id = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetch() ?: null;
        } catch (PDOException $e) {
            error_log("Gagal mengambil detail rental ID {$id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Menambahkan data transaksi sewa baru
     * 
     * @param array $data
     * @return bool
     */
    public function addRental($data) {
        try {
            $query = "INSERT INTO `rentals` 
                      (`rental_code`, `customer_id`, `equipment_id`, `start_date`, `end_date`, `total_days`, `subtotal`, `status`, `notes`) 
                      VALUES 
                      (:code, :customer_id, :equipment_id, :start_date, :end_date, :total_days, :subtotal, :status, :notes)";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':code', $data['rental_code'], PDO::PARAM_STR);
            $stmt->bindParam(':customer_id', $data['customer_id'], PDO::PARAM_INT);
            $stmt->bindParam(':equipment_id', $data['equipment_id'], PDO::PARAM_INT);
            $stmt->bindParam(':start_date', $data['start_date']);
            $stmt->bindParam(':end_date', $data['end_date']);
            $stmt->bindParam(':total_days', $data['total_days'], PDO::PARAM_INT);
            $stmt->bindParam(':subtotal', $data['subtotal']);
            $stmt->bindParam(':status', $data['status'], PDO::PARAM_STR);
            $stmt->bindParam(':notes', $data['notes'], PDO::PARAM_STR);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Gagal menambahkan rental baru: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Mengupdate status transaksi rental
     * 
     * @param int $id
     * @param string $status
     * @return bool
     */
    public function updateRentalStatus($id, $status) {
        try {
            $stmt = $this->db->prepare("UPDATE `rentals` SET `status` = :status WHERE `id` = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':status', $status, PDO::PARAM_STR);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Gagal mengupdate status rental ID {$id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Menghapus transaksi rental dari sistem
     * 
     * @param int $id
     * @return bool
     */
    public function deleteRental($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM `rentals` WHERE `id` = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Gagal menghapus rental ID {$id}: " . $e->getMessage());
            return false;
        }
    }
}
