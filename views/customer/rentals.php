<?php
$fullName = $_SESSION['full_name'] ?? 'Customer';
$role = $_SESSION['role'] ?? 'CUSTOMER';
$currentPage = 'customer_rentals';

if (!function_exists('getCustomerMenuClass')) {
    function getCustomerMenuClass($pageName, $currentPage) {
        if ($pageName === $currentPage) {
            return 'flex items-center gap-element-gap bg-secondary-container text-primary border-l-4 border-primary px-4 py-3 font-semibold transition-all cursor-pointer';
        }
        return 'flex items-center gap-element-gap text-on-surface-variant px-4 py-3 hover:bg-surface-container-highest transition-all cursor-pointer';
    }
}
if (!function_exists('getCustomerIconStyle')) {
    function getCustomerIconStyle($pageName, $currentPage) {
        if ($pageName === $currentPage) {
            return 'font-variation-settings: \'FILL\' 1;';
        }
        return '';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>SBS EquipRent - Rental Saya</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-primary-fixed-variant": "#1f477b",
                        "error": "#ba1a1a",
                        "primary": "#003366",
                        "inverse-primary": "#a7c8ff",
                        "on-primary-container": "#799dd6",
                        "outline": "#737780",
                        "surface-container-high": "#e6e8ea",
                        "surface": "#f7f9fb",
                        "tertiary-fixed-dim": "#89ceff",
                        "primary-fixed": "#d5e3ff",
                        "surface-variant": "#e0e3e5",
                        "on-secondary": "#ffffff",
                        "surface-tint": "#3a5f94",
                        "tertiary-fixed": "#c9e6ff",
                        "on-tertiary-fixed": "#001e2f",
                        "on-error-container": "#93000a",
                        "on-tertiary-container": "#0fa5e9",
                        "outline-variant": "#c3c6d1",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "error-container": "#ffdad6",
                        "background": "#f7f9fb",
                        "on-primary-fixed": "#001b3c",
                        "on-surface": "#191c1e",
                        "on-error": "#ffffff",
                        "on-secondary-container": "#57657a",
                        "inverse-on-surface": "#eff1f3",
                        "surface-container-low": "#f2f4f6",
                        "surface-container-highest": "#e0e3e5",
                        "secondary": "#515f74",
                        "primary-fixed-dim": "#a7c8ff",
                        "surface-container": "#eceef0",
                        "on-secondary-fixed-variant": "#3a485b",
                        "on-background": "#191c1e",
                        "tertiary": "#002133",
                        "on-secondary-fixed": "#0d1c2e",
                        "surface-dim": "#d8dadc",
                        "inverse-surface": "#2d3133",
                        "secondary-fixed-dim": "#b9c7df",
                        "secondary-container": "#d5e3fc",
                        "on-surface-variant": "#43474f",
                        "primary-container": "#003366",
                        "surface-container-lowest": "#ffffff",
                        "secondary-fixed": "#d5e3fc",
                        "on-tertiary-fixed-variant": "#004c6e",
                        "surface-bright": "#f7f9fb",
                        "tertiary-container": "#003751"
                    },
                    "spacing": {
                        "sidebar-width": "260px",
                        "base": "4px",
                        "grid-gutter": "20px",
                        "container-padding": "24px",
                        "element-gap": "16px"
                    },
                    "fontFamily": {
                        "headline-md": ["Hanken Grotesk"],
                        "label-caps": ["JetBrains Mono"],
                        "display-lg": ["Hanken Grotesk"],
                        "body-md": ["Hanken Grotesk"],
                        "table-header": ["Hanken Grotesk"],
                        "body-lg": ["Hanken Grotesk"],
                        "headline-sm": ["Hanken Grotesk"]
                    },
                    "fontSize": {
                        "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                        "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500"}],
                        "display-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                        "table-header": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
                        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                        "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}]
                    }
                },
            },
        }
