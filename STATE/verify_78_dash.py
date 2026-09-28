"""Siklus 78 verifikasi dashboard admin setelah pecah panels.tsx.

Memastikan panel analytics (Utilisasi Bulanan + Top 5 Pelanggan) masih render
dan angka KPI muncul — bukti pemisahan tidak memutus data.
"""
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
cmd("Network.enable")
cmd("Network.setCacheDisabled", cacheDisabled=True)
errs = []
cmd("Runtime.consoleAPICalled")
ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
cmd("Page.navigate", url=B + "/?v=78#/login")
time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Administrator/.test(x.textContent));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break
time.sleep(4)
print("A. login admin:", ev("!!document.querySelector('aside')"))
print("B. judul halaman:", ev("(()=>{const h=[...document.querySelectorAll('h2')].map(x=>x.textContent.trim());return h.slice(0,2);})()"))
print("C. panel Utilisasi Armada:", ev("!!document.body.textContent.match(/Utilisasi Armada per Bulan/)"))
print("D. panel Top 5 Pelanggan:", ev("!!document.body.textContent.match(/5 Pelanggan|Pelanggan Teratas|Top 5/i)"))
print("E. KPI cards:", ev("(()=>{const t=document.body.innerText;const m=t.match(/(Total Unit|Pendapatan|Sewa Aktif|Pelanggan)[^\\n]{0,30}/g);return m?m.slice(0,5):[];})()"))
print("F. grafik tren:", ev("!!document.querySelector('svg')"))
print("G. banner servis preventif:", ev("!!document.body.textContent.match(/Servis Preventif|250 HM/)"))
print("H. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))

# tangkap error konsol nyata
cmd("Runtime.enable")
err = ev("(()=>{return window.__sbsConsoleErr || 'none';})()")
print("I. error konsol:", err)