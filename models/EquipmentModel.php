<?php
/**
 * ============================================================================
 * MODEL: EquipmentModel — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Mengelola seluruh transaksi data inventaris alat berat (tabel `equipments`).
 * Menyediakan fungsi penarikan data, agregasi status bento, penambahan,
 * penyuntingan, dan penghapusan unit secara aman melalui PDO Prepared Statements.
 * 
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * 1. Pencegahan Injeksi SQL: Seluruh filter dan kueri dinamis diikat menggunakan
 *    PDO parameter binding.
 * 2. Transaksi Data Riil: Terhubung langsung ke tabel `equipments` tanpa data tiruan.
 */

class EquipmentModel {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Menghitung rangkuman statistik unit alat berat untuk panel bento atas
     * 
     * @return array
     */
    public function getEquipmentStats() {
        $stats = [
            'total' => 0,
            'available' => 0,
            'rented' => 0,
            'maintenance' => 0
        ];

        try {
            // Total unit alat berat
            $stmt = $this->db->query("SELECT COUNT(*) AS total FROM `equipments`");
            $stats['total'] = $stmt->fetchColumn();

            // Total unit berstatus AVAILABLE (Tersedia)
            $stmt = $this->db->query("SELECT COUNT(*) AS available FROM `equipments` WHERE `status` = 'AVAILABLE'");
            $stats['available'] = $stmt->fetchColumn();

            // Total unit berstatus RENTED (Disewa)
            $stmt = $this->db->query("SELECT COUNT(*) AS rented FROM `equipments` WHERE `status` = 'RENTED'");
            $stats['rented'] = $stmt->fetchColumn();

            // Total unit berstatus MAINTENANCE (Perawatan)
            $stmt = $this->db->query("SELECT COUNT(*) AS maintenance FROM `equipments` WHERE `status` = 'MAINTENANCE'");
            $stats['maintenance'] = $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Gagal mengambil statistik alat berat: " . $e->getMessage());
        }

        return $stats;
    }

    /**
     * Mengambil daftar alat berat berdasarkan kata kunci pencarian (nama atau kode)
     * 
     * @param string $search - Kata kunci pencarian
     * @return array
     */
    public function getEquipments($search = '') {
        try {
            if (!empty($search)) {
                $query = "SELECT * FROM `equipments` 
                          WHERE `equipment_code` LIKE :search1 
                             OR `name` LIKE :search2 
                             OR `type` LIKE :search3 
                             OR `brand` LIKE :search4 
                          ORDER BY `equipment_code` ASC";
                $stmt = $this->db->prepare($query);
                $searchTerm = "%{$search}%";
                $stmt->bindParam(':search1', $searchTerm, PDO::PARAM_STR);
                $stmt->bindParam(':search2', $searchTerm, PDO::PARAM_STR);
                $stmt->bindParam(':search3', $searchTerm, PDO::PARAM_STR);
                $stmt->bindParam(':search4', $searchTerm, PDO::PARAM_STR);
                $stmt->execute();
                return $stmt->fetchAll();
            } else {
                $query = "SELECT * FROM `equipments` ORDER BY `equipment_code` ASC";
                $stmt = $this->db->query($query);
                return $stmt->fetchAll();
            }
        } catch (PDOException $e) {
            error_log("Gagal mengambil daftar alat berat: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil detail satu alat berat berdasarkan ID
     * 
     * @param int $id
     * @return array|null
     */
    public function getEquipmentById($id) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM `equipments` WHERE `id` = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetch() ?: null;
        } catch (PDOException $e) {
            error_log("Gagal mengambil detail alat berat ID {$id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Menambahkan unit alat berat baru ke basis data
     * 
     * @param array $data
     * @return bool
     */
    public function addEquipment($data) {
        try {
            $query = "INSERT INTO `equipments` 
                      (`equipment_code`, `name`, `type`, `model`, `brand`, `hour_meter`, `rental_price_per_day`, `status`, `last_maintenance_date`, `thumbnail_url`) 
                      VALUES 
                      (:code, :name, :type, :model, :brand, :hour_meter, :price, :status, :last_maintenance, :thumbnail)";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':code', $data['equipment_code'], PDO::PARAM_STR);
            $stmt->bindParam(':name', $data['name'], PDO::PARAM_STR);
            $stmt->bindParam(':type', $data['type'], PDO::PARAM_STR);
            $stmt->bindParam(':model', $data['model'], PDO::PARAM_STR);
            $stmt->bindParam(':brand', $data['brand'], PDO::PARAM_STR);
            $stmt->bindParam(':hour_meter', $data['hour_meter']);
            $stmt->bindParam(':price', $data['rental_price_per_day']);
            $stmt->bindParam(':status', $data['status'], PDO::PARAM_STR);
            $stmt->bindParam(':last_maintenance', $data['last_maintenance_date'], PDO::PARAM_STR);
            $stmt->bindParam(':thumbnail', $data['thumbnail_url'], PDO::PARAM_STR);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Gagal menambah alat berat baru: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Memperbarui detail unit alat berat yang sudah ada
     * 
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function updateEquipment($id, $data) {
        try {
            $query = "UPDATE `equipments` SET 
                      `equipment_code` = :code, 
                      `name` = :name, 
                      `type` = :type, 
                      `model` = :model, 
                      `brand` = :brand, 
                      `hour_meter` = :hour_meter, 
                      `rental_price_per_day` = :price, 
                      `status` = :status, 
                      `last_maintenance_date` = :last_maintenance, 
                      `thumbnail_url` = :thumbnail 
                      WHERE `id` = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':code', $data['equipment_code'], PDO::PARAM_STR);
            $stmt->bindParam(':name', $data['name'], PDO::PARAM_STR);
            $stmt->bindParam(':type', $data['type'], PDO::PARAM_STR);
            $stmt->bindParam(':model', $data['model'], PDO::PARAM_STR);
            $stmt->bindParam(':brand', $data['brand'], PDO::PARAM_STR);
            $stmt->bindParam(':hour_meter', $data['hour_meter']);
            $stmt->bindParam(':price', $data['rental_price_per_day']);
            $stmt->bindParam(':status', $data['status'], PDO::PARAM_STR);
            $stmt->bindParam(':last_maintenance', $data['last_maintenance_date'], PDO::PARAM_STR);
            $stmt->bindParam(':thumbnail', $data['thumbnail_url'], PDO::PARAM_STR);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Gagal memperbarui alat berat ID {$id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Menghapus unit alat berat dari basis data
     * 
     * @param int $id
     * @return bool
     */
    public function deleteEquipment($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM `equipments` WHERE `id` = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Gagal menghapus alat berat ID {$id}: " . $e->getMessage());
            return false;
        }
    }
}
