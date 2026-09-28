# -*- coding: utf-8 -*-
"""Siklus 61 - E2E alur bisnis lewat UI PRODUCTION (CDP), bukti TiDB via API."""
import base64
import json
import time
import urllib.request
import urllib.error
import websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
API = BASE + "/api"
STAMP = time.strftime("%d%H%M")
CODE = "E61-" + STAMP
NAME = "Unit Uji Siklus 61 " + STAMP
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
Q = '"'
SQ = "'"


def api(method, path, body=None, tok=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", UA)
    if tok:
        req.add_header("X-SBS-Session", tok)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data, timeout=60) as r:
            return r.status, json.loads(r.read().decode() or "null")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "null")
        except Exception:
            return e.code, None


def unwrap(x):
    if isinstance(x, dict) and "data" in x:
        return x["data"]
    return x


def admin_token():
    st, j = api("POST", "/auth/login", {"username": "admin", "password": "admin"})
    return j["token"] if st == 200 and j else None


def get_coll(name):
    return unwrap(api("GET", "/" + name, tok=admin_token())[1]) or []


tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
page = next(t for t in tabs if t.get("type") == "page")
ws = websocket.create_connection(page["webSocketDebuggerUrl"], suppress_origin=True, timeout=90)
ws.settimeout(90)
_id = [0]


def cmd(method, **p):
    _id[0] += 1
    ws.send(json.dumps({"id": _id[0], "method": method, "params": p}))
    while True:
        try:
            m = json.loads(ws.recv())
        except websocket.WebSocketTimeoutException:
            continue
        if m.get("id") == _id[0]:
            if "error" in m:
                raise RuntimeError(m["error"])
            return m.get("result", {})


def ev(expr):
    r = cmd("Runtime.evaluate", expression=expr, awaitPromise=True, returnByValue=True)
    if "exceptionDetails" in r:
        return "EXC:" + json.dumps(r["exceptionDetails"].get("exception", {}).get("description", ""))[:200]
    return r.get("result", {}).get("value")


def log(*a):
    print(*a, flush=True)


def js_find(label):
    """JS: elemen input/textarea/select by aria-label ATAU placeholder (substring)."""
    L = json.dumps(label)
    return ("[...document.querySelectorAll('input,textarea,select')].find(i=>"
            "(i.getAttribute('aria-label')||'').includes(%s)||"
            "(i.getAttribute('placeholder')||'').includes(%s)||i.id===%s)" % (L, L, json.dumps("signer-name" if "Penandatangan" in label else label)))


def set_val(label, value):
    v = json.dumps(value)
    return ev("(function(){var el=%s;if(!el)return 'NF';var P=el.tagName==='TEXTAREA'?HTMLTextAreaElement:el.tagName==='SELECT'?HTMLSelectElement:HTMLInputElement;Object.getOwnPropertyDescriptor(P.prototype,'value').set.call(el,%s);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return 'OK';})()" % (js_find(label), v))


def pick_select(label, option_re):
    o = json.dumps(option_re)
    return ev("(function(){var el=%s;if(!el)return 'NF';var op=[...el.options].find(o=>new RegExp(%s,'i').test(o.text));if(!op)return 'NOOPT';Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,op.value);el.dispatchEvent(new Event('change',{bubbles:true}));return 'OK:'+op.text;})()" % (js_find(label), o))


def click_btn(match_js, wait=1.5):
    r = ev("(function(){var els=[...document.querySelectorAll('button')];var b=els.find(x=>(%s));if(!b)return 'NF';b.click();return 'CLICK';})()" % match_js)
    time.sleep(wait)
    return r


def nav_click(label, wait=2):
    L = json.dumps(label)
    r = ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>x.textContent.toLowerCase().includes(%s.toLowerCase()));if(!b)return 'NF';b.click();return true;})()" % L)
    time.sleep(wait)
    return r


