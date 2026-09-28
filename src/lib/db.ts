import { connect } from '@tidbcloud/serverless';
import { RoleName, User, Equipment, Rental, Contract, Payment, Maintenance, GpsTracking, ReportItem } from '../types';
import { hashPassword, isDemoAccount, isStoredPasswordHash, SESSION_HEADER, verifyPassword } from './auth';
import { headerSesi } from './authClient';
import { tambahAntrean, bacaAntrean, buangAntreanKe, type AntreanMutasi } from './offlineQueue';
import { getTransitionEffect } from './rentalWorkflow';
import { setLatePenaltyPerDay } from './businessRules';
import { canChangePaymentStatus, summarizeRentalPayment } from './paymentWorkflow';
import { buildContractTermsText, generateContractCode } from './contracts';
import {
  GENERATED_USERS,
  GENERATED_EQUIPMENTS,
  GENERATED_RENTALS,
  GENERATED_CONTRACTS,
  GENERATED_PAYMENTS,
  GENERATED_MAINTENANCE,
  GENERATED_GPS,
  GENERATED_REPORTS,
} from './seedGenerator';

/**
 * Data demo yang dipakai ketika TiDB Cloud belum terhubung.
 *
 * Dihasilkan oleh `seedGenerator.ts` agar konsisten secara relasional
 * (50 pengguna, 50 unit, 50 rental, 50 kontrak, 50 pembayaran,
 *  25 log servis, 55 titik GPS, 20 dokumen) sesuai dokumentasi.
 */
const DEMO_USERS = GENERATED_USERS;
const DEMO_EQUIPMENTS = GENERATED_EQUIPMENTS;
const DEMO_RENTALS = GENERATED_RENTALS;
const DEMO_CONTRACTS = GENERATED_CONTRACTS;
const DEMO_PAYMENTS = GENERATED_PAYMENTS;
const DEMO_MAINTENANCE = GENERATED_MAINTENANCE;
const DEMO_GPS = GENERATED_GPS;
const DEMO_REPORTS = GENERATED_REPORTS;

/** Ambil konfigurasi database dari environment secara aman untuk browser, edge, & node. */
function resolveEnv(): Record<string, string | undefined> {
  const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  if (metaEnv) return metaEnv;

  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env ?? {};
}

const envLookup = resolveEnv();
// HANYA `DATABASE_URL`. Prefiks `VITE_` sengaja TIDAK dipakai: nilai dengan
// prefiks itu ikut terbawa ke bundle klien (vite memasukkannya ke kode yang
// diunduh browser), sehingga kredensial database bocor ke publik. Worker
// Cloudflare hanya mengikat `DATABASE_URL` (server-only).
const databaseUrl = envLookup.DATABASE_URL ?? '';

/** Client TiDB. Null ketika DATABASE_URL belum dikonfigurasi → fallback ke in-memory store. */
type TidbClient = { execute: (sql: string, params: unknown[]) => Promise<unknown> };
let tidbClient: TidbClient | null = null;

if (databaseUrl && !databaseUrl.includes('your_username')) {
  try {
    tidbClient = connect({ url: databaseUrl }) as unknown as TidbClient;
  } catch {
    // Gagal inisialisasi → diamkan. Aplikasi tetap berjalan dengan in-memory store.
    tidbClient = null;
  }
}

/**
 * Worker TIDAK punya process.env — secret `DATABASE_URL` hanya datang lewat
 * binding `c.env`. Middleware memanggil ini sekali per cold-start; setelah
 * tidbClient terbentuk, panggilan berikut no-op.
 */
export const configureDatabaseUrl = (url?: string): void => {
  if (tidbClient || !url || url.includes('your_username')) return;
  try {
    tidbClient = connect({ url }) as unknown as TidbClient;
  } catch {
    tidbClient = null;
  }
};

/** Menandakan apakah aplikasi sedang terhubung ke database sungguhan. */
export const isDatabaseConnected = (): boolean => tidbClient !== null;

/**
 * Mode sumber data yang sedang aktif.
 *
 * Dilaporkan apa adanya oleh `/api/health` agar tidak ada kesalahpahaman:
 * pada mode `IN_MEMORY_DEMO`, seluruh perubahan hanya hidup di memori
 * isolate yang sedang menangani request dan akan hilang saat isolate diganti.
 */
export type DataMode = 'TIDB' | 'IN_MEMORY_DEMO';

export const getDataMode = (): DataMode => (tidbClient !== null ? 'TIDB' : 'IN_MEMORY_DEMO');

/**
 * Hasil verifikasi kredensial.
 * Discriminated union — memaksa pemanggil mengecek `ok` sebelum memakai `user`.
 */
export type AuthCheck =
  | { ok: true; user: User }
  | { ok: false; reason: 'NOT_FOUND' | 'BAD_PASSWORD' | 'SUSPENDED' | 'NO_PASSWORD_SET' };

