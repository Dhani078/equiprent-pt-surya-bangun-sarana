import React from 'react';
import { StatCard } from '../../components/StatCard';
import { DollarSign, Truck, ClipboardList, Wrench, Users, ArrowUpRight, Clock, AlertTriangle } from 'lucide-react';
import { Equipment, Rental, Maintenance, User, Payment } from '../../types';

interface AdminDashboardProps {
  equipments: Equipment[];
  rentals: Rental[];
  maintenance: Maintenance[];
  users: User[];
  payments: Payment[];
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  equipments,
  rentals,
  maintenance,
  users,
  payments,
  onNavigate
}) => {
  const totalRevenue = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const activeRentals = rentals.filter(r => r.status === 'ON_GOING' || r.status === 'APPROVED');
  const urgentMaintenance = maintenance.filter(m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS');
  const customersCount = users.filter(u => u.role_id === 3).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            Dashboard Eksekutif Administrator
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-light)', margin: '4px 0 0 0' }}>
            Pemantauan performa finansial, utilisasi armada alat berat, dan agenda pemeliharaan PT. SBS Banjarmasin.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onNavigate('equipment')} className="btn-primary" style={{ fontSize: '13px', padding: '8px 14px' }}>
            <Truck size={15} />
            <span>Kelola Unit</span>
          </button>
          <button onClick={() => onNavigate('tracking')} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 14px' }}>
            <span>Live GPS Map</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px'
      }}>
        <StatCard
          title="Total Pendapatan Terbayar"
          value={formatCurrency(totalRevenue)}
          subtitle="Akumulasi pembayaran sewa lunas"
          icon={DollarSign}
          badgeText="Lunas"
          badgeType="success"
        />
        <StatCard
          title="Total Armada Alat Berat"
          value={`${equipments.length} Unit`}
          subtitle={`${equipments.filter(e => e.status === 'AVAILABLE').length} siap sewa, ${equipments.filter(e => e.status === 'RENTED').length} tersewa`}
          icon={Truck}
          badgeText="Operasional"
          badgeType="info"
        />
        <StatCard
          title="Transaksi Sewa Aktif"
          value={`${activeRentals.length} Kontrak`}
          subtitle="Unit beroperasi di lapangan"
          icon={ClipboardList}
          badgeText="On Going"
          badgeType="info"
        />
        <StatCard
          title="Jadwal Servis Mendesak"
          value={`${urgentMaintenance.length} Unit`}
          subtitle="Perlu inspeksi teknisi mekanik"
          icon={Wrench}
          badgeText="Penting"
          badgeType="warning"
        />
      </div>

      {/* Two Column Grid: Recent Rentals & Urgent Maintenance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Recent Rentals Card */}
        <div className="card-premium" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                Transaksi Penyewaan Terbaru
              </h3>
            </div>
            <button
              onClick={() => onNavigate('rentals')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Lihat Semua Transaksi &rarr;
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode Sewa</th>
                  <th>Klien Perusahaan</th>
                  <th>Alat Berat</th>
                  <th>Subtotal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rentals.slice(0, 5).map((r) => (
                  <tr key={r.id}>
                    <td className="serial-code" style={{ fontWeight: 600, fontSize: '12px', color: 'var(--color-primary)' }}>
                      {r.rental_code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.company_name || r.customer_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>{r.customer_name}</div>
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      <div>{r.equipment_name}</div>
                      <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>{r.equipment_code}</span>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '13px' }}>
                      {formatCurrency(Number(r.subtotal))}
                    </td>
                    <td>
                      <span className={`badge badge-${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Urgent Maintenance Card */}
        <div className="card-premium" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#F59E0B" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                  Antrean Servis & Pemeliharaan
                </h3>
              </div>
              <button
                onClick={() => onNavigate('maintenance')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Atur Jadwal &rarr;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {urgentMaintenance.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-eight)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: '#F8FAFC',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="serial-code" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {m.maintenance_code}
                    </span>
                    <span className={`badge badge-${m.status.toLowerCase()}`} style={{ fontSize: '10px' }}>
                      {m.status}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1E293B' }}>
                    {m.equipment_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                    {m.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-secondary-light)', marginTop: '2px' }}>
                    <span>HM: <strong>{m.hour_meter_at_maintenance} jam</strong></span>
                    <span>Tgl: {m.scheduled_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Telemetry Summary */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#EFF6FF',
            borderRadius: 'var(--radius-eight)',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                GPS Telemetri Aktif Kalsel
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                Pelabuhan Trisakti, Banjarbaru, Tabalong
              </div>
            </div>
            <button onClick={() => onNavigate('tracking')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '11.5px' }}>
              Buka Peta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
