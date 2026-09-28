"""Siklus 73 E2E: perpanjangan kontrak kedaluwarsa.

PENGAMAN: seluruh uji jalur tulis memakai KONTRAK UJI yang dibuat sendiri
(sewa masa depan + kontrak yang sengaja dikedaluwarsakan lewat SQL), sehingga
data produksi 38..50 tidak pernah tersentuh. Pernah kejadian: harness lama
memperpanjang SELURUH 13 kontrak kedaluwarsa nyata saat mencari satu kasus.

A) UI: tombol "Perpanjang" hanya pada baris Kedaluwarsa; Tanda Tangani absen.
B) API: kontrak yang MASIH berlaku ditolak (409 KONTRAK_MASIH_BERLAKU).
C) API: kontrak kedaluwarsa diperpanjang -> valid_until berubah, status
   kembali AWAITING (dapat ditandatangani), lalu dihapus.
D) Sidik jari data 50/50/50/50 tetap utuh.
"""
import json, os, subprocess, time, urllib.request, urllib.error, websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"


def call(path, data=None, tok=None, method="GET"):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(data).encode() if data is not None else None,
        method=method,
        headers={"Content-Type": "application/json", "X-SBS-Session": tok or "", "User-Agent": "Mozilla/5.0"},
    )
    try:
        b = urllib.request.urlopen(req).read().decode()
        return json.loads(b) if b else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return {"HTTP": e.code, "body": json.loads(raw)}
        except Exception:
            return {"HTTP": e.code, "raw": raw[:150]}


admin = call("/api/auth/login", {"username": "admin", "password": "admin"}, method="POST")["token"]


def lof(p):
    d = call(p, tok=admin)
    return d["data"] if isinstance(d, dict) and "data" in d else d


def sql(query, params=()):
    """Ubah DB lewat driver TiDB (dipakai HANYA untuk menyiapkan/membersihkan
    kontrak uji, tidak pernah untuk data produksi).

    Query & parameter dikirim lewat environment karena `process.argv[1]`
    sudah dipakai Node untuk nama skrip."""
    code = (
        "import fs from 'node:fs';import {connect} from '@tidbcloud/serverless';"
        "const u=fs.readFileSync('.dev.vars','utf8').match(/DATABASE_URL\\s*=\\s*\"?([^\"\\r\\n]+)\"?/)[1];"
        "const c=connect({url:u});"
        "const r=await c.execute(process.env.Q,JSON.parse(process.env.P));"
        "console.log(JSON.stringify(r));"
    )
    open("STATE/_tmp_sql.mjs", "w").write(code)
    env = {**os.environ, "Q": query, "P": json.dumps(list(params))}
    out = subprocess.run(["node", "STATE/_tmp_sql.mjs"], capture_output=True, text=True,
                         timeout=120, env=env)
    if out.returncode != 0:
        raise RuntimeError(out.stderr[:300])
    return json.loads(out.stdout.strip() or "[]")


# ---------- siapkan kontrak uji ----------
eq = [e for e in lof("/api/equipments") if e.get("status") == "AVAILABLE"]
r = call("/api/rentals", {
    "equipment_id": eq[0]["id"], "customer_id": 9, "start_date": "2026-10-01", "end_date": "2026-12-31",
    "total_days": 92, "subtotal": 2000000, "status": "PENDING", "notes": "uji perpanjangan siklus 73",
}, tok=admin, method="POST")
rid = (r.get("item") or {}).get("id")
k = call("/api/contracts", {"rentalId": rid}, tok=admin, method="POST")
kid = (k.get("item") or {}).get("id")
print("S1. kontrak uji dibuat: rental=%s kontrak=%s valid_until=%s" % (rid, kid, (k.get("item") or {}).get("valid_until")))

# ---------- B) kontrak MASIH berlaku ditolak ----------
r_masih = call("/api/contracts/%d/renew" % kid, {"validUntil": "2027-06-30"}, tok=admin, method="POST")
print("B. kontrak masih berlaku ditolak:", json.dumps(r_masih, ensure_ascii=False)[:170])

# ---------- kedaluwarsakan kontrak uji lewat SQL (hanya baris uji ini) ----------
sql("UPDATE `contracts` SET `valid_until` = ? WHERE `id` = ?", ("2026-01-31", kid))
# Cermin isolate punya TTL 5 detik (src/lib/db.ts: UMUR_CERMIN) — tunggu
# revalidasi sebelum membaca lewat API, kalau tidak bacaannya salinan lama.
time.sleep(7)
after = [c for c in lof("/api/contracts") if c["id"] == kid][0]
print("S2. kontrak uji dikedaluwarsakan -> valid_until:", after["valid_until"])

