import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  daftarContracts,
  daftarPayments,
  daftarUsers,
  daftarUsers2,
  daftarReports,
  daftarAudit,
  daftarTracking,
} from './routes';
import {
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
} from './context';
import type { AppEnv } from './http';
import { configureDatabaseUrl, db, getDataMode, hydrasiDariTiDB, isDatabaseConnected } from '../lib/db';
import {
  configureSessionSecret,
  createSessionToken,
  isSessionSecretEphemeral,
  verifySessionToken,
  isPathAllowedForRole,
  PUBLIC_API_PATHS,
  SESSION_HEADER,
  SESSION_TTL_SECONDS,
} from '../lib/auth';
import type { RoleName, ReportId, User } from '../types';
import type { Contract, Equipment, Rental, Maintenance, Payment } from '../types';
import {
  buildEquipmentAvailability,
  describeBlockedReason,
  getRentalConflicts,
  isUnitOutOfService,
  summarizeAvailability,
} from '../lib/availability';
import type { BlockedReason, EquipmentAvailability } from '../lib/availability';
import {
  validateEquipmentInput,
  validateUserInput,
  validateEquipmentCode,
  validateEquipmentStatus,
  validateHourMeter,
  validateRentalRate,
  validateMaintenanceType,
  validateContractSignature,
} from '../lib/validators';
import { isContractActive, isContractSigned, buildContractPreview, renderContractHtml } from '../lib/contracts';
import type { ValidatedEquipmentInput, ValidatedUserInput } from '../lib/validators';
import {
  FIELD_BUKTI,
  checkPaymentGate,
  getAllowedPaymentTransitions,
  mayTouchPayment,
  mayVerifyPayment,
  summarizePaymentQueue,
  summarizeRentalPayment,
  validatePaymentProofPath,
} from '../lib/paymentWorkflow';
import { getEquipmentImage } from '../lib/stitchAssets';
import {
  applyKeywordFilter,
  buildReport,
  isReportId,
  normalizeRange,
  REPORT_CATALOG,
} from '../lib/reports';
import type { ReportDataSource } from '../lib/reports';
import { buildDashboardStats } from '../lib/dashboard';
import {
  buildOperationalAnalytics,
  buildTopCustomers,
  buildUtilisasiBulanan,
} from '../lib/analytics';
import { auditLog, getAuditLog, auditActor, hydrateAuditLog } from '../lib/auditLog';
import type { AuditEntry } from '../lib/auditLog';
import { warmSettings } from '../lib/db';
import { buildFleetTelemetry, normalizeFleetFilter } from '../lib/fleetTelemetry';
import {
  canTransition,
  getAllowedNextStatuses,
  getLateReturnInfo,
  getTransitionEffect,
  isRentalStatus,
  RENTAL_STATUSES,
} from '../lib/rentalWorkflow';
import type { RentalStatus } from '../lib/rentalWorkflow';

const app = new Hono<AppEnv>();

