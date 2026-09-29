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

TABS = ["Katalog Alat", "Sewa Saya", "Kontrak & E-Sign", "Tagihan & Transfer", "Lacak Unit Saya"]
JS_CLICK_TAB = """(async (label) => {
  const el = [...document.querySelectorAll('button, a')].find(e => e.textContent.trim().toLowerCase() === label.toLowerCase() || e.textContent.trim().toLowerCase().includes(label.toLowerCase()));
  if (!el) return 'TAB NOT FOUND';
  el.click(); await new Promise(r => setTimeout(r, 2200)); return 'OK';
})('%s')"""
JS_STATE = """(() => {
  const de = document.documentElement;
  const h3 = [...document.querySelectorAll('h3')].map(x=>x.textContent.trim()).slice(0,3);
  const rows = document.querySelectorAll('table tbody tr').length;
  const cards = document.querySelectorAll('.card-premium').length;
  return { ovf: de.scrollWidth - de.clientWidth, h3, rows, cards };
})()"""
for label in TABS[:-1]:
    r = ev(JS_CLICK_TAB % label)
    if r != "OK":
        print(label, r); continue
    m = ev(JS_STATE)
    print(label, json.dumps(m, ensure_ascii=False)[:220])

def click_text(txt, wait=1800):
    js = """(async (t) => {
      const el = [...document.querySelectorAll('button, a')].find(e => e.textContent.trim().toLowerCase() === t.toLowerCase());
      if (!el) return 'NOT FOUND';
      el.click(); await new Promise(r=>setTimeout(r,%d)); return 'OK';
    })('%s')""" % (wait, txt)
    return ev(js)

def state():
    js = """(() => {
      const de = document.documentElement;
      const th = [...document.querySelectorAll('.data-table thead th')].map(x=>x.textContent.trim());
      const rows = document.querySelectorAll('.data-table tbody tr').length;
      const btns = [...document.querySelectorAll('button')].map(b=>b.textContent.trim());
      const hasDenda = !!document.querySelector('[aria-label=\"Ringkasan denda keterlambatan berjalan\"]');
      const hasFilter = !!document.querySelector('[aria-label=\"Cari transaksi penyewaan\"]');
      const modal = !!document.querySelector('[role=\"dialog\"], .modal-overlay, [aria-modal=\"true\"]');
      return { ovf: de.scrollWidth - de.clientWidth, th: th.length, rows, hasDenda, hasFilter, modal };
    })()"""
    return ev(js)

# masuk halaman Transaksi via sidebar/palette
print("nav Transaksi:", click_text("Transaksi Penyewaan", 2500))
print("state awal :", json.dumps(state(), ensure_ascii=False))

# filter status ON_GOING via select
r = ev("""(() => {
  const s = document.querySelector('select[aria-label=\"Saring transaksi berdasarkan status\"]');
  if (!s) return 'NO SELECT';
  const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;
  set.call(s,'ON_GOING'); s.dispatchEvent(new Event('change',{bubbles:true}));
  return 'OK';
})()""")
time.sleep(1)
print("filter ON_GOING:", r, json.dumps(state(), ensure_ascii=False))

# reset
r = ev("""(() => {
  const s = document.querySelector('select[aria-label=\"Saring transaksi berdasarkan status\"]');
  const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;
  set.call(s,'ALL'); s.dispatchEvent(new Event('change',{bubbles:true}));
  return 'OK';
})()""")
time.sleep(1)

# pencarian
ev("""(() => {
  const i = document.querySelector('input[aria-label=\"Cari transaksi penyewaan\"]');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  set.call(i,'SBZ'); i.dispatchEvent(new Event('input',{bubbles:true}));
})()""")
time.sleep(1)
st = state(); print("cari 'SBZ':", json.dumps(st, ensure_ascii=False))
ev("""(() => {
  const i = document.querySelector('input[aria-label=\"Cari transaksi penyewaan\"]');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  set.call(i,''); i.dispatchEvent(new Event('input',{bubbles:true}));
})()""")
time.sleep(1)

# aksi Setujui pada PENDING -> modal konfirmasi muncul
r = ev("""(async () => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Setujui');
  if (!b) return 'NO SETUJUI BTN';
  b.click(); await new Promise(r=>setTimeout(r,900));
  const t = document.body.innerText;
  return /Konfirmasi|Setujui|lanjutkan|yakin/i.test(t) ? 'CONFIRM SHOWN' : 'NO CONFIRM';
})()""")
print("konfirmasi:", r)
ev("""(() => { [...document.querySelectorAll('button')].find(b=>/batal/i.test(b.textContent))?.click(); })()""")
time.sleep(0.7)

# sub-tab kontrak
print("sub-tab Kontrak Digital:", click_text("Kontrak Digital", 2200))
r = ev("""(() => { const de=document.documentElement; const h=[...document.querySelectorAll('h2,h3')].map(x=>x.textContent.trim()).slice(0,4); return {ovf:de.scrollWidth-de.clientWidth, h}; })()""")
print("kontrak state:", json.dumps(r, ensure_ascii=False))
print("kembali transaksi:", click_text("Daftar Transaksi", 1800))

# mobile 375
send("Emulation.setDeviceMetricsOverride", width=375, height=812, deviceScaleFactor=1, mobile=True)
time.sleep(2)
m = ev("""(() => {
  const de = document.documentElement;
  const small = [...document.querySelectorAll('main button')].filter(b => { const r=b.getBoundingClientRect(); return r.width>0 && (r.height<44 && r.width<44) && b.offsetParent && getComputedStyle(b).position!=='fixed'; }).length;
  return { ovf: de.scrollWidth - de.clientWidth, small };
})()""")
print("mobile 375 (transaksi):", json.dumps(m, ensure_ascii=False))
send("Emulation.setDeviceMetricsOverride", width=1280, height=800, deviceScaleFactor=1, mobile=False)
ws.close()
