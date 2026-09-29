/**
 * Rute API domain agregat dashboard (statistik & analitik operasional).
 *
 * Dipisah dari `server/index.ts`; kerangka aplikasi (CORS, auth, RBAC,
 * error handler, fallback aset) tetap tinggal di `index.ts`.
 */
import type { Hono } from 'hono';
import {
  buildDashboardStats,
  buildOperationalAnalytics,
  db,
} from '../context';
import type { AppEnv } from '../http';

export function daftarDashboard(app: Hono<AppEnv>): void {
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
}
