<?php
/**
 * ============================================================================
 * CONTROLLER: TrackingController — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Mengendalikan alur request penayangan peta telemetri real-time unit alat berat.
 * Menjamin pembatasan akses berbasis peran (ADMIN dan STAFF saja) serta
 * menyediakan payload data GPS yang siap dirender oleh Leaflet.js di sisi View.
 * 
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * 1. Role-Based Access Control (RBAC): Membatasi pemanggilan modul peta hanya
 *    kepada aktor ADMIN dan STAFF untuk alasan privasi logistik perusahaan.
 * 2. Data Hydration: Menarik dataset geografis riil dari GpsModel tanpa
 *    memakai array hardcode (Zero-Dummy Data).
 */

class TrackingController {
    private $gpsModel;

    public function __construct() {
        // Menginisialisasi model pemantauan GPS
        $this->gpsModel = new GpsModel();
    }

    /**
     * Memproses pemanggilan antarmuka pelacakan GPS alat berat
     */
    public function index() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') {
            // Memanfaatkan handler error penolakan akses kustom yang telah dibuat di index.php
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('ADMIN / STAFF', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Menu tracking hanya diizinkan untuk Admin dan Staf.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // 2. Ekstraksi koordinat telemetri teranyar dari database
        $latestLocations = $this->gpsModel->getLatestLocations();

        // 3. Merender halaman visualisasi peta Leaflet.js
        require_once 'views/admin/tracking.php';
    }
}
