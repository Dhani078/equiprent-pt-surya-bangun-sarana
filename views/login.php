<?php
/**
 * ============================================================================
 * VIEW: Halaman Login Multi-Role — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Halaman ini adalah gerbang masuk utama (entry point) untuk sistem monitoring
 * dan rental alat berat PT. Surya Bangun Sarana Banjarmasin.
 * 
 * Desain dan struktur DOM direplikasi 100% secara presisi dari Stitch Prototype:
 * - Screen ID : a6fb0175663c412c905b14d514f1662c ("Login Multi-Role")
 * - Project ID: 11860082075099958078
 * 
 * PANDUAN PENTING SIDANG SKRIPSI (INTEGRASI & AKADEMIK):
 * 1. Multi-Role Selection: Memilih tab role (ADMIN, STAFF, CUSTOMER) akan mengubah
 *    state pada input tersembunyi `role` dan label input secara interaktif lewat JS.
 * 2. Keamanan Transaksi: Form menggunakan metode POST untuk melindungi credentials,
 *    dan input name dipetakan ke Controller (`username` dan `password`).
 * 3. Token Desain Presisi: Variabel CSS dikunci menggunakan warna utama #003366,
 *    warna sekunder #475569, font Hanken Grotesk, dan radius ROUND_EIGHT (8px).
 * 
 * @package    EquipRent MS
 * @subpackage Views
 * @author     PT. Surya Bangun Sarana Banjarmasin Academic Development Team
 */

