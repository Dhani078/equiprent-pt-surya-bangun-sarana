<?php
/**
 * ============================================================================
 * VIEW: views/admin/reports.php — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Halaman Cetak Laporan & Dokumentasi Sistem (Reports Terminal).
 * Menyajikan parameter filtering laporan cerdas (Jenis, Tanggal, Kategori),
 * visualisasi Bento stats riil pendapatan kotor & total sesi, pratinjau data
 * transaksi riil dari database, serta pseudo-chart representasi tren.
 * 
 * INTEGRITAS VISUAL MUTLAK (100% REPLIKASI DOM DARI PROTOTIPE ASLI STITCH):
 * - Menggunakan Hanken Grotesk (UI) & JetBrains Mono (Data Log)
 * - Sidebar Navigation 6 Menu dengan penanda bar aktif & border samping
 * - Bento Quick Stats yang menampilkan metrik riil teragregasi
 * - Skema warna, roundness, dan avatar yang konsisten dengan template asli.
 */

$fullName = $_SESSION['full_name'] ?? 'Alex Thompson';
$role = $_SESSION['role'] ?? 'SENIOR ADMIN';
$currentPage = 'reports'; // Menjadikan Reports aktif di menu sidebar

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
?>
<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>EquipRent MS - Reports Terminal</title>
    
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
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        body { font-family: 'Hanken Grotesk', sans-serif; background-color: #f7f9fb; }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    </style>
</head>
<body class="bg-surface">

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
    <main class="ml-0 lg:ml-[260px] min-h-screen flex flex-col">
        <!-- TopAppBar Component -->
        <header class="fixed top-0 right-0 z-40 h-16 w-full lg:w-[calc(100%-260px)] bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-container-padding">
            <div class="flex items-center flex-1 max-w-xl gap-3">
                <button id="sidebarToggleBtn" class="lg:hidden p-2 text-on-surface hover:bg-surface-container-high rounded transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined">menu</span>
                </button>
                <form action="index.php" method="GET" class="relative w-full group">
                    <input type="hidden" name="page" value="reports">
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

        <!-- Reporting View -->
        <div class="p-container-padding flex-1">
            <!-- Header Section -->
            <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <h2 class="font-headline-md text-headline-md text-primary">Laporan &amp; Dokumentasi</h2>
                    <p class="font-body-md text-on-surface-variant">Kelola dan ekspor data operasional armada Anda.</p>
                </div>
                <div class="flex gap-3 flex-wrap">
                    <a href="index.php?page=export_reports_excel&report_type=<?= urlencode($reportType) ?>&start_date=<?= urlencode($startDate) ?>&end_date=<?= urlencode($endDate) ?>" class="flex items-center gap-2 bg-white border border-outline-variant px-5 py-2.5 rounded hover:bg-surface-container-low transition-all active:scale-95 text-on-surface font-semibold shadow-sm whitespace-nowrap">
                        <span class="material-symbols-outlined text-[20px]">description</span>
                        <span class="font-body-md">Export Excel</span>
                    </a>
                    <a href="index.php?page=export_reports_pdf&report_type=<?= urlencode($reportType) ?>&start_date=<?= urlencode($startDate) ?>&end_date=<?= urlencode($endDate) ?>" target="_blank" class="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded hover:opacity-90 transition-all active:scale-95 font-semibold shadow-md whitespace-nowrap">
                        <span class="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                        <span class="font-body-md">Cetak PDF</span>
                    </a>
                </div>
            </div>
            
            <!-- Dashboard Layout: Bento Style -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-grid-gutter">
                <!-- Filter Panel (Bento Card) -->
                <div class="lg:col-span-4 bg-white border border-outline-variant rounded-xl p-6 shadow-sm h-fit">
                    <h3 class="font-headline-sm text-headline-sm text-primary mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">tune</span>
                        Konfigurasi Laporan
                    </h3>
                    <form class="space-y-6" method="GET" action="index.php">
                        <input type="hidden" name="page" value="reports">
                        <div class="space-y-2">
                            <label class="block font-body-md font-bold text-on-surface">Jenis Laporan</label>
                            <select name="report_type" onchange="this.form.submit()" class="w-full bg-surface-container-low border-outline-variant rounded p-3 text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                                <option value="Laporan Rental Bulanan" <?= $reportType === 'Laporan Rental Bulanan' ? 'selected' : '' ?>>1. Laporan Rental Bulanan</option>
                                <option value="Laporan Pembayaran & Piutang" <?= $reportType === 'Laporan Pembayaran & Piutang' ? 'selected' : '' ?>>2. Laporan Pembayaran & Piutang</option>
                                <option value="Laporan Pendapatan Bersih" <?= $reportType === 'Laporan Pendapatan Bersih' ? 'selected' : '' ?>>3. Laporan Pendapatan Bersih</option>
                                <option value="Laporan Maintenance & Servis" <?= $reportType === 'Laporan Maintenance & Servis' ? 'selected' : '' ?>>4. Laporan Maintenance & Servis</option>
                                <option value="Laporan Pemanfaatan & Hour Meter (HM)" <?= $reportType === 'Laporan Pemanfaatan & Hour Meter (HM)' ? 'selected' : '' ?>>5. Laporan Pemanfaatan & Hour Meter (HM)</option>
                                <option value="Laporan Evaluasi Kerusakan Unit" <?= $reportType === 'Laporan Evaluasi Kerusakan Unit' ? 'selected' : '' ?>>6. Laporan Evaluasi Kerusakan Unit</option>
                                <option value="Laporan Histori Telemetri GPS" <?= $reportType === 'Laporan Histori Telemetri GPS' ? 'selected' : '' ?>>7. Laporan Histori Telemetri GPS</option>
                                <option value="Laporan Evaluasi Kinerja Staf" <?= $reportType === 'Laporan Evaluasi Kinerja Staf' ? 'selected' : '' ?>>8. Laporan Evaluasi Kinerja Staf</option>
                                <option value="Laporan Stok & Penggunaan Suku Cadang" <?= $reportType === 'Laporan Stok & Penggunaan Suku Cadang' ? 'selected' : '' ?>>9. Laporan Stok & Penggunaan Suku Cadang</option>
                                <option value="Laporan Kepuasan Pelanggan" <?= $reportType === 'Laporan Kepuasan Pelanggan' ? 'selected' : '' ?>>10. Laporan Kepuasan Pelanggan</option>
                                <option value="Laporan Audit Trail & Log Sistem" <?= $reportType === 'Laporan Audit Trail & Log Sistem' ? 'selected' : '' ?>>11. Laporan Audit Trail & Log Sistem</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="block font-body-md font-bold text-on-surface">Mulai Dari</label>
                                <input name="start_date" value="<?= htmlspecialchars($startDate) ?>" class="w-full bg-surface-container-low border-outline-variant rounded p-3 text-body-md focus:ring-2 focus:ring-primary/20" type="date">
                            </div>
                            <div class="space-y-2">
                                <label class="block font-body-md font-bold text-on-surface">Sampai Dengan</label>
                                <input name="end_date" value="<?= htmlspecialchars($endDate) ?>" class="w-full bg-surface-container-low border-outline-variant rounded p-3 text-body-md focus:ring-2 focus:ring-primary/20" type="date">
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label class="block font-body-md font-bold text-on-surface">Kategori Alat</label>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center gap-2 p-2 hover:bg-surface-container-low rounded cursor-pointer">
                                    <input checked="" class="rounded text-primary focus:ring-primary" type="checkbox">
                                    <span class="font-body-md">Heavy Duty</span>
                                </label>
                                <label class="flex items-center gap-2 p-2 hover:bg-surface-container-low rounded cursor-pointer">
                                    <input checked="" class="rounded text-primary focus:ring-primary" type="checkbox">
                                    <span class="font-body-md">Small Power</span>
                                </label>
                                <label class="flex items-center gap-2 p-2 hover:bg-surface-container-low rounded cursor-pointer">
                                    <input class="rounded text-primary focus:ring-primary" type="checkbox">
                                    <span class="font-body-md">Transport</span>
                                </label>
                                <label class="flex items-center gap-2 p-2 hover:bg-surface-container-low rounded cursor-pointer">
                                    <input class="rounded text-primary focus:ring-primary" type="checkbox">
                                    <span class="font-body-md">Lifting</span>
                                </label>
                            </div>
                        </div>
                        <div class="pt-4">
                            <button class="w-full bg-secondary-container text-primary font-semibold py-3 rounded hover:bg-primary hover:text-white transition-all" type="submit">
                                Perbarui Pratinjau
                            </button>
                        </div>
                    </form>
                </div>
                
                <!-- Preview Panel (Bento Card) -->
                <div class="lg:col-span-8 space-y-grid-gutter">
                    <!-- Summary Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-grid-gutter">
                        <div class="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
                            <p class="font-label-caps text-label-caps text-on-surface-variant mb-1">Total Rental</p>
                            <h4 class="font-headline-md text-headline-md text-primary"><?= number_format($stats['total_rentals']) ?> Sesi</h4>
                            <div class="flex items-center gap-1 mt-2 text-green-600">
                                <span class="material-symbols-outlined text-[16px]">trending_up</span>
                                <span class="text-[12px] font-bold">+12% vs bln lalu</span>
                            </div>
                        </div>
                        <div class="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
                            <p class="font-label-caps text-label-caps text-on-surface-variant mb-1">Pendapatan Kotor</p>
                            <h4 class="font-headline-md text-headline-md text-primary">Rp <?= number_format($stats['gross_revenue'] / 1000000, 1, ',', '.') ?>Jt</h4>
                            <div class="flex items-center gap-1 mt-2 text-on-surface-variant">
                                <span class="material-symbols-outlined text-[16px]">info</span>
                                <span class="text-[12px]">Estimasi Akurat</span>
                            </div>
                        </div>
                        <div class="bg-white border border-outline-variant rounded-xl p-5 shadow-sm border-l-4 border-l-primary">
                            <p class="font-label-caps text-label-caps text-on-surface-variant mb-1">Status Laporan</p>
                            <h4 class="font-headline-md text-headline-md text-primary">Draft Siap</h4>
                            <div class="flex items-center gap-1 mt-2 text-primary">
                                <span class="material-symbols-outlined text-[16px]">verified</span>
                                <span class="text-[12px] font-bold">Terverifikasi Sistem</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Table Preview Area -->
                    <div class="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                        <div class="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                            <h4 class="font-headline-sm text-headline-sm text-primary">Pratinjau Data</h4>
                            <span class="bg-secondary-fixed text-on-secondary-fixed text-[12px] px-3 py-1 rounded-full font-bold">Showing <?= count($previewData['rows']) ?> of <?= number_format($stats['total_rentals']) ?> rows</span>
                        </div>
                        <div class="overflow-x-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-surface-container-lowest border-b border-outline-variant">
                                        <?php if (!empty($previewData['headers'])): ?>
                                            <?php foreach ($previewData['headers'] as $header): ?>
                                                <th class="p-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider <?= (strpos(strtolower($header), 'subtotal') !== false || strpos(strtolower($header), 'biaya') !== false || strpos(strtolower($header), 'jumlah') !== false || strpos(strtolower($header), 'pendapatan') !== false) ? 'text-right' : '' ?>"><?= htmlspecialchars($header) ?></th>
                                            <?php endforeach; ?>
                                        <?php else: ?>
                                            <th class="p-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">ID</th>
                                            <th class="p-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Data</th>
                                            <th class="p-4 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
                                        <?php endif; ?>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-outline-variant/30">
                                    <?php if (empty($previewData['rows'])): ?>
                                        <tr>
                                            <td colspan="<?= count($previewData['headers']) ?: 6 ?>" class="p-4 text-center text-on-surface-variant font-body-md">
                                                Tidak ada pratinjau data ditemukan untuk rentang tanggal ini.
                                            </td>
                                        </tr>
                                    <?php else: ?>
                                        <?php foreach ($previewData['rows'] as $row): 
                                            $columns = array_values($row);
                                            $firstCol = array_shift($columns);
                                            $badgeVal = array_pop($columns); // Status is the last column
                                            
                                            // Generate standard badges
                                            $badgeClass = "bg-slate-100 text-slate-800";
                                            if (in_array(strtoupper($badgeVal), ['ON_GOING', 'IN_PROGRESS', 'ON', 'ACTIVE'])) {
                                                $badgeClass = "bg-blue-100 text-blue-800";
                                            } elseif (in_array(strtoupper($badgeVal), ['APPROVED', 'COMPLETED', 'PAID'])) {
                                                $badgeClass = "bg-green-100 text-green-800";
                                            } elseif (in_array(strtoupper($badgeVal), ['PENDING', 'SCHEDULED', 'PENDING_VERIFICATION'])) {
                                                $badgeClass = "bg-orange-100 text-orange-800";
                                            } elseif (in_array(strtoupper($badgeVal), ['FAILED', 'CANCELLED', 'REJECTED', 'SUSPENDED'])) {
                                                $badgeClass = "bg-red-100 text-red-800";
                                            }
                                        ?>
                                            <tr class="hover:bg-surface-container-low transition-colors group">
                                                <td class="p-4 font-label-caps text-label-caps text-primary font-bold"><?= htmlspecialchars($firstCol) ?></td>
                                                <?php foreach ($columns as $cell): 
                                                    $displayCell = htmlspecialchars($cell ?? '');
                                                    $alignClass = "";
                                                    if (is_numeric($cell) && !in_array($cell, ['latitude', 'longitude']) && strlen($cell) > 4 && strpos($cell, '.') === false) {
                                                        $displayCell = "Rp " . number_format((float)$cell, 0, ',', '.');
                                                        $alignClass = "text-right font-bold text-primary";
                                                    } elseif (strpos($cell, 'Rp ') === 0) {
                                                        $alignClass = "text-right font-bold text-primary";
                                                    }
                                                ?>
                                                    <td class="p-4 font-body-md text-on-surface <?= $alignClass ?>"><?= $displayCell ?></td>
                                                <?php endforeach; ?>
                                                <td class="p-4">
                                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold <?= $badgeClass ?>"><?= htmlspecialchars($badgeVal ?? 'UNKNOWN') ?></span>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                        <div class="p-4 border-t border-outline-variant bg-surface-container-low/50 flex justify-center">
                            <a href="index.php?page=rentals" class="text-primary font-bold text-body-md hover:underline flex items-center gap-1">
                                Lihat Semua Data 
                                <span class="material-symbols-outlined text-[18px]">keyboard_arrow_right</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Chart/Analysis Visualization — Real-Time dari Database -->
                    <div class="bg-white border border-outline-variant rounded-xl p-6 shadow-sm overflow-hidden relative">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h4 class="font-headline-sm text-headline-sm text-primary">Analisis Tren Pendapatan</h4>
                                <p class="font-label-caps text-label-caps text-on-surface-variant">Pendapatan Bulanan Tahun <?= date('Y') ?> (Real-Time)</p>
                            </div>
                            <div class="flex gap-2 items-center">
                                <span class="w-3 h-3 bg-primary rounded-full"></span>
                                <span class="text-[10px] text-on-surface-variant font-bold">PAID</span>
                            </div>
                        </div>
                        <!-- Dynamic Bar Chart from Database -->
                        <div class="flex items-end gap-3 h-32 pt-4">
                            <?php 
                            $revLabels = $monthlyRevenueTrend['labels'] ?? [];
                            $revData = $monthlyRevenueTrend['data'] ?? [];
                            $revMax = $monthlyRevenueTrend['max'] ?? 1;
                            $lastIdx = count($revData) - 1;
                            
                            foreach ($revData as $idx => $val):
                                $pct = $revMax > 0 ? max(5, round(($val / $revMax) * 100)) : 5;
                                $isLast = ($idx === $lastIdx && $val > 0);
                                $bgClass = $isLast ? 'bg-primary' : 'bg-surface-container-highest hover:bg-primary-container';
                                $formattedVal = $val >= 1000000 ? number_format($val / 1000000, 1, ',', '.') . 'M' : number_format($val / 1000, 0, ',', '.') . 'K';
                            ?>
                                <div class="flex-1 <?= $bgClass ?> rounded-t transition-all group relative cursor-pointer" style="height: <?= $pct ?>%">
                                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 <?= $isLast ? '' : 'opacity-0 group-hover:opacity-100' ?> bg-primary text-white text-[10px] px-2 py-1 rounded whitespace-nowrap"><?= $formattedVal ?></div>
                                </div>
                            <?php endforeach; ?>
                            <?php if (empty($revData)): ?>
                                <div class="flex-1 text-center text-on-surface-variant text-xs py-8">Belum ada data pendapatan untuk tahun ini.</div>
                            <?php endif; ?>
                        </div>
                        <div class="flex justify-between mt-2 text-label-caps font-label-caps text-on-surface-variant px-1 border-t border-outline-variant pt-2">
                            <?php 
                            $currentMonthIdx = (int)date('n') - 1;
                            foreach ($revLabels as $idx => $label): 
                            ?>
                                <span class="<?= $idx === $currentMonthIdx ? 'text-primary font-bold' : '' ?>"><?= $label ?></span>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer Documentation Info -->
        <footer class="mt-auto p-container-padding bg-surface-container-lowest border-t border-outline-variant">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                <div class="flex items-center gap-6">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                        <span class="font-label-caps text-label-caps">Audit-Ready Report</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-[18px]">update</span>
                        <span class="font-label-caps text-label-caps">Last Sync: Today, <?= date('h:i A') ?></span>
                    </div>
                </div>
                <p class="font-label-caps text-label-caps text-on-surface-variant">© <?= date('Y') ?> EquipRent Management System. Corporate Standard Document.</p>
            </div>
        </footer>
    </main>

    <!-- Mobile Bottom Navigation (Visible on small screens) -->
    <nav class="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-outline-variant flex md:hidden z-50">
        <a class="flex-1 flex flex-col items-center justify-center gap-1 text-on-surface-variant" href="index.php?page=admin_dashboard">
            <span class="material-symbols-outlined">dashboard</span>
            <span class="text-[10px] font-bold">Home</span>
        </a>
        <a class="flex-1 flex flex-col items-center justify-center gap-1 text-on-surface-variant" href="index.php?page=equipment">
            <span class="material-symbols-outlined">construction</span>
            <span class="text-[10px] font-bold">Fleet</span>
        </a>
        <a class="flex-1 flex flex-col items-center justify-center gap-1 text-primary" href="index.php?page=reports">
            <span class="material-symbols-outlined font-variation-settings-'FILL'-1">analytics</span>
            <span class="text-[10px] font-bold">Reports</span>
        </a>
        <a class="flex-1 flex flex-col items-center justify-center gap-1 text-on-surface-variant" href="index.php?page=users">
            <span class="material-symbols-outlined">group</span>
            <span class="text-[10px] font-bold">Users</span>
        </a>
    </nav>
    
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
                    <p class="text-xs text-on-surface-variant">Admin Terminal Guidance System</p>
                </div>
            </div>
            <div class="space-y-3 text-body-md text-on-surface">
                <p>Selamat datang di terminal admin <strong>PT. SURYA BANGUN SARANA BANJARMASIN</strong>. Modul Anda meliputi:</p>
                <ul class="list-disc list-inside space-y-1 text-on-surface-variant pl-2">
                    <li><strong>Dashboard</strong>: Ringkasan metrik finansial & pemeliharaan riil.</li>
                    <li><strong>Equipment</strong>: Kelola inventaris alat berat & Hour Meter.</li>
                    <li><strong>Rental Orders</strong>: Pantau daftar booking & rental pelanggan.</li>
                    <li><strong>Maintenance</strong>: Rencanakan servis berkala & perbaikan unit.</li>
                    <li><strong>User Management</strong>: Kelola admin, staf, & customer.</li>
                    <li><strong>Reports</strong>: Unduh dokumen BAST/Surat Jalan & ekspor data.</li>
                </ul>
                <p class="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant">Gunakan navigasi untuk berpindah antar modul sistem secara aman.</p>
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
    </script>
</body>
</html>
