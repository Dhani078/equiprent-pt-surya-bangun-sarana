<?php
$fullName = $_SESSION['full_name'] ?? 'Customer';
$role = $_SESSION['role'] ?? 'CUSTOMER';
$currentPage = 'customer_profile';

$fullNameProfile = $profile['full_name'] ?? $fullName;
$emailProfile = $profile['email'] ?? 'pelanggan@suryabangun.co.id';
$phoneProfile = $profile['phone'] ?? '-';
$addressProfile = $profile['address'] ?? '-';
$companyProfile = $profile['company_name'] ?? '-';
$statusProfile = $profile['status'] ?? 'ACTIVE';
$userIdProfile = $profile['id'] ?? $_SESSION['user_id'];
$createdAtProfile = $profile['created_at'] ?? date('Y-m-d H:i:s');
$joinDays = max(1, round((time() - strtotime($createdAtProfile)) / (60 * 60 * 24)));

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
<title>SBS EquipRent - Profil Pelanggan</title>
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
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
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
<body class="bg-background text-on-surface antialiased">

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
    <h2 class="font-headline-md text-headline-md font-bold text-primary">Detail Profil</h2>
  </div>
  <div class="flex items-center gap-6">
    <div class="hidden sm:flex items-center bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant">
      <span class="material-symbols-outlined text-on-surface-variant mr-2">search</span>
      <input id="searchInputField" class="bg-transparent border-none focus:ring-0 text-body-md font-body-md w-48 p-0" placeholder="Cari info profil..." type="text">
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

<!-- Main Canvas -->
<main class="md:ml-sidebar-width pt-20 min-h-screen">
<div class="p-container-padding">
<?php if (isset($_SESSION['success'])): ?>
    <div class="max-w-6xl mx-auto mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
        <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-emerald-600 font-bold">check_circle</span>
            <span class="text-sm font-semibold"><?= htmlspecialchars($_SESSION['success']) ?></span>
        </div>
        <button onclick="this.parentElement.remove()" class="text-emerald-500 hover:text-emerald-700 font-bold text-xs">Tutup</button>
    </div>
    <?php unset($_SESSION['success']); ?>
<?php endif; ?>

<?php if (isset($_SESSION['error'])): ?>
    <div class="max-w-6xl mx-auto mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
        <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-rose-600 font-bold">error</span>
            <span class="text-sm font-semibold"><?= htmlspecialchars($_SESSION['error']) ?></span>
        </div>
        <button onclick="this.parentElement.remove()" class="text-rose-500 hover:text-rose-700 font-bold text-xs">Tutup</button>
    </div>
    <?php unset($_SESSION['error']); ?>
<?php endif; ?>

<div class="max-w-6xl mx-auto grid grid-cols-12 gap-grid-gutter pb-24">
<!-- Left Column (Personal & Org Details) -->
<div class="col-span-12 lg:col-span-7 space-y-grid-gutter">
<!-- Detail Pribadi Card -->
<div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover">
<div class="flex justify-between items-center mb-6">
<h3 class="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
<span class="material-symbols-outlined">person_outline</span>
                                Detail Pribadi
                            </h3>
<button onclick="openEditProfileModal()" class="text-primary font-semibold text-sm hover:underline cursor-pointer">Edit Profil</button>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="space-y-1">
<p class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Nama Lengkap</p>
<p class="font-body-lg text-body-lg font-medium"><?= htmlspecialchars($fullNameProfile) ?></p>
</div>
<div class="space-y-1">
<p class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Email Utama</p>
<p class="font-body-lg text-body-lg font-medium"><?= htmlspecialchars($emailProfile) ?></p>
</div>
<div class="space-y-1">
<p class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Nomor Telepon</p>
<p class="font-body-lg text-body-lg font-medium"><?= htmlspecialchars($phoneProfile) ?></p>
</div>
<div class="space-y-1">
<p class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Lokasi Kantor</p>
<p class="font-body-lg text-body-lg font-medium">Banjarmasin, Indonesia</p>
</div>
</div>
</div>
<!-- Detail Organisasi Card -->
<div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover">
<div class="flex justify-between items-center mb-6">
<h3 class="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
<span class="material-symbols-outlined">corporate_fare</span>
                                Detail Organisasi
                            </h3>
