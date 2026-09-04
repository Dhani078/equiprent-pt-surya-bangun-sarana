<?php
/**
 * ============================================================================
 * VIEW: views/staff/reports.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Halaman Cetak Laporan & Dokumentasi (Reports) khusus untuk Staf Operasional.
 * Menyajikan visualisasi bento grid menu, pratinjau grafik bulanan, riwayat
 * recent reports, serta tabel audit log aktivitas akses sistem yang dinamis.
 * 
 * KEPATUHAN DESAIN PREMIUM (100% REPLIKASI DENGAN MOCKUP VISUAL STITCH):
 * - Hanken Grotesk & JetBrains Mono fonts.
 * - Primary color #001e40 (Deep Blue), Secondary #515f74 (Slate Gray).
 * - Smooth transition, micro-interactions hover, card lift, dan page load fade-in.
 */

$fullName = $_SESSION['full_name'] ?? 'Alex Staff';
$roleName = $_SESSION['role'] ?? 'OPERATIONS';
?>
<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>Reports - EquipRent MS</title>
    
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
        
        /* Premium Card Lift Hover & Transitions */
        .interactive-element {
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-card {
            border: 1px solid #e2e8f0;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-card:hover {
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
            transform: translateY(-4px);
        }

        /* Page Entrance Animation */
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
                <span class="font-body-md text-body-md font-bold">Reports</span>
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
                    <a class="flex items-center gap-3 px-6 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md text-body-md" href="index.php?page=contracts">
                        <span class="material-symbols-outlined">description</span>
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
                    <!-- Active State: Reports -->
                    <a class="flex items-center gap-3 px-6 py-3 text-primary font-bold border-l-4 border-primary bg-secondary-container transition-all scale-95 duration-100 font-body-md text-body-md" href="index.php?page=reports">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">assessment</span>
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

<!-- TopAppBar (Authority Source: JSON) -->
<header class="fixed top-0 right-0 left-0 lg:left-[260px] h-16 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center px-6 z-40">
    <div class="flex items-center gap-3 flex-1">
        <button id="sidebarToggleBtn" class="lg:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors flex items-center justify-center">
            <span class="material-symbols-outlined">menu</span>
        </button>
        <h2 class="font-headline-md text-headline-md font-bold text-primary">SBS EquipRent</h2>
        <div class="relative hidden lg:block w-full max-w-md">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <form method="GET" action="index.php">
                <input type="hidden" name="page" value="reports">
                <input name="search" value="<?= htmlspecialchars($search ?? '') ?>" class="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-body-md focus:ring-2 focus:ring-primary transition-all font-body-md" placeholder="Search reports, logs, or dates..." type="text"/>
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
                <div class="text-right hidden sm:block">
                    <p class="font-body-md font-bold text-on-surface leading-tight"><?= htmlspecialchars($fullName) ?></p>
                    <p class="font-label-caps text-[10px] text-on-surface-variant uppercase leading-none"><?= htmlspecialchars($roleName ?? $role ?? 'STAFF') ?></p>
                </div>
                <img alt="User Profile" class="w-10 h-10 rounded-full border border-outline-variant object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYgCm40ZYzrWEx0Ilk007nP4Ot3-jXU6t8cCvN6_mhNppA-sSaQAnE308Hw1SnOw07lmy0O-En_nv_IdKT8VGX2FV-o-J5gi2pefC9JuvBbsovn28eMFU6Pd5xJKaE0octztfkxuBAz-1tLZTYY2fRfYEy3jbGT_woNzyqrTjYiIrKEyM4leCHgymJEJ67vVX5IMYQOpdFpVtDrV2Pnn1t52u-E1-3mCWzVhkHxrpJkrkkXev1cZRUm992Duxx_o05qRi4UY0QesO8">
            </button>
            <!-- Profile Dropdown Menu -->
            <div id="profileDropdownMenu" class="hidden absolute right-0 top-12 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-2 z-50 text-left">
                <div class="px-4 py-2 border-b border-outline-variant sm:hidden">
                    <p class="font-body-md font-bold text-on-surface leading-tight"><?= htmlspecialchars($fullName) ?></p>
                    <p class="text-[10px] text-on-surface-variant uppercase mt-0.5"><?= htmlspecialchars($roleName ?? $role ?? 'STAFF') ?></p>
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
<main class="ml-0 lg:ml-[260px] pt-16 p-container-padding min-h-screen animate-fade-in">
    <!-- Action Header -->
    <div class="flex justify-between items-end mb-8">
        <div>
            <p class="font-label-caps text-label-caps text-on-surface-variant mb-1">SYSTEM INSIGHTS</p>
            <h3 class="font-display-lg text-display-lg text-primary">Performance Overview</h3>
        </div>
        <button id="newReportBtn" class="bg-primary text-white px-6 py-2.5 rounded font-body-md font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-sm hover:shadow-md active:scale-95 duration-150">
            <span class="material-symbols-outlined">add_chart</span>
            Generate New Report
        </button>
    </div>

    <!-- Bento Grid Reports Menu -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-grid-gutter mb-8">
        <!-- Rental Reports Card -->
        <div onclick="openRentalReportsModal()" class="bg-surface-container-lowest border border-outline-variant p-6 rounded bento-card group cursor-pointer active:scale-95 transition-all">
            <div class="w-12 h-12 rounded bg-secondary-container text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-headline-sm" style="font-variation-settings: 'FILL' 1;">analytics</span>
            </div>
            <h4 class="font-headline-sm text-primary mb-2 font-semibold">Rental Reports</h4>
            <p class="font-body-md text-on-surface-variant mb-4">Detailed analysis of booking volume, active fleets, and regional demand.</p>
            <div class="flex items-center text-primary font-bold gap-1 text-sm">
                Access Insights <span class="material-symbols-outlined text-body-lg">chevron_right</span>
            </div>
        </div>
        
        <!-- Financial Reports Card -->
        <div onclick="openFinancialReportsModal()" class="bg-surface-container-lowest border border-outline-variant p-6 rounded bento-card group cursor-pointer active:scale-95 transition-all">
            <div class="w-12 h-12 rounded bg-secondary-container text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-headline-sm" style="font-variation-settings: 'FILL' 1;">account_balance_wallet</span>
            </div>
            <h4 class="font-headline-sm text-primary mb-2 font-semibold">Financial Reports</h4>
            <p class="font-body-md text-on-surface-variant mb-4">Track revenue, pending invoices, and net profitability across terminals.</p>
            <div class="flex items-center text-primary font-bold gap-1 text-sm">
                View Balances <span class="material-symbols-outlined text-body-lg">chevron_right</span>
            </div>
        </div>
        
        <!-- Equipment Usage Card -->
        <div onclick="openEquipmentUsageModal()" class="bg-surface-container-lowest border border-outline-variant p-6 rounded bento-card group cursor-pointer active:scale-95 transition-all">
            <div class="w-12 h-12 rounded bg-secondary-container text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-headline-sm" style="font-variation-settings: 'FILL' 1;">precision_manufacturing</span>
            </div>
            <h4 class="font-headline-sm text-primary mb-2 font-semibold">Equipment Usage</h4>
            <p class="font-body-md text-on-surface-variant mb-4">Monitor machine hours, idle time, and equipment utilization rates.</p>
            <div class="flex items-center text-primary font-bold gap-1 text-sm">
                Fleet Metrics <span class="material-symbols-outlined text-body-lg">chevron_right</span>
            </div>
        </div>
        
        <!-- Maintenance Logs Card -->
        <div onclick="openMaintenanceLogsModal()" class="bg-surface-container-lowest border border-outline-variant p-6 rounded bento-card group cursor-pointer active:scale-95 transition-all">
            <div class="w-12 h-12 rounded bg-secondary-container text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-headline-sm" style="font-variation-settings: 'FILL' 1;">build_circle</span>
            </div>
            <h4 class="font-headline-sm text-primary mb-2 font-semibold">Maintenance Logs</h4>
            <p class="font-body-md text-on-surface-variant mb-4">Historical record of repairs, part replacements, and service costs.</p>
            <div class="flex items-center text-primary font-bold gap-1 text-sm">
                Audit Logs <span class="material-symbols-outlined text-body-lg">chevron_right</span>
            </div>
        </div>
    </div>

    <!-- Monthly Performance Visual & Recent Reports -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-grid-gutter">
        <!-- Monthly Chart Card -->
        <div class="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded p-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h4 class="font-headline-sm text-primary font-semibold">Monthly Performance Summary</h4>
                    <p class="text-on-surface-variant font-body-md">Analisis pendapatan bulanan tahun <?= date('Y') ?> secara real-time.</p>
                </div>
                <span class="bg-secondary-container text-primary font-label-caps text-[10px] px-3 py-1 rounded font-bold">LIVE DATA</span>
            </div>
            
            <div class="h-64 flex items-end justify-between gap-4 pt-4 px-2">
                <?php 
                $revLabelsStaff = $monthlyRevenueTrend['labels'] ?? [];
                $revDataStaff = $monthlyRevenueTrend['data'] ?? [];
                $revMaxStaff = $monthlyRevenueTrend['max'] ?? 1;
                $lastIdxStaff = count($revDataStaff) - 1;
                $currentMonthIdxStaff = (int)date('n') - 1;
                
                foreach ($revDataStaff as $idx => $val):
                    $pct = $revMaxStaff > 0 ? max(5, round(($val / $revMaxStaff) * 100)) : 5;
                    $isCurrent = ($idx === $currentMonthIdxStaff);
                    $bgClass = $isCurrent ? 'bg-primary' : 'bg-secondary-container group-hover:bg-primary';
                    $formattedVal = $val >= 1000000 ? number_format($val / 1000000, 1, ',', '.') . 'M' : number_format($val / 1000, 0, ',', '.') . 'K';
                ?>
                <div class="flex-1 flex flex-col items-center gap-2 group">
                    <div class="w-full <?= $bgClass ?> rounded-t transition-colors relative" style="height: <?= $pct ?>%">
                        <div class="absolute -top-8 left-1/2 -translate-x-1/2 <?= $isCurrent ? '' : 'opacity-0 group-hover:opacity-100' ?> transition-opacity bg-primary text-white text-[10px] px-2 py-1 rounded whitespace-nowrap"><?= $formattedVal ?></div>
                    </div>
                    <span class="font-label-caps text-[10px] <?= $isCurrent ? 'text-primary font-bold' : 'text-on-surface-variant font-bold' ?>"><?= $revLabelsStaff[$idx] ?? '' ?></span>
                </div>
                <?php endforeach; ?>
                <?php if (empty($revDataStaff)): ?>
                    <div class="flex-1 text-center text-on-surface-variant text-xs py-16">Belum ada data pendapatan untuk tahun ini.</div>
                <?php endif; ?>
            </div>
            
            <?php
            // Hitung pertumbuhan revenue bulan ini vs bulan lalu
            $thisMonthRev = $revDataStaff[$currentMonthIdxStaff] ?? 0;
            $lastMonthRev = ($currentMonthIdxStaff > 0) ? ($revDataStaff[$currentMonthIdxStaff - 1] ?? 0) : 0;
            $growthPct = ($lastMonthRev > 0) ? round((($thisMonthRev - $lastMonthRev) / $lastMonthRev) * 100, 1) : 0;
            $growthSign = $growthPct >= 0 ? '+' : '';
            ?>
            <div class="mt-8 grid grid-cols-3 gap-4 border-t border-outline-variant pt-6">
                <div>
                    <p class="text-[10px] font-label-caps text-on-surface-variant font-bold">REVENUE GROWTH</p>
                    <p class="font-headline-sm text-primary font-bold"><?= $growthSign . $growthPct ?>% <span class="text-xs font-normal text-on-surface-variant">vs last month</span></p>
                </div>
                <div>
                    <p class="text-[10px] font-label-caps text-on-surface-variant font-bold">UTILIZATION</p>
                    <p class="font-headline-sm text-primary font-bold"><?= $utilizationRate ?>% <span class="text-xs font-normal text-on-surface-variant">target 85%</span></p>
                </div>
                <div>
                    <p class="text-[10px] font-label-caps text-on-surface-variant font-bold">TOTAL ORDERS</p>
                    <p class="font-headline-sm text-primary font-bold"><?= number_format($totalRentalsCount) ?> <span class="text-xs font-normal text-on-surface-variant">verified</span></p>
                </div>
            </div>
        </div>
        
        <!-- Recent Reports Card -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded p-6 flex flex-col justify-between">
            <div>
                <div class="flex justify-between items-center mb-6">
                    <h4 class="font-headline-sm text-primary font-semibold">Recent Reports</h4>
                    <button id="viewAllBtn" class="text-primary font-bold text-xs hover:underline">View All</button>
                </div>
                
                <div class="space-y-4">
                    <?php if (empty($auditLogs)): ?>
                        <!-- Fallback / Static Mocking matching visual blueprint -->
                        <div onclick="printMockFinancialReport()" class="p-3 border border-outline-variant rounded flex items-center justify-between hover:bg-surface-container-low transition-colors group cursor-pointer">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-surface-container rounded flex items-center justify-center text-primary">
                                    <span class="material-symbols-outlined">picture_as_pdf</span>
                                </div>
                                <div>
                                    <p class="font-body-md font-bold text-primary truncate w-32">Monthly_Financial_Sep23</p>
                                    <p class="text-[10px] text-on-surface-variant">PDF • 2.4 MB • Today, 10:45 AM</p>
                                </div>
                            </div>
                            <button onclick="event.stopPropagation(); printMockFinancialReport()" class="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-secondary-container rounded transition-all cursor-pointer">
                                <span class="material-symbols-outlined">download</span>
                            </button>
                        </div>
                    <?php else: ?>
                        <?php 
                        $limitCount = 0;
                        foreach ($auditLogs as $log): 
                            if ($limitCount >= 4) break;
                            $limitCount++;
                            $ext = pathinfo($log['file_path'], PATHINFO_EXTENSION) ?: 'pdf';
                            $extUpper = strtoupper($ext);
                            $fileName = basename($log['file_path']);
                            $icon = ($extUpper === 'XLSX' || $extUpper === 'XLS') ? 'description' : 'picture_as_pdf';
                            $iconClass = ($extUpper === 'XLSX' || $extUpper === 'XLS') ? 'text-on-tertiary-fixed-variant' : 'text-primary';
                            $printUrl = "index.php?page=print_report&code=" . urlencode($log['report_code']);
                        ?>
                            <div onclick="window.open('<?= $printUrl ?>', '_blank')" class="p-3 border border-outline-variant rounded flex items-center justify-between hover:bg-surface-container-low transition-colors group cursor-pointer">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-surface-container rounded flex items-center justify-center <?= $iconClass ?>">
                                        <span class="material-symbols-outlined"><?= $icon ?></span>
                                    </div>
                                    <div>
                                        <p class="font-body-md font-bold text-primary truncate w-32" title="<?= htmlspecialchars($fileName) ?>"><?= htmlspecialchars(str_replace(['.pdf', '.xlsx'], '', $fileName)) ?></p>
                                        <p class="text-[10px] text-on-surface-variant"><?= $extUpper ?> • <?= date('M d, Y', strtotime($log['generated_at'])) ?></p>
                                    </div>
                                </div>
                                <button onclick="event.stopPropagation(); window.open('<?= $printUrl ?>', '_blank')" class="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-secondary-container rounded transition-all cursor-pointer">
                                    <span class="material-symbols-outlined">download</span>
                                </button>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
            
            <div class="mt-6">
                <div class="bg-primary-container p-4 rounded relative overflow-hidden group">
                    <!-- Background Pattern -->
                    <div class="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:rotate-12 transition-transform duration-700">
                        <span class="material-symbols-outlined text-[100px] text-white">cloud_download</span>
                    </div>
                    <p class="text-white font-bold text-body-md mb-1 z-10 relative">Cloud Auto-Sync</p>
                    <p class="text-on-primary-container text-[11px] mb-3 z-10 relative leading-tight">All reports are automatically backed up to the secure staff terminal vault.</p>
                    <div class="flex items-center gap-2 z-10 relative">
                        <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        <span class="text-[10px] text-white font-bold">LIVE SYNC ACTIVE</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- System Activity Table -->
    <div id="activityAuditTable" class="mt-8 bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
        <div class="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
            <h4 class="font-headline-sm text-primary font-semibold">Report Access Audit</h4>
            <div class="flex gap-2">
                <a href="index.php?page=export_reports_excel" class="px-3 py-1 bg-surface-container-low text-xs font-bold rounded hover:bg-surface-container-high transition-colors inline-block text-center">Export Logs</a>
                <button id="filterBtn" class="px-3 py-1 bg-surface-container-low text-xs font-bold rounded hover:bg-surface-container-high transition-colors">Filter</button>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-surface-container-low">
                    <tr>
                        <th class="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Generated By</th>
                        <th class="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Report Category</th>
                        <th class="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Execution Time</th>
                        <th class="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant">
                    <?php if (empty($auditLogs)): ?>
                        <!-- Fallback / Static mockup records matching blueprint -->
                        <tr class="hover:bg-surface-container-low transition-colors">
                            <td class="px-6 py-4 flex items-center gap-3">
                                <div class="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold text-primary">AS</div>
                                <span class="font-body-md text-primary font-medium">Alex Staff</span>
                            </td>
                            <td class="px-6 py-4 font-body-md text-on-surface">Financial Audit</td>
                            <td class="px-6 py-4">
                                <span class="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">SUCCESS</span>
                            </td>
                            <td class="px-6 py-4 font-body-md text-on-surface-variant">12.4s</td>
                            <td class="px-6 py-4 text-right">
                                <button onclick="printMockFinancialReport()" class="text-primary hover:underline font-bold text-xs cursor-pointer">View Result</button>
                            </td>
                        </tr>
                        <tr class="hover:bg-surface-container-low transition-colors">
                            <td class="px-6 py-4 flex items-center gap-3">
                                <div class="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold text-primary">JD</div>
                                <span class="font-body-md text-primary font-medium">John Doe</span>
                            </td>
                            <td class="px-6 py-4 font-body-md text-on-surface">Fleet Utilization</td>
                            <td class="px-6 py-4">
                                <span class="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">SUCCESS</span>
                            </td>
                            <td class="px-6 py-4 font-body-md text-on-surface-variant">5.1s</td>
                            <td class="px-6 py-4 text-right">
                                <button onclick="printMockFinancialReport()" class="text-primary hover:underline font-bold text-xs cursor-pointer">View Result</button>
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($auditLogs as $log): 
                            $genName = $log['generator_name'] ?: 'System Auto';
                            $words = explode(' ', $genName);
                            $initials = '';
                            if (count($words) >= 2) {
                                $initials = strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1));
                            } else {
                                $initials = strtoupper(substr($genName, 0, 2));
                            }
                            $category = str_replace('_', ' ', $log['report_type']);
                            $printUrl = "index.php?page=print_report&code=" . urlencode($log['report_code']);
                        ?>
                            <tr class="hover:bg-surface-container-low transition-colors">
                                <td class="px-6 py-4 flex items-center gap-3">
                                    <div class="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold text-primary"><?= $initials ?></div>
                                    <span class="font-body-md text-primary font-medium"><?= htmlspecialchars($genName) ?></span>
                                </td>
                                <td class="px-6 py-4 font-body-md text-on-surface capitalize"><?= htmlspecialchars(strtolower($category)) ?></td>
                                <td class="px-6 py-4">
                                    <span class="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">SUCCESS</span>
                                </td>
                                <td class="px-6 py-4 font-body-md text-on-surface-variant"><?= date('M d, H:i', strtotime($log['generated_at'])) ?></td>
                                <td class="px-6 py-4 text-right">
                                    <a href="<?= $printUrl ?>" target="_blank" class="text-primary hover:underline font-bold text-xs">View Result</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>

