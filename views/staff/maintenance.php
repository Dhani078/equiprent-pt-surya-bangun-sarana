<?php
/**
 * ============================================================================
 * VIEW: views/staff/maintenance.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Halaman Pemeliharaan & Service (Maintenance) khusus untuk Staf Operasional.
 * Mengintegrasikan bento layout, pencarian dinamis, feed upcoming appointments,
 * SOP pendukung, serta verifikasi pemeliharaan langsung terhubung ke database.
 * 
 * KEPATUHAN DESAIN PREMIUM (100% REPLIKASI DENGAN MOCKUP VISUAL STITCH):
 * - Hanken Grotesk & JetBrains Mono fonts.
 * - Primary color #001e40 (Deep Blue), Secondary #515f74 (Slate Gray).
 * - Smooth transition dan interaksi hover.
 */

$fullName = $_SESSION['full_name'] ?? 'Alex Staff';
$role = $_SESSION['role'] ?? 'Operations';
$currentPage = 'maintenance';

// Ambil koneksi database untuk menghitung statistik urgensi kustom
$db = Database::getConnection();
$stmtUrgent = $db->query("SELECT COUNT(*) FROM `maintenance` WHERE `status` IN ('SCHEDULED', 'IN_PROGRESS') AND `scheduled_date` <= CURRENT_DATE()");
$urgentCount = $stmtUrgent->fetchColumn() ?: 0;
?>
<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>Maintenance &amp; Service - EquipRent MS</title>
    
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
        .bento-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }
        @media (max-width: 1024px) {
            .bento-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        .bento-card {
            border: 1px solid #e2e8f0;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-card:hover {
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
            transform: translateY(-2px);
        }
        tr {
            transition: all 0.2s ease;
        }
    </style>
</head>
<body class="bg-background text-on-background font-body-md antialiased">

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
                <span class="font-body-md text-body-md font-bold">Maintenance</span>
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
                    <a class="flex items-center gap-3 px-6 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md text-body-md" href="index.php?page=contracts">
                        <span class="material-symbols-outlined">description</span>
                        <span>Contracts</span>
                    </a>
                </li>
                <li>
                    <!-- Active State: Maintenance -->
                    <a class="flex items-center gap-3 px-6 py-3 text-primary font-bold border-l-4 border-primary bg-secondary-container transition-all scale-95 duration-100 font-body-md text-body-md" href="index.php?page=maintenance">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">handyman</span>
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
    <input type="hidden" name="page" value="maintenance">
    <input name="search" value="<?= htmlspecialchars($search ?? '') ?>" class="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary transition-all text-body-md font-body-md" placeholder="Search inventory or orders..." type="text"/>
</form>
</div>
</div><div class="flex items-center gap-4 relative">
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

<!-- Main Content -->
<main class="ml-0 lg:ml-[260px] pt-16 min-h-screen">
    <div class="p-container-padding space-y-6">
        
        <!-- Header Section -->
        <div class="flex justify-between items-end">
            <div>
                <h2 class="font-display-lg text-display-lg text-primary font-bold">Maintenance &amp; Service</h2>
                <p class="text-on-surface-variant font-body-lg">Manage equipment health and track service schedules.</p>
            </div>
            <button id="addMaintenanceBtn" class="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-95 duration-75 shadow-sm">
                <span class="material-symbols-outlined">add</span>
                Add Maintenance
            </button>
        </div>

        <!-- Stats Bento Grid -->
        <div class="bento-grid">
            <!-- Active Work Orders -->
            <div class="bento-card bg-surface-container-lowest p-5 rounded-xl">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-secondary-container text-primary rounded-lg">
                        <span class="material-symbols-outlined">engineering</span>
                    </div>
                    <span class="text-xs font-label-caps text-on-primary-container bg-secondary-container px-2 py-1 rounded">Active</span>
                </div>
                <p class="font-label-caps text-[11px] text-on-surface-variant mb-1 uppercase tracking-wider">Active Work Orders</p>
                <h3 class="font-display-lg text-display-lg font-bold text-primary"><?= sprintf('%02d', $stats['active']) ?> Tasks</h3>
            </div>
            
            <!-- Scheduled -->
            <div class="bento-card bg-surface-container-lowest p-5 rounded-xl">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-tertiary-container text-on-tertiary-container rounded-lg">
                        <span class="material-symbols-outlined">calendar_month</span>
                    </div>
                    <span class="text-xs font-label-caps text-on-surface-variant px-2 py-1">Next 7 Days</span>
                </div>
                <p class="font-label-caps text-[11px] text-on-surface-variant mb-1 uppercase tracking-wider">Scheduled</p>
                <h3 class="font-display-lg text-display-lg font-bold text-primary"><?= sprintf('%02d', $stats['upcoming']) ?> Units</h3>
            </div>
            
            <!-- Units In Shop -->
            <div class="bento-card bg-surface-container-lowest p-5 rounded-xl">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-surface-container-high text-outline rounded-lg">
                        <span class="material-symbols-outlined">precision_manufacturing</span>
                    </div>
                    <span class="text-xs font-label-caps text-on-surface-variant px-2 py-1">In Workshop</span>
                </div>
                <p class="font-label-caps text-[11px] text-on-surface-variant mb-1 uppercase tracking-wider">Units In Shop</p>
                <h3 class="font-display-lg text-display-lg font-bold text-primary"><?= sprintf('%02d', $stats['in_shop']) ?> Units</h3>
            </div>
            
            <!-- Maintenance Due (Urgent) -->
            <div class="bento-card bg-surface-container-lowest p-5 rounded-xl border-l-4 border-l-error">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-error-container text-on-error-container rounded-lg">
                        <span class="material-symbols-outlined text-error" style="font-variation-settings: 'FILL' 1;">warning</span>
                    </div>
                    <span class="text-xs font-label-caps text-error bg-error-container px-2 py-1 rounded">Urgent</span>
                </div>
                <p class="font-label-caps text-[11px] text-on-surface-variant mb-1 uppercase tracking-wider">Maintenance Due</p>
                <h3 class="font-display-lg text-display-lg font-bold text-error"><?= sprintf('%02d', $urgentCount) ?> Units</h3>
            </div>
        </div>

        <!-- Maintenance Table -->
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
            <div class="p-6 border-b border-outline-variant flex justify-between items-center">
                <h4 class="font-headline-sm text-headline-sm text-primary font-bold">All Maintenance Records</h4>
                <div class="flex gap-2">
                    <button class="px-4 py-2 text-sm font-semibold border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">filter_list</span>
                        Filter
                    </button>
                    <button onclick="exportMaintenancePDF()" class="px-4 py-2 text-sm font-semibold border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95">
                        <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                        Export PDF
                    </button>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-surface-container-low">
                            <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">ID Maintenance</th>
                            <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Unit Alat</th>
                            <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Tipe Service</th>
                            <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Tanggal</th>
                            <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Teknisi</th>
                            <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Status</th>
                            <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider border-b border-outline-variant text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-outline-variant">
                        <?php if (empty($workOrders)): ?>
                            <tr>
                                <td colspan="7" class="px-6 py-12 text-center text-on-surface-variant opacity-75 font-body-lg">
                                    <span class="material-symbols-outlined text-[48px] mb-2 opacity-50 block">engineering</span>
                                    Tidak ada data perawatan terdaftar.
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
                                }
                                
                                $techName = $order['technician_name'] ?: 'Belum Ditunjuk';
                                $words = explode(' ', $techName);
                                $initials = '';
                                if (count($words) >= 2) {
                                    $initials = strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1));
                                } else {
                                    $initials = strtoupper(substr($techName, 0, 2));
                                }
                                
                                $status = strtoupper($order['status']);
                                $badgeClass = '';
                                if ($status === 'IN_PROGRESS') {
                                    $badgeClass = 'bg-secondary-container text-on-secondary-container';
                                } elseif ($status === 'COMPLETED') {
                                    $badgeClass = 'bg-on-tertiary-container/10 text-on-tertiary-container';
                                } elseif ($status === 'CANCELLED') {
                                    $badgeClass = 'bg-error-container text-error border border-error/10';
                                } else {
                                    $daysLeft = ceil((strtotime($order['scheduled_date']) - time()) / 86400);
                                    if ($daysLeft <= 1) {
                                        $badgeClass = 'bg-error-container text-error border border-error/10';
                                        $status = 'URGENT';
                                    } else {
                                        $badgeClass = 'bg-surface-container-high text-on-surface-variant';
                                    }
                                }
                            ?>
                                <tr class="hover:bg-surface-container-low/50 transition-colors group cursor-pointer">
                                    <td class="px-6 py-4 font-label-caps text-primary font-bold">#<?= htmlspecialchars($order['maintenance_code']) ?></td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant p-0.5">
                                                <img alt="<?= htmlspecialchars($order['equipment_name']) ?>" class="object-cover h-full w-full rounded-sm" src="<?= $imgUrl ?>"/>
                                            </div>
                                            <div>
                                                <p class="font-bold text-primary"><?= htmlspecialchars($order['equipment_name']) ?></p>
                                                <p class="text-xs text-on-surface-variant"><?= htmlspecialchars($order['brand']) ?> - SN: <?= htmlspecialchars($order['equipment_code']) ?></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-on-surface-variant">
                                        <p class="font-semibold text-primary"><?= htmlspecialchars($order['maintenance_type']) ?></p>
                                        <p class="text-xs text-on-surface-variant opacity-75 max-w-[200px] truncate"><?= htmlspecialchars($order['description']) ?></p>
                                    </td>
                                    <td class="px-6 py-4 text-on-surface-variant font-mono"><?= date('M d, Y', strtotime($order['scheduled_date'])) ?></td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-[10px] flex items-center justify-center font-bold">
                                                <?= $initials ?>
                                            </div>
                                            <span class="text-on-surface-variant"><?= htmlspecialchars($techName) ?></span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="<?= $badgeClass ?> px-3 py-1 rounded-full text-xs font-bold"><?= $status ?></span>
                                    </td>
                                    <td class="px-6 py-4 text-right relative">
                                        <button class="maint-dropdown-btn p-2 hover:bg-surface-container-high rounded transition-colors text-outline focus:outline-none" data-id="<?= $order['id'] ?>">
                                            <span class="material-symbols-outlined pointer-events-none">more_vert</span>
                                        </button>
                                        <!-- Custom Dropdown Menu -->
                                        <div id="maintDropdown-<?= $order['id'] ?>" class="maint-dropdown-menu hidden absolute right-6 top-12 z-50 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl py-1.5 w-44 text-left animate-fade-in">
                                            <button type="button" onclick="showMaintDetails('<?= htmlspecialchars($order['maintenance_code']) ?>', '<?= htmlspecialchars($order['equipment_name']) ?>', '<?= htmlspecialchars($order['notes'] ?: 'No additional notes.') ?>')" class="w-full px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer">
                                                <span class="material-symbols-outlined text-sm">info</span> View Notes
                                            </button>
                                            <?php if ($status !== 'COMPLETED' && $status !== 'CANCELLED'): ?>
                                                <button type="button" onclick="openCompleteMaintModal(<?= $order['id'] ?>, '<?= htmlspecialchars($order['maintenance_code']) ?>', '<?= htmlspecialchars($order['equipment_name']) ?>', <?= intval($order['hour_meter']) ?>, <?= floatval($order['cost']) ?>, '<?= htmlspecialchars($order['notes'] ?: '') ?>')" class="w-full px-4 py-2 text-xs font-semibold text-primary hover:bg-primary-container/10 transition-colors flex items-center gap-2 cursor-pointer">
                                                    <span class="material-symbols-outlined text-sm">check_circle</span> Complete Task
                                                </button>
                                            <?php endif; ?>
                                            <a href="index.php?page=maintenance&action=delete&id=<?= $order['id'] ?>" onclick="return confirm('Apakah Anda yakin ingin menghapus jadwal perawatan ini?')" class="w-full px-4 py-2 text-xs font-semibold text-error hover:bg-error/5 transition-colors flex items-center gap-2">
                                                <span class="material-symbols-outlined text-sm text-error">delete</span> Delete Schedule
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
            
            <div class="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-low/30">
                <p class="text-xs text-on-surface-variant">Showing <?= count($workOrders) ?> of <?= count($workOrders) ?> entries</p>
                <div class="flex gap-1">
                    <button class="w-8 h-8 rounded flex items-center justify-center hover:bg-surface-container-high transition-colors disabled:opacity-50" disabled>
                        <span class="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button class="w-8 h-8 rounded bg-primary text-on-primary font-bold text-xs">1</button>
                    <button class="w-8 h-8 rounded hover:bg-surface-container-high transition-colors text-xs disabled:opacity-50" disabled>2</button>
                    <button class="w-8 h-8 rounded flex items-center justify-center hover:bg-surface-container-high transition-colors disabled:opacity-50" disabled>
                        <span class="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Contextual Information (Bottom Section) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Upcoming Appointments -->
            <div class="lg:col-span-2 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant bento-card">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-headline-sm text-headline-sm text-primary font-bold">Upcoming Appointments</h4>
                    <span class="text-primary hover:underline cursor-pointer text-sm font-semibold">View Calendar</span>
                </div>
                
                <div class="space-y-4">
                    <?php if (empty($upcomingServices)): ?>
                        <div class="text-center text-on-surface-variant py-6 font-body-md">
                            Tidak ada jadwal pemeliharaan terdekat.
                        </div>
                    <?php else: ?>
                        <?php foreach ($upcomingServices as $service): ?>
                            <div class="flex gap-4 items-center p-3 rounded-lg border border-transparent hover:border-outline-variant transition-all cursor-pointer">
                                <div class="w-12 h-12 rounded bg-surface-container-high flex flex-col items-center justify-center text-primary border border-outline-variant shrink-0">
                                    <span class="text-[9px] font-label-caps font-bold leading-none"><?= strtoupper(date('M', strtotime($service['scheduled_date']))) ?></span>
                                    <span class="font-bold text-lg leading-tight"><?= date('d', strtotime($service['scheduled_date'])) ?></span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-bold text-primary truncate"><?= htmlspecialchars($service['equipment_name']) ?> - Annual Safety Check</p>
                                    <p class="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                                        <span class="material-symbols-outlined text-sm">schedule</span>
                                        <?= htmlspecialchars($service['description']) ?>
                                    </p>
                                </div>
                                <span class="material-symbols-outlined text-on-surface-variant shrink-0">chevron_right</span>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
            
            <!-- Support Box -->
            <div class="bg-primary-container text-on-primary p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group bento-card">
                <div class="relative z-10">
                    <h4 class="font-headline-sm text-headline-sm font-bold mb-2 text-white">Quick Support</h4>
                    <p class="text-body-md text-on-primary/80 mb-6">Having issues with an equipment check-in? Contact technical support or view documentation.</p>
                    <div class="space-y-3">
                        <button id="sopDocBtn" class="w-full py-2.5 px-4 bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 rounded-lg flex items-center gap-3 transition-colors text-sm font-semibold text-white">
                            <span class="material-symbols-outlined text-white">menu_book</span>
                            SOP Documentation
                        </button>
                        <a href="https://wa.me/6282148564979?text=Halo%20Teknisi%20PT.%20SBS%20Banjarmasin,%20ada%20kendala%20alat%20berat%20yang%20perlu%20segera%20ditangani." target="_blank" class="w-full py-2.5 px-4 bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 rounded-lg flex items-center gap-3 transition-colors text-sm font-semibold text-white">
                            <span class="material-symbols-outlined text-white">support_agent</span>
                            Call Technician
                        </a>
                    </div>
                </div>
                <!-- Decoration -->
                <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-on-primary/10 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
                <div class="absolute top-4 right-4 text-on-primary/20">
                    <span class="material-symbols-outlined text-6xl rotate-12" style="font-variation-settings: 'FILL' 1;">contact_support</span>
                </div>
            </div>
        </div>
        
    </div>