/** Daftar origin yang diizinkan, dibaca dari binding `ALLOWED_ORIGINS`. */
function daftarOriginDiizinkan(env: Bindings | undefined): string[] {
  const raw = env?.ALLOWED_ORIGINS;
  if (typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

/** `false` hanya bila operator mematikan akun demo secara eksplisit. */
function bolehAkunDemo(env: Bindings | undefined): boolean {
  return String(env?.ALLOW_DEMO_ACCOUNTS ?? 'true').toLowerCase() !== 'false';
}

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

/**
 * Dashboard Stats Route — agregat eksekutif Administrator.
 *
 * Perhitungan TIDAK lagi ditulis di sini: seluruh rumus hidup di
 * `src/lib/dashboard.ts`, modul yang sama dipakai klien sebagai fallback.
 * Dengan begitu angka dari API dan angka dari perhitungan lokal tidak bisa
 * menyimpang satu sama lain.
 */
app.get('/api/dashboard/stats', async (c) => {
  const [payments, equipments, rentals, users, maintenance] = await Promise.all([
    db.getPayments(),
    db.getEquipments(),
    db.getRentals(),
    db.getUsers(),
    db.getMaintenance(),
  ]);

  const stats = buildDashboardStats({ equipments, rentals, maintenance, payments, users });

  return c.json({ success: true, data: stats });
});

/**
 * Endpoint Analytics Operasional (T-0061).
 *
 * RBAC: path `/api/dashboard` hanya boleh diakses ADMIN & STAFF (lihat
 * RBAC_MATRIX di src/lib/auth.ts) — data per pelanggan adalah informasi
 * komersial yang tidak boleh dilihat sesama pelanggan.
 *
 * Mengembalikan dua agregat:
 *   - utilisasiBulanan: unit disewa ÷ total unit per bulan (12 bulan)
 *   - topCustomers     : 5 pelanggan teratas berdasarkan nilai penyewaan
 *
 * Mesin murni `src/lib/analytics.ts` dipakai bersama oleh klien sehingga
 * angka di layar tidak bisa menyimpang dari angka server.
 */
app.get('/api/dashboard/analytics', async (c) => {
  const [rentals, equipments, users] = await Promise.all([
    db.getRentals(),
    db.getEquipments(),
    db.getUsers(),
  ]);

  const analytics = buildOperationalAnalytics({ rentals, equipments, users });

  return c.json({
    success: true,
    data: analytics,
    meta: {
      jumlahBulan: analytics.utilisasiBulanan.length,
      jumlahPelanggan: analytics.topCustomers.length,
      scope: 'ANALYTICS_OPERASIONAL',
    },
  });
});

// Equipments API
app.get('/api/equipments', async (c) => {
  const items = await db.getEquipments();
  return c.json(items);
});

app.post('/api/equipments', async (c) => {
  const body = await readJsonBody<unknown>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  // Validasi terpusat: panjang, format, rentang angka — sama dengan yang
  // dijalankan form Admin agar pesan galat konsisten.
  const hasil = validateEquipmentInput(body);
  if (!hasil.ok) return c.json(badValidation(toErrorBag(hasil.errors)), 400);

  const input: ValidatedEquipmentInput = hasil.value;

  // Kode unit harus unik — dipakai sebagai identitas di dokumen & laporan.
  const sudahAda = (await db.getEquipments()).some(
    e => e.equipment_code.toLowerCase() === input.equipment_code.toLowerCase()
  );
  if (sudahAda) {
    return c.json(
      badValidation({ equipment_code: `Kode unit ${input.equipment_code} sudah terdaftar.` }),
      409
    );
  }

  const newItem = await db.addEquipment({
    ...input,
    thumbnail_url: input.thumbnail_url || getEquipmentImage(input.equipment_code, input.type),
  });

  // Audit trail: pencatatan unit baru oleh Administrator.
  auditLog({
    ...auditActor(c),
    action: 'EQUIPMENT_CREATE',
    entity: 'equipment',
    entity_id: newItem.id,
    detail: `Unit ${newItem.equipment_code} (${newItem.name}) didaftarkan`,
  });

  return c.json({ success: true, item: newItem }, 201);
});

app.put('/api/equipments/:id', async (c) => {
  // Hanya ADMIN yang boleh mengubah master unit.
  // RBAC_MATRIX membatasi prefix `/api/equipments` secara global, tetapi
  // pengecekan eksplisit di sini menjaga aturan tetap berlaku seandainya
  // matriks kelak diperluas (misal STAFF diizinkan GET saja).
  if (c.get('role') !== 'ADMIN') {
    return c.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Administrator yang dapat mengubah data unit.' } },
      403
    );
  }

  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  // Keberadaan unit diperiksa SEBELUM validasi isi: menulis ke unit yang
  // tidak ada harus menjawab 404, bukan 400 karena field ikut tidak lengkap.
  const target = (await db.getEquipments()).find(e => e.id === id);
  if (!target) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Unit tidak ditemukan.' } }, 404);
  }

  const body = await readJsonBody<unknown>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  const hasil = validateEquipmentInput(body);
  if (!hasil.ok) return c.json(badValidation(toErrorBag(hasil.errors)), 400);

  const input: ValidatedEquipmentInput = hasil.value;

  // Kode unit unik, kecuali bila kode tersebut memang milik unit yang diedit.
  const bentrok = (await db.getEquipments()).some(
    e => e.id !== id && e.equipment_code.toLowerCase() === input.equipment_code.toLowerCase()
  );
  if (bentrok) {
    return c.json(
      badValidation({ equipment_code: `Kode unit ${input.equipment_code} sudah dipakai unit lain.` }),
      409
    );
  }

  const updated = await db.updateEquipment(id, {
    ...input,
    thumbnail_url: input.thumbnail_url || getEquipmentImage(input.equipment_code, input.type),
  });
  if (!updated) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Unit tidak ditemukan.' } }, 404);

  // Audit trail: perubahan master unit hanya oleh Administrator.
  auditLog({
    ...auditActor(c),
    action: 'EQUIPMENT_UPDATE',
    entity: 'equipment',
    entity_id: id,
    detail: `Unit ${updated.equipment_code} diperbarui (tarif Rp ${updated.rental_price_per_day}/hari, HM ${updated.hour_meter})`,
  });

  return c.json({ success: true, item: updated });
});

