<?php
$fullName = $_SESSION['full_name'] ?? 'Customer';
$role = $_SESSION['role'] ?? 'CUSTOMER';
$currentPage = 'customer_payments';

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
<title>SBS EquipRent - Pembayaran Saya</title>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
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

        @media print {
            /* Hide UI controls */
            aside, header, #statusFilterSelect, button, a, .fixed, .print\:hidden, section.grid, section.pb-12, #paymentUploadModal, #pendingVerificationModal, #helpModalDialog {
                display: none !important;
            }
            main {
                margin-left: 0 !important;
                padding: 0 !important;
                width: 100% !important;
            }
            body {
                background: white !important;
                color: black !important;
            }
            section {
                border: none !important;
                box-shadow: none !important;
                background: transparent !important;
            }
            /* Table formatting on A4 */
            table {
                width: 100% !important;
                border-collapse: collapse !important;
            }
            th, td {
                border-bottom: 1px solid #c3c6d1 !important;
                padding: 10px 4px !important;
            }
            
            /* High-fidelity standalone layout for kuitansi receipt */
            body:has(#kuitansiModal:not(.hidden)) #kuitansiModal {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: white !important;
                display: block !important;
                z-index: 99999 !important;
                padding: 0 !important;
            }
            body:has(#kuitansiModal:not(.hidden)) main {
                display: none !important;
            }
            body:has(#kuitansiModal:not(.hidden)) #kuitansiPrintArea {
                border: 2px solid #003366 !important;
                padding: 24px !important;
                border-radius: 8px !important;
                max-width: 100% !important;
                margin: 40px auto !important;
            }
        }
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
    <h2 class="font-headline-md text-headline-md font-bold text-primary">Pembayaran Saya</h2>
  </div>
  <div class="flex items-center gap-6">
    <div class="hidden sm:flex items-center bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant">
      <span class="material-symbols-outlined text-on-surface-variant mr-2">search</span>
      <input id="searchInputField" class="bg-transparent border-none focus:ring-0 text-body-md font-body-md w-48 p-0" placeholder="Cari invoice atau status..." type="text">
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
<main class="md:ml-sidebar-width pt-20 p-container-padding min-h-[calc(100vh-64px)] space-y-grid-gutter pb-24">
<!-- Summary Cards Section -->
<section class="grid grid-cols-1 md:grid-cols-3 gap-grid-gutter">
<div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover flex flex-col justify-between">
<div>
<span class="text-on-surface-variant font-body-md">Hutang Berjalan</span>
<h2 class="font-display-lg text-display-lg text-error mt-1">Rp <?= number_format($stats['unpaid'], 0, ',', '.') ?></h2>
</div>
<div class="mt-4 flex items-center text-xs text-on-surface-variant">
<span class="material-symbols-outlined text-sm mr-1">event_note</span>
                    Segera lakukan pelunasan untuk menghindari denda
                </div>
</div>
<div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover flex flex-col justify-between">
<div>
<span class="text-on-surface-variant font-body-md">Total Terbayar (Bulan Ini)</span>
<h2 class="font-display-lg text-display-lg text-primary mt-1">Rp <?= number_format($stats['paid_month'], 0, ',', '.') ?></h2>
</div>
<div class="mt-4 flex items-center text-xs text-on-surface-variant text-green-700">
<span class="material-symbols-outlined text-sm mr-1">trending_up</span>
                    Transaksi tercatat di database SBS
                </div>
</div>
<div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover flex flex-col justify-between">
<div>
<span class="text-on-surface-variant font-body-md">Menunggu Verifikasi</span>
<h2 class="font-display-lg text-display-lg text-on-secondary-container mt-1">Rp <?= number_format($stats['verification'], 0, ',', '.') ?></h2>
</div>
<div class="mt-4 flex items-center text-xs text-on-surface-variant">
<span class="material-symbols-outlined text-sm mr-1">hourglass_empty</span>
                    Dalam antrean verifikasi staf keuangan
                </div>
</div>
</section>

