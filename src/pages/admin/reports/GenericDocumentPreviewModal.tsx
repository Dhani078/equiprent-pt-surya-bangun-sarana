import React from 'react';
import { ReportItem } from '../../../types';
import { Modal } from '../../../components/Modal';
import { Printer, ShieldCheck } from 'lucide-react';

interface GenericDocumentPreviewModalProps {
  report: ReportItem;
  onClose: () => void;
}

/** Pratinjau generik laporan non-BAST (FINANCIAL_SUMMARY) — kop + rincian + area tanda tangan. */
export const GenericDocumentPreviewModal: React.FC<GenericDocumentPreviewModalProps> = ({ report: selectedReport, onClose }) => (
  <Modal isOpen={true} onClose={onClose} title={`Dokumen Resmi: ${selectedReport.report_code}`}>
    <div style={{
      padding: '24px',
      backgroundColor: '#FAFAFA',
      border: '2px solid var(--color-border)',
      borderRadius: '8px',
      fontFamily: 'serif',
      color: 'var(--text-strong)',
      lineHeight: 1.6
    }}>
      {/* Kop Surat PT SBS */}
      <div style={{ textAlign: 'center', borderBottom: '3px double var(--color-primary)', paddingBottom: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
          PT. SURYA BANGUN SARANA BANJARMASIN
        </h2>
        <p style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'var(--text-body)', margin: '4px 0 0 0' }}>
          Heavy Equipment Rental, Earthmoving Contractor & Fleet Monitoring System<br />
          Jl. Ahmad Yani KM 5, Banjarmasin, Kalimantan Selatan &bull; Telp: (0511) 7890123
        </p>
      </div>

      {/* Document Title */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, textDecoration: 'underline', margin: 0, textTransform: 'uppercase' }}>
          {selectedReport.report_type.replace(/_/g, ' ')}
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
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
              <td style={{ color: 'var(--fg-success-deep)', fontWeight: 700 }}>VALID & TERCATAT PADA SISTEM</td>
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
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pimpinan Proyek Lapangan</div>
        </div>
        <div>
          <div>PT. Surya Bangun Sarana</div>
          <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={36} color="var(--color-primary)" />
          </div>
          <div style={{ fontWeight: 700 }}>( Hendra Wijaya )</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Staf Operasional & Logistik</div>
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
      <button type="button" onClick={onClose} className="btn-secondary">
        Tutup
      </button>
      <button type="button" onClick={() => window.print()} className="btn-primary">
        <Printer size={15} />
        <span>Cetak / Simpan PDF</span>
      </button>
    </div>
  </Modal>
);