</div>
<div class="space-y-6">
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="space-y-1">
<p class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">ID Pelanggan</p>
<p class="font-label-caps text-label-caps bg-surface-container text-primary px-2 py-1 rounded inline-block font-bold">CUST-SBS-<?= sprintf('%04d', $userIdProfile) ?></p>
</div>
<div class="space-y-1">
<p class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Nama Perusahaan</p>
<p class="font-body-lg text-body-lg font-medium"><?= htmlspecialchars($companyProfile) ?></p>
</div>
</div>
<div class="space-y-1">
<p class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Alamat Lengkap Perusahaan</p>
<p class="font-body-md text-body-md"><?= htmlspecialchars($addressProfile) ?></p>
</div>
<div class="flex gap-4 p-4 bg-surface-container rounded-lg items-center">
<span class="material-symbols-outlined text-primary text-4xl" style="font-variation-settings:'FILL' 1">verified</span>
<div>
<p class="font-body-md font-bold text-primary">Pajak Terverifikasi</p>
<p class="text-xs text-on-surface-variant">Dokumen NPWP dan Legalitas telah divalidasi oleh sistem administrasi PT. SBS.</p>
</div>
</div>
</div>
</div>
</div>

<!-- Right Column (Profile Card & Loyalty) -->
<div class="col-span-12 lg:col-span-5 space-y-grid-gutter">
<!-- Main Profile Preview Card -->
<div class="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant card-hover text-center relative overflow-hidden">
<div class="absolute top-0 left-0 w-full h-24 bg-primary/10"></div>
<div class="relative">
<div class="w-32 h-32 rounded-full mx-auto border-4 border-white overflow-hidden shadow-lg mb-4">
<img alt="<?= htmlspecialchars($fullNameProfile) ?>" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa-cF4bdpj4v0Ni5mZqpZkF--gLclGUuNpji4XwT9kHHayoOP8HsouhxihPEwIWEkKfJGTrxLSUkAdArjhUxdlLpuZCb4D6SPx1_KW5cMiQkuy0eDh_TfMcsGk4s4VqGGZwKQgVh_7DLAHUrdn-j49gYpiZjHQJ9hCGxMatY5x1GA2w2RQZFdwKNN-Hwy8qjH398udcRwX9TmMKzFid7sJiNUMkviypIqrq31bwuq2gGhdR2E0JgwEclZxQ-AvYyCS4ffo3BppgY3w"/>
</div>
<h2 class="font-headline-md text-headline-md text-primary"><?= htmlspecialchars($fullNameProfile) ?></h2>
<p class="font-body-md text-on-surface-variant mb-4">Penyewa Utama</p>
<div class="flex flex-wrap justify-center gap-2 mb-6">
<span class="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-semibold uppercase tracking-wider">Mitra Konstruksi</span>
<span class="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-xs font-semibold uppercase tracking-wider">Banjarmasin</span>
</div>
<div class="grid grid-cols-2 gap-4 border-t border-outline-variant pt-6">
<div>
<p class="text-xs text-on-surface-variant">Lama Bergabung</p>
<p class="font-bold text-primary"><?= $joinDays ?> Hari</p>
</div>
<div>
<p class="text-xs text-on-surface-variant">Total Rental</p>
<p class="font-bold text-primary"><?= $totalRentals ?> Unit</p>
</div>
</div>
</div>
</div>

<!-- Loyalty Card (Platinum Partner) -->
<div class="bg-primary text-on-primary p-6 rounded-xl shadow-lg relative overflow-hidden group card-hover">
<!-- Decorative Abstract Background -->
<div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
<div class="flex justify-between items-start mb-4">
<div>
<p class="font-label-caps text-label-caps opacity-80 mb-1">TINGKAT PARTNER</p>
<h3 class="font-headline-sm text-headline-sm flex items-center gap-2">
                                    Gold Partner
                                    <span class="material-symbols-outlined text-amber-400" style="font-variation-settings: 'FILL' 1;">workspace_premium</span>
