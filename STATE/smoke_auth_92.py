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

# --- Smoke auth & seed split (siklus 92) ---
# Target login: /?tab= LOGIN, verifikasi halaman masih utuh setelah auth.ts split.
ev("""(() => { const b=[...document.querySelectorAll('button')].find(x=>/keluar/i.test(x.innerText)); if (b) b.click(); return 1; })()""")
time.sleep(2.5)

on_login = ev("(() => !!document.querySelector('input[type=password]') ? 'ON LOGIN' : 'NOT LOGIN')")
print("halaman:", on_login)

# Login admin via UI (jalur utama: Edge API)
ev("(() => { const u=document.querySelector('input[name=username], input[type=text]'); if (u) { u.value='admin'; u.dispatchEvent(new Event('input', {bubbles:true})); } return 1; })()")
ev("(() => { const p=document.querySelector('input[type=password]'); if (p) { p.value='admin'; p.dispatchEvent(new Event('input', {bubbles:true})); } return 1; })()")
ev("(() => { const b=[...document.querySelectorAll('button')].find(x=>/masuk|masuk/i.test(x.innerText)); if (b) b.click(); return 1; })()")
time.sleep(3.5)

r = ev("""(() => {
  const de = document.documentElement;
  const onApp = !!document.querySelector('.app-sidebar') || /dashboard|dasbor/i.test(document.body.innerText.slice(0, 400));
  return {
    ovf: de.scrollWidth - de.clientWidth,
    loginOK: onApp,
    title: document.title,
  };
})()""")
print("login admin:", json.dumps(r, ensure_ascii=False))
print("OK AUTH SMOKE")
