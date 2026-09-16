<?php
/**
 * ============================================================================
 * VIEW: Halaman Sistem — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 *
 * Halaman "Akses Ditolak" dan halaman bukti sesi (dashboard ringkas).
 * Dipisahkan dari `index.php` agar router hanya berisi logika routing.
 *
 * PERBAIKAN KEAMANAN (XSS):
 * Seluruh nilai yang berasal dari sesi atau parameter dicetak melalui
 * `htmlspecialchars()`. Sebelumnya `$requiredRole`, `$currentRole`, dan
 * `$roleName` dicetak mentah, sehingga nilai sesi yang mengandung markup
 * dapat menyuntikkan skrip ke halaman.
 */

/** Pembantu escape HTML yang ringkas & konsisten. */
function sbs_e($nilai): string {
    return htmlspecialchars((string) $nilai, ENT_QUOTES, 'UTF-8');
}

/**
 * Menampilkan Halaman Error Penolakan Akses (Access Denied / Forbidden)
 * Memutus siklus looping redirect tak terbatas antara routing index dan
 * login controller.
 *
 * @param string $requiredRole - Peran yang dibutuhkan oleh halaman
 * @param string $currentRole - Peran yang saat ini dimiliki oleh sesi user
 */
function renderAccessDenied($requiredRole, $currentRole) {
    http_response_code(403);

    // Tujuan tombol "Kembali" dibatasi ke daftar tetap agar nilai sesi tidak
    // pernah ikut masuk ke atribut href.
    $peran = strtoupper(trim((string) $currentRole));
    $dashboard = in_array($peran, ['ADMIN', 'STAFF', 'CUSTOMER'], true)
        ? 'index.php?page=' . strtolower($peran) . '_dashboard'
        : 'index.php?page=login';
    ?>
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Akses Ditolak | EquipRent MS</title>
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@500&family=Material+Symbols+Outlined&display=swap" rel="stylesheet">
        <style>
            :root {
                --color-primary: #003366;
                --color-secondary: #475569;
                --color-error: #ba1a1a;
                --radius-eight: 8px;
            }
            body {
                font-family: 'Hanken Grotesk', sans-serif;
                background-color: #f7f9fb;
                margin: 0;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }
            .error-card {
                background: #ffffff;
                border: 1px solid #ffdad6;
                border-radius: var(--radius-eight);
                padding: 40px;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 10px 25px rgba(186, 26, 26, 0.05);
                text-align: center;
                animation: fadeInUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
            }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .error-icon { font-size: 48px; color: var(--color-error); margin-bottom: 20px; }
            h1 { color: #93000a; font-size: 22px; margin: 0 0 12px 0; font-weight: 700; }
            p { color: var(--color-secondary); font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
            .details {
                background: #fff5f5;
                border: 1px solid #ffdad6;
                border-radius: var(--radius-eight);
                padding: 16px;
                text-align: left;
                margin-bottom: 24px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 13px;
            }
            .btn-group { display: flex; gap: 12px; }
            .btn {
                flex: 1;
                height: 40px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                border-radius: var(--radius-eight);
                font-weight: 600;
                font-size: 13px;
                text-decoration: none;
                transition: all 0.25s ease;
                cursor: pointer;
            }
            .btn-primary {
                background-color: var(--color-primary);
                color: #ffffff;
                border: none;
                box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15);
            }
            .btn-primary:hover { background-color: #001e40; transform: translateY(-1.5px); }
            .btn-secondary {
                background-color: #f1f5f9;
                color: var(--color-secondary);
                border: 1px solid #e2e8f0;
            }
            .btn-secondary:hover { background-color: #e2e8f0; }
        </style>
    </head>
    <body>
        <div class="error-card">
            <span class="material-symbols-outlined error-icon">gpp_maybe</span>
            <h1>Akses Terminal Ditolak</h1>
            <p>Sesi aktif Anda tidak memiliki wewenang untuk membuka halaman ini. Hal ini disebabkan oleh pembatasan keamanan berbasis peran (Role-Based Access Control).</p>

            <div class="details">
                <div>Akses Dibutuhkan: <span style="color:#ba1a1a; font-weight:700;"><?= sbs_e($requiredRole) ?></span></div>
                <div style="margin-top:6px;">Otoritas Sesi Anda: <span style="color:#003366; font-weight:700;"><?= sbs_e($currentRole) ?></span></div>
            </div>

            <div class="btn-group">
                <a href="<?= sbs_e($dashboard) ?>" class="btn btn-primary">Kembali ke Dashboard</a>
                <a href="index.php?page=logout" class="btn btn-secondary">Keluar Sesi</a>
            </div>
        </div>
    </body>
    </html>
    <?php
}

/**
 * Menampilkan halaman ringkas bukti sesi aktif multi-role.
 *
 * @param string $roleName - Nama role aktor yang sedang aktif
 */
function renderDashboard($roleName) {
    $fullName = $_SESSION['full_name'] ?? 'Operator';
    $username = $_SESSION['username'] ?? 'User';
    $company = $_SESSION['company'] ?? 'PT. Surya Bangun Sarana';
    $peran = strtoupper(trim((string) $roleName));
    ?>
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard <?= sbs_e($peran) ?> | EquipRent MS</title>

        <!-- Google Fonts & Material Symbols -->
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@500&family=Material+Symbols+Outlined&display=swap" rel="stylesheet">

        <style>
            :root {
                --color-primary: #003366;       /* Industrial Deep Blue */
                --color-secondary: #475569;     /* Slate Gray */
                --radius-eight: 8px;            /* ROUND_EIGHT */
                --transition-premium: all 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            body {
                font-family: 'Hanken Grotesk', sans-serif;
                background-color: #f7f9fb;
                margin: 0;
                padding: 40px 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }
            .dashboard-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: var(--radius-eight);
                padding: 40px;
                max-width: 600px;
                width: 100%;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                text-align: center;
                animation: fadeInUp 0.45s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
            }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .badge {
                display: inline-block;
                padding: 6px 16px;
                background-color: #d5e3ff;
                color: #001b3c;
                font-family: 'JetBrains Mono', monospace;
                font-size: 12px;
                font-weight: 600;
                border-radius: 9999px;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            h1 { color: var(--color-primary); font-size: 26px; margin: 0 0 8px 0; font-weight: 700; }
            p.subtitle { color: var(--color-secondary); font-size: 15px; margin: 0 0 30px 0; line-height: 1.5; }
            .info-box {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: var(--radius-eight);
                padding: 24px;
                text-align: left;
                margin-bottom: 30px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px dashed #e2e8f0;
            }
            .info-row:last-child { border-bottom: none; padding-bottom: 0; }
            .info-row:first-child { padding-top: 0; }
            .info-label { font-weight: 600; color: var(--color-secondary); font-size: 14px; }
            .info-val {
                font-family: 'JetBrains Mono', monospace;
                color: var(--color-primary);
                font-size: 14px;
                font-weight: 600;
            }
            .btn-group { display: flex; flex-direction: column; gap: 12px; }
            .tracking-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                height: 44px;
                background-color: var(--color-primary);
                color: #ffffff;
                border: none;
                border-radius: var(--radius-eight);
                font-weight: 600;
                font-size: 14px;
                text-decoration: none;
                transition: var(--transition-premium);
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15);
            }
            .tracking-btn:hover {
                background-color: #001e40;
                transform: translateY(-1.5px);
                box-shadow: 0 6px 16px rgba(0, 51, 102, 0.25);
            }
            .tracking-btn:active { transform: translateY(0.5px) scale(0.98); box-shadow: none; }
            .logout-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                height: 44px;
                background-color: #f1f5f9;
                color: var(--color-secondary);
                border: 1px solid #e2e8f0;
                border-radius: var(--radius-eight);
                font-weight: 600;
                font-size: 14px;
                text-decoration: none;
                transition: var(--transition-premium);
                cursor: pointer;
            }
            .logout-btn:hover { background-color: #e2e8f0; color: #EF4444; }
            .logout-btn:active { transform: translateY(0.5px) scale(0.98); }
        </style>
    </head>
    <body>
        <div class="dashboard-card">
            <!-- Badge Verifikasi Sesi Aktif -->
            <span class="badge"><?= sbs_e($peran) ?> Access Verified</span>

            <h1>Otentikasi Berhasil!</h1>
            <p class="subtitle">Sesi Anda telah aman terdaftar di server basis data.</p>

            <!-- Box Detail Biodata User -->
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Nama Lengkap:</span>
                    <span class="info-val"><?= sbs_e($fullName) ?></span>
                </div>
                <div class="info-row">
                    <span class="info-label">ID Operator / Username:</span>
                    <span class="info-val">@<?= sbs_e($username) ?></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Level Otoritas:</span>
                    <span class="info-val"><?= sbs_e($peran) ?></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Perusahaan Afiliasi:</span>
                    <span class="info-val"><?= sbs_e($company) ?></span>
                </div>
            </div>

            <!-- Grouping Action Buttons -->
            <div class="btn-group">
                <?php if ($peran === 'ADMIN' || $peran === 'STAFF'): ?>
                    <!-- Tombol Cepat Menuju Menu Tracking GPS -->
                    <a href="index.php?page=tracking" class="tracking-btn">
                        <span class="material-symbols-outlined" style="font-size:18px;">explore</span>
                        Buka Peta Tracking GPS Real-Time
                    </a>
                <?php endif; ?>

                <!-- Tombol Pemutusan Sesi (Logout) -->
                <a href="index.php?page=logout" class="logout-btn">
                    <span class="material-symbols-outlined" style="font-size:18px;">logout</span>
                    Keluar dari Terminal
                </a>
            </div>
        </div>
    </body>
    </html>
    <?php
}
