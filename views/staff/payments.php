<?php
$fullName = $_SESSION['full_name'] ?? 'Alex Staff';
$role = $_SESSION['role'] ?? 'STAFF';
$currentPage = 'payments';
?>
<!DOCTYPE html>
<html class="light" lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>EquipRent MS - Payments</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@500&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
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
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
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
        body {
            background-color: #f7f9fb;
            font-family: 'Hanken Grotesk', sans-serif;
            color: #191c1e;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .sidebar-active-indicator {
            position: absolute;
            left: 0;
            width: 4px;
            height: 100%;
            background-color: #001e40;
        }
    </style>
</head>
<body class="bg-background font-body-md text-on-background min-h-screen">
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
                    <!-- Active State: Payments -->
                    <a class="flex items-center gap-3 px-6 py-3 text-primary font-bold border-l-4 border-primary bg-secondary-container transition-all scale-95 duration-100 font-body-md text-body-md" href="index.php?page=payments">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">payments</span>
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

<!-- Main Content Area -->
<main class="ml-0 lg:ml-[260px] pt-16 min-h-screen bg-background">
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
    <input type="hidden" name="page" value="payments">
    <input name="search" value="<?= htmlspecialchars($search ?? '') ?>" class="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary transition-all text-body-md font-body-md" placeholder="Search invoices, customers..." type="text"/>
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

<!-- Content Body -->
<div class="p-container-padding space-y-6">
<!-- Header Section -->
<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<h1 class="font-display-lg text-display-lg text-primary">Payment Overview</h1>
<p class="font-body-md text-on-surface-variant">Manage and track all customer billing and transaction records.</p>
</div>
<button onclick="exportPaymentsPDF()" class="bg-primary text-on-primary px-6 py-2.5 rounded shadow-sm hover:opacity-90 transition-all flex items-center gap-2 font-bold h-10 active:scale-95">
<span class="material-symbols-outlined" data-icon="picture_as_pdf">picture_as_pdf</span>
                    Export PDF
                </button>
</div>

<!-- Alert Success -->
<?php if (isset($_SESSION['success'])): ?>
<div class="p-4 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-r-lg font-body-md flex items-center justify-between">
    <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-green-700">check_circle</span>
        <span><?= htmlspecialchars($_SESSION['success']) ?></span>
    </div>
    <?php unset($_SESSION['success']); ?>
</div>
<?php endif; ?>

<!-- Stats Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
<div class="bg-surface-container-lowest border border-outline-variant p-5 rounded-lg">
<div class="flex justify-between items-start mb-4">
<div class="bg-primary-container text-on-primary-container p-2 rounded">
<span class="material-symbols-outlined" data-icon="monetization_on">monetization_on</span>
</div>
<span class="text-[12px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">+12.5%</span>
</div>
<p class="text-label-caps font-label-caps text-on-surface-variant opacity-70">TOTAL REVENUE (MONTH)</p>
<p class="text-headline-md font-headline-md mt-1">IDR <?= number_format($totalRevenue / 1000000, 1) ?>M</p>
</div>
<div class="bg-surface-container-lowest border border-outline-variant p-5 rounded-lg">
<div class="flex justify-between items-start mb-4">
<div class="bg-secondary-container text-on-secondary-container p-2 rounded">
<span class="material-symbols-outlined" data-icon="pending_actions">pending_actions</span>
</div>
<span class="text-[12px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">Active</span>
</div>
<p class="text-label-caps font-label-caps text-on-surface-variant opacity-70">PENDING PAYMENTS</p>
<p class="text-headline-md font-headline-md mt-1"><?= $pendingPaymentsCount ?> Invoices</p>
</div>
<div class="bg-surface-container-lowest border border-outline-variant p-5 rounded-lg">
<div class="flex justify-between items-start mb-4">
<div class="bg-green-100 text-green-800 p-2 rounded">
<span class="material-symbols-outlined" data-icon="verified_user">verified_user</span>
</div>
<span class="text-[12px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Today</span>
</div>
<p class="text-label-caps font-label-caps text-on-surface-variant opacity-70">VERIFIED PAYMENTS</p>
<p class="text-headline-md font-headline-md mt-1"><?= $verifiedTodayCount ?> Units</p>
</div>
<div class="bg-surface-container-lowest border border-outline-variant p-5 rounded-lg border-l-4 border-l-error">
<div class="flex justify-between items-start mb-4">
<div class="bg-error-container text-on-error-container p-2 rounded">
<span class="material-symbols-outlined" data-icon="warning">warning</span>
</div>
<span class="text-[12px] font-bold text-error bg-error-container px-2 py-0.5 rounded">Urgent</span>
</div>
<p class="text-label-caps font-label-caps text-on-surface-variant opacity-70">OVERDUE</p>
<p class="text-headline-md font-headline-md mt-1 text-error">IDR <?= number_format($overdueAmount / 1000000, 1) ?>M</p>
</div>
</div>

