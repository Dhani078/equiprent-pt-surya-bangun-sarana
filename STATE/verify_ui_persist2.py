# -*- coding: utf-8 -*-
"""UI persisten v2: tambah unit asli lewat form + bukti POST API + reload."""
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

ws = connect()
ev(ws, "sessionStorage.clear(); 1")
cmd(ws, 'Page.navigate', url=BASE + '/#/login')
time.sleep(3)
ev(ws, """(() => {
  window.__net = [];
  if (!window.__patched) {
    const of = window.fetch;
    window.fetch = async (...a) => {
      const req = a[0];
      let url = typeof req === 'string' ? req : (req && req.url) || '';
      let method = (a[1] && a[1].method) || (req && req.method) || 'GET';
      const r = await of(...a);
      window.__net.push({ m: method, u: url.slice(0, 48), s: r.status });
      return r;
    };
    window.__patched = 1;
  }
  return 1;
})()""")
print('login:', ev(ws, """(async () => {
      const btn = [...document.querySelectorAll('button')].find(b => /Administrator/i.test(b.textContent));
      btn && btn.click(); await new Promise(r => setTimeout(r, 200));
      const masuk = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Masuk'));
      masuk && masuk.click();
      for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 250)); if (document.querySelector('aside')) return 'OK'; }
      return 'FAIL';
    })()"""))
ev(ws, """(() => { window.__net = []; return 1; })()""")

r = ev(ws, """(async () => {
  const nav = [...document.querySelectorAll('aside nav a, aside nav button')].find(x => /Inventaris/i.test(x.textContent));
  if (!nav) return 'no nav';
  nav.click();
  await new Promise(r => setTimeout(r, 1500));
  const tambah = [...document.querySelectorAll('button')].find(b => /Tambah Alat Baru/i.test(b.textContent));
  if (!tambah) return 'no tambah';
  tambah.click();
  await new Promise(r => setTimeout(r, 700));
  const setV = (el, v) => {
    const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const byAria = (re) => [...document.querySelectorAll('input,select,textarea')].find(x => new RegExp(re, 'i').test(x.getAttribute('aria-label') || ''));
  const hasil = [];
  let el;
  el = byAria('kode'); if (el) { setV(el, 'PROBE-UI-1'); hasil.push('kode'); }
  el = byAria('nama'); if (el) { setV(el, 'PROBE UI SATU'); hasil.push('nama'); }
  el = byAria('kategori'); if (el) { setV(el, [...el.options].map(o=>o.value).find(v=>/Crane/i.test(v)) || el.options[1].value); hasil.push('kategori'); }
  el = byAria('merk|merek|brand'); if (el) { setV(el, 'ProbeTest'); hasil.push('merk'); }
  el = byAria('model'); if (el) { setV(el, 'UI-9000'); hasil.push('model'); }
  el = byAria('hour|hm|jam'); if (el) { setV(el, '123'); hasil.push('hm'); }
  el = byAria('tarif|sewa|harga'); if (el) { setV(el, '1500000'); hasil.push('tarif'); }
  return JSON.stringify(hasil);
})()""")
print('isi form:', r)

r = ev(ws, """(async () => {
  window.__net = [];
  const btn = [...document.querySelectorAll('button')].find(b => /^(Tambah Unit|Simpan Perubahan)$/i.test(b.textContent.trim()));
  if (!btn) return 'no submit';
  btn.click();
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    if (window.__net.some(n => n.m === 'POST' && /equipments/.test(n.u))) break;
  }
  await new Promise(r => setTimeout(r, 1200));
  return JSON.stringify(window.__net.filter(n => n.m !== 'GET'));
})()""")
print('POST/PUT terlihat:', r)

print('cek baris muncul tanpa reload:', ev(ws, "/PROBE-UI-1/.test(document.body.innerText) ? 'ADA' : 'TIDAK'"))
cmd(ws, 'Page.navigate', url=BASE + '/')
time.sleep(4)
print('setelah reload penuh:', ev(ws, """(async () => {
  const nav = [...document.querySelectorAll('aside nav a, aside nav button')].find(x => /Inventaris/i.test(x.textContent));
  nav && nav.click();
  for (let i = 0; i < 20; i++) {
    if (/PROBE-UI-1/.test(document.body.innerText)) return 'ADA';
    await new Promise(r => setTimeout(r, 500));
  }
  return 'TIDAK ADA';
})()"""))
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
hit = [e for e in api('/api/equipments', tok=tok) if e['equipment_code'] == 'PROBE-UI-1']
print('TiDB langsung:', hit and ('ADA id=%s name=%s' % (hit[0]['id'], hit[0]['name'])) or 'TIDAK ADA')
if hit:
    print('cleanup:', api('/api/equipments/%d' % hit[0]['id'], tok=tok, method='DELETE').get('success'))
    print('sisa PROBE:', sum(1 for e in api('/api/equipments', tok=tok) if e['equipment_code'].startswith('PROBE')))
