<?php
/**
 * ============================================================================
 * LAPORAN SKRIPSI 11: Laporan Audit Trail & Log Aktivitas Sistem (Slim)
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

class ReportAuditTrail {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getReport() {
        $sql = "SELECT rep.report_code, u.full_name AS actor_name, rep.report_type, 
                       rep.file_path, rep.created_at
                FROM reports rep
                JOIN users u ON rep.created_by = u.id
                ORDER BY rep.created_at DESC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Inisialisasi & Eksekusi Data Laporan
$report = new ReportAuditTrail();
$data = $report->getReport();

// Tampilan output teks ringkas untuk uji coba kelayakan kode
header('Content-Type: text/plain; charset=utf-8');
echo "=== LAPORAN AUDIT TRAIL & LOG SISTEM ===\n";
echo "Jumlah Record Audit: " . count($data) . "\n\n";
foreach ($data as $index => $row) {
    echo ($index + 1) . ". Kode Laporan: " . $row['report_code'] . " | Oleh: " . $row['actor_name'] . 
         " | Tipe Ekspor: " . $row['report_type'] . " | File Path: " . $row['file_path'] . 
         " | Waktu Ekspor: " . $row['created_at'] . "\n";
}