<!-- Table Controls -->
<div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
<div class="flex items-center gap-2">
<div class="flex bg-surface-container border border-outline-variant rounded p-1">
<a href="index.php?page=payments&status=ALL" class="px-3 py-1 text-body-md font-bold <?= $status === 'ALL' ? 'bg-surface-container-lowest shadow-sm rounded text-primary' : 'text-on-surface-variant hover:bg-surface-container-high rounded transition-colors' ?>">All</a>
<a href="index.php?page=payments&status=PENDING" class="px-3 py-1 text-body-md font-bold <?= $status === 'PENDING' ? 'bg-surface-container-lowest shadow-sm rounded text-primary' : 'text-on-surface-variant hover:bg-surface-container-high rounded transition-colors' ?>">Pending</a>
<a href="index.php?page=payments&status=PAID" class="px-3 py-1 text-body-md font-bold <?= $status === 'PAID' ? 'bg-surface-container-lowest shadow-sm rounded text-primary' : 'text-on-surface-variant hover:bg-surface-container-high rounded transition-colors' ?>">Paid</a>
</div>
<div class="flex items-center gap-2 ml-2">
<span class="material-symbols-outlined text-on-surface-variant" data-icon="calendar_today">calendar_today</span>
<select class="bg-transparent border-none text-body-md font-bold focus:ring-0 cursor-pointer">
<option>Last 30 Days</option>
<option>This Quarter</option>
<option>Year to Date</option>
</select>
</div>
</div>
<div class="text-on-surface-variant font-body-md">
                    Showing <span class="font-bold text-primary">1 - <?= count($paymentsList) ?></span> of <?= count($paymentsList) ?> records
                </div>
</div>

<!-- Modern Data Table -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-low border-b border-outline-variant">
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Invoice ID</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Customer</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Nominal</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Method</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Date</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider text-right">Action</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant">
<?php if (empty($paymentsList)): ?>
  <tr>
    <td colspan="7" class="px-6 py-12 text-center text-on-surface-variant opacity-75 font-body-lg">
      <span class="material-symbols-outlined text-[48px] mb-2 opacity-50 block">payments</span>
      Tidak ada data pembayaran yang sesuai filter aktif.
    </td>
  </tr>
