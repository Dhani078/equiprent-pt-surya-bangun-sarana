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
      const el = [...document.querySelectorAll('nav button, aside button, button')].find(b => b.innerText.includes('%s'));
      if (!el) return 'NO NAV'; el.click(); return 'NAV';
    })()""" % label
    return ev(js)

print("nav:", nav("Manajemen Pengguna"))
time.sleep(2.0)

r = ev("""(async () => {
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  await sleep(800);
  const de=document.documentElement;
  const rows=document.querySelectorAll('.data-table tbody tr').length;
  const cari=document.querySelector('input[aria-label*="Cari nama"]');
  const saring=[...document.querySelectorAll('select')].find(s=>s.getAttribute('aria-label')==='Saring hak akses');
  const tambah=[...document.querySelectorAll('button')].some(b=>b.innerText.includes('Tambah Pengguna Baru'));
  return {ovf:de.scrollWidth-de.clientWidth, rows, cari:!!cari, saring:!!saring, tambah};
})()""")
print("state:", json.dumps(r, ensure_ascii=False))

r = ev("""(async () => {
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const i=document.querySelector('input[aria-label*="Cari nama"]');
  const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  set.call(i,'admin'); i.dispatchEvent(new Event('input',{bubbles:true}));
  await sleep(600);
  const rowsHit=document.querySelectorAll('.data-table tbody tr').length;
  set.call(i,'zzz-tidak-ada'); i.dispatchEvent(new Event('input',{bubbles:true}));
  await sleep(600);
  const empty=/Tidak ada pengguna yang cocok/.test(document.body.innerText);
  const rb=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Reset Penyaring'); rb && rb.click();
  await sleep(600);
  const rowsBack=document.querySelectorAll('.data-table tbody tr').length;
  return {rowsHit, empty, rowsBack};
})()""")
print("search/reset:", json.dumps(r, ensure_ascii=False))

r = ev("""(async () => {
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const s=[...document.querySelectorAll('select')].find(x=>x.getAttribute('aria-label')==='Saring hak akses');
  const setS=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;
  setS.call(s,'STAFF'); s.dispatchEvent(new Event('change',{bubbles:true}));
  await sleep(700);
  const trs=[...document.querySelectorAll('.data-table tbody tr')];
  const allStaff=trs.every(x=>x.innerText.includes('STAFF'));
  setS.call(s,'ALL'); s.dispatchEvent(new Event('change',{bubbles:true}));
  await sleep(500);
  return {n:trs.length, allStaff};
})()""")
print("filter role:", json.dumps(r, ensure_ascii=False))

r = ev("""(async () => {
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Tambah Pengguna Baru'));
  b.click(); await sleep(700);
  const form=!!document.querySelector('input[aria-label*="Username"]');
  const sub=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Simpan & Daftarkan'));
  sub.click(); await sleep(700);
  const invalid=document.querySelectorAll('[aria-invalid=true]').length;
  const batal=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='Batal');
  batal.click(); await sleep(600);
  const gone=!document.querySelector('input[aria-label*="Username"]');
  return {form, invalid, gone};
})()""")
print("modal+validasi:", json.dumps(r, ensure_ascii=False))

send("Emulation.setDeviceMetricsOverride", width=375, height=812, deviceScaleFactor=1, mobile=True)
time.sleep(2.2)
r = ev("""(() => {
  const de=document.documentElement;
  const small=[...document.querySelectorAll('button')].filter(b=>{const x=b.getBoundingClientRect();return x.width>0&&(x.height<44||x.width<44);}).length;
  return {ovf:de.scrollWidth-de.clientWidth, small};
})()""")
print("mobile375:", json.dumps(r, ensure_ascii=False))
send("Emulation.setDeviceMetricsOverride", width=1280, height=800, deviceScaleFactor=1, mobile=False)
time.sleep(1.2)
r = ev("""(() => {const de=document.documentElement;return {ovf:de.scrollWidth-de.clientWidth};})()""")
print("desktop:", json.dumps(r, ensure_ascii=False))
print("OK USER SMOKE")
