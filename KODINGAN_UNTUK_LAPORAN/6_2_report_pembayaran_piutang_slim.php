<?php
/**
 * ============================================================================
 * LAPORAN SKRIPSI 2: Laporan Pembayaran & Piutang (Slim)
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

class ReportPembayaranPiutang {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getReport($startDate, $endDate) {
        $sql = "SELECT p.payment_code, u.full_name AS client_name, p.payment_method, 
                       p.amount, p.status, p.payment_date
                FROM payments p
                JOIN users u ON p.customer_id = u.id
                WHERE p.payment_date BETWEEN :start AND :end
                ORDER BY p.payment_date DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':start' => $startDate, ':end' => $endDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Inisialisasi & Eksekusi Data Laporan
$report = new ReportPembayaranPiutang();
$startDate = filter_input(INPUT_GET, 'start_date') ?: date('Y-01-01');
$endDate = filter_input(INPUT_GET, 'end_date') ?: date('Y-12-31');
$data = $report->getReport($startDate, $endDate);

// Tampilan output teks ringkas untuk uji coba kelayakan kode
header('Content-Type: text/plain; charset=utf-8');
echo "=== LAPORAN PEMBAYARAN & PIUTANG ===\n";
echo "Rentang Tanggal: $startDate s/d $endDate\n";
echo "Jumlah Record: " . count($data) . "\n\n";
foreach ($data as $index => $row) {
    echo ($index + 1) . ". Invoice: " . $row['payment_code'] . " | Pelanggan: " . $row['client_name'] . 
         " | Metode: " . $row['payment_method'] . " | Jumlah: Rp " . number_format($row['amount'], 0, ',', '.') . 
         " | Status: " . $row['status'] . " | Tanggal: " . $row['payment_date'] . "\n";
}
