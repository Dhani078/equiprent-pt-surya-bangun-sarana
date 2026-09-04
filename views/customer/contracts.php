<?php
$fullName = $_SESSION['full_name'] ?? 'Customer';
$role = $_SESSION['role'] ?? 'CUSTOMER';
$currentPage = 'customer_contracts';

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
<title>SBS EquipRent - Kontrak Saya</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
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
        .table-row-zebra:nth-child(even) { background-color: #f2f4f6; }

        /* Premium Print Styling & Layout Aligned with Skripsi Guidelines */
        @media print {
            body {
                background: #ffffff !important;
                color: #000000 !important;
                font-family: 'Hanken Grotesk', 'Inter', sans-serif !important;
            }
            /* Hide all layout elements of the screen dashboard */
            aside, header, main, button, select, #helpModalDialog, #contractDetailModal, #newContractModal, .fixed, #signatureSection {
                display: none !important;
                visibility: hidden !important;
            }
            
            #printOnlyReport {
                display: block !important;
                visibility: visible !important;
                background: #ffffff !important;
                color: #000000 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 10px !important;
            }
            
            #printOnlyReport * {
                visibility: visible !important;
            }

            .print-header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                border-bottom: 3px double #003366 !important;
                padding-bottom: 12px !important;
                margin-bottom: 24px !important;
            }

            .print-logo-container {
                display: flex !important;
                align-items: center !important;
                gap: 16px !important;
            }

            .print-logo {
                width: 52px !important;
                height: 52px !important;
                background-color: #003366 !important;
                color: #ffffff !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 6px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .print-logo span {
                font-size: 32px !important;
                color: #ffffff !important;
            }

            .print-table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin: 20px 0 !important;
            }

            .print-table th, .print-table td {
                border: 1px solid #cbd5e1 !important;
                padding: 10px 12px !important;
                font-size: 12px !important;
                text-align: left !important;
            }

            .print-table th {
                background-color: #f1f5f9 !important;
                font-weight: 700 !important;
                color: #0f172a !important;
                text-transform: uppercase !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .print-badge {
                font-weight: 700 !important;
                padding: 2px 8px !important;
                border-radius: 9999px !important;
                font-size: 10px !important;
                text-transform: uppercase !important;
                display: inline-block !important;
            }

            .print-badge-active {
                background-color: #dcfce7 !important;
                color: #15803d !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .print-badge-expired {
                background-color: #fee2e2 !important;
                color: #b91c1c !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .print-badge-unsigned {
                background-color: #f1f5f9 !important;
                color: #475569 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .print-signature-section {
                margin-top: 48px !important;
                display: grid !important;
                grid-template-cols: 1fr 1fr !important;
                gap: 40px !important;
                font-size: 12px !important;
            }

            @page {
                size: A4 portrait;
                margin: 1.5cm;
            }
        }
</style>
</head>
<body class="bg-background text-on-background antialiased">

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
    <h2 class="font-headline-md text-headline-md font-bold text-primary">Kontrak Saya</h2>
  </div>
  <div class="flex items-center gap-6">
    <div class="hidden sm:flex items-center bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant">
      <span class="material-symbols-outlined text-on-surface-variant mr-2">search</span>
      <input id="searchInputField" class="bg-transparent border-none focus:ring-0 text-body-md font-body-md w-48 p-0" placeholder="Cari alat atau kontrak..." type="text">
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
<div class="p-container-padding space-y-grid-gutter pb-24">
<?php if (isset($_SESSION['success'])): ?>
    <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
        <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-emerald-600 font-bold">check_circle</span>
            <span class="text-sm font-semibold"><?= htmlspecialchars($_SESSION['success']) ?></span>
        </div>
        <button onclick="this.parentElement.remove()" class="text-emerald-500 hover:text-emerald-700 font-bold text-xs">Tutup</button>
    </div>
    <?php unset($_SESSION['success']); ?>
<?php endif; ?>

<?php if (isset($_SESSION['error'])): ?>
    <div class="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
        <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-rose-600 font-bold">error</span>
            <span class="text-sm font-semibold"><?= htmlspecialchars($_SESSION['error']) ?></span>
        </div>
        <button onclick="this.parentElement.remove()" class="text-rose-500 hover:text-rose-700 font-bold text-xs">Tutup</button>
    </div>
    <?php unset($_SESSION['error']); ?>
