<?php
/**
 * ============================================================================
 * LAPORAN SKRIPSI 5: Laporan Utilisasi & Hour Meter (Slim)
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

class ReportUtilisasiHourMeter {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getReport() {
        $sql = "SELECT e.equipment_code, e.name AS equipment_name, e.type, 
                       e.hour_meter, COALESCE((SELECT MAX(maintenance_date) FROM maintenance WHERE equipment_id=e.id), 'Belum Pernah') AS last_maint, e.status
                FROM equipments e
                ORDER BY e.hour_meter DESC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Inisialisasi & Eksekusi Data Laporan
$report = new ReportUtilisasiHourMeter();
$data = $report->getReport();

// Tampilan output teks ringkas untuk uji coba kelayakan kode
header('Content-Type: text/plain; charset=utf-8');
echo "=== LAPORAN UTILISASI & HOUR METER (HM) ===\n";
echo "Jumlah Record Alat Berat: " . count($data) . "\n\n";
foreach ($data as $index => $row) {
    echo ($index + 1) . ". Kode: " . $row['equipment_code'] . " | Nama Unit: " . $row['equipment_name'] . 
         " | Tipe: " . $row['type'] . " | Hour Meter Aktual: " . $row['hour_meter'] . " jam | Servis Terakhir: " . $row['last_maint'] . 
         " | Status Unit: " . $row['status'] . "\n";
}
