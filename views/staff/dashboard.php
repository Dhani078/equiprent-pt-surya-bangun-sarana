<?php
$fullName = $_SESSION['full_name'] ?? 'Operator Staff';
$role = $_SESSION['role'] ?? 'STAFF';
$currentPage = 'staff_dashboard';
?>
<!DOCTYPE html>
<html class="light" lang="en">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>EquipRent MS - Staff Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
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
                }
            }
        }
</script>
<style>
        body { font-family: 'Hanken Grotesk', sans-serif; background-color: #f7f9fb; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .card-hover { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .table-row-zebra:nth-child(even) { background-color: #f2f4f6; }
</style>
</head>
<body class="bg-background text-on-background min-h-screen flex antialiased">

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
            <a class="text-primary font-bold border-l-4 border-primary bg-secondary-container transition-all scale-95 duration-100 flex items-center gap-3 px-6 py-3 duration-200" href="index.php?page=admin_dashboard">
                <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">dashboard</span>
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
                    <!-- Active State: Dashboard -->
                    <a class="flex items-center gap-3 px-6 py-3 text-primary font-bold border-l-4 border-primary bg-secondary-container transition-all scale-95 duration-100 font-body-md text-body-md" href="index.php?page=staff_dashboard">
                        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">dashboard</span>
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

<!-- Main Content Canvas -->
<main class="flex-1 ml-0 lg:ml-[260px] min-h-screen flex flex-col">
<!-- TopAppBar -->
<header class="flex justify-between items-center h-16 px-container-padding w-full sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant">
<div class="flex items-center gap-3">
    <button id="sidebarToggleBtn" class="lg:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors flex items-center justify-center">
        <span class="material-symbols-outlined">menu</span>
    </button>
    <h2 class="font-headline-md text-headline-md font-bold text-primary">SBS EquipRent</h2>
<div class="relative hidden lg:block">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<form method="GET" action="index.php">
    <input type="hidden" name="page" value="staff_dashboard">
    <input name="search" value="<?= htmlspecialchars($search ?? '') ?>" class="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-md w-80 focus:ring-2 focus:ring-primary font-body-md" placeholder="Search..." type="text">
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

<!-- Dashboard Body -->
<div class="p-container-padding flex-1">
<!-- Page Header -->
<div class="mb-8 flex justify-between items-end">
<div>
<h1 class="font-display-lg text-display-lg text-primary font-bold">Operations Overview</h1>
<p class="font-body-lg text-on-surface-variant mt-1">Monitoring active rentals and scheduled maintenance for today.</p>
</div>
<div class="flex gap-3">
<a href="index.php?page=rentals" class="px-4 h-10 bg-primary text-white font-body-md rounded flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-95">
<span class="material-symbols-outlined text-[20px]">add</span>
                        New Rental Order
                    </a>
</div>
</div>

<!-- Bento Stats Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-grid-gutter mb-8">
<div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-lg card-hover">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-primary p-2 bg-secondary-container rounded">payments</span>
<span class="text-green-600 font-label-caps text-xs">+12%</span>
</div>
<p class="font-label-caps text-on-surface-variant text-[11px]">FINANCIAL REVENUE</p>
<p class="font-headline-md text-headline-md text-primary mt-1">Rp <?= number_format($stats['total_revenue'], 0, ',', '.') ?></p>
</div>
<div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-lg card-hover">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-primary p-2 bg-secondary-container rounded">pending_actions</span>
<span class="text-primary font-label-caps text-xs font-semibold">Active</span>
</div>
<p class="font-label-caps text-on-surface-variant text-[11px]">ACTIVE RENTALS</p>
<p class="font-headline-md text-headline-md text-primary mt-1"><?= sprintf('%02d', $stats['count_rented']) ?> Units</p>
</div>
<div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-lg card-hover">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-error p-2 bg-error-container/20 rounded">warning</span>
<span class="text-error font-label-caps text-xs font-semibold">Urgent</span>
</div>
<p class="font-label-caps text-on-surface-variant text-[11px]">MAINTENANCE DUE</p>
<p class="font-headline-md text-headline-md text-primary mt-1"><?= sprintf('%02d', $stats['count_maintenance']) ?> Units</p>
</div>
<div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-lg card-hover">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-primary p-2 bg-secondary-container rounded">assignment_turned_in</span>
<span class="text-on-surface-variant font-label-caps text-xs font-semibold">Inventory</span>
</div>
<p class="font-label-caps text-on-surface-variant text-[11px]">TOTAL INVENTORY</p>
<p class="font-headline-md text-headline-md text-primary mt-1"><?= sprintf('%02d', $stats['total_equipments']) ?> Units</p>
</div>
</div>

<!-- Main Content Split -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-grid-gutter">
<!-- Table Section: Daily Transactions & Active Rentals -->
<div class="lg:col-span-2 space-y-grid-gutter">
<!-- Daily Transactions Table -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
<div class="p-4 border-b border-outline-variant flex justify-between items-center">
<h3 class="font-headline-sm text-headline-sm font-bold text-primary">Daily Transactions</h3>
<a href="index.php?page=rentals" class="text-primary font-label-caps text-xs hover:underline font-bold">VIEW ALL</a>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left">
<thead class="bg-surface-container-low border-b border-outline-variant">
<tr>
<th class="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Order ID</th>
<th class="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Client</th>
<th class="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
<th class="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Amount</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/30">
<?php if (empty($recentRentals)): ?>
  <tr><td colspan="4" class="px-6 py-8 text-center text-on-surface-variant">No transactions today.</td></tr>
<?php else: ?>
  <?php foreach ($recentRentals as $rent): 
      $status = strtoupper($rent['status']);
      if ($status === 'COMPLETED' || $status === 'APPROVED' || $status === 'ON_GOING') {
          $badgeClass = 'bg-green-100 text-green-800';
          $statusText = $status === 'ON_GOING' ? 'ON GOING' : $status;
      } elseif ($status === 'PENDING') {
          $badgeClass = 'bg-secondary-fixed text-on-secondary-container';
          $statusText = 'PENDING';
      } else {
          $badgeClass = 'bg-error-container text-error';
          $statusText = $status;
      }
  ?>
  <tr class="table-row-zebra hover:bg-surface-variant/20 transition-colors">
    <td class="px-6 py-4 font-body-md text-on-surface font-semibold">#<?= htmlspecialchars($rent['order_id']) ?></td>
    <td class="px-6 py-4 font-body-md text-on-surface"><?= htmlspecialchars($rent['customer']) ?></td>
    <td class="px-6 py-4">
      <span class="px-2.5 py-1 <?= $badgeClass ?> rounded-full text-[10px] font-bold uppercase"><?= $statusText ?></span>
    </td>
    <td class="px-6 py-4 font-body-md text-primary font-bold">Rp <?= number_format($rent['amount'], 0, ',', '.') ?></td>
  </tr>
  <?php endforeach; ?>
<?php endif; ?>
</tbody>
</table>
</div>
</div>

<!-- Active Rental Summaries (Bento Cards) -->
<div>
<h3 class="font-headline-sm text-headline-sm font-bold text-primary mb-4">High-Value Rental Status</h3>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<div class="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex gap-4 card-hover">
<img class="w-20 h-20 rounded object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsP1hW_1EaUkzI7Wj8Lw6tHdem8Wh6qPFdU2SLc90RrAjgCLTqOGJ_AGdzYJe0KDVw29xBM1_4_UcE2c3RjTML-Yr0ksmpUXg2sHivwZ9GZKg5nJyNmhTA2ZHgvWCeVa1JaFf15NbqKsJu-h9ryGh_qpiOHqrJdga8Kbp-r50eMZqkUSddwykVpnIjrSaHscyqdm7fDouISFgJt8f2Rr9vtLlFC5A2iZ77t7zNTkmZdU5GuE1MzGuWO4eXfn9_ziFUEtwl2cL_99se">
<div class="flex-1">
<p class="font-label-caps text-[10px] text-on-surface-variant mb-1 font-bold">UNIT #EXCA-KOM-PC200-02</p>
<h4 class="font-body-md font-bold text-primary">Komatsu PC200-8</h4>
<div class="mt-2 flex items-center justify-between">
<span class="text-blue-600 font-label-caps text-[10px] bg-blue-50 px-2 py-0.5 rounded font-bold">IN USE</span>
<p class="text-[10px] text-on-surface-variant italic">Due: 05 Jun</p>
</div>
</div>
</div>
<div class="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex gap-4 card-hover">
<img class="w-20 h-20 rounded object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsP1hW_1EaUkzI7Wj8Lw6tHdem8Wh6qPFdU2SLc90RrAjgCLTqOGJ_AGdzYJe0KDVw29xBM1_4_UcE2c3RjTML-Yr0ksmpUXg2sHivwZ9GZKg5nJyNmhTA2ZHgvWCeVa1JaFf15NbqKsJu-h9ryGh_qpiOHqrJdga8Kbp-r50eMZqkUSddwykVpnIjrSaHscyqdm7fDouISFgJt8f2Rr9vtLlFC5A2iZ77t7zNTkmZdU5GuE1MzGuWO4eXfn9_ziFUEtwl2cL_99se">
<div class="flex-1">
<p class="font-label-caps text-[10px] text-on-surface-variant mb-1 font-bold">UNIT #EXCA-KOM-PC200-01</p>
<h4 class="font-body-md font-bold text-primary">Komatsu PC200-8</h4>
<div class="mt-2 flex items-center justify-between">
<span class="text-green-600 font-label-caps text-[10px] bg-green-50 px-2 py-0.5 rounded font-bold">AVAILABLE</span>
<p class="text-[10px] text-on-surface-variant italic">Ready for deploy</p>
</div>
</div>
</div>
</div>
</div>
</div>

<!-- Sidebar Content: Maintenance & Timeline -->
<div class="space-y-grid-gutter">
<!-- Upcoming Maintenance -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 card-hover">
<div class="flex items-center justify-between mb-6">
<h3 class="font-headline-sm text-headline-sm font-bold text-primary">Maintenance</h3>
<span class="material-symbols-outlined text-on-surface-variant">calendar_month</span>
</div>
<div class="space-y-4">
<?php if (empty($urgentMaintenance)): ?>
  <p class="text-on-surface-variant text-sm font-body-md">No scheduled maintenance tasks.</p>
<?php else: ?>
  <?php foreach ($urgentMaintenance as $maint): 
      $mStatus = strtoupper($maint['maintenance_status']);
  ?>
  <div class="flex gap-4 pb-4 border-b border-outline-variant border-dashed last:border-b-0 last:pb-0">
    <div class="flex flex-col items-center justify-center bg-surface-container-low rounded p-2 min-w-[50px] h-14">
      <span class="font-label-caps text-[10px] text-primary"><?= strtoupper(date('M', strtotime($maint['scheduled_date']))) ?></span>
      <span class="font-headline-sm text-primary font-bold leading-none mt-1"><?= date('d', strtotime($maint['scheduled_date'])) ?></span>
    </div>
    <div>
      <p class="font-body-md font-bold text-on-surface"><?= htmlspecialchars($maint['equipment_name']) ?></p>
      <p class="font-body-md text-on-surface-variant text-xs"><?= htmlspecialchars($maint['maintenance_type']) ?> - <?= htmlspecialchars($maint['description']) ?></p>
      <span class="mt-1 inline-block text-[9px] <?= $mStatus === 'OVERDUE' ? 'text-error bg-error-container/20' : 'text-primary bg-secondary-container' ?> font-bold px-1.5 py-0.5 rounded uppercase"><?= $mStatus ?></span>
    </div>
  </div>
  <?php endforeach; ?>
<?php endif; ?>
</div>
<a href="index.php?page=maintenance" class="w-full mt-6 py-2 border border-primary text-primary font-body-md rounded hover:bg-primary hover:text-white transition-all flex items-center justify-center font-bold active:scale-95">
                            Manage All Tasks
                        </a>
</div>

<!-- Operations Log -->
<div class="bg-primary text-white p-6 rounded-lg shadow-sm overflow-hidden relative card-hover">
<!-- Abstract Background Pattern -->
<div class="absolute inset-0 opacity-10 pointer-events-none">
<div class="absolute right-0 bottom-0 w-32 h-32 border-8 border-white rounded-full -mr-16 -mb-16"></div>
<div class="absolute right-4 top-4 w-12 h-12 border-2 border-white rotate-45 opacity-50"></div>
</div>
<h3 class="font-headline-sm text-headline-sm mb-4 relative z-10 font-bold text-white">Quick Support</h3>
<p class="font-body-md opacity-80 mb-6 relative z-10">Having issues with an equipment check-in? Contact technical support or view documentation.</p>
<div class="flex flex-col gap-2 relative z-10">
<a class="flex items-center gap-2 text-white/95 hover:text-white transition-colors" href="index.php?page=reports">
<span class="material-symbols-outlined text-[18px]">menu_book</span>
<span class="font-body-md border-b border-white/20">SOP Documentation</span>
</a>
<a class="flex items-center gap-2 text-white/95 hover:text-white transition-colors" href="https://wa.me/6282148564979" target="_blank">
<span class="material-symbols-outlined text-[18px]">support_agent</span>
<span class="font-body-md border-b border-white/20">Call Technician</span>
</a>
</div>
</div>
</div>
</div>
</div>
</main>

<!-- FAB for Quick Action (Staff Context) -->
<button class="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-50">
<span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">qr_code_scanner</span>
</button>

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

    // Simple Fade in for page load
    document.body.style.opacity = '0';
    window.addEventListener('DOMContentLoaded', () => {
        document.body.style.transition = 'opacity 0.45s cubic-bezier(0.25, 0.8, 0.25, 1)';
        document.body.style.opacity = '1';
    });
</script>
</body>
</html>