<!-- Hidden Print Corporate Letterhead -->
<div class="hidden print:block mb-6 border-b-4 border-primary pb-4">
  <div class="flex justify-between items-start">
    <div>
      <h1 class="text-2xl font-bold text-primary tracking-wide">PT. SURYA BANGUN SARANA</h1>
      <p class="text-xs font-semibold text-on-surface-variant">Layanan Sewa & Manajemen Fleet Alat Berat Kalimantan Selatan</p>
      <p class="text-[10px] text-on-surface-variant/80 mt-1">Kantor Cabang: Jl. Ahmad Yani KM. 21, Liang Anggang, Banjarmasin</p>
      <p class="text-[10px] text-on-surface-variant/80">Hotline Admin SBS: 0821-4856-4979 | E-mail: finance@sbs-banjarmasin.co.id</p>
    </div>
    <div class="text-right">
      <h2 class="text-md font-bold text-primary font-label-caps uppercase tracking-wider">REKAP TRANSAKSI PEMBAYARAN</h2>
      <p class="text-xs text-on-surface-variant mt-1 font-semibold">Nama Customer: <?= htmlspecialchars($fullName) ?></p>
      <p class="text-[10px] text-on-surface-variant">Tanggal Cetak Dokumen: <?= date('d M Y H:i') ?></p>
    </div>
  </div>
</div>

<!-- Main Transactions Table -->
<section class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
<div class="px-6 py-5 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  <h3 class="font-headline-sm text-headline-sm text-primary">Daftar Transaksi</h3>
  <div class="flex items-center gap-3 w-full sm:w-auto">
    <div class="relative">
      <select id="statusFilterSelect" onchange="filterPaymentsByStatus()" class="flex items-center gap-2 px-3 py-1.5 text-xs border border-outline-variant rounded bg-surface-container-lowest font-semibold hover:bg-surface-variant transition-colors cursor-pointer focus:ring-1 focus:ring-primary focus:border-primary">
        <option value="ALL">Semua Status</option>
        <option value="LUNAS">Lunas (Paid)</option>
        <option value="VERIFIKASI">Menunggu Verifikasi</option>
        <option value="PENDING">Pending (Belum Bayar)</option>
      </select>
    </div>
    <button onclick="exportPaymentsPDF()" class="flex items-center gap-2 px-3 py-1.5 text-xs border border-outline-variant rounded hover:bg-surface-variant transition-colors cursor-pointer font-semibold text-primary">
      <span class="material-symbols-outlined text-sm">download</span>
      Ekspor PDF
    </button>
  </div>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container text-on-surface-variant border-b border-outline-variant">
<th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider">No Invoice</th>
<th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider">Tanggal</th>
<th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider">Nominal</th>
<th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider">Metode</th>
<th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider text-center">Status</th>
<th class="px-6 py-4 font-table-header text-table-header uppercase tracking-wider text-right">Aksi</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant">
<?php if (empty($payments)): ?>
  <tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant font-body-md">Belum ada data transaksi pembayaran.</td></tr>
