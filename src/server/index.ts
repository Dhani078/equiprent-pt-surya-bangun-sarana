import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  daftarContracts,
  daftarPayments,
  daftarUsers,
  daftarUsers2,
  daftarReports,
  daftarAudit,
  daftarDashboard,
  daftarEquipments,
  daftarRentals,
  daftarMaintenance,
  daftarTracking,
} from './routes';
import {
  applyKeywordFilter,
  buildEquipmentAvailability,
  checkPaymentGate,
  createSessionToken,
  daftarOriginDiizinkan,
  describeBlockedReason,
  getEquipmentImage,
  getRentalConflicts,
  summarizeRentalPayment,
  validateEquipmentInput,
  validateMaintenanceType,
  buildFleetTelemetry,
  buildOperationalAnalytics,
  buildTopCustomers,
  buildUtilisasiBulanan,
  buildReport,
  canTransition,
  getAllowedNextStatuses,
  getAuditLog,
  getLateReturnInfo,
  getTransitionEffect,
  hydrateAuditLog,
  isRentalStatus,
  isUnitOutOfService,
  normalizeFleetFilter,
  normalizeRange,
  summarizeAvailability,
  RENTAL_STATUSES,
  BAD_ID,
  BAD_JSON,
  DEFAULT_REPORT_ID,
  MIN_PASSWORD_LENGTH,
  auditActor,
  auditLog,
  badValidation,
  bolehAkunDemo,
  buildDashboardStats,
  configureDatabaseUrl,
  configureSessionSecret,
  db,
  getDataMode,
  hydrasiDariTiDB,
  isDatabaseConnected,
  isPathAllowedForRole,
  isSessionSecretEphemeral,
  parseId,
  PUBLIC_API_PATHS,
  readJsonBody,
  SESSION_HEADER,
  SESSION_TTL_SECONDS,
  toErrorBag,
  verifySessionToken,
  warmSettings,
  Equipment,
  Maintenance,
  Payment,
  Rental,
} from './context';
import type { AppEnv, Bindings } from './http';
import type { BlockedReason, EquipmentAvailability } from '../lib/availability';
import type { ValidatedEquipmentInput } from '../lib/validators';
import type { RentalStatus } from './context';

const app = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
// PERBAIKAN KEAMANAN: `cors()` tanpa argumen memantulkan origin mana pun
// (Access-Control-Allow-Origin: *), sehingga situs pihak ketiga bebas
// memanggil API ini dari browser korban. Sekarang hanya origin yang
// terdaftar pada ALLOWED_ORIGINS yang diizinkan. Bila tidak disetel, tidak
// ada header CORS yang dikirim — aman untuk SPA yang satu domain dengan API.
app.use('/api/*', async (c, next) => {
  const allowList = daftarOriginDiizinkan(c.env);
  if (allowList.length === 0) return next();

  const middleware = cors({
    origin: (origin) => (allowList.includes(origin) ? origin : null),
    allowHeaders: ['Content-Type', SESSION_HEADER],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false,
  });
  return middleware(c, next);
});

// ---------------------------------------------------------------------------
// Security Headers Middleware
// ---------------------------------------------------------------------------
app.use('/api/*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=()');
  c.header('Cache-Control', 'no-store');
  await next();
});

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------
app.onError((err, c) => {
  // Detail exception dicatat di log server (observability Workers) supaya
  // insiden bisa ditelusuri, tetapi TIDAK pernah dikirim ke client.
  console.error('[API_ERROR]', new URL(c.req.url).pathname, err);

  return c.json(
    {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server.' },
    },
    500
  );
});

