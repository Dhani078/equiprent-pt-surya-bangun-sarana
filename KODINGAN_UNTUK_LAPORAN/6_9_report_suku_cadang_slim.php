<?php
/**
 * ============================================================================
 * LAPORAN SKRIPSI 9: Laporan Pemakaian Suku Cadang Alat Berat (Slim)
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

class ReportSukuCadang {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getReport($startDate, $endDate) {
        $sql = "SELECT m.maintenance_code, e.name AS equipment_name, m.spareparts_replaced, 
                       m.cost, m.maintenance_date
                FROM maintenance m
                JOIN equipments e ON m.equipment_id = e.id
                WHERE m.spareparts_replaced IS NOT NULL AND m.spareparts_replaced != ''
                  AND m.maintenance_date BETWEEN :start AND :end
                ORDER BY m.maintenance_date DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':start' => $startDate, ':end' => $endDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Inisialisasi & Eksekusi Data Laporan
$report = new ReportSukuCadang();
$startDate = filter_input(INPUT_GET, 'start_date') ?: date('Y-01-01');
$endDate = filter_input(INPUT_GET, 'end_date') ?: date('Y-12-31');
$data = $report->getReport($startDate, $endDate);

// Tampilan output teks ringkas untuk uji coba kelayakan kode
header('Content-Type: text/plain; charset=utf-8');
echo "=== LAPORAN PEMAKAIAN SUKU CADANG ALAT BERAT ===\n";
echo "Rentang Tanggal: $startDate s/d $endDate\n";
echo "Jumlah Record: " . count($data) . "\n\n";
foreach ($data as $index => $row) {
    echo ($index + 1) . ". Kode Servis: " . $row['maintenance_code'] . " | Unit Alat: " . $row['equipment_name'] . 
         " | Suku Cadang: " . $row['spareparts_replaced'] . " | Biaya Penggantian: Rp " . number_format($row['cost'], 0, ',', '.') . 
         " | Tanggal Ganti: " . $row['maintenance_date'] . "\n";
}
