<?php
/**
 * ============================================================================
 * LAPORAN SKRIPSI 6: Laporan Kerusakan Unit (Slim)
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

class ReportKerusakanUnit {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getReport($startDate, $endDate) {
        $sql = "SELECT e.name AS equipment_name, m.maintenance_code, m.spareparts_replaced, 
                       m.description, m.cost
                FROM maintenance m
                JOIN equipments e ON m.equipment_id = e.id
                WHERE m.maintenance_type = 'CORRECTIVE' 
                  AND m.maintenance_date BETWEEN :start AND :end
                ORDER BY m.cost DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':start' => $startDate, ':end' => $endDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Inisialisasi & Eksekusi Data Laporan
$report = new ReportKerusakanUnit();
$startDate = filter_input(INPUT_GET, 'start_date') ?: date('Y-01-01');
$endDate = filter_input(INPUT_GET, 'end_date') ?: date('Y-12-31');
$data = $report->getReport($startDate, $endDate);

// Tampilan output teks ringkas untuk uji coba kelayakan kode
header('Content-Type: text/plain; charset=utf-8');
echo "=== LAPORAN EVALUASI KERUSAKAN UNIT ALAT BERAT ===\n";
echo "Rentang Tanggal: $startDate s/d $endDate\n";
echo "Jumlah Record: " . count($data) . "\n\n";
foreach ($data as $index => $row) {
    echo ($index + 1) . ". Nama Unit: " . $row['equipment_name'] . " | Kode Servis: " . $row['maintenance_code'] . 
         " | Sparepart Diganti: " . $row['spareparts_replaced'] . " | Uraian Kerusakan: " . $row['description'] . 
         " | Biaya Perbaikan: Rp " . number_format($row['cost'], 0, ',', '.') . "\n";
}
