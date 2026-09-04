<?php
/**
 * ============================================================================
 * INTERACTIVE SCREENSHOT GALLERY & THESIS MAPPING TERMINAL
 * PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 */

// 1. Copy Screenshots from Brain Directory to Local Workspace for Web Visibility
$sourceDir = 'C:/Users/Anomali/.gemini/antigravity/brain/199810bd-afc0-40ad-bbee-dff352496af6';
$destDir = __DIR__ . '/assets/screenshots';

if (!file_exists($destDir)) {
    mkdir($destDir, 0777, true);
}

$imagesToCopy = [
    'media__1780407339771.png' => '1_sketch_guide.png',
    'media__1780407491299.png' => '2_login_screen.png',
    'media__1780407868136.png' => '3_admin_dashboard.png',
    'media__1780408137453.png' => '4_equipment_screen.png',
    'media__1780409024475.png' => '5_sidebar_dropdown.png',
    'media__1780409540170.jpg' => '6_pdf_report_preview.jpg'
];

$copyLog = [];
foreach ($imagesToCopy as $srcName => $destName) {
    $srcPath = $sourceDir . '/' . $srcName;
    $destPath = $destDir . '/' . $destName;
    if (file_exists($srcPath)) {
        if (copy($srcPath, $destPath)) {
            $copyLog[] = "Successfully copied $srcName -> $destName";
        } else {
            $copyLog[] = "Failed to copy $srcName";
        }
    } else {
        $copyLog[] = "Source file not found: $srcName";
    }
}

