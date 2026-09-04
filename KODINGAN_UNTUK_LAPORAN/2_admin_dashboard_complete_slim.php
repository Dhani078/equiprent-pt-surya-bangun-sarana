<?php
/**
 * ============================================================================
 * MODUL LENGKAP: Admin Dashboard Model, Controller & View (Gabungan Slim)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 */
session_start();

// Validasi Hak Akses Admin (Controller Layer)
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'ADMIN') {
    header("Location: index.php?page=login");
    exit;
}

// 1. MODEL: DashboardModel (Agregasi Data Riil Database)
class DashboardModel {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getAdminStats() {
        $stats = [];
        $stats['total_revenue'] = $this->db->query("SELECT SUM(amount) FROM payments WHERE status = 'PAID'")->fetchColumn() ?: 0;
        $stats['total_equipments'] = $this->db->query("SELECT COUNT(*) FROM equipments")->fetchColumn() ?: 0;
        $stats['total_customers'] = $this->db->query("SELECT COUNT(*) FROM users WHERE role_id = 3")->fetchColumn() ?: 0;
        $stats['total_rentals'] = $this->db->query("SELECT COUNT(*) FROM rentals")->fetchColumn() ?: 0;
        return $stats;
    }

    public function getRecentRentals() {
        $sql = "SELECT r.rental_code AS order_id, c.full_name AS customer, eq.name AS equipment, r.status, r.subtotal AS amount
                FROM rentals r JOIN equipments eq ON r.equipment_id = eq.id JOIN users c ON r.customer_id = c.id
                ORDER BY r.booking_date DESC LIMIT 5";
        return $this->db->query($sql)->fetchAll();
    }

    public function getUrgentMaintenance() {
        $sql = "SELECT m.maintenance_code, m.scheduled_date, m.maintenance_type, m.status, eq.name AS equipment_name, eq.equipment_code
                FROM maintenance m JOIN equipments eq ON m.equipment_id = eq.id
                WHERE m.status IN ('SCHEDULED', 'IN_PROGRESS') ORDER BY m.scheduled_date ASC LIMIT 3";
        return $this->db->query($sql)->fetchAll();
    }
}

// Mengambil Data untuk Rendering
$dashboardModel = new DashboardModel();
$stats = $dashboardModel->getAdminStats();
$recentRentals = $dashboardModel->getRecentRentals();
$urgentMaint = $dashboardModel->getUrgentMaintenance();
$fullName = $_SESSION['full_name'] ?? 'Muhammad Rizki Ramadhani, S.Kom';
?>

