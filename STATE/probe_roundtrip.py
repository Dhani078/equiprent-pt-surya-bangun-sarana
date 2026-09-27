# -*- coding: utf-8 -*-
"""Round-trip TiDB: create -> GET#1 -> PUT -> GET#2 -> (opsional) delete."""
import json, sys, urllib.request, urllib.error
BASE = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].startswith('http') else "http://127.0.0.1:8788"

def call(method, path, body=None, tok=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header('Content-Type', 'application/json')
    req.add_header('User-Agent', 'Mozilla/5.0 (audit)')
    if tok: req.add_header('X-SBS-Session', tok)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data, timeout=60) as r:
            return r.status, json.loads(r.read().decode() or 'null')
    except urllib.error.HTTPError as e:
        return e.code, e.read()[:250].decode('utf8', 'ignore')

st, j = call('POST', '/api/auth/login', {'username': 'admin', 'password': 'admin'})
tok = j['token']; print('login', st)
st, lst = call('GET', '/api/equipments', tok=tok)
n0 = len(lst); print('count awal', n0)
payload = {'name': 'PROBE AKAR', 'equipment_code': 'PROBE-99', 'type': 'Vibro Roller',
           'hour_meter': 100, 'rental_price_per_day': 100000, 'status': 'AVAILABLE',
           'description': 'probe audit', 'model': 'P-1', 'brand': 'Probe',
           'year': 2024, 'location': 'Banjarmasin'}
st, made = call('POST', '/api/equipments', payload, tok=tok)
print('create', st, made if not isinstance(made, dict) else ('id=' + str(made.get('id'))))
if not isinstance(made, dict): sys.exit(1)
pid = (made.get('item') or made).get('id')
st, lst2 = call('GET', '/api/equipments', tok=tok)
print('GET#1 terlihat?', any(e['id'] == pid for e in lst2), 'total', len(lst2))
st, patched = call('PUT', '/api/equipments/%d' % pid, {'name': 'PROBE AKAR EDIT'}, tok=tok)
print('patch', st, (patched.get('item') or patched).get('name') if isinstance(patched, dict) else patched)
st, lst3 = call('GET', '/api/equipments', tok=tok)
row = next((e for e in lst3 if e['id'] == pid), None)
print('GET#2 nama:', row and row['name'])
if '--cleanup' in sys.argv:
    st, _ = call('DELETE', '/api/equipments/%d' % pid, tok=tok); print('delete', st)
    st, lst4 = call('GET', '/api/equipments', tok=tok); print('total akhir', len(lst4))
