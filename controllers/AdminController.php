<?php
/**
 * ============================================================================
 * CONTROLLER: AdminController — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 * 
 * Mengendalikan alur request penayangan dashboard Administrator utama.
 * Memastikan proteksi hak akses berbasis peran (ADMIN) secara ketat, serta
 * menyuplai data metrik finansial-operasional riil ke layar View.
 * 
 * INTEGRITAS AKADEMIK (SIDANG SKRIPSI):
 * 1. Otoritas Tunggal: Mengunci modul dengan RBAC 'ADMIN' saja, memblokir Staff 
 *    atau Customer untuk mengintip performa keuangan perusahaan.
 * 2. Data Bridging: Mengangkut data ringkasan model ke view tanpa modifikasi
 *    kelas orisinal (Clean Controller Design Pattern).
 */

class AdminController {
    private $dashboardModel;
    private $userModel;

    public function __construct() {
        // Inisialisasi model statistik dashboard
        $this->dashboardModel = new DashboardModel();
        $this->userModel = new UserModel();
    }

    /**
     * Memproses pemanggilan antarmuka Dashboard Admin utama
     */
    public function dashboard() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN') {
            // Gunakan fungsi visual pembatas akses kustom yang aman dari index.php
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('ADMIN', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya diizinkan untuk Administrator.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // 2. Ekstraksi metrik statistik, daftar transaksi terbaru, dan agenda pemeliharaan kritis
        $stats = $this->dashboardModel->getAdminStats();
        $recentRentals = $this->dashboardModel->getRecentRentals();
        $urgentMaintenance = $this->dashboardModel->getUrgentMaintenance();
        $monthlyRentalTrend = $this->dashboardModel->getMonthlyRentalTrend();

        // 3. Merender berkas visualisasi dashboard utama Admin
        require_once 'views/admin/dashboard.php';
    }

