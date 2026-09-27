# -*- coding: utf-8 -*-
"""Patch db.ts: hidrasi TiDB + write-through pada semua mutator."""
import io, re, sys

p = 'src/lib/db.ts'
s = io.open(p, encoding='utf-8', newline='').read()
NL = '\r\n' if '\r\n' in s[:2000] else '\n'
def A(x): return x.replace('\n', NL)

def rep(old, new, cnt=1):
    global s
    o, n = A(old), A(new)
    assert s.count(o) >= 1, "MISS: " + old[:70]
    s = s.replace(o, n, cnt)

# ---------------------------------------------------------------- 1. helper
rep("""/**
 * Eksekusi Query SQL ke TiDB Cloud Serverless.""", """/**
 * Normalisasi nilai DATE/DATETIME dari driver menjadi string.
 * DATE -> 'YYYY-MM-DD'; DATETIME/timestamp -> 'YYYY-MM-DD HH:MM:SS'.
 */
function strTanggal(v: unknown, hanyaTanggal = false): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) {
    const iso = v.toISOString().replace('T', ' ').replace('Z', '');
    return hanyaTanggal ? iso.slice(0, 10) : iso.slice(0, 19);
  }
  const t = String(v).replace('T', ' ').replace(/Z$/, '').trim();
  return hanyaTanggal ? t.slice(0, 10) : t;
}

/**
 * Write-through: setiap mutasi stateStore ikut ditulis ke TiDB (safer: DB
 * dulu, baru memori) — temuan audit siklus 59: sebelumnya CRUD hanya hidup
 * di memori isolate, reload/p isolate lain data hilang.
 * Menglempar PERSIST_GAGAL agar API jujur melaporkan kegagalan, bukan
 * berpura-pura sukses lalu datanya lenyap.
 */
async function wt(sql: string, params: unknown[], label: string): Promise<void> {
  if (!tidbClient) return; // IN_MEMORY_DEMO -> tulis memori saja
  try {
    await tidbClient.execute(sql, params);
  } catch (err) {
    console.error('[persist] gagal menulis', label, err);
    throw new Error('PERSIST_GAGAL');
  }
}

/**
 * Eksekusi Query SQL ke TiDB Cloud Serverless.""")

