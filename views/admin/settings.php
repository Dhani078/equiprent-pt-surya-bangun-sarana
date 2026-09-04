<?php
/**
 * ============================================================================
 * VIEW: views/admin/settings.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Halaman Pengaturan Akun Administrator.
 * Menyajikan form perubahan data diri profil admin dan password secara aman.
 * 
 * INTEGRITAS VISUAL MUTLAK (100% REPLIKASI DOM DARI PROTOTIPE ASLI STITCH):
 * - Menggunakan Hanken Grotesk (UI) & JetBrains Mono (Data Log)
 * - Sidebar Navigation 6 Menu utama dari sistem dengan penanda bar aktif
 * - Bento Quick Stats yang menampilkan metrik riil (Total, Admin, Staff, Active)
 * - Skema warna, roundness, dan avatar yang konsisten dengan template asli.
 */

$fullName = $_SESSION['full_name'] ?? 'Alex Thompson';
$role = $_SESSION['role'] ?? 'SENIOR ADMIN';
$currentPage = 'admin_settings'; 

$fullNameProfile = $user['full_name'] ?? $fullName;
$emailProfile = $user['email'] ?? 'admin@suryabangun.co.id';
$phoneProfile = $user['phone'] ?? '-';
$addressProfile = $user['address'] ?? '-';
$usernameProfile = $user['username'] ?? 'admin';
$statusProfile = $user['status'] ?? 'ACTIVE';
$userIdProfile = $user['id'] ?? $_SESSION['user_id'];
$createdAtProfile = $user['created_at'] ?? date('Y-m-d H:i:s');
$joinDays = max(1, round((time() - strtotime($createdAtProfile)) / (60 * 60 * 24)));

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
    <title>SBS EquipRent | Admin Settings</title>
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@500;700&amp;display=swap" rel="stylesheet">
    
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
        .card-hover { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid #e2e8f0; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0px 10px 20px rgba(15, 23, 42, 0.04); }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(12px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in {
            animation: fadeInUp 0.45s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
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

    <!-- TopAppBar -->
    <header class="fixed top-0 right-0 z-40 h-16 w-full lg:w-[calc(100%-260px)] bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-container-padding">
        <div class="flex items-center flex-1 max-w-xl gap-3">
            <button id="sidebarToggleBtn" class="lg:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors flex items-center justify-center">
                <span class="material-symbols-outlined">menu</span>
            </button>
            <div class="relative w-full group">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" data-icon="search">search</span>
                <input class="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-10 pr-4 font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="Search setting parameters..." type="text">
            </div>
        </div>
        
        <div class="flex items-center gap-4 relative">
            <!-- Notifications Menu -->
            <div class="relative">
                <button id="notiBellBtn" class="relative p-2 text-on-surface-variant hover:text-primary transition-colors">
                    <span class="material-symbols-outlined" data-icon="notifications">notifications</span>
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
                <span class="material-symbols-outlined" data-icon="help">help</span>
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
    <main class="ml-0 lg:ml-[260px] pt-24 px-container-padding pb-container-padding min-h-screen w-full flex flex-col">
        <div class="max-w-[1200px] mx-auto w-full animate-fade-in flex-1">
            <!-- Page Header -->
            <div class="mb-8">
                <nav class="flex items-center gap-2 text-on-surface-variant font-label-caps text-[10px] mb-2">
                    <span>DASHBOARD</span>
                    <span class="material-symbols-outlined text-[12px]" data-icon="chevron_right">chevron_right</span>
                    <span class="text-primary font-bold">SETTINGS</span>
                </nav>
                <h2 class="font-display-lg text-display-lg text-primary font-bold">Pengaturan Profil & Keamanan</h2>
            </div>
            
            <!-- Feedback Alerts -->
            <?php if (isset($_SESSION['success'])): ?>
                <div class="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-3 mb-6" id="successMsgBox">
                    <span class="material-symbols-outlined text-green-600">check_circle</span>
                    <span class="font-body-md text-body-md"><?= htmlspecialchars($_SESSION['success']) ?></span>
                    <?php unset($_SESSION['success']); ?>
                </div>
            <?php endif; ?>

            <?php if (isset($_SESSION['error'])): ?>
                <div class="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-3 mb-6" id="errorMsgBox">
                    <span class="material-symbols-outlined text-red-600">error</span>
                    <span class="font-body-md text-body-md"><?= htmlspecialchars($_SESSION['error']) ?></span>
                    <?php unset($_SESSION['error']); ?>
                </div>
            <?php endif; ?>

            <div class="grid grid-cols-12 gap-grid-gutter pb-24">
                <!-- Left Side: Profile Photo & Loyalty/Details Card -->
                <div class="col-span-12 lg:col-span-4 space-y-grid-gutter">
                    <!-- Profile Preview Card -->
                    <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant text-center relative overflow-hidden card-hover">
                        <div class="absolute top-0 left-0 w-full h-20 bg-primary/5"></div>
                        <div class="relative mt-4">
                            <div class="w-28 h-28 rounded-full mx-auto border-4 border-white overflow-hidden shadow-md mb-4 relative">
                                <img alt="<?= htmlspecialchars($fullNameProfile) ?>" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrBcmSrnbntWcia3KJnw26tekj6DtmNQuQxMmeVth0yipYVzgWLeDhFWq9fIET29MTnXHcphawH84GtX0QKUn674CECR_Ert7pJx5Kg7iwaIhEqarxhPCOm_oJUcMiipl1TeEEBzjC0nvlKYotrhSpK34vIenu58vwJoz_1IQwMcWIpVjNtvyEySMiIfsUJNIT3lu6V6MOK3cAocedDaF_2_eeDdYGRYmrr81bVFgYOECUv49rqJVcLeLzUEuVzC-8korifSzbteMw">
                            </div>
                            <h4 class="font-headline-sm text-headline-sm font-bold text-primary"><?= htmlspecialchars($fullNameProfile) ?></h4>
                            <p class="font-label-caps text-[10px] text-on-surface-variant uppercase mt-1 tracking-wider"><?= htmlspecialchars($role) ?></p>
                            
                            <div class="mt-6 pt-6 border-t border-outline-variant grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <p class="text-[10px] font-bold text-on-surface-variant uppercase">ID Karyawan</p>
                                    <p class="font-body-md font-bold text-primary">ADM-<?= sprintf('%04d', $userIdProfile) ?></p>
                                </div>
                                <div>
                                    <p class="text-[10px] font-bold text-on-surface-variant uppercase">Masa Dinas</p>
                                    <p class="font-body-md font-bold text-primary"><?= $joinDays ?> Hari</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Terminal Info Card -->
                    <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover">
                        <h4 class="font-body-lg font-bold text-primary mb-4 flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">verified_user</span>
                            Informasi Sesi Aktif
                        </h4>
                        <div class="space-y-3 font-body-md text-on-surface">
                            <div class="flex justify-between items-center py-2 border-b border-outline-variant/30">
                                <span class="text-on-surface-variant">Status Sesi</span>
                                <span class="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-bold">Terautentikasi</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-outline-variant/30">
                                <span class="text-on-surface-variant">Hak Akses</span>
                                <span class="text-primary font-bold text-xs"><?= htmlspecialchars($role) ?></span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-outline-variant/30">
                                <span class="text-on-surface-variant">Login Terakhir</span>
                                <span class="text-on-surface-variant text-xs"><?= date('d M Y H:i') ?> WITA</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Side: Edit Form Fields -->
                <div class="col-span-12 lg:col-span-8">
                    <form method="POST" action="index.php?page=admin_settings" class="space-y-grid-gutter">
                        <!-- Data Pribadi Section -->
                        <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover">
                            <h3 class="font-headline-sm text-headline-sm text-primary mb-6 flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">account_circle</span>
                                Ubah Data Profil Admin
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-2">
                                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="username">Username (ID Login)</label>
                                    <input id="username" class="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-body-md text-on-surface-variant opacity-75 font-body-md focus:ring-0" type="text" value="<?= htmlspecialchars($usernameProfile) ?>" readonly>
                                </div>
                                <div class="space-y-2">
                                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="full_name">Nama Lengkap</label>
                                    <input id="full_name" name="full_name" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all" type="text" value="<?= htmlspecialchars($fullNameProfile) ?>" required>
                                </div>
                                <div class="space-y-2">
                                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="email">Alamat Email</label>
                                    <input id="email" name="email" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all" type="email" value="<?= htmlspecialchars($emailProfile) ?>" required>
                                </div>
                                <div class="space-y-2">
                                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="phone">Nomor Telepon / WhatsApp</label>
                                    <input id="phone" name="phone" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all" type="text" value="<?= htmlspecialchars($phoneProfile) ?>">
                                </div>
                                <div class="col-span-1 md:col-span-2 space-y-2">
                                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="address">Alamat Tempat Tinggal</label>
                                    <textarea id="address" name="address" rows="3" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all"><?= htmlspecialchars($addressProfile) ?></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Keamanan Section -->
                        <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover">
                            <h3 class="font-headline-sm text-headline-sm text-primary mb-2 flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">security</span>
                                Proteksi & Keamanan Sandi
                            </h3>
                            <p class="text-xs text-on-surface-variant mb-6">Kosongkan kolom di bawah ini jika Anda tidak berniat untuk mengganti kata sandi login terminal.</p>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-2">
                                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="new_password">Kata Sandi Baru</label>
                                    <input id="new_password" name="new_password" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all" type="password" placeholder="••••••••">
                                </div>
                                <div class="space-y-2">
                                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="confirm_password">Konfirmasi Kata Sandi Baru</label>
                                    <input id="confirm_password" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all" type="password" placeholder="••••••••">
                                    <p id="passwordFeedback" class="text-xs font-semibold mt-1 hidden"></p>
                                </div>
                            </div>
                        </div>

                        <!-- Form Submit Action buttons -->
                        <div class="flex justify-end gap-4">
                            <a href="index.php?page=admin_dashboard" class="px-6 py-3 bg-surface-container text-on-surface-variant font-bold rounded-lg hover:bg-surface-container-high active:scale-95 transition-all text-body-md text-center">Batal</a>
                            <button id="saveBtn" type="submit" class="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all text-body-md shadow-md">Simpan Perubahan</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </main>
    
    <!-- Dashboard Background Pattern Overlay (Subtle) -->
    <div class="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" style="background-image: radial-gradient(#001e40 1px, transparent 1px); background-size: 24px 24px;"></div>

    <!-- Interactive Help Modal Dialog -->
    <div id="helpModalDialog" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative m-4">
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
                <p class="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant">Gunakan form di halaman ini untuk mengubah data sandi atau data email login Anda.</p>
            </div>
            <div class="mt-6 text-right">
                <button id="closeHelpModalOk" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Saya Mengerti</button>
            </div>
        </div>
    </div>

    <script>
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

            // Interactive validation for new password matching
            const newPassword = document.getElementById('new_password');
            const confirmPassword = document.getElementById('confirm_password');
            const passwordFeedback = document.getElementById('passwordFeedback');
            const saveBtn = document.getElementById('saveBtn');

            function validatePassword() {
                if (newPassword.value === "" && confirmPassword.value === "") {
                    passwordFeedback.classList.add('hidden');
                    saveBtn.disabled = false;
                    saveBtn.style.opacity = "1";
                    return;
                }

                if (newPassword.value === confirmPassword.value) {
                    passwordFeedback.textContent = "Kata sandi cocok.";
                    passwordFeedback.className = "text-xs font-semibold mt-1 text-green-600";
                    passwordFeedback.classList.remove('hidden');
                    saveBtn.disabled = false;
                    saveBtn.style.opacity = "1";
                } else {
                    passwordFeedback.textContent = "Kata sandi baru tidak cocok.";
                    passwordFeedback.className = "text-xs font-semibold mt-1 text-red-600";
                    passwordFeedback.classList.remove('hidden');
                    saveBtn.disabled = true;
                    saveBtn.style.opacity = "0.6";
                }
            }

            if(newPassword && confirmPassword) {
                newPassword.addEventListener('input', validatePassword);
                confirmPassword.addEventListener('input', validatePassword);
            }

            // Success/Error Msg Fadeout
            const successBox = document.getElementById('successMsgBox');
            const errorBox = document.getElementById('errorMsgBox');
            if (successBox) {
                setTimeout(() => {
                    successBox.style.transition = "all 0.5s ease";
                    successBox.style.opacity = "0";
                    setTimeout(() => successBox.remove(), 500);
                }, 4000);
            }
            if (errorBox) {
                setTimeout(() => {
                    errorBox.style.transition = "all 0.5s ease";
                    errorBox.style.opacity = "0";
                    setTimeout(() => errorBox.remove(), 500);
                }, 4000);
            }
        });
    </script>
</body>
</html>
