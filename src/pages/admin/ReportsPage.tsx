import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ReportItem, Rental, ReportId, ReportResult, DateRangeFilter } from '../../types';
import { FileText, Download, Printer, Eye, CheckCircle2, ShieldCheck, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { ReportAnalyticsPanel } from '../../components/ReportAnalyticsPanel';
import { formatRupiah, LATE_PENALTY_PER_DAY } from '../../lib/businessRules';
import { REPORT_CATALOG } from '../../lib/reports';
import { fetchReport } from '../../lib/reportsClient';

interface ReportsPageProps {
  reports: ReportItem[];
  rentals: Rental[];
}

/** Laporan yang tampil pertama kali saat halaman dibuka. */
const DEFAULT_REPORT_ID: ReportId = REPORT_CATALOG[0].id;

export const ReportsPage: React.FC<ReportsPageProps> = ({ reports, rentals }) => {
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // --- State panel 11 laporan operasional -----------------------------------
  const [activeId, setActiveId] = useState<ReportId>(DEFAULT_REPORT_ID);
  const [range, setRange] = useState<DateRangeFilter>({ from: '', to: '' });
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

    void fetchReport(activeId, range, controller.signal).then((hasil) => {
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
  }, [activeId, range, attempt]);

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
   * Tarif: LATE_PENALTY_PER_DAY per hari.
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
      totalDenda += hariTelat * LATE_PENALTY_PER_DAY;
    }

    return {
      pendapatanKotor,
      totalDenda,
      terlambat,
      totalTransaksi: diproses.length,
    };
  }, [rentals]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        <div className="card-premium" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={20} color="#059669" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>PENDAPATAN KOTOR</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {formatRupiah(ringkasan.pendapatanKotor)}
            </p>
          </div>
        </div>

        <div className="card-premium" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={20} color="#dc2626" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>
              DENDA KETERLAMBATAN (Rp {LATE_PENALTY_PER_DAY.toLocaleString('id-ID')}/HARI)
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>
              {formatRupiah(ringkasan.totalDenda)}
            </p>
          </div>
        </div>

        <div className="card-premium" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} color="#2563eb" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>TRANSAKSI DIPROSES</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {ringkasan.totalTransaksi} <span style={{ fontSize: '12px', fontWeight: 500 }}>({ringkasan.terlambat} terlambat)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Panel 11 Laporan Operasional */}
      <ReportAnalyticsPanel
        result={result}
        loading={loading}
        error={error}
        source={source}
        activeId={activeId}
        onSelectReport={handleSelectReport}
        range={range}
        onRangeChange={setRange}
        onRetry={handleRetry}
      />

      {/* Reports Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode Dokumen</th>
              <th>Jenis Laporan</th>
              <th>Terkait Transaksi</th>
              <th>Diterbitkan Oleh</th>
              <th>Tanggal Terbit</th>
              <th>Aksi & Pratinjau</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((rep) => (
              <tr key={rep.id}>
                <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                  {rep.report_code}
                </td>
                <td>
                  <span className="badge badge-info" style={{ fontSize: '11px' }}>
                    {rep.report_type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="serial-code" style={{ fontSize: '12.5px' }}>
                  {rep.rental_code || `RNT-SBS-2026-${String(rep.rental_id || 1).padStart(3, '0')}`}
                </td>
                <td style={{ fontSize: '13px' }}>
                  <strong>{rep.generated_by_name || 'Hendra Wijaya (Staf)'}</strong>
                </td>
                <td style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                  {rep.generated_at}
                </td>
                <td>
                  <button
                    onClick={() => setSelectedReport(rep)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Eye size={13} />
                    <span>Buka Dokumen</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Official Document Preview Modal */}
      {selectedReport && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={`Dokumen Resmi: ${selectedReport.report_code}`}
        >
          <div style={{
            padding: '24px',
            backgroundColor: '#FAFAFA',
            border: '2px solid #E2E8F0',
            borderRadius: '8px',
            fontFamily: 'serif',
            color: '#1E293B',
            lineHeight: 1.6
          }}>
            {/* Kop Surat PT SBS */}
            <div style={{ textAlign: 'center', borderBottom: '3px double #003366', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                PT. SURYA BANGUN SARANA BANJARMASIN
              </h2>
              <p style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: '#475569', margin: '4px 0 0 0' }}>
                Heavy Equipment Rental, Earthmoving Contractor & Fleet Monitoring System<br />
                Jl. Ahmad Yani KM 5, Banjarmasin, Kalimantan Selatan &bull; Telp: (0511) 7890123
              </p>
            </div>

            {/* Document Title */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, textDecoration: 'underline', margin: 0, textTransform: 'uppercase' }}>
                {selectedReport.report_type.replace(/_/g, ' ')}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>
                Nomor: {selectedReport.report_code}
              </span>
            </div>

            {/* Content Body */}
            <div style={{ fontSize: '13px', marginBottom: '24px' }}>
              <p>
                Pada hari ini, tanggal <strong>{selectedReport.generated_at.slice(0, 10)}</strong>, bertempat di Kantor Operasional PT. Surya Bangun Sarana Banjarmasin, telah diterbitkan dokumen resmi terkait penyewaan alat berat dengan rincian sebagai berikut:
              </p>
              <table style={{ width: '100%', margin: '14px 0', fontSize: '12.5px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '180px', fontWeight: 600 }}>Kode Transaksi Sewa:</td>
                    <td>{selectedReport.rental_code || 'RNT-SBS-20260501-001'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Jenis Dokumen:</td>
                    <td>{selectedReport.report_type}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Pejabat Penerbit:</td>
                    <td>{selectedReport.generated_by_name || 'Hendra Wijaya'} (Staf Logistik PT. SBS)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Status Integritas:</td>
                    <td style={{ color: '#059669', fontWeight: 700 }}>VALID & TERCATAT PADA DATABASE TIDB CLOUD</td>
                  </tr>
                </tbody>
              </table>
              <p>
                Dokumen ini merupakan bukti otentik yang sah dalam sistem monitoring operasional dan diakui secara resmi oleh manajemen PT. Surya Bangun Sarana Banjarmasin.
              </p>
            </div>

            {/* Signature Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', padding: '0 20px', textAlign: 'center', fontSize: '12.5px' }}>
              <div>
                <div>Pihak Penyewa / Rekanan</div>
                <div style={{ height: '50px' }} />
                <div style={{ fontWeight: 700 }}>( .................................... )</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Pimpinan Proyek Lapangan</div>
              </div>
              <div>
                <div>PT. Surya Bangun Sarana</div>
                <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={36} color="#003366" />
                </div>
                <div style={{ fontWeight: 700 }}>( Hendra Wijaya )</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Staf Operasional & Logistik</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="btn-secondary"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary"
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