# ------------------------------------------------- 2. hidrasi (sesudah muatSettings block)
rep("""/**
 * Muat pengaturan sekali per isolate. Dipanggil middleware API; bila DB belum
 * terhubung, segera ditandai agar tidak mengulang setiap permintaan.
 */
export async function warmSettings(): Promise<void> {
  if (settingsDimuat) return;
  await muatSettings();
}""", """/**
 * Muat pengaturan sekali per isolate. Dipanggil middleware API; bila DB belum
 * terhubung, segera ditandai agar tidak mengulang setiap permintaan.
 */
export async function warmSettings(): Promise<void> {
  if (settingsDimuat) return;
  await muatSettings();
}

// ---------------------------------------------------------------------------
// Hidrasi stateStore dari TiDB (dipanggil middleware Worker saat cold-start)
// ---------------------------------------------------------------------------
// Sebelumnya stateStore selalu berisi seed GENERATED_* — padahal tabel TiDB
// berisi data produksi. Setelah hidrasi, memori Worker adalah CERMINAN TiDB;
// write-through menjaga cermin itu tidak menyimpang. Kegagalan hidrasi
// dibiarkan memakai seed (mode demo) dan dicatat, tanpa mengulang tiap request.

type Row = Record<string, unknown>;
let hidrasiDimuat = false;

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
const strN = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));

async function jalankanHidrasi(): Promise<void> {
  const [roleRows, userRows, eqRows, rentRows, ctrRows, payRows, mntRows, gpsRows, repRows] =
    await Promise.all([
      executeSql<Row>('SELECT * FROM `roles`'),
      executeSql<Row>('SELECT * FROM `users`'),
      executeSql<Row>('SELECT * FROM `equipments`'),
      executeSql<Row>('SELECT * FROM `rentals`'),
      executeSql<Row>('SELECT * FROM `contracts`'),
      executeSql<Row>('SELECT * FROM `payments`'),
      executeSql<Row>('SELECT * FROM `maintenance`'),
      executeSql<Row>('SELECT * FROM `gps_tracking`'),
      executeSql<Row>('SELECT * FROM `reports`'),
    ]);

  const roleNameById = new Map<number, RoleName>();
  for (const r of roleRows) {
    const nm = str(r.role_name);
    if (nm === 'ADMIN' || nm === 'STAFF' || nm === 'CUSTOMER') roleNameById.set(num(r.id), nm);
  }

  const users: User[] = userRows.map((r) => ({
    id: num(r.id),
    role_id: num(r.role_id),
    role_name: roleNameById.get(num(r.role_id)),
    username: str(r.username),
    email: str(r.email),
    full_name: str(r.full_name),
    phone: str(r.phone),
    address: str(r.address),
    company_name: strN(r.company_name),
    status: str(r.status) === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
    created_at: strTanggal(r.created_at) ?? undefined,
    password_hash: strN(r.password),
  }));

  const equipments: Equipment[] = eqRows.map((r) => ({
    id: num(r.id),
    equipment_code: str(r.equipment_code),
    name: str(r.name),
    type: str(r.type),
    model: str(r.model),
    brand: str(r.brand),
    hour_meter: num(r.hour_meter),
    rental_price_per_day: num(r.rental_price_per_day),
    status: (['AVAILABLE','RENTED','MAINTENANCE','UNAVAILABLE'].includes(str(r.status)) ? str(r.status) : 'AVAILABLE') as Equipment['status'],
    last_maintenance_date: strTanggal(r.last_maintenance_date, true),
    thumbnail_url: strN(r.thumbnail_url) ?? undefined,
    created_at: strTanggal(r.created_at) ?? undefined,
  }));

  const usersById = new Map(users.map((u) => [u.id, u]));
  const eqById = new Map(equipments.map((e) => [e.id, e]));

  const rentals: Rental[] = rentRows.map((r) => {
    const cust = usersById.get(num(r.customer_id));
    const eq = eqById.get(num(r.equipment_id));
    return {
      id: num(r.id),
      rental_code: str(r.rental_code),
      customer_id: num(r.customer_id),
      customer_name: cust?.full_name,
      company_name: cust?.company_name ?? undefined,
      equipment_id: num(r.equipment_id),
      equipment_name: eq?.name,
      equipment_code: eq?.equipment_code,
      booking_date: strTanggal(r.booking_date) ?? '',
      start_date: strTanggal(r.start_date, true) ?? '',
      end_date: strTanggal(r.end_date, true) ?? '',
      total_days: num(r.total_days),
      subtotal: num(r.subtotal),
      status: (['PENDING','APPROVED','ON_GOING','COMPLETED','REJECTED'].includes(str(r.status)) ? str(r.status) : 'PENDING') as Rental['status'],
      notes: strN(r.notes) ?? undefined,
    };
  });

  const rentalsById = new Map(rentals.map((r) => [r.id, r]));

  const contracts: Contract[] = ctrRows.map((r) => {
    const rent = rentalsById.get(num(r.rental_id));
    const cust = usersById.get(num(r.customer_id));
    return {
      id: num(r.id),
      contract_code: str(r.contract_code),
      rental_id: num(r.rental_id),
      rental_code: rent?.rental_code,
      customer_id: num(r.customer_id),
      customer_name: cust?.full_name,
      contract_date: strTanggal(r.contract_date, true) ?? '',
      valid_until: strTanggal(r.valid_until, true) ?? '',
      document_path: strN(r.document_path) ?? undefined,
      terms_conditions: str(r.terms_conditions),
      is_signed_customer: num(r.is_signed_customer),
      signed_at: strTanggal(r.signed_at),
      signer_name: strN(r.signer_name),
      signature_data_url: strN(r.signature_data_url),
    };
  });

  const contractsById = new Map(contracts.map((x) => [x.id, x]));

  const payments: Payment[] = payRows.map((r) => {
    const ctr = contractsById.get(num(r.contract_id));
    const cust = usersById.get(num(r.customer_id));
    const verif = usersById.get(num(r.verified_by));
    return {
      id: num(r.id),
      payment_code: str(r.payment_code),
      contract_id: num(r.contract_id),
      contract_code: ctr?.contract_code,
      customer_id: num(r.customer_id),
      customer_name: cust?.full_name,
      amount: num(r.amount),
      payment_method: str(r.payment_method),
      payment_proof_path: strN(r.payment_proof_path) ?? undefined,
      status: (['UNPAID','PENDING_VERIFICATION','PAID','FAILED'].includes(str(r.status)) ? str(r.status) : 'UNPAID') as Payment['status'],
      payment_date: strTanggal(r.payment_date) ?? '',
      verified_by: r.verified_by === null || r.verified_by === undefined ? null : num(r.verified_by),
      verified_by_name: verif?.full_name,
      verified_at: strTanggal(r.verified_at),
    };
  });

  const maintenance: Maintenance[] = mntRows.map((r) => {
    const eq = eqById.get(num(r.equipment_id));
    const tek = usersById.get(num(r.technician_id));
    return {
      id: num(r.id),
      maintenance_code: str(r.maintenance_code),
      equipment_id: num(r.equipment_id),
      equipment_name: eq?.name,
      equipment_code: eq?.equipment_code,
      scheduled_date: strTanggal(r.scheduled_date, true) ?? '',
      completion_date: strTanggal(r.completion_date, true),
      maintenance_type: (['PREVENTIVE','CORRECTIVE','OVERHAUL'].includes(str(r.maintenance_type)) ? str(r.maintenance_type) : 'PREVENTIVE') as Maintenance['maintenance_type'],
      hour_meter_at_maintenance: num(r.hour_meter_at_maintenance),
      description: str(r.description),
      spareparts_replaced: strN(r.spareparts_replaced) ?? undefined,
      cost: num(r.cost),
      technician_id: r.technician_id === null || r.technician_id === undefined ? null : num(r.technician_id),
      technician_name: tek?.full_name,
      status: (['SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'].includes(str(r.status)) ? str(r.status) : 'SCHEDULED') as Maintenance['status'],
    };
  });

  const gps: GpsTracking[] = gpsRows.map((r) => {
    const eq = eqById.get(num(r.equipment_id));
    return {
      id: num(r.id),
      equipment_id: num(r.equipment_id),
      equipment_name: eq?.name,
      equipment_code: eq?.equipment_code,
      latitude: num(r.latitude),
      longitude: num(r.longitude),
      speed: num(r.speed),
      engine_status: str(r.engine_status) === 'ON' ? 'ON' : 'OFF',
      fuel_level_percent: num(r.fuel_level_percent),
      recorded_at: strTanggal(r.recorded_at) ?? '',
    };
  });

  const reports: ReportItem[] = repRows.map((r) => {
    const rent = rentalsById.get(num(r.rental_id));
    const gen = usersById.get(num(r.generated_by));
    return {
      id: num(r.id),
      report_code: str(r.report_code),
      rental_id: r.rental_id === null || r.rental_id === undefined ? null : num(r.rental_id),
      rental_code: rent?.rental_code,
      report_type: (['BAST_IN','BAST_OUT','SURAT_JALAN','FINANCIAL_SUMMARY'].includes(str(r.report_type)) ? str(r.report_type) : 'BAST_OUT') as ReportItem['report_type'],
      generated_by: num(r.generated_by),
      generated_by_name: gen?.full_name,
      file_path: str(r.file_path),
      generated_at: strTanggal(r.generated_at) ?? '',
    };
  });

  stateStore.users = users;
  stateStore.equipments = equipments;
  stateStore.rentals = rentals;
  stateStore.contracts = contracts;
  stateStore.payments = payments;
  stateStore.maintenance = maintenance;
  stateStore.gps = gps;
  stateStore.reports = reports;
}

/**
 * Muat Cermin TiDB ke stateStore, sekali per isolate. Dipanggil middleware
 * sebelum route apa pun menyentuh data. Mode demo (tanpa DATABASE_URL) tidak
 * pernah masuk fungsi ini.
 */
export async function hydrasiDariTiDB(): Promise<void> {
  if (hidrasiDimuat || !tidbClient) return;
  hidrasiDimuat = true;
  try {
    await jalankanHidrasi();
  } catch (err) {
    // Gagal hidrasi: biarkan seed demo melayani (jujur via getDataMode?
    // mode pelaporan tetap TIDB karena tulis-tembus juga gagal dan meledak
    // sendiri) — cukup catat di log Worker.
    console.error('[persist] hidrasi TiDB gagal; state tetap seed demo:', err);
  }
}""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print("bagian 1 ok, len:", len(s))
