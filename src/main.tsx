import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PenyediaBahasa } from './lib/i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PenyediaBahasa>
      <App />
    </PenyediaBahasa>
  </React.StrictMode>
);

/**
 * PWA: pendaftaran service worker (T-0062).
 *
 * Hanya didaftarkan saat BUILD PRODUKSI. Vite dev server menyajikan ulang
 * berkas dari memori, sehingga caching di dev membuat perubahan tidak
 * pernah terlihat — itu adalah sumber bug paling umum service worker.
 *
 * `public/sw.js` disajikan apa adanya oleh Vite (folder public), jadi
 * scope-nya tepat di root domain.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(() => {
        // Kegagalan registrasi TIDAK boleh memutus aplikasi — PWA adalah
        // peningkatan progresif (progressive enhancement). Tanpa service
        // worker aplikasi tetap berjalan secara online.
      });
  });
}