def login(user, pwd):
    role = {"admin": "Administrator", "staff": "Staf", "user": "Pelanggan"}[user]
    ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
    ev("location.href=" + json.dumps(BASE + "/#/login") + "; 1")
    time.sleep(1.5)
    ev("location.reload(); 1")
    time.sleep(3.5)
    R = json.dumps(role)
    ok = ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===%s);if(!b)return false;b.click();return true;})()" % R)
    if not ok:
        return False
    time.sleep(0.4)
    ev("(function(){var el=document.querySelector('input[type=" + SQ + "password" + SQ + "]');if(!el)return;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,%s);el.dispatchEvent(new Event('input',{bubbles:true}));})()" % json.dumps(pwd))
    time.sleep(0.3)
    for attempt in range(3):
        ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
        time.sleep(4 + attempt * 2)
        if ev("!!document.querySelector('aside')"):
            log("login", user, "-> True (percobaan %d)" % (attempt + 1))
            return True
        # mungkin error API: klik ulang
    log("login", user, "-> False")
    return False


def arm_net():
    ev("(function(){if(window.__patched)return;var of=window.fetch;window.__net=[];window.fetch=async function(){var u=(typeof arguments[0]==='string'?arguments[0]:arguments[0]&&arguments[0].url)||'';var res=await of.apply(null,arguments);if(u.indexOf('/api/')!==-1)window.__net.push({u:u,s:res.status});return res;};window.__patched=true;})()")


def net_summary():
    return ev("(window.__net||[]).filter(n=>n.s>=400).map(n=>n.u.split('/api/')[1]+'='+n.s).join(', ')||'BERSIH-4xx'")


log("== E2E SIKLUS 61 @", BASE)
HASIL = {}

# 1) ADMIN: tambah unit via UI
assert login("admin", "admin")
arm_net()
assert nav_click("Inventaris")
click_btn("/Tambah Alat Baru/.test(x.textContent)")
time.sleep(0.8)
log("form unit:", set_val("Nama lengkap alat berat", NAME), set_val("Kode registrasi unit", CODE))
log("kategori:", pick_select("Kategori alat", "Excavator|Vibro|Dozer|Loader|Grader"))
log("merk:", set_val("Merk", "Hermes QA"), "| model:", set_val("Model", "E2E-1"),
    "| tahun:", set_val("Tahun", "2021"), "| tarif:", set_val("Tarif", "1500000"))
ev("(function(){var el=%s;if(el){Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'Unit uji E2E 61.');el.dispatchEvent(new Event('input',{bubbles:true}));}return !!el;})()" % js_find("Spesifikasi Teknis Operasional"))
log("simpan:", click_btn("x.type==='submit'&&/Tambah Unit/.test(x.textContent)", 2.5))
new_eq = next((e for e in get_coll("equipments") if e["name"] == NAME), None)
HASIL["1_unit"] = bool(new_eq)
log("unit di TiDB:", bool(new_eq), "| net:", net_summary())
assert new_eq
EQ_ID = new_eq["id"]

# 2) CUSTOMER: ajukan sewa via UI
assert login("user", "user")
arm_net()
assert nav_click("Katalog")
time.sleep(1)
def klik_ajukan():
    return ev("(function(){var cards=[...document.querySelectorAll('.card-premium')];var c=cards.find(x=>x.textContent.includes(%s));if(!c)return 'CARD-NF';var b=[...c.querySelectorAll('button')].find(x=>/Ajukan Sewa/.test(x.textContent));if(!b)return 'BTN-NF';b.click();return 'OK';})()" % json.dumps(NAME))
r = klik_ajukan()
if r in ('CARD-NF', 'BTN-NF'):
    set_val("Nama, kode", NAME)
    time.sleep(1.2)
    r = klik_ajukan()
