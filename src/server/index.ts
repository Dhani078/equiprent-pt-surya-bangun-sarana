import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db, isDatabaseConnected } from '../lib/db';
import {
  createSessionToken,
  verifySessionToken,
  isPathAllowedForRole,
  SESSION_HEADER,
  SESSION_TTL_SECONDS,
} from '../lib/auth';
import type { RoleName } from '../types';

type Bindings = {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  DATABASE_URL?: string;
  TIDB_HOST?: string;
};

type Variables = {
  /** Role pengguna yang sudah terverifikasi dari session token. */
  role: RoleName;
  userId: number;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS for API requests
app.use('/api/*', cors());

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------
app.onError((err, c) => {
  // Jangan pernah membocorkan detail exception ke client (stack trace, path file, dll).
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
  const path = new URL(c.req.url).pathname;

  // Endpoint publik — tidak butuh autentikasi.
  if (path === '/api/health' || path === '/api/auth/login') {
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

  // Otorisasi berbasis role — dicek di server, bukan di client.
  if (!isPathAllowedForRole(path, role)) {
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
  c.set('userId', result.payload.uid);
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

  if (!entry || now - entry.firstAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAt: now });
    return false;
  }

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

  const check = await db.verifyCredentials(username, password);

  if (!check.ok) {
    // Pesan sengaja dibuat seragam untuk mencegah username enumeration.
    const message =
      check.reason === 'SUSPENDED'
        ? 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.'
        : 'Username atau password salah.';
    return c.json(
      { success: false, error: { code: check.reason, message } },
      401
    );
  }

  clearRateLimit(clientIp);

  const user = check.user;
  const token = await createSessionToken(user);

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

// Dashboard Stats Route
app.get('/api/dashboard/stats', async (c) => {
  const payments = await db.getPayments();
  const equipments = await db.getEquipments();
  const rentals = await db.getRentals();
  const users = await db.getUsers();

  const totalRevenue = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalCustomers = users.filter(u => u.role_id === 3).length;

  return c.json({
    totalRevenue,
    totalEquipments: equipments.length,
    availableEquipments: equipments.filter(e => e.status === 'AVAILABLE').length,
    rentedEquipments: equipments.filter(e => e.status === 'RENTED').length,
    maintenanceEquipments: equipments.filter(e => e.status === 'MAINTENANCE').length,
    totalRentals: rentals.length,
    activeRentals: rentals.filter(r => r.status === 'ON_GOING' || r.status === 'APPROVED').length,
    totalCustomers
  });
});

// Equipments API
app.get('/api/equipments', async (c) => {
  const items = await db.getEquipments();
  return c.json(items);
});

app.post('/api/equipments', async (c) => {
  const body = await c.req.json();
  const newItem = await db.addEquipment(body);
  return c.json({ success: true, item: newItem }, 201);
});

app.put('/api/equipments/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const updated = await db.updateEquipment(id, body);
  return c.json({ success: true, item: updated });
});

app.delete('/api/equipments/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const ok = await db.deleteEquipment(id);
  return c.json({ success: ok });
});

// Rentals API
app.get('/api/rentals', async (c) => {
  const items = await db.getRentals();
  return c.json(items);
});

app.post('/api/rentals', async (c) => {
  const body = await c.req.json();
  const newItem = await db.addRental(body);
  return c.json({ success: true, item: newItem }, 201);
});

app.put('/api/rentals/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  const { status } = await c.req.json();
  const updated = await db.updateRentalStatus(id, status);
  return c.json({ success: true, item: updated });
});

// Contracts API
app.get('/api/contracts', async (c) => {
  const items = await db.getContracts();
  return c.json(items);
});

app.post('/api/contracts/:id/sign', async (c) => {
  const id = Number(c.req.param('id'));
  const updated = await db.signContract(id);
  return c.json({ success: true, item: updated });
});

// Payments API
app.get('/api/payments', async (c) => {
  const items = await db.getPayments();
  return c.json(items);
});

app.post('/api/payments/:id/verify', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const updated = await db.verifyPayment(id, body.staffId || 3, body.staffName || 'Hendra Wijaya');
  return c.json({ success: true, item: updated });
});

// Maintenance API
app.get('/api/maintenance', async (c) => {
  const items = await db.getMaintenance();
  return c.json(items);
});

app.post('/api/maintenance', async (c) => {
  const body = await c.req.json();
  const newItem = await db.scheduleMaintenance(body);
  return c.json({ success: true, item: newItem }, 201);
});

// GPS Telemetry API
app.get('/api/tracking', async (c) => {
  const items = await db.getGpsTracking();
  return c.json(items);
});

// Reports API
app.get('/api/reports', async (c) => {
  const items = await db.getReports();
  return c.json(items);
});

// Users API
app.get('/api/users', async (c) => {
  const items = await db.getUsers();
  return c.json(items);
});

app.post('/api/users/:id/toggle', async (c) => {
  const id = Number(c.req.param('id'));
  const updated = await db.toggleUserStatus(id);
  return c.json({ success: true, item: updated });
});

// Fallback to Cloudflare Static Assets
app.all('*', async (c) => {
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default app;