<?php endif; ?>
<!-- Summary Stats -->
<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-grid-gutter">
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-1 card-hover">
<span class="text-on-surface-variant font-label-caps text-label-caps">TOTAL KONTRAK</span>
<div class="flex justify-between items-end">
<span class="font-headline-md text-headline-md text-primary"><?= sprintf('%02d', $stats['total']) ?></span>
<span class="text-on-tertiary-container bg-tertiary-container/10 px-2 py-0.5 rounded text-xs font-semibold">Tercatat</span>
</div>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-1 card-hover">
<span class="text-on-surface-variant font-label-caps text-label-caps">KONTRAK AKTIF</span>
<div class="flex justify-between items-end">
<span class="font-headline-md text-headline-md text-primary"><?= sprintf('%02d', $stats['active']) ?></span>
<div class="w-12 h-1.5 bg-surface-container rounded-full overflow-hidden mb-1">
<div class="bg-primary h-full" style="width: <?= $stats['total'] > 0 ? min(100, round(($stats['active'] / $stats['total']) * 100)) : 0 ?>%"></div>
</div>
</div>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-1 card-hover">
<span class="text-on-surface-variant font-label-caps text-label-caps">AKAN BERAKHIR</span>
<div class="flex justify-between items-end">
<span class="font-headline-md text-headline-md <?= $stats['expiring'] > 0 ? 'text-error' : 'text-primary' ?>"><?= sprintf('%02d', $stats['expiring']) ?></span>
<span class="<?= $stats['expiring'] > 0 ? 'text-error bg-error-container/20' : 'text-on-surface-variant bg-surface-container-high' ?> px-2 py-0.5 rounded text-xs font-semibold">30 Hari</span>
</div>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-1 card-hover">
<span class="text-on-surface-variant font-label-caps text-label-caps">TOTAL TERBAYAR</span>
<div class="flex justify-between items-end">
<span class="font-headline-md text-headline-md text-primary">Rp <?= number_format($stats['billed'], 0, ',', '.') ?></span>
<span class="material-symbols-outlined text-on-surface-variant text-sm">info</span>
</div>
</div>
</section>

<!-- Featured Section -->
<section class="grid grid-cols-1 lg:grid-cols-3 gap-grid-gutter">
<!-- Kontrak Digital Terkini -->
<div class="lg:col-span-2 bg-primary rounded-xl overflow-hidden shadow-sm relative group card-hover">
<div class="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
<div class="p-8 flex flex-col md:flex-row gap-8 items-center h-full">
<div class="flex-grow space-y-6">
<?php if (empty($latestContract)): ?>
  <div>
    <div class="flex items-center gap-2 mb-2">
      <span class="text-on-primary-container font-label-caps text-label-caps uppercase tracking-wider">KONTRAK DIGITAL</span>
    </div>
    <h3 class="font-headline-md text-headline-md text-white">Belum ada kontrak terdaftar</h3>
    <p class="text-white/70 text-body-md mt-2">Kontrak sewa legal Anda akan muncul di sini setelah diverifikasi oleh staf kami.</p>
  </div>
<?php else: ?>
  <?php
    $latestIsExpired = (strtotime($latestContract['valid_until']) < time());
    $latestIsSigned = $latestContract['is_signed_customer'];
    $latestStatus = 'ACTIVE';
    if ($latestIsExpired) {
        $latestStatus = 'EXPIRED';
    } elseif (!$latestIsSigned) {
        $latestStatus = 'UNSIGNED';
    }
  ?>
  <div>
    <div class="flex items-center gap-2 mb-2">
      <span class="text-on-primary-container font-label-caps text-label-caps uppercase tracking-wider">KONTRAK DIGITAL TERKINI</span>
      <span class="material-symbols-outlined text-on-primary-container text-sm">verified</span>
    </div>
    <h3 class="font-headline-md text-headline-md text-white">Perjanjian Sewa Utama #<?= htmlspecialchars($latestContract['contract_code']) ?></h3>
  </div>
  <ul class="space-y-3">
    <li class="flex items-center gap-3 text-white/80">
      <span class="material-symbols-outlined text-on-tertiary-container">check_circle</span>
      <span class="text-body-md">Unit: <?= htmlspecialchars($latestContract['equipment_name']) ?></span>
    </li>
    <li class="flex items-center gap-3 text-white/80">
      <span class="material-symbols-outlined text-on-tertiary-container">check_circle</span>
      <span class="text-body-md">Mulai: <?= date('d M Y', strtotime($latestContract['contract_date'])) ?> s/d <?= date('d M Y', strtotime($latestContract['valid_until'])) ?></span>
    </li>
    <li class="flex items-center gap-3 text-white/80">
      <span class="material-symbols-outlined text-on-tertiary-container">check_circle</span>
      <span class="text-body-md">Status Legalitas: <strong class="text-white"><?= $latestStatus === 'ACTIVE' ? 'AKTIF' : $latestStatus ?></strong></span>
    </li>
  </ul>
  <div class="flex flex-wrap gap-4 pt-2">
    <button onclick="openContractDetailModal('<?= htmlspecialchars($latestContract['contract_code']) ?>', '<?= htmlspecialchars($latestContract['equipment_name']) ?>', '<?= date('d M Y', strtotime($latestContract['contract_date'])) ?>', '<?= date('d M Y', strtotime($latestContract['valid_until'])) ?>', '<?= htmlspecialchars($latestStatus) ?>', <?= $latestContract['id'] ?>)" class="h-10 px-6 bg-on-tertiary-container text-primary font-semibold rounded-lg flex items-center gap-2 hover:brightness-110 transition-all active:scale-95 cursor-pointer">
      <span>Lihat Detil Kontrak</span>
      <span class="material-symbols-outlined">arrow_forward</span>
    </button>
    <a href="javascript:void(0)" onclick="downloadContractPDF(<?= $latestContract['id'] ?>, '<?= htmlspecialchars($latestContract['contract_code']) ?>')" class="h-10 px-6 border border-white/30 text-white font-semibold rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer">
      <span class="material-symbols-outlined">download</span>
      <span>Unduh PDF</span>
    </a>
  </div>