app.delete('/api/equipments/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  // Unit yang masih tercatat dalam sewa berjalan tidak boleh dihapus:
  // riwayat rental & laporan akan kehilangan referensinya.
  const unit = (await db.getEquipments()).find(e => e.id === id);
  if (!unit) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Unit tidak ditemukan.' } }, 404);

  const masihDisewa = (await db.getRentals()).some(
    r => r.equipment_id === id && (r.status === 'APPROVED' || r.status === 'ON_GOING')
  );
  if (masihDisewa) {
    return c.json(
      {
        success: false,
        error: {
          code: 'EQUIPMENT_IN_USE',
          message: `Unit ${unit.equipment_code} sedang berada dalam sewa aktif. Selesaikan transaksinya terlebih dahulu.`,
        },
      },
      409
    );
  }

  const ok = await db.deleteEquipment(id);
  if (!ok) {
    return c.json(
      {
        success: false,
        error: {
          code: 'EQUIPMENT_HAS_HISTORY',
          message:
            `Unit ${unit.equipment_code} pernah dipakai dalam transaksi sewa. ` +
            'Riwayat, kontrak, dan laporannya harus tetap menunjuk ke unit ini — hapus tidak diperkenankan.',
        },
      },
      409
    );
  }

  // Audit trail: penghapusan unit berbahaya — pelakunya wajib tercatat.
  auditLog({
    ...auditActor(c),
    action: 'EQUIPMENT_DELETE',
    entity: 'equipment',
    entity_id: id,
    detail: `Unit ${unit.equipment_code} dihapus dari inventaris`,
  });

  return c.json({ success: true });
});

// Rentals API

/**
 * Daftar transaksi sewa.
 *
 * PERBAIKAN KEAMANAN (IDOR): sebelumnya seluruh transaksi seluruh pelanggan
 * dikirim ke siapa pun yang punya sesi — termasuk pelanggan lain. Sekarang
 * pelanggan hanya menerima transaksi miliknya sendiri.
 */
app.get('/api/rentals', async (c) => {
  const items = await db.getRentals();

  if (c.get('role') === 'CUSTOMER') {
    const userId = c.get('userId');
    return c.json(items.filter((r) => r.customer_id === userId));
  }

  return c.json(items);
});

