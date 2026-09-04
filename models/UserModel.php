<?php
/**
 * ============================================================================
 * MODEL: UserModel — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Model ini bertanggung jawab penuh atas manipulasi dan ekstraksi data dari
 * tabel `users` serta pencocokan relasi peran dengan tabel `roles`.
 * 
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * 1. Pencegahan SQL Injection: Seluruh parameter input diikat menggunakan
 *    placeholder bindings (seperti `:username` dan `:role_name`).
 * 2. Isolasi Peran: Query menggabungkan data user dengan tabel role menggunakan
 *    klausul JOIN, memastikan hanya pengguna dengan role yang tepat yang dikembalikan.
 */

class UserModel {
    private $db;

    public function __construct() {
        // Mengambil koneksi database terpusat yang aman dari class Database
        $this->db = Database::getConnection();
    }

    /**
     * Mencari data user berdasarkan username dan nama role secara aman
     * 
     * @param string $username - Username pengguna yang diinput saat login
     * @param string $roleName - Nama role aktor ('ADMIN', 'STAFF', 'CUSTOMER')
     * @return array|false - Mengembalikan baris data user jika ditemukan, atau false jika gagal
     */
    public function getUserByUsernameAndRole($username, $roleName) {
        try {
            // Query relasional multi-tabel menggunakan ANSI-SQL standar
            $sql = "SELECT u.*, r.role_name 
                    FROM users u 
                    JOIN roles r ON u.role_id = r.id 
                    WHERE u.username = :username 
                      AND r.role_name = :role_name 
                      AND u.status = 'ACTIVE' 
                    LIMIT 1";
            
            // Persiapkan statement query (Pre-compiled Query)
            $stmt = $this->db->prepare($sql);
            
            // Jalankan statement dengan mengikat parameter secara ketat
            $stmt->execute([
                ':username' => $username,
                ':role_name' => $roleName
            ]);
            
            // Mengembalikan baris data jika ada pencocokan
            return $stmt->fetch();
        } catch (PDOException $e) {
            // Catat log jika terjadi galat teknis pada database
            error_log("UserModel Exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Mengambil statistik ringkasan pengguna untuk Bento Cards
     * 
     * @return array - Array metrik (total, admins, staff, active)
     */
    public function getUserStats() {
        try {
            $stats = [];
            
            // 1. Total Users
            $stmt = $this->db->query("SELECT COUNT(*) FROM users");
            $stats['total'] = $stmt->fetchColumn() ?: 0;

            // 2. Total Admins (role_id = 1)
            $stmt = $this->db->query("SELECT COUNT(*) FROM users WHERE role_id = 1");
            $stats['admins'] = $stmt->fetchColumn() ?: 0;

            // 3. Total Staff (role_id = 2)
            $stmt = $this->db->query("SELECT COUNT(*) FROM users WHERE role_id = 2");
            $stats['staff'] = $stmt->fetchColumn() ?: 0;

            // 4. Active Now (status = 'ACTIVE')
            $stmt = $this->db->query("SELECT COUNT(*) FROM users WHERE status = 'ACTIVE'");
            $stats['active'] = $stmt->fetchColumn() ?: 0;

            return $stats;
        } catch (PDOException $e) {
            error_log("UserModel Exception (getUserStats): " . $e->getMessage());
            return ['total' => 0, 'admins' => 0, 'staff' => 0, 'active' => 0];
        }
    }

    /**
     * Mengambil daftar seluruh pengguna dengan filter pencarian dan peran
     * 
     * @param string $search - Kata kunci pencarian nama/email/username
     * @param string $roleFilter - Filter nama peran (ADMIN, STAFF, CUSTOMER, ALL)
     * @return array - Daftar pengguna dari database
     */
    public function getUsers($search = '', $roleFilter = '') {
        try {
            $sql = "SELECT u.*, r.role_name 
                    FROM users u 
                    JOIN roles r ON u.role_id = r.id 
                    WHERE 1=1";
            $params = [];

            if (!empty($search)) {
                $sql .= " AND (u.full_name LIKE :search1 
                            OR u.email LIKE :search2 
                            OR u.username LIKE :search3 
                            OR u.company_name LIKE :search4)";
                $params[':search1'] = '%' . $search . '%';
                $params[':search2'] = '%' . $search . '%';
                $params[':search3'] = '%' . $search . '%';
                $params[':search4'] = '%' . $search . '%';
            }

            if (!empty($roleFilter) && $roleFilter !== 'ALL') {
                $sql .= " AND r.role_name = :role_filter";
                $params[':role_filter'] = strtoupper(trim($roleFilter));
            }

            $sql .= " ORDER BY u.id DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("UserModel Exception (getUsers): " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil data user berdasarkan ID secara aman
     * 
     * @param int $id - ID user
     * @return array|false - Mengembalikan data user atau false
     */
    public function getUserById($id) {
        try {
            $sql = "SELECT u.*, r.role_name 
                    FROM users u 
                    JOIN roles r ON u.role_id = r.id 
                    WHERE u.id = :id 
                    LIMIT 1";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $id]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("UserModel Exception (getUserById): " . $e->getMessage());
            return false;
        }
    }

    /**
     * Memperbarui profil pengguna secara aman
     * 
     * @param int $id - ID user
     * @param string $fullName
     * @param string $email
     * @param string $phone
     * @param string $address
     * @param string|null $passwordHash - Password ter-hash jika ingin memperbarui, null jika tidak diubah
     * @return bool - true jika sukses, false jika gagal
     */
    public function updateProfile($id, $fullName, $email, $phone, $address, $passwordHash = null) {
        try {
            if ($passwordHash) {
                $sql = "UPDATE users 
                        SET full_name = :full_name, email = :email, phone = :phone, address = :address, password = :password 
                        WHERE id = :id";
                $stmt = $this->db->prepare($sql);
                return $stmt->execute([
                    ':full_name' => $fullName,
                    ':email' => $email,
                    ':phone' => $phone,
                    ':address' => $address,
                    ':password' => $passwordHash,
                    ':id' => $id
                ]);
            } else {
                $sql = "UPDATE users 
                        SET full_name = :full_name, email = :email, phone = :phone, address = :address 
                        WHERE id = :id";
                $stmt = $this->db->prepare($sql);
                return $stmt->execute([
                    ':full_name' => $fullName,
                    ':email' => $email,
                    ':phone' => $phone,
                    ':address' => $address,
                    ':id' => $id
                ]);
            }
        } catch (PDOException $e) {
            error_log("UserModel Exception (updateProfile): " . $e->getMessage());
            return false;
        }
    }

    /**
     * Menambahkan user baru secara aman
     * 
     * @param array $data
     * @return bool
     */
    public function addUser($data) {
        try {
            $sql = "INSERT INTO users 
                    (username, password, email, full_name, role_id, phone, address, company_name, status) 
                    VALUES 
                    (:username, :password, :email, :full_name, :role_id, :phone, :address, :company_name, :status)";
            
            $stmt = $this->db->prepare($sql);
            
            // Hash password jika diberikan
            $passwordHash = password_hash($data['password'] ?: '123456', PASSWORD_BCRYPT);
            
            return $stmt->execute([
                ':username' => $data['username'],
                ':password' => $passwordHash,
                ':email' => $data['email'],
                ':full_name' => $data['full_name'],
                ':role_id' => $data['role_id'],
                ':phone' => $data['phone'] ?: null,
                ':address' => $data['address'] ?: null,
                ':company_name' => $data['company_name'] ?: null,
                ':status' => $data['status'] ?: 'ACTIVE'
            ]);
        } catch (PDOException $e) {
            error_log("UserModel Exception (addUser): " . $e->getMessage());
            return false;
        }
    }

    /**
     * Memperbarui data user secara aman
     * 
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function updateUser($id, $data) {
        try {
            if (!empty($data['password'])) {
                $sql = "UPDATE users 
                        SET username = :username, password = :password, email = :email, 
                            full_name = :full_name, role_id = :role_id, phone = :phone, 
                            address = :address, company_name = :company_name, status = :status 
                        WHERE id = :id";
                $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);
                $params = [
                    ':username' => $data['username'],
                    ':password' => $passwordHash,
                    ':email' => $data['email'],
                    ':full_name' => $data['full_name'],
                    ':role_id' => $data['role_id'],
                    ':phone' => $data['phone'] ?: null,
                    ':address' => $data['address'] ?: null,
                    ':company_name' => $data['company_name'] ?: null,
                    ':status' => $data['status'],
                    ':id' => $id
                ];
            } else {
                $sql = "UPDATE users 
                        SET username = :username, email = :email, 
                            full_name = :full_name, role_id = :role_id, phone = :phone, 
                            address = :address, company_name = :company_name, status = :status 
                        WHERE id = :id";
                $params = [
                    ':username' => $data['username'],
                    ':email' => $data['email'],
                    ':full_name' => $data['full_name'],
                    ':role_id' => $data['role_id'],
                    ':phone' => $data['phone'] ?: null,
                    ':address' => $data['address'] ?: null,
                    ':company_name' => $data['company_name'] ?: null,
                    ':status' => $data['status'],
                    ':id' => $id
                ];
            }
            
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("UserModel Exception (updateUser): " . $e->getMessage());
            return false;
        }
    }

    /**
     * Menghapus user secara aman
     * 
     * @param int $id
     * @return bool
     */
    public function deleteUser($id) {
        try {
            $sql = "DELETE FROM users WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([':id' => $id]);
        } catch (PDOException $e) {
            error_log("UserModel Exception (deleteUser): " . $e->getMessage());
            return false;
        }
    }
}
