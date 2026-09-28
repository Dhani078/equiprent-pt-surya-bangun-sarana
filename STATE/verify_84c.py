"""Siklus 84c: regression fix — booking batal benar2 hilang; modal transfer terbuka+valid."""
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
VIS = """(()=>{const d=[...document.querySelectorAll('[role=dialog]')].filter(x=>%s);
return {count:d.length, visible:d.filter(x=>x.offsetParent!==null).length};})()""" % "/Pengajuan Sewa:/.test(x.textContent)"

cmd("Page.bringToFront"); cmd("Network.enable")
cmd("Network.setCacheDisabled", cacheDisabled=True)
ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
cmd("Page.navigate", url=B + "/?v=84c#/login")
time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Pelanggan|Customer/i.test(x.textContent));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'user');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break

ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Ajukan Sewa|Pesan/i.test(x.textContent));if(b)b.click();})()")
time.sleep(1.2)
print("A. booking visible:", ev(VIS))
ev("(function(){var d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Pengajuan Sewa:/.test(x.textContent));if(d){var b=[...d.querySelectorAll('button')].find(x=>/Batal/.test(x.textContent));b.click();}})()")
time.sleep(1.2)
print("B. booking setelah Batal:", ev(VIS))

ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Pembayaran|Tagihan/.test(x.textContent));if(b)b.click();})()")
time.sleep(2.5)
print("C. klik Unggah Bukti:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Unggah Bukti Transfer/.test(x.textContent));
if(!b)return 'no btn';b.click();return 'ok';})()"""))
time.sleep(1.5)
print("D. modal transfer:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Konfirmasi Transfer:/.test(x.textContent));
if(!d||d.offsetParent===null)return 'tidak ada';
return {kode:(d.textContent.match(/PAY-\\S+/)||[''])[0], rekening:/Bank Mandiri 031-00-1234567-8/.test(d.textContent),
 berkas:!!d.querySelector('input[type=text]'), kirim:/Kirim Bukti Pembayaran/.test(d.textContent)};})()"""))
print("E. isian berkas salah -> error lokal:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Konfirmasi Transfer:/.test(x.textContent));if(!d)return 'no';
const inp=d.querySelector('input[type=text]');
const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
s.call(inp,'bukti.exe');inp.dispatchEvent(new Event('input',{bubbles:true}));
const b=[...d.querySelectorAll('button')].find(x=>/Kirim Bukti Pembayaran/.test(x.textContent));b.click();return 'ok';})()"""))
time.sleep(1.5)
print("F. pesan galat:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Konfirmasi Transfer:/.test(x.textContent));if(!d)return 'dialog hilang';
const al=d.querySelector('[role=alert]');return al?al.textContent.trim().slice(0,80):'tidak ada alert';})()"""))
print("G. bersih dialog:", ev("document.querySelectorAll('[role=dialog]').length"))
print("H. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
