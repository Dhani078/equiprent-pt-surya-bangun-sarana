<?php
/**
 * ============================================================================
 * DATABASE CONFIGURATION: PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Mengatur koneksi database menggunakan PDO (PHP Data Objects) secara aman.
 * Konfigurasi database dirancang untuk lingkungan lokal XAMPP.
 * 
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * 1. Keamanan SQL Injection: Mengaktifkan PDO::ATTR_ERRMODE dan mematikan 
 *    PDO::ATTR_EMULATE_PREPARES agar parsing query diserahkan sepenuhnya ke
 *    engine MySQL database (real prepared statements).
 * 2. Driver Database: Menggunakan mysql dengan set charset utf8mb4 agar mendukung
 *    penyimpanan karakter dan simbol modern secara optimal.
 */

// Definisi konstanta kredensial basis data riil
define('DB_HOST', 'localhost');
define('DB_NAME', 'db_surya_heavy_equipment'); // Sesuai spesifikasi DESIGN.md
define('DB_USER', 'root');
define('DB_PASS', '');

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
                // Tampilan penanganan galat koneksi basis data (Try-Catch Error Layout)
                die("
                <div style='font-family: \"Hanken Grotesk\", \"Inter\", sans-serif; padding: 24px; background: #ffdad6; color: #93000a; border: 1px solid #ffb4ab; border-radius: 8px; max-width: 550px; margin: 60px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'>
                    <div style='display: flex; align-items: center; gap: 12px; margin-bottom: 16px;'>
                        <span style='font-size: 24px;'>⚠️</span>
                        <h3 style='margin: 0; font-size: 20px; font-weight: 700;'>Galat Koneksi Basis Data</h3>
                    </div>
                    <p style='margin: 0 0 12px 0; font-size: 14px; line-height: 1.6;'>Sistem gagal terhubung ke database <strong>" . DB_NAME . "</strong> pada server lokal Apache/MySQL XAMPP Anda.</p>
                    <p style='margin: 0 0 16px 0; font-size: 14px; line-height: 1.6;'>Silakan pastikan modul <strong>MySQL</strong> di Control Panel XAMPP Anda telah diaktifkan, dan berkas SQL DDL pada <strong>DESIGN.md</strong> telah di-import di phpMyAdmin.</p>
                    <hr style='border: none; border-top: 1px solid #ffb4ab; margin: 16px 0;'>
                    <small style='color: #ba1a1a; font-family: monospace; font-size: 12px;'>Detail Kesalahan (PDOException): " . htmlspecialchars($e->getMessage()) . "</small>
                </div>");
            }
        }
        return self::$connection;
    }
}
