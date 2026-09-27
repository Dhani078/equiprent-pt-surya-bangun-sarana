# -*- coding: utf-8 -*-
"""A) fetchCollection -> cermin penuh TiDB. B) db.ts: bridge semua mutator."""
import io

NLK = '\r\n'

def read(p):
    s = io.open(p, encoding='utf-8', newline='').read()
    return s, ('\r\n' if '\r\n' in s[:2000] else '\n')

def write(p, s):
    io.open(p, 'w', encoding='utf-8', newline='').write(s)

# ============================================================ A) fetchCollection.ts (LF, tulis ulang)
NEW_FC = '''/**
 * Cermin browser <- Edge API (Worker <- TiDB).
 *
 * stateStore di browser hanyalah cermin tampilan. Setelah login, setiap
 * koleksi di bawah ditarik dari Worker; mutasi diteruskan lewat jembatan di
 * db.ts. Saat Worker tidak aktif (dev murni), fungsi mengembalikan data
 * lokal — bukan array kosong yang menyesatkan.
 */

import { stateStore } from './db';
import { headerSesi } from './authClient';
import type {
  User, Equipment, Rental, Contract, Payment, Maintenance, ReportItem, GpsTracking,
} from '../types';

/** path GET -> key stateStore yang ditimpa. */
const KOLEKSI: ReadonlyArray<{ path: string; key: keyof typeof stateStore }> = [
  { path: '/api/users', key: 'users' },
  { path: '/api/equipments', key: 'equipments' },
  { path: '/api/rentals', key: 'rentals' },
  { path: '/api/contracts', key: 'contracts' },
  { path: '/api/payments', key: 'payments' },
  { path: '/api/maintenance', key: 'maintenance' },
  { path: '/api/gps', key: 'gps' },
  { path: '/api/reports', key: 'reports' },
];

/**
 * Tarik semua koleksi dari Worker ke stateStore.
 *
 * Koleksi yang ditolak role (mis. /api/users untuk CUSTOMER) dilewati diam-
 * diam — bukan error. Dikembalikan jumlah koleksi yang berhasil disegarkan.
 */
export async function sinkronCermin(signal?: AbortSignal): Promise<number> {
  const hasil = await Promise.allSettled(
    KOLEKSI.map(async ({ path, key }) => {
      const res = await fetch(path, { headers: headerSesi(), signal });
      if (!res.ok) return null;
      const body = await res.json().catch(() => null);
      const arr = Array.isArray(body)
        ? body
        : (body as { data?: unknown } | null)?.data;
      return Array.isArray(arr) ? (arr as never[]) : null;
    })
  );
  let terisi = 0;
  hasil.forEach((h, i) => {
    if (h.status === 'fulfilled' && h.value && h.value.length > 0) {
      // koleksinya diganti utuh, bukan merge, agar baris yang dihapus
      // Worker (delete) ikut hilang dari cermin.
      (stateStore as unknown as Record<string, unknown[]>)[KOLEKSI[i].key] = h.value;
      terisi++;
    }
  });
  return terisi;
}

/** API lama: satu koleksi saja (dipakai App saat bootstrap awal). */
export async function fetchCollectionOrLocal(
  name: 'equipments' | 'rentals',
  signal?: AbortSignal
): Promise<User[] | Equipment[] | Rental[] | Contract[] | Payment[] | Maintenance[] | ReportItem[] | GpsTracking[]> {
  try {
    const res = await fetch(`/api/${name}`, { headers: headerSesi(), signal });
    if (!res.ok) throw new Error(String(res.status));
    const body = await res.json();
    return Array.isArray(body) ? body : (body?.data ?? []);
  } catch {
    return (stateStore as unknown as Record<string, never[]>)[name] ?? [];
  }
}
'''
write('src/lib/fetchCollection.ts', NEW_FC)
print('A ok')

# ============================================================ B) db.ts bridge
p = 'src/lib/db.ts'
s, NL = read(p)
def A(x): return x.replace('\n', NL)
def rep(old, new, cnt=1):
    global s
    o = A(old); n = A(new)
    assert s.count(o) == cnt, 'MISS/DUP(%d!=%d): %r' % (s.count(o), cnt, old[:70])
    s = s.replace(o, n, cnt)

