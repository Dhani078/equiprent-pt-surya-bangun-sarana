# -*- coding: utf-8 -*-
"""Smoke UI siklus 90: 5 tab CustomerPortal pasca-split + overflow check."""
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
  [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Pelanggan')?.click();
  await new Promise(r=>setTimeout(r,400));
  const u=document.querySelector('input[type=text]');
  const p=document.querySelector('input[type=password]');
  if(!u||!p) return 'NO INPUTS';
  setV(u,'user'); setV(p,'user');
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
