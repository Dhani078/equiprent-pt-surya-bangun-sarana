"""Security audit RBAC production: setiap role vs setiap endpoint prefix — data leak cross-role."""
import json, urllib.request, urllib.error

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"

def req(m, u, tok=None, p=None):
    h = {'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json'}
    if tok: h['X-SBS-Session'] = tok
    d = json.dumps(p).encode() if p else None
    r = urllib.request.Request(B + u, data=d, headers=h, method=m)
    try:
        resp = urllib.request.urlopen(r, timeout=30)
        raw = resp.read().decode()
        return resp.status, raw
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

toks = {}
for u, p in [('admin', 'admin'), ('staff', 'staff'), ('user', 'user')]:
    st, out = req('POST', '/api/auth/login', p={'username': u, 'password': p})
    toks[u] = json.loads(out).get('token')
    print(f"login {u}: {st} token={bool(toks[u])}")

endpoint = [
    ('GET', '/api/health'),
    ('GET', '/api/users'),
    ('GET', '/api/equipments'),
    ('GET', '/api/rentals'),
    ('GET', '/api/contracts'),
    ('GET', '/api/payments'),
    ('GET', '/api/reports'),
    ('GET', '/api/reports/analytics'),
    ('GET', '/api/maintenance'),
    ('GET', '/api/tracking'),
    ('GET', '/api/gps'),
    ('GET', '/api/audit-log'),
    ('GET', '/api/dashboard/analytics'),
    ('GET', '/api/dashboard/stats'),
]
print()
for m, u in endpoint:
    baris = []
    for role in ['admin', 'staff', 'user']:
        st, _ = req(m, u, tok=toks[role])
        baris.append(f"{role}:{st}")
    # bandingkan apakah customer dapat data sensitif
    print(f"{u:32s} {' '.join(baris)}")