<?php endif; ?>
</div>
<div class="hidden md:block w-48 shrink-0">
<div class="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
<span class="material-symbols-outlined text-6xl text-white/20 mb-4">description</span>
<p class="text-white/60 text-xs font-label-caps">DOCUMENT SIGNED VIA Docusign™</p>
</div>
</div>
</div>
</div>
<!-- Support Widget -->
<div class="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col card-hover">
<h4 class="font-headline-sm text-headline-sm text-primary mb-2">Butuh Bantuan Teknis?</h4>
<p class="text-on-surface-variant text-body-md mb-6">Hubungi Account Manager Anda untuk kendala alat atau administrasi kontrak.</p>
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 mb-6 flex items-center gap-4">
<img alt="Account Manager" class="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfgAVXl399YrIGNXrJprxl_leOL8tIGDe3C-x_lUCnbCXn3oEnW79ghI4FllUrj5tWhpgOfQ7caof9SkhVT_nhJJ9zNuGrR1iK5NvhKwqk81Yjck8cIGfdMwHKfIAvC26lf9UyaiWwU_OpUUk4Z7EU7g42rh58-Feo7UXUweucHYsnjdSf2BCRnRCr6TQwCQMtVggs06KQ4S0bF87d_OL_PtSekJoewI2ZTefE40hYGgGoVnKJ_uH8jRgD5tz3RJP5fXLu16T3Vhr9"/>
<div>
<p class="font-bold text-primary">Siska Amanda</p>
<p class="text-xs text-on-surface-variant">Account Manager Executive</p>
</div>
</div>
<div class="space-y-3 mt-auto">
<button onclick="window.open('https://wa.me/6282148564979?text=Halo%20Mbak%20Siska%20Amanda%20(Account%20Manager%20PT.%20SBS),%20saya%20ingin%20berkonsultasi%20mengenai%20kontrak%20digital%20sewa%20kami...', '_blank')" class="w-full h-10 bg-primary text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer">
<span class="material-symbols-outlined">chat</span>
<span>Chat via WhatsApp</span>
</button>
<button onclick="window.open('https://wa.me/6282148564979?text=Halo%20Hotline%20SBS%20EquipRent,%20saya%20memerlukan%20bantuan%20darurat%20terkait%20administrasi%20kontrak%20sewa...', '_blank')" class="w-full h-10 bg-white border border-outline-variant text-primary font-semibold rounded-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer">
<span class="material-symbols-outlined">call</span>
<span>Hubungi Hotline</span>
</button>
</div>
</div>
</section>

<!-- Table Section -->
<section class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
<div class="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant">
<div>
<h3 class="font-headline-sm text-headline-sm text-primary">Daftar Kontrak Keseluruhan</h3>
<p class="text-on-surface-variant text-sm">Menampilkan semua riwayat kontrak aktif dan non-aktif.</p>
</div>
<div class="flex gap-2">
      <select id="contractStatusFilter" onchange="filterContractsByStatus()" class="px-3 py-1.5 text-xs border border-outline-variant rounded bg-surface-container-lowest font-semibold hover:bg-surface-variant transition-colors cursor-pointer focus:ring-1 focus:ring-primary focus:border-primary">
        <option value="ALL">Semua Status</option>
        <option value="ACTIVE">Aktif (Active)</option>
        <option value="EXPIRED">Kedaluwarsa (Expired)</option>
      </select>
      <button onclick="exportContractsPDF()" class="px-4 py-2 bg-white border border-outline-variant text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors cursor-pointer">
        <span class="material-symbols-outlined text-lg">ios_share</span>
        <span>Export</span>
      </button>
</div>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container border-b border-outline-variant">
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">NO. KONTRAK</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">UNIT ALAT</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">TANGGAL MULAI</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">BERAKHIR</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">STATUS</th>
<th class="px-6 py-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider text-right">AKSI</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/30">
<?php if (empty($contracts)): ?>
  <tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant font-body-md">Belum ada kontrak sewa terdaftar.</td></tr>
