import { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, PenLine, Undo2 } from 'lucide-react';

/**
 * Kanvas Tanda Tangan Elektronik
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Menghasilkan goresan tanda tangan sebagai **data URL PNG** yang siap
 * disimpan ke basis data dan disematkan pada dokumen kontrak.
 *
 * Keputusan teknis yang penting:
 * - Kanvas diskalakan mengikuti **Device Pixel Ratio** (DPR). Tanpa ini
 *   hasil `toDataURL()` tampak pecah pada layar retina/HD.
 * - Memakai **Pointer Events** (bukan hanya mouse) agar stylus & layar
 *   sentuh bekerja — pelanggan kerap menandatangani lewat tablet di site.
 * - `touch-action: none` mencegah halaman ikut tergulung saat jari
 *   menggambar di atas kanvas.
 * - Setelah goresan selesai, riwayat kanvas disimpan agar tombol
 *   "Urungkan" bisa membatalkan sapuan terakhir tanpa menghapus semuanya.
 */

/** Jumlah maksimal riwayat sapuan yang disimpan untuk fitur "Urungkan". */
const MAX_HISTORY = 10;

export interface SignatureCanvasProps {
  /** Dipanggil setiap goresan berubah: data URL PNG, atau '' bila kosong. */
  onChange: (dataUrl: string) => void;
  /** Lebar kanvas dalam piksel CSS. */
  width?: number;
  /** Tinggi kanvas dalam piksel CSS. */
  height?: number;
  /** Nonaktifkan kanvas (misalnya kontrak sudah ditandatangani). */
  disabled?: boolean;
  /** Label untuk pembaca layar. */
  ariaLabel?: string;
}

/**
 * Menandai apakah kanvas memiliki goresan.
 *
 * Memindai piksel adalah satu-satunya cara andal: `toDataURL()` pada kanvas
 * kosong pun menghasilkan string panjang, jadi panjang string tidak bisa
 * dipakai sebagai penanda.
 */
function hasInk(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // Alpha > 0 berarti ada piksel yang ditulisi (kanvas transparan saat kosong).
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return true;
  }
  return false;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onChange,
  width = 520,
  height = 180,
  disabled = false,
  ariaLabel = 'Kanvas tanda tangan elektronik',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const [hasSignature, setHasSignature] = useState(false);

  /**
   * Menyiapkan kanvas: skala DPR + gaya pena.
   *
   * Dijalankan ulang bila ukuran berubah agar kanvas tidak pernah
   * tergambar pada resolusi yang sudah usang.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Skala konteks ke DPR supaya koordinat yang dipakai saat menggambar
    // tetap dalam satuan piksel CSS.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#001E40';

    // Kanvas sengaja dibiarkan transparan (tidak diisi putih) agar
    // tanda tangan menyatu dengan latar dokumen saat dicetak.
    ctx.clearRect(0, 0, width, height);
  }, [width, height]);

  /** Menyimpan keadaan kanvas ke riwayat sebelum sapuan baru dimulai. */
  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    historyRef.current.push(canvas.toDataURL('image/png'));
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
  }, []);

  /** Mengabarkan perubahan ke induk. */
  const emit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const kosong = !hasInk(canvas);
    setHasSignature(!kosong);
    onChange(kosong ? '' : canvas.toDataURL('image/png'));
  }, [onChange]);

  /** Mengubah koordinat pointer menjadi koordinat kanvas. */
  const toCanvasPoint = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
    };
  }, [width, height]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      // Tangkap pointer agar goresan tidak terputus walau kursor keluar
      // sebentar dari area kanvas.
      canvas.setPointerCapture(event.pointerId);

      pushHistory();
      drawingRef.current = true;

      const point = toCanvasPoint(event);
      if (!point) return;

      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      // Titik tunggal (nok) harus tetap meninggalkan bekas.
      ctx.lineTo(point.x + 0.1, point.y + 0.1);
      ctx.stroke();
    },
    [disabled, pushHistory, toCanvasPoint]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled || !drawingRef.current) return;

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      const point = toCanvasPoint(event);
      if (!point) return;

      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    },
    [disabled, toCanvasPoint]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;

      const canvas = canvasRef.current;
      if (canvas?.hasPointerCapture(event.pointerId) === true) {
        canvas.releasePointerCapture(event.pointerId);
      }

      emit();
    },
    [emit]
  );

  /** Mengosongkan kanvas sepenuhnya. */
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    historyRef.current = [];
    ctx.clearRect(0, 0, width, height);
    setHasSignature(false);
    onChange('');
  }, [onChange, width, height]);

  /** Memulangkan sapuan terakhir. */
  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const previous = historyRef.current.pop();
    // Riwayat habis berarti tidak ada lagi yang bisa diurungkan —
    // kosongkan kanvas agar pengguna tidak terjebak pada keadaan usang.
    if (!previous) {
      handleClear();
      return;
    }

    const image = new Image();
    image.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, width, height);
      // Gambar disimpan dalam piksel fisik, jadi transform DPR dinetralkan
      // sementara agar tidak menggandakan skala.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(image, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      emit();
    };
    image.src = previous;
  }, [emit, handleClear]);

  const borderColor = disabled ? '#CBD5E1' : hasSignature ? '#003366' : '#94A3B8';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: `${width}px`,
          border: `2px dashed ${borderColor}`,
          borderRadius: '8px',
          backgroundColor: disabled ? '#F1F5F9' : '#FAFAFA',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={ariaLabel}
          style={{
            display: 'block',
            width: '100%',
            height: `${height}px`,
            cursor: disabled ? 'not-allowed' : 'crosshair',
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* Petunjuk menghilang setelah goresan pertama dibuat. */}
        {!hasSignature && !disabled && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#94A3B8',
              fontSize: '12.5px',
              pointerEvents: 'none',
            }}
          >
            <PenLine size={15} />
            <span>Goreskan tanda tangan Anda di sini</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
          {hasSignature ? 'Tanda tangan siap disimpan' : 'Belum ada goresan tanda tangan'}
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleUndo}
            disabled={disabled || !hasSignature}
            aria-label="Urungkan sapuan terakhir"
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              opacity: disabled || !hasSignature ? 0.5 : 1,
              cursor: disabled || !hasSignature ? 'not-allowed' : 'pointer',
            }}
          >
            <Undo2 size={14} />
            <span>Urungkan</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleClear}
            disabled={disabled || !hasSignature}
            aria-label="Bersihkan seluruh goresan tanda tangan"
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              color: '#B91C1C',
              opacity: disabled || !hasSignature ? 0.5 : 1,
              cursor: disabled || !hasSignature ? 'not-allowed' : 'pointer',
            }}
          >
            <Eraser size={14} />
            <span>Bersihkan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvas;
