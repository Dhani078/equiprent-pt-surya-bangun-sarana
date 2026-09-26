/**
 * T-0072 — ErrorBoundary global.
 *
 * Tanpa boundary, satu komponen yang melempar error saat render membuat
 * seluruh aplikasi jadi layar putih (React 18 `createRoot` meng-unmount
 * pohon saat error tak tertangkap). Boundary menangkap galat render/
 * lifecycle/constructor di subtree-nya lalu menampilkan panel pemulihan:
 * pengguna bisa mencoba ulang (reset state boundary) atau memuat ulang
 * halaman penuh bila error bersifat keras.
 *
 * Batas sadar: error pada event handler & async promise TIDAK tertangkap
 * (memang bukan cakupan ErrorBoundary React) — keduanya sudah ditangani
 * per-modul lewat try/catch + notify().
 *
 * `onError` opsional dipakai test & telemetry; di produksi kita tidak
 * punya endpoint crash-report, jadi cukup console.error bawaan React.
 */

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * Render sebagai pembungkus elemen (untuk instance per-rute) — default
   * div blok biasa.
   */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  /** Ganti kunci (mis. pindah rute/user login) = coba lagi otomatis. */
  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  private handleReset = () => this.setState({ error: null });

  private handleReload = () => window.location.reload();

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className="card-premium animate-fade-in"
        role="alert"
        aria-live="assertive"
        style={{
          margin: '40px auto',
          maxWidth: '640px',
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          textAlign: 'center',
          borderLeft: '4px solid var(--color-error)',
        }}
      >
        <div style={{ fontSize: '34px', lineHeight: 1 }} aria-hidden="true">⚠️</div>
        <h2 style={{ margin: 0, fontSize: 'var(--fs-h1)', fontWeight: 800, color: 'var(--color-primary)' }}>
          Terjadi Kesalahan pada Halaman Ini
        </h2>
        <p style={{ margin: 0, fontSize: 'var(--fs-body)', color: 'var(--color-secondary)', maxWidth: '460px' }}>
          Bagian aplikasi gagal ditampilkan, tetapi data Anda tetap aman.
          Coba tampilkan ulang bagian ini — bila masalah berlanjut, muat ulang
          halaman atau keluar lalu masuk kembali.
        </p>
        <p
          className="serial-code"
          style={{
            margin: 0,
            fontSize: 'var(--fs-xs)',
            color: 'var(--color-secondary-light)',
            maxWidth: '520px',
            wordBreak: 'break-word',
          }}
        >
          {error.message || 'Kesalahan tidak diketahui.'}
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" className="btn-primary" onClick={this.handleReset}>
            Coba Tampilkan Ulang
          </button>
          <button type="button" className="btn-secondary" onClick={this.handleReload}>
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }
}
