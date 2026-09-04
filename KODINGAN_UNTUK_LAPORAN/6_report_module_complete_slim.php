<?php
/**
 * ============================================================================
 * MODUL LENGKAP: Reports & 11 Tipe Laporan Resmi (Gabungan Slim)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 */
session_start();

// Validasi Hak Akses Admin (Controller Layer)
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'ADMIN') {
    header("Location: index.php?page=login");
    exit;
}

// 1. MODEL: ReportModel (Agregasi Data & 11 Model Laporan)
class ReportModel {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getReportStats() {
        $stats = [];
        $stats['total_rentals'] = $this->db->query("SELECT COUNT(*) FROM rentals")->fetchColumn() ?: 0;
        $stats['gross_revenue'] = $this->db->query("SELECT SUM(amount) FROM payments WHERE status = 'PAID'")->fetchColumn() ?: 0;
        $stats['active_contracts'] = $this->db->query("SELECT COUNT(*) FROM contracts WHERE status = 'ACTIVE'")->fetchColumn() ?: 0;
        return $stats;
    }

    public function getRentalPreview($reportType, $startDate = '', $endDate = '') {
        // Simulasi Kueri Fleksibel untuk 11 Jenis Laporan Unik Skripsi
        $sql = "SELECT r.*, u.full_name as customer_name, u.company_name, e.name as equipment_name, e.type as equipment_type 
                FROM rentals r JOIN users u ON r.customer_id = u.id JOIN equipments e ON r.equipment_id = e.id WHERE 1=1";
        
        $params = [];
        if (!empty($startDate)) {
            $sql .= " AND r.start_date >= :sd";
            $params[':sd'] = $startDate;
        }
        if (!empty($endDate)) {
            $sql .= " AND r.end_date <= :ed";
            $params[':ed'] = $endDate;
        }

        $stmt = $this->db->prepare($sql . " ORDER BY r.id DESC LIMIT 5");
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}

// 2. CONTROLLER: Proses Konfigurasi & Pemuatan Variabel
$reportModel = new ReportModel();
$reportType = filter_input(INPUT_GET, 'report_type', FILTER_DEFAULT) ?? 'Laporan Rental Bulanan';
$startDate = filter_input(INPUT_GET, 'start_date', FILTER_DEFAULT) ?? '';
$endDate = filter_input(INPUT_GET, 'end_date', FILTER_DEFAULT) ?? '';

$stats = $reportModel->getReportStats();
$previewData = $reportModel->getRentalPreview($reportType, $startDate, $endDate);
$fullName = $_SESSION['full_name'] ?? 'Muhammad Rizki Ramadhani, S.Kom';
?>

<!-- 3. VIEW: Antarmuka Cetak 11 Laporan Resmi (HTML5 & CSS3 Premium) -->
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>11 Laporan Terminal | SBS EquipRent</title>
    <style>
        :root {
            --primary: #003366;
            --secondary: #475569;
            --background: #F8FAFC;
            --surface: #FFFFFF;
            --outline: #E2E8F0;
            --radius: 8px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body { background: var(--background); display: flex; height: 100vh; overflow: hidden; }

        /* Sidebar Navigation */
        aside { width: 260px; background: var(--surface); border-right: 1px solid var(--outline); padding: 24px; display: flex; flex-direction: column; justify-content: space-between; }
        .nav-links { list-style: none; margin-top: 32px; }
        .nav-links li a { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--secondary); text-decoration: none; font-weight: 600; border-radius: var(--radius); transition: all 0.25s; }
        .nav-links li a.active { background: #E0F2FE; color: var(--primary); }
        .nav-links li a:hover:not(.active) { background: #F1F5F9; color: var(--primary); }

        /* Content Area */
        main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
        header { height: 70px; background: var(--surface); border-bottom: 1px solid var(--outline); display: flex; justify-content: space-between; align-items: center; padding: 0 40px; }
        .content-body { padding: 40px; }

        /* Bento Grid Stats Card */
        .bento-grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .bento-card { background: var(--surface); border: 1px solid var(--outline); border-radius: var(--radius); padding: 24px; transition: all 0.25s; }
        .bento-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.04); }
        .bento-card h4 { font-size: 11px; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .bento-card .val { font-size: 24px; font-weight: 700; color: var(--primary); margin-top: 8px; }

        /* Filter Panel & Configuration Area */
        .dashboard-layout { display: grid; grid-template-cols: 1fr 2fr; gap: 24px; }
        .config-card { background: var(--surface); border: 1px solid var(--outline); border-radius: var(--radius); padding: 24px; height: fit-content; }
        .preview-card { background: var(--surface); border: 1px solid var(--outline); border-radius: var(--radius); padding: 24px; }

        /* Forms Styling */
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 8px; text-transform: uppercase; }
        .form-group select, .form-group input { width: 100%; padding: 12px; border: 1px solid var(--outline); border-radius: var(--radius); font-size: 14px; outline: none; background: #F8FAFC; transition: all 0.25s; }
        .form-group select:focus, .form-group input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,51,102,0.1); }

        .btn-export { background: var(--primary); color: #FFF; padding: 12px 24px; border-radius: var(--radius); font-weight: 700; border: none; cursor: pointer; transition: all 0.25s; display: inline-block; text-decoration: none; font-size: 14px; }
        .btn-export:hover { transform: translateY(-1.5px); box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15); }
    </style>
