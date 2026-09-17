<?php
/**
 * ============================================================================
 * SECURITY HELPERS — PT. SURYA BANGUN SARANA BANJARMASIN
 * ============================================================================
 *
 * Berisi pengerasan sesi PHP dan perkakas anti-CSRF yang dipakai router
 * (`index.php`) serta controller.
 *
 * Dimuat SEBELUM `session_start()` agar pengaturan cookie sesi benar-benar
 * berlaku.
 */

/** Batas diam (idle) sebelum sesi dianggap kedaluwarsa: 2 jam. */
const SBS_SESSION_IDLE_SECONDS = 7200;

/** Rotasi ID sesi setiap 15 menit untuk mempersempit session fixation. */
const SBS_SESSION_ROTATE_SECONDS = 900;

/**
 * Memulai sesi dengan cookie yang sudah dikeraskan.
 *
 * - HttpOnly  : cookie tidak bisa dibaca JavaScript (mitigasi pencurian via XSS)
 * - SameSite  : cookie tidak ikut terkirim pada request lintas situs (mitigasi CSRF)
 * - Secure    : hanya dikirim lewat HTTPS bila koneksi memang HTTPS
 */
function sbs_secure_session_start(): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');

    session_start();

    sbs_enforce_session_lifetime();
}

/** Mengakhiri sesi yang terlalu lama diam & merotasi ID sesi secara berkala. */
function sbs_enforce_session_lifetime(): void {
    $now = time();

    if (isset($_SESSION['user_id'])) {
        $last = (int) ($_SESSION['last_activity'] ?? $now);
        if ($now - $last > SBS_SESSION_IDLE_SECONDS) {
            $_SESSION = [];
            session_destroy();
            return;
        }

        $rotated = (int) ($_SESSION['rotated_at'] ?? 0);
        if ($now - $rotated > SBS_SESSION_ROTATE_SECONDS) {
            session_regenerate_id(true);
            $_SESSION['rotated_at'] = $now;
        }
    }

    $_SESSION['last_activity'] = $now;
}

/** Header keamanan dasar untuk seluruh halaman PHP. */
function sbs_send_security_headers(): void {
    if (headers_sent()) {
        return;
    }
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), microphone=()');
}

/** Token CSRF milik sesi ini (dibuat sekali, dipakai untuk semua form). */
function sbs_csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/** Potongan HTML input tersembunyi berisi token CSRF — sisipkan di tiap form POST. */
function sbs_csrf_field(): string {
    return '<input type="hidden" name="csrf_token" value="'
        . htmlspecialchars(sbs_csrf_token(), ENT_QUOTES, 'UTF-8') . '">';
}

/** Memeriksa token CSRF yang dikirim form (perbandingan constant-time). */
function sbs_csrf_valid(): bool {
    $dikirim = $_POST['csrf_token'] ?? '';
    $tersimpan = $_SESSION['csrf_token'] ?? '';
    return is_string($dikirim)
        && $tersimpan !== ''
        && hash_equals($tersimpan, $dikirim);
}

/**
 * Memeriksa bahwa request POST benar-benar berasal dari halaman kita sendiri.
 *
 * Dipakai sebagai lapisan kedua (selain token CSRF) dan sebagai pengaman
 * untuk form lama yang belum sempat disisipi token.
 */
function sbs_same_origin_post(): bool {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        return true;
    }

    $host = $_SERVER['HTTP_HOST'] ?? '';
    $sumber = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if ($host === '' || $sumber === '') {
        // Tanpa header rujukan, kita tidak bisa memastikan asal request.
        return false;
    }

    $hostSumber = parse_url($sumber, PHP_URL_HOST);
    $portSumber = parse_url($sumber, PHP_URL_PORT);
    if ($hostSumber === null) {
        return false;
    }
    if ($portSumber !== null) {
        $hostSumber .= ':' . $portSumber;
    }

    return strcasecmp($hostSumber, $host) === 0;
}

/**
 * Menolak request POST yang tidak lolos pemeriksaan CSRF / same-origin.
 * Dipanggil di awal router sebelum aksi apa pun dijalankan.
 */
function sbs_require_valid_post(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        return;
    }

    if (sbs_same_origin_post() && sbs_csrf_valid()) {
        return;
    }

    // Form lama yang belum memuat token tetap dilindungi same-origin.
    if (sbs_same_origin_post() && !isset($_POST['csrf_token'])) {
        return;
    }

    http_response_code(419);
    die('<div style="font-family: sans-serif; padding:24px; max-width:520px; margin:60px auto;">'
        . '<h3 style="margin:0 0 8px 0;">Permintaan ditolak</h3>'
        . '<p style="margin:0; font-size:14px; line-height:1.6;">Sesi formulir Anda sudah tidak berlaku atau permintaan berasal dari sumber yang tidak dikenal. Silakan muat ulang halaman lalu coba lagi.</p>'
        . '</div>');
}

/** `true` bila pengguna sudah masuk. */
function sbs_is_logged_in(): bool {
    return isset($_SESSION['user_id']);
}

/** Peran pengguna saat ini (huruf besar), atau string kosong bila belum masuk. */
function sbs_current_role(): string {
    return strtoupper(trim((string) ($_SESSION['role'] ?? '')));
}

/** `true` bila peran pengguna saat ini termasuk salah satu peran yang diizinkan. */
function sbs_has_any_role(string ...$roles): bool {
    if (!sbs_is_logged_in()) {
        return false;
    }
    $sekarang = sbs_current_role();
    foreach ($roles as $role) {
        if ($sekarang === strtoupper(trim($role))) {
            return true;
        }
    }
    return false;
}