app.post('/api/rentals', async (c) => {
  const body = await readJsonBody<Omit<Rental, 'id' | 'rental_code'>>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  // Validasi field wajib.
  const equipmentId = Number((body as { equipment_id?: unknown }).equipment_id);
  const startDate = (body as { start_date?: unknown }).start_date;
  const endDate = (body as { end_date?: unknown }).end_date;

  if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Unit (equipment_id) wajib dipilih.' } },
      400
    );
  }

  if (typeof startDate !== 'string' || typeof endDate !== 'string' ||
      !Number.isFinite(new Date(startDate).getTime()) || !Number.isFinite(new Date(endDate).getTime())) {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Tanggal mulai dan selesai tidak valid.' } },
      400
    );
  }

  if (new Date(endDate) < new Date(startDate)) {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.' } },
      400
    );
  }

  // Pastikan unit ada.
  const unit = (await db.getEquipments()).find(e => e.id === equipmentId);
  if (!unit) {
    return c.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Unit tidak ditemukan.' } },
      404
    );
  }

  // Unit yang sedang dirawat atau dinonaktifkan tidak boleh disewa kapan pun.
  // Catatan: status RENTED tidak ditolak di sini — status unit adalah keadaan
  // hari ini, sedangkan pemesanan bisa untuk masa depan. Yang menentukan
  // adalah bentrokan rentang tanggal (diperiksa di bawah).
  if (isUnitOutOfService(unit.status)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'EQUIPMENT_UNAVAILABLE',
          message: `Unit ${unit.equipment_code} tidak tersedia untuk disewa (status: ${unit.status}).`,
        },
      },
      409
    );
  }

  // Cegah double-booking: unit tidak boleh disewa pada rentang yang bentrok.
  // Mesin yang sama dipakai UI supaya pesan galat selalu konsisten.
  const [availability] = buildEquipmentAvailability(
    [unit],
    await db.getRentals(),
    startDate,
    endDate
  );

  if (!availability.isBookable) {
    return c.json(
      {
        success: false,
        error: {
          code: 'EQUIPMENT_UNAVAILABLE',
          message: describeBlockedReason(availability),
        },
      },
      409
    );
  }

  // Pelanggan hanya boleh memesan atas namanya sendiri: `customer_id` dari
  // body diabaikan dan diganti identitas sesi, sehingga tidak ada transaksi
  // yang bisa dibuat atas nama pelanggan lain.
  const payload =
    c.get('role') === 'CUSTOMER'
      ? { ...body, customer_id: c.get('userId') }
      : body;

  const newItem = await db.addRental(payload);

  // Audit trail: pengajuan/transaksi sewa baru.
  auditLog({
    ...auditActor(c),
    action: 'RENTAL_CREATE',
    entity: 'rental',
    entity_id: newItem.id,
    detail: `Rental ${newItem.rental_code} dibuat — unit ${newItem.equipment_code} (${newItem.total_days} hari)`,
  });

  return c.json({ success: true, item: newItem }, 201);
});

/**
 * Pemeriksaan ketersediaan unit untuk rentang tanggal tertentu.
 * Dipakai form rental agar pilihan unit langsung mengikuti periode sewa.
 *
 * Query: equipmentId, from, to, excludeRentalId (opsional)
 */
