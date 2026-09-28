"""Siklus 86 verifikasi: modal kontrak (issue/sign/renew) sebagai komponen terpisah."""
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
ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
cmd("Page.navigate", url=B + "/?v=86#/login")
time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Administrator/.test(x.textContent));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break
print("A. login admin:", bool(ev("!!document.querySelector('aside')")))

print("B. nav Transaksi:", ev("""(()=>{
const b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Transaksi Penyewaan/.test(x.textContent));
if(!b)return 'no nav';b.click();return 'ok';})()"""))
time.sleep(3)
print("B2. sub-tab Kontrak Digital:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/^Kontrak Digital/.test(x.textContent.trim()));
if(!b)return 'no subtab';b.click();return 'ok';})()"""))
time.sleep(2.5)
print("C. panel kontrak:", ev("""(()=>{
const t=document.body.innerText;
return {judul:/Kontrak Sewa Digital/.test(t), cari:!!document.querySelector('#contract-search, input[placeholder*=kontrak i]'),
 baris:(t.match(/SBS\\/CONTRACT|KTR-\\d+/g)||[]).length};})()"""))

print("D. buka Terbitkan Kontrak:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Terbitkan Kontrak/.test(x.textContent));
if(!b)return 'no btn';b.click();return 'ok';})()"""))
time.sleep(1.5)
print("E. modal issue:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Terbitkan Kontrak Baru/.test(x.textContent)&&x.offsetParent!==null);
if(!d)return 'tidak ada';
return {pilih:!!d.querySelector('#rental-pilih'), opsi:d.querySelector('#rental-pilih')?d.querySelector('#rental-pilih').options.length:0,
 batal:/Batal/.test(d.textContent), terbitkanBtn:/Terbitkan Kontrak$/.test('x')||!![...d.querySelectorAll('button')].find(x=>/Terbitkan Kontrak/.test(x.textContent)&&!/Baru/.test(x.textContent))};})()"""))
print("F. batal modal issue:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Terbitkan Kontrak Baru/.test(x.textContent));if(!d)return 'no';
const b=[...d.querySelectorAll('button')].find(x=>/Batal/.test(x.textContent));b.click();return 'ok';})()"""))
time.sleep(1.2)
print("G. dialog visible:", ev("[...document.querySelectorAll('[role=dialog]')].filter(x=>x.offsetParent!==null).length"))

# modal tandatangan dari baris awaiting (buka preview dulu)
print("H. cari baris menunggu tanda tangan:", ev("""(()=>{
const t=[...document.querySelectorAll('button')].find(x=>/Tinjau|Lihat|Pratinjau/.test(x.textContent));
if(!t)return 'no tombol tinjau';t.click();return 'ok';})()"""))
time.sleep(1.5)
print("I. modal preview buka:", ev("[...document.querySelectorAll('[role=dialog]')].filter(x=>x.offsetParent!==null).length>0"))
print("J. tutup preview:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>x.offsetParent!==null);if(!d)return 'no';
const b=[...d.querySelectorAll('button')].find(x=>/Tutup|Batal/.test(x.textContent));if(b){b.click();return 'ok';}
d.querySelector('[aria-label*=Tutup]')&&d.querySelector('[aria-label*=Tutup]').click();return 'x';})()"""))
time.sleep(1.2)
print("K. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