<?php else: ?>
  <?php foreach ($payments as $pay):
    $status = strtoupper($pay['status'] ?? '');
    
    // Status style mapping
    if ($status === 'PAID') {
        $badgeClass = 'bg-on-tertiary-container/10 text-on-tertiary-container';
        $badgeText = 'LUNAS';
    } elseif ($status === 'PENDING_VERIFICATION') {
        $badgeClass = 'bg-secondary-container text-on-secondary-container';
        $badgeText = 'VERIFIKASI';
    } else {
        $badgeClass = 'bg-error-container text-on-error-container';
        $badgeText = 'PENDING';
    }
  ?>
  <tr class="hover:bg-surface transition-colors">
    <td class="px-6 py-4 font-label-caps text-label-caps text-primary font-bold"><?= htmlspecialchars($pay['payment_code']) ?></td>
    <td class="px-6 py-4 text-body-md text-on-surface-variant"><?= date('d M Y', strtotime($pay['payment_date'])) ?></td>
    <td class="px-6 py-4 font-body-md font-semibold">Rp <?= number_format($pay['amount'], 0, ',', '.') ?></td>
    <td class="px-6 py-4 text-body-md text-on-surface-variant"><?= htmlspecialchars($pay['payment_method'] ?: 'Transfer Bank') ?></td>
    <td class="px-6 py-4 text-center">
      <span class="px-3 py-1 <?= $badgeClass ?> text-xs font-bold rounded-full uppercase"><?= $badgeText ?></span>
    </td>
    <td class="px-6 py-4 text-right">
      <?php if ($status === 'UNPAID'): ?>
        <button onclick="openPaymentUploadModal('<?= htmlspecialchars($pay['payment_code']) ?>', <?= $pay['amount'] ?>, '<?= htmlspecialchars($pay['payment_method'] ?: 'Transfer Bank') ?>')" class="bg-primary text-on-primary px-4 py-1.5 rounded text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer">BAYAR</button>
      <?php elseif ($status === 'PENDING_VERIFICATION'): ?>
        <button onclick="openPendingVerificationDetails('<?= htmlspecialchars($pay['payment_code']) ?>', <?= $pay['amount'] ?>, '<?= htmlspecialchars($pay['payment_method'] ?: 'Transfer Bank') ?>', '<?= date('d M Y', strtotime($pay['payment_date'])) ?>')" class="text-on-surface-variant hover:text-primary p-1 cursor-pointer transition-all hover:scale-110 active:scale-95" title="Tinjau Berkas Pengunggahan"><span class="material-symbols-outlined text-lg">hourglass_top</span></button>
      <?php else: ?>
        <button onclick="openKuitansiModal('<?= htmlspecialchars($pay['payment_code']) ?>', <?= $pay['amount'] ?>, '<?= htmlspecialchars($pay['payment_method'] ?: 'Transfer Bank') ?>', '<?= date('d M Y', strtotime($pay['payment_date'])) ?>')" class="text-on-surface-variant hover:text-primary p-1 cursor-pointer transition-all hover:scale-110 active:scale-95" title="Lihat Kuitansi Pembayaran"><span class="material-symbols-outlined text-lg">visibility</span></button>
      <?php endif; ?>
    </td>
  </tr>
  <?php endforeach; ?>
<?php endif; ?>
</tbody>
</table>
</div>
<div class="px-6 py-4 border-t border-outline-variant flex items-center justify-between text-body-md text-on-surface-variant">
<span>Menampilkan <?= count($payments) ?> transaksi</span>
<div class="flex gap-2">
<button class="px-3 py-1 border border-outline-variant rounded hover:bg-surface-variant disabled:opacity-50" disabled="">Previous</button>
<button class="px-3 py-1 border border-outline-variant rounded bg-primary text-on-primary">1</button>
<button class="px-3 py-1 border border-outline-variant rounded hover:bg-surface-variant disabled:opacity-50" disabled="">Next</button>
</div>
</div>
</section>

<!-- Footer Help & Security -->
<section class="grid grid-cols-1 md:grid-cols-2 gap-grid-gutter pb-12">
<div class="bg-surface-container-high p-6 rounded-xl border border-outline-variant flex gap-6 items-start">
<div class="p-3 bg-primary rounded-lg text-on-primary">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">security</span>
</div>
<div>
<h4 class="font-headline-sm text-headline-sm text-primary mb-1">Keamanan Transaksi</h4>
<p class="text-body-md text-on-surface-variant">Seluruh transaksi Anda diverifikasi dan dilindungi langsung oleh sistem keuangan PT. Surya Bangun Sarana Banjarmasin demi kepastian laporan pembukuan legal.</p>
</div>
</div>
<div class="bg-primary p-6 rounded-xl text-on-primary shadow-lg flex justify-between items-center group relative overflow-hidden">
<div class="relative z-10">
<h4 class="font-headline-sm text-headline-sm font-bold mb-1">Butuh Bantuan Teknis?</h4>
<p class="text-body-md text-on-primary/80 mb-4">Hubungi Account Manager Anda untuk kendala pembayaran.</p>
<div class="flex items-center gap-3">
<img alt="Manager profile" class="w-10 h-10 rounded-full border-2 border-on-primary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0KKyBu9-WvoLPqMrG4m_0Neos13YpcrKq0El1s3EqyfdGzWu8A-dhj7OHvLJCarJRbrUi5kSbEp3tSsAl5XOJcGggFsdq1g4h-AcL3qAt2H7YoV8LzxLomegaO-G4hZ575VwEgRHhrQo-3zWIUUrMMyR05DcPSZ6RRCx3PA2mhIYFGaIC_KuIOHWIwg_s5XmbzEl29vhBnjSOzjU3bjaIXXZ3UgUZ21uHsOtpzPBz-APrQwofNmP-yLXNbfikI4MDEtfNa4tJ3xkX"/>
<div>
<p class="text-sm font-bold">Hendra Wijaya</p>
<p class="text-xs opacity-80">Staf Operasional SBS</p>
</div>
</div>
</div>
<div class="flex flex-col gap-2 relative z-10">
<button onclick="window.open('https://wa.me/6282148564979?text=Halo%20Staf%20SBS%20Hendra%20Wijaya,%20saya%20ingin%20mengonfirmasi%20pembayaran%20rental...', '_blank')" class="bg-on-primary text-primary px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer">
<span class="material-symbols-outlined text-sm">chat</span>
                        Chat WhatsApp
                    </button>
