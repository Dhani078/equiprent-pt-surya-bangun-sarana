<?php
/**
 * ============================================================================
 * LAPORAN SKRIPSI 8: Laporan Evaluasi Kinerja Staf & Operator (Slim)
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

class ReportKinerjaStaf {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getReport() {
        $sql = "SELECT u.full_name AS staff_name, u.username, u.email, u.phone, 
                       u.status, u.created_at, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE r.role_name IN ('STAFF', 'ADMIN')
                ORDER BY u.full_name ASC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Inisialisasi & Eksekusi Data Laporan
$report = new ReportKinerjaStaf();
$data = $report->getReport();

// Tampilan output teks ringkas untuk uji coba kelayakan kode
header('Content-Type: text/plain; charset=utf-8');
echo "=== LAPORAN EVALUASI KINERJA STAF & OPERATOR ===\n";
echo "Jumlah Akun Staf: " . count($data) . "\n\n";
foreach ($data as $index => $row) {
    echo ($index + 1) . ". Nama Staf: " . $row['staff_name'] . " | Username: " . $row['username'] . 
         " | Email: " . $row['email'] . " | No Telp: " . $row['phone'] . " | Status: " . $row['status'] . 
         " | Peran: " . $row['role_name'] . "\n";
}
