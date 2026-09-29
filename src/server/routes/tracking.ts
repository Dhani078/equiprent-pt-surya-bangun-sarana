/**
 * Titik GPS mentah untuk cermin browser + agregat telemetri armada.
 *
 * Dipisah dari `server/index.ts`. CUSTOMER hanya menerima titik unit yang
 * sedang/segera ia sewa — cermin tidak pernah memuat posisi armada orang lain.
 */
import type { Hono } from 'hono';
import {
  buildFleetTelemetry,
  db,
  normalizeFleetFilter,
} from '../context';
import type { AppEnv } from '../http';

export function daftarTracking(app: Hono<AppEnv>): void {
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
});}
