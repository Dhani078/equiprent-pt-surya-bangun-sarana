/**
 * Panel riwayat servis per unit + ringkasan biaya & tren hour meter.
 *
 * Murni tampilan: seluruh perhitungan (unitsWithHistory, serviceHistory,
 * historySummary) datang dari induk lewat props.
 */
import { Wrench } from 'lucide-react';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatRupiah } from '../../../lib/businessRules';
import type { Equipment, Maintenance } from '../../../types';

/** Ringkasan satu unit untuk panel riwayat. */
export interface RingkasanRiwayatServis {
  totalServis: number;
  selesai: number;
  totalBiaya: number;
  rataBiaya: number;
  hmAkhir: number;
}

interface Props {
  equipments: readonly Equipment[];
  unitDipilih: number | 'ALL';
  onPilihUnit: (id: number | 'ALL') => void;
  /** Unit yang punya catatan servis (dipakai untuk daftar pilihan & hitungan). */
  unitsWithHistory: readonly Equipment[];
  serviceHistory: readonly Maintenance[];
  historySummary: RingkasanRiwayatServis;
}

export const ServiceHistoryPanel: React.FC<Props> = ({
  equipments,
  unitDipilih: historyUnitId,
  onPilihUnit: setHistoryUnitId,
  unitsWithHistory,
  serviceHistory,
  historySummary,
}) => (
  <div className="card-premium" style={{ padding: '16px 18px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
    <Wrench size={18} color="var(--fg-teal)" />
    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
      Riwayat Servis per Unit
    </h3>

    <select
      className="input-premium"
      value={historyUnitId}
      onChange={(e) => setHistoryUnitId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
      style={{ marginLeft: 'auto', width: 'auto', minWidth: '240px', height: '36px', fontSize: '12.5px' }}
      aria-label="Pilih unit untuk melihat riwayat servis"
    >
      <option value="ALL">— Pilih unit untuk melihat riwayat —</option>
      {unitsWithHistory.map(u => (
        <option key={u.id} value={u.id}>
          {u.equipment_code} — {u.name}
        </option>
      ))}
    </select>
  </div>

  {historyUnitId === 'ALL' ? (
    <p style={{ fontSize: '12.5px', color: 'var(--color-secondary)', margin: 0 }}>
      Pilih salah satu unit di atas untuk melihat log servis, total biaya perawatan, dan tren hour meter.
      {unitsWithHistory.length > 0 && ` Tersedia ${unitsWithHistory.length} unit yang memiliki catatan servis.`}
    </p>
  ) : serviceHistory.length === 0 ? (
    <p style={{ fontSize: '12.5px', color: 'var(--color-secondary)', margin: 0 }}>
      Unit ini belum memiliki catatan servis.
    </p>
  ) : (
    <>
      {/* Ringkasan */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        {[
          { label: 'Total Servis', value: String(historySummary.totalServis) },
          { label: 'Selesai', value: `${historySummary.selesai}/${historySummary.totalServis}` },
          { label: 'Total Biaya', value: formatRupiah(historySummary.totalBiaya) },
          { label: 'Rata-rata / Servis', value: formatRupiah(historySummary.rataBiaya) },
          { label: 'HM Terakhir', value: `${historySummary.hmAkhir.toFixed(2)} HM` },
        ].map(item => (
          <div
            key={item.label}
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-raised)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)', marginBottom: '3px' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabel log servis */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
              {['Kode Servis', 'Tanggal', 'Jenis', 'HM', 'Suku Cadang', 'Biaya', 'Status'].map(h => (
                <th
                  key={h}
                  style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 700 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {serviceHistory.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {m.maintenance_code}
                </td>
                <td style={{ padding: '8px 10px' }}>{m.scheduled_date ?? '-'}</td>
                <td style={{ padding: '8px 10px' }}>{m.maintenance_type}</td>
                <td style={{ padding: '8px 10px' }}>
                  {Number(m.hour_meter_at_maintenance ?? 0).toFixed(2)}
                </td>
                <td style={{ padding: '8px 10px', maxWidth: '220px' }}>
                  <span style={{ color: 'var(--color-secondary)' }}>
                    {m.spareparts_replaced || '-'}
                  </span>
                </td>
                <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700 }}>
                  {formatRupiah(Number(m.cost ?? 0))}
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <StatusBadge kind="maintenance" status={m.status} fontSize={10.5} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )}
</div>
);
