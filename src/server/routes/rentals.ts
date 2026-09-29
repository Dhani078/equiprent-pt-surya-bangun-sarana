/**
 * Rute API domain transaksi sewa (rentals): CRUD, ketersediaan, dan
 * transisi status dengan gerang pembayaran.
 *
 * Dipisah dari `server/index.ts`; kerangka aplikasi (CORS, auth, RBAC,
 * error handler, fallback aset) tetap tinggal di `index.ts`.
 */
import type { Hono } from 'hono';
import {
  BAD_ID,
  BAD_JSON,
  RENTAL_STATUSES,
  auditActor,
  auditLog,
  badValidation,
  buildEquipmentAvailability,
  canTransition,
  checkPaymentGate,
  db,
  describeBlockedReason,
  getAllowedNextStatuses,
  getLateReturnInfo,
  getRentalConflicts,
  getTransitionEffect,
  isRentalStatus,
  isUnitOutOfService,
  parseId,
  readJsonBody,
  summarizeAvailability,
  summarizeRentalPayment,
  toErrorBag,
} from '../context';
import type { BlockedReason, Equipment, EquipmentAvailability, Rental, RentalStatus } from '../context';
import type { AppEnv } from '../http';

export function daftarRentals(app: Hono<AppEnv>): void {
// Rentals API
// Rentals API

/**
 * Daftar transaksi sewa.
 *
 * PERBAIKAN KEAMANAN (IDOR): sebelumnya seluruh transaksi seluruh pelanggan
 * dikirim ke siapa pun yang punya sesi — termasuk pelanggan lain. Sekarang
 * pelanggan hanya menerima transaksi miliknya sendiri.
 */
app.get('/api/rentals', async (c) => {
  const items = await db.getRentals();

  if (c.get('role') === 'CUSTOMER') {
    const userId = c.get('userId');
    return c.json(items.filter((r) => r.customer_id === userId));
  }

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

  // Pelanggan hanya boleh memesan atas namanya sendiri: `customer_id` dari
  // body diabaikan dan diganti identitas sesi, sehingga tidak ada transaksi
  // yang bisa dibuat atas nama pelanggan lain.
  const payload =
    c.get('role') === 'CUSTOMER'
      ? { ...body, customer_id: c.get('userId') }
      : body;

  const newItem = await db.addRental(payload);

  // Audit trail: pengajuan/transaksi sewa baru.
  auditLog({
    ...auditActor(c),
    action: 'RENTAL_CREATE',
    entity: 'rental',
    entity_id: newItem.id,
    detail: `Rental ${newItem.rental_code} dibuat — unit ${newItem.equipment_code} (${newItem.total_days} hari)`,
  });

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
        // Rincian bentrokan memuat data transaksi pelanggan lain, jadi hanya
        // dibuka untuk pengguna internal. Pelanggan cukup tahu bisa/tidak.
        conflicts: c.get('role') === 'CUSTOMER' ? [] : conflicts,
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
  // Perubahan status sewa adalah wewenang perusahaan. Pelanggan tidak boleh
  // menyetujui atau mengoperasikan sewanya sendiri.
  if (c.get('role') === 'CUSTOMER') {
    return c.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Perubahan status sewa dilakukan oleh Admin atau Staf Operasional.',
        },
      },
      403
    );
  }

  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  const body = await readJsonBody<{ status?: unknown; overrideUnpaid?: unknown }>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  // Status harus salah satu ENUM yang diakui skema tabel `rentals`.
  if (!isRentalStatus(body.status)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Status harus salah satu dari: ${RENTAL_STATUSES.join(', ')}.`,
        },
      },
      400
    );
  }

  const targetStatus: RentalStatus = body.status;

  const semuaRental = await db.getRentals();
  const target = semuaRental.find(r => r.id === id);
  if (!target) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental tidak ditemukan.' } }, 404);
  }

  // Alur wajib mengikuti matriks transisi terpusat: mencegah lompatan status
  // (misal PENDING → COMPLETED) yang bisa memalsukan laporan pendapatan.
  const transisi = canTransition(target.status, targetStatus);
  if (!transisi.allowed) {
    return c.json(
      { success: false, error: { code: 'INVALID_STATUS_TRANSITION', message: transisi.reason } },
      409
    );
  }

  const unit = (await db.getEquipments()).find(e => e.id === target.equipment_id);
  if (!unit) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Unit tidak ditemukan.' } }, 404);
  }

  // Transisi yang mengunci unit wajib lolos uji bentrokan jadwal.
  // Mencegah double-booking dari jalur persetujuan staf.
  if (getTransitionEffect(targetStatus).equipmentStatus === 'RENTED') {
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
            message: `${describeBlockedReason(availability)} Perubahan status dibatalkan.`,
          },
        },
        409
      );
    }
  }

  // -------------------------------------------------------------------------
  // GERBANG PEMBAYARAN (aturan bisnis §4.3 poin 4)
  // Sewa hanya boleh BEROPERASI (ON_GOING) bila tagihannya sudah lunas.
  // -------------------------------------------------------------------------
  const kontrakSewa = (await db.getContracts())
    .filter(kontrak => kontrak.rental_id === target.id)
    .map(kontrak => kontrak.id);
  const statusBayar = summarizeRentalPayment(await db.getPayments(), kontrakSewa);

  // Override hanya dihormati untuk ADMIN (bukan sekadar diklaim di body).
  const mintaOverride = body.overrideUnpaid === true;
  const gerbang = checkPaymentGate(targetStatus, statusBayar, {
    role: c.get('role'),
    override: mintaOverride,
  });

  if (!gerbang.allowed) {
    return c.json(
      {
        success: false,
        error: { code: gerbang.code, message: gerbang.message },
      },
      409
    );
  }

  let updated;
  try {
    updated = await db.updateRentalStatus(id, targetStatus, {
      overrideUnpaid: gerbang.allowed && gerbang.requiresPaid ? gerbang.overrideUsed : false,
    });
  } catch (err) {
    // Lapisan data menolak karena tagihan belum lunas (jalan override tidak
    // sah dari klien). Tangani di sini agar tidak menjadi error 500.
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'TAGIHAN_BELUM_LUNAS') {
      return c.json(
        {
          success: false,
          error: {
            code: msg,
            message:
              'Pembayaran atas sewa ini belum terverifikasi lunas. Verifikasi bukti transfer terlebih dahulu sebelum unit dioperasikan.',
          },
        },
        409
      );
    }
    throw err;
  }

  if (!updated) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Rental tidak ditemukan.' } }, 404);

  // Audit trail
  auditLog({
    ...auditActor(c),
    action: 'RENTAL_STATUS_CHANGE',
    entity: 'rental',
    entity_id: id,
    detail: `Status rental #${id} diubah ke ${targetStatus}`,
  });

  // Denda keterlambatan dihitung oleh modul yang sama dengan UI & dokumen
  // cetak, sehingga angka di API tidak bisa menyimpang dari layar.
  const denda = getLateReturnInfo(updated, { referenceAt: new Date() });

  return c.json({
    success: true,
    item: updated,
    meta: {
      lateDays: denda.lateDays,
      penalty: denda.penalty,
      allowedNext: getAllowedNextStatuses(targetStatus),
      // Dibawa ikut agar UI dapat menjelaskan MENGAPA transisi ini
      // diizinkan (lunas atau override Admin) tanpa menebak-nebak.
      paymentStatus: statusBayar,
      paymentOverride: gerbang.allowed && gerbang.requiresPaid ? gerbang.overrideUsed : false,
    },
  });
});
}
