import { connect } from '@tidbcloud/serverless';
import { User, Equipment, Rental, Contract, Payment, Maintenance, GpsTracking, ReportItem } from '../types';
import { verifyPassword } from './auth';
import { getTransitionEffect } from './rentalWorkflow';
import { canChangePaymentStatus, summarizeRentalPayment } from './paymentWorkflow';
import { CONTRACT_TERMS_TEXT, generateContractCode } from './contracts';
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
const databaseUrl = envLookup.VITE_DATABASE_URL ?? envLookup.DATABASE_URL ?? '';

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

/** Menandakan apakah aplikasi sedang terhubung ke database sungguhan. */
export const isDatabaseConnected = (): boolean => tidbClient !== null;

/**
 * Hasil verifikasi kredensial.
 * Discriminated union — memaksa pemanggil mengecek `ok` sebelum memakai `user`.
 */
export type AuthCheck =
  | { ok: true; user: User }
  | { ok: false; reason: 'NOT_FOUND' | 'BAD_PASSWORD' | 'SUSPENDED' };

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

// CRUD Helpers
export const db = {
  // Users
  getUsers: async () => stateStore.users,
  getUserById: async (id: number) => stateStore.users.find(u => u.id === id),
  getUserByUsername: async (username: string) => stateStore.users.find(u => u.username.toLowerCase() === username.toLowerCase()),

  /**
   * Memverifikasi kredensial login: username + password + status akun.
   * Password di-hash dengan PBKDF2 (lihat src/lib/auth.ts).
   */
  verifyCredentials: async (username: string, password: string): Promise<AuthCheck> => {
    const user = stateStore.users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!user) return { ok: false, reason: 'NOT_FOUND' };

    // Akun yang disuspend tidak boleh login meski password benar.
    if (user.status === 'SUSPENDED') return { ok: false, reason: 'SUSPENDED' };

    const passwordOk = await verifyPassword(password, '', user.username);
    if (!passwordOk) return { ok: false, reason: 'BAD_PASSWORD' };

    return { ok: true, user };
  },

  addUser: async (user: Omit<User, 'id'>) => {
    const newUser: User = { ...user, id: nextId(stateStore.users) };
    stateStore.users.push(newUser);
    return newUser;
  },
  toggleUserStatus: async (id: number) => {
    const u = stateStore.users.find(x => x.id === id);
    if (u) {
      u.status = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    }
    return u;
  },

  // Equipments
  getEquipments: async () => stateStore.equipments,
  getEquipmentById: async (id: number) => stateStore.equipments.find(e => e.id === id),
  addEquipment: async (eq: Omit<Equipment, 'id'>) => {
    const newEq: Equipment = { ...eq, id: nextId(stateStore.equipments) };
    stateStore.equipments.unshift(newEq);
    return newEq;
  },
  updateEquipment: async (id: number, data: Partial<Equipment>) => {
    const eq = stateStore.equipments.find(e => e.id === id);
    if (eq) {
      Object.assign(eq, data);
    }
    return eq;
  },
  deleteEquipment: async (id: number) => {
    const idx = stateStore.equipments.findIndex(e => e.id === id);
    if (idx !== -1) {
      stateStore.equipments.splice(idx, 1);
      return true;
    }
    return false;
  },

  // Rentals
  getRentals: async () => stateStore.rentals,
  addRental: async (rental: Omit<Rental, 'id' | 'rental_code'>) => {
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

    r.status = status;

    const dampak = getTransitionEffect(status);

    if (dampak.equipmentStatus === 'RENTED') {
      const eq = stateStore.equipments.find(e => e.id === r.equipment_id);
      if (eq) eq.status = 'RENTED';
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
        if (eq) eq.status = 'AVAILABLE';
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
      terms_conditions: CONTRACT_TERMS_TEXT,
      is_signed_customer: 0,
      signed_at: null,
      signer_name: null,
      signature_data_url: null,
    };

    stateStore.contracts.push(contract);
    return contract;
  },

  /**
   * Membubuhkan tanda tangan elektronik pada kontrak.
   *
   * `signerName` & `signature` sudah divalidasi oleh `validateContractSignature()`
   * di lapisan API sebelum sampai ke sini.
   */
  signContract: async (contractId: number, signerName: string, signature: string) => {
    const c = stateStore.contracts.find(x => x.id === contractId);
    if (!c) return undefined;

    // Kontrak yang sudah ditandatangani tidak boleh ditandatangani ulang:
    // signed_at adalah bukti waktu yang dipakai sebagai audit trail.
    if (c.is_signed_customer === 1) {
      throw new Error('KONTRAK_SUDAH_DITANDATANGANI');
    }

    c.is_signed_customer = 1;
    c.signed_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    c.signer_name = signerName;
    c.signature_data_url = signature;
    return c;
  },

  // Payments
  getPayments: async () => stateStore.payments,

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

    p.status = 'PAID';
    p.verified_by = staffUserId;
    p.verified_by_name = staffName;
    p.verified_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
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
    const p = stateStore.payments.find(x => x.id === paymentId);
    if (!p) return undefined;

    const transisi = canChangePaymentStatus(p.status, 'FAILED');
    if (!transisi.allowed) throw new Error(transisi.code);

    p.status = 'FAILED';
    p.verified_by = staffUserId;
    p.verified_by_name = staffName;
    p.verified_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return p;
  },

  /**
   * Melampirkan bukti transfer (UNPAID / FAILED → PENDING_VERIFICATION).
   *
   * `proofPath` sudah divalidasi oleh `validatePaymentProofPath()` di
   * lapisan API sebelum sampai ke sini.
   */
  addPaymentProof: async (paymentId: number, proofPath: string) => {
    const p = stateStore.payments.find(x => x.id === paymentId);
    if (!p) return undefined;

    const transisi = canChangePaymentStatus(p.status, 'PENDING_VERIFICATION');
    if (!transisi.allowed) throw new Error(transisi.code);

    // Lampiran baru membatalkan peninjauan lama: nama & waktu pemeriksa
    // sebelumnya tidak lagi menggambarkan berkas yang sedang ditinjau.
    const buktiBerubah = (p.payment_proof_path ?? '') !== proofPath;

    p.payment_proof_path = proofPath;
    p.status = 'PENDING_VERIFICATION';
    p.payment_date = new Date().toISOString().replace('T', ' ').slice(0, 19);

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
    const id = nextId(stateStore.maintenance);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = `MNT-SBS-${dateStr}-${String(id).padStart(3, '0')}`;
    const newM: Maintenance = {
      ...item,
      id,
      maintenance_code: code,
      status: 'SCHEDULED'
    };
    stateStore.maintenance.unshift(newM);
    const eq = stateStore.equipments.find(e => e.id === item.equipment_id);
    if (eq) eq.status = 'MAINTENANCE';
    return newM;
  },

  // GPS Telemetry
  getGpsTracking: async () => stateStore.gps,

  // Reports
  getReports: async () => stateStore.reports,
};