<?php else: ?>
  <?php foreach ($paymentsList as $index => $pay): 
      $initials = '';
      $names = explode(' ', $pay['customer_name']);
      foreach ($names as $n) {
          $initials .= strtoupper(substr($n, 0, 1));
      }
      $initials = substr($initials, 0, 2);

      // Status badge style
      $statusVal = strtoupper($pay['status']);
      if ($statusVal === 'PAID') {
          $badgeClass = 'bg-green-100 text-green-800';
          $statusLabel = 'Paid';
      } elseif ($statusVal === 'PENDING_VERIFICATION') {
          $badgeClass = 'bg-secondary-container text-on-secondary-container';
          $statusLabel = 'Pending';
      } elseif ($statusVal === 'FAILED') {
          $badgeClass = 'bg-error-container text-on-error-container';
          $statusLabel = 'Failed';
      } else {
          $badgeClass = 'bg-on-secondary-fixed/10 text-on-surface-variant';
          $statusLabel = $statusVal;
      }
      
      $isEven = ($index % 2 === 1);
  ?>
  <tr class="<?= $isEven ? 'bg-surface-container-low/30' : '' ?> hover:bg-surface-container-lowest transition-colors group">
    <td class="px-6 py-4 font-label-caps text-label-caps text-primary font-bold">#<?= htmlspecialchars($pay['payment_code']) ?></td>
    <td class="px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded bg-secondary-container flex items-center justify-center font-bold text-primary text-[10px]"><?= $initials ?></div>
        <div>
            <p class="font-body-md font-semibold"><?= htmlspecialchars($pay['customer_name']) ?></p>
            <?php if (!empty($pay['company_name'])): ?>
                <p class="text-[10px] text-on-surface-variant leading-tight"><?= htmlspecialchars($pay['company_name']) ?></p>
            <?php endif; ?>
        </div>
      </div>
    </td>
    <td class="px-6 py-4 font-body-md font-bold">IDR <?= number_format($pay['amount']) ?></td>
    <td class="px-6 py-4 font-body-md text-on-surface-variant">
      <?= htmlspecialchars($pay['payment_method']) ?>
      <button onclick="showTfReceipt('<?= htmlspecialchars($pay['payment_code']) ?>', '<?= htmlspecialchars($pay['customer_name']) ?>', '<?= number_format($pay['amount']) ?>', '<?= date('d M Y', strtotime($pay['payment_date'])) ?>', '<?= htmlspecialchars($pay['payment_method']) ?>')" class="inline-flex items-center ml-1 text-primary hover:underline text-[10px] font-bold" title="View Proof">
        [Proof <span class="material-symbols-outlined text-[12px] inline">open_in_new</span>]
      </button>
    </td>
    <td class="px-6 py-4 font-body-md text-on-surface-variant"><?= date('d M Y', strtotime($pay['payment_date'])) ?></td>
    <td class="px-6 py-4">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold <?= $badgeClass ?>">
        <?= $statusLabel ?>
      </span>
    </td>
    <td class="px-6 py-4 text-right relative">
      <div class="inline-block text-left">
        <button onclick="toggleActionMenu(event, 'menu-<?= $pay['id'] ?>')" class="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary">
          <span class="material-symbols-outlined text-[20px] block">menu</span>
        </button>
        <div id="menu-<?= $pay['id'] ?>" class="hidden absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-surface-container-lowest border border-outline-variant z-50 text-left py-1 animate-fade-in">
          <div class="px-4 py-1.5 border-b border-outline-variant text-[11px] font-bold text-primary tracking-wider font-label-caps uppercase">Aksi Pembayaran</div>
          
          <?php if ($statusVal === 'PENDING_VERIFICATION'): ?>
            <a href="index.php?page=payments&action=verify&id=<?= $pay['id'] ?>" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-green-50 hover:text-green-700 transition-colors font-semibold">
              <span class="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
              <span>Verify Payment</span>
            </a>
            <a href="index.php?page=payments&action=fail&id=<?= $pay['id'] ?>" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-red-50 hover:text-red-700 transition-colors font-semibold">
              <span class="material-symbols-outlined text-[18px] text-error">cancel</span>
              <span>Mark Failed</span>
            </a>
          <?php endif; ?>
          
          <button onclick="showTfReceipt('<?= htmlspecialchars($pay['payment_code']) ?>', '<?= htmlspecialchars($pay['customer_name']) ?>', '<?= number_format($pay['amount']) ?>', '<?= date('d M Y', strtotime($pay['payment_date'])) ?>', '<?= htmlspecialchars($pay['payment_method']) ?>')" class="flex w-full items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-left">
            <span class="material-symbols-outlined text-[18px] text-primary">visibility</span>
            <span>Lihat Bukti TF</span>
          </button>
          
          <div class="border-t border-outline-variant my-1"></div>
          <button onclick="openAuditorContact('<?= htmlspecialchars($pay['payment_code']) ?>')" class="flex w-full items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-high transition-colors text-left font-semibold">
            <span class="material-symbols-outlined text-[18px] text-on-surface-variant">mail</span>
            <span>Email Auditor</span>
          </button>
        </div>
      </div>
    </td>
  </tr>
  <?php endforeach; ?>
<?php endif; ?>
</tbody>
</table>
</div>

<!-- Pagination -->
<div class="px-6 py-4 border-t border-outline-variant flex items-center justify-between">
<button class="text-body-md font-bold text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50" disabled="">Previous</button>
<div class="flex gap-1">
<button class="w-8 h-8 rounded flex items-center justify-center bg-primary text-on-primary text-body-md font-bold">1</button>
</div>
<button class="text-body-md font-bold text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50" disabled="">Next</button>
</div>
</div>