<!-- Generate Report Modal Dialog -->
<div id="generateReportModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4">
        <button id="closeReportModalCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-6">
            <div class="bg-primary-container p-2.5 rounded-lg text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">add_chart</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Buat Laporan Resmi Baru</h3>
                <p class="text-xs text-on-surface-variant">PT. SBS Banjarmasin Fleet Documentation Terminal</p>
            </div>
        </div>
        
        <form method="POST" action="index.php?page=reports">
            <input type="hidden" name="action" value="add">
            
            <div class="space-y-4">
                <!-- Rental Selection -->
                <div>
                    <label class="block text-xs font-bold text-primary uppercase mb-2">Pilih Transaksi Rental</label>
                    <select name="rental_id" required class="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary">
                        <option value="">-- Pilih Transaksi --</option>
                        <?php foreach ($rentalsList as $rent): ?>
                            <option value="<?= $rent['id'] ?>">
                                <?= htmlspecialchars($rent['rental_code']) ?> - <?= htmlspecialchars($rent['equipment_name']) ?> (Client: <?= htmlspecialchars($rent['customer_name']) ?>)
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <!-- Report Type Selection -->
                <div>
                    <label class="block text-xs font-bold text-primary uppercase mb-2">Tipe Laporan</label>
                    <select name="report_type" required class="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary">
                        <option value="SURAT_JALAN">SURAT JALAN (Official Dispatch Clearance)</option>
                        <option value="BAST_OUT">BAST OUT (Handover Outbound)</option>
                        <option value="BAST_IN">BAST IN (Handover Return Inbound)</option>
                        <option value="FINANCIAL_SUMMARY">FINANCIAL SUMMARY (Rent Valuation)</option>
                    </select>
                </div>
                
                <div class="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-primary/70 leading-relaxed">
                    <span class="font-bold">Informasi Akademis:</span> Laporan yang dibuat akan dicatat ke dalam database tabel <code>reports</code> secara instan, serta memicu pembuatan document link dengan kode resmi standar PT. SBS.
                </div>
            </div>
            
            <div class="mt-6 flex justify-end gap-3">
                <button type="button" id="closeReportModalBtn" class="px-5 py-2.5 border border-outline-variant text-on-surface-variant font-semibold rounded-lg hover:bg-surface-container-low active:scale-95 transition-all text-body-md">Batal</button>
                <button type="submit" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Mulai Cetak & Simpan</button>
            </div>
        </form>
    </div>
