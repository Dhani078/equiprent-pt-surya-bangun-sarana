/**
 * Rute API domain Laporan & analitik.
 *
 * Dipisah dari `server/index.ts` supaya berkas rute tetap ringkas dan
 * terbaca sebagai daftar endpoint; kerangka aplikasi (CORS, auth, error
 * handler, fallback aset) tetap tinggal di `index.ts`.
 */
import type { Hono } from 'hono';
import {
  BAD_JSON,
  DEFAULT_REPORT_ID,
  applyKeywordFilter,
  badValidation,
  buildOperationalAnalytics,
  buildReport,
  buildTopCustomers,
  buildUtilisasiBulanan,
  db,
  isReportId,
  normalizeRange,
  parseId,
} from '../context';
import type {
  ReportDataSource,
} from '../context';
import type { AppEnv } from '../http';

export function daftarReports(app: Hono<AppEnv>): void {
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
 *   q     — kata kunci pencarian global, opsional (dipotong 100 karakter)
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

  const result = applyKeywordFilter(
    buildReport(id, source, range),
    c.req.query('q') ?? ''
  );

  return c.json({ success: true, data: result, meta: { total: result.totalRows } });
});
}
