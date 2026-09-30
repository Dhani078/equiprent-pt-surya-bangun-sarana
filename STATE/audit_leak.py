"""Data-leak audit: apakah CUSTOMER hanya lihat datanya sendiri?"""
import json, urllib.request, urllib.error

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"

def req(m, u, tok=None):
    h = {'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json'}
    if tok: h['X-SBS-Session'] = tok
    r = urllib.request.Request(B + u, headers=h, method=m)
    try:
        resp = urllib.request.urlopen(r, timeout=30)
        return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

st, out = req('POST', '/api/auth/login', None)
toks = {}
for u, p in [('admin', 'admin'), ('staff', 'staff'), ('user', 'user')]:
    st, out = req('POST', '/api/auth/login', None)
    # login butuh body
    h = {'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json'}
    d = json.dumps({'username': u, 'password': p}).encode()
    r = urllib.request.Request(B + '/api/auth/login', data=d, headers=h, method='POST')
    toks[u] = json.loads(urllib.request.urlopen(r, timeout=30).read().decode())['token']

# user 'user' = customer_id 9 (kontrak 38)
st, adm = req('GET', '/api/users', toks['admin'])
adm_users = json.loads(adm)
if isinstance(adm_users, dict): adm_users = adm_users.get('data', adm_users.get('items', []))
uid = next((x['id'] for x in adm_users if x.get('username') == 'user'), None)
print(f"user 'user' id={uid}")

def daftar(u, tok, kunci):
    st, raw = req('GET', u, tok)
    if st != 200: return st, None
    d = json.loads(raw)
    if isinstance(d, dict): d = d.get('data', d.get('items', []))
    ids = {x.get(kunci) for x in d} if isinstance(d, list) else set()
    return st, ids

for ep, kunci in [('/api/rentals', 'customer_id'), ('/api/payments', 'customer_id'), ('/api/contracts', 'customer_id')]:
    st, ids = daftar(ep, toks['user'], kunci)
    print(f"{ep:18s} customer: {sorted(i for i in ids if i is not None) if ids else st}")

# gps: unit milik customer
st, rws = req('GET', '/api/gps', toks['user'])
print("\ngps user raw:", rws[:300])