</h3>
</div>
<div class="bg-white/20 p-2 rounded-lg backdrop-blur-md">
<span class="material-symbols-outlined text-white">stars</span>
</div>
</div>
<div class="mb-6">
<div class="flex justify-between items-end mb-2 text-xs">
<p>Layanan Prioritas Operasional</p>
<p class="opacity-80">Aktif</p>
</div>
<div class="w-full h-2 bg-white/20 rounded-full overflow-hidden">
<div class="h-full bg-white rounded-full transition-all duration-1000 ease-out" style="width: 75%;"></div>
</div>
</div>
<button onclick="openBenefitModal()" class="w-full py-2.5 bg-white text-primary font-bold rounded-lg hover:bg-surface-variant transition-colors text-sm cursor-pointer">
                            Lihat Benefit Partner
                        </button>
</div>

<!-- Account Health Card -->
<div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover">
<h4 class="font-body-md font-bold text-primary mb-4">Ringkasan Keamanan Akun</h4>
<ul class="space-y-4">
<li class="flex items-center gap-3">
<span class="material-symbols-outlined text-green-600">check_circle</span>
<span class="text-sm">Status Akun: <strong class="text-green-600 font-bold"><?= htmlspecialchars($statusProfile) ?></strong></span>
</li>
<li class="flex items-center gap-3">
<span class="material-symbols-outlined text-green-600">check_circle</span>
<span class="text-sm">E-KONTRAK: Aktif &amp; Terintegrasi</span>
</li>
<li class="flex items-center gap-3">
<span class="material-symbols-outlined text-on-surface-variant">schedule</span>
<span class="text-sm">Login Terakhir: Hari ini, <?= date('H:i') ?> WITA</span>
</li>
</ul>
</div>
</div>

<!-- Bottom Section (Account Security) -->
<div class="col-span-12">
<div class="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant card-hover">
<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
<div>
<h3 class="font-headline-sm text-headline-sm text-primary mb-1">Keamanan &amp; Autentikasi</h3>
<p class="text-on-surface-variant text-body-md">Kelola kata sandi dan proteksi otentikasi akun Anda.</p>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
<div onclick="openChangePasswordModal()" class="p-6 bg-surface-container-low rounded-lg hover:border-primary border border-transparent transition-all cursor-pointer">
<span class="material-symbols-outlined text-primary mb-4 text-3xl">lock</span>
<p class="font-body-md font-bold text-primary mb-1">Ubah Kata Sandi</p>
<p class="text-xs text-on-surface-variant">Perbarui kata sandi login Anda secara berkala.</p>
</div>
<div onclick="openTwoFactorModal()" class="p-6 bg-surface-container-low rounded-lg hover:border-primary border border-transparent transition-all cursor-pointer">
<span class="material-symbols-outlined text-primary mb-4 text-3xl">authenticator</span>
<p class="font-body-md font-bold text-primary mb-1">Otentikasi 2 Faktor (2FA)</p>
<p class="text-xs text-on-surface-variant">Amankan akun dengan verifikasi tambahan.</p>
</div>
<div onclick="openActiveSessionsModal()" class="p-6 bg-surface-container-low rounded-lg hover:border-primary border border-transparent transition-all cursor-pointer">
<span class="material-symbols-outlined text-primary mb-4 text-3xl">devices</span>
<p class="font-body-md font-bold text-primary mb-1">Daftar Sesi Aktif</p>
<p class="text-xs text-on-surface-variant">Lihat daftar perangkat yang terhubung ke akun Anda.</p>
</div>
</div>
</div>
</div>
</div>
</div>
</main>

<!-- Contextual Support FAB -->
<div class="fixed bottom-8 right-8 z-30">
  <button id="supportAgentFAB" class="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
    <span class="material-symbols-outlined text-3xl">support_agent</span>
  </button>
</div>

<!-- Help Modal Dialog -->
<div id="helpModalDialog" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
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
      <button id="closeHelpModalOk" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md">Saya Mengerti</button>
    </div>
  </div>
</div>

<script>
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

    // Help Modal / Support Agent click
    const helpBtn = document.getElementById('helpOutlineBtn');
    const supportBtn = document.getElementById('supportAgentFAB');
    const helpModal = document.getElementById('helpModalDialog');
    const closeHelpCross = document.getElementById('closeHelpModalCross');
    const closeHelpOk = document.getElementById('closeHelpModalOk');

    const openHelp = () => {
        if (helpModal) helpModal.classList.remove('hidden');
    };

    if (helpBtn) helpBtn.addEventListener('click', openHelp);
    if (supportBtn) supportBtn.addEventListener('click', openHelp);

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