<button onclick="window.open('https://wa.me/6282148564979?text=Halo%20Hotline%20SBS%20EquipRent,%20saya%20memerlukan%20bantuan%20terkait%20portal%20pelanggan...', '_blank')" class="bg-white/10 border border-white/20 text-on-primary px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer">
<span class="material-symbols-outlined text-sm">call</span>
                        Hubungi Hotline
                    </button>
</div>
<!-- Abstract visual element -->
<div class="absolute -right-10 -bottom-10 w-40 h-40 bg-on-primary/5 rounded-full blur-3xl group-hover:bg-on-primary/10 transition-all duration-700"></div>
</div>
</section>
</main>

<!-- Floating Action Button -->
<button onclick="openPaymentUploadModal('', 0, 'Transfer Bank')" class="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30 group cursor-pointer">
  <span class="material-symbols-outlined text-2xl text-white">add</span>
  <div class="absolute right-full mr-4 px-3 py-2 bg-inverse-surface text-inverse-on-surface rounded text-body-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
    Unggah Transaksi Baru
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

<!-- Upload Bukti Transfer Modal -->
<div id="paymentUploadModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative m-4 animate-fade-in text-left">
    <button onclick="closePaymentUploadModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-4">
      <div class="bg-primary-container p-2.5 rounded-lg text-white flex items-center justify-center">
        <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">upload_file</span>
      </div>
      <div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Konfirmasi Pembayaran</h3>
        <p class="text-xs text-on-surface-variant">PT. SURYA BANGUN SARANA</p>
      </div>
    </div>

    <form id="paymentUploadForm" onsubmit="submitPaymentUploadForm(event)" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Invoice / Kode Tagihan</label>
        <select id="uploadInvoiceCode" onchange="autoFillAmount()" class="w-full border border-outline-variant p-2.5 rounded-lg text-body-md focus:ring-1 focus:ring-primary focus:border-primary">
          <?php 
          $hasUnpaid = false;
          if (!empty($payments)) {
              foreach ($payments as $pay) {
                  if (strtoupper($pay['status'] ?? '') === 'UNPAID') {
                      $hasUnpaid = true;
                      echo '<option value="' . htmlspecialchars($pay['payment_code']) . '" data-amount="' . htmlspecialchars($pay['amount']) . '">' . htmlspecialchars($pay['payment_code']) . ' (Rp ' . number_format($pay['amount'], 0, ',', '.') . ')</option>';
                  }
              }
          }
          if (!$hasUnpaid) {
              echo '<option value="" data-amount="0">Tidak ada tagihan tertunda</option>';
          }
          ?>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Jumlah Nominal (IDR)</label>
          <input type="text" id="uploadAmountText" readonly class="w-full border border-outline-variant p-2.5 bg-surface-container-low rounded-lg text-body-md font-bold text-primary">
        </div>
        <div>
          <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Metode Transfer</label>
          <select id="uploadMethod" class="w-full border border-outline-variant p-2.5 rounded-lg text-body-md focus:ring-1 focus:ring-primary">
            <option value="Transfer Bank - Mandiri">Transfer Bank Mandiri</option>
            <option value="Transfer Bank - BCA">Transfer Bank BCA</option>
            <option value="Transfer Bank - Bank Kalsel">Transfer Bank Kalsel</option>
          </select>
        </div>
      </div>

      <div class="bg-surface-container p-3 rounded-lg text-xs space-y-1 text-on-surface">
        <p class="font-bold text-primary">Rekening Tujuan Transfer PT. SBS:</p>
        <p>• Bank Mandiri: <span class="font-mono font-bold select-all">031-00-1289552-0</span> a.n. PT. SURYA BANGUN SARANA</p>
        <p>• Bank Kalsel: <span class="font-mono font-bold select-all">001-03-11-20901-5</span> a.n. PT. SURYA BANGUN SARANA</p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Nama Rekening Pengirim</label>
          <input type="text" required id="uploadSenderName" placeholder="Contoh: CV. Banua Konstruksi" class="w-full border border-outline-variant p-2 rounded-lg text-body-md">
        </div>
        <div>
          <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Tanggal Transfer</label>
          <input type="date" required id="uploadDate" class="w-full border border-outline-variant p-2 rounded-lg text-body-md">
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-primary mb-1 uppercase font-label-caps">Bukti Transfer (Foto/Struk)</label>
        <div class="border-2 border-dashed border-outline-variant hover:border-primary rounded-lg p-4 text-center cursor-pointer transition-colors relative">
          <input type="file" required id="uploadFile" class="absolute inset-0 opacity-0 cursor-pointer">
          <span class="material-symbols-outlined text-primary text-3xl mb-1">cloud_upload</span>
          <p class="text-xs text-on-surface font-semibold">Klik atau seret file gambar struk ATM / screenshot m-banking</p>
          <p class="text-[9px] text-on-surface-variant mt-0.5">Mendukung file PNG, JPG, JPEG, PDF maks 2MB</p>
        </div>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closePaymentUploadModal()" class="px-4 py-2.5 border border-outline-variant text-on-surface rounded-lg text-body-md font-semibold hover:bg-surface-container-low transition-colors cursor-pointer">Batal</button>
        <button type="submit" class="bg-primary text-white px-5 py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-body-md cursor-pointer">Kirim Bukti Pembayaran</button>
      </div>
    </form>
  </div>