<?php else: ?>
  <?php foreach ($contracts as $con):
    $isExpired = (strtotime($con['valid_until']) < time());
    $isSigned = $con['is_signed_customer'];
    $statusText = 'ACTIVE';
    if ($isExpired) {
        $statusText = 'EXPIRED';
    } elseif (!$isSigned) {
        $statusText = 'UNSIGNED';
    }
    
    if ($statusText === 'ACTIVE') {
        $badgeClass = 'bg-tertiary-container/20 text-on-tertiary-container';
        $badgeText = 'AKTIF';
    } elseif ($statusText === 'EXPIRED') {
        $badgeClass = 'bg-error-container/20 text-error';
        $badgeText = 'EXPIRED';
    } else {
        $badgeClass = 'bg-surface-variant text-on-surface-variant';
        $badgeText = 'BELUM TTD';
    }
  ?>
  <tr class="table-row-zebra hover:bg-surface-variant/20 transition-colors">
    <td class="px-6 py-4 font-semibold text-primary">#<?= htmlspecialchars($con['contract_code']) ?></td>
    <td class="px-6 py-4 text-on-surface"><?= htmlspecialchars($con['equipment_name']) ?></td>
    <td class="px-6 py-4 text-on-surface-variant"><?= date('d M Y', strtotime($con['contract_date'])) ?></td>
    <td class="px-6 py-4 text-on-surface-variant font-medium"><?= date('d M Y', strtotime($con['valid_until'])) ?></td>
    <td class="px-6 py-4">
      <span class="px-2 py-1 <?= $badgeClass ?> text-xs font-bold rounded-full uppercase"><?= $badgeText ?></span>
    </td>
    <td class="px-6 py-4 text-right">
      <div class="flex justify-end gap-2">
        <button onclick="downloadContractPDF(<?= $con['id'] ?>, '<?= htmlspecialchars($con['contract_code']) ?>')" class="p-1 text-on-surface-variant hover:text-primary transition-colors cursor-pointer" title="Download PDF Resmi">
          <span class="material-symbols-outlined text-lg">download</span>
        </button>
        <button onclick="openContractDetailModal('<?= htmlspecialchars($con['contract_code']) ?>', '<?= htmlspecialchars($con['equipment_name']) ?>', '<?= date('d M Y', strtotime($con['contract_date'])) ?>', '<?= date('d M Y', strtotime($con['valid_until'])) ?>', '<?= htmlspecialchars($statusText) ?>', <?= $con['id'] ?>)" class="text-on-surface-variant hover:text-primary transition-colors cursor-pointer" title="Detail Kontrak">
          <span class="material-symbols-outlined">more_vert</span>
        </button>
      </div>
    </td>
  </tr>
  <?php endforeach; ?>
<?php endif; ?>
</tbody>
</table>
</div>
<div class="p-4 bg-surface-container-low flex justify-between items-center text-xs text-on-surface-variant font-medium">
<span>Menampilkan <?= count($contracts) ?> Kontrak</span>
<div class="flex gap-2">
<button class="w-8 h-8 flex items-center justify-center bg-white border border-outline-variant rounded disabled:opacity-50" disabled="">
<span class="material-symbols-outlined text-sm">chevron_left</span>
</button>
<button class="w-8 h-8 flex items-center justify-center bg-primary text-white rounded">1</button>
<button class="w-8 h-8 flex items-center justify-center bg-white border border-outline-variant rounded disabled:opacity-50" disabled="">
<span class="material-symbols-outlined text-sm">chevron_right</span>
</button>
</div>
</div>
</section>
</div>
</main>

<!-- Contextual FAB -->
<button onclick="openNewContractModal()" class="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 group cursor-pointer">
  <span class="material-symbols-outlined text-3xl">add</span>
  <div class="absolute right-full mr-4 bg-primary text-white px-3 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
    Buat Kontrak Baru
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
      <p class="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant">Butuh bantuan operasional? Hubungi Hotline SBS atau Account Manager Anda Siska Amanda.</p>
    </div>
    <div class="mt-6 text-right">
      <button id="closeHelpModalOk" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md cursor-pointer">Saya Mengerti</button>
    </div>
  </div>
</div>

