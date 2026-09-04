<?php
/**
 * ============================================================================
 * MODEL: ReportModel — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Model ini bertanggung jawab atas penyusunan laporan operasional, ringkasan
 * keuangan, serta integrasi pratinjau data rental riil untuk terminal ekspor.
 * 
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * 1. SQL Injection Protection: Pengikatan parameter input (seperti `:start_date`)
 *    menggunakan parameter bervalidasi pada Pre-compiled Statement PDO.
 * 2. Join Relasional: Menghubungkan tabel rentals dengan users dan equipments
 *    secara relasional untuk menyajikan profil data lengkap secara riil.
 */

class ReportModel {
    private $db;

    public function __construct() {
        // Koneksi database pusat XAMPP
        $this->db = Database::getConnection();
    }

    /**
     * Mengambil metrik global untuk halaman laporan (Bento Stats)
     * 
     * @return array - Array metrik (total_rentals, gross_revenue)
     */
    public function getReportStats() {
        try {
            $stats = [];

            // 1. Total Sesi Rental (Total Sesi)
            $stmt = $this->db->query("SELECT COUNT(*) FROM rentals");
            $stats['total_rentals'] = $stmt->fetchColumn() ?: 0;

            // 2. Pendapatan Kotor (Total Payments Paid)
            $stmt = $this->db->query("SELECT SUM(amount) FROM payments WHERE status = 'PAID'");
            $stats['gross_revenue'] = $stmt->fetchColumn() ?: 0;

            // 3. Kontrak Legal Aktif
            $stmt = $this->db->query("SELECT COUNT(*) FROM contracts WHERE is_signed_customer = 1");
            $stats['active_contracts'] = $stmt->fetchColumn() ?: 0;

            return $stats;
        } catch (PDOException $e) {
            error_log("ReportModel Exception (getReportStats): " . $e->getMessage());
            return ['total_rentals' => 0, 'gross_revenue' => 0, 'active_contracts' => 0];
        }
    }