// In-Memory Reactive Cache for Edge & Offline Simulation
export const stateStore = {
  users: [...DEMO_USERS] as User[],
  equipments: [...DEMO_EQUIPMENTS] as Equipment[],
  rentals: [...DEMO_RENTALS] as Rental[],
  contracts: [...DEMO_CONTRACTS] as Contract[],
  payments: [...DEMO_PAYMENTS] as Payment[],
  maintenance: [...DEMO_MAINTENANCE] as Maintenance[],
  gps: [...DEMO_GPS] as GpsTracking[],
  reports: [...DEMO_REPORTS] as ReportItem[],
};

/**
 * Menghasilkan ID baru yang bebas bentrok.
 *
 * Tidak memakai `panjang Array + 1`: bila sebuah baris dihapus, panjang array
 * menyusut dan ID lama akan dipakai ulang — dua entitas berbeda lalu berbagi
 * satu ID (data laporan & riwayat jadi kacau). `maksimum + 1` aman.
 */
function nextId(daftar: ReadonlyArray<{ id: number }>): number {
  return daftar.reduce((maks, item) => (item.id > maks ? item.id : maks), 0) + 1;
}

/**
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
 * Eksekusi Query SQL ke TiDB Cloud Serverless.
 *
 * CATATAN KEAMANAN: Parameter WAJIB dikirim terpisah (parameterized query).
 * Jangan pernah menyisipkan nilai langsung ke dalam string SQL.
 */
export async function executeSql<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (tidbClient) {
    const results = await tidbClient.execute(sql, params);
    return results as T[];
  }
  // Database belum dikonfigurasi → kembalikan array kosong.
  return [] as T[];
}


// ---------------------------------------------------------------------------
// Jembatan browser -> Edge API (penyimpanan TERPUSAT, bukan memori tab)
// ---------------------------------------------------------------------------
// stateStore di browser hanyalah cermin tampilan; setiap mutasi DIJEMBAT ke
// Worker (yang sudah write-through ke TiDB). Tanpa ini, dua tab/browser beda
// tidak pernah saling melihat data, dan reload mengembalikan seed.
// Mode dev tanpa Worker (404/500 jaringan) -> lempar; pemanggil memutuskan
// fallback. Mode demo murni (tanpa DATABASE_URL di Worker) tetap jalan karena
// wt() no-op di sisi Worker.

let tokenBridge: string | null = null;

/** Login ulang senyap ke Edge API; mengembalikan token sesi (atau null). */
export type LoginUserApi = {
  id: number; username: string; full_name: string; role: string;
  role_id: number; email: string; company_name: string | null;
};

export type LoginHasil =
  | { ok: true; token: string; user: LoginUserApi }
  | { ok: false; offline: true }
  | { ok: false; offline?: undefined; message: string };

/**
 * Login ke Edge API. Membedakan tiga nasib: token diterima, server menolak
 * (pesan dari Worker diteruskan), atau Worker tidak terjangkau (dev murni ->
 * pemanggil boleh memakai verifikasi lokal).
 */
export async function loginApi(username: string, password: string): Promise<LoginHasil> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const body = (await res.json().catch(() => null)) as
      { token?: string; user?: LoginUserApi; error?: { message?: string } } | null;
    if (res.ok && body?.token && body.user) return { ok: true, token: body.token, user: body.user };
    if (res.status >= 400 && res.status < 500 && body?.error?.message) {
      return { ok: false, message: body.error.message };
    }
    return { ok: false, offline: true };
  } catch {
    return { ok: false, offline: true };
  }
}

/**
 * Teruskan mutasi stateStore ke Worker. `path` endpoint, `method` HTTP,
 * `body` payload. Melempar saat Worker menolak — stateStore sudah diubah lebih
 * dulu oleh pemanggil, jadi pemanggil WAJIB memanggil ini sebelum menaruh
 * hasil ke UI/refresh (urutan: tulis DB -> cermin memori -> render).
 */
/** Galat tingkat jaringan (fetch melempar TypeError) — bukan tolakan server. */
function galatJaringan(e: unknown): boolean {
  return e instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(String(e));
}

async function kirimKeApi(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<unknown> {
  if (typeof window === 'undefined') return null; // sisi Worker: wt() sudah menulis
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headerSesi(tokenBridge ? { [SESSION_HEADER]: tokenBridge } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    /* Siklus 70: jaringan putus -> simpan di antrean FIFO localStorage,
       kirim ulang otomatis saat pulih (flushAntreanOffline). Urutan antar
       mutasi terjaga karena antrean diproses berurutan dari kepala. */
    if (galatJaringan(e) && typeof localStorage !== 'undefined') {
      const masuk = tambahAntrean({ method, path, body, dibuatAt: Date.now() });
      if (masuk) {
        throw new Error('Jaringan putus — perubahan dimasukkan antrean dan akan terkirim otomatis saat pulih.');
      }
      throw new Error('Jaringan putus dan antrean offline penuh — perubahan tidak tersimpan.');
    }
    throw e;
  }
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    const err = (json as { error?: { message?: string } } | null)?.error?.message;
    throw new Error(err || `Gagal menyimpan ke server (HTTP ${res.status}).`);
  }
  return json?.item ?? json?.data ?? json;
}

/** Token sesi untuk jembatan API — diisi App setelah login. */
export const setApiBridgeToken = (token: string | null): void => {
  tokenBridge = token;
};

