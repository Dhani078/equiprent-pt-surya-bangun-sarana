"""Siklus 79 verifikasi: modal konfirmasi status & modal tambah booking.

Keduanya dipisah ke `src/pages/admin/rental/`. Yang diuji:
  A) halaman Transaksi Penyewaan render,
  B) tombol aksi status membuka modal konfirmasi (bukan langsung mengubah),
  C) modal konfirmasi memuat kode transaksi + tombol Batal/Konfirmasi,
  D) modal "Buat Transaksi Penyewaan Baru" terbuka dengan field lengkap.
Tidak ada status yang benar-benar diubah (batal di akhir).
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
cmd("Page.navigate", url=B + "/?v=79#/login")
time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Administrator/.test(x.textContent));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break
print("A. login:", ev("!!document.querySelector('aside')"))
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Transaksi/i.test(x.textContent));if(b)b.click();})()")
time.sleep(4)
print("B. halaman transaksi:", ev("!!document.body.textContent.match(/Manajemen Transaksi Penyewaan/)"))

# cari baris PENDING lalu klik tombol aksinya (Setujui / ubah status)
print("C. klik aksi status baris PENDING:", ev("""(()=>{
const rows=[...document.querySelectorAll('tbody tr')];
const row=rows.find(r=>/PENDING/.test(r.textContent));
if(!row) return 'no baris PENDING';
const btn=[...row.querySelectorAll('button')].find(b=>/Setujui|Ubah Status|Mobilisasi|Selesai/i.test(b.textContent));
if(!btn) return 'no tombol: '+[...row.querySelectorAll('button')].map(b=>b.textContent.trim()).join('/');
btn.click(); return 'klik: '+btn.textContent.trim();})()"""))
time.sleep(1.5)
print("D. modal konfirmasi:", ev("!!document.body.textContent.match(/Konfirmasi Perubahan Status/)"))
print("E. isi modal:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Konfirmasi Perubahan Status/.test(x.textContent));
if(!d) return 'tidak ada';
const t=d.textContent.replace(/\\s+/g,' ').trim();
return {kodeAda:/RNT-SBS/.test(t), tombol:[...d.querySelectorAll('button')].map(b=>b.textContent.trim()),
        cuplikan:t.slice(0,150)};})()"""))
print("F. batal:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Konfirmasi/.test(x.textContent));
if(!d)return 'no dialog';const b=[...d.querySelectorAll('button')].find(x=>/Batal/i.test(x.textContent));if(!b)return 'no batal';b.click();return 'dibatal';})()"""))
time.sleep(1.2)

print("G. buka modal tambah booking:", ev("""(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Buat Transaksi|Tambah Transaksi|Booking Baru/i.test(x.textContent));if(!b)return 'no btn: '+[...document.querySelectorAll('button')].map(x=>x.textContent.trim()).filter(t=>t.length<28).slice(0,12).join('|');b.click();return 'ok';})()"""))
time.sleep(1.5)
print("H. modal booking:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Buat Transaksi Penyewaan Baru/.test(x.textContent));
if(!d)return 'tidak ada';
const sel=[...d.querySelectorAll('select')].length, inp=[...d.querySelectorAll('input')].length;
return {select:sel, input:inp, tombol:[...d.querySelectorAll('button')].map(b=>b.textContent.trim()).slice(0,3)};})()"""))
print("I. tutup modal:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Buat Transaksi/.test(x.textContent));
if(!d)return 'no dialog';const b=[...d.querySelectorAll('button')].find(x=>/Batal|Tutup|×/i.test(x.textContent));if(!b)return 'no close';b.click();return 'ditutup';})()"""))
print("J. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))