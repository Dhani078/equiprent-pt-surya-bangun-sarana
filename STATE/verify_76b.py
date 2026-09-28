"""Cek 5 tombol tab portal terdeteksi semuanya + panel Kontrak/Pembayaran/Lacak."""
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
print("5 tab (semua tombol dalam grid navigasi):")
print(json.dumps(ev("""(()=>{
const grid=[...document.querySelectorAll('div')].find(d=>/repeat\\(auto-fit, minmax\\(200px/.test(d.getAttribute('style')||''));
if(!grid) return 'grid TIDAK DITEMUKAN';
return [...grid.querySelectorAll('button')].map(b=>b.textContent.replace(/\\s+/g,' ').trim());
})()"""), ensure_ascii=False))

for label, expect in [("Kontrak", "Kontrak Sewa Digital"), ("Pembayaran", "Tagihan Pembayaran"),
                      ("Lacak Unit Saya", "GPS"), ("Sewa Saya", "Riwayat Permohonan")]:
    klik = ev("""(()=>{const grid=[...document.querySelectorAll('div')].find(d=>/repeat\\(auto-fit, minmax\\(200px/.test(d.getAttribute('style')||''));
    const b=grid&&[...grid.querySelectorAll('button')].find(x=>/%s/.test(x.textContent));if(!b)return 'no btn';b.click();return 'ok';})()""" % label)
    time.sleep(1.6)
    ada = ev("!!document.body.textContent.match(/%s/)" % expect)
    print("  %-16s klik=%s panel(%s)=%s" % (label, klik, expect, ada))
print("overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))