/**
 * Guard jembatan: browser tidak lagi menulis stateStore/wt() sendiri —
 * mutasi dilempar ke Worker (write-through TiDB), lalu cermin disegarkan.
 * `paths` koleksi yang disalin ulang dari server setelah sukses.
 */
async function lewatJembatan<T>(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const item = await kirimKeApi(method, path, body);
  const { sinkronCermin } = await import('./fetchCollection');
  await sinkronCermin();
  return item as T;
}

/**
 * Kirim ulang antrean offline secara FIFO (siklus 70). Dipanggil saat
 * koneksi pulih. Sukses -> buang item; tolakan server (4xx/5xx terukur,
 * mis. kode ganda/RBAC) -> buang + kumpulkan pesannya (mutasi kedaluwarsa
 * untuk kondisi sekarang); jaringan masih putus -> stop, sisanya menunggu.
 */
export async function flushAntreanOffline(): Promise<{ terkirim: number; ditolak: string[] }> {
  const terkirimList: number[] = [];
  const ditolak: string[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const antrean = bacaAntrean() as AntreanMutasi[];
    if (antrean.length === 0) break;
    const m = antrean[0];
    try {
      await kirimKeApi(m.method, m.path, m.body);
      terkirimList.push(1);
      buangAntreanKe(0);
    } catch (e) {
      if (galatJaringan(e)) break; // masih offline: simpan sisanya
      // Server menolak secara definitif -> buang agar tidak memblokir antrean.
      ditolak.push(String((e as Error).message || e));
      buangAntreanKe(0);
    }
  }
  if (terkirimList.length > 0) {
    const { sinkronCermin } = await import('./fetchCollection');
    await sinkronCermin();
  }
  return { terkirim: terkirimList.length, ditolak };
}

// CRUD Helpers
/** Kode + baris tagihan (UNPAID) untuk kontrak yang baru terbit. */
function buatTagihanKontrak(
  existing: ReadonlyArray<Payment>,
  contract: Contract,
  amount: number
): Payment {
  const tgl = new Date();
  const ymd = tgl.toISOString().slice(0, 10).replace(/-/g, '');
  const pref = `PAY-SBS-${ymd}-`;
  const urut = existing.filter((p) => p.payment_code.startsWith(pref)).length + 1;
  return {
    id: nextId(existing),
    payment_code: `${pref}${String(urut).padStart(3, '0')}`,
    contract_id: contract.id,
    contract_code: contract.contract_code,
    customer_id: contract.customer_id,
    customer_name: contract.customer_name,
    amount,
    payment_method: 'Belum dibayar',
    status: 'UNPAID',
    payment_date: tgl.toISOString().replace('T', ' ').slice(0, 19),
  };
}