app.get('/api/rentals/availability', async (c) => {
  const query = c.req.query();
  const from = query.from ?? '';
  const to = query.to ?? '';

  if (from === '' || to === '') {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter from dan to wajib diisi (format YYYY-MM-DD).',
        },
      },
      400
    );
  }

  const equipmentIdRaw = query.equipmentId ?? '';
  const equipmentId = equipmentIdRaw === '' ? null : Number(equipmentIdRaw);

  // excludeRentalId dipakai saat mengedit rental yang sudah ada.
  const excludeRaw = query.excludeRentalId ?? '';
  const excludeParsed = excludeRaw === '' ? null : Number(excludeRaw);
  const excludeRentalId =
    excludeParsed !== null && Number.isInteger(excludeParsed) && excludeParsed > 0
      ? excludeParsed
      : undefined;

  const semuaUnit = await db.getEquipments();
  const rentals = await db.getRentals();

  // equipmentId diberikan → periksa satu unit saja (dipakai oleh validasi form).
  if (equipmentId !== null) {
    if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
      return c.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'equipmentId tidak valid.' } },
        400
      );
    }

    const unit = semuaUnit.find((e) => e.id === equipmentId);
    if (!unit) {
      return c.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Unit tidak ditemukan.' } },
        404
      );
    }

    const conflicts = getRentalConflicts(equipmentId, from, to, rentals, excludeRentalId);
    const isBookable = conflicts.length === 0 && !isUnitOutOfService(unit.status);

    return c.json({
      success: true,
      data: {
        equipmentId,
        equipmentCode: unit.equipment_code,
        from,
        to,
        isBookable,
        // Rincian bentrokan memuat data transaksi pelanggan lain, jadi hanya
        // dibuka untuk pengguna internal. Pelanggan cukup tahu bisa/tidak.
        conflicts: c.get('role') === 'CUSTOMER' ? [] : conflicts,
        reason: conflicts.length > 0 ? 'Terbentur jadwal sewa lain.' : null,
      },
    });
  }

  // Tanpa equipmentId → ringkasan semua unit (dipakai untuk mengisi dropdown).
  const availability = buildEquipmentAvailability(semuaUnit, rentals, from, to, excludeRentalId);

  return c.json({
    success: true,
    data: {
      from,
      to,
      summary: summarizeAvailability(availability),
      items: availability.map((a): {
        id: number;
        equipmentCode: string;
        name: string;
        status: Equipment['status'];
        isBookable: boolean;
        reason: BlockedReason;
        conflicts: number;
      } => ({
        id: a.equipment.id,
        equipmentCode: a.equipment.equipment_code,
        name: a.equipment.name,
        status: a.equipment.status,
        isBookable: a.isBookable,
        reason: a.blockedReason,
        conflicts: a.conflicts.length,
      })),
    },
  });
});

/**
 * Daftar unit yang bisa dipesan pada rentang tertentu.
 * Bentuknya sengaja ringkas (tanpa rincian bentrokan) agar ringan dipanggil
 * berulang kali saat pengguna mengubah tanggal.
 */
app.get('/api/rentals/bookable', async (c) => {
  const query = c.req.query();
  const from = query.from ?? '';
  const to = query.to ?? '';

  const availability = buildEquipmentAvailability(
    await db.getEquipments(),
    await db.getRentals(),
    from,
    to
  );

  const bookable: EquipmentAvailability[] = availability.filter((a) => a.isBookable);

  return c.json({
    success: true,
    data: {
      from,
      to,
      summary: summarizeAvailability(availability),
      items: bookable.map((a) => ({
        id: a.equipment.id,
        equipmentCode: a.equipment.equipment_code,
        name: a.equipment.name,
        rentalPricePerDay: a.equipment.rental_price_per_day,
      })),
    },
  });
});

