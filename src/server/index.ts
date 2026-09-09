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
import type { RoleName, ReportId, User } from '../types';
import type { Equipment, Rental, Maintenance } from '../types';
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
} from '../lib/validators';
import type { ValidatedEquipmentInput, ValidatedUserInput } from '../lib/validators';
import { getEquipmentImage } from '../lib/stitchAssets';
import {
  buildReport,
  isReportId,
  normalizeRange,
  REPORT_CATALOG,
} from '../lib/reports';
import type { ReportDataSource } from '../lib/reports';

/** Laporan yang tampil pertama kali saat halaman dibuka. */
const DEFAULT_REPORT_ID: ReportId = REPORT_CATALOG[0].id;

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

/**
 * Bentuk pengguna yang aman dikirim ke klien.
 * Tidak memiliki `password_hash` — mencegah kebocoran kredensial.
 */
interface PublicUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  company_name: string | null;
  role_id: number;
  role_name?: User['role_name'];
  status: User['status'];
}

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

/**
 * Helper: membaca body JSON dengan aman.
 * Mengembalikan null bila body tidak valid agar handler bisa merespons 400,
 * bukan membiarkan Worker melempar exception 500.
 */
async function readJsonBody<T = Record<string, unknown>>(
  c: { req: { json: () => Promise<unknown> } }
): Promise<T | null> {
  try {
    return (await c.req.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Helper: mem-parsing parameter ID dari URL.
 * Mengembalikan null bila bukan angka bulat positif.
 */
function parseId(raw: string | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const BAD_ID = { success: false, error: { code: 'INVALID_ID', message: 'ID tidak valid.' } } as const;
const BAD_JSON = { success: false, error: { code: 'INVALID_JSON', message: 'Format request tidak valid.' } } as const;

/**
 * Membentuk respons 400 untuk kegagalan validasi form.
 * `errors` berisi pesan per-field sehingga klien bisa menandai input yang salah.
 */
function badValidation(
  errors: Record<string, string | undefined>
): { success: false; error: { code: string; message: string; errors: Record<string, string | undefined> } } {
  const pertama = Object.values(errors).find(m => typeof m === 'string' && m.length > 0) ?? 'Data tidak valid.';
  return {
    success: false,
    error: { code: 'VALIDATION_ERROR', message: pertama, errors },
  };
}

/** Mengubah `FieldErrors` (nilai boleh undefined) menjadi pesan per-field. */
function toErrorBag<K extends string>(errors: Partial<Record<K, string>>): Record<string, string | undefined> {
  return { ...errors };
}

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
  if (!ok) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Unit tidak ditemukan.' } }, 404);

  return c.json({ success: ok });
});

// Rentals API
app.get('/api/rentals', async (c) => {
  const items = await db.getRentals();
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

  const newItem = await db.addRental(body);
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
        conflicts,
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
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  const body = await readJsonBody<{ status?: unknown }>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  // Validasi status agar tidak ada nilai sembarang yang masuk ke data.
  const STATUS_VALID = ['PENDING', 'APPROVED', 'ON_GOING', 'COMPLETED', 'REJECTED'] as const;
  if (typeof body.status !== 'string' || !STATUS_VALID.includes(body.status as typeof STATUS_VALID[number])) {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: `Status harus salah satu dari: ${STATUS_VALID.join(', ')}.` } },
      400
    );
  }

  // Bila rental akan mengunci unit (APPROVED / ON_GOING), pastikan unit
  // tidak bentrok dengan rental aktif lain. Mencegah double-booking dari
  // jalur persetujuan staf.
  if (body.status === 'APPROVED' || body.status === 'ON_GOING') {
    const semuaRental = await db.getRentals();
    const target = semuaRental.find(r => r.id === id);
    if (!target) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental tidak ditemukan.' } }, 404);
    }

    const unit = (await db.getEquipments()).find(e => e.id === target.equipment_id);
    if (!unit) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Unit tidak ditemukan.' } }, 404);
    }

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
            message: `${describeBlockedReason(availability)} Persetujuan dibatalkan.`,
          },
        },
        409
      );
    }
  }

  const updated = await db.updateRentalStatus(id, body.status as typeof STATUS_VALID[number]);
  if (!updated) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental tidak ditemukan.' } }, 404);

  return c.json({ success: true, item: updated });
});

// Contracts API
app.get('/api/contracts', async (c) => {
  const items = await db.getContracts();
  return c.json(items);
});

app.post('/api/contracts/:id/sign', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  try {
    const updated = await db.signContract(id);
    if (!updated) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Kontrak tidak ditemukan.' } }, 404);
    return c.json({ success: true, item: updated });
  } catch (err) {
    // Kontrak sudah ditandatangani sebelumnya → jangan timpa bukti waktu.
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'KONTRAK_SUDAH_DITANDATANGANI') {
      return c.json(
        { success: false, error: { code: msg, message: 'Kontrak ini sudah ditandatangani sebelumnya.' } },
        409
      );
    }
    throw err;
  }
});

// Payments API
app.get('/api/payments', async (c) => {
  const items = await db.getPayments();
  return c.json(items);
});