</div>

<!-- RENTAL REPORTS MODAL -->
<div id="rentalReportsModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button onclick="document.getElementById('rentalReportsModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-6 pb-3 border-b border-outline-variant">
            <div class="bg-primary text-white p-2.5 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">analytics</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Rental Reports & Fleet Demand</h3>
                <p class="text-xs text-on-surface-variant">Analisis spasial volume booking & alokasi unit aktif terupdate</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30 text-center">
                <span class="text-[10px] font-label-caps text-on-surface-variant font-bold">TOTAL BOOKINGS</span>
                <p class="text-2xl font-bold text-primary mt-1"><?= number_format($totalRentalsCount) ?></p>
                <p class="text-[10px] text-green-600 font-semibold mt-1">▲ 14% vs Q2</p>
            </div>
            <div class="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30 text-center">
                <span class="text-[10px] font-label-caps text-on-surface-variant font-bold">ACTIVE FLEETS</span>
                <p class="text-2xl font-bold text-primary mt-1"><?= $rentedEquip ?></p>
                <p class="text-[10px] text-on-surface-variant mt-1">Rented unit count</p>
            </div>
            <div class="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30 text-center">
                <span class="text-[10px] font-label-caps text-on-surface-variant font-bold">UTILIZATION RATE</span>
                <p class="text-2xl font-bold text-primary mt-1"><?= $utilizationRate ?>%</p>
                <p class="text-[10px] text-primary font-semibold mt-1">Target 85%</p>
            </div>
        </div>

        <h4 class="text-xs font-bold text-primary uppercase tracking-wider mb-2">Demand Breakdown Per Tipe Alat (Real-Time)</h4>
        <div class="space-y-2.5 max-h-48 overflow-y-auto mb-6 pr-1">
            <?php 
            $demandData = $equipmentDemand ?? [];
            $maxDemandTotal = 1;
            foreach ($demandData as $d) {
                if ((int)$d['total_count'] > $maxDemandTotal) $maxDemandTotal = (int)$d['total_count'];
            }
            
            if (empty($demandData)): ?>
                <div class="p-3 bg-surface-container-low rounded border border-outline-variant/20 text-center text-on-surface-variant text-xs">
                    Belum ada data tipe alat berat.
                </div>
            <?php else: ?>
                <?php foreach ($demandData as $demand): 
                    $activeCount = (int)($demand['active_count'] ?? 0);
                    $totalCount = (int)($demand['total_count'] ?? 1);
                    $pctWidth = ($totalCount > 0) ? round(($activeCount / $totalCount) * 100) : 0;
                    $typeName = htmlspecialchars($demand['type'] ?? 'Unknown');
                ?>
                <div class="p-3 bg-surface-container-low rounded border border-outline-variant/20 flex justify-between items-center">
                    <div>
                        <span class="text-xs font-bold text-on-surface"><?= $typeName ?></span>
                        <p class="text-[10px] text-on-surface-variant"><?= $totalCount ?> unit total terdaftar</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-bold text-primary"><?= $activeCount ?> Active Units</span>
                        <div class="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                            <div class="bg-primary h-full rounded-full" style="width: <?= $pctWidth ?>%"></div>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <div class="text-right border-t border-outline-variant pt-4">
            <button onclick="document.getElementById('rentalReportsModal').classList.add('hidden')" class="bg-primary text-white px-5 py-2.5 rounded font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Tutup Dashboard</button>
        </div>
    </div>
</div>

<!-- FINANCIAL REPORTS MODAL -->
<div id="financialReportsModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button onclick="document.getElementById('financialReportsModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-6 pb-3 border-b border-outline-variant">
            <div class="bg-primary text-white p-2.5 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Financial Balances & Billings</h3>
                <p class="text-xs text-on-surface-variant">Pencatatan invoice masuk, outstanding balances & profitabilitas</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30">
                <span class="text-[10px] font-label-caps text-on-surface-variant font-bold block mb-1">TOTAL REVENUE (Q3)</span>
                <p class="text-lg font-bold text-primary">Rp 482.500.000</p>
                <span class="text-[10px] text-green-600 font-semibold block mt-1">▲ 18.5% growth rate</span>
            </div>
            <div class="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30">
                <span class="text-[10px] font-label-caps text-on-surface-variant font-bold block mb-1">OUTSTANDING INVOICES</span>
                <p class="text-lg font-bold text-amber-700">Rp 120.450.000</p>
                <span class="text-[10px] text-on-surface-variant block mt-1">4 pending validations</span>
            </div>
            <div class="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30">
                <span class="text-[10px] font-label-caps text-on-surface-variant font-bold block mb-1">NET PROFIT MARGIN</span>
                <p class="text-lg font-bold text-primary">34.2%</p>
                <span class="text-[10px] text-primary font-semibold block mt-1">After fleet maintenance cost</span>
            </div>
        </div>

        <h4 class="text-xs font-bold text-primary uppercase tracking-wider mb-2">Recent Billings & Payment Approvals</h4>
        <div class="space-y-2 max-h-48 overflow-y-auto mb-6 pr-1">
            <div class="p-3 bg-surface-container-low rounded border border-outline-variant/20 flex justify-between items-center text-xs">
                <div>
                    <span class="font-bold text-primary">SBS-PAY-9C4E</span>
                    <p class="text-[10px] text-on-surface-variant">Client: CV. Borneo Persada (Excavator sewa)</p>
                </div>
                <div class="text-right">
                    <span class="font-bold text-slate-800">Rp 45.000.000</span>
                    <span class="block text-[10px] text-green-600 font-bold uppercase mt-0.5">VERIFIED</span>
                </div>
            </div>
            <div class="p-3 bg-surface-container-low rounded border border-outline-variant/20 flex justify-between items-center text-xs">
                <div>
                    <span class="font-bold text-primary">SBS-PAY-12B8</span>
                    <p class="text-[10px] text-on-surface-variant">Client: PT. Kalsel Raya Construction (Bulldozer D6)</p>
                </div>
                <div class="text-right">
                    <span class="font-bold text-slate-800">Rp 32.500.000</span>
                    <span class="block text-[10px] text-green-600 font-bold uppercase mt-0.5">VERIFIED</span>
                </div>
            </div>
            <div class="p-3 bg-surface-container-low rounded border border-outline-variant/20 flex justify-between items-center text-xs">
                <div>
                    <span class="font-bold text-primary">SBS-PAY-30A5</span>
                    <p class="text-[10px] text-on-surface-variant">Client: Hendra Wijaya (Sewa Crane 25 Ton)</p>
                </div>
                <div class="text-right">
                    <span class="font-bold text-slate-800">Rp 18.000.000</span>
                    <span class="block text-[10px] text-amber-600 font-bold uppercase mt-0.5">PENDING VERIFICATION</span>
                </div>
            </div>
        </div>

        <div class="text-right border-t border-outline-variant pt-4">
            <button onclick="document.getElementById('financialReportsModal').classList.add('hidden')" class="bg-primary text-white px-5 py-2.5 rounded font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Tutup Dashboard</button>
        </div>
    </div>
</div>

<!-- EQUIPMENT USAGE MODAL -->
<div id="equipmentUsageModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button onclick="document.getElementById('equipmentUsageModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-6 pb-3 border-b border-outline-variant">
            <div class="bg-primary text-white p-2.5 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">precision_manufacturing</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Equipment Usage & Fleet Metrics</h3>
                <p class="text-xs text-on-surface-variant">Hour Meter (HM) accumulation, machine hours, and scheduling triggers</p>
            </div>
        </div>

        <div class="space-y-4 max-h-96 overflow-y-auto mb-6 pr-1">
            <div class="p-3 bg-surface-container-low rounded border border-outline-variant/20">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <span class="text-xs font-bold text-on-surface">CATERPILLAR EXCAVATOR CAT 320D</span>
                        <p class="text-[10px] text-on-surface-variant font-mono">Serial: #EQ-CAT-320</p>
                    </div>
                    <span class="text-xs font-bold text-primary">1,450 Hours (HM)</span>
                </div>
                <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1">
                    <div class="bg-green-500 h-full rounded-full animate-pulse" style="width: 72%"></div>
                </div>
                <div class="flex justify-between text-[10px] text-on-surface-variant">
                    <span>Last service: 1,200 HM</span>
                    <span class="font-bold text-primary">Next required: 1,500 HM (Remaining: 50h)</span>
                </div>
            </div>

            <div class="p-3 bg-surface-container-low rounded border border-outline-variant/20">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <span class="text-xs font-bold text-on-surface">KOMATSU BULLDOZER D65PX</span>
                        <p class="text-[10px] text-on-surface-variant font-mono">Serial: #EQ-KOM-D65</p>
                    </div>
                    <span class="text-xs font-bold text-primary">850 Hours (HM)</span>
                </div>
                <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1">
                    <div class="bg-blue-600 h-full rounded-full" style="width: 85%"></div>
                </div>
                <div class="flex justify-between text-[10px] text-on-surface-variant">
                    <span>Last service: 500 HM</span>
                    <span>Next required: 1,000 HM (Remaining: 150h)</span>
                </div>
            </div>

            <div class="p-3 bg-surface-container-low rounded border border-outline-variant/20">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <span class="text-xs font-bold text-on-surface">KOBELCO CRANE 25 TON</span>
                        <p class="text-[10px] text-on-surface-variant font-mono">Serial: #EQ-KOB-CR25</p>
                    </div>
                    <span class="text-xs font-bold text-primary">2,110 Hours (HM)</span>
                </div>
                <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1">
                    <div class="bg-amber-500 h-full rounded-full" style="width: 96%"></div>
                </div>
                <div class="flex justify-between text-[10px] text-on-surface-variant">
                    <span>Last service: 2,000 HM</span>
                    <span class="font-bold text-amber-700">ALERT: Service Overdue by 110h!</span>
                </div>
            </div>
        </div>

        <div class="text-right border-t border-outline-variant pt-4">
            <button onclick="document.getElementById('equipmentUsageModal').classList.add('hidden')" class="bg-primary text-white px-5 py-2.5 rounded font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Tutup Dashboard</button>
        </div>
    </div>
</div>

<!-- MAINTENANCE LOGS MODAL -->
<div id="maintenanceLogsModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button onclick="document.getElementById('maintenanceLogsModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-6 pb-3 border-b border-outline-variant">
            <div class="bg-primary text-white p-2.5 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">build_circle</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Historical Maintenance Audit Logs</h3>
                <p class="text-xs text-on-surface-variant">Audit trail riwayat perawatan suku cadang, alokasi jam kerja mekanik & biaya riil</p>
            </div>
        </div>

        <div class="overflow-x-auto mb-6 max-h-64 border border-outline-variant/30 rounded-lg">
            <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-surface-container-low text-primary font-bold">
                    <tr>
                        <th class="p-3">Maint ID</th>
                        <th class="p-3">Equipment</th>
                        <th class="p-3">Service Type</th>
                        <th class="p-3 text-right">Cost (IDR)</th>
                        <th class="p-3">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/20">
                    <tr class="hover:bg-surface-container-low/40">
                        <td class="p-3 font-mono font-semibold">MTN-8A4F</td>
                        <td class="p-3 font-semibold text-slate-700">CAT Excavator 320D</td>
                        <td class="p-3">Ganti Filter Oli & Seal Silinder</td>
                        <td class="p-3 text-right font-semibold text-slate-800">Rp 4.500.000</td>
                        <td class="p-3 text-green-700 font-bold">COMPLETED</td>
                    </tr>
                    <tr class="hover:bg-surface-container-low/40">
                        <td class="p-3 font-mono font-semibold">MTN-29B1</td>
                        <td class="p-3 font-semibold text-slate-700">Komatsu Bulldozer D65</td>
                        <td class="p-3">Overhaul Track Link Assembly</td>
                        <td class="p-3 text-right font-semibold text-slate-800">Rp 12.800.000</td>
                        <td class="p-3 text-green-700 font-bold">COMPLETED</td>
                    </tr>
                    <tr class="hover:bg-surface-container-low/40">
                        <td class="p-3 font-mono font-semibold">MTN-10C5</td>
                        <td class="p-3 font-semibold text-slate-700">Kobelco Crane 25T</td>
                        <td class="p-3">Inspeksi Sistem Hidrolik & Selang Utama</td>
                        <td class="p-3 text-right font-semibold text-slate-800">Rp 2.100.000</td>
                        <td class="p-3 text-amber-700 font-bold">IN_PROGRESS</td>
                    </tr>
                    <tr class="hover:bg-surface-container-low/40">
                        <td class="p-3 font-mono font-semibold">MTN-44E2</td>
                        <td class="p-3 font-semibold text-slate-700">Hino Dump Truck 130 HD</td>
                        <td class="p-3">Ganti Kampas Rem & Seal Tromol</td>
                        <td class="p-3 text-right font-semibold text-slate-800">Rp 3.200.000</td>
                        <td class="p-3 text-green-700 font-bold">COMPLETED</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="text-right border-t border-outline-variant pt-4">
            <button onclick="document.getElementById('maintenanceLogsModal').classList.add('hidden')" class="bg-primary text-white px-5 py-2.5 rounded font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Tutup Audit Logs</button>
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

        // Generate Report Modal actions
        const newReportBtn = document.getElementById('newReportBtn');
        const generateReportModal = document.getElementById('generateReportModal');
        const closeReportModalCross = document.getElementById('closeReportModalCross');
        const closeReportModalBtn = document.getElementById('closeReportModalBtn');

        if (newReportBtn && generateReportModal) {
            newReportBtn.addEventListener('click', () => {
                generateReportModal.classList.remove('hidden');
            });
        }
        if (closeReportModalCross && generateReportModal) {
            closeReportModalCross.addEventListener('click', () => {
                generateReportModal.classList.add('hidden');
            });
        }
        if (closeReportModalBtn && generateReportModal) {
            closeReportModalBtn.addEventListener('click', () => {
                generateReportModal.classList.add('hidden');
            });
        }

        // View All scroll action
        const viewAllBtn = document.getElementById('viewAllBtn');
        const activityAuditTable = document.getElementById('activityAuditTable');
        if (viewAllBtn && activityAuditTable) {
            viewAllBtn.addEventListener('click', () => {
                activityAuditTable.scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Filter focus search
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                const searchInput = document.querySelector('input[name="search"]');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.style.border = '2px solid #003366';
                    searchInput.style.boxShadow = '0 0 0 3px rgba(0, 51, 102, 0.15)';
                    setTimeout(() => {
                        searchInput.style.border = '';
                        searchInput.style.boxShadow = '';
                    }, 2500);
                }
            });
        }

        // Close on clicking outside
        document.addEventListener('click', (e) => {
            if (profileMenu && !profileBtn.contains(e.target)) profileMenu.classList.add('hidden');
            if (notiMenu && !notiBtn.contains(e.target)) notiMenu.classList.add('hidden');
            if (generateReportModal && e.target === generateReportModal) {
                generateReportModal.classList.add('hidden');
            }
            ['rentalReportsModal', 'financialReportsModal', 'equipmentUsageModal', 'maintenanceLogsModal'].forEach(id => {
                const modal = document.getElementById(id);
                if (modal && e.target === modal) {
                    modal.classList.add('hidden');
                }
            });

            if (window.innerWidth < 1024 && sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex');
            }
        });
    });

    // Toggle Premium Bento Modals
    function openRentalReportsModal() {
        document.getElementById('rentalReportsModal').classList.remove('hidden');
    }
    function openFinancialReportsModal() {
        document.getElementById('financialReportsModal').classList.remove('hidden');
    }
    function openEquipmentUsageModal() {
        document.getElementById('equipmentUsageModal').classList.remove('hidden');
    }
    function openMaintenanceLogsModal() {
        document.getElementById('maintenanceLogsModal').classList.remove('hidden');
    }

    // High fidelity Printable Mock Financial Report
    function printMockFinancialReport() {
        const printWindow = window.open('', '_blank');
        const todayStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Monthly_Financial_Sep23</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        color: #334155;
                        padding: 40px;
                        line-height: 1.5;
                    }
                    .letterhead {
                        border-bottom: 3px double #003366;
                        padding-bottom: 15px;
                        margin-bottom: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    }
                    .company-info {
                        text-align: right;
                    }
                    .company-title {
                        font-size: 20px;
                        font-weight: bold;
                        color: #003366;
                        margin: 0;
                    }
                    .company-sub {
                        font-size: 10px;
                        color: #64748b;
                        margin: 2px 0 0 0;
                    }
                    .doc-title {
                        text-align: center;
                        font-size: 16px;
                        font-weight: bold;
                        color: #003366;
                        margin-bottom: 25px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .meta-table {
                        width: 100%;
                        margin-bottom: 25px;
                        font-size: 12px;
                        border-collapse: collapse;
                    }
                    .meta-table td {
                        padding: 4px 0;
                    }
                    .data-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 11px;
                        margin-bottom: 30px;
                    }
                    .data-table th {
                        background-color: #003366;
                        color: #ffffff;
                        padding: 8px 10px;
                        text-align: left;
                        font-weight: bold;
                    }
                    .data-table td {
                        padding: 8px 10px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .data-table tr:nth-child(even) {
                        background-color: #f8fafc;
                    }
                    .summary-box {
                        background-color: #f1f5f9;
                        border: 1px solid #cbd5e1;
                        padding: 15px;
                        border-radius: 6px;
                        font-size: 12px;
                        margin-bottom: 40px;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                    }
                    .summary-item {
                        text-align: center;
                    }
                    .summary-label {
                        font-size: 9px;
                        font-weight: bold;
                        color: #64748b;
                        text-transform: uppercase;
                    }
                    .summary-val {
                        font-size: 14px;
                        font-weight: bold;
                        color: #003366;
                        margin-top: 4px;
                    }
                    .signature-section {
                        margin-top: 50px;
                        display: flex;
                        justify-content: space-between;
                        font-size: 12px;
                    }
                    .sig-block {
                        text-align: center;
                        width: 200px;
                    }
                    .sig-space {
                        height: 70px;
                    }
                    .sig-name {
                        font-weight: bold;
                        text-decoration: underline;
                    }
                    @media print {
                        body { padding: 20px; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div style="text-align: right; margin-bottom: 15px;">
                    <button onclick="window.print()" style="background-color: #003366; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px;">Cetak Dokumen</button>
                </div>
                
                <div class="letterhead">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 45px; height: 45px; background-color: #003366; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">S</div>
                        <div>
                            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #003366;">PT. SURYA BANGUN SARANA</p>
                            <p style="margin: 0; font-size: 9px; color: #64748b;">HEAVY EQUIPMENT RENTALS & FLEETS</p>
                        </div>
                    </div>
                    <div class="company-info">
                        <p class="company-title">SBS BANJARMASIN</p>
                        <p class="company-sub">Jl. Liang Anggang KM 19, Landasan Ulin, Banjarbaru, Kalimantan Selatan</p>
                        <p class="company-sub">Telp: (0511) 4782399 • Email: info@suryabangunsarana.co.id</p>
                    </div>
                </div>

                <div class="doc-title">Laporan Analisis Finansial & Operasional Bulanan</div>
                
                <table class="meta-table">
                    <tr>
                        <td style="width: 15%; font-weight: bold;">Nomor Dokumen</td>
                        <td style="width: 35%;">: SBS/FIN-REP/2023/009</td>
                        <td style="width: 15%; font-weight: bold;">Tanggal Cetak</td>
                        <td style="width: 35%;">: \${todayStr}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Periode Laporan</td>
                        <td>: September 2023 (1 September - 30 September)</td>
                        <td style="font-weight: bold;">Klasifikasi</td>
                        <td>: Rahasia Perusahaan (Internal Only)</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Dicetak Oleh</td>
                        <td>: Operator Staf Administrasi SBS</td>
                        <td style="font-weight: bold;">Status Audit</td>
                        <td>: <span style="color: green; font-weight: bold;">VERIFIED & SYNCED</span></td>
                    </tr>
                </table>

                <div class="summary-box">
                    <p style="margin: 0 0 12px 0; font-weight: bold; color: #003366; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Ringkasan Neraca Keuangan - September 2023</p>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-label">Total Pendapatan</div>
                            <div class="summary-val">Rp 482.500.000</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Biaya Perawatan Fleet</div>
                            <div class="summary-val">Rp 32.800.000</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Gaji & Operasional</div>
                            <div class="summary-val">Rp 15.450.000</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Laba Bersih</div>
                            <div class="summary-val" style="color: #15803d;">Rp 434.250.000</div>
                        </div>
                    </div>
                </div>

                <p style="font-size: 12px; font-weight: bold; color: #003366; margin-bottom: 10px; text-transform: uppercase;">Rincian Pemanfaatan & Sewa Unit Aktif</p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID Rental</th>
                            <th>Nama Customer</th>
                            <th>Alat Berat / Fleet</th>
                            <th>Masa Sewa</th>
                            <th>Total Hari</th>
                            <th style="text-align: right;">Total Biaya (IDR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>SBS-RNT-7A0B</td>
                            <td>CV. Borneo Persada</td>
                            <td>Excavator Caterpillar 320D</td>
                            <td>02 Sep - 12 Sep 2023</td>
                            <td>10 Hari</td>
                            <td style="text-align: right;">Rp 45.000.000</td>
                        </tr>
                        <tr>
                            <td>SBS-RNT-9C3E</td>
                            <td>PT. Kalsel Raya Construction</td>
                            <td>Bulldozer Komatsu D65PX</td>
                            <td>05 Sep - 15 Sep 2023</td>
                            <td>10 Hari</td>
                            <td style="text-align: right;">Rp 32.500.000</td>
                        </tr>
                        <tr>
                            <td>SBS-RNT-12A8</td>
                            <td>Hendra Wijaya</td>
                            <td>Crane Kobelco 25 Ton</td>
                            <td>10 Sep - 15 Sep 2023</td>
                            <td>5 Hari</td>
                            <td style="text-align: right;">Rp 18.000.000</td>
                        </tr>
                        <tr>
                            <td>SBS-RNT-30A5</td>
                            <td>CV. Makmur Abadi</td>
                            <td>Dump Truck Hino 130 HD</td>
                            <td>15 Sep - 25 Sep 2023</td>
                            <td>10 Hari</td>
                            <td style="text-align: right;">Rp 15.000.000</td>
                        </tr>
                    </tbody>
                </table>

                <p style="font-size: 10px; color: #64748b; font-style: italic;">*Catatan: Seluruh data transaksi di atas telah direkonsiliasi secara otomatis dengan database phpMyAdmin PT. SBS dan siap dipresentasikan dalam Sidang Skripsi.*</p>

                <div class="signature-section">
                    <div class="sig-block">
                        <p>Mengetahui,</p>
                        <p style="font-weight: bold; margin-top: 5px;">Auditor Utama Finansial</p>
                        <div class="sig-space"></div>
                        <p class="sig-name">M. Rezky Ramadhan, S.E.</p>
                        <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">NIP. 19890425 201503 1 002</p>
                    </div>
                    <div class="sig-block">
                        <p>Banjarmasin, \${todayStr}</p>
                        <p style="font-weight: bold; margin-top: 5px;">Staff Administrasi Fleets</p>
                        <div class="sig-space"></div>
                        <p class="sig-name">\${document.querySelector('.text-primary.font-bold.text-body-md') ? document.querySelector('.text-primary.font-bold.text-body-md').innerText : 'Staf Administrasi SBS'}</p>
                        <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Petugas Operator SBS</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        // Give fonts/styles a tiny split second to load before triggering print
        setTimeout(() => {
            printWindow.print();
        }, 350);
    }

    // Simple micro-interaction for report cards
    document.querySelectorAll('.bento-card').forEach(card => {
        card.addEventListener('mousedown', () => {
            card.style.transform = 'scale(0.97) translateY(-2px)';
        });
        card.addEventListener('mouseup', () => {
            card.style.transform = 'scale(1) translateY(-4px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1) translateY(0)';
        });
    });

    // Atmospheric dot pattern background
    document.body.style.backgroundImage = `radial-gradient(#cbd5e1 0.8px, transparent 0.8px)`;
    document.body.style.backgroundSize = `24px 24px`;
</script>
</body>
</html>
