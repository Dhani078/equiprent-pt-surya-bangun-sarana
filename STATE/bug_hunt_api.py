"""Bug hunt: validasi input ekstrem di endpoint API (XSS, overflow, negatif, tanggal invalid)."""
import json, urllib.request, urllib.error

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"

def req(m, u, p=None, tok=None, ct=True):
    h = {'User-Agent': 'Mozilla/5.0'}
    if ct: h['Content-Type'] = 'application/json'
    if tok: h['X-SBS-Session'] = tok
    d = json.dumps(p).encode() if p is not None else None
    r = urllib.request.Request(B + u, data=d, headers=h, method=m)
    try:
        resp = urllib.request.urlopen(r, timeout=30)
        raw = resp.read().decode()
        try: return resp.status, json.loads(raw or '{}')
        except Exception: return resp.status, {'_raw': raw[:200]}
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:220]
        try: body = json.loads(body)
        except Exception: pass
        return e.code, body

# login admin
st, lg = req('POST', '/api/auth/login', {'username': 'admin', 'password': 'admin'})
tok = lg['token']
print("login:", st, "token ok:", bool(tok))

kasus = [
    ("POST", "/api/auth/login", {"username": "", "password": ""}, "login kosong"),
    ("POST", "/api/auth/login", {"username": "admin"}, "login tanpa password"),
    ("POST", "/api/auth/login", {"username": "admin", "password": "x" * 5000}, "password 5000 char"),
    ("POST", "/api/auth/login", {"username": "admin' OR 1=1--", "password": "x"}, "SQLi username"),
    ("POST", "/api/auth/login", {"username": "admin", "password": "' OR 1=1--"}, "SQLi password"),
    ("GET", "/api/equipments/-1", None, "equipment id negatif"),
    ("GET", "/api/equipments/abc", None, "equipment id bukan angka"),
    ("GET", "/api/equipments/99999", None, "equipment id tak ada"),
    ("PUT", "/api/equipments/1", {"hour_meter": -100}, "HM negatif"),
    ("PUT", "/api/equipments/1", {"rental_price_per_day": -5}, "harga negatif"),
    ("PUT", "/api/equipments/1", {"hour_meter": "abc"}, "HM bukan angka"),
    ("PUT", "/api/equipments/1", {"type": "<script>alert(1)</script>"}, "XSS type"),
    ("PUT", "/api/equipments/1", {"name": "A" * 6000}, "nama 6000 char"),
    ("POST", "/api/rentals", {"equipment_id": 99999}, "rental unit tak ada"),
    ("POST", "/api/rentals", {"equipment_id": "abc"}, "rental id bukan angka"),
    ("GET", "/api/reports/analytics?limit=99999", None, "limit raksasa"),
    ("GET", "/api/reports/analytics?from=abc&to=xyz", None, "tanggal invalid"),
    ("GET", "/api/users/me", None, "endpoint ada"),
]

for m, u, p, nama in kasus:
    st, out = req(m, u, p, tok=tok)
    ringkas = json.dumps(out, ensure_ascii=False)[:150]
    print(f"{nama:28s} -> {st} {ringkas}")