app.post('/api/payments/:id/verify', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  // Body opsional; bila ada harus JSON valid.
  const body = await readJsonBody<{ staffId?: unknown; staffName?: unknown }>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  const staffId = typeof body.staffId === 'number' && body.staffId > 0 ? body.staffId : 3;
  const staffName = typeof body.staffName === 'string' && body.staffName.trim() ? body.staffName : 'Hendra Wijaya';

  try {
    const updated = await db.verifyPayment(id, staffId, staffName);
    if (!updated) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Pembayaran tidak ditemukan.' } }, 404);
    return c.json({ success: true, item: updated });
  } catch (err) {
    // Penolakan aturan bisnis: status bukan PENDING_VERIFICATION,
    // atau bukti transfer belum dilampirkan.
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'STATUS_PEMBAYARAN_TIDAK_VALID') {
      return c.json(
        { success: false, error: { code: msg, message: 'Pembayaran tidak menunggu verifikasi.' } },
        409
      );
    }
    if (msg === 'BUKTI_TRANSFER_BELUM_ADA') {
      return c.json(
        { success: false, error: { code: msg, message: 'Bukti transfer belum dilampirkan.' } },
        409
      );
    }
    throw err;
  }
});

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

/**
 * Endpoint agregasi 11 laporan operasional.
 *
 * RBAC: path ini berada di bawah `/api/reports` sehingga otomatis hanya
 * boleh diakses ADMIN & STAFF (lihat RBAC_MATRIX di src/lib/auth.ts).
 *
 * Query:
 *   id    — salah satu ReportId; default RENTAL_BULANAN
 *   from  — batas awal periode (YYYY-MM-DD), opsional
 *   to    — batas akhir periode (YYYY-MM-DD), opsional
 */
app.get('/api/reports/analytics', async (c) => {
  const rawId = c.req.query('id');
  const id = isReportId(rawId) ? rawId : (rawId === undefined || rawId === '' ? DEFAULT_REPORT_ID : null);

  if (id === null) {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Jenis laporan tidak dikenal.' } },
      400
    );
  }

  const range = normalizeRange(c.req.query('from') ?? '', c.req.query('to') ?? '');

  const source: ReportDataSource = {
    rentals: await db.getRentals(),
    equipments: await db.getEquipments(),
    users: await db.getUsers(),
    payments: await db.getPayments(),
    maintenance: await db.getMaintenance(),
    gps: await db.getGpsTracking(),
    reports: await db.getReports(),
  };

  const result = buildReport(id, source, range);

  return c.json({ success: true, data: result, meta: { total: result.totalRows } });
});

// Users API
// Catatan: field sensitif (password hash) TIDAK pernah dikirim ke klien.

/**
 * Whitelist field pengguna yang boleh dikirim ke klien.
 *
 * Dibuat terpusat (bukan inline) agar tidak ada satu pun respons yang lupa
 * membuang `password_hash` — penyebab umum kebocoran kredensial.
 */
function ringkasUser(u: {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  company_name: string | null;
  role_id: number;
  role_name?: User['role_name'];
  status: User['status'];
}): PublicUser {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.full_name,
    phone: u.phone,
    address: u.address,
    company_name: u.company_name,
    role_id: u.role_id,
    role_name: u.role_name,
    status: u.status,
  };
}

app.get('/api/users', async (c) => {
  const items = await db.getUsers();
  return c.json(items.map(ringkasUser));
});

/**
 * Pendaftaran pengguna baru oleh Administrator.
 *
 * Password TIDAK diterima lewat endpoint ini: Admin mendaftarkan identitas,
 * lalu pemilik akun menetapkan password sendiri melalui alur registrasi yang
 * memanggil `hashPassword()`. Karena itu `password_hash` disetel `null` dan
 * akun belum bisa login sampai password ditetapkan.
 */
app.post('/api/users', async (c) => {
  const body = await readJsonBody<unknown>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  const hasil = validateUserInput(body);
  if (!hasil.ok) return c.json(badValidation(toErrorBag(hasil.errors)), 400);

  const input: ValidatedUserInput = hasil.value;
  const users = await db.getUsers();

  // Username & email harus unik — keduanya dipakai sebagai identitas login.
  const usernameBentrok = users.some(
    u => u.username.toLowerCase() === input.username.toLowerCase()
  );
  if (usernameBentrok) {
    return c.json(badValidation({ username: `Username ${input.username} sudah digunakan.` }), 409);
  }

  const emailBentrok = users.some(u => u.email.toLowerCase() === input.email.toLowerCase());
  if (emailBentrok) {
    return c.json(badValidation({ email: 'Alamat email sudah terdaftar.' }), 409);
  }

  const newUser = await db.addUser({
    role_id: input.role_id,
    role_name: input.role_id === 1 ? 'ADMIN' : input.role_id === 2 ? 'STAFF' : 'CUSTOMER',
    username: input.username,
    email: input.email,
    full_name: input.full_name,
    phone: input.phone,
    address: input.address,
    company_name: input.company_name,
    status: 'ACTIVE',
    password_hash: null,
  });

  return c.json({ success: true, item: ringkasUser(newUser) }, 201);
});

app.post('/api/users/:id/toggle', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  // Mencegah admin menonaktifkan akunnya sendiri (bisa mengunci sistem).
  const operatorId = c.get('userId');
  if (typeof operatorId === 'number' && operatorId === id) {
    return c.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Anda tidak dapat menonaktifkan akun sendiri.' } },
      403
    );
  }

  const updated = await db.toggleUserStatus(id);
  if (!updated) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' } }, 404);

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
