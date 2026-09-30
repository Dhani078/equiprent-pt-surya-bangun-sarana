/**
 * Titik masuk Worker (Entrypoint).
 *
 * Sebelumnya satu berkas 423 baris yang memuat middleware, rate limiting,
 * dan route autentikasi; kini ketiganya dipindah ke modul terfokus:
 * - `middleware.ts` — CORS, security headers, autentikasi + RBAC, health check, error handler.
 * - `rateLimit.ts` — counter anti brute-force login.
 * - `authRoutes.ts` — endpoint login & ganti password.
 *
 * `index.ts` hanya merangkai pipeline lalu mendaftarkan route per domain.
 */
import { Hono } from 'hono';
import type { AppEnv, Bindings } from './http';

import { daftarDashboard } from './routes/dashboard';
import { daftarEquipments } from './routes/equipments';
import { daftarRentals } from './routes/rentals';
import { daftarContracts } from './routes/contracts';
import { daftarPayments } from './routes/payments';
import { daftarMaintenance } from './routes/maintenance';
import { daftarTracking } from './routes/tracking';
import { daftarUsers } from './routes/users';
import { daftarUsers2 } from './routes/users2';
import { daftarReports } from './routes/reports';
import { daftarAudit } from './routes/audit';

import {
  pasangCors,
  pasangSecurityHeaders,
  pasangAuthRbac,
  pasangHealthCheck,
  pasangErrorHandler,
} from './middleware';
import { daftarkanAuthRoutes } from './authRoutes';

const app = new Hono<AppEnv>();

pasangErrorHandler(app);
pasangCors(app);
pasangSecurityHeaders(app);
pasangAuthRbac(app);
pasangHealthCheck(app);
daftarkanAuthRoutes(app);

// ---------------------------------------------------------------------------
// Route per domain
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

// Fallback to Cloudflare Static Assets
app.all('*', async (c) => {
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default app;
