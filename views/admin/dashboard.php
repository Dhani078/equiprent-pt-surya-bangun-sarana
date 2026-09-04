<?php
/**
 * ============================================================================
 * VIEW: views/admin/dashboard.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Antarmuka Panel Kendali Utama (Dashboard) Administrator.
 * Menyajikan visualisasi tren penyewaan, pemeliharaan kritis, dan log aktivitas.
 * 
 * INTEGRITAS VISUAL MUTLAK (100% REPLIKASI DOM DARI PROTOTIPE ASLI STITCH):
 * - Menggunakan CSS Utility Tailwind Terintegrasi
 * - 4 Summary Cards Atas dengan Layout Rapat
 * - Sidebar Navigation 260px Berbasis Rute Dinamis
 * - Chart.js Monthly Trend Line
 * - Panel Pemeliharaan (Urgent) Dinamis
 * - Tabel Transaksi Sewa Terbaru Dinamis
 * - Panel Akses Cepat Peta Telemetri GPS
 */

$fullName = $_SESSION['full_name'] ?? 'Alex Thompson';
$username = $_SESSION['username'] ?? 'admin';
$role = $_SESSION['role'] ?? 'ADMIN';

// Deteksi halaman aktif secara dinamis untuk penyorotan sidebar
$currentPage = $_GET['page'] ?? 'admin_dashboard';

// Agregasi Data Finansial & Operasional
$totalRevenue = $stats['total_revenue'] ?? 0;
$totalEquipments = $stats['total_equipments'] ?? 0;
$totalCustomers = $stats['total_customers'] ?? 0;
$totalRentals = $stats['total_rentals'] ?? 0;

// Format Pendapatan Singkat (Contoh: Rp 102.7M)
$formattedRevenue = 'Rp ' . number_format($totalRevenue / 1000000, 1, '.', '') . 'M';

// Helper sidebar dinamis
function getMenuClass($menuPage, $currentPage) {
    if ($currentPage === $menuPage) {
        return 'bg-secondary-container text-primary border-l-4 border-primary px-4 py-3 font-semibold transition-all cursor-pointer';
    }
    return 'text-on-surface-variant px-4 py-3 hover:bg-surface-container-highest transition-all cursor-pointer';
}