<!-- Tinjau & Detail Dokumen Kontrak Modal -->
<div id="contractDetailModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-2xl w-full p-6 shadow-xl relative m-4 animate-fade-in text-left my-8">
    <button onclick="closeContractDetailModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    
    <div class="flex items-center gap-3 mb-4 border-b border-outline-variant pb-3">
      <div class="bg-primary p-2.5 rounded-lg text-white flex items-center justify-center">
        <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">description</span>
      </div>
      <div>
        <h3 id="detailContractTitle" class="font-headline-sm text-headline-sm font-bold text-primary">Kontrak Sewa Alat Berat</h3>
        <p class="text-xs text-on-surface-variant">PT. SURYA BANGUN SARANA BANJARMASIN</p>
      </div>
    </div>

    <!-- Scrollable legal contract text -->
    <div class="space-y-4 max-h-[360px] overflow-y-auto pr-2 text-xs text-on-surface leading-relaxed font-sans">
      <div class="bg-surface-container-low p-4 rounded-lg space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <div><p class="font-semibold text-on-surface-variant">Nomor Kontrak:</p><p id="detailContractCode" class="font-mono font-bold text-primary">#CTR-SBS-20260520-002</p></div>
          <div><p class="font-semibold text-on-surface-variant">Unit Sewa:</p><p id="detailContractEquipment" class="font-bold text-primary">Excavator CAT 320D</p></div>
          <div><p class="font-semibold text-on-surface-variant">Tanggal Mulai:</p><p id="detailContractStart" class="font-medium">20 May 2026</p></div>
          <div><p class="font-semibold text-on-surface-variant">Tanggal Berakhir:</p><p id="detailContractEnd" class="font-medium">20 Jun 2026</p></div>
        </div>
        <div class="pt-2 flex items-center gap-2">
          <span class="text-on-surface-variant font-semibold">Status Dokumen:</span>
          <span id="detailContractStatus" class="px-2 py-0.5 bg-tertiary-container/20 text-on-tertiary-container text-[10px] font-bold rounded uppercase">AKTIF</span>
        </div>
      </div>

      <div class="border-t border-outline-variant/50 pt-2 space-y-3">
        <p class="font-bold text-center text-sm text-primary uppercase font-label-caps tracking-wider">SURAT PERJANJIAN SEWA MENYEWA ALAT BERAT</p>
        <p>Pada hari ini, disepakati perjanjian sewa menyewa alat berat antara <strong>PT. SURYA BANGUN SARANA BANJARMASIN</strong> (selanjutnya disebut PIHAK PERTAMA) dan <strong><?= htmlspecialchars($fullName) ?></strong> (selanjutnya disebut PIHAK KEDUA) dengan syarat dan ketentuan sebagai berikut:</p>
        
        <p><strong>Pasal 1 - Hak & Kewajiban Unit</strong><br>
        PIHAK PERTAMA menyediakan unit alat berat dalam kondisi prima, teruji, dan lulus sertifikasi layak operasi (SIA/SILO). PIHAK KEDUA berhak menggunakan unit tersebut sepenuhnya untuk kebutuhan proyek di lokasi yang disepakati.</p>
        
        <p><strong>Pasal 2 - Jam Kerja & Pemeliharaan (HM)</strong><br>
        Sistem sewa dihitung berdasarkan Hour Meter (HM). Batas minimum pemakaian sewa bulanan adalah 150 Jam. Pemeliharaan rutin, servis berkala, dan penggantian oli ditanggung penuh oleh PIHAK PERTAMA, sedangkan BBM dan operator harian ditanggung PIHAK KEDUA sesuai kontrak awal.</p>

        <p><strong>Pasal 3 - Kerusakan & Sanksi</strong><br>
        Apabila terjadi kerusakan unit akibat kelalaian operasional PIHAK KEDUA, maka biaya perbaikan sepenuhnya ditanggung PIHAK KEDUA. Apabila kerusakan terjadi karena keausan komponen wajar, PIHAK PERTAMA wajib memperbaiki tanpa membebankan biaya.</p>
      </div>

      <!-- Mock digital signature drawing box -->
      <div id="signatureSection" class="border border-outline-variant rounded-lg p-3 bg-surface-container-lowest">
        <p class="text-[10px] font-bold text-primary uppercase mb-1">Tandatangan Digital Pelanggan (PIHAK KEDUA)</p>
        <div class="border border-dashed border-outline-variant rounded bg-surface-container-low h-24 flex flex-col items-center justify-center relative cursor-crosshair hover:bg-surface-variant/20 transition-all group" onclick="simulateSign()">
          <div id="signPlaceholder" class="text-center text-[10px] text-on-surface-variant group-hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-lg">draw</span>
            <p>Klik di sini untuk membubuhkan Tandatangan Digital Resmi Anda</p>
          </div>
          <div id="signCanvasArea" class="hidden absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span class="font-mono font-bold text-primary text-xl border-b-2 border-primary border-double py-1 tracking-wider italic select-none">SIGNED ELECTRONICALLY</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex justify-between items-center border-t border-outline-variant pt-4">
      <button onclick="downloadContractPDF(currentContractId, document.getElementById('detailContractCode').innerText)" class="px-4 py-2 border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-container-low transition-colors cursor-pointer flex items-center gap-1">
        <span class="material-symbols-outlined text-xs">download</span> Unduh PDF
      </button>
      <div class="flex gap-2">
        <button onclick="closeContractDetailModal()" class="px-4 py-2 border border-outline-variant text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-low transition-colors cursor-pointer font-semibold">Tutup</button>
        <button id="signConfirmBtn" onclick="submitDigitalSignature()" class="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Tanda Tangani Sekarang</button>
      </div>
    </div>
  </div>