# B1) loginApi versi jujur (bedakan offline vs kredensial salah)
i = s.find("export async function loginApi")
j = s.find(A("/**\n * Teruskan mutasi"), i)
assert i > 0 and j > i, (i, j)
s = s[:i] + A('''export type LoginHasil =
  | { ok: true; token: string }
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
      { token?: string; error?: { message?: string } } | null;
    if (res.ok && body?.token) return { ok: true, token: body.token };
    if (res.status >= 400 && res.status < 500 && body?.error?.message) {
      return { ok: false, message: body.error.message };
    }
    return { ok: false, offline: true };
  } catch {
    return { ok: false, offline: true };
  }
}

''') + s[j:]

# B2) kirimKeApi: header dari authClient (token App)
rep("""      ...(tokenBridge ? { [SESSION_HEADER]: tokenBridge } : {}),""",
    """      ...headerSesi(tokenBridge ? { [SESSION_HEADER]: tokenBridge } : {}),""")
rep("""import { hashPassword, isDemoAccount, isStoredPasswordHash, SESSION_HEADER, verifyPassword } from './auth';""",
    """import { hashPassword, isDemoAccount, isStoredPasswordHash, SESSION_HEADER, verifyPassword } from './auth';
import { headerSesi } from './authClient';""")

# B3) helper cermin lokal untuk mutator browser
rep("""export const setApiBridgeToken = (token: string | null): void => {
  tokenBridge = token;
};""",
    """export const setApiBridgeToken = (token: string | null): void => {
  tokenBridge = token;
};

/**
 * Guard jembatan: browser tidak lagi menulis stateStore/wt() sendiri —
 * mutasi dilempar ke Worker (write-through TiDB), lalu cermin disegarkan.
 * `paths` koleksi yang disalin ulang dari server setelah sukses.
 */
async function lewatJembatan(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<void> {
  await kirimKeApi(method, path, body);
  const { sinkronCermin } = await import('./fetchCollection');
  await sinkronCermin();
}""")

# B4) bridge tiap mutator -------------------------------------------------
rep("""  setUserPassword: async (id: number, password: string) => {
    const user = stateStore.users.find(u => u.id === id);""",
    """  setUserPassword: async (id: number, password: string) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('POST', `/api/users/${id}/password`, { password });
      return stateStore.users.find(u => u.id === id);
    }
    const user = stateStore.users.find(u => u.id === id);""")

rep("""  addUser: async (user: Omit<User, 'id'>) => {
    const newUser: User = { ...user, id: nextId(stateStore.users) };""",
    """  addUser: async (user: Omit<User, 'id'>) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('POST', '/api/users', user);
      return stateStore.users.find(
        u => u.username.toLowerCase() === user.username.toLowerCase()
      );
    }
    const newUser: User = { ...user, id: nextId(stateStore.users) };""")

rep("""  updateUser: async (id: number, data: Partial<User>) => {
    const user = stateStore.users.find(u => u.id === id);""",
    """  updateUser: async (id: number, data: Partial<User>) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('PUT', `/api/users/${id}`, data);
      return stateStore.users.find(u => u.id === id);
    }
    const user = stateStore.users.find(u => u.id === id);""")

rep("""  toggleUserStatus: async (id: number) => {""",
    """  toggleUserStatus: async (id: number) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('POST', `/api/users/${id}/toggle`);
      return stateStore.users.find(u => u.id === id)?.status;
    }""")

rep("""  addEquipment: async (eq: Omit<Equipment, 'id'>) => {
    const newEq: Equipment = { ...eq, id: nextId(stateStore.equipments) };""",
    """  addEquipment: async (eq: Omit<Equipment, 'id'>) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('POST', '/api/equipments', eq);
      return stateStore.equipments.find(e => e.equipment_code === eq.equipment_code);
    }
    const newEq: Equipment = { ...eq, id: nextId(stateStore.equipments) };""")

