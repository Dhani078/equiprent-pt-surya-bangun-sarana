"""Siklus 79b: temukan label tombol sebenarnya di halaman Transaksi, lalu uji 2 modal."""
import json, time, urllib.request, websocket

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
page = next(t for t in tabs if t.get("type") == "page")
ws = websocket.create_connection(page["webSocketDebuggerUrl"], suppress_origin=True, timeout=120)
ws.settimeout(120)
_id = [0]


def cmd(m, **p):
    _id[0] += 1
    ws.send(json.dumps({"id": _id[0], "method": m, "params": p}))
    while True:
        try:
            x = json.loads(ws.recv())
        except websocket.WebSocketTimeoutException:
            continue
        if x.get("id") == _id[0]:
            return x.get("result", {})


def ev(e):
    r = cmd("Runtime.evaluate", expression=e, awaitPromise=True, returnByValue=True)
    return r.get("result", {}).get("value")


cmd("Page.bringToFront")
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Transaksi/i.test(x.textContent));if(b)b.click();})()")
time.sleep(4)

print("1. sub-tab tersedia:", ev("(()=>[...document.querySelectorAll('button')].map(b=>b.textContent.replace(/\\s+/g,' ').trim()).filter(t=>/Transaksi|Kontrak Digital/.test(t)&&t.length<40))()"))
print("2. semua tombol dalam halaman:", ev("""(()=>{
const main=document.querySelector('main')||document.body;
return [...main.querySelectorAll('button')].map(b=>b.textContent.replace(/\\s+/g,' ').trim())
 .filter(t=>t&&t.length<32).slice(0,25);})()"""))
print("3. baris tabel ada:", ev("document.querySelectorAll('tbody tr').length"))
print("4. status baris:", ev("""(()=>[...document.querySelectorAll('tbody tr')].slice(0,6)
 .map(r=>(r.textContent.match(/PENDING|APPROVED|ON_GOING|COMPLETED|REJECTED/)||['?'])[0]))()"""))
print("5. tombol aksi per baris:", ev("""(()=>{
const rows=[...document.querySelectorAll('tbody tr')].slice(0,3);
return rows.map(r=>[...r.querySelectorAll('button')].map(b=>b.textContent.replace(/\\s+/g,' ').trim()||b.getAttribute('aria-label')).slice(0,6));})()"""))