# -*- coding: utf-8 -*-
"""Pasang jembatan browser->API (token + baca tulis stateStore via Worker)."""
import io

def rw(p):
    s = io.open(p, encoding='utf-8', newline='').read()
    return s, ('\r\n' if '\r\n' in s[:2000] else '\n')

def put(p, fn):
    s, nl = rw(p)
    ns = fn(s, nl)
    assert ns is not None and ns != s, 'no change ' + p
    io.open(p, 'w', encoding='utf-8', newline='').write(ns)
    print('patched', p)

def A(nl, x):
    return x.replace('\n', nl)

# ---------------------------------------------------------------- authClient reuse in AuditLogPanel
def f_audit(s, nl):
    old = A(nl, """const SESSION_KEY = 'sbs_session_token';""")
    if old in s:
        s = s.replace(old, A(nl, """import { bacaTokenSesi } from '../lib/authClient';"""), 1)
        s = s.replace(A(nl, """    return sessionStorage.getItem(SESSION_KEY);"""),
                      A(nl, """    return bacaTokenSesi();"""), 1)
    return s

# ---------------------------------------------------------------- dashboardClient + reportsClient: header sesi
def f_dash(s, nl):
    a = A(nl, "  const res = await fetch('/api/dashboard/stats', {")
    assert a in s, 'dash fetch'
    s = s.replace(a, A(nl, "  const res = await fetch('/api/dashboard/stats', {") +
                  A(nl, "    headers: headerSesi(),"), 1)
    imp = "import "
    i = s.index(imp)
    s = s[:i] + A(nl, "import { headerSesi } from './authClient';") + nl + s[i:]
    s = s.replace(A(nl, "    headers: { Accept: 'application/json' },\n"), '', 1) if \
        A(nl, "    headers: { Accept: 'application/json' },\n") in s else s
    return s

def f_rep(s, nl):
    a = A(nl, "  const res = await fetch(`/api/reports/analytics?${params.toString()}`, {")
    assert a in s, 'rep fetch'
    s = s.replace(a, a + nl + A(nl, "    headers: headerSesi(),"), 1)
    i = s.index("import ")
    s = s[:i] + A(nl, "import { headerSesi } from './authClient';") + nl + s[i:]
    s = s.replace(A(nl, "    headers: { Accept: 'application/json' },\n"), '', 1) if \
        A(nl, "    headers: { Accept: 'application/json' },\n") in s else s
    return s

# ---------------------------------------------------------------- Login: simpan token
def f_login(s, nl):
    a = A(nl, """      onLoginSuccess(user);""")
    assert s.count(a) == 1, 'login success'
    b = A(nl, """      // Token sesi Edge API disimpan SEBELUM halaman berikutnya
      // memanggil /api/* — tanpa ini dashboard & laporan 401 senyap lalu
      // diam-diam memakai seed demo (temuan audit production 2026-09-27).
      const sesi = await loginApi(username, password);
      if (sesi) simpanTokenSesi(sesi);

      onLoginSuccess(user);""")
    s = s.replace(a, b, 1)
    i = s.index("import { db }")
    s = s[:i] + A(nl, "import { simpanTokenSesi } from '../lib/authClient';") + nl + s[i:]
    s = s.replace(A(nl, "import { db } from '../lib/db';"),
                  A(nl, "import { db, loginApi } from '../lib/db';"), 1)
    return s

# ---------------------------------------------------------------- App: logout hapus token
def f_app(s, nl):
    a = A(nl, """  const handleLogout = () => {""")
    assert a in s, 'logout'
    s = s.replace(a, a + nl + A(nl, "    hapusTokenSesi();"), 1)
    i = s.index("import ")
    s = s[:i] + A(nl, "import { hapusTokenSesi } from './lib/authClient';") + nl + s[i:]
    return s

put('src/components/AuditLogPanel.tsx', f_audit)
put('src/lib/dashboardClient.ts', f_dash)
put('src/lib/reportsClient.ts', f_rep)
put('src/pages/Login.tsx', f_login)
put('src/App.tsx', f_app)
