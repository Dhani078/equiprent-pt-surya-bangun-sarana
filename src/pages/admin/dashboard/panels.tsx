/**
 * Panel analytics dashboard administrator (T-0061).
 *
 * Dipisah dari `AdminDashboard.tsx` supaya berkas induk fokus pada alur data;
 * kedua panel ini murni tampilan — datanya datang lewat props.
 */
import { Gauge, Users } from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import { useTerjemahan } from '../../../lib/i18n';
import { formatRupiah } from '../../../lib/businessRules';
import type { TopCustomerRow, UtilisasiBulananItem } from '../../../lib/analytics';
import { getTingkatUtilisasi } from '../../../lib/analytics';

export const PanelUtilisasiBulanan: React.FC<{ data: readonly UtilisasiBulananItem[] }> = ({ data }) => {
  const { t } = useTerjemahan();
  if (data.length === 0) {
    return (
      <div className="card-premium" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          Utilisasi Armada per Bulan
        </h3>
        <EmptyState
          pesan={t('dashboard.kosong_top')}
          keterangan={t('dashboard.kosong_utilisasi_sub')}
          ariaLabel="Belum ada data utilisasi armada"
        />
      </div>
    );
  }

  // Persentase maksimum dipakai untuk menentukan nada warna puncak.
  const puncak = Math.max(...data.map((d) => d.persentase));
  const nadaPuncak = getTingkatUtilisasi(puncak);
  const warnaPuncak = nadaPuncak === 'success' ? 'var(--fg-success-deep)' : nadaPuncak === 'warning' ? 'var(--fg-amber)' : 'var(--fg-danger)';

  // Geometri bar — skala sumbu Y 0–100% (utilisasi selalu persen).
  const TINGGI = 170;
  const PAD_ATAS = 14;
  const PAD_BAWAH = 26;
  const areaTinggi = TINGGI - PAD_ATAS - PAD_BAWAH;
  const lebarBar = Math.min(40, (100 / data.length) * 0.55);

  return (
    <div className="card-premium animate-fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gauge size={18} color="var(--color-primary)" />
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
              {t('dashboard.utilisasi_bulanan')}
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--color-secondary)', margin: '2px 0 0 0' }}>
              Unit disewa ÷ total armada — 12 bulan terakhir
            </p>
          </div>
        </div>
        <span
          aria-live="polite"
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: warnaPuncak,
            backgroundColor: `${warnaPuncak}14`,
            padding: '5px 10px',
            borderRadius: '6px',
          }}
        >
          {t('dashboard.puncak', { n: puncak })}
        </span>
      </div>

      <svg
        viewBox={`0 0 100 ${TINGGI}`}
        role="img"
        aria-label={`Grafik utilisasi armada per bulan. ${data.map((d) => `${d.label}: ${d.persentase} persen (${d.unitDisewa} dari ${d.totalUnit} unit)`).join(', ')}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        preserveAspectRatio="none"
      >
        {/* Garis kisi 0/25/50/75/100% */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = PAD_ATAS + areaTinggi - (pct / 100) * areaTinggi;
          return (
            <g key={`kisi-${pct}`}>
              <line x1={9} y1={y} x2={100} y2={y} stroke="var(--color-border)" strokeWidth={0.3} strokeDasharray={pct === 0 ? '0' : '1.5 1.5'} />
              <text x={7} y={y + 1} textAnchor="end" fontSize={3.2} fill="var(--color-secondary)">
                {pct}%
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = 10 + (i / data.length) * 90 + (90 / data.length - lebarBar) / 2;
          const tinggi = Math.max(0.5, (d.persentase / 100) * areaTinggi);
          const y = PAD_ATAS + areaTinggi - tinggi;
          const nada = getTingkatUtilisasi(d.persentase);
          const warna = nada === 'success' ? 'var(--fg-success-deep)' : nada === 'warning' ? 'var(--fg-amber)' : 'var(--fg-danger)';
          return (
            <g key={d.label}>
              <title>{`${d.label}: ${d.persentase}% (${d.unitDisewa} dari ${d.totalUnit} unit)`}</title>
              <rect x={x} y={y} width={lebarBar} height={tinggi} rx={1.2} fill={warna} opacity={0.9} />
              <text
                x={x + lebarBar / 2}
                y={TINGGI - 8}
                textAnchor="middle"
                fontSize={3.4}
                fill="var(--color-secondary)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/** Daftar 5 pelanggan teratas berdasarkan nilai penyewaan. */
export const PanelTopCustomer: React.FC<{ data: readonly TopCustomerRow[] }> = ({ data }) => {
  const { t } = useTerjemahan();
  return (
  <div className="card-premium animate-fade-in" style={{ padding: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <Users size={18} color="var(--color-primary)" />
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          {t('dashboard.top_customer')}
        </h3>
        <p style={{ fontSize: '11.5px', color: 'var(--color-secondary)', margin: '2px 0 0 0' }}>
          Berdasarkan total nilai penyewaan
        </p>
      </div>
    </div>

    {data.length === 0 ? (
      <EmptyState
        pesan={t('dashboard.kosong_top')}
        keterangan={t('dashboard.kosong_top_sub')}
        ariaLabel="Belum ada data pelanggan"
      />
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.map((item, idx) => {
          const medalColors = ['#F59E0B', 'var(--text-faint)', '#CD7F32'];
          const medalColor = medalColors[idx] ?? 'var(--color-secondary)';
          const barPct = Math.round(
            (item.totalNilai / (data[0]?.totalNilai || 1)) * 100
          );
          return (
            <div
              key={item.customer_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-eight)',
                border: '1px solid var(--color-border)',
                backgroundColor: idx === 0 ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-raised)',
              }}
            >
              <div
                aria-label={`Peringkat ${idx + 1}`}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: medalColor,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                  <span
                    style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={item.company_name ? `${item.company_name}` : item.nama}
                  >
                    {item.nama}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-primary)', flexShrink: 0 }}>
                    {formatRupiah(item.totalNilai)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                    {t('dashboard.sewa_kali', { n: item.jumlahRental })}{item.company_name ? ` · ${item.company_name}` : ''}
                  </span>
                  <div
                    style={{ height: '4px', width: '38%', backgroundColor: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}
                    role="progressbar"
                    aria-valuenow={barPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${barPct}% dari pelanggan terbesar`}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${barPct}%`,
                        borderRadius: '2px',
                        background: medalColor,
                        transition: 'width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
  );
};
