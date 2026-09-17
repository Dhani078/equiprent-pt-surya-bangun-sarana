/**
 * Audit Trail — pencatatan mutasi penting operasional.
 *
 * Store: in-memory ring buffer (maks 1000 entri).
 * Tidak perlu DB untuk demo sidang — data ada selama Worker hidup.
 * ponytail: simpan ke tabel `audit_log` saat DATABASE_URL tersedia.
 */

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
  log.push({
    id: seq,
    timestamp: new Date().toISOString(),
    ...entry,
  });
}

/** Kembalikan entri terbaru dulu, dibatasi `limit`. */
export function getAuditLog(limit = 100): AuditEntry[] {
  const hasil = log.slice().reverse();
  return hasil.slice(0, Math.min(limit, MAX_ENTRIES));
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
