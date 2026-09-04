<?php
/**
 * ============================================================================
 * MODUL LENGKAP: Equipment Model, Controller & View (Gabungan Slim)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 */
session_start();

// Validasi Hak Akses Admin (Controller Layer)
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'ADMIN') {
    header("Location: index.php?page=login");
    exit;
}

// 1. MODEL: EquipmentModel (Kueri Database Terpusat)
class EquipmentModel {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getEquipmentStats() {
        $stats = [];
        $stats['total'] = $this->db->query("SELECT COUNT(*) FROM equipments")->fetchColumn() ?: 0;
        $stats['available'] = $this->db->query("SELECT COUNT(*) FROM equipments WHERE status = 'AVAILABLE'")->fetchColumn() ?: 0;
        $stats['rented'] = $this->db->query("SELECT COUNT(*) FROM equipments WHERE status = 'RENTED'")->fetchColumn() ?: 0;
        $stats['maintenance'] = $this->db->query("SELECT COUNT(*) FROM equipments WHERE status = 'MAINTENANCE'")->fetchColumn() ?: 0;
        return $stats;
    }

    public function getEquipments($search = '') {
        if (!empty($search)) {
            $stmt = $this->db->prepare("SELECT * FROM equipments WHERE name LIKE :s OR equipment_code LIKE :s ORDER BY equipment_code ASC");
            $stmt->execute([':s' => "%{$search}%"]);
            return $stmt->fetchAll();
        }
        return $this->db->query("SELECT * FROM equipments ORDER BY equipment_code ASC")->fetchAll();
    }
}

// 2. CONTROLLER: Inisialisasi Data
$equipmentModel = new EquipmentModel();
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$stats = $equipmentModel->getEquipmentStats();
$equipments = $equipmentModel->getEquipments($search);
$fullName = $_SESSION['full_name'] ?? 'Muhammad Rizki Ramadhani, S.Kom';
?>