</script>
<style>
        body { font-family: 'Hanken Grotesk', sans-serif; background-color: #f7f9fb; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .card-hover { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
</style>
</head>
<body class="bg-background text-on-background">

<!-- Sidebar Navigation -->
<aside id="sidebarMenu" class="fixed left-0 top-0 h-full w-sidebar-width bg-surface-container-low border-r border-outline-variant z-40 hidden md:flex flex-col py-6">
<div class="px-6 mb-8 flex flex-col items-start">
  <div class="flex items-center gap-3 mb-2">
      <div class="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
          <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">construction</span>
      </div>
      <div>
          <h1 class="font-headline-sm text-headline-sm font-bold text-primary">SBS EquipRent</h1>
          <p class="font-label-caps text-label-caps text-on-surface-variant opacity-70 uppercase tracking-wider">Customer Portal</p>
      </div>
  </div>
</div>
<nav class="flex-grow px-2 space-y-1">
  <a class="<?= getCustomerMenuClass('customer_dashboard', $currentPage) ?>" href="index.php?page=customer_dashboard">
    <span class="material-symbols-outlined" style="<?= getCustomerIconStyle('customer_dashboard', $currentPage) ?>">dashboard</span>
    <span class="font-body-md text-body-md">Dashboard</span>
  </a>
  <a class="<?= getCustomerMenuClass('customer_rentals', $currentPage) ?>" href="index.php?page=customer_rentals">
    <span class="material-symbols-outlined" style="<?= getCustomerIconStyle('customer_rentals', $currentPage) ?>">construction</span>
    <span class="font-body-md text-body-md">Rental Saya</span>
  </a>
  <a class="<?= getCustomerMenuClass('customer_payments', $currentPage) ?>" href="index.php?page=customer_payments">
    <span class="material-symbols-outlined" style="<?= getCustomerIconStyle('customer_payments', $currentPage) ?>">payments</span>
    <span class="font-body-md text-body-md">Pembayaran Saya</span>
  </a>
  <a class="<?= getCustomerMenuClass('customer_contracts', $currentPage) ?>" href="index.php?page=customer_contracts">
    <span class="material-symbols-outlined" style="<?= getCustomerIconStyle('customer_contracts', $currentPage) ?>">description</span>
    <span class="font-body-md text-body-md">Kontrak Saya</span>
  </a>
  <a class="<?= getCustomerMenuClass('customer_profile', $currentPage) ?>" href="index.php?page=customer_profile">
    <span class="material-symbols-outlined" style="<?= getCustomerIconStyle('customer_profile', $currentPage) ?>">person</span>
    <span class="font-body-md text-body-md">Profil</span>
  </a>
</nav>
<div class="px-2 mt-auto">
  <a class="flex items-center gap-element-gap text-on-surface-variant px-4 py-3 hover:bg-surface-container-highest transition-all cursor-pointer" href="index.php?page=customer_profile">
    <span class="material-symbols-outlined">settings</span>
    <span class="font-body-md text-body-md">Settings</span>
  </a>
  <a class="flex items-center gap-element-gap text-error px-4 py-3 hover:bg-error-container transition-all cursor-pointer font-semibold" href="index.php?page=logout">
    <span class="material-symbols-outlined">logout</span>
    <span class="font-body-md text-body-md">Logout</span>
  </a>
</div>
</aside>

<!-- Top App Bar -->
<header class="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-30 flex justify-between items-center h-16 px-container-padding w-full">
  <div class="flex items-center gap-4">
    <button id="sidebarToggleBtn" class="md:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors"><span class="material-symbols-outlined">menu</span></button>
    <h2 class="font-headline-md text-headline-md font-bold text-primary">Rental Saya</h2>
  </div>
  <div class="flex items-center gap-6">
    <div class="hidden sm:flex items-center bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant">
      <span class="material-symbols-outlined text-on-surface-variant mr-2">search</span>
      <input id="searchInputField" class="bg-transparent border-none focus:ring-0 text-body-md font-body-md w-48 p-0" placeholder="Cari rental atau kontrak..." type="text">
    </div>
    
    <div class="flex items-center gap-4 relative">
      <!-- Notifications -->
      <div class="relative">
        <button id="notiBellBtn" class="relative p-2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none">
          <span class="material-symbols-outlined">notifications</span>
          <span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
        </button>
        <!-- Notifications Dropdown -->
        <div id="notiDropdownMenu" class="hidden absolute right-0 top-12 w-80 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-3 z-50 text-left">
          <div class="px-4 pb-2 border-b border-outline-variant flex justify-between items-center">
            <span class="font-body-md font-bold text-primary">Notifikasi Pelanggan</span>
            <span class="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">Terbaru</span>
          </div>
          <div class="max-h-60 overflow-y-auto">
            <div class="px-4 py-3 hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
              <p class="text-body-md font-semibold text-on-surface">Kontrak Siap Ditandatangani</p>
              <p class="text-xs text-on-surface-variant mt-0.5">Kontrak #CTR-SBS-20260520-002 sudah dapat ditinjau dan ditandatangani.</p>
              <p class="text-[10px] text-primary mt-1">Baru saja</p>
            </div>
            <div class="px-4 py-3 hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
              <p class="text-body-md font-semibold text-on-surface">Pembayaran Berhasil Diverifikasi</p>
              <p class="text-xs text-on-surface-variant mt-0.5">Pembayaran PAY-SBS-20260505-001 sebesar Rp 77.500.000 dinyatakan LUNAS.</p>
              <p class="text-[10px] text-primary mt-1">1 hari yang lalu</p>
            </div>
          </div>
          <div class="px-4 pt-2 text-center">
            <a href="index.php?page=customer_contracts" class="text-xs text-primary font-bold hover:underline">Lihat Semua Dokumen</a>
          </div>
        </div>
      </div>

      <!-- Help Button -->
      <button id="helpOutlineBtn" class="p-2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none">
        <span class="material-symbols-outlined">help</span>
      </button>

      <div class="h-8 w-[1px] bg-outline-variant mx-1"></div>

      <!-- Profile Dropdown -->
      <div class="relative">
        <button id="profileDropBtn" class="flex items-center gap-3 group focus:outline-none cursor-pointer">
          <div class="text-right hidden lg:block">
            <p class="font-body-md text-body-md font-semibold text-on-surface group-hover:text-primary transition-colors"><?= htmlspecialchars($fullName) ?></p>
            <p class="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider"><?= htmlspecialchars($role) ?></p>
          </div>
          <img alt="User Avatar" class="w-9 h-9 rounded-full border-2 border-outline-variant group-hover:border-primary transition-colors object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoQeKBkKsxQD4SfqHlG3715YcMNwSgAWprGZUKJsuiGM-yoQR9OSPldXr4grXgHuyS6VWEAHtg5h4qXKJOtMxVtKMR9gy5QM2gbDBTquih4q40dpli_OUYL9HzTWQPPfmTJNsFJrntX02WF_N_oozsdWyLpvV83VuepMPSrBFMEaXkqaq85VaOUoOuyT1i5kIXI0AzyP7Lvd0XgFvjEnEHX7LbPV53ddFQceRmCux0h6FtCpJU0fQyag8q7q_vLFspNAIr5DmM7c5R">
        </button>
        <!-- Dropdown Menu -->
        <div id="profileDropdownMenu" class="hidden absolute right-0 top-12 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-2 z-50 text-left">
          <div class="px-4 py-2 border-b border-outline-variant lg:hidden">
            <p class="font-body-md text-body-md font-bold text-primary"><?= htmlspecialchars($fullName) ?></p>
            <p class="text-[10px] text-on-surface-variant font-semibold uppercase"><?= htmlspecialchars($role) ?></p>
          </div>
          <a href="index.php?page=customer_profile" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
            <span class="material-symbols-outlined text-sm">person</span>
            <span>Profil Saya</span>
          </a>
          <a href="index.php?page=customer_contracts" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
            <span class="material-symbols-outlined text-sm">description</span>
            <span>Kontrak Saya</span>
          </a>
          <a href="index.php?page=customer_payments" class="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
            <span class="material-symbols-outlined text-sm">payments</span>
            <span>Pembayaran</span>
          </a>
          <div class="border-t border-outline-variant my-1"></div>
          <a href="index.php?page=logout" class="flex items-center gap-2 px-4 py-2 text-body-md text-error hover:bg-error-container/20 transition-colors font-semibold">
            <span class="material-symbols-outlined text-sm">logout</span>
            <span>Logout</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</header>

<!-- Main Content -->
<main class="md:ml-sidebar-width pt-20 min-h-screen">
<div class="p-container-padding space-y-8">
<!-- Statistics Header Grid -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-grid-gutter">
<div class="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant card-hover">
<p class="text-on-surface-variant font-table-header text-table-header mb-1">Total Rental</p>
<div class="flex items-end gap-2">
<span class="font-headline-md text-headline-md"><?= sprintf('%02d', $stats['total']) ?></span>
<span class="text-xs text-primary font-bold mb-1">Unit</span>
</div>
</div>
<div class="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant card-hover">
<p class="text-on-surface-variant font-table-header text-table-header mb-1">Aktif &amp; Berjalan</p>
<div class="flex items-end gap-2">
<span class="font-headline-md text-headline-md text-primary"><?= sprintf('%02d', $stats['active']) ?></span>
<span class="text-xs text-primary font-bold mb-1">Kontrak</span>
</div>
</div>
<div class="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant card-hover">
<p class="text-on-surface-variant font-table-header text-table-header mb-1">Selesai</p>
<div class="flex items-end gap-2">
<span class="font-headline-md text-headline-md"><?= sprintf('%02d', $stats['completed']) ?></span>
<span class="text-xs text-on-surface-variant mb-1">Unit</span>
</div>
</div>
<div class="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant card-hover">
<p class="text-error font-table-header text-table-header mb-1">Terlambat Kembali</p>
<div class="flex items-end gap-2">
<span class="font-headline-md text-headline-md text-error"><?= sprintf('%02d', $stats['overdue']) ?></span>
<span class="text-xs text-error font-bold mb-1">Unit</span>
</div>
</div>
</div>

<!-- Active Rentals Section -->
<section class="space-y-4">
<div class="flex justify-between items-center">
<h2 class="font-headline-sm text-headline-sm text-primary">Rental Aktif &amp; Berjalan</h2>
<span class="text-xs font-semibold px-2 py-1 bg-surface-container rounded text-on-surface-variant">Real-time Telemetry</span>
</div>
<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-grid-gutter">
<?php if (empty($activeRentals)): ?>
  <div class="col-span-full bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center">
    <span class="material-symbols-outlined text-[48px] text-outline mb-2 block">construction</span>
    <p class="font-body-md text-on-surface-variant">Belum ada rental aktif saat ini.</p>
  </div>
<?php else: ?>
  <?php foreach ($activeRentals as $rental):
    $daysRemaining = max(0, (int)$rental['days_remaining']);
    $totalDuration = max(1, (int)$rental['total_duration']);
    $progress = min(100, max(0, round((($totalDuration - $daysRemaining) / $totalDuration) * 100)));
    $isUrgent = $daysRemaining <= 3;
    $barColor = $isUrgent ? 'bg-error' : 'bg-primary';
    $textColor = $isUrgent ? 'text-error' : 'text-primary';

    $imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXzcuCTiQeahjjr9dltpkTagkAdDEcQw-P2Z2Z3S-5hAwhDn8SBp86XGHnS7ILinmBRS0Xh5WH16lCac1TCxY4XsW6Uy4Hvkji9P0NlHeYKmamP8MhC9DR0BQcofr-LXTcY37tVfRuZsn1kNy5LKuYFzHUgWFAd_t4HIBEdNB1vRuXSDILUWjM-WaQSWqMub_Qcp4jo6bW_oz68b_q-zjGB23F_1GLv-wQvF6XtuNxEj8D4AhrMyYy4ZFPntHoup96LMReook7tDsB';
    $eqType = strtolower($rental['equipment_type'] ?? '');
    if (strpos($eqType, 'roller') !== false || strpos($eqType, 'vibra') !== false) {
      $imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfFN_H7SEDUl2E4upKS-91bRB03ZNRdTbJ8oYJKwhqSttn4cJSPKvlTh0YnjTs34RpEe4BZd1mGgZ3T03igHTqx1NdbiHqcuZ1PMNEwIZdXAHYKiiYHQ84IWiW3XjqpaSJpKjwejd5RPlb89z51mBltdZF2Qs4eVAO0pbV7e17F1vLh7eJoxuJQ1id7TQQ60udn8iN1qy0CCFSPezFUQTVb5zxp8PqYSI_npu984gsVqDdWTFT83W39-Kwg14-jpiYWmzWWmggLtdl';
    }
  ?>
  <div class="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden group card-hover">
    <div class="h-48 relative overflow-hidden">
      <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="<?= $imgUrl ?>" alt="<?= htmlspecialchars($rental['equipment_name']) ?>"/>
      <div class="absolute top-3 left-3 px-3 py-1 bg-primary/90 text-on-primary font-label-caps text-label-caps rounded backdrop-blur-sm">ID: <?= htmlspecialchars($rental['equipment_code']) ?></div>
      <div class="absolute top-3 right-3 px-3 py-1 bg-tertiary-container text-on-tertiary-container font-label-caps text-label-caps rounded-full text-[10px] uppercase font-bold"><?= htmlspecialchars($rental['status']) ?></div>
    </div>
    <div class="p-5 space-y-4">
      <div>
        <h3 class="font-headline-sm text-headline-sm text-primary mb-1"><?= htmlspecialchars($rental['equipment_name']) ?></h3>
        <div class="flex items-center gap-1.5 text-on-surface-variant">
          <span class="material-symbols-outlined text-lg">location_on</span>
          <span class="text-body-md font-body-md"><?= htmlspecialchars($rental['notes'] ?: 'Banjarmasin, Kalsel') ?></span>
        </div>
      </div>
      <div class="space-y-2">
        <div class="flex justify-between text-body-md">
          <span class="text-on-surface-variant font-medium">Sisa Waktu</span>
          <span class="font-bold <?= $textColor ?>"><?= $daysRemaining ?> Hari Lagi</span>
        </div>
        <div class="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
          <div class="h-full <?= $barColor ?>" style="width: <?= $progress ?>%"></div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 pt-2">
        <button onclick="openDailyLogModal('<?= htmlspecialchars($rental['equipment_name']) ?>', '<?= htmlspecialchars($rental['equipment_code']) ?>', <?= htmlspecialchars($rental['hour_meter'] ?? '1380') ?>)" class="py-2.5 px-4 border border-outline-variant rounded-lg font-body-md text-body-md hover:bg-surface-variant transition-colors cursor-pointer">Log Harian</button>
        <button onclick="openExtendRentalModal('<?= htmlspecialchars($rental['equipment_name']) ?>', '<?= htmlspecialchars($rental['equipment_code']) ?>', '<?= htmlspecialchars($rental['rental_code']) ?>', '<?= $rental['end_date'] ?>')" class="py-2.5 px-4 bg-primary text-on-primary rounded-lg font-body-md text-body-md hover:opacity-90 transition-opacity cursor-pointer">Perpanjang</button>
      </div>
    </div>
  </div>
  <?php endforeach; ?>
<?php endif; ?>
</div>
</section>

<!-- Completed Rentals History Table -->
<section class="space-y-4 pb-20">
<div class="flex justify-between items-center">
<h2 class="font-headline-sm text-headline-sm text-primary">Riwayat Rental Selesai</h2>
<button class="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded hover:bg-surface-container transition-colors">
<span class="material-symbols-outlined text-lg">filter_list</span>
<span class="text-body-md font-body-md">Filter</span>
</button>
</div>
<div class="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden">
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container border-b border-outline-variant">
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Unit Rental</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">ID Kontrak</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Tanggal Mulai</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Tanggal Selesai</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant">
<?php if (empty($completedRentals)): ?>
  <tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant font-body-md">Belum ada riwayat rental selesai.</td></tr>
<?php else: ?>
  <?php foreach ($completedRentals as $comp):
    $isCancelled = $comp['status'] === 'CANCELLED';
    $statusClass = $isCancelled ? 'bg-error-container text-error' : 'bg-surface-variant text-on-surface-variant';
    $statusText = $isCancelled ? 'BATAL' : 'SELESAI';
  ?>
  <tr class="hover:bg-surface-container-low transition-colors">
    <td class="px-6 py-4 font-body-md text-body-md">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
          <span class="material-symbols-outlined text-primary">construction</span>
        </div>
        <div>
          <div class="font-semibold text-primary"><?= htmlspecialchars($comp['equipment_name']) ?></div>
          <div class="text-xs text-on-surface-variant"><?= htmlspecialchars($comp['brand']) ?> <?= htmlspecialchars($comp['equipment_model']) ?></div>
        </div>
      </div>
    </td>
    <td class="px-6 py-4 font-body-md text-body-md font-label-caps text-label-caps">#<?= htmlspecialchars($comp['contract_code'] ?: 'N/A') ?></td>
    <td class="px-6 py-4 font-body-md text-body-md"><?= date('d M Y', strtotime($comp['start_date'])) ?></td>
    <td class="px-6 py-4 font-body-md text-body-md"><?= date('d M Y', strtotime($comp['end_date'])) ?></td>
    <td class="px-6 py-4">
      <span class="px-3 py-1 <?= $statusClass ?> rounded-full font-label-caps text-[10px] font-bold"><?= $statusText ?></span>
    </td>
    <td class="px-6 py-4 text-right">
      <button onclick="window.location.href='index.php?page=customer_contracts'" class="text-primary hover:text-on-primary-container p-2 rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer" title="Lihat Detail Kontrak Resmi">
        <span class="material-symbols-outlined">visibility</span>
      </button>
    </td>
  </tr>
  <?php endforeach; ?>
<?php endif; ?>
</tbody>
</table>
</div>
</div>
</section>
</div>
</main>

<!-- Contextual FAB -->
<button onclick="openNewLeaseModal()" class="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-30 cursor-pointer">
  <span class="material-symbols-outlined text-3xl text-white">add</span>
  <div class="absolute right-full mr-4 px-3 py-2 bg-inverse-surface text-inverse-on-surface rounded text-body-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
    Sewa Alat Baru
  </div>
</button>

<!-- Help Modal Dialog -->
<div id="helpModalDialog" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative m-4 animate-fade-in">
    <button id="closeHelpModalCross" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-4">
      <div class="bg-primary-container p-2.5 rounded-lg text-primary flex items-center justify-center">
        <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">help</span>
      </div>
      <div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Bantuan SBS EquipRent</h3>
        <p class="text-xs text-on-surface-variant">Customer Portal Guidance System</p>
      </div>
    </div>
    <div class="space-y-3 text-body-md text-on-surface">
      <p>Selamat datang di portal pelanggan <strong>SBS EquipRent</strong> (PT. SURYA BANGUN SARANA BANJARMASIN).</p>
      <ul class="list-disc list-inside space-y-1 text-on-surface-variant pl-2">
        <li><strong>Dashboard</strong>: Ringkasan sewa aktif, tagihan berjalan, dan aktivitas terkini Anda.</li>
        <li><strong>Rental Saya</strong>: Lihat status detail rental real-time dan log harian.</li>
        <li><strong>Pembayaran Saya</strong>: Unggah bukti transfer invoice dan bayar tagihan.</li>
        <li><strong>Kontrak Saya</strong>: Tinjau dan tandatangani dokumen hukum sewa secara digital.</li>
        <li><strong>Profil</strong>: Manajemen akun dan detail legalitas perpajakan perusahaan.</li>
      </ul>
      <p class="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant">Butuh bantuan operasional? Hubungi Hotline SBS atau Account Manager Anda Hendra Wijaya.</p>
    </div>
    <div class="mt-6 text-right">
      <button id="closeHelpModalOk" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md cursor-pointer">Saya Mengerti</button>
    </div>
  </div>
</div>

<!-- Daily Log Modal (Log Harian) -->
<div id="dailyLogModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in">
    <button onclick="closeDailyLogModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-4">
      <div class="bg-primary-container p-2.5 rounded-lg text-white flex items-center justify-center">
        <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">history</span>
      </div>
      <div>
        <h3 id="dailyLogEquipName" class="font-headline-sm text-headline-sm font-bold text-primary">Hydraulic Excavator</h3>
        <p id="dailyLogEquipCode" class="text-xs text-on-surface-variant">EXCA-KOM-PC200-02</p>
      </div>
    </div>
    
    <div class="space-y-4">
      <div class="grid grid-cols-3 gap-2 bg-surface-container-low p-3 rounded-lg text-center">
        <div>
          <p class="text-[10px] text-on-surface-variant font-label-caps uppercase">Total Hour Meter</p>
          <p id="dailyLogCurrentHM" class="font-body-lg font-bold text-primary">2,410.8 hrs</p>
        </div>
        <div>
          <p class="text-[10px] text-on-surface-variant font-label-caps uppercase">Engine Status</p>
          <p class="font-body-lg font-bold text-green-700 flex items-center justify-center gap-1"><span class="w-2 h-2 bg-green-700 rounded-full animate-pulse"></span> ON</p>
        </div>
        <div>
          <p class="text-[10px] text-on-surface-variant font-label-caps uppercase">Fuel Status</p>
          <p class="font-body-lg font-bold text-primary">75.3%</p>
        </div>
      </div>

      <div>
        <h4 class="text-xs font-bold text-primary mb-2 uppercase font-label-caps">Riwayat Akumulasi 5 Hari Terakhir</h4>
        <div class="overflow-x-auto max-h-48 border border-outline-variant rounded-lg">
          <table class="w-full text-left text-xs">
            <thead class="bg-surface-container-low">
              <tr>
                <th class="p-2 border-b border-outline-variant text-[10px]">Tanggal</th>
                <th class="p-2 border-b border-outline-variant text-[10px]">Start HM</th>
                <th class="p-2 border-b border-outline-variant text-[10px]">End HM</th>
                <th class="p-2 border-b border-outline-variant text-[10px]">Alokasi Jam</th>
                <th class="p-2 border-b border-outline-variant text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody id="dailyLogTableBody">
              <!-- Dynamically populated via Javascript -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div class="mt-6 text-right flex justify-end gap-2">
      <button onclick="window.print()" class="px-4 py-2 border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-container-low transition-colors cursor-pointer">Cetak Log</button>
      <button onclick="closeDailyLogModal()" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md cursor-pointer">Selesai</button>
    </div>
  </div>
</div>

<!-- Extend Rental Lease Modal (Perpanjang) -->
<div id="extendRentalModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative m-4 animate-fade-in">
    <button onclick="closeExtendRentalModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-4">
      <div class="bg-primary-container p-2.5 rounded-lg text-white flex items-center justify-center">
        <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">more_time</span>
      </div>
      <div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Perpanjang Masa Sewa</h3>
        <p class="text-xs text-on-surface-variant">PT. SURYA BANGUN SARANA</p>
      </div>
    </div>
    
    <form id="extendRentalForm" onsubmit="submitExtendRentalForm(event)" class="space-y-4">
      <div class="p-3 bg-surface-container-low rounded-lg space-y-1">
        <div class="flex justify-between text-xs"><span class="text-on-surface-variant">Nama Alat:</span><span id="extendEquipName" class="font-bold text-primary">Excavator Komatsu</span></div>
        <div class="flex justify-between text-xs"><span class="text-on-surface-variant">Kode Unit:</span><span id="extendEquipCode" class="font-bold text-primary">EXCA-KOM-PC200-02</span></div>
        <div class="flex justify-between text-xs"><span class="text-on-surface-variant">Kode Rental:</span><span id="extendRentalCode" class="font-bold text-primary">RNT-SBS-001</span></div>
        <div class="flex justify-between text-xs"><span class="text-on-surface-variant">Selesai Kontrak:</span><span id="extendEndDateCurrent" class="font-bold text-error">05 Jun 2026</span></div>
      </div>

      <div>
        <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Tambahan Durasi Sewa</label>
        <select id="extendDaysSelect" onchange="calculateExtensionCost()" class="w-full border border-outline-variant p-2.5 rounded-lg text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary">
          <option value="7">7 Hari (1 Minggu)</option>
          <option value="14">14 Hari (2 Minggu)</option>
          <option value="30" selected>30 Hari (1 Bulan)</option>
          <option value="60">60 Hari (2 Bulan)</option>
        </select>
      </div>

      <div class="p-3 bg-primary-container text-white rounded-lg space-y-1">
        <div class="flex justify-between text-xs"><span>Estimasi Tgl Selesai Baru:</span><span id="extendNewEndDate" class="font-bold text-secondary-fixed">05 Jul 2026</span></div>
        <div class="flex justify-between text-xs"><span>Estimasi Tambahan Biaya:</span><span id="extendNewCost" class="font-bold text-secondary-fixed">Rp 75.000.000</span></div>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeExtendRentalModal()" class="px-4 py-2.5 border border-outline-variant text-on-surface rounded-lg text-body-md font-semibold hover:bg-surface-container-low transition-colors cursor-pointer">Batal</button>
        <button type="submit" class="bg-primary text-white px-5 py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-body-md cursor-pointer">Kirim Pengajuan</button>
      </div>
    </form>
  </div>
</div>

<!-- New Lease Request Modal (Sewa Alat Baru) -->
<div id="newLeaseRequestModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in">
    <button onclick="closeNewLeaseModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-4">
      <div class="bg-primary-container p-2.5 rounded-lg text-white flex items-center justify-center">
        <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">add_shopping_cart</span>
      </div>
      <div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Pengajuan Sewa Alat Baru</h3>
        <p class="text-xs text-on-surface-variant">PT. SURYA BANGUN SARANA</p>
      </div>
    </div>
    
    <form id="newLeaseRequestForm" onsubmit="submitNewLeaseForm(event)" class="space-y-4 text-left">
      <div>
        <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Pilih Kategori Alat Berat</label>
        <select id="leaseEquipType" class="w-full border border-outline-variant p-2.5 rounded-lg text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary">
          <option value="Hydraulic Excavator Komatsu PC200">Hydraulic Excavator Komatsu PC200</option>
          <option value="Vibratory Roller Sakai SV515D">Vibratory Roller Sakai SV515D</option>
          <option value="Bulldozer Caterpillar D6R">Bulldozer Caterpillar D6R</option>
          <option value="Crawler Crane Kobelco CKL1000">Crawler Crane Kobelco CKL1000</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Tanggal Mulai Sewa</label>
          <input type="date" required id="leaseStartDate" class="w-full border border-outline-variant p-2 rounded-lg text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary">
        </div>
        <div>
          <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Durasi Sewa (Hari)</label>
          <select id="leaseDurationDays" class="w-full border border-outline-variant p-2.5 rounded-lg text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary">
            <option value="7">7 Hari (1 Minggu)</option>
            <option value="14">14 Hari (2 Minggu)</option>
            <option value="30" selected>30 Hari (1 Bulan)</option>
            <option value="90">90 Hari (3 Bulan)</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Lokasi Proyek / Pekerjaan</label>
        <input type="text" required id="leaseProjectLocation" placeholder="Contoh: Proyek Jalan Liang Anggang, Banjarbaru" class="w-full border border-outline-variant p-2.5 rounded-lg text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary">
      </div>

      <div>
        <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Catatan Tambahan</label>
        <textarea id="leaseNotes" rows="2" placeholder="Tuliskan spesifikasi operasional tambahan..." class="w-full border border-outline-variant p-2.5 rounded-lg text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary"></textarea>
      </div>

      <div class="p-3 bg-surface-container-low rounded-lg text-[10px] text-on-surface-variant">
        <p><strong>Info Prosedur:</strong> Setelah Anda mengirim pengajuan, Admin PT. SBS akan memverifikasi kesediaan unit, menerbitkan draf kontrak, dan mengirim notifikasi email ke Anda.</p>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeNewLeaseModal()" class="px-4 py-2.5 border border-outline-variant text-on-surface rounded-lg text-body-md font-semibold hover:bg-surface-container-low transition-colors cursor-pointer">Batal</button>
        <button type="submit" class="bg-primary text-white px-5 py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-body-md cursor-pointer">Kirim Permintaan Sewa</button>
      </div>
    </form>
  </div>
</div>

<script>
// dailyLogModal functions
function openDailyLogModal(name, code, hm) {
    document.getElementById('dailyLogEquipName').innerText = name;
    document.getElementById('dailyLogEquipCode').innerText = code;
    document.getElementById('dailyLogCurrentHM').innerText = parseFloat(hm).toLocaleString('id-ID') + ' hrs';
    
    // Populate last 5 days daily log history dynamically based on HM
    const tableBody = document.getElementById('dailyLogTableBody');
    tableBody.innerHTML = '';
    const today = new Date();
    let currentHM = parseFloat(hm);
    
    for (let i = 0; i < 5; i++) {
        const logDate = new Date();
        logDate.setDate(today.getDate() - i);
        const dateStr = logDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        
        const hoursWorked = (5 + Math.random() * 4).toFixed(1); // 5 to 9 working hours
        const startHM = (currentHM - parseFloat(hoursWorked)).toFixed(2);
        const endHM = currentHM.toFixed(2);
        currentHM = parseFloat(startHM);
        
        tableBody.innerHTML += `
            <tr class="hover:bg-surface-container-low transition-colors">
                <td class="p-2 border-b border-outline-variant/30">${dateStr}</td>
                <td class="p-2 border-b border-outline-variant/30 font-mono">${startHM}</td>
                <td class="p-2 border-b border-outline-variant/30 font-mono">${endHM}</td>
                <td class="p-2 border-b border-outline-variant/30 font-bold text-primary font-mono">+${hoursWorked} hrs</td>
                <td class="p-2 border-b border-outline-variant/30"><span class="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[9px] font-bold">VERIFIED</span></td>
            </tr>
        `;
    }
    
    document.getElementById('dailyLogModal').classList.remove('hidden');
}

function closeDailyLogModal() {
    document.getElementById('dailyLogModal').classList.add('hidden');
}

// extendRentalModal functions
let activeRentalPricePerDay = 2500000; // fallback default
function openExtendRentalModal(name, code, rentalCode, endDate) {
    document.getElementById('extendEquipName').innerText = name;
    document.getElementById('extendEquipCode').innerText = code;
    document.getElementById('extendRentalCode').innerText = rentalCode;
    
    const endD = new Date(endDate);
    document.getElementById('extendEndDateCurrent').innerText = endD.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // Set active daily price based on unit type
    const lowerName = name.toLowerCase();
    if (lowerName.includes('excavator')) activeRentalPricePerDay = 2500000;
    else if (lowerName.includes('roller') || lowerName.includes('sakai')) activeRentalPricePerDay = 1800000;
    else if (lowerName.includes('bulldozer')) activeRentalPricePerDay = 3200000;
    else activeRentalPricePerDay = 2200000;
    
    calculateExtensionCost();
    document.getElementById('extendRentalModal').classList.remove('hidden');
}

function closeExtendRentalModal() {
    document.getElementById('extendRentalModal').classList.add('hidden');
}

function calculateExtensionCost() {
    const days = parseInt(document.getElementById('extendDaysSelect').value);
    const cost = days * activeRentalPricePerDay;
    document.getElementById('extendNewCost').innerText = 'Rp ' + cost.toLocaleString('id-ID');
    
    // Calculate new estimated end date
    const daysOffset = days + 3;
    const currentEndD = new Date();
    currentEndD.setDate(currentEndD.getDate() + daysOffset); // mock new end date
    document.getElementById('extendNewEndDate').innerText = currentEndD.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function submitExtendRentalForm(e) {
    e.preventDefault();
    closeExtendRentalModal();
    alert('Pengajuan perpanjangan masa sewa berhasil dikirim! Staff kami akan segera memproses addendum kontrak Anda.');
}

// newLeaseRequestModal functions
function openNewLeaseModal() {
    // Set default date picker to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('leaseStartDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('newLeaseRequestModal').classList.remove('hidden');
}

function closeNewLeaseModal() {
    document.getElementById('newLeaseRequestModal').classList.add('hidden');
}

function submitNewLeaseForm(e) {
    e.preventDefault();
    const type = document.getElementById('leaseEquipType').value;
    const date = document.getElementById('leaseStartDate').value;
    const duration = document.getElementById('leaseDurationDays').value;
    const loc = document.getElementById('leaseProjectLocation').value;
    
    closeNewLeaseModal();
    alert(`Sukses! Permintaan sewa unit ${type} untuk durasi ${duration} hari pada tanggal ${date} di ${loc} telah sukses dikirim.`);
}

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Sidebar Toggle
    const sidebar = document.getElementById('sidebarMenu');
    const toggleBtn = document.getElementById('sidebarToggleBtn');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('flex');
        });
    }

    // Hide mobile sidebar on clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 768 && sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn) {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('flex');
        }
    });

    // Profile Dropdown
    const profileBtn = document.getElementById('profileDropBtn');
    const profileMenu = document.getElementById('profileDropdownMenu');
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('hidden');
            const notiMenu = document.getElementById('notiDropdownMenu');
            if (notiMenu) notiMenu.classList.add('hidden');
        });
    }

    // Notifications Dropdown
    const notiBtn = document.getElementById('notiBellBtn');
    const notiMenu = document.getElementById('notiDropdownMenu');
    if (notiBtn && notiMenu) {
        notiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notiMenu.classList.toggle('hidden');
            if (profileMenu) profileMenu.classList.add('hidden');
        });
    }

    // Close Dropdowns on clicking outside
    document.addEventListener('click', () => {
        if (profileMenu) profileMenu.classList.add('hidden');
        if (notiMenu) notiMenu.classList.add('hidden');
    });

    // Help Modal
    const helpBtn = document.getElementById('helpOutlineBtn');
    const helpModal = document.getElementById('helpModalDialog');
    const closeHelpCross = document.getElementById('closeHelpModalCross');
    const closeHelpOk = document.getElementById('closeHelpModalOk');

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

    // Search input client-side filtering
    const searchInput = document.getElementById('searchInputField');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            // 1. Filter active grid items
            const activeCards = document.querySelectorAll('.grid > div.overflow-hidden.group.card-hover');
            activeCards.forEach(card => {
                const name = card.querySelector('h3').innerText.toLowerCase();
                const code = card.querySelector('div.bg-primary\\/90').innerText.toLowerCase();
                const notes = card.querySelector('span.text-body-md').innerText.toLowerCase();
                
                if (name.includes(query) || code.includes(query) || notes.includes(query)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });

            // 2. Filter completed rental table rows
            const tableRows = document.querySelectorAll('tbody tr');
            tableRows.forEach(row => {
                // skip empty state row
                if (row.cells.length === 1) return;
                
                const unitCell = row.cells[0].innerText.toLowerCase();
                const contractCell = row.cells[1].innerText.toLowerCase();
                
                if (unitCell.includes(query) || contractCell.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});
</script>
</body>
</html>