function getIconStyle($menuPage, $currentPage) {
    if ($currentPage === $menuPage) {
        return "font-variation-settings: 'FILL' 1;";
    }
    return "";
}
?>
<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>EquipRent MS - Admin Dashboard</title>
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@500;700&amp;display=swap" rel="stylesheet">
    
    <!-- Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
    
    <!-- Scripts -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "secondary-fixed": "#d5e3fc",
                        "background": "#f7f9fb",
                        "secondary-container": "#d5e3fc",
                        "surface-container-lowest": "#ffffff",
                        "primary": "#001e40",
                        "surface": "#f7f9fb",
                        "primary-fixed-dim": "#a7c8ff",
                        "on-tertiary": "#ffffff",
                        "on-background": "#191c1e",
                        "error-container": "#ffdad6",
                        "primary-fixed": "#d5e3ff",
                        "on-secondary-fixed-variant": "#3a485b",
                        "on-surface": "#191c1e",
                        "on-error": "#ffffff",
                        "tertiary-container": "#003751",
                        "inverse-primary": "#a7c8ff",
                        "on-primary-fixed-variant": "#1f477b",
                        "inverse-surface": "#2d3133",
                        "surface-container-highest": "#e0e3e5",
                        "outline": "#737780",
                        "outline-variant": "#c3c6d1",
                        "on-primary-container": "#799dd6",
                        "secondary-fixed-dim": "#b9c7df",
                        "on-secondary-container": "#57657a",
                        "surface-bright": "#f7f9fb",
                        "on-primary": "#ffffff",
                        "surface-container-low": "#f2f4f6",
                        "on-surface-variant": "#43474f",
                        "on-primary-fixed": "#001b3c",
                        "error": "#ba1a1a",
                        "primary-container": "#003366",
                        "surface-tint": "#3a5f94",
                        "inverse-on-surface": "#eff1f3",
                        "on-secondary": "#ffffff",
                        "tertiary-fixed-dim": "#89ceff",
                        "surface-container": "#eceef0",
                        "surface-variant": "#e0e3e5",
                        "on-secondary-fixed": "#0d1c2e",
                        "on-tertiary-fixed-variant": "#004c6e",
                        "on-error-container": "#93000a",
                        "tertiary": "#002133",
                        "tertiary-fixed": "#c9e6ff",
                        "on-tertiary-fixed": "#001e2f",
                        "secondary": "#515f74",
                        "surface-dim": "#d8dadc",
                        "on-tertiary-container": "#0fa5e9",
                        "surface-container-high": "#e6e8ea"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "grid-gutter": "20px",
                        "sidebar-width": "260px",
                        "container-padding": "24px",
                        "base": "4px",
                        "element-gap": "16px"
                    },
                    "fontFamily": {
                        "label-caps": ["JetBrains Mono"],
                        "body-md": ["Hanken Grotesk"],
                        "display-lg": ["Hanken Grotesk"],
                        "headline-sm": ["Hanken Grotesk"],
                        "table-header": ["Hanken Grotesk"],
                        "body-lg": ["Hanken Grotesk"],
                        "headline-md": ["Hanken Grotesk"]
                    },
                    "fontSize": {
                        "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500"}],
                        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                        "display-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                        "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                        "table-header": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
                        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                        "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}]
                    }
                }
            }
        }
    </script>
    <style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body {
            font-family: 'Hanken Grotesk', sans-serif;
            background-color: #f7f9fb;
        }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    </style>
