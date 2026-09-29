# -*- coding: utf-8 -*-
"""Probe elemen flow (bukan absolute/fixed) yang melewati 375px di halaman GPS."""
import json, time, urllib.request, websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=10))
page = next(t for t in tabs if t["type"] == "page")
ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=120, suppress_origin=True)
_id = 0
def send(m, **p):
    global _id; _id += 1
    ws.send(json.dumps({"id": _id, "method": m, "params": p}))
    while True:
        x = json.loads(ws.recv())
        if x.get("id") == _id: return x.get("result", {})
def ev(e):
    r = send("Runtime.evaluate", expression=e, returnByValue=True, awaitPromise=True)
    return r.get("result", {}).get("value")

send("Page.enable"); send("Runtime.enable")
send("Network.setCacheDisabled", cacheDisabled=True)
send("Emulation.setDeviceMetricsOverride", width=375, height=812, deviceScaleFactor=1, mobile=True)
send("Page.navigate", url=BASE)
time.sleep(7)
print("login:", ev("""(async () => {
  if (document.querySelector('h2') && !document.querySelector('input[type=password]')) return 'LOGGED';
  const setV=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};
  const u=document.querySelector('input[autocomplete="username"]')||document.querySelectorAll('input[type=text]')[0];
  const p=document.querySelector('input[type=password]');
  if(!u||!p) return 'NO INPUTS';
  setV(u,'admin'); setV(p,'admin');
  [...document.querySelectorAll('button')].find(b=>/masuk|login/i.test(b.textContent)).click();
  for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,500)); if(!document.querySelector('input[type=password]')&&document.querySelector('h2')) return 'LOGGED';}
  return 'TIMEOUT';})()"""))
ev("""(async () => { const el=[...document.querySelectorAll('nav a, nav button, aside a, aside button')].find(e=>/gps/i.test(e.textContent)); if(el){el.click(); await new Promise(r=>setTimeout(r,4000));} return el?'ok':'no'; })()""")
print(json.dumps(ev("""
(() => {
  const cw = document.documentElement.clientWidth;
  const bad = [];
  for (const el of document.querySelectorAll('*')) {
    const st = getComputedStyle(el);
    if (st.position === 'absolute' || st.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > cw + 1 || r.width > cw) {
      bad.push({ tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,44), right: Math.round(r.right), w: Math.round(r.width) });
    }
  }
  return { cw, scrollW: document.documentElement.scrollWidth, bodyW: Math.round(document.body.getBoundingClientRect().width), bad: bad.slice(0,12) };
})()
"""), ensure_ascii=False, indent=1))