</div>

<!-- Pending Verification Detail Modal -->
<div id="pendingVerificationModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative m-4 animate-fade-in text-left">
    <button onclick="closePendingVerificationModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-4">
      <div class="bg-secondary-container p-2.5 rounded-lg text-on-secondary-container flex items-center justify-center">
        <span class="material-symbols-outlined text-on-secondary-container" style="font-variation-settings: 'FILL' 1">hourglass_empty</span>
      </div>
      <div>
        <h3 id="pendingInvoiceCode" class="font-headline-sm text-headline-sm font-bold text-primary">PAY-SBS-20260505-001</h3>
        <p class="text-xs text-on-surface-variant">Menunggu Verifikasi Keuangan</p>
      </div>
    </div>

    <div class="space-y-4">
      <div class="p-3 bg-surface-container-low rounded-lg space-y-1 text-xs">
        <div class="flex justify-between"><span>Nominal Transfer:</span><span id="pendingAmount" class="font-bold text-primary">Rp 77.500.000</span></div>
        <div class="flex justify-between"><span>Metode:</span><span id="pendingMethod" class="font-semibold">Transfer Bank Mandiri</span></div>
        <div class="flex justify-between"><span>Tanggal Pengunggahan:</span><span id="pendingUploadDate" class="font-semibold">30 May 2026</span></div>
        <div class="flex justify-between"><span>Status Antrean:</span><span class="font-bold text-on-secondary-container uppercase">PROSES VERIFIKASI (1-2 JAM)</span></div>
      </div>

      <div class="border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest text-center">
        <p class="text-[10px] text-on-surface-variant font-bold uppercase mb-1">Lampiran Berkas Bukti Transfer</p>
        <div class="w-full h-40 bg-surface-container-high rounded flex items-center justify-center overflow-hidden border border-outline-variant">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGKxVw5XN1Y9Fp1aR5L5tPzC0wT_J-B0F7T5U8y1a9G2c3d4e5f6g7h8i9j" alt="Struk Transfer Mockup" class="w-full h-full object-cover error-fallback" onerror="this.src='https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60'">
        </div>
      </div>

      <p class="text-[10px] text-on-surface-variant leading-relaxed">
        <strong>Pemberitahuan:</strong> Jika bukti pembayaran Anda telah diverifikasi oleh Staf Keuangan PT. SBS, status invoice ini akan otomatis berubah menjadi LUNAS, dan draf kuitansi PDF resmi akan dapat Anda unduh.
      </p>

      <div class="text-right">
        <button onclick="closePendingVerificationModal()" class="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Tutup</button>
      </div>
    </div>
  </div>
