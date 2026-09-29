import React from 'react';
import { ReportItem } from '../../../types';
import { FileText, Download, Printer, Eye } from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import type { ExportFormat } from '../../../lib/tableExport';

interface ReportArchiveTableProps {
  reports: ReportItem[];
  onPreview: (rep: ReportItem) => void;
  onPrint: (rep: ReportItem) => void;
  onExport: (format: ExportFormat) => void;
}

/** Tabel arsip dokumen laporan + tombol ekspor (CSV/Excel/PDF) sesuai isi arsip. */
export const ReportArchiveTable: React.FC<ReportArchiveTableProps> = ({ reports, onPreview, onPrint, onExport }) => (
  <>
    {/* Ekspor arsip dokumen */}
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onExport('csv')}
        title="Unduh arsip dokumen dalam format CSV"
        style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
      >
        <Download size={15} /> CSV
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onExport('excel')}
        title="Unduh arsip dokumen dalam format Excel"
        style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
      >
        <FileText size={15} /> Excel
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onExport('pdf')}
        title="Cetak atau simpan arsip dokumen sebagai PDF"
        style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
      >
        <Printer size={15} /> PDF
      </button>
    </div>

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
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onPreview(rep)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    aria-label={`Buka pratinjau dokumen ${rep.report_code}`}
                  >
                    <Eye size={13} />
                    <span>Buka Dokumen</span>
                  </button>
                  <button
                    onClick={() => onPrint(rep)}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    aria-label={`Cetak dokumen ${rep.report_code} ke kertas A4`}
                  >
                    <Printer size={13} />
                    <span>Cetak A4</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reports.length === 0 && (
        <EmptyState
          pesan="Belum ada dokumen laporan diterbitkan"
          keterangan="Dokumen BAST, Surat Jalan, dan ringkasan finansial akan tercatat di sini setelah transaksi selesai dan dicetak."
          ariaLabel="Daftar dokumen laporan kosong"
          ikon={FileText}
        />
      )}
    </div>
  </>
);
