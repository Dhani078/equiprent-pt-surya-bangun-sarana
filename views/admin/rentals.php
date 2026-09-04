<?php
/**
 * ============================================================================
 * VIEW: views/admin/rentals.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Halaman Manajemen Rental Orders & Data Sewa Pelanggan.
 * Mengintegrasikan Bento Layout premium dengan pencarian interaktif,
 * filtering status real-time, dan status penyewaan dinamis dari database.
 * 
 * INTEGRITAS VISUAL MUTLAK (100% REPLIKASI DOM DARI PROTOTIPE ASLI STITCH):
 * - Menggunakan Hanken Grotesk (UI) & JetBrains Mono (Data Log)
 * - Sidebar Navigation 6 Menu utama dari sistem (Dashboard, Inventory, dll.)
 * - Bento Quick Stats yang menampilkan metrik riil (Active, Due, Overdue)
 * - Daftar transaksi rental dinamis dengan navigasi terintegrasi.
 */

$fullName = $_SESSION['full_name'] ?? 'Alex Rivera';
$role = $_SESSION['role'] ?? 'Fleet Manager';
$currentPage = 'rentals'; // Menjadikan Rental Orders aktif di menu sidebar

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

function getStatusBadge($status) {
    switch ($status) {
        case 'PENDING':
            return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
        case 'APPROVED':
            return 'bg-teal-100 text-teal-800 border border-teal-300';
        case 'ON_GOING':
            return 'bg-blue-100 text-blue-800 border border-blue-300';
        case 'COMPLETED':
            return 'bg-green-100 text-green-800 border border-green-300';
        case 'REJECTED':
            return 'bg-red-100 text-red-800 border border-red-300';
        default:
            return 'bg-slate-100 text-slate-800 border border-slate-300';
    }
}

