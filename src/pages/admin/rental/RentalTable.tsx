import React from 'react';
import { Rental } from '../../../types';
import { getEquipmentImage } from '../../../lib/stitchAssets';
import { formatRupiah, formatTanggal } from '../../../lib/businessRules';
import {
  getAllowedNextStatuses,
  getLateReturnInfo,
  getRentalStatusLabel,
  getRentalStatusTone,
} from '../../../lib/rentalWorkflow';
import type { RentalStatus } from '../../../lib/rentalWorkflow';
import { Paginator, usePagination } from '../../../components/Paginator';
import { SkeletonRows } from '../../../components/Skeleton';
import { EmptyState } from '../../../components/EmptyState';
import { CheckCircle, XCircle, Truck, CircleCheck, ClipboardList } from 'lucide-react';

const PAGE_SIZE_RENTAL = 20;

/** Warna badge mengikuti design system §7 (hijau=aktif, kuning=pending, dst). */
const TONE_STYLE: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
  success: { backgroundColor: 'var(--bg-green-soft)', color: 'var(--fg-success-deeper)', borderColor: '#A7F3D0' },
  info: { backgroundColor: 'var(--bg-blue-soft)', color: 'var(--fg-info-deep)', borderColor: 'var(--border-blue-soft)' },
  warning: { backgroundColor: 'var(--bg-amber-soft)', color: 'var(--fg-warning-deep)', borderColor: 'var(--border-amber-soft)' },
  danger: { backgroundColor: 'var(--bg-red-soft)', color: 'var(--fg-danger-deep)', borderColor: 'var(--border-red-soft)' },
  neutral: { backgroundColor: 'var(--bg-subtle)', color: 'var(--text-body)', borderColor: 'var(--color-border)' },
};

