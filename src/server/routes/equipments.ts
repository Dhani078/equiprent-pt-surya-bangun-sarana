/**
 * Rute API domain inventaris unit (master equipments).
 *
 * Dipisah dari `server/index.ts`; kerangka aplikasi (CORS, auth, RBAC,
 * error handler, fallback aset) tetap tinggal di `index.ts`.
 */
import type { Hono } from 'hono';
import {
  BAD_ID,
  BAD_JSON,
  auditActor,
  auditLog,
  badValidation,
  db,
  getEquipmentImage,
  parseId,
  readJsonBody,
  toErrorBag,
  validateEquipmentInput,
} from '../context';
import type { ValidatedEquipmentInput } from '../context';
import type { AppEnv } from '../http';

export function daftarEquipments(app: Hono<AppEnv>): void {
// Equipments API
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

  // Audit trail: pencatatan unit baru oleh Administrator.
  auditLog({
    ...auditActor(c),
    action: 'EQUIPMENT_CREATE',
    entity: 'equipment',
    entity_id: newItem.id,
    detail: `Unit ${newItem.equipment_code} (${newItem.name}) didaftarkan`,
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

  // Audit trail: perubahan master unit hanya oleh Administrator.
  auditLog({
    ...auditActor(c),
    action: 'EQUIPMENT_UPDATE',
    entity: 'equipment',
    entity_id: id,
    detail: `Unit ${updated.equipment_code} diperbarui (tarif Rp ${updated.rental_price_per_day}/hari, HM ${updated.hour_meter})`,
  });

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
  if (!ok) {
    return c.json(
      {
        success: false,
        error: {
          code: 'EQUIPMENT_HAS_HISTORY',
          message:
            `Unit ${unit.equipment_code} pernah dipakai dalam transaksi sewa. ` +
            'Riwayat, kontrak, dan laporannya harus tetap menunjuk ke unit ini — hapus tidak diperkenankan.',
        },
      },
      409
    );
  }

  // Audit trail: penghapusan unit berbahaya — pelakunya wajib tercatat.
  auditLog({
    ...auditActor(c),
    action: 'EQUIPMENT_DELETE',
    entity: 'equipment',
    entity_id: id,
    detail: `Unit ${unit.equipment_code} dihapus dari inventaris`,
  });

  return c.json({ success: true });
});
}
