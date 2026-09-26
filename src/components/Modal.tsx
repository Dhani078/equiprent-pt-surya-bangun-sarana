import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Elemen yang bisa difokuskan — urutan Tab dijaga sesuai DOM. */
const FOKUSABEL =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * T-0073 — dialog aksesibel:
 *  - role="dialog" + aria-modal, diberi nama lewat aria-labelledby;
 *  - focus awal ke box dialog, Tab/Shift+Tab dikunci di dalam (focus trap),
 *    Esc menutup, fokus pengembali dikembalikan saat tutup;
 *  - scroll latar dikunci; klik overlay menutup;
 *  - dirender lewat portal ke <body> supaya posisi DOM-nya (dan urutan
 *    pembaca layar) keluar dari layout halaman.
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const pemicuRef = useRef<HTMLElement | null>(null);
  const judulId = useId();

  useEffect(() => {
    if (!isOpen) return;

    pemicuRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const box = boxRef.current;
    box?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && box) {
        const nodes = Array.from(box.querySelectorAll<HTMLElement>(FOKUSABEL)).filter(
          (el) => el.offsetParent !== null || el === document.activeElement,
        );
        if (nodes.length === 0) {
          e.preventDefault();
          box.focus();
          return;
        }
        const pertama = nodes[0];
        const terakhir = nodes[nodes.length - 1];
        const aktif = document.activeElement;
        // Wrapping manual: Tab dari elemen terakhir -> pertama, Shift+Tab
        // dari pertama -> terakhir. (Jika fokus di luar daftar, Tab masuk
        // ke elemen pertama.)
        if (e.shiftKey && (aktif === pertama || aktif === box)) {
          e.preventDefault();
          terakhir.focus();
        } else if (!e.shiftKey && aktif === terakhir) {
          e.preventDefault();
          pertama.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      pemicuRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const markup = (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={boxRef}
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={judulId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <h3 id={judulId} style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );

  // SSR/test tanpa DOM: kembalikan markupnya; browser normal: portal ke body.
  return typeof document === 'undefined' ? markup : createPortal(markup, document.body);
};
