/**
 * Dispatcher laporan: peta jenis laporan -> fungsi pembangun barisnya.
 *
 * Setiap `build*` hidup di berkas kelompoknya sendiri; peta ini menyatukannya
 * kembali supaya `buildReport()` tetap menjadi satu pintu masuk.
 */
import type {
  DateRangeFilter, ReportId, ReportResult,
} from '../../types';
import type { ReportDataSource } from './datasource';
import { buildPembayaranPiutang, buildPendapatanBersih, buildRentalBulanan } from './rentals';
import { buildKerusakanUnit, buildMaintenanceServis, buildUtilisasiHm } from './fleet';
import { buildKinerjaStaf, buildSukuCadang, buildTelemetriGps } from './ops';
import { buildAuditTrail, buildKepuasanPelanggan } from './service';
import { EMPTY_RANGE, hasRange } from './period';

const BUILDERS: Readonly<Record<ReportId, (s: ReportDataSource, r: DateRangeFilter) => ReportResult>> = {
  RENTAL_BULANAN: buildRentalBulanan,
  PEMBAYARAN_PIUTANG: buildPembayaranPiutang,
  PENDAPATAN_BERSIH: buildPendapatanBersih,
  MAINTENANCE_SERVIS: buildMaintenanceServis,
  UTILISASI_HM: buildUtilisasiHm,
  KERUSAKAN_UNIT: buildKerusakanUnit,
  TELEMETRI_GPS: buildTelemetriGps,
  KINERJA_STAF: buildKinerjaStaf,
  SUKU_CADANG: buildSukuCadang,
  KEPUASAN_PELANGGAN: buildKepuasanPelanggan,
  AUDIT_TRAIL: buildAuditTrail,
};

/**
 * Menyusun satu laporan dari sumber data.
 *
 * @throws Tidak pernah melempar; id yang tidak dikenal jatuh ke laporan pertama.
 *        Pemanggil sebaiknya memvalidasi id lewat `isReportId` terlebih dulu.
 */
export function buildReport(
  id: ReportId,
  source: ReportDataSource,
  range: DateRangeFilter = EMPTY_RANGE
): ReportResult {
  const builder = BUILDERS[id] ?? buildRentalBulanan;
  return builder(source, hasRange(range) ? range : EMPTY_RANGE);
}

/** Apakah string ini merupakan id laporan yang dikenal? */
export function isReportId(value: unknown): value is ReportId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(BUILDERS, value);
}
