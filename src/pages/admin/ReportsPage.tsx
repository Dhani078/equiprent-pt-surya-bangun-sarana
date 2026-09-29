import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ReportItem, Rental, Equipment, ReportId, ReportResult, DateRangeFilter } from '../../types';
import { Download, Printer, AlertTriangle } from 'lucide-react';
import { FinancialSummaryCards } from './reports/FinancialSummaryCards';
import { ReportArchiveTable } from './reports/ReportArchiveTable';
import { GenericDocumentPreviewModal } from './reports/GenericDocumentPreviewModal';
import { Modal } from '../../components/Modal';
import { ReportAnalyticsPanel } from '../../components/ReportAnalyticsPanel';
import { DocumentPrintPanel } from '../../components/DocumentPrintPanel';
import { getLatePenaltyPerDay } from '../../lib/businessRules';
import { REPORT_CATALOG } from '../../lib/reports';
import { fetchReport } from '../../lib/reportsClient';
import { documentKindFromReportType, buildDocument, type DocumentKind, type OfficialDocument } from '../../lib/documents';
import { printDocument } from '../../lib/documentPrinter';
import { DocumentPreview } from '../../components/DocumentPreview';
import { exportTable } from '../../lib/tableExport';
import type { ExportColumn, ExportFormat } from '../../lib/tableExport';

interface ReportsPageProps {
  reports: ReportItem[];
  rentals: Rental[];
  /** Daftar unit — dipakai untuk melengkapi rincian dokumen yang dicetak. */
  equipments: Equipment[];
  /** Menampilkan pesan sukses/gagal di tingkat aplikasi. */
  onNotify?: (message: string, tone: 'success' | 'error') => void;
}

/** Laporan yang tampil pertama kali saat halaman dibuka. */
const DEFAULT_REPORT_ID: ReportId = REPORT_CATALOG[0].id;