</div>

<!-- Kuitansi Resmi Lunas Modal -->
<div id="kuitansiModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in text-left">
    <button onclick="closeKuitansiModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer print:hidden">
      <span class="material-symbols-outlined">close</span>
    </button>
    
    <!-- Kuitansi Printable Area -->
    <div id="kuitansiPrintArea" class="space-y-4 p-2">
      <!-- Receipt Header -->
      <div class="flex justify-between items-start border-b-2 border-primary pb-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary flex items-center justify-center rounded text-white print:bg-primary">
            <span class="material-symbols-outlined text-white text-lg">receipt_long</span>
          </div>
          <div>
            <h4 class="text-sm font-bold text-primary uppercase leading-tight">PT. SURYA BANGUN SARANA</h4>
            <p class="text-[9px] text-on-surface-variant leading-none">Banjarmasin, Kalimantan Selatan</p>
          </div>
        </div>
        <div class="text-right">
          <span class="border-2 border-green-700 text-green-700 px-3 py-1 text-xs font-bold rounded uppercase tracking-wider font-mono">LUNAS / PAID</span>
        </div>
      </div>

      <div class="text-center py-1">
        <h3 class="text-md font-bold text-primary uppercase font-label-caps tracking-widest">KUITANSI RESMI PEMBAYARAN</h3>
        <p class="text-[10px] text-on-surface-variant">Nomor: <span id="kuitansiCode" class="font-bold font-mono">PAY-SBS-20260505-001</span></p>
      </div>

      <div class="grid grid-cols-3 gap-2 text-xs py-2 border-t border-b border-outline-variant/50">
        <div class="text-on-surface-variant space-y-1">
          <p>Telah Diterima Dari</p>
          <p>Sejumlah Uang</p>
          <p>Metode Pembayaran</p>
          <p>Tanggal Transaksi</p>
        </div>
        <div class="col-span-2 font-bold space-y-1">
          <p>: <?= htmlspecialchars($fullName) ?></p>
          <p id="kuitansiAmountText">: Rp 77.500.000 (Tujuh Puluh Tujuh Juta Lima Ratus Ribu Rupiah)</p>
          <p id="kuitansiMethod">: Transfer Bank - Mandiri</p>
          <p id="kuitansiDate">: 30 May 2026</p>
        </div>
      </div>

      <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant text-center font-mono font-bold text-primary text-md">
        JUMLAH: <span id="kuitansiAmountBox">Rp 77.500.000</span>
      </div>

      <!-- Footer Receipt -->
      <div class="flex justify-between items-end pt-4">
        <div class="text-[9px] text-on-surface-variant max-w-xs leading-relaxed">
          * Kuitansi ini diterbitkan secara elektronik oleh SBS EquipRent dan sah sebagai tanda bukti pembayaran yang sah sesuai database perpajakan PT. SBS.
        </div>
        <div class="text-center text-xs relative pr-4">
          <p class="text-[10px]">SBS Cashier Division</p>
          <!-- Mock signature stamp -->
          <div class="w-16 h-16 border-2 border-primary/20 rounded-full flex items-center justify-center absolute -top-4 right-1 rotate-12 pointer-events-none text-primary font-bold text-[8px]">
            SBS LUNAS
          </div>
          <div class="mt-8 font-bold text-primary underline">Hendra Wijaya</div>
          <p class="text-[9px] text-on-surface-variant">Finance Staff</p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-6 flex justify-end gap-2 print:hidden">
      <button onclick="window.print()" class="px-4 py-2 border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-container-low transition-colors cursor-pointer flex items-center gap-1">
        <span class="material-symbols-outlined text-xs">print</span> Cetak Kuitansi
      </button>
      <button onclick="closeKuitansiModal()" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Selesai</button>
    </div>
  </div>
</div>

<script>
// paymentUploadModal functions
function openPaymentUploadModal(code, amount, method) {
    const select = document.getElementById('uploadInvoiceCode');
    if (code) {
        let optionExists = false;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === code) {
                optionExists = true;
                break;
            }
        }
        if (!optionExists && amount) {
            const opt = document.createElement('option');
            opt.value = code;
            opt.setAttribute('data-amount', amount);
            opt.text = `${code} (Rp ${parseFloat(amount).toLocaleString('id-ID')})`;
            select.add(opt);
        }
        select.value = code;
    }
    
    // Set current date
    document.getElementById('uploadDate').value = new Date().toISOString().split('T')[0];
    autoFillAmount();
    document.getElementById('paymentUploadModal').classList.remove('hidden');
}

