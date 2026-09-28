"""Bersihkan sisa data uji (id > 50) + buktikan baseline 50/50/50/50.
Dipakai siklus 72 setelah isolate Cloudflare sempat menjawab 404 basi."""
import json, time, urllib.request, urllib.error

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
        return {"HTTP": e.code, "raw": e.read().decode()[:120]}


tok = call("/api/auth/login", {"username": "admin", "password": "admin"}, method="POST")["token"]


def lof(p):
    d = call(p, tok=tok)
    return d["data"] if isinstance(d, dict) and "data" in d else d


for _ in range(6):
    extra_pay = [p for p in lof("/api/payments") if p["id"] > 50]
    extra_con = [c for c in lof("/api/contracts") if c["id"] > 50]
    extra_ren = [r for r in lof("/api/rentals") if r["id"] > 50]
    if not (extra_pay or extra_con or extra_ren):
        break
    for p in extra_pay:
        print("del pay", p["id"], call("/api/payments/%d" % p["id"], tok=tok, method="DELETE"))
    for c in extra_con:
        print("del con", c["id"], call("/api/contracts/%d" % c["id"], tok=tok, method="DELETE"))
    for r in extra_ren:
        print("del ren", r["id"], call("/api/rentals/%d" % r["id"], tok=tok, method="DELETE"))
    time.sleep(3)

n = {k: len(lof("/api/" + k)) for k in ("equipments", "rentals", "contracts", "payments")}
print("BASELINE:", n)
assert (n["equipments"], n["rentals"], n["contracts"], n["payments"]) == (50, 50, 50, 50), n
from collections import Counter
print("status payment:", Counter(p["status"] for p in lof("/api/payments")))
print("BERSIH")