// --- CUSTOMER PROFILE PREMIUM OPERATIONAL MODALS ---

// Benefit Partner Modal
function openBenefitModal() {
    document.getElementById('benefitModalDialog').classList.remove('hidden');
}
function closeBenefitModal() {
    document.getElementById('benefitModalDialog').classList.add('hidden');
}

// Edit Profil Modal
function openEditProfileModal() {
    document.getElementById('editProfileModalDialog').classList.remove('hidden');
}
function closeEditProfileModal() {
    document.getElementById('editProfileModalDialog').classList.add('hidden');
}

// Ubah Kata Sandi Modal
function openChangePasswordModal() {
    document.getElementById('changePasswordModalDialog').classList.remove('hidden');
}
function closeChangePasswordModal() {
    document.getElementById('changePasswordModalDialog').classList.add('hidden');
}
function validatePasswordChange(event) {
    const newPass = document.getElementById('newPasswordInput').value;
    const confirmPass = document.getElementById('confirmPasswordInput').value;
    if (newPass !== confirmPass) {
        alert("Konfirmasi kata sandi baru tidak cocok!");
        event.preventDefault();
        return false;
    }
    return true;
}

// Otentikasi 2 Faktor (2FA) Modal
function openTwoFactorModal() {
    document.getElementById('twoFactorModalDialog').classList.remove('hidden');
    document.getElementById('otpCodeField').value = '';
    const feedback = document.getElementById('otpFeedbackArea');
    feedback.className = 'hidden';
    feedback.innerText = '';
    const activateBtn = document.getElementById('activate2FABtn');
    activateBtn.disabled = false;
    activateBtn.className = 'bg-primary text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer';
}
function closeTwoFactorModal() {
    document.getElementById('twoFactorModalDialog').classList.add('hidden');
}
function submit2FAVerification() {
    const otpVal = document.getElementById('otpCodeField').value.trim();
    const feedback = document.getElementById('otpFeedbackArea');
    if (otpVal.length !== 6 || isNaN(otpVal)) {
        feedback.className = 'text-center text-xs font-semibold py-2 text-error block';
        feedback.innerText = 'Kode OTP harus berupa 6 digit angka!';
        return;
    }
    
    // Simulate premium verification and lock-in
    feedback.className = 'text-center text-xs font-semibold py-2 text-emerald-600 block animate-bounce';
    feedback.innerText = 'Verifikasi sukses! Dua Faktor Autentikasi (2FA) kini diaktifkan untuk akun Anda.';
    
    const activateBtn = document.getElementById('activate2FABtn');
    activateBtn.disabled = true;
    activateBtn.className = 'bg-gray-400 text-white px-5 py-2 rounded-lg font-bold text-xs cursor-not-allowed';
    
    // Show toast message
    setTimeout(() => {
        // Show success alert
        const alertBox = document.createElement('div');
        alertBox.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 text-sm font-bold flex items-center gap-3 animate-fade-in';
        alertBox.innerHTML = '<span class="material-symbols-outlined text-white">verified_user</span> Otentikasi 2 Faktor (2FA) Berhasil Diaktifkan!';
        document.body.appendChild(alertBox);
        
        setTimeout(() => {
            alertBox.remove();
            closeTwoFactorModal();
        }, 1500);
    }, 1200);
}

// Sesi Aktif Modal
function openActiveSessionsModal() {
    document.getElementById('activeSessionsModalDialog').classList.remove('hidden');
}
function closeActiveSessionsModal() {
    document.getElementById('activeSessionsModalDialog').classList.add('hidden');
}
function revokeActiveSession(rowId, deviceName) {
    if (confirm(`Apakah Anda yakin ingin mengeluarkan sesi dari perangkat ${deviceName}?`)) {
        const row = document.getElementById(rowId);
        if (row) {
            row.style.opacity = '0';
            setTimeout(() => {
                row.remove();
                
                // Show notification toast
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-4 right-4 bg-primary text-white px-4 py-3 rounded-lg shadow-xl z-50 text-xs font-semibold flex items-center gap-2 animate-bounce';
                toast.innerHTML = `<span class="material-symbols-outlined text-sm font-bold">cancel</span> Sesi perangkat ${deviceName} berhasil dicabut!`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2500);
            }, 300);
        }
    }
}
</script>

