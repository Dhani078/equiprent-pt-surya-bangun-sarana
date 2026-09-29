# -*- coding: utf-8 -*-
"""Cari elemen yang melebar melewati viewport 375 (penyebab ovf=10 & GPS 147)."""
import json, time, urllib.request, websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"

def connect():
    tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=10))
    page = next(t for t in tabs if t["type"] == "page")
    return websocket.create_connection(page["webSocketDebuggerUrl"], timeout=120, suppress_origin=True)

class CDP:
    def __init__(self):
        self.ws = connect(); self.id = 0
        for m in ("Page.enable", "Runtime.enable"): self.send(m)
        self.send("Network.setCacheDisabled", cacheDisabled=True)
    def send(self, m, **p):
        self.id += 1
        self.ws.send(json.dumps({"id": self.id, "method": m, "params": p}))
        while True:
            x = json.loads(self.ws.recv())
            if x.get("id") == self.id: return x.get("result", {})
    def ev(self, expr, awaitp=True):
        r = self.send("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=awaitp)
        if "exceptionDetails" in r: return {"__exc__": str(r["exceptionDetails"])[:200]}
        return r.get("result", {}).get("value")

JS_LOGIN = """
(async () => {
  if (document.querySelector('h2') && !document.querySelector('input[type=password]')) return 'LOGGED';
  const setV = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el, v); el.dispatchEvent(new Event('input',{bubbles:true})); };
  const u = document.querySelector('input[autocomplete="username"]') || document.querySelectorAll('input[type=text]')[0];
  const p = document.querySelector('input[type=password]');
  if (!u || !p) return 'NO INPUTS';
  setV(u,'admin'); setV(p,'admin');
  [...document.querySelectorAll('button')].find(b=>/masuk|login/i.test(b.textContent)).click();
  for (let i=0;i<60;i++){ await new Promise(r=>setTimeout(r,500)); if(!document.querySelector('input[type=password]')&&document.querySelector('h2')) return 'LOGGED'; }
  return 'TIMEOUT';
})()
"""

JS_FIND = """
(() => {
  const cw = document.documentElement.clientWidth;
  const bad = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > cw + 1) {
      const st = getComputedStyle(el);
      bad.push({ tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,50), txt: (el.textContent||'').trim().slice(0,30), right: Math.round(r.right), w: Math.round(r.width), pos: st.position, ovf: st.overflowX });
    }
  }
  // de-dup: hanya elemen terluar per baris kanan
  bad.sort((a,b)=>b.right-a.right);
  return { cw, scrollW: document.documentElement.scrollWidth, count: bad.length, worst: bad.slice(0, 10) };
})()
"""

c = CDP()
c.send("Emulation.setDeviceMetricsOverride", width=375, height=812, deviceScaleFactor=1, mobile=True)
c.send("Page.navigate", url=BASE)
time.sleep(7)
print("login:", c.ev(JS_LOGIN))
c.ev("""(async () => { const el=[...document.querySelectorAll('nav a, nav button, aside a, aside button,[role=navigation] a,[role=navigation] button')].find(e=>/inventaris/i.test(e.textContent)); if(el){el.click(); await new Promise(r=>setTimeout(r,2500));} return el?'ok':'no'; })()""")
print("DASHBOARD/EQUIP:", json.dumps(c.ev(JS_FIND), ensure_ascii=False, indent=1))
c.ev("""(async () => { const el=[...document.querySelectorAll('nav a, nav button, aside a, aside button,[role=navigation] a,[role=navigation] button')].find(e=>/gps|pelacakan|tracking/i.test(e.textContent)); if(el){el.click(); await new Promise(r=>setTimeout(r,3500));} return el?'ok':'no'; })()""")
print("GPS:", json.dumps(c.ev(JS_FIND), ensure_ascii=False, indent=1))
