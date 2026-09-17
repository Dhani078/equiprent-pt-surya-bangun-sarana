/**
 * Bar progress Hour Meter menuju servis preventif berikutnya (T-0047).
 *
 * Memakai `getServiceStatus` dari `src/lib/businessRules.ts` sebagai SATU
 * sumber perhitungan agar ambang hijau/kuning/merah tidak drift antar
 * halaman. Warna mengikuti aturan semantik design system §7:
 * hijau = aman, kuning = mendekati, merah = lewat jadwal.
 *
 * Tooltip memakai atribut `title` bawaan browser — cukup untuk data
 * sekilas dan tetap dapat diakses keyboard, tanpa library baru.
 */

import React from 'react';
import type { Equipment, Maintenance } from '../types';
import { getServiceStatus, SERVICE_INTERVAL_HM } from '../lib/businessRules';

type Tone = 'safe' | 'warn' | 'due';

const TONE_COLOR: Record<Tone, string> = {
  safe: '#059669',
  warn: '#D97706',
  due: '#DC2626',
};

const TONE_LABEL: Record<Tone, string> = {
  safe: 'Aman',
  warn: 'Mendekati servis',
  due: 'Lewat jadwal servis',
};

/**
 * Membangun teks tooltip HM: nilai saat ini, target, dan sisa HM.
 * Disatukan di sini agar formatnya seragam di mana pun komponen dipakai.
 */
export function buildHmTooltip(status: ReturnType<typeof getServiceStatus>): string {
  const sisa = status.hmUntilNextService;
  const sisaText =
    sisa > 0
      ? `Sisa ${sisa.toFixed(2)} HM`
      : `Lewat ${Math.abs(sisa).toFixed(2)} HM dari target`;
  return [
    `HM saat ini: ${status.currentHM.toFixed(2)} jam`,
    `Target servis berikutnya: ${status.nextServiceTargetHM.toFixed(2)} HM`,
    `${sisaText} (interval ${SERVICE_INTERVAL_HM} HM)`,
  ].join('\n');
}

export interface HmProgressBarProps {
  equipment: Equipment;
  maintenanceHistory: readonly Maintenance[];
  /** Sembunyikan keterangan di kanan bar (untuk ruang sempit). */
  compact?: boolean;
}

export const HmProgressBar: React.FC<HmProgressBarProps> = ({
  equipment,
  maintenanceHistory,
  compact = false,
}) => {
  const status = getServiceStatus(equipment, maintenanceHistory);
  const tone: Tone = status.isDue ? 'due' : status.isApproaching ? 'warn' : 'safe';

  // Posisi bar: 0% di HM terakhir kali diservis, 100% di target servis.
  // Bila sudah lewat jadwal (sisa negatif), bar tetap penuh — merah utuh
  // lebih jelas sebagai sinyal daripada bar yang "mundur" tak terbatas.
  const span = Math.max(SERVICE_INTERVAL_HM, status.hmSinceLastService);
  const pct = Math.min(100, Math.max(0, (status.hmSinceLastService / span) * 100));
  const tooltip = buildHmTooltip(status);

  return (
    <div
      title={tooltip}
      role="img"
      aria-label={tooltip.replace(/\n/g, ' ')}
      style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>
          HM {status.currentHM.toFixed(0)}
        </span>
        {!compact && (
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: TONE_COLOR[tone] }}>
            {TONE_LABEL[tone]}
          </span>
        )}
      </div>
      <div
        style={{
          height: '7px',
          width: '100%',
          borderRadius: '999px',
          backgroundColor: 'var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '999px',
            backgroundColor: TONE_COLOR[tone],
            transition: 'width 0.4s ease, background-color 0.2s ease',
          }}
        />
      </div>
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-secondary-light)' }}>
          <span>Target {status.nextServiceTargetHM.toFixed(0)} HM</span>
          <span>Interval {SERVICE_INTERVAL_HM} HM</span>
        </div>
      )}
    </div>
  );
};
