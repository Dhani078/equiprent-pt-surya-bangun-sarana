<?php
/**
 * ============================================================================
 * VIEW: views/admin/users.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Halaman Manajemen Pengguna (User Management) Administrator.
 * Menyajikan statistik peran ringkas, tabel daftar pengguna dinamis, 
 * pencarian real-time, filter peran langsung, dan micro-interactions premium.
 * 
 * INTEGRITAS VISUAL MUTLAK (100% REPLIKASI DOM DARI PROTOTIPE ASLI STITCH):
 * - Menggunakan Hanken Grotesk (UI) & JetBrains Mono (Data Log)
 * - Sidebar Navigation 6 Menu utama dari sistem dengan penanda bar aktif
 * - Bento Quick Stats yang menampilkan metrik riil (Total, Admin, Staff, Active)
 * - Skema warna, roundness, dan avatar yang konsisten dengan template asli.
 */

$fullName = $_SESSION['full_name'] ?? 'Alex Thompson';
$role = $_SESSION['role'] ?? 'SENIOR ADMIN';
$currentPage = 'users'; // Menjadikan User Management aktif di menu sidebar

if (!function_exists('getMenuClass')) {
    function getMenuClass($menuPage, $currentPage) {
        if ($currentPage === $menuPage) {
            return 'bg-secondary-container text-primary border-l-4 border-primary px-4 py-3 font-semibold transition-all cursor-pointer';
        }
        return 'text-on-surface-variant px-4 py-3 hover:bg-surface-container-highest transition-all cursor-pointer';
    }
}

