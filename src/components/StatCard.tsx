import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'error';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'info'
}) => {
  return (
    <div className="card-premium" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary-light)' }}>
          {title}
        </span>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-eight)',
          backgroundColor: '#F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary)'
        }}>
          <Icon size={20} />
        </div>
      </div>

      <div style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        {subtitle && (
          <span style={{ fontSize: '12px', color: 'var(--color-secondary-light)' }}>
            {subtitle}
          </span>
        )}
        {badgeText && (
          <span className={`badge badge-${badgeType}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