<!-- 3. VIEW: Desain Antarmuka Inventaris Alat (HTML5 & CSS3 Premium) -->
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Inventaris Alat Berat | SBS EquipRent</title>
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
        
        /* Sidebar Menu */
        aside { width: 260px; background: var(--surface); border-right: 1px solid var(--outline); padding: 24px; display: flex; flex-direction: column; justify-content: space-between; }
        .nav-links { list-style: none; margin-top: 32px; }
        .nav-links li a { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--secondary); text-decoration: none; font-weight: 600; border-radius: var(--radius); transition: all 0.25s; }
        .nav-links li a.active { background: #E0F2FE; color: var(--primary); }
        .nav-links li a:hover:not(.active) { background: #F1F5F9; color: var(--primary); }

        /* Main Section */
        main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
        header { height: 70px; background: var(--surface); border-bottom: 1px solid var(--outline); display: flex; justify-content: space-between; align-items: center; padding: 0 40px; }
        .content-body { padding: 40px; }

        /* Title Area */
        .title-area { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .btn-add { background: var(--primary); color: #FFF; padding: 10px 20px; border-radius: var(--radius); text-decoration: none; font-weight: 700; font-size: 14px; transition: all 0.25s; border: none; cursor: pointer; }
        .btn-add:hover { transform: translateY(-1.5px); box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15); }

        /* Bento Grid Stats */
        .bento-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .bento-card { background: var(--surface); border: 1px solid var(--outline); border-radius: var(--radius); padding: 24px; position: relative; height: 110px; transition: all 0.25s; }
        .bento-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.04); }
        .bento-card h4 { font-size: 11px; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .bento-card .val { font-size: 28px; font-weight: 700; color: var(--primary); margin-top: 8px; }

        /* Table Design */
        .table-container { background: var(--surface); border: 1px solid var(--outline); border-radius: var(--radius); overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #F8FAFC; padding: 16px 24px; font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; border-bottom: 1px solid var(--outline); }
        td { padding: 18px 24px; font-size: 14px; color: #1E293B; border-bottom: 1px solid var(--outline); vertical-align: middle; }
        
        /* Status Badges */
        .badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; text-transform: capitalize; display: inline-block; }
        .badge.available { background: #DCFCE7; color: #15803D; }
        .badge.rented { background: #DBEAFE; color: #1D4ED8; }
        .badge.maintenance { background: #FEF3C7; color: #D97706; }
        
        /* Action Buttons */
        .action-btn { background: none; border: none; cursor: pointer; color: var(--secondary); font-size: 16px; margin-right: 12px; transition: all 0.25s; }
        .action-btn:hover { color: var(--primary); }
        .action-btn.delete:hover { color: #EF4444; }
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
                <li><a href="index.php?page=equipment" class="active">Equipment Inventory</a></li>
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
            <form method="GET" action="">
                <input type="hidden" name="page" value="equipment">
                <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Cari Kode atau Nama Alat..." style="padding: 10px 16px; border: 1px solid var(--outline); border-radius: 20px; width: 300px; outline: none; background: #F8FAFC;">
            </form>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="text-align: right;">
                    <p style="font-weight: 700; font-size: 13px; color: var(--primary);"><?= htmlspecialchars($fullName) ?></p>
                    <p style="font-size: 10px; color: var(--secondary); font-weight: 700;">ADMINISTRATOR</p>
                </div>
            </div>
        </header>

        <!-- Content Body -->
        <div class="content-body">
            <div class="title-area">
                <div>
                    <h1 style="color: var(--primary); font-size: 24px; font-weight: 800;">Equipment Inventory</h1>
                    <p style="color: var(--secondary); font-size: 14px; margin-top: 4px;">Kelola dan pantau status seluruh unit alat berat.</p>
                </div>
                <button class="btn-add">+ Tambah Alat Baru</button>
            </div>

            <!-- Bento Stats Grid -->
            <div class="bento-grid">
                <div class="bento-card">
                    <h4>Total Unit</h4>
                    <div class="val"><?= $stats['total'] ?></div>
                </div>
                <div class="bento-card">
                    <h4>Tersedia</h4>
                    <div class="val" style="color: #16A34A;"><?= $stats['available'] ?></div>
                </div>
                <div class="bento-card">
                    <h4>Disewa</h4>
                    <div class="val" style="color: #2563EB;"><?= $stats['rented'] ?></div>
                </div>
                <div class="bento-card">
                    <h4>Maintenance</h4>
                    <div class="val" style="color: #EA580C;"><?= $stats['maintenance'] ?></div>
                </div>
            </div>

            <!-- Tabel Inventaris Alat -->
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Kode Alat</th>
                            <th>Nama Alat</th>
                            <th>Kategori</th>
                            <th>Status</th>
                            <th>Harga Sewa / Hari</th>
                            <th style="text-align: center;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($equipments)): ?>
                            <tr>
                                <td colspan="6" style="text-align: center; color: var(--secondary);">Tidak ada alat berat yang terdaftar.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($equipments as $e): ?>
                                <tr>
                                    <td style="font-weight: 700; color: var(--primary);"><?= htmlspecialchars($e['equipment_code']) ?></td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <span style="font-weight: 600;"><?= htmlspecialchars($e['name']) ?></span>
                                        </div>
                                    </td>
                                    <td><?= htmlspecialchars($e['type']) ?></td>
                                    <td>
                                        <?php 
                                            $badgeClass = strtolower($e['status']) === 'available' ? 'available' : (strtolower($e['status']) === 'rented' ? 'rented' : 'maintenance');
                                            $label = strtolower($e['status']) === 'available' ? 'Tersedia' : (strtolower($e['status']) === 'rented' ? 'Disewa' : 'Perbaikan');
                                        ?>
                                        <span class="badge <?= $badgeClass ?>"><?= $label ?></span>
                                    </td>
                                    <td style="font-weight: 600;">Rp <?= number_format($e['rental_price_per_day'], 0, ',', '.') ?></td>
                                    <td style="text-align: center;">
                                        <button class="action-btn">✎</button>
                                        <button class="action-btn">👁</button>
                                        <button class="action-btn delete">🗑</button>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</body>
</html>
