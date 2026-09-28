/**
 * Operasi data pendukung: servis, telemetri GPS, dokumen laporan.
 *
 * Dipisah dari `db.ts`; seluruh konteks bersama (stateStore, jalur tulis,
 * cermin TiDB) datang dari `./internal`.
 */
import { nextId, stateStore, tidbClient, wt } from './internal';
import { lewatJembatan } from './internal';
import type { Maintenance } from '../../types';

export const ops = {
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
