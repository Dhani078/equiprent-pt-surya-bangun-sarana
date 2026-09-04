<?php
/**
 * ============================================================================
 * LAPORAN SKRIPSI 3: Laporan Pendapatan Bersih (Slim)
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

class ReportPendapatanBersih {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getReport($startDate, $endDate) {
        $sql = "SELECT DATE_FORMAT(r.start_date, '%Y-%m') AS period,
                       SUM(r.subtotal) AS gross,
                       COALESCE((SELECT SUM(cost) FROM maintenance WHERE status='COMPLETED'), 0) AS maint,
                       SUM(r.subtotal) * 0.10 AS tax,
                       (SUM(r.subtotal) - COALESCE((SELECT SUM(cost) FROM maintenance WHERE status='COMPLETED'), 0) - (SUM(r.subtotal) * 0.10)) AS net,
                       r.status
                FROM rentals r
                WHERE r.status = 'APPROVED' AND r.start_date BETWEEN :start AND :end
                GROUP BY DATE_FORMAT(r.start_date, '%Y-%m')";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':start' => $startDate, ':end' => $endDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Inisialisasi & Eksekusi Data Laporan
$report = new ReportPendapatanBersih();
$startDate = filter_input(INPUT_GET, 'start_date') ?: date('Y-01-01');
$endDate = filter_input(INPUT_GET, 'end_date') ?: date('Y-12-31');
$data = $report->getReport($startDate, $endDate);

// Tampilan output teks ringkas untuk uji coba kelayakan kode
header('Content-Type: text/plain; charset=utf-8');
echo "=== LAPORAN LABA RUGI / PENDAPATAN BERSIH ===\n";
echo "Rentang Tanggal: $startDate s/d $endDate\n";
echo "Jumlah Periode: " . count($data) . "\n\n";
foreach ($data as $index => $row) {
    echo ($index + 1) . ". Periode: " . $row['period'] . " | Pendapatan Kotor: Rp " . number_format($row['gross'], 0, ',', '.') . 
         " | Pengeluaran Maint: Rp " . number_format($row['maint'], 0, ',', '.') . " | Pajak/Ops (10%): Rp " . number_format($row['tax'], 0, ',', '.') . 
         " | Laba Bersih: Rp " . number_format($row['net'], 0, ',', '.') . " | Status: " . $row['status'] . "\n";
}
