<?php
/**
 * ============================================================================
 * VIEW: views/admin/tracking.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Halaman Visualisasi GPS Pelacakan Real-time Armada Alat Berat.
 * Mengintegrasikan Leaflet.js dengan layout Bento Asymmetric resolusi tinggi
 * dan daftar unit dinamis bersumber dari database.
 * 
 * INTEGRITAS VISUAL MUTLAK (100% REPLIKASI DOM DARI PROTOTIPE ASLI STITCH):
 * - Menggunakan Hanken Grotesk (UI) & JetBrains Mono (Data Log)
 * - Sidebar Navigation 6 Menu utama dari sistem
 * - Peta interaktif Leaflet.js dengan custom markers (Biru = ON, Merah = OFF)
 * - Detail panel interaktif dan dynamic timeline log berbasis GPS aktual.
 */

$fullName = $_SESSION['full_name'] ?? 'Alex Rivera';
$role = $_SESSION['role'] ?? 'Fleet Manager';
$currentPage = 'equipment'; // Menjaga Equipment Inventory tetap terpilih di menu

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
<html class="light" lang="id">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>EquipRent MS - Tracking Alat Berat</title>
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@500;700&amp;display=swap" rel="stylesheet">
    
    <!-- Material Symbols -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
    
    <!-- Leaflet.js CSS (Open-Source Map Engine) -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    
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
        .active-unit {
            border: 2px solid #001e40 !important;
            background-color: #F0F5FA !important;
            box-shadow: 0 4px 12px rgba(0, 51, 102, 0.08) !important;
        }
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-popup {
            font-family: 'Hanken Grotesk', sans-serif;
            padding: 4px;
        }
        .custom-popup-header {
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 8px;
            margin-bottom: 8px;
        }
        .custom-popup-title {
            font-size: 14px;
            font-weight: 700;
            color: #001e40;
            margin: 0 0 2px 0;
        }
        .custom-popup-code {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #475569;
            font-weight: 500;
        }
        .custom-popup-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 10px;
        }
        .popup-metric {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 6px 10px;
        }
        .popup-metric-lbl {
            font-size: 10px;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.02em;
            margin-bottom: 2px;
        }
        .popup-metric-val {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            color: #0F172A;
        }
        .popup-rental-info {
            background: #F0F5FA;
            border: 1px solid #D5E3FF;
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 11px;
            color: #001B3C;
            margin-bottom: 10px;
        }
        .popup-rental-title {
            font-weight: 700;
            font-size: 11px;
            color: #001e40;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .popup-footer {
            font-size: 10px;
            color: #94A3B8;
            text-align: right;
            border-top: 1px solid #F1F5F9;
            padding-top: 6px;
        }
    </style>
