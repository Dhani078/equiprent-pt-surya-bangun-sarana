<?php
$fullName = $_SESSION['full_name'] ?? 'Customer';
$role = $_SESSION['role'] ?? 'CUSTOMER';
$currentPage = 'customer_dashboard';

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
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>SBS EquipRent - Customer Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "secondary-fixed":"#d5e3fc","background":"#f7f9fb","secondary-container":"#d5e3fc",
        "surface-container-lowest":"#ffffff","primary":"#003366","surface":"#f7f9fb",
        "primary-fixed-dim":"#a7c8ff","on-tertiary":"#ffffff","on-background":"#191c1e",
        "error-container":"#ffdad6","primary-fixed":"#d5e3ff",
        "on-secondary-fixed-variant":"#3a485b","on-surface":"#191c1e","on-error":"#ffffff",
        "tertiary-container":"#003751","inverse-primary":"#a7c8ff",
        "on-primary-fixed-variant":"#1f477b","inverse-surface":"#2d3133",
        "surface-container-highest":"#e0e3e5","outline":"#737780",
        "outline-variant":"#c3c6d1","on-primary-container":"#799dd6",
        "secondary-fixed-dim":"#b9c7df","on-secondary-container":"#57657a",
        "surface-bright":"#f7f9fb","on-primary":"#ffffff",
        "surface-container-low":"#f2f4f6","on-surface-variant":"#43474f",
        "on-primary-fixed":"#001b3c","error":"#ba1a1a","primary-container":"#003366",
        "surface-tint":"#3a5f94","inverse-on-surface":"#eff1f3","on-secondary":"#ffffff",
        "tertiary-fixed-dim":"#89ceff","surface-container":"#eceef0",
        "surface-variant":"#e0e3e5","on-secondary-fixed":"#0d1c2e",
        "on-tertiary-fixed-variant":"#004c6e","on-error-container":"#93000a",
        "tertiary":"#002133","tertiary-fixed":"#c9e6ff","on-tertiary-fixed":"#001e2f",
        "secondary":"#515f74","surface-dim":"#d8dadc",
        "on-tertiary-container":"#0fa5e9","surface-container-high":"#e6e8ea"
      },
      spacing:{"grid-gutter":"20px","sidebar-width":"260px","container-padding":"24px","base":"4px","element-gap":"16px"},
      fontFamily:{"label-caps":["JetBrains Mono"],"body-md":["Hanken Grotesk"],"display-lg":["Hanken Grotesk"],"headline-sm":["Hanken Grotesk"],"table-header":["Hanken Grotesk"],"body-lg":["Hanken Grotesk"],"headline-md":["Hanken Grotesk"]},
      fontSize:{"label-caps":["12px",{"lineHeight":"16px","letterSpacing":"0.05em","fontWeight":"500"}],"body-md":["14px",{"lineHeight":"20px","fontWeight":"400"}],"display-lg":["32px",{"lineHeight":"40px","letterSpacing":"-0.02em","fontWeight":"700"}],"headline-sm":["20px",{"lineHeight":"28px","fontWeight":"600"}],"table-header":["12px",{"lineHeight":"16px","fontWeight":"600"}],"body-lg":["16px",{"lineHeight":"24px","fontWeight":"400"}],"headline-md":["24px",{"lineHeight":"32px","letterSpacing":"-0.01em","fontWeight":"600"}]}
    }
  }
}
</script>
<style>
.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24}
body{font-family:'Hanken Grotesk',sans-serif;background:#f7f9fb}
.card-hover{transition:all .3s cubic-bezier(.4,0,.2,1)}
.card-hover:hover{transform:translateY(-4px);box-shadow:0 12px 24px rgba(0,0,0,.06)}
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
          <p class="font-label-caps text-label-caps text-on-surface-variant opacity-70 uppercase">Customer Portal</p>
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

<!-- Main Content -->
<main class="md:ml-sidebar-width min-h-screen">
<!-- Top App Bar -->
<header class="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-30 flex justify-between items-center h-16 px-container-padding w-full">
  <div class="flex items-center gap-4">
    <button id="sidebarToggleBtn" class="md:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors"><span class="material-symbols-outlined">menu</span></button>
    <h2 class="font-headline-md text-headline-md font-bold text-primary">Dashboard Customer</h2>
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

<!-- Content Grid -->
<div class="p-container-padding space-y-grid-gutter">
  <!-- Welcome Section -->
  <section class="grid grid-cols-1 md:grid-cols-3 gap-grid-gutter">
    <div class="md:col-span-2 bg-primary-container text-on-primary-container p-8 rounded-xl relative overflow-hidden flex flex-col justify-center">
      <div class="relative z-10">
        <h3 class="font-headline-md text-headline-md mb-2">Selamat Datang, <?= htmlspecialchars($fullName) ?></h3>
        <p class="font-body-lg text-body-lg opacity-90 max-w-md">Pantau status penyewaan alat berat Anda secara real-time dan kelola administrasi dengan mudah.</p>
        <a href="index.php?page=customer_rentals" class="inline-block mt-6 bg-secondary-fixed text-on-secondary-fixed px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity">Sewa Alat Baru</a>
      </div>
      <div class="absolute right-0 top-0 h-full w-1/3 opacity-20 hidden lg:block">
        <span class="material-symbols-outlined text-[180px]">precision_manufacturing</span>
      </div>
    </div>
    <div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex flex-col justify-between card-hover">
      <div>
        <h4 class="font-label-caps text-label-caps text-on-surface-variant mb-4">Ringkasan Aktif</h4>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="font-body-md text-body-md">Rental Berjalan</span>
            <span class="font-headline-sm text-headline-sm font-bold text-primary"><?= sprintf('%02d', $summary['active_rentals']) ?></span>
          </div>
          <div class="flex items-center justify-between">
            <span class="font-body-md text-body-md">Tagihan Pending</span>
            <span class="font-headline-sm text-headline-sm font-bold text-error">Rp <?= number_format($summary['pending_amount']/1000000, 1, ',', '.') ?>Jt</span>
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-outline-variant">
        <a class="text-primary font-semibold text-body-md flex items-center gap-1" href="index.php?page=customer_payments">Lihat Detail Keuangan <span class="material-symbols-outlined text-sm">arrow_forward</span></a>
      </div>
    </div>
  </section>

  <!-- Active Rentals -->
  <section>
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-headline-sm text-headline-sm text-primary">Status Rental Aktif</h3>
      <a href="index.php?page=customer_rentals" class="text-primary font-semibold text-body-md underline">Semua Rental</a>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-grid-gutter">
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
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden card-hover">
          <div class="h-40 relative">
            <img class="w-full h-full object-cover" src="<?= $imgUrl ?>" alt="<?= htmlspecialchars($rental['equipment_name']) ?>">
            <div class="absolute top-3 left-3 px-3 py-1 bg-primary/90 text-white rounded-full text-[10px] font-label-caps">ID: <?= htmlspecialchars($rental['equipment_code']) ?></div>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <h4 class="font-headline-sm text-headline-sm text-primary"><?= htmlspecialchars($rental['equipment_name']) ?></h4>
              <p class="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">location_on</span> <?= htmlspecialchars($rental['notes'] ?: 'Lokasi proyek') ?>
              </p>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-label-caps font-label-caps text-on-surface-variant">
                <span>SISA WAKTU</span>
                <span class="<?= $textColor ?> font-bold"><?= $daysRemaining ?> HARI LAGI</span>
              </div>
              <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div class="<?= $barColor ?> h-full" style="width:<?= $progress ?>%"></div>
              </div>
            </div>
            <div class="flex gap-2">
              <button onclick="openDailyLogModal('<?= htmlspecialchars($rental['equipment_name']) ?>', '<?= htmlspecialchars($rental['equipment_code']) ?>', <?= htmlspecialchars($rental['hour_meter'] ?? '1250') ?>)" class="flex-1 bg-surface-container-low border border-outline-variant py-2 rounded-lg text-body-md font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer">Log Harian</button>
              <button onclick="openExtendRentalModal('<?= htmlspecialchars($rental['equipment_name']) ?>', '<?= htmlspecialchars($rental['equipment_code']) ?>', '<?= htmlspecialchars($rental['rental_code']) ?>', '<?= $rental['end_date'] ?>')" class="flex-1 bg-primary text-white py-2 rounded-lg text-body-md font-semibold hover:opacity-90 transition-opacity cursor-pointer">Perpanjang</button>
            </div>
          </div>
        </div>
        <?php endforeach; ?>
      <?php endif; ?>

      <!-- Digital Contract Info Card -->
      <?php if ($latestContract): ?>
      <div class="bg-tertiary-container text-white p-6 rounded-xl flex flex-col justify-between border border-outline-variant/20 shadow-xl">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-label-caps text-label-caps text-on-tertiary-container">KONTRAK DIGITAL</h4>
            <span class="material-symbols-outlined text-on-tertiary-container">verified</span>
          </div>
          <h3 class="font-headline-sm text-headline-sm mb-4">Perjanjian Sewa #<?= htmlspecialchars($latestContract['contract_code']) ?></h3>
          <ul class="space-y-3 font-body-md text-body-md text-on-tertiary-container opacity-90">
            <li class="flex items-center gap-2"><span class="material-symbols-outlined text-sm">check_circle</span> Berlaku s/d <?= date('d M Y', strtotime($latestContract['valid_until'])) ?></li>
            <li class="flex items-center gap-2"><span class="material-symbols-outlined text-sm">check_circle</span> Alat: <?= htmlspecialchars($latestContract['equipment_name']) ?></li>
            <li class="flex items-center gap-2"><span class="material-symbols-outlined text-sm"><?= $latestContract['is_signed_customer'] ? 'check_circle' : 'pending' ?></span> <?= $latestContract['is_signed_customer'] ? 'Kontrak Telah Ditandatangani' : 'Menunggu Tanda Tangan' ?></li>
          </ul>
        </div>
        <div class="mt-6 flex flex-col gap-2">
          <button onclick="window.open('index.php?page=print_contract&id=<?= $latestContract['id'] ?>', '_blank')" class="w-full bg-white/10 border border-white/20 py-2 rounded-lg text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all cursor-pointer">
            <span class="material-symbols-outlined">download</span> Unduh PDF
          </button>
          <a href="index.php?page=customer_contracts" class="w-full bg-on-tertiary-container text-primary-container py-2 rounded-lg font-bold hover:opacity-90 text-center block">Lihat Detil Kontrak</a>
        </div>
      </div>
      <?php endif; ?>
    </div>
  </section>

  <!-- Bottom Row: Payment History & Support -->
  <section class="grid grid-cols-1 lg:grid-cols-3 gap-grid-gutter">
    <!-- Payment History -->
    <div class="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
        <h3 class="font-headline-sm text-headline-sm text-primary">Riwayat Pembayaran</h3>
        <span class="material-symbols-outlined text-on-surface-variant cursor-pointer">filter_list</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-surface-container-low font-table-header text-table-header text-on-surface-variant">
            <tr>
              <th class="px-6 py-3">NO. INVOICE</th>
              <th class="px-6 py-3">TANGGAL</th>
              <th class="px-6 py-3">NOMINAL</th>
              <th class="px-6 py-3">STATUS</th>
              <th class="px-6 py-3">AKSI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <?php if (empty($paymentHistory)): ?>
              <tr><td colspan="5" class="px-6 py-8 text-center text-on-surface-variant font-body-md">Belum ada riwayat pembayaran.</td></tr>
            <?php else: ?>
              <?php foreach ($paymentHistory as $pay):
                $isPaid = $pay['status'] === 'PAID';
                $badgeClass = $isPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
                $badgeText = $isPaid ? 'LUNAS' : strtoupper($pay['status']);
              ?>
              <tr class="hover:bg-surface-container-low transition-colors">
                <td class="px-6 py-4 font-body-md text-body-md text-primary font-bold"><?= htmlspecialchars($pay['payment_code']) ?></td>
                <td class="px-6 py-4 font-body-md text-body-md"><?= date('d M Y', strtotime($pay['payment_date'])) ?></td>
                <td class="px-6 py-4 font-body-md text-body-md">Rp <?= number_format($pay['amount'], 0, ',', '.') ?></td>
                <td class="px-6 py-4"><span class="px-3 py-1 <?= $badgeClass ?> rounded-full text-xs font-bold"><?= $badgeText ?></span></td>
                <td class="px-6 py-4">
                  <?php if ($isPaid): ?>
                    <span onclick="viewInvoiceReceipt('<?= $pay['payment_code'] ?>', '<?= date('d M Y', strtotime($pay['payment_date'])) ?>', <?= $pay['amount'] ?>, '<?= $pay['payment_method'] ?>')" class="material-symbols-outlined text-primary cursor-pointer hover:scale-110 active:scale-95 transition-all" title="Cetak Kwitansi Resmi">receipt</span>
                  <?php else: ?>
                    <button onclick="window.location.href='index.php?page=customer_payments'" class="bg-primary text-white px-3 py-1 rounded text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer">BAYAR</button>
                  <?php endif; ?>
                </td>
              </tr>
              <?php endforeach; ?>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Support Card -->
    <div class="bg-surface-container-high p-6 rounded-xl flex flex-col justify-between border border-outline-variant shadow-sm">
      <div>
        <h4 class="font-headline-sm text-headline-sm text-primary mb-4">Butuh Bantuan Teknis?</h4>
        <p class="font-body-md text-body-md text-on-surface-variant mb-6">Hubungi Account Manager Anda untuk kendala alat atau administrasi.</p>
        <div class="flex items-center gap-4 p-3 bg-white rounded-lg border border-outline-variant mb-6">
          <img class="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0KKyBu9-WvoLPqMrG4m_0Neos13YpcrKq0El1s3EqyfdGzWu8A-dhj7OHvLJCarJRbrUi5kSbEp3tSsAl5XOJcGggFsdq1g4h-AcL3qAt2H7YoV8LzxLomegaO-G4hZ575VwEgRHhrQo-3zWIUUrMMyR05DcPSZ6RRCx3PA2mhIYFGaIC_KuIOHWIwg_s5XmbzEl29vhBnjSOzjU3bjaIXXZ3UgUZ21uHsOtpzPBz-APrQwofNmP-yLXNbfikI4MDEtfNa4tJ3xkX" alt="Account Manager">
          <div>
            <h5 class="font-body-md text-body-md font-bold text-primary">Hendra Wijaya</h5>
            <p class="font-label-caps text-label-caps text-on-surface-variant">Staf Operasional</p>
          </div>
        </div>
        <div class="space-y-3">
          <button onclick="window.open('https://wa.me/6282198765432?text=Halo%20Hendra,%20saya%20ingin%20bertanya%20mengenai%20sewa%20alat%20berat%20di%20PT.%20SBS.', '_blank')" class="w-full bg-primary text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
            <span class="material-symbols-outlined">chat</span> Chat via WhatsApp
          </button>
          <button onclick="openHotlineDialog()" class="w-full bg-white border border-outline-variant py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors cursor-pointer">
            <span class="material-symbols-outlined">call</span> Hubungi Hotline
          </button>
        </div>
      </div>
    </div>
  </section>
</div>
</main>

<!-- FAB -->
<a href="index.php?page=customer_rentals" class="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-30 hover:scale-110 active:scale-95 transition-all">
  <span class="material-symbols-outlined">add</span>
</a>

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

<!-- Hotline Contact Dialog (Hubungi Hotline) -->
<div id="hotlineDialog" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-sm w-full p-6 shadow-xl relative m-4 animate-fade-in">
    <button onclick="closeHotlineDialog()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="flex items-center gap-3 mb-4">
      <div class="bg-primary-container p-2.5 rounded-lg text-white flex items-center justify-center">
        <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1">call</span>
      </div>
      <div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Hotline Operasional</h3>
        <p class="text-xs text-on-surface-variant">PT. SURYA BANGUN SARANA</p>
      </div>
    </div>
    
    <div class="space-y-4 text-body-md text-on-surface">
      <p class="text-xs text-on-surface-variant">Gunakan kontak di bawah ini untuk panggilan cepat darurat atau verifikasi kontrak segera:</p>
      
      <div class="space-y-3">
        <a href="tel:05113354321" class="flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant rounded-lg hover:bg-surface-container transition-colors block">
          <span class="material-symbols-outlined text-primary">call</span>
          <div>
            <p class="text-[10px] text-on-surface-variant font-label-caps uppercase">Office Hotline (Klik untuk Telepon)</p>
            <p class="font-bold text-primary">(0511) 335-4321</p>
          </div>
        </a>

        <a href="tel:+6281254321098" class="flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant rounded-lg hover:bg-surface-container transition-colors block">
          <span class="material-symbols-outlined text-primary">smartphone</span>
          <div>
            <p class="text-[10px] text-on-surface-variant font-label-caps uppercase">Emergency Mobile (Klik untuk Telepon)</p>
            <p class="font-bold text-primary">+62 812-5432-1098</p>
          </div>
        </a>

        <div class="flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant rounded-lg">
          <span class="material-symbols-outlined text-primary">mail</span>
          <div>
            <p class="text-[10px] text-on-surface-variant font-label-caps uppercase">Corporate Support Email</p>
            <p class="font-bold text-primary">support@suryabangun.co.id</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-6 text-right">
      <button onclick="closeHotlineDialog()" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md cursor-pointer">Tutup</button>
    </div>
  </div>
</div>

<!-- Invoice Receipt Dialog (Kwitansi Lunas Resmi) -->
<div id="invoiceReceiptModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative m-4 animate-fade-in">
    <button onclick="closeInvoiceReceipt()" class="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer">
      <span class="material-symbols-outlined">close</span>
    </button>
    
    <!-- Printable Invoice Header -->
    <div class="text-center pb-4 border-b border-dashed border-outline-variant mb-4">
      <div class="w-12 h-12 bg-primary mx-auto flex items-center justify-center rounded-lg mb-2">
        <span class="material-symbols-outlined text-white text-3xl" style="font-variation-settings: 'FILL' 1;">construction</span>
      </div>
      <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Kwitansi Pembayaran Resmi</h3>
      <p class="text-[10px] text-on-surface-variant uppercase tracking-wider font-label-caps">PT. SURYA BANGUN SARANA BANJARMASIN</p>
      <p class="text-[9px] text-on-surface-variant">Jl. Ahmad Yani KM 5, Banjarmasin • Telp: (0511) 335-4321</p>
    </div>

    <!-- Receipt Details -->
    <div class="space-y-3 text-left">
      <div class="flex justify-between text-xs"><span class="text-on-surface-variant">No. Invoice:</span><span id="receiptCodeVal" class="font-bold text-primary">PAY-SBS-20260505-001</span></div>
      <div class="flex justify-between text-xs"><span class="text-on-surface-variant">Tanggal Bayar:</span><span id="receiptDateVal" class="font-bold">05 May 2026</span></div>
      <div class="flex justify-between text-xs"><span class="text-on-surface-variant">Metode:</span><span id="receiptMethodVal" class="font-bold">Bank Transfer Mandiri</span></div>
      <div class="flex justify-between text-xs"><span class="text-on-surface-variant">Verifikasi:</span><span class="font-bold text-green-700">LUNAS / VERIFIED</span></div>
      
      <div class="border-t border-dashed border-outline-variant my-2 pt-2"></div>
      
      <div class="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-200">
        <div>
          <span class="text-[10px] text-green-800 font-label-caps uppercase font-bold text-left">Total Pembayaran</span>
          <p id="receiptAmountVal" class="font-headline-md text-headline-md font-bold text-green-700">Rp 77.500.000</p>
        </div>
        <span class="material-symbols-outlined text-green-700 text-3xl" style="font-variation-settings: 'FILL' 1;">verified_user</span>
      </div>
      
      <div class="p-3 bg-surface-container-low rounded-lg text-[10px] text-on-surface-variant">
        <p><strong>Catatan Legalitas:</strong> Kwitansi ini diterbitkan secara sah melalui sistem SBS EquipRent dan diakui sebagai bukti pelunasan biaya sewa unit alat berat resmi.</p>
      </div>
    </div>
    
    <div class="mt-6 flex gap-2 justify-end">
      <button onclick="window.print()" class="px-4 py-2 border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-container-low transition-colors cursor-pointer">Cetak Kwitansi</button>
      <button onclick="closeInvoiceReceipt()" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-body-md cursor-pointer">Tutup</button>
    </div>
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
    else if (lowerName.includes('bulldozer')) activeRentalPricePerDay = 3200000;
    else if (lowerName.includes('crane')) activeRentalPricePerDay = 5000000;
    else activeRentalPricePerDay = 1800000;
    
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

// hotlineDialog functions
function openHotlineDialog() {
    document.getElementById('hotlineDialog').classList.remove('hidden');
}

function closeHotlineDialog() {
    document.getElementById('hotlineDialog').classList.add('hidden');
}

// invoiceReceiptModal functions
function viewInvoiceReceipt(code, date, amount, method) {
    document.getElementById('receiptCodeVal').innerText = code;
    document.getElementById('receiptDateVal').innerText = date;
    document.getElementById('receiptMethodVal').innerText = method;
    document.getElementById('receiptAmountVal').innerText = 'Rp ' + parseFloat(amount).toLocaleString('id-ID');
    document.getElementById('invoiceReceiptModal').classList.remove('hidden');
}

function closeInvoiceReceipt() {
    document.getElementById('invoiceReceiptModal').classList.add('hidden');
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
</body>
</html>
