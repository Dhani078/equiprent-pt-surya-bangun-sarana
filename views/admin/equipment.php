<?php
/**
 * ============================================================================
 * VIEW: views/admin/equipment.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Antarmuka Manajemen Inventaris Alat Berat (Equipment Inventory).
 * Berfungsi untuk melacak, menambah, mengedit, dan memantau status operasional unit.
 * 
 * INTEGRITAS VISUAL MUTLAK (100% REPLIKASI DOM DARI PROTOTIPE ASLI STITCH):
 * - Menggunakan CSS Utility Tailwind Terintegrasi
 * - 4 Bento Mini-Stats untuk status unit real-time
 * - Sidebar Navigation 260px Berbasis Rute Dinamis
 * - Tabel Inventaris Lengkap dengan Pencarian Real-Time
 * - Visualisasi Gambar Unit dengan High-Fidelity Mapping
 */

$fullName = $_SESSION['full_name'] ?? 'Alex Rivera';
$username = $_SESSION['username'] ?? 'admin';
$role = $_SESSION['role'] ?? 'Fleet Manager';

// Deteksi halaman aktif secara dinamis untuk penyorotan sidebar
$currentPage = $_GET['page'] ?? 'equipment';

// Ambil data statistik dinamis
$totalUnit = $stats['total'] ?? 0;
$availableUnit = $stats['available'] ?? 0;
$rentedUnit = $stats['rented'] ?? 0;
$maintenanceUnit = $stats['maintenance'] ?? 0;

// Helper sidebar dinamis
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
    <title>EquipRent MS - Equipment Management</title>
    
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
                },
            },
        }
    </script>
    <style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        body {
            background-color: #f7f9fb;
            font-family: 'Hanken Grotesk', sans-serif;
        }
        .sidebar-active-indicator {
            position: absolute;
            left: 0;
            width: 4px;
            height: 100%;
            background-color: #001e40;
        }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    </style>
