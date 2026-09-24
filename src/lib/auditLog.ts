/**
 * Audit Trail — pencatatan mutasi penting operasional.
 *
 * Store:
 *   1. In-memory ring buffer (maks 1000 entri) — selalu diisi, sebagai
 *      fallback saat DB belum terhubung dan sebagai cache baca cepat.
 *   2. Tabel `audit_log` saat TiDB tersedia — penulisan permanen yang
 *      bertahan melewati pergantian isolate (edge worker).
 *
 * Kedua jalur dipakai bersamaan: DB adalah kebenaran permanen, buffer
 * memori adalah cache baca agar GET tidak menyentuh DB setiap kali.
 */

import { executeSql, isDatabaseConnected } from './db';

export interface AuditEntry {
  id: number;
  timestamp: string;     // ISO 8601
  user_id: number | null;
  username: string;
  role: string;
  action: string;        // e.g. LOGIN, RENTAL_STATUS_CHANGE
  entity: string;        // e.g. rental, payment, maintenance
  entity_id: number | null;
  detail: string;        // ringkasan singkat yang bisa dibaca manusia
}

const MAX_ENTRIES = 1000;
const log: AuditEntry[] = [];
let seq = 0;

export function auditLog(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
  if (log.length >= MAX_ENTRIES) log.shift(); // buang entri terlama
  seq += 1;
  const entri: AuditEntry = {
    id: seq,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  log.push(entri);

  // Tulis permanen bila DB tersedia. Fire-and-forget: kegagalan tulis tidak
  // boleh memutus aksi utama (audit adalah catatan sampingan), dan entri
  // tetap tersedia di buffer memori untuk permintaan ini.
  if (isDatabaseConnected()) {
    void persistAuditEntry(entri);
  }
}

/**
 * Masukkan satu entri ke tabel `audit_log`.
 * Parameter dikirim terpisah — tidak ada string SQL yang dirangkai dari
 * input pengguna.
 */
async function persistAuditEntry(entry: AuditEntry): Promise<void> {
  try {
    await executeSql(
      'INSERT INTO `audit_log` (`user_id`, `username`, `role`, `action`, `entity`, `entity_id`, `detail`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        entry.user_id,
        entry.username,
        entry.role,
        entry.action,
        entry.entity,
        entry.entity_id,
        entry.detail,
        entry.timestamp,
      ]
    );
  } catch {
    // Buffer memori masih menyimpan entri; penulisan permanen hanya gagal
    // untuk permintaan ini. Diamkan agar aksi utama tetap berjalan.
    // ponytail: naik ke retry/antrian bila kelangsungan audit harus dijamin.
  }
}

/**
 * Kembalikan entri terbaru dulu, dibatasi `limit` (synchronous).
 *
 * Buffer memori adalah sumber baca: cepat (tanpa jaringan) dan selalu terisi
 * oleh `auditLog()` pada isolate ini. Tanda tangan fungsi tetap sama agar
 * pemanggil yang sudah ada (UI, API, pengujian) tidak perlu diubah.
 */
export function getAuditLog(limit = 100): AuditEntry[] {
  const hasil = log.slice().reverse();
  return hasil.slice(0, Math.min(limit, MAX_ENTRIES));
}

/** Tandai buffer sudah diperkaya; isolate lain menulis langsung ke DB. */
let auditDimuat = false;

/**
 * Muat riwayat audit permanen dari DB ke buffer memori (sekali per isolate).
 * Dipanggil endpoint /api/audit-log sebelum membaca, sehingga entri dari
 * isolate lain (yang tidak berbagi memori) tetap terlihat. Sinkron & aman
 * bila DB belum terhubung / tabel belum dibuat.
 */
export async function hydrateAuditLog(): Promise<void> {
  if (!isDatabaseConnected() || auditDimuat) return;
  auditDimuat = true;

  try {
    const rows = await executeSql<{
      id: number;
      user_id: number | null;
      username: string;
      role: string;
      action: string;
      entity: string;
      entity_id: number | null;
      detail: string;
      created_at: string;
    }>(
      'SELECT `id`, `user_id`, `username`, `role`, `action`, `entity`, `entity_id`, `detail`, `created_at` FROM `audit_log` ORDER BY `id` DESC LIMIT ?',
      [MAX_ENTRIES]
    );

    // Buffer diganti dengan salinan DB (urutan tersimpan: tertua → termuda).
    log.length = 0;
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      const r = rows[i];
      if (!r) continue;
      log.push({
        id: r.id,
        timestamp: r.created_at,
        user_id: r.user_id,
        username: r.username,
        role: r.role,
        action: r.action,
        entity: r.entity,
        entity_id: r.entity_id,
        detail: typeof r.detail === 'string' ? r.detail : '',
      });
    }
    const terakhir = log[log.length - 1];
    seq = terakhir ? Math.max(seq, terakhir.id) : seq;
  } catch {
    // Tabel belum dibuat / salah skema → buffer memori tetap dipakai.
    auditDimuat = false;
  }
}

/**
 * Identitas pelaku aksi — selalu diambil dari sesi server-side, tidak pernah
 * dari body request, sehingga catatan tidak bisa dipalsukan.
 *
 * `username` di auditLog fallback ke userId karena lapisan API tidak selalu
 * memuat nama pengguna; ini dipertahankan agar kolom tetap terisi.
 */
export interface AuditActor {
  user_id: number | null;
  username: string;
  role: string;
}

export function auditActor(c: { get: (k: 'userId' | 'role') => unknown }): AuditActor {
  const uid = c.get('userId');
  const userId = typeof uid === 'number' ? uid : null;
  const role = c.get('role');
  return {
    user_id: userId,
    username: String(userId ?? 'system'),
    role: typeof role === 'string' ? role : 'UNKNOWN',
  };
}
