"""Cek tab Pembayaran & Lacak Unit dengan label persis dari grid navigasi."""
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
for label, expect in [("Tagihan & Transfer","Riwayat Tagihan Sewa"), ("Lacak Unit Saya","Lacak Posisi")]:
    print(label, '->', ev(JS % label)); time.sleep(2)
    teks=ev("document.body.innerText.slice(0,0)") 
    cek=ev("(()=>{const t=document.body.innerText;const i=t.indexOf('%s');return i<0?'TIDAK ADA':t.slice(i,i+90).replace(/\\s+/g,' ');})()" % expect)
    print('   panel:',cek)
print('overflow:',ev("document.documentElement.scrollWidth-document.documentElement.clientWidth"))