log("Ajukan Sewa:", r)
time.sleep(1.2)
log("tgl:", ev("(function(){var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;var dl=[...document.querySelectorAll('[role=dialog] input[type=\\'date\\']')];var ds=dl.length>=2?dl:[...document.querySelectorAll('input[type=\\'date\\']')].slice(-2);if(ds.length<2)return 'NODATE';set.call(ds[0],'2026-10-02');ds[0].dispatchEvent(new Event('input',{bubbles:true}));set.call(ds[1],'2026-10-05');ds[1].dispatchEvent(new Event('input',{bubbles:true}));return ds.length;})()"))
log("catatan:", set_val("Catatan Lokasi", "Uji E2E siklus 61"))
log("submit pengajuan:", click_btn("/Ajukan Permohonan/.test(x.textContent)", 3))
my_rent = next((x for x in get_coll("rentals") if x["equipment_id"] == EQ_ID), None)
HASIL["2_rental"] = bool(my_rent)
log("rental:", my_rent and my_rent["rental_code"], my_rent and my_rent["status"], "| net:", net_summary())
assert my_rent
CODE_R = my_rent["rental_code"]

# 3) STAFF: setujui
assert login("staff", "staff")
arm_net()
assert nav_click("Transaksi")
AL = json.dumps("Setujui pengajuan " + CODE_R)
log("setujui:", click_btn("x.getAttribute('aria-label')==="+AL, 2.5))
log("konfirmasi:", click_btn("/^Ya, Setujui$|^Setujui$|^Konfirmasi$/.test(x.textContent.trim())", 2.5))
st = my_rent["status"]
for _ in range(4):
    st = next(x for x in get_coll("rentals") if x["id"] == my_rent["id"])["status"]
    if st == "APPROVED":
        break
    time.sleep(1.5)
HASIL["3_setujui"] = st == "APPROVED"
log("status rental ->", st, "| net:", net_summary())
assert st == "APPROVED"

# 4) STAFF: terbitkan kontrak
assert nav_click("Kontrak")
log("buka terbitkan:", click_btn("x.getAttribute('aria-label')==='Terbitkan kontrak baru'", 1.2))
log("pilih rental:", ev("(function(){var s=[...document.querySelectorAll('select')].find(x=>[...x.options].some(o=>o.textContent.includes(%s)));if(!s)return 'SEL-NF';var o=[...s.options].find(o=>o.textContent.includes(%s));Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,o.value);s.dispatchEvent(new Event('change',{bubbles:true}));return 'OK';})()" % (json.dumps(CODE_R), json.dumps(CODE_R))))
log("klik simpan kontrak:", click_btn("x.closest('[role=dialog]')&&/Terbitkan Kontrak/.test(x.textContent)&&!/baru/.test(x.getAttribute('aria-label')||'')", 4))
cons = get_coll("contracts")
con = next((x for x in cons if x.get("rental_id") == my_rent["id"]), None)
HASIL["4_kontrak"] = bool(con)
log("kontrak:", con and con["contract_code"], "| net:", net_summary())
assert con
CODE_C = con["contract_code"]

# 5) CUSTOMER: tanda tangan via kanvas pointer
assert login("user", "user")
arm_net()
assert nav_click("Kontrak")
AL2 = json.dumps("Tanda tangani kontrak " + CODE_C)
log("buka modal tanda tangan:", click_btn("x.getAttribute('aria-label')==="+AL2, 1.2))
log("nama penandatangan:", set_val("Nama Penandatangan", "Budi Santoso"))
drawn = ev("(async function(){var c=document.querySelector('canvas');if(!c)return 'CANVAS-NF';var r=c.getBoundingClientRect();function s(t,x,y){c.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:1,clientX:x,clientY:y,isPrimary:true,button:0}))}var pts=[];for(var i=0;i<14;i++){pts.push([r.x+28+i*Math.max(4,r.width/16), r.y+r.height/2+(i%2?16:-10)]);}s('pointerdown',pts[0][0],pts[0][1]);for(var j=1;j<pts.length;j++){s('pointermove',pts[j][0],pts[j][1]);await new Promise(z=>setTimeout(z,14));}s('pointerup',pts[pts.length-1][0],pts[pts.length-1][1]);return 'DRAWN';})()")
log("goresan:", drawn)
log("bubuhkan:", click_btn("/Bubuhkan Tanda Tangan/.test(x.textContent)", 3))
con2 = next((x for x in get_coll("contracts") if x["id"] == con["id"]), None)
signed = bool(con2 and (con2.get("signature_data_url") or con2.get("is_signed_customer") == 1))
HASIL["5_ttd"] = signed
log("kontrak status:", con2 and con2.get("status"), "signed:", signed, "| net:", net_summary())

