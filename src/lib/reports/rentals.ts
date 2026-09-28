/**
 * Laporan transaksi sewa: Rental Bulanan, Pembayaran & Piutang, Pendapatan Bersih.
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
  PAYMENT_STATUS_LABEL,
  RENTAL_STATUS_LABEL,
  buildEquipmentMap,
  buildUserMap,
  customerName,
  equipmentName,
  paymentMethodLabel,
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
  summarizePembayaranPiutang,
  summarizePendapatanBersih,
  summarizeRentalBulanan,
} from './summaries';
import { OPERATIONAL_TAX_RATE, REVENUE_STATUSES } from './catalog';

export function buildRentalBulanan(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const users = buildUserMap(source.users);
  const units = buildEquipmentMap(source.equipments);

  const filtered = source.rentals.filter((r) => inRange(toDay(r.start_date), range));
  const ordered = [...filtered].sort((a, b) => (a.start_date < b.start_date ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((r) => [
    r.rental_code,
    customerName(r, users),
    equipmentName(r.equipment_id, r, units),
    toDay(r.start_date),
    toDay(r.end_date),
    r.total_days,
    Number(r.subtotal),
    RENTAL_STATUS_LABEL[r.status],
  ]);

  return {
    id: 'RENTAL_BULANAN',
    title: 'Laporan Rental Bulanan',
    description: 'Seluruh transaksi sewa berdasarkan tanggal mulai sewa.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'rental_code', label: 'Kode Sewa' },
      { key: 'customer', label: 'Pelanggan' },
      { key: 'unit', label: 'Unit Alat Berat' },
      { key: 'start_date', label: 'Mulai', format: 'date' },
      { key: 'end_date', label: 'Selesai', format: 'date' },
      { key: 'total_days', label: 'Hari', align: 'right', format: 'integer' },
      { key: 'subtotal', label: 'Nilai Sewa', align: 'right', format: 'currency' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    summaries: summarizeRentalBulanan(rows, rows.length),
    totalRows: rows.length,
  };
}

export function buildPembayaranPiutang(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  const users = buildUserMap(source.users);

  const filtered = source.payments.filter((p) => inRange(toDay(p.payment_date), range));
  const ordered = [...filtered].sort((a, b) => (a.payment_date < b.payment_date ? 1 : -1));

  const rows: ReportCellValue[][] = ordered.map((p) => [
    p.payment_code,
    p.customer_name ?? users.get(p.customer_id) ?? `Pelanggan #${p.customer_id}`,
    paymentMethodLabel(p.payment_method),
    Number(p.amount),
    PAYMENT_STATUS_LABEL[p.status],
    toDay(p.payment_date),
  ]);

  return {
    id: 'PEMBAYARAN_PIUTANG',
    title: 'Laporan Pembayaran & Piutang',
    description: 'Rekapitulasi penerimaan dan tagihan yang belum lunas.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'payment_code', label: 'Kode Invoice' },
      { key: 'customer', label: 'Pelanggan' },
      { key: 'method', label: 'Metode' },
      { key: 'amount', label: 'Jumlah', align: 'right', format: 'currency' },
      { key: 'status', label: 'Status' },
      { key: 'payment_date', label: 'Tanggal', format: 'date' },
    ],
    rows,
    summaries: summarizePembayaranPiutang(rows, rows.length),
    totalRows: rows.length,
  };
}

export function buildPendapatanBersih(source: ReportDataSource, range: DateRangeFilter): ReportResult {
  /**
   * Pendapatan digabung per bulan berdasarkan tanggal mulai sewa.
   * Biaya servis dialokasikan ke periode penyelesaian servis
   * (`completion_date`, fallback `scheduled_date`) — lebih akurat daripada
   * referensi PHP yang menjumlahkan seluruh biaya servis ke setiap periode.
   */
  const pendapatan = new Map<string, number>();
  for (const r of source.rentals) {
    if (!REVENUE_STATUSES.includes(r.status)) continue;
    const day = toDay(r.start_date);
    if (!inRange(day, range)) continue;
    const key = monthKey(day);
    pendapatan.set(key, (pendapatan.get(key) ?? 0) + Number(r.subtotal));
  }

  const biayaServis = new Map<string, number>();
  for (const m of source.maintenance) {
    if (m.status !== 'COMPLETED') continue;
    const day = toDay(m.completion_date) || toDay(m.scheduled_date);
    if (!inRange(day, range)) continue;
    const key = monthKey(day);
    biayaServis.set(key, (biayaServis.get(key) ?? 0) + Number(m.cost));
  }

  const periods = [...new Set([...pendapatan.keys(), ...biayaServis.keys()])].sort((a, b) =>
    a < b ? -1 : 1
  );

  const rows: ReportCellValue[][] = periods.map((key) => {
    const gross = pendapatan.get(key) ?? 0;
    const maint = biayaServis.get(key) ?? 0;
    const tax = gross * OPERATIONAL_TAX_RATE;
    return [monthLabel(key), gross, maint, Math.round(tax), Math.round(gross - maint - tax)];
  });

  return {
    id: 'PENDAPATAN_BERSIH',
    title: 'Laporan Pendapatan Bersih',
    description: 'Laba rugi per periode setelah biaya servis dan pajak operasional.',
    periodLabel: buildPeriodLabel(range),
    columns: [
      { key: 'period', label: 'Periode' },
      { key: 'gross', label: 'Pendapatan Kotor', align: 'right', format: 'currency' },
      { key: 'maintenance', label: 'Biaya Servis', align: 'right', format: 'currency' },
      {
        key: 'tax',
        label: `Pajak & Ops (${Math.round(OPERATIONAL_TAX_RATE * 100)}%)`,
        align: 'right',
        format: 'currency',
      },
      { key: 'net', label: 'Laba Bersih', align: 'right', format: 'currency' },
    ],
    rows,
    summaries: summarizePendapatanBersih(rows, rows.length),
    totalRows: rows.length,
  };
}
