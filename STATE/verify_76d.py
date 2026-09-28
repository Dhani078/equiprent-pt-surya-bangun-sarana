"""Ambil judul panel yang benar-benar tampil untuk tab Pembayaran & Lacak."""
import json, time, urllib.request, websocket
B="https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
tabs=json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
page=next(t for t in tabs if t.get("type")=="page")
ws=websocket.create_connection(page["webSocketDebuggerUrl"],suppress_origin=True,timeout=120); ws.settimeout(120)
_id=[0]
def cmd(m,**p):
    _id[0]+=1; ws.send(json.dumps({"id":_id[0],"method":m,"params":p}))
    while True:
        try: x=json.loads(ws.recv())
        except websocket.WebSocketTimeoutException: continue
        if x.get("id")==_id[0]: return x.get("result",{})
def ev(e):
    r=cmd("Runtime.evaluate",expression=e,awaitPromise=True,returnByValue=True); return r.get("result",{}).get("value")
cmd("Page.bringToFront")
JS="""(()=>{const grid=[...document.querySelectorAll('div')].find(d=>/repeat\\(auto-fit, minmax\\(200px/.test(d.getAttribute('style')||''));
const b=grid&&[...grid.querySelectorAll('button')].find(x=>/%s/.test(x.textContent));if(!b)return 'no btn';b.click();return 'ok';})()"""
for label in ["Tagihan & Transfer","Kontrak & E-Sign","Lacak Unit Saya","Sewa Saya"]:
    ev(JS % label); time.sleep(2)
    h3=ev("(()=>{const a=[...document.querySelectorAll('h3')].map(x=>x.textContent.replace(/\\s+/g,' ').trim()).filter(t=>t.length>3);return a.slice(0,4);})()")
    print("%-18s -> %s" % (label, json.dumps(h3, ensure_ascii=False)[:200]))
