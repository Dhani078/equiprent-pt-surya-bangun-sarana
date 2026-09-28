/**
 * Header portal pelanggan + navigasi 5 tab.
 *
 * Dipisah dari `CustomerPortal.tsx` supaya berkas induk fokus pada alur data;
 * komponen ini murni tampilan (menerima `activeTab` + `onSelect`).
 */
import { ClipboardList, CreditCard, FileCheck, MapPin, Truck } from 'lucide-react';
import { STITCH_IMAGES } from '../../../lib/stitchAssets';
import type { CustomerPortalTab } from './types';

/** Definisi tab: id, judul, dan subjudul bawaan. */
const TAB_META: ReadonlyArray<{ id: CustomerPortalTab; judul: string; sub: (jumlahBaris: number) => string }> = [
  { id: 'catalog', judul: 'Katalog Alat Berat', sub: () => 'Jelajahi & Ajukan Sewa' },
  { id: 'my_rentals', judul: 'Sewa Saya', sub: () => 'Riwayat & Status Sewa' },
  { id: 'contracts', judul: 'Kontrak', sub: (n) => `${n} Dokumen` },
  { id: 'payments', judul: 'Pembayaran', sub: () => 'Unggah & Verifikasi' },
  { id: 'tracking', judul: 'Lacak Unit Saya', sub: (n) => `${n} Unit Beroperasi` },
];

interface Props {
  namaPengguna: string;
  perusahaan: string | null;
  activeTab: CustomerPortalTab;
  onSelect: (tab: CustomerPortalTab) => void;
  jumlahKontrak: number;
  jumlahSewa: number;
  jumlahTagihan: number;
  jumlahUnitBeroperasi: number;
  /** Unit yang benar-benar bisa dipesan sekarang (bukan sekadar tersedia). */
  unitSiapSewa: number;
  /** Jumlah tagihan yang belum lunas — ditampilkan sebagai peringatan. */
  tagihanBelumBayar: number;
}

export const PortalHeader: React.FC<Props> = ({
  namaPengguna,
  perusahaan,
  activeTab,
  onSelect,
  jumlahKontrak,
  jumlahSewa,
  jumlahTagihan,
  jumlahUnitBeroperasi,
  unitSiapSewa,
  tagihanBelumBayar,
}) => (
    <>
      {/* Customer Header Banner */}
      <div style={{
        padding: '24px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src={STITCH_IMAGES.CUSTOMER_AVATAR}
            alt={namaPengguna}
            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                Selamat Datang, {namaPengguna}
              </h2>
              <span className="badge badge-info" style={{ fontSize: '11px' }}>
                {perusahaan || 'Pelanggan Terverifikasi'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-secondary)', margin: '4px 0 0 0' }}>
              Portal Pemesanan Alat Berat, Penandatanganan Kontrak Digital, dan Konfirmasi Pembayaran Sewa.
            </p>
          </div>
        </div>

        {/* Dedicated Account Manager Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          backgroundColor: 'var(--bg-raised)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)'
        }}>
          <img
            src={STITCH_IMAGES.MANAGER_AVATAR}
            alt="Account Manager PT SBS"
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              Account Manager Anda
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
              Rahmat Hidayat, S.T.
            </div>
            <div style={{ fontSize: '11px', color: 'var(--fg-success-deep)', fontWeight: 600 }}>
              WA: +62 811-500-8899 (Online)
            </div>
          </div>
        </div>
      </div>

      {/* 5 Interactive Navigation Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <button
          type="button"
          onClick={() => onSelect('catalog')}
          style={{
            padding: '14px',
            borderRadius: '8px',
            border: activeTab === 'catalog' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'catalog' ? 'var(--bg-blue-soft)' : 'var(--color-surface)',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'catalog' ? 'var(--color-primary)' : 'var(--bg-subtle)',
            color: activeTab === 'catalog' ? '#FFFFFF' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Truck size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: activeTab === 'catalog' ? 'var(--color-primary)' : 'var(--text-strong)' }}>
              Katalog Alat
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
              {unitSiapSewa} Unit Siap Sewa
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('my_rentals')}
          style={{
            padding: '14px',
            borderRadius: '8px',
            border: activeTab === 'my_rentals' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'my_rentals' ? 'var(--bg-blue-soft)' : 'var(--color-surface)',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'my_rentals' ? 'var(--color-primary)' : 'var(--bg-subtle)',
            color: activeTab === 'my_rentals' ? '#FFFFFF' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ClipboardList size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: activeTab === 'my_rentals' ? 'var(--color-primary)' : 'var(--text-strong)' }}>
              Sewa Saya
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
              {jumlahSewa} Transaksi
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('contracts')}
          style={{
            padding: '14px',
            borderRadius: '8px',
            border: activeTab === 'contracts' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'contracts' ? 'var(--bg-blue-soft)' : 'var(--color-surface)',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'contracts' ? 'var(--color-primary)' : 'var(--bg-subtle)',
            color: activeTab === 'contracts' ? '#FFFFFF' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileCheck size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: activeTab === 'contracts' ? 'var(--color-primary)' : 'var(--text-strong)' }}>
              Kontrak & E-Sign
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
              {jumlahKontrak} Berkas Kontrak
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('payments')}
          style={{
            padding: '14px',
            borderRadius: '8px',
            border: activeTab === 'payments' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'payments' ? 'var(--bg-blue-soft)' : 'var(--color-surface)',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'payments' ? 'var(--color-primary)' : 'var(--bg-subtle)',
            color: activeTab === 'payments' ? '#FFFFFF' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CreditCard size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: activeTab === 'payments' ? 'var(--color-primary)' : 'var(--text-strong)' }}>
              Tagihan & Transfer
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
              {tagihanBelumBayar > 0
                ? `${tagihanBelumBayar} tagihan belum dibayar`
                : `${jumlahTagihan} Pembayaran`}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('tracking')}
          style={{
            padding: '14px',
            borderRadius: '8px',
            border: activeTab === 'tracking' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'tracking' ? 'var(--bg-blue-soft)' : 'var(--color-surface)',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
          aria-label="Lacak posisi unit sewa saya"
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'tracking' ? 'var(--color-primary)' : 'var(--bg-subtle)',
            color: activeTab === 'tracking' ? '#FFFFFF' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MapPin size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: activeTab === 'tracking' ? 'var(--color-primary)' : 'var(--text-strong)' }}>
              Lacak Unit Saya
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
              {jumlahUnitBeroperasi} Unit Beroperasi
            </div>
          </div>
        </button>
      </div>
    </>
  );