function closePaymentUploadModal() {
    document.getElementById('paymentUploadModal').classList.add('hidden');
}

function autoFillAmount() {
    const select = document.getElementById('uploadInvoiceCode');
    if (select.selectedIndex === -1 || !select.options[select.selectedIndex]) {
        document.getElementById('uploadAmountText').value = 'Rp 0';
        return;
    }
    const selectedOption = select.options[select.selectedIndex];
    const amt = parseFloat(selectedOption.getAttribute('data-amount') || 0);
    document.getElementById('uploadAmountText').value = 'Rp ' + amt.toLocaleString('id-ID');
}

function submitPaymentUploadForm(e) {
    e.preventDefault();
    const code = document.getElementById('uploadInvoiceCode').value;
    const amount = document.getElementById('uploadAmountText').value;
    const name = document.getElementById('uploadSenderName').value;
    
    closePaymentUploadModal();
    alert(`Sukses! Bukti pembayaran untuk tagihan ${code} sebesar ${amount} atas nama pengirim ${name} telah berhasil diunggah. Staf Keuangan kami akan memproses verifikasi dalam waktu 1-2 jam.`);
}

// pendingVerificationModal functions
function openPendingVerificationDetails(code, amount, method, date) {
    document.getElementById('pendingInvoiceCode').innerText = code;
    document.getElementById('pendingAmount').innerText = 'Rp ' + parseFloat(amount).toLocaleString('id-ID');
    document.getElementById('pendingMethod').innerText = method;
    document.getElementById('pendingUploadDate').innerText = date;
    
    document.getElementById('pendingVerificationModal').classList.remove('hidden');
}

function closePendingVerificationModal() {
    document.getElementById('pendingVerificationModal').classList.add('hidden');
}

// kuitansiModal functions
function openKuitansiModal(code, amount, method, date) {
    document.getElementById('kuitansiCode').innerText = code;
    document.getElementById('kuitansiAmountBox').innerText = 'Rp ' + parseFloat(amount).toLocaleString('id-ID');
    document.getElementById('kuitansiAmountText').innerText = ': Rp ' + parseFloat(amount).toLocaleString('id-ID') + ' (Lunas Sepenuhnya)';
    document.getElementById('kuitansiMethod').innerText = ': ' + method;
    document.getElementById('kuitansiDate').innerText = ': ' + date;
    
    document.getElementById('kuitansiModal').classList.remove('hidden');
}

function closeKuitansiModal() {
    document.getElementById('kuitansiModal').classList.add('hidden');
}

// Status filtering select function
function filterPaymentsByStatus() {
    const filter = document.getElementById('statusFilterSelect').value;
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        if (row.cells.length === 1) return; // skip empty row
        
        const statusSpan = row.cells[4].querySelector('span').innerText.toUpperCase();
        
        if (filter === 'ALL') {
            row.style.display = '';
        } else if (filter === 'LUNAS' && statusSpan.includes('LUNAS')) {
            row.style.display = '';
        } else if (filter === 'VERIFIKASI' && (statusSpan.includes('VERIFIKASI') || statusSpan.includes('PROSES'))) {
            row.style.display = '';
        } else if (filter === 'PENDING' && statusSpan.includes('PENDING')) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Export Payments PDF mock print function
function exportPaymentsPDF() {
    alert('Menyiapkan dokumen PDF Rekap Laporan Pembayaran Anda... Mengunduh secara otomatis.');
    window.print();
}

document.addEventListener('DOMContentLoaded', () => {
    // Auto-fill payment amount on startup
    autoFillAmount();

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

    // Real-time keyword text search
    const searchInput = document.getElementById('searchInputField');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                if (row.cells.length === 1) return; // skip empty state
                
                const invoiceCode = row.cells[0].innerText.toLowerCase();
                const dateVal = row.cells[1].innerText.toLowerCase();
                const methodVal = row.cells[3].innerText.toLowerCase();
                
                if (invoiceCode.includes(query) || dateVal.includes(query) || methodVal.includes(query)) {
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
