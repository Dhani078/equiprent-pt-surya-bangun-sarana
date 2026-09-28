"""Siklus 80 verifikasi halaman Perawatan & Servis setelah pecah 2 komponen.

A) halaman render + panel peringatan 250 HM,
B) panel Riwayat Servis per Unit: pilih unit -> ringkasan + tabel log muncul,
C) modal "Jadwalkan Perawatan" terbuka dengan field lengkap (select unit,
   jenis pemeliharaan, HM, tanggal, biaya) lalu ditutup tanpa menyimpan.
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
cmd("Page.navigate", url=B + "/?v=80#/login")
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
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Perawatan/i.test(x.textContent));if(b)b.click();})()")
time.sleep(4)
print("B. halaman servis:", ev("!!document.body.textContent.match(/Perawatan|Servis/)&&!!document.body.textContent.match(/250/)"))

# Panel riwayat: pilih unit pertama
print("C. pilih unit pada panel riwayat:", ev("""(()=>{
const sel=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>/Pilih Unit|Semua Unit/i.test(o.textContent)));
if(!sel) return 'no select riwayat';
const opsi=[...sel.options].filter(o=>/^\\d+$/.test(o.value));
if(opsi.length===0) return 'tidak ada unit';
const s=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;
s.call(sel, opsi[0].value); sel.dispatchEvent(new Event('change',{bubbles:true}));
return 'pilih unit ' + opsi[0].value;})()"""))
time.sleep(2)
print("D. isi panel riwayat:", ev("""(()=>{
const t=document.body.innerText;
const adaServis=/(Total Servis|Belum memiliki catatan servis)/.test(t);
const ringkasan=(t.match(/Total Servis[^\\n]*\\n?[^\\n]*/g)||[]).slice(0,1);
return {adaServis, ringkasan};})()"""))

# Modal jadwalkan
print("E. buka modal jadwal:", ev("""(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Jadwalkan|Tambah.*Servis|Buat.*Jadwal/i.test(x.textContent));if(!b)return 'no btn: '+[...document.querySelectorAll('button')].map(x=>x.textContent.trim()).filter(t=>t.length<28).slice(0,12).join('|');b.click();return 'ok';})()"""))
time.sleep(1.5)
print("F. isi modal jadwal:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Jadwalkan Perawatan Alat Berat/.test(x.textContent));
if(!d)return 'tidak ada';
return {select:[...d.querySelectorAll('select')].length, input:[...d.querySelectorAll('input')].length,
        jenis:[...d.querySelectorAll('select')].map(s=>[...s.options].length),
        tombol:[...d.querySelectorAll('button')].map(b=>b.textContent.trim()).slice(0,3)};})()"""))
print("G. tutup:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]')].find(x=>/Jadwalkan Perawatan/.test(x.textContent));
if(!d)return 'no dialog';const b=[...d.querySelectorAll('button')].find(x=>/Batal/i.test(x.textContent));if(!b)return 'no batal';b.click();return 'ok';})()"""))
time.sleep(1)
print("H. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))