rep("""  updateEquipment: async (id: number, data: Partial<Equipment>) => {
    const eq = stateStore.equipments.find(e => e.id === id);""",
    """  updateEquipment: async (id: number, data: Partial<Equipment>) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('PUT', `/api/equipments/${id}`, data);
      return stateStore.equipments.find(e => e.id === id);
    }
    const eq = stateStore.equipments.find(e => e.id === id);""")

rep("""    const punyaRiwayat = stateStore.rentals.some((r) => r.equipment_id === id);
    if (punyaRiwayat) return false;""",
    """    if (typeof window !== 'undefined') {
      try {
        await lewatJembatan('DELETE', `/api/equipments/${id}`);
      } catch (err) {
        if (err instanceof Error && /ditemukan|sewa aktif|HTTP 4/i.test(err.message)) {
          // Worker menolak (404/409) atau menandai riwayat -> cermin sudah
          // disegar ulang oleh error path; laporkan gagal.
        }
        throw err;
      }
      return true;
    }
    const punyaRiwayat = stateStore.rentals.some((r) => r.equipment_id === id);
    if (punyaRiwayat) return false;""")

rep("""  addRental: async (rental: Omit<Rental, 'id' | 'rental_code'>) => {
    const id = nextId(stateStore.rentals);""",
    """  addRental: async (rental: Omit<Rental, 'id' | 'rental_code'>) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('POST', '/api/rentals', rental);
      return stateStore.rentals.find(
        r => r.equipment_id === rental.equipment_id &&
             r.start_date === rental.start_date &&
             r.status === 'PENDING'
      ) as Rental;
    }
    const id = nextId(stateStore.rentals);""")

rep("""  ) => {
    const r = stateStore.rentals.find(x => x.id === id);
    if (!r) return undefined;

    // GERBANG PEMBAYARAN""",
    """  ) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('PUT', `/api/rentals/${id}/status`, {
        status,
        overrideUnpaid: options.overrideUnpaid ?? false,
      });
      return stateStore.rentals.find(x => x.id === id);
    }
    const r = stateStore.rentals.find(x => x.id === id);
    if (!r) return undefined;

    // GERBANG PEMBAYARAN""")

rep("""  createContract: async (rentalId: number) => {""",
    """  createContract: async (rentalId: number) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('POST', '/api/contracts', { rentalId });
      return stateStore.contracts.find(k => k.rental_id === rentalId);
    }""")

rep("""  signContract: async (contractId: number, signerName: string, signature: string) => {""",
    """  signContract: async (contractId: number, signerName: string, signature: string) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('POST', `/api/contracts/${contractId}/sign`, { signerName, signature });
      return stateStore.contracts.find(k => k.id === contractId);
    }""")

rep("""  verifyPayment: async (paymentId: number, staffUserId: number, staffName: string) => {""",
    """  verifyPayment: async (paymentId: number, staffUserId: number, staffName: string) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('POST', `/api/payments/${paymentId}/verify`, { staffId: staffUserId, staffName });
      return stateStore.payments.find(x => x.id === paymentId);
    }""")

rep("""  rejectPayment: async (paymentId: number, staffUserId: number, staffName: string) => {""",
    """  rejectPayment: async (paymentId: number, staffUserId: number, staffName: string) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('POST', `/api/payments/${paymentId}/reject`, { staffName });
      return stateStore.payments.find(x => x.id === paymentId);
    }""")

rep("""  addPaymentProof: async (paymentId: number, proofPath: string) => {""",
    """  addPaymentProof: async (paymentId: number, proofPath: string) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('POST', `/api/payments/${paymentId}/proof`, { paymentProofPath: proofPath });
      return stateStore.payments.find(x => x.id === paymentId);
    }""")

rep("""  scheduleMaintenance: async (item: Omit<Maintenance, 'id' | 'maintenance_code'>) => {""",
    """  scheduleMaintenance: async (item: Omit<Maintenance, 'id' | 'maintenance_code'>) => {
    if (typeof window !== 'undefined') {
      await lewatJembatan('POST', '/api/maintenance', item);
      return stateStore.maintenance.find(
        m => m.equipment_id === item.equipment_id && m.scheduled_date === item.scheduled_date
      );
    }""")

write(p, s)
print('B ok', len(s))