// ponytail: tagihan tunggal per kontrak. Naikkan ke multi-invoice (DP +
// pelunasan + penalti) saat kebutuhan faktur parsial masuk backlog produk.
export const db = {
  // Users
  getUsers: async () => stateStore.users,
  getUserById: async (id: number) => stateStore.users.find(u => u.id === id),
  getUserByUsername: async (username: string) => stateStore.users.find(u => u.username.toLowerCase() === username.toLowerCase()),

  /**
   * Memverifikasi kredensial login: username + password + status akun.
   * Password di-hash dengan PBKDF2 (lihat src/lib/auth.ts).
   *
   * PERBAIKAN KEAMANAN: versi sebelumnya memanggil
   * `verifyPassword(password, '', user.username)` sehingga `password_hash`
   * milik pengguna SELALU diabaikan — hanya akun demo yang bisa login, dan
   * pengguna sungguhan tidak pernah bisa masuk walau password benar.
   * Sekarang hash tersimpan yang dipakai; jalur akun demo hanya berlaku bila
   * akun belum punya hash DAN mode demo diizinkan.
   */
  verifyCredentials: async (
    username: string,
    password: string,
    options: { allowDemoAccounts?: boolean } = {}
  ): Promise<AuthCheck> => {
    const user = stateStore.users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!user) return { ok: false, reason: 'NOT_FOUND' };

    // Akun yang disuspend tidak boleh login meski password benar.
    if (user.status === 'SUSPENDED') return { ok: false, reason: 'SUSPENDED' };

    const allowDemoAccounts = options.allowDemoAccounts !== false;
    const storedHash = isStoredPasswordHash(user.password_hash) ? user.password_hash : '';

    // Akun tanpa hash & bukan akun demo yang diizinkan → belum bisa login.
    if (!storedHash && !(allowDemoAccounts && isDemoAccount(user.username))) {
      return { ok: false, reason: 'NO_PASSWORD_SET' };
    }

    const passwordOk = await verifyPassword(password, storedHash, user.username, {
      allowDemoAccounts,
    });
    if (!passwordOk) return { ok: false, reason: 'BAD_PASSWORD' };

    return { ok: true, user };
  },

  /**
   * Menyetel (atau mengganti) password pengguna.
   *
   * Dipakai admin saat menerbitkan akun baru — `addUser()` sengaja tidak
   * menyimpan password, sehingga akun baru tidak bisa login sampai
   * passwordnya disetel lewat jalur ini.
   */
  /**
   * Ganti password diri sendiri lewat Edge API — tersedia untuk SEMUA role
   * (`/api/auth/change-password`), unlike /api/users/:id/password yang
   * wewenang Admin. Password lama wajib dibuktikan server.
   */
  changeOwnPassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await kirimKeApi('POST', '/api/auth/change-password', { oldPassword, newPassword });
  },
  setUserPassword: async (id: number, password: string) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<User>('POST', `/api/users/${id}/password`, { password });
    }
    const user = stateStore.users.find(u => u.id === id);
    if (!user) return undefined;

    const hash = await hashPassword(password, user.username);
    await wt('UPDATE `users` SET `password` = ? WHERE `id` = ?', [hash, id], 'setUserPassword');
    user.password_hash = hash;
    return user;
  },
  addUser: async (user: Omit<User, 'id'>) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<User>('POST', '/api/users', user);
    }
    const newUser: User = { ...user, id: nextId(stateStore.users) };
    await wt(
      'INSERT INTO `users` (`id`, `role_id`, `username`, `password`, `email`, `full_name`, `phone`, `address`, `company_name`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newUser.id, newUser.role_id, newUser.username, null, newUser.email, newUser.full_name, newUser.phone, newUser.address, newUser.company_name, newUser.status],
      'addUser'
    );
    stateStore.users.push(newUser);
    return newUser;
  },
  /**
   * Memperbarui data profil pengguna.
   *
   * Field sensitif (`id`, `username`, `role_id`, `role_name`, `status`,
   * `password_hash`) sengaja diabaikan agar halaman "Pengaturan Akun" tidak
   * bisa dipakai untuk menaikkan hak akses sendiri.
   */
  updateUser: async (id: number, data: Partial<User>) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<User>('PUT', `/api/users/${id}`, data);
    }
    const user = stateStore.users.find(u => u.id === id);
    if (!user) return undefined;

    const aman: Partial<User> = {};
    if (typeof data.full_name === 'string') aman.full_name = data.full_name;
    if (typeof data.email === 'string') aman.email = data.email;
    if (typeof data.phone === 'string') aman.phone = data.phone;
    if (typeof data.address === 'string') aman.address = data.address;
    if (data.company_name === null || typeof data.company_name === 'string') {
      aman.company_name = data.company_name;
    }

    const gabungan = { ...user, ...aman };
    await wt(
      'UPDATE `users` SET `email` = ?, `full_name` = ?, `phone` = ?, `address` = ?, `company_name` = ? WHERE `id` = ?',
      [gabungan.email, gabungan.full_name, gabungan.phone, gabungan.address, gabungan.company_name, id],
      'updateUser'
    );
    Object.assign(user, aman);
    return user;
  },

  toggleUserStatus: async (id: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<User>('POST', `/api/users/${id}/toggle`);
    }
    const u = stateStore.users.find(x => x.id === id);
    if (u) {
      const baru = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await wt('UPDATE `users` SET `status` = ? WHERE `id` = ?', [baru, id], 'toggleUserStatus');
      u.status = baru;
    }
    return u;
  },

  // Equipments
  getEquipments: async () => stateStore.equipments,
  getEquipmentById: async (id: number) => stateStore.equipments.find(e => e.id === id),
  addEquipment: async (eq: Omit<Equipment, 'id'>) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Equipment>('POST', '/api/equipments', eq);
    }
    const newEq: Equipment = { ...eq, id: nextId(stateStore.equipments) };
    await wt(
      'INSERT INTO `equipments` (`id`, `equipment_code`, `name`, `type`, `model`, `brand`, `hour_meter`, `rental_price_per_day`, `status`, `last_maintenance_date`, `thumbnail_url`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newEq.id, newEq.equipment_code, newEq.name, newEq.type, newEq.model, newEq.brand, newEq.hour_meter, newEq.rental_price_per_day, newEq.status, newEq.last_maintenance_date, newEq.thumbnail_url ?? null],
      'addEquipment'
    );
    stateStore.equipments.unshift(newEq);
    return newEq;
  },
  updateEquipment: async (id: number, data: Partial<Equipment>) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Equipment>('PUT', `/api/equipments/${id}`, data);
    }
    const eq = stateStore.equipments.find(e => e.id === id);
    if (eq) {
      const gabungan = { ...eq, ...data };
      await wt(
        'UPDATE `equipments` SET `name` = ?, `type` = ?, `model` = ?, `brand` = ?, `hour_meter` = ?, `rental_price_per_day` = ?, `status` = ?, `last_maintenance_date` = ?, `thumbnail_url` = ? WHERE `id` = ?',
        [gabungan.name, gabungan.type, gabungan.model, gabungan.brand, gabungan.hour_meter, gabungan.rental_price_per_day, gabungan.status, gabungan.last_maintenance_date, gabungan.thumbnail_url ?? null, id],
        'updateEquipment'
      );
      Object.assign(eq, data);
    }
    return eq;
  },
  deleteEquipment: async (id: number) => {
    // REFERENTIAL INTEGRITY: unit yang pernah dipakai dalam transaksi sewa
    // tidak boleh dihapus secara fisik — rental, kontrak, pembayaran, dan
    // laporan menunjuk ke equipment_id ini; menghapusnya membuat baris-baris
    // itu kehilangan referensi (nama/kode unit hilang dari riwayat & cetakan).
    // Lapisan API sudah memblokir unit dalam sewa AKTIF; ini menjaga
    // RIWAYAT (COMPLETED/REJECTED) yang sah ada.
    if (typeof window !== 'undefined') {
      await lewatJembatan('DELETE', `/api/equipments/${id}`);
      return true;
    }
    const punyaRiwayat = stateStore.rentals.some((r) => r.equipment_id === id);
    if (punyaRiwayat) return false;

    const idx = stateStore.equipments.findIndex(e => e.id === id);
    if (idx !== -1) {
      await wt('DELETE FROM `equipments` WHERE `id` = ?', [id], 'deleteEquipment');
      stateStore.equipments.splice(idx, 1);
      return true;
    }
    return false;
  },

  // Rentals
  getRentals: async () => stateStore.rentals,
  addRental: async (rental: Omit<Rental, 'id' | 'rental_code'>) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Rental>('POST', '/api/rentals', rental);
    }
    const id = nextId(stateStore.rentals);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = `RNT-SBS-${dateStr}-${String(id).padStart(3, '0')}`;
    const newRental: Rental = {
      ...rental,
      id,
      rental_code: code,
      booking_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'PENDING'
    };
    await wt(
      'INSERT INTO `rentals` (`id`, `rental_code`, `customer_id`, `equipment_id`, `booking_date`, `start_date`, `end_date`, `total_days`, `subtotal`, `status`, `notes`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newRental.id, newRental.rental_code, newRental.customer_id, newRental.equipment_id, newRental.booking_date, newRental.start_date, newRental.end_date, newRental.total_days, newRental.subtotal, newRental.status, newRental.notes ?? null],
      'addRental'
    );
    stateStore.rentals.unshift(newRental);
    return newRental;
  },
  /**
   * Mengubah status rental sekaligus menjaga konsistensi status unit terkait.
   *
   * ATURAN BISNIS (satu sumber kebenaran: `src/lib/rentalWorkflow.ts`):
   * - ON_GOING   → unit dikunci menjadi RENTED (sedang di tangan pelanggan)
   * - COMPLETED  → unit dibebaskan menjadi AVAILABLE
   * - REJECTED   → unit dibebaskan menjadi AVAILABLE
   * - APPROVED   → unit BELUM dikunci (sewa bisa disetujui jauh hari sebelum
   *                mobilisasi; mengunci di sini membuat unit tidak bisa
   *                dipesan untuk periode lain yang sebenarnya sah)
   *
   * Unit hanya dibebaskan bila tidak sedang beroperasi di rental lain.
   */
  updateRentalStatus: async (
    id: number,
    status: Rental['status'],
    options: { overrideUnpaid?: boolean } = {}
  ) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Rental>('PUT', `/api/rentals/${id}/status`, {
        status,
        overrideUnpaid: options.overrideUnpaid ?? false,
      });
    }
    const r = stateStore.rentals.find(x => x.id === id);
    if (!r) return undefined;

    // GERBANG PEMBAYARAN (§4.3 poin 4): sewa hanya boleh BEROPERASI
    // (ON_GOING) bila tagihannya sudah terverifikasi lunas.
    // `overrideUnpaid` adalah wewenang ADMIN dan diteruskan apa adanya
    // dari lapisan API — bukan sesuatu yang bisa diminta klien sembarangan.
    if (status === 'ON_GOING' && !options.overrideUnpaid) {
      const kontrakIds = stateStore.contracts
        .filter(c => c.rental_id === r.id)
        .map(c => c.id);
      const statusBayar = summarizeRentalPayment(stateStore.payments, kontrakIds);

      if (statusBayar !== 'PAID') {
        throw new Error('TAGIHAN_BELUM_LUNAS');
      }
    }

    await wt('UPDATE `rentals` SET `status` = ? WHERE `id` = ?', [status, id], 'updateRentalStatus');
    r.status = status;

    const dampak = getTransitionEffect(status);

    if (dampak.equipmentStatus === 'RENTED') {
      const eq = stateStore.equipments.find(e => e.id === r.equipment_id);
      if (eq) {
        await wt('UPDATE `equipments` SET `status` = ? WHERE `id` = ?', ['RENTED', eq.id], 'rentalKunciUnit');
        eq.status = 'RENTED';
      }
    } else if (dampak.equipmentStatus === 'AVAILABLE') {
      // Unit hanya dibebaskan bila tidak ada rental lain yang sedang
      // beroperasi (ON_GOING) memakai unit yang sama.
      const masihBeroperasi = stateStore.rentals.some(
        other =>
          other.id !== r.id &&
          other.equipment_id === r.equipment_id &&
          other.status === 'ON_GOING'
      );
      if (!masihBeroperasi) {
        const eq = stateStore.equipments.find(e => e.id === r.equipment_id);
        if (eq) {
          await wt('UPDATE `equipments` SET `status` = ? WHERE `id` = ?', ['AVAILABLE', eq.id], 'rentalBebaskanUnit');
          eq.status = 'AVAILABLE';
        }
      }
    }

    return r;
  },

  // Contracts
  getContracts: async () => stateStore.contracts,

  /**
   * Menerbitkan kontrak baru untuk sebuah transaksi sewa.
   *
   * Kode kontrak disusun oleh `generateContractCode()` (satu-satunya
   * tempat aturan penomoran `SBS/CONTRACT/<YYYY>/<MM>/<SEQ>` hidup) agar
   * nomor yang tercetak di dokumen selalu identik dengan yang tersimpan.
   */
  createContract: async (rentalId: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Contract>('POST', '/api/contracts', { rentalId });
    }
    const rental = stateStore.rentals.find(r => r.id === rentalId);
    if (!rental) return undefined;

    // Satu kontrak per transaksi: menerbitkan ulang akan mengacaukan
    // rujukan pembayaran yang sudah terlanjur menunjuk kontrak lama.
    const existing = stateStore.contracts.find(c => c.rental_id === rentalId);
    if (existing) {
      throw new Error('KONTRAK_SUDAH_ADA');
    }

    const now = new Date();
    const contractDate = now.toISOString().slice(0, 10);
    const validUntil = rental.end_date;

    const id = nextId(stateStore.contracts);
    const contract: Contract = {
      id,
      contract_code: generateContractCode(stateStore.contracts, contractDate),
      rental_id: rental.id,
      rental_code: rental.rental_code,
      customer_id: rental.customer_id,
      customer_name: rental.customer_name,
      contract_date: contractDate,
      valid_until: validUntil,
      // Syarat & ketentuan baku diambil dari modul kontrak, bukan
      // ditulis ulang di sini, agar dokumen & pratinjau tidak menyimpang.
      terms_conditions: buildContractTermsText(),
      is_signed_customer: 0,
      signed_at: null,
      signer_name: null,
      signature_data_url: null,
    };

    await wt(
      'INSERT INTO `contracts` (`id`, `contract_code`, `rental_id`, `customer_id`, `contract_date`, `valid_until`, `terms_conditions`, `is_signed_customer`) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [contract.id, contract.contract_code, contract.rental_id, contract.customer_id, contract.contract_date, contract.valid_until, contract.terms_conditions],
      'createContract'
    );
    stateStore.contracts.push(contract);

    // Tagihan resmi dibuat SEKALIGUS dengan penerbitan kontrak. Tanpa ini
    // kontrak baru tidak pernah punya payment -> tab Pembayaran pelanggan
    // kosong dan alur verifikasi staf mustahil (temuan E2E siklus 61).
    const eq = stateStore.equipments.find(x => x.id === (rental as { equipment_id?: number }).equipment_id);
    const hari = Math.max(1, Math.round(
      (new Date(rental.end_date).getTime() - new Date(rental.start_date).getTime()) / 86_400_000
    ) + 1);
    const tarif = eq?.rental_price_per_day ?? 0;
    const tagihan = buatTagihanKontrak(stateStore.payments, contract, hari * tarif);
    await wt(
      'INSERT INTO `payments` (`id`, `payment_code`, `contract_id`, `customer_id`, `amount`, `payment_method`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tagihan.id, tagihan.payment_code, tagihan.contract_id, tagihan.customer_id, tagihan.amount, tagihan.payment_method, tagihan.status],
      'createContract:tagihan'
    );
    stateStore.payments.push(tagihan);
    return contract;
  },

  /**
   * Membubuhkan tanda tangan elektronik pada kontrak.
   *
   * `signerName` & `signature` sudah divalidasi oleh `validateContractSignature()`
   * di lapisan API sebelum sampai ke sini.
   */
  signContract: async (contractId: number, signerName: string, signature: string) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Contract>('POST', `/api/contracts/${contractId}/sign`, { signerName, signature });
    }
    const c = stateStore.contracts.find(x => x.id === contractId);
    if (!c) return undefined;

    // Kontrak yang sudah ditandatangani tidak boleh ditandatangani ulang:
    // signed_at adalah bukti waktu yang dipakai sebagai audit trail.
    if (c.is_signed_customer === 1) {
      throw new Error('KONTRAK_SUDAH_DITANDATANGANI');
    }

    const signedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `contracts` SET `is_signed_customer` = 1, `signed_at` = ?, `signer_name` = ?, `signature_data_url` = ? WHERE `id` = ?',
      [signedAt, signerName, signature, contractId],
      'signContract'
    );
    c.is_signed_customer = 1;
    c.signed_at = signedAt;
    c.signer_name = signerName;
    c.signature_data_url = signature;
    return c;
  },

  // Payments
  getPayments: async () => stateStore.payments,

  /** Hapus tagihan (UNPAID/FAILED/PENDING) beserta jejaknya. */
  hapusPayment: async (paymentId: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Payment>('DELETE', `/api/payments/${paymentId}`);
    }
    const idx = stateStore.payments.findIndex(x => x.id === paymentId);
    if (idx === -1) return undefined;
    await wt('DELETE FROM `payments` WHERE `id` = ?', [paymentId], 'hapusPayment');
    const [hapus] = stateStore.payments.splice(idx, 1);
    return hapus;
  },

  /** Hapus kontrak (belum lunas ditangani; dipanggil berurutan dgn tagihannya). */
  hapusKontrak: async (contractId: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Contract>('DELETE', `/api/contracts/${contractId}`);
    }
    const idx = stateStore.contracts.findIndex(x => x.id === contractId);
    if (idx === -1) return undefined;
    await wt('DELETE FROM `contracts` WHERE `id` = ?', [contractId], 'hapusKontrak');
    const [hapus] = stateStore.contracts.splice(idx, 1);
    return hapus;
  },

  /** Hapus pengajuan sewa (PENDING/Ditolak saja — dijaga rute). */
  hapusRental: async (rentalId: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Rental>('DELETE', `/api/rentals/${rentalId}`);
    }
    const idx = stateStore.rentals.findIndex(x => x.id === rentalId);
    if (idx === -1) return undefined;
    await wt('DELETE FROM `rentals` WHERE `id` = ?', [rentalId], 'hapusRental');
    const [hapus] = stateStore.rentals.splice(idx, 1);
    return hapus;
  },

  /**
   * Mengesahkan pembayaran menjadi PAID.
   *
   * Penjaga aturan bisnis (satu sumber kebenaran: `src/lib/paymentWorkflow.ts`):
   *   1. Transisi status harus sah (PENDING_VERIFICATION → PAID);
   *   2. Bukti transfer wajib sudah dilampirkan.
   *
   * Tanpa dua pemeriksaan ini, staf dapat mengesahkan tagihan yang belum
   * pernah dibayar — pendapatan pada laporan keuangan lalu fiktif.
   */
  verifyPayment: async (paymentId: number, staffUserId: number, staffName: string) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Payment>('POST', `/api/payments/${paymentId}/verify`, { staffId: staffUserId, staffName });
    }
    const p = stateStore.payments.find(x => x.id === paymentId);
    if (!p) return undefined;

    const transisi = canChangePaymentStatus(p.status, 'PAID');
    if (!transisi.allowed) throw new Error(transisi.code);

    // Hanya pembayaran yang menunggu verifikasi DAN sudah melampirkan bukti
    // transfer yang boleh ditandai PAID.
    const adaBukti = typeof p.payment_proof_path === 'string' && p.payment_proof_path.trim() !== '';
    if (!adaBukti) {
      throw new Error('BUKTI_TRANSFER_BELUM_ADA');
    }

    const verifiedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `payments` SET `status` = ?, `verified_by` = ?, `verified_at` = ? WHERE `id` = ?',
      ['PAID', staffUserId, verifiedAt, paymentId],
      'verifyPayment'
    );
    p.status = 'PAID';
    p.verified_by = staffUserId;
    p.verified_by_name = staffName;
    p.verified_at = verifiedAt;
    return p;
  },

  /**
   * Menolak bukti transfer yang tidak sah (PENDING_VERIFICATION → FAILED).
   *
   * Tagihan yang ditolak dapat dilampiri ulang bukti oleh pelanggan,
   * sehingga statusnya kembali PENDING_VERIFICATION (bukan status akhir).
   *
   * Kolom `verified_by*` dipakai sebagai jejak peninjau (bukan "verifikator"
   * semata): UI merender "Ditolak oleh …" untuk status FAILED, sehingga
   * tidak perlu menambah kolom baru pada skema yang sudah dimigrasi.
   */
  rejectPayment: async (paymentId: number, staffUserId: number, staffName: string) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Payment>('POST', `/api/payments/${paymentId}/reject`, { staffName });
    }
    const p = stateStore.payments.find(x => x.id === paymentId);
    if (!p) return undefined;

    const transisi = canChangePaymentStatus(p.status, 'FAILED');
    if (!transisi.allowed) throw new Error(transisi.code);

    const verifiedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `payments` SET `status` = ?, `verified_by` = ?, `verified_at` = ? WHERE `id` = ?',
      ['FAILED', staffUserId, verifiedAt, paymentId],
      'rejectPayment'
    );
    p.status = 'FAILED';
    p.verified_by = staffUserId;
    p.verified_by_name = staffName;
    p.verified_at = verifiedAt;
    return p;
  },

  /**
   * Melampirkan bukti transfer (UNPAID / FAILED → PENDING_VERIFICATION).
   *
   * `proofPath` sudah divalidasi oleh `validatePaymentProofPath()` di
   * lapisan API sebelum sampai ke sini.
   */
  addPaymentProof: async (paymentId: number, proofPath: string) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Payment>('POST', `/api/payments/${paymentId}/proof`, { paymentProofPath: proofPath });
    }
    const p = stateStore.payments.find(x => x.id === paymentId);
    if (!p) return undefined;

    const transisi = canChangePaymentStatus(p.status, 'PENDING_VERIFICATION');
    if (!transisi.allowed) throw new Error(transisi.code);

    // Lampiran baru membatalkan peninjauan lama: nama & waktu pemeriksa
    // sebelumnya tidak lagi menggambarkan berkas yang sedang ditinjau.
    const buktiBerubah = (p.payment_proof_path ?? '') !== proofPath;

    const bayarPada = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `payments` SET `payment_proof_path` = ?, `status` = ?, `payment_date` = ?, `verified_by` = NULL, `verified_at` = NULL WHERE `id` = ?',
      [proofPath, 'PENDING_VERIFICATION', bayarPada, paymentId],
      'addPaymentProof'
    );
    p.payment_proof_path = proofPath;
    p.status = 'PENDING_VERIFICATION';
    p.payment_date = bayarPada;

    if (buktiBerubah) {
      p.verified_by = null;
      p.verified_by_name = undefined;
      p.verified_at = null;
    }
    return p;
  },

  // Maintenance
  getMaintenance: async () => stateStore.maintenance,
  scheduleMaintenance: async (item: Omit<Maintenance, 'id' | 'maintenance_code'>) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Maintenance>('POST', '/api/maintenance', item);
    }
    const id = nextId(stateStore.maintenance);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = `MNT-SBS-${dateStr}-${String(id).padStart(3, '0')}`;
    const newM: Maintenance = {
      ...item,
      id,
      maintenance_code: code,
      status: 'SCHEDULED'
    };
    await wt(
      'INSERT INTO `maintenance` (`id`, `maintenance_code`, `equipment_id`, `scheduled_date`, `maintenance_type`, `hour_meter_at_maintenance`, `description`, `spareparts_replaced`, `cost`, `technician_id`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newM.id, newM.maintenance_code, newM.equipment_id, newM.scheduled_date, newM.maintenance_type, newM.hour_meter_at_maintenance, newM.description, newM.spareparts_replaced ?? null, newM.cost, newM.technician_id ?? null, newM.status],
      'scheduleMaintenance'
    );
    stateStore.maintenance.unshift(newM);
    const eq = stateStore.equipments.find(e => e.id === item.equipment_id);
    if (eq) {
      await wt('UPDATE `equipments` SET `status` = ? WHERE `id` = ?', ['MAINTENANCE', eq.id], 'servisKunciUnit');
      eq.status = 'MAINTENANCE';
    }
    return newM;
  },

  // GPS Telemetry
  getGpsTracking: async () => stateStore.gps,

  // Reports
  getReports: async () => stateStore.reports,
};

