"""Siklus 79c: uji modal konfirmasi status + modal Buat Booking Sewa (label asli)."""
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
print("A. klik aksi 'Mobilisasi' baris APPROVED:", ev("""(()=>{
const rows=[...document.querySelectorAll('tbody tr')];
const row=rows.find(r=>/APPROVED/.test(r.textContent));
if(!row) return 'no APPROVED';
const b=[...row.querySelectorAll('button')].find(x=>/Mobilisasi/.test(x.textContent));
if(!b) return 'no tombol';
b.click(); return 'klik';})()"""))
time.sleep(1.5)
print("B. modal konfirmasi muncul:", ev("!!document.body.textContent.match(/Konfirmasi Perubahan Status/)"))
print("C. isi modal:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Konfirmasi/.test(x.textContent));
if(!d)return 'tidak ada';const t=d.textContent.replace(/\\s+/g,' ').trim();
return {kode:/RNT-SBS/.test(t), status:/(Mobilisasi|Setujui|Selesai|Tolak)/.test(t),
        tombol:[...d.querySelectorAll('button')].map(b=>b.textContent.trim()), cuplikan:t.slice(0,120)};})()"""))
print("D. Batal:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Konfirmasi/.test(x.textContent));
if(!d)return 'no dialog';const b=[...d.querySelectorAll('button')].find(x=>/Batal/i.test(x.textContent));if(!b)return 'no batal';b.click();return 'ok';})()"""))
time.sleep(1.2)
print("E. modal tertutup:", ev("!document.body.textContent.match(/Konfirmasi Perubahan Status/)"))

print("F. buka 'Buat Booking Sewa':", ev("""(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Buat Booking Sewa/i.test(x.textContent));if(!b)return 'no btn';b.click();return 'ok';})()"""))
time.sleep(1.5)
print("G. modal booking:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Buat Transaksi Penyewaan Baru/.test(x.textContent));
if(!d)return 'tidak ada';
return {select:[...d.querySelectorAll('select')].length, input:[...d.querySelectorAll('input')].length,
        opsiUnit:[...d.querySelectorAll('option')].length,
        tombol:[...d.querySelectorAll('button')].map(b=>b.textContent.trim()).slice(0,3)};})()"""))
print("H. tutup:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Buat Transaksi/.test(x.textContent));
if(!d)return 'no dialog';const b=[...d.querySelectorAll('button')].find(x=>/Batal/i.test(x.textContent));if(!b)return 'no batal';b.click();return 'ok';})()"""))
time.sleep(1)
print("I. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))