/** Label & ikon untuk tombol aksi — mengikuti matriks transisi terpusat. */
const ACTION_META: Record<string, { label: string; tone: 'success' | 'danger' | 'info' | 'neutral' }> = {
  APPROVED: { label: 'Setujui', tone: 'success' },
  REJECTED: { label: 'Tolak', tone: 'danger' },
  ON_GOING: { label: 'Mobilisasi', tone: 'info' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
};

const TOMBOL_STYLE: Record<string, React.CSSProperties> = {
  success: { backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFFFFF' },
  danger: { backgroundColor: 'var(--color-surface)', borderColor: 'var(--border-red-soft)', color: '#EF4444' },
  info: { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#FFFFFF' },
  neutral: {},
};

interface RentalTableProps {
  rentals: Rental[];
  petaDenda: Map<number, ReturnType<typeof getLateReturnInfo>>;
  isLoading: boolean;
  searchTerm: string;
  filterStatus: string;
  onResetFilter: () => void;
  /** Minta konfirmasi sebelum transisi status (approve/reject/mobilisasi/selesai). */
  onAskConfirm: (rental: Rental, next: RentalStatus) => void;
}

/**
 * Tabel transaksi sewa: thumbnail unit, periode, biaya + denda, badge status,
 * dan tombol aksi sesuai matriks transisi. Paginasi & empty state di dalam.
 */
export const RentalTable: React.FC<RentalTableProps> = ({
  rentals,
  petaDenda,
  isLoading,
  searchTerm,
  filterStatus,
  onResetFilter,
  onAskConfirm,
}) => {
  const [page, setPage] = React.useState(1);
  React.useEffect(() => setPage(1), [searchTerm, filterStatus]);
  const pagedRentals = usePagination(rentals, PAGE_SIZE_RENTAL, page);

  /** Baris tombol aksi untuk satu rental. */
  const renderAksi = (r: Rental) => {
    const tujuan = getAllowedNextStatuses(r.status);

    if (tujuan.length === 0) {
      return (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: r.status === 'COMPLETED' ? 'var(--fg-success-deep)' : 'var(--color-secondary)',
          }}
        >
          {r.status === 'COMPLETED' ? 'Tuntas ✓' : 'Ditolak'}
        </span>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {tujuan.map((next) => {
          const meta = ACTION_META[next];
          const Ikon =
            next === 'APPROVED' ? CheckCircle
              : next === 'REJECTED' ? XCircle
                : next === 'ON_GOING' ? Truck
                  : CircleCheck;

          return (
            <button
              key={next}
              onClick={() => onAskConfirm(r, next)}
              className={next === 'REJECTED' ? 'btn-secondary' : 'btn-primary'}
              style={{
                padding: '5px 10px',
                fontSize: '11.5px',
                ...TOMBOL_STYLE[meta.tone],
              }}
              aria-label={`${meta.label} transaksi ${r.rental_code}`}
              title={`${meta.label} — ${getRentalStatusLabel(next)}`}
            >
              <Ikon size={12} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="table-container">
      {isLoading ? (
        <SkeletonRows
          ariaLabel="Memuat daftar transaksi penyewaan"
          count={5}
          height={56}
          gap={12}
        />
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Kode Sewa</th>
                <th>Pelanggan & Korporasi</th>
                <th>Unit Alat Berat</th>
                <th>Periode Sewa</th>
                <th style={{ textAlign: 'right' }}>Total Biaya</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedRentals.map((r) => {
                const imgUrl = getEquipmentImage(r.equipment_code);
                const denda = petaDenda.get(r.id);
                const tone = getRentalStatusTone(r.status);
                const gaya = TONE_STYLE[tone] ?? TONE_STYLE.neutral;

                return (
                  <tr key={r.id}>
                    <td className="serial-code" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}>
                      {r.rental_code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--color-primary)' }}>{r.company_name || r.customer_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>{r.customer_name}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={imgUrl} alt={r.equipment_name} style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.equipment_name}</div>
                          <span className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{r.equipment_code}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      <div>Mulai: <strong>{formatTanggal(r.start_date)}</strong></div>
                      <div>Selesai: <strong>{formatTanggal(r.end_date)}</strong></div>
                      {denda && denda.isLate && (
                        <div style={{ marginTop: '4px', fontSize: '11.5px', color: 'var(--fg-danger-deep)', fontWeight: 600 }}>
                          Terlambat {denda.lateDays} hari
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="serial-code" style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-strong)' }}>
                        {formatRupiah(Number(r.subtotal))}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                        {r.total_days} hari operasional
                      </div>
                      {denda && denda.isLate && (
                        <div style={{ fontSize: '11px', color: 'var(--fg-danger-deep)', fontWeight: 600 }}>
                          Denda {formatRupiah(denda.penalty)}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          border: `1px solid ${gaya.borderColor}`,
                          backgroundColor: gaya.backgroundColor,
                          color: gaya.color,
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {r.status}
                      </span>
                      <div style={{ marginTop: '4px', fontSize: '10.5px', color: 'var(--color-secondary)' }}>
                        {getRentalStatusLabel(r.status)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderAksi(r)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Paginator
            total={rentals.length}
            page={page}
            limit={PAGE_SIZE_RENTAL}
            onPageChange={setPage}
          />

          {rentals.length === 0 && (
            <EmptyState
              pesan={searchTerm || filterStatus !== 'ALL'
                ? 'Tidak ada transaksi yang cocok'
                : 'Belum ada transaksi penyewaan'}
              keterangan={searchTerm || filterStatus !== 'ALL'
                ? 'Ubah kata kunci pencarian atau pilih status lain pada penyaring di atas.'
                : 'Transaksi baru akan muncul di sini setelah pelanggan mengajukan sewa.'}
              ariaLabel="Daftar transaksi penyewaan kosong"
              ikon={ClipboardList}
              aksi={searchTerm || filterStatus !== 'ALL' ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onResetFilter}
                  style={{ marginTop: '4px', padding: '7px 14px', fontSize: '12.5px' }}
                >
                  Reset Penyaring
                </button>
              ) : undefined}
            />
          )}
        </>
      )}
    </div>
  );
};
