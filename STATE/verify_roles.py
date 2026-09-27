# -*- coding: utf-8 -*-
"""Login STAFF & CUSTOMER dari nol + screenshot dashboard admin (god-mode check)."""
import base64, json, time, urllib.request, websocket

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

def ev(ws, expr):
    r = cmd(ws, 'Runtime.evaluate', expression=expr, awaitPromise=True, returnByValue=True)
    if r.get('exceptionDetails'):
        return 'EXC:' + json.dumps(r['exceptionDetails'].get('exception', {}).get('description', ''))[:250]
    return r.get('result', {}).get('value')

def login(rolelabel, user):
    ws = connect()
    ev(ws, "sessionStorage.clear(); 1")
    ev(ws, "location.replace('%s/#/login'); 1" % BASE, ) if False else ev(ws, "sessionStorage.clear(); location.href='%s/#/login'; location.reload(); 1" % BASE)
    time.sleep(3.5)
    ev(ws, """(() => {
      window.__net = [];
      if (!window.__patched) {
        const of = window.fetch;
        window.fetch = async (...a) => {
          const req = a[0];
          const url = typeof req === 'string' ? req : (req && req.url) || '';
          const method = (a[1] && a[1].method) || (req && req.method) || 'GET';
          const r = await of(...a);
          if (r.status >= 400) window.__net.push(r.status + ' ' + url.slice(0, 40));
          return r;
        };
        window.__patched = 1;
      }
      window.__net = [];
      return 1;
    })()""")
    r = ev(ws, f"""(async () => {{
      const btn = [...document.querySelectorAll('button')].find(b => /{rolelabel}/i.test(b.textContent));
      if (!btn) return 'no quick btn';
      btn.click(); await new Promise(r => setTimeout(r, 200));
      const masuk = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Masuk'));
      masuk.click();
      for (let i = 0; i < 40; i++) {{
        await new Promise(r => setTimeout(r, 250));
        if (document.querySelector('aside')) return 'MASUK';
      }}
      const msg = [...document.querySelectorAll('p,span,div')].map(x=>x.textContent.trim()).find(t=>/salah|terdaftar|nonaktif/.test(t)) || '';
      return 'GAGAL: ' + msg.slice(0, 90);
    }})()""")
    tok = ev(ws, "!!sessionStorage.getItem('sbs_session_token')")
    menu = ev(ws, """[...document.querySelectorAll('aside nav a, aside nav button')].map(x=>x.textContent.trim()).slice(0,9)""")
    print(user, r, '| token:', tok, '| menu:', menu)
    if r == 'MASUK':
        for m in ['Dashboard', 'Verifikasi', 'Kontrak', 'Laporan']:
            rr = ev(ws, f"""(async () => {{
              window.__net = [];
              const nav = [...document.querySelectorAll('aside nav a, aside nav button')].find(x => /{m}/i.test(x.textContent));
              if (!nav) return 'nav-absen';
              nav.click(); await new Promise(r => setTimeout(r, 2400));
              return window.__net.length ? JSON.stringify(window.__net) : 'BERSIH';
            }})()""")
            print('   ', m, '->', rr)
    ws.close()

def shot(name):
    ws = connect()
    r = cmd(ws, 'Page.captureScreenshot', format='png')
    p = f"STATE/{name}.png"
    open(p, 'wb').write(base64.b64decode(r['data']))
    print('screenshot ->', p)
    ws.close()

login('Staf', 'staff')
login('Pelanggan', 'user')
# admin untuk screenshot
login('Administrator', 'admin')
shot('god_admin_dash')
import os
print('ukuran png', os.path.getsize('STATE/god_admin_dash.png'))
