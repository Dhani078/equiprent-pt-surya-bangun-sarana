/**
 * Laporan operasional: Telemetri GPS, Kinerja Staf, Suku Cadang.
 *
 * Bagian dari mesin laporan operasional — tetap MURNI (tanpa DOM/DB).
 */
import type {
  DateRangeFilter,
  ReportCellValue,
  ReportItem,
  ReportResult,
} from '../../types';
import { formatRupiah, formatTanggal, formatWaktu } from '../businessRules';
import type { ReportDataSource } from './datasource';
import {
  buildEquipmentMap,
} from './datasource';
import {
  buildPeriodLabel,
  formatTanggalSingkat,
  hasRange,
  inRange,
  monthKey,
  monthLabel,
  round2,
} from './period';
import { countWhere, sumColumn } from './aggregate';
import { toDay } from './period';
import {
  summarizeKinerjaStaf,
  summarizeSukuCadang,
  summarizeTelemetriGps,
} from './summaries';

export function buildTelemetriGps(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const units = buildEquipmentMap(source.equipments);

  const filtered = source.gps.filter((g) => inRange(toDay(g.recorded_at), range));
  const ordered = [...filtered].sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((g) => [
    g.equipment_name ?? units.get(g.equipment_id) ?? `Unit #${g.equipment_id}`,
    round2(g.latitude),
    round2(g.longitude),
    round2(g.speed),
    g.engine_status === 'ON' ? 'Menyala' : 'Mati',
    g.fuel_level_percent,
    g.recorded_at,
  ]);

  return {
    id: 'TELEMETRI_GPS',
    title: 'Laporan Histori Telemetri GPS',
    description: 'Rekaman posisi, kecepatan, dan status mesin armada.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'latitude', label: 'Latitude', align: 'right', format: 'decimal' },
      { key: 'longitude', label: 'Longitude', align: 'right', format: 'decimal' },
      { key: 'speed', label: 'Kecepatan (km/jam)', align: 'right', format: 'decimal' },
      { key: 'engine', label: 'Status Mesin' },
      { key: 'fuel', label: 'BBM (%)', align: 'right', format: 'integer' },
      { key: 'recorded_at', label: 'Waktu Rekam', format: 'datetime' },
    ],
    rows,
    summaries: summarizeTelemetriGps(rows, rows.length),
    totalRows: rows.length,
  };
}

export function buildKinerjaStaf(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  /**
   * Beban kerja staf dihitung dari dua jejak nyata di data:
   *   - verifikasi pembayaran (`payments.verified_by`)
   *   - penanganan servis (`maintenance.technician_id`)
   * Bila rentang tanggal aktif, hanya jejak di dalam rentang yang dihitung.
   */
  const verificationCount = new Map<number, number>();
  for (const p of source.payments) {
    if (p.verified_by == null) continue;
    const day = toDay(p.verified_at);
    if (!inRange(day, range)) continue;
    verificationCount.set(p.verified_by, (verificationCount.get(p.verified_by) ?? 0) + 1);
  }

  const serviceCount = new Map<number, number>();
  for (const m of source.maintenance) {
    if (m.technician_id == null) continue;
    const day = toDay(m.completion_date) || toDay(m.scheduled_date);
    if (!inRange(day, range)) continue;
    serviceCount.set(m.technician_id, (serviceCount.get(m.technician_id) ?? 0) + 1);
  }

  const staf = source.users
    .filter((u) => u.role_name === 'ADMIN' || u.role_name === 'STAFF')
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'id-ID'));

  const rows: ReportCellValue[][] = staf.map((u) => [
    u.full_name,
    u.username,
    u.email,
    u.phone,
    u.role_name === 'ADMIN' ? 'Administrator' : 'Staf Operasional',
    verificationCount.get(u.id) ?? 0,
    serviceCount.get(u.id) ?? 0,
    u.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif',
  ]);

  return {
    id: 'KINERJA_STAF',
    title: 'Laporan Kinerja Staf & Operator',
    description: 'Beban kerja staf: verifikasi pembayaran dan penanganan servis.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'name', label: 'Nama Staf' },
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'No. Telepon' },
      { key: 'role', label: 'Peran' },
      { key: 'verifications', label: 'Verifikasi Pembayaran', align: 'right', format: 'integer' },
      { key: 'services', label: 'Servis Ditangani', align: 'right', format: 'integer' },
      { key: 'status', label: 'Status Akun' },
    ],
    rows,
    summaries: summarizeKinerjaStaf(rows, rows.length),
    totalRows: rows.length,
  };
}

export function buildSukuCadang(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const units = buildEquipmentMap(source.equipments);

  const filtered = source.maintenance.filter((m) => {
    const parts = m.spareparts_replaced?.trim() ?? '';
    return parts !== '' && inRange(toDay(m.scheduled_date), range);
  });
  const ordered = [...filtered].sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((m) => [
    m.maintenance_code,
    m.equipment_name ?? units.get(m.equipment_id) ?? `Unit #${m.equipment_id}`,
    m.spareparts_replaced ?? '-',
    Number(m.cost),
    toDay(m.scheduled_date),
  ]);

  return {
    id: 'SUKU_CADANG',
    title: 'Laporan Pemakaian Suku Cadang',
    description: 'Komponen yang diganti beserta biaya penggantiannya.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'maintenance_code', label: 'Kode Servis' },
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'spareparts', label: 'Suku Cadang' },
      { key: 'cost', label: 'Biaya Penggantian', align: 'right', format: 'currency' },
      { key: 'date', label: 'Tanggal Ganti', format: 'date' },
    ],
    rows,
    summaries: summarizeSukuCadang(rows, rows.length),
    totalRows: rows.length,
  };
}
