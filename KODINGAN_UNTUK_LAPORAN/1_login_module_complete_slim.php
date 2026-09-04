<?php
/**
 * ============================================================================
 * MODUL LENGKAP: Login Model, Controller & View (100% Gabungan & Rapi)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 */
session_start();

// 1. MODEL: UserModel (Diletakkan di dalam modul gabungan)
class UserModel {
    private $db;
    public function __construct() { 
        $this->db = Database::getConnection(); 
    }

    public function getUserByUsernameAndRole($username, $roleName) {
        $sql = "SELECT u.*, r.role_name FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.username = :username AND r.role_name = :role_name AND u.status = 'ACTIVE' LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':username' => $username, ':role_name' => $roleName]);
        return $stmt->fetch();
    }
}

// 2. CONTROLLER: Proses Validasi Autentikasi
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);
    $role = strtoupper(trim($_POST['role']));

    // Memanggil UserModel yang sudah digabung di atas
    $userModel = new UserModel();
    $user = $userModel->getUserByUsernameAndRole($username, $role);

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role_name'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['company'] = $user['company_name'];
        
        // Pengalihan halaman dinamis berdasarkan hak akses
        $redirects = ['ADMIN' => 'admin_dashboard', 'STAFF' => 'staff_dashboard', 'CUSTOMER' => 'customer_dashboard'];
        header("Location: index.php?page=" . $redirects[$role]);
        exit;
    }
    $error = "Username, password, atau role salah.";
}
?>

<!-- 3. VIEW: Desain Antarmuka Pengguna (HTML5 & CSS3 Premium) -->
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Login | SBS EquipRent</title>
    <style>
        :root {
            --primary: #003366;
            --secondary: #475569;
            --background: #F8FAFC;
            --surface: #FFFFFF;
            --radius: 8px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body { background: var(--background); display: flex; height: 100vh; align-items: center; justify-content: center; }
        .login-card { display: flex; width: 900px; height: 550px; background: var(--surface); border-radius: var(--radius); box-shadow: 0 10px 25px rgba(0,0,0,0.08); overflow: hidden; }
        .brand-panel { width: 50%; background: linear-gradient(135deg, #001f3f, var(--primary)); padding: 40px; color: #FFF; display: flex; flex-direction: column; justify-content: space-between; }
        .form-panel { width: 50%; padding: 50px; display: flex; flex-direction: column; justify-content: center; }
        .role-tabs { display: flex; background: #F1F5F9; border-radius: var(--radius); padding: 4px; margin-bottom: 20px; }
        .role-tab { flex: 1; border: none; padding: 8px; background: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.25s; }
        .role-tab.active { background: var(--surface); color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .input-group { margin-bottom: 16px; }
        .input-group label { display: block; font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 6px; }
        .input-group input { width: 100%; padding: 10px 12px; border: 1px solid #E2E8F0; border-radius: var(--radius); transition: all 0.25s; }
        .input-group input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,51,102,0.1); }
        .btn-submit { width: 100%; padding: 12px; background: var(--primary); color: #FFF; border: none; border-radius: var(--radius); font-weight: 700; cursor: pointer; transition: all 0.25s; }
        .btn-submit:hover { transform: translateY(-1.5px); box-shadow: 0 4px 12px rgba(0,51,102,0.15); }
        .error-msg { color: #EF4444; font-size: 13px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="login-card">
        <!-- Panel Kiri: Informasi Aset SBS -->
        <div class="brand-panel">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px; padding-bottom: 20px; border-b: 1px solid rgba(255,255,255,0.1);">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.15);">
                    <span style="font-size: 24px; color: #a7c8ff;">🏗️</span>
                </div>
                <div>
                    <h2 style="font-size: 20px; font-weight: 700; color: #FFFFFF; line-height: 1; margin: 0;">SBS EquipRent</h2>
                    <p style="font-size: 9px; font-weight: 600; color: #a7c8ff; letter-spacing: 0.08em; margin: 5px 0 0 0; text-transform: uppercase; font-family: monospace;">PT. SURYA BANGUN SARANA</p>
                </div>
            </div>
            <div>
                <h1 style="font-size: 28px; margin-bottom: 10px;">Reliability in every heavy operation.</h1>
                <p style="opacity: 0.8; font-size: 14px;">Enterprise-grade fleet management for construction, logistics, and heavy machinery operations.</p>
            </div>
            <p style="font-size: 11px; opacity: 0.5;">FLEET MANAGER ADMIN TERMINAL v4.2.0</p>
        </div>

        <!-- Panel Kanan: Form input credentials -->
        <div class="form-panel">
            <h2 style="color: var(--primary); margin-bottom: 6px;">Welcome Back</h2>
            <p style="color: var(--secondary); font-size: 14px; margin-bottom: 24px;">Please enter your credentials to access your terminal.</p>
            
            <?php if (isset($error)): ?><div class="error-msg"><?= $error ?></div><?php endif; ?>

            <form method="POST" action="">
                <!-- Pilihan role multi-aktor -->
                <div class="role-tabs">
                    <button type="button" class="role-tab active" onclick="setRole('ADMIN', this)">ADMIN</button>
                    <button type="button" class="role-tab" onclick="setRole('STAFF', this)">STAFF</button>
                    <button type="button" class="role-tab" onclick="setRole('CUSTOMER', this)">CUSTOMER</button>
                </div>
                <input type="hidden" name="role" id="selectedRole" value="ADMIN">

                <div class="input-group">
                    <label id="usernameLabel">Admin Username</label>
                    <input type="text" name="username" placeholder="Masukkan username..." required>
                </div>
                <div class="input-group">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="••••••" required>
                </div>

                <button type="submit" class="btn-submit">MASUK ➔</button>
            </form>
        </div>
    </div>

    <script>
        function setRole(role, btn) {
            document.getElementById('selectedRole').value = role;
            document.querySelectorAll('.role-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('usernameLabel').textContent = role.charAt(0) + role.slice(1).toLowerCase() + ' Username';
        }
    </script>
</body>
</html>
