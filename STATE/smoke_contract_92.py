# -*- coding: utf-8 -*-
"""Smoke RentalManagement pasca-split (admin): sub-tab, filter, tabel, modal konfirmasi."""
import json, time, urllib.request, websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=10))
page = next(t for t in tabs if t["type"] == "page")
ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=180, suppress_origin=True)
_id = 0
def send(m, **p):
    global _id; _id += 1
    ws.send(json.dumps({"id": _id, "method": m, "params": p}))
    while True:
        x = json.loads(ws.recv())
        if x.get("id") == _id: return x.get("result", {})
def ev(e):
    r = send("Runtime.evaluate", expression=e, returnByValue=True, awaitPromise=True)
    if "exceptionDetails" in r:
        return {"__exc__": str(r["exceptionDetails"])[:180]}
    return r.get("result", {}).get("value")

send("Page.enable"); send("Runtime.enable"); send("Network.setCacheDisabled", cacheDisabled=True)
send("Emulation.setDeviceMetricsOverride", width=1280, height=800, deviceScaleFactor=1, mobile=False)
send("Page.navigate", url=BASE)
time.sleep(7)

JS_LOGIN = """(async () => {
  if(document.querySelector('h2')&&!document.querySelector('input[type=password]')) return 'LOGGED';
  const setV=(el,v)=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};
  [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Admin')?.click();
  await new Promise(r=>setTimeout(r,400));
  const u=document.querySelector('input[type=text]');
  const p=document.querySelector('input[type=password]');
  if(!u||!p) return 'NO INPUTS';
  setV(u,'admin'); setV(p,'admin');
  [...document.querySelectorAll('button')].find(b=>/masuk/i.test(b.textContent)).click();
  for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,500));if(!document.querySelector('input[type=password]')&&document.querySelector('h2'))return 'LOGGED';}
  return 'TIMEOUT';
})()"""
print("login:", ev(JS_LOGIN))

def nav(label):
    js = """(() => {
      const el = [...document.querySelectorAll('button')].find(b => b.innerText.includes('%s'));
      if (!el) return 'NO NAV'; el.click(); return 'NAV';
    })()""" % label
    return ev(js)

PROBE = """(() => {
  const de=document.documentElement;
  const tbl=[...document.querySelectorAll('table')].find(t=>t.innerText.includes('Kode Kontrak'));
  const rows=tbl?[tbl.querySelectorAll('tbody tr').length]:[0];
  const tinjau=[...document.querySelectorAll('button[aria-label^="Tinjau kontrak"]')].length;
  const ttd=[...document.querySelectorAll('button[aria-label^="Tanda tangani kontrak"]')].length;
  const perpan=[...document.querySelectorAll('button[aria-label^="Perpanjang kontrak"]')].length;
  const cari=!!document.querySelector('input[aria-label="Cari kontrak"]');
  const saring=!!document.querySelector('select[aria-label="Saring status tanda tangan"]');
  const terbit=[...document.querySelectorAll('button[aria-label="Terbitkan kontrak baru"]')].length;
  return {ovf:de.scrollWidth-de.clientWidth, rows:rows[0], tinjau, ttd, perpan, cari, saring, terbit};
})()"""

import json as _j
print("nav Transaksi:", nav("Transaksi Penyewaan")); time.sleep(2.0)
# sub-tab kontrak di RentalManagement: cari tombol 'Kontrak'
print("subtab:", ev("""(() => { const b=[...document.querySelectorAll('button')].find(x=>/^\s*Kontrak/.test(x.innerText)); if(!b) return 'NO SUBTAB'; b.click(); return 'OK'; })()"""))
time.sleep(1.6)
print("ADMIN panel:", _j.dumps(ev(PROBE), ensure_ascii=False))
# interaksi: saring EXPIRED lalu tinjau
print("saring:", ev("""(() => { const s=document.querySelector('select[aria-label="Saring status tanda tangan"]'); if(!s) return 'NO SEL';
  const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; set.call(s,'EXPIRED'); s.dispatchEvent(new Event('change',{bubbles:true})); return 'ok'; })()"""))
time.sleep(0.9)
r = ev(PROBE)
print("EXPIRED:", _j.dumps(r, ensure_ascii=False))
if r.get('tinjau'):
    ev("""(() => { document.querySelector('button[aria-label^="Tinjau kontrak"]').click(); return 1; })()""")
    time.sleep(1.1)
    print("modal tinjau:", ev("""(() => { const d=document.querySelector('[role="dialog"], .modal-overlay'); return d ? 'OPEN' : 'NO MODAL'; })()"""))
    ev("""(() => { const b=[...document.querySelectorAll('button')].find(x=>/tutup/i.test(x.innerText) && x.closest('[role="dialog"], .modal-overlay')); b&&b.click(); return 1; })()""")
    time.sleep(0.7)
print("reset filter:", ev("""(() => { const s=document.querySelector('select[aria-label="Saring status tanda tangan"]');
  const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; set.call(s,'ALL'); s.dispatchEvent(new Event('change',{bubbles:true})); return 'ok'; })()"""))
time.sleep(0.7)
print("cari:", ev("""(() => { const i=document.querySelector('input[aria-label="Cari kontrak"]'); const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(i,'KONTRAK'); i.dispatchEvent(new Event('input',{bubbles:true})); return 'ok'; })()"""))
time.sleep(0.8)
print("hasil cari:", _j.dumps(ev(PROBE), ensure_ascii=False))
ev("""(() => { const i=document.querySelector('input[aria-label="Cari kontrak"]'); const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(i,''); i.dispatchEvent(new Event('input',{bubbles:true})); return 1; })()""")
send("Emulation.setDeviceMetricsOverride", width=375, height=812, deviceScaleFactor=1, mobile=True)
time.sleep(2.0)
m = ev("""(() => {
  const de=document.documentElement;
  const small=[...document.querySelectorAll('button')].filter(b=>{const x=b.getBoundingClientRect();return x.width>0&&(x.height<44||x.width<44);}).length;
  return {ovf:de.scrollWidth-de.clientWidth, small};
})()""")
print("mobile375:", _j.dumps(m))
send("Emulation.setDeviceMetricsOverride", width=1280, height=800, deviceScaleFactor=1, mobile=False)
print("OK CONTRACT SMOKE")