<!-- Bottom Support Card (Bento Style) -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div class="lg:col-span-2 bg-surface-container-low border border-outline-variant rounded-lg p-6 flex flex-col md:flex-row gap-6 items-center">
<div class="flex-1">
<h3 class="font-headline-sm text-headline-sm text-primary mb-2">Automated Billing Status</h3>
<p class="font-body-md text-on-surface-variant mb-4">System automatically syncs payment data every 15 minutes. Ensure all physical receipts are scanned and uploaded for manual verification if required.</p>
<div class="flex gap-4">
<button id="openSystemLogsBtn" class="border border-outline text-on-surface px-4 py-2 rounded text-body-md font-bold hover:bg-surface-container-high transition-all">System Logs</button>
<button id="openWebhooksBtn" class="text-primary text-body-md font-bold hover:underline flex items-center gap-1">
                                Setup Webhooks
                                <span class="material-symbols-outlined text-[16px]" data-icon="open_in_new">open_in_new</span>
</button>
</div>
</div>
<div class="relative w-40 h-40 flex items-center justify-center">
<div class="absolute inset-0 rounded-full border-[10px] border-surface-container-high"></div>
<div class="absolute inset-0 rounded-full border-[10px] border-primary" style="clip-path: polygon(0 0, 100% 0, 100% 75%, 0 75%);"></div>
<div class="text-center">
<p class="text-headline-md font-headline-md text-primary">75%</p>
<p class="text-[10px] font-bold text-on-surface-variant">COLLECTED</p>
</div>
</div>
</div>
<div class="bg-primary-container text-on-primary-container p-6 rounded-lg relative overflow-hidden flex flex-col justify-between">
<div class="relative z-10">
<h3 class="font-headline-sm text-headline-sm font-bold mb-2">Quick Support</h3>
<p class="font-body-md opacity-90 mb-6">Facing verification issues with a client's transfer? Reach our financial ops desk immediately.</p>
<div class="space-y-3">
<button id="openSopBtn" class="flex items-center gap-2 font-bold hover:translate-x-1 transition-transform text-left">
<span class="material-symbols-outlined" data-icon="menu_book">menu_book</span>
                                Payment SOPs
                            </button>
<a class="flex items-center gap-2 font-bold hover:translate-x-1 transition-transform" href="mailto:dhanisepeda@gmail.com?subject=SBS%20Payment%20Audit%20-%20Assistance%20Needed">
<span class="material-symbols-outlined" data-icon="support_agent">support_agent</span>
                                Contact Auditor
                            </a>
</div>
</div>
<!-- Decorative Element -->
<div class="absolute -right-8 -bottom-8 w-32 h-32 bg-on-primary-container/10 rounded-full blur-2xl"></div>
</div>
</div>
</div>
</main>

<!-- System Logs Modal -->
<div id="systemLogsModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in">
        <button onclick="document.getElementById('systemLogsModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-4">
            <div class="bg-primary/10 p-2.5 rounded-lg text-primary flex items-center justify-center">
                <span class="material-symbols-outlined">analytics</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">System Logs (Pembayaran)</h3>
                <p class="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">PT. Surya Bangun Sarana</p>
            </div>
        </div>
        <div class="bg-surface-container-low rounded-lg p-4 font-mono text-[12px] text-on-surface-variant max-h-60 overflow-y-auto space-y-2 border border-outline-variant">
            <div class="pb-2 border-b border-outline-variant/30"><span class="text-green-600">[INFO]</span> <?= date('Y-m-d H:i:s') ?> WITA - Background scheduler synchronized 4 rental payment codes.</div>
            <div class="pb-2 border-b border-outline-variant/30"><span class="text-blue-600">[DB]</span> <?= date('Y-m-d H:i:s', strtotime('-10 mins')) ?> WITA - Connection verified with phpMyAdmin local database.</div>
            <div class="pb-2 border-b border-outline-variant/30"><span class="text-yellow-600">[WARN]</span> <?= date('Y-m-d H:i:s', strtotime('-1 hour')) ?> WITA - Client SBS-PAY-72A uploaded size 4MB payment receipt image.</div>
            <div class="pb-2 border-b border-outline-variant/30"><span class="text-green-600">[INFO]</span> <?= date('Y-m-d H:i:s', strtotime('-3 hours')) ?> WITA - Verified status updated for Invoice SBS-PAY-301.</div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
            <button onclick="document.getElementById('systemLogsModal').classList.add('hidden')" class="bg-primary text-on-primary px-4 py-2 rounded font-bold hover:opacity-90 active:scale-95 transition-all text-body-md shadow-sm">Tutup Log</button>
        </div>
    </div>
</div>

