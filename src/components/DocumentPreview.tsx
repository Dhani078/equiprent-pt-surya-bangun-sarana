import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { formatRupiah } from '../lib/businessRules';
import type { OfficialDocument } from '../lib/documents';

interface DocumentPreviewProps {
  /** Dokumen yang sudah disusun oleh `buildDocument`. */
  doc: OfficialDocument;
}

/**
 * Pratinjau dokumen resmi di layar.
 *
 * Isinya identik dengan berkas HTML yang dikirim ke jendela cetak — hanya
 * tata letaknya yang menyesuaikan lebar modal (bukan kertas A4).
 * Karena itu pengguna melihat persis apa yang akan tercetak.
 */
export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ doc }) => {
  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        color: '#1E293B',
        lineHeight: 1.6,
      }}
    >
      {/* Kop Surat */}
      <div
        style={{
          textAlign: 'center',
          borderBottom: '3px double #003366',
          paddingBottom: '14px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-primary)',
            fontSize: '17px',
            fontWeight: 800,
            letterSpacing: '0.02em',
            color: 'var(--color-primary)',
          }}
        >
          PT. SURYA BANGUN SARANA BANJARMASIN
        </h2>
        <p
          style={{
            margin: '4px 0 0 0',
            fontFamily: 'var(--font-primary)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-secondary)',
          }}
        >
          Heavy Equipment Rental, Earthmoving Contractor &amp; Fleet Monitoring System
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-secondary-light)' }}>
          Jl. Ahmad Yani KM 5, Banjarmasin, Kalimantan Selatan &bull; Telp: (0511) 7890123
        </p>
      </div>

      {/* Judul Dokumen */}
      <div style={{ textAlign: 'center', margin: '20px 0 16px 0' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 800,
            textDecoration: 'underline',
            textTransform: 'uppercase',
            color: 'var(--color-primary)',
          }}
        >
          {doc.title}
        </h3>
        <span
          style={{
            display: 'block',
            marginTop: '6px',
            fontSize: '12px',
            color: 'var(--color-secondary-light)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Nomor: {doc.code}
        </span>
      </div>

      {/* Isi Dokumen */}
      <p style={{ fontSize: '13px', margin: '0 0 14px 0', textAlign: 'justify' }}>{doc.intro}</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
        <tbody>
          {doc.fields.map((field) => (
            <tr key={field.label}>
              <td
                style={{
                  width: '38%',
                  padding: '5px 0',
                  verticalAlign: 'top',
                  color: 'var(--color-secondary)',
                }}
              >
                {field.label}
              </td>
              <td style={{ width: '2%', padding: '5px 0', verticalAlign: 'top' }}>:</td>
              <td
                className={field.mono === true ? 'serial-code' : undefined}
                style={{
                  padding: '5px 0',
                  verticalAlign: 'top',
                  fontWeight: 600,
                  color: '#1E293B',
                }}
              >
                {field.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {doc.penalty > 0 && (
        <p
          style={{
            margin: '14px 0 0 0',
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#dc2626',
          }}
        >
          Denda keterlambatan {doc.lateDays} hari: {formatRupiah(doc.penalty)}
        </p>
      )}

      <p
        style={{
          margin: '16px 0 0 0',
          padding: '10px 14px',
          background: '#F1F5F9',
          borderLeft: '3px solid var(--color-primary)',
          fontSize: '12.5px',
          color: '#334155',
        }}
      >
        {doc.notes}
      </p>

      {/* Tanda Tangan */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '36px',
          textAlign: 'center',
          fontSize: '12.5px',
          gap: '12px',
        }}
      >
        <div style={{ width: '45%' }}>
          <div style={{ color: 'var(--color-secondary)' }}>{doc.signatures.left.label}</div>
          <div style={{ height: '52px' }} />
          <div style={{ fontWeight: 700 }}>( {doc.signatures.left.name} )</div>
          <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>
            {doc.signatures.left.role}
          </div>
        </div>
        <div style={{ width: '45%' }}>
          <div style={{ color: 'var(--color-secondary)' }}>{doc.signatures.right.label}</div>
          <div
            style={{
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={34} color="#003366" />
          </div>
          <div style={{ fontWeight: 700 }}>( {doc.signatures.right.name} )</div>
          <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>
            {doc.signatures.right.role}
          </div>
        </div>
      </div>

      <p
        style={{
          margin: '20px 0 0 0',
          paddingTop: '10px',
          borderTop: '1px solid var(--color-border)',
          fontSize: '11px',
          color: 'var(--color-secondary-light)',
          textAlign: 'center',
        }}
      >
        Diterbitkan secara digital pada {doc.issuedAtLabel} &bull; tercatat pada basis data TiDB
        Cloud.
      </p>
    </div>
  );
};