// ---------------------------------------------------------------------------
// Pengaturan Aplikasi (tabel `settings`)
// ---------------------------------------------------------------------------
// Saat DB terhubung, tarif denda & konfigurasi lain dibaca dari tabel settings.
// Cache di sini (bukan di businessRules) karena modul ini pemilik koneksi DB;
// businessRules hanya menerima nilai lewat setter agar tidak timbul dependensi
// melingkar (businessRules adalah modul murni tanpa import db).
// ponytail: tidak ada notifikasi perubahan dari DB. Cache hanya disegarkan
// ulang per isolate lewat warmSettings(); naik ke: pub/sub atau TTL bila
// pengaturan banyak diubah dari banyak isolate.

let settingsDimuat = false;

async function muatSettings(): Promise<void> {
  settingsDimuat = true;
  if (!isDatabaseConnected()) return; // mode IN_MEMORY_DEMO → nilai default kode

  const rows = await executeSql<{ value: string | null }>(
    'SELECT `value` FROM `settings` WHERE `key` = ? LIMIT 1',
    ['late_penalty_per_day']
  );
  const mentah = rows.length > 0 ? rows[0]?.value : null;
  const angka = typeof mentah === 'string' ? Number(mentah) : NaN;
  setLatePenaltyPerDay(Number.isFinite(angka) && angka >= 0 ? angka : null);
}

