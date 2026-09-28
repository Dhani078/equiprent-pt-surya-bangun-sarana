"""Siklus 86b: probe dialog issue + cek alur lengkap."""
import json, time, urllib.request, websocket

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
page = next(t for t in tabs if t.get("type") == "page")
ws = websocket.create_connection(page["webSocketDebuggerUrl"], suppress_origin=True, timeout=120)
_id = [0]
def cmd(m, **p):
    _id[0] += 1
    ws.send(json.dumps({"id": _id[0], "method": m, "params": p}))
    while True:
        try: x = json.loads(ws.recv())
        except Exception: continue
        if x.get("id") == _id[0]: return x.get("result", {})
def ev(e):
    return cmd("Runtime.evaluate", expression=e, awaitPromise=True, returnByValue=True).get("result", {}).get("value")

cmd("Page.bringToFront"); cmd("Network.enable")
cmd("Network.setCacheDisabled", cacheDisabled=True)
# sudah login admin di tab yang sama (sesi 86); langsung ke Transaksi > Kontrak Digital
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Transaksi Penyewaan/.test(x.textContent));if(b)b.click();})()")
time.sleep(2.5)
ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/^Kontrak Digital/.test(x.textContent.trim()));if(b)b.click();})()")
time.sleep(2)
print("A. dialog terbuka sekarang:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].filter(x=>x.offsetParent!==null);
return d.map(x=>x.textContent.replace(/\\s+/g,' ').trim().slice(0,60));})()"""))
print("B. klik Terbitkan Kontrak:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Terbitkan Kontrak');
if(!b)return 'no btn exact; list: '+[...document.querySelectorAll('button')].map(x=>x.textContent.trim()).filter(t=>/Terbitkan/.test(t)).join('|');
b.click();return 'ok';})()"""))
time.sleep(1.5)
print("C. dialog:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].filter(x=>x.offsetParent!==null);
return d.map(x=>({judul:(x.textContent.match(/Terbitkan Kontrak Baru|Penandatanganan|Perpanjang|Tinjau/)||[''])[0],
 pilih:!!x.querySelector('#rental-pilih'), opsi:x.querySelector('#rental-pilih')?x.querySelector('#rental-pilih').options.length:-1,
 body:x.textContent.replace(/\\s+/g,' ').trim().slice(0,90)}));})()"""))