function getStatusLabel($status) {
    switch ($status) {
        case 'PENDING':
            return 'Pending';
        case 'APPROVED':
            return 'Disetujui';
        case 'ON_GOING':
            return 'Aktif';
        case 'COMPLETED':
            return 'Selesai';
        case 'REJECTED':
            return 'Ditolak';
        default:
            return $status;
    }
}
?>
<!DOCTYPE html>
<html class="light" lang="id">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>Rental Management - EquipRent MS</title>
    
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
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    </style>
</head>
<body class="bg-background text-on-surface flex min-h-screen">

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
    <main class="ml-0 lg:ml-[260px] flex-1 flex flex-col min-w-0 min-h-screen">
        <!-- TopAppBar Component -->
        <header class="fixed top-0 right-0 z-40 h-16 w-full lg:w-[calc(100%-260px)] bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-container-padding">
            <div class="flex items-center flex-1 max-w-xl gap-3">
                <button id="sidebarToggleBtn" class="lg:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined">menu</span>
                </button>
                <form action="index.php" method="GET" class="relative w-full group">
                    <input type="hidden" name="page" value="rentals">
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

        <!-- Main Workspace -->
        <div class="p-container-padding space-y-8 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="font-headline-md text-headline-md text-primary tracking-tight font-bold">Rental Orders Management</h2>
                    <p class="font-body-md text-body-md text-on-surface-variant mt-1">Oversee current equipment leases, returns, and contract compliance.</p>
                </div>
                <button id="openCreateRentalBtn" class="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-body-md font-semibold flex items-center gap-2 shadow-md active:scale-95 transition-all hover:bg-opacity-95">
                    <span class="material-symbols-outlined text-[20px]">add</span>
                    Create New Rental
                </button>
            </div>

            <!-- Dashboard Quick Stats (Asymmetric Layout) -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <!-- 1. Active Rentals -->
                <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col justify-between shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined">pending_actions</span>
                        </div>
                        <span class="text-green-600 font-label-caps font-bold">+12%</span>
                    </div>
                    <div class="mt-4">
                        <p class="font-label-caps text-on-surface-variant">TOTAL ACTIVE</p>
                        <p class="font-display-lg text-display-lg text-primary font-bold"><?= $stats['active'] ?></p>
                    </div>
                </div>

                <!-- 2. Due Today -->
                <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col justify-between shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="w-12 h-12 bg-secondary-fixed rounded-lg flex items-center justify-center text-secondary">
                            <span class="material-symbols-outlined">event_available</span>
                        </div>
                        <span class="text-secondary font-label-caps">Stable</span>
                    </div>
                    <div class="mt-4">
                        <p class="font-label-caps text-on-surface-variant">DUE TODAY</p>
                        <p class="font-display-lg text-display-lg text-primary font-bold"><?= $stats['due_today'] ?></p>
                    </div>
                </div>

                <!-- 3. Overdue Returns (md:col-span-2) -->
                <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col justify-between md:col-span-2 relative overflow-hidden group shadow-sm">
                    <div class="absolute right-[-20px] top-[-20px] opacity-5 group-hover:opacity-10 transition-opacity">
                        <span class="material-symbols-outlined text-[180px]">warning</span>
                    </div>
                    <div class="flex justify-between items-start relative z-10">
                        <div class="w-12 h-12 bg-error-container rounded-lg flex items-center justify-center text-error">
                            <span class="material-symbols-outlined">report_problem</span>
                        </div>
                        <span class="bg-error text-on-error px-2 py-1 rounded font-label-caps text-[10px]">CRITICAL</span>
                    </div>
                    <div class="mt-4 relative z-10">
                        <p class="font-label-caps text-on-surface-variant">OVERDUE RETURNS</p>
                        <p class="font-display-lg text-display-lg text-error font-bold"><?= sprintf('%02d', $stats['overdue']) ?></p>
                    </div>
                </div>
            </div>

            <!-- Table Filter Bar (Dynamic Interactive Forms) -->
            <form method="GET" action="index.php" class="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                <input type="hidden" name="page" value="rentals">
                
                <div class="flex flex-wrap items-center gap-4">
                    <!-- Search input inside filters -->
                    <div class="relative w-64">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                        <input name="search" value="<?= htmlspecialchars($search) ?>" class="pl-10 pr-4 py-1.5 w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="Search orders..." type="text">
                    </div>

                    <!-- Status Dropdown -->
                    <div class="flex items-center bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 hover:bg-surface-container-high transition-colors relative">
                        <span class="material-symbols-outlined text-[18px] mr-2">filter_list</span>
                        <select name="status" onchange="this.form.submit()" class="bg-transparent border-none p-0 pr-6 text-body-md focus:ring-0 focus:outline-none cursor-pointer appearance-none">
                            <option value="ALL" <?= $status === 'ALL' ? 'selected' : '' ?>>Semua Status</option>
                            <option value="PENDING" <?= $status === 'PENDING' ? 'selected' : '' ?>>Pending</option>
                            <option value="APPROVED" <?= $status === 'APPROVED' ? 'selected' : '' ?>>Approved</option>
                            <option value="ON_GOING" <?= $status === 'ON_GOING' ? 'selected' : '' ?>>Aktif (On Going)</option>
                            <option value="COMPLETED" <?= $status === 'COMPLETED' ? 'selected' : '' ?>>Selesai</option>
                            <option value="REJECTED" <?= $status === 'REJECTED' ? 'selected' : '' ?>>Ditolak</option>
                        </select>
                        <span class="material-symbols-outlined text-[18px] absolute right-2 pointer-events-none text-on-surface-variant">expand_more</span>
                    </div>

                    <!-- Date Range Inputs -->
                    <div class="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5">
                        <span class="material-symbols-outlined text-[18px] text-on-surface-variant">calendar_today</span>
                        <input type="date" name="start_date" value="<?= htmlspecialchars($startDate) ?>" onchange="this.form.submit()" class="bg-transparent border-none p-0 text-xs font-mono focus:ring-0 focus:outline-none">
                        <span class="text-xs text-outline">-</span>
                        <input type="date" name="end_date" value="<?= htmlspecialchars($endDate) ?>" onchange="this.form.submit()" class="bg-transparent border-none p-0 text-xs font-mono focus:ring-0 focus:outline-none">
                    </div>
                </div>

                <div class="flex items-center gap-2 text-on-surface-variant font-body-md ml-auto">
                    <span>Export:</span>
                    <a href="index.php?page=export_rentals_pdf" target="_blank" class="p-2 hover:bg-surface-container-high rounded transition-colors" title="Export as PDF">
                        <span class="material-symbols-outlined">picture_as_pdf</span>
                    </a>
                    <a href="index.php?page=export_rentals_excel" class="p-2 hover:bg-surface-container-high rounded transition-colors" title="Export as Excel">
                        <span class="material-symbols-outlined">table_chart</span>
                    </a>
                </div>
            </form>

            <!-- Rental Table Container -->
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm flex-1">
                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-surface-container-low border-b border-outline-variant">
                                <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">ID Rental</th>
                                <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Customer</th>
                                <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Equipment</th>
                                <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Rental Period</th>
                                <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
                                <th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-outline-variant/30">
                            <?php if (empty($rentals)): ?>
                                <tr>
                                    <td colspan="6" class="px-6 py-12 text-center text-on-surface-variant opacity-75 font-body-lg">
                                        <span class="material-symbols-outlined text-[48px] mb-2 opacity-50 block">receipt_long</span>
                                        Tidak ada transaksi sewa yang sesuai dengan filter filter aktif.
                                    </td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($rentals as $rental): 
                                    // Generate initials for avatar circle
                                    $initials = '';
                                    $names = explode(' ', $rental['customer_name']);
                                    foreach ($names as $n) {
                                        $initials .= strtoupper(substr($n, 0, 1));
                                    }
                                    $initials = substr($initials, 0, 2);

                                    // High-fidelity image mapping based on equipment code
                                    $code = strtoupper($rental['equipment_code']);
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

                                    // Check if rental is overdue
                                    $isOverdue = ($rental['status'] === 'ON_GOING' && strtotime($rental['end_date']) < strtotime(date('Y-m-d')));
                                ?>
                                    <tr class="hover:bg-surface-container-low transition-colors group <?= $isOverdue ? 'bg-red-50/30' : '' ?>">
                                        <td class="px-6 py-4">
                                            <span class="font-label-caps text-primary bg-primary-fixed px-2.5 py-1 rounded text-[11px] font-bold">#<?= htmlspecialchars($rental['rental_code']) ?></span>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-3">
                                                <div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-[12px] font-bold text-primary font-mono"><?= $initials ?></div>
                                                <div>
                                                    <p class="font-body-md text-body-md font-semibold text-primary"><?= htmlspecialchars($rental['customer_name']) ?></p>
                                                    <p class="font-label-caps text-[10px] text-on-surface-variant font-semibold"><?= htmlspecialchars($rental['customer_company'] ?? 'SBS Customer') ?></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-3">
                                                <div class="w-10 h-10 rounded border border-outline-variant bg-white p-1 overflow-hidden">
                                                    <img alt="<?= htmlspecialchars($rental['equipment_name']) ?>" class="w-full h-full object-cover" src="<?= $imgUrl ?>">
                                                </div>
                                                <div>
                                                    <p class="font-body-md text-body-md font-bold text-primary leading-tight"><?= htmlspecialchars($rental['equipment_name']) ?></p>
                                                    <p class="font-label-caps text-[10px] text-on-surface-variant font-mono">SN: <?= htmlspecialchars($rental['equipment_code']) ?></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="font-body-md text-body-md text-on-surface-variant font-mono">
                                                <div class="flex items-center gap-2">
                                                    <span class="material-symbols-outlined text-[16px] text-primary">login</span>
                                                    <span class="font-semibold text-primary"><?= date('d M Y', strtotime($rental['start_date'])) ?></span>
                                                </div>
                                                <div class="flex items-center gap-2 mt-1 <?= $isOverdue ? 'text-error font-bold' : '' ?>">
                                                    <span class="material-symbols-outlined text-[16px] <?= $isOverdue ? 'text-error animate-pulse' : 'text-primary' ?>">logout</span>
                                                    <span><?= date('d M Y', strtotime($rental['end_date'])) ?><?= $isOverdue ? ' (Due)' : '' ?></span>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <?php if ($isOverdue): ?>
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 animate-pulse border border-red-300">
                                                    <span class="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5"></span>
                                                    Terlambat
                                                </span>
                                            <?php else: ?>
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold <?= getStatusBadge($rental['status']) ?>">
                                                    <span class="w-1.5 h-1.5 rounded-full mr-1.5" style="background-color: currentColor;"></span>
                                                    <?= getStatusLabel($rental['status']) ?>
                                                </span>
                                            <?php endif; ?>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <?php if ($rental['status'] === 'ON_GOING'): ?>
                                                    <!-- Dynamic link connecting rental actively to the live Leaflet map -->
                                                    <a href="index.php?page=tracking&focus=<?= $rental['equipment_id'] ?>" class="p-2 hover:bg-primary-fixed rounded-lg text-primary transition-colors" title="Lacak Lokasi GPS Real-time">
                                                        <span class="material-symbols-outlined text-[20px]">explore</span>
                                                    </a>
                                                <?php endif; ?>
                                                
                                                <?php if ($rental['status'] === 'PENDING'): ?>
                                                    <a href="index.php?page=rentals&action=approve&id=<?= $rental['id'] ?>" class="p-2 hover:bg-green-100 rounded-lg text-green-700 transition-colors" title="Setujui Rental" onclick="return confirm('Apakah Anda yakin ingin menyetujui order sewa ini?')">
                                                        <span class="material-symbols-outlined text-[20px]">done</span>
                                                    </a>
                                                    <a href="index.php?page=rentals&action=reject&id=<?= $rental['id'] ?>" class="p-2 hover:bg-red-100 rounded-lg text-red-700 transition-colors" title="Tolak Rental" onclick="return confirm('Apakah Anda yakin ingin menolak order sewa ini?')">
                                                        <span class="material-symbols-outlined text-[20px]">close</span>
                                                    </a>
                                                <?php elseif ($rental['status'] === 'APPROVED'): ?>
                                                    <a href="index.php?page=rentals&action=complete&id=<?= $rental['id'] ?>" class="p-2 hover:bg-blue-100 rounded-lg text-blue-700 transition-colors" title="Selesaikan Rental" onclick="return confirm('Apakah Anda yakin ingin menandai rental ini selesai?')">
                                                        <span class="material-symbols-outlined text-[20px]">task_alt</span>
                                                    </a>
                                                <?php endif; ?>

                                                <a href="index.php?page=contracts" class="p-2 hover:bg-surface-container-high rounded-lg text-primary transition-colors" title="Detail Kontrak">
                                                    <span class="material-symbols-outlined text-[20px]">description</span>
                                                </a>
                                                <a href="index.php?page=rentals&action=delete&id=<?= $rental['id'] ?>" onclick="return confirm('Apakah Anda yakin ingin menghapus data rental order ini?')" class="p-2 hover:bg-error-container rounded-lg text-error transition-colors" title="Hapus">
                                                    <span class="material-symbols-outlined text-[20px]">delete</span>
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <!-- Table Footer / Pagination -->
                <div class="px-6 py-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
                    <p class="font-body-md text-body-md text-on-surface-variant">Showing <span class="font-semibold text-primary"><?= count($rentals) > 0 ? 1 : 0 ?>-<?= count($rentals) ?></span> of <span class="font-semibold"><?= count($rentals) ?></span> records</p>
                    <div class="flex items-center gap-2">
                        <button class="p-2 hover:bg-surface-container-low rounded-lg transition-colors border border-outline-variant disabled:opacity-30" disabled="">
                            <span class="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button class="w-10 h-10 bg-primary text-on-primary rounded-lg font-body-md font-semibold">1</button>
                        <button class="p-2 hover:bg-surface-container-low rounded-lg transition-colors border border-outline-variant disabled:opacity-30" disabled="">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Contextual Help / Status Legend (Glassmorphism subtle) -->
            <div class="bg-surface-container-lowest/60 backdrop-blur-sm p-6 rounded-xl border border-outline-variant flex flex-col md:flex-row gap-6 items-center">
                <div class="flex items-center gap-2 shrink-0">
                    <span class="material-symbols-outlined text-primary">info</span>
                    <h3 class="font-headline-sm text-[16px] font-bold text-primary">Quick Status Guide:</h3>
                </div>
                <div class="flex flex-wrap gap-4">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full bg-blue-600"></span>
                        <span class="font-body-md text-body-md text-on-surface-variant"><span class="font-semibold">Aktif (On Going):</span> Sedang disewa dan berada di bawah kendali customer.</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full bg-green-600"></span>
                        <span class="font-body-md text-body-md text-on-surface-variant"><span class="font-semibold">Selesai:</span> Unit dikembalikan, diinspeksi, dan transaksi selesai.</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full bg-red-600"></span>
                        <span class="font-body-md text-body-md text-on-surface-variant"><span class="font-semibold">Terlambat:</span> Melewati tenggat waktu pengembalian tanpa persetujuan perpanjangan.</span>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Create New Rental Modal Dialog -->
    <div id="createRentalModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in">
            <button id="closeCreateRentalCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-6">
                <div class="bg-primary p-2.5 rounded-lg text-white flex items-center justify-center">
                    <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">add_circle</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Buat Rental Order Baru</h3>
                    <p class="text-xs text-on-surface-variant font-semibold">PT. SURYA BANGUN SARANA BANJARMASIN</p>
                </div>
            </div>
            
            <form action="index.php?page=rentals" method="POST" class="space-y-4">
                <input type="hidden" name="action" value="add">
                
                <div>
                    <label class="block text-sm font-semibold text-primary mb-1">Pilih Customer *</label>
                    <select name="customer_id" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                        <option value="">-- Pilih Customer --</option>
                        <?php foreach ($customersList as $cust): ?>
                            <option value="<?= $cust['id'] ?>"><?= htmlspecialchars($cust['full_name']) ?> (<?= htmlspecialchars($cust['company_name'] ?: 'Individu') ?>)</option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-primary mb-1">Pilih Alat Berat (Tersedia) *</label>
                    <select name="equipment_id" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                        <option value="">-- Pilih Alat Berat --</option>
                        <?php foreach ($equipmentsList as $equip): ?>
                            <option value="<?= $equip['id'] ?>"><?= htmlspecialchars($equip['name']) ?> - SN: <?= htmlspecialchars($equip['equipment_code']) ?> (Rp <?= number_format($equip['rental_price_per_day'], 0, ',', '.') ?>/Hari)</option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Tanggal Mulai *</label>
                        <input type="date" name="start_date" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-primary mb-1">Tanggal Selesai *</label>
                        <input type="date" name="end_date" required class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-primary mb-1">Catatan Tambahan</label>
                    <textarea name="notes" placeholder="Catatan khusus, lokasi pengiriman unit..." rows="3" class="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:border-primary text-body-md text-on-surface"></textarea>
                </div>

                <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-outline-variant">
                    <button type="button" id="closeCreateRentalCancel" class="px-5 py-2.5 rounded-lg border border-outline-variant text-primary font-semibold hover:bg-surface-container-low transition-colors text-body-md">Batal</button>
                    <button type="submit" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Buat Rental Order</button>
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
                <ul class="list-disc list-inside space-y-1 text-on-surface-variant pl-2 font-semibold">
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

            // Create Rental modal elements
            const openCreateRentalBtn = document.getElementById('openCreateRentalBtn');
            const createRentalModal = document.getElementById('createRentalModal');
            const closeCreateRentalCross = document.getElementById('closeCreateRentalCross');
            const closeCreateRentalCancel = document.getElementById('closeCreateRentalCancel');

            // Mobile Sidebar Toggle
            if (toggleBtn && sidebar) {
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sidebar.classList.toggle('hidden');
                    sidebar.classList.toggle('flex');
                });
            }

            if (openCreateRentalBtn && createRentalModal) {
                openCreateRentalBtn.addEventListener('click', () => {
                    createRentalModal.classList.remove('hidden');
                });
            }

            if (closeCreateRentalCross && createRentalModal) {
                closeCreateRentalCross.addEventListener('click', () => {
                    createRentalModal.classList.add('hidden');
                });
            }

            if (closeCreateRentalCancel && createRentalModal) {
                closeCreateRentalCancel.addEventListener('click', () => {
                    createRentalModal.classList.add('hidden');
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
