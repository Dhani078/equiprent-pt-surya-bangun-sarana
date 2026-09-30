/**
 * Middleware global Worker: CORS, security headers, autentikasi + RBAC,
 * dan error handler.
 *
 * Semua bagian pipeline /api/* dipindah dari `index.ts` tanpa perubahan
 * logika; `pasangMiddleware(app)` mendaftarkannya ke instance Hono.
 */
import type { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './http';
import {
  SESSION_HEADER,
  configureDatabaseUrl,
  configureSessionSecret,
  daftarOriginDiizinkan,
  getDataMode,
  hydrasiDariTiDB,
  isDatabaseConnected,
  isPathAllowedForRole,
  isSessionSecretEphemeral,
  verifySessionToken,
  warmSettings,
  PUBLIC_API_PATHS,
} from './context';

type App = Hono<AppEnv>;

/**
 * CORS — hanya origin terdaftar yang diizinkan.
 *
 * `cors()` tanpa argumen memantulkan origin mana pun, sehingga situs pihak
 * ketiga bebas memanggil API ini dari browser korban.
 */
export function pasangCors(app: App): void {
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
}

/** Security headers untuk seluruh respons API. */
export function pasangSecurityHeaders(app: App): void {
  app.use('/api/*', async (c, next) => {
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'geolocation=(), microphone=()');
    c.header('Cache-Control', 'no-store');
    await next();
  });
}

/**
 * Middleware autentikasi & RBAC.
 *
 * Berjalan untuk semua route /api/* KECUALI health & login (PUBLIC_API_PATHS).
 * Menghubungkan secret & TiDB, menghidrasi stateStore, lalu memverifikasi
 * token sesi dan hak akses per role.
 */
export function pasangAuthRbac(app: App): void {
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
}

/**
 * Health check — status runtime & koneksi database.
 *
 * `data_mode` dilaporkan apa adanya: pada IN_MEMORY_DEMO seluruh perubahan
 * hanya hidup di memori isolate dan hilang saat isolate diganti.
 */
export function pasangHealthCheck(app: App): void {
  app.get('/api/health', (c) => {
    return c.json({
      status: 'online',
      app: 'PT. SURYA BANGUN SARANA BANJARMASIN',
      runtime: 'Cloudflare Workers Edge',
      database: 'TiDB Cloud Serverless',
      database_connected: isDatabaseConnected(),
      data_mode: getDataMode(),
      // true = SESSION_SECRET belum dikonfigurasi, kunci acak sementara dipakai
      // sehingga semua sesi gugur setiap isolate baru dimuat.
      session_secret_ephemeral: isSessionSecretEphemeral(),
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Error handler global.
 *
 * Detail exception dicatat di log server (observability Workers) supaya
 * insiden bisa ditelusuri, tetapi TIDAK pernah dikirim ke client.
 */
export function pasangErrorHandler(app: App): void {
  app.onError((err, c) => {
    console.error('[API_ERROR]', new URL(c.req.url).pathname, err);

    return c.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server.' },
      },
      500
    );
  });
}
