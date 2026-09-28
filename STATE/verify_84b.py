"""Siklus 84b: diagnosis dialog (visible?) + tombol transfer sebenarnya."""
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
cmd("Page.navigate", url=B + "/?v=84b#/login")
time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Pelanggan|Customer/i.test(x.textContent));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'user');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break

# A. dialog booking + Batal + cek visible
ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Ajukan Sewa|Pesan/i.test(x.textContent));if(b)b.click();})()")
time.sleep(1.2)
print("booking open+visible:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].filter(x=>/Pengajuan Sewa:/.test(x.textContent));
return {count:d.length, visible:d.filter(x=>x.offsetParent!==null).length};})()"""))
ev("(function(){var d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Pengajuan Sewa:/.test(x.textContent));if(d){var b=[...d.querySelectorAll('button')].find(x=>/Batal/.test(x.textContent));b.click();}})()")
time.sleep(1.2)
print("booking closed (visible?):", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].filter(x=>/Pengajuan Sewa:/.test(x.textContent));
return {count:d.length, visible:d.filter(x=>x.offsetParent!==null).length};})()"""))

# B. daftar tab + cari payment dengan tombol
print("tabs:", ev("""(()=>{const t=[...document.querySelectorAll('button')].filter(b=>/Katalog|Sewa Saya|Pembayaran|Dokumen|Lacak/.test(b.textContent)).map(b=>b.textContent.replace(/\\s+/g,' ').trim());return t.slice(0,6);})()"""))
ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Pembayaran|Tagihan/.test(x.textContent));if(b)b.click();})()")
time.sleep(2.5)
print("tombol di tab pembayaran:", ev("""(()=>{
const t=[...document.querySelectorAll('button')].map(b=>b.textContent.replace(/\\s+/g,' ').trim()).filter(x=>x.length>1&&x.length<30);
return [...new Set(t)].slice(0,18);})()"""))
print("row tagihan:", ev("(()=>{return (document.body.innerText.match(/BELUM|Jatuh Tempo|DIBAYAR|PENDING/g)||[]).slice(0,6);})()"))