<!-- --- HTML MODAL DIALOGS DECLARATIONS --- -->

<!-- Benefit Partner Modal Dialog -->
<div id="benefitModalDialog" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in">
    <button onclick="closeBenefitModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-6">
      <div class="bg-primary/10 p-3 rounded-lg text-primary flex items-center justify-center">
        <span class="material-symbols-outlined text-amber-500 text-3xl" style="font-variation-settings: 'FILL' 1;">workspace_premium</span>
      </div>
      <div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Keuntungan Gold Partner</h3>
        <p class="text-xs text-on-surface-variant">Layanan Eksklusif Mitra PT. SBS Banjarmasin</p>
      </div>
    </div>
    <div class="space-y-4 text-body-md text-on-surface">
      <p class="text-sm">Selamat! Sebagai <strong>Gold Partner</strong> (mitra dengan rekam jejak penyewaan aktif), Anda berhak atas sejumlah prioritas operasional berikut:</p>
      <div class="space-y-3">
        <div class="flex gap-3 p-3 bg-surface-container rounded-lg items-start">
          <span class="material-symbols-outlined text-amber-500 font-bold">check_circle</span>
          <div>
            <p class="font-bold text-sm text-primary">Diskon Sewa 10%</p>
            <p class="text-xs text-on-surface-variant">Potongan otomatis 10% untuk biaya harian seluruh unit alat berat.</p>
          </div>
        </div>
        <div class="flex gap-3 p-3 bg-surface-container rounded-lg items-start">
          <span class="material-symbols-outlined text-amber-500 font-bold">check_circle</span>
          <div>
            <p class="font-bold text-sm text-primary">Prioritas Alokasi Unit (Priority Dispatch)</p>
            <p class="text-xs text-on-surface-variant">Alokasi unit tercepat saat pemesanan tinggi di musim konstruksi.</p>
          </div>
        </div>
        <div class="flex gap-3 p-3 bg-surface-container rounded-lg items-start">
          <span class="material-symbols-outlined text-amber-500 font-bold">check_circle</span>
          <div>
            <p class="font-bold text-sm text-primary">Operator Bersertifikasi Khusus</p>
            <p class="text-xs text-on-surface-variant">Pilihan operator senior dengan lisensi SIO aktif tingkat nasional.</p>
          </div>
        </div>
        <div class="flex gap-3 p-3 bg-surface-container rounded-lg items-start">
          <span class="material-symbols-outlined text-amber-500 font-bold">check_circle</span>
          <div>
            <p class="font-bold text-sm text-primary">Jatuh Tempo Pembayaran Fleksibel</p>
            <p class="text-xs text-on-surface-variant">Masa pembayaran diperpanjang hingga 14 hari kerja setelah invoice diterbitkan.</p>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-6 text-right">
      <button onclick="closeBenefitModal()" class="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md cursor-pointer">Tutup Benefit</button>
    </div>
  </div>
</div>

<!-- Edit Profil Modal Dialog -->
<div id="editProfileModalDialog" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in">
    <button onclick="closeEditProfileModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-6">
      <div class="bg-primary/10 p-3 rounded-lg text-primary flex items-center justify-center">
        <span class="material-symbols-outlined text-primary text-3xl">edit</span>
      </div>
      <div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Perbarui Profil Pelanggan</h3>
        <p class="text-xs text-on-surface-variant">Pastikan data legalitas perusahaan Anda valid</p>
      </div>
    </div>
    <form action="index.php?page=customer_update_profile" method="POST" class="space-y-4">
      <div class="space-y-1">
        <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nama Lengkap</label>
        <input type="text" name="full_name" value="<?= htmlspecialchars($fullNameProfile) ?>" required class="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary">
      </div>
      <div class="space-y-1">
        <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email Utama</label>
        <input type="email" name="email" value="<?= htmlspecialchars($emailProfile) ?>" required class="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary">
      </div>
      <div class="space-y-1">
        <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nomor Telepon</label>
        <input type="text" name="phone" value="<?= htmlspecialchars($phoneProfile) ?>" required class="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary">
      </div>
      <div class="space-y-1">
        <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nama Perusahaan</label>
        <input type="text" name="company_name" value="<?= htmlspecialchars($companyProfile) ?>" required class="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary">
      </div>
      <div class="space-y-1">
        <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Alamat Lengkap Perusahaan</label>
        <textarea name="address" rows="3" required class="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary"><?= htmlspecialchars($addressProfile) ?></textarea>
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t border-outline-variant pt-4">
        <button type="button" onclick="closeEditProfileModal()" class="px-4 py-2 border border-outline-variant text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-container-low transition-colors cursor-pointer">Batal</button>
        <button type="submit" class="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Simpan Perubahan</button>
      </div>
    </form>
  </div>