export const ReportsPage: React.FC<ReportsPageProps> = ({ reports, rentals, equipments, onNotify }) => {
  /** Kolom ekspor arsip dokumen laporan. */
  const kolomEkspor: ExportColumn<ReportItem>[] = [
    { header: 'Kode Dokumen', value: (r) => r.report_code },
    { header: 'Jenis Laporan', value: (r) => r.report_type },
    { header: 'Terkait Transaksi', value: (r) => r.rental_code ?? '-' },
    { header: 'Diterbitkan Oleh', value: (r) => r.generated_by_name ?? '-' },
    { header: 'Tanggal Terbit', value: (r) => r.generated_at },
  ];

  /** Mengekspor arsip dokumen ke CSV/Excel/PDF. */
  const handleExportArsip = (format: ExportFormat) => {
    const hasil = exportTable(format, reports, kolomEkspor, {
      title: 'Arsip Dokumen & Laporan',
      subtitle: `${reports.length} dokumen terarsip`,
      filename: 'arsip-laporan',
    });
    onNotify?.(hasil.message, hasil.ok ? 'success' : 'error');
  };

  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  /** Dokumen arsip yang sedang dibuka pratinjaunya (BAST / Surat Jalan). */
  const [previewDocument, setPreviewDocument] = useState<OfficialDocument | null>(null);
  /** Pesan galat saat pencetakan gagal (misal popup diblokir peramban). */
  const [cetakError, setCetakError] = useState<string | null>(null);

  // --- State panel 11 laporan operasional -----------------------------------
  const [activeId, setActiveId] = useState<ReportId>(DEFAULT_REPORT_ID);
  const [range, setRange] = useState<DateRangeFilter>({ from: '', to: '' });
  const [keyword, setKeyword] = useState<string>('');
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'API' | 'LOKAL' | null>(null);
  /** Nilai ini sengaja dipakai sebagai pemicu tombol "Coba Ulang". */
  const [attempt, setAttempt] = useState<number>(0);

  useEffect(() => {
    // AbortController membatalkan permintaan lama bila pengguna berpindah
    // laporan dengan cepat, sehingga hasil yang kedaluwarsa tidak menimpa
    // hasil terbaru.
    const controller = new AbortController();
    let aktif = true;

    setLoading(true);
    setError(null);

    void fetchReport(activeId, range, controller.signal, keyword).then((hasil) => {
      if (!aktif) return;
      if (hasil.ok) {
        setResult(hasil.result);
        setSource(hasil.source);
        setError(null);
      } else if (hasil.message !== 'PERMINTAAN_DIBATALKAN') {
        setResult(null);
        setError(hasil.message);
      }
      setLoading(false);
    });

    return () => {
      aktif = false;
      controller.abort();
    };
  }, [activeId, range, keyword, attempt]);

  const handleSelectReport = useCallback((id: ReportId) => {
    setActiveId(id);
  }, []);

  const handleRetry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  /**
   * Ringkasan finansial dari seluruh transaksi sewa.
   *
   * Denda dihitung untuk rental yang masih ON_GOING padahal tanggal
   * pengembaliannya sudah lewat (keterlambatan berjalan).
   * Tarif: getLatePenaltyPerDay() per hari.
   */
  const ringkasan = useMemo(() => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const hariIni = Date.now();

    const diproses = rentals.filter(r => r.status === 'COMPLETED' || r.status === 'ON_GOING');
    const pendapatanKotor = diproses.reduce((s, r) => s + Number(r.subtotal), 0);

    let totalDenda = 0;
    let terlambat = 0;

    for (const r of diproses) {
      // Keterlambatan hanya dihitung untuk unit yang belum kembali (ON_GOING).
      if (r.status !== 'ON_GOING') continue;
      const batas = new Date(r.end_date).getTime();
      if (!Number.isFinite(batas) || hariIni <= batas) continue;

      const hariTelat = Math.ceil((hariIni - batas) / MS_PER_DAY);
      if (hariTelat <= 0) continue;

      terlambat += 1;
      totalDenda += hariTelat * getLatePenaltyPerDay();
    }

    return {
      pendapatanKotor,
      totalDenda,
      terlambat,
      totalTransaksi: diproses.length,
    };
  }, [rentals]);

  /**
   * Mencetak berkas A4 mandiri untuk dokumen operasional (BAST IN/OUT,
   * Surat Jalan). Dokumen disusun ulang dari transaksi aslinya agar nomor
   * dan rincian unit selalu mengikuti data terbaru.
   */
  const handlePrintDocument = useCallback(
    (laporan: ReportItem) => {
      const jenis: DocumentKind | null = documentKindFromReportType(laporan.report_type);

      if (jenis === null) {
        // FINANCIAL_SUMMARY bukan dokumen serah terima → cukup cetak halaman.
        window.print();
        return;
      }

      const rental =
        rentals.find((r) => r.id === laporan.rental_id) ??
        rentals.find((r) => r.rental_code === laporan.rental_code) ??
        null;

      if (!rental) {
        setCetakError(
          `Transaksi untuk dokumen ${laporan.report_code} tidak ditemukan, sehingga dokumen tidak dapat diterbitkan.`
        );
        return;
      }

      const unit = equipments.find((e) => e.id === rental.equipment_id) ?? null;

      const dokumen = buildDocument({
        kind: jenis,
        rental,
        equipment: unit,
        issuedBy: laporan.generated_by_name,
        issuedAt: laporan.generated_at,
      });

      const hasil = printDocument(dokumen, new Date());
      setCetakError(hasil.ok ? null : hasil.message);
    },
    [rentals, equipments]
  );

  /** Pratinjau arsip dokumen: susun ulang dari transaksi, lalu tampilkan. */
  const handlePreviewDocument = useCallback(
    (laporan: ReportItem): boolean => {
      const jenis = documentKindFromReportType(laporan.report_type);

      if (jenis === null) {
        // FINANCIAL_SUMMARY tidak punya format BAST → pakai pratinjau generik.
        setSelectedReport(laporan);
        return false;
      }

      const rental =
        rentals.find((r) => r.id === laporan.rental_id) ??
        rentals.find((r) => r.rental_code === laporan.rental_code) ??
        null;

      if (!rental) {
        setCetakError(
          `Transaksi untuk dokumen ${laporan.report_code} tidak ditemukan, sehingga pratinjau tidak dapat ditampilkan.`
        );
        return false;
      }

      const unit = equipments.find((e) => e.id === rental.equipment_id) ?? null;

      setPreviewDocument(
        buildDocument({
          kind: jenis,
          rental,
          equipment: unit,
          issuedBy: laporan.generated_by_name,
          issuedAt: laporan.generated_at,
        })
      );
      setCetakError(null);
      return true;
    },
    [rentals, equipments]
  );

  /**
   * Drill-down baris laporan -> dokumen resmi (siklus 68).
   * Baris dengan kode sewa membuka pratinjau BAST/Surat Jalan terkait dari
   * arsip; bila transaksi belum berdokumen, pesan jelas ditampilkan.
   */
  const handleDrillDown = useCallback(
    (rentalCode: string): void => {
      const kandidat = reports.filter(
        (rep) => rep.rental_code === rentalCode && documentKindFromReportType(rep.report_type) !== null
      );
      const urutan: ReportItem['report_type'][] = ['BAST_OUT', 'BAST_IN', 'SURAT_JALAN'];
      const terpilih =
        urutan.map((t) => kandidat.find((r) => r.report_type === t)).find(Boolean) ?? kandidat[0];
      if (!terpilih) {
        setCetakError(
          `Transaksi ${rentalCode} belum memiliki dokumen resmi (BAST/Surat Jalan) di arsip.`
        );
        return;
      }
      setCetakError(null);
      handlePreviewDocument(terpilih);
    },
    [reports, handlePreviewDocument]
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Print header — hanya tampil saat cetak */}
      <div className="print-only" style={{ display: 'none', marginBottom: '16px', borderBottom: '2px solid var(--color-primary)', paddingBottom: '10px' }}>
        <div style={{ fontSize: '14pt', fontWeight: 800, color: 'var(--color-primary)' }}>PT. SURYA BANGUN SARANA BANJARMASIN</div>
        <div style={{ fontSize: '11pt', fontWeight: 600, marginTop: '4px' }} id="print-report-title">Laporan Operasional</div>
        <div style={{ fontSize: '9pt', color: 'var(--text-body)', marginTop: '2px' }}>
          Dicetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            Laporan Resmi & Dokumen Berita Acara (BAST)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-light)', margin: '4px 0 0 0' }}>
            Ekspor arsip resmi Surat Jalan mobilisasi unit, Berita Acara Serah Terima (BAST), dan rekapitulasi operasional.
          </p>
        </div>
      </div>

      {/* Ringkasan Finansial */}
      <FinancialSummaryCards ringkasan={ringkasan} />

      {/* Panel 11 Laporan Operasional */}
      <ReportAnalyticsPanel
        onSelectRentalCode={handleDrillDown}
        result={result}
        loading={loading}
        error={error}
        source={source}
        activeId={activeId}
        onSelectReport={handleSelectReport}
        range={range}
        onRangeChange={setRange}
        keyword={keyword}
        onKeywordChange={setKeyword}
        onRetry={handleRetry}
      />

      {/* Panel Dokumen Siap Cetak (BAST OUT / BAST IN / Surat Jalan) */}
      <DocumentPrintPanel rentals={rentals} equipments={equipments} />

      {cetakError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '8px',
            color: 'var(--fg-danger)',
            fontSize: '13px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{cetakError}</span>
        </div>
      )}

      <ReportArchiveTable
        reports={reports}
        onPreview={handlePreviewDocument}
        onPrint={handlePrintDocument}
        onExport={handleExportArsip}
      />

      {/* Official Document Preview Modal */}
      {selectedReport && (
        <GenericDocumentPreviewModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}

      {/* Pratinjau Dokumen BAST / Surat Jalan — isi identik dengan hasil cetak A4 */}
      {previewDocument && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewDocument(null)}
          title={`Dokumen Resmi: ${previewDocument.code}`}
        >
          <DocumentPreview doc={previewDocument} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setPreviewDocument(null)}
              className="btn-secondary"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                const hasil = printDocument(previewDocument, new Date());
                setCetakError(hasil.ok ? null : hasil.message);
              }}
              className="btn-primary"
              aria-label="Cetak dokumen ke kertas A4"
            >
              <Printer size={15} />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
