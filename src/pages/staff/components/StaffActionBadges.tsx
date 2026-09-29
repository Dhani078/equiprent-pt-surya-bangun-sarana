import React from 'react';
import { ClipboardCheck, CreditCard, FileCheck } from 'lucide-react';

export type StaffSubTab = 'payments' | 'contracts' | 'rentals';

interface StaffActionBadgesProps {
  activeSubTab: StaffSubTab;
  onSelect: (tab: StaffSubTab) => void;
  pendingPayments: number;
  readyToVerify: number;
  awaitingProof: number;
  pendingRentals: number;
  totalContracts: number;
}

const TOMBOLOT: React.CSSProperties = {
  padding: '16px',
  borderRadius: 'var(--radius-eight)',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

/** Tiga kartu aksi (pembayaran / permohonan sewa / kontrak) sekaligus pemilih sub-tab. */
export const StaffActionBadges: React.FC<StaffActionBadgesProps> = ({
  activeSubTab, onSelect, pendingPayments, readyToVerify, awaitingProof, pendingRentals, totalContracts,
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
    <button
      type="button"
      onClick={() => onSelect('payments')}
      style={{ ...TOMBOLOT, border: activeSubTab === 'payments' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', backgroundColor: activeSubTab === 'payments' ? 'var(--bg-blue-soft)' : 'var(--color-surface)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
          Verifikasi Pembayaran
        </span>
        <CreditCard size={18} color="var(--color-primary)" />
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
        {pendingPayments} Menunggu
      </div>
      <div style={{ fontSize: '11.5px', color: 'var(--color-secondary)', marginTop: '2px' }}>
        {readyToVerify} siap · {awaitingProof} tanpa bukti
      </div>
    </button>

    <button
      type="button"
      onClick={() => onSelect('rentals')}
      style={{ ...TOMBOLOT, border: activeSubTab === 'rentals' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', backgroundColor: activeSubTab === 'rentals' ? 'var(--bg-blue-soft)' : 'var(--color-surface)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
          Permohonan Sewa Masuk
        </span>
        <ClipboardCheck size={18} color="var(--color-primary)" />
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
        {pendingRentals} Order
      </div>
    </button>

    <button
      type="button"
      onClick={() => onSelect('contracts')}
      style={{ ...TOMBOLOT, border: activeSubTab === 'contracts' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', backgroundColor: activeSubTab === 'contracts' ? 'var(--bg-blue-soft)' : 'var(--color-surface)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
          Total Kontrak Aktif
        </span>
        <FileCheck size={18} color="var(--color-primary)" />
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
        {totalContracts} Dokumen
      </div>
    </button>
  </div>
);
