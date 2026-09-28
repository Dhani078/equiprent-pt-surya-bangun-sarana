"""Siklus 76 verifikasi UI portal pelanggan (header + nav tab dipisah).

Memastikan pemisahan komponen tidak mengubah perilaku: header tampil, 5 tab
ada dengan angka yang benar, klik tab membuka panel, dan tidak ada overflow.
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
ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
cmd("Page.navigate", url=B + "/?v=76#/login")
time.sleep(5)

for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Pelanggan|Customer/i.test(x.textContent));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'user');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break

print("A. login customer:", ev("!!document.querySelector('aside')"))
print("B. header:", ev("(()=>{const el=[...document.querySelectorAll('h2')].find(x=>/Selamat Datang/.test(x.textContent));return el?el.textContent.trim():'TIDAK ADA';})()"))
print("C. account manager:", ev("(()=>{const el=[...document.querySelectorAll('div')].find(x=>/Account Manager Anda/.test(x.textContent));return el?el.textContent.replace(/\\s+/g,' ').trim().slice(0,90):'TIDAK ADA';})()"))

tabsUi = ev("""(()=>{const t=[...document.querySelectorAll('button')]
 .filter(b=>/Katalog Alat Berat|Sewa Saya|Dokumen|Pembayaran|Lacak Unit Saya/.test(b.textContent))
 .map(b=>b.textContent.replace(/\\s+/g,' ').trim());
return t.slice(0,5);})()""")
print("D. 5 tab:", json.dumps(tabsUi, ensure_ascii=False)[:320])

print("E. klik tab Kontrak:", ev("(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Kontrak Sewa Digital|Dokumen/.test(x.textContent));if(!b)return 'no btn';b.click();return 'clicked';})()"))
time.sleep(2)
print("F. panel kontrak tampil:", ev("!!document.body.textContent.match(/Kontrak Sewa Digital/)"))

print("G. klik tab Katalog:", ev("(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Unit Siap Sewa/.test(x.textContent));if(!b)return 'no btn';b.click();return 'clicked';})()"))
time.sleep(2)
print("H. katalog tampil:", ev("!!document.body.textContent.match(/Katalog Alat Berat Siap Mobilisasi/)"))
print("I. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
print("J. konsol error:", ev("(()=>{return window.__sbsErr ? window.__sbsErr : 'none';})()"))