# -*- coding: utf-8 -*-
"""UI persisten: tambah unit dari form Admin UI, cek POST /api, reload, cek DB."""
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

def ev(ws, expr):
    r = cmd(ws, 'Runtime.evaluate', expression=expr, awaitPromise=True, returnByValue=True)
    if r.get('exceptionDetails'):
        return 'EXC:' + json.dumps(r['exceptionDetails'].get('exception', {}).get('description', ''))[:300]
    return r.get('result', {}).get('value')

def net_on(ws):
    ev(ws, """(() => {
      window.__net = [];
      if (!window.__patched) {
        const of = window.fetch;
        window.fetch = async (...a) => {
          const req = a[0];
          let url = typeof req === 'string' ? req : (req && req.url) || '';
          let method = (a[1] && a[1].method) || (req && req.method) || 'GET';
          const t0 = Date.now();
          const r = await of(...a);
          window.__net.push({ m: method, u: url, s: r.status, t: Date.now() - t0 });
          return r;
        };
        window.__patched = 1;
      }
      window.__net = [];
      return 1;
    })()""")

ws = connect()
net_on(ws)
print('state login admin:', ev(ws, "!!sessionStorage.getItem('sbs_session_token')"))
if ev(ws, "location.href.includes('/login')") is True:
    print('login:', ev(ws, """(async () => {
      const btn = [...document.querySelectorAll('button')].find(b => /Administrator/i.test(b.textContent));
      btn && btn.click(); await new Promise(r => setTimeout(r, 200));
      const masuk = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Masuk'));
      masuk && masuk.click();
      for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 250)); if (document.querySelector('aside')) return 'OK'; }
      return 'FAIL';
    })()"""))

print('== buka Inventaris, klik Tambah Unit, isi form PROBE-UI-1')
r = ev(ws, """(async () => {
  const nav = [...document.querySelectorAll('aside nav a, aside nav button')].find(x => /Inventaris/i.test(x.textContent));
  if (!nav) return 'no nav';
  nav.click();
  await new Promise(r => setTimeout(r, 1200));
  const tambah = [...document.querySelectorAll('button')].find(b => /Tambah Unit/i.test(b.textContent));
  if (!tambah) return 'no tambah btn: ' + [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean).slice(0,12).join('|');
  tambah.click();
  await new Promise(r => setTimeout(r, 600));
  // isi input by label
  const set = (id, v) => {
    const el = document.getElementById(id) || [...document.querySelectorAll('input,select,textarea')].find(x => (x.labels && x.labels[0] && new RegExp(v === 'X' ? '' : '') && false));
    if (!el) return null;
    const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : (el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype);
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, el._v !== undefined ? el._v : v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  };
  // pakai placeholder/label text
  const isi = (cari, v) => {
    const el = [...document.querySelectorAll('input,select,textarea')].find(x => {
      const lab = (x.labels && x.labels[0] && x.labels[0].textContent) || x.placeholder || x.getAttribute('aria-label') || '';
      return new RegExp(cari, 'i').test(lab);
    });
    if (!el) return 'NF:' + cari;
    const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : (el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype);
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok:' + cari;
  };
  const hasil = [];
  hasil.push(isi('kode', 'PROBE-UI-1'));
  hasil.push(isi('nama', 'PROBE UI SATU'));
  hasil.push(isi('merk|merek|brand', 'ProbeTest'));
  hasil.push(isi('model', 'UI-9000'));
  const selTipe = [...document.querySelectorAll('select')].find(s => /excavator/i.test(s.options[1] ? s.options[1].textContent : ''));
  if (selTipe) { const p = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set; p.call(selTipe, selTipe.options[1].value); selTipe.dispatchEvent(new Event('change', { bubbles: true })); hasil.push('ok:tipe'); }
  const hm = [...document.querySelectorAll('input')].find(x => /hm|hour|jam meter/i.test((x.labels&&x.labels[0]&&x.labels[0].textContent)||x.placeholder||''));
  if (hm) { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(hm, '123'); hm.dispatchEvent(new Event('input', { bubbles: true })); hasil.push('ok:hm'); }
  const tarif = [...document.querySelectorAll('input')].find(x => /tarif|harga|sewa/i.test((x.labels&&x.labels[0]&&x.labels[0].textContent)||x.placeholder||''));
  if (tarif) { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(tarif, '1500000'); tarif.dispatchEvent(new Event('input', { bubbles: true })); hasil.push('ok:tarif'); }
  return JSON.stringify(hasil);
})()""")
print('isi form:', r)

r = ev(ws, """(async () => {
  const form = document.querySelector('div[role=dialog] form, .modal form, form');
  const btn = [...document.querySelectorAll('button')].find(b => /Simpan|Tambah Unit$/i.test(b.textContent.trim()));
  if (!btn) return 'no submit btn';
  btn.click();
  await new Promise(r => setTimeout(r, 3500));
  return JSON.stringify(window.__net);
})()""")
print('net setelah submit:', r)

print('== reload halaman, cari PROBE-UI-1:')
cmd(ws, 'Page.navigate', url=BASE + '/#/inventory')
time.sleep(4)
r = ev(ws, """(async () => {
  for (let i = 0; i < 20; i++) {
    if (/PROBE-UI-1/.test(document.body.innerText)) return 'ADA';
    await new Promise(r => setTimeout(r, 500));
  }
  return 'TIDAK ADA';
})()""")
print('setelah reload:', r)
ws.close()

def api(path, body=None, tok=None, method='GET'):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header('Content-Type', 'application/json')
    req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    if tok: req.add_header('X-SBS-Session', tok)
    data = json.dumps(body).encode() if body is not None else None
    with urllib.request.urlopen(req, data, timeout=60) as r:
        return json.loads(r.read().decode())
tok = api('/api/auth/login', {'username': 'admin', 'password': 'admin'}, method='POST')['token']
rows = api('/api/equipments', tok=tok)
hit = [e for e in rows if e['equipment_code'] == 'PROBE-UI-1']
print('TiDB langsung:', hit and ('ADA id=%s' % hit[0]['id']) or 'TIDAK ADA')
if hit:
    st = api('/api/equipments/%d' % hit[0]['id'], tok=tok, method='DELETE')
    print('cleanup delete:', st.get('success'))
