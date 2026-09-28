"""Siklus 85b: panel jatuh tempo (innerText) + modal bukti transfer di tab Verifikasi Pembayaran."""
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
cmd("Page.navigate", url=B + "/?v=85b#/login")
time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/^Staf|Staff/i.test(x.textContent.trim()));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'staff');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break
print("A. login staff:", bool(ev("!!document.querySelector('aside')")))
time.sleep(3)

print("B. panel jatuh tempo:", ev("""(()=>{
const h=[...document.querySelectorAll('h3')].find(x=>/Notifikasi Jatuh Tempo/.test(x.textContent));
if(!h) return 'TIDAK ADA';
const card=h.closest('.card-premium');
const t=card.innerText.replace(/\\s+/g,' ');
return {ada:true, petikan:t.slice(0,140), denda:/Total estimasi denda/.test(t)};})()"""))

print("C. ke tab Verifikasi Pembayaran:", ev("""(()=>{
const b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Verifikasi Pembayaran/.test(x.textContent));
if(!b)return 'no nav';b.click();return 'ok';})()"""))
time.sleep(3)
print("D. tombol bukti:", ev("""(()=>{
const t=[...document.querySelectorAll('button')].map(x=>x.textContent.replace(/\\s+/g,' ').trim()).filter(x=>/Bukti|Pratinjau|Verifikasi|Tolak/i.test(x)&&x.length<40);
return [...new Set(t)].slice(0,8);})()"""))
print("E. klik buka bukti:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Pratinjau|Lihat Bukti|Bukti Transfer/i.test(x.textContent));
if(!b)return 'no btn';b.click();return 'ok';})()"""))
time.sleep(2)
print("F. modal bukti transfer:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Bukti Transfer:/.test(x.textContent)&&x.offsetParent!==null);
if(!d)return 'tidak ada';
return {jumlah:/Jumlah:/.test(d.innerText), kontrak:/Kontrak:/.test(d.innerText), berkas:/Berkas bukti:/.test(d.innerText),
   tombol:[...d.querySelectorAll('button')].map(x=>x.textContent.trim()).filter(t=>t).slice(0,4)};})()"""))
print("G. tutup:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Bukti Transfer:/.test(x.textContent));if(!d)return 'no dialog';
const b=[...d.querySelectorAll('button')].find(x=>/Tutup/.test(x.textContent));b.click();return 'ok';})()"""))
time.sleep(1.5)
print("H. dialog visible tersisa:", ev("[...document.querySelectorAll('[role=dialog]')].filter(x=>x.offsetParent!==null).length"))
print("I. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
