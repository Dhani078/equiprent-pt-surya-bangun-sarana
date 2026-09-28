/**
 * Laporan armada: Servis & Perawatan, Utilisasi HM, Kerusakan Unit.
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
  EQUIPMENT_STATUS_LABEL,
  MAINTENANCE_STATUS_LABEL,
  MAINTENANCE_TYPE_LABEL,
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
  summarizeKerusakanUnit,
  summarizeMaintenanceServis,
  summarizeUtilisasiHm,
} from './summaries';

export function buildMaintenanceServis(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const units = buildEquipmentMap(source.equipments);

  const filtered = source.maintenance.filter((m) => inRange(toDay(m.scheduled_date), range));
  const ordered = [...filtered].sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((m) => [
    m.maintenance_code,
    m.equipment_name ?? units.get(m.equipment_id) ?? `Unit #${m.equipment_id}`,
    MAINTENANCE_TYPE_LABEL[m.maintenance_type],
    Number(m.hour_meter_at_maintenance),
    m.description,
    Number(m.cost),
    MAINTENANCE_STATUS_LABEL[m.status],
  ]);

  return {
    id: 'MAINTENANCE_SERVIS',
    title: 'Laporan Maintenance & Servis',
    description: 'Seluruh jadwal dan riwayat perawatan unit alat berat.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'maintenance_code', label: 'Kode Servis' },
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'type', label: 'Jenis' },
      { key: 'hour_meter', label: 'HM Saat Servis', align: 'right', format: 'decimal' },
      { key: 'description', label: 'Uraian Pekerjaan' },
      { key: 'cost', label: 'Biaya', align: 'right', format: 'currency' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    summaries: summarizeMaintenanceServis(rows, rows.length),
    totalRows: rows.length,
  };
}

// Laporan Utilisasi HM adalah snapshot kondisi armada, sehingga rentang
// tanggal tidak berlaku. Parameter ditulis `_range` agar maksudnya eksplisit.
export function buildUtilisasiHm(source: ReportDataSource, _range: DateRangeFilter): ReportResult {
  /** Tanggal servis terakhir tiap unit (completion_date lebih diutamakan). */
  const lastService = new Map<number, string>();
  for (const m of source.maintenance) {
    if (m.status !== 'COMPLETED') continue;
    const day = toDay(m.completion_date) || toDay(m.scheduled_date);
    if (day === '') continue;
    const current = lastService.get(m.equipment_id);
    if (!current || day > current) lastService.set(m.equipment_id, day);
  }

  const ordered = [...source.equipments].sort((a, b) => b.hour_meter - a.hour_meter);

  const rows: ReportCellValue[][] = ordered.map((e) => [
    e.equipment_code,
    e.name,
    e.type,
    round2(e.hour_meter),
    lastService.get(e.id) ?? 'Belum Pernah',
    EQUIPMENT_STATUS_LABEL[e.status],
  ]);

  return {
    id: 'UTILISASI_HM',
    title: 'Laporan Utilisasi & Hour Meter',
    description: 'Akumulasi jam operasi (HM) dan servis terakhir tiap unit.',
    periodLabel: 'Kondisi armada saat ini',
    columns: [
      { key: 'equipment_code', label: 'Kode Unit' },
      { key: 'name', label: 'Nama Unit' },
      { key: 'type', label: 'Tipe' },
      { key: 'hour_meter', label: 'Hour Meter (jam)', align: 'right', format: 'decimal' },
      { key: 'last_service', label: 'Servis Terakhir' },
      { key: 'status', label: 'Status Unit' },
    ],
    rows,
    summaries: summarizeUtilisasiHm(rows, rows.length),
    totalRows: rows.length,
  };
}

export function buildKerusakanUnit(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const units = buildEquipmentMap(source.equipments);

  const filtered = source.maintenance.filter(
    (m) => m.maintenance_type === 'CORRECTIVE' && inRange(toDay(m.scheduled_date), range)
  );
  const ordered = [...filtered].sort((a, b) => Number(b.cost) - Number(a.cost));

  const rows: ReportCellValue[][] = ordered.map((m) => [
    m.equipment_name ?? units.get(m.equipment_id) ?? `Unit #${m.equipment_id}`,
    m.maintenance_code,
    m.spareparts_replaced ?? '-',
    m.description,
    Number(m.cost),
  ]);

  return {
    id: 'KERUSAKAN_UNIT',
    title: 'Laporan Kerusakan Unit',
    description: 'Perbaikan korektif beserta biaya penanganannya.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'maintenance_code', label: 'Kode Servis' },
      { key: 'spareparts', label: 'Sparepart Diganti' },
      { key: 'description', label: 'Uraian Kerusakan' },
      { key: 'cost', label: 'Biaya Perbaikan', align: 'right', format: 'currency' },
    ],
    rows,
    summaries: summarizeKerusakanUnit(rows, rows.length),
    totalRows: rows.length,
  };
}
