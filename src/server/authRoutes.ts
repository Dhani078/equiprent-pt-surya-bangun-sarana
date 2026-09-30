/**
 * Route autentikasi: login & ganti password sendiri.
 *
 * Dipindahkan dari `index.ts` tanpa perubahan logika; `daftarkanAuthRoutes(app)`
 * mendaftarkan kedua endpoint ke instance Hono.
 */
import type { Hono } from 'hono';
import type { AppEnv } from './http';
import {
  BAD_JSON,
  MIN_PASSWORD_LENGTH,
  SESSION_TTL_SECONDS,
  auditActor,
  auditLog,
  badValidation,
  bolehAkunDemo,
  createSessionToken,
  db,
  readJsonBody,
} from './context';
import { clearRateLimit, isRateLimited } from './rateLimit';

type App = Hono<AppEnv>;

export function daftarkanAuthRoutes(app: App): void {
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
}
