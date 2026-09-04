<?php
/**
 * ============================================================================
 * MODUL LENGKAP: User & Role Management (Gabungan Slim)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 */
session_start();

// Validasi Hak Akses Admin (Controller Layer)
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'ADMIN') {
    header("Location: index.php?page=login");
    exit;
}

// 1. MODEL: UserModel (Mengelola Aktor Pengguna & Peran)
class UserModel {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getUserStats() {
        $stats = [];
        $stats['total'] = $this->db->query("SELECT COUNT(*) FROM users")->fetchColumn() ?: 0;
        $stats['admins'] = $this->db->query("SELECT COUNT(*) FROM users WHERE role_id = 1")->fetchColumn() ?: 0;
        $stats['staff'] = $this->db->query("SELECT COUNT(*) FROM users WHERE role_id = 2")->fetchColumn() ?: 0;
        $stats['customers'] = $this->db->query("SELECT COUNT(*) FROM users WHERE role_id = 3")->fetchColumn() ?: 0;
        return $stats;
    }

    public function getUsers($search = '', $roleFilter = '') {
        $sql = "SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE 1=1";
        $params = [];

        if (!empty($search)) {
            $sql .= " AND (u.full_name LIKE :search OR u.email LIKE :search OR u.username LIKE :search)";
            $params[':search'] = '%' . $search . '%';
        }

        if (!empty($roleFilter) && $roleFilter !== 'ALL') {
            $sql .= " AND r.role_name = :role_filter";
            $params[':role_filter'] = strtoupper(trim($roleFilter));
        }

        $stmt = $this->db->prepare($sql . " ORDER BY u.id DESC");
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}

// 2. CONTROLLER: Inisialisasi Data & Filter Pengguna
$userModel = new UserModel();
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$roleFilter = isset($_GET['role_filter']) ? trim($_GET['role_filter']) : 'ALL';

$stats = $userModel->getUserStats();
$usersList = $userModel->getUsers($search, $roleFilter);
$fullName = $_SESSION['full_name'] ?? 'Muhammad Rizki Ramadhani, S.Kom';
?>

<!-- 3. VIEW: Antarmuka Visual Pengguna & Peran (HTML5 & CSS3 Premium) -->
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>User Management | SBS EquipRent</title>
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

        /* Main Area Workspace */
        main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
        header { height: 70px; background: var(--surface); border-bottom: 1px solid var(--outline); display: flex; justify-content: space-between; align-items: center; padding: 0 40px; }
        .content-body { padding: 40px; }

        /* Bento Grid Stats */
        .bento-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
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
        .badge.admin { background: #FEE2E2; color: #991B1B; }
        .badge.staff { background: #DBEAFE; color: #1E40AF; }
        .badge.customer { background: #DCFCE7; color: #15803D; }
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
                <li><a href="index.php?page=users" class="active">User Management</a></li>
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
                <input type="hidden" name="page" value="users">
                <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Cari Nama, Email, Perusahaan..." style="padding: 10px 16px; border: 1px solid var(--outline); border-radius: 20px; width: 320px; outline: none; background: #F8FAFC;">
            </form>
            <div style="text-align: right;">
                <p style="font-weight: 700; font-size: 13px; color: var(--primary);"><?= htmlspecialchars($fullName) ?></p>
                <p style="font-size: 10px; color: var(--secondary); font-weight: 700;">ADMINISTRATOR</p>
            </div>
        </header>

        <!-- Content Body -->
        <div class="content-body">
            <h1 style="color: var(--primary); font-size: 24px; font-weight: 800; margin-bottom: 24px;">User Management</h1>

            <!-- Bento Stats -->
            <div class="bento-grid">
                <div class="bento-card">
                    <h4>Total Pengguna</h4>
                    <div class="val"><?= $stats['total'] ?> Aktor</div>
                </div>
                <div class="bento-card">
                    <h4>Administrator</h4>
                    <div class="val"><?= $stats['admins'] ?> Akun</div>
                </div>
                <div class="bento-card">
                    <h4>Staff Operasional</h4>
                    <div class="val"><?= $stats['staff'] ?> Akun</div>
                </div>
                <div class="bento-card" style="border-left: 4px solid var(--primary);">
                    <h4>Pelanggan Terdaftar</h4>
                    <div class="val"><?= $stats['customers'] ?> Perusahaan</div>
                </div>
            </div>

            <!-- Tabel Data Pengguna -->
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nama Lengkap</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Telepon</th>
                            <th>Perusahaan</th>
                            <th>Peran / Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($usersList as $u): ?>
                            <tr>
                                <td><strong><?= htmlspecialchars($u['full_name']) ?></strong></td>
                                <td>@<?= htmlspecialchars($u['username']) ?></td>
                                <td><?= htmlspecialchars($u['email']) ?></td>
                                <td><?= htmlspecialchars($u['phone'] ?: '-') ?></td>
                                <td><?= htmlspecialchars($u['company_name'] ?: '-') ?></td>
                                <td>
                                    <?php 
                                    $roleVal = strtolower($u['role_name']);
                                    $badge = 'customer';
                                    if ($roleVal === 'admin') $badge = 'admin';
                                    elseif ($roleVal === 'staff') $badge = 'staff';
                                    ?>
                                    <span class="badge <?= $badge ?>"><?= htmlspecialchars($u['role_name']) ?></span>
                                </td>
                                <td style="font-weight: 700; color: <?= $u['status'] === 'ACTIVE' ? '#15803D' : '#B91C1C' ?>;"><?= htmlspecialchars($u['status']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</body>
</html>
