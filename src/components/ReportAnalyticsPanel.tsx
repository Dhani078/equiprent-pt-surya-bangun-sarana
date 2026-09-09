import React, { useCallback, useMemo, useState } from 'react';
import { ReportCellValue, ReportResult, ReportId, DateRangeFilter, ReportColumnFormat } from '../types';
import { REPORT_CATALOG, EMPTY_RANGE, formatCell, buildCsv, buildCsvFilename } from '../lib/reports';
import { downloadCsv } from '../lib/reportsClient';
import { Download, CalendarRange, FileSpreadsheet, Inbox, AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';

interface ReportAnalyticsPanelProps {
  /** Laporan yang sedang dimuat dari API atau perhitungan lokal. */
  result: ReportResult | null;
  loading: boolean;
  error: string | null;
  /** Asal data laporan: 'API' (edge worker) atau 'LOKAL' (state aplikasi). */
  source: 'API' | 'LOKAL' | null;
  activeId: ReportId;
  onSelectReport: (id: ReportId) => void;
  range: DateRangeFilter;
  onRangeChange: (range: DateRangeFilter) => void;
  onRetry: () => void;
}

/** Warna teks ringkasan mengikuti design system: hijau positif, merah negatif. */
const TONE_COLOR: Record<'positive' | 'negative' | 'neutral', string> = {
  positive: '#059669',
  negative: '#dc2626',
  neutral: 'var(--color-primary)',
};

export const ReportAnalyticsPanel: React.FC<ReportAnalyticsPanelProps> = ({
  result,
  loading,
  error,
  source,
  activeId,
  onSelectReport,
  range,
  onRangeChange,
  onRetry,
}) => {
  const [exportError, setExportError] = useState<string | null>(null);

  const activeDefinition = useMemo(
    () => REPORT_CATALOG.find((r) => r.id === activeId),
    [activeId]
  );

  /** Laporan snapshot (Utilisasi HM) tidak punya filter tanggal. */
  const supportsDateFilter = activeDefinition?.supportsDateFilter ?? true;

  const handleExportCsv = useCallback(() => {
    if (!result) return;
    try {
      downloadCsv(buildCsv(result), buildCsvFilename(result, new Date()));
      setExportError(null);
    } catch {
      setExportError('Berkas CSV gagal dibuat. Silakan coba lagi.');
    }
  }, [result]);

  const handleResetRange = useCallback(() => {
    onRangeChange(EMPTY_RANGE);
  }, [onRangeChange]);

  return (
    <section
      className="card-premium animate-fade-in"
      style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}
      aria-label="Panel laporan operasional"
    >
      {/* Judul & kontrol */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(0, 51, 102, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BarChart3 size={19} color="var(--color-primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)' }}>
              11 Laporan Operasional
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-secondary-light)' }}>
              {activeDefinition?.description ?? 'Pilih jenis laporan untuk menampilkan datanya.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={!result || result.totalRows === 0 || loading}
          className="btn-primary"
          style={{ padding: '9px 14px', fontSize: '13px', opacity: !result || result.totalRows === 0 ? 0.5 : 1 }}
          aria-label="Ekspor laporan ke berkas CSV"
        >
          <Download size={15} />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Pemilih laporan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label
          htmlFor="pilih-laporan"
          style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}
        >
          JENIS LAPORAN
        </label>
        <select
          id="pilih-laporan"
          className="input-premium"
          value={activeId}
          onChange={(e) => onSelectReport(e.target.value as ReportId)}
          aria-label="Pilih jenis laporan operasional"
          style={{ maxWidth: '420px' }}
        >
          {REPORT_CATALOG.map((def) => (
            <option key={def.id} value={def.id}>
              {def.title}
            </option>
          ))}
        </select>
      </div>

      {/* Filter rentang tanggal */}
      {supportsDateFilter && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'flex-end',
            padding: '14px',
            background: '#F8FAFC',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
            <CalendarRange size={16} color="var(--color-secondary)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>
              PERIODE
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label htmlFor="filter-dari" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>
              Dari tanggal
            </label>
            <input
              id="filter-dari"
              type="date"
              className="input-premium"
              value={range.from}
              max={range.to === '' ? undefined : range.to}
              onChange={(e) => onRangeChange({ ...range, from: e.target.value })}
              aria-label="Tanggal awal periode laporan"
              style={{ padding: '8px 10px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label htmlFor="filter-sampai" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>
              Sampai tanggal
            </label>
            <input
              id="filter-sampai"
              type="date"
              className="input-premium"
              value={range.to}
              min={range.from === '' ? undefined : range.from}
              onChange={(e) => onRangeChange({ ...range, to: e.target.value })}
              aria-label="Tanggal akhir periode laporan"
              style={{ padding: '8px 10px', fontSize: '13px' }}
            />
          </div>

          <button
            type="button"
            onClick={handleResetRange}
            className="btn-secondary"
            disabled={range.from === '' && range.to === ''}
            style={{ padding: '8px 12px', fontSize: '12px' }}
            aria-label="Hapus filter periode laporan"
          >
            Reset Periode
          </button>
        </div>
      )}

      {exportError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '12.5px',
          }}
        >
          <AlertTriangle size={15} />
          <span>{exportError}</span>
        </div>
      )}

      {/* Status sumber data */}
      {result && !loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--color-secondary-light)' }}>
          <span className="serial-code" style={{ fontSize: '11.5px' }}>
            {result.periodLabel}
          </span>
          <span aria-label="Jumlah baris laporan">{result.totalRows} baris data</span>
          <span
            className="badge"
            style={{
              fontSize: '11px',
              background: source === 'API' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: source === 'API' ? '#059669' : '#B45309',
            }}
          >
            {source === 'API' ? 'Sumber: Edge API' : 'Sumber: Perhitungan lokal'}
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} aria-busy="true" aria-label="Memuat laporan">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: '18px',
                borderRadius: '6px',
                background: 'linear-gradient(90deg, #EEF2F7 25%, #E2E8F0 37%, #EEF2F7 63%)',
                backgroundSize: '400% 100%',
                animation: 'sbs-shimmer 1.4s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '16px',
            background: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.22)',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={17} color="#dc2626" />
            <span style={{ fontSize: '13px', color: '#991B1B' }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="btn-secondary"
            style={{ padding: '7px 12px', fontSize: '12px' }}
            aria-label="Coba muat ulang laporan"
          >
            <RefreshCw size={13} />
            <span>Coba Ulang</span>
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && result && result.totalRows === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            padding: '40px 20px',
            border: '1px dashed var(--color-border)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <Inbox size={30} color="#94A3B8" />
          <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--color-secondary)' }}>
            Tidak ada data pada periode ini
          </p>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--color-secondary-light)', maxWidth: '380px' }}>
            Coba lewati filter periode dengan tombol <strong>Reset Periode</strong>, atau pilih jenis laporan lain.
          </p>
          <button
            type="button"
            onClick={handleResetRange}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12px', marginTop: '4px' }}
            aria-label="Tampilkan seluruh periode"
          >
            <CalendarRange size={13} />
            <span>Tampilkan Semua Periode</span>
          </button>
        </div>
      )}

      {/* Tabel data */}
      {!loading && !error && result && result.totalRows > 0 && (
        <>
          <div className="table-container" style={{ maxHeight: '460px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ width: '44px' }}>No</th>
                  {result.columns.map((col) => (
                    <th
                      key={col.key}
                      style={{ textAlign: col.align === 'right' ? 'right' : 'left' }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, rowIndex) => (
                  <tr key={`${result.id}-${rowIndex}`}>
                    <td style={{ color: 'var(--color-secondary-light)', fontSize: '12px' }}>
                      {rowIndex + 1}
                    </td>
                    {result.columns.map((col, colIndex) => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align === 'right' ? 'right' : 'left',
                          fontFamily: col.format === 'currency' ? 'var(--font-mono)' : undefined,
                          fontWeight: col.format === 'currency' ? 600 : undefined,
                          whiteSpace: col.format === 'text' ? 'normal' : 'nowrap',
                          maxWidth: '320px',
                        }}
                      >
                        {renderCell(row[colIndex], col.format)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ringkasan agregat */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
            }}
          >
            {result.summaries.map((s) => (
              <div
                key={s.label}
                style={{
                  padding: '12px 14px',
                  background: '#F8FAFC',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
              >
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'var(--color-secondary-light)' }}>
                  {s.label}
                </p>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: TONE_COLOR[s.tone ?? 'neutral'],
                  }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--color-secondary-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={13} />
            Ekspor CSV menghasilkan angka murni tanpa titik ribuan agar langsung dapat dijumlahkan di Excel.
          </p>
        </>
      )}
    </section>
  );
};

/** Menampilkan satu sel sesuai format kolomnya. */
function renderCell(value: ReportCellValue | undefined, format: ReportColumnFormat | undefined): string {
  if (value === undefined) return '-';
  if (value === '') return '-';
  return formatCell(value, format);
}
