/**
 * Tab "Penyewaan Saya": tabel riwayat permohonan & transaksi sewa lengkap
 * dengan tahap berikutnya (mesin `buildRentalJourney` yang sama dengan API).
 */
import { getEquipmentImage } from '../../../lib/stitchAssets';
import { formatRupiah } from '../../../lib/businessRules';
import { RENTAL_NEXT_ACTION_LABEL } from '../../../lib/portal';
import type { RentalJourneyRow } from '../../../lib/portal';

interface Props {
  perjalanan: RentalJourneyRow[];
  onOpenTab: (tab: 'contracts' | 'payments') => void;
}

export const MyRentalsTab: React.FC<Props> = ({ perjalanan, onOpenTab }) => (
  <div className="card-premium" style={{ padding: '20px' }}>
    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 16px 0' }}>
      Riwayat Permohonan & Transaksi Sewa Saya
    </h3>
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Kode Transaksi</th>
            <th>Unit Alat Berat</th>
            <th>Jadwal Operasional</th>
            <th>Durasi Proyek</th>
            <th>Estimasi Biaya</th>
            <th>Status Sewa</th>
            <th>Tahap Berikutnya</th>
          </tr>
        </thead>
        <tbody>
          {perjalanan.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                Belum ada transaksi sewa. Silakan pilih alat pada menu Katalog Alat.
              </td>
            </tr>
          ) : (
            perjalanan.map(({ rental: r, statusLabel, statusTone, stageLabel, stageTone, nextAction }) => {
              const imgUrl = getEquipmentImage(r.equipment_code);
              return (
                <tr key={r.id}>
                  <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                    {r.rental_code}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={imgUrl} alt={r.equipment_name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{r.equipment_name}</div>
                        <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{r.equipment_code}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {r.start_date} s/d {r.end_date}
                  </td>
                  <td style={{ fontSize: '13px' }}>
                    <strong>{r.total_days} Hari</strong>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-strong)', fontFamily: 'monospace' }}>
                    {formatRupiah(Number(r.subtotal))}
                  </td>
                  <td>
                    <span className={`badge badge-${statusTone}`}>{statusLabel}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={`badge badge-${stageTone}`} style={{ fontSize: '11px' }}>{stageLabel}</span>
                      {/* Tindakan berikutnya hanya ditampilkan bila
                          giliran pelanggan bertindak. */}
                      {nextAction !== null && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenTab(nextAction === 'TANDA_TANGAN_KONTRAK' ? 'contracts' : 'payments')
                          }
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            textAlign: 'left',
                          }}
                        >
                          {RENTAL_NEXT_ACTION_LABEL[nextAction]}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);
