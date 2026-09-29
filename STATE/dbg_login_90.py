# -*- coding: utf-8 -*-
"""Debug login UI customer: kumpulkan console error & exception."""
import json, time, urllib.request, websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=10))
page = next(t for t in tabs if t["type"] == "page")
ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=120, suppress_origin=True)
_id = 0
msgs = []
def send(m, **p):
    global _id; _id += 1
    ws.send(json.dumps({"id": _id, "method": m, "params": p}))
    ws.settimeout(30)
    while True:
        x = json.loads(ws.recv())
        if x.get("id") == _id: return x.get("result", {})
        if x.get("method"): msgs.append(x)
def ev(e):
    r = send("Runtime.evaluate", expression=e, returnByValue=True, awaitPromise=True)
    if "exceptionDetails" in r:
        return {"__exc__": str(r["exceptionDetails"])[:220]}
    return r.get("result", {}).get("value")

send("Page.enable"); send("Runtime.enable")
send("Network.setCacheDisabled", cacheDisabled=True)
send("Emulation.setDeviceMetricsOverride", width=1280, height=800, deviceScaleFactor=1, mobile=False)
send("Page.navigate", url=BASE)
time.sleep(7)
r = ev("""(async () => {
  if(document.querySelector('h2')&&!document.querySelector('input[type=password]')) return 'LOGGED';
  const setV=(el,v)=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};
  const u=document.querySelector('input[autocomplete="username"]')||document.querySelectorAll('input[type=text]')[0];
  const p=document.querySelector('input[type=password]');
  if(!u||!p) return 'NO INPUTS';
  setV(u,'user'); setV(p,'user');
  const b=[...document.querySelectorAll('button')].find(x=>/masuk|login/i.test(x.textContent));
  if(!b) return 'NO LOGIN BUTTON';
  b.click();
  for(let i=0;i<24;i++){await new Promise(r=>setTimeout(r,500));if(!document.querySelector('input[type=password]')&&document.querySelector('h2'))return 'LOGGED';}
  return 'STILL: ' + (document.body.innerText||'').replace(/\\s+/g,' ').slice(0,260);
})()""")
print(r)
errs = []
for m in msgs:
    if m["method"] == "Runtime.consoleAPICalled" and m["params"].get("type") == "error":
        errs.append(" ".join(str(a.get("value", a.get("description","")))[:140] for a in m["params"].get("args", [])[:3]))
    if m["method"] == "Runtime.exceptionThrown":
        d = m["params"]["exceptionDetails"]
        errs.append("EXC " + str(d.get("exception", {}).get("description") or d.get("text"))[:180])
print("console errors:", json.dumps(errs[-6:], ensure_ascii=False, indent=1))