// ---------------------------------------------------------------------------
// Middleware Autentikasi & RBAC
// Berjalan untuk semua route /api/* KECUALI health & login.
// ---------------------------------------------------------------------------
app.use('/api/*', async (c, next) => {
  // Kunci penanda tangan token hanya tersedia lewat binding environment
  // Workers (bukan process.env), jadi diteruskan di sini. Nilainya dicache
  // di modul auth sehingga pemanggilan berulang tidak mahal.
  configureSessionSecret(c.env?.SESSION_SECRET);
  // Secret TiDB lewat binding worker (bukan process.env) — sambungkan client
  // sebelum route mana pun membaca data; no-op setelah terhubung.
  configureDatabaseUrl(c.env?.DATABASE_URL);

  // Cermin TiDB -> stateStore sekali per isolate (cold-start), sebelum route
  // mana pun membaca data; tanpa ini Worker melayani seed demo padahal TiDB
  // berisi data produksi (temuan audit siklus 59). No-op saat mode demo.
  await hydrasiDariTiDB();

  // Pengaturan aplikasi (tarif denda, dll.) dimuat sekali per isolate dari
  // tabel settings. `warmSettings()` segera kembali bila DB belum terhubung
  // atau pengaturan sudah dimuat — tidak menambah beban tiap permintaan.
  await warmSettings();

  const path = new URL(c.req.url).pathname;

  // Endpoint publik — tidak butuh autentikasi.
  if (PUBLIC_API_PATHS.includes(path)) {
    await next();
    return;
  }

  const token = c.req.header(SESSION_HEADER);
  const result = await verifySessionToken(token);

  if (!result.valid) {
    const message =
      result.reason === 'EXPIRED'
        ? 'Sesi Anda telah berakhir. Silakan masuk kembali.'
        : 'Akses ditolak. Silakan masuk terlebih dahulu.';
    return c.json(
      { success: false, error: { code: result.reason, message } },
      401
    );
  }

  const role = result.payload.rol;
  const userId = result.payload.uid;

  // Sesi yang identitasnya tidak utuh tidak boleh dipakai: seluruh
  // pemeriksaan kepemilikan data bergantung pada userId ini.
  if (!Number.isInteger(userId) || userId <= 0) {
    return c.json(
      { success: false, error: { code: 'MALFORMED', message: 'Sesi tidak valid. Silakan masuk kembali.' } },
      401
    );
  }

  // Otorisasi berbasis role — dicek di server, bukan di client.
  if (!isPathAllowedForRole(path, role, c.req.method)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role ${role} tidak memiliki hak akses ke resource ini.`,
        },
      },
      403
    );
  }

  c.set('role', role);
  c.set('userId', userId);
  await next();
});

// Health Check
app.get('/api/health', (c) => {
  return c.json({
    status: 'online',
    app: 'PT. SURYA BANGUN SARANA BANJARMASIN',
    runtime: 'Cloudflare Workers Edge',
    database: 'TiDB Cloud Serverless',
    database_connected: isDatabaseConnected(),
    // Dilaporkan apa adanya: pada IN_MEMORY_DEMO seluruh perubahan hanya
    // hidup di memori isolate dan hilang saat isolate diganti.
    data_mode: getDataMode(),
    // true = SESSION_SECRET belum dikonfigurasi, kunci acak sementara dipakai
    // sehingga semua sesi gugur setiap isolate baru dimuat.
    session_secret_ephemeral: isSessionSecretEphemeral(),
    timestamp: new Date().toISOString()
  });
});

// ---------------------------------------------------------------------------
// Rate Limiting Sederhana untuk Endpoint Login
// Mencegah brute-force. Catatan: counter per-isolate, bukan global.
// ---------------------------------------------------------------------------
const loginAttempts = new Map<string, { count: number; firstAt: number }>();
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 menit

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  // Jendela baru (atau percobaan pertama) — hitungan dimulai dari nol.
  if (!entry || now - entry.firstAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAt: now });
    return false;
  }

  // Sudah melewati batas: jangan menambah hitungan lagi supaya jendela
  // blokir tidak ikut memanjang tanpa batas selama penyerang terus mencoba.
  if (entry.count > LOGIN_MAX_ATTEMPTS) return true;

  entry.count += 1;
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

function clearRateLimit(key: string): void {
  loginAttempts.delete(key);
}

// Auth Route — verifikasi username DAN password
app.post('/api/auth/login', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Format request tidak valid.' } },
      400
    );
  }

  const { username, password } = (body ?? {}) as { username?: unknown; password?: unknown };

  // Validasi input — jangan percaya data dari client.
  if (typeof username !== 'string' || typeof password !== 'string') {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Username dan password wajib diisi.' } },
      400
    );
  }

  if (username.trim().length === 0 || password.length === 0) {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Username dan password wajib diisi.' } },
      400
    );
  }

  // Rate limiting berbasis IP (header CF-Connecting-IP disediakan Cloudflare)
  const clientIp = c.req.header('CF-Connecting-IP') ?? 'unknown';
  if (isRateLimited(clientIp)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
        },
      },
      429
    );
  }

  const check = await db.verifyCredentials(username, password, {
    allowDemoAccounts: bolehAkunDemo(c.env),
  });

  if (!check.ok) {
    // Pesan sengaja dibuat seragam untuk mencegah username enumeration.
    const message =
      check.reason === 'SUSPENDED'
        ? 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.'
        : check.reason === 'NO_PASSWORD_SET'
          ? 'Akun ini belum memiliki password. Hubungi administrator untuk menetapkannya.'
          : 'Username atau password salah.';
    return c.json(
      { success: false, error: { code: check.reason, message } },
      401
    );
  }

  clearRateLimit(clientIp);

  const user = check.user;
  const token = await createSessionToken(user);

  auditLog({
    ...auditActor(c),
    action: 'LOGIN',
    entity: 'user',
    entity_id: user.id,
    detail: `Login berhasil dari IP ${clientIp}`,
  });

  return c.json({
    success: true,
    token,
    expires_in: SESSION_TTL_SECONDS,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role_name,
      role_id: user.role_id,
      email: user.email,
      company_name: user.company_name
    }
  });
});

/**
 * Mengganti password sendiri.
 *
 * Password lama wajib dibuktikan lebih dulu: tanpa itu, token yang tercuri
 * bisa dipakai untuk mengunci pemilik akun yang sah keluar dari sistemnya.
 */
app.post('/api/auth/change-password', async (c) => {
  const body = await readJsonBody<{ oldPassword?: unknown; newPassword?: unknown }>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return c.json(
      badValidation({ newPassword: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.` }),
      400
    );
  }

  if (newPassword === oldPassword) {
    return c.json(badValidation({ newPassword: 'Password baru harus berbeda dari password lama.' }), 400);
  }

  const userId = c.get('userId');
  const user = await db.getUserById(userId);
  if (!user) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' } }, 404);
  }

  const check = await db.verifyCredentials(user.username, oldPassword, {
    allowDemoAccounts: bolehAkunDemo(c.env),
  });
  if (!check.ok) {
    return c.json(
      { success: false, error: { code: 'BAD_PASSWORD', message: 'Password lama tidak sesuai.' } },
      401
    );
  }

  await db.setUserPassword(userId, newPassword);

  auditLog({
    ...auditActor(c),
    action: 'PASSWORD_CHANGED',
    entity: 'user',
    entity_id: userId,
    detail: 'Pengguna mengganti passwordnya sendiri',
  });

  return c.json({ success: true });
});
// ---------------------------------------------------------------------------
daftarDashboard(app);
daftarEquipments(app);
daftarRentals(app);
daftarContracts(app);
daftarPayments(app);
daftarMaintenance(app);
daftarTracking(app);
/** Pembaruan profil sendiri (nama, kontak, perusahaan) oleh pengguna mana pun.
 *  Field sensitif (role/status/username) dibuang di db.updateUser. */
daftarUsers(app);
daftarUsers2(app);
daftarReports(app);
daftarAudit(app);
daftarTracking(app);
// Fallback to Cloudflare Static Assets
app.all('*', async (c) => {
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default app;
