import { useCallback, useState } from 'react';
import { FileSignature, Printer } from 'lucide-react';
import { printHtmlDocument } from '../lib/documentPrinter';
import {
  buildContractFilename,
  getContractStatusTone,
  isSafeSignatureDataUrl,
  renderContractHtml,
} from '../lib/contracts';
import type { ContractPreview } from '../lib/contracts';

/**
 * Pratinjau Kontrak Digital
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Menampilkan isi kontrak persis seperti yang akan tercetak pada kertas A4:
 * kop surat, para pihak, rincian objek sewa, syarat & ketentuan, serta blok
 * tanda tangan. Menjadi satu komponen yang dipakai baik oleh Admin/Staf
 * (menerbitkan & meninjau) maupun Pelanggan (menandatangani).
 *
 * Pencetakan didelegasikan ke `printHtmlDocument()` — satu-satunya tempat
 * yang menyentuh `window.open`, sehingga komponen ini tetap murni dan
 * mudah diuji tanpa peramban.
 */

/** Warna badge status mengikuti design system §7. */
const TONE_STYLE: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
  success: { backgroundColor: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' },
  warning: { backgroundColor: '#FFFBEB', color: '#92400E', borderColor: '#FDE68A' },
};

export interface ContractViewerProps {
  /** Model pratinjau hasil `buildContractPreview()`. */
  preview: ContractPreview;
  /** Tampilkan tombol cetak. Nonaktif bila pratinjau dipakai sekadar baca. */
  showPrint?: boolean;
}