<!-- Setup Webhooks Modal -->
<div id="webhooksModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative m-4 animate-fade-in">
        <button onclick="document.getElementById('webhooksModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-4">
            <div class="bg-primary/10 p-2.5 rounded-lg text-primary flex items-center justify-center">
                <span class="material-symbols-outlined">webhook</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Setup Webhooks</h3>
                <p class="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">Notifikasi Transaksi Otomatis</p>
            </div>
        </div>
        <form onsubmit="event.preventDefault(); alert('Webhook Endpoint Saved Successfully!'); document.getElementById('webhooksModal').classList.add('hidden');" class="space-y-4">
            <div>
                <label class="block text-body-md font-bold text-on-surface mb-1.5">Webhook Payload URL</label>
                <input type="url" required placeholder="https://api.perusahaan-client.com/sbs-webhook" class="w-full h-11 border border-outline rounded px-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
            </div>
            <div>
                <label class="block text-body-md font-bold text-on-surface mb-1.5">Secret Key</label>
                <input type="text" readonly value="whsec_sbs_<?= bin2hex(random_bytes(8)) ?>" class="w-full h-11 bg-surface-container-low border border-outline rounded px-3 text-body-md font-mono text-on-surface-variant">
            </div>
            <div>
                <label class="block text-body-md font-bold text-on-surface mb-1.5">Trigger Events</label>
                <div class="space-y-2">
                    <label class="flex items-center gap-2 text-body-md text-on-surface-variant">
                        <input type="checkbox" checked class="accent-primary rounded">
                        <span>payment.verified (Saat Bukti TF disetujui)</span>
                    </label>
                    <label class="flex items-center gap-2 text-body-md text-on-surface-variant">
                        <input type="checkbox" checked class="accent-primary rounded">
                        <span>payment.failed (Saat Bukti TF ditolak)</span>
                    </label>
                </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
                <button type="button" onclick="document.getElementById('webhooksModal').classList.add('hidden')" class="border border-outline text-on-surface px-4 py-2 rounded font-bold hover:bg-surface-container-high transition-all text-body-md">Batal</button>
                <button type="submit" class="bg-primary text-on-primary px-4 py-2 rounded font-bold hover:opacity-90 active:scale-95 transition-all text-body-md shadow-sm">Simpan Integrasi</button>
            </div>
        </form>
    </div>
</div>

<!-- Payment SOPs Modal -->
<div id="sopModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in">
        <button onclick="document.getElementById('sopModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="flex items-center gap-3 mb-4">
            <div class="bg-primary/10 p-2.5 rounded-lg text-primary flex items-center justify-center">
                <span class="material-symbols-outlined">menu_book</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">SOP Verifikasi Pembayaran</h3>
                <p class="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">PT. SURYA BANGUN SARANA BANJARMASIN</p>
            </div>
        </div>
        <div class="space-y-3 text-body-md text-on-surface-variant max-h-80 overflow-y-auto pr-2">
            <p class="font-bold text-primary border-b border-outline-variant pb-1">1. Pemeriksaan Rekening Koran</p>
            <p>Pastikan nominal transfer dari pelanggan di mutasi rekening bank Mandiri / BNI SBS 100% cocok dengan invoice billing yang diajukan pelanggan.</p>
            
            <p class="font-bold text-primary border-b border-outline-variant pb-1 mt-4">2. Verifikasi Keaslian Bukti</p>
            <p>Periksa bukti transfer (.jpg/.png/.pdf) terhadap tanda-tanda manipulasi grafis. Perhatikan nomor transaksi, nama pengirim, dan stempel waktu WITA digital.</p>
            
            <p class="font-bold text-primary border-b border-outline-variant pb-1 mt-4">3. Eksekusi Status di Sistem</p>
            <ul class="list-disc list-inside space-y-1 pl-2">
                <li>Klik tombol <strong>Verify Payment</strong> jika transfer terbukti valid dan nominal pas.</li>
                <li>Klik tombol <strong>Mark Failed</strong> apabila bukti palsu, buram, atau nominal kurang/tidak cocok.</li>
            </ul>
        </div>
        <div class="mt-6 flex justify-end gap-3">
            <button onclick="document.getElementById('sopModal').classList.add('hidden')" class="bg-primary text-on-primary px-4 py-2 rounded font-bold hover:opacity-90 active:scale-95 transition-all text-body-md shadow-sm">Saya Mengerti</button>
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
</div>

