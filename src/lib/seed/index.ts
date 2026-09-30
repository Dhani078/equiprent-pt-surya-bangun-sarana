/**
 * Seed Generator — modul index.
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Mengimpor delapan generator per-domain dari src/lib/seed/*, lalu
 * merakitnya menjadi dataset final yang konsisten secara relasional.
 * Status unit disinkronkan dengan rental & servis yang berjalan
 * (MAINTENANCE > RENTED > AVAILABLE/UNAVAILABLE).
 */

import type {
  User, Equipment, Rental, Contract, Payment,
  Maintenance, GpsTracking, ReportItem,
} from '../../types';

import { generateUsers } from './users';
import { generateEquipments } from './equipments';
import { generateMaintenance } from './maintenance';
import { generateRentals } from './rentals';
import { generateContracts } from './contracts';
import { generatePayments } from './payments';
import { generateGps } from './gps';
import { generateReports } from './reports';

const USERS = generateUsers();
const CUSTOMER_IDS = USERS.filter(u => u.role_id === 3).map(u => u.id);
const EQUIPMENTS = generateEquipments();
const MAINTENANCE = generateMaintenance(EQUIPMENTS);
const RENTALS = generateRentals(EQUIPMENTS, CUSTOMER_IDS);

/**
 * Sinkronisasi status unit dengan data rental & servis.
 *
 * Ini adalah SUMBER KEBENARAN untuk status unit. Status acak di
 * generateEquipments() hanya titik awal; setelah rental diketahui,
 * status disesuaikan agar tidak ada inkonsistensi:
 *   - unit dengan rental AKTIF (APPROVED/ON_GOING) → RENTED
 *   - unit yang sedang diservis (IN_PROGRESS) → MAINTENANCE
 *   - unit lainnya → AVAILABLE (atau UNAVAILABLE bila ditandai demikian)
 *
 * Prioritas: RENTED > MAINTENANCE > AVAILABLE/UNAVAILABLE.
 * Unit yang sedang disewa tidak bisa simultaneously diservis (prengat
 * audit konsistensi 2026-09-30: rental aktif harus menempati unit
 * berstatus RENTED — sebelumnya MAINTENANCE menang dan merusak asersi).
 */
function sinkronkanStatusUnit(
  equipments: Equipment[],
  rentals: readonly Rental[],
  maintenance: readonly Maintenance[]
): Equipment[] {
  // Unit dengan rental aktif menang: unit sedang menyala di lokasi penyewa.
  const unitSedangDisewa = new Set<number>();
  for (const r of rentals) {
    if (r.status === 'ON_GOING' || r.status === 'APPROVED') {
      unitSedangDisewa.add(r.equipment_id);
    }
  }

  // Unit dengan servis yang belum selesai (sedang berjalan), selama
  // tidak sedang disewa.
  const unitDalamServis = new Set<number>();
  for (const m of maintenance) {
    if (m.status === 'IN_PROGRESS') unitDalamServis.add(m.equipment_id);
  }

  for (const eq of equipments) {
    if (unitSedangDisewa.has(eq.id)) {
      eq.status = 'RENTED';
    } else if (unitDalamServis.has(eq.id)) {
      eq.status = 'MAINTENANCE';
    } else if (eq.status === 'RENTED') {
      // Tidak ada rental aktif lagi → kembalikan ke tersedia.
      eq.status = 'AVAILABLE';
    }
    // UNAVAILABLE dipertahankan apa adanya.
  }

  return equipments;
}

sinkronkanStatusUnit(EQUIPMENTS, RENTALS, MAINTENANCE);

const CONTRACTS = generateContracts(RENTALS, USERS);
const PAYMENTS = generatePayments(CONTRACTS, RENTALS);
const GPS = generateGps(EQUIPMENTS);
const REPORTS = generateReports(RENTALS);

export {
  USERS as GENERATED_USERS,
  EQUIPMENTS as GENERATED_EQUIPMENTS,
  RENTALS as GENERATED_RENTALS,
  CONTRACTS as GENERATED_CONTRACTS,
  PAYMENTS as GENERATED_PAYMENTS,
  MAINTENANCE as GENERATED_MAINTENANCE,
  GPS as GENERATED_GPS,
  REPORTS as GENERATED_REPORTS,
};
