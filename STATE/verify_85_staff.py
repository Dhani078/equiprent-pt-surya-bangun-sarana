"""Siklus 85 verifikasi dashboard staf: panel jatuh tempo + modal bukti transfer."""
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
cmd("Page.navigate", url=B + "/?v=85#/login")
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
if(!h)return 'TIDAK ADA';
const card=h.closest('.card-premium');
return {baris:card.querySelectorAll('[style*=\\'flex\\']").length>0, terlambat:(card.textContent.match(/\\d+ terlambat/)||[''])[0], denda:/Total estimasi denda/.test(card.textContent)};})()"""))
print("C. tombol Tindak Lanjut:", ev("""(()=>{const b=[...document.querySelectorAll('button')].filter(x=>/Tindak Lanjut/.test(x.textContent));return b.length;})()"""))
print("D. klik Tindak Lanjut:", ev("""(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Tindak Lanjut/.test(x.textContent));if(!b)return 'no';b.click();return 'ok';})()"""))
time.sleep(2)
print("E. tab sewa aktif:", ev("/Penyetujuan Sewa|Sewa/.test(document.querySelector('h2,h3')?.closest('main')?.innerText||document.body.innerText)"))

# modal bukti transfer
print("F. klik Unggah/Pratinjau bukti:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Pratinjau|Lihat Bukti|Unggah Bukti/i.test(x.textContent));
if(!b){const t=[...document.querySelectorAll('button')].map(x=>x.textContent.trim()).filter(x=>x.length<26);return 'no btn: '+t.slice(0,14).join('|');}
b.click();return 'ok:'+b.textContent.trim();})()"""))
time.sleep(2)
print("G. modal transfer:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Bukti Transfer:/.test(x.textContent));
if(!d||d.offsetParent===null)return 'tidak ada';
return {jumlah:/Jumlah:/.test(d.textContent), berkas:/Berkas bukti:/.test(d.textContent),
 aksiPENDING:/Tolak Bukti|Verifikasi Lunas|Tutup/.test(d.textContent)};})()"""))
print("H. tutup (Tutup):", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Bukti Transfer:/.test(x.textContent));if(!d)return 'no dialog';
const b=[...d.querySelectorAll('button')].find(x=>/Tutup/.test(x.textContent));b.click();return 'ok';})()"""))
time.sleep(1.2)
print("I. dialog hilang:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].filter(x=>x.offsetParent!==null);return d.length;})()"""))
print("J. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