/**
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
/** Batas umur cermin per isolate (detik) — lihat komentar fungsi. */
const UMUR_CERMIN = 5;
let cerminPada = 0;

/**
 * Muat Cermin TiDB ke stateStore. Dipanggil middleware sebelum route mana pun
 * menyentuh data. Cloudflare bisa punya BANYAK isolate hidup serentak: tanpa
 * TTL, isolate warm yang tidak kena cold-start lagi melayani salinan basi
 * (temuan E2E siklus 61 — unit yang baru ditulis isolat lain tak terlihat).
 * Revalidasi maksimal tiap `UMUR_CERMIN` detik; tulis-tembus isolate ini
 * sendiri sudah mutakhir, 9 SELECT cheap < 1 RTT extra. Mode demo no-op.
 */
export async function hydrasiDariTiDB(): Promise<void> {
  if (!tidbClient) return;
  const sekarang = Date.now();
  if (hidrasiDimuat && sekarang - cerminPada < UMUR_CERMIN * 1000) return;
  try {
    await jalankanHidrasi();
    hidrasiDimuat = true;
    cerminPada = sekarang;
  } catch (err) {
    // Gagal hidrasi: biarkan seed demo melayani (jujur via getDataMode?
    // mode pelaporan tetap TIDB karena tulis-tembus juga gagal dan meledak
    // sendiri) — cukup catat di log Worker.
    console.error('[persist] hidrasi TiDB gagal; state tetap seed demo:', err);
  }
}