</div>

<!-- Buat Kontrak Baru Modal -->
<div id="newContractModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative m-4 animate-fade-in text-left">
    <button onclick="closeNewContractModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-4">
      <div class="bg-primary p-2.5 rounded-lg text-white flex items-center justify-center">
        <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1 font-semibold">add_circle</span>
      </div>
      <div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Permohonan Kontrak Baru</h3>
        <p class="text-xs text-on-surface-variant">Layanan Sewa PT. SBS</p>
      </div>
    </div>

    <form onsubmit="submitNewContractRequest(event)" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Pilih Unit Alat Berat</label>
        <select id="newContractEquip" class="w-full border border-outline-variant p-2.5 rounded-lg text-body-md focus:ring-1 focus:ring-primary focus:border-primary">
          <option value="Excavator Caterpillar 320D">Excavator Caterpillar 320D (Rp 180.000 / Jam)</option>
          <option value="Bulldozer Komatsu D85ESS">Bulldozer Komatsu D85ESS (Rp 220.000 / Jam)</option>
          <option value="Vibratory Roller Sakai SV515D">Vibratory Roller Sakai SV515D (Rp 150.000 / Jam)</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Tanggal Mulai</label>
          <input type="date" required id="newContractStartInput" class="w-full border border-outline-variant p-2 rounded-lg text-body-md">
        </div>
        <div>
          <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Durasi Sewa</label>
          <select id="newContractDuration" class="w-full border border-outline-variant p-2.5 rounded-lg text-body-md">
            <option value="30">30 Hari (Min 150 Jam)</option>
            <option value="60">60 Hari (Min 300 Jam)</option>
            <option value="90">90 Hari (Min 450 Jam)</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Lokasi Penempatan Proyek</label>
        <input type="text" required id="newContractLocation" placeholder="Contoh: Tambang Liang Anggang Blok B" class="w-full border border-outline-variant p-2 rounded-lg text-body-md">
      </div>

      <div class="flex items-center gap-2">
        <input type="checkbox" id="newContractOperator" class="rounded border-outline-variant text-primary focus:ring-primary">
        <label for="newContractOperator" class="text-xs text-on-surface font-semibold">Gunakan layanan operator bersertifikat SBS</label>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeNewContractModal()" class="px-4 py-2.5 border border-outline-variant text-on-surface rounded-lg text-body-md font-semibold hover:bg-surface-container-low transition-colors cursor-pointer">Batal</button>
        <button type="submit" class="bg-primary text-white px-5 py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-body-md cursor-pointer">Ajukan Kontrak</button>
      </div>
    </form>
  </div>
</div>

<script>
let isSigned = false;
let currentContractId = null;

function openContractDetailModal(code, equip, start, end, status, id) {
    currentContractId = id;
    document.getElementById('detailContractCode').innerText = '#' + code;
    document.getElementById('detailContractEquipment').innerText = equip;
    document.getElementById('detailContractStart').innerText = start;
    document.getElementById('detailContractEnd').innerText = end;
    
    const statusEl = document.getElementById('detailContractStatus');
    statusEl.innerText = status;
    
    const signConfirmBtn = document.getElementById('signConfirmBtn');
    
    if (status === 'ACTIVE' || status === 'AKTIF') {
        statusEl.className = 'px-2 py-0.5 bg-tertiary-container/20 text-on-tertiary-container text-[10px] font-bold rounded uppercase';
        
        // Show as already signed
        isSigned = true;
        document.getElementById('signPlaceholder').classList.add('hidden');
        document.getElementById('signCanvasArea').classList.remove('hidden');
        
        signConfirmBtn.innerText = 'Telah Ditandatangani';
        signConfirmBtn.disabled = true;
        signConfirmBtn.className = 'bg-gray-400 text-white px-5 py-2 rounded-lg font-bold text-xs cursor-not-allowed';
    } else {
        statusEl.className = 'px-2 py-0.5 bg-error-container/20 text-error text-[10px] font-bold rounded uppercase';
        
        // Reset signature area to unsigned
        isSigned = false;
        document.getElementById('signPlaceholder').classList.remove('hidden');
        document.getElementById('signCanvasArea').classList.add('hidden');
        
        signConfirmBtn.innerText = 'Tanda Tangani Sekarang';
        signConfirmBtn.disabled = false;
        signConfirmBtn.className = 'bg-primary text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer';
    }

    document.getElementById('contractDetailModal').classList.remove('hidden');
}