app.put('/api/rentals/:id/status', async (c) => {
  // Perubahan status sewa adalah wewenang perusahaan. Pelanggan tidak boleh
  // menyetujui atau mengoperasikan sewanya sendiri.
  if (c.get('role') === 'CUSTOMER') {
    return c.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Perubahan status sewa dilakukan oleh Admin atau Staf Operasional.',
        },
      },
      403
    );
  }

  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  const body = await readJsonBody<{ status?: unknown; overrideUnpaid?: unknown }>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  // Status harus salah satu ENUM yang diakui skema tabel `rentals`.
  if (!isRentalStatus(body.status)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Status harus salah satu dari: ${RENTAL_STATUSES.join(', ')}.`,
        },
      },
      400
    );
  }

  const targetStatus: RentalStatus = body.status;

  const semuaRental = await db.getRentals();
  const target = semuaRental.find(r => r.id === id);
  if (!target) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental tidak ditemukan.' } }, 404);
  }

  // Alur wajib mengikuti matriks transisi terpusat: mencegah lompatan status
  // (misal PENDING → COMPLETED) yang bisa memalsukan laporan pendapatan.
  const transisi = canTransition(target.status, targetStatus);
  if (!transisi.allowed) {
    return c.json(
      { success: false, error: { code: 'INVALID_STATUS_TRANSITION', message: transisi.reason } },
      409
    );
  }

  const unit = (await db.getEquipments()).find(e => e.id === target.equipment_id);
  if (!unit) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Unit tidak ditemukan.' } }, 404);
  }

  // Transisi yang mengunci unit wajib lolos uji bentrokan jadwal.
  // Mencegah double-booking dari jalur persetujuan staf.
  if (getTransitionEffect(targetStatus).equipmentStatus === 'RENTED') {
    // Mesin yang sama dengan POST /api/rentals — rental ini dikecualikan agar
    // tidak bentrok dengan dirinya sendiri.
    const [availability] = buildEquipmentAvailability(
      [unit],
      semuaRental,
      target.start_date,
      target.end_date,
      id
    );

    if (!availability.isBookable) {
      return c.json(
        {
          success: false,
          error: {
            code: 'EQUIPMENT_UNAVAILABLE',
            message: `${describeBlockedReason(availability)} Perubahan status dibatalkan.`,
          },
        },
        409
      );
    }
  }

  // -------------------------------------------------------------------------
  // GERBANG PEMBAYARAN (aturan bisnis §4.3 poin 4)
  // Sewa hanya boleh BEROPERASI (ON_GOING) bila tagihannya sudah lunas.
  // -------------------------------------------------------------------------
  const kontrakSewa = (await db.getContracts())
    .filter(kontrak => kontrak.rental_id === target.id)
    .map(kontrak => kontrak.id);
  const statusBayar = summarizeRentalPayment(await db.getPayments(), kontrakSewa);

  // Override hanya dihormati untuk ADMIN (bukan sekadar diklaim di body).
  const mintaOverride = body.overrideUnpaid === true;
  const gerbang = checkPaymentGate(targetStatus, statusBayar, {
    role: c.get('role'),
    override: mintaOverride,
  });

  if (!gerbang.allowed) {
    return c.json(
      {
        success: false,
        error: { code: gerbang.code, message: gerbang.message },
      },
      409
    );
  }

  let updated;
  try {
    updated = await db.updateRentalStatus(id, targetStatus, {
      overrideUnpaid: gerbang.allowed && gerbang.requiresPaid ? gerbang.overrideUsed : false,
    });
  } catch (err) {
    // Lapisan data menolak karena tagihan belum lunas (jalan override tidak
    // sah dari klien). Tangani di sini agar tidak menjadi error 500.
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'TAGIHAN_BELUM_LUNAS') {
      return c.json(
        {
          success: false,
          error: {
            code: msg,
            message:
              'Pembayaran atas sewa ini belum terverifikasi lunas. Verifikasi bukti transfer terlebih dahulu sebelum unit dioperasikan.',
          },
        },
        409
      );
    }
    throw err;
  }

  if (!updated) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental tidak ditemukan.' } }, 404);

  // Audit trail
  auditLog({
    ...auditActor(c),
    action: 'RENTAL_STATUS_CHANGE',
    entity: 'rental',
    entity_id: id,
    detail: `Status rental #${id} diubah ke ${targetStatus}`,
  });

  // Denda keterlambatan dihitung oleh modul yang sama dengan UI & dokumen
  // cetak, sehingga angka di API tidak bisa menyimpang dari layar.
  const denda = getLateReturnInfo(updated, { referenceAt: new Date() });

  return c.json({
    success: true,
    item: updated,
    meta: {
      lateDays: denda.lateDays,
      penalty: denda.penalty,
      allowedNext: getAllowedNextStatuses(targetStatus),
      // Dibawa ikut agar UI dapat menjelaskan MENGAPA transisi ini
      // diizinkan (lunas atau override Admin) tanpa menebak-nebak.
      paymentStatus: statusBayar,
      paymentOverride: gerbang.allowed && gerbang.requiresPaid ? gerbang.overrideUsed : false,
    },
  });
});

// ---------------------------------------------------------------------------
daftarContracts(app);
daftarPayments(app);
// Maintenance API
app.get('/api/maintenance', async (c) => {
  const items = await db.getMaintenance();
  return c.json(items);
});

