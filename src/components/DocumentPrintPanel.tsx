import React, { useCallback, useMemo, useState } from 'react';
import { Printer, FileCheck2, AlertTriangle, Inbox } from 'lucide-react';
import type { Equipment, Rental } from '../types';
import { formatRupiah } from '../lib/businessRules';
import {
  DOCUMENT_KINDS,
  buildDocument,
  getDocumentKindLabel,
  type DocumentKind,
} from '../lib/documents';
import { printDocument } from '../lib/documentPrinter';
import { DocumentPreview } from './DocumentPreview';
import { Modal } from './Modal';

interface DocumentPrintPanelProps {
  /** Seluruh transaksi sewa — dipakai untuk memilih dasar dokumen. */
  rentals: Rental[];
  /** Daftar unit — dipakai untuk melengkapi rincian merek/model & HM. */
  equipments: Equipment[];
  /** Nama petugas yang menerbitkan dokumen. */
  issuedBy?: string;
}

/** Rental yang statusnya layak diterbitkan dokumennya. */
const ELIGIBLE_STATUSES: ReadonlyArray<Rental['status']> = [
  'APPROVED',
  'ON_GOING',
  'COMPLETED',
];

/**
 * Panel penerbitan dokumen operasional siap cetak (BAST OUT, BAST IN,
 * Surat Jalan).
 *
 * Alur: pilih transaksi → pilih jenis dokumen → buka pratinjau → cetak.
 * Pratinjau sengaja ditampilkan lebih dulu agar petugas dapat memeriksa
 * rincian sebelum menghabiskan kertas.
 */
export const DocumentPrintPanel: React.FC<DocumentPrintPanelProps> = ({
  rentals,
  equipments,
  issuedBy,
}) => {
  const [rentalId, setRentalId] = useState<number | null>(null);
  const [kind, setKind] = useState<DocumentKind>('BAST_OUT');
  const [preview, setPreview] = useState<DocumentKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hanya rental yang sudah disetujui yang boleh diterbitkan dokumennya;
  // PENDING/REJECTED dicegah di tingkat data, bukan hanya di UI.
  const eligibleRentals = useMemo(
    () => rentals.filter((r) => ELIGIBLE_STATUSES.includes(r.status)),
    [rentals]
  );

  const selectedRental = useMemo(
    () => eligibleRentals.find((r) => r.id === rentalId) ?? null,
    [eligibleRentals, rentalId]
  );

  const selectedEquipment = useMemo(() => {
    if (!selectedRental) return null;
    return equipments.find((e) => e.id === selectedRental.equipment_id) ?? null;
  }, [equipments, selectedRental]);

  const document = useMemo(() => {
    if (!selectedRental) return null;
    return buildDocument({
      kind,
      rental: selectedRental,
      equipment: selectedEquipment,
      issuedBy,
    });
  }, [kind, selectedRental, selectedEquipment, issuedBy]);

  const handleCetak = useCallback(() => {
    if (!document) return;

    const hasil = printDocument(document, new Date());
    if (!hasil.ok) {
      setError(hasil.message);
      return;
    }
    setError(null);
  }, [document]);

  const handleTutupPratinjau = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <section
      className="card-premium animate-fade-in"
      style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}
      aria-label="Panel penerbitan dokumen siap cetak"
    >
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
          <FileCheck2 size={19} color="var(--color-primary)" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)' }}>
            Dokumen Operasional Siap Cetak (A4)
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-secondary-light)' }}>
            BAST Out, BAST In, dan Surat Jalan dicetak pada kertas A4 dengan kop surat resmi PT. SBS.
          </p>
        </div>
      </div>

      {eligibleRentals.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '32px 20px',
            border: '1px dashed var(--color-border)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <Inbox size={28} color="#94A3B8" />
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
            Belum ada transaksi siap terbit
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-secondary-light)' }}>
            Dokumen hanya dapat diterbitkan untuk transaksi berstatus disetujui, berjalan, atau
            selesai.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                htmlFor="pilih-transaksi-dokumen"
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}
              >
                TRANSAKSI SEWA
              </label>
              <select
                id="pilih-transaksi-dokumen"
                className="input-premium"
                value={rentalId === null ? '' : String(rentalId)}
                onChange={(e) => {
                  const nilai = e.target.value;
                  setRentalId(nilai === '' ? null : Number(nilai));
                  setError(null);
                }}
                aria-label="Pilih transaksi sewa sebagai dasar dokumen"
              >
                <option value="">— Pilih transaksi —</option>
                {eligibleRentals.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.rental_code} — {r.customer_name ?? 'Pelanggan'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                htmlFor="pilih-jenis-dokumen"
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}
              >
                JENIS DOKUMEN
              </label>
              <select
                id="pilih-jenis-dokumen"
                className="input-premium"
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value as DocumentKind);
                  setError(null);
                }}
                aria-label="Pilih jenis dokumen yang akan diterbitkan"
              >
                {DOCUMENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {getDocumentKindLabel(k)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRental && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px 24px',
                padding: '14px',
                background: '#F8FAFC',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: 'var(--color-secondary)',
              }}
            >
              <span>
                Unit: <strong>{selectedRental.equipment_name ?? '-'}</strong>
              </span>
              <span>
                Periode:{' '}
                <strong>
                  {selectedRental.start_date} s.d. {selectedRental.end_date}
                </strong>
              </span>
              <span>
                Nilai sewa: <strong>{formatRupiah(selectedRental.subtotal)}</strong>
              </span>
            </div>
          )}

          {error && (
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
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={!document}
              onClick={() => document && setPreview(document.kind)}
              style={{ padding: '9px 14px', fontSize: '13px', opacity: document ? 1 : 0.5 }}
              aria-label="Buka pratinjau dokumen"
            >
              Buka Pratinjau
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!document}
              onClick={handleCetak}
              style={{ padding: '9px 16px', fontSize: '13px', opacity: document ? 1 : 0.5 }}
              aria-label="Cetak dokumen ke kertas A4"
            >
              <Printer size={15} />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--color-secondary-light)' }}>
            Pada dialog cetak peramban, pilih tujuan <strong>Simpan sebagai PDF</strong> untuk
            memperoleh berkas PDF ukuran A4.
          </p>
        </>
      )}

      {preview !== null && document !== null && (
        <Modal
          isOpen={true}
          onClose={handleTutupPratinjau}
          title={`Pratinjau — ${getDocumentKindLabel(document.kind)}`}
        >
          <DocumentPreview doc={document} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '16px',
            }}
          >
            <button type="button" className="btn-secondary" onClick={handleTutupPratinjau}>
              Tutup
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCetak}
              aria-label="Cetak dokumen dari pratinjau"
            >
              <Printer size={15} />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
};
