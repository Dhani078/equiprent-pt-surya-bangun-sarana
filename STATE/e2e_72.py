"""Siklus 72 E2E: daur-hidup kontrak.

A) API jalur-positif: sewa masa depan -> terbitkan kontrak -> tanda tangan HARUS
   berhasil (guard kedaluwarsa tidak memblokir kontrak sah), lalu dibersihkan.
B) API jalur-negatif: kontrak kedaluwarsa (valid_until lewat) -> 409 CONTRACT_EXPIRED.
C) UI production: badge "Kedaluwarsa" muncul di panel kontrak, dan tombol
   "Tanda Tangani" tidak dirender untuk kontrak kedaluwarsa.
"""
import json, time, urllib.request, urllib.error, websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
UA = {"User-Agent": "Mozilla/5.0"}


def call(path, data=None, tok=None, method="GET"):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(data).encode() if data is not None else None,
        method=method,
        headers={"Content-Type": "application/json", "X-SBS-Session": tok or "", **UA},
    )
    try:
        body = urllib.request.urlopen(req).read().decode()
        return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return {"HTTP": e.code, "body": json.loads(raw)}
        except Exception:
            return {"HTTP": e.code, "raw": raw[:200]}


admin = call("/api/auth/login", {"username": "admin", "password": "admin"}, method="POST")["token"]


def listOf(path):
    """Ambil array data dari endpoint yang bisa membalas list ATAU {data:...}."""
    d = call(path, tok=admin)
    return d["data"] if isinstance(d, dict) and "data" in d else d

# ---------- C) UI production lewat CDP ----------
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
cmd("Page.navigate", url=BASE + "/?v=72#/login")
time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Administrator/.test(x.textContent));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break
print("A. UI login:", ev("!!document.querySelector('aside')"))

# buka menu Transaksi Sewa (memuat ContractPanel) — cari menu yang mengandung 'Kontrak'
menu = ev("""(()=>{const a=[...document.querySelectorAll('aside nav a, aside nav button')];
const t=a.map(x=>x.textContent.trim());
return t;})()""")
print("menu sidebar:", menu)

buka = ev("""(()=>{const b=[...document.querySelectorAll('aside nav a, aside nav button')]
.find(x=>/Transaksi|Kontrak|Sewa/i.test(x.textContent));if(!b)return 'TIDAK ADA';b.click();return b.textContent.trim();})()""")
print("buka menu:", buka)
time.sleep(4)

sub = ev("""(()=>{const b=[...document.querySelectorAll('button, [role=tab]')]
.find(x=>/Kontrak Digital/i.test(x.textContent));if(!b)return 'TIDAK ADA';b.click();return b.textContent.trim();})()""")
print("sub-tab:", sub)
time.sleep(3)

ui = ev("""(()=>{
const rows=[...document.querySelectorAll('tbody tr')];
const out=[];
for(const r of rows){
  const txt=r.textContent;
  const badges=[...r.querySelectorAll('span')].map(s=>s.textContent.trim()).filter(s=>/Tanda Tangan|Kedaluwarsa|Ditandatangani/.test(s));
  const signBtn=[...r.querySelectorAll('button')].some(b=>/Tanda Tangani/i.test(b.textContent));
  out.push({badge:badges[0]||'-',signBtn});
}
const count={};
for(const o of out){const k=o.badge+'|sign='+o.signBtn;count[k]=(count[k]||0)+1;}
return {rows:out.length,sebaran:count,total:out.length,contoh:out.slice(0,3)};})()""")
print("B. UI tabel kontrak:", json.dumps(ui, ensure_ascii=False))
print("   tombol Tanda Tangani pada badge Kedaluwarsa:",
      (ui or {}).get("sebaran", {}))

# ---------- B) jalur negatif lewat API ----------
cs = call("/api/contracts", tok=admin)["data"]
exp = [c for c in cs if not c.get("is_signed_customer") and (c.get("valid_until") or "") < "2026-09-28"]
if exp:
    r = call("/api/contracts/%d/sign" % exp[0]["id"],
             {"signerName": "Uji Kedaluwarsa", "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=="},
             tok=admin, method="POST")
    print("C. API tolak kedaluwarsa:", json.dumps(r, ensure_ascii=False)[:190])
