import { connect } from '@tidbcloud/serverless';
import { 
  INITIAL_USERS, 
  INITIAL_EQUIPMENTS, 
  INITIAL_RENTALS, 
  INITIAL_CONTRACTS, 
  INITIAL_PAYMENTS, 
  INITIAL_MAINTENANCE, 
  INITIAL_GPS, 
  INITIAL_REPORTS 
} from './mockData';
import { User, Equipment, Rental, Contract, Payment, Maintenance, GpsTracking, ReportItem } from '../types';

// Ambil konfigurasi database dari environment secara aman untuk browser, edge, & node
const envLookup = typeof import.meta !== 'undefined' && (import.meta as any).env
  ? (import.meta as any).env
  : (typeof globalThis !== 'undefined' && (globalThis as any).process?.env) || {};

const databaseUrl = envLookup.VITE_DATABASE_URL || envLookup.DATABASE_URL || '';

let tidbClient: any = null;

if (databaseUrl && !databaseUrl.includes('your_username')) {
  try {
    tidbClient = connect({ url: databaseUrl });
    console.log('✅ TiDB Cloud Serverless Client initialized with HTTPS connection.');
  } catch (err) {
    console.warn('⚠️ Gagal inisialisasi TiDB Cloud, beralih ke local storage fallback:', err);
  }
}

// In-Memory Reactive Cache for Edge & Offline Simulation
export const stateStore = {
  users: [...INITIAL_USERS] as User[],
  equipments: [...INITIAL_EQUIPMENTS] as Equipment[],
  rentals: [...INITIAL_RENTALS] as Rental[],
  contracts: [...INITIAL_CONTRACTS] as Contract[],
  payments: [...INITIAL_PAYMENTS] as Payment[],
  maintenance: [...INITIAL_MAINTENANCE] as Maintenance[],
  gps: [...INITIAL_GPS] as GpsTracking[],
  reports: [...INITIAL_REPORTS] as ReportItem[],
};

/**
 * Eksekusi Query SQL ke TiDB Cloud Serverless
 * Jika koneksi TiDB aktif, kueri dikirim langsung ke cluster TiDB Cloud.
 */
export async function executeSql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (tidbClient) {
    try {
      const results = await tidbClient.execute(sql, params);
      return results as T[];
    } catch (error) {
      console.error('TiDB Query Error:', error);
      throw error;
    }
  }
  
  // Fallback log
  return [] as T[];
}

// CRUD Helpers
export const db = {
  // Users
  getUsers: async () => stateStore.users,
  getUserById: async (id: number) => stateStore.users.find(u => u.id === id),
  getUserByUsername: async (username: string) => stateStore.users.find(u => u.username.toLowerCase() === username.toLowerCase()),
  addUser: async (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: stateStore.users.length + 1 };
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
    const newEq = { ...eq, id: stateStore.equipments.length + 1 };
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
    const nextId = stateStore.rentals.length + 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = `RNT-SBS-${dateStr}-${String(nextId).padStart(3, '0')}`;
    const newRental: Rental = {
      ...rental,
      id: nextId,
      rental_code: code,
      booking_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'PENDING'
    };
    stateStore.rentals.unshift(newRental);
    return newRental;
  },
  updateRentalStatus: async (id: number, status: Rental['status']) => {
    const r = stateStore.rentals.find(x => x.id === id);
    if (r) {
      r.status = status;
      if (status === 'APPROVED' || status === 'ON_GOING') {
        const eq = stateStore.equipments.find(e => e.id === r.equipment_id);
        if (eq) eq.status = 'RENTED';
      } else if (status === 'COMPLETED') {
        const eq = stateStore.equipments.find(e => e.id === r.equipment_id);
        if (eq) eq.status = 'AVAILABLE';
      }
    }
    return r;
  },

  // Contracts
  getContracts: async () => stateStore.contracts,
  signContract: async (contractId: number) => {
    const c = stateStore.contracts.find(x => x.id === contractId);
    if (c) {
      c.is_signed_customer = 1;
      c.signed_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    return c;
  },

  // Payments
  getPayments: async () => stateStore.payments,
  verifyPayment: async (paymentId: number, staffUserId: number, staffName: string) => {
    const p = stateStore.payments.find(x => x.id === paymentId);
    if (p) {
      p.status = 'PAID';
      p.verified_by = staffUserId;
      p.verified_by_name = staffName;
      p.verified_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    return p;
  },
  addPaymentProof: async (paymentId: number, proofPath: string) => {
    const p = stateStore.payments.find(x => x.id === paymentId);
    if (p) {
      p.payment_proof_path = proofPath;
      p.status = 'PENDING_VERIFICATION';
    }
    return p;
  },

  // Maintenance
  getMaintenance: async () => stateStore.maintenance,
  scheduleMaintenance: async (item: Omit<Maintenance, 'id' | 'maintenance_code'>) => {
    const nextId = stateStore.maintenance.length + 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = `MNT-SBS-${dateStr}-${String(nextId).padStart(3, '0')}`;
    const newM: Maintenance = {
      ...item,
      id: nextId,
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
