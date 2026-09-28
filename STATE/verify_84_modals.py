"""Siklus 84 verifikasi: modal booking + modal bukti transfer sebagai komponen terpisah."""
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
cmd("Page.navigate", url=B + "/?v=84#/login")
time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Pelanggan|Customer/i.test(x.textContent));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'user');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break
print("A. login customer:", bool(ev("!!document.querySelector('aside')")))

# buka modal booking dari kartu katalog pertama yang bisa dipesan
print("B. buka booking:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Ajukan Sewa|Sewa Unit|Pesan/i.test(x.textContent)&&x.closest('[class*=card]'));
if(!b){const alt=[...document.querySelectorAll('button')].find(x=>/Ajukan Sewa|Pesan/i.test(x.textContent));if(!alt)return 'no btn';alt.click();return 'alt';}
b.click();return 'ok';})()"""))
time.sleep(1.5)
print("C. isi modal booking:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Pengajuan Sewa:/.test(x.textContent));
if(!d)return 'tidak ada';
return {judul:d.querySelector('h2,h3')?.textContent.trim().slice(0,50),
 tgl:[...d.querySelectorAll('input[type=date]')].length,
 catatan:!!d.querySelector('textarea'),
 estimasi:/Total Estimasi Biaya/.test(d.textContent),
 rupiah:(d.textContent.match(/Rp[\\d.,]+/g)||[]).slice(0,3)};})()"""))
print("D. ubah tanggal -> estimasi:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Pengajuan Sewa:/.test(x.textContent));if(!d)return 'no dialog';
const ins=[...d.querySelectorAll('input[type=date]')];
const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
s.call(ins[1],'2026-10-31');ins[1].dispatchEvent(new Event('input',{bubbles:true}));ins[1].dispatchEvent(new Event('change',{bubbles:true}));
return 'ok';})()"""))
time.sleep(1.2)
print("E. estimasi baru:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Pengajuan Sewa:/.test(x.textContent));if(!d)return 'no';
const m=d.textContent.match(/(\\d+) Hari/);const r=(d.textContent.match(/Rp[\\d.,]+\\s*[\\d.,]*/g)||[]).pop();return {hari:m?m[1]:'?',rp:r};})()"""))
print("F. batal -> tertutup:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Pengajuan Sewa:/.test(x.textContent));if(!d)return 'no dialog';
const b=[...d.querySelectorAll('button')].find(x=>/Batal/.test(x.textContent));b.click();return 'ok';})()"""))
time.sleep(1)
print("G. modal booking hilang:", ev("!document.querySelector('[role=dialog]')"))

# modal bukti transfer di tab Pembayaran
print("H. tab Pembayaran:", ev("""(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Pembayaran|Tagihan/.test(x.textContent));if(!b)return 'no tab';b.click();return 'ok';})()"""))
time.sleep(2.5)
print("I. buka bukti transfer:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Unggah|Kirim Bukti|Bayar/i.test(x.textContent));
if(!b)return 'no btn';b.click();return 'ok';})()"""))
time.sleep(1.5)
print("J. isi modal transfer:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Konfirmasi Transfer:/.test(x.textContent));
if(!d)return 'tidak ada';
return {kodenya:(d.textContent.match(/PAY-\\S+/)||[''])[0], rekening:/Bank Mandiri 031-00-1234567-8/.test(d.textContent),
 berkas:!!d.querySelector('input[type=text]'), kirim:/Kirim Bukti Pembayaran/.test(d.textContent)};})()"""))
print("K. batal:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Konfirmasi Transfer/.test(x.textContent));if(!d)return 'no';
const b=[...d.querySelectorAll('button')].find(x=>/Batal/.test(x.textContent));b.click();return 'ok';})()"""))
time.sleep(1)
print("L. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