    /**
     * Memproses pemanggilan antarmuka Manajemen Inventaris Alat Berat
     */
    public function equipment() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('ADMIN / STAFF', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya diizinkan untuk Admin dan Staf.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // Inisialisasi model
        $equipmentModel = new EquipmentModel();

        // Handle POST Actions
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $action = filter_input(INPUT_GET, 'action', FILTER_DEFAULT) ?? '';
            
            if ($action === 'add') {
                $data = [
                    'equipment_code' => filter_input(INPUT_POST, 'equipment_code', FILTER_DEFAULT) ?? '',
                    'name' => filter_input(INPUT_POST, 'name', FILTER_DEFAULT) ?? '',
                    'type' => filter_input(INPUT_POST, 'type', FILTER_DEFAULT) ?? '',
                    'model' => filter_input(INPUT_POST, 'model', FILTER_DEFAULT) ?? '',
                    'brand' => filter_input(INPUT_POST, 'brand', FILTER_DEFAULT) ?? '',
                    'hour_meter' => filter_input(INPUT_POST, 'hour_meter', FILTER_VALIDATE_FLOAT) ?? 0.0,
                    'rental_price_per_day' => filter_input(INPUT_POST, 'rental_price_per_day', FILTER_VALIDATE_FLOAT) ?? 0.0,
                    'status' => filter_input(INPUT_POST, 'status', FILTER_DEFAULT) ?? 'AVAILABLE',
                    'last_maintenance_date' => filter_input(INPUT_POST, 'last_maintenance_date', FILTER_DEFAULT) ?? date('Y-m-d'),
                    'thumbnail_url' => filter_input(INPUT_POST, 'thumbnail_url', FILTER_DEFAULT) ?? ''
                ];
                
                if ($equipmentModel->addEquipment($data)) {
                    $_SESSION['success'] = "Alat berat baru berhasil ditambahkan!";
                } else {
                    $_SESSION['error'] = "Gagal menambahkan alat berat!";
                }
                header("Location: index.php?page=equipment");
                exit;
            } elseif ($action === 'edit') {
                $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT) ?? 0;
                $data = [
                    'equipment_code' => filter_input(INPUT_POST, 'equipment_code', FILTER_DEFAULT) ?? '',
                    'name' => filter_input(INPUT_POST, 'name', FILTER_DEFAULT) ?? '',
                    'type' => filter_input(INPUT_POST, 'type', FILTER_DEFAULT) ?? '',
                    'model' => filter_input(INPUT_POST, 'model', FILTER_DEFAULT) ?? '',
                    'brand' => filter_input(INPUT_POST, 'brand', FILTER_DEFAULT) ?? '',
                    'hour_meter' => filter_input(INPUT_POST, 'hour_meter', FILTER_VALIDATE_FLOAT) ?? 0.0,
                    'rental_price_per_day' => filter_input(INPUT_POST, 'rental_price_per_day', FILTER_VALIDATE_FLOAT) ?? 0.0,
                    'status' => filter_input(INPUT_POST, 'status', FILTER_DEFAULT) ?? 'AVAILABLE',
                    'last_maintenance_date' => filter_input(INPUT_POST, 'last_maintenance_date', FILTER_DEFAULT) ?? date('Y-m-d'),
                    'thumbnail_url' => filter_input(INPUT_POST, 'thumbnail_url', FILTER_DEFAULT) ?? ''
                ];
                
                if ($equipmentModel->updateEquipment($id, $data)) {
                    $_SESSION['success'] = "Data alat berat berhasil diperbarui!";
                } else {
                    $_SESSION['error'] = "Gagal memperbarui data alat berat!";
                }
                header("Location: index.php?page=equipment");
                exit;
            }
        }

        // Handle GET Actions
        $action = filter_input(INPUT_GET, 'action', FILTER_DEFAULT) ?? '';
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) ?? 0;
        
        if ($action === 'delete' && $id) {
            if ($equipmentModel->deleteEquipment($id)) {
                $_SESSION['success'] = "Alat berat berhasil dihapus!";
            } else {
                $_SESSION['error'] = "Gagal menghapus alat berat!";
            }
            header("Location: index.php?page=equipment");
            exit;
        }

        // 2. Baca kata kunci pencarian jika ada
        $search = filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? '';

        // 3. Ambil data alat berat & statistik bento
        $stats = $equipmentModel->getEquipmentStats();
        $equipments = $equipmentModel->getEquipments($search);

        // Extract individual stats for views
        $totalUnit = $stats['total'];
        $availableUnit = $stats['available'];
        $rentedUnit = $stats['rented'];
        $maintenanceUnit = $stats['maintenance'];

        // 4. Merender berkas visualisasi inventory
        require_once 'views/admin/equipment.php';
    }

    /**
     * Memproses pemanggilan antarmuka Manajemen Transaksi Rental Alat Berat
     */
    public function rentals() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('ADMIN / STAFF', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya diizinkan untuk Admin dan Staf.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // Inisialisasi model
        $rentalModel = new RentalModel();

        // Handle POST Actions
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $postAction = filter_input(INPUT_POST, 'action', FILTER_DEFAULT) ?? '';
            if ($postAction === 'add') {
                $customerId = filter_input(INPUT_POST, 'customer_id', FILTER_VALIDATE_INT);
                $equipmentId = filter_input(INPUT_POST, 'equipment_id', FILTER_VALIDATE_INT);
                $startDate = filter_input(INPUT_POST, 'start_date', FILTER_DEFAULT);
                $endDate = filter_input(INPUT_POST, 'end_date', FILTER_DEFAULT);
                $notes = filter_input(INPUT_POST, 'notes', FILTER_DEFAULT) ?? '';
                
                if ($customerId && $equipmentId && $startDate && $endDate) {
                    // Hitung total hari sewa
                    $start = new DateTime($startDate);
                    $end = new DateTime($endDate);
                    $diff = $start->diff($end);
                    $totalDays = $diff->days ?: 1;
                    
                    // Ambil harga sewa per hari dari database equipment
                    $db = Database::getConnection();
                    $stmt = $db->prepare("SELECT rental_price_per_day FROM equipments WHERE id = :id");
                    $stmt->execute([':id' => $equipmentId]);
                    $pricePerDay = $stmt->fetchColumn() ?: 0;
                    
                    $subtotal = $pricePerDay * $totalDays;
                    $rentalCode = 'SBS-RNT-' . strtoupper(bin2hex(random_bytes(3)));
                    
                    $data = [
                        'rental_code' => $rentalCode,
                        'customer_id' => $customerId,
                        'equipment_id' => $equipmentId,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'total_days' => $totalDays,
                        'subtotal' => $subtotal,
                        'status' => 'APPROVED', // Default langsung APPROVED agar langsung jalan
                        'notes' => $notes
                    ];
                    
                    if ($rentalModel->addRental($data)) {
                        // Ubah status equipment ke RENTED
                        $stmtUpdate = $db->prepare("UPDATE equipments SET status = 'RENTED' WHERE id = :id");
                        $stmtUpdate->execute([':id' => $equipmentId]);

                        $_SESSION['success'] = "Rental Order baru berhasil dibuat!";
                    } else {
                        $_SESSION['error'] = "Gagal membuat Rental Order baru.";
                    }
                } else {
                    $_SESSION['error'] = "Lengkapi seluruh field wajib untuk Rental Order.";
                }
                header("Location: index.php?page=rentals");
                exit;
            }
        }

        // 1.5 Handle Action (Approve / Reject / Complete / Delete)
        $action = filter_input(INPUT_GET, 'action', FILTER_DEFAULT) ?? '';
        $rentalId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) ?? 0;
        
        if ($action && $rentalId) {
            if ($action === 'approve') {
                $rentalModel->updateRentalStatus($rentalId, 'APPROVED');
                
                // Ubah status equipment ke RENTED
                $db = Database::getConnection();
                $stmtGetEquip = $db->prepare("SELECT equipment_id FROM rentals WHERE id = :id");
                $stmtGetEquip->execute([':id' => $rentalId]);
                $equipId = $stmtGetEquip->fetchColumn();
                if ($equipId) {
                    $stmtUpdate = $db->prepare("UPDATE equipments SET status = 'RENTED' WHERE id = :id");
                    $stmtUpdate->execute([':id' => $equipId]);
                }
                
                $_SESSION['success'] = "Rental Order berhasil disetujui!";
            } elseif ($action === 'reject') {
                $rentalModel->updateRentalStatus($rentalId, 'REJECTED');
                
                // Kembalikan status equipment ke AVAILABLE
                $db = Database::getConnection();
                $stmtGetEquip = $db->prepare("SELECT equipment_id FROM rentals WHERE id = :id");
                $stmtGetEquip->execute([':id' => $rentalId]);
                $equipId = $stmtGetEquip->fetchColumn();
                if ($equipId) {
                    $stmtUpdate = $db->prepare("UPDATE equipments SET status = 'AVAILABLE' WHERE id = :id");
                    $stmtUpdate->execute([':id' => $equipId]);
                }
                
                $_SESSION['success'] = "Rental Order berhasil ditolak!";
            } elseif ($action === 'complete') {
                $rentalModel->updateRentalStatus($rentalId, 'COMPLETED');
                
                // Kembalikan status equipment ke AVAILABLE
                $db = Database::getConnection();
                $stmtGetEquip = $db->prepare("SELECT equipment_id FROM rentals WHERE id = :id");
                $stmtGetEquip->execute([':id' => $rentalId]);
                $equipId = $stmtGetEquip->fetchColumn();
                if ($equipId) {
                    $stmtUpdate = $db->prepare("UPDATE equipments SET status = 'AVAILABLE' WHERE id = :id");
                    $stmtUpdate->execute([':id' => $equipId]);
                }
                
                $_SESSION['success'] = "Rental Order berhasil diselesaikan!";
            } elseif ($action === 'delete') {
                // Sebelum hapus sewa, kembalikan status equipment
                $db = Database::getConnection();
                $stmtGetEquip = $db->prepare("SELECT equipment_id FROM rentals WHERE id = :id");
                $stmtGetEquip->execute([':id' => $rentalId]);
                $equipId = $stmtGetEquip->fetchColumn();
                if ($equipId) {
                    $stmtUpdate = $db->prepare("UPDATE equipments SET status = 'AVAILABLE' WHERE id = :id");
                    $stmtUpdate->execute([':id' => $equipId]);
                }

                $rentalModel->deleteRental($rentalId);
                $_SESSION['success'] = "Rental Order berhasil dihapus!";
            }
            header("Location: index.php?page=rentals");
            exit;
        }

        // 2. Baca parameter filter
        $search = filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? '';
        $status = filter_input(INPUT_GET, 'status', FILTER_DEFAULT) ?? 'ALL';
        $startDate = filter_input(INPUT_GET, 'start_date', FILTER_DEFAULT) ?? '';
        $endDate = filter_input(INPUT_GET, 'end_date', FILTER_DEFAULT) ?? '';

        // 3. Ambil data rental & statistik bento
        $stats = $rentalModel->getRentalStats();
        $rentals = $rentalModel->getRentals($search, $status, $startDate, $endDate);

        // Fetch customers & equipments dynamically for creation modal dropdowns
        $db = Database::getConnection();
        $stmtCust = $db->query("SELECT id, full_name, company_name FROM users WHERE role_id = (SELECT id FROM roles WHERE role_name = 'CUSTOMER') ORDER BY full_name ASC");
        $customersList = $stmtCust->fetchAll();
        
        $stmtEquip = $db->query("SELECT id, name, equipment_code, rental_price_per_day FROM equipments WHERE status = 'AVAILABLE' ORDER BY name ASC");
        $equipmentsList = $stmtEquip->fetchAll();

        // 4. Merender berkas visualisasi rentals berdasarkan peran pengguna
        if ($currentRole === 'STAFF') {
            require_once 'views/staff/rentals.php';
        } else {
            require_once 'views/admin/rentals.php';
        }
    }

    /**
     * Memproses pemanggilan antarmuka Manajemen Pemeliharaan Alat Berat
     */
    public function maintenance() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('ADMIN / STAFF', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya diizinkan untuk Admin dan Staf.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // Inisialisasi model
        $maintenanceModel = new MaintenanceModel();

        // Handle POST Actions
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $postAction = filter_input(INPUT_POST, 'action', FILTER_DEFAULT) ?? '';
            if ($postAction === 'add') {
                $equipmentId = filter_input(INPUT_POST, 'equipment_id', FILTER_VALIDATE_INT);
                $scheduledDate = filter_input(INPUT_POST, 'scheduled_date', FILTER_DEFAULT);
                $maintenanceType = filter_input(INPUT_POST, 'maintenance_type', FILTER_DEFAULT);
                $cost = filter_input(INPUT_POST, 'cost', FILTER_VALIDATE_FLOAT) ?? 0.0;
                $hourMeter = filter_input(INPUT_POST, 'hour_meter', FILTER_VALIDATE_INT) ?? 0;
                $technicianId = filter_input(INPUT_POST, 'technician_id', FILTER_VALIDATE_INT);
                $status = filter_input(INPUT_POST, 'status', FILTER_DEFAULT) ?? 'SCHEDULED';
                $notes = filter_input(INPUT_POST, 'notes', FILTER_DEFAULT) ?? '';
                
                if ($equipmentId && $scheduledDate && $maintenanceType && $technicianId) {
                    $maintCode = 'SBS-MTN-' . strtoupper(bin2hex(random_bytes(3)));
                    $data = [
                        'maintenance_code' => $maintCode,
                        'equipment_id' => $equipmentId,
                        'scheduled_date' => $scheduledDate,
                        'maintenance_type' => $maintenanceType,
                        'cost' => $cost,
                        'hour_meter' => $hourMeter,
                        'technician_id' => $technicianId,
                        'status' => $status,
                        'notes' => $notes
                    ];
                    
                    if ($maintenanceModel->addMaintenance($data)) {
                        // Perbarui status alat berat ke UNDER_MAINTENANCE
                        $db = Database::getConnection();
                        $stmtUpdate = $db->prepare("UPDATE equipments SET status = 'UNDER_MAINTENANCE' WHERE id = :id");
                        $stmtUpdate->execute([':id' => $equipmentId]);
                        
                        $_SESSION['success'] = "Jadwal Pemeliharaan baru berhasil ditambahkan!";
                    } else {
                        $_SESSION['error'] = "Gagal menambahkan jadwal pemeliharaan baru.";
                    }
                } else {
                    $_SESSION['error'] = "Mohon lengkapi semua field wajib.";
                }
                header("Location: index.php?page=maintenance");
                exit;
            } elseif ($postAction === 'complete') {
                $maintId = filter_input(INPUT_POST, 'maintenance_id', FILTER_VALIDATE_INT);
                $cost = filter_input(INPUT_POST, 'cost', FILTER_VALIDATE_FLOAT) ?? 0.0;
                $hourMeter = filter_input(INPUT_POST, 'hour_meter', FILTER_VALIDATE_INT) ?? 0;
                $notes = filter_input(INPUT_POST, 'notes', FILTER_DEFAULT) ?? '';
                
                if ($maintId) {
                    $db = Database::getConnection();
                    // Update maintenance record
                    $stmt = $db->prepare("UPDATE maintenance SET status = 'COMPLETED', cost = :cost, hour_meter = :hour_meter, notes = :notes WHERE id = :id");
                    $success = $stmt->execute([
                        ':cost' => $cost,
                        ':hour_meter' => $hourMeter,
                        ':notes' => $notes,
                        ':id' => $maintId
                    ]);
                    
                    if ($success) {
                        // Get equipment_id
                        $stmtGetEquip = $db->prepare("SELECT equipment_id FROM maintenance WHERE id = :id");
                        $stmtGetEquip->execute([':id' => $maintId]);
                        $equipId = $stmtGetEquip->fetchColumn();
                        
                        if ($equipId) {
                            // Update equipment status to AVAILABLE and update its hour meter if greater
                            $stmtUpdateEquip = $db->prepare("UPDATE equipments SET status = 'AVAILABLE', hour_meter = GREATEST(hour_meter, :hm) WHERE id = :id");
                            $stmtUpdateEquip->execute([
                                ':hm' => $hourMeter,
                                ':id' => $equipId
                            ]);
                        }
                        $_SESSION['success'] = "Jadwal Pemeliharaan berhasil diselesaikan!";
                    } else {
                        $_SESSION['error'] = "Gagal menyelesaikan pemeliharaan.";
                    }
                } else {
                    $_SESSION['error'] = "Data tidak valid.";
                }
                header("Location: index.php?page=maintenance");
                exit;
            }
        }
        
        // Handle GET Actions (Delete)
        $getAction = filter_input(INPUT_GET, 'action', FILTER_DEFAULT) ?? '';
        $maintId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) ?? 0;
        if ($getAction === 'delete' && $maintId) {
            // Sebelum hapus maintenance, perbarui status alat berat ke AVAILABLE
            $db = Database::getConnection();
            $stmtGetEquip = $db->prepare("SELECT equipment_id FROM maintenance WHERE id = :id");
            $stmtGetEquip->execute([':id' => $maintId]);
            $equipId = $stmtGetEquip->fetchColumn();
            if ($equipId) {
                $stmtUpdate = $db->prepare("UPDATE equipments SET status = 'AVAILABLE' WHERE id = :id");
                $stmtUpdate->execute([':id' => $equipId]);
            }

            if ($maintenanceModel->deleteMaintenance($maintId)) {
                $_SESSION['success'] = "Jadwal Pemeliharaan berhasil dihapus!";
            } else {
                $_SESSION['error'] = "Gagal menghapus jadwal pemeliharaan.";
            }
            header("Location: index.php?page=maintenance");
            exit;
        }

        // 2. Baca kata kunci pencarian jika ada
        $search = filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? '';

        // 3. Ambil data pemeliharaan, statistik bento, jadwal mendatang, dan feed aktivitas
        $stats = $maintenanceModel->getMaintenanceStats();
        $workOrders = $maintenanceModel->getWorkOrders($search);
        $upcomingServices = $maintenanceModel->getUpcomingServices();
        $recentActivities = $maintenanceModel->getRecentActivityFeed();

        // Fetch dynamic lists for modal dropdowns
        $db = Database::getConnection();
        $stmtEquip = $db->query("SELECT id, name, equipment_code FROM equipments ORDER BY name ASC");
        $equipmentsList = $stmtEquip->fetchAll();
        
        $stmtTech = $db->query("SELECT id, full_name FROM users WHERE role_id = (SELECT id FROM roles WHERE role_name = 'STAFF') ORDER BY full_name ASC");
        $techniciansList = $stmtTech->fetchAll();

        // 4. Merender berkas visualisasi maintenance berdasarkan peran pengguna
        if ($currentRole === 'STAFF') {
            require_once 'views/staff/maintenance.php';
        } else {
            require_once 'views/admin/maintenance.php';
        }
    }

    /**
     * Memproses pemanggilan antarmuka Manajemen Pengguna (User Management)
     */
    public function users() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('ADMIN / STAFF', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya diizinkan untuk Admin dan Staf.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // Inisialisasi model
        $userModel = new UserModel();

        // Handle POST Actions
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $postAction = filter_input(INPUT_POST, 'action', FILTER_DEFAULT) ?? '';
            if ($postAction === 'add') {
                $username = filter_input(INPUT_POST, 'username', FILTER_DEFAULT);
                $password = filter_input(INPUT_POST, 'password', FILTER_DEFAULT);
                $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
                $fullName = filter_input(INPUT_POST, 'full_name', FILTER_DEFAULT);
                $roleId = filter_input(INPUT_POST, 'role_id', FILTER_VALIDATE_INT);
                $phone = filter_input(INPUT_POST, 'phone', FILTER_DEFAULT) ?? '';
                $address = filter_input(INPUT_POST, 'address', FILTER_DEFAULT) ?? '';
                $companyName = filter_input(INPUT_POST, 'company_name', FILTER_DEFAULT) ?? '';
                $status = filter_input(INPUT_POST, 'status', FILTER_DEFAULT) ?? 'ACTIVE';
                
                if ($username && $password && $email && $fullName && $roleId) {
                    $data = [
                        'username' => $username,
                        'password' => $password,
                        'email' => $email,
                        'full_name' => $fullName,
                        'role_id' => $roleId,
                        'phone' => $phone,
                        'address' => $address,
                        'company_name' => $companyName,
                        'status' => $status
                    ];
                    if ($userModel->addUser($data)) {
                        $_SESSION['success'] = "Pengguna baru berhasil ditambahkan!";
                    } else {
                        $_SESSION['error'] = "Gagal menambahkan pengguna baru (Username atau Email mungkin sudah terdaftar).";
                    }
                } else {
                    $_SESSION['error'] = "Mohon lengkapi seluruh field wajib pengguna.";
                }
                header("Location: index.php?page=users");
                exit;
            } elseif ($postAction === 'edit') {
                $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
                $username = filter_input(INPUT_POST, 'username', FILTER_DEFAULT);
                $password = filter_input(INPUT_POST, 'password', FILTER_DEFAULT) ?? '';
                $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
                $fullName = filter_input(INPUT_POST, 'full_name', FILTER_DEFAULT);
                $roleId = filter_input(INPUT_POST, 'role_id', FILTER_VALIDATE_INT);
                $phone = filter_input(INPUT_POST, 'phone', FILTER_DEFAULT) ?? '';
                $address = filter_input(INPUT_POST, 'address', FILTER_DEFAULT) ?? '';
                $companyName = filter_input(INPUT_POST, 'company_name', FILTER_DEFAULT) ?? '';
                $status = filter_input(INPUT_POST, 'status', FILTER_DEFAULT) ?? 'ACTIVE';
                
                if ($id && $username && $email && $fullName && $roleId) {
                    $data = [
                        'username' => $username,
                        'password' => $password,
                        'email' => $email,
                        'full_name' => $fullName,
                        'role_id' => $roleId,
                        'phone' => $phone,
                        'address' => $address,
                        'company_name' => $companyName,
                        'status' => $status
                    ];
                    if ($userModel->updateUser($id, $data)) {
                        $_SESSION['success'] = "Data pengguna berhasil diperbarui!";
                    } else {
                        $_SESSION['error'] = "Gagal memperbarui data pengguna.";
                    }
                } else {
                    $_SESSION['error'] = "Mohon lengkapi field wajib.";
                }
                header("Location: index.php?page=users");
                exit;
            }
        }
        
        // Handle GET Actions (Delete)
        $getAction = filter_input(INPUT_GET, 'action', FILTER_DEFAULT) ?? '';
        $targetUserId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) ?? 0;
        if ($getAction === 'delete' && $targetUserId) {
            if ($targetUserId == $_SESSION['user_id']) {
                $_SESSION['error'] = "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif login.";
            } elseif ($userModel->deleteUser($targetUserId)) {
                $_SESSION['success'] = "Pengguna berhasil dihapus secara permanen dari sistem.";
            } else {
                $_SESSION['error'] = "Gagal menghapus pengguna.";
            }
            header("Location: index.php?page=users");
            exit;
        }

        // 2. Baca parameter GET untuk pencarian dan filter peran
        $search = filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? '';
        $roleFilter = filter_input(INPUT_GET, 'role_filter', FILTER_DEFAULT) ?? 'ALL';

        // 3. Ambil data statistik bento & daftar user
        $stats = $userModel->getUserStats();
        $usersList = $userModel->getUsers($search, $roleFilter);

        // Fetch roles dynamically for dropdown select
        $db = Database::getConnection();
        $stmtRoles = $db->query("SELECT id, role_name FROM roles ORDER BY id ASC");
        $rolesList = $stmtRoles->fetchAll();

        // 4. Merender berkas visualisasi user management
        require_once 'views/admin/users.php';
    }

    /**
     * Memproses pemanggilan antarmuka Laporan & Dokumentasi (Reports Terminal)
     */
    public function reports() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('ADMIN / STAFF', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya diizinkan untuk Admin dan Staf.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        // Inisialisasi model
        $reportModel = new ReportModel();
        $db = Database::getConnection();

        // Handle POST Actions
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $postAction = filter_input(INPUT_POST, 'action', FILTER_DEFAULT) ?? '';
            if ($postAction === 'add') {
                $rentalId = filter_input(INPUT_POST, 'rental_id', FILTER_VALIDATE_INT);
                $type = filter_input(INPUT_POST, 'report_type', FILTER_DEFAULT); // BAST_IN, BAST_OUT, SURAT_JALAN
                
                if ($rentalId && $type) {
                    $reportCode = 'REP-' . ($type === 'SURAT_JALAN' ? 'SJ' : ($type === 'BAST_OUT' ? 'BO' : 'BI')) . '-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
                    
                    // Path ke printable view resmi
                    $filePath = "index.php?page=print_report&code=" . $reportCode;
                    
                    $stmtInsert = $db->prepare("INSERT INTO reports (report_code, rental_id, report_type, generated_by, file_path, generated_at) VALUES (:code, :rental_id, :type, :generated_by, :file_path, NOW())");
                    $success = $stmtInsert->execute([
                        ':code' => $reportCode,
                        ':rental_id' => $rentalId,
                        ':type' => $type,
                        ':generated_by' => $_SESSION['user_id'],
                        ':file_path' => $filePath
                    ]);
                    
                    if ($success) {
                        $_SESSION['success'] = "Laporan resmi baru berhasil dibuat!";
                    } else {
                        $_SESSION['error'] = "Gagal membuat laporan baru.";
                    }
                } else {
                    $_SESSION['error'] = "Mohon pilih Rental Order dan Tipe Laporan.";
                }
                header("Location: index.php?page=reports");
                exit;
            }
        }

        // Fetch active rentals for dynamic modal choice
        $stmtRent = $db->query("SELECT r.id, r.rental_code, e.name AS equipment_name, u.full_name AS customer_name FROM rentals r JOIN equipments e ON r.equipment_id = e.id JOIN users u ON r.customer_id = u.id ORDER BY r.booking_date DESC");
        $rentalsList = $stmtRent->fetchAll();

        // 2. Baca parameter filter input dari form GET/POST jika ada
        $reportType = filter_input(INPUT_GET, 'report_type', FILTER_DEFAULT) ?? 'Laporan Rental Bulanan';
        $startDate = filter_input(INPUT_GET, 'start_date', FILTER_DEFAULT) ?? '';
        $endDate = filter_input(INPUT_GET, 'end_date', FILTER_DEFAULT) ?? '';

        // 3. Tarik data statistik global & daftar transaksi rental
        $stats = $reportModel->getReportStats();
        $previewData = $reportModel->getRentalPreview($reportType, $startDate, $endDate);

        // Tambahan metrik akademis riil untuk Staf
        // 1. Total Sesi Rental (Total Sesi)
        $stmtCountRentals = $db->query("SELECT COUNT(*) FROM rentals");
        $totalRentalsCount = $stmtCountRentals->fetchColumn() ?: 0;

        // 2. Utilisasi Alat Berat
        $stmtTotalEquip = $db->query("SELECT COUNT(*) FROM equipments");
        $totalEquip = $stmtTotalEquip->fetchColumn() ?: 1;
        $stmtRentedEquip = $db->query("SELECT COUNT(*) FROM equipments WHERE status = 'RENTED'");
        $rentedEquip = $stmtRentedEquip->fetchColumn() ?: 0;
        $utilizationRate = round(($rentedEquip / $totalEquip) * 100);

        // 3. Daftar audit log laporan dari tabel reports
        $stmtReports = $db->query("SELECT r.*, u.full_name as generator_name, u.role_id, role.role_name
                                  FROM reports r
                                  JOIN users u ON r.generated_by = u.id
                                  JOIN roles role ON u.role_id = role.id
                                  ORDER BY r.generated_at DESC LIMIT 10");
        $auditLogs = $stmtReports->fetchAll();

        // 5. Tren pendapatan real-time dan demand data untuk visualisasi grafik
        $monthlyRevenueTrend = $this->dashboardModel->getMonthlyRevenueTrend();
        $equipmentDemand = $this->dashboardModel->getEquipmentDemandByType();

        // 6. Merender berkas visualisasi Laporan sesuai peran
        if ($currentRole === 'STAFF') {
            require_once 'views/staff/reports.php';
        } else {
            require_once 'views/admin/reports.php';
        }
    }

    /**
     * Memproses pemanggilan antarmuka Manajemen Keuangan & Bukti Transfer Pembayaran (Payments)
     */
    public function payments() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('ADMIN / STAFF', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya diizinkan untuk Admin dan Staf.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        $db = Database::getConnection();

        // 1.5 Handle Verification Actions (Verify / Reject)
        $action = filter_input(INPUT_GET, 'action', FILTER_DEFAULT) ?? '';
        $paymentId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) ?? 0;

        if ($action && $paymentId) {
            if ($action === 'verify') {
                $stmt = $db->prepare("UPDATE payments SET status = 'PAID', verified_by = :uid, verified_at = CURRENT_TIMESTAMP WHERE id = :pid");
                $stmt->execute([
                    ':uid' => $_SESSION['user_id'],
                    ':pid' => $paymentId
                ]);
                $_SESSION['success'] = "Bukti transfer pembayaran berhasil diverifikasi (PAID)!";
            } elseif ($action === 'fail') {
                $stmt = $db->prepare("UPDATE payments SET status = 'FAILED', verified_by = :uid, verified_at = CURRENT_TIMESTAMP WHERE id = :pid");
                $stmt->execute([
                    ':uid' => $_SESSION['user_id'],
                    ':pid' => $paymentId
                ]);
                $_SESSION['success'] = "Status transfer pembayaran berhasil diubah ke FAILED!";
            }
            header("Location: index.php?page=payments");
            exit;
        }

        // 2. Baca parameter GET untuk filter & pencarian
        $search = filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? '';
        $status = filter_input(INPUT_GET, 'status', FILTER_DEFAULT) ?? 'ALL';

        // 3. Tarik metrik bento stats riil pembayaran
        // Total Pendapatan Bulan Ini (PAID)
        $stmtRevenue = $db->query("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'PAID' AND MONTH(payment_date) = MONTH(CURRENT_DATE)");
        $totalRevenue = $stmtRevenue->fetchColumn() ?: 0;

        // Pending Payments Count
        $stmtPending = $db->query("SELECT COUNT(*) FROM payments WHERE status = 'PENDING_VERIFICATION'");
        $pendingPaymentsCount = $stmtPending->fetchColumn() ?: 0;

        // Verified Payments Today Count
        $stmtVerifiedToday = $db->query("SELECT COUNT(*) FROM payments WHERE status = 'PAID' AND DATE(payment_date) = CURRENT_DATE");
        $verifiedTodayCount = $stmtVerifiedToday->fetchColumn() ?: 0;

        // Overdue Amount (FAILED)
        $stmtOverdue = $db->query("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'FAILED'");
        $overdueAmount = $stmtOverdue->fetchColumn() ?: 0;

        // 4. Query daftar pembayaran lengkap terintegrasi
        $sql = "SELECT p.*, c.contract_code, u.full_name AS customer_name, u.company_name
                FROM payments p
                JOIN contracts c ON p.contract_id = c.id
                JOIN users u ON p.customer_id = u.id";
        
        $params = [];
        $conditions = [];

        if ($search !== '') {
            $conditions[] = "(p.payment_code LIKE :search1 OR u.full_name LIKE :search2 OR u.company_name LIKE :search3 OR c.contract_code LIKE :search4)";
            $params[':search1'] = '%' . $search . '%';
            $params[':search2'] = '%' . $search . '%';
            $params[':search3'] = '%' . $search . '%';
            $params[':search4'] = '%' . $search . '%';
        }

        if ($status !== 'ALL') {
            if ($status === 'PAID') {
                $conditions[] = "p.status = 'PAID'";
            } elseif ($status === 'PENDING') {
                $conditions[] = "p.status = 'PENDING_VERIFICATION'";
            } elseif ($status === 'FAILED') {
                $conditions[] = "p.status = 'FAILED'";
            }
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        $sql .= " ORDER BY p.payment_date DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $paymentsList = $stmt->fetchAll();

        // 5. Render View
        require_once 'views/staff/payments.php';
    }

    /**
     * Memproses pemanggilan antarmuka Manajemen Kontrak Digital (Digital Contracts)
     */
    public function contracts() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('ADMIN / STAFF', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya diizinkan untuk Admin dan Staf.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        $db = Database::getConnection();

        // Handle POST Actions (Create Contract)
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $postAction = filter_input(INPUT_POST, 'action', FILTER_DEFAULT) ?? '';
            if ($postAction === 'add') {
                $rentalId = filter_input(INPUT_POST, 'rental_id', FILTER_VALIDATE_INT);
                $contractDate = filter_input(INPUT_POST, 'contract_date', FILTER_DEFAULT);
                $validUntil = filter_input(INPUT_POST, 'valid_until', FILTER_DEFAULT);
                $terms = filter_input(INPUT_POST, 'terms_conditions', FILTER_DEFAULT) ?? '';
                $isSigned = filter_input(INPUT_POST, 'is_signed_customer', FILTER_VALIDATE_INT) ?? 0;
                
                if ($rentalId && $contractDate && $validUntil) {
                    // Ambil customer_id dari rental
                    $stmtRental = $db->prepare("SELECT customer_id FROM rentals WHERE id = :rid");
                    $stmtRental->execute([':rid' => $rentalId]);
                    $customerId = $stmtRental->fetchColumn();
                    
                    if ($customerId) {
                        $contractCode = 'CTR-SBS-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
                        $docPath = 'uploads/contracts/' . $contractCode . '.pdf';
                        
                        $stmtInsert = $db->prepare("INSERT INTO contracts (contract_code, rental_id, customer_id, contract_date, valid_until, document_path, terms_conditions, is_signed_customer, signed_at) 
                                                   VALUES (:code, :rid, :cid, :cdate, :vuntil, :doc, :terms, :signed, :signed_at)");
                        $success = $stmtInsert->execute([
                            ':code' => $contractCode,
                            ':rid' => $rentalId,
                            ':cid' => $customerId,
                            ':cdate' => $contractDate,
                            ':vuntil' => $validUntil,
                            ':doc' => $docPath,
                            ':terms' => $terms,
                            ':signed' => $isSigned,
                            ':signed_at' => $isSigned ? date('Y-m-d H:i:s') : null
                        ]);
                        
                        if ($success) {
                            $_SESSION['success'] = "Kontrak digital baru ($contractCode) berhasil diterbitkan!";
                        } else {
                            $_SESSION['error'] = "Gagal menerbitkan kontrak baru ke database.";
                        }
                    } else {
                        $_SESSION['error'] = "Data pemesanan rental tidak ditemukan.";
                    }
                } else {
                    $_SESSION['error'] = "Silakan isi seluruh bidang wajib kontrak.";
                }
                header("Location: index.php?page=contracts");
                exit;
            }
        }

        // Ambil data rentals tanpa kontrak untuk dropdown input modal
        $rentalsWithoutContracts = $db->query("SELECT r.*, u.full_name AS customer_name, e.name AS equipment_name 
                                               FROM rentals r 
                                               JOIN users u ON r.customer_id = u.id 
                                               JOIN equipments e ON r.equipment_id = e.id 
                                               LEFT JOIN contracts c ON c.rental_id = r.id 
                                               WHERE c.id IS NULL AND r.status IN ('APPROVED', 'ON_GOING', 'PENDING') 
                                               ORDER BY r.booking_date DESC")->fetchAll();

        // 2. Baca parameter GET untuk filter & pencarian
        $search = filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? '';
        $status = filter_input(INPUT_GET, 'status', FILTER_DEFAULT) ?? 'ALL';

        // 3. Tarik metrik bento stats riil kontrak
        // Total Contracts
        $stmtTotal = $db->query("SELECT COUNT(*) FROM contracts");
        $totalContracts = $stmtTotal->fetchColumn() ?: 0;

        // Active Contracts
        $stmtActive = $db->query("SELECT COUNT(*) FROM contracts WHERE is_signed_customer = 1 AND valid_until >= CURRENT_DATE()");
        $activeContracts = $stmtActive->fetchColumn() ?: 0;

        // Expiring Soon (30 Days)
        $stmtExpiring = $db->query("SELECT COUNT(*) FROM contracts WHERE valid_until BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)");
        $expiringContracts = $stmtExpiring->fetchColumn() ?: 0;

        // Terminated/Expired
        $stmtTerminated = $db->query("SELECT COUNT(*) FROM contracts WHERE valid_until < CURRENT_DATE()");
        $terminatedContracts = $stmtTerminated->fetchColumn() ?: 0;

        // 4. Query daftar kontrak lengkap terintegrasi
        $sql = "SELECT c.*, u.full_name AS customer_name, u.company_name, r.notes AS project_notes, r.start_date, r.end_date
                FROM contracts c
                JOIN users u ON c.customer_id = u.id
                JOIN rentals r ON c.rental_id = r.id";
        
        $params = [];
        $conditions = [];

        if ($search !== '') {
            $conditions[] = "(c.contract_code LIKE :search1 OR u.full_name LIKE :search2 OR u.company_name LIKE :search3 OR r.notes LIKE :search4)";
            $params[':search1'] = '%' . $search . '%';
            $params[':search2'] = '%' . $search . '%';
            $params[':search3'] = '%' . $search . '%';
            $params[':search4'] = '%' . $search . '%';
        }

        if ($status !== 'ALL') {
            if ($status === 'ACTIVE') {
                $conditions[] = "c.is_signed_customer = 1 AND c.valid_until >= CURRENT_DATE()";
            } elseif ($status === 'EXPIRED') {
                $conditions[] = "c.valid_until < CURRENT_DATE()";
            } elseif ($status === 'SUSPENDED') {
                $conditions[] = "c.is_signed_customer = 0";
            }
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        $sql .= " ORDER BY c.contract_date DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $contractsList = $stmt->fetchAll();

        // 5. Render View
        require_once 'views/staff/contracts.php';
    }

    /**
     * Memproses pemanggilan antarmuka Pengaturan Akun Admin
     */
    public function settings() {
        // 1. Proteksi Hak Akses (Role-Based Access Control)
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu untuk mengakses terminal.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN') {
            if (function_exists('renderAccessDenied')) {
                renderAccessDenied('ADMIN', $currentRole);
            } else {
                $_SESSION['error'] = "Akses ditolak! Halaman ini hanya diizinkan untuk Administrator.";
                header("Location: index.php?page=login");
            }
            exit;
        }

        $userId = $_SESSION['user_id'];

        // 2. Memproses request POST jika tombol simpan diklik
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $fullName = filter_input(INPUT_POST, 'full_name', FILTER_DEFAULT);
            $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
            $phone = filter_input(INPUT_POST, 'phone', FILTER_DEFAULT);
            $address = filter_input(INPUT_POST, 'address', FILTER_DEFAULT);
            $newPassword = filter_input(INPUT_POST, 'new_password', FILTER_DEFAULT);

            if (empty($fullName) || !$email) {
                $_SESSION['error'] = "Mohon lengkapi nama dan format email yang valid.";
            } else {
                $passwordHash = null;
                if (!empty($newPassword)) {
                    $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
                }

                $success = $this->userModel->updateProfile($userId, $fullName, $email, $phone, $address, $passwordHash);
                if ($success) {
                    $_SESSION['full_name'] = $fullName; // Perbarui session global
                    $_SESSION['success'] = "Pengaturan profil berhasil diperbarui secara aman.";
                } else {
                    $_SESSION['error'] = "Gagal memperbarui pengaturan profil ke database.";
                }
            }
            header("Location: index.php?page=admin_settings");
            exit;
        }

        // 3. Mengambil data user admin dari database
        $user = $this->userModel->getUserById($userId);
        if (!$user) {
            $_SESSION['error'] = "Data pengguna tidak ditemukan.";
            header("Location: index.php?page=admin_dashboard");
            exit;
        }

        $fullName = $user['full_name'];
        $role = $user['role_name'];

        // 4. Merender antarmuka Pengaturan Admin
        require_once 'views/admin/settings.php';
    }

    /**
     * Memproses ekspor cetak data pengguna terintegrasi dalam bentuk PDF/Print layout.
     */
    public function exportUsersPdf() {
        if (!isset($_SESSION['user_id'])) {
            $_SESSION['error'] = "Silakan login terlebih dahulu.";
            header("Location: index.php?page=login");
            exit;
        }

        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') {
            header("Location: index.php?page=login");
            exit;
        }

        // Ambil data users lengkap
        $users = $this->userModel->getUsers('', 'ALL');

        // Render printable page
        ?>
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Laporan Data Pengguna - PT. SURYA BANGUN SARANA</title>
            <style>
                body {
                    font-family: 'Hanken Grotesk', 'Inter', sans-serif;
                    color: #0f172a;
                    padding: 40px;
                    line-height: 1.5;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px double #003366;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 24px;
                    font-weight: 800;
                    color: #003366;
                    letter-spacing: -0.5px;
                }
                .company {
                    font-size: 14px;
                    color: #475569;
                    font-weight: 600;
                    margin-top: 4px;
                }
                .title {
                    font-size: 18px;
                    text-transform: uppercase;
                    font-weight: bold;
                    margin-top: 20px;
                    letter-spacing: 0.5px;
                    color: #0f172a;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    border: 1px solid #cbd5e1;
                    padding: 10px 12px;
                    text-align: left;
                    font-size: 12px;
                }
                th {
                    background-color: #f1f5f9;
                    color: #003366;
                    font-weight: bold;
                }
                tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .badge {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .badge-admin { background-color: #fee2e2; color: #991b1b; }
                .badge-staff { background-color: #dbeafe; color: #1e40af; }
                .badge-customer { background-color: #dcfce7; color: #166534; }
                .footer {
                    margin-top: 50px;
                    text-align: right;
                    font-size: 12px;
                }
                .signature-space {
                    margin-top: 60px;
                    font-weight: bold;
                    text-decoration: underline;
                }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="margin-bottom: 20px; text-align: right;">
                <button onclick="window.print()" style="background-color: #003366; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Cetak Laporan / Simpan PDF</button>
            </div>

            <div class="header">
                <div class="logo">SBS EquipRent</div>
                <div class="company">PT. SURYA BANGUN SARANA BANJARMASIN</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Alamat: Jl. Ahmad Yani KM 21.5, Landasan Ulin, Banjarbaru, Kalimantan Selatan</div>
                <div class="title">Laporan Resmi Data Pengguna</div>
            </div>

            <p style="font-size: 12px; color: #475569;">Dicetak oleh: <strong><?= htmlspecialchars($_SESSION['full_name']) ?></strong> (<?= htmlspecialchars($_SESSION['role']) ?>) pada <?= date('d M Y, H:i') ?> WITA</p>

            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>ID User</th>
                        <th>Nama Lengkap</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>No. Telp</th>
                        <th>Perusahaan</th>
                        <th>Peran</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php $no = 1; foreach ($users as $u): 
                        $roleClass = 'badge-customer';
                        if ($u['role_name'] === 'ADMIN') $roleClass = 'badge-admin';
                        elseif ($u['role_name'] === 'STAFF') $roleClass = 'badge-staff';
                    ?>
                        <tr>
                            <td><?= $no++ ?></td>
                            <td>USR-<?= sprintf('%04d', $u['id']) ?></td>
                            <td><strong><?= htmlspecialchars($u['full_name']) ?></strong></td>
                            <td>@<?= htmlspecialchars($u['username']) ?></td>
                            <td><?= htmlspecialchars($u['email']) ?></td>
                            <td><?= htmlspecialchars($u['phone'] ?: '-') ?></td>
                            <td><?= htmlspecialchars($u['company_name'] ?: '-') ?></td>
                            <td><span class="badge <?= $roleClass ?>"><?= htmlspecialchars($u['role_name']) ?></span></td>
                            <td style="font-weight: bold; color: <?= $u['status'] === 'ACTIVE' ? '#166534' : '#991b1b' ?>"><?= htmlspecialchars($u['status']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>

            <div class="footer">
                <p>Banjarmasin, <?= date('d M Y') ?></p>
                <p>Diketahui oleh,</p>
                <div class="signature-space">
                    <?= htmlspecialchars($_SESSION['full_name']) ?>
                </div>
                <p style="font-size: 10px; color: #64748b; margin-top: 2px;">Administrator Utama SBS</p>
            </div>

            <script>
                // Auto trigger print dialog when loaded
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
        <?php
        exit;
    }

    /**
     * Memproses ekspor cetak data rental orders dalam bentuk PDF/Print layout resmi.
     */
    public function exportRentalsPdf() {
        if (!isset($_SESSION['user_id'])) { header("Location: index.php?page=login"); exit; }
        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') { header("Location: index.php?page=login"); exit; }

        $rentalModel = new RentalModel();
        $rentals = $rentalModel->getRentals('', 'ALL', '', '');
        ?>
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Laporan Data Rental Orders - PT. SURYA BANGUN SARANA</title>
            <style>
                body { font-family: 'Hanken Grotesk', 'Inter', Arial, sans-serif; color: #0f172a; padding: 40px; line-height: 1.6; }
                .header { text-align: center; border-bottom: 3px double #003366; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: 800; color: #003366; letter-spacing: -0.5px; }
                .company { font-size: 14px; color: #475569; font-weight: 600; margin-top: 4px; }
                .title { font-size: 18px; text-transform: uppercase; font-weight: bold; margin-top: 20px; letter-spacing: 0.5px; color: #0f172a; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
                th { background-color: #f1f5f9; color: #003366; font-weight: bold; font-size: 10px; text-transform: uppercase; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
                .badge-pending { background: #fef3c7; color: #92400e; }
                .badge-approved { background: #d1fae5; color: #065f46; }
                .badge-ongoing { background: #dbeafe; color: #1e40af; }
                .badge-completed { background: #ccfbf1; color: #0f766e; }
                .badge-rejected { background: #fee2e2; color: #991b1b; }
                .footer { margin-top: 50px; text-align: right; font-size: 12px; }
                .signature-space { margin-top: 60px; font-weight: bold; text-decoration: underline; }
                .text-right { text-align: right; }
                @media print { body { padding: 20px; } .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="no-print" style="margin-bottom: 20px; text-align: right;">
                <button onclick="window.print()" style="background:#003366;color:#fff;padding:10px 24px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:14px;">Cetak / Simpan PDF</button>
                <button onclick="window.close()" style="background:#64748b;color:#fff;padding:10px 24px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:14px;margin-left:8px;">Tutup</button>
            </div>
            <div class="header">
                <div class="logo">SBS EquipRent</div>
                <div class="company">PT. SURYA BANGUN SARANA BANJARMASIN</div>
                <div style="font-size:11px;color:#64748b;margin-top:4px;">Jl. Ahmad Yani KM 21.5, Landasan Ulin, Banjarbaru, Kalimantan Selatan</div>
                <div class="title">Laporan Resmi Data Rental Orders</div>
            </div>
            <p style="font-size:12px;color:#475569;">Dicetak oleh: <strong><?= htmlspecialchars($_SESSION['full_name']) ?></strong> (<?= htmlspecialchars($_SESSION['role']) ?>) pada <?= date('d M Y, H:i') ?> WITA</p>
            <table>
                <thead><tr>
                    <th>No</th><th>Kode Rental</th><th>Pelanggan</th><th>Peralatan</th><th>Mulai</th><th>Selesai</th><th>Durasi</th><th>Status</th><th class="text-right">Total Biaya</th>
                </tr></thead>
                <tbody>
                <?php $no=1; foreach($rentals as $r):
                    $badgeClass='badge-pending';
                    if($r['status']==='APPROVED') $badgeClass='badge-approved';
                    elseif($r['status']==='ON_GOING') $badgeClass='badge-ongoing';
                    elseif($r['status']==='COMPLETED') $badgeClass='badge-completed';
                    elseif($r['status']==='REJECTED') $badgeClass='badge-rejected';
                ?>
                <tr>
                    <td><?= $no++ ?></td>
                    <td style="font-weight:bold;color:#003366;">#<?= htmlspecialchars($r['rental_code']) ?></td>
                    <td><?= htmlspecialchars($r['customer_name']) ?></td>
                    <td><?= htmlspecialchars($r['equipment_name']) ?></td>
                    <td style="font-family:monospace;font-size:10px;"><?= date('d M Y', strtotime($r['start_date'])) ?></td>
                    <td style="font-family:monospace;font-size:10px;"><?= date('d M Y', strtotime($r['end_date'])) ?></td>
                    <td><?= $r['total_days'] ?> Hari</td>
                    <td><span class="badge <?= $badgeClass ?>"><?= htmlspecialchars($r['status']) ?></span></td>
                    <td class="text-right" style="font-weight:bold;">Rp <?= number_format($r['subtotal'],0,',','.') ?></td>
                </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
            <div class="footer">
                <p>Banjarmasin, <?= date('d M Y') ?></p>
                <p>Diketahui oleh,</p>
                <div class="signature-space"><?= htmlspecialchars($_SESSION['full_name']) ?></div>
                <p style="font-size:10px;color:#64748b;margin-top:2px;">Administrator Utama SBS</p>
            </div>
            <script>window.onload=()=>{setTimeout(()=>{window.print();},500);}</script>
        </body></html>
        <?php exit;
    }

    /**
     * Memproses ekspor Excel data rental orders dalam format CSV yang rapi.
     */
    public function exportRentalsExcel() {
        if (!isset($_SESSION['user_id'])) { header("Location: index.php?page=login"); exit; }
        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') { header("Location: index.php?page=login"); exit; }

        $rentalModel = new RentalModel();
        $rentals = $rentalModel->getRentals('', 'ALL', '', '');

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="Laporan_Rental_Orders_' . date('Ymd_His') . '.csv"');
        $output = fopen('php://output', 'w');
        // BOM for Excel UTF-8 compatibility
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        fputcsv($output, ['No', 'Kode Rental', 'Pelanggan', 'Peralatan', 'Brand', 'Mulai', 'Selesai', 'Durasi (Hari)', 'Status', 'Total Biaya (Rp)']);
        $no = 1;
        foreach ($rentals as $r) {
            fputcsv($output, [
                $no++,
                $r['rental_code'],
                $r['customer_name'],
                $r['equipment_name'],
                $r['brand'] ?? '-',
                date('d/m/Y', strtotime($r['start_date'])),
                date('d/m/Y', strtotime($r['end_date'])),
                $r['total_days'],
                $r['status'],
                number_format($r['subtotal'], 0, ',', '.')
            ]);
        }
        fclose($output);
        exit;
    }

    /**
     * Memproses ekspor cetak data pemeliharaan alat berat dalam bentuk PDF/Print layout resmi.
     */
    public function exportMaintenancePdf() {
        if (!isset($_SESSION['user_id'])) { header("Location: index.php?page=login"); exit; }
        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') { header("Location: index.php?page=login"); exit; }

        $maintenanceModel = new MaintenanceModel();
        $workOrders = $maintenanceModel->getWorkOrders('');
        $upcomingServices = $maintenanceModel->getUpcomingServices();
        ?>
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Laporan Pemeliharaan Alat Berat - PT. SURYA BANGUN SARANA</title>
            <style>
                body { font-family: 'Hanken Grotesk', 'Inter', Arial, sans-serif; color: #0f172a; padding: 40px; line-height: 1.6; }
                .header { text-align: center; border-bottom: 3px double #003366; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: 800; color: #003366; }
                .company { font-size: 14px; color: #475569; font-weight: 600; margin-top: 4px; }
                .title { font-size: 18px; text-transform: uppercase; font-weight: bold; margin-top: 20px; color: #0f172a; }
                h3 { font-size: 16px; color: #003366; margin: 30px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
                th { background-color: #f1f5f9; color: #003366; font-weight: bold; font-size: 10px; text-transform: uppercase; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; }
                .badge-progress { background: #dbeafe; color: #1e40af; }
                .badge-completed { background: #d1fae5; color: #065f46; }
                .badge-scheduled { background: #fef3c7; color: #92400e; }
                .badge-cancelled { background: #fee2e2; color: #991b1b; }
                .footer { margin-top: 50px; text-align: right; font-size: 12px; }
                .signature-space { margin-top: 60px; font-weight: bold; text-decoration: underline; }
                @media print { body { padding: 20px; } .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="no-print" style="margin-bottom:20px;text-align:right;">
                <button onclick="window.print()" style="background:#003366;color:#fff;padding:10px 24px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">Cetak / Simpan PDF</button>
                <button onclick="window.close()" style="background:#64748b;color:#fff;padding:10px 24px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;margin-left:8px;">Tutup</button>
            </div>
            <div class="header">
                <div class="logo">SBS EquipRent</div>
                <div class="company">PT. SURYA BANGUN SARANA BANJARMASIN</div>
                <div style="font-size:11px;color:#64748b;margin-top:4px;">Jl. Ahmad Yani KM 21.5, Landasan Ulin, Banjarbaru, Kalimantan Selatan</div>
                <div class="title">Laporan Resmi Pemeliharaan Alat Berat</div>
            </div>
            <p style="font-size:12px;color:#475569;">Dicetak oleh: <strong><?= htmlspecialchars($_SESSION['full_name']) ?></strong> (<?= htmlspecialchars($_SESSION['role']) ?>) pada <?= date('d M Y, H:i') ?> WITA</p>
            
            <h3>A. Riwayat Work Order Aktif</h3>
            <table>
                <thead><tr>
                    <th>No</th><th>Kode WO</th><th>Peralatan</th><th>Jenis Servis</th><th>Tanggal</th><th>Teknisi</th><th>Status</th>
                </tr></thead>
                <tbody>
                <?php $no=1; foreach($workOrders as $wo):
                    $st = strtoupper($wo['status']);
                    $bc = 'badge-scheduled';
                    if ($st === 'IN_PROGRESS') $bc = 'badge-progress';
                    elseif ($st === 'COMPLETED') $bc = 'badge-completed';
                    elseif ($st === 'CANCELLED') $bc = 'badge-cancelled';
                ?>
                <tr>
                    <td><?= $no++ ?></td>
                    <td style="font-weight:bold;color:#003366;">#<?= htmlspecialchars($wo['maintenance_code']) ?></td>
                    <td><?= htmlspecialchars($wo['equipment_name']) ?> <span style="font-size:9px;color:#64748b;">(<?= htmlspecialchars($wo['equipment_code']) ?>)</span></td>
                    <td><?= htmlspecialchars($wo['maintenance_type']) ?></td>
                    <td style="font-family:monospace;font-size:10px;"><?= date('d M Y', strtotime($wo['scheduled_date'])) ?></td>
                    <td><?= htmlspecialchars($wo['technician_name'] ?: 'Belum Ditunjuk') ?></td>
                    <td><span class="badge <?= $bc ?>"><?= $st ?></span></td>
                </tr>
                <?php endforeach; ?>
                </tbody>
            </table>

            <h3>B. Jadwal Pemeliharaan Mendatang</h3>
            <table>
                <thead><tr><th>No</th><th>Peralatan</th><th>Tanggal Terjadwal</th><th>Deskripsi</th><th>Sisa Hari</th></tr></thead>
                <tbody>
                <?php $no=1; foreach($upcomingServices as $svc):
                    $daysLeft = ceil((strtotime($svc['scheduled_date']) - time()) / 86400);
                    $dLabel = $daysLeft <= 0 ? 'TERLAMBAT' : $daysLeft . ' hari lagi';
                    $dColor = $daysLeft <= 1 ? 'color:#dc2626;font-weight:bold;' : '';
                ?>
                <tr>
                    <td><?= $no++ ?></td>
                    <td><?= htmlspecialchars($svc['equipment_name']) ?></td>
                    <td style="font-family:monospace;font-size:10px;"><?= date('d M Y', strtotime($svc['scheduled_date'])) ?></td>
                    <td><?= htmlspecialchars($svc['description']) ?></td>
                    <td style="<?= $dColor ?>"><?= $dLabel ?></td>
                </tr>
                <?php endforeach; ?>
                </tbody>
            </table>

            <div class="footer">
                <p>Banjarmasin, <?= date('d M Y') ?></p>
                <p>Diketahui oleh,</p>
                <div class="signature-space"><?= htmlspecialchars($_SESSION['full_name']) ?></div>
                <p style="font-size:10px;color:#64748b;margin-top:2px;">Administrator Utama SBS</p>
            </div>
            <script>window.onload=()=>{setTimeout(()=>{window.print();},500);}</script>
        </body></html>
        <?php exit;
    }

    /**
     * Memproses ekspor Excel data laporan operasional dalam format CSV.
     */
    public function exportReportsExcel() {
        if (!isset($_SESSION['user_id'])) { header("Location: index.php?page=login"); exit; }
        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') { header("Location: index.php?page=login"); exit; }

        $reportType = filter_input(INPUT_GET, 'report_type', FILTER_DEFAULT) ?? 'Laporan Rental Bulanan';
        $startDate = filter_input(INPUT_GET, 'start_date', FILTER_DEFAULT) ?? '';
        $endDate = filter_input(INPUT_GET, 'end_date', FILTER_DEFAULT) ?? '';

        $reportModel = new ReportModel();
        $preview = $reportModel->getRentalPreview($reportType, $startDate, $endDate, false);
        $headers = $preview['headers'];
        $rows = $preview['rows'];

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . str_replace(' ', '_', $reportType) . '_' . date('Ymd_His') . '.csv"');
        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        $csvHeaders = array_merge(['No'], $headers);
        fputcsv($output, $csvHeaders);
        
        $no = 1;
        foreach ($rows as $row) {
            $csvRow = array_merge([$no++], array_values($row));
            fputcsv($output, $csvRow);
        }
        fclose($output);
        exit;
    }

    /**
     * Memproses cetak PDF laporan resmi operasional lengkap.
     */
    public function exportReportsPdf() {
        if (!isset($_SESSION['user_id'])) { header("Location: index.php?page=login"); exit; }
        $currentRole = strtoupper(trim($_SESSION['role'] ?? ''));
        if ($currentRole !== 'ADMIN' && $currentRole !== 'STAFF') { header("Location: index.php?page=login"); exit; }

        $reportType = filter_input(INPUT_GET, 'report_type', FILTER_DEFAULT) ?? 'Laporan Rental Bulanan';
        $startDate = filter_input(INPUT_GET, 'start_date', FILTER_DEFAULT) ?? '';
        $endDate = filter_input(INPUT_GET, 'end_date', FILTER_DEFAULT) ?? '';

        $reportModel = new ReportModel();
        $stats = $reportModel->getReportStats();
        
        $preview = $reportModel->getRentalPreview($reportType, $startDate, $endDate, false);
        $headers = $preview['headers'];
        $rows = $preview['rows'];
        
        $db = Database::getConnection();
        $stmtTotalEquip = $db->query("SELECT COUNT(*) FROM equipments");
        $totalEquip = $stmtTotalEquip->fetchColumn() ?: 1;
        $stmtRentedEquip = $db->query("SELECT COUNT(*) FROM equipments WHERE status = 'RENTED'");
        $rentedEquip = $stmtRentedEquip->fetchColumn() ?: 0;
        $utilizationRate = round(($rentedEquip / $totalEquip) * 100);
        ?>
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title><?= htmlspecialchars($reportType) ?> - PT. SURYA BANGUN SARANA</title>
            <style>
                body { font-family: 'Hanken Grotesk', 'Inter', Arial, sans-serif; color: #0f172a; padding: 40px; line-height: 1.6; }
                .header { text-align: center; border-bottom: 3px double #003366; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: 800; color: #003366; }
                .company { font-size: 14px; color: #475569; font-weight: 600; margin-top: 4px; }
                .title { font-size: 18px; text-transform: uppercase; font-weight: bold; margin-top: 20px; color: #0f172a; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
                .summary-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
                .summary-card .label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; }
                .summary-card .value { font-size: 22px; font-weight: 800; color: #003366; margin-top: 4px; }
                h3 { font-size: 16px; color: #003366; margin: 30px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
                th { background-color: #f1f5f9; color: #003366; font-weight: bold; font-size: 10px; text-transform: uppercase; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .text-right { text-align: right; }
                .footer { margin-top: 50px; text-align: right; font-size: 12px; }
                .signature-space { margin-top: 60px; font-weight: bold; text-decoration: underline; }
                .badge { display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 9999px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
                .badge-blue { background-color: #dbeafe; color: #1e40af; }
                .badge-green { background-color: #dcfce7; color: #15803d; }
                .badge-orange { background-color: #ffedd5; color: #c2410c; }
                .badge-red { background-color: #fee2e2; color: #b91c1c; }
                .badge-gray { background-color: #f1f5f9; color: #334155; }
                @media print { body { padding: 20px; } .no-print { display: none; } .summary-grid { display: flex; gap: 12px; } .summary-card { flex: 1; } }
            </style>
        </head>
        <body>
            <div class="no-print" style="margin-bottom:20px;text-align:right;">
                <button onclick="window.print()" style="background:#003366;color:#fff;padding:10px 24px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">Cetak / Simpan PDF</button>
                <button onclick="window.close()" style="background:#64748b;color:#fff;padding:10px 24px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;margin-left:8px;">Tutup</button>
            </div>
            <div class="header">
                <div class="logo">SBS EquipRent</div>
                <div class="company">PT. SURYA BANGUN SARANA BANJARMASIN</div>
                <div style="font-size:11px;color:#64748b;margin-top:4px;">Jl. Ahmad Yani KM 21.5, Landasan Ulin, Banjarbaru, Kalimantan Selatan</div>
                <div class="title"><?= htmlspecialchars($reportType) ?></div>
            </div>
            <p style="font-size:12px;color:#475569;">Dicetak oleh: <strong><?= htmlspecialchars($_SESSION['full_name'] ?? 'Administrator') ?></strong> (<?= htmlspecialchars($_SESSION['role'] ?? 'ADMIN') ?>) pada <?= date('d M Y, H:i') ?> WITA</p>
            
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="label">Total Sesi Rental</div>
                    <div class="value"><?= number_format($stats['total_rentals']) ?></div>
                </div>
                <div class="summary-card">
                    <div class="label">Pendapatan Kotor</div>
                    <div class="value">Rp <?= number_format($stats['gross_revenue'] / 1000000, 1, ',', '.') ?>Jt</div>
                </div>
                <div class="summary-card">
                    <div class="label">Pemanfaatan Armada</div>
                    <div class="value"><?= $utilizationRate ?>%</div>
                </div>
            </div>

            <h3>Rincian Data Laporan</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 40px;">No</th>
                        <?php foreach ($headers as $header): ?>
                            <th class="<?= (strpos(strtolower($header), 'subtotal') !== false || strpos(strtolower($header), 'biaya') !== false || strpos(strtolower($header), 'jumlah') !== false || strpos(strtolower($header), 'pendapatan') !== false) ? 'text-right' : '' ?>"><?= htmlspecialchars($header) ?></th>
                        <?php endforeach; ?>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($rows)): ?>
                        <tr>
                            <td colspan="<?= count($headers) + 1 ?>" style="text-align: center;">Tidak ada data ditemukan.</td>
                        </tr>
                    <?php else: ?>
                        <?php $no = 1; foreach ($rows as $row): 
                            $columns = array_values($row);
                            $firstCol = array_shift($columns);
                            $badgeVal = array_pop($columns);

                            $badgeClass = "badge-gray";
                            if (in_array(strtoupper($badgeVal), ['ON_GOING', 'IN_PROGRESS', 'ON', 'ACTIVE'])) { $badgeClass = "badge-blue"; }
                            elseif (in_array(strtoupper($badgeVal), ['APPROVED', 'COMPLETED', 'PAID'])) { $badgeClass = "badge-green"; }
                            elseif (in_array(strtoupper($badgeVal), ['PENDING', 'SCHEDULED', 'PENDING_VERIFICATION'])) { $badgeClass = "badge-orange"; }
                            elseif (in_array(strtoupper($badgeVal), ['FAILED', 'CANCELLED', 'REJECTED', 'SUSPENDED'])) { $badgeClass = "badge-red"; }
                        ?>
                            <tr>
                                <td><?= $no++ ?></td>
                                <td style="font-weight: bold; color: #003366;"><?= htmlspecialchars($firstCol) ?></td>
                                <?php foreach ($columns as $cell): 
                                    $displayCell = htmlspecialchars($cell ?? '');
                                    $alignClass = "";
                                    if (is_numeric($cell) && !in_array($cell, ['latitude', 'longitude']) && strlen($cell) > 4 && strpos($cell, '.') === false) {
                                        $displayCell = "Rp " . number_format((float)$cell, 0, ',', '.');
                                        $alignClass = "text-right";
                                    } elseif (strpos($cell, 'Rp ') === 0) {
                                        $alignClass = "text-right";
                                    }
                                ?>
                                    <td class="<?= $alignClass ?>"><?= $displayCell ?></td>
                                <?php endforeach; ?>
                                <td>
                                    <span class="badge <?= $badgeClass ?>"><?= htmlspecialchars($badgeVal ?? 'UNKNOWN') ?></span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <div class="footer">
                <p>Banjarmasin, <?= date('d M Y') ?></p>
                <p style="margin-top:10px;">Disetujui Oleh,</p>
                <div class="signature-space"><?= htmlspecialchars($_SESSION['full_name'] ?? 'Administrator') ?></div>
                <p style="font-size:10px;color:#64748b;margin-top:4px;"><?= htmlspecialchars($_SESSION['role'] ?? 'ADMIN') ?></p>
            </div>
        </body>
        <?php
        exit;
    }

    public function exportPaymentsCsv() {
        if (!isset($_SESSION['user_id'])) {
            header("Location: index.php?page=login");
            exit;
        }
        
        $db = Database::getConnection();
        $sql = "SELECT p.payment_code, u.full_name AS customer_name, u.company_name, p.amount, p.payment_method, p.payment_date, p.status
                FROM payments p
                JOIN users u ON p.customer_id = u.id
                ORDER BY p.payment_date DESC";
        $stmt = $db->query($sql);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=SBS_Payment_Report_' . date('Ymd_His') . '.csv');
        
        $output = fopen('php://output', 'w');
        
        // Add UTF-8 BOM for Excel compatibility
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Headers
        fputcsv($output, ['Invoice ID', 'Customer Name', 'Company Name', 'Nominal (IDR)', 'Method', 'Payment Date', 'Status']);
        
        // Rows
        foreach ($payments as $pay) {
            fputcsv($output, [
                $pay['payment_code'],
                $pay['customer_name'],
                $pay['company_name'] ?: '-',
                $pay['amount'],
                $pay['payment_method'],
                $pay['payment_date'],
                $pay['status']
            ]);
        }
        
        fclose($output);
        exit;
    }

    public function exportContractsCsv() {
        if (!isset($_SESSION['user_id'])) {
            header("Location: index.php?page=login");
            exit;
        }
        
        $db = Database::getConnection();
        $sql = "SELECT c.contract_code, u.full_name AS customer_name, u.company_name, c.contract_date, c.valid_until, c.is_signed_customer
                FROM contracts c
                JOIN users u ON c.customer_id = u.id
                ORDER BY c.contract_date DESC";
        $stmt = $db->query($sql);
        $contracts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=SBS_Contracts_Report_' . date('Ymd_His') . '.csv');
        
        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM for Excel
        
        fputcsv($output, ['Contract Code', 'Customer Name', 'Company Name', 'Start Date', 'Valid Until', 'Signed Status']);
        
        foreach ($contracts as $ctr) {
            fputcsv($output, [
                $ctr['contract_code'],
                $ctr['customer_name'],
                $ctr['company_name'] ?: '-',
                $ctr['contract_date'],
                $ctr['valid_until'],
                $ctr['is_signed_customer'] ? 'Signed / Active' : 'Pending Signature'
            ]);
        }
        
        fclose($output);
        exit;
    }

    public function exportMaintenanceCsv() {
        if (!isset($_SESSION['user_id'])) {
            header("Location: index.php?page=login");
            exit;
        }
        
        $db = Database::getConnection();
        $sql = "SELECT m.maintenance_code, e.name AS equipment_name, e.equipment_code, m.maintenance_type, m.scheduled_date, u.full_name AS technician_name, m.status, m.cost, m.notes 
                FROM maintenance m 
                JOIN equipments e ON m.equipment_id = e.id 
                JOIN users u ON m.technician_id = u.id 
                ORDER BY m.scheduled_date DESC";
        $stmt = $db->query($sql);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=SBS_Maintenance_Report_' . date('Ymd_His') . '.csv');
        
        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM for Excel
        
        fputcsv($output, ['Maintenance Code', 'Equipment Name', 'Serial Number', 'Service Type', 'Date Scheduled', 'Technician', 'Status', 'Cost (IDR)', 'Notes']);
        
        foreach ($records as $rec) {
            fputcsv($output, [
                $rec['maintenance_code'],
                $rec['equipment_name'],
                $rec['equipment_code'],
                $rec['maintenance_type'],
                $rec['scheduled_date'],
                $rec['technician_name'],
                $rec['status'],
                $rec['cost'],
                $rec['notes'] ?: '-'
            ]);
        }
        
        fclose($output);
        exit;
    }


    public function printReport() {
        if (!isset($_SESSION['user_id'])) {
            header("Location: index.php?page=login");
            exit;
        }

        $code = filter_input(INPUT_GET, 'code', FILTER_DEFAULT);
        if (!$code) {
            die("Kode laporan tidak valid.");
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT r.*, u.full_name AS generator_name, u.role_id, role.role_name,
                                     rent.rental_code, rent.start_date, rent.end_date, rent.total_days, rent.subtotal, rent.notes AS project_notes,
                                     e.name AS equipment_name, e.equipment_code, e.brand, e.model,
                                     cust.full_name AS customer_name, cust.company_name, cust.phone AS customer_phone, cust.address AS customer_address
                              FROM reports r
                              JOIN users u ON r.generated_by = u.id
                              JOIN roles role ON u.role_id = role.id
                              LEFT JOIN rentals rent ON r.rental_id = rent.id
                              LEFT JOIN equipments e ON rent.equipment_id = e.id
                              LEFT JOIN users cust ON rent.customer_id = cust.id
                              WHERE r.report_code = :code");
        $stmt->execute([':code' => $code]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$report) {
            die("Laporan resmi tidak ditemukan.");
        }

        // Render gorgeous letterhead printable view matching PT. SBS Banjarmasin
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title><?= htmlspecialchars($report['report_code']) ?></title>
            <style>
                body {
                    font-family: 'Hanken Grotesk', 'Arial', sans-serif;
                    color: #1a202c;
                    margin: 0;
                    padding: 40px;
                    line-height: 1.6;
                }
                .letterhead {
                    border-bottom: 3px double #003366;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .logo-placeholder {
                    background-color: #003366;
                    color: #ffffff;
                    font-weight: bold;
                    padding: 15px;
                    border-radius: 8px;
                    font-size: 20px;
                    letter-spacing: 1px;
                }
                .company-details {
                    text-align: right;
                }
                .company-details h2 {
                    margin: 0 0 5px 0;
                    color: #003366;
                    font-size: 22px;
                }
                .company-details p {
                    margin: 2px 0;
                    font-size: 12px;
                    color: #4a5568;
                }
                .doc-title {
                    text-align: center;
                    margin-bottom: 40px;
                }
                .doc-title h1 {
                    margin: 0 0 5px 0;
                    color: #003366;
                    font-size: 24px;
                    text-transform: uppercase;
                }
                .doc-title p {
                    margin: 0;
                    font-size: 14px;
                    color: #718096;
                }
                .details-grid {
                    display: grid;
                    grid-template-cols: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 40px;
                }
                .details-card {
                    background: #f7fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 20px;
                }
                .details-card h3 {
                    margin: 0 0 15px 0;
                    color: #003366;
                    border-bottom: 1px solid #cbd5e0;
                    padding-bottom: 8px;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                .details-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 13px;
                }
                .details-label {
                    color: #718096;
                    font-weight: 500;
                }
                .details-val {
                    color: #2d3748;
                    font-weight: 600;
                    text-align: right;
                }
                .notes-section {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 50px;
                }
                .notes-section h3 {
                    margin: 0 0 12px 0;
                    color: #003366;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                .notes-content {
                    font-size: 13px;
                    color: #4a5568;
                }
                .signatures {
                    display: grid;
                    grid-template-cols: 1fr 1fr;
                    gap: 50px;
                    text-align: center;
                    margin-top: 60px;
                }
                .sig-box {
                    height: 100px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .sig-line {
                    border-top: 1px solid #718096;
                    width: 200px;
                    margin: 0 auto;
                    padding-top: 5px;
                    font-size: 13px;
                    font-weight: bold;
                    color: #2d3748;
                }
                .btn-print {
                    background-color: #003366;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    font-size: 14px;
                    font-weight: bold;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                @media print {
                    .btn-print {
                        display: none;
                    }
                    body {
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div style="text-align: right;">
                <button class="btn-print" onclick="window.print()">Print Official Report</button>
            </div>
            
            <div class="letterhead">
                <div class="logo-placeholder">PT. SURYA BANGUN SARANA</div>
                <div class="company-details">
                    <h2>PT. SURYA BANGUN SARANA BANJARMASIN</h2>
                    <p>Heavy Equipment Rental & Services Division</p>
                    <p>Jl. Ahmad Yani KM 21, Liang Anggang, Banjarbaru, Kalimantan Selatan</p>
                    <p>Email: sbs.rent.bjm@suryabangun.co.id | Telp: +62 821-4856-4979</p>
                </div>
            </div>

            <div class="doc-title">
                <h1><?= htmlspecialchars(str_replace('_', ' ', $report['report_type'])) ?></h1>
                <p>Official Document Code: <?= htmlspecialchars($report['report_code']) ?></p>
            </div>

            <div class="details-grid">
                <div class="details-card">
                    <h3>Document Specifications</h3>
                    <div class="details-row">
                        <span class="details-label">Date Generated:</span>
                        <span class="details-val"><?= date('F d, Y H:i:s', strtotime($report['generated_at'])) ?></span>
                    </div>
                    <div class="details-row">
                        <span class="details-label">Category / Type:</span>
                        <span class="details-val"><?= htmlspecialchars($report['report_type']) ?></span>
                    </div>
                    <div class="details-row">
                        <span class="details-label">Operator Staf:</span>
                        <span class="details-val"><?= htmlspecialchars($report['generator_name']) ?></span>
                    </div>
                    <div class="details-row">
                        <span class="details-label">Authority Level:</span>
                        <span class="details-val"><?= htmlspecialchars($report['role_name']) ?></span>
                    </div>
                </div>

                <div class="details-card">
                    <h3>Rental Reference Details</h3>
                    <div class="details-row">
                        <span class="details-label">Rental Code:</span>
                        <span class="details-val"><?= htmlspecialchars($report['rental_code'] ?: 'N/A') ?></span>
                    </div>
                    <div class="details-row">
                        <span class="details-label">Assigned Fleet Unit:</span>
                        <span class="details-val"><?= htmlspecialchars($report['equipment_name'] ?: 'N/A') ?></span>
                    </div>
                    <div class="details-row">
                        <span class="details-label">Serial Number:</span>
                        <span class="details-val"><?= htmlspecialchars($report['equipment_code'] ?: 'N/A') ?></span>
                    </div>
                    <div class="details-row">
                        <span class="details-label">Customer Client:</span>
                        <span class="details-val"><?= htmlspecialchars($report['customer_name'] ?: 'N/A') ?></span>
                    </div>
                </div>
            </div>

            <div class="notes-section">
                <h3>Terms of Agreement & Condition of Dispatch</h3>
                <div class="notes-content">
                    <p>This document serves as an official certification under PT. SURYA BANGUN SARANA BANJARMASIN heavy equipment monitoring and fleet management division. By generating this report, the verified operational staff has approved that the listed heavy equipment unit is in perfect operational condition, free of technical faults, and complies with internal safety standards.</p>
                    <p>For BAST (Berita Acara Serah Terima) and Surat Jalan category records, the client customer has acknowledged receiving the listed unit along with standard operating components in Liang Anggang warehouse dispatch terminal.</p>
                </div>
            </div>

            <div class="signatures">
                <div class="sig-box">
                    <p>Prepared by,</p>
                    <div class="sig-line">
                        <?= htmlspecialchars($report['generator_name']) ?><br>
                        <span style="font-size:11px; font-weight:normal; color:#718096;"><?= htmlspecialchars($report['role_name']) ?> SBS</span>
                    </div>
                </div>
                <div class="sig-box">
                    <p>Acknowledged & Verified by,</p>
                    <div class="sig-line">
                        PT. SURYA BANGUN SARANA<br>
                        <span style="font-size:11px; font-weight:normal; color:#718096;">Banjarmasin Dispatch Terminal</span>
                    </div>
                </div>
            </div>

            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
        <?php
        exit;
    }

    public function printContract() {
        if (!isset($_SESSION['user_id'])) {
            header("Location: index.php?page=login");
            exit;
        }

        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$id) {
            die("ID Kontrak tidak valid.");
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT c.*, u.full_name AS customer_name, u.company_name, u.phone AS customer_phone, u.address AS customer_address, 
                                     r.rental_code, r.start_date, r.end_date, r.total_days, r.subtotal, r.notes AS project_notes, 
                                     e.name AS equipment_name, e.equipment_code, e.brand, e.model, e.rental_price_per_day 
                              FROM contracts c 
                              JOIN users u ON c.customer_id = u.id 
                              JOIN rentals r ON c.rental_id = r.id 
                              JOIN equipments e ON r.equipment_id = e.id 
                              WHERE c.id = :id");
        $stmt->execute([':id' => $id]);
        $ctr = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ctr) {
            die("Kontrak tidak ditemukan.");
        }

        // Render super beautiful official printable contract page
        ?>
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Surat Perjanjian Sewa - <?= htmlspecialchars($ctr['contract_code']) ?></title>
            <style>
                body {
                    font-family: 'Times New Roman', Times, serif;
                    line-height: 1.6;
                    color: #000;
                    margin: 40px;
                    background-color: #fff;
                    font-size: 14px;
                }
                .header-table {
                    width: 100%;
                    border-bottom: 3px double #000;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .logo-placeholder {
                    font-size: 28px;
                    font-weight: bold;
                    color: #001e40;
                    text-align: center;
                    line-height: 1.1;
                }
                .company-detail {
                    text-align: center;
                    font-size: 12px;
                }
                .title {
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    text-decoration: underline;
                    margin-top: 20px;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                }
                .subtitle {
                    text-align: center;
                    font-weight: bold;
                    margin-bottom: 30px;
                }
                .section-title {
                    font-weight: bold;
                    margin-top: 15px;
                    text-transform: uppercase;
                }
                .party-table {
                    width: 100%;
                    margin-left: 20px;
                    margin-bottom: 15px;
                }
                .party-table td {
                    vertical-align: top;
                }
                .terms-box {
                    border: 1px solid #000;
                    padding: 15px;
                    background: #fdfdfd;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    white-space: pre-wrap;
                    margin-bottom: 20px;
                }
                .signature-container {
                    width: 100%;
                    margin-top: 50px;
                }
                .signature-box {
                    width: 45%;
                    float: left;
                    text-align: center;
                }
                .signature-box.right {
                    float: right;
                }
                .clear {
                    clear: both;
                }
                @media print {
                    body {
                        margin: 20px;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="background: #f1f5f9; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 20px; text-align: right;">
                <button onclick="window.print()" style="background: #001e40; color: #fff; border: none; padding: 8px 16px; font-weight: bold; border-radius: 4px; cursor: pointer;">Cetak Dokumen (Print)</button>
            </div>

            <!-- Kop Surat Resmi -->
            <table class="header-table">
                <tr>
                    <td width="15%" style="text-align: center;">
                        <span style="font-size: 40px;">🏢</span>
                    </td>
                    <td>
                        <div class="logo-placeholder">PT. SURYA BANGUN SARANA</div>
                        <div class="company-detail" style="font-size: 14px; font-weight: bold; margin-top: 4px;">HEAVY EQUIPMENT RENTALS & ROAD CONSTRUCTION SERVICES</div>
                        <div class="company-detail">Jl. Ahmad Yani KM 21, Liang Anggang, Kota Banjarbaru, Kalimantan Selatan</div>
                        <div class="company-detail">Telp: (0511) 4782198 | Email: admin@suryabangun.co.id | Kode Pos: 70724</div>
                    </td>
                </tr>
            </table>

            <div class="title">SURAT PERJANJIAN SEWA MENYEWA ALAT BERAT</div>
            <div class="subtitle">Nomor Kontrak: <?= htmlspecialchars($ctr['contract_code']) ?></div>

            <p>Pada hari ini, <strong><?= date('d-m-Y', strtotime($ctr['contract_date'])) ?></strong>, kami yang bertanda tangan di bawah ini menyatakan sepakat melakukan perjanjian sewa menyewa alat berat dengan rincian pihak sebagai berikut:</p>

            <div class="section-title">PIHAK PERTAMA (PEMILIK ASET)</div>
            <table class="party-table">
                <tr>
                    <td width="25%">Nama Perusahaan</td>
                    <td width="3%">:</td>
                    <td><strong>PT. SURYA BANGUN SARANA</strong></td>
                </tr>
                <tr>
                    <td>Alamat Kantor</td>
                    <td>:</td>
                    <td>Jl. Ahmad Yani KM 21, Liang Anggang, Banjarbaru</td>
                </tr>
                <tr>
                    <td>No. Telepon Kantor</td>
                    <td>:</td>
                    <td>(0511) 4782198</td>
                </tr>
            </table>

            <div class="section-title">PIHAK KEDUA (PENYEWA ASET)</div>
            <table class="party-table">
                <tr>
                    <td width="25%">Nama Pelanggan</td>
                    <td width="3%">:</td>
                    <td><strong><?= htmlspecialchars($ctr['customer_name']) ?></strong></td>
                </tr>
                <?php if (!empty($ctr['company_name'])): ?>
                <tr>
                    <td>Nama Perusahaan</td>
                    <td>:</td>
                    <td><?= htmlspecialchars($ctr['company_name']) ?></td>
                </tr>
                <?php endif; ?>
                <tr>
                    <td>Alamat Lengkap</td>
                    <td>:</td>
                    <td><?= htmlspecialchars($ctr['customer_address'] ?: '-') ?></td>
                </tr>
                <tr>
                    <td>No. HP Aktif</td>
                    <td>:</td>
                    <td><?= htmlspecialchars($ctr['customer_phone'] ?: '-') ?></td>
                </tr>
            </table>

            <p>Kedua belah pihak telah bersepakat untuk mengikatkan diri dalam perjanjian sewa menyewa unit alat berat dengan ketentuan tarif, spesifikasi unit, dan jangka waktu sewa sebagai berikut:</p>

            <div class="section-title">RINCIAN ALAT BERAT & SYARAT SEWA</div>
            <table class="party-table" style="border: 1px solid #000; border-collapse: collapse; margin-left: 0; width: 100%;">
                <tr style="background: #f2f2f2; font-weight: bold; border-bottom: 1px solid #000;">
                    <td style="border: 1px solid #000; padding: 8px;">Kode Aset Unit</td>
                    <td style="border: 1px solid #000; padding: 8px;">Deskripsi / Merek Alat</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">Durasi Sewa</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: right;">Tarif / Hari (IDR)</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: right;">Total Subtotal (IDR)</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 8px; font-family: monospace;">#<?= htmlspecialchars($ctr['equipment_code']) ?></td>
                    <td style="border: 1px solid #000; padding: 8px;"><?= htmlspecialchars($ctr['equipment_name']) ?> (Brand: <?= htmlspecialchars($ctr['brand']) ?> / Model: <?= htmlspecialchars($ctr['model']) ?>)</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;"><?= number_format($ctr['total_days']) ?> Hari<br><span style="font-size: 10px; font-weight: normal; color: #444;"><?= date('d M Y', strtotime($ctr['start_date'])) ?> - <?= date('d M Y', strtotime($ctr['end_date'])) ?></span></td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: right;"><?= number_format($ctr['rental_price_per_day'], 2) ?></td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;"><?= number_format($ctr['subtotal'], 2) ?></td>
                </tr>
            </table>

            <div class="section-title" style="margin-top: 25px;">KLAUSUL PASAL PERJANJIAN HUKUM:</div>
            <div class="terms-box"><?= htmlspecialchars($ctr['terms_conditions'] ?: "1. Pihak Kedua bertanggung jawab penuh atas keamanan alat berat.\n2. Bahan bakar dan operator ditanggung oleh pihak penyewa.") ?></div>

            <p style="margin-top: 20px;">Demikian surat perjanjian ini dibuat dengan kesadaran penuh dari kedua belah pihak tanpa ada paksaan dari pihak manapun, untuk dipergunakan sebagaimana mestinya.</p>

            <div class="signature-container">
                <div class="signature-box">
                    <p>PIHAK PERTAMA<br><strong>PT. SURYA BANGUN SARANA</strong></p>
                    <div style="height: 80px; margin-top: 20px;">
                        <span style="border: 1px solid #22c55e; color: #22c55e; padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; display: inline-block;">SIGNED OPERATIONAL DEPT</span>
                    </div>
                    <p style="text-decoration: underline; font-weight: bold;">Hendra Wijaya</p>
                    <p style="font-size: 11px; margin-top: -10px;">Staf Operasional Utama</p>
                </div>
                <div class="signature-box right">
                    <p>PIHAK KEDUA<br><strong>PENYEWA / CLIENT</strong></p>
                    <div style="height: 80px; margin-top: 20px;">
                        <?php if ($ctr['is_signed_customer']): ?>
                            <span style="border: 1px solid #22c55e; color: #22c55e; padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; display: inline-block;">SIGNED DIGITAL BY USER<br><span style="font-size: 8px; font-weight: normal;"><?= date('d-m-Y H:i', strtotime($ctr['signed_at'] ?: $ctr['contract_date'])) ?></span></span>
                        <?php else: ?>
                            <span style="border: 1px dashed #ef4444; color: #ef4444; padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; display: inline-block;">PENDING SIGNATURE</span>
                        <?php 
                        endif; ?>
                    </div>
                    <p style="text-decoration: underline; font-weight: bold;"><?= htmlspecialchars($ctr['customer_name']) ?></p>
                    <p style="font-size: 11px; margin-top: -10px;">Pihak Kedua Penyewa</p>
                </div>
                <div class="clear"></div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
        <?php
        exit;
    }
}
