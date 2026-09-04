<?php
/**
 * ============================================================================
 * LAPORAN SKRIPSI 1: Laporan Rental Bulanan (Slim)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 */
session_start();

// Fallback Koneksi Database
if (file_exists(__DIR__ . '/../config/database.php')) {
    require_once __DIR__ . '/../config/database.php';
} else {
    class Database {
        public static function getConnection() {
            return new PDO("mysql:host=localhost;dbname=sbs_db;charset=utf8", "root", "");
        }
    }
}

class ReportRentalBulanan {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getReport($startDate, $endDate) {
        $sql = "SELECT r.rental_code, u.full_name AS client_name, e.name AS equipment_name, 
                       r.start_date, r.end_date, r.total_days, r.subtotal, r.status
                FROM rentals r
                JOIN users u ON r.customer_id = u.id
                JOIN equipments e ON r.equipment_id = e.id
                WHERE r.start_date BETWEEN :start AND :end
                ORDER BY r.start_date DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':start' => $startDate, ':end' => $endDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Inisialisasi & Eksekusi Data Laporan
$report = new ReportRentalBulanan();
$startDate = filter_input(INPUT_GET, 'start_date') ?: date('Y-01-01');
$endDate = filter_input(INPUT_GET, 'end_date') ?: date('Y-12-31');
$data = $report->getReport($startDate, $endDate);

// Tampilan output teks ringkas untuk uji coba kelayakan kode
header('Content-Type: text/plain; charset=utf-8');
echo "=== LAPORAN RENTAL BULANAN ===\n";
echo "Rentang Tanggal: $startDate s/d $endDate\n";
echo "Jumlah Record: " . count($data) . "\n\n";
foreach ($data as $index => $row) {
    echo ($index + 1) . ". Kode: " . $row['rental_code'] . " | Pelanggan: " . $row['client_name'] . 
         " | Alat: " . $row['equipment_name'] . " | Hari: " . $row['total_days'] . 
         " | Total: Rp " . number_format($row['subtotal'], 0, ',', '.') . " | Status: " . $row['status'] . "\n";
}
