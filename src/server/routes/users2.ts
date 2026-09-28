/**
 * Rute API domain action Pengguna (ubah data & aktif/nonaktif).
 *
 * Dipisah dari `server/index.ts` supaya berkas rute tetap ringkas dan
 * terbaca sebagai daftar endpoint; kerangka aplikasi (CORS, auth, error
 * handler, fallback aset) tetap tinggal di `index.ts`.
 */
import type { Hono } from 'hono';
import {
  BAD_ID,
  BAD_JSON,
  auditActor,
  auditLog,
  badValidation,
  db,
  parseId,
  readJsonBody,
  ringkasUser,
  toErrorBag,
  validateUserInput,
} from '../context';
import type {
  PublicUser,
  RoleName,
  User,
} from '../context';
import type { AppEnv } from '../http';

export function daftarUsers2(app: Hono<AppEnv>): void {
app.put('/api/users/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  // Satu orang hanya boleh mengurai profil dirinya sendiri.
  const userId = c.get('userId');
  if (userId !== id && c.get('role') !== 'ADMIN') {
    return c.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Tidak dapat mengubah profil pengguna lain.' } },
      403
    );
  }

  const body = await readJsonBody<Record<string, unknown>>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  const updated = await db.updateUser(id, {
    full_name: typeof body.full_name === 'string' ? body.full_name : undefined,
    email: typeof body.email === 'string' ? body.email : undefined,
    phone: typeof body.phone === 'string' ? body.phone : undefined,
    address: typeof body.address === 'string' ? body.address : undefined,
    company_name:
      body.company_name === null || typeof body.company_name === 'string' ? body.company_name : undefined,
  } as Partial<User>);
  if (!updated) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' } }, 404);
  }

  auditLog({
    ...auditActor(c),
    action: 'USER_UPDATE',
    entity: 'user',
    entity_id: id,
    detail: `Profil pengguna ${updated.username} diperbarui`,
  });

  return c.json({ success: true, item: ringkasUser(updated) });
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

  // Audit trail: mengaktifkan/menonaktifkan akun adalah aksi sensitif
  // (bisa melarikan pengguna keluar sistem), pelakunya wajib tercatat.
  auditLog({
    ...auditActor(c),
    action: 'USER_STATUS_TOGGLE',
    entity: 'user',
    entity_id: id,
    detail: `Status akun ${updated.username} diubah menjadi ${updated.status}`,
  });

  return c.json({ success: true, item: ringkasUser(updated) });
});
}
