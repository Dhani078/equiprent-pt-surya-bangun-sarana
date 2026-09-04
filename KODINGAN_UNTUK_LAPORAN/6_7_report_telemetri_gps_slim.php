<?php
/**
 * ============================================================================
 * LAPORAN SKRIPSI 7: Laporan Histori Telemetri GPS (Slim)
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

class ReportTelemetriGps {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getReport($startDate, $endDate) {
        $sql = "SELECT e.name AS equipment_name, g.latitude, g.longitude, 
                       CONCAT(g.speed_kph, ' km/h') AS speed, g.engine_state, 
                       CONCAT(g.fuel_level, '%') AS fuel, g.timestamp
                FROM gps_tracking g
                JOIN equipments e ON g.equipment_id = e.id
                WHERE g.timestamp BETWEEN :start AND :end
                ORDER BY g.timestamp DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':start' => $startDate, ':end' => $endDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Inisialisasi & Eksekusi Data Laporan
$report = new ReportTelemetriGps();
$startDate = filter_input(INPUT_GET, 'start_date') ?: date('Y-01-01');
$endDate = filter_input(INPUT_GET, 'end_date') ?: date('Y-12-31');
$data = $report->getReport($startDate, $endDate);

// Tampilan output teks ringkas untuk uji coba kelayakan kode
header('Content-Type: text/plain; charset=utf-8');
echo "=== LAPORAN HISTORI TELEMETRI GPS ALAT BERAT ===\n";
echo "Rentang Tanggal: $startDate s/d $endDate\n";
echo "Jumlah Record: " . count($data) . "\n\n";
foreach ($data as $index => $row) {
    echo ($index + 1) . ". Unit: " . $row['equipment_name'] . " | Lat: " . $row['latitude'] . " | Lon: " . $row['longitude'] . 
         " | Kecepatan: " . $row['speed'] . " | Engine: " . $row['engine_state'] . 
         " | BBM: " . $row['fuel'] . " | Waktu: " . $row['timestamp'] . "\n";
}