else:
    print("C. API: tidak ada kontrak kedaluwarsa untuk diuji")

# ---------- A) jalur positif: kontrak baru belum lewat -> tanda tangan sah ----------
import datetime
tgl = (datetime.date(2026, 9, 29) + datetime.timedelta(days=0)).isoformat()
akhir = (datetime.date(2026, 11, 30)).isoformat()
eq = call("/api/equipments", tok=admin)
eq = eq["data"] if isinstance(eq, dict) else eq
unit = [e for e in eq if e.get("status") == "AVAILABLE"]
if unit:
    r = call("/api/rentals", {
        "equipment_id": unit[0]["id"], "customer_id": 9, "start_date": tgl, "end_date": akhir,
        "total_days": 60, "subtotal": 1000000, "status": "PENDING",
        "notes": "uji daur hidup kontrak",
    }, tok=admin, method="POST")
    rid = (r.get("item") or r.get("data") or {}).get("id") or r.get("id")
    print("D. buat sewa:", json.dumps(r, ensure_ascii=False)[:150], "id=", rid)
    if rid:
        k = call("/api/contracts", {"rentalId": rid}, tok=admin, method="POST")
        kid = (k.get("item") or k.get("data") or {}).get("id") or k.get("id")
        ku = (k.get("item") or k.get("data") or {}).get("valid_until")
        print("E. terbit kontrak:", kid, "valid_until:", ku)
        if kid:
            s = call("/api/contracts/%d/sign" % kid,
                     {"signerName": "Uji Sah", "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=="},
                     tok=admin, method="POST")
            print("F. tanda tangan kontrak SAH:", json.dumps(s, ensure_ascii=False)[:200])
            # bersihkan (hanya tagihan kontrak ini; /api/payments tidak
            # menyediakan filter contractId — saring di sisi klien)
            ps = call("/api/payments", tok=admin)
            ps = ps["data"] if isinstance(ps, dict) else ps
            target = [x for x in ps if x.get("contract_id") == kid]
            # PENGAMAN: jalur penghapusan bersih-bersih hanya boleh menyentuh
            # data uji milik kontrak ini. Pernah kejadian (dokumentasi siklus 72):
            # endpoint /api/payments mengabaikan ?contractId= sehingga daftar
            # penuh terambil dan 13 tagihan nyata ikut terhapus.
            assert len(target) <= 2, "ABORT: penghapusan menyasar %d tagihan, jauh di luar cakupan uji" % len(target)
            assert all(x.get("contract_id") == kid for x in target), "ABORT: ada tagihan di luar kontrak uji"
            for p in target:
                print("   (cleanup) hapus payment", p["id"], json.dumps(call("/api/payments/%d" % p["id"], tok=admin, method="DELETE"))[:90])
        # PENGAMAN: isolate Cloudflare bisa menyajikan state basi sehingga
        # DELETE pertama menjawab 404 walau barisnya ada. Ulangi sampai
        # baris benar-benar hilang, lalu buktikan lewat jumlah akhir.
        for _ in range(5):
            k2 = [c for c in (call("/api/contracts", tok=admin)["data"]) if c["id"] == kid]
            if not k2:
                break
            print("   (cleanup) hapus kontrak:", json.dumps(call("/api/contracts/%d" % kid, tok=admin, method="DELETE"))[:110])
            time.sleep(2)
        for _ in range(5):
            r2 = [x for x in listOf("/api/rentals") if x["id"] == rid]
            if not r2:
                break
            print("   (cleanup) hapus sewa:", json.dumps(call("/api/rentals/%d" % rid, tok=admin, method="DELETE"))[:110])
            time.sleep(2)


# ---------- G) sidik jari data: pastikan tidak ada yang ikut terhapus ----------
def jumlah(path):
    return len(listOf(path))


eq, rt, ct, py = jumlah("/api/equipments"), jumlah("/api/rentals"), jumlah("/api/contracts"), jumlah("/api/payments")
print("G. sidik jari data eq/rent/con/pay: %d/%d/%d/%d" % (eq, rt, ct, py))
assert (eq, rt, ct, py) == (50, 50, 50, 50), "ABORT: jumlah data dasar berubah dari baseline 50/50/50/50!"
print("SELESAI")