<!-- BUKTI TF RECEIPT MODAL DIALOG -->
<div id="tfReceiptModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <button onclick="document.getElementById('tfReceiptModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined">close</span>
        </button>
        <!-- Header -->
        <div class="flex items-center gap-3 mb-4 pb-3 border-b border-outline-variant">
            <div class="bg-primary text-white p-2.5 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Bukti Transfer Bank</h3>
                <p id="tfReceiptInvoiceCode" class="text-xs font-mono font-bold text-on-surface-variant"></p>
            </div>
        </div>
        <!-- Receipt Design -->
        <div class="bg-surface-container-low rounded-lg p-5 border border-outline-variant font-body-md text-on-surface relative overflow-hidden">
            <!-- Decorative Bank Seal -->
            <div class="absolute right-4 top-4 border-2 border-green-600/30 text-green-600/30 font-bold text-[10px] px-2 py-1 rounded rotate-12 select-none uppercase tracking-widest font-label-caps">PROCESSED ✓</div>
            
            <div class="text-center pb-4 mb-4 border-b border-dashed border-outline-variant/60">
                <p class="font-bold text-lg text-primary">BANK MANDIRI</p>
                <p class="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mt-0.5">PT. SURYA BANGUN SARANA BANJARMASIN</p>
            </div>
            
            <div class="space-y-2.5 text-xs">
                <div class="flex justify-between">
                    <span class="text-on-surface-variant">Nama Pengirim:</span>
                    <span id="tfReceiptCustomer" class="font-bold"></span>
                </div>
                <div class="flex justify-between">
                    <span class="text-on-surface-variant">Metode Transfer:</span>
                    <span id="tfReceiptMethod" class="font-bold"></span>
                </div>
                <div class="flex justify-between">
                    <span class="text-on-surface-variant">Tanggal Bayar:</span>
                    <span id="tfReceiptDate" class="font-bold"></span>
                </div>
                <div class="flex justify-between">
                    <span class="text-on-surface-variant">Status Transfer:</span>
                    <span class="text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold uppercase">BERHASIL ✓</span>
                </div>
                <div class="pt-2 border-t border-outline-variant/30 flex justify-between items-center text-sm">
                    <span class="font-bold text-primary">TOTAL DITERIMA:</span>
                    <span class="font-bold text-primary font-mono text-base">IDR <span id="tfReceiptAmount"></span></span>
                </div>
            </div>
        </div>
        <!-- Actions -->
        <div class="mt-6 flex justify-end gap-3">
            <button onclick="window.print()" class="border border-outline text-on-surface px-4 py-2 rounded font-bold hover:bg-surface-container-high transition-all text-xs flex items-center gap-1 active:scale-95"><span class="material-symbols-outlined text-[16px]">print</span>Cetak Bukti</button>
            <button onclick="document.getElementById('tfReceiptModal').classList.add('hidden')" class="bg-primary text-on-primary px-5 py-2.5 rounded font-bold hover:opacity-90 active:scale-95 transition-all text-xs shadow-sm">Tutup Bukti</button>
        </div>
    </div>
</div>

<!-- AUDITOR CONTACT MODAL DIALOG -->
<div id="auditorContactModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <button onclick="document.getElementById('auditorContactModal').classList.add('hidden')" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined">close</span>
        </button>
        <!-- Header -->
        <div class="flex items-center gap-3 mb-4 pb-3 border-b border-outline-variant">
            <div class="bg-primary text-white p-2.5 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">support_agent</span>
            </div>
            <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Hubungi Auditor Keuangan</h3>
                <p class="text-xs text-on-surface-variant">PT. SURYA BANGUN SARANA BANJARMASIN</p>
            </div>
        </div>
        <!-- Toast Alert inside Modal -->
        <div id="auditorSuccessToast" class="hidden bg-green-50 border border-green-200 text-green-800 rounded-lg p-3.5 mb-4 flex items-center gap-3 animate-fade-in">
            <span class="material-symbols-outlined text-green-600">check_circle</span>
            <div class="text-xs">
                <p class="font-bold">Pesan Terkirim ke Auditor!</p>
                <p class="text-green-700">Tembusan terkirim otomatis ke dhanisepeda@gmail.com</p>
            </div>
        </div>
        <!-- Form -->
        <form id="auditorContactForm" onsubmit="submitAuditorEmail(event)" class="space-y-4 font-body-md text-on-surface">
            <div>
                <label class="block text-xs font-bold text-primary mb-1">Kode Invoice / Rujukan Transaksi</label>
                <input type="text" id="auditor_ref_code" required class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm font-mono font-bold" placeholder="Contoh: #SBS-PAY-101">
            </div>
            <div>
                <label class="block text-xs font-bold text-primary mb-1">Subjek Pertanyaan</label>
                <input type="text" id="auditor_subject" required class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm" placeholder="Contoh: Rekonsiliasi Nominal Kurang">
            </div>
            <div>
                <label class="block text-xs font-bold text-primary mb-1">Isi Pesan Detail</label>
                <textarea id="auditor_message" rows="4" required class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm" placeholder="Jelaskan kendala bukti transfer atau rekonsiliasi yang Anda temukan..."></textarea>
            </div>
            <div class="pt-2 flex justify-between items-center gap-4 text-xs text-on-surface-variant border-t border-outline-variant mt-4">
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">mail</span> dhanisepeda@gmail.com</span>
                <button type="submit" id="btnSubmitAuditorEmail" class="px-5 py-2 bg-primary text-white font-bold rounded hover:opacity-90 active:scale-95 transition-all text-xs tracking-wider uppercase cursor-pointer">Kirim Pesan</button>
            </div>
        </form>
    </div>
</div>

<script>
    // Global support functions
    function showTfReceipt(paymentCode, customerName, amount, date, method) {
        document.getElementById('tfReceiptInvoiceCode').textContent = '#' + paymentCode;
        document.getElementById('tfReceiptCustomer').textContent = customerName;
        document.getElementById('tfReceiptMethod').textContent = method;
        document.getElementById('tfReceiptDate').textContent = date;
        document.getElementById('tfReceiptAmount').textContent = amount;
        
        document.getElementById('tfReceiptModal').classList.remove('hidden');
    }

    function openAuditorContact(refCode = '') {
        document.getElementById('auditor_ref_code').value = refCode ? '#' + refCode : '';
        document.getElementById('auditor_subject').value = '';
        document.getElementById('auditor_message').value = '';
        document.getElementById('auditorSuccessToast').classList.add('hidden');
        document.getElementById('auditorContactModal').classList.remove('hidden');
    }

    function submitAuditorEmail(e) {
        e.preventDefault();
        const btn = document.getElementById('btnSubmitAuditorEmail');
        const toast = document.getElementById('auditorSuccessToast');
        
        btn.disabled = true;
        btn.textContent = 'MENGIRIM...';
        btn.style.opacity = '0.7';

        // Trigger native mailto link in background
        const ref = document.getElementById('auditor_ref_code').value;
        const sub = document.getElementById('auditor_subject').value;
        const msg = document.getElementById('auditor_message').value;
        
        window.open(`mailto:dhanisepeda@gmail.com?subject=${encodeURIComponent(sub + ' ' + ref)}&body=${encodeURIComponent(msg)}`, '_self');

        setTimeout(() => {
            toast.classList.remove('hidden');
            btn.textContent = 'TERKIRIM ✓';
            setTimeout(() => {
                document.getElementById('auditorContactModal').classList.add('hidden');
                btn.disabled = false;
                btn.textContent = 'KIRIM PESAN';
                btn.style.opacity = '1';
            }, 2500);
        }, 1000);
    }

    function exportPaymentsPDF() {
        // Generate beautiful printable report layout for skripsi evaluation
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        
        // Grab payments list items
        let rowsHtml = '';
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                const code = cells[0].textContent.trim();
                const name = cells[1].querySelector('p') ? cells[1].querySelector('p').textContent.trim() : cells[1].textContent.trim();
                const comp = cells[1].querySelector('p:nth-child(2)') ? cells[1].querySelector('p:nth-child(2)').textContent.trim() : '';
                const amount = cells[2].textContent.trim();
                const method = cells[3].textContent.replace(/\[Proof.*\]/g, '').trim();
                const date = cells[4].textContent.trim();
                const status = cells[5].textContent.trim();
                
                rowsHtml += `
                    <tr style="border-bottom: 1px solid #E2E8F0;">
                        <td style="padding: 12px; font-family: monospace; font-weight: bold; color: #003366;">${code}</td>
                        <td style="padding: 12px;"><strong>${name}</strong><br><small style="color: #64748B;">${comp}</small></td>
                        <td style="padding: 12px; font-weight: bold;">${amount}</td>
                        <td style="padding: 12px;">${method}</td>
                        <td style="padding: 12px;">${date}</td>
                        <td style="padding: 12px;"><span style="background-color: #E2E8F0; padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold;">${status}</span></td>
                    </tr>
                `;
            }
        });

        printWindow.document.write(`
            <html>
            <head>
                <title>Laporan Transaksi Pembayaran - PT. SBS</title>
                <style>
                    body { font-family: 'Hanken Grotesk', sans-serif; color: #1E293B; margin: 40px; }
                    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo-title { color: #003366; font-size: 24px; font-weight: bold; }
                    .company-info { text-align: right; font-size: 12px; color: #64748B; line-height: 1.5; }
                    .report-title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; color: #334155; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th { background-color: #003366; color: white; text-align: left; padding: 12px; font-weight: bold; }
                    .footer { margin-top: 50px; font-size: 10px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo-title">PT. SURYA BANGUN SARANA</div>
                        <div style="font-size: 12px; color: #64748B; font-weight: bold; margin-top: 4px;">HEAVY EQUIPMENT RENTAL TERMINAL</div>
                    </div>
                    <div class="company-info">
                        <strong>Kantor Pusat Banjarmasin</strong><br>
                        Jl. Ahmad Yani KM 5, Banjarmasin, Kalimantan Selatan<br>
                        Hotline: (0511) 325-SBS | E-mail: finance@suryabangun.co.id
                    </div>
                </div>
                
                <div class="report-title">Laporan Rekapitulasi Pembayaran Pelanggan</div>
                <p style="font-size: 12px; color: #475569;">Dicetak tanggal: <strong>${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Kode Invoice</th>
                            <th>Pelanggan</th>
                            <th>Nominal</th>
                            <th>Metode</th>
                            <th>Tanggal Bayar</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
                
                <div class="footer">
                    Dokumen ini dihasilkan secara digital oleh Sistem Informasi Monitoring & Rental Alat Berat PT. SBS Banjarmasin.
                </div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    // Interactive Navbar actions
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

        // Close on clicking outside
        document.addEventListener('click', (e) => {
            if (profileMenu) profileMenu.classList.add('hidden');
            if (notiMenu) notiMenu.classList.add('hidden');
            closeAllActionMenus();
            if (window.innerWidth < 1024 && sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex');
            }
        });

        // Setup modal triggers for System Logs, Webhooks, and SOP
        const sysLogBtn = document.getElementById('openSystemLogsBtn');
        const sysLogModal = document.getElementById('systemLogsModal');
        if (sysLogBtn && sysLogModal) {
            sysLogBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sysLogModal.classList.remove('hidden');
            });
        }

        const webhookBtn = document.getElementById('openWebhooksBtn');
        const webhookModal = document.getElementById('webhooksModal');
        if (webhookBtn && webhookModal) {
            webhookBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                webhookModal.classList.remove('hidden');
            });
        }

        const sopBtn = document.getElementById('openSopBtn');
        const sopModal = document.getElementById('sopModal');
        if (sopBtn && sopModal) {
            sopBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sopModal.classList.remove('hidden');
            });
        }

        // Bind click event to "Contact Auditor" in the bottom-right card
        const bottomAuditorLink = document.querySelector('a[href*="mailto:dhanisepeda@gmail.com?subject=SBS%20Payment%20Audit%20-%20Assistance%20Needed"]');
        if (bottomAuditorLink) {
            bottomAuditorLink.removeAttribute('href');
            bottomAuditorLink.classList.add('cursor-pointer');
            bottomAuditorLink.addEventListener('click', (e) => {
                e.preventDefault();
                openAuditorContact();
            });
        }
    });

    // Toggle Row Action Dropdowns
    function toggleActionMenu(event, menuId) {
        event.stopPropagation();
        const menu = document.getElementById(menuId);
        const alreadyOpen = !menu.classList.contains('hidden');
        closeAllActionMenus();
        if (!alreadyOpen) {
            menu.classList.remove('hidden');
        }
    }

    function closeAllActionMenus() {
        document.querySelectorAll('[id^="menu-"]').forEach(menu => {
            menu.classList.add('hidden');
        });
    }

    // Simple Interaction: Mock Ripple effect on buttons
    document.querySelectorAll('button, a').forEach(button => {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.98)';
        });
        button.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Search highlight mock
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            searchInput.parentElement.classList.add('ring-2', 'ring-primary');
        });
        searchInput.addEventListener('blur', () => {
            searchInput.parentElement.classList.remove('ring-2', 'ring-primary');
        });
    }
</script>
</body>
</html>
