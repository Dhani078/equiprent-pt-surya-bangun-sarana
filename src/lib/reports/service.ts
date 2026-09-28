/**
 * Laporan layanan & tata kelola: Kepuasan Pelanggan, Audit Trail.
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
  buildUserMap,
  customerName,
  equipmentName,
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
  summarizeAuditTrail,
  summarizeKepuasanPelanggan,
} from './summaries';

export function buildKepuasanPelanggan(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const users = buildUserMap(source.users);
  const units = buildEquipmentMap(source.equipments);
  const company = new Map<number, string>();
  for (const u of source.users) company.set(u.id, u.company_name ?? '-');

  const filtered = source.rentals.filter((r) => {
    const notes = r.notes?.trim() ?? '';
    return notes !== '' && inRange(toDay(r.start_date), range);
  });
  const ordered = [...filtered].sort((a, b) => (a.start_date < b.start_date ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((r) => [
    r.rental_code,
    customerName(r, users),
    company.get(r.customer_id) ?? '-',
    equipmentName(r.equipment_id, r, units),
    r.notes ?? '-',
    toDay(r.start_date),
  ]);

  return {
    id: 'KEPUASAN_PELANGGAN',
    title: 'Laporan Kepuasan & Umpan Balik Pelanggan',
    description: 'Catatan evaluasi yang ditinggalkan pelanggan pada transaksi sewa.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'rental_code', label: 'Kode Sewa' },
      { key: 'customer', label: 'Pelanggan' },
      { key: 'company', label: 'Perusahaan' },
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'notes', label: 'Catatan Evaluasi' },
      { key: 'date', label: 'Tanggal', format: 'date' },
    ],
    // `source.rentals.length` disimpan sebagai baseline agar persentase
    // cakupan tetap bermakna setelah baris disaring kata kunci.
    rows,
    summaries: summarizeKepuasanPelanggan(rows, source.rentals.length),
    totalRows: rows.length,
    baselineRows: source.rentals.length,
  };
}

export function buildAuditTrail(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const filtered = source.reports.filter((r) => inRange(toDay(r.generated_at), range));
  const ordered = [...filtered].sort((a, b) => (a.generated_at < b.generated_at ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((r) => [
    r.report_code,
    r.generated_by_name ?? `Pengguna #${r.generated_by}`,
    r.report_type.replace(/_/g, ' '),
    r.file_path,
    r.generated_at,
  ]);

  return {
    id: 'AUDIT_TRAIL',
    title: 'Laporan Audit Trail & Log Sistem',
    description: 'Jejak dokumen resmi yang diterbitkan beserta penerbitnya.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'report_code', label: 'Kode Dokumen' },
      { key: 'actor', label: 'Diterbitkan Oleh' },
      { key: 'type', label: 'Jenis Ekspor' },
      { key: 'file_path', label: 'Berkas' },
      { key: 'generated_at', label: 'Waktu Terbit', format: 'datetime' },
    ],
    rows,
    summaries: summarizeAuditTrail(rows, rows.length),
    totalRows: rows.length,
  };
}