app.post('/api/maintenance', async (c) => {
  const body = await readJsonBody<Omit<Maintenance, 'id' | 'maintenance_code'>>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  // Validasi field wajib agar tidak tersimpan log servis kosong.
  const equipmentId = Number((body as { equipment_id?: unknown }).equipment_id);
  const scheduledDate = (body as { scheduled_date?: unknown }).scheduled_date;

  if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Unit (equipment_id) wajib dipilih.' } },
      400
    );
  }

  if (typeof scheduledDate !== 'string' || !Number.isFinite(new Date(scheduledDate).getTime())) {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Tanggal servis (scheduled_date) tidak valid.' } },
      400
    );
  }

  // Pastikan unit yang dijadwalkan benar-benar ada.
  const unit = (await db.getEquipments()).find(e => e.id === equipmentId);
  if (!unit) {
    return c.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Unit tidak ditemukan.' } },
      404
    );
  }

  // Jenis pemeliharaan harus salah satu nilai ENUM yang diakui skema.
  // Form lama pernah menawarkan `INSPECTION` — bila tersimpan, barisnya
  // hilang dari laporan perawatan. Ditolak di sini dengan pesan jelas.
  const jenis = validateMaintenanceType(
    (body as { maintenance_type?: unknown }).maintenance_type ?? 'PREVENTIVE'
  );
  if (!jenis.ok) return c.json(badValidation({ maintenance_type: jenis.message }), 400);

  const newItem = await db.scheduleMaintenance(body);
  auditLog({
    ...auditActor(c),
    action: 'MAINTENANCE_SCHEDULED',
    entity: 'maintenance',
    entity_id: newItem.id,
    detail: `Jadwal servis unit #${body.equipment_id} dibuat (${body.maintenance_type ?? 'PREVENTIVE'})`,
  });
  return c.json({ success: true, item: newItem }, 201);
});

app.get('/api/tracking', async (c) => {
  const role = c.get('role');
  const userId = c.get('userId');

  // Unit yang boleh dilihat. `null` = seluruh armada (wewenang internal).
  let equipmentIds: readonly number[] | null = null;

  if (role === 'CUSTOMER') {
    const rentals = await db.getRentals();
    equipmentIds = rentals
      .filter((r) => r.customer_id === userId && (r.status === 'ON_GOING' || r.status === 'APPROVED'))
      .map((r) => r.equipment_id);
  }

  const filter = normalizeFleetFilter({
    engine: c.req.query('engine'),
    movement: c.req.query('movement'),
    fuel: c.req.query('fuel'),
    search: c.req.query('search'),
  });

  const points = await db.getGpsTracking();
  const view = buildFleetTelemetry(points, { role, equipmentIds }, filter);

  return c.json({
    success: true,
    data: view,
    meta: {
      total: view.rows.length,
      raw_points: view.rawPointCount,
      scope: role === 'CUSTOMER' ? 'UNIT_SEWA_SAYA' : 'SELURUH_ARMADA',
      role,
    },
  });
});

// Reports API
/**
 * Titik GPS mentah untuk cermin browser.
 *
 * CUSTOMER hanya menerima titik unit yang sedang/segera ia sewa — cermin
 * tidak pernah memuat posisi armada orang lain.
 */
app.get('/api/gps', async (c) => {
  const role = c.get('role');
  const userId = c.get('userId');
  const points = await db.getGpsTracking();

  if (role === 'CUSTOMER') {
    const rentals = await db.getRentals();
    const milikSaya = new Set(
      rentals
        .filter((r) => r.customer_id === userId && (r.status === 'ON_GOING' || r.status === 'APPROVED'))
        .map((r) => r.equipment_id)
    );
    return c.json(points.filter((g) => milikSaya.has(g.equipment_id)));
  }

  return c.json(points);
});

/** Pembaruan profil sendiri (nama, kontak, perusahaan) oleh pengguna mana pun.
 *  Field sensitif (role/status/username) dibuang di db.updateUser. */
daftarUsers(app);
// Fallback to Cloudflare Static Assets
app.all('*', async (c) => {
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default app;
