<?php
/**
 * ============================================================================
 * MODEL: GpsModel — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Model ini bertanggung jawab atas pembacaan data telemetri real-time dari
 * perangkat GPS terpasang pada alat berat (tabel `gps_tracking`).
 * 
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * 1. Subquery Optimal: Menggunakan subquery MAX(recorded_at) untuk mengisolasi
 *    posisi telemetri terakhir dari masing-masing unit alat berat, sehingga
 *    mencegah duplikasi marker di peta.
 * 2. Relasi Multi-Tabel: Menggabungkan data alat berat (`equipments`), sewa aktif
 *    (`rentals`), dan data penyewa (`users`) secara terpadu melalui SQL JOINs.
 */

class GpsModel {
    private $db;

    public function __construct() {
        // Menggunakan koneksi PDO terpusat dari class Database
        $this->db = Database::getConnection();
    }

    /**
     * Mengambil koordinat dan parameter sensor terakhir dari setiap unit alat berat
     * 
     * @return array - Daftar alat berat beserta data telemetri terbarunya
     */
    public function getLatestLocations() {
        try {
            // Query optimal untuk mendapatkan telemetri teranyar per unit alat berat
            $sql = "SELECT 
                        eq.id AS equipment_id,
                        eq.equipment_code,
                        eq.name AS equipment_name,
                        eq.type AS equipment_type,
                        eq.brand AS equipment_brand,
                        eq.model AS equipment_model,
                        eq.hour_meter AS current_hour_meter,
                        eq.status AS equipment_status,
                        gps.latitude,
                        gps.longitude,
                        gps.speed,
                        gps.engine_status,
                        gps.fuel_level_percent,
                        gps.recorded_at,
                        r.rental_code,
                        c.full_name AS customer_name,
                        c.company_name AS customer_company
                    FROM equipments eq
                    INNER JOIN (
                        -- Cari ID GPS tracking terakhir untuk setiap equipment_id
                        SELECT g1.equipment_id, MAX(g1.id) AS latest_gps_id
                        FROM gps_tracking g1
                        INNER JOIN (
                            SELECT equipment_id, MAX(recorded_at) AS max_recorded
                            FROM gps_tracking
                            GROUP BY equipment_id
                        ) g2 ON g1.equipment_id = g2.equipment_id AND g1.recorded_at = g2.max_recorded
                        GROUP BY g1.equipment_id
                    ) latest ON eq.id = latest.equipment_id
                    INNER JOIN gps_tracking gps ON latest.latest_gps_id = gps.id
                    LEFT JOIN rentals r ON eq.id = r.equipment_id AND r.status = 'ON_GOING'
                    LEFT JOIN users c ON r.customer_id = c.id
                    ORDER BY eq.equipment_code ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("GpsModel Exception: " . $e->getMessage());
            return [];
        }
    }
}
