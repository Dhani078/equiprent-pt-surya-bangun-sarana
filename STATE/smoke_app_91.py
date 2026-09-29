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

def probe():
    return ev("""(() => {
      const de=document.documentElement;
      const h2=document.querySelector('h2');
      const rows=document.querySelectorAll('.data-table tbody tr').length;
      const cards=document.querySelectorAll('.card-premium').length;
      return {ovf:de.scrollWidth-de.clientWidth, h2:h2?h2.textContent.trim().slice(0,42):null, rows, cards};
    })()""")

for tab in ['Dashboard Utama', 'Inventaris Alat Berat', 'Transaksi Penyewaan', 'Laporan']:
    n = nav(tab); time.sleep(1.8); p = probe()
    print(tab, n, json.dumps(p, ensure_ascii=False))

ev("""(() => { window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true})); return 1; })()""")
time.sleep(1.0)
print("palette:", ev("""(() => { const inp=[...document.querySelectorAll('input')].find(i=>/cari|perintah|layar/i.test((i.placeholder||'')+(i.getAttribute('aria-label')||''))); return inp? 'OPEN':'NO PALETTE'; })()"""))
ev("""(() => { document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); return 1; })()""")
time.sleep(0.6)

print("nav users:", nav("Manajemen")); time.sleep(1.6)
print("users rows:", ev("(() => document.querySelectorAll('.data-table tbody tr').length)()"))

send("Emulation.setDeviceMetricsOverride", width=375, height=812, deviceScaleFactor=1, mobile=True)
time.sleep(2.0)
r = ev("""(() => {
  const de=document.documentElement;
  const small=[...document.querySelectorAll('button')].filter(b=>{const x=b.getBoundingClientRect();return x.width>0&&(x.height<44||x.width<44);}).length;
  return {ovf:de.scrollWidth-de.clientWidth, small};
})()""")
print("mobile375:", json.dumps(r, ensure_ascii=False))
send("Emulation.setDeviceMetricsOverride", width=1280, height=800, deviceScaleFactor=1, mobile=False)
time.sleep(1.2)
print("OK APP SMOKE")
