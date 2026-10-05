import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTerjemahan } from '../lib/i18n';

/** Nada warna ubin ikon — dibedakan per jenis/tingkat keparahan. */
export type IconTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

const TILE_CLASS: Readonly<Record<IconTone, string>> = {
  success: 'tile-success',
  info: 'tile-info',
  warning: 'tile-warning',
  danger: 'tile-danger',
  neutral: 'tile-neutral',
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'error' | 'danger' | 'neutral';
  /** Warna ubin ikon; default netral (brand biru). */
  iconTone?: IconTone;
  /** Tooltip opsional untuk nilai (mis. nominal Rupiah utuh). */
  valueTitle?: string;
  /** Klik untuk menelusuri ke halaman terkait. */
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'info',
  iconTone = 'neutral',
  valueTitle,
  onClick,
}) => {
  const clickable = Boolean(onClick);
  // T-0074: terjemahkan label bila prop berupa kunci kamus; string biasa
  // (hasil format dinamis) lolos apa adanya karena `t` fallback ke input.
  const { t } = useTerjemahan();
  const judul = t(title);
  return (
    <div
      className={clickable ? 'card-premium focus-ring' : 'card-premium'}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `${t('statcard.buka_detail')} ${judul}` : undefined}
      onKeyDown={
        clickable && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{
        padding: 'var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-secondary)' }}>
          {judul}
        </span>
        <div
          className={TILE_CLASS[iconTone]}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-eight)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      <div
        title={valueTitle}
        style={{
          fontSize: '24px',
          fontWeight: 800,
          color: 'var(--text-strong)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', marginTop: '2px', flexWrap: 'wrap' }}>
        {subtitle && (
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-secondary)', flex: '1 1 auto', minWidth: 0 }}>
            {t(subtitle)}
          </span>
        )}
        {badgeText && (
          <span className={`badge badge-${badgeType}`} style={{ fontSize: '11px', padding: '2px 8px', flexShrink: 0, flex: '0 0 auto' }}>
            {t(badgeText)}
          </span>
        )}
      </div>
    </div>
  );
};