</head>
<body class="flex min-h-screen">

    <!-- SideNavBar Component (100% Stitch DOM Alignment) -->
    <aside id="sidebarMenu" class="fixed left-0 top-0 h-full w-[260px] bg-surface-container-low border-r border-outline-variant hidden lg:flex flex-col z-50">
        <div class="px-6 py-8 flex flex-col items-start">
            <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
                    <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">construction</span>
                </div>
                <div>
                    <h1 class="font-headline-sm text-headline-sm font-bold text-primary">SBS EquipRent</h1>
                    <p class="font-label-caps text-label-caps text-on-surface-variant opacity-70">Admin Terminal</p>
                </div>
            </div>
        </div>
        
        <nav class="flex-1 px-4 sidebar-scroll overflow-y-auto">
            <div class="space-y-1">
                <!-- 1. Dashboard -->
                <a class="flex items-center gap-4 <?= getMenuClass('admin_dashboard', $currentPage) ?>" href="index.php?page=admin_dashboard">
                    <span class="material-symbols-outlined" style="<?= getIconStyle('admin_dashboard', $currentPage) ?>">dashboard</span>
                    <span class="font-label-caps text-label-caps">Dashboard</span>
                </a>
                
                <!-- 2. Equipment Inventory -->
                <a class="flex items-center gap-4 <?= getMenuClass('equipment', $currentPage) ?>" href="index.php?page=equipment">
                    <span class="material-symbols-outlined" style="<?= getIconStyle('equipment', $currentPage) ?>">construction</span>
                    <span class="font-label-caps text-label-caps">Equipment Inventory</span>
                </a>
                
                <!-- 3. Rental Orders -->
                <a class="flex items-center gap-4 <?= getMenuClass('rentals', $currentPage) ?>" href="index.php?page=rentals">
                    <span class="material-symbols-outlined" style="<?= getIconStyle('rentals', $currentPage) ?>">receipt_long</span>
                    <span class="font-label-caps text-label-caps">Rental Orders</span>
                </a>
                
                <!-- 4. Maintenance -->
                <a class="flex items-center gap-4 <?= getMenuClass('maintenance', $currentPage) ?>" href="index.php?page=maintenance">
                    <span class="material-symbols-outlined" style="<?= getIconStyle('maintenance', $currentPage) ?>">build</span>
                    <span class="font-label-caps text-label-caps">Maintenance</span>
                </a>
                
                <!-- 5. User Management -->
                <a class="flex items-center gap-4 <?= getMenuClass('users', $currentPage) ?>" href="index.php?page=users">
                    <span class="material-symbols-outlined" style="<?= getIconStyle('users', $currentPage) ?>">group</span>
                    <span class="font-label-caps text-label-caps">User Management</span>
                </a>
                
                <!-- 6. Reports -->
                <a class="flex items-center gap-4 <?= getMenuClass('reports', $currentPage) ?>" href="index.php?page=reports">
                    <span class="material-symbols-outlined" style="<?= getIconStyle('reports', $currentPage) ?>">analytics</span>
                    <span class="font-label-caps text-label-caps">Reports</span>
                </a>
            </div>
        </nav>
        
        <div class="px-4 py-6 border-t border-outline-variant">
            <a class="flex items-center gap-4 <?= $currentPage === 'admin_settings' ? 'text-primary bg-secondary-container font-semibold rounded-lg' : 'text-on-surface-variant' ?> px-4 py-3 hover:bg-surface-container-highest transition-all cursor-pointer" href="index.php?page=admin_settings">
                <span class="material-symbols-outlined" style="<?= $currentPage === 'admin_settings' ? 'font-variation-settings: \'FILL\' 1;' : '' ?>">settings</span>
                <span class="font-label-caps text-label-caps">Settings</span>
            </a>
            <a class="flex items-center gap-4 text-on-surface-variant px-4 py-3 hover:bg-surface-container-highest transition-all cursor-pointer" href="index.php?page=logout">
                <span class="material-symbols-outlined text-error">logout</span>
                <span class="font-label-caps text-label-caps text-error">Logout</span>
            </a>
        </div>
    </aside>

    <!-- Main Content Area -->
    <main class="ml-0 lg:ml-[260px] flex-1 flex flex-col min-h-screen">
        <!-- TopAppBar Component -->
        <header class="fixed top-0 right-0 z-40 h-16 w-full lg:w-[calc(100%-260px)] bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-container-padding">
            <div class="flex items-center flex-1 max-w-xl gap-3">
                <button id="sidebarToggleBtn" class="lg:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined">menu</span>
                </button>
                <div class="relative w-full group">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                    <input id="searchInputField" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-10 pr-4 font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="Cari Kode atau Nama Alat..." type="text">
                </div>
            </div>
            
            <div class="flex items-center gap-4 relative">
                <!-- Notifications Menu -->
                <div class="relative">
                    <button id="notiBellBtn" class="relative p-2 text-on-surface-variant hover:text-primary transition-colors">
                        <span class="material-symbols-outlined">notifications</span>
                        <span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
                    </button>
                    <!-- Notifications Dropdown -->
                    <div id="notiDropdownMenu" class="hidden absolute right-0 top-12 w-80 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-3 z-50 text-left">
                        <div class="px-4 pb-2 border-b border-outline-variant flex justify-between items-center">
                            <span class="font-body-md font-bold text-primary">Notifikasi</span>
                            <span class="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">2 Baru</span>
                        </div>
                        <div class="max-h-60 overflow-y-auto">
                            <div class="px-4 py-3 hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
                                <p class="text-body-md font-semibold text-on-surface">Peringatan HM Alat Berat</p>
                                <p class="text-xs text-on-surface-variant mt-0.5">Excavator #EQ-004 melewati batas HM servis berkala.</p>
                                <p class="text-[10px] text-primary mt-1">10 menit yang lalu</p>
                            </div>
                            <div class="px-4 py-3 hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
                                <p class="text-body-md font-semibold text-on-surface">Kontrak Sewa Ditandatangani</p>
                                <p class="text-xs text-on-surface-variant mt-0.5">Customer Hendra Wijaya menandatangani Kontrak #C-003.</p>
                                <p class="text-[10px] text-primary mt-1">2 jam yang lalu</p>
                            </div>
                        </div>
                        <div class="px-4 pt-2 text-center">
                            <a href="#" class="text-xs text-primary font-bold hover:underline">Tandai sudah dibaca</a>
                        </div>
                    </div>
                </div>

                <!-- Help Button -->
                <button id="helpOutlineBtn" class="p-2 text-on-surface-variant hover:text-primary transition-colors">
                    <span class="material-symbols-outlined">help</span>
                </button>
                
                <div class="h-8 w-[1px] bg-outline-variant mx-2"></div>
                
                <!-- Profile Dropdown -->
                <div class="relative">
                    <button id="profileDropBtn" class="flex items-center gap-3 group cursor-pointer">
                        <div class="text-right hidden lg:block whitespace-nowrap">
                            <p class="font-body-md text-body-md font-semibold text-on-surface"><?= htmlspecialchars($fullName) ?></p>
                            <p class="font-label-caps text-[10px] text-on-surface-variant"><?= htmlspecialchars($role) ?></p>
                        </div>
                        <img alt="<?= htmlspecialchars($fullName) ?> Profile Avatar" class="w-10 h-10 rounded-full border-2 border-outline-variant group-hover:border-primary transition-colors object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrBcmSrnbntWcia3KJnw26tekj6DtmNQuQxMmeVth0yipYVzgWLeDhFWq9fIET29MTnXHcphawH84GtX0QKUn674CECR_Ert7pJx5Kg7iwaIhEqarxhPCOm_oJUcMiipl1TeEEBzjC0nvlKYotrhSpK34vIenu58vwJoz_1IQwMcWIpVjNtvyEySMiIfsUJNIT3lu6V6MOK3cAocedDaF_2_eeDdYGRYmrr81bVFgYOECUv49rqJVcLeLzUEuVzC-8korifSzbteMw">
                    </button>
                    <!-- Profile Dropdown Menu -->
                    <div id="profileDropdownMenu" class="hidden absolute right-0 top-12 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-2 z-50 text-left">
                        <a href="index.php?page=admin_dashboard" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
                            <span class="material-symbols-outlined text-sm">dashboard</span>
                            <span>Dashboard</span>
                        </a>
                        <a href="index.php?page=admin_settings" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
                            <span class="material-symbols-outlined text-sm">settings</span>
                            <span>Pengaturan</span>
                        </a>
                        <div class="border-t border-outline-variant my-1"></div>
                        <a href="index.php?page=logout" class="flex items-center gap-2 px-4 py-2 text-body-md text-error hover:bg-error-container/10 transition-colors font-bold">
                            <span class="material-symbols-outlined text-sm">logout</span>
                            <span>Keluar</span>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Spacer to push content down under the fixed header -->
        <div class="h-16"></div>

        <!-- Scrollable Dashboard Content -->
        <div class="p-container-padding flex flex-col gap-grid-gutter">
            <!-- Breadcrumbs -->
            <div class="flex items-center gap-2 text-on-surface-variant font-label-caps text-label-caps">
                <span>DASHBOARD</span>
                <span class="material-symbols-outlined text-[14px]">chevron_right</span>
                <span class="text-primary font-bold">OVERVIEW</span>
            </div>
            
            <!-- Statistic Cards Bento Grid (4 Summary Cards / 100% Stitch) -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-grid-gutter">
                <!-- Card 1: TOTAL ALAT -->
                <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:shadow-lg transition-all group cursor-pointer" onclick="window.location.href='index.php?page=equipment'">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-3 bg-primary-container/10 rounded-lg text-primary">
                            <span class="material-symbols-outlined">construction</span>
                        </div>
                        <span class="text-green-600 flex items-center text-[12px] font-bold">+12%</span>
                    </div>
                    <h3 class="font-label-caps text-label-caps text-on-surface-variant mb-1">TOTAL ALAT</h3>
                    <p class="font-display-lg text-display-lg text-primary font-bold font-mono"><?= number_format($totalEquipments) ?></p>
                </div>

                <!-- Card 2: TOTAL CUSTOMER -->
                <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:shadow-lg transition-all cursor-pointer" onclick="window.location.href='index.php?page=users'">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-3 bg-secondary-container/30 rounded-lg text-secondary">
                            <span class="material-symbols-outlined">group</span>
                        </div>
                        <span class="text-green-600 flex items-center text-[12px] font-bold">+5.4%</span>
                    </div>
                    <h3 class="font-label-caps text-label-caps text-on-surface-variant mb-1">TOTAL CUSTOMER</h3>
                    <p class="font-display-lg text-display-lg text-primary font-bold font-mono"><?= number_format($totalCustomers) ?></p>
                </div>

                <!-- Card 3: TOTAL RENTAL -->
                <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:shadow-lg transition-all cursor-pointer" onclick="window.location.href='index.php?page=rentals'">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-3 bg-tertiary-container/10 rounded-lg text-tertiary-container">
                            <span class="material-symbols-outlined">receipt_long</span>
                        </div>
                        <span class="text-on-tertiary-container flex items-center text-[12px] font-bold">Active Now</span>
                    </div>
                    <h3 class="font-label-caps text-label-caps text-on-surface-variant mb-1">TOTAL RENTAL</h3>
                    <p class="font-display-lg text-display-lg text-primary font-bold font-mono"><?= number_format($totalRentals) ?></p>
                </div>

                <!-- Card 4: TOTAL PENDAPATAN -->
                <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:shadow-lg transition-all">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-3 bg-green-50 rounded-lg text-green-700">
                            <span class="material-symbols-outlined">payments</span>
                        </div>
                        <span class="text-green-600 flex items-center text-[12px] font-bold">Rp 2.4M</span>
                    </div>
                    <h3 class="font-label-caps text-label-caps text-on-surface-variant mb-1">TOTAL PENDAPATAN</h3>
                    <p class="font-display-lg text-display-lg text-primary font-bold font-mono" style="letter-spacing: -0.03em;"><?= $formattedRevenue ?></p>
                </div>
            </div>

            <!-- Charts and Activity Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-grid-gutter">
                <!-- Rental Trend Chart -->
                <div class="lg:col-span-2 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="font-headline-sm text-headline-sm text-primary">Tren Penyewaan Bulanan</h2>
                            <p class="font-body-md text-body-md text-on-surface-variant">Data real-time penyewaan alat berat tahun <?= date('Y') ?></p>
                        </div>
                        <select class="bg-surface-container-low border-none rounded-lg text-body-md font-label-caps px-4 py-2 cursor-pointer focus:ring-primary">
                            <option>Last 6 Months</option>
                            <option>Last 12 Months</option>
                        </select>
                    </div>
                    <div class="h-[300px] w-full">
                        <canvas id="rentalTrendChart"></canvas>
                    </div>
                </div>
                
                <!-- Maintenance Notifications -->
                <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="font-headline-sm text-headline-sm text-primary">Maintenance</h2>
                        <span class="bg-error-container text-on-error-container text-[10px] font-bold px-2 py-0.5 rounded-full">URGENT</span>
                    </div>
                    
                    <div class="space-y-4 flex-1">
                        <?php if (empty($urgentMaintenance)): ?>
                            <div class="p-4 text-center text-on-surface-variant opacity-75">
                                Tidak ada jadwal pemeliharaan kritis saat ini.
                            </div>
                        <?php else: ?>
                            <?php foreach ($urgentMaintenance as $mnt): 
                                $isToday = (trim($mnt['maintenance_status']) === 'IN_PROGRESS');
                                $borderClass = $isToday ? 'border-error' : 'border-outline-variant';
                                $badgeClass = $isToday ? 'text-error' : 'text-on-surface-variant';
                                $badgeText = $isToday ? 'TODAY' : 'SCHEDULED';
                            ?>
                                <div class="p-4 bg-surface-container-low border-l-4 <?= $borderClass ?> rounded-r-lg">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="font-label-caps text-label-caps text-primary"><?= htmlspecialchars($mnt['equipment_code']) ?></span>
                                        <span class="text-[10px] <?= $badgeClass ?> font-bold"><?= $badgeText ?></span>
                                    </div>
                                    <p class="text-body-md font-body-md text-on-surface font-bold"><?= htmlspecialchars($mnt['equipment_name']) ?></p>
                                    <p class="text-body-md font-body-md text-on-surface opacity-80"><?= htmlspecialchars($mnt['description']) ?></p>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                    
                    <button onclick="window.location.href='index.php?page=maintenance'" class="w-full mt-6 py-2 border border-primary text-primary font-label-caps text-label-caps rounded-lg hover:bg-primary hover:text-white transition-all">
                        LIHAT SEMUA JADWAL
                    </button>
                </div>
            </div>

            <!-- Recent Rentals and Activity -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-grid-gutter">
                <!-- Recent Rentals Table -->
                <div class="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
                    <div class="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
                        <h2 class="font-headline-sm text-headline-sm text-primary">Rental Terbaru</h2>
                        <button onclick="window.location.href='index.php?page=rentals'" class="text-primary font-label-caps text-label-caps hover:underline">Lihat Semua</button>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
                                <tr>
                                    <th class="px-6 py-3 font-table-header text-table-header uppercase">Order ID</th>
                                    <th class="px-6 py-3 font-table-header text-table-header uppercase">Customer</th>
                                    <th class="px-6 py-3 font-table-header text-table-header uppercase">Equipment</th>
                                    <th class="px-6 py-3 font-table-header text-table-header uppercase">Status</th>
                                    <th class="px-6 py-3 font-table-header text-table-header uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-outline-variant font-body-md text-body-md">
                                <?php if (empty($recentRentals)): ?>
                                    <tr>
                                        <td colspan="5" class="px-6 py-4 text-center text-on-surface-variant opacity-75">
                                            Tidak ada transaksi sewa terbaru.
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($recentRentals as $rental): 
                                        $badgeColor = 'bg-blue-100 text-blue-700';
                                        $statusLabel = 'Sedang Disewa';
                                        
                                        if ($rental['status'] === 'COMPLETED') {
                                            $badgeColor = 'bg-green-100 text-green-700';
                                            $statusLabel = 'Selesai';
                                        } elseif ($rental['status'] === 'PENDING') {
                                            $badgeColor = 'bg-orange-100 text-orange-700';
                                            $statusLabel = 'Menunggu Pembayaran';
                                        } elseif ($rental['status'] === 'APPROVED') {
                                            $badgeColor = 'bg-green-100 text-green-700';
                                            $statusLabel = 'Disetujui';
                                        } elseif ($rental['status'] === 'REJECTED') {
                                            $badgeColor = 'bg-red-100 text-red-700';
                                            $statusLabel = 'Ditolak';
                                        }
                                    ?>
                                        <tr class="hover:bg-surface-container-low transition-colors">
                                            <td class="px-6 py-4 font-label-caps font-mono font-bold">#<?= htmlspecialchars(substr($rental['order_id'], 8)) ?></td>
                                            <td class="px-6 py-4"><?= htmlspecialchars($rental['customer']) ?></td>
                                            <td class="px-6 py-4"><?= htmlspecialchars($rental['equipment']) ?></td>
                                            <td class="px-6 py-4">
                                                <span class="px-3 py-1 <?= $badgeColor ?> rounded-full text-[12px] font-semibold"><?= $statusLabel ?></span>
                                            </td>
                                            <td class="px-6 py-4 font-bold font-mono">Rp <?= number_format($rental['amount'], 0, ',', '.') ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Recent User Activity -->
                <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                    <h2 class="font-headline-sm text-headline-sm text-primary mb-6">Aktivitas Terbaru</h2>
                    
                    <div class="space-y-6">
                        <div class="flex gap-4 items-start">
                            <div class="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0"></div>
                            <div>
                                <p class="text-body-md font-body-md text-on-surface"><strong>Sarah Parker</strong> mengubah status unit <span class="font-label-caps text-label-caps">#EX-002</span> menjadi Tersedia.</p>
                                <p class="text-[11px] text-on-surface-variant uppercase mt-1">12 MINUTES AGO</p>
                            </div>
                        </div>
                        
                        <div class="flex gap-4 items-start">
                            <div class="w-2 h-2 mt-2 rounded-full bg-outline-variant flex-shrink-0"></div>
                            <div>
                                <p class="text-body-md font-body-md text-on-surface">Sistem memverifikasi pembayaran dari <strong>PT. Jaya Konstruksi</strong> sebesar Rp 45.000.000.</p>
                                <p class="text-[11px] text-on-surface-variant uppercase mt-1">45 MINUTES AGO</p>
                            </div>
                        </div>
                        
                        <div class="flex gap-4 items-start">
                            <div class="w-2 h-2 mt-2 rounded-full bg-outline-variant flex-shrink-0"></div>
                            <div>
                                <p class="text-body-md font-body-md text-on-surface"><strong>John Doe</strong> menambahkan 3 unit baru ke kategori <span class="font-label-caps text-label-caps">WHEEL LOADER</span>.</p>
                                <p class="text-[11px] text-on-surface-variant uppercase mt-1">2 HOURS AGO</p>
                            </div>
                        </div>
                        
                        <div class="flex gap-4 items-start">
                            <div class="w-2 h-2 mt-2 rounded-full bg-error flex-shrink-0"></div>
                            <div>
                                <p class="text-body-md font-body-md text-on-surface">Alert: Unit <span class="font-label-caps text-label-caps">#CR-990</span> mengalami kegagalan transmisi saat penggunaan.</p>
                                <p class="text-[11px] text-on-surface-variant uppercase mt-1">4 HOURS AGO</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- GPS Telemetry Quick Action (Premium Extension) -->
            <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-blue-50 text-primary flex items-center justify-center rounded-lg">
                        <span class="material-symbols-outlined text-[28px]">explore</span>
                    </div>
                    <div>
                        <h3 class="font-headline-sm text-headline-sm text-primary font-bold">Akses Cepat Peta Telemetri GPS Alat</h3>
                        <p class="font-body-md text-body-md text-on-surface-variant">Pantau koordinat latitude/longitude seluruh armada unit secara real-time di Banjarmasin.</p>
                    </div>
                </div>
                <a href="index.php?page=tracking" class="px-6 py-2.5 bg-primary text-white font-label-caps text-label-caps rounded-lg hover:bg-opacity-90 transition-all font-bold">
                    BUKA PETA GPS
                </a>
            </div>

        </div>
    </main>

    <!-- Interactive Help Modal Dialog -->
    <div id="helpModalDialog" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative m-4 animate-fade-in">
            <button id="closeHelpModalCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-4">
                <div class="bg-primary-container p-2.5 rounded-lg text-primary flex items-center justify-center">
                    <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">help</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Bantuan SBS EquipRent</h3>
                    <p class="text-xs text-on-surface-variant">Admin Terminal Guidance System</p>
                </div>
            </div>
            <div class="space-y-3 text-body-md text-on-surface">
                <p>Selamat datang di terminal admin <strong>PT. SURYA BANGUN SARANA BANJARMASIN</strong>. Modul Anda meliputi:</p>
                <ul class="list-disc list-inside space-y-1 text-on-surface-variant pl-2">
                    <li><strong>Dashboard</strong>: Ringkasan metrik finansial & pemeliharaan riil.</li>
                    <li><strong>Equipment</strong>: Kelola inventaris alat berat & Hour Meter.</li>
                    <li><strong>Rental Orders</strong>: Pantau daftar booking & rental pelanggan.</li>
                    <li><strong>Maintenance</strong>: Rencanakan servis berkala & perbaikan unit.</li>
                    <li><strong>User Management</strong>: Kelola admin, staf, & customer.</li>
                    <li><strong>Reports</strong>: Unduh dokumen BAST/Surat Jalan & ekspor data.</li>
                </ul>
                <p class="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant">Gunakan navigasi untuk berpindah antar modul sistem secara aman.</p>
            </div>
            <div class="mt-6 text-right">
                <button id="closeHelpModalOk" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Saya Mengerti</button>
            </div>
        </div>
    </div>

    <script>
        // Chart Initialization — Data Real-Time dari Database
        const ctx = document.getElementById('rentalTrendChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: <?= json_encode($monthlyRentalTrend['labels']) ?>,
                datasets: [{
                    label: 'Jumlah Penyewaan',
                    data: <?= json_encode($monthlyRentalTrend['data']) ?>,
                    borderColor: '#001e40',
                    backgroundColor: 'rgba(0, 30, 64, 0.05)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#001e40',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { 
                            font: { family: 'Hanken Grotesk', size: 12 },
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Hanken Grotesk', size: 12 } }
                    }
                }
            }
        });

        // Hover animations for cards
        document.querySelectorAll('.group').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });

        // Header Functionality (Dropdowns & Modals)
        document.addEventListener('DOMContentLoaded', () => {
            const sidebar = document.getElementById('sidebarMenu');
            const toggleBtn = document.getElementById('sidebarToggleBtn');
            const profileBtn = document.getElementById('profileDropBtn');
            const profileMenu = document.getElementById('profileDropdownMenu');
            const notiBtn = document.getElementById('notiBellBtn');
            const notiMenu = document.getElementById('notiDropdownMenu');
            const helpBtn = document.getElementById('helpOutlineBtn');
            const helpModal = document.getElementById('helpModalDialog');
            const closeHelpCross = document.getElementById('closeHelpModalCross');
            const closeHelpOk = document.getElementById('closeHelpModalOk');

            // Mobile Sidebar Toggle
            if (toggleBtn && sidebar) {
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sidebar.classList.toggle('hidden');
                    sidebar.classList.toggle('flex');
                });
            }

            // Toggle Profile Menu
            if (profileBtn && profileMenu) {
                profileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    profileMenu.classList.toggle('hidden');
                    if (notiMenu) notiMenu.classList.add('hidden');
                });
            }

            // Toggle Notifications
            if (notiBtn && notiMenu) {
                notiBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    notiMenu.classList.toggle('hidden');
                    if (profileMenu) profileMenu.classList.add('hidden');
                });
            }

            // Help Modal actions
            if (helpBtn && helpModal) {
                helpBtn.addEventListener('click', () => {
                    helpModal.classList.remove('hidden');
                });
            }
            if (closeHelpCross && helpModal) {
                closeHelpCross.addEventListener('click', () => {
                    helpModal.classList.add('hidden');
                });
            }
            if (closeHelpOk && helpModal) {
                closeHelpOk.addEventListener('click', () => {
                    helpModal.classList.add('hidden');
                });
            }

            // Close dropdowns & mobile sidebar on clicking outside
            document.addEventListener('click', (e) => {
                if (profileMenu && !profileBtn.contains(e.target)) profileMenu.classList.add('hidden');
                if (notiMenu && !notiBtn.contains(e.target)) notiMenu.classList.add('hidden');
                if (window.innerWidth < 1024 && sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                    sidebar.classList.add('hidden');
                    sidebar.classList.remove('flex');
                }
            });
        });
    </script>
</body>
</html>