# 6) CUSTOMER: unggah bukti bayar
pay = next((p for p in get_coll("payments") if p.get("contract_id") == con["id"] or p.get("rental_id") == my_rent["id"]), None)
log("payment:", pay and pay["payment_code"], pay and pay["status"])
HASIL["6_payment_ada"] = bool(pay)
if pay:
    assert nav_click("Pembayaran")
    ALP = json.dumps("Unggah bukti transfer " + pay["payment_code"])
    log("buka modal bukti:", click_btn("x.getAttribute('aria-label')==="+ALP, 1.2))
    log("nama berkas:", set_val("Nama berkas bukti transfer", "bukti-transfer-e2e-61.png"))
    log("kirim:", click_btn("(x.getAttribute('aria-label')||'')==='Kirim bukti pembayaran untuk diverifikasi'", 3))
    pay2 = next((p for p in get_coll("payments") if p["id"] == pay["id"]), None)
    HASIL["6_bukti"] = bool(pay2 and pay2.get("payment_proof_path"))
    log("payment ->", pay2 and pay2["status"], "proof:", bool(pay2 and pay2.get("payment_proof_path")), "| net:", net_summary())

# 7) STAFF: verifikasi lunas
if pay2 and pay2["status"] == "PENDING_VERIFICATION":
    assert login("staff", "staff")
    arm_net()
    assert nav_click("Verifikasi")
    set_val("Cari kode bayar", pay2["payment_code"])
    time.sleep(1)
    AL3 = json.dumps("Verifikasi lunas " + pay2["payment_code"])
    log("verifikasi:", click_btn("x.getAttribute('aria-label')==="+AL3, 3))
    pay3 = next((p for p in get_coll("payments") if p["id"] == pay["id"]), None)
    HASIL["7_lunas"] = pay3 and pay3["status"]
    log("payment akhir:", pay3 and pay3["status"])

# 8) Persist: reload total lalu cek via UI
ev("sessionStorage.clear(); 1")
ev("location.href=" + json.dumps(BASE + "/#/login") + "; 1")
time.sleep(1.5)
ev("location.reload(); 1")
time.sleep(3.5)
assert login("admin", "admin")
arm_net()
nav_click("Inventaris")
time.sleep(1)
set_val("Cari kode unit", CODE)
time.sleep(1.2)
found = ev("(function(){return document.body.textContent.includes(%s);})()" % json.dumps(NAME))
HASIL["8_persist_reload"] = bool(found)
log("unit masih ada setelah reload total:", found)
png = cmd("Page.captureScreenshot", format="png")
open("STATE/e2e_bukti.png", "wb").write(base64.b64decode(png["data"]))
log("net keseluruhan sesi ini:", net_summary())

# 9) Bersihkan data uji
tok = admin_token()
pay_ids = [x["id"] for x in get_coll("payments") if x.get("contract_id") == con["id"]]
for pid in pay_ids:
    log("del payment:", api("DELETE", "/payments/%d" % pid, tok=tok)[0])
log("del contract:", api("DELETE", "/contracts/%d" % con["id"], tok=tok)[0])
log("del rental:", api("DELETE", "/rentals/%d" % my_rent["id"], tok=tok)[0])
log("del equipment:", api("DELETE", "/equipments/%d" % EQ_ID, tok=tok)[0])
sisa = [e for e in get_coll("equipments") if e["name"] == NAME]
HASIL["9_cleanup"] = len(sisa) == 0
log("sisa E21:", len(sisa), "| total unit:", len(get_coll("equipments")))

log("\n== RINGKASAN ==")
for k, v in HASIL.items():
    log(" ", k, "->", v)
log("== SELESAI ==")
ws.close()