// 2. Map file data and descriptions
$mappings = [
    [
        'title' => 'Sketsa Alur & Panduan Buku Skripsi',
        'file' => '1_sketch_guide.png',
        'code_file' => 'N/A (Dokumen Panduan)',
        'description' => 'Gambar coretan tangan/sketsa yang menunjukkan format penulisan bab skripsi. Menjelaskan bahwa setiap halaman program harus menampilkan "Source Code Program" di sebelah kiri/halaman genap, berpasangan dengan "Screenshot Halaman Tampilan (Running)" di sebelah kanan/halaman ganjil.',
        'badge' => 'PANDUAN BUKU',
        'badge_color' => '#64748B'
    ],
    [
        'title' => 'Halaman Login Multi-Role',
        'file' => '2_login_screen.png',
        'code_file' => '1_login_module_complete_slim.php',
        'description' => 'Antarmuka masuk (Login Screen) premium dengan panel pemilihan tab role (Admin, Staff, Customer), input email & password, dan background gelombang modern.',
        'badge' => 'MODUL 1',
        'badge_color' => '#10B981'
    ],
    [
        'title' => 'Dashboard Utama Admin',
        'file' => '3_admin_dashboard.png',
        'code_file' => '2_admin_dashboard_complete_slim.php',
        'description' => 'Halaman utama panel kendali Admin (Bento-Grid). Menampilkan visualisasi data statistik, grafik tren melengkung dinamis (SVG), dan daftar aktivitas sistem terbaru.',
        'badge' => 'MODUL 2',
        'badge_color' => '#003366'
    ],
    [
        'title' => 'Manajemen Inventaris Alat Berat',
        'file' => '4_equipment_screen.png',
        'code_file' => '3_equipment_module_complete_slim.php',
        'description' => 'Antarmuka CRUD Inventaris Alat Berat. Menampilkan tabel data armada, status operasional unit, form filter pencarian, dan tombol penambahan unit baru.',
        'badge' => 'MODUL 3',
        'badge_color' => '#3B82F6'
    ],
    [
        'title' => 'Dropdown Pilihan 11 Jenis Laporan',
        'file' => '5_sidebar_dropdown.png',
        'code_file' => '6_report_module_complete_slim.php',
        'description' => 'Screenshot vertikal sempit yang menampilkan dropdown pilhan 11 jenis laporan skripsi dan sidebar navigasi "Reports" yang sedang aktif.',
        'badge' => 'MODUL 6 (MENU)',
        'badge_color' => '#F59E0B'
    ],
    [
        'title' => 'Pratinjau Dokumen Cetak / PDF Resmi',
        'file' => '6_pdf_report_preview.jpg',
        'code_file' => '6_report_module_complete_slim.php',
        'description' => 'Tampilan vertikal dokumen resmi (A4 Portrait) hasil cetak PDF Laporan. Menampilkan Kop Surat resmi PT. SURYA BANGUN SARANA BANJARMASIN, tabel data laporan riil, dan tanda tangan verifikasi pimpinan di bagian bawah.',
        'badge' => 'MODUL 6 (PDF)',
        'badge_color' => '#EF4444'
    ]
];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Screenshot Gallery & Thesis Mapping | SBS Banjarmasin</title>
    <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #003366;
            --secondary: #475569;
            --background: #F8FAFC;
            --surface: #FFFFFF;
            --outline: #E2E8F0;
            --radius: 12px;
            --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Hanken Grotesk', sans-serif; }
        body { background: var(--background); color: #1E293B; padding: 40px 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        
        header { text-align: center; margin-bottom: 40px; }
        header h1 { color: var(--primary); font-size: 32px; font-weight: 800; margin-bottom: 8px; }
        header p { color: var(--secondary); font-size: 16px; font-weight: 600; }
        
        .notification-box { background: #F0FDF4; border: 1px solid #BBF7D0; color: #166534; padding: 16px; border-radius: var(--radius); margin-bottom: 30px; font-size: 14px; font-weight: 600; }
        .notification-box ul { margin-left: 20px; margin-top: 8px; font-weight: 500; }
        
        .gallery-grid { display: grid; grid-template-cols: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; }
        .gallery-card { background: var(--surface); border: 1px solid var(--outline); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column; transition: var(--transition); }
        .gallery-card:hover { transform: translateY(-6px); box-shadow: 0 12px 24px rgba(0, 51, 102, 0.08); }
        
        .img-container { height: 260px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid var(--outline); position: relative; }
        .img-container img { max-width: 100%; max-height: 100%; object-fit: contain; transition: var(--transition); }
        .gallery-card:hover .img-container img { transform: scale(1.03); }
        
        .badge { position: absolute; top: 16px; left: 16px; padding: 6px 12px; border-radius: 99px; font-size: 11px; font-weight: 800; color: #FFF; letter-spacing: 0.5px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        
        .card-body { padding: 24px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1; }
        .card-body h3 { font-size: 18px; color: var(--primary); font-weight: 800; margin-bottom: 12px; }
        .card-body p.desc { font-size: 13px; color: var(--secondary); line-height: 1.6; margin-bottom: 16px; flex-grow: 1; }
        
        .meta-row { border-top: 1px solid var(--outline); padding-top: 16px; margin-top: 16px; font-size: 12px; }
        .meta-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600; }
        .meta-item span.label { color: var(--secondary); }
        .meta-item span.val { color: var(--primary); font-family: monospace; background: #F1F5F9; padding: 2px 6px; border-radius: 4px; }
        
        .btn-view { display: block; text-align: center; background: var(--primary); color: #FFF; text-decoration: none; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 16px; transition: var(--transition); }
        .btn-view:hover { background: #002244; transform: translateY(-1.5px); box-shadow: 0 4px 10px rgba(0, 51, 102, 0.2); }
        .btn-view:active { transform: translateY(0.5px) scale(0.98); }
    </style>
</head>
<body>
    <div class="container animate-fade-in">
        <header>
            <h1>Sistem Pemetaan & Galeri Laporan Skripsi Zaky</h1>
            <p>PT. SURYA BANGUN SARANA BANJARMASIN</p>
        </header>

        <!-- Notification of Copying -->
        <div class="notification-box">
            <span>✨ Inisialisasi Berhasil! File gambar telah terdeteksi dan berhasil diekspor ke folder lokal Anda:</span>
            <ul>
                <?php foreach ($copyLog as $log): ?>
                    <li><?= htmlspecialchars($log) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>

        <!-- Gallery Grid -->
        <div class="gallery-grid">
            <?php foreach ($mappings as $item): ?>
                <div class="gallery-card">
                    <div class="img-container">
                        <span class="badge" style="background: <?= $item['badge_color'] ?>;"><?= $item['badge'] ?></span>
                        <img src="assets/screenshots/<?= $item['file'] ?>" alt="<?= htmlspecialchars($item['title']) ?>">
                    </div>
                    <div class="card-body">
                        <div>
                            <h3><?= htmlspecialchars($item['title']) ?></h3>
                            <p class="desc"><?= htmlspecialchars($item['description']) ?></p>
                        </div>
                        <div class="meta-row">
                            <div class="meta-item">
                                <span class="label">Nama File Gambar:</span>
                                <span class="val"><?= $item['file'] ?></span>
                            </div>
                            <div class="meta-item">
                                <span class="label">Kode Modul Slim:</span>
                                <span class="val"><?= $item['code_file'] ?></span>
                            </div>
                        </div>
                        <a href="assets/screenshots/<?= $item['file'] ?>" target="_blank" class="btn-view">Buka Gambar Penuh ➔</a>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</body>
</html>
