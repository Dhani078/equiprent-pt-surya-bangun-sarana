import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Kotak galat login — role="alert" agar pembaca layar menyuarakannya
 * segera (keadaan galat adalah umpan balik wajib §5.2).
 */
export const LoginErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <div
    role="alert"
    style={{
      backgroundColor: 'var(--bg-rose-soft)',
      border: '1px solid #F87171',
      borderRadius: '8px',
      padding: '10px 14px',
      marginBottom: '18px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: 'var(--fg-danger-deep)',
      fontSize: '12.5px',
      lineHeight: 1.4,
    }}
  >
    <AlertCircle size={18} style={{ flexShrink: 0 }} />
    <span>{message}</span>
  </div>
);