</div>

<!-- Ubah Kata Sandi Modal Dialog -->
<div id="changePasswordModalDialog" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative m-4 animate-fade-in">
    <button onclick="closeChangePasswordModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-6">
      <div class="bg-primary/10 p-3 rounded-lg text-primary flex items-center justify-center">
        <span class="material-symbols-outlined text-primary text-3xl">lock_reset</span>
      </div>
      <div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Ubah Kata Sandi</h3>
        <p class="text-xs text-on-surface-variant">Gunakan kombinasi karakter yang kuat</p>
      </div>
    </div>
    <form action="index.php?page=customer_change_password" method="POST" onsubmit="return validatePasswordChange(event)" class="space-y-4">
      <div class="space-y-1">
        <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kata Sandi Saat Ini</label>
        <input type="password" id="oldPasswordInput" name="old_password" required class="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary">
      </div>
      <div class="space-y-1">
        <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kata Sandi Baru</label>
        <input type="password" id="newPasswordInput" name="new_password" required class="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary">
      </div>
      <div class="space-y-1">
        <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Konfirmasi Kata Sandi Baru</label>
        <input type="password" id="confirmPasswordInput" name="confirm_password" required class="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary">
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t border-outline-variant pt-4">
        <button type="button" onclick="closeChangePasswordModal()" class="px-4 py-2 border border-outline-variant text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-container-low transition-colors cursor-pointer">Batal</button>
        <button type="submit" class="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Perbarui Sandi</button>
      </div>
    </form>
  </div>
</div>

<!-- Otentikasi 2 Faktor (2FA) Modal Dialog -->
<div id="twoFactorModalDialog" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative m-4 animate-fade-in">
    <button onclick="closeTwoFactorModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-6">
      <div class="bg-primary/10 p-3 rounded-lg text-primary flex items-center justify-center">
        <span class="material-symbols-outlined text-primary text-3xl">qr_code_2</span>
      </div>
      <div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Setup Otentikasi 2 Faktor</h3>
        <p class="text-xs text-on-surface-variant">Tingkatkan keamanan akun dengan Google Authenticator</p>
      </div>
    </div>
    <div class="space-y-4">
      <div class="flex flex-col items-center bg-surface-container p-4 rounded-lg">
        <img alt="2FA QR Code" class="w-40 h-40 border border-outline-variant rounded bg-white p-2 mb-3" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=otpauth://totp/SBS-EquipRent:<?= urlencode($emailProfile) ?>?secret=SBSEquipRentSecretKey123&issuer=SBS-EquipRent">
        <p class="text-[10px] text-on-surface-variant font-mono select-all">Secret Key: <strong>SBSEquipRentSecretKey123</strong></p>
      </div>
      <div class="space-y-2 text-xs text-on-surface-variant">
        <p>1. Pindai kode QR di atas menggunakan aplikasi **Google Authenticator** atau **Microsoft Authenticator** Anda.</p>
        <p>2. Masukkan kode 6 digit dari aplikasi untuk memverifikasi pemasangan:</p>
      </div>
      <div class="space-y-2">
        <input type="text" id="otpCodeField" placeholder="Masukkan 6-Digit OTP (contoh: 123456)" maxlength="6" class="w-full text-center px-4 py-3 border border-outline-variant rounded-lg font-mono text-lg tracking-[0.3em] focus:border-primary focus:ring-1 focus:ring-primary">
        <div id="otpFeedbackArea" class="hidden text-center text-xs font-semibold py-1"></div>
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t border-outline-variant pt-4">
        <button type="button" onclick="closeTwoFactorModal()" class="px-4 py-2 border border-outline-variant text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-container-low transition-colors cursor-pointer">Batal</button>
        <button id="activate2FABtn" onclick="submit2FAVerification()" class="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer">Aktifkan Sekarang</button>
      </div>
    </div>
  </div>
