<?php
/**
 * ============================================================================
 * MODUL LENGKAP: GPS Telemetry & Live Fleet Tracking (Gabungan Slim)
 * PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 */
session_start();

// Validasi Hak Akses Admin (Controller Layer)
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'ADMIN') {
    header("Location: index.php?page=login");
    exit;
}

// 1. MODEL: GpsModel (Mengisolasi Posisi GPS Terakhir per Unit)
class GpsModel {
    private $db;
    public function __construct() { $this->db = Database::getConnection(); }

    public function getLatestLocations() {
        try {
            $sql = "SELECT 
                        eq.id AS equipment_id,
                        eq.equipment_code,
                        eq.name AS equipment_name,
                        eq.type AS equipment_type,
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
            return [];
        }
    }
}

// 2. CONTROLLER: Fetching Telemetri Real-time
$gpsModel = new GpsModel();
$latestLocations = $gpsModel->getLatestLocations();
$fullName = $_SESSION['full_name'] ?? 'Muhammad Rizki Ramadhani, S.Kom';
?>

<!-- 3. VIEW: Antarmuka Peta Pelacakan GPS Leaflet.js (HTML5 & CSS3 Premium) -->
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>GPS Live Tracking | SBS EquipRent</title>
    <!-- Leaflet.js CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <style>
        :root {
            --primary: #003366;
            --secondary: #475569;
            --background: #F8FAFC;
            --surface: #FFFFFF;
            --outline: #E2E8F0;
            --radius: 8px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body { background: var(--background); display: flex; height: 100vh; overflow: hidden; }

        /* Sidebar Navigation */
        aside { width: 260px; background: var(--surface); border-right: 1px solid var(--outline); padding: 24px; display: flex; flex-direction: column; justify-content: space-between; }
        .nav-links { list-style: none; margin-top: 32px; }
        .nav-links li a { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--secondary); text-decoration: none; font-weight: 600; border-radius: var(--radius); transition: all 0.25s; }
        .nav-links li a.active { background: #E0F2FE; color: var(--primary); }
        .nav-links li a:hover:not(.active) { background: #F1F5F9; color: var(--primary); }

        /* Main Area with Map & Asymmetric Bento Grid */
        main { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        header { height: 70px; background: var(--surface); border-bottom: 1px solid var(--outline); display: flex; justify-content: space-between; align-items: center; padding: 0 40px; }
        
        .workspace-grid { display: grid; grid-template-cols: 320px 1fr; flex: 1; overflow: hidden; }
        
        /* Left Column List */
        .fleet-list { border-right: 1px solid var(--outline); overflow-y: auto; background: var(--surface); padding: 20px; }
        .fleet-card { border: 1px solid var(--outline); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; cursor: pointer; transition: all 0.25s; }
        .fleet-card:hover, .fleet-card.active-unit { border-color: var(--primary); background: #F0F5FA; transform: translateY(-2px); }
        
        /* Right Column Map Canvas */
        .map-section { display: flex; flex-direction: column; background: var(--background); padding: 24px; overflow-y: auto; }
        #map-container { height: 450px; width: 100%; border: 1px solid var(--outline); border-radius: var(--radius); overflow: hidden; background: #E2E8F0; }
        #map { width: 100%; height: 100%; }

        /* Status Badges */
        .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; text-transform: uppercase; }
        .badge.on { background: #DCFCE7; color: #15803D; }
        .badge.off { background: #FEE2E2; color: #B91C1C; }
    </style>
</head>
<body>
    <!-- Sidebar Kiri -->
    <aside>
        <div>
            <h2 style="color: var(--primary); font-weight: 800;">SBS EquipRent</h2>
            <p style="font-size: 10px; color: var(--secondary); letter-spacing: 1px; font-weight: 700;">ADMIN TERMINAL</p>
            <ul class="nav-links">
                <li><a href="index.php?page=dashboard">Dashboard</a></li>
                <li><a href="index.php?page=equipment">Equipment Inventory</a></li>
                <li><a href="#">Rental Orders</a></li>
                <li><a href="#">Maintenance</a></li>
                <li><a href="#" class="active">Live GPS Tracking</a></li>
                <li><a href="index.php?page=reports">Reports</a></li>
            </ul>
        </div>
        <a href="index.php?page=logout" style="color: #EF4444; text-decoration: none; font-weight: 700; font-size: 14px;">Logout ➔</a>
    </aside>

    <!-- Main Workspace Kanan -->
    <main>
        <!-- Header -->
        <header>
            <div style="font-weight: 700; color: var(--primary); font-size: 18px;">Live GPS Tracking &amp; Fleet Telemetry</div>
            <div style="text-align: right;">
                <p style="font-weight: 700; font-size: 13px; color: var(--primary);"><?= htmlspecialchars($fullName) ?></p>
                <p style="font-size: 10px; color: var(--secondary); font-weight: 700;">ADMINISTRATOR</p>
            </div>
        </header>

        <!-- Asymmetric Bento Grid Workspace -->
        <div class="workspace-grid">
            <!-- Armada Active List -->
            <div class="fleet-list">
                <h3 style="color: var(--primary); font-size: 14px; font-weight: 800; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Unit Terlacak (<?= count($latestLocations) ?>)</h3>
                
                <?php foreach ($latestLocations as $unit): ?>
                    <div class="fleet-card" onclick="focusUnit(<?= $unit['equipment_id'] ?>, <?= $unit['latitude'] ?>, <?= $unit['longitude'] ?>)" id="unit-card-<?= $unit['equipment_id'] ?>">
                        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                            <div>
                                <p style="font-size:10px; color:var(--secondary); font-weight:700;"><?= htmlspecialchars($unit['equipment_code']) ?></p>
                                <h4 style="font-size:14px; font-weight:700; color:var(--primary);"><?= htmlspecialchars($unit['equipment_name']) ?></h4>
                            </div>
                            <span class="badge <?= strtolower($unit['engine_status']) === 'on' ? 'on' : 'off' ?>">
                                <?= htmlspecialchars($unit['engine_status']) ?>
                            </span>
                        </div>
                        <div style="font-size:12px; color:var(--secondary); border-top:1px dashed var(--outline); padding-top:8px; display:flex; justify-content:space-between;">
                            <span>BBM: <strong><?= number_format($unit['fuel_level_percent'], 0) ?>%</strong></span>
                            <span>HM: <strong><?= number_format($unit['current_hour_meter'], 1) ?> HM</strong></span>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

            <!-- Live Map & Sensor Panel -->
            <div class="map-section">
                <!-- Map Container -->
                <div id="map-container">
                    <div id="map"></div>
                </div>

                <!-- Sensor Stats Panel -->
                <div style="background:var(--surface); border:1px solid var(--outline); border-radius:var(--radius); padding:24px; margin-top:24px;">
                    <h3 style="color: var(--primary); font-size: 16px; font-weight: 800; margin-bottom: 16px;">Telemetri Sensor Terakhir</h3>
                    <div style="display:grid; grid-template-cols: repeat(4, 1fr); gap:16px;">
                        <div style="background:#F8FAFC; padding:16px; border-radius:var(--radius); border:1px solid var(--outline);">
                            <p style="font-size:10px; color:var(--secondary); font-weight:700; text-transform:uppercase;">Kecepatan</p>
                            <h4 style="font-size:18px; color:var(--primary); font-weight:800; margin-top:4px;" id="sensor-speed">- km/j</h4>
                        </div>
                        <div style="background:#F8FAFC; padding:16px; border-radius:var(--radius); border:1px solid var(--outline);">
                            <p style="font-size:10px; color:var(--secondary); font-weight:700; text-transform:uppercase;">Kapasitas Tangki</p>
                            <h4 style="font-size:18px; color:var(--primary); font-weight:800; margin-top:4px;" id="sensor-fuel">- %</h4>
                        </div>
                        <div style="background:#F8FAFC; padding:16px; border-radius:var(--radius); border:1px solid var(--outline);">
                            <p style="font-size:10px; color:var(--secondary); font-weight:700; text-transform:uppercase;">Lokasi Koordinat</p>
                            <h4 style="font-size:14px; color:var(--primary); font-weight:800; margin-top:8px; word-break:break-all;" id="sensor-coords">-</h4>
                        </div>
                        <div style="background:#F8FAFC; padding:16px; border-radius:var(--radius); border:1px solid var(--outline); border-left:4px solid var(--primary);">
                            <p style="font-size:10px; color:var(--secondary); font-weight:700; text-transform:uppercase;">Update Terakhir</p>
                            <h4 style="font-size:14px; color:var(--primary); font-weight:800; margin-top:8px;" id="sensor-time">-</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Leaflet.js Map Engine -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
        // Inisialisasi Peta
        const map = L.map('map', { zoomControl: false }).setView([-3.316694, 114.590111], 12);
        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Marker Database Ref
        const markers = {};
        const unitData = {};

        <?php foreach ($latestLocations as $unit): ?>
            unitData[<?= $unit['equipment_id'] ?>] = {
                id: <?= $unit['equipment_id'] ?>,
                name: "<?= addslashes($unit['equipment_name']) ?>",
                code: "<?= $unit['equipment_code'] ?>",
                lat: <?= $unit['latitude'] ?>,
                lng: <?= $unit['longitude'] ?>,
                speed: <?= $unit['speed'] ?>,
                fuel: <?= $unit['fuel_level_percent'] ?>,
                engine: "<?= $unit['engine_status'] ?>",
                time: "<?= date('d M Y H:i', strtotime($unit['recorded_at'])) ?> WITA"
            };

            // Plot Marker ke Peta
            markers[<?= $unit['equipment_id'] ?>] = L.marker([<?= $unit['latitude'] ?>, <?= $unit['longitude'] ?>])
                .addTo(map)
                .bindPopup(`<strong><?= addslashes($unit['equipment_name']) ?></strong><br>Status: <?= $unit['engine_status'] ?>`);
        <?php endforeach; ?>

        function focusUnit(id, lat, lng) {
            // Highlight list card
            document.querySelectorAll('.fleet-card').forEach(card => card.classList.remove('active-unit'));
            document.getElementById(`unit-card-${id}`).classList.add('active-unit');

            // Fly To Location
            map.flyTo([lat, lng], 15, { animate: true, duration: 1.2 });
            markers[id].openPopup();

            // Hydrate sensor stats
            const data = unitData[id];
            document.getElementById('sensor-speed').innerText = `${data.speed} km/j`;
            document.getElementById('sensor-fuel').innerText = `${data.fuel}%`;
            document.getElementById('sensor-coords').innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            document.getElementById('sensor-time').innerText = data.time;
        }
    </script>
</body>
</html>
