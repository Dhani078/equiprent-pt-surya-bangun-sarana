"""Siklus 77 verifikasi: form tambah unit (EquipmentFormModal) masih utuh.

Membuka modal, mengisi field, submit, memastikan unit tersimpan ke TiDB, lalu
menghapusnya. Bukti bahwa pemisahan komponen tidak memutus alur tulis.
"""
import json, time, urllib.request, urllib.error, websocket

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
KODE = "S77-MODAL"


def call(path, data=None, tok=None, method="GET"):
    req = urllib.request.Request(
        B + path, data=json.dumps(data).encode() if data is not None else None, method=method,
        headers={"Content-Type": "application/json", "X-SBS-Session": tok or "", "User-Agent": "Mozilla/5.0"})
    try:
        b = urllib.request.urlopen(req).read().decode()
        return json.loads(b) if b else {}
    except urllib.error.HTTPError as e:
        return {"HTTP": e.code, "body": e.read().decode()[:150]}


admin = call("/api/auth/login", {"username": "admin", "password": "admin"}, method="POST")["token"]


def lof(p):
    d = call(p, tok=admin)
    return d["data"] if isinstance(d, dict) and "data" in d else d


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
cmd("Page.navigate", url=B + "/?v=77#/login")
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
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Inventaris/i.test(x.textContent));if(b)b.click();})()")
time.sleep(3.5)
print("B. klik Tambah Alat Baru:", ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Tambah Alat Baru/i.test(x.textContent));if(!b)return 'no btn';b.click();return 'ok';})()"))
time.sleep(2)
print("C. modal terbuka:", ev("!!document.querySelector('[role=dialog]')"))
print("D. judul modal:", ev("(()=>{const d=document.querySelector('[role=dialog]');return d?d.textContent.replace(/\\s+/g,' ').trim().slice(0,70):'-';})()"))

isi = ev("""(()=>{
const d=document.querySelector('[role=dialog]'); if(!d) return 'no dialog';
const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(el.constructor.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};
const inputs=[...d.querySelectorAll('input')].filter(i=>i.type!=='checkbox'&&i.type!=='radio');
// Urutan form: 1 kode, 2 nama, 3 model (brand/type = select)
const teks=inputs.filter(i=>i.type==='text');
if(teks[0]) set(teks[0],'%s');
if(teks[1]) set(teks[1],'UJI MODAL SIKLUS 77');
if(teks[2]) set(teks[2],'MX-77');
const num=inputs.filter(i=>i.type==='number');
if(num[0]) set(num[0],'12');       // hour meter
if(num[1]) set(num[1],'1500000');  // harga harian
return {total:inputs.length, teks:teks.length, num:num.length, contoh:teks.slice(0,3).map(i=>i.value)};})()""" % KODE)
print("E. isi form:", json.dumps(isi, ensure_ascii=False))

print("F. submit:", ev("(()=>{const d=document.querySelector('[role=dialog]');const b=[...d.querySelectorAll('button')].find(x=>/Tambah Unit|Simpan/i.test(x.textContent));if(!b)return 'no btn';b.click();return 'clicked';})()"))
time.sleep(6)
print("G. modal tertutup:", ev("!document.querySelector('[role=dialog]')"))
time.sleep(5)
found = [e for e in lof("/api/equipments") if e.get("equipment_code") == KODE]
print("H. unit di TiDB:", bool(found), found[0]["id"] if found else "-")
if found:
    print("I. cleanup:", call("/api/equipments/%d" % found[0]["id"], tok=admin, method="DELETE"))
time.sleep(5)
print("J. total unit:", len(lof("/api/equipments")))
print("K. sisa uji:", len([e for e in lof("/api/equipments") if e.get("equipment_code") == KODE]))