</main>

<!-- Add Maintenance Modal Dialog -->
<div id="addMaintenanceModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 max-h-[90vh] overflow-y-auto">
        <button id="closeAddMaintCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-4">
            <div class="bg-primary-container p-2.5 rounded-lg text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">handyman</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Add Maintenance Schedule</h3>
                <p class="text-xs text-on-surface-variant">Jadwalkan Servis & Perawatan Unit Alat Berat SBS</p>
            </div>
        </div>
        
        <form method="POST" action="index.php?page=maintenance" class="space-y-4 text-body-md text-on-surface">
            <input type="hidden" name="action" value="add">
            
            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Pilih Unit Alat Berat *</label>
                <select name="equipment_id" required class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary">
                    <option value="" disabled selected>-- Pilih Unit Aktif --</option>
                    <?php foreach ($equipmentsList as $equip): ?>
                        <option value="<?= $equip['id'] ?>"><?= htmlspecialchars($equip['name']) ?> (SN: <?= htmlspecialchars($equip['equipment_code']) ?>)</option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Tanggal Scheduled *</label>
                    <input type="date" name="scheduled_date" value="<?= date('Y-m-d') ?>" required class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Tipe Servis *</label>
                    <select name="maintenance_type" required class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary">
                        <option value="Preventive Maintenance">Preventive Maintenance</option>
                        <option value="Corrective Maintenance">Corrective Maintenance</option>
                        <option value="Breakdown Repair">Breakdown Repair</option>
                        <option value="Routine Calibration">Routine Calibration</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Estimasi Biaya (IDR) *</label>
                    <input type="number" name="cost" value="0" required min="0" class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Catatan Hour Meter (HM) *</label>
                    <input type="number" name="hour_meter" value="0" required min="0" class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary">
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Pilih Teknisi Penanggung Jawab *</label>
                <select name="technician_id" required class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary">
                    <option value="" disabled selected>-- Pilih Operator Staf --</option>
                    <?php foreach ($techniciansList as $tech): ?>
                        <option value="<?= $tech['id'] ?>"><?= htmlspecialchars($tech['full_name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Status Perawatan Awal</label>
                <select name="status" class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary">
                    <option value="SCHEDULED">Scheduled (Direncanakan)</option>
                    <option value="IN_PROGRESS">In Progress (Sedang Dikerjakan)</option>
                    <option value="COMPLETED">Completed (Selesai Servis)</option>
                </select>
            </div>

            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Detail Instruksi Kerusakan / Servis</label>
                <textarea name="notes" rows="3" class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary text-xs" placeholder="Ganti oli hidrolik, cek tekanan piston excavator, bersihkan filter udara..."></textarea>
            </div>

            <div class="mt-6 flex justify-end gap-3 pt-2">
                <button type="button" id="closeAddMaintBtn" class="px-4 py-2 border border-outline-variant rounded-lg text-body-md text-on-surface-variant hover:bg-surface-container-high transition-all">Batal</button>
                <button type="submit" class="bg-primary text-white px-5 py-2 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Simpan Jadwal</button>
            </div>
        </form>
    </div>
</div>

<!-- SOP Documentation Modal Dialog -->
<div id="sopDocModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 max-h-[85vh] overflow-y-auto">
        <button id="closeSopDocCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-4">
            <div class="bg-primary-container p-2.5 rounded-lg text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">menu_book</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">SOP Perawatan Alat Berat</h3>
                <p class="text-xs text-on-surface-variant">PT. Surya Bangun Sarana Banjarmasin</p>
            </div>
        </div>
        <div class="space-y-3 text-body-md text-on-surface border-t border-outline-variant/55 pt-4">
            <p class="font-semibold text-primary">Standar Prosedur Operasional Pemeliharaan:</p>
            <div class="space-y-2 text-xs text-on-surface-variant">
                <div class="p-2.5 bg-surface-container-low rounded border border-outline-variant/20">
                    <p class="font-semibold text-on-surface mb-1">A. Servis Rutin Kelipatan 250 Jam (HM)</p>
                    <p>Setiap unit wajib dilaporkan Hour Meter-nya oleh operator lapangan. Pada kelipatan 250, 500, dan 1000 jam operasional, wajib dijadwalkan ganti oli mesin dan filter udara.</p>
                </div>
                <div class="p-2.5 bg-surface-container-low rounded border border-outline-variant/20">
                    <p class="font-semibold text-on-surface mb-1">B. Inspeksi Keselamatan Kritis</p>
                    <p>Meliputi pengecekan rem, lampu kerja, kebocoran sistem hidrolik, dan ketebalan track link/roda karet sebelum unit dikirim ke lokasi proyek client.</p>
                </div>
                <div class="p-2.5 bg-surface-container-low rounded border border-outline-variant/20">
                    <p class="font-semibold text-on-surface mb-1">C. Pelaporan Selesai Pekerjaan</p>
                    <p>Setelah teknisi menyelesaikan tugas perawatan, status wajib diubah menjadi "Completed" disertai penginputan total biaya riil suku cadang.</p>
                </div>
            </div>
        </div>
        <div class="mt-6 text-right">
            <button id="closeSopDocOk" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Saya Mengerti</button>
        </div>
    </div>
</div>

<!-- VIEW NOTES MODAL -->
<div id="maintDetailsModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <button onclick="document.getElementById('maintDetailsModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-4 pb-3 border-b border-outline-variant">
            <div class="bg-primary text-white p-2.5 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">info</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Detail Catatan Pemeliharaan</h3>
                <p id="maintDetailsSub" class="text-xs text-on-surface-variant font-mono">#CODE</p>
            </div>
        </div>
        <div class="space-y-4 font-body-md text-on-surface">
            <div>
                <span class="block text-xs font-bold text-primary uppercase tracking-wider">Unit Alat Berat</span>
                <p id="maintDetailsEquip" class="text-sm font-semibold"></p>
            </div>
            <div>
                <span class="block text-xs font-bold text-primary uppercase tracking-wider">Instruksi & Masalah Mekanis</span>
                <div id="maintDetailsNotes" class="bg-surface-container-low p-3 rounded border border-outline-variant/30 text-xs leading-relaxed whitespace-pre-wrap mt-1"></div>
            </div>
            <div class="pt-2 text-right">
                <button onclick="document.getElementById('maintDetailsModal').classList.add('hidden')" class="bg-primary text-white px-5 py-2.5 rounded font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Tutup Detail</button>
            </div>
        </div>
    </div>
</div>

<!-- COMPLETE TASK MODAL -->
<div id="completeMaintModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <button onclick="document.getElementById('completeMaintModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-4 pb-3 border-b border-outline-variant">
            <div class="bg-primary-container p-2.5 text-primary rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-white">check_circle</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Selesaikan Pemeliharaan</h3>
                <p id="completeMaintSub" class="text-xs text-on-surface-variant font-mono">#CODE</p>
            </div>
        </div>
        <form method="POST" action="index.php?page=maintenance" class="space-y-4 font-body-md text-on-surface">
            <input type="hidden" name="action" value="complete">
            <input type="hidden" id="complete_maint_id" name="maintenance_id">
            <div>
                <span class="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Unit Alat Berat</span>
                <p id="completeMaintEquip" class="text-sm font-bold text-slate-800 bg-surface-container-low px-3 py-2 rounded"></p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Hour Meter Akhir (HM) *</label>
                    <input type="number" id="complete_maint_hm" name="hour_meter" required min="0" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm font-semibold">
                </div>
                <div>
                    <label class="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Total Biaya Riil (IDR) *</label>
                    <input type="number" id="complete_maint_cost" name="cost" required min="0" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm font-semibold">
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Catatan Mekanis Tambahan / Suku Cadang diganti</label>
                <textarea id="complete_maint_notes" name="notes" rows="3" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-xs" placeholder="Contoh: Mengganti filter oli, melumasi pin swing arm, semua aman..."></textarea>
            </div>
            <div class="pt-4 flex justify-end gap-3 border-t border-outline-variant">
                <button type="button" onclick="document.getElementById('completeMaintModal').classList.add('hidden')" class="px-4 py-2 border border-outline-variant rounded font-semibold text-xs text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">Batal</button>
                <button type="submit" class="bg-primary text-white px-5 py-2 rounded font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Simpan & Selesaikan</button>
            </div>
        </form>
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

        // --- NEW MAINTENANCE MODAL INTERACTIONS ---
        const addMaintBtn = document.getElementById('addMaintenanceBtn');
        const addMaintModal = document.getElementById('addMaintenanceModal');
        const closeAddMaintCross = document.getElementById('closeAddMaintCross');
        const closeAddMaintBtn = document.getElementById('closeAddMaintBtn');

        if (addMaintBtn && addMaintModal) {
            addMaintBtn.addEventListener('click', () => {
                addMaintModal.classList.remove('hidden');
            });
        }
        [closeAddMaintCross, closeAddMaintBtn].forEach(el => {
            if (el && addMaintModal) {
                el.addEventListener('click', () => {
                    addMaintModal.classList.add('hidden');
                });
            }
        });

        // --- NEW SOP DOCUMENTATION MODAL INTERACTIONS ---
        const sopDocBtn = document.getElementById('sopDocBtn');
        const sopDocModal = document.getElementById('sopDocModal');
        const closeSopDocCross = document.getElementById('closeSopDocCross');
        const closeSopDocOk = document.getElementById('closeSopDocOk');

        if (sopDocBtn && sopDocModal) {
            sopDocBtn.addEventListener('click', () => {
                sopDocModal.classList.remove('hidden');
            });
        }
        [closeSopDocCross, closeSopDocOk].forEach(el => {
            if (el && sopDocModal) {
                el.addEventListener('click', () => {
                    sopDocModal.classList.add('hidden');
                });
            }
        });

        // --- ROW DROPDOWNS INTERACTIONS ---
        const dropdownBtns = document.querySelectorAll('.maint-dropdown-btn');
        dropdownBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const targetMenu = document.getElementById(`maintDropdown-${id}`);
                
                // Close all other menus
                document.querySelectorAll('.maint-dropdown-menu').forEach(m => {
                    if (m !== targetMenu) m.classList.add('hidden');
                });
                
                if (targetMenu) targetMenu.classList.toggle('hidden');
            });
        });

        // Close on clicking outside
        document.addEventListener('click', (e) => {
            if (profileMenu && !profileBtn.contains(e.target)) profileMenu.classList.add('hidden');
            if (notiMenu && !notiBtn.contains(e.target)) notiMenu.classList.add('hidden');
            document.querySelectorAll('.maint-dropdown-menu').forEach(m => m.classList.add('hidden'));

            if (window.innerWidth < 1024 && sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex');
            }
        });
    });

    // Premium Modal view for Maintenance Notes
    function showMaintDetails(code, equipment, notes) {
        document.getElementById('maintDetailsSub').textContent = '#' + code;
        document.getElementById('maintDetailsEquip').textContent = equipment;
        document.getElementById('maintDetailsNotes').textContent = notes;
        document.getElementById('maintDetailsModal').classList.remove('hidden');
    }

    // Interactive Complete Task Modal
    function openCompleteMaintModal(id, code, equipName, currentHm, cost, notes) {
        document.getElementById('complete_maint_id').value = id;
        document.getElementById('completeMaintSub').textContent = '#' + code;
        document.getElementById('completeMaintEquip').textContent = equipName;
        document.getElementById('complete_maint_hm').value = currentHm;
        document.getElementById('complete_maint_cost').value = cost;
        document.getElementById('complete_maint_notes').value = notes;
        document.getElementById('completeMaintModal').classList.remove('hidden');
    }

    // High fidelity PDF Report Generator
    function exportMaintenancePDF() {
        const printWindow = window.open('', '_blank');
        
        let tableRows = '';
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            if (row.cells.length < 6) return;
            
            const code = row.cells[0].innerText.trim();
            
            // Equipment Name and SN
            const equipDiv = row.cells[1].querySelector('div div');
            const equipName = equipDiv ? equipDiv.querySelector('p').innerText.trim() : '';
            const equipCode = equipDiv ? equipDiv.querySelectorAll('p')[1].innerText.trim() : '';
            
            // Service Type and notes
            const typeDiv = row.cells[2];
            const serviceType = typeDiv ? typeDiv.querySelector('p').innerText.trim() : '';
            const serviceDesc = typeDiv ? typeDiv.querySelectorAll('p')[1].innerText.trim() : '';
            
            const date = row.cells[3].innerText.trim();
            const technician = row.cells[4].innerText.trim();
            const status = row.cells[5].innerText.trim();
            
            tableRows += `
                <tr>
                    <td class="code">${code}</td>
                    <td>
                        <strong>${equipName}</strong><br/>
                        <span class="sn">${equipCode}</span>
                    </td>
                    <td>
                        <strong>${serviceType}</strong><br/>
                        <span class="desc">${serviceDesc}</span>
                    </td>
                    <td class="date">${date}</td>
                    <td>${technician}</td>
                    <td class="status-col"><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
                </tr>
            `;
        });
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Laporan Pemeliharaan Alat Berat SBS - PDF Export</title>
                <style>
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        color: #1e293b;
                        margin: 40px;
                        font-size: 12px;
                        line-height: 1.5;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 2px solid #003366;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .company-logo {
                        font-size: 24px;
                        font-weight: 800;
                        color: #003366;
                        letter-spacing: -0.5px;
                        margin: 0;
                    }
                    .company-sub {
                        font-size: 9px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: #64748b;
                        font-weight: bold;
                        margin-top: 2px;
                    }
                    .company-details {
                        text-align: right;
                        font-size: 10px;
                        color: #64748b;
                    }
                    h1 {
                        font-size: 18px;
                        color: #003366;
                        margin: 0 0 10px 0;
                        font-weight: 700;
                        text-transform: uppercase;
                    }
                    .meta-info {
                        margin-bottom: 20px;
                        font-size: 10px;
                        color: #64748b;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    th {
                        background-color: #f1f5f9;
                        color: #003366;
                        font-weight: bold;
                        text-transform: uppercase;
                        font-size: 10px;
                        padding: 10px;
                        border-bottom: 2px solid #cbd5e1;
                        text-align: left;
                    }
                    td {
                        padding: 12px 10px;
                        border-bottom: 1px solid #e2e8f0;
                        vertical-align: top;
                    }
                    .code {
                        font-family: monospace;
                        font-weight: bold;
                        color: #0f172a;
                    }
                    .sn, .desc {
                        font-size: 10px;
                        color: #64748b;
                    }
                    .date {
                        font-family: monospace;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 3px 8px;
                        border-radius: 9999px;
                        font-size: 9px;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .status-completed {
                        background-color: #d1fae5;
                        color: #065f46;
                    }
                    .status-in_progress {
                        background-color: #d5e3fc;
                        color: #001e40;
                    }
                    .status-urgent, .status-scheduled {
                        background-color: #fef3c7;
                        color: #92400e;
                    }
                    .status-cancelled {
                        background-color: #fee2e2;
                        color: #991b1b;
                    }
                    .footer {
                        margin-top: 50px;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 15px;
                        font-size: 9px;
                        color: #94a3b8;
                        text-align: center;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h2 class="company-logo">PT. SURYA BANGUN SARANA</h2>
                        <div class="company-sub">Banjarmasin Branch office</div>
                    </div>
                    <div class="company-details">
                        Jl. Liang Anggang Km 21, Banjarmasin, Kalimantan Selatan<br/>
                        Hotline: 0821-4856-4979 | Email: info@suryabangunsarana.co.id
                    </div>
                </div>
                
                <h1>Laporan Pemeliharaan & Servis Unit</h1>
                <div class="meta-info">
                    Dicetak Oleh: Staf Operasional SBS (${new Date().toLocaleString('id-ID')})<br/>
                    Status Dokumen: Dokumen Operasional Resmi PT. SBS Banjarmasin
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th style="width: 15%;">ID Maint</th>
                            <th style="width: 25%;">Unit Alat Berat</th>
                            <th style="width: 25%;">Tipe Servis</th>
                            <th style="width: 12%;">Tanggal</th>
                            <th style="width: 13%;">Teknisi</th>
                            <th style="width: 10%;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                
                <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                    <div style="width: 200px; text-align: center;">
                        <p style="font-size: 10px; color: #64748b; margin-bottom: 60px;">Mekanik & Teknisi SBS</p>
                        <p style="font-weight: bold; border-bottom: 1px solid #94a3b8; padding-bottom: 5px;"></p>
                        <p style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Tanda Tangan & Nama Terang</p>
                    </div>
                    <div style="width: 200px; text-align: center;">
                        <p style="font-size: 10px; color: #64748b; margin-bottom: 60px;">Supervisi Operasional SBS</p>
                        <p style="font-weight: bold; border-bottom: 1px solid #94a3b8; padding-bottom: 5px;">Alex Staff</p>
                        <p style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Operations Staff</p>
                    </div>
                </div>
                
                <div class="footer">
                    Dokumen ini digenerate secara otomatis melalui EquipRent MS - Sistem Monitoring Alat Berat PT. SBS Banjarmasin.
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    // Search bar focus effect
    const searchInput = document.querySelector('input[name="search"]');
    if(searchInput) {
        searchInput.addEventListener('focus', () => {
            searchInput.parentElement.classList.add('ring-2', 'ring-primary');
        });
        searchInput.addEventListener('blur', () => {
            searchInput.parentElement.classList.remove('ring-2', 'ring-primary');
        });
    }

    // Atmosphere - Subtle dot pattern background for the body
    document.body.style.backgroundImage = `radial-gradient(#cbd5e1 0.8px, transparent 0.8px)`;
    document.body.style.backgroundSize = `24px 24px`;
</script>
</body>
</html>
