<?php
/**
 * ============================================================================
 * MODUL LENGKAP: Rental Orders Model, Controller & View (Gabungan Slim)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 */
session_start();

// Validasi Hak Akses Admin (Controller Layer)
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'ADMIN') {
    header("Location: index.php?page=login");
    exit;
}

// 1. MODEL: RentalModel (Kueri Transaksi Sewa)
class RentalModel {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getRentalStats() {
        $stats = [];
        $stats['active'] = $this->db->query("SELECT COUNT(*) FROM rentals WHERE status IN ('APPROVED', 'ON_GOING')")->fetchColumn() ?: 0;
        $stats['due_today'] = $this->db->query("SELECT COUNT(*) FROM rentals WHERE end_date = CURRENT_DATE() AND status = 'ON_GOING'")->fetchColumn() ?: 0;
        $stats['overdue'] = $this->db->query("SELECT COUNT(*) FROM rentals WHERE end_date < CURRENT_DATE() AND status = 'ON_GOING'")->fetchColumn() ?: 0;
        return $stats;
    }

    public function getRentals($search = '', $status = '') {
        $sql = "SELECT r.*, u.full_name AS customer_name, u.company_name AS customer_company, e.name AS equipment_name, e.equipment_code 
                FROM rentals r JOIN users u ON r.customer_id = u.id JOIN equipments e ON r.equipment_id = e.id WHERE 1=1";
        $params = [];
        if (!empty($search)) {
            $sql .= " AND (r.rental_code LIKE :s OR u.full_name LIKE :s OR e.name LIKE :s)";
            $params[':s'] = "%{$search}%";
        }
        if (!empty($status) && $status !== 'ALL') {
            $sql .= " AND r.status = :status";
            $params[':status'] = $status;
        }
        $stmt = $this->db->prepare($sql . " ORDER BY r.booking_date DESC");
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}

// 2. CONTROLLER: Inisialisasi Data
$rentalModel = new RentalModel();
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$status = isset($_GET['status']) ? trim($_GET['status']) : 'ALL';

$stats = $rentalModel->getRentalStats();
$rentals = $rentalModel->getRentals($search, $status);
$fullName = $_SESSION['full_name'] ?? 'Muhammad Rizki Ramadhani, S.Kom';
?>

<!-- 3. VIEW: Desain Antarmuka Transaksi Rental (HTML5 & CSS3 Premium) -->
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Rental Orders | SBS EquipRent</title>
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

        /* Main Workspace */
        main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
        header { height: 70px; background: var(--surface); border-bottom: 1px solid var(--outline); display: flex; justify-content: space-between; align-items: center; padding: 0 40px; }
        .content-body { padding: 40px; }

        /* Bento Grid Stats */
        .bento-grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .bento-card { background: var(--surface); border: 1px solid var(--outline); border-radius: var(--radius); padding: 24px; transition: all 0.25s; }
        .bento-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.04); }
        .bento-card h4 { font-size: 11px; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .bento-card .val { font-size: 24px; font-weight: 700; color: var(--primary); margin-top: 8px; }

        /* Table Design */
        .table-container { background: var(--surface); border: 1px solid var(--outline); border-radius: var(--radius); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #F8FAFC; padding: 16px 24px; font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; border-bottom: 1px solid var(--outline); }
        td { padding: 18px 24px; font-size: 14px; color: #1E293B; border-bottom: 1px solid var(--outline); }
        
        .badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; text-transform: uppercase; }
        .badge.approved { background: #DCFCE7; color: #15803D; }
        .badge.pending { background: #FEF3C7; color: #D97706; }
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
                <li><a href="index.php?page=rentals" class="active">Rental Orders</a></li>
                <li><a href="#">Maintenance</a></li>
                <li><a href="#">User Management</a></li>
                <li><a href="index.php?page=reports">Reports</a></li>
            </ul>
        </div>
        <a href="index.php?page=logout" style="color: #EF4444; text-decoration: none; font-weight: 700; font-size: 14px;">Logout ➔</a>
    </aside>

    <!-- Main Workspace Kanan -->
    <main>
        <!-- Header -->
        <header>
            <form method="GET" action="">
                <input type="hidden" name="page" value="rentals">
                <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Cari Kode atau Nama Alat..." style="padding: 10px 16px; border: 1px solid var(--outline); border-radius: 20px; width: 300px; outline: none; background: #F8FAFC;">
            </form>
            <div style="text-align: right;">
                <p style="font-weight: 700; font-size: 13px; color: var(--primary);"><?= htmlspecialchars($fullName) ?></p>
                <p style="font-size: 10px; color: var(--secondary); font-weight: 700;">ADMINISTRATOR</p>
            </div>
        </header>

        <!-- Content Body -->
        <div class="content-body">
            <h1 style="color: var(--primary); font-size: 24px; font-weight: 800; margin-bottom: 24px;">Rental Orders</h1>

            <!-- Bento Stats -->
            <div class="bento-grid">
                <div class="bento-card">
                    <h4>Rental Aktif</h4>
                    <div class="val"><?= $stats['active'] ?> Unit</div>
                </div>
                <div class="bento-card">
                    <h4>Jatuh Tempo Hari Ini</h4>
                    <div class="val" style="color: #EA580C;"><?= $stats['due_today'] ?> Unit</div>
                </div>
                <div class="bento-card">
                    <h4>Terlambat Pengembalian</h4>
                    <div class="val" style="color: #EF4444;"><?= $stats['overdue'] ?> Unit</div>
                </div>
            </div>

            <!-- Tabel Data Rental -->
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Kode Rental</th>
                            <th>Pelanggan</th>
                            <th>Alat Berat</th>
                            <th>Status</th>
                            <th>Durasi</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($rentals as $r): ?>
                            <tr>
                                <td style="font-weight: 700; color: var(--primary);"><?= htmlspecialchars($r['rental_code']) ?></td>
                                <td><strong><?= htmlspecialchars($r['customer_company'] ?: $r['customer_name']) ?></strong></td>
                                <td><?= htmlspecialchars($r['equipment_name']) ?></td>
                                <td>
                                    <?php $badge = strtolower($r['status']) === 'approved' || strtolower($r['status']) === 'on_going' ? 'approved' : 'pending'; ?>
                                    <span class="badge <?= $badge ?>"><?= htmlspecialchars($r['status']) ?></span>
                                </td>
                                <td><?= htmlspecialchars($r['total_days']) ?> Hari</td>
                                <td style="font-weight: 700;">Rp <?= number_format($r['subtotal'], 0, ',', '.') ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</body>
</html>
