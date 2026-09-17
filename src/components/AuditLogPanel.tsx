import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Search, Filter, Download } from 'lucide-react';

/**
 * Panel Audit Trail — daftar mutasi penting yang tercatat di sistem.
 *
 * Data diambil dari GET /api/audit-log (RBAC: hanya ADMIN). Bila edge API
 * tidak terjangkau, state lokal (kosong) dipakai — panel tetap dapat dirender
 * tanpa error.
 *
 * ponytail: log permanen baru muncul setelah worker pertama kali melakukan
 * mutasi; pada IN_MEMORY_DEMO, log hilang saat isolate diganti.
 */

interface AuditEntry {
  id: number;
  timestamp: string;
  user_id: number | null;
  username: string;
  role: string;
  action: string;
  entity: string;
  entity_id: number | null;
  detail: string;
}

const SESSION_KEY = 'sbs_session_token';

function bacaToken(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/** Warna badge aksi sesuai kategori mutasi (design system §7). */
function warnaAksi(action: string): { bg: string; fg: string } {
  if (action.startsWith('DELETE') || action.includes('REJECT')) return { bg: '#FEE2E2', fg: '#991B1B' };
  if (action.includes('VERIFY') || action === 'LOGIN' || action.includes('CREATE')) return { bg: '#D1FAE5', fg: '#065F46' };
  if (action.includes('UPDATE') || action.includes('CHANGE') || action.includes('TOGGLE')) return { bg: '#FEF3C7', fg: '#92400E' };
  return { bg: '#E0E7FF', fg: '#3730A3' };
}

const OPSI_ENTITAS = ['user', 'equipment', 'rental', 'contract', 'payment', 'maintenance'] as const;

export const AuditLogPanel: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [entitas, setEntitas] = useState<string>('');
  const [aksi, setAksi] = useState<string>('');

  /** Ambil catatan audit dari edge API. */
  useEffect(() => {
    let aktif = true;

    const muat = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = bacaToken();
        const res = await fetch('/api/audit-log?limit=200', {
          headers: token ? { 'X-SBS-Session': token } : {},
        });
        if (!aktif) return;
        if (!res.ok) {
          setError(res.status === 403
            ? 'Hanya Administrator yang dapat melihat catatan audit.'
            : 'Gagal memuat catatan audit.');
          setEntries([]);
          return;
        }
        const body = (await res.json()) as { data?: AuditEntry[] };
        setEntries(Array.isArray(body.data) ? body.data : []);
      } catch {
        if (!aktif) return;
        setError('Gagal memuat catatan audit dari server.');
        setEntries([]);
      } finally {
        if (aktif) setLoading(false);
      }
    };

    muat();
    return () => {
      aktif = false;
    };
  }, []);

  /** Saring di klien: kotak pencarian + filter entitas & aksi. */
  const terlihat = useMemo(() => {
    const kata = q.trim().toLowerCase();
    const aksiSet = aksi
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    return entries.filter((e) => {
      if (entitas && e.entity.toLowerCase() !== entitas) return false;
      if (aksiSet.length > 0 && !aksiSet.includes(e.action)) return false;
      if (!kata) return true;
      return (
        e.detail.toLowerCase().includes(kata) ||
        e.username.toLowerCase().includes(kata) ||
        e.action.toLowerCase().includes(kata) ||
        e.entity.toLowerCase().includes(kata)
      );
    });
  }, [entries, q, entitas, aksi]);

  /** Ekspor CSV (pola yang sama dengan TableExport, tanpa dependensi baru). */
  const eksporCsv = () => {
    const kepala = ['id', 'timestamp', 'user_id', 'username', 'role', 'action', 'entity', 'entity_id', 'detail'];
    const baris = terlihat.map((e) =>
      [e.id, e.timestamp, e.user_id, e.username, e.role, e.action, e.entity, e.entity_id, e.detail]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[kepala.join(','), ...baris].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const tautan = document.createElement('a');
    tautan.href = url;
    tautan.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    tautan.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="card-premium animate-fade-in" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Memuat catatan audit…</div>
      </div>
    );
  }

  return (
    <div className="card-premium animate-fade-in" style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <Shield size={22} color="var(--color-primary)" />
        <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-primary)', margin: 0, flex: 1 }}>
          Audit Trail — Catatan Mutasi Sistem
        </h2>
        <button
          type="button"
          className="btn-secondary"
          onClick={eksporCsv}
          disabled={terlihat.length === 0}
          style={{ padding: '7px 13px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Download size={14} /> Ekspor CSV
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '14px',
            padding: '10px 12px',
            borderRadius: '8px',
            borderLeft: '4px solid var(--color-error)',
            backgroundColor: '#FEF2F2',
            fontSize: '12.5px',
            color: '#991B1B',
          }}
        >
          {error}
        </div>
      )}

      {/* Bilah penyaringan */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '14px',
          padding: '12px',
          backgroundColor: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search
            size={15}
            color="var(--color-secondary-light)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="search"
            placeholder="Cari detail, pelaku, atau aksi…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Cari catatan audit"
            style={{
              width: '100%',
              padding: '8px 10px 8px 32px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '12.5px',
              fontFamily: 'var(--font-primary)',
            }}
          />
        </div>
        <Filter size={15} color="var(--color-secondary-light)" />
        <select
          aria-label="Saring berdasarkan entitas"
          value={entitas}
          onChange={(e) => setEntitas(e.target.value)}
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '12.5px',
            fontFamily: 'var(--font-primary)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <option value="">Semua entitas</option>
          {OPSI_ENTITAS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Kode aksi (mis. PAYMENT_VERIFIED)"
          value={aksi}
          onChange={(e) => setAksi(e.target.value)}
          aria-label="Saring berdasarkan kode aksi"
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '12.5px',
            fontFamily: 'var(--font-primary)',
            flex: '1 1 180px',
            backgroundColor: '#FFFFFF',
          }}
        />
      </div>

      <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginBottom: '10px' }}>
        Menampilkan {terlihat.length} dari {entries.length} entri (terbaru di atas).
      </div>

      {terlihat.length === 0 ? (
        <div
          style={{
            padding: '36px 16px',
            textAlign: 'center',
            color: 'var(--color-secondary-light)',
            fontSize: '13px',
          }}
        >
          Belum ada catatan audit. Melakukan aksi tulis (buat/edit/hapus unit, ubah status
          rental, verifikasi pembayaran, dll.) akan tercatat di sini.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={th}>Waktu</th>
                <th style={th}>Pelaku</th>
                <th style={th}>Aksi</th>
                <th style={th}>Entitas</th>
                <th style={th}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {terlihat.map((e) => {
                const w = warnaAksi(e.action);
                return (
                  <tr
                    key={e.id}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--color-secondary)' }}>
                      {e.timestamp.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 700 }}>{e.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary-light)' }}>
                        {e.role}#{e.user_id}
                      </div>
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          backgroundColor: w.bg,
                          color: w.fg,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {e.action}
                      </span>
                    </td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      {e.entity}
                      {e.entity_id !== null ? ` #${e.entity_id}` : ''}
                    </td>
                    <td style={td}>{e.detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ fontSize: '10.5px', color: 'var(--color-secondary-light)', marginTop: '12px' }}>
        Catatan disimpan di edge worker (ring buffer 1000 entri, maks 200
        ditampilkan per permintaan). Pada mode IN_MEMORY_DEMO, catatan hilang
        saat isolate worker diganti.
      </div>
    </div>
  );
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  fontSize: '11px',
  fontWeight: 800,
  color: 'var(--color-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const td: React.CSSProperties = {
  padding: '9px 10px',
  verticalAlign: 'top',
  color: 'var(--color-text)',
};