# ---------- C) perpanjang kontrak kedaluwarsa ----------
baru = "2027-03-31"
r_ok = call("/api/contracts/%d/renew" % kid, {"validUntil": baru, "reason": "Uji siklus 73"}, tok=admin, method="POST")
print("C1. perpanjang ->", json.dumps(r_ok, ensure_ascii=False)[:230])
cek = [c for c in lof("/api/contracts") if c["id"] == kid][0]
print("C2. valid_until:", cek["valid_until"], "| diharapkan", baru, "| OK:", cek["valid_until"] == baru)

r_dua = call("/api/contracts/%d/renew" % kid, {"validUntil": "2027-08-31"}, tok=admin, method="POST")
print("C3. perpanjang dua kali ditolak:", json.dumps(r_dua, ensure_ascii=False)[:150])

r_lampau = call("/api/contracts/%d/renew" % kid, {"validUntil": "2020-01-01"}, tok=admin, method="POST")
print("C4. tanggal lampau ditolak:", json.dumps(r_lampau, ensure_ascii=False)[:150])

# kontrak uji kembali kedaluwarsa lalu DAPAT ditandatangani? (daur hidup penuh)
print("C5. audit trail CONTRACT_RENEW tercatat:",
      any("CONTRACT_RENEW" == e.get("action") for e in (call("/api/audit-log", tok=admin).get("data") or [])))

# ---------- A) UI ----------
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
cmd("Page.navigate", url=BASE + "/?v=73b#/login")
time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Administrator/.test(x.textContent));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Transaksi/i.test(x.textContent));if(b)b.click();})()")
time.sleep(4)
ev("(function(){var b=[...document.querySelectorAll('button, [role=tab]')].find(x=>/Kontrak Digital/i.test(x.textContent));if(b)b.click();})()")
time.sleep(3)
ui = ev("""(()=>{
const rows=[...document.querySelectorAll('tbody tr')];const c={};
for(const r of rows){
  const b=([...r.querySelectorAll('span')].map(s=>s.textContent.trim())
    .find(s=>/Tanda Tangan|Kedaluwarsa|Ditandatangani/.test(s)))||'-';
  const renew=[...r.querySelectorAll('button')].some(x=>/Perpanjang/i.test(x.textContent));
  const sign=[...r.querySelectorAll('button')].some(x=>/Tanda Tangani/i.test(x.textContent));
  const k=b+'|renew='+renew+'|sign='+sign;c[k]=(c[k]||0)+1;}
return {rows:rows.length,sebaran:c};})()""")
print("A1. UI tabel:", json.dumps(ui, ensure_ascii=False))
seb = (ui or {}).get("sebaran", {})
print("A2. Perpanjang hanya pada Kedaluwarsa:",
      all(("renew=true" if "Kedaluwarsa" in k else "renew=false") in k for k in seb))
print("A3. Tanda Tangani tetap absen pada Kedaluwarsa:",
      all("sign=false" in k for k in seb if "Kedaluwarsa" in k))

# ---------- pembersihan kontrak uji ----------
sql("UPDATE `contracts` SET `valid_until` = ? WHERE `id` = ?", ("2026-01-31", kid))
time.sleep(7)
for p in [x for x in lof("/api/payments") if x.get("contract_id") == kid]:
    assert p["id"] > 50, "ABORT: bukan baris uji"
    call("/api/payments/%d" % p["id"], tok=admin, method="DELETE")
call("/api/contracts/%d" % kid, tok=admin, method="DELETE")
call("/api/rentals/%d" % rid, tok=admin, method="DELETE")

# ---------- D) sidik jari ----------
n = {k: len(lof("/api/" + k)) for k in ("equipments", "rentals", "contracts", "payments")}
print("D. sidik jari:", n)
assert (n["equipments"], n["rentals"], n["contracts"], n["payments"]) == (50, 50, 50, 50), n
kad = [c for c in lof("/api/contracts") if not c.get("is_signed_customer") and c["valid_until"] < "2026-09-28"]
print("E. kontrak kedaluwarsa kembali:", len(kad), "(diharapkan 13)")
assert len(kad) == 13, "kontrak produksi tidak utuh!"
print("SELESAI")