// Memulai session PHP secara aman jika belum aktif untuk membaca notifikasi kesalahan login
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>Login | EquipRent MS</title>
    
    <!-- Memuat Google Fonts Hanken Grotesk, JetBrains Mono, dan Material Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@500&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@100..900&amp;family=JetBrains+Mono:wght@100..900&amp;display=swap" rel="stylesheet">
    
    <!-- Memuat core Tailwind CSS CDN untuk menjamin rendering utilitas layout Stitch -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script id="tailwind-config">
        // Konfigurasi dinamis Tailwind agar tetap sinkron dengan tema warna utama PT. SBS
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
                        "primary-container": "#003366", // Warna Primer Asli PT. SBS (#003366)
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
                        "DEFAULT": "8px", // Kunci ROUND_EIGHT
                        "lg": "8px",
                        "xl": "12px",
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
            },
        }
    </script>
    
    <!-- Memuat CSS Global eksternal yang mendefinisikan seluruh variabel Token Desain -->
    <link rel="stylesheet" href="assets/css/style.css">
    
    <!-- ================================================================== -->
    <!-- INJEKSI KELAS DESAIN GLOBAL & VARIABEL KUSTOM                      -->
    <!-- ================================================================== -->
    <style>
        /* Menerapkan token warna utama dari style.css secara absolut */
        :root {
            --color-primary: #003366; /* Warna utama PT. SBS */
            --color-secondary: #475569; /* Slate Gray */
            --font-primary: 'Hanken Grotesk', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
            --radius-eight: 8px; /* ROUND_EIGHT */
            --transition-premium: all 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        /* Override style untuk menyatukan utility Tailwind dengan variabel kustom */
        body {
            font-family: var(--font-primary) !important;
            background-color: #f7f9fb;
        }

        .text-primary {
            color: var(--color-primary) !important;
        }

        .bg-primary {
            background-color: var(--color-primary) !important;
        }

        .bg-primary-container {
            background-color: var(--color-primary) !important;
        }

        .text-on-surface-variant {
            color: var(--color-secondary) !important;
        }

        /* Penegasan kelengkungan sudut 8px di seluruh elemen */
        .rounded, .rounded-lg {
            border-radius: var(--radius-eight) !important;
        }

        .font-label-caps {
            font-family: var(--font-mono) !important;
        }

        /* Efek Latar Belakang Pola Grid Geometris (Industrial Theme) */
        .hero-pattern {
            background-color: #001e40;
            background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 32px 32px;
        }

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        /* ============================================================ */
        /* PREMIUM ANIMATION KEYFRAMES (Sesuai agents.md)               */
        /* ============================================================ */
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

        /* Penerapan kelas animasi global fade-in */
        .animate-fade-in {
            animation: fadeInUp 0.45s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }

        /* Transisi halus saat tombol dan form-group disentuh */
        input, button {
            transition: var(--transition-premium);
        }

        /* Alert error dinamis yang menyatu dengan estetika Stitch */
        .alert-box-bawaan-stitch {
            background-color: #ffdad6;
            color: #93000a;
            border: 1px solid #ffb4ab;
            border-radius: var(--radius-eight);
            padding: 12px 16px;
            margin-bottom: 24px;
            font-family: var(--font-primary);
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 2px 6px rgba(186, 26, 26, 0.08);
            animation: fadeInUp 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }

        .alert-box-bawaan-stitch .icon {
            font-size: 20px;
            color: #ba1a1a;
        }
    </style>
</head>
<body class="bg-background text-on-background font-body-md min-h-screen flex items-center justify-center p-6">

    <!-- Container Utama: Menggunakan Animasi Premium fade-in saat halaman dimuat -->
    <div class="max-w-[500px] lg:max-w-[1100px] w-full bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col lg:flex-row border border-outline-variant shadow-sm min-h-[640px] animate-fade-in">
        
        <!-- ============================================================== -->
        <!-- PANEL KIRI: Ilustrasi & Branding Perusahaan (Deep Blue)        -->
        <!-- ============================================================== -->
        <div class="hidden lg:flex lg:w-1/2 hero-pattern relative p-12 flex-col justify-between text-white overflow-hidden">
            <!-- Elemen Dekoratif Lingkaran Berpendar di Latar Belakang -->
            <div class="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary-container rounded-full opacity-20 blur-3xl"></div>
            
            <div class="relative z-10">
                <!-- Logo & Judul Sistem -->
                <div class="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                    <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
                        <span class="material-symbols-outlined text-primary-fixed-dim text-3xl">construction</span>
                    </div>
                    <div>
                        <h1 class="font-headline-md text-xl font-bold tracking-tight text-white leading-none">EquipRent MS</h1>
                        <p class="text-[9px] text-primary-fixed-dim font-mono font-semibold tracking-wider mt-1.5 uppercase opacity-90">PT. SURYA BANGUN SARANA</p>
                    </div>
                </div>
                <!-- Tagline Besar Dinamis -->
                <h2 class="font-display-lg text-display-lg mb-4 leading-tight">
                    Reliability in every <span class="text-primary-fixed-dim">heavy operation.</span>
                </h2>
                <!-- Deskripsi Sistem -->
                <p class="text-on-primary-container font-body-lg max-w-sm opacity-90">
                    Enterprise-grade fleet management for construction, logistics, and heavy machinery operations.
                </p>
            </div>
            
            <!-- Wadah Ilustrasi Alat Berat Komatsu/Caterpillar -->
            <div class="relative z-10 mt-12 mb-8 transform hover:scale-105 transition-transform duration-700">
                <img alt="Heavy Equipment" class="rounded-xl shadow-2xl border border-white/10" 
                     src="https://lh3.googleusercontent.com/aida-public/AB6AXuDn-eSo4dsQ10dc1_82LDKgscYLCxTOPVq1Jtp7AZ_bYL_2iLC0DcDBoPfazr1O-jfGiTYql8sn7jhZ51-17gcJpQkNf55sC64jslptsQp33625xoGnd9mtZdgiUEdB-U6hMalcSBsucOgsz4f5VazLxehSep1KXSDWTHmjLQ1m9sIExB2fb4Q3cSLyufz6hZWOK37hirjF1sWQgXhDnVpZ2tSPR1aCNe3D3KlGICc67iDjmTXgRBEH80vH2y687QaoJNkcxSwWrDDp">
            </div>
            
            <!-- Info Versi Sistem Terminal (JetBrains Mono) -->
            <div class="relative z-10">
                <p class="font-label-caps text-label-caps text-on-primary-container/60 uppercase tracking-widest">
                    Fleet Manager Admin Terminal v4.2.0
                </p>
            </div>
        </div>
        
        <!-- ============================================================== -->
        <!-- PANEL KANAN: Card Form Login Pelanggan & Staff                 -->
        <!-- ============================================================== -->
        <div class="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-surface-container-lowest">
            <div class="max-w-[360px] mx-auto w-full">
                
                <!-- Sub-Header Text -->
                <div class="mb-10 text-center md:text-left">
                    <h3 class="font-headline-md text-headline-md text-primary mb-2">Welcome Back</h3>
                    <p class="text-on-surface-variant font-body-md">Please enter your credentials to access your terminal.</p>
                </div>
                
                <!-- ========================================================== -->
                <!-- ALUR PHP DINAMIS: ALERT BOX BAWAAN STITCH (try-catch error)-->
                <!-- ========================================================== -->
                <?php if (isset($_SESSION['error'])): ?>
                    <div class="alert-box-bawaan-stitch" role="alert">
                        <span class="material-symbols-outlined icon">error</span>
                        <span><?= htmlspecialchars($_SESSION['error']); unset($_SESSION['error']); ?></span>
                    </div>
                <?php endif; ?>
                
                <!-- ========================================================== -->
                <!-- ROLE SELECTOR TABS (ADMIN, STAFF, CUSTOMER)               -->
                <!-- ========================================================== -->
                <div class="flex bg-surface-container-low p-1 rounded-lg mb-8" id="role-selector">
                    <button type="button" class="flex-1 py-2 text-center rounded font-label-caps text-label-caps transition-all bg-surface-container-lowest shadow-sm text-primary" data-role="ADMIN" onclick="setRole('ADMIN')">ADMIN</button>
                    <button type="button" class="flex-1 py-2 text-center rounded font-label-caps text-label-caps transition-all text-on-surface-variant hover:text-primary" data-role="STAFF" onclick="setRole('STAFF')">STAFF</button>
                    <button type="button" class="flex-1 py-2 text-center rounded font-label-caps text-label-caps transition-all text-on-surface-variant hover:text-primary" data-role="CUSTOMER" onclick="setRole('CUSTOMER')">CUSTOMER</button>
                </div>
                
                <!-- ========================================================== -->
                <!-- FORM LOGIN INTEGRASI BACKEND AMAN (index.php?page=login)   -->
                <!-- ========================================================== -->
                <form class="space-y-6" action="index.php?page=login" method="POST" autocomplete="off">
                    
                    <!-- Input Tersembunyi untuk Mengirimkan Aktor Peran yang Terpilih -->
                    <input type="hidden" name="role" id="selected-role" value="ADMIN">
                    
                    <!-- Field: Username / Email -->
                    <div>
                        <label class="block font-body-md font-bold text-primary mb-1.5" for="id_field">Admin Username</label>
                        <div class="relative group">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
                            <input class="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body-md outline-none" 
                                   id="id_field" name="username" placeholder="Enter your username" type="text" required autofocus>
                        </div>
                    </div>
                    
                    <!-- Field: Password -->
                    <div>
                        <div class="flex justify-between items-center mb-1.5">
                            <label class="block font-body-md font-bold text-primary" for="password">Password</label>
                            <a class="text-label-caps font-label-caps text-primary hover:underline" href="#">Forgot?</a>
                        </div>
                        <div class="relative group">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                            <input class="w-full pl-10 pr-12 py-2.5 bg-surface-container-lowest border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body-md outline-none" 
                                   id="password" name="password" placeholder="••••••••" type="password" required>
                            <!-- Tombol Toggle Masking Password (Lihat/Sembunyi) -->
                            <button class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary" type="button" onclick="togglePasswordVisibility()">
                                <span class="material-symbols-outlined" id="password-toggle-icon">visibility</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Remember Device Checklist -->
                    <div class="flex items-center gap-2">
                        <input class="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" id="remember" name="remember" type="checkbox">
                        <label class="font-body-md text-on-surface-variant cursor-pointer select-none" for="remember">Remember this device</label>
                    </div>
                    
                    <!-- Tombol Submit Form Login -->
                    <button class="w-full h-[40px] bg-primary text-white font-label-caps text-label-caps flex items-center justify-center gap-2 rounded-lg hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm cursor-pointer" type="submit" id="btn-submit-login">
                        <span>MASUK</span>
                        <span class="material-symbols-outlined text-[18px]">login</span>
                    </button>
                </form>
                
                <!-- Footer & Pendaftaran Operator Baru -->
                <div class="mt-10 pt-8 border-t border-outline-variant text-center">
                    <p class="font-body-md text-on-surface-variant">
                        New operator? <a id="btn-register-fleet-access" class="text-primary font-semibold hover:underline cursor-pointer" href="javascript:void(0)">Register Fleet Access</a>
                    </p>
                </div>
                
            </div>
        </div>
    </div>

    <!-- ================================================================== -->
    <!-- REGISTER FLEET ACCESS MODAL DIALOG                                 -->
    <!-- ================================================================== -->
    <div id="registerFleetAccessModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-8 shadow-xl relative animate-fade-in">
            <!-- Close Cross Icon -->
            <button id="closeRegisterModalCross" class="absolute right-6 top-6 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                <span class="material-symbols-outlined">close</span>
            </button>

            <!-- Header -->
            <div class="flex items-center gap-4 mb-6">
                <div class="bg-primary text-white p-3 rounded-lg flex items-center justify-center">
                    <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">badge</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-primary">Registrasi Akses Fleet</h3>
                    <p class="text-xs text-on-surface-variant">PT. SURYA BANGUN SARANA BANJARMASIN</p>
                </div>
            </div>

            <!-- Toast Alert inside Modal -->
            <div id="registerSuccessToast" class="hidden bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 flex items-center gap-3 animate-fade-in">
                <span class="material-symbols-outlined text-green-600">check_circle</span>
                <div class="text-xs">
                    <p class="font-bold">Pengajuan Akses Dikirim!</p>
                    <p class="text-green-700">Tim IT PT. SBS Banjarmasin akan memverifikasi permohonan Anda dalam 1x24 jam.</p>
                </div>
            </div>

            <!-- Modal Content & Form -->
            <div id="registerModalContent" class="space-y-4 font-body-md text-on-surface">
                <p class="text-xs text-on-surface-variant leading-relaxed">
                    Untuk mendaftarkan akun baru atau mengajukan hak akses alat berat (*Fleet Access*), silakan lengkapi formulir pengajuan mandiri di bawah ini atau hubungi Account Manager Anda.
                </p>
                <form id="fleetRegisterForm" class="space-y-4" onsubmit="handleFleetRegister(event)">
                    <div>
                        <label class="block text-xs font-bold text-primary mb-1">Nama Lengkap Pemohon</label>
                        <input type="text" id="reg_fullname" required class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm" placeholder="Contoh: Hendra Wijaya">
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-primary mb-1">Nama Instansi / Perusahaan</label>
                            <input type="text" id="reg_company" required class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm" placeholder="Contoh: PT. Mulia Jaya">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-primary mb-1">Nomor WhatsApp Aktif</label>
                            <input type="tel" id="reg_phone" required class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm" placeholder="Contoh: 0811500XXXX">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-primary mb-1">Hak Akses yang Diajukan</label>
                        <select id="reg_role" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm text-on-surface">
                            <option value="CUSTOMER">PELANGGAN (Customer Portal)</option>
                            <option value="STAFF">STAF SBS (Staff Operational & Monitoring)</option>
                        </select>
                    </div>

                    <div class="pt-2 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant border-t border-outline-variant mt-4">
                        <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">support_agent</span> Hotline: (0511) 325-SBS</span>
                        <button type="submit" id="btnSubmitFleetAccess" class="w-full sm:w-auto px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all text-xs tracking-wider uppercase cursor-pointer">Ajukan Akses</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- ================================================================== -->
    <!-- JAVASCRIPT: Mikro-Interaksi Multi-Role & Masking Password          -->
    <!-- ================================================================== -->
    <script>
        /**
         * Mengubah state role terpilih secara dinamis
         * Fungsi ini berjalan di sisi klien untuk memberikan visual feedback
         * dan memperbarui input tersembunyi guna verifikasi otentikasi di backend.
         * 
         * @param {string} roleName - Peran aktor ('ADMIN', 'STAFF', 'CUSTOMER')
         */
        function setRole(roleName) {
            // Memperbarui nilai input hidden role untuk dikirim ke PHP
            document.getElementById('selected-role').value = roleName;

            // Memperbarui class visual pada tab tombol selector
            const buttons = document.querySelectorAll('#role-selector button');
            buttons.forEach(btn => {
                const btnRole = btn.getAttribute('data-role');
                if (btnRole === roleName) {
                    btn.classList.add('bg-surface-container-lowest', 'shadow-sm', 'text-primary');
                    btn.classList.remove('text-on-surface-variant');
                } else {
                    btn.classList.remove('bg-surface-container-lowest', 'shadow-sm', 'text-primary');
                    btn.classList.add('text-on-surface-variant');
                }
            });

            // Mengubah label input secara kontekstual agar representatif
            const idLabel = document.querySelector('label[for="id_field"]');
            const idInput = document.getElementById('id_field');
            if (roleName === 'CUSTOMER') {
                idLabel.textContent = 'Customer ID or Email';
                idInput.placeholder = 'Enter your Customer ID';
            } else if (roleName === 'STAFF') {
                idLabel.textContent = 'Employee ID';
                idInput.placeholder = 'Enter your Employee ID';
            } else {
                idLabel.textContent = 'Admin Username';
                idInput.placeholder = 'Enter your username';
            }
        }

        /**
         * Mengubah tipe input password dari 'password' ke 'text' (Lihat/Sembunyi)
         * Memberikan transparansi penulisan karakter demi kenyamanan user.
         */
        function togglePasswordVisibility() {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.getElementById('password-toggle-icon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.textContent = 'visibility_off';
            } else {
                passwordInput.type = 'password';
                toggleIcon.textContent = 'visibility';
            }
        }

        // Efek transisi penekanan (active state) pada tombol agar terasa hidup dan premium
        document.querySelectorAll('button, input[type="submit"]').forEach(btn => {
            btn.addEventListener('mousedown', () => btn.classList.add('opacity-80'));
            btn.addEventListener('mouseup', () => btn.classList.remove('opacity-80'));
            btn.addEventListener('mouseleave', () => btn.classList.remove('opacity-80'));
        });

        // Validasi Pencegahan Double-Submit saat Form Dikirim
        const loginForm = document.querySelector('form');
        if (loginForm) {
            loginForm.addEventListener('submit', function() {
                const btnSubmit = document.getElementById('btn-submit-login');
                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.innerHTML = '<span>AUTHENTICATING...</span><span class="animate-spin" style="display:inline-block;">⏳</span>';
                    btnSubmit.style.opacity = '0.75';
                }
            });
        }

        // --- BINDING EVENTS UNTUK MODAL REGISTER FLEET ACCESS ---
        document.addEventListener('DOMContentLoaded', () => {
            const btnRegister = document.getElementById('btn-register-fleet-access');
            const registerModal = document.getElementById('registerFleetAccessModal');
            const closeRegisterModalCross = document.getElementById('closeRegisterModalCross');

            if (btnRegister && registerModal) {
                btnRegister.addEventListener('click', () => {
                    // Reset formulir & notifikasi sukses
                    document.getElementById('fleetRegisterForm').reset();
                    document.getElementById('registerSuccessToast').classList.add('hidden');
                    registerModal.classList.remove('hidden');
                });
            }

            if (closeRegisterModalCross && registerModal) {
                closeRegisterModalCross.addEventListener('click', () => {
                    registerModal.classList.add('hidden');
                });
            }

            // Menutup modal jika diklik di luar area konten
            if (registerModal) {
                registerModal.addEventListener('click', (e) => {
                    if (e.target === registerModal) {
                        registerModal.classList.add('hidden');
                    }
                });
            }
        });

        /**
         * Menangani pengiriman formulir registrasi fleet access secara interaktif
         */
        function handleFleetRegister(event) {
            event.preventDefault();
            const btnSubmit = document.getElementById('btnSubmitFleetAccess');
            const toast = document.getElementById('registerSuccessToast');

            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'MENGIRIM...';
                btnSubmit.style.opacity = '0.7';
            }

            // Simulasi pengiriman data pengajuan ke server
            setTimeout(() => {
                if (toast) {
                    toast.classList.remove('hidden');
                }
                if (btnSubmit) {
                    btnSubmit.textContent = 'TERKIRIM ✓';
                }

                // Tutup modal secara otomatis setelah 3 detik
                setTimeout(() => {
                    const registerModal = document.getElementById('registerFleetAccessModal');
                    if (registerModal) {
                        registerModal.classList.add('hidden');
                    }
                }, 3000);

            }, 1000);
        }
    </script>
</body>
</html>
