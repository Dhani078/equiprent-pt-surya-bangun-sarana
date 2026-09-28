/**
 * Antrean mutasi offline (siklus 70).
 *
 * Saat jaringan putus, mutasi yang sudah divalidasi UI tidak dibuang: ia
 * masuk antrean FIFO di localStorage dan dikirim ulang otomatis ketika
 * koneksi pulih. Urutan dipertahankan (POST rental -> PUT status tidak bisa
 * tertukar), dan guard server tetap menjadi penentu terakhir — bila sebuah
 * mutasi ditolak (mis. 409 kode ganda), ia dibuang dan pesannya dilaporkan.
 *
 * Modul ini murni penyimpanan; pengiriman dilakukan db.ts (lewat jembatan)
 * agar token sesi & format respons cukup satu implementasi.
 */

export interface AntreanMutasi {
  method: 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  /** epoch ms saat masuk antrean (untuk tampilan & batas kedaluwarsa) */
  dibuatAt: number;
}

const KUNCI = 'sbs_mutasi_antrean';
const MAKS = 100;

/** Memori saja saat di luar browser (unit test node). */
let memori: AntreanMutasi[] | null = null;

function bacaRaw(): AntreanMutasi[] {
  try {
    if (typeof localStorage === 'undefined') return memori ?? [];
    const mentah = localStorage.getItem(KUNCI);
    if (!mentah) return [];
    const arr = JSON.parse(mentah);
    return Array.isArray(arr) ? (arr as AntreanMutasi[]) : [];
  } catch {
    return [];
  }
}

function tulisRaw(list: AntreanMutasi[]): void {
  memori = list;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KUNCI, JSON.stringify(list));
    }
  } catch {
    /* kuota penuh: antrean tetap hidup di memori */
  }
}

const pendengar = new Set<() => void>();
function beriTahu(): void {
  for (const fn of pendengar) fn();
}

export function berlanggananAntrean(fn: () => void): () => void {
  pendengar.add(fn);
  return () => {
    pendengar.delete(fn);
  };
}

export function bacaAntrean(): AntreanMutasi[] {
  return bacaRaw();
}

export function jumlahAntrean(): number {
  return bacaRaw().length;
}

/** Tambah mutasi di ekor antrean. Kembalikan false bila penuh (MAKS). */
export function tambahAntrean(m: AntreanMutasi): boolean {
  const list = bacaRaw();
  if (list.length >= MAKS) return false;
  tulisRaw([...list, m]);
  beriTahu();
  return true;
}

/** Buang item ke-i (setelah dikirim/ditolak permanen). */
export function buangAntreanKe(i: number): void {
  const list = bacaRaw();
  if (i < 0 || i >= list.length) return;
  tulisRaw(list.filter((_, idx) => idx !== i));
  beriTahu();
}

/** Bersihkan seluruh antrean (pakai hati-hati: hanya untuk reset uji). */
export function bersihkanAntrean(): void {
  tulisRaw([]);
  beriTahu();
}