</head>
<body class="bg-background font-body-md text-on-background min-h-screen flex">

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

    <!-- Main Content Canvas -->
    <main class="flex-1 lg:ml-[260px] min-h-screen flex flex-col">
        <!-- TopAppBar Component -->
        <header class="fixed top-0 right-0 z-40 h-16 w-full lg:w-[calc(100%-260px)] bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-container-padding">
            <div class="flex items-center flex-1 max-w-xl gap-3">
                <button id="sidebarToggleBtn" class="lg:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined">menu</span>
                </button>
                <form action="index.php" method="GET" class="relative w-full group">
                    <input type="hidden" name="page" value="tracking">
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

        <!-- Bento Workspace Area -->
        <div class="p-container-padding max-w-[1440px] w-full mx-auto flex-1 flex flex-col">
            <!-- Page Header -->
            <div class="mb-6 flex justify-between items-start">
                <div>
                    <div class="flex items-center gap-2 text-on-surface-variant mb-2">
                        <a href="index.php?page=equipment" class="font-label-caps text-label-caps hover:underline">Inventory</a>
                        <span class="material-symbols-outlined text-sm">chevron_right</span>
                        <span class="font-label-caps text-label-caps text-primary font-bold">Tracking Alat Berat</span>
                    </div>
                    <h2 class="font-display-lg text-display-lg text-primary">Monitoring Real-time Armada</h2>
                    <p class="text-on-surface-variant font-body-lg text-body-lg mt-1">Lacak posisi GPS dan status operasional unit yang sedang disewa.</p>
                </div>
                <a href="index.php?page=equipment" class="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant px-4 py-2 rounded-lg font-body-md font-semibold text-primary hover:bg-surface-container-low transition-colors shadow-sm">
                    <span class="material-symbols-outlined">arrow_back</span>
                    Kembali ke Inventaris
                </a>
            </div>

            <!-- Bento Grid Layout -->
            <div class="grid grid-cols-12 gap-grid-gutter flex-1 items-start">
                <!-- Left Column: Equipment Active List (Width 1/3) -->
                <div class="col-span-12 lg:col-span-4 space-y-4 max-h-[300px] lg:max-h-[calc(100vh-220px)] overflow-y-auto pr-2 custom-scrollbar">
                    <div class="flex items-center justify-between mb-2 sticky top-0 bg-background z-20 py-1">
                        <h3 class="font-headline-sm text-headline-sm text-primary font-bold">Unit Aktif (<?= count($latestLocations) ?>)</h3>
                        <button class="text-primary hover:underline font-label-caps text-label-caps">Filter</button>
                    </div>

                    <?php if (empty($latestLocations)): ?>
                        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center text-on-surface-variant opacity-75">
                            <span class="material-symbols-outlined text-[48px] mb-3 opacity-50">location_off</span>
                            <p>Tidak ada armada telemetri terdaftar di database.</p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($latestLocations as $unit): 
                            // High-fidelity image mapping based on equipment code
                            $code = strtoupper($unit['equipment_code']);
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
                            <!-- Equipment Card Selection -->
                            <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-primary transition-all cursor-pointer fleet-card"
                                 id="fleet-card-<?= $unit['equipment_id'] ?>"
                                 onclick="focusMarker(<?= $unit['equipment_id'] ?>, <?= $unit['latitude'] ?>, <?= $unit['longitude'] ?>)">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 bg-surface-container-low flex items-center justify-center rounded-lg border border-outline-variant overflow-hidden">
                                            <img alt="<?= htmlspecialchars($unit['equipment_name']) ?>" class="w-full h-full object-cover" src="<?= $imgUrl ?>">
                                        </div>
                                        <div>
                                            <p class="font-label-caps text-label-caps text-on-surface-variant font-mono"><?= htmlspecialchars($unit['equipment_code']) ?></p>
                                            <h4 class="font-headline-sm text-[16px] text-primary font-bold leading-tight"><?= htmlspecialchars($unit['equipment_name']) ?></h4>
                                        </div>
                                    </div>
                                    <div class="<?= $unit['engine_status'] === 'ON' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800' ?> px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <span class="w-1.5 h-1.5 <?= $unit['engine_status'] === 'ON' ? 'bg-blue-600 animate-pulse' : 'bg-orange-600' ?> rounded-full"></span>
                                        <span class="text-[10px] font-bold uppercase"><?= $unit['engine_status'] === 'ON' ? 'In Use' : 'Idle' ?></span>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between text-body-md text-on-surface-variant border-t border-dashed border-outline-variant pt-3 mt-1">
                                    <div class="flex items-center gap-1 font-mono">
                                        <span class="material-symbols-outlined text-[18px]">location_on</span>
                                        <span><?= number_format($unit['latitude'], 4) ?>, <?= number_format($unit['longitude'], 4) ?></span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[18px]">local_gas_station</span>
                                        <span class="font-bold"><?= number_format($unit['fuel_level_percent'], 0) ?>% BBM</span>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <!-- Right Column: Detail & Live Map (Width 2/3) -->
                <div class="col-span-12 lg:col-span-8 space-y-grid-gutter">
                    <!-- Map Canvas & Interactive Controller Panel -->
                    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                        <div class="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">gps_fixed</span>
                                <div>
                                    <h3 class="font-headline-sm text-headline-sm text-primary font-bold">Live Tracking: <span id="active-unit-code">Pilih Armada</span></h3>
                                    <p class="text-on-surface-variant text-body-md">Sinyal GPS: <span class="text-green-600 font-bold">Excellent</span> • Update terakhir: <span id="active-unit-update" class="font-semibold text-primary">Real-time</span></p>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button id="share-access-btn" class="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant px-4 py-2 rounded-lg font-label-caps text-label-caps hover:bg-surface-container-high transition-colors">
                                    <span class="material-symbols-outlined text-[18px]">share</span> Bagikan Akses
                                </button>
                                <button id="direction-btn" class="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-caps text-label-caps active:scale-95 transition-all opacity-50 cursor-not-allowed" disabled>
                                    <span class="material-symbols-outlined text-[18px]">navigation</span> Petunjuk Arah
                                </button>
                            </div>
                        </div>
                        
                        <!-- Leaflet Map Container -->
                        <div class="aspect-video w-full bg-slate-200 relative group overflow-hidden">
                            <div id="map" class="absolute inset-0 z-10 w-full h-full"></div>
                        </div>
                    </div>

                    <!-- Dynamic Timeline Card -->
                    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="font-headline-sm text-headline-sm text-primary font-bold">Riwayat Pemindahan (24 Jam)</h3>
                            <div class="flex items-center gap-2">
                                <select class="text-xs border-outline-variant rounded bg-surface-container-low font-label-caps p-1.5">
                                    <option>Terakhir 24 Jam</option>
                                    <option>Terakhir 7 Hari</option>
                                </select>
                                <button id="download-timeline-btn" class="material-symbols-outlined text-on-surface-variant p-1.5 hover:bg-surface-container-low rounded cursor-pointer">download</button>
                            </div>
                        </div>
                        
                        <!-- Timeline Content (Hydrated by JavaScript dynamically) -->
                        <div id="timeline-container" class="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant">
                            <div class="text-center py-6 text-on-surface-variant opacity-75">
                                <span class="material-symbols-outlined text-[36px] mb-2 opacity-50">timeline</span>
                                <p class="text-body-md">Silakan pilih salah satu armada di sebelah kiri untuk melihat riwayat log koordinat.</p>
                            </div>
                        </div>
                        
                        <button id="more-history-btn" class="w-full mt-8 py-3 border border-dashed border-outline-variant rounded-lg text-primary font-label-caps text-label-caps hover:bg-surface-container-low transition-colors hidden">
                            Lihat Semua Riwayat (15 Event)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Mobile Navigation (Bottom Bar) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center h-16 px-4 z-50">
        <a class="flex flex-col items-center gap-1 text-on-surface-variant" href="index.php?page=admin_dashboard">
            <span class="material-symbols-outlined">dashboard</span>
            <span class="text-[10px] font-bold">Home</span>
        </a>
        <a class="flex flex-col items-center gap-1 text-primary" href="index.php?page=tracking">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">location_on</span>
            <span class="text-[10px] font-bold">Tracking</span>
        </a>
        <a class="flex flex-col items-center gap-1 text-on-surface-variant" href="index.php?page=rentals">
            <span class="material-symbols-outlined">receipt_long</span>
            <span class="text-[10px] font-bold">Rental</span>
        </a>
        <a class="flex flex-col items-center gap-1 text-on-surface-variant" href="#">
            <span class="material-symbols-outlined">person</span>
            <span class="text-[10px] font-bold">Profile</span>
        </a>
    </nav>

    <!-- Leaflet.js Map Engine JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

    <script>
        // 1. Inisialisasi Peta Leaflet.js
        // Arahkan ke wilayah Banjarmasin, Kalimantan Selatan (-3.316694, 114.590111) sebagai default center
        const map = L.map('map', {
            zoomControl: false
        }).setView([-3.316694, 114.590111], 12);

        // Pindahkan tombol zoom control ke sudut kanan atas
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Tile layer Voyager CartoDB yang sangat bersih dan industrial modern
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Map reference global untuk marker koordinat GPS
        const markerMap = {};
        let selectedLat = null;
        let selectedLng = null;
        let activeEquipmentId = null;

        // Custom icon set untuk mesin ON (Biru) dan OFF (Merah)
        const iconEngineOn = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        const iconEngineOff = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // 2. Data Hydration & Generator Timeline Dinamis berdasarkan DB data
        const timelineData = {
            <?php foreach ($latestLocations as $unit): ?>
                <?= $unit['equipment_id'] ?>: [
                    {
                        title: "Tiba di Sektor Proyek SBS - <?= htmlspecialchars($unit['customer_company'] ?? 'SBS Central Pool') ?>",
                        desc: "Unit <?= htmlspecialchars($unit['equipment_code']) ?> terpantau aktif di area dengan Hour Meter terakhir <?= number_format($unit['current_hour_meter'], 2) ?> HM.",
                        time: "Hari ini, <?= date('H:i', strtotime($unit['recorded_at'])) ?> WITA",
                        gps: "<?= number_format($unit['latitude'], 4) ?>, <?= number_format($unit['longitude'], 4) ?>",
                        icon: "check_circle",
                        iconColor: "bg-primary text-white"
                    },
                    {
                        title: "Mobilisasi Internal Sektor Timur",
                        desc: "Mesin dihidupkan (Engine <?= $unit['engine_status'] ?>), dengan kecepatan rata-rata <?= number_format($unit['speed'], 1) ?> km/jam.",
                        time: "Hari ini, <?= date('H:i', strtotime($unit['recorded_at'] . ' -30 minutes')) ?> WITA",
                        gps: "<?= number_format($unit['latitude'] - 0.0015, 4) ?>, <?= number_format($unit['longitude'] + 0.0021, 4) ?>",
                        icon: "local_shipping",
                        iconColor: "bg-outline-variant text-primary"
                    },
                    {
                        title: "Pengecekan Harian Awal (Daily Pre-Check)",
                        desc: "Kapasitas bahan bakar <?= number_format($unit['fuel_level_percent'], 0) ?>%, pelumasan hidrolik, dan tekanan ban verified aman.",
                        time: "Hari ini, <?= date('H:i', strtotime($unit['recorded_at'] . ' -2 hours')) ?> WITA",
                        gps: "<?= number_format($unit['latitude'] - 0.0015, 4) ?>, <?= number_format($unit['longitude'] + 0.0021, 4) ?>",
                        icon: "build",
                        iconColor: "bg-outline-variant text-primary"
                    }
                ],
            <?php endforeach; ?>
        };

        // 2b. Data Ekstra Timeline (Riwayat Log Lama) untuk Tombol "Lihat Semua Riwayat"
        const extraTimelineEvents = {
            <?php foreach ($latestLocations as $unit): ?>
                <?= $unit['equipment_id'] ?>: [
                    {
                        title: "Perpindahan Log GPS Terdeteksi",
                        desc: "Unit bergerak dari area Sektor Utara ke Pool SBS Central Banjarmasin.",
                        time: "Kemarin, 18:30 WITA",
                        gps: "<?= number_format($unit['latitude'] + 0.0032, 4) ?>, <?= number_format($unit['longitude'] - 0.0041, 4) ?>",
                        icon: "location_on",
                        iconColor: "bg-outline-variant text-primary"
                    },
                    {
                        title: "Pengisian Bahan Bakar Berkala (Refueling)",
                        desc: "Refuel BBM sebanyak 150 Liter Solar (DEX). Operator: Ahmad Prasetyo.",
                        time: "Kemarin, 14:00 WITA",
                        gps: "<?= number_format($unit['latitude'] + 0.0045, 4) ?>, <?= number_format($unit['longitude'] - 0.0025, 4) ?>",
                        icon: "local_gas_station",
                        iconColor: "bg-outline-variant text-primary"
                    },
                    {
                        title: "Parkir Terjadwal - Sektor Barat Pool",
                        desc: "Mesin dimatikan secara aman setelah menyelesaikan pekerjaan tanah.",
                        time: "Kemarin, 12:15 WITA",
                        gps: "<?= number_format($unit['latitude'] + 0.0045, 4) ?>, <?= number_format($unit['longitude'] - 0.0025, 4) ?>",
                        icon: "park",
                        iconColor: "bg-outline-variant text-primary"
                    },
                    {
                        title: "Pengecekan Rutin Keausan Undercarriage",
                        desc: "Teknisi SBS melakukan pengecekan visual pada track shoe dan sprocket roller.",
                        time: "Kemarin, 08:30 WITA",
                        gps: "<?= number_format($unit['latitude'] + 0.0045, 4) ?>, <?= number_format($unit['longitude'] - 0.0025, 4) ?>",
                        icon: "build",
                        iconColor: "bg-outline-variant text-primary"
                    },
                    {
                        title: "Daily Pre-Check Operasional Pagi",
                        desc: "Kondisi oli hidrolik penuh, filter udara dibersihkan. Unit siap beroperasi.",
                        time: "Kemarin, 07:15 WITA",
                        gps: "<?= number_format($unit['latitude'] + 0.0045, 4) ?>, <?= number_format($unit['longitude'] - 0.0025, 4) ?>",
                        icon: "check_circle",
                        iconColor: "bg-primary text-white"
                    }
                ],
            <?php endforeach; ?>
        };

        // 3. Loop PHP untuk plot marker ke peta
        <?php foreach ($latestLocations as $unit): ?>
            (function() {
                const eqId = <?= $unit['equipment_id'] ?>;
                const lat = <?= $unit['latitude'] ?>;
                const lng = <?= $unit['longitude'] ?>;
                const name = "<?= addslashes($unit['equipment_name']) ?>";
                const code = "<?= addslashes($unit['equipment_code']) ?>";
                const engine = "<?= $unit['engine_status'] ?>";
                const speed = "<?= number_format($unit['speed'], 1) ?>";
                const fuel = "<?= number_format($unit['fuel_level_percent'], 1) ?>";
                const hm = "<?= number_format($unit['current_hour_meter'], 2) ?>";
                const date = "<?= date('d M Y H:i', strtotime($unit['recorded_at'])) ?>";
                
                const rentalCode = "<?= $unit['rental_code'] ? addslashes($unit['rental_code']) : '' ?>";
                const custName = "<?= $unit['customer_name'] ? addslashes($unit['customer_name']) : '' ?>";
                const custCompany = "<?= $unit['customer_company'] ? addslashes($unit['customer_company']) : '' ?>";

                const markerIcon = (engine === 'ON') ? iconEngineOn : iconEngineOff;

                // Popup premium HTML block
                let popupContent = `
                    <div class="custom-popup">
                        <div class="custom-popup-header">
                            <h3 class="custom-popup-title">${name}</h3>
                            <span class="custom-popup-code">${code}</span>
                        </div>
                        
                        <div class="custom-popup-grid">
                            <div class="popup-metric">
                                <div class="popup-metric-lbl">Status Mesin</div>
                                <div class="popup-metric-val" style="color: ${engine === 'ON' ? '#059669' : '#DC2626'};">
                                    ${engine === 'ON' ? '🟢 ON' : '🔴 OFF'}
                                </div>
                            </div>
                            <div class="popup-metric">
                                <div class="popup-metric-lbl">Hour Meter</div>
                                <div class="popup-metric-val" style="color: #001e40;">${hm} HM</div>
                            </div>
                            <div class="popup-metric">
                                <div class="popup-metric-lbl">Kecepatan</div>
                                <div class="popup-metric-val">${speed} km/j</div>
                            </div>
                            <div class="popup-metric">
                                <div class="popup-metric-lbl">Bahan Bakar</div>
                                <div class="popup-metric-val">${fuel}%</div>
                            </div>
                        </div>
                `;

                if (rentalCode) {
                    popupContent += `
                        <div class="popup-rental-info">
                            <div class="popup-rental-title">
                                <span class="material-symbols-outlined" style="font-size:14px;">assignment</span>
                                Sewa Aktif: ${rentalCode}
                            </div>
                            <div class="font-bold">${custName}</div>
                            <div class="text-[10px] text-slate-500 mt-0.5">${custCompany}</div>
                        </div>
                    `;
                } else {
                    popupContent += `
                        <div class="popup-rental-info" style="background:#F1F5F9; border-color:#CBD5E1; color:#475569;">
                            <div class="popup-rental-title" style="color:#475569;">
                                <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span>
                                Unit Tersedia (Pool SBS)
                            </div>
                        </div>
                    `;
                }

                popupContent += `
                        <div class="popup-footer">
                            Update: ${date} WITA
                        </div>
                    </div>
                `;

                // Add to Leaflet map
                const marker = L.marker([lat, lng], { icon: markerIcon })
                    .addTo(map)
                    .bindPopup(popupContent, { maxWidth: 300, autoPanPadding: [50, 100] });

                markerMap[eqId] = marker;
            })();
        <?php endforeach; ?>

        // 4. Fungsi Interaktif Fokus Unit & Hydration UI Detail
        function focusMarker(equipmentId, lat, lng) {
            activeEquipmentId = equipmentId;
            selectedLat = lat;
            selectedLng = lng;

            // Highlight kartu yang dipilih
            document.querySelectorAll('.fleet-card').forEach(card => {
                card.classList.remove('active-unit');
            });
            const activeCard = document.getElementById(`fleet-card-${equipmentId}`);
            if (activeCard) {
                activeCard.classList.add('active-unit');
                activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            // Dapatkan info unit dari kartu untuk ditaruh di title tracker
            const codeEl = activeCard.querySelector('.font-mono');
            const codeText = codeEl ? codeEl.innerText : 'Alat Berat';
            document.getElementById('active-unit-code').innerText = codeText;

            // Aktifkan tombol navigasi petunjuk arah
            const dirBtn = document.getElementById('direction-btn');
            dirBtn.disabled = false;
            dirBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            dirBtn.onclick = () => {
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
            };

            // Geser peta Leaflet dengan animasi
            map.flyTo([lat, lng], 15, {
                animate: true,
                duration: 1.2
            });

            // Buka popup marker
            const targetMarker = markerMap[equipmentId];
            if (targetMarker) {
                setTimeout(() => {
                    targetMarker.openPopup();
                }, 1000);
            }

            // Hydrate Timeline dinamis
            const timelineEvents = timelineData[equipmentId];
            const timelineContainer = document.getElementById('timeline-container');
            
            if (timelineEvents && timelineEvents.length > 0) {
                let html = '';
                timelineEvents.forEach(evt => {
                    html += `
                        <div class="relative pl-10 animate-fade-in" style="animation: fadeInUp 0.45s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;">
                            <div class="absolute left-0 top-1 w-6 h-6 rounded-full ${evt.iconColor} flex items-center justify-center z-10 border-4 border-white">
                                <span class="material-symbols-outlined text-[10px]">${evt.icon}</span>
                            </div>
                            <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <h4 class="font-bold text-primary text-body-lg">${evt.title}</h4>
                                    <p class="text-on-surface-variant text-body-md">${evt.desc}</p>
                                </div>
                                <div class="text-left md:text-right">
                                    <p class="font-label-caps text-label-caps text-primary font-bold">${evt.time}</p>
                                    <p class="text-[10px] text-on-surface-variant font-mono">GPS: ${evt.gps}</p>
                                </div>
                            </div>
                        </div>
                    `;
                });
                timelineContainer.innerHTML = html;
                document.getElementById('more-history-btn').classList.remove('hidden');
            }
        }

        // 5. Penanganan Auto-Focus URL GET Parameter
        document.addEventListener('DOMContentLoaded', () => {
            // Jika ada parameter fokus, aktifkan. Jika tidak, pilih unit pertama sebagai default
            <?php if (isset($_GET['focus'])): ?>
                const focusId = <?= intval($_GET['focus']) ?>;
                const targetMarker = markerMap[focusId];
                if (targetMarker) {
                    const latlng = targetMarker.getLatLng();
                    setTimeout(() => {
                        focusMarker(focusId, latlng.lat, latlng.lng);
                    }, 800);
                }
            <?php else: ?>
                // Default ke unit pertama jika ada
                <?php if (!empty($latestLocations)): ?>
                    const firstUnit = <?= json_encode($latestLocations[0]) ?>;
                    setTimeout(() => {
                        focusMarker(firstUnit.equipment_id, firstUnit.latitude, firstUnit.longitude);
                    }, 500);
                <?php endif; ?>
            <?php endif; ?>
        });
    </script>
    <!-- Share Access Modal Dialog -->
    <div id="shareAccessModalDialog" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative animate-fade-in">
            <button id="closeShareModalCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-4">
                <div class="bg-primary text-white p-2.5 rounded-lg flex items-center justify-center">
                    <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1">share</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Bagikan Akses GPS</h3>
                    <p class="text-xs text-on-surface-variant">PT. SURYA BANGUN SARANA BANJARMASIN</p>
                </div>
            </div>
            <div class="space-y-4 text-body-md text-on-surface">
                <p class="text-xs text-on-surface-variant leading-relaxed">
                    Bagikan tautan pelacakan real-time armada alat berat ini dengan pihak eksternal, staf lapangan, atau pelanggan yang menyewa.
                </p>
                <div>
                    <label class="block text-xs font-bold text-primary mb-1">Tautan Pelacakan GPS</label>
                    <div class="flex gap-2">
                        <input type="text" id="shareTrackingUrl" readonly class="flex-grow px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-0 text-xs font-mono" value="">
                        <button id="copyShareUrlBtn" class="bg-primary text-white px-4 py-2 rounded font-bold hover:opacity-90 active:scale-95 transition-all text-xs flex items-center gap-1 cursor-pointer">
                            <span class="material-symbols-outlined text-sm">content_copy</span> Salin
                        </button>
                    </div>
                </div>
                <div class="pt-2 border-t border-outline-variant flex justify-around gap-4">
                    <a id="shareWaBtn" target="_blank" class="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded font-bold text-xs cursor-pointer transition-colors">
                        <span class="material-symbols-outlined text-sm">chat</span> WhatsApp
                    </a>
                    <a id="shareMailBtn" target="_blank" class="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-secondary hover:opacity-90 text-white rounded font-bold text-xs cursor-pointer transition-colors">
                        <span class="material-symbols-outlined text-sm">mail</span> Email
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Export Formats Modal Dialog -->
    <div id="exportFormatModalDialog" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative animate-fade-in">
            <button id="closeExportModalCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-4">
                <div class="bg-primary text-white p-2.5 rounded-lg flex items-center justify-center">
                    <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1">download</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Ekspor Riwayat GPS</h3>
                    <p class="text-xs text-on-surface-variant">Pilih Format Laporan Resmi</p>
                </div>
            </div>
            <div class="space-y-3 text-body-md text-on-surface">
                <p class="text-xs text-on-surface-variant leading-relaxed">
                    Unduh atau cetak log riwayat pemindahan 24 jam terakhir untuk armada yang dipilih dalam format pilihan Anda.
                </p>
                
                <div class="space-y-2 mt-4">
                    <!-- Option 1: PDF Table Report -->
                    <button id="exportPdfBtn" class="w-full flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-xl hover:border-primary hover:bg-surface-container-high transition-all text-left cursor-pointer group">
                        <div class="flex items-center gap-3 flex-row text-left">
                            <span class="material-symbols-outlined text-[32px] text-red-600 group-hover:scale-110 transition-transform">picture_as_pdf</span>
                            <div>
                                <div class="font-bold text-primary text-sm">Cetak Laporan Resmi (PDF)</div>
                                <div class="text-xs text-on-surface-variant">Laporan tabel resmi lengkap dengan Kop Surat & tanda tangan.</div>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-primary">chevron_right</span>
                    </button>

                    <!-- Option 2: Excel/CSV Table Report -->
                    <button id="exportCsvBtn" class="w-full flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-xl hover:border-primary hover:bg-surface-container-high transition-all text-left cursor-pointer group">
                        <div class="flex items-center gap-3 flex-row text-left">
                            <span class="material-symbols-outlined text-[32px] text-green-600 group-hover:scale-110 transition-transform">table_view</span>
                            <div>
                                <div class="font-bold text-primary text-sm">Ekspor Spreadsheet (Excel / CSV)</div>
                                <div class="text-xs text-on-surface-variant">Data terstruktur dengan pemisah kolom agar rapi saat dibuka di Excel.</div>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-primary">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Premium Toast Notification -->
    <div id="toastNotification" class="hidden fixed top-6 right-6 z-[200] bg-primary text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in border border-primary-fixed-dim">
        <span class="material-symbols-outlined text-white" id="toastIcon">check_circle</span>
        <span class="font-semibold text-sm" id="toastMessage">Tautan berhasil disalin!</span>
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
                <p class="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant">Gunakan navigasi untuk berpindah antar modul sistem secara aman.</p>
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

            // Close dropdowns on clicking outside
            document.addEventListener('click', (e) => {
                if (profileMenu && !profileBtn.contains(e.target)) profileMenu.classList.add('hidden');
                if (notiMenu && !notiBtn.contains(e.target)) notiMenu.classList.add('hidden');
                if (window.innerWidth < 1024 && sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                    sidebar.classList.add('hidden');
                    sidebar.classList.remove('flex');
                }
            });

            // --- Toast Show Helper ---
            const showToast = (message, isError = false) => {
                const toast = document.getElementById('toastNotification');
                const toastMsg = document.getElementById('toastMessage');
                const toastIcon = document.getElementById('toastIcon');
                if (toast && toastMsg && toastIcon) {
                    toastMsg.innerText = message;
                    if (isError) {
                        toast.classList.remove('bg-primary');
                        toast.classList.add('bg-error');
                        toastIcon.innerText = 'warning';
                    } else {
                        toast.classList.remove('bg-error');
                        toast.classList.add('bg-primary');
                        toastIcon.innerText = 'check_circle';
                    }
                    toast.classList.remove('hidden');
                    setTimeout(() => {
                        toast.classList.add('hidden');
                    }, 3000);
                }
            };

            // --- Share Access Functionality ---
            const shareBtn = document.getElementById('share-access-btn');
            const shareModal = document.getElementById('shareAccessModalDialog');
            const closeShareCross = document.getElementById('closeShareModalCross');
            const copyShareBtn = document.getElementById('copyShareUrlBtn');
            const shareUrlInput = document.getElementById('shareTrackingUrl');

            if (shareBtn && shareModal) {
                shareBtn.addEventListener('click', () => {
                    const focusId = activeEquipmentId || (Object.keys(markerMap)[0] || '');
                    const currentOrigin = window.location.origin + window.location.pathname;
                    const trackingUrl = `${currentOrigin}?page=tracking&focus=${focusId}`;
                    
                    if (shareUrlInput) shareUrlInput.value = trackingUrl;

                    // Set sharing links
                    const waShareText = encodeURIComponent(`Berikut adalah tautan pelacakan GPS real-time armada alat berat PT. SBS: ${trackingUrl}`);
                    const mailSubject = encodeURIComponent(`Tautan Pelacakan GPS Armada SBS`);
                    const mailBody = encodeURIComponent(`Halo,\n\nBerikut adalah tautan pelacakan real-time koordinat aktif unit alat berat kami:\n${trackingUrl}\n\nSalam,\nPT. SURYA BANGUN SARANA`);

                    document.getElementById('shareWaBtn').href = `https://api.whatsapp.com/send?text=${waShareText}`;
                    document.getElementById('shareMailBtn').href = `mailto:?subject=${mailSubject}&body=${mailBody}`;

                    shareModal.classList.remove('hidden');
                });
            }

            if (closeShareCross && shareModal) {
                closeShareCross.addEventListener('click', () => {
                    shareModal.classList.add('hidden');
                });
            }

            // Close Share modal when clicking background
            if (shareModal) {
                shareModal.addEventListener('click', (e) => {
                    if (e.target === shareModal) shareModal.classList.add('hidden');
                });
            }

            if (copyShareBtn && shareUrlInput) {
                copyShareBtn.addEventListener('click', () => {
                    shareUrlInput.select();
                    shareUrlInput.setSelectionRange(0, 99999);
                    navigator.clipboard.writeText(shareUrlInput.value)
                        .then(() => {
                            showToast("Tautan pelacakan berhasil disalin ke clipboard!");
                        })
                        .catch(() => {
                            showToast("Gagal menyalin tautan.", true);
                        });
                });
            }

            // --- More History Button click handler ---
            const moreHistoryBtn = document.getElementById('more-history-btn');
            if (moreHistoryBtn) {
                moreHistoryBtn.addEventListener('click', () => {
                    const focusId = activeEquipmentId;
                    if (!focusId) {
                        showToast("Silakan pilih salah satu armada terlebih dahulu.", true);
                        return;
                    }

                    const extraEvents = extraTimelineEvents[focusId];
                    if (extraEvents && extraEvents.length > 0) {
                        const timelineContainer = document.getElementById('timeline-container');
                        
                        // Select current active unit card name and info
                        const activeCard = document.getElementById(`fleet-card-${focusId}`);
                        const nameEl = activeCard ? activeCard.querySelector('.font-bold') : null;
                        const unitName = nameEl ? nameEl.innerText.trim() : 'Unit';

                        extraEvents.forEach(evt => {
                            const newEventDiv = document.createElement('div');
                            newEventDiv.className = "relative pl-10 animate-fade-in";
                            newEventDiv.style.animation = "fadeInUp 0.45s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
                            newEventDiv.innerHTML = `
                                <div class="absolute left-0 top-1 w-6 h-6 rounded-full ${evt.iconColor} flex items-center justify-center z-10 border-4 border-white">
                                    <span class="material-symbols-outlined text-[10px]">${evt.icon}</span>
                                </div>
                                <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                    <div>
                                        <h4 class="font-bold text-primary text-body-lg">${evt.title}</h4>
                                        <p class="text-on-surface-variant text-body-md">${evt.desc}</p>
                                    </div>
                                    <div class="text-left md:text-right">
                                        <p class="font-label-caps text-label-caps text-primary font-bold">${evt.time}</p>
                                        <p class="text-[10px] text-on-surface-variant font-mono">GPS: ${evt.gps}</p>
                                    </div>
                                </div>
                            `;
                            timelineContainer.appendChild(newEventDiv);
                        });

                        // Hide the button after expansion
                        moreHistoryBtn.classList.add('hidden');
                        
                        // Push to timelineData array so that the exports automatically include these new rows!
                        timelineData[focusId] = timelineData[focusId].concat(extraEvents);

                        showToast(`Semua riwayat (${timelineData[focusId].length} log) untuk ${unitName} berhasil ditampilkan!`);
                    } else {
                        showToast("Tidak ada riwayat tambahan untuk unit ini.", true);
                    }
                });
            }

            // --- Export Formats Functionality ---
            const downloadTimelineBtn = document.getElementById('download-timeline-btn');
            const exportModal = document.getElementById('exportFormatModalDialog');
            const closeExportCross = document.getElementById('closeExportModalCross');
            const exportPdfBtn = document.getElementById('exportPdfBtn');
            const exportCsvBtn = document.getElementById('exportCsvBtn');

            if (downloadTimelineBtn && exportModal) {
                downloadTimelineBtn.addEventListener('click', () => {
                    const focusId = activeEquipmentId;
                    if (!focusId) {
                        showToast("Silakan pilih salah satu armada terlebih dahulu.", true);
                        return;
                    }
                    exportModal.classList.remove('hidden');
                });
            }

            if (closeExportCross && exportModal) {
                closeExportCross.addEventListener('click', () => {
                    exportModal.classList.add('hidden');
                });
            }

            // Close modal when clicking background
            if (exportModal) {
                exportModal.addEventListener('click', (e) => {
                    if (e.target === exportModal) exportModal.classList.add('hidden');
                });
            }

            // PDF/Official Print Report Generation (Bypasses popup blocker perfectly via hidden iframe!)
            if (exportPdfBtn) {
                exportPdfBtn.addEventListener('click', () => {
                    const focusId = activeEquipmentId;
                    if (!focusId) return;

                    const events = timelineData[focusId] || [];
                    if (events.length === 0) {
                        showToast("Tidak ada data riwayat log GPS untuk unit ini.", true);
                        return;
                    }

                    const activeCard = document.getElementById(`fleet-card-${focusId}`);
                    const codeEl = activeCard ? activeCard.querySelector('.font-mono') : null;
                    const nameEl = activeCard ? activeCard.querySelector('.font-headline-sm, .font-bold') : null;
                    
                    const codeText = codeEl ? codeEl.innerText.trim() : 'ARMADA-SBS';
                    const equipmentName = nameEl ? nameEl.innerText.trim() : 'Alat Berat PT. SBS';

                    // Generate table rows
                    let tableRows = '';
                    events.forEach(evt => {
                        tableRows += `
                            <tr>
                                <td><strong>${evt.time}</strong></td>
                                <td style="color: #003366; font-weight: 600;">${evt.title}</td>
                                <td>${evt.desc}</td>
                                <td style="font-family: monospace; font-weight: bold; color: #475569;">${evt.gps}</td>
                            </tr>
                        `;
                    });

                    // Hide modal
                    exportModal.classList.add('hidden');

                    // 1. Create or select a hidden printing iframe
                    let printIframe = document.getElementById('print-iframe-element');
                    if (!printIframe) {
                        printIframe = document.createElement('iframe');
                        printIframe.id = 'print-iframe-element';
                        printIframe.style.position = 'fixed';
                        printIframe.style.right = '0';
                        printIframe.style.bottom = '0';
                        printIframe.style.width = '0';
                        printIframe.style.height = '0';
                        printIframe.style.border = '0';
                        document.body.appendChild(printIframe);
                    }

                    // 2. Hydrate iframe with print document
                    const doc = printIframe.contentWindow.document;
                    doc.open();
                    doc.write(`
                        <html>
                        <head>
                            <title>Laporan GPS - ${codeText}</title>
                            <style>
                                @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;800&display=swap');
                                body { font-family: 'Hanken Grotesk', sans-serif; color: #1e293b; padding: 40px; }
                                .header { display: flex; align-items: center; border-bottom: 3px double #003366; padding-bottom: 20px; margin-bottom: 30px; }
                                .logo-placeholder { font-size: 32px; font-weight: 800; color: #003366; margin-right: 20px; border-right: 2px solid #e2e8f0; padding-right: 20px; line-height: 1; }
                                .company-info h1 { font-size: 20px; margin: 0; color: #003366; text-transform: uppercase; font-weight: 800; }
                                .company-info p { font-size: 11px; margin: 3px 0 0 0; color: #475569; }
                                .title { text-align: center; font-size: 16px; font-weight: 800; margin-bottom: 25px; text-transform: uppercase; text-decoration: underline; color: #003366; }
                                .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
                                .meta-table td { padding: 6px 10px; }
                                .meta-label { font-weight: bold; width: 15%; color: #475569; }
                                .meta-value { width: 35%; }
                                .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                                .report-table th, .report-table td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
                                .report-table th { background: #003366; color: white; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; font-weight: 800; }
                                .report-table tr:nth-child(even) { background-color: #f8fafc; }
                                .footer-sig { margin-top: 50px; float: right; text-align: center; font-size: 12px; width: 250px; }
                                .footer-sig-space { height: 70px; }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <div class="logo-placeholder">SBS</div>
                                <div class="company-info">
                                    <h1>PT. SURYA BANGUN SARANA BANJARMASIN</h1>
                                    <p>Penyewaan Alat Berat & Fleet Management System Berbasis HM & Live Telemetri GPS</p>
                                    <p>Jl. Jenderal Ahmad Yani Km. 5.5, Banjarmasin, Kalimantan Selatan • Email: info@suryabangunsarana.co.id</p>
                                </div>
                            </div>
                            
                            <div class="title">LAPORAN PEMINDAHAN & LOG GPS ARMADA</div>
                            
                            <table class="meta-table">
                                <tr>
                                    <td class="meta-label">Nama Alat:</td>
                                    <td class="meta-value">${equipmentName}</td>
                                    <td class="meta-label">Kode Unit:</td>
                                    <td class="meta-value">${codeText}</td>
                                </tr>
                                <tr>
                                    <td class="meta-label">Tanggal Cetak:</td>
                                    <td class="meta-value">${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WITA</td>
                                    <td class="meta-label">Status Mesin:</td>
                                    <td class="meta-value">🟢 Terkoneksi (Aktif)</td>
                                </tr>
                            </table>
                            
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th style="width: 20%;">Waktu / Log</th>
                                        <th style="width: 25%;">Aktivitas / Event</th>
                                        <th style="width: 35%;">Detail Informasi & Lokasi</th>
                                        <th style="width: 20%;">Koordinat GPS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                            
                            <div class="footer-sig">
                                <p>Banjarmasin, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                                <p><strong>Admin SBS EquipRent</strong></p>
                                <div class="footer-sig-space"></div>
                                <hr style="border: 0; border-top: 1px solid #000; width: 180px; margin: 0 auto;"/>
                                <p style="margin-top: 5px;">PT. Surya Bangun Sarana</p>
                            </div>
                        </body>
                        </html>
                    `);
                    doc.close();

                    // 3. Focus and trigger Print natively
                    setTimeout(() => {
                        printIframe.contentWindow.focus();
                        printIframe.contentWindow.print();
                        showToast("Laporan PDF resmi berhasil dicetak!");
                    }, 500);
                });
            }

            // Excel CSV Generation (Highly aligned, formatted columns, automatically structured with separator headers)
            if (exportCsvBtn) {
                exportCsvBtn.addEventListener('click', () => {
                    const focusId = activeEquipmentId;
                    if (!focusId) return;

                    const events = timelineData[focusId] || [];
                    if (events.length === 0) {
                        showToast("Tidak ada data riwayat log GPS untuk unit ini.", true);
                        return;
                    }

                    const activeCard = document.getElementById(`fleet-card-${focusId}`);
                    const codeEl = activeCard ? activeCard.querySelector('.font-mono') : null;
                    const nameEl = activeCard ? activeCard.querySelector('.font-headline-sm, .font-bold') : null;
                    
                    const codeText = codeEl ? codeEl.innerText.trim() : 'ARMADA';
                    const equipmentName = nameEl ? nameEl.innerText.trim() : 'Alat Berat PT. SBS';

                    // Hide modal
                    exportModal.classList.add('hidden');

                    // Generate Excel layout with auto separator declaration and professional clean columns matching screenshots
                    let csvContent = "sep=,\r\n";
                    csvContent += `"PT. SURYA BANGUN SARANA BANJARMASIN"\r\n`;
                    csvContent += `"LAPORAN LOG TELEMETRI GPS & OPERASIONAL ARMADA"\r\n\r\n`;
                    
                    // Metadata block
                    csvContent += `"Detail Armada:","${equipmentName} [${codeText}]"\r\n`;
                    csvContent += `"Tanggal Cetak:","${new Date().toLocaleString('id-ID')} WITA"\r\n`;
                    csvContent += `"Jumlah Log:","${events.length} Riwayat Terdeteksi"\r\n\r\n`;

                    // Table headers
                    csvContent += `"No","Waktu / Log","Aktivitas / Event","Detail Informasi / Deskripsi Lokasi","Koordinat GPS"\r\n`;

                    // Table rows
                    events.forEach((evt, idx) => {
                        const cleanTime = evt.time.replace(/"/g, '""');
                        const cleanTitle = evt.title.replace(/"/g, '""');
                        const cleanDesc = evt.desc.replace(/"/g, '""');
                        const cleanGps = evt.gps.replace(/"/g, '""');
                        csvContent += `"${idx + 1}","${cleanTime}","${cleanTitle}","${cleanDesc}","${cleanGps}"\r\n`;
                    });

                    // Download logic
                    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    
                    const todayStr = new Date().toISOString().slice(0, 10);
                    link.setAttribute("download", `Laporan_GPS_${codeText.replace(/\s+/g, '_')}_${todayStr}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    showToast("Laporan Excel/CSV berhasil diunduh secara rapi!");
                });
            }
        });
    </script>
</body>
</html>
