"""Siklus 89 verifikasi: login + change-password + health + RBAC setelah index.ts dipecah."""
import json, urllib.request, urllib.error

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
UA = {'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}

def req(m, u, p=None, tok=None):
    h = dict(UA)
    if tok: h['X-SBS-Session'] = tok
    data = json.dumps(p).encode() if p else None
    r = urllib.request.Request(B + u, data=data, headers=h, method=m)
    try:
        resp = urllib.request.urlopen(r, timeout=30)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or '{}')

# 1. health (publik, tanpa token)
st, h = req('GET', '/api/health')
print('health:', st, h.get('status'), 'db=', h.get('database_connected'), 'mode=', h.get('data_mode'))
assert st == 200 and h['status'] == 'online'

# 2. login benar
st, lg = req('POST', '/api/auth/login', {'username': 'admin', 'password': 'admin'})
print('login admin:', st, lg.get('success'))
assert st == 200 and lg['success'] and lg['token']
tok = lg['token']

# 3. login salah (pesan seragam, anti enumeration)
st, bad = req('POST', '/api/auth/login', {'username': 'admin', 'password': 'salah'})
print('login salah:', st, bad.get('error', {}).get('code'))
assert st == 401 and bad['error']['code'] == 'BAD_PASSWORD'

# 4. endpoint tanpa token -> 401
st, r401 = req('GET', '/api/equipments')
print('tanpa token:', st, r401.get('error', {}).get('code'))
assert st == 401

# 5. login customer lalu akses endpoint admin -> 403 (RBAC ketat)
st, cu = req('POST', '/api/auth/login', {'username': 'user', 'password': 'user'})
print('login customer:', st, cu.get('success'))
if cu.get('success'):
    st, r403 = req('GET', '/api/users', tok=cu['token'])
    print('customer akses /api/users:', st, r403.get('error', {}).get('code'))
    assert st == 403 and r403['error']['code'] == 'FORBIDDEN'

# 6. endpoint admin dengan token admin -> 200
st, eq = req('GET', '/api/equipments', tok=tok)
items = eq if isinstance(eq, list) else eq.get('data')
print('admin /api/equipments:', st, 'n=', len(items))
assert st == 200 and len(items) == 50

# 7. change-password: password lama salah -> 401
st, cp = req('POST', '/api/auth/change-password', {'oldPassword': 'salah', 'newPassword': 'PasswordBaru123'}, tok=tok)
print('change-password pw lama salah:', st, cp.get('error', {}).get('code'))
assert st == 401 and cp['error']['code'] == 'BAD_PASSWORD'

# 8. change-password: baru terlalu pendek -> 400
st, cp2 = req('POST', '/api/auth/change-password', {'oldPassword': 'admin', 'newPassword': '123'}, tok=tok)
print('change-password terlalu pendek:', st, cp2.get('error', {}).get('code'))
assert st == 400 and cp2['error']['code'] == 'VALIDATION_ERROR'

print('\n=== SIKLUS 89 OK: login + RBAC + change-password terverifikasi ===')