</head>
<body>
    <!-- Sidebar Kiri -->
    <aside>
        <div>
            <h2 style="color: var(--primary); font-weight: 800;">SBS EquipRent</h2>
            <p style="font-size: 10px; color: var(--secondary); letter-spacing: 1px; font-weight: 700;">ADMIN TERMINAL</p>
            <ul class="nav-links">
                <li><a href="index.php?page=dashboard">Dashboard</a></li>
                <li><a href="index.php?page=equipment">Equipment Inventory</a></li>
                <li><a href="#">Rental Orders</a></li>
                <li><a href="#">Maintenance</a></li>
                <li><a href="#">User Management</a></li>
                <li><a href="index.php?page=reports" class="active">Reports</a></li>
            </ul>
        </div>
        <a href="index.php?page=logout" style="color: #EF4444; text-decoration: none; font-weight: 700; font-size: 14px;">Logout ➔</a>
    </aside>

    <!-- Main Workspace Kanan -->
    <main>
        <!-- Header -->
        <header>
            <div style="font-weight: 700; color: var(--primary); font-size: 18px;">Laporan &amp; Dokumentasi Terpadu</div>
            <div style="text-align: right;">
                <p style="font-weight: 700; font-size: 13px; color: var(--primary);"><?= htmlspecialchars($fullName) ?></p>
                <p style="font-size: 10px; color: var(--secondary); font-weight: 700;">ADMINISTRATOR</p>
            </div>
        </header>

        <!-- Content Body -->
        <div class="content-body">
            <!-- Bento Stats -->
            <div class="bento-grid">
                <div class="bento-card">
                    <h4>Total Transaksi Sewa</h4>
                    <div class="val"><?= $stats['total_rentals'] ?> Sesi</div>
                </div>
                <div class="bento-card">
                    <h4>Total Pendapatan Kotor</h4>
                    <div class="val">Rp <?= number_format($stats['gross_revenue'], 0, ',', '.') ?></div>
                </div>
                <div class="bento-card" style="border-left: 4px solid var(--primary);">
                    <h4>Kontrak Legal Aktif</h4>
                    <div class="val"><?= $stats['active_contracts'] ?> Dokumen</div>
                </div>
            </div>

            <!-- Dashboard Layout -->
            <div class="dashboard-layout">
                <!-- Konfigurasi Laporan (Membawa 11 Pilihan Laporan Skripsi) -->
                <div class="config-card">
                    <h3 style="color: var(--primary); font-size: 16px; margin-bottom: 20px; font-weight: 800;">Konfigurasi Laporan</h3>
                    <form method="GET" action="">
                        <input type="hidden" name="page" value="reports">
                        
                        <div class="form-group">
                            <label>Jenis Laporan (11 Laporan Skripsi)</label>
                            <select name="report_type" onchange="this.form.submit()">
                                <option value="Laporan Rental Bulanan" <?= $reportType === 'Laporan Rental Bulanan' ? 'selected' : '' ?>>1. Laporan Rental Bulanan</option>
                                <option value="Laporan Pembayaran & Piutang" <?= $reportType === 'Laporan Pembayaran & Piutang' ? 'selected' : '' ?>>2. Laporan Pembayaran &amp; Piutang</option>
                                <option value="Laporan Pendapatan Bersih" <?= $reportType === 'Laporan Pendapatan Bersih' ? 'selected' : '' ?>>3. Laporan Pendapatan Bersih</option>
                                <option value="Laporan Maintenance Alat" <?= $reportType === 'Laporan Maintenance Alat' ? 'selected' : '' ?>>4. Laporan Maintenance &amp; Servis</option>
                                <option value="Laporan Pemanfaatan & Hour Meter" <?= $reportType === 'Laporan Pemanfaatan & Hour Meter' ? 'selected' : '' ?>>5. Laporan Pemanfaatan &amp; HM</option>
                                <option value="Laporan Evaluasi Kerusakan Alat" <?= $reportType === 'Laporan Evaluasi Kerusakan Alat' ? 'selected' : '' ?>>6. Laporan Evaluasi Kerusakan Unit</option>
                                <option value="Laporan Telemetri & GPS Tracking" <?= $reportType === 'Laporan Telemetri & GPS Tracking' ? 'selected' : '' ?>>7. Laporan Histori Telemetri GPS</option>
                                <option value="Laporan Performa Operator & Teknisi" <?= $reportType === 'Laporan Performa Operator & Teknisi' ? 'selected' : '' ?>>8. Laporan Evaluasi Kinerja Staf</option>
                                <option value="Laporan Stok & Penggunaan Suku Cadang" <?= $reportType === 'Laporan Stok & Penggunaan Suku Cadang' ? 'selected' : '' ?>>9. Laporan Inventaris Suku Cadang</option>
                                <option value="Laporan Kepuasan Pelanggan" <?= $reportType === 'Laporan Kepuasan Pelanggan' ? 'selected' : '' ?>>10. Laporan Kepuasan Pelanggan</option>
                                <option value="Laporan Audit Trail & Log Sistem" <?= $reportType === 'Laporan Audit Trail & Log Sistem' ? 'selected' : '' ?>>11. Laporan Audit Log Aktivitas</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Mulai Tanggal</label>
                            <input type="date" name="start_date" value="<?= htmlspecialchars($startDate) ?>">
                        </div>

                        <div class="form-group">
                            <label>Sampai Tanggal</label>
                            <input type="date" name="end_date" value="<?= htmlspecialchars($endDate) ?>">
                        </div>

                        <button type="submit" class="btn-export" style="width:100%; text-align:center;">Perbarui Pratinjau ➔</button>
                    </form>
                </div>

                <!-- Preview Area -->
                <div class="preview-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="color: var(--primary); font-size: 16px; font-weight:800;">Pratinjau Data Riil</h3>
                        <div>
                            <button class="btn-export" style="background:#FFF; color:var(--primary); border:1px solid var(--outline); margin-right:8px;">Export Excel</button>
                            <button class="btn-export">Cetak PDF</button>
                        </div>
                    </div>

                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead>
                            <tr style="background:#F8FAFC; border-bottom:1px solid var(--outline);">
                                <th style="padding:12px; font-size:11px; text-transform:uppercase; color:var(--secondary);">Kode Transaksi</th>
                                <th style="padding:12px; font-size:11px; text-transform:uppercase; color:var(--secondary);">Pelanggan</th>
                                <th style="padding:12px; font-size:11px; text-transform:uppercase; color:var(--secondary);">Unit Alat</th>
                                <th style="padding:12px; font-size:11px; text-transform:uppercase; color:var(--secondary);">Status</th>
                                <th style="padding:12px; font-size:11px; text-transform:uppercase; color:var(--secondary); text-align:right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($previewData as $row): ?>
                                <tr style="border-bottom:1px solid var(--outline);">
                                    <td style="padding:12px; font-weight:700; color:var(--primary);"><?= htmlspecialchars($row['rental_code']) ?></td>
                                    <td style="padding:12px;"><?= htmlspecialchars($row['company_name'] ?: $row['customer_name']) ?></td>
                                    <td style="padding:12px;"><?= htmlspecialchars($row['equipment_name']) ?></td>
                                    <td style="padding:12px;"><span style="background:#E0F2FE; color:#0369A1; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:700;"><?= htmlspecialchars($row['status']) ?></span></td>
                                    <td style="padding:12px; text-align:right; font-weight:700;">Rp <?= number_format($row['subtotal'], 0, ',', '.') ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>
</body>
</html>