/** Blok tanda tangan untuk satu pihak. */
const SignatureBlock: React.FC<{ label: string; name: string; role: string; signature?: string | null; signedAtLabel?: string | null }> = ({
  label,
  name,
  role,
  signature,
  signedAtLabel,
}) => (
  <div style={{ width: '46%', textAlign: 'center', fontSize: '11px' }}>
    <div style={{ color: 'var(--color-secondary)', marginBottom: '6px' }}>{label}</div>

    <div
      style={{
        height: '72px',
        border: '1px dashed var(--color-border)',
        borderRadius: '8px',
        backgroundColor: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {isSafeSignatureDataUrl(signature) ? (
        <img
          src={signature as string}
          alt={`Tanda tangan ${name}`}
          style={{ maxHeight: '64px', maxWidth: '100%' }}
        />
      ) : (
        <span style={{ color: '#CBD5E1', fontSize: '10.5px' }}>Belum ditandatangani</span>
      )}
    </div>

    <div style={{ marginTop: '6px', fontWeight: 700, textDecoration: 'underline' }}>{name}</div>
    <div style={{ color: 'var(--color-secondary)', fontSize: '10.5px' }}>{role}</div>
    {signedAtLabel !== null && signedAtLabel !== undefined && (
      <div style={{ color: '#94A3B8', fontSize: '10px', marginTop: '2px' }}>{signedAtLabel}</div>
    )}
  </div>
);

export const ContractViewer: React.FC<ContractViewerProps> = ({ preview, showPrint = true }) => {
  const tone = TONE_STYLE[getContractStatusTone(preview.status)] ?? TONE_STYLE.warning;
  const [printError, setPrintError] = useState<string | null>(null);

  const handlePrint = useCallback(() => {
    // Berkas HTML disusun dari model yang sama dengan pratinjau di layar,
    // sehingga hasil cetak tidak pernah berbeda dengan yang dilihat.
    const hasil = printHtmlDocument({
      html: renderContractHtml(preview),
      title: buildContractFilename(preview),
    });

    // Kegagalan (popup diblokir) wajib diberitahukan — tanpa ini tombol
    // cetak tampak "mati" padahal peramban yang memblokirnya.
    setPrintError(hasil.ok ? null : hasil.message);
  }, [preview]);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Kop surat */}
      <div
        style={{
          textAlign: 'center',
          borderBottom: '3px double #003366',
          paddingBottom: '12px',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.02em',
            color: '#003366',
          }}
        >
          PT. SURYA BANGUN SARANA BANJARMASIN
        </p>
        <p style={{ margin: '3px 0 0 0', fontSize: '10.5px', fontWeight: 600, color: '#475569' }}>
          Heavy Equipment Rental, Earthmoving Contractor &amp; Fleet Monitoring System
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#64748B' }}>
          Jl. Ahmad Yani KM 5, Banjarmasin, Kalimantan Selatan &bull; Telp: (0511) 7890123
        </p>
      </div>

      {/* Judul & status */}
      <div style={{ textAlign: 'center' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 800,
            textTransform: 'uppercase',
            textDecoration: 'underline',
            color: '#003366',
          }}
        >
          {preview.title}
        </h3>
        <div
          style={{
            marginTop: '6px',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#64748B',
          }}
        >
          Nomor: {preview.code}
        </div>
        <span
          style={{
            display: 'inline-block',
            marginTop: '8px',
            padding: '3px 10px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            ...tone,
            border: `1px solid ${tone.borderColor}`,
          }}
        >
          {preview.statusLabel}
        </span>
      </div>

      {/* Pembuka */}
      <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.7, textAlign: 'justify' }}>
        {preview.intro}
      </p>

      {/* Pasal 1 — Para pihak & objek sewa */}
      <div>
        <h4
          style={{
            margin: '0 0 8px 0',
            fontSize: '11.5px',
            fontWeight: 800,
            color: '#003366',
            textTransform: 'uppercase',
          }}
        >
          Pasal 1 — Para Pihak &amp; Objek Sewa
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
          <tbody>
            {preview.fields.map((field) => (
              <tr key={field.label}>
                <td style={{ width: '38%', padding: '5px 0', color: '#475569', verticalAlign: 'top' }}>
                  {field.label}
                </td>
                <td style={{ width: '2%', padding: '5px 0', color: '#475569' }}>:</td>
                <td
                  style={{
                    padding: '5px 0',
                    fontWeight: 600,
                    fontFamily: field.mono === true ? 'monospace' : 'inherit',
                  }}
                >
                  {field.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pasal 2 — Syarat & ketentuan */}
      <div>
        <h4
          style={{
            margin: '0 0 8px 0',
            fontSize: '11.5px',
            fontWeight: 800,
            color: '#003366',
            textTransform: 'uppercase',
          }}
        >
          Pasal 2 — Syarat &amp; Ketentuan
        </h4>
        <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', lineHeight: 1.7, textAlign: 'justify' }}>
          {preview.terms.map((term) => (
            <li key={term} style={{ marginBottom: '5px' }}>
              {term}
            </li>
          ))}
        </ol>
      </div>

      {/* Catatan legalitas */}
      <p
        style={{
          margin: 0,
          padding: '10px 12px',
          backgroundColor: '#F1F5F9',
          borderLeft: '3px solid #003366',
          fontSize: '11px',
          color: '#334155',
          lineHeight: 1.6,
        }}
      >
        {preview.notes}
      </p>

      {/* Blok tanda tangan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        <SignatureBlock {...preview.parties.left} />
        <SignatureBlock {...preview.parties.right} />
      </div>

      {printError !== null && (
        <div
          role="alert"
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            fontSize: '11.5px',
          }}
        >
          {printError}
        </div>
      )}

      {/* Aksi cetak */}
      {showPrint && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handlePrint}
            aria-label={`Cetak kontrak ${preview.code}`}
            style={{ padding: '7px 14px', fontSize: '12px' }}
          >
            <Printer size={14} />
            <span>Cetak Kontrak (A4)</span>
          </button>
        </div>
      )}

      {/* Penanda dokumen */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderTop: '1px solid #E2E8F0',
          paddingTop: '10px',
          fontSize: '10px',
          color: '#94A3B8',
        }}
      >
        <FileSignature size={13} />
        <span>Diterbitkan digital pada {preview.issuedAtLabel}</span>
      </div>
    </div>
  );
};

export default ContractViewer;
