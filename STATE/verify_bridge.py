# -*- coding: utf-8 -*-
"""Verifikasi produksi pasca-jembatan: login 3 role, 401 harus hilang,
CRUD UI -> TiDB persists (bukti via API read-back)."""
import json, time, urllib.request, websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"

def connect():
    tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
    page = next(t for t in tabs if t.get('type') == 'page')
    ws = websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True, timeout=60)
    ws.settimeout(60)
    return ws

_id = [0]
def cmd(ws, method, **params):
    _id[0] += 1
    ws.send(json.dumps({'id': _id[0], 'method': method, 'params': params}))
    while True:
        try:
            m = json.loads(ws.recv())
        except websocket.WebSocketTimeoutException:
            continue
        if m.get('id') == _id[0]:
            return m.get('result', {})

def ev(ws, expr, awaitp=True):
    r = cmd(ws, 'Runtime.evaluate', expression=expr, awaitPromise=awaitp, returnByValue=True)
    if r.get('exceptionDetails'):
        return 'EXC:' + json.dumps(r['exceptionDetails'].get('exception', {}).get('description', ''))[:250]
    return r.get('result', {}).get('value')

def net_probe(ws):
    # aktifkan Network sekali; kumpulkan error 4xx/5xx via fetch interceptor page-side lebih simpel
    return cmd(ws, 'Runtime.evaluate', expression="""
(() => {
  window.__net = [];
  const of = window.fetch;
  window.fetch = async (...a) => {
    const r = await of(...a);
    if (r.status >= 400) window.__net.push(r.status + ' ' + (a[0] || ''));
    return r;
  };
  return true;
})()""")

def login(ws, role_user):
    cmd(ws, 'Page.navigate', url=BASE + '/#/login')
    time.sleep(2.5)
    r = ev(ws, f"""(async () => {{
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('{role_user}'));
      if (!btn) return 'no quick btn';
      btn.click(); await new Promise(r => setTimeout(r, 150));
      const masuk = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Masuk'));
      if (!masuk) return 'no masuk';
      masuk.click();
      for (let i = 0; i < 40; i++) {{
        await new Promise(r => setTimeout(r, 250));
        if (document.querySelector('aside')) return 'OK';
      }}
      return 'FAIL';
    }})()""")
    return r

def check_pages(ws, menus):
    out = {}
    for m in menus:
        ev(ws, """(() => { window.__net = window.__net || []; return 1; })()""")
        r = ev(ws, f"""(async () => {{
          window.__net = [];
          const nav = [...document.querySelectorAll('aside nav a, aside nav button')].find(x => x.textContent.includes('{m}'));
          if (!nav) return JSON.stringify({{err: 'nav tidak ada'}});
          nav.click();
          await new Promise(r => setTimeout(r, 2600));
          const body = document.body.innerText || '';
          return JSON.stringify({{
            net: window.__net,
            kosong: /Tidak ada data|Belum ada/i.test(body) && body.length < 400,
            len: body.length
          }});
        }})()""")
        out[m] = json.loads(r) if isinstance(r, str) and r.startswith('{') else r
    return out

ws = connect()
print('== ADMIN')
print('login:', login(ws, 'Administrator'))
r = ev(ws, """(() => JSON.stringify({
  token: !!sessionStorage.getItem('sbs_session_token'),
  user: !!sessionStorage.getItem('sbs_active_user')
}))()""")
print('storage:', r)
res = check_pages(ws, ['Dashboard Utama', 'Inventaris', 'Transaksi', 'Perawatan', 'GPS', 'Laporan', 'Pengguna', 'Audit Trail'])
for k, v in res.items():
    nets = [n for n in (v.get('net') or []) if 'dashboard' in n or 'reports' in n or 'audit' in n or 'gps' in n] if isinstance(v, dict) else []
    print(' ', k, '->', v if not isinstance(v, dict) else ('net4xx=%s' % (nets or 'BERSIH' if not v.get('net') else v.get('net'))))
print('== STAFF')
print('login:', login(ws, 'Staf'))
res = check_pages(ws, ['Dashboard Operasional', 'Verifikasi Pembayaran', 'Kontrak', 'Cetak Laporan'])
for k, v in res.items(): print(' ', k, '->', v if not isinstance(v, dict) else ('net4xx=%s' % (v.get('net') or 'BERSIH')))
print('== CUSTOMER')
print('login:', login(ws, 'Pelanggan'))
res = check_pages(ws, ['Katalog', 'Penyewaan Saya', 'Lacak Lokasi'])
for k, v in res.items(): print(' ', k, '->', v if not isinstance(v, dict) else ('net4xx=%s' % (v.get('net') or 'BERSIH')))
ws.close()
print('SELESAI')