</head>
<body class="flex min-h-screen text-on-surface">

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

    <!-- Main Canvas -->
    <main class="flex-1 ml-0 lg:ml-[260px] flex flex-col min-h-screen">
        <!-- TopAppBar Component -->
        <header class="fixed top-0 right-0 z-40 h-16 w-full lg:w-[calc(100%-260px)] bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-container-padding">
            <div class="flex items-center flex-1 max-w-xl gap-3">
                <button id="sidebarToggleBtn" class="lg:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined">menu</span>
                </button>
                <form action="index.php" method="GET" class="relative w-full group">
                    <input type="hidden" name="page" value="equipment">
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

        <!-- Spacer to push content down under the fixed header -->
        <div class="h-16"></div>

        <!-- Content Area -->
        <div class="p-container-padding flex-1 space-y-6">
            <!-- Success/Error Flash Alerts -->
            <?php if (isset($_SESSION['success'])): ?>
                <div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-3 animate-fade-in shadow-sm">
                    <span class="material-symbols-outlined text-[24px] text-emerald-600" style="font-variation-settings: 'FILL' 1">check_circle</span>
                    <span class="font-body-md font-semibold"><?= htmlspecialchars($_SESSION['success']) ?></span>
                </div>
                <?php unset($_SESSION['success']); ?>
            <?php endif; ?>

            <?php if (isset($_SESSION['error'])): ?>
                <div class="p-4 bg-error-container border border-error/30 text-error rounded-lg flex items-center gap-3 animate-fade-in shadow-sm">
                    <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1">error</span>
                    <span class="font-body-md font-semibold"><?= htmlspecialchars($_SESSION['error']) ?></span>
                </div>
                <?php unset($_SESSION['error']); ?>
            <?php endif; ?>

            <!-- Page Header Actions -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="font-headline-md text-headline-md font-bold text-primary">Equipment Inventory</h2>
                    <p class="font-body-md text-on-surface-variant">Kelola dan pantau status seluruh unit alat berat.</p>
                </div>
                <button id="addEquipmentBtn" class="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-lg font-body-md font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md">
                    <span class="material-symbols-outlined">add</span>
                    Tambah Alat Baru
                </button>
            </div>
            
            <!-- Dashboard Mini Stats - Bento Style -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Total Unit -->
                <div class="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl">
                    <p class="font-label-caps text-on-surface-variant uppercase mb-1">Total Unit</p>
                    <div class="flex items-end justify-between">
                        <h3 class="font-display-lg text-display-lg font-bold text-primary font-mono"><?= number_format($totalUnit) ?></h3>
                        <span class="text-primary text-body-md flex items-center gap-1 bg-primary-fixed px-2 py-0.5 rounded-full font-semibold">
                            <span class="material-symbols-outlined text-[16px]">trending_up</span> 12%
                        </span>
                    </div>
                </div>
                
                <!-- Tersedia -->
                <div class="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl">
                    <p class="font-label-caps text-on-surface-variant uppercase mb-1">Tersedia</p>
                    <div class="flex items-end justify-between">
                        <h3 class="font-display-lg text-display-lg font-bold text-green-700 font-mono"><?= number_format($availableUnit) ?></h3>
                        <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                            <span class="material-symbols-outlined">check_circle</span>
                        </div>
                    </div>
                </div>
                
                <!-- Disewa -->
                <div class="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl">
                    <p class="font-label-caps text-on-surface-variant uppercase mb-1">Disewa</p>
                    <div class="flex items-end justify-between">
                        <h3 class="font-display-lg text-display-lg font-bold text-blue-700 font-mono"><?= number_format($rentedUnit) ?></h3>
                        <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <span class="material-symbols-outlined">pending_actions</span>
                        </div>
                    </div>
                </div>
                
                <!-- Maintenance -->
                <div class="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl">
                    <p class="font-label-caps text-on-surface-variant uppercase mb-1">Maintenance</p>
                    <div class="flex items-end justify-between">
                        <h3 class="font-display-lg text-display-lg font-bold text-orange-700 font-mono"><?= number_format($maintenanceUnit) ?></h3>
                        <div class="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                            <span class="material-symbols-outlined">build_circle</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Table Container -->
            <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr class="bg-surface-container-low border-b border-outline-variant">
                                <th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Kode Alat</th>
                                <th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Nama Alat</th>
                                <th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Kategori</th>
                                <th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant text-center">Status</th>
                                <th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant text-right">Harga Sewa / Hari</th>
                                <th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-outline-variant font-body-md text-body-md">
                            <?php if (empty($equipments)): ?>
                                <tr>
                                    <td colspan="6" class="px-6 py-8 text-center text-on-surface-variant opacity-75">
                                        Tidak ada data alat berat yang ditemukan.
                                    </td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($equipments as $eq): 
                                    // High-fidelity image mapping based on equipment code
                                    $code = strtoupper($eq['equipment_code']);
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

                                    // Status Badge styling
                                    $badgeClass = 'bg-green-100 text-green-700';
                                    $statusLabel = 'Tersedia';
                                    
                                    if ($eq['status'] === 'RENTED') {
                                        $badgeClass = 'bg-blue-100 text-blue-700';
                                        $statusLabel = 'Disewa';
                                    } elseif ($eq['status'] === 'MAINTENANCE') {
                                        $badgeClass = 'bg-orange-100 text-orange-700';
                                        $statusLabel = 'Maintenance';
                                    } elseif ($eq['status'] === 'UNAVAILABLE') {
                                        $badgeClass = 'bg-red-100 text-red-700';
                                        $statusLabel = 'Tidak Tersedia';
                                    }
                                ?>
                                    <tr class="hover:bg-surface-container-low transition-colors group cursor-pointer">
                                        <td class="px-6 py-4 font-label-caps font-bold text-primary font-mono"><?= htmlspecialchars($eq['equipment_code']) ?></td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-3">
                                                <img class="w-10 h-10 rounded-lg object-cover bg-surface-container-highest" src="<?= $imgUrl ?>" alt="<?= htmlspecialchars($eq['name']) ?>">
                                                <span class="font-bold"><?= htmlspecialchars($eq['name']) ?></span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-on-surface-variant font-semibold"><?= htmlspecialchars($eq['type']) ?></td>
                                        <td class="px-6 py-4 text-center">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold <?= $badgeClass ?>">
                                                <?= $statusLabel ?>
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-right font-bold font-mono">Rp <?= number_format($eq['rental_price_per_day'], 0, ',', '.') ?></td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center justify-center gap-2">
                                                <button class="edit-btn p-2 text-primary hover:bg-primary-fixed rounded transition-colors" title="Edit"
                                                    data-id="<?= $eq['id'] ?>"
                                                    data-code="<?= htmlspecialchars($eq['equipment_code']) ?>"
                                                    data-name="<?= htmlspecialchars($eq['name']) ?>"
                                                    data-type="<?= htmlspecialchars($eq['type']) ?>"
                                                    data-model="<?= htmlspecialchars($eq['model'] ?? '') ?>"
                                                    data-brand="<?= htmlspecialchars($eq['brand'] ?? '') ?>"
                                                    data-hm="<?= htmlspecialchars($eq['hour_meter']) ?>"
                                                    data-price="<?= htmlspecialchars($eq['rental_price_per_day']) ?>"
                                                    data-status="<?= htmlspecialchars($eq['status']) ?>"
                                                    data-maint="<?= htmlspecialchars($eq['last_maintenance_date'] ?? '') ?>"
                                                    data-thumb="<?= htmlspecialchars($eq['thumbnail_url'] ?? '') ?>">
                                                    <span class="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <a href="index.php?page=tracking&focus=<?= $eq['id'] ?>" class="p-2 text-primary hover:bg-primary-fixed rounded transition-colors" title="Detail">
                                                    <span class="material-symbols-outlined text-[20px]">visibility</span>
                                                </a>
                                                <button class="delete-btn p-2 text-error hover:bg-error-container rounded transition-colors" title="Hapus"
                                                    data-id="<?= $eq['id'] ?>"
                                                    data-name="<?= htmlspecialchars($eq['name']) ?>">
                                                    <span class="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
                    <p class="font-body-md text-on-surface-variant">Menampilkan <span class="font-semibold text-primary">1 - <?= count($equipments) ?></span> dari <span class="font-semibold text-primary"><?= $totalUnit ?></span> data</p>
                    <div class="flex items-center gap-2">
                        <button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-outline hover:bg-surface-container-highest transition-colors disabled:opacity-50" disabled="">
                            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <button class="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-semibold text-body-md">1</button>
                        <button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-primary hover:bg-surface-container-highest transition-colors text-body-md font-semibold" disabled>2</button>
                        <button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-primary hover:bg-surface-container-highest transition-colors text-body-md font-semibold" disabled>3</button>
                        <span class="px-1 text-outline">...</span>
                        <button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-primary hover:bg-surface-container-highest transition-colors text-body-md font-semibold" disabled>13</button>
                        <button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-primary hover:bg-surface-container-highest transition-colors" disabled>
                            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Contextual Help / Tips - Glassmorphism touch -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                <div class="p-6 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl shadow-lg relative overflow-hidden group">
                    <div class="relative z-10">
                        <h4 class="font-headline-sm text-headline-sm font-bold mb-2">Butuh Bantuan Fleet?</h4>
                        <p class="font-body-md opacity-90 mb-4">Pelajari cara mengoptimalkan utilisasi alat berat dengan modul analitik baru kami. Pantau konsumsi bahan bakar dan jadwal maintenance otomatis.</p>
                        <button id="openDocBtn" class="bg-white text-primary px-4 py-2 rounded font-semibold text-body-md hover:bg-primary-fixed transition-colors">Buka Dokumentasi</button>
                    </div>
                    <span class="material-symbols-outlined absolute -bottom-6 -right-6 text-[120px] opacity-10 group-hover:rotate-12 transition-transform duration-500">settings_suggest</span>
                </div>
                
                <div class="p-6 bg-surface-container-highest border border-outline-variant rounded-xl flex items-center gap-6">
                    <div class="hidden sm:block">
                        <img class="w-24 h-24 rounded-lg object-cover grayscale opacity-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZ0lbhn1H69pVK9u4Q47jXXKyC10icsQ1Vv3asXnUxsYpnkpOPaf2e0gTBZX8j4N99JksQjtG7QTxOY-QJdj-UE0huYpc1ZFgRhla2zYInQ0SRc5HhQ8Jqus_oyHc3VMbRwYbrRGqQfORB_bYDC3n9S_wIkMo98uk0_z2FYyVmMiH9K1_vbO__d0Lpy2NfNzJqOLl-6y9WiR8aO5pJx2Hewk7Tras1KMkfE4SWyk_zFeYsTsh7b333wS91qHaeIS5Q-odno2NQ9iRC" alt="Update Desk">
                    </div>
                    <div>
                        <h4 class="font-headline-sm text-headline-sm font-bold text-primary mb-1">Update Terakhir</h4>
                        <p class="font-body-md text-on-surface-variant">Laporan harian status unit telah diperbarui otomatis pada pukul 08:00 WIB.</p>
                        <div class="mt-3 flex items-center gap-2 text-primary font-semibold text-body-md cursor-pointer hover:underline" onclick="window.location.reload();">
                            <span class="material-symbols-outlined text-[20px]">refresh</span>
                            Sinkronisasi Sekarang
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    </main>

    <!-- Mobile Navigation (Bottom Bar) -->
    <nav class="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center h-16 z-50">
        <a class="flex flex-col items-center gap-1 text-on-surface-variant" href="index.php?page=admin_dashboard">
            <span class="material-symbols-outlined">dashboard</span>
            <span class="text-[10px] font-label-caps">Home</span>
        </a>
        <a class="flex flex-col items-center gap-1 text-primary" href="index.php?page=equipment">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">construction</span>
            <span class="text-[10px] font-label-caps">Inventory</span>
        </a>
        <a class="flex flex-col items-center gap-1 text-on-surface-variant" href="index.php?page=rentals">
            <span class="material-symbols-outlined">receipt_long</span>
            <span class="text-[10px] font-label-caps">Orders</span>
        </a>
        <a class="flex flex-col items-center gap-1 text-on-surface-variant" href="#">
            <span class="material-symbols-outlined">person</span>
            <span class="text-[10px] font-label-caps">Profile</span>
        </a>
    </nav>

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

    <!-- Add Equipment Modal -->
    <div id="addEquipmentModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-2xl relative m-4 max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in">
            <button id="closeAddModal" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-6">
                <div class="bg-primary-container p-2.5 rounded-lg text-primary flex items-center justify-center">
                    <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">add_box</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Tambah Alat Berat</h3>
                    <p class="text-xs text-on-surface-variant">PT. SURYA BANGUN SARANA BANJARMASIN</p>
                </div>
            </div>
            <form action="index.php?page=equipment&action=add" method="POST" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Kode Alat</label>
                        <input type="text" name="equipment_code" required placeholder="BULL-CAT-D6R-02" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Nama Alat</label>
                        <input type="text" name="name" required placeholder="Caterpillar Bulldozer D6R" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Kategori</label>
                        <select name="type" required class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                            <option value="Bulldozer">Bulldozer</option>
                            <option value="Excavator">Excavator</option>
                            <option value="Crane">Crane</option>
                            <option value="Vibratory Roller">Vibratory Roller</option>
                            <option value="Wheel Loader">Wheel Loader</option>
                            <option value="Motor Grader">Motor Grader</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Brand / Pabrikan</label>
                        <input type="text" name="brand" required placeholder="Caterpillar" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Model</label>
                        <input type="text" name="model" required placeholder="D6R" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Hour Meter Awal (HM)</label>
                        <input type="number" step="0.1" name="hour_meter" required placeholder="1200.0" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Harga Sewa / Hari (Rp)</label>
                        <input type="number" name="rental_price_per_day" required placeholder="3200000" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Status Awal</label>
                        <select name="status" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                            <option value="AVAILABLE">Tersedia (AVAILABLE)</option>
                            <option value="MAINTENANCE">Perawatan (MAINTENANCE)</option>
                            <option value="UNAVAILABLE">Tidak Tersedia</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Tgl Terakhir Servis</label>
                        <input type="date" name="last_maintenance_date" value="<?= date('Y-m-d') ?>" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Image URL (Opsional)</label>
                        <input type="text" name="thumbnail_url" placeholder="https://..." class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                </div>
                <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-outline-variant">
                    <button type="button" id="cancelAddBtn" class="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high font-semibold transition-all text-body-md">Batal</button>
                    <button type="submit" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Simpan Unit</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Equipment Modal -->
    <div id="editEquipmentModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-2xl relative m-4 max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in">
            <button id="closeEditModal" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-6">
                <div class="bg-primary-container p-2.5 rounded-lg text-primary flex items-center justify-center">
                    <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">edit_square</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Edit Detail Alat</h3>
                    <p class="text-xs text-on-surface-variant">Ubah data unit alat berat terpilih</p>
                </div>
            </div>
            <form action="index.php?page=equipment&action=edit" method="POST" class="space-y-4">
                <input type="hidden" name="id" id="edit_id">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Kode Alat</label>
                        <input type="text" name="equipment_code" id="edit_code" required class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Nama Alat</label>
                        <input type="text" name="name" id="edit_name" required class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Kategori</label>
                        <select name="type" id="edit_type" required class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                            <option value="Bulldozer">Bulldozer</option>
                            <option value="Excavator">Excavator</option>
                            <option value="Crane">Crane</option>
                            <option value="Vibratory Roller">Vibratory Roller</option>
                            <option value="Wheel Loader">Wheel Loader</option>
                            <option value="Motor Grader">Motor Grader</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Brand / Pabrikan</label>
                        <input type="text" name="brand" id="edit_brand" required class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Model</label>
                        <input type="text" name="model" id="edit_model" required class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Hour Meter (HM)</label>
                        <input type="number" step="0.1" name="hour_meter" id="edit_hm" required class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Harga Sewa / Hari (Rp)</label>
                        <input type="number" name="rental_price_per_day" id="edit_price" required class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Status</label>
                        <select name="status" id="edit_status" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                            <option value="AVAILABLE">Tersedia (AVAILABLE)</option>
                            <option value="RENTED">Disewa (RENTED)</option>
                            <option value="MAINTENANCE">Perawatan (MAINTENANCE)</option>
                            <option value="UNAVAILABLE">Tidak Tersedia</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Tgl Terakhir Servis</label>
                        <input type="date" name="last_maintenance_date" id="edit_maint" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase mb-1">Image URL</label>
                        <input type="text" name="thumbnail_url" id="edit_thumb" class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                    </div>
                </div>
                <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-outline-variant">
                    <button type="button" id="cancelEditBtn" class="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high font-semibold transition-all text-body-md">Batal</button>
                    <button type="submit" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Perbarui Data</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Delete Equipment Modal -->
    <div id="deleteEquipmentModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-2xl relative m-4 animate-fade-in text-center">
            <button id="closeDeleteModal" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="mx-auto w-14 h-14 bg-error-container text-error flex items-center justify-center rounded-full mb-4">
                <span class="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <h3 class="font-headline-sm text-headline-sm font-bold text-primary mb-2">Konfirmasi Hapus</h3>
            <p class="text-body-md text-on-surface-variant mb-6">Apakah Anda yakin ingin menghapus unit <strong id="delete_eq_name" class="text-on-surface"></strong>? Tindakan ini tidak dapat dibatalkan.</p>
            <div class="flex items-center justify-center gap-3">
                <button type="button" id="cancelDeleteBtn" class="w-full px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high font-semibold transition-all text-body-md">Batal</button>
                <a id="confirmDeleteLink" href="#" class="w-full bg-error text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-red-700 text-center active:scale-95 transition-all text-body-md flex items-center justify-center">Ya, Hapus</a>
            </div>
        </div>
    </div>

    <!-- Documentation Modal -->
    <div id="docModalDialog" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-2xl w-full p-6 shadow-2xl relative m-4 max-h-[85vh] overflow-y-auto custom-scrollbar animate-fade-in">
            <button id="closeDocModalCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-6">
                <div class="bg-primary-container p-2.5 rounded-lg text-primary flex items-center justify-center">
                    <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">description</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Dokumentasi Fleet Management</h3>
                    <p class="text-xs text-on-surface-variant">Panduan Pengoperasian SBS EquipRent Terminal</p>
                </div>
            </div>
            <div class="space-y-4 text-body-md text-on-surface">
                <section class="border-b border-outline-variant pb-4">
                    <h4 class="font-headline-sm text-[16px] font-bold text-primary mb-1">1. Alur Penambahan Alat Berat</h4>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Menambahkan unit baru ke database mewajibkan Kode Alat unik (mengikuti format standardisasi perusahaan, contoh: <code>EXCA-KOM-PC200-02</code>), detail nama spesifik merek, kategori tipe alat, dan Hour Meter (HM) akumulasi awal dalam kondisi siap jalan.</p>
                </section>
                <section class="border-b border-outline-variant pb-4">
                    <h4 class="font-headline-sm text-[16px] font-bold text-primary mb-1">2. Pengelolaan Akumulasi Hour Meter (HM)</h4>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Hour Meter (HM) melambangkan lamanya unit beroperasi dalam hitungan jam. Staf lapangan wajib melaporkan peningkatan HM harian. Jika HM unit melewati threshold servis berkala (misal: kelipatan 250 jam), sistem secara otomatis menandai status unit untuk segera dijadwalkan perawatan berkala (MAINTENANCE).</p>
                </section>
                <section class="border-b border-outline-variant pb-4">
                    <h4 class="font-headline-sm text-[16px] font-bold text-primary mb-1">3. Kebijakan Perawatan Berkala (Maintenance)</h4>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Setiap unit berstatus <code>MAINTENANCE</code> akan diblokir dari antarmuka booking sewa pelanggan untuk menjamin keselamatan kerja. Setelah perbaikan selesai dilakukan dan dicatat oleh staf mekanik di panel perawatan, status unit dapat dikembalikan menjadi <code>AVAILABLE</code>.</p>
                </section>
                <section class="pb-2">
                    <h4 class="font-headline-sm text-[16px] font-bold text-primary mb-1">4. Integrasi Lacak Posisi Telemetri GPS</h4>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Ikon visualisasi (mata) pada baris data akan mengarahkan Anda ke panel <strong>Live GPS Telemetry</strong> secara terfokus untuk melihat lokasi real-time koordinat latitude dan longitude alat berat tersebut di peta digital Banjarmasin.</p>
                </section>
            </div>
            <div class="mt-6 text-right border-t border-outline-variant pt-4">
                <button id="closeDocModalOk" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Saya Mengerti</button>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Highlight table rows on click
            const rows = document.querySelectorAll('tbody tr');
            rows.forEach(row => {
                row.addEventListener('click', (e) => {
                    // Don't trigger if a button was clicked
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    
                    rows.forEach(r => r.classList.remove('bg-secondary-fixed/30'));
                    row.classList.add('bg-secondary-fixed/30');
                });
            });

            // Modals references
            const helpBtn = document.getElementById('helpOutlineBtn');
            const helpModal = document.getElementById('helpModalDialog');
            const closeHelpCross = document.getElementById('closeHelpModalCross');
            const closeHelpOk = document.getElementById('closeHelpModalOk');

            const addBtn = document.getElementById('addEquipmentBtn');
            const addModal = document.getElementById('addEquipmentModal');
            const closeAddModal = document.getElementById('closeAddModal');
            const cancelAddBtn = document.getElementById('cancelAddBtn');

            const editModal = document.getElementById('editEquipmentModal');
            const closeEditModal = document.getElementById('closeEditModal');
            const cancelEditBtn = document.getElementById('cancelEditBtn');

            const deleteModal = document.getElementById('deleteEquipmentModal');
            const closeDeleteModal = document.getElementById('closeDeleteModal');
            const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
            const confirmDeleteLink = document.getElementById('confirmDeleteLink');
            const deleteNameText = document.getElementById('delete_eq_name');

            const openDocBtn = document.getElementById('openDocBtn');
            const docModal = document.getElementById('docModalDialog');
            const closeDocModalCross = document.getElementById('closeDocModalCross');
            const closeDocModalOk = document.getElementById('closeDocModalOk');

            const sidebar = document.getElementById('sidebarMenu');
            const toggleBtn = document.getElementById('sidebarToggleBtn');

            // Header Dropdowns
            const profileBtn = document.getElementById('profileDropBtn');
            const profileMenu = document.getElementById('profileDropdownMenu');
            const notiBtn = document.getElementById('notiBellBtn');
            const notiMenu = document.getElementById('notiDropdownMenu');

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

            // Close dropdowns & mobile sidebar on clicking outside
            document.addEventListener('click', (e) => {
                if (profileMenu && !profileBtn.contains(e.target)) profileMenu.classList.add('hidden');
                if (notiMenu && !notiBtn.contains(e.target)) notiMenu.classList.add('hidden');
                if (window.innerWidth < 1024 && sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                    sidebar.classList.add('hidden');
                    sidebar.classList.remove('flex');
                }
            });

            // Help Modal Actions
            if (helpBtn && helpModal) {
                helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
            }
            if (closeHelpCross && helpModal) {
                closeHelpCross.addEventListener('click', () => helpModal.classList.add('hidden'));
            }
            if (closeHelpOk && helpModal) {
                closeHelpOk.addEventListener('click', () => helpModal.classList.add('hidden'));
            }

            // Add Modal Actions
            if (addBtn && addModal) {
                addBtn.addEventListener('click', () => addModal.classList.remove('hidden'));
            }
            if (closeAddModal && addModal) {
                closeAddModal.addEventListener('click', () => addModal.classList.add('hidden'));
            }
            if (cancelAddBtn && addModal) {
                cancelAddBtn.addEventListener('click', () => addModal.classList.add('hidden'));
            }

            // Edit Modal Actions (Prefill data)
            const editBtns = document.querySelectorAll('.edit-btn');
            editBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.getElementById('edit_id').value = btn.dataset.id;
                    document.getElementById('edit_code').value = btn.dataset.code;
                    document.getElementById('edit_name').value = btn.dataset.name;
                    document.getElementById('edit_type').value = btn.dataset.type;
                    document.getElementById('edit_brand').value = btn.dataset.brand;
                    document.getElementById('edit_model').value = btn.dataset.model;
                    document.getElementById('edit_hm').value = btn.dataset.hm;
                    document.getElementById('edit_price').value = btn.dataset.price;
                    document.getElementById('edit_status').value = btn.dataset.status;
                    document.getElementById('edit_maint').value = btn.dataset.maint;
                    document.getElementById('edit_thumb').value = btn.dataset.thumb;
                    
                    editModal.classList.remove('hidden');
                });
            });
            if (closeEditModal && editModal) {
                closeEditModal.addEventListener('click', () => editModal.classList.add('hidden'));
            }
            if (cancelEditBtn && editModal) {
                cancelEditBtn.addEventListener('click', () => editModal.classList.add('hidden'));
            }

            // Delete Modal Actions
            const deleteBtns = document.querySelectorAll('.delete-btn');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const name = btn.dataset.name;
                    deleteNameText.textContent = name;
                    confirmDeleteLink.href = `index.php?page=equipment&action=delete&id=${id}`;
                    deleteModal.classList.remove('hidden');
                });
            });
            if (closeDeleteModal && deleteModal) {
                closeDeleteModal.addEventListener('click', () => deleteModal.classList.add('hidden'));
            }
            if (cancelDeleteBtn && deleteModal) {
                cancelDeleteBtn.addEventListener('click', () => deleteModal.classList.add('hidden'));
            }

            // Documentation Modal Actions
            if (openDocBtn && docModal) {
                openDocBtn.addEventListener('click', () => docModal.classList.remove('hidden'));
            }
            if (closeDocModalCross && docModal) {
                closeDocModalCross.addEventListener('click', () => docModal.classList.add('hidden'));
            }
            if (closeDocModalOk && docModal) {
                closeDocModalOk.addEventListener('click', () => docModal.classList.add('hidden'));
            }
        });
    </script>
</body>
</html>