function closeContractDetailModal() {
    document.getElementById('contractDetailModal').classList.add('hidden');
}

function simulateSign() {
    isSigned = true;
    document.getElementById('signPlaceholder').classList.add('hidden');
    document.getElementById('signCanvasArea').classList.remove('hidden');
    
    // Play a gentle sound/alert simulation
    const alertBox = document.createElement('div');
    alertBox.className = 'fixed bottom-4 right-4 bg-primary text-white px-4 py-3 rounded-lg shadow-xl z-50 text-xs font-semibold flex items-center gap-2 animate-bounce';
    alertBox.innerHTML = '<span class="material-symbols-outlined text-sm">draw</span> Tandatangan digital berhasil dibubuhkan!';
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 2500);
}

function submitDigitalSignature() {
    if (!isSigned) {
        alert("Silakan klik area tandatangan untuk membubuhkan tandatangan digital Anda sebelum mengonfirmasi.");
        return;
    }

    const btn = document.getElementById('signConfirmBtn');
    btn.innerText = 'Menyimpan...';
    btn.disabled = true;

    setTimeout(() => {
        // Show success alert
        const alertBox = document.createElement('div');
        alertBox.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 text-sm font-bold flex items-center gap-3 animate-fade-in';
        alertBox.innerHTML = '<span class="material-symbols-outlined text-white">check_circle</span> Dokumen Kontrak Sewa Berhasil Ditandatangani Secara Hukum!';
        document.body.appendChild(alertBox);
        
        setTimeout(() => {
            alertBox.remove();
            closeContractDetailModal();
            // Redirect to sign handler in database
            window.location.href = `index.php?page=customer_sign_contract&id=${currentContractId}`;
        }, 1500);
    }, 1000);
}

function openNewContractModal() {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('newContractStartInput');
    if (dateInput) {
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }
    document.getElementById('newContractModal').classList.remove('hidden');
}

function closeNewContractModal() {
    document.getElementById('newContractModal').classList.add('hidden');
}

function submitNewContractRequest(event) {
    event.preventDefault();
    const equip = document.getElementById('newContractEquip').value;
    const date = document.getElementById('newContractStartInput').value;
    const duration = document.getElementById('newContractDuration').value;
    const location = document.getElementById('newContractLocation').value;
    const operator = document.getElementById('newContractOperator').checked ? 'Ya' : 'Tidak';

    closeNewContractModal();

    // Show beautiful premium success notification
    const alertBox = document.createElement('div');
    alertBox.className = 'fixed top-6 left-1/2 transform -translate-x-1/2 bg-primary text-white p-5 rounded-xl shadow-2xl z-50 text-sm font-semibold max-w-md w-full border border-white/20 animate-fade-in space-y-2';
    alertBox.innerHTML = `
        <div class="flex items-center gap-3 border-b border-white/10 pb-2">
            <span class="material-symbols-outlined text-white">task_alt</span>
            <strong class="text-white font-bold">Permohonan Kontrak Terkirim!</strong>
        </div>
        <p class="text-xs text-white/90">Permohonan sewa <strong>${equip}</strong> selama ${duration} Hari untuk penempatan <strong>${location}</strong> berhasil diajukan ke admin/staf.</p>
        <p class="text-[10px] text-white/70 italic">Tim marketing PT. SBS akan segera meninjau legalitas dan menghubungi Anda dalam 1x24 jam.</p>
    `;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 5500);
}

function downloadContractPDF(id, code) {
    const alertBox = document.createElement('div');
    alertBox.className = 'fixed bottom-6 right-6 bg-primary text-white p-4 rounded-xl shadow-2xl z-50 text-xs font-semibold flex items-center gap-3 animate-fade-in border border-white/25';
    alertBox.innerHTML = `
        <span class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
        <span>Menyiapkan PDF Resmi untuk Kontrak ${code}...</span>
    `;
    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.innerHTML = `
            <span class="material-symbols-outlined text-green-400">check_circle</span>
            <span>Dokumen Kontrak ${code} siap disimpan!</span>
        `;
        setTimeout(() => alertBox.remove(), 2500);
        
        // Open the official printable contract in a new tab which automatically pops up the print/save-as-PDF prompt
        window.open(`index.php?page=print_contract&id=${id}`, '_blank');
    }, 1200);
}

function exportContractsPDF() {
    window.print();
}

function filterContractsByStatus() {
    const status = document.getElementById('contractStatusFilter').value.toUpperCase();
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        // If empty row
        if (row.cells.length < 5) return;
        
        const rowStatusText = row.cells[4].innerText.trim().toUpperCase();
        if (status === 'ALL') {
            row.style.display = '';
        } else if (status === 'ACTIVE' && (rowStatusText === 'ACTIVE' || rowStatusText === 'AKTIF')) {
            row.style.display = '';
        } else if (status === 'EXPIRED' && (rowStatusText === 'EXPIRED' || rowStatusText === 'KEDALUWARSA')) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
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
});
</script>

