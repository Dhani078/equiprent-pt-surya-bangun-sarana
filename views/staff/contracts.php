<?php
/**
 * ============================================================================
 * VIEW: views/staff/contracts.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Halaman Manajemen Kontrak Digital (Contracts) khusus untuk Staf Operasional.
 * Mengintegrasikan bento layout, tabel status kontrak terperinci riil,
 * filter status, dokumen PDF BAST/Surat Jalan terintegrasi, dan SOP legalitas.
 * 
 * KEPATUHAN DESAIN PREMIUM (100% REPLIKASI DENGAN MOCKUP VISUAL STITCH):
 * - Hanken Grotesk & JetBrains Mono fonts.
 * - Primary color #001e40 (Deep Blue), Secondary #515f74 (Slate Gray).
 * - Smooth transition dan interaksi hover.
 */

$fullName = $_SESSION['full_name'] ?? 'Alex Staff';
$role = $_SESSION['role'] ?? 'Operations';
$currentPage = 'contracts';
?>
<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>EquipRent MS - Digital Contracts</title>
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@500&amp;display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "outline": "#737780",
                        "error": "#ba1a1a",
                        "surface-bright": "#f7f9fb",
                        "on-tertiary-fixed-variant": "#004c6e",
                        "error-container": "#ffdad6",
                        "surface-container-lowest": "#ffffff",
                        "surface-container-low": "#f2f4f6",
                        "surface-tint": "#3a5f94",
                        "on-primary-fixed": "#001b3c",
                        "surface-container-high": "#e6e8ea",
                        "secondary-fixed-dim": "#b9c7df",
                        "secondary-container": "#d5e3fc",
                        "secondary": "#515f74",
                        "on-secondary": "#ffffff",
                        "surface-container": "#eceef0",
                        "outline-variant": "#c3c6d1",
                        "on-secondary-fixed-variant": "#3a485b",
                        "on-surface-variant": "#43474f",
                        "on-primary-container": "#799dd6",
                        "on-error": "#ffffff",
                        "on-tertiary-fixed": "#001e2f",
                        "background": "#f7f9fb",
                        "tertiary-fixed-dim": "#89ceff",
                        "on-background": "#191c1e",
                        "tertiary-fixed": "#c9e6ff",
                        "surface": "#f7f9fb",
                        "primary": "#001e40",
                        "on-primary-fixed-variant": "#1f477b",
                        "on-error-container": "#93000a",
                        "on-secondary-container": "#57657a",
                        "tertiary-container": "#003751",
                        "surface-container-highest": "#e0e3e5",
                        "primary-fixed-dim": "#a7c8ff",
                        "on-tertiary": "#ffffff",
                        "secondary-fixed": "#d5e3fc",
                        "on-primary": "#ffffff",
                        "inverse-surface": "#2d3133",
                        "inverse-primary": "#a7c8ff",
                        "on-tertiary-container": "#0fa5e9",
                        "inverse-on-surface": "#eff1f3",
                        "tertiary": "#002133",
                        "primary-container": "#003366",
                        "on-secondary-fixed": "#0d1c2e",
                        "surface-variant": "#e0e3e5",
                        "primary-fixed": "#d5e3ff",
                        "surface-dim": "#d8dadc",
                        "on-surface": "#191c1e"
                    },
                    "borderRadius": {
                        "DEFAULT": "8px",
                        "lg": "8px",
                        "xl": "12px",
                        "full": "9999px"
                    },
                    "spacing": {
                        "element-gap": "16px",
                        "base": "4px",
                        "sidebar-width": "260px",
                        "grid-gutter": "20px",
                        "container-padding": "24px"
                    },
                    "fontFamily": {
                        "table-header": ["Hanken Grotesk"],
                        "display-lg": ["Hanken Grotesk"],
                        "label-caps": ["JetBrains Mono"],
                        "headline-md": ["Hanken Grotesk"],
                        "body-lg": ["Hanken Grotesk"],
                        "headline-sm": ["Hanken Grotesk"],
                        "body-md": ["Hanken Grotesk"]
                    },
                    "fontSize": {
                        "table-header": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
                        "display-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                        "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500"}],
                        "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                        "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}]
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
        .active-pill {
            font-variation-settings: 'FILL' 1;
        }
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        body {
            background-color: #f7f9fb;
        }
        .sidebar-active {
            border-left: 4px solid #001e40;
            background-color: #d5e3fc;
            color: #001e40;
            font-weight: 700;
        }
        .status-chip {
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }
        .status-active { background-color: #dcfce7; color: #166534; }
        .status-expired { background-color: #fee2e2; color: #991b1b; }
        .status-suspended { background-color: #fef3c7; color: #92400e; }
        tr {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
    </style>
</head>
<body class="bg-background text-on-background antialiased">

<!-- SideNavBar -->
<?php if (strtoupper(trim($_SESSION['role'] ?? '')) === 'ADMIN'): ?>
    <!-- Admin Sidebar Navigation Shell -->
    <aside id="sidebarMenu" class="fixed left-0 top-0 h-screen w-sidebar-width bg-surface-container-low border-r border-outline-variant hidden lg:flex flex-col py-6 z-50">
        <div class="px-6 mb-10 flex items-center gap-3">
            <div class="w-10 h-10 bg-primary rounded flex items-center justify-center text-on-primary">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">construction</span>
            </div>
            <div>
                <h1 class="font-headline-sm text-headline-sm font-bold text-primary">SBS EquipRent</h1>
                <p class="font-label-caps text-[10px] text-on-surface-variant leading-none">Admin Terminal</p>
            </div>
        </div>
        
        <nav class="flex-1 space-y-1">
            <!-- 1. Dashboard -->
            <a class="text-on-surface-variant flex items-center gap-3 px-6 py-3 hover:bg-surface-container-high transition-colors duration-200" href="index.php?page=admin_dashboard">
                <span class="material-symbols-outlined">dashboard</span>
                <span class="font-body-md text-body-md">Dashboard</span>
            </a>
            
            <!-- 2. Equipment Inventory -->
            <a class="text-on-surface-variant flex items-center gap-3 px-6 py-3 hover:bg-surface-container-high transition-colors duration-200" href="index.php?page=equipment">
                <span class="material-symbols-outlined">construction</span>
                <span class="font-body-md text-body-md">Equipment Inventory</span>
            </a>
            
            <!-- 3. Rental Orders -->
            <a class="text-on-surface-variant flex items-center gap-3 px-6 py-3 hover:bg-surface-container-high transition-colors duration-200" href="index.php?page=rentals">
                <span class="material-symbols-outlined">receipt_long</span>
                <span class="font-body-md text-body-md">Rental Orders</span>
            </a>
            
            <!-- 4. Maintenance -->
            <a class="text-on-surface-variant flex items-center gap-3 px-6 py-3 hover:bg-surface-container-high transition-colors duration-200" href="index.php?page=maintenance">
                <span class="material-symbols-outlined">build</span>
                <span class="font-body-md text-body-md">Maintenance</span>
            </a>
            
            <!-- 5. User Management -->
            <a class="text-on-surface-variant flex items-center gap-3 px-6 py-3 hover:bg-surface-container-high transition-colors duration-200" href="index.php?page=users">
                <span class="material-symbols-outlined">group</span>
                <span class="font-body-md text-body-md">User Management</span>
            </a>
            
            <!-- 6. Reports -->
            <a class="text-on-surface-variant flex items-center gap-3 px-6 py-3 hover:bg-surface-container-high transition-colors duration-200" href="index.php?page=reports">
                <span class="material-symbols-outlined">analytics</span>
                <span class="font-body-md text-body-md">Reports</span>
            </a>
        </nav>
        
        <div class="mt-auto pt-6 border-t border-outline-variant space-y-1">
            <a class="text-on-surface-variant flex items-center gap-3 px-6 py-3 hover:bg-surface-container-high transition-colors duration-200" href="index.php?page=admin_settings">
                <span class="material-symbols-outlined">settings</span>
                <span class="font-body-md text-body-md">Settings</span>
            </a>
            <a class="text-error flex items-center gap-3 px-6 py-3 hover:bg-error-container transition-colors duration-200" href="index.php?page=logout">
                <span class="material-symbols-outlined">logout</span>
                <span class="font-body-md text-body-md font-semibold">Logout</span>
            </a>
        </div>
    </aside>
<?php else: ?>
    <!-- Staff Sidebar Navigation Shell -->
    <aside id="sidebarMenu" class="fixed left-0 top-0 h-full w-sidebar-width hidden lg:flex flex-col bg-surface-container-low border-r border-outline-variant z-50">
        <div class="p-6">
            <div class="flex items-center gap-3">
                <div class="bg-primary-container p-2 rounded">
                    <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">construction</span>
                </div>
                <div>
                    <h1 class="font-headline-sm text-headline-sm font-bold text-primary">SBS EquipRent</h1>
                    <p class="text-[10px] tracking-widest font-bold text-on-surface-variant opacity-70">STAFF TERMINAL</p>
                </div>
            </div>
        </div>
        
        <nav class="mt-4 flex-1">
            <ul class="space-y-1">
                <li>
                    <a class="flex items-center gap-3 px-6 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md text-body-md" href="index.php?page=staff_dashboard">
                        <span class="material-symbols-outlined">dashboard</span>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li>
                    <a class="flex items-center gap-3 px-6 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md text-body-md" href="index.php?page=rentals">
                        <span class="material-symbols-outlined">receipt_long</span>
                        <span>Rental Orders</span>
                    </a>
                </li>
                <li>
                    <a class="flex items-center gap-3 px-6 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md text-body-md" href="index.php?page=payments">
                        <span class="material-symbols-outlined">payments</span>
                        <span>Payments</span>
                    </a>
                </li>
                <li>
                    <!-- Active State: Contracts -->
                    <a class="flex items-center gap-3 px-6 py-3 text-primary font-bold border-l-4 border-primary bg-secondary-container transition-all scale-95 duration-100 font-body-md text-body-md" href="index.php?page=contracts">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">description</span>
                        <span>Contracts</span>
                    </a>
                </li>
                <li>
                    <a class="flex items-center gap-3 px-6 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md text-body-md" href="index.php?page=maintenance">
                        <span class="material-symbols-outlined">handyman</span>
                        <span>Maintenance</span>
                    </a>
                </li>
                <li>
                    <a class="flex items-center gap-3 px-6 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md text-body-md" href="index.php?page=reports">
                        <span class="material-symbols-outlined">assessment</span>
                        <span>Reports</span>
                    </a>
                </li>
            </ul>
        </nav>
        
        <div class="border-t border-outline-variant p-4">
            <ul class="space-y-1">
                <li>
                    <a class="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md text-body-md" href="index.php?page=staff_settings">
                        <span class="material-symbols-outlined">settings</span>
                        <span>Settings</span>
                    </a>
                </li>
                <li>
                    <a class="flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/10 transition-colors font-body-md text-body-md" href="index.php?page=logout">
                        <span class="material-symbols-outlined">logout</span>
                        <span>Logout</span>
                    </a>
                </li>
            </ul>
        </div>
    </aside>
<?php endif; ?>

<!-- TopAppBar -->
<header class="fixed top-0 right-0 left-0 lg:left-[260px] h-16 bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-6 z-40">
    <div class="flex items-center gap-3 flex-1">
        <button id="sidebarToggleBtn" class="lg:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors flex items-center justify-center">
            <span class="material-symbols-outlined">menu</span>
        </button>
        <h2 class="font-headline-md text-headline-md font-bold text-primary">SBS EquipRent</h2>
        <div class="relative hidden lg:block w-full max-w-md">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <form method="GET" action="index.php">
                <input type="hidden" name="page" value="contracts">
                <input name="search" value="<?= htmlspecialchars($search ?? '') ?>" class="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary transition-all text-body-md font-body-md" placeholder="Search contracts or clients..." type="text"/>
            </form>
        </div>
    </div>
    
    <div class="flex items-center gap-4 relative">
        <!-- Notifications Menu -->
        <div class="relative">
            <button id="notiBellBtn" class="w-10 h-10 flex items-center justify-center hover:bg-surface-container-low rounded-full transition-colors relative">
                <span class="material-symbols-outlined text-on-surface-variant">notifications</span>
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
        <button id="helpOutlineBtn" class="w-10 h-10 flex items-center justify-center hover:bg-surface-container-low rounded-full transition-colors">
            <span class="material-symbols-outlined text-on-surface-variant">help</span>
        </button>

        <div class="h-8 w-px bg-outline-variant mx-1"></div>

        <!-- Profile Dropdown -->
        <div class="relative">
            <button id="profileDropBtn" class="flex items-center gap-3 cursor-pointer hover:bg-surface-container-low/50 px-2 py-1 rounded-lg transition-colors text-left">
                <div class="text-right hidden lg:block whitespace-nowrap">
                    <p class="font-body-md font-bold text-on-surface leading-tight"><?= htmlspecialchars($fullName) ?></p>
                    <p class="font-label-caps text-[10px] text-on-surface-variant uppercase leading-none"><?= htmlspecialchars($role) ?></p>
                </div>
                <img alt="User Profile" class="w-10 h-10 rounded-full border border-outline-variant object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYgCm40ZYzrWEx0Ilk007nP4Ot3-jXU6t8cCvN6_mhNppA-sSaQAnE308Hw1SnOw07lmy0O-En_nv_IdKT8VGX2FV-o-J5gi2pefC9JuvBbsovn28eMFU6Pd5xJKaE0octztfkxuBAz-1tLZTYY2fRfYEy3jbGT_woNzyqrTjYiIrKEyM4leCHgymJEJ67vVX5IMYQOpdFpVtDrV2Pnn1t52u-E1-3mCWzVhkHxrpJkrkkXev1cZRUm992Duxx_o05qRi4UY0QesO8">
            </button>
            <!-- Profile Dropdown Menu -->
            <div id="profileDropdownMenu" class="hidden absolute right-0 top-12 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-2 z-50 text-left">
                <div class="px-4 py-2 border-b border-outline-variant sm:hidden">
                    <p class="font-body-md font-bold text-on-surface leading-tight"><?= htmlspecialchars($fullName) ?></p>
                    <p class="text-[10px] text-on-surface-variant uppercase mt-0.5"><?= htmlspecialchars($role) ?></p>
                </div>
                <a href="index.php?page=staff_dashboard" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
                    <span class="material-symbols-outlined text-sm">dashboard</span>
                    <span>Dashboard</span>
                </a>
                <a href="index.php?page=staff_settings" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
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
<main class="ml-0 lg:ml-[260px] pt-16 p-container-padding min-h-screen">
        
        <!-- Page Header Actions -->
        <div class="flex justify-between items-end mb-8">
            <div>
                <h3 class="font-display-lg text-display-lg text-primary">Digital Contracts</h3>
                <p class="text-body-lg text-on-surface-variant mt-1">Review and manage legal agreements for all rental assets.</p>
            </div>
            <button id="createContractBtn" class="bg-primary text-on-primary px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold hover:opacity-90 transition-all active:scale-95 shadow-sm">
                <span class="material-symbols-outlined">add</span>
                Create Contract
            </button>
        </div>

        <!-- Alert Success -->
        <?php if (isset($_SESSION['success'])): ?>
            <div class="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-3 font-semibold text-body-md shadow-sm">
                <span class="material-symbols-outlined text-green-600">check_circle</span>
                <span><?= htmlspecialchars($_SESSION['success']); unset($_SESSION['success']); ?></span>
            </div>
        <?php endif; ?>

        <!-- Alert Error -->
        <?php if (isset($_SESSION['error'])): ?>
            <div class="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-3 font-semibold text-body-md shadow-sm">
                <span class="material-symbols-outlined text-error">error</span>
                <span><?= htmlspecialchars($_SESSION['error']); unset($_SESSION['error']); ?></span>
            </div>
        <?php endif; ?>

        <!-- Stats Bento Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-grid-gutter mb-8">
            <!-- Total Contracts -->
            <div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex flex-col gap-2 transition-all duration-200 hover:shadow-md">
                <div class="flex justify-between items-center">
                    <span class="material-symbols-outlined text-primary p-2 bg-secondary-container rounded-lg">description</span>
                    <span class="text-[11px] font-label-caps text-on-surface-variant">FY 2026</span>
                </div>
                <p class="text-body-md text-on-surface-variant mt-2">Total Contracts</p>
                <p class="text-headline-md font-bold text-primary"><?= number_format($totalContracts) ?></p>
            </div>
            
            <!-- Active Contracts -->
            <div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex flex-col gap-2 transition-all duration-200 hover:shadow-md">
                <div class="flex justify-between items-center">
                    <span class="material-symbols-outlined text-on-tertiary-container p-2 bg-tertiary-fixed rounded-lg">verified</span>
                    <span class="text-[11px] font-label-caps text-on-surface-variant">Active Now</span>
                </div>
                <p class="text-body-md text-on-surface-variant mt-2">Active Contracts</p>
                <p class="text-headline-md font-bold text-primary"><?= number_format($activeContracts) ?></p>
            </div>
            
            <!-- Expiring Soon -->
            <div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex flex-col gap-2 transition-all duration-200 hover:shadow-md">
                <div class="flex justify-between items-center">
                    <span class="material-symbols-outlined text-error p-2 bg-error-container rounded-lg">priority_high</span>
                    <span class="text-[11px] font-label-caps text-error">Next 30 Days</span>
                </div>
                <p class="text-body-md text-on-surface-variant mt-2">Expiring Soon</p>
                <p class="text-headline-md font-bold text-primary"><?= number_format($expiringContracts) ?></p>
            </div>
            
            <!-- Terminated/Expired -->
            <div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex flex-col gap-2 transition-all duration-200 hover:shadow-md">
                <div class="flex justify-between items-center">
                    <span class="material-symbols-outlined text-on-surface-variant p-2 bg-surface-container-high rounded-lg">cancel</span>
                    <span class="text-[11px] font-label-caps text-on-surface-variant">Expired / Terminated</span>
                </div>
                <p class="text-body-md text-on-surface-variant mt-2">Terminated</p>
                <p class="text-headline-md font-bold text-primary"><?= number_format($terminatedContracts) ?></p>
            </div>
        </div>

        <!-- Filter Controls -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mb-4">
            <div class="flex items-center gap-2">
                <div class="flex bg-surface-container border border-outline-variant rounded p-1">
                    <a href="index.php?page=contracts&status=ALL" class="px-3 py-1 text-body-md font-bold <?= $status === 'ALL' ? 'bg-surface-container-lowest shadow-sm rounded text-primary' : 'text-on-surface-variant hover:bg-surface-container-high rounded transition-colors' ?>">All</a>
                    <a href="index.php?page=contracts&status=ACTIVE" class="px-3 py-1 text-body-md font-bold <?= $status === 'ACTIVE' ? 'bg-surface-container-lowest shadow-sm rounded text-primary' : 'text-on-surface-variant hover:bg-surface-container-high rounded transition-colors' ?>">Active</a>
                    <a href="index.php?page=contracts&status=EXPIRED" class="px-3 py-1 text-body-md font-bold <?= $status === 'EXPIRED' ? 'bg-surface-container-lowest shadow-sm rounded text-primary' : 'text-on-surface-variant hover:bg-surface-container-high rounded transition-colors' ?>">Expired</a>
                    <a href="index.php?page=contracts&status=SUSPENDED" class="px-3 py-1 text-body-md font-bold <?= $status === 'SUSPENDED' ? 'bg-surface-container-lowest shadow-sm rounded text-primary' : 'text-on-surface-variant hover:bg-surface-container-high rounded transition-colors' ?>">Suspended</a>
                </div>
            </div>
            <div class="text-on-surface-variant font-body-md">
                Showing <span class="font-bold text-primary">1 - <?= count($contractsList) ?></span> of <?= count($contractsList) ?> records
            </div>
        </div>

        <!-- Table Container -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div class="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
                <h4 class="font-headline-sm text-headline-sm text-primary font-bold">Contract Registry</h4>
                <div class="flex gap-3">
                    <button class="px-3 py-1.5 border border-outline-variant rounded-lg text-body-md font-medium text-on-surface-variant hover:bg-surface-container-high flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">filter_list</span>
                        Filter
                    </button>
                    <a href="index.php?page=export_contracts_csv" class="px-3 py-1.5 border border-outline-variant rounded-lg text-body-md font-medium text-on-surface-variant hover:bg-surface-container-high flex items-center justify-center gap-1 active:scale-95 transition-all">
                        <span class="material-symbols-outlined text-sm">file_download</span>
                        Export CSV
                    </a>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-surface-container-low text-table-header uppercase tracking-wider text-on-surface-variant border-b border-outline-variant">
                            <th class="px-6 py-4 font-semibold">Contract ID</th>
                            <th class="px-6 py-4 font-semibold">Company / Client</th>
                            <th class="px-6 py-4 font-semibold">Start Date</th>
                            <th class="px-6 py-4 font-semibold">End Date</th>
                            <th class="px-6 py-4 font-semibold text-center">Status</th>
                            <th class="px-6 py-4 font-semibold text-right">Documents</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-outline-variant">
                        <?php if (empty($contractsList)): ?>
                            <tr>
                                <td colspan="6" class="px-6 py-12 text-center text-on-surface-variant opacity-75 font-body-lg">
                                    <span class="material-symbols-outlined text-[48px] mb-2 opacity-50 block">description</span>
                                    Tidak ada data kontrak terdaftar.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($contractsList as $ctr): 
                                $isExpired = (strtotime($ctr['valid_until']) < time());
                                $isSigned = $ctr['is_signed_customer'];
                                
                                $statusChip = '<span class="status-chip status-active">Active</span>';
                                if ($isExpired) {
                                    $statusChip = '<span class="status-chip status-expired">Expired</span>';
                                } elseif (!$isSigned) {
                                    $statusChip = '<span class="status-chip status-suspended">Suspended</span>';
                                }
                            ?>
                                <tr class="hover:bg-surface-container-low/30 transition-colors group cursor-pointer">
                                    <td class="px-6 py-4 font-label-caps text-primary font-bold">#<?= htmlspecialchars($ctr['contract_code']) ?></td>
                                    <td class="px-6 py-4">
                                        <p class="font-semibold text-primary"><?= htmlspecialchars($ctr['customer_name']) ?></p>
                                        <?php if (!empty($ctr['company_name'])): ?>
                                            <p class="text-[11px] text-on-surface-variant">Company: <?= htmlspecialchars($ctr['company_name']) ?></p>
                                        <?php endif; ?>
                                        <p class="text-[11px] text-on-surface-variant opacity-85">Project: <?= htmlspecialchars($ctr['project_notes'] ?: 'Lease Agreement') ?></p>
                                    </td>
                                    <td class="px-6 py-4 text-body-md text-on-surface-variant font-mono"><?= date('M d, Y', strtotime($ctr['start_date'])) ?></td>
                                    <td class="px-6 py-4 text-body-md text-on-surface-variant font-mono"><?= date('M d, Y', strtotime($ctr['valid_until'])) ?></td>
                                    <td class="px-6 py-4 text-center">
                                        <?= $statusChip ?>
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <a href="index.php?page=print_contract&id=<?= $ctr['id'] ?>" target="_blank" class="text-primary hover:bg-secondary-container p-2 rounded-lg transition-colors inline-block" title="View PDF Document">
                                            <span class="material-symbols-outlined">picture_as_pdf</span>
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
            
            <div class="p-6 border-t border-outline-variant bg-surface-container-low/50 flex items-center justify-between">
                <p class="text-body-md text-on-surface-variant">Showing <span class="font-bold"><?= count($contractsList) ?></span> of <span class="font-bold"><?= count($contractsList) ?></span> contracts</p>
                <div class="flex gap-2">
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-30" disabled="">
                        <span class="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold">1</button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-high" disabled>2</button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-high" disabled>
                        <span class="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Contextual Help Section -->
        <div class="mt-12 bg-primary p-8 rounded-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
            <!-- Background decoration -->
            <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-on-primary-container/20 rounded-full blur-3xl"></div>
            <div class="absolute -top-10 -left-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl"></div>
            <div class="relative z-10 flex-1">
                <h4 class="text-headline-sm font-bold text-white mb-2">Legal Compliance Assistance</h4>
                <p class="text-on-primary-fixed-variant max-w-xl opacity-90 text-slate-200">Need help drafting customized clauses or verifying compliance standards for heavy machinery lease? Our legal desk is available for staff consultations.</p>
            </div>
            <div class="relative z-10 flex flex-col sm:flex-row gap-4">
                <a id="legalPortalBtn" class="flex items-center gap-2 text-white bg-on-primary-fixed-variant px-5 py-2.5 rounded-lg font-semibold hover:bg-on-primary-fixed-variant/80 transition-colors" href="javascript:void(0)">
                    <span class="material-symbols-outlined">gavel</span>
                    Legal Portal
                </a>
                <button onclick="openEmailDeskModal()" class="flex items-center gap-2 text-primary bg-white px-5 py-2.5 rounded-lg font-semibold hover:bg-surface-container-low transition-colors cursor-pointer active:scale-95">
                    <span class="material-symbols-outlined">mail</span>
                    Email Desk
                </button>
            </div>
        </div>
        
    </main>
    
    <!-- Footer Info -->
    <footer class="py-6 px-container-padding text-on-surface-variant text-[11px] border-t border-outline-variant flex justify-between items-center bg-surface-container-low/30">
        <p>© 2026 PT. SURYA BANGUN SARANA BANJARMASIN. All Rights Reserved.</p>
        <div class="flex gap-4">
            <a class="hover:text-primary" href="#">Terms of Use</a>
            <a class="hover:text-primary" href="#">Privacy Policy</a>
            <a class="hover:text-primary" href="#">System Status</a>
        </div>
    </footer>
</main>

<!-- Micro-interactions Script -->
<!-- Create Contract Modal Dialog -->
<div id="createContractModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 max-h-[90vh] overflow-y-auto">
        <button id="closeCreateContractCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-4">
            <div class="bg-primary-container p-2.5 rounded-lg text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">add_task</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Draft New Contract</h3>
                <p class="text-xs text-on-surface-variant">Terbitkan Dokumen Perjanjian Sewa Digital Resmi</p>
            </div>
        </div>
        
        <form method="POST" action="index.php?page=contracts" class="space-y-4 text-body-md text-on-surface">
            <input type="hidden" name="action" value="add">
            
            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Pilih Booking Transaksi Rental *</label>
                <select name="rental_id" required class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary">
                    <option value="" disabled selected>-- Pilih Transaksi Approved --</option>
                    <?php if (empty($rentalsWithoutContracts)): ?>
                        <option value="" disabled>Tidak ada transaksi rental tanpa kontrak</option>
                    <?php else: ?>
                        <?php foreach ($rentalsWithoutContracts as $r): ?>
                            <option value="<?= $r['id'] ?>">#<?= htmlspecialchars($r['rental_code']) ?> - <?= htmlspecialchars($r['customer_name']) ?> (<?= htmlspecialchars($r['equipment_name']) ?>)</option>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Tanggal Kontrak *</label>
                    <input type="date" name="contract_date" value="<?= date('Y-m-d') ?>" required class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Berlaku Hingga *</label>
                    <input type="date" name="valid_until" value="<?= date('Y-m-d', strtotime('+30 days')) ?>" required class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary">
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Syarat & Ketentuan Klausul Kontrak</label>
                <textarea name="terms_conditions" rows="5" class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary font-mono text-xs">1. Penyewa wajib merawat alat berat dengan baik.
2. Kehilangan spareparts akibat kelalaian penyewa menjadi tanggung jawab penyewa sepenuhnya.
3. Kelebihan jam operasional (Hour Meter) per hari (lebih dari 8 jam) dikenakan biaya tambahan Rp 150.000/jam.</textarea>
            </div>

            <div class="flex items-center gap-3 bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                <input type="checkbox" name="is_signed_customer" id="is_signed_customer" value="1" class="rounded text-primary focus:ring-primary w-5 h-5">
                <label for="is_signed_customer" class="text-xs text-on-surface font-semibold cursor-pointer">
                    Sudah Ditandatangani oleh Customer secara Digital?
                </label>
            </div>

            <div class="mt-6 flex justify-end gap-3 pt-2">
                <button type="button" id="closeCreateContractBtn" class="px-4 py-2 border border-outline-variant rounded-lg text-body-md text-on-surface-variant hover:bg-surface-container-high transition-all">Batal</button>
                <button type="submit" class="bg-primary text-white px-5 py-2 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Menerbitkan Kontrak</button>
            </div>
        </form>
    </div>
</div>

<!-- Legal Portal Modal Dialog -->
<div id="legalPortalModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 max-h-[85vh] overflow-y-auto">
        <button id="closeLegalPortalCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-4">
            <div class="bg-primary-container p-2.5 rounded-lg text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">gavel</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Legal Portal & Compliance</h3>
                <p class="text-xs text-on-surface-variant">PT. Surya Bangun Sarana Banjarmasin</p>
            </div>
        </div>
        <div class="space-y-3 text-body-md text-on-surface border-t border-outline-variant/55 pt-4">
            <p class="font-semibold text-primary">Standar Operasional Prosedur (SOP) Kontrak Hukum:</p>
            <div class="space-y-2 text-xs text-on-surface-variant">
                <div class="p-2.5 bg-surface-container-low rounded border border-outline-variant/20">
                    <p class="font-semibold text-on-surface mb-1">1. Verifikasi Validitas Unit & Pengguna</p>
                    <p>Sebelum menerbitkan kontrak digital, staf wajib memverifikasi ketersediaan unit alat berat dan keabsahan identitas KTP/SIUP perusahaan customer di sistem.</p>
                </div>
                <div class="p-2.5 bg-surface-container-low rounded border border-outline-variant/20">
                    <p class="font-semibold text-on-surface mb-1">2. Penandatanganan Kontrak Sewa</p>
                    <p>Kontrak dianggap sah secara hukum jika customer telah menandatangani atau menyetujui syarat sewa digital (status berubah dari "Suspended" menjadi "Active").</p>
                </div>
                <div class="p-2.5 bg-surface-container-low rounded border border-outline-variant/20">
                    <p class="font-semibold text-on-surface mb-1">3. Penerbitan Surat Jalan & BAST</p>
                    <p>Berita Acara Serah Terima (BAST) dan Surat Jalan baru dapat diterbitkan oleh staf operasional setelah kontrak berstatus aktif dan pembayaran DP/Lunas terverifikasi.</p>
                </div>
            </div>
            <p class="text-xs text-on-surface-variant pt-2">Untuk konsultasi legalitas luar standar, kirim detail pertanyaan Anda langsung ke email desk internal di <a href="mailto:dhanisepeda@gmail.com" class="text-primary font-bold hover:underline font-mono">dhanisepeda@gmail.com</a>.</p>
        </div>
        <div class="mt-6 text-right">
            <button id="closeLegalPortalOk" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Mengerti</button>
        </div>
    </div>
</div>

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
                <p class="text-xs text-on-surface-variant">Staf Terminal Guidance System</p>
            </div>
        </div>
        <div class="space-y-3 text-body-md text-on-surface">
            <p>Selamat datang di terminal operator <strong>PT. SURYA BANGUN SARANA BANJARMASIN</strong>. Berikut panduan modul:</p>
            <ul class="list-disc list-inside space-y-1 text-on-surface-variant pl-2">
                <li><strong>Rental Orders</strong>: Menyetujui atau menolak penyewaan alat berat.</li>
                <li><strong>Payments</strong>: Memverifikasi bukti transfer pembayaran sewa.</li>
                <li><strong>Contracts</strong>: Memeriksa masa berlaku dan status kontrak digital.</li>
                <li><strong>Maintenance</strong>: Mencatat HM alat berat & menjadwalkan servis rutin.</li>
                <li><strong>Reports</strong>: Mencetak Surat Jalan resmi & mengunduh BAST PDF.</li>
            </ul>
            <p class="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant">Hubungi tim Administrator IT jika Anda mengalami kendala operasional.</p>
        </div>
        <div class="mt-6 text-right">
            <button id="closeHelpModalOk" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Saya Mengerti</button>
        </div>
    </div>
</div>

</div>

<!-- EMAIL DESK MODAL DIALOG -->
<div id="emailDeskModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <button onclick="document.getElementById('emailDeskModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined">close</span>
        </button>
        <!-- Header -->
        <div class="flex items-center gap-3 mb-4 pb-3 border-b border-outline-variant">
            <div class="bg-primary text-white p-2.5 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">support_agent</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">SBS Internal Legal Desk</h3>
                <p class="text-xs text-on-surface-variant">PT. SURYA BANGUN SARANA BANJARMASIN</p>
            </div>
        </div>
        <!-- Toast Alert inside Modal -->
        <div id="emailDeskSuccessToast" class="hidden bg-green-50 border border-green-200 text-green-800 rounded-lg p-3.5 mb-4 flex items-center gap-3 animate-fade-in">
            <span class="material-symbols-outlined text-green-600">check_circle</span>
            <div class="text-xs">
                <p class="font-bold">Pertanyaan Terkirim ke Legal Desk!</p>
                <p class="text-green-700">Tembusan otomatis terkirim ke dhanisepeda@gmail.com</p>
            </div>
        </div>
        <!-- Form -->
        <form id="emailDeskForm" onsubmit="submitEmailDesk(event)" class="space-y-4 font-body-md text-on-surface">
            <div>
                <label class="block text-xs font-bold text-primary mb-1">Subjek Konsultasi</label>
                <input type="text" id="email_desk_subject" required class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm font-semibold" placeholder="Contoh: Amandemen Klausul HM Overtime">
            </div>
            <div>
                <label class="block text-xs font-bold text-primary mb-1">Detail Pertanyaan Hukum / Kepatuhan</label>
                <textarea id="email_desk_message" rows="5" required class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm" placeholder="Jelaskan kebutuhan klausul khusus sewa atau verifikasi legalitas kontrak customer Anda di sini..."></textarea>
            </div>
            <div class="pt-2 flex justify-between items-center gap-4 text-xs text-on-surface-variant border-t border-outline-variant mt-4">
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">mail</span> dhanisepeda@gmail.com</span>
                <button type="submit" id="btnSubmitEmailDesk" class="px-5 py-2 bg-primary text-white font-bold rounded hover:opacity-90 active:scale-95 transition-all text-xs tracking-wider uppercase cursor-pointer">Kirim Email</button>
            </div>
        </form>
    </div>
</div>

<script>
    function openEmailDeskModal() {
        document.getElementById('email_desk_subject').value = '';
        document.getElementById('email_desk_message').value = '';
        document.getElementById('emailDeskSuccessToast').classList.add('hidden');
        document.getElementById('emailDeskModal').classList.remove('hidden');
    }

    function submitEmailDesk(e) {
        e.preventDefault();
        const btn = document.getElementById('btnSubmitEmailDesk');
        const toast = document.getElementById('emailDeskSuccessToast');
        
        btn.disabled = true;
        btn.textContent = 'MENGIRIM...';
        btn.style.opacity = '0.7';

        const sub = document.getElementById('email_desk_subject').value;
        const msg = document.getElementById('email_desk_message').value;
        
        window.open(`mailto:dhanisepeda@gmail.com?subject=${encodeURIComponent('Legal Desk Consultation: ' + sub)}&body=${encodeURIComponent(msg)}`, '_self');

        setTimeout(() => {
            toast.classList.remove('hidden');
            btn.textContent = 'TERKIRIM ✓';
            setTimeout(() => {
                document.getElementById('emailDeskModal').classList.add('hidden');
                btn.disabled = false;
                btn.textContent = 'KIRIM EMAIL';
                btn.style.opacity = '1';
            }, 2500);
        }, 1000);
    }

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

        // Create Contract Modal
        const createBtn = document.getElementById('createContractBtn');
        const createModal = document.getElementById('createContractModal');
        const closeCreateCross = document.getElementById('closeCreateContractCross');
        const closeCreateBtn = document.getElementById('closeCreateContractBtn');
        if (createBtn && createModal) {
            createBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                createModal.classList.remove('hidden');
            });
        }
        if (closeCreateCross && createModal) {
            closeCreateCross.addEventListener('click', () => {
                createModal.classList.add('hidden');
            });
        }
        if (closeCreateBtn && createModal) {
            closeCreateBtn.addEventListener('click', () => {
                createModal.classList.add('hidden');
            });
        }

        // Legal Portal Modal
        const legalBtn = document.getElementById('legalPortalBtn');
        const legalModal = document.getElementById('legalPortalModal');
        const closeLegalCross = document.getElementById('closeLegalPortalCross');
        const closeLegalOk = document.getElementById('closeLegalPortalOk');
        if (legalBtn && legalModal) {
            legalBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                legalModal.classList.remove('hidden');
            });
        }
        if (closeLegalCross && legalModal) {
            closeLegalCross.addEventListener('click', () => {
                legalModal.classList.add('hidden');
            });
        }
        if (closeLegalOk && legalModal) {
            closeLegalOk.addEventListener('click', () => {
                legalModal.classList.add('hidden');
            });
        }

        // Close on clicking outside
        document.addEventListener('click', (e) => {
            if (profileMenu) profileMenu.classList.add('hidden');
            if (notiMenu) notiMenu.classList.add('hidden');
            if (window.innerWidth < 1024 && sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex');
            }
        });
    });

    // Atmosphere - Subtle dot pattern background for the body
    document.body.style.backgroundImage = `radial-gradient(#cbd5e1 0.8px, transparent 0.8px)`;
    document.body.style.backgroundSize = `24px 24px`;
</script>
</body>
</html>
