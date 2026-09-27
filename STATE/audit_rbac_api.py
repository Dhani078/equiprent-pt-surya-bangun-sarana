# -*- coding: utf-8 -*-
"""Matriks RBAC production: tiap role menyerang endpoint role lain."""
import json, urllib.request, urllib.error

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
UA = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

def req(path, body=None, tok=None, method=None):
    h = dict(UA)
    if tok: h["X-SBS-Session"] = tok
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, headers=h,
                               method=method or ("POST" if body is not None else "GET"))
    try:
        resp = urllib.request.urlopen(r, timeout=30)
        return resp.status, resp.read().decode()[:500]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500]

def login(u, p):
    s, b = req("/api/auth/login", {"username": u, "password": p})
    try: return json.loads(b).get("token")
    except Exception: return None

toks = {}
for role, (u, p) in {"ADMIN": ("admin", "admin"), "STAFF": ("staff", "staff"),
                     "CUSTOMER": ("user", "user")}.items():
    toks[role] = login(u, p)
    print("login", role, "->", "OK" if toks[role] else "GAGAL")

ENDPOINTS = [
    ("GET", "/api/users", "ADMIN"),
    ("GET", "/api/equipments", None),
    ("GET", "/api/rentals", "STAFF"),
    ("GET", "/api/contracts", None),
    ("GET", "/api/payments", None),
    ("GET", "/api/maintenance", "STAFF"),
    ("GET", "/api/tracking", "STAFF"),
    ("GET", "/api/audit-log", "ADMIN"),
    ("GET", "/api/reports", "STAFF"),
    ("GET", "/api/dashboard/stats", "ADMIN"),
]
results = []
for meth, ep, minrole in ENDPOINTS:
    for role in ("ADMIN", "STAFF", "CUSTOMER"):
        s, b = req(ep, None, toks[role])
        allowed = {"ADMIN": 0, "STAFF": 1, "CUSTOMER": 2}[minrole or "CUSTOMER"] \
            if minrole else 0
        expect_ok = {"ADMIN": 0, "STAFF": 1, "CUSTOMER": 2}[role] <= \
            {"ADMIN": 0, "STAFF": 1, "CUSTOMER": 2}[minrole] if minrole else True
        verdict = "OK" if (s == 200) == expect_ok else "PEMBUKARAN!"
        results.append((ep, role, s, verdict))
        print("%-24s %-8s -> %3d %s" % (ep, role, s, verdict))

# tulis data palsu: customer tidak boleh bisa create/mutate
eq = {"equipment_code": "HACK-01", "name": "X", "type": "Excavator", "brand": "X",
      "model": "X", "rental_price_per_day": 1, "status": "AVAILABLE", "hour_meter": 0}
for role in ("CUSTOMER", "STAFF"):
    s, b = req("/api/equipments", eq, toks[role])
    s2, b2 = req("/api/users", {"username": "x"}, toks[role])
    print("CREATE as", role, "-> equipments:%d users:%d (harus 403)" % (s, s2))
# tanpa token
s, _ = req("/api/users", None, None)
print("tanpa token /api/users ->", s, "(harus 401)")

json.dump([{"ep": e, "role": r, "status": s, "verdict": v} for e, r, s, v in results],
          open("STATE/audit_rbac.json", "w", encoding="utf-8"), indent=1)
print("SELESAI rbac")