if (!function_exists('getIconStyle')) {
    function getIconStyle($menuPage, $currentPage) {
        if ($currentPage === $menuPage) {
            return "font-variation-settings: 'FILL' 1;";
        }
        return "";
    }
}
?>
<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>Fleet Manager | User Management</title>
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@500;700&amp;display=swap" rel="stylesheet">
    
    <!-- Material Symbols -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-primary-fixed-variant": "#1f477b",
                        "error-container": "#ffdad6",
                        "secondary-fixed-dim": "#b9c7df",
                        "primary-fixed": "#d5e3ff",
                        "on-primary": "#ffffff",
                        "on-tertiary-container": "#0fa5e9",
                        "tertiary-container": "#003751",
                        "surface-variant": "#e0e3e5",
                        "on-tertiary-fixed": "#001e2f",
                        "surface-tint": "#3a5f94",
                        "surface-container-low": "#f2f4f6",
                        "outline-variant": "#c3c6d1",
                        "inverse-surface": "#2d3133",
                        "on-surface": "#191c1e",
                        "on-secondary-fixed-variant": "#3a485b",
                        "surface-container-lowest": "#ffffff",
                        "on-secondary-fixed": "#0d1c2e",
                        "primary-fixed-dim": "#a7c8ff",
                        "outline": "#737780",
                        "surface-container-highest": "#e0e3e5",
                        "surface-container": "#eceef0",
                        "primary-container": "#003366",
                        "inverse-primary": "#a7c8ff",
                        "on-surface-variant": "#43474f",
                        "surface-dim": "#d8dadc",
                        "on-primary-container": "#799dd6",
                        "on-tertiary-fixed-variant": "#004c6e",
                        "surface-container-high": "#e6e8ea",
                        "tertiary-fixed-dim": "#89ceff",
                        "surface-bright": "#f7f9fb",
                        "surface": "#f7f9fb",
                        "primary": "#001e40",
                        "secondary-container": "#d5e3fc",
                        "tertiary": "#002133",
                        "inverse-on-surface": "#eff1f3",
                        "background": "#f7f9fb",
                        "on-primary-fixed": "#001b3c",
                        "on-error": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "tertiary-fixed": "#c9e6ff",
                        "on-secondary-container": "#57657a",
                        "error": "#ba1a1a",
                        "on-error-container": "#93000a",
                        "on-background": "#191c1e",
                        "secondary": "#515f74",
                        "on-secondary": "#ffffff",
                        "secondary-fixed": "#d5e3fc"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "element-gap": "16px",
                        "container-padding": "24px",
                        "base": "4px",
                        "sidebar-width": "260px",
                        "grid-gutter": "20px"
                    },
                    "fontFamily": {
                        "label-caps": ["JetBrains Mono"],
                        "body-md": ["Hanken Grotesk"],
                        "body-lg": ["Hanken Grotesk"],
                        "table-header": ["Hanken Grotesk"],
                        "headline-md": ["Hanken Grotesk"],
                        "headline-sm": ["Hanken Grotesk"],
                        "display-lg": ["Hanken Grotesk"]
                    },
                    "fontSize": {
                        "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500"}],
                        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                        "table-header": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
                        "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                        "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                        "display-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}]
                    }
                }
            }
        }
    </script>
    <style>
        body { background-color: #f7f9fb; font-family: 'Hanken Grotesk', sans-serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .sidebar-active-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background-color: #001e40; }
        .stats-card { transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid #e2e8f0; }
        .stats-card:hover { transform: translateY(-2px); box-shadow: 0px 10px 20px rgba(15, 23, 42, 0.04); }
        .user-table-row:nth-child(even) { background-color: #f8fafc; }
        .role-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
        .status-pill { padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
    </style>
</head>
<body class="bg-background text-on-surface">

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

    <!-- TopAppBar Component -->
    <header class="fixed top-0 right-0 z-40 h-16 w-full lg:w-[calc(100%-260px)] bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-container-padding">
        <div class="flex items-center flex-1 max-w-xl gap-3">
            <button id="sidebarToggleBtn" class="lg:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors flex items-center justify-center">
                <span class="material-symbols-outlined">menu</span>
            </button>
            <form action="index.php" method="GET" class="relative w-full group">
                <input type="hidden" name="page" value="users">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input id="searchInputField" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-10 pr-4 font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="Cari Kode atau Nama Alat..." type="text" name="search" value="<?= htmlspecialchars($search ?? '') ?>">
            </form>
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

    <!-- Main Content -->
    <main class="ml-0 lg:ml-[260px] pt-24 px-container-padding pb-container-padding min-h-screen">
        <div class="max-w-[1400px] mx-auto">
            <!-- Page Header -->
            <div class="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
                <div>
                    <nav class="flex items-center gap-2 text-on-surface-variant font-label-caps text-[10px] mb-2">
                        <span>DASHBOARD</span>
                        <span class="material-symbols-outlined text-[12px]" data-icon="chevron_right">chevron_right</span>
                        <span class="text-primary font-bold">USER MANAGEMENT</span>
                    </nav>
                    <h2 class="font-display-lg text-display-lg text-primary font-bold">User Management</h2>
                </div>
                <button id="openAddUserBtn" class="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-body-md font-semibold flex items-center gap-2 hover:bg-primary-container transition-colors shadow-sm whitespace-nowrap">
                    <span class="material-symbols-outlined" data-icon="add">add</span>
                    Add New User
                </button>
            </div>
            
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-grid-gutter mb-8">
                <!-- 1. Total Users -->
                <div class="stats-card bg-surface-container-lowest p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p class="font-label-caps text-on-surface-variant mb-1">TOTAL USERS</p>
                        <h3 class="font-display-lg text-display-lg text-on-surface font-bold"><?= number_format($stats['total']) ?></h3>
                    </div>
                    <div class="text-right">
                        <span class="text-on-tertiary-container font-label-caps font-bold">+12%</span>
                        <div class="mt-2 w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined" data-icon="group">group</span>
                        </div>
                    </div>
                </div>
                
                <!-- 2. Admins -->
                <div class="stats-card bg-surface-container-lowest p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p class="font-label-caps text-on-surface-variant mb-1">ADMINS</p>
                        <h3 class="font-display-lg text-display-lg text-on-surface font-bold"><?= number_format($stats['admins']) ?></h3>
                    </div>
                    <div class="text-right">
                        <span class="text-on-surface-variant font-label-caps">System</span>
                        <div class="mt-2 w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined" data-icon="admin_panel_settings">admin_panel_settings</span>
                        </div>
                    </div>
                </div>
                
                <!-- 3. Staff -->
                <div class="stats-card bg-surface-container-lowest p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p class="font-label-caps text-on-surface-variant mb-1">STAFF</p>
                        <h3 class="font-display-lg text-display-lg text-on-surface font-bold"><?= number_format($stats['staff']) ?></h3>
                    </div>
                    <div class="text-right">
                        <span class="text-on-surface-variant font-label-caps">Logistics</span>
                        <div class="mt-2 w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined" data-icon="engineering">engineering</span>
                        </div>
                    </div>
                </div>
                
                <!-- 4. Active Now -->
                <div class="stats-card bg-surface-container-lowest p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p class="font-label-caps text-on-surface-variant mb-1">ACTIVE NOW</p>
                        <h3 class="font-display-lg text-display-lg text-on-surface font-bold"><?= number_format($stats['active']) ?></h3>
                    </div>
                    <div class="text-right">
                        <span class="text-on-tertiary-container font-label-caps font-bold">Active Now</span>
                        <div class="mt-2 w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined" data-icon="sensors" style="font-variation-settings: 'FILL' 1;">sensors</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Table Controls -->
            <div class="bg-surface-container-lowest border border-outline-variant rounded-t-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 w-full">
                    <form method="GET" action="index.php" class="w-full sm:max-w-md">
                        <input type="hidden" name="page" value="users">
                        <input type="hidden" name="role_filter" value="<?= htmlspecialchars($roleFilter) ?>">
                        <div class="relative w-full">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" data-icon="search">search</span>
                            <input name="search" value="<?= htmlspecialchars($search) ?>" class="w-full bg-surface-bright border border-outline-variant rounded-md py-2 pl-10 pr-4 font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary" placeholder="Filter by name or email..." type="text">
                        </div>
                    </form>
                    
                    <!-- Premium Inline Dropdown Filter -->
                    <div class="flex items-center gap-2 bg-surface-bright border border-outline-variant rounded-md px-3 py-2 cursor-pointer hover:bg-surface-container-low transition-colors relative">
                        <span class="material-symbols-outlined text-[18px]" data-icon="filter_list">filter_list</span>
                        <form id="filterForm" method="GET" action="index.php" class="m-0 p-0 flex items-center">
                            <input type="hidden" name="page" value="users">
                            <input type="hidden" name="search" value="<?= htmlspecialchars($search) ?>">
                            <select name="role_filter" onchange="this.form.submit()" class="bg-transparent border-none p-0 pr-6 font-body-md text-body-md text-on-surface focus:ring-0 cursor-pointer">
                                <option value="ALL" <?= $roleFilter === 'ALL' ? 'selected' : '' ?>>Role: All</option>
                                <option value="ADMIN" <?= $roleFilter === 'ADMIN' ? 'selected' : '' ?>>Role: Admin</option>
                                <option value="STAFF" <?= $roleFilter === 'STAFF' ? 'selected' : '' ?>>Role: Staff</option>
                                <option value="CUSTOMER" <?= $roleFilter === 'CUSTOMER' ? 'selected' : '' ?>>Role: Customer</option>
                            </select>
                        </form>
                    </div>
                </div>
                
                <div class="flex items-center gap-2">
                    <a href="index.php?page=export_users_pdf" target="_blank" class="flex items-center gap-2 border border-outline-variant px-4 py-2 rounded-md font-body-md text-body-md hover:bg-surface-container-low transition-colors text-on-surface">
                        <span class="material-symbols-outlined text-[18px]" data-icon="download">download</span>
                        Export PDF
                    </a>
                    <div class="relative" id="moreMenuWrapper">
                        <button id="moreMenuBtn" class="p-2 border border-outline-variant rounded-md hover:bg-surface-container-low transition-colors text-on-surface-variant">
                            <span class="material-symbols-outlined" data-icon="more_vert">more_vert</span>
                        </button>
                        <div id="moreMenuDropdown" class="hidden absolute right-0 top-11 w-52 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-2 z-50 text-left">
                            <a href="index.php?page=export_users_pdf" target="_blank" class="flex items-center gap-2 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
                                <span class="material-symbols-outlined text-sm">print</span>
                                <span>Cetak Semua Data</span>
                            </a>
                            <a href="index.php?page=users&role_filter=ADMIN" class="flex items-center gap-2 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
                                <span class="material-symbols-outlined text-sm">admin_panel_settings</span>
                                <span>Filter Admin Saja</span>
                            </a>
                            <a href="index.php?page=users&role_filter=STAFF" class="flex items-center gap-2 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
                                <span class="material-symbols-outlined text-sm">badge</span>
                                <span>Filter Staff Saja</span>
                            </a>
                            <a href="index.php?page=users&role_filter=CUSTOMER" class="flex items-center gap-2 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
                                <span class="material-symbols-outlined text-sm">person</span>
                                <span>Filter Customer Saja</span>
                            </a>
                            <div class="border-t border-outline-variant my-1"></div>
                            <a href="index.php?page=users" class="flex items-center gap-2 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
                                <span class="material-symbols-outlined text-sm">restart_alt</span>
                                <span>Reset Filter</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- User Table -->
            <div class="bg-surface-container-lowest border-x border-b border-outline-variant rounded-b-xl overflow-hidden shadow-sm">
                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse">
                    <thead class="bg-surface-container-low text-on-surface-variant">
                        <tr>
                            <th class="px-6 py-4 font-table-header text-table-header uppercase">ID User</th>
                            <th class="px-6 py-4 font-table-header text-table-header uppercase">Name</th>
                            <th class="px-6 py-4 font-table-header text-table-header uppercase">Email</th>
                            <th class="px-6 py-4 font-table-header text-table-header uppercase">Role</th>
                            <th class="px-6 py-4 font-table-header text-table-header uppercase">Status</th>
                            <th class="px-6 py-4 font-table-header text-table-header uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="font-body-md text-body-md divide-y divide-outline-variant">
                        <?php if (empty($usersList)): ?>
                            <tr>
                                <td colspan="6" class="px-6 py-12 text-center text-on-surface-variant opacity-75 font-body-lg">
                                    <span class="material-symbols-outlined text-[48px] mb-2 opacity-50 block">group_off</span>
                                    Tidak ada data pengguna ditemukan.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($usersList as $user): 
                                // Avatars mapping
                                $avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
                                $roleName = strtoupper($user['role_name']);
                                
                                if ($roleName === 'ADMIN') {
                                    $avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrBcmSrnbntWcia3KJnw26tekj6DtmNQuQxMmeVth0yipYVzgWLeDhFWq9fIET29MTnXHcphawH84GtX0QKUn674CECR_Ert7pJx5Kg7iwaIhEqarxhPCOm_oJUcMiipl1TeEEBzjC0nvlKYotrhSpK34vIenu58vwJoz_1IQwMcWIpVjNtvyEySMiIfsUJNIT3lu6V6MOK3cAocedDaF_2_eeDdYGRYmrr81bVFgYOECUv49rqJVcLeLzUEuVzC-8korifSzbteMw';
                                } elseif ($roleName === 'STAFF') {
                                    if ($user['username'] === 'ahmad') {
                                        $avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBubwoXwYlxMZhg4TbDFOlVnu4r4oZEOx7IILJ0b5KKKVT9mqBu9Cz2BptXk_uUK3K_erPrnVHumQg9B-_GbBDUj9HTbGgHGKQ1xZgRfYHy_DkDfR-OaLMRDiIMR8WZEMm7aDZuImF6Pennnx-bezBqIvi6kaDZP4k-2sGiMBvD67vCMEqBTi690Lm254HlxiL0yr4ffWhXvmFnGLn2-ppwwE_MDzZ2ADZLsUdeLfVGlkJhO_ZHu_KbSRBWEGvW9Jt8pPHC372LyI02';
                                    } else {
                                        $avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxNsGAkvm2OD1wmhYBREcucHbaUVDU68lA468Qy88hQnQeI1Qvw6bmA2ppQmuVsx5qAbMIuLvrl8Uy5VvoTmcgGwdZjnJ_rhJOkhXgibK3nJiFLMAyHxm3xiEnGEvnn6-JTqigs4c4j3fp5qTsPKk4VBWSSUrO61LalsULvAQph2kI01L2NW4FgcMjq86x8x_5rcjebq8mB8-qk2y_jYOiMigAJ8OV1rZShKGzOlmhOxH3cnRaDvW_ChcylBMiACA11AwBfxWPyLGS';
                                    }
                                } else {
                                    if ($user['username'] === 'user2') {
                                        $avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlzi4CGqwB4XvgdDDZQW2mVs7eQ9LTT0DwjtDxhzD-r5HO2pprkB-jGAs247lS0vAZeOrU5uHfP0dB2CkHydM44-96L9KAvAs5UtfxLP5OzFuBeR0ITGWkRaY5xZxOGGhZebM0W5EPFywrS17pwj5Xconlo9A8GCtqyIYDPgEaJJfeW-Aber3wMYRuL7NclZuCVzSWF9BKUnyT-oda3dumDj2CdpttkDGgTyMWoLSxPPVoK1uARplX8WwbWpUZGslmKvlCqSE-CNTj';
                                    } else {
                                        $avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2pruTCbM0YqEVf0XgRkntPJRB6sYi87oNLa60wV6ds0ZMVv5DhQKutnLvtiQWQKDSLXDuxDnLikmT4Z9dJuUyL3qVOwUyKW-HLHKRe5A8YMa-h-5PfrL8-Y6nafMJPfPOb7SWrUYgu1tMcn83-tt1BfDg6yLnVIqGz-MQDHsnyTdOIhSKUf6bHj29iYfz-CNQKi3CYJT9-mQnswzGHBL406ipaBgKRyf26DF-9Kdepg6_o4kW1Qh-i3IQUxMbEE0fqaIqcrElcmV1';
                                    }
                                }
                                
                                $badgeClass = 'bg-surface-container-high text-on-surface-variant';
                                if ($roleName === 'ADMIN') {
                                    $badgeClass = 'bg-primary-container text-on-primary-container';
                                } elseif ($roleName === 'STAFF') {
                                    $badgeClass = 'bg-secondary-container text-on-secondary-fixed-variant';
                                }
                                
                                $statusClass = 'bg-surface-variant text-on-surface-variant';
                                if (strtoupper($user['status']) === 'ACTIVE') {
                                    $statusClass = 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
                                }
                            ?>
                                <tr class="user-table-row hover:bg-secondary-container/30 transition-colors group">
                                    <td class="px-6 py-4 font-label-caps">USR-<?= sprintf('%04d', $user['id']) ?></td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <img alt="<?= htmlspecialchars($user['full_name']) ?> User Avatar" class="w-8 h-8 rounded-full border border-outline-variant object-cover" src="<?= $avatarUrl ?>">
                                            <div>
                                                <span class="font-semibold text-on-surface block"><?= htmlspecialchars($user['full_name']) ?></span>
                                                <span class="text-[11px] text-on-surface-variant font-mono">@<?= htmlspecialchars($user['username']) ?></span>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-on-surface-variant font-mono text-xs"><?= htmlspecialchars($user['email']) ?></td>
                                    <td class="px-6 py-4">
                                        <span class="role-badge <?= $badgeClass ?>"><?= $roleName ?></span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="status-pill <?= $statusClass ?>"><?= htmlspecialchars($user['status']) ?></span>
                                    </td>
                                    <td class="px-6 py-4 text-right space-x-3">
                                        <button class="edit-user-btn text-on-surface-variant hover:text-primary transition-colors align-middle"
                                                data-id="<?= $user['id'] ?>"
                                                data-username="<?= htmlspecialchars($user['username']) ?>"
                                                data-email="<?= htmlspecialchars($user['email']) ?>"
                                                data-fullname="<?= htmlspecialchars($user['full_name']) ?>"
                                                data-role-id="<?= $user['role_id'] ?>"
                                                data-phone="<?= htmlspecialchars($user['phone']) ?>"
                                                data-address="<?= htmlspecialchars($user['address']) ?>"
                                                data-company-name="<?= htmlspecialchars($user['company_name']) ?>"
                                                data-status="<?= htmlspecialchars($user['status']) ?>">
                                            <span class="material-symbols-outlined text-[20px]" data-icon="edit">edit</span>
                                        </button>
                                        <a href="index.php?page=users&action=delete&id=<?= $user['id'] ?>" 
                                           onclick="return confirm('Apakah Anda yakin ingin menghapus user <?= htmlspecialchars($user['full_name']) ?> ini?')" 
                                           class="text-on-surface-variant hover:text-error transition-colors inline-block align-middle">
                                            <span class="material-symbols-outlined text-[20px]" data-icon="delete">delete</span>
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
                </div>
                
                <!-- Pagination -->
                <div class="px-6 py-4 flex items-center justify-between bg-surface-container-low border-t border-outline-variant">
                    <p class="font-body-md text-on-surface-variant">Showing <span class="font-semibold text-on-surface">1 - <?= count($usersList) ?></span> of <?= count($usersList) ?> users</p>
                    <div class="flex items-center gap-2">
                        <button class="p-1 border border-outline-variant rounded-md text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50" disabled="">
                            <span class="material-symbols-outlined" data-icon="chevron_left">chevron_left</span>
                        </button>
                        <div class="flex items-center">
                            <button class="px-3 py-1 bg-primary text-on-primary rounded-md font-semibold text-body-md">1</button>
                        </div>
                        <button class="p-1 border border-outline-variant rounded-md text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50" disabled="">
                            <span class="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Dashboard Background Pattern Overlay (Subtle) -->
            <div class="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" style="background-image: radial-gradient(#001e40 1px, transparent 1px); background-size: 24px 24px;"></div>
        </div>
    </main>
    
    <!-- Add User Modal Dialog -->
    <div id="addUserModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in">
            <button id="closeAddUserCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-6">
                <div class="bg-primary p-2.5 rounded-lg text-white flex items-center justify-center">
                    <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">person_add</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Tambah Pengguna Baru</h3>
                    <p class="text-xs text-on-surface-variant font-semibold">PT. SURYA BANGUN SARANA BANJARMASIN</p>
                </div>
            </div>
            
            <form action="index.php?page=users" method="POST" class="space-y-4">
                <input type="hidden" name="action" value="add">
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Nama Lengkap *</label>
                        <input type="text" name="full_name" required placeholder="e.g. Hendra Wijaya" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Username *</label>
                        <input type="text" name="username" required placeholder="e.g. hendraw" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Email *</label>
                        <input type="email" name="email" required placeholder="e.g. hendra@mail.com" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Password *</label>
                        <input type="password" name="password" required placeholder="••••••••" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Role Akses *</label>
                        <select name="role_id" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                            <option value="">-- Pilih Role --</option>
                            <?php foreach ($rolesList as $roleOpt): ?>
                                <option value="<?= $roleOpt['id'] ?>"><?= htmlspecialchars($roleOpt['role_name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Status Akun *</label>
                        <select name="status" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">No. Handphone</label>
                        <input type="text" name="phone" placeholder="e.g. 08123456789" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Nama Perusahaan (Customer)</label>
                        <input type="text" name="company_name" placeholder="e.g. CV. Buana Karya" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-primary mb-1">Alamat Lengkap</label>
                    <textarea name="address" placeholder="e.g. Jl. Ahmad Yani KM 6..." rows="2" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface"></textarea>
                </div>

                <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-outline-variant">
                    <button type="button" id="closeAddUserCancel" class="px-5 py-2.5 rounded-lg border border-outline-variant text-primary font-semibold hover:bg-surface-container-low transition-colors text-body-md">Batal</button>
                    <button type="submit" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Simpan Pengguna</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit User Modal Dialog -->
    <div id="editUserModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in">
            <button id="closeEditUserCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-6">
                <div class="bg-primary p-2.5 rounded-lg text-white flex items-center justify-center">
                    <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">edit</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Edit Data Pengguna</h3>
                    <p class="text-xs text-on-surface-variant font-semibold">PT. SURYA BANGUN SARANA BANJARMASIN</p>
                </div>
            </div>
            
            <form action="index.php?page=users" method="POST" class="space-y-4">
                <input type="hidden" name="action" value="edit">
                <input type="hidden" name="id" id="edit_user_id">
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Nama Lengkap *</label>
                        <input type="text" name="full_name" id="edit_user_fullname" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Username *</label>
                        <input type="text" name="username" id="edit_user_username" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Email *</label>
                        <input type="email" name="email" id="edit_user_email" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Password (Kosongkan jika tak diubah)</label>
                        <input type="password" name="password" placeholder="••••••••" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Role Akses *</label>
                        <select name="role_id" id="edit_user_role_id" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                            <option value="">-- Pilih Role --</option>
                            <?php foreach ($rolesList as $roleOpt): ?>
                                <option value="<?= $roleOpt['id'] ?>"><?= htmlspecialchars($roleOpt['role_name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Status Akun *</label>
                        <select name="status" id="edit_user_status" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">No. Handphone</label>
                        <input type="text" name="phone" id="edit_user_phone" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Nama Perusahaan (Customer)</label>
                        <input type="text" name="company_name" id="edit_user_company_name" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-primary mb-1">Alamat Lengkap</label>
                    <textarea name="address" id="edit_user_address" rows="2" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface"></textarea>
                </div>

                <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-outline-variant">
                    <button type="button" id="closeEditUserCancel" class="px-5 py-2.5 rounded-lg border border-outline-variant text-primary font-semibold hover:bg-surface-container-low transition-colors text-body-md">Batal</button>
                    <button type="submit" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Simpan Perubahan</button>
                </div>
            </form>
        </div>
    </div>

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
                <p class="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant font-semibold">Gunakan navigasi untuk berpindah antar modul sistem secara aman.</p>
            </div>
            <div class="mt-6 text-right">
                <button id="closeHelpModalOk" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Saya Mengerti</button>
            </div>
        </div>
    </div>

    <script>
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


            // Add User & Edit User Modal Logic
            const openAddUserBtn = document.getElementById('openAddUserBtn');
            const addUserModal = document.getElementById('addUserModal');
            const closeAddUserCross = document.getElementById('closeAddUserCross');
            const closeAddUserCancel = document.getElementById('closeAddUserCancel');

            const editUserModal = document.getElementById('editUserModal');
            const closeEditUserCross = document.getElementById('closeEditUserCross');
            const closeEditUserCancel = document.getElementById('closeEditUserCancel');

            // Add User open/close
            if (openAddUserBtn && addUserModal) {
                openAddUserBtn.addEventListener('click', () => {
                    addUserModal.classList.remove('hidden');
                });
            }
            if (closeAddUserCross && addUserModal) {
                closeAddUserCross.addEventListener('click', () => {
                    addUserModal.classList.add('hidden');
                });
            }
            if (closeAddUserCancel && addUserModal) {
                closeAddUserCancel.addEventListener('click', () => {
                    addUserModal.classList.add('hidden');
                });
            }

            // Edit User open/prefill/close
            document.querySelectorAll('.edit-user-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.getElementById('edit_user_id').value = btn.getAttribute('data-id');
                    document.getElementById('edit_user_fullname').value = btn.getAttribute('data-fullname');
                    document.getElementById('edit_user_username').value = btn.getAttribute('data-username');
                    document.getElementById('edit_user_email').value = btn.getAttribute('data-email');
                    document.getElementById('edit_user_role_id').value = btn.getAttribute('data-role-id');
                    document.getElementById('edit_user_status').value = btn.getAttribute('data-status');
                    document.getElementById('edit_user_phone').value = btn.getAttribute('data-phone');
                    document.getElementById('edit_user_company_name').value = btn.getAttribute('data-company-name');
                    document.getElementById('edit_user_address').value = btn.getAttribute('data-address');
                    
                    if (editUserModal) {
                        editUserModal.classList.remove('hidden');
                    }
                });
            });

            if (closeEditUserCross && editUserModal) {
                closeEditUserCross.addEventListener('click', () => {
                    editUserModal.classList.add('hidden');
                });
            }
            if (closeEditUserCancel && editUserModal) {
                closeEditUserCancel.addEventListener('click', () => {
                    editUserModal.classList.add('hidden');
                });
            }

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

            // Three-dot More Menu Toggle
            const moreMenuBtn = document.getElementById('moreMenuBtn');
            const moreMenuDropdown = document.getElementById('moreMenuDropdown');
            if (moreMenuBtn && moreMenuDropdown) {
                moreMenuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    moreMenuDropdown.classList.toggle('hidden');
                    if (profileMenu) profileMenu.classList.add('hidden');
                    if (notiMenu) notiMenu.classList.add('hidden');
                });
            }

            // Close dropdowns on clicking outside
            document.addEventListener('click', (e) => {
                if (profileMenu && !profileBtn.contains(e.target)) profileMenu.classList.add('hidden');
                if (notiMenu && !notiBtn.contains(e.target)) notiMenu.classList.add('hidden');
                if (moreMenuDropdown && !moreMenuBtn.contains(e.target)) moreMenuDropdown.classList.add('hidden');
                if (window.innerWidth < 1024 && sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                    sidebar.classList.add('hidden');
                    sidebar.classList.remove('flex');
                }
            });
        });
    </script>
</body>
</html>
