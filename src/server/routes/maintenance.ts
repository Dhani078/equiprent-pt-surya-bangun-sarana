/**
 * Rute API domain pemeliharaan unit (maintenance).
 *
 * Dipisah dari `server/index.ts`; kerangka aplikasi (CORS, auth, RBAC,
 * error handler, fallback aset) tetap tinggal di `index.ts`.
 */
import type { Hono } from 'hono';
import {
  BAD_JSON,
  auditActor,
  auditLog,
  badValidation,
  db,
  readJsonBody,
  validateMaintenanceType,
} from '../context';
import type { Maintenance } from '../context';
import type { AppEnv } from '../http';

export function daftarMaintenance(app: Hono<AppEnv>): void {
// Maintenance API
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
}
