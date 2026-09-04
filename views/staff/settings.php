<?php
$fullName = $_SESSION['full_name'] ?? 'Operator Staff';
$role = $_SESSION['role'] ?? 'STAFF';
$currentPage = 'staff_settings';

$fullNameProfile = $user['full_name'] ?? $fullName;
$emailProfile = $user['email'] ?? 'staff@suryabangun.co.id';
$phoneProfile = $user['phone'] ?? '-';
$addressProfile = $user['address'] ?? '-';
$usernameProfile = $user['username'] ?? 'staff';
$statusProfile = $user['status'] ?? 'ACTIVE';
$userIdProfile = $user['id'] ?? $_SESSION['user_id'];
$createdAtProfile = $user['created_at'] ?? date('Y-m-d H:i:s');
$joinDays = max(1, round((time() - strtotime($createdAtProfile)) / (60 * 60 * 24)));
?>
<!DOCTYPE html>
<html class="light" lang="id">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>SBS EquipRent - Staff Settings</title>
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
                        "primary": "#003366",
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
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(12px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in {
            animation: fadeInUp 0.45s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
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
                <span class="font-body-md text-body-md">Reports</span>
            </a>
        </nav>
        
        <div class="mt-auto pt-6 border-t border-outline-variant space-y-1">
            <a class="text-primary font-bold border-l-4 border-primary bg-secondary-container transition-all scale-95 duration-100 flex items-center gap-3 px-6 py-3 duration-200" href="index.php?page=admin_settings">
                <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">settings</span>
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
                    <!-- Active State: Settings -->
                    <a class="flex items-center gap-3 px-4 py-2 text-primary font-bold border-l-4 border-primary bg-secondary-container transition-all scale-95 duration-100 font-body-md text-body-md" href="index.php?page=staff_settings">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">settings</span>
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
<input class="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-md w-80 focus:ring-2 focus:ring-primary font-body-md" placeholder="Cari pengaturan..." type="text">
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
            <div class="text-right hidden sm:block">
                <p class="font-body-md font-bold text-on-surface leading-tight"><?= htmlspecialchars($fullName) ?></p>
                <p class="font-label-caps text-[10px] text-on-surface-variant uppercase leading-none"><?= htmlspecialchars($role) ?></p>
            </div>
            <img alt="User Profile" class="w-10 h-10 rounded-full border border-outline-variant object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYgCm40ZYzrWEx0Ilk007nP4Ot3-jXU6t8cCvN6_mhNppA-sSaQAnE308Hw1SnOw07lmy0O-En_nv_IdKT8VGX2FV-o-J5gi2pefC9JuvBbsovn28eMFU6Pd5xJKaE0octztfkxuBAz-1tLZTYY2fRfYEy3jbGT_woNzyqrTjYiIrKEyM4leCHgymJEJ67vVX5IMYQOpdFpVtDrV2Pnn1t52u-E1-3mCWzVhkHxrpJkrkkXev1cZRUm992Duxx_o05qRi4UY0QesO8">
        </button>
        <!-- Profile Dropdown Menu -->
        <div id="profileDropdownMenu" class="hidden absolute right-0 top-12 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-2 z-50 text-left">
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

<!-- Main Area Content -->
<main class="flex-grow p-container-padding animate-fade-in">
    <div class="max-w-6xl mx-auto mb-6">
        <p class="font-label-caps text-label-caps text-on-surface-variant mb-1">TERMINAL UTILITY</p>
        <h3 class="font-display-lg text-display-lg text-primary">Pengaturan Profil & Keamanan</h3>
    </div>

    <!-- Feedback Alerts -->
    <?php if (isset($_SESSION['success'])): ?>
        <div class="max-w-6xl mx-auto mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-3 animate-fade-in" id="successMsgBox">
            <span class="material-symbols-outlined text-green-600">check_circle</span>
            <span class="font-body-md text-body-md"><?= htmlspecialchars($_SESSION['success']) ?></span>
            <?php unset($_SESSION['success']); ?>
        </div>
    <?php endif; ?>

    <?php if (isset($_SESSION['error'])): ?>
        <div class="max-w-6xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-3 animate-fade-in" id="errorMsgBox">
            <span class="material-symbols-outlined text-red-600">error</span>
            <span class="font-body-md text-body-md"><?= htmlspecialchars($_SESSION['error']) ?></span>
            <?php unset($_SESSION['error']); ?>
        </div>
    <?php endif; ?>

    <div class="max-w-6xl mx-auto grid grid-cols-12 gap-grid-gutter pb-24">
        
        <!-- Left Side: Profile Photo & Loyalty/Details Card -->
        <div class="col-span-12 lg:col-span-4 space-y-grid-gutter">
            <!-- Profile Preview Card -->
            <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant text-center relative overflow-hidden card-hover">
                <div class="absolute top-0 left-0 w-full h-20 bg-primary/5"></div>
                <div class="relative mt-4">
                    <div class="w-28 h-28 rounded-full mx-auto border-4 border-white overflow-hidden shadow-md mb-4 relative group">
                        <img alt="<?= htmlspecialchars($fullNameProfile) ?>" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYgCm40ZYzrWEx0Ilk007nP4Ot3-jXU6t8cCvN6_mhNppA-sSaQAnE308Hw1SnOw07lmy0O-En_nv_IdKT8VGX2FV-o-J5gi2pefC9JuvBbsovn28eMFU6Pd5xJKaE0octztfkxuBAz-1tLZTYY2fRfYEy3jbGT_woNzyqrTjYiIrKEyM4leCHgymJEJ67vVX5IMYQOpdFpVtDrV2Pnn1t52u-E1-3mCWzVhkHxrpJkrkkXev1cZRUm992Duxx_o05qRi4UY0QesO8">
                    </div>
                    <h4 class="font-headline-sm text-headline-sm font-bold text-primary"><?= htmlspecialchars($fullNameProfile) ?></h4>
                    <p class="font-label-caps text-[10px] text-on-surface-variant uppercase mt-1 tracking-wider"><?= htmlspecialchars($role) ?></p>
                    
                    <div class="mt-6 pt-6 border-t border-outline-variant grid grid-cols-2 gap-4 text-left">
                        <div>
                            <p class="text-[10px] font-bold text-on-surface-variant uppercase">ID Karyawan</p>
                            <p class="font-body-md font-bold text-primary">EMP-<?= sprintf('%04d', $userIdProfile) ?></p>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold text-on-surface-variant uppercase">Masa Dinas</p>
                            <p class="font-body-md font-bold text-primary"><?= $joinDays ?> Hari</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Terminal Info Card -->
            <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover">
                <h4 class="font-body-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">verified_user</span>
                    Informasi Sesi Aktif
                </h4>
                <div class="space-y-3 font-body-md text-on-surface">
                    <div class="flex justify-between items-center py-2 border-b border-outline-variant/30">
                        <span class="text-on-surface-variant">Status Sesi</span>
                        <span class="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-bold">Terautentikasi</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-outline-variant/30">
                        <span class="text-on-surface-variant">Hak Akses</span>
                        <span class="text-primary font-bold text-xs"><?= htmlspecialchars($role) ?></span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-outline-variant/30">
                        <span class="text-on-surface-variant">Login Terakhir</span>
                        <span class="text-on-surface-variant text-xs"><?= date('d M Y H:i') ?> WITA</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Side: Edit Form Fields -->
        <div class="col-span-12 lg:col-span-8">
            <form method="POST" action="index.php?page=staff_settings" class="space-y-grid-gutter">
                <!-- Data Pribadi Section -->
                <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover">
                    <h3 class="font-headline-sm text-headline-sm text-primary mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">account_circle</span>
                        Ubah Data Profil Staf
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="username">Username (ID Login)</label>
                            <input id="username" class="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-body-md text-on-surface-variant opacity-75 font-body-md focus:ring-0" type="text" value="<?= htmlspecialchars($usernameProfile) ?>" readonly>
                        </div>
                        <div class="space-y-2">
                            <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="full_name">Nama Lengkap</label>
                            <input id="full_name" name="full_name" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all" type="text" value="<?= htmlspecialchars($fullNameProfile) ?>" required>
                        </div>
                        <div class="space-y-2">
                            <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="email">Alamat Email</label>
                            <input id="email" name="email" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all" type="email" value="<?= htmlspecialchars($emailProfile) ?>" required>
                        </div>
                        <div class="space-y-2">
                            <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="phone">Nomor Telepon / WhatsApp</label>
                            <input id="phone" name="phone" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all" type="text" value="<?= htmlspecialchars($phoneProfile) ?>">
                        </div>
                        <div class="col-span-1 md:col-span-2 space-y-2">
                            <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="address">Alamat Tempat Tinggal</label>
                            <textarea id="address" name="address" rows="3" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all"><?= htmlspecialchars($addressProfile) ?></textarea>
                        </div>
                    </div>
                </div>

                <!-- Keamanan Section -->
                <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-hover">
                    <h3 class="font-headline-sm text-headline-sm text-primary mb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">security</span>
                        Proteksi & Keamanan Sandi
                    </h3>
                    <p class="text-xs text-on-surface-variant mb-6">Kosongkan kolom di bawah ini jika Anda tidak berniat untuk mengganti kata sandi login terminal.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="new_password">Kata Sandi Baru</label>
                            <input id="new_password" name="new_password" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all" type="password" placeholder="••••••••">
                        </div>
                        <div class="space-y-2">
                            <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" for="confirm_password">Konfirmasi Kata Sandi Baru</label>
                            <input id="confirm_password" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all" type="password" placeholder="••••••••">
                            <p id="passwordFeedback" class="text-xs font-semibold mt-1 hidden"></p>
                        </div>
                    </div>
                </div>

                <!-- Form Submit Action buttons -->
                <div class="flex justify-end gap-4">
                    <a href="index.php?page=staff_dashboard" class="px-6 py-3 bg-surface-container text-on-surface-variant font-bold rounded-lg hover:bg-surface-container-high active:scale-95 transition-all text-body-md text-center">Batal</a>
                    <button id="saveBtn" type="submit" class="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all text-body-md shadow-md">Simpan Perubahan</button>
                </div>
            </form>
        </div>

    </div>
</main>
</main>

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
    document.addEventListener('DOMContentLoaded', () => {
        const sidebar = document.getElementById('sidebarMenu');
        const toggleBtn = document.getElementById('sidebarToggleBtn');
        const profileBtn = document.getElementById('profileDropBtn');
        const profileMenu = document.getElementById('profileDropdownMenu');

        // Mobile Sidebar Toggle
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('hidden');
                sidebar.classList.toggle('flex');
            });
        }
        const notiBtn = document.getElementById('notiBellBtn');
        const notiMenu = document.getElementById('notiDropdownMenu');
        const helpBtn = document.getElementById('helpOutlineBtn');
        const helpModal = document.getElementById('helpModalDialog');
        const closeHelpCross = document.getElementById('closeHelpModalCross');
        const closeHelpOk = document.getElementById('closeHelpModalOk');

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

        // Interactive validation for new password matching
        const newPassword = document.getElementById('new_password');
        const confirmPassword = document.getElementById('confirm_password');
        const passwordFeedback = document.getElementById('passwordFeedback');
        const saveBtn = document.getElementById('saveBtn');

        function validatePassword() {
            if (newPassword.value === "" && confirmPassword.value === "") {
                passwordFeedback.classList.add('hidden');
                saveBtn.disabled = false;
                saveBtn.style.opacity = "1";
                return;
            }

            if (newPassword.value === confirmPassword.value) {
                passwordFeedback.textContent = "Kata sandi cocok.";
                passwordFeedback.className = "text-xs font-semibold mt-1 text-green-600";
                passwordFeedback.classList.remove('hidden');
                saveBtn.disabled = false;
                saveBtn.style.opacity = "1";
            } else {
                passwordFeedback.textContent = "Kata sandi baru tidak cocok.";
                passwordFeedback.className = "text-xs font-semibold mt-1 text-red-600";
                passwordFeedback.classList.remove('hidden');
                saveBtn.disabled = true;
                saveBtn.style.opacity = "0.6";
            }
        }

        if(newPassword && confirmPassword) {
            newPassword.addEventListener('input', validatePassword);
            confirmPassword.addEventListener('input', validatePassword);
        }

        // Success/Error Msg Fadeout
        const successBox = document.getElementById('successMsgBox');
        const errorBox = document.getElementById('errorMsgBox');
        if (successBox) {
            setTimeout(() => {
                successBox.style.transition = "all 0.5s ease";
                successBox.style.opacity = "0";
                setTimeout(() => successBox.remove(), 500);
            }, 4000);
        }
        if (errorBox) {
            setTimeout(() => {
                errorBox.style.transition = "all 0.5s ease";
                errorBox.style.opacity = "0";
                setTimeout(() => errorBox.remove(), 500);
            }, 4000);
        }
    });

    // Atmospheric dot pattern background for the body
    document.body.style.backgroundImage = `radial-gradient(#cbd5e1 0.8px, transparent 0.8px)`;
    document.body.style.backgroundSize = `24px 24px`;
</script>
</body>
</html>