<!-- ============================================================================
     PRINT-ONLY SECTION (OFFICIAL REPORT FOR KONTRAK SEWA ALAT BERAT)
     ============================================================================ -->
<div id="printOnlyReport" class="hidden">
    <!-- Header/Kop Surat Perusahaan -->
    <div class="print-header">
        <div class="print-logo-container">
            <div class="print-logo">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">construction</span>
            </div>
            <div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #003366; tracking-wide">PT. SURYA BANGUN SARANA</h1>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569; font-weight: 600;">Heavy Equipment Rental & Fleet Management Banjarmasin</p>
                <p style="margin: 2px 0 0 0; font-size: 9px; color: #64748b;">Jl. Ahmad Yani KM 5, Banjarmasin, Kalimantan Selatan | Telp: 0812-5432-1098</p>
            </div>
        </div>
        <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #003366; letter-spacing: 1px;">LAPORAN DATA KONTRAK</h2>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #475569;">Tanggal Cetak: <?= date('d F Y') ?></p>
        </div>
    </div>

    <!-- Informasi Profil Pelanggan -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; padding: 12px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
        <div>
            <p style="margin: 0; font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; font-family: monospace;">Diterbitkan Untuk</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 700; color: #0f172a;"><?= htmlspecialchars($fullName) ?></p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;"><?= htmlspecialchars($_SESSION['company_name'] ?? 'Pelanggan SBS') ?></p>
        </div>
        <div style="text-align: right;">
            <p style="margin: 0; font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; font-family: monospace;">Metode Pengiriman</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 700; color: #15803d;">E-Portal Customer System</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">Status Dokumen: Resmi (Valid)</p>
        </div>
    </div>

    <!-- Tabel Data Kontrak Resmi -->
    <table class="print-table">
        <thead>
            <tr>
                <th style="width: 20%;">NO. KONTRAK</th>
                <th style="width: 30%;">UNIT ALAT BERAT</th>
                <th style="width: 20%;">TANGGAL MULAI</th>
                <th style="width: 20%;">TANGGAL BERAKHIR</th>
                <th style="width: 10%;">STATUS</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($contracts)): ?>
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Belum ada kontrak sewa terdaftar.</td>
                </tr>
            <?php else: ?>
                <?php foreach ($contracts as $con):
                    $isExpired = (strtotime($con['valid_until']) < time());
                    $isSigned = $con['is_signed_customer'];
                    $statusText = 'ACTIVE';
                    if ($isExpired) {
                        $statusText = 'EXPIRED';
                    } elseif (!$isSigned) {
                        $statusText = 'UNSIGNED';
                    }
                    
                    if ($statusText === 'ACTIVE') {
                        $badgePrintClass = 'print-badge-active';
                        $badgePrintText = 'AKTIF';
                    } elseif ($statusText === 'EXPIRED') {
                        $badgePrintClass = 'print-badge-expired';
                        $badgePrintText = 'EXPIRED';
                    } else {
                        $badgePrintClass = 'print-badge-unsigned';
                        $badgePrintText = 'BELUM TTD';
                    }
                ?>
                <tr>
                    <td style="font-family: monospace; font-weight: 700; color: #003366;">#<?= htmlspecialchars($con['contract_code']) ?></td>
                    <td style="font-weight: 600; color: #0f172a;"><?= htmlspecialchars($con['equipment_name']) ?></td>
                    <td style="color: #334155;"><?= date('d M Y', strtotime($con['contract_date'])) ?></td>
                    <td style="color: #334155; font-weight: 500;"><?= date('d M Y', strtotime($con['valid_until'])) ?></td>
                    <td>
                        <span class="print-badge <?= $badgePrintClass ?>"><?= $badgePrintText ?></span>
                    </td>
                </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>

    <!-- Tanda Tangan Pengesahan Akademik & Operasional -->
    <div class="print-signature-section">
        <div style="text-align: left;">
            <p style="margin: 0 0 60px 0; color: #64748b;">Pihak Kedua (Penyewa),</p>
            <p style="margin: 0; font-weight: 700; color: #0f172a; text-decoration: underline;"><?= htmlspecialchars($fullName) ?></p>
            <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Perwakilan Perusahaan</p>
        </div>
        <div style="text-align: right;">
            <p style="margin: 0 0 60px 0; color: #64748b;">Banjarmasin, <?= date('d F Y') ?><br>Pihak Pertama (PT. SBS),</p>
            <p style="margin: 0; font-weight: 700; color: #003366; text-decoration: underline;">H. Hendra Wijaya, S.T.</p>
            <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Direktur Operasional</p>
        </div>
    </div>
</div>

</body>
</html>
