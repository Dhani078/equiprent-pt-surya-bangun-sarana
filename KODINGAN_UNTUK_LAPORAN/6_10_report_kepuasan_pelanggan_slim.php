<?php
/**
 * ============================================================================
 * LAPORAN SKRIPSI 10: Laporan Survei Kepuasan & Umpan Balik Pelanggan (Slim)
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

class ReportKepuasanPelanggan {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getReport() {
        $sql = "SELECT r.rental_code, u.full_name AS client_name, u.company_name, 
                       e.name AS equipment_name, r.notes, r.created_at
                FROM rentals r
                JOIN users u ON r.customer_id = u.id
                JOIN equipments e ON r.equipment_id = e.id
                WHERE r.notes IS NOT NULL AND r.notes != ''
                ORDER BY r.created_at DESC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Inisialisasi & Eksekusi Data Laporan
$report = new ReportKepuasanPelanggan();
$data = $report->getReport();

// Tampilan output teks ringkas untuk uji coba kelayakan kode
header('Content-Type: text/plain; charset=utf-8');
echo "=== LAPORAN SURVEI KEPUASAN & UMPAN BALIK PELANGGAN ===\n";
echo "Jumlah Record Feedback: " . count($data) . "\n\n";
foreach ($data as $index => $row) {
    echo ($index + 1) . ". Kode Sewa: " . $row['rental_code'] . " | Pelanggan: " . $row['client_name'] . 
         " (" . $row['company_name'] . ") | Alat Berat: " . $row['equipment_name'] . 
         "\n   Catatan Evaluasi / Rating: \"" . $row['notes'] . "\" | Tanggal: " . $row['created_at'] . "\n\n";
}
