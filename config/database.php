<?php
/**
 * ============================================================================
 * DATABASE CONFIGURATION: PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 *
 * Mengatur koneksi database menggunakan PDO (PHP Data Objects) secara aman.
 *
 * PERBAIKAN KEAMANAN:
 * 1. Kredensial TIDAK lagi ditanam di dalam source code (sebelumnya
 *    root / kata sandi kosong ikut ter-commit ke repositori publik).
 *    Nilainya dibaca dari environment; nilai bawaan hanya dipakai untuk
 *    lingkungan pengembangan lokal (XAMPP).
 * 2. Detail PDOException tidak pernah ditampilkan ketika APP_ENV=production
 *    — nama basis data, jalur berkas, dan versi server adalah informasi yang
 *    berguna bagi penyerang.
 *
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * - Keamanan SQL Injection: PDO::ATTR_EMULATE_PREPARES dimatikan sehingga
 *   parsing query diserahkan sepenuhnya ke engine MySQL (real prepared
 *   statements).
 * - Driver mysql dengan charset utf8mb4.
 */

/** Membaca variabel environment dengan nilai cadangan. */
function sbs_env(string $key, string $default = ''): string {
    $value = getenv($key);
    if ($value === false || $value === '') {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? '';
    }
    return $value === '' ? $default : (string) $value;
}

// Kredensial basis data — override lewat environment di server produksi.
define('APP_ENV', sbs_env('APP_ENV', 'development'));
define('DB_HOST', sbs_env('DB_HOST', 'localhost'));
define('DB_NAME', sbs_env('DB_NAME', 'db_surya_heavy_equipment')); // Sesuai spesifikasi DESIGN.md
define('DB_USER', sbs_env('DB_USER', 'root'));
define('DB_PASS', sbs_env('DB_PASS', ''));

class Database {
    private static $connection = null;

    /**
     * Mengambil instance tunggal koneksi database (Singleton Design Pattern)
     * Pola ini memastikan hanya ada satu koneksi aktif selama siklus request program.
     *
     * @return PDO
     */
    public static function getConnection() {
        if (self::$connection === null) {
            try {
                // Inisialisasi koneksi PDO
                $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Melempar exception jika ada galat query
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Hasil fetch berupa array asosiatif
                    PDO::ATTR_EMULATE_PREPARES   => false,                  // Mencegah eksploitasi celah SQL Injection
                ];
                self::$connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // Detail teknis hanya untuk log server, tidak pernah untuk pengguna.
                error_log('[SBS][DB] ' . $e->getMessage());

                if (APP_ENV === 'production') {
                    http_response_code(503);
                    die("<div style='font-family: sans-serif; padding: 24px; max-width: 520px; margin: 60px auto;'>"
                        . "<h3 style='margin:0 0 8px 0;'>Layanan sedang tidak tersedia</h3>"
                        . "<p style='margin:0; font-size:14px; line-height:1.6;'>Sistem tidak dapat memproses permintaan Anda saat ini. Silakan coba beberapa saat lagi atau hubungi administrator.</p>"
                        . "</div>");
                }

                // Lingkungan pengembangan: tampilkan petunjuk teknis seadanya.
                die("
                <div style='font-family: \"Hanken Grotesk\", \"Inter\", sans-serif; padding: 24px; background: #ffdad6; color: #93000a; border: 1px solid #ffb4ab; border-radius: 8px; max-width: 550px; margin: 60px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'>
                    <div style='display: flex; align-items: center; gap: 12px; margin-bottom: 16px;'>
                        <span style='font-size: 24px;'>⚠️</span>
                        <h3 style='margin: 0; font-size: 20px; font-weight: 700;'>Galat Koneksi Basis Data</h3>
                    </div>
                    <p style='margin: 0 0 12px 0; font-size: 14px; line-height: 1.6;'>Sistem gagal terhubung ke database <strong>" . htmlspecialchars(DB_NAME, ENT_QUOTES, 'UTF-8') . "</strong> pada server lokal Apache/MySQL XAMPP Anda.</p>
                    <p style='margin: 0 0 16px 0; font-size: 14px; line-height: 1.6;'>Silakan pastikan modul <strong>MySQL</strong> di Control Panel XAMPP Anda telah diaktifkan, dan berkas SQL DDL pada <strong>DESIGN.md</strong> telah di-import di phpMyAdmin.</p>
                    <hr style='border: none; border-top: 1px solid #ffb4ab; margin: 16px 0;'>
                    <small style='color: #ba1a1a; font-family: monospace; font-size: 12px;'>Detail Kesalahan (PDOException): " . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . "</small>
                </div>");
            }
        }
        return self::$connection;
    }
}