</div>

<!-- Daftar Sesi Aktif Modal Dialog -->
<div id="activeSessionsModalDialog" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl relative m-4 animate-fade-in">
    <button onclick="closeActiveSessionsModal()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-6">
      <div class="bg-primary/10 p-3 rounded-lg text-primary flex items-center justify-center">
        <span class="material-symbols-outlined text-primary text-3xl">devices</span>
      </div>
      <div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Sesi Login Aktif</h3>
        <p class="text-xs text-on-surface-variant">Daftar perangkat yang saat ini masuk ke akun Anda</p>
      </div>
    </div>
    <div class="space-y-4">
      <p class="text-xs text-on-surface-variant">Jika Anda melihat aktivitas yang tidak dikenal, segera keluarkan sesi tersebut dan ubah kata sandi Anda.</p>
      <div class="divide-y divide-outline-variant/30">
        <!-- Session 1: Current -->
        <div class="py-3 flex justify-between items-center">
          <div class="flex gap-3 items-center">
            <span class="material-symbols-outlined text-primary text-2xl">laptop_mac</span>
            <div>
              <p class="font-bold text-sm text-primary flex items-center gap-1.5">
                Chrome di Windows 11
                <span class="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Perangkat Ini</span>
              </p>
              <p class="text-xs text-on-surface-variant font-mono">192.168.1.45 • Banjarmasin, Indonesia</p>
              <p class="text-[10px] text-emerald-600 font-semibold mt-0.5">Aktif Sekarang</p>
            </div>
          </div>
          <span class="text-xs text-on-surface-variant font-semibold">Tersambung</span>
        </div>
        
        <!-- Session 2: Phone -->
        <div id="phoneSessionRow" class="py-3 flex justify-between items-center transition-all duration-300">
          <div class="flex gap-3 items-center">
            <span class="material-symbols-outlined text-on-surface-variant text-2xl">phone_iphone</span>
            <div>
              <p class="font-bold text-sm text-primary">Safari di iPhone 15 Pro</p>
              <p class="text-xs text-on-surface-variant font-mono">114.125.45.92 • Banjarmasin, Indonesia</p>
              <p class="text-[10px] text-on-surface-variant mt-0.5">Terakhir Aktif: 2 jam yang lalu</p>
            </div>
          </div>
          <button onclick="revokeActiveSession('phoneSessionRow', 'Safari di iPhone 15 Pro')" class="text-error hover:bg-error-container/20 px-3 py-1.5 rounded-lg border border-error-container/30 text-xs font-bold transition-all cursor-pointer font-semibold">
            Keluarkan
          </button>
        </div>

        <!-- Session 3: Tablet -->
        <div id="tabletSessionRow" class="py-3 flex justify-between items-center transition-all duration-300">
          <div class="flex gap-3 items-center">
            <span class="material-symbols-outlined text-on-surface-variant text-2xl">tablet_mac</span>
            <div>
              <p class="font-bold text-sm text-primary">Chrome di iPad Pro</p>
              <p class="text-xs text-on-surface-variant font-mono">180.244.112.5 • Jakarta, Indonesia</p>
              <p class="text-[10px] text-on-surface-variant mt-0.5">Terakhir Aktif: 3 hari yang lalu</p>
            </div>
          </div>
          <button onclick="revokeActiveSession('tabletSessionRow', 'Chrome di iPad Pro')" class="text-error hover:bg-error-container/20 px-3 py-1.5 rounded-lg border border-error-container/30 text-xs font-bold transition-all cursor-pointer font-semibold">
            Keluarkan
          </button>
        </div>
      </div>
    </div>
    <div class="mt-6 text-right border-t border-outline-variant pt-4">
      <button onclick="closeActiveSessionsModal()" class="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md cursor-pointer">Tutup</button>
    </div>
  </div>
</div>

</body>
</html>