<!-- 2. VIEW: Tata Letak Dashboard (HTML5 & CSS3 Premium) -->
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Dashboard | SBS EquipRent</title>
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
        aside { width: 260px; background: var(--surface); border-r: 1px solid var(--outline); padding: 24px; display: flex; flex-direction: column; justify-content: space-between; border-right: 1px solid var(--outline); }
        .nav-links { list-style: none; margin-top: 32px; }
        .nav-links li a { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--secondary); text-decoration: none; font-weight: 600; border-radius: var(--radius); transition: all 0.25s; }
        .nav-links li a.active { background: #E0F2FE; color: var(--primary); }
        .nav-links li a:hover:not(.active) { background: #F1F5F9; color: var(--primary); }

        /* Main Workspace */
        main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
        header { height: 70px; background: var(--surface); border-bottom: 1px solid var(--outline); display: flex; justify-content: space-between; align-items: center; padding: 0 40px; }
        .content-body { padding: 40px; }
        .breadcrumb { font-size: 11px; font-weight: 700; color: var(--secondary); letter-spacing: 1px; margin-bottom: 24px; text-transform: uppercase; }

        /* Bento Grid Stats Card */
        .bento-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .bento-card { background: var(--surface); border: 1px solid var(--outline); border-radius: var(--radius); padding: 24px; display: flex; flex-direction: column; justify-content: space-between; height: 130px; position: relative; transition: all 0.25s; }
        .bento-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.04); }
        .bento-card h4 { font-size: 11px; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .bento-card .val { font-size: 28px; font-weight: 700; color: var(--primary); margin-top: 8px; }
        .bento-card .trend { position: absolute; top: 24px; right: 24px; font-size: 11px; font-weight: 700; color: #10B981; }

        /* Split Section: Chart & Maintenance */
        .split-section { display: grid; grid-template-cols: 2fr 1fr; gap: 24px; }
        .chart-container, .maintenance-container { background: var(--surface); border: 1px solid var(--outline); border-radius: var(--radius); padding: 24px; }
        
        /* Maintenance Work Orders */
        .maint-list { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
        .maint-item { border: 1px solid var(--outline); border-radius: 6px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
        .maint-badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 99px; text-transform: uppercase; }
        .maint-badge.urgent { background: #FEE2E2; color: #EF4444; }
    </style>
</head>
<body>
    <!-- Sidebar Kiri -->
    <aside>
        <div>
            <h2 style="color: var(--primary); font-weight: 800;">SBS EquipRent</h2>
            <p style="font-size: 10px; color: var(--secondary); letter-spacing: 1px; font-weight: 700;">ADMIN TERMINAL</p>
            <ul class="nav-links">
                <li><a href="#" class="active">Dashboard</a></li>
                <li><a href="#">Equipment Inventory</a></li>
                <li><a href="#">Rental Orders</a></li>
                <li><a href="#">Maintenance</a></li>
                <li><a href="#">User Management</a></li>
                <li><a href="#">Reports</a></li>
            </ul>
        </div>
        <a href="index.php?page=logout" style="color: #EF4444; text-decoration: none; font-weight: 700; font-size: 14px;">Logout ➔</a>
    </aside>

    <!-- Main Workspace Kanan -->
    <main>
        <!-- Header -->
        <header>
            <input type="text" placeholder="Cari Kode atau Nama Alat..." style="padding: 10px 16px; border: 1px solid var(--outline); border-radius: 20px; width: 300px; outline: none; background: #F8FAFC;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="text-align: right;">
                    <p style="font-weight: 700; font-size: 13px; color: var(--primary);"><?= htmlspecialchars($fullName) ?></p>
                    <p style="font-size: 10px; color: var(--secondary); font-weight: 700;">ADMINISTRATOR</p>
                </div>
            </div>
        </header>

        <!-- Content Body -->
        <div class="content-body">
            <div class="breadcrumb">DASHBOARD &gt; OVERVIEW</div>

            <!-- Bento Stats Grid -->
            <div class="bento-grid">
                <div class="bento-card">
                    <h4>Total Alat</h4>
                    <div class="val"><?= $stats['total_equipments'] ?></div>
                    <div class="trend">+12%</div>
                </div>
                <div class="bento-card">
                    <h4>Total Customer</h4>
                    <div class="val"><?= $stats['total_customers'] ?></div>
                    <div class="trend">+8.4%</div>
                </div>
                <div class="bento-card">
                    <h4>Total Rental</h4>
                    <div class="val"><?= $stats['total_rentals'] ?></div>
                    <div class="trend" style="color: #0284C7;">Active Now</div>
                </div>
                <div class="bento-card">
                    <h4>Total Pendapatan</h4>
                    <div class="val">Rp <?= number_format($stats['total_revenue'] / 1000000, 1) ?>M</div>
                    <div class="trend">Rp 2.4M</div>
                </div>
            </div>

            <!-- Split Section -->
            <div class="split-section">
                <!-- Tren Penyewaan Bulanan (Visual Line Chart) -->
                <div class="chart-container">
                    <h3 style="color: var(--primary); font-size: 18px; margin-bottom: 20px;">Tren Penyewaan Bulanan</h3>
                    <!-- SVG Line Chart High Fidelity -->
                    <svg viewBox="0 0 600 250" style="width: 100%; height: auto;">
                        <line x1="50" y1="20" x2="50" y2="200" stroke="#E2E8F0" stroke-width="1"></line>
                        <line x1="50" y1="200" x2="550" y2="200" stroke="#E2E8F0" stroke-width="1"></line>
                        <!-- Grid lines -->
                        <line x1="50" y1="140" x2="550" y2="140" stroke="#F1F5F9" stroke-width="1"></line>
                        <line x1="50" y1="80" x2="550" y2="80" stroke="#F1F5F9" stroke-width="1"></line>
                        <!-- Chart Line -->
                        <path d="M 50 140 C 150 100, 250 160, 350 80 S 450 120, 550 40" fill="none" stroke="#003366" stroke-width="3"></path>
                        <!-- Data Dots -->
                        <circle cx="50" cy="140" r="5" fill="#003366"></circle>
                        <circle cx="150" cy="115" r="5" fill="#003366"></circle>
                        <circle cx="250" cy="140" r="5" fill="#003366"></circle>
                        <circle cx="350" cy="90" r="5" fill="#003366"></circle>
                        <circle cx="450" cy="105" r="5" fill="#003366"></circle>
                        <circle cx="550" cy="40" r="5" fill="#003366"></circle>
                        <!-- Text Labels -->
                        <text x="45" y="220" font-size="10" fill="#475569">Jan</text>
                        <text x="145" y="220" font-size="10" fill="#475569">Feb</text>
                        <text x="245" y="220" font-size="10" fill="#475569">Mar</text>
                        <text x="345" y="220" font-size="10" fill="#475569">Apr</text>
                        <text x="445" y="220" font-size="10" fill="#475569">May</text>
                        <text x="545" y="220" font-size="10" fill="#475569">Jun</text>
                    </svg>
                </div>

                <!-- Maintenance Logs -->
                <div class="maintenance-container">
                    <h3 style="color: var(--primary); font-size: 18px; margin-bottom: 6px;">Maintenance</h3>
                    <p style="color: var(--secondary); font-size: 12px; margin-bottom: 20px;">Agenda perbaikan suku cadang terjadwal</p>
                    <div class="maint-list">
                        <?php foreach ($urgentMaint as $m): ?>
                            <div class="maint-item">
                                <div>
                                    <h4 style="font-size: 12px; color: var(--primary);"><?= htmlspecialchars($m['equipment_code']) ?></h4>
                                    <p style="font-size: 10px; color: var(--secondary); margin-top: 2px;"><?= htmlspecialchars($m['maintenance_type']) ?></p>
                                </div>
                                <span class="maint-badge urgent">TODAY</span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>
    </main>
</body>
</html>
