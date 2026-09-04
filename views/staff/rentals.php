<?php
$fullName = $_SESSION['full_name'] ?? 'Alex Staff';
$role = $_SESSION['role'] ?? 'STAFF';
$currentPage = 'rentals';

// Ambil koneksi database untuk menghitung bento stats riil yang akurat
$db = Database::getConnection();

// 1. Total Orders
$stmtTotal = $db->query("SELECT COUNT(*) FROM rentals");
$totalOrders = $stmtTotal->fetchColumn() ?: 0;

// 2. Pending Approval
$stmtPending = $db->query("SELECT COUNT(*) FROM rentals WHERE status = 'PENDING'");
$pendingOrders = $stmtPending->fetchColumn() ?: 0;

// 3. Active Rentals
$stmtActive = $db->query("SELECT COUNT(*) FROM rentals WHERE status IN ('APPROVED', 'ON_GOING')");
$activeRentalsCount = $stmtActive->fetchColumn() ?: 0;

// 4. Completed
$stmtCompleted = $db->query("SELECT COUNT(*) FROM rentals WHERE status = 'COMPLETED'");
$completedRentals = $stmtCompleted->fetchColumn() ?: 0;

// Hitung Fleet Availability untuk Panel Samping
$stmtExc = $db->query("SELECT 
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available 
    FROM equipments WHERE name LIKE '%Excavator%' OR name LIKE '%Komatsu%' OR name LIKE '%Caterpillar%'");
$excStats = $stmtExc->fetch() ?: ['total' => 14, 'available' => 12];

$stmtGen = $db->query("SELECT 
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available 
    FROM equipments WHERE name LIKE '%Generator%' OR name LIKE '%Generac%'");
$genStats = $stmtGen->fetch() ?: ['total' => 10, 'available' => 4];

$stmtFrk = $db->query("SELECT 
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available 
    FROM equipments WHERE name LIKE '%Forklift%' OR name LIKE '%Toyota%'");
$frkStats = $stmtFrk->fetch() ?: ['total' => 15, 'available' => 9];

function getFilterBtnClass($btnStatus, $currentStatus) {
    if ($btnStatus === $currentStatus) {
        return "px-3 py-1 rounded text-[12px] font-bold bg-white shadow-sm text-primary";
    }
    return "px-3 py-1 rounded text-[12px] font-bold text-on-surface-variant hover:text-on-surface transition-colors";
}
?>
<!DOCTYPE html>
<html class="light" lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>EquipRent MS - Rental Orders Management</title>
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
        body { font-family: 'Hanken Grotesk', sans-serif; background-color: #f7f9fb; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
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
                <span class="font-body-md text-body-md font-bold">Rental Orders</span>
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
                    <!-- Active State: Rental Orders -->
                    <a class="flex items-center gap-3 px-6 py-3 text-primary font-bold border-l-4 border-primary bg-secondary-container transition-all scale-95 duration-100 font-body-md text-body-md" href="index.php?page=rentals">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">receipt_long</span>
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
    <input type="hidden" name="page" value="rentals">
    <input name="search" value="<?= htmlspecialchars($search ?? '') ?>" class="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary transition-all text-body-md font-body-md" placeholder="Search inventory or orders..." type="text"/>
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
<!-- Page Header -->
<div class="flex justify-between items-end mb-8">
<div>
<h2 class="font-headline-md text-headline-md text-primary">Rental Orders Management</h2>
<p class="font-body-md text-body-md text-on-surface-variant mt-1">Review and process heavy equipment rental requests.</p>
</div>
<button id="openCreateRentalBtn" class="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-all shadow-sm active:scale-95">
<span class="material-symbols-outlined text-body-lg">add</span>
<span class="font-body-md text-body-md font-semibold">New Order</span>
</button>
</div>

<!-- Alert Success -->
<?php if (isset($_SESSION['success'])): ?>
<div class="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-r-lg font-body-md flex items-center justify-between">
    <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-green-700">check_circle</span>
        <span><?= htmlspecialchars($_SESSION['success']) ?></span>
    </div>
    <?php unset($_SESSION['success']); ?>
</div>
<?php endif; ?>

<!-- Stats Bento Grid -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-grid-gutter mb-8">
<!-- Stat 1 -->
<div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant hover:shadow-md transition-shadow">
<div class="flex justify-between items-start mb-4">
<div class="p-2 bg-primary/5 text-primary rounded-lg">
<span class="material-symbols-outlined">receipt_long</span>
</div>
<span class="text-[12px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">+8%</span>
</div>
<p class="font-label-caps text-label-caps text-on-surface-variant">TOTAL ORDERS</p>
<h3 class="font-display-lg text-display-lg mt-1 font-bold text-primary"><?= number_format($totalOrders) ?></h3>
<p class="text-[11px] text-on-surface-variant mt-2">Lifetime total across all units</p>
</div>
<!-- Stat 2 -->
<div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant hover:shadow-md transition-shadow">
<div class="flex justify-between items-start mb-4">
<div class="p-2 bg-secondary-container text-primary rounded-lg">
<span class="material-symbols-outlined">pending_actions</span>
</div>
<span class="text-[12px] font-bold text-error bg-error-container/20 px-2 py-0.5 rounded">Action Req.</span>
</div>
<p class="font-label-caps text-label-caps text-on-surface-variant">PENDING APPROVAL</p>
<h3 class="font-display-lg text-display-lg mt-1 font-bold text-primary"><?= number_format($pendingOrders) ?></h3>
<p class="text-[11px] text-on-surface-variant mt-2">Requiring manager authorization</p>
</div>
<!-- Stat 3 -->
<div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant hover:shadow-md transition-shadow">
<div class="flex justify-between items-start mb-4">
<div class="p-2 bg-on-tertiary-fixed-variant/10 text-on-tertiary-fixed-variant rounded-lg">
<span class="material-symbols-outlined">sync_alt</span>
</div>
<span class="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Active</span>
</div>
<p class="font-label-caps text-label-caps text-on-surface-variant">ACTIVE RENTALS</p>
<h3 class="font-display-lg text-display-lg mt-1 font-bold text-primary"><?= number_format($activeRentalsCount) ?></h3>
<p class="text-[11px] text-on-surface-variant mt-2">Equipment currently in the field</p>
</div>
<!-- Stat 4 -->
<div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant hover:shadow-md transition-shadow">
<div class="flex justify-between items-start mb-4">
<div class="p-2 bg-green-100 text-green-800 rounded-lg">
<span class="material-symbols-outlined">check_circle</span>
</div>
<span class="text-[12px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">Today</span>
</div>
<p class="font-label-caps text-label-caps text-on-surface-variant">COMPLETED</p>
<h3 class="font-display-lg text-display-lg mt-1 font-bold text-primary"><?= number_format($completedRentals) ?></h3>
<p class="text-[11px] text-on-surface-variant mt-2">Successfully closed this month</p>
</div>
</div>

<!-- Table Controls -->
<div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
<div class="p-4 border-b border-outline-variant bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-4">
<div class="flex items-center gap-2">
<a href="index.php?page=rentals" class="bg-white border border-outline-variant px-3 py-1.5 rounded text-body-md font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2">
<span class="material-symbols-outlined text-[18px]">filter_list</span>
                        Filter Status
                    </a>
<div class="h-6 w-[1px] bg-outline-variant mx-2"></div>
<div class="flex gap-1 bg-surface-container-high/50 p-1 rounded-lg">
<a href="index.php?page=rentals&status=ALL" class="<?= getFilterBtnClass('ALL', $status) ?>">All</a>
<a href="index.php?page=rentals&status=PENDING" class="<?= getFilterBtnClass('PENDING', $status) ?>">Pending</a>
<a href="index.php?page=rentals&status=ON_GOING" class="<?= getFilterBtnClass('ON_GOING', $status) ?>">Ongoing</a>
<a href="index.php?page=rentals&status=COMPLETED" class="<?= getFilterBtnClass('COMPLETED', $status) ?>">Completed</a>
</div>
</div>
<div class="flex items-center gap-2">
<span class="text-body-md text-on-surface-variant">Sort by:</span>
<select class="bg-transparent border-none text-body-md font-bold text-primary focus:ring-0 cursor-pointer">
<option>Latest Created</option>
<option>Status Priority</option>
<option>Client Name</option>
</select>
</div>
</div>

<!-- Modern Data Table -->
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-lowest border-b border-outline-variant">
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant">ORDER ID</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant">CUSTOMER</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant">UNIT ALAT</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant">RENTAL DURATION</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant">STATUS</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant text-right">ACTION</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/30">
<?php if (empty($rentals)): ?>
  <tr>
    <td colspan="6" class="px-6 py-12 text-center text-on-surface-variant opacity-75 font-body-lg">
      <span class="material-symbols-outlined text-[48px] mb-2 opacity-50 block">receipt_long</span>
      Tidak ada rental order yang sesuai filter aktif.
    </td>
  </tr>
<?php else: ?>
  <?php foreach ($rentals as $rental): 
      $initials = '';
      $names = explode(' ', $rental['customer_name']);
      foreach ($names as $n) {
          $initials .= strtoupper(substr($n, 0, 1));
      }
      $initials = substr($initials, 0, 2);

      // Status badge styles
      $statusVal = strtoupper($rental['status']);
      if ($statusVal === 'COMPLETED') {
          $badgeClass = 'bg-green-100 text-green-700';
          $statusLabel = 'Completed';
      } elseif ($statusVal === 'APPROVED' || $statusVal === 'ON_GOING') {
          $badgeClass = 'bg-blue-100 text-blue-700';
          $statusLabel = $statusVal === 'ON_GOING' ? 'Ongoing' : 'Approved';
      } elseif ($statusVal === 'PENDING') {
          $badgeClass = 'bg-amber-100 text-amber-700';
          $statusLabel = 'Pending Approval';
      } else {
          $badgeClass = 'bg-on-secondary-fixed/10 text-on-surface-variant';
          $statusLabel = $statusVal;
      }

      $imgUrl = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=150&q=80';
      $code = strtoupper($rental['equipment_code']);
      if (strpos($code, 'KOM') !== false || strpos($code, 'PC200') !== false || strpos($code, 'EXCA') !== false) {
          $imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5w2Kpu_FyhfHUpqgyFxOeuh4RCI4CLkRh4Np4fxHp6O1Bq5jyahGMOyeqEWxTPfj-IsdbYI70AEi_u8zfk505m4Ld4oJqHru96EQyVABNtt2mO4Hv97uKgRJ8Bx_5VD_sA_ED6DKI_FHVLJrNCfvl-h8EC1PRf5TcfBTXhlDPsu-eeqePRRdWu1YvRErHQJU-BMwmFHSy4Hu3mDybLExdmPPkcBw_BuNz5hG7JjEtzGsHiEzwQwIPS5I5SqMHkv_ixt-6bstXHfxp';
      } elseif (strpos($code, 'BULL') !== false || strpos($code, 'CAT') !== false || strpos($code, 'D6') !== false) {
          $imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXu-vhe3rSZt3ISyU9XqGrnp4Ou8CNOMWVJb60W7QKQPOJs65tt0q7Ss-dAK1z6Fh6684F4BgcClkMHZKqHrrudMGAMZkythEpzBswtmXPCelGUHySG1wQCKt3-t8FYDlW-EpesQgIM68wMsAURJO002PUezkUwueicPjsjYPBbBXC8KqmSqTlJIOmVidZZjHFrSfZilQ11TGlSp8ZfwUAsfxCVCOqeii6_77MVLHNHT6NDMZJAUNPsHHtHlnAz1c4bL0gOhp65v-TO2';
      } elseif (strpos($code, 'VIBR') !== false || strpos($code, 'SAK') !== false || strpos($code, 'SV520') !== false || strpos($code, 'SD110') !== false) {
          $imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmurtKWWc5_OhFV-cTV9efTVcwPuyv9Vd9j3H-i-UBQqNIppqUd7P16fE8bjgR-dwFkHBdzRvKT3GrqN8mg91g28CdduCXRatHdhgxaqQ1zMfKPn3TdkXh310GDTUkh2N-ghJtko51-WVmAY81_JLXIKfGtvqHLlR_Wt-1-OZiCjWQdELQgEb5Ixu63mja4aBoEhY2sIoZBg0yTqO35580qRxWxAo1wgFFVNC8FnWS5y9WKrHA6EY6WmlNBgWrGKc9o0-C1GA91CQa';
      }
  ?>
  <tr class="hover:bg-surface-container-low/50 transition-colors group">
    <td class="px-6 py-4">
      <span class="font-label-caps text-label-caps text-primary">#<?= htmlspecialchars($rental['rental_code']) ?></span>
    </td>
    <td class="px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[12px]"><?= $initials ?></div>
        <div class="font-body-md text-body-md font-semibold"><?= htmlspecialchars($rental['customer_name']) ?></div>
      </div>
    </td>
    <td class="px-6 py-4">
      <div class="flex flex-col">
        <span class="font-body-md text-body-md font-bold"><?= htmlspecialchars($rental['equipment_name']) ?></span>
        <span class="text-[11px] text-on-surface-variant"><?= htmlspecialchars($rental['brand']) ?> • SN: <?= htmlspecialchars($rental['equipment_code']) ?></span>
      </div>
    </td>
    <td class="px-6 py-4">
      <div class="flex flex-col">
        <span class="font-body-md text-body-md"><?= date('M d', strtotime($rental['start_date'])) ?> - <?= date('M d', strtotime($rental['end_date'])) ?></span>
        <span class="text-[11px] text-on-surface-variant font-medium"><?= htmlspecialchars($rental['total_days']) ?> Days</span>
      </div>
    </td>
    <td class="px-6 py-4">
      <span class="px-3 py-1 rounded-full text-[11px] font-bold <?= $badgeClass ?>"><?= $statusLabel ?></span>
    </td>
    <td class="px-6 py-4 text-right relative">
      <div class="inline-block text-left">
        <button onclick="toggleActionMenu(event, 'menu-<?= $rental['id'] ?>')" class="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary">
          <span class="material-symbols-outlined text-[20px] block">menu</span>
        </button>
        <div id="menu-<?= $rental['id'] ?>" class="hidden absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-surface-container-lowest border border-outline-variant z-50 text-left py-1 animate-fade-in">
          <div class="px-4 py-1.5 border-b border-outline-variant text-[11px] font-bold text-primary tracking-wider font-label-caps uppercase">Aksi Order</div>
          
          <?php if ($statusVal === 'PENDING'): ?>
            <a href="index.php?page=rentals&action=approve&id=<?= $rental['id'] ?>" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-green-50 hover:text-green-700 transition-colors font-semibold">
              <span class="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
              <span>Approve Order</span>
            </a>
            <a href="index.php?page=rentals&action=reject&id=<?= $rental['id'] ?>" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-red-50 hover:text-red-700 transition-colors font-semibold">
              <span class="material-symbols-outlined text-[18px] text-error">cancel</span>
              <span>Reject Order</span>
            </a>
          <?php elseif ($statusVal === 'ON_GOING' || $statusVal === 'APPROVED'): ?>
            <a href="index.php?page=rentals&action=complete&id=<?= $rental['id'] ?>" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-green-50 hover:text-green-700 transition-colors font-semibold">
              <span class="material-symbols-outlined text-[18px] text-green-600">task_alt</span>
              <span>Mark Completed</span>
            </a>
            <a href="index.php?page=tracking&focus=<?= $rental['equipment_id'] ?>" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-high transition-colors font-semibold">
              <span class="material-symbols-outlined text-[18px] text-primary">explore</span>
              <span>Track Unit</span>
            </a>
          <?php else: ?>
            <span class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface-variant opacity-50 cursor-not-allowed">
              <span class="material-symbols-outlined text-[18px]">lock</span>
              <span>No Action Available</span>
            </span>
          <?php endif; ?>
          <div class="border-t border-outline-variant my-1"></div>
          <a href="mailto:dhanisepeda@gmail.com?subject=SBS%20Rental%20Order%20%23<?= $rental['rental_code'] ?>" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-high transition-colors">
            <span class="material-symbols-outlined text-[18px] text-on-surface-variant">mail</span>
            <span>Email Customer Desk</span>
          </a>
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
<div class="p-4 border-t border-outline-variant flex items-center justify-between">
<p class="text-[12px] text-on-surface-variant">Showing <span class="font-bold text-on-surface">1 - <?= count($rentals) ?></span> of <?= count($rentals) ?> results</p>
<div class="flex gap-2">
<button class="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors disabled:opacity-50" disabled="">
<span class="material-symbols-outlined text-[18px]">chevron_left</span>
</button>
<button class="w-8 h-8 flex items-center justify-center bg-primary text-white rounded font-bold text-[12px]">1</button>
<button class="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors">
<span class="material-symbols-outlined text-[18px]">chevron_right</span>
</button>
</div>
</div>
</div>

<!-- Support Section -->
<div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-grid-gutter">
<div class="md:col-span-2 bg-gradient-to-r from-primary to-primary-container p-6 rounded-xl text-white flex justify-between items-center overflow-hidden relative">
<div class="relative z-10">
<h4 class="font-headline-sm text-headline-sm mb-2 text-white font-bold">Need help with order processing?</h4>
<p class="font-body-md text-body-md opacity-80 max-w-md text-white">Our documentation covers complex rental scenarios, insurance requirements, and billing procedures for all fleet tiers.</p>
<div class="mt-4 flex gap-3">
<button id="openGuideBtn" class="bg-white text-primary px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 hover:bg-surface-container-low transition-colors">
<span class="material-symbols-outlined text-[18px]">auto_stories</span>
                            View Guide
                        </button>
<a href="mailto:dhanisepeda@gmail.com?subject=SBS%20Support%20Request%20-%20Rental%20Module" class="bg-transparent border border-white/30 text-white px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 hover:bg-white/10 transition-colors">
<span class="material-symbols-outlined text-[18px]">support_agent</span>
                            Contact Manager
                        </a>
</div>
</div>
<!-- Abstract visual element -->
<div class="absolute right-[-20px] top-[-20px] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
<div class="absolute right-10 bottom-[-30px] w-32 h-32 bg-secondary-container/20 rounded-full blur-2xl"></div>
<span class="material-symbols-outlined text-[120px] opacity-10 absolute right-4 top-1/2 -translate-y-1/2 select-none">help_center</span>
</div>

<!-- Unit Availability Quick View -->
<div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
<h4 class="font-body-md text-body-md font-bold mb-4 flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
                    Fleet Availability
                </h4>
<div class="space-y-4">
<div class="flex justify-between items-center">
<span class="text-body-md text-on-surface-variant">Excavators</span>
<div class="flex items-center gap-3 flex-1 px-4">
<div class="h-1.5 flex-1 bg-surface-container-high rounded-full overflow-hidden">
<div class="bg-primary h-full" style="width: <?= ($excStats['total'] > 0) ? ($excStats['available'] / $excStats['total'] * 100) : 85 ?>%"></div>
</div>
</div>
<span class="text-[12px] font-bold text-on-surface"><?= $excStats['available'] ?>/<?= $excStats['total'] ?></span>
</div>
<div class="flex justify-between items-center">
<span class="text-body-md text-on-surface-variant">Generators</span>
<div class="flex items-center gap-3 flex-1 px-4">
<div class="h-1.5 flex-1 bg-surface-container-high rounded-full overflow-hidden">
<div class="bg-primary h-full" style="width: <?= ($genStats['total'] > 0) ? ($genStats['available'] / $genStats['total'] * 100) : 40 ?>%"></div>
</div>
</div>
<span class="text-[12px] font-bold text-on-surface"><?= $genStats['available'] ?>/<?= $genStats['total'] ?></span>
</div>
<div class="flex justify-between items-center">
<span class="text-body-md text-on-surface-variant">Forklifts</span>
<div class="flex items-center gap-3 flex-1 px-4">
<div class="h-1.5 flex-1 bg-surface-container-high rounded-full overflow-hidden">
<div class="bg-primary h-full" style="width: <?= ($frkStats['total'] > 0) ? ($frkStats['available'] / $frkStats['total'] * 100) : 60 ?>%"></div>
</div>
</div>
<span class="text-[12px] font-bold text-on-surface"><?= $frkStats['available'] ?>/<?= $frkStats['total'] ?></span>
</div>
</div>
<button onclick="location.href='index.php?page=equipment'" class="w-full mt-6 py-2 text-primary font-bold text-[12px] hover:bg-surface-container-low rounded border border-outline-variant/30 transition-colors">
                    View Full Inventory
                </button>
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
                <p class="text-xs text-on-surface-variant font-semibold">PT. SURYA BANGUN SARANA BANJARMASIN (Operator)</p>
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
    // Global function to toggle row action menu
    function toggleActionMenu(event, menuId) {
        event.stopPropagation();
        const targetMenu = document.getElementById(menuId);
        
        // Hide all other action menus first
        const allMenus = document.querySelectorAll('[id^="menu-"]');
        allMenus.forEach(m => {
            if (m.id !== menuId) {
                m.classList.add('hidden');
            }
        });
        
        // Toggle the clicked menu
        if (targetMenu) {
            targetMenu.classList.toggle('hidden');
        }
    }

    // Interactive Navbar & Modal actions
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
        
        // Create Rental modal triggers
        const openCreateRentalBtn = document.getElementById('openCreateRentalBtn');
        const createRentalModal = document.getElementById('createRentalModal');
        const closeCreateRentalCross = document.getElementById('closeCreateRentalCross');
        const closeCreateRentalCancel = document.getElementById('closeCreateRentalCancel');
        
        // View Guide trigger
        const openGuideBtn = document.getElementById('openGuideBtn');

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

        if (openGuideBtn && helpModal) {
            openGuideBtn.addEventListener('click', () => {
                helpModal.classList.remove('hidden');
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

        // Close dropdowns & menus on clicking outside
        document.addEventListener('click', (e) => {
            if (profileMenu && !profileBtn.contains(e.target)) profileMenu.classList.add('hidden');
            if (notiMenu && !notiBtn.contains(e.target)) notiMenu.classList.add('hidden');
            
            // Hide all action menus
            const allMenus = document.querySelectorAll('[id^="menu-"]');
            allMenus.forEach(m => m.classList.add('hidden'));

            if (window.innerWidth < 1024 && sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex');
            }
        });
    });

    // Search focus highlights
    const searchInp = document.querySelector('input[name="search"]');
    if (searchInp) {
        searchInp.addEventListener('focus', () => {
            searchInp.parentElement.classList.add('ring-2', 'ring-primary');
        });
        searchInp.parentElement.querySelector('input').addEventListener('blur', () => {
            searchInp.parentElement.classList.remove('ring-2', 'ring-primary');
        });
    }

    // Highlight rows
    const tblRows = document.querySelectorAll('tbody tr');
    tblRows.forEach(row => {
        row.addEventListener('click', () => {
            tblRows.forEach(r => r.classList.remove('bg-secondary-container/20'));
            row.classList.add('bg-secondary-container/20');
        });
    });
</script>
</body>
</html>
