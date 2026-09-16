/**
 * Komponen pagination reusable.
 * Menerima total item, halaman aktif, ukuran halaman, dan callback onPageChange.
 * Tidak fetch data — hanya UI kontrol; data dipotong oleh pemanggil.
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginatorProps {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function usePagination<T>(items: T[], limit: number, page: number): T[] {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}

export const Paginator: React.FC<PaginatorProps> = ({ total, page, limit, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const from = Math.min((page - 1) * limit + 1, total);
  const to = Math.min(page * limit, total);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid var(--color-border)',
        fontSize: '12.5px',
        color: 'var(--color-secondary)',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <span>
        Menampilkan <strong>{from}–{to}</strong> dari <strong>{total}</strong> data
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
          className="btn-secondary"
          style={{ padding: '5px 8px', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={14} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | '…')[]>((acc, p, idx, arr) => {
            if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--color-secondary)' }}>…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                aria-label={`Halaman ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={p === page ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '5px 10px', fontSize: '12px', minWidth: '32px' }}
              >
                {p}
              </button>
            )
          )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
          className="btn-secondary"
          style={{ padding: '5px 8px', fontSize: '12px', opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
