<?php
/**
 * ============================================================================
 * MODEL: DashboardModel — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Model ini bertanggung jawab atas akumulasi data statistik agregat finansial,
 * riwayat aktivitas transaksi penyewaan terbaru, serta log penjadwalan
 * perawatan mekanis kritis untuk disajikan pada Dashboard Utama Administrator.
 * 
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * 1. Agregasi Relasional: Menggunakan JOIN dinamis antara tabel rentals, 
 *    equipments, users, dan maintenance (Zero-Dummy).
 * 2. Keamanan Kueri: Menerapkan mekanisme PDO prepare statement untuk
 *    menangkal celah injeksi SQL (SQL Injection).
 */

class DashboardModel {
    private $db;

    public function __construct() {
        // Mengambil koneksi PDO terpusat dari class Database
        $this->db = Database::getConnection();
    }

    /**
     * Mengambil metrik data operasional dan finansial terpusat untuk Dashboard
     * 
     * @return array - Array asosiatif ringkasan metrik statistik
     */
    public function getAdminStats() {
        try {
            // 1. Hitung Total Pendapatan Lunas (PAID) dari tabel payments
            $sqlRevenue = "SELECT SUM(amount) AS total_revenue FROM payments WHERE status = 'PAID'";
            $stmtRev = $this->db->prepare($sqlRevenue);
            $stmtRev->execute();
            $revRow = $stmtRev->fetch();
            $totalRevenue = $revRow['total_revenue'] ?? 0;

            // 2. Hitung jumlah Alat Berat total
            $sqlTotalEquip = "SELECT COUNT(*) AS total_equipments FROM equipments";
            $stmtTE = $this->db->prepare($sqlTotalEquip);
            $stmtTE->execute();
            $teRow = $stmtTE->fetch();
            $totalEquipments = $teRow['total_equipments'] ?? 0;

            // 3. Hitung jumlah pelanggan (role_id = 3)
            $sqlCustomers = "SELECT COUNT(*) AS total_customers FROM users WHERE role_id = 3";
            $stmtC = $this->db->prepare($sqlCustomers);
            $stmtC->execute();
            $cRow = $stmtC->fetch();
            $totalCustomers = $cRow['total_customers'] ?? 0;

            // 4. Hitung jumlah rental total
            $sqlRentals = "SELECT COUNT(*) AS total_rentals FROM rentals";
            $stmtR = $this->db->prepare($sqlRentals);
            $stmtR->execute();
            $rRow = $stmtR->fetch();
            $totalRentals = $rRow['total_rentals'] ?? 0;

            // 5. Hitung status operasional alat berat
            $sqlEquips = "SELECT 
                            SUM(CASE WHEN status = 'RENTED' THEN 1 ELSE 0 END) AS count_rented,
                            SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS count_available,
                            SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) AS count_maintenance
                          FROM equipments";
            $stmtEqu = $this->db->prepare($sqlEquips);
            $stmtEqu->execute();
            $equipRow = $stmtEqu->fetch();

            return [
                'total_revenue'     => $totalRevenue,
                'total_equipments'  => $totalEquipments,
                'total_customers'   => $totalCustomers,
                'total_rentals'     => $totalRentals,
                'count_rented'      => $equipRow['count_rented'] ?? 0,
                'count_available'   => $equipRow['count_available'] ?? 0,
                'count_maintenance' => $equipRow['count_maintenance'] ?? 0
            ];
        } catch (PDOException $e) {
            error_log("DashboardModel Stats Exception: " . $e->getMessage());
            return [
                'total_revenue'     => 0,
                'total_equipments'  => 0,
                'total_customers'   => 0,
                'total_rentals'     => 0,
                'count_rented'      => 0,
                'count_available'   => 0,
                'count_maintenance' => 0
            ];
        }
    }

    /**
     * Mengambil 5 transaksi penyewaan terbaru dengan format kolom presisi Stitch
     * 
     * @return array - Array berisi 5 data transaksi terbaru
     */
    public function getRecentRentals() {
        try {
            $sql = "SELECT 
                        r.rental_code AS order_id,
                        c.full_name AS customer,
                        eq.name AS equipment,
                        r.status AS status,
                        r.subtotal AS amount
                    FROM rentals r
                    INNER JOIN equipments eq ON r.equipment_id = eq.id
                    INNER JOIN users c ON r.customer_id = c.id
                    ORDER BY r.booking_date DESC, r.id DESC
                    LIMIT 5";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("DashboardModel Recent Rentals Exception: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil unit yang membutuhkan perawatan kritis/segera (SCHEDULED atau IN_PROGRESS)
     * 
     * @return array - Array berisi maksimal 3 agenda perawatan terdekat
     */
    public function getUrgentMaintenance() {
        try {
            $sql = "SELECT 
                        m.maintenance_code,
                        m.scheduled_date,
                        m.maintenance_type,
                        m.description,
                        m.status AS maintenance_status,
                        eq.name AS equipment_name,
                        eq.equipment_code
                    FROM maintenance m
                    INNER JOIN equipments eq ON m.equipment_id = eq.id
                    WHERE m.status IN ('SCHEDULED', 'IN_PROGRESS')
                    ORDER BY m.scheduled_date ASC
                    LIMIT 3";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("DashboardModel Urgent Maintenance Exception: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil tren jumlah penyewaan per bulan untuk tahun berjalan
     * Digunakan oleh Chart.js pada Admin Dashboard (Line Chart Real-Time)
     * 
     * @return array - Array asosiatif ['labels' => [...], 'data' => [...]]
     */
    public function getMonthlyRentalTrend() {
        try {
            $currentYear = date('Y');
            $labels = [];
            $data = [];
            $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // Query jumlah rental per bulan dari tabel rentals berdasarkan booking_date
            $sql = "SELECT MONTH(booking_date) AS bulan, COUNT(*) AS jumlah
                    FROM rentals
                    WHERE YEAR(booking_date) = :tahun
                    GROUP BY MONTH(booking_date)
                    ORDER BY bulan ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':tahun' => $currentYear]);
            $rows = $stmt->fetchAll();

            // Bangun mapping bulan ke jumlah
            $monthMap = [];
            foreach ($rows as $row) {
                $monthMap[(int)$row['bulan']] = (int)$row['jumlah'];
            }

            // Isi label dan data untuk semua bulan sampai bulan saat ini
            $currentMonth = (int)date('n');
            for ($i = 1; $i <= $currentMonth; $i++) {
                $labels[] = $monthNames[$i - 1];
                $data[] = $monthMap[$i] ?? 0;
            }

            return ['labels' => $labels, 'data' => $data];
        } catch (PDOException $e) {
            error_log("DashboardModel MonthlyRentalTrend Exception: " . $e->getMessage());
            return ['labels' => [], 'data' => []];
        }
    }

    /**
     * Mengambil tren pendapatan kotor per bulan untuk tahun berjalan
     * Digunakan oleh Bar Chart pada halaman Reports (Admin & Staff)
     * 
     * @return array - Array asosiatif ['labels' => [...], 'data' => [...], 'max' => int]
     */
    public function getMonthlyRevenueTrend() {
        try {
            $currentYear = date('Y');
            $labels = [];
            $data = [];
            $monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

            // Query pendapatan per bulan dari tabel payments yang berstatus PAID
            $sql = "SELECT MONTH(payment_date) AS bulan, SUM(amount) AS total
                    FROM payments
                    WHERE status = 'PAID' AND YEAR(payment_date) = :tahun
                    GROUP BY MONTH(payment_date)
                    ORDER BY bulan ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':tahun' => $currentYear]);
            $rows = $stmt->fetchAll();

            // Bangun mapping bulan ke total pendapatan
            $monthMap = [];
            foreach ($rows as $row) {
                $monthMap[(int)$row['bulan']] = (float)$row['total'];
            }

            // Isi label dan data untuk semua bulan sampai bulan saat ini
            $currentMonth = (int)date('n');
            $maxVal = 0;
            for ($i = 1; $i <= $currentMonth; $i++) {
                $labels[] = $monthNames[$i - 1];
                $val = $monthMap[$i] ?? 0;
                $data[] = $val;
                if ($val > $maxVal) $maxVal = $val;
            }

            return ['labels' => $labels, 'data' => $data, 'max' => $maxVal];
        } catch (PDOException $e) {
            error_log("DashboardModel MonthlyRevenueTrend Exception: " . $e->getMessage());
            return ['labels' => [], 'data' => [], 'max' => 0];
        }
    }

    /**
     * Mengambil jumlah unit aktif (RENTED) per tipe alat berat
     * Digunakan oleh Regional Demand Breakdown pada Staff Reports Modal
     * 
     * @return array - Array berisi ['type' => ..., 'active_count' => ..., 'total_count' => ...]
     */
    public function getEquipmentDemandByType() {
        try {
            $sql = "SELECT 
                        type,
                        COUNT(*) AS total_count,
                        SUM(CASE WHEN status = 'RENTED' THEN 1 ELSE 0 END) AS active_count
                    FROM equipments
                    GROUP BY type
                    ORDER BY active_count DESC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("DashboardModel EquipmentDemandByType Exception: " . $e->getMessage());
            return [];
        }
    }
}
