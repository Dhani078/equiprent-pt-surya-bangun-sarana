"""Verifikasi production pasca-pecah server/index.ts (siklus 73).
Memastikan SEMUA endpoint (termasuk yang dipindah ke modul rute) masih hidup."""
import json, urllib.request, urllib.error

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"


def call(path, tok=None, method="GET", data=None):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(data).encode() if data is not None else None,
        method=method,
        headers={"Content-Type": "application/json", "X-SBS-Session": tok or "", "User-Agent": "Mozilla/5.0"},
    )
    try:
        b = urllib.request.urlopen(req).read().decode()
        return {"code": 200, "body": json.loads(b) if b else {}}
    except urllib.error.HTTPError as e:
        return {"code": e.code, "body": e.read().decode()[:120]}


tok = call("/api/auth/login", method="POST", data={"username": "admin", "password": "admin"})["body"]["token"]


def arr(b):
    """Panjang koleksi dari bentuk respons yang beragam (list, {data:[]},
    atau {data:{rows:[]}} seperti /api/tracking)."""
    if isinstance(b, list):
        return b
    if isinstance(b, dict):
        d = b.get("data")
        if isinstance(d, list):
            return d
        if isinstance(d, dict):
            return d.get("rows", [])
        return b.get("rows", [])
    return []


h = call("/api/health")["body"]
print("health:", h["data_mode"], h["database_connected"], "secret_ephemeral:", h["session_secret_ephemeral"])

checks = [
    ("GET  /api/equipments", "/api/equipments", 50),
    ("GET  /api/rentals", "/api/rentals", 50),
    ("GET  /api/contracts", "/api/contracts", 50),
    ("GET  /api/payments", "/api/payments", 50),
    ("GET  /api/maintenance", "/api/maintenance", None),
    ("GET  /api/gps", "/api/gps", 55),
    ("GET  /api/tracking", "/api/tracking", 40),
    ("GET  /api/audit-log", "/api/audit-log", None),
    ("GET  /api/users", "/api/users", 50),
    ("GET  /api/dashboard/stats", "/api/dashboard/stats", None),
    ("GET  /api/dashboard/analytics", "/api/dashboard/analytics", None),
    ("GET  /api/rentals/bookable", "/api/rentals/bookable", None),
    ("GET  /api/rentals/availability?equipmentId=1&from=2026-12-01&to=2026-12-05", "/api/rentals/availability?equipmentId=1&from=2026-12-01&to=2026-12-05", None),
    ("GET  /api/reports", "/api/reports", None),
    ("GET  /api/reports/analytics", "/api/reports/analytics", None),
    ("GET  /api/contracts/1/preview", "/api/contracts/1/preview", None),
]
bad = 0
for label, path, expect in checks:
    r = call(path, tok)
    n = len(arr(r["body"]))
    ok = r["code"] == 200 and (expect is None or n == expect)
    if not ok:
        bad += 1
    print("%s %-46s code=%s n=%s%s" % ("OK  " if ok else "FAIL", label.split(" ", 1)[1][:46], r["code"], n,
                                       (" expect=%d" % expect) if expect is not None else ""))

print("\nRBAC: customer tidak boleh audit-log / users / dashboard")
cu = call("/api/auth/login", method="POST", data={"username": "user", "password": "user"})
if cu["code"] == 200:
    ct = cu["body"]["token"]
    for p in ["/api/audit-log", "/api/users", "/api/dashboard/analytics", "/api/dashboard/stats"]:
        r = call(p, ct)
        print("  %-28s -> %s" % (p, r["code"]))
else:
    print("  login customer gagal:", cu["code"])

print("\nHASIL:", "BERSIH" if bad == 0 else "%d endpoint GAGAL" % bad)