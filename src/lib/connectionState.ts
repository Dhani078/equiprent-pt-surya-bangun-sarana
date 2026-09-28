/**
 * Status koneksi Worker (siklus 69).
 *
 * Cermin browser hanya semantik bila Worker menjawab. Selama ini kegagalan
 * sinkron ditelan diam-diam (terisi===0 -> tanpa error) sehingga pengguna
 * tidak tahu datanya basi / mutasi tidak sampai server. Modul ini menjadi
 * satu sumber kebenaran status koneksi untuk banner UI.
 */

export type StatusKoneksi = 'ONLINE' | 'OFFLINE';

export interface InfoKoneksi {
  status: StatusKoneksi;
  /** Alasan manusiawi saat OFFLINE (mis. "Worker tidak terjangkau"). */
  pesan: string;
  /** Kapan terakhir kali status berubah (epoch ms). */
  sejak: number;
}

let info: InfoKoneksi = { status: 'ONLINE', pesan: '', sejak: Date.now() };
const pendengar = new Set<() => void>();

function beriTahu(): void {
  for (const fn of pendengar) fn();
}

/** Langganan store (kompatibel useSyncExternalStore). */
export function berlanggananKoneksi(fn: () => void): () => void {
  pendengar.add(fn);
  return () => pendengar.delete(fn);
}

export function bacaKoneksi(): InfoKoneksi {
  return info;
}

export function tandaiOffline(pesan: string): void {
  if (info.status === 'OFFLINE' && info.pesan === pesan) return;
  info = { status: 'OFFLINE', pesan, sejak: Date.now() };
  beriTahu();
}

export function tandaiOnline(): void {
  if (info.status === 'ONLINE') return;
  info = { status: 'ONLINE', pesan: '', sejak: Date.now() };
  beriTahu();
}
