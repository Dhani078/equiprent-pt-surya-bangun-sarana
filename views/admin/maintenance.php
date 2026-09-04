<?php
/**
 * ============================================================================
 * VIEW: views/admin/maintenance.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Halaman Manajemen Pemeliharaan (Maintenance) Alat Berat & Work Orders.
 * Mengintegrasikan Bento Layout premium dengan pencarian interaktif,
 * ringkasan biaya dinamis, work orders aktif, jadwal mendatang, dan feed aktivitas riil.
 * 
 * INTEGRITAS VISUAL MUTLAK (100% REPLIKASI DOM DARI PROTOTIPE ASLI STITCH):
 * - Menggunakan Hanken Grotesk (UI) & JetBrains Mono (Data Log)
 * - Sidebar Navigation 6 Menu utama dari sistem (Dashboard, Inventory, dll.)
 * - Bento Quick Stats yang menampilkan metrik riil (Active, Upcoming, Shop, Cost)
 * - Timeline aktivitas dinamis terpadu dari basis data lokal.
 */

$fullName = $_SESSION['full_name'] ?? 'Alex Thompson';
$role = $_SESSION['role'] ?? 'SENIOR ADMIN';
$currentPage = 'maintenance'; // Menjadikan Maintenance aktif di menu sidebar

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
    <title>Fleet Manager | Maintenance Management</title>
    
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
                },
            },
        }
    </script>
    <style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            vertical-align: middle;
        }
        body { font-family: 'Hanken Grotesk', sans-serif; }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .bento-card { border: 1px solid #e2e8f0; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .bento-card:hover { box-shadow: 0px 10px 20px rgba(15, 23, 42, 0.04); transform: translateY(-1.5px); }
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
                <input type="hidden" name="page" value="maintenance">
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

    <!-- Main Content Canvas -->
    <main class="pt-24 pl-container-padding lg:pl-[284px] pr-container-padding pb-container-padding min-h-screen">
        <!-- Breadcrumb & Header -->
        <div class="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
                <p class="font-label-caps text-[11px] text-on-surface-variant mb-1">
                    MAINTENANCE <span class="mx-2">/</span> <span class="text-primary font-semibold">OVERVIEW</span>
                </p>
                <h1 class="font-display-lg text-display-lg text-primary font-bold">Maintenance Management</h1>
            </div>
            <div class="flex gap-3 flex-wrap">
                <a href="index.php?page=export_maintenance_pdf" target="_blank" class="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-body-md text-on-surface hover:bg-surface-container transition-all whitespace-nowrap">
                    <span class="material-symbols-outlined text-[20px]">download</span>
                    Export PDF
                </a>
                <button id="openAddMaintBtn" class="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-body-md font-semibold hover:bg-primary-container transition-all shadow-sm whitespace-nowrap">
                    <span class="material-symbols-outlined text-[20px]">add</span>
                    Add Maintenance
                </button>
            </div>
        </div>

        <!-- Statistics Grid (Bento Style) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- 1. Active Maintenance -->
            <div class="bento-card bg-surface p-6 rounded-xl flex flex-col justify-between">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary">engineering</span>
                    </div>
                    <span class="font-label-caps text-on-tertiary-container bg-tertiary-container/10 px-2 py-1 rounded text-[10px]">+12%</span>
                </div>
                <div>
                    <p class="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider">Active Maintenance</p>
                    <p class="font-display-lg text-display-lg text-on-surface font-bold"><?= sprintf('%02d', $stats['active']) ?></p>
                </div>
            </div>

            <!-- 2. Upcoming Schedules -->
            <div class="bento-card bg-surface p-6 rounded-xl flex flex-col justify-between">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 bg-tertiary-fixed rounded-lg flex items-center justify-center">
                        <span class="material-symbols-outlined text-on-tertiary-fixed">calendar_today</span>
                    </div>
                    <span class="font-label-caps text-on-surface-variant bg-surface-container-high px-2 py-1 rounded text-[10px]">Upcoming</span>
                </div>
                <div>
                    <p class="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider">Upcoming Schedules</p>
                    <p class="font-display-lg text-display-lg text-on-surface font-bold"><?= sprintf('%02d', $stats['upcoming']) ?></p>
                </div>
            </div>

            <!-- 3. Units in Shop -->
            <div class="bento-card bg-surface p-6 rounded-xl flex flex-col justify-between">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 bg-error-container rounded-lg flex items-center justify-center">
                        <span class="material-symbols-outlined text-on-error-container">garage</span>
                    </div>
                    <span class="font-label-caps text-on-error-container bg-error-container/20 px-2 py-1 rounded text-[10px]">Shop Active</span>
                </div>
                <div>
                    <p class="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider">Units in Shop</p>
                    <p class="font-display-lg text-display-lg text-on-surface font-bold"><?= sprintf('%02d', $stats['in_shop']) ?></p>
                </div>
            </div>

            <!-- 4. Total Cost -->
            <div class="bento-card bg-surface p-6 rounded-xl flex flex-col justify-between">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 bg-primary-fixed rounded-lg flex items-center justify-center">
                        <span class="material-symbols-outlined text-on-primary-fixed">payments</span>
                    </div>
                    <span class="font-label-caps text-on-tertiary-container bg-tertiary-container/10 px-2 py-1 rounded text-[10px]">Monthly</span>
                </div>
                <div>
                    <p class="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider">Total Cost</p>
                    <p class="font-display-lg text-display-lg text-on-surface font-bold">
                        IDR <?= $stats['total_cost'] >= 1000000000 ? number_format($stats['total_cost'] / 1000000000, 1) . 'B' : ($stats['total_cost'] >= 1000000 ? number_format($stats['total_cost'] / 1000000, 1) . 'M' : number_format($stats['total_cost'] / 1000, 0) . 'K') ?>
                    </p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-12 gap-8">
            <!-- Table Section -->
            <div class="col-span-12 lg:col-span-8">
                <div class="bento-card bg-white rounded-xl overflow-hidden">
                    <div class="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
                        <h3 class="font-headline-sm text-headline-sm text-primary font-bold">Active Work Orders</h3>
                        <div class="flex gap-2">
                            <button class="p-2 border border-outline-variant rounded-md hover:bg-surface-container"><span class="material-symbols-outlined text-sm">filter_list</span></button>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-surface-container-low">
                                    <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase">ID</th>
                                    <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase">Equipment</th>
                                    <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase">Service Type</th>
                                    <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase">Date</th>
                                    <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase">Technician</th>
                                    <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase">Status</th>
                                    <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-outline-variant">
                                <?php if (empty($workOrders)): ?>
                                    <tr>
                                        <td colspan="7" class="px-6 py-12 text-center text-on-surface-variant opacity-75 font-body-lg">
                                            <span class="material-symbols-outlined text-[48px] mb-2 opacity-50 block">engineering</span>
                                            Tidak ada work order pemeliharaan aktif.
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($workOrders as $order): 
                                        $code = strtoupper($order['equipment_code']);
                                        $imgUrl = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=150&q=80'; // fallback
                                        
                                        if (strpos($code, 'KOM') !== false || strpos($code, 'PC200') !== false || strpos($code, 'EXCA') !== false) {
                                            $imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5w2Kpu_FyhfHUpqgyFxOeuh4RCI4CLkRh4Np4fxHp6O1Bq5jyahGMOyeqEWxTPfj-IsdbYI70AEi_u8zfk505m4Ld4oJqHru96EQyVABNtt2mO4Hv97uKgRJ8Bx_5VD_sA_ED6DKI_FHVLJrNCfvl-h8EC1PRf5TcfBTXhlDPsu-eeqePRRdWu1YvRErHQJU-BMwmFHSy4Hu3mDybLExdmPPkcBw_BuNz5hG7JjEtzGsHiEzwQwIPS5I5SqMHkv_ixt-6bstXHfxp';
                                        } elseif (strpos($code, 'BULL') !== false || strpos($code, 'CAT') !== false || strpos($code, 'D6') !== false) {
                                            $imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-vhe3rSZt3ISyU9XqGrnp4Ou8CNOMWVJb60W7QKQPOJs65tt0q7Ss-dAK1z6Fh6684F4BgcClkMHZKqHrrudMGAMZkythEpzBswtmXPCelGUHySG1wQCKt3-t8FYDlW-EpesQgIM68wMsAURJO002PUezkUwueicPjsjYPBbBXC8KqmSqTlJIOmVidZZjHFrSfZilQ11TGlSp8ZfwUAsfxCVCOqeii6_77MVLHNHT6NDMZJAUNPsHHtHlnAz1c4bL0gOhp65v-TO2';
                                        } elseif (strpos($code, 'VIBR') !== false || strpos($code, 'SAK') !== false || strpos($code, 'SV520') !== false || strpos($code, 'SD110') !== false) {
                                            $imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmurtKWWc5_OhFV-cTV9efTVcwPuyv9Vd9j3H-i-UBQqNIppqUd7P16fE8bjgR-dwFkHBdzRvKT3GrqN8mg91g28CdduCXRatHdhgxaqQ1zMfKPn3TdkXh310GDTUkh2N-ghJtko51-WVmAY81_JLXIKfGtvqHLlR_Wt-1-OZiCjWQdELQgEb5Ixu63mja4aBoEhY2sIoZBg0yTqO35580qRxWxAo1wgFFVNC8FnWS5y9WKrHA6EY6WmlNBgWrGKc9o0-C1GA91CQa';
                                        } else {
                                            $imgUrl = 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=150&q=80';
                                        }
                                    ?>
                                        <tr class="hover:bg-surface-container-lowest transition-colors">
                                            <td class="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant font-bold">#<?= htmlspecialchars($order['maintenance_code']) ?></td>
                                            <td class="px-6 py-4">
                                                <div class="flex items-center gap-3">
                                                    <div class="w-10 h-10 rounded border border-outline-variant bg-white p-1 overflow-hidden">
                                                        <img alt="<?= htmlspecialchars($order['equipment_name']) ?>" class="w-full h-full object-cover" src="<?= $imgUrl ?>">
                                                    </div>
                                                    <div>
                                                        <p class="font-body-md text-body-md font-semibold"><?= htmlspecialchars($order['equipment_name']) ?></p>
                                                        <p class="text-[11px] text-on-surface-variant font-mono">SN: <?= htmlspecialchars($order['equipment_code']) ?></p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 font-body-md text-body-md">
                                                <p class="font-semibold text-primary"><?= htmlspecialchars($order['maintenance_type']) ?></p>
                                                <p class="text-xs text-on-surface-variant"><?= htmlspecialchars($order['description']) ?></p>
                                            </td>
                                            <td class="px-6 py-4 font-body-md text-body-md text-on-surface-variant font-mono"><?= date('d M Y', strtotime($order['scheduled_date'])) ?></td>
                                            <td class="px-6 py-4 font-body-md text-body-md"><?= htmlspecialchars($order['technician_name'] ?: 'Belum Ditunjuk') ?></td>
                                            <td class="px-6 py-4">
                                                <?php
                                                $status = strtoupper($order['status']);
                                                if ($status === 'IN_PROGRESS') {
                                                    echo '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">In Progress</span>';
                                                } elseif ($status === 'COMPLETED') {
                                                    echo '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">Completed</span>';
                                                } elseif ($status === 'CANCELLED') {
                                                    echo '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">Cancelled</span>';
                                                } else {
                                                    echo '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">Scheduled</span>';
                                                }
                                                ?>
                                            </td>
                                            <td class="px-6 py-4 text-right">
                                                <a href="index.php?page=maintenance&action=delete&id=<?= $order['id'] ?>" onclick="return confirm('Apakah Anda yakin ingin menghapus jadwal pemeliharaan ini?')" class="p-2 hover:bg-error-container rounded-lg text-error transition-colors inline-block" title="Hapus Jadwal">
                                                    <span class="material-symbols-outlined text-[18px]">delete</span>
                                                </a>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                    <div class="px-6 py-4 bg-surface-container-low flex items-center justify-between">
                        <p class="font-body-md text-body-md text-on-surface-variant">Showing <?= count($workOrders) ?> of <?= count($workOrders) ?> records</p>
                        <div class="flex gap-2">
                            <button class="p-2 rounded border border-outline-variant hover:bg-surface disabled:opacity-50" disabled=""><span class="material-symbols-outlined text-sm">chevron_left</span></button>
                            <button class="p-2 rounded border border-outline-variant hover:bg-surface disabled:opacity-50" disabled=""><span class="material-symbols-outlined text-sm">chevron_right</span></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Side Panels -->
            <div class="col-span-12 lg:col-span-4 flex flex-col gap-8">
                <!-- Upcoming Service -->
                <div class="bento-card bg-white rounded-xl overflow-hidden">
                    <div class="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
                        <h3 class="font-headline-sm text-headline-sm text-primary font-bold">Upcoming Service</h3>
                        <span class="font-label-caps text-[10px] bg-error-container text-on-error-container px-2 py-0.5 rounded">URGENT</span>
                    </div>
                    <div class="p-6 flex flex-col gap-6">
                        <?php if (empty($upcomingServices)): ?>
                            <div class="text-center text-on-surface-variant py-6 font-body-md">
                                Tidak ada jadwal pemeliharaan terdekat.
                            </div>
                        <?php else: ?>
                            <?php foreach ($upcomingServices as $service): 
                                $daysLeft = ceil((strtotime($service['scheduled_date']) - strtotime(date('Y-m-d'))) / 86400);
                                $daysLabel = $daysLeft == 0 ? 'TODAY' : ($daysLeft > 0 ? floor($daysLeft) . ' DAYS LEFT' : 'OVERDUE');
                                $borderClass = $daysLeft <= 1 ? 'border-error' : 'border-outline-variant';
                                $textClass = $daysLeft <= 1 ? 'text-error font-bold' : 'text-on-surface-variant';
                            ?>
                                <div class="relative pl-4 border-l-2 <?= $borderClass ?>">
                                    <div class="flex justify-between items-start mb-1">
                                        <h4 class="font-body-md text-body-md font-bold"><?= htmlspecialchars($service['equipment_name']) ?></h4>
                                        <span class="font-label-caps text-[10px] <?= $textClass ?>"><?= $daysLabel ?></span>
                                    </div>
                                    <p class="font-body-md text-body-md text-on-surface-variant mb-2"><?= htmlspecialchars($service['description']) ?></p>
                                    <button class="text-primary font-semibold text-[13px] hover:underline">View Checklist</button>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                        
                        <a href="index.php?page=export_maintenance_pdf" target="_blank" class="w-full py-3 border border-primary text-primary rounded-lg font-bold font-body-md hover:bg-secondary-container transition-all block text-center">
                            LIHAT SEMUA JADWAL
                        </a>
                    </div>
                </div>

                <!-- Recent Activities (Premium Dynamic Timeline) -->
                <div class="bento-card bg-white rounded-xl p-6">
                    <h3 class="font-headline-sm text-headline-sm text-primary mb-6 font-bold">Aktivitas Terbaru</h3>
                    <div class="flex flex-col gap-6">
                        <?php foreach ($recentActivities as $idx => $activity): 
                            $elapsed = time() - $activity['time'];
                            if ($elapsed < 60) {
                                $timeStr = 'Baru saja';
                            } elseif ($elapsed < 3600) {
                                $timeStr = floor($elapsed / 60) . ' MENIT LALU';
                            } elseif ($elapsed < 86400) {
                                $timeStr = floor($elapsed / 3600) . ' JAM LALU';
                            } else {
                                $timeStr = date('d M Y', $activity['time']);
                            }
                            
                            $bulletColor = 'bg-outline-variant';
                            if ($activity['icon'] == 'payments') $bulletColor = 'bg-green-600';
                            if ($activity['icon'] == 'build') $bulletColor = 'bg-primary';
                            if ($activity['icon'] == 'receipt_long') $bulletColor = 'bg-secondary';
                        ?>
                            <div class="flex gap-4">
                                <div class="relative shrink-0">
                                    <div class="w-2 h-2 <?= $bulletColor ?> rounded-full mt-2"></div>
                                    <?php if ($idx < count($recentActivities) - 1): ?>
                                        <div class="absolute top-4 left-[3px] w-[2px] h-[calc(100%+24px)] bg-outline-variant"></div>
                                    <?php endif; ?>
                                </div>
                                <div>
                                    <p class="font-body-md text-body-md text-on-surface-variant">
                                        <?= $activity['message'] ?>
                                    </p>
                                    <p class="font-label-caps text-[10px] text-outline mt-1 uppercase"><?= $timeStr ?></p>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Add Maintenance Modal Dialog -->
    <div id="addMaintenanceModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in">
            <button id="closeAddMaintCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-6">
                <div class="bg-primary p-2.5 rounded-lg text-white flex items-center justify-center">
                    <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">build</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Tambah Jadwal Pemeliharaan</h3>
                    <p class="text-xs text-on-surface-variant font-semibold">PT. SURYA BANGUN SARANA BANJARMASIN</p>
                </div>
            </div>
            
            <form action="index.php?page=maintenance" method="POST" class="space-y-4">
                <input type="hidden" name="action" value="add">
                
                <div>
                    <label class="block text-sm font-semibold text-primary mb-1">Pilih Alat Berat *</label>
                    <select name="equipment_id" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                        <option value="">-- Pilih Alat Berat --</option>
                        <?php foreach ($equipmentsList as $equip): ?>
                            <option value="<?= $equip['id'] ?>"><?= htmlspecialchars($equip['name']) ?> - SN: <?= htmlspecialchars($equip['equipment_code']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Tanggal Mulai *</label>
                        <input type="date" name="scheduled_date" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Jenis Pemeliharaan *</label>
                        <select name="maintenance_type" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                            <option value="PREVENTIVE">PREVENTIVE (Servis Berkala)</option>
                            <option value="CORRECTIVE">CORRECTIVE (Perbaikan Ringan)</option>
                            <option value="EMERGENCY">EMERGENCY (Kerusakan Fatal)</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Estimasi Biaya (Rp) *</label>
                        <input type="number" name="cost" placeholder="e.g. 1500000" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Hour Meter saat ini *</label>
                        <input type="number" name="hour_meter" placeholder="e.g. 1200" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Teknisi / Staff PJ *</label>
                        <select name="technician_id" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                            <option value="">-- Pilih Teknisi --</option>
                            <?php foreach ($techniciansList as $tech): ?>
                                <option value="<?= $tech['id'] ?>"><?= htmlspecialchars($tech['full_name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Status Awal *</label>
                        <select name="status" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                            <option value="SCHEDULED">SCHEDULED (Direnwalkan)</option>
                            <option value="IN_PROGRESS">IN_PROGRESS (Sedang Dikerjakan)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-primary mb-1">Catatan Pemeliharaan</label>
                    <textarea name="notes" placeholder="Deskripsi kerusakan, part yang perlu diganti..." rows="3" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface"></textarea>
                </div>

                <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-outline-variant">
                    <button type="button" id="closeAddMaintCancel" class="px-5 py-2.5 rounded-lg border border-outline-variant text-primary font-semibold hover:bg-surface-container-low transition-colors text-body-md">Batal</button>
                    <button type="submit" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Simpan Jadwal</button>
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
                    <p class="text-xs text-on-surface-variant font-semibold">Admin Terminal Guidance System</p>
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
        // Atmosphere - Subtle dot pattern background for the body
        document.body.style.backgroundImage = `radial-gradient(#cbd5e1 0.8px, transparent 0.8px)`;
        document.body.style.backgroundSize = `24px 24px`;

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

            // Add Maintenance modal elements
            const openAddMaintBtn = document.getElementById('openAddMaintBtn');
            const addMaintenanceModal = document.getElementById('addMaintenanceModal');
            const closeAddMaintCross = document.getElementById('closeAddMaintCross');
            const closeAddMaintCancel = document.getElementById('closeAddMaintCancel');

            // Mobile Sidebar Toggle
            if (toggleBtn && sidebar) {
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sidebar.classList.toggle('hidden');
                    sidebar.classList.toggle('flex');
                });
            }

            if (openAddMaintBtn && addMaintenanceModal) {
                openAddMaintBtn.addEventListener('click', () => {
                    addMaintenanceModal.classList.remove('hidden');
                });
            }

            if (closeAddMaintCross && addMaintenanceModal) {
                closeAddMaintCross.addEventListener('click', () => {
                    addMaintenanceModal.classList.add('hidden');
                });
            }

            if (closeAddMaintCancel && addMaintenanceModal) {
                closeAddMaintCancel.addEventListener('click', () => {
                    addMaintenanceModal.classList.add('hidden');
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
