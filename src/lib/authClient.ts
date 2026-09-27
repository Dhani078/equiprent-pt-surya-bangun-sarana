/**
 * Penyimpanan token sesi browser — SATU sumber untuk semua pengambil API.
 *
 * Sebelum ini token hanya diketahui AuditLogPanel, sehingga dashboardClient,
 * reportsClient, dan fetchCollection mengirim permintaan tanpa header
 * `X-SBS-Session` → 401 senyap → UI diam-diam fallback ke seed demo (temuan
 * audit production 2026-09-27).
 */
const SESSION_KEY = 'sbs_session_token';

export const bacaTokenSesi = (): string | null => {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null; // mode privat / storage diblokir
  }
};

export const simpanTokenSesi = (token: string): void => {
  try {
    sessionStorage.setItem(SESSION_KEY, token);
  } catch {
    /* abaikan */
  }
};

export const hapusTokenSesi = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* abaikan */
  }
};

/** Header wajib untuk semua panggilan API terautentikasi dari browser. */
export const headerSesi = (ekstra: Record<string, string> = {}): Record<string, string> => {
  const token = bacaTokenSesi();
  const h: Record<string, string> = { Accept: 'application/json', ...ekstra };
  if (token) h['X-SBS-Session'] = token;
  return h;
};
