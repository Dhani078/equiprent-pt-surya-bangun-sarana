import React from 'react';
import { Rental } from '../../../types';
import { getEquipmentImage } from '../../../lib/stitchAssets';
import { formatRupiah, formatRupiahRingkas, formatTanggal } from '../../../lib/businessRules';
import { StatusBadge } from '../../../components/StatusBadge';

interface RentalApprovalTableProps {
  rentals: Rental[];
  onUpdateStatus: (id: number, status: Rental['status']) => void;
}

/** Tabel permohonan booking masuk pelanggan + tombol Setujui/Tolak staf. */
export const RentalApprovalTable: React.FC<RentalApprovalTableProps> = ({ rentals, onUpdateStatus }) => (
  <div className="card-premium" style={{ padding: '20px' }}>
    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 14px 0' }}>
      Permohonan Booking Masuk dari Pelanggan
    </h3>
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Kode Sewa</th>
            <th>Pelanggan</th>
            <th>Alat Berat</th>
            <th>Tanggal Sewa</th>
            <th style={{ textAlign: 'right' }}>Total Biaya</th>
            <th style={{ textAlign: 'center' }}>Status</th>
            <th style={{ textAlign: 'center' }}>Aksi Staf</th>
          </tr>
        </thead>
        <tbody>
          {rentals.map((r) => {
            const imgUrl = getEquipmentImage(r.equipment_code);
            return (
              <tr key={r.id}>
                <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                  {r.rental_code}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{r.customer_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{r.company_name}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={imgUrl} alt={r.equipment_name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.equipment_name}</div>
                      <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{r.equipment_code}</span>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '12px' }}>
                  {formatTanggal(r.start_date)} s/d {formatTanggal(r.end_date)} ({r.total_days} hari)
                </td>
                <td className="serial-code" style={{ textAlign: 'right', fontWeight: 700 }} title={formatRupiah(Number(r.subtotal))}>
                  {formatRupiahRingkas(Number(r.subtotal)).ringkas}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <StatusBadge kind="rental" status={r.status} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  {r.status === 'PENDING' ? (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(r.id, 'APPROVED')}
                        className="btn-primary"
                        style={{ padding: '4px 8px', fontSize: '11.5px', backgroundColor: '#10B981' }}
                        aria-label={`Setujui pengajuan ${r.rental_code}`}
                      >
                        Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(r.id, 'REJECTED')}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11.5px', color: '#EF4444' }}
                        aria-label={`Tolak pengajuan ${r.rental_code}`}
                      >
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--fg-success-deep)', fontWeight: 600 }}>
                      {r.status} ✓
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
