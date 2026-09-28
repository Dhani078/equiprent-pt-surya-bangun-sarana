"""Siklus 86c: modal renew (admin) + modal sign (customer) + preview."""
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

def login(role, pw):
    ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
    cmd("Page.navigate", url=B + "/?v=86c#/login")
    time.sleep(5)
    for i in range(3):
        ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/%s/.test(x.textContent));if(b)b.click();})()" % role)
        time.sleep(0.6)
        ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'%s');el.dispatchEvent(new Event('input',{bubbles:true}))})()" % pw)
        ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
        time.sleep(4 + 2 * i)
        if ev("!!document.querySelector('aside')"):
            return True
    return False

print("A. login admin:", login("Administrator", "admin"))
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Transaksi Penyewaan/.test(x.textContent));if(b)b.click();})()")
time.sleep(2.5)
ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/^Kontrak Digital/.test(x.textContent.trim()));if(b)b.click();})()")
time.sleep(2)
print("B. tombol Terbitkan disabled (data habis):", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Terbitkan Kontrak');
return b? !b.disabled ? 'ENABLED (harusnya kontrak semua sudah terbit!)' : 'disabled=benar' : 'no btn';})()"""))
print("C. filter Kedaluwarsa:", ev("""(()=>{
const s=[...document.querySelectorAll('select')].find(x=>/Kedaluwarsa|ALL/.test(x.textContent)||[...x.options].some(o=>/Kedaluwarsa|EXPIRED/i.test(o.textContent)));
if(!s)return 'no select';
const opt=[...s.options].find(o=>/EDALUWARSA|xpired/i.test(o.value+o.textContent));
if(!opt)return 'no option';
const ss=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;
ss.call(s,opt.value);s.dispatchEvent(new Event('change',{bubbles:true}));return 'ok';})()"""))
time.sleep(1.5)
print("D. klik Perpanjang:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Perpanjang/.test(x.textContent));
if(!b)return 'no btn';b.click();return 'ok';})()"""))
time.sleep(1.5)
print("E. modal renew:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Perpanjang Kontrak:/.test(x.textContent)&&x.offsetParent!==null);
if(!d)return 'tidak ada';
return {tgl:!!d.querySelector('#renew-valid-until'), nilai:d.querySelector('#renew-valid-until')?.value,
   peringatan:/kedaluwarsa per/.test(d.textContent), batal:/Batal/.test(d.textContent)};})()"""))
print("F. batal:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Perpanjang Kontrak:/.test(x.textContent));if(!d)return 'no';
const b=[...d.querySelectorAll('button')].find(x=>/Batal/.test(x.textContent));b.click();return 'ok';})()"""))
time.sleep(1.2)
print("G. dialog visible:", ev("[...document.querySelectorAll('[role=dialog]')].filter(x=>x.offsetParent!==null).length"))

print("H. login customer:", login("Pelanggan|Customer", "user"))
ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Kontrak/.test(x.textContent));if(b)b.click();})()")
time.sleep(2.5)
print("I. tombol tandatangan ada:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Tanda Tangan|Tandatangani/i.test(x.textContent));
return b?b.textContent.trim():'tidak ada (mungkin semua sudah ditandatangani)';})()"""))
print("J. klik tandatangan:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Tanda Tangan|Tandatangani/i.test(x.textContent));
if(!b)return 'no';b.click();return 'ok';})()"""))
time.sleep(1.5)
print("K. modal sign:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Penandatanganan Kontrak:/.test(x.textContent)&&x.offsetParent!==null);
if(!d)return 'tidak ada';
return {nama:!!d.querySelector('#signer-name'), nilaiNama:(d.querySelector('#signer-name')||{}).value||'',
   kanvas:!!d.querySelector('canvas'), uu_ite:/UU ITE/.test(d.textContent),
   tombol:[...d.querySelectorAll('button')].map(x=>x.textContent.trim()).filter(t=>t).slice(0,3)};})()"""))
print("L. tutup sign:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Penandatanganan Kontrak:/.test(x.textContent));if(!d)return 'no';
const b=[...d.querySelectorAll('button')].find(x=>/Tinjau Kembali/.test(x.textContent));b.click();return 'ok';})()"""))
time.sleep(1.2)
print("M. dialog visible:", ev("[...document.querySelectorAll('[role=dialog]')].filter(x=>x.offsetParent!==null).length"))
print("N. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
