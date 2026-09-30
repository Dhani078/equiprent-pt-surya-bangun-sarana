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

# halaman login: logout dulu jika sudah masuk
ev("""(() => { const b=[...document.querySelectorAll('button')].find(x=>/keluar/i.test(x.innerText)); if(b){b.click();} return 1; })()""")
time.sleep(2.5)

NO_CARI = ev("(() => !document.querySelector('input[type=password]') ? 'NOT ON LOGIN' : 'ON LOGIN')()")
print("halaman:", NO_CARI)
r = ev("""(() => {
  const de=document.documentElement;
  return {
    ovf: de.scrollWidth - de.clientWidth,
    brand: !!document.querySelector('img[alt*=armada]'),
    tabs: [...document.querySelectorAll('[role=tab]')].map(b=>b.textContent.trim()),
    form: !!document.querySelector('form'),
    errBox: !document.querySelector('[role=alert]'),
    registerLink: !!document.querySelector('button[type=button]'),
    showPw: !!document.querySelector('button[title]'),
  };
})()""")
print("struktur 1280:", json.dumps(r, ensure_ascii=False, indent=1))

# mobile — panel kiri harus hidden (class hidden md:flex)
send("Emulation.setDeviceMetricsOverride", width=375, height=812, deviceScaleFactor=1, mobile=True)
time.sleep(2.0)
m = ev("""(() => {
  const de=document.documentElement;
  const small=[...document.querySelectorAll('button')].filter(b=>{const x=b.getBoundingClientRect();if(x.width<=0)return false;return x.width<44||x.height<44;}).length;
  const brandHidden = getComputedStyle(document.querySelector('.hidden.md\\:flex') || document.body).display;
  return {ovf: de.scrollWidth - de.clientWidth, small, brandHidden};
})()""")
print("mobile 375:", json.dumps(m, ensure_ascii=False))
send("Emulation.setDeviceMetricsOverride", width=1280, height=800, deviceScaleFactor=1, mobile=False)
print("OK LOGIN SMOKE")