    /**
     * Mengambil data transaksi rental riil untuk pratinjau tabel laporan (11 jenis laporan)
     * 
     * @param string $reportType - Jenis Laporan yang dipilih
     * @param string $startDate - Rentang tanggal awal
     * @param string $endDate - Rentang tanggal akhir
     * @param bool $limit - Apakah membatasi data preview (default true, limit 10)
     * @return array - Array berisi 'headers' (judul kolom) dan 'rows' (baris data riil)
     */
    public function getRentalPreview($reportType = 'Laporan Rental Bulanan', $startDate = '', $endDate = '', $limit = true) {
        try {
            $headers = [];
            $rows = [];
            $params = [];
            $limitStr = $limit ? " LIMIT 10" : "";

            switch ($reportType) {
                case 'Laporan Rental Bulanan':
                default:
                    $headers = ['Kode Sewa', 'Pelanggan', 'Unit Alat', 'Mulai Sewa', 'Selesai Sewa', 'Total Hari', 'Subtotal', 'Status'];
                    $sql = "SELECT r.rental_code, COALESCE(NULLIF(u.company_name, ''), u.full_name) as client_name, e.name as equipment_name, r.start_date, r.end_date, r.total_days, r.subtotal, r.status
                            FROM rentals r
                            JOIN users u ON r.customer_id = u.id
                            JOIN equipments e ON r.equipment_id = e.id
                            WHERE 1=1";
                    if (!empty($startDate)) { $sql .= " AND r.start_date >= :start_date"; $params[':start_date'] = $startDate; }
                    if (!empty($endDate)) { $sql .= " AND r.end_date <= :end_date"; $params[':end_date'] = $endDate; }
                    $sql .= " ORDER BY r.id DESC" . $limitStr;
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'Laporan Pembayaran & Piutang':
                    $headers = ['Kode Bayar', 'Pelanggan', 'Metode Bayar', 'Jumlah Bayar', 'Status Bayar', 'Tanggal Bayar'];
                    $sql = "SELECT p.payment_code, COALESCE(NULLIF(u.company_name, ''), u.full_name) as client_name, p.payment_method, p.amount, p.status, p.payment_date
                            FROM payments p
                            JOIN users u ON p.customer_id = u.id
                            WHERE 1=1";
                    if (!empty($startDate)) { $sql .= " AND p.payment_date >= :start_date"; $params[':start_date'] = $startDate . ' 00:00:00'; }
                    if (!empty($endDate)) { $sql .= " AND p.payment_date <= :end_date"; $params[':end_date'] = $endDate . ' 23:59:59'; }
                    $sql .= " ORDER BY p.id DESC" . $limitStr;
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'Laporan Pendapatan Bersih':
                    $headers = ['Periode', 'Pendapatan Kotor', 'Estimasi Biaya Servis', 'Pajak & Ops (10%)', 'Pendapatan Bersih'];
                    // Query agregasi bulanan dinamis dari payments paid
                    $sql = "SELECT DATE_FORMAT(p.payment_date, '%Y-%m') as client_name, SUM(p.amount) as amount, 
                                   COALESCE((SELECT SUM(cost) FROM maintenance WHERE status = 'COMPLETED' AND DATE_FORMAT(completion_date, '%Y-%m') = DATE_FORMAT(p.payment_date, '%Y-%m')), 0) as maintenance_cost
                            FROM payments p
                            WHERE p.status = 'PAID'";
                    if (!empty($startDate)) { $sql .= " AND p.payment_date >= :start_date"; $params[':start_date'] = $startDate . ' 00:00:00'; }
                    if (!empty($endDate)) { $sql .= " AND p.payment_date <= :end_date"; $params[':end_date'] = $endDate . ' 23:59:59'; }
                    $sql .= " GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m') ORDER BY client_name DESC" . $limitStr;
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $rawRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    foreach ($rawRows as $r) {
                        $gross = (float)$r['amount'];
                        $maint = (float)$r['maintenance_cost'];
                        $taxOps = $gross * 0.10;
                        $net = $gross - $maint - $taxOps;
                        $rows[] = [
                            'rental_code' => $r['client_name'],
                            'client_name' => "Rp " . number_format($gross, 0, ',', '.'),
                            'equipment_name' => "Rp " . number_format($maint, 0, ',', '.'),
                            'start_date' => "Rp " . number_format($taxOps, 0, ',', '.'),
                            'end_date' => "Rp " . number_format($net, 0, ',', '.'),
                            'total_days' => '-',
                            'subtotal' => $net,
                            'status' => 'APPROVED'
                        ];
                    }
                    break;

                case 'Laporan Maintenance & Servis':
                    $headers = ['Kode Servis', 'Unit Alat', 'Tipe Perawat', 'Hour Meter', 'Uraian Servis', 'Biaya', 'Status'];
                    $sql = "SELECT m.maintenance_code, e.name as client_name, m.maintenance_type, m.hour_meter_at_maintenance, m.description, m.cost, m.status
                            FROM maintenance m
                            JOIN equipments e ON m.equipment_id = e.id
                            WHERE 1=1";
                    if (!empty($startDate)) { $sql .= " AND m.scheduled_date >= :start_date"; $params[':start_date'] = $startDate; }
                    if (!empty($endDate)) { $sql .= " AND m.scheduled_date <= :end_date"; $params[':end_date'] = $endDate; }
                    $sql .= " ORDER BY m.id DESC" . $limitStr;
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'Laporan Pemanfaatan & Hour Meter (HM)':
                    $headers = ['Kode Alat', 'Nama Unit Alat', 'Kategori', 'Hour Meter Aktual', 'Servis Terakhir', 'Status Unit'];
                    $sql = "SELECT e.equipment_code, e.name as client_name, e.type, e.hour_meter, e.last_maintenance_date, e.status
                            FROM equipments e
                            WHERE 1=1";
                    $sql .= " ORDER BY e.hour_meter DESC" . $limitStr;
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'Laporan Evaluasi Kerusakan Unit':
                    $headers = ['Nama Alat', 'Kode Servis', 'Suku Cadang Diganti', 'Uraian Kerusakan', 'Biaya Perbaikan'];
                    $sql = "SELECT e.name as rental_code, m.maintenance_code as client_name, m.spareparts_replaced as equipment_name, m.description as start_date, m.cost as subtotal, m.status
                            FROM maintenance m
                            JOIN equipments e ON m.equipment_id = e.id
                            WHERE m.maintenance_type = 'CORRECTIVE'";
                    if (!empty($startDate)) { $sql .= " AND m.completion_date >= :start_date"; $params[':start_date'] = $startDate; }
                    if (!empty($endDate)) { $sql .= " AND m.completion_date <= :end_date"; $params[':end_date'] = $endDate; }
                    $sql .= " ORDER BY m.id DESC" . $limitStr;
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'Laporan Histori Telemetri GPS':
                    $headers = ['Nama Alat', 'Latitude', 'Longitude', 'Kecepatan (km/h)', 'Mesin', 'Bahan Bakar', 'Waktu Kirim'];
                    $sql = "SELECT e.name as rental_code, g.latitude as client_name, g.longitude as equipment_name, g.speed as start_date, g.engine_status as end_date, g.fuel_level_percent as total_days, g.recorded_at as subtotal
                            FROM gps_tracking g
                            JOIN equipments e ON g.equipment_id = e.id
                            WHERE 1=1";
                    $sql .= " ORDER BY g.id DESC" . $limitStr;
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $rawRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($rawRows as $r) {
                        $rows[] = [
                            'rental_code' => $r['rental_code'],
                            'client_name' => $r['client_name'],
                            'equipment_name' => $r['equipment_name'],
                            'start_date' => $r['start_date'] . ' km/h',
                            'end_date' => $r['end_date'],
                            'total_days' => $r['total_days'] . '%',
                            'subtotal' => $r['subtotal'],
                            'status' => $r['end_date'] === 'ON' ? 'ON_GOING' : 'COMPLETED'
                        ];
                    }
                    break;

                case 'Laporan Evaluasi Kinerja Staf':
                    $headers = ['Nama Staf', 'Username', 'Email', 'No Telepon', 'Status Akun', 'Tanggal Gabung'];
                    $sql = "SELECT u.full_name as rental_code, u.username as client_name, u.email as equipment_name, u.phone as start_date, u.status as end_date, u.created_at as subtotal
                            FROM users u
                            JOIN roles r ON u.role_id = r.id
                            WHERE r.role_name = 'STAFF'";
                    $sql .= " ORDER BY u.id DESC" . $limitStr;
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $rawRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($rawRows as $r) {
                        $rows[] = [
                            'rental_code' => $r['rental_code'],
                            'client_name' => $r['client_name'],
                            'equipment_name' => $r['equipment_name'],
                            'start_date' => $r['start_date'],
                            'end_date' => $r['end_date'],
                            'total_days' => '-',
                            'subtotal' => $r['subtotal'],
                            'status' => $r['end_date'] === 'ACTIVE' ? 'APPROVED' : 'COMPLETED'
                        ];
                    }
                    break;

                case 'Laporan Stok & Penggunaan Suku Cadang':
                    $headers = ['Kode Servis', 'Nama Unit Alat', 'Suku Cadang Diganti', 'Biaya Penggantian', 'Tanggal Ganti'];
                    $sql = "SELECT m.maintenance_code as rental_code, e.name as client_name, m.spareparts_replaced as equipment_name, m.cost as subtotal, m.completion_date as start_date, m.status
                            FROM maintenance m
                            JOIN equipments e ON m.equipment_id = e.id
                            WHERE m.spareparts_replaced IS NOT NULL AND m.spareparts_replaced != ''";
                    if (!empty($startDate)) { $sql .= " AND m.completion_date >= :start_date"; $params[':start_date'] = $startDate; }
                    if (!empty($endDate)) { $sql .= " AND m.completion_date <= :end_date"; $params[':end_date'] = $endDate; }
                    $sql .= " ORDER BY m.id DESC" . $limitStr;
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $rawRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($rawRows as $r) {
                        $rows[] = [
                            'rental_code' => $r['rental_code'],
                            'client_name' => $r['client_name'],
                            'equipment_name' => $r['equipment_name'],
                            'start_date' => $r['start_date'],
                            'end_date' => '-',
                            'total_days' => '-',
                            'subtotal' => $r['subtotal'],
                            'status' => $r['status']
                        ];
                    }
                    break;

                case 'Laporan Kepuasan Pelanggan':
                    $headers = ['Kode Rental', 'Nama Pelanggan', 'Perusahaan', 'Nama Unit Alat', 'Catatan Rental', 'Tanggal Sewa'];
                    $sql = "SELECT r.rental_code, u.full_name as client_name, u.company_name as equipment_name, e.name as start_date, r.notes as end_date, r.booking_date as subtotal, r.status
                            FROM rentals r
                            JOIN users u ON r.customer_id = u.id
                            JOIN equipments e ON r.equipment_id = e.id
                            WHERE r.notes IS NOT NULL AND r.notes != ''";
                    if (!empty($startDate)) { $sql .= " AND r.start_date >= :start_date"; $params[':start_date'] = $startDate; }
                    if (!empty($endDate)) { $sql .= " AND r.end_date <= :end_date"; $params[':end_date'] = $endDate; }
                    $sql .= " ORDER BY r.id DESC" . $limitStr;
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $rawRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($rawRows as $r) {
                        $rows[] = [
                            'rental_code' => $r['rental_code'],
                            'client_name' => $r['client_name'],
                            'equipment_name' => $r['equipment_name'] ?: '-',
                            'start_date' => $r['start_date'],
                            'end_date' => $r['end_date'],
                            'total_days' => '-',
                            'subtotal' => $r['subtotal'],
                            'status' => $r['status']
                        ];
                    }
                    break;

                case 'Laporan Audit Trail & Log Sistem':
                    $headers = ['Kode Laporan', 'Nama Aktor', 'Tipe Berkas Laporan', 'Akses Path', 'Waktu Dibuat'];
                    $sql = "SELECT r.report_code as rental_code, u.full_name as client_name, r.report_type as equipment_name, r.file_path as start_date, r.generated_at as subtotal
                            FROM reports r
                            JOIN users u ON r.generated_by = u.id";
                    if (!empty($startDate)) { $sql .= " AND r.generated_at >= :start_date"; $params[':start_date'] = $startDate . ' 00:00:00'; }
                    if (!empty($endDate)) { $sql .= " AND r.generated_at <= :end_date"; $params[':end_date'] = $endDate . ' 23:59:59'; }
                    $sql .= " ORDER BY r.id DESC" . $limitStr;
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                    $rawRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($rawRows as $r) {
                        $rows[] = [
                            'rental_code' => $r['rental_code'],
                            'client_name' => $r['client_name'],
                            'equipment_name' => $r['equipment_name'],
                            'start_date' => $r['start_date'],
                            'end_date' => '-',
                            'total_days' => '-',
                            'subtotal' => $r['subtotal'],
                            'status' => 'COMPLETED'
                        ];
                    }
                    break;
            }

            return [
                'headers' => $headers,
                'rows' => $rows
            ];
        } catch (PDOException $e) {
            error_log("ReportModel Exception (getRentalPreview): " . $e->getMessage());
            return ['headers' => [], 'rows' => []];
        }
    }
}
