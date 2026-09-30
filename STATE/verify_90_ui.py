"""Siklus 90: audit UI production via CDP — semua role, overflow, konsol, drill-down BAST."""
import json, time, urllib.request, websocket

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
tabs = json.load(urllib.request.urlopen(urllib.request.Request(
    "http://127.0.0.1:9222/json/new?about:blank", method="PUT")))
ws = websocket.create_connection(tabs["webSocketDebuggerUrl"], timeout=45, suppress_origin=True)
mid = [0]
errors = []

def send(method, params=None):
    mid[0] += 1
    ws.send(json.dumps({"id": mid[0], "method": method, "params": params or {}}))
    while True:
        m = json.loads(ws.recv())
        if m.get("id") == mid[0]:
            return m.get("result", {})
        if m.get("method") == "Runtime.exceptionThrown":
            errors.append(m["params"]["exceptionDetails"].get("text", ""))

def ev(expr):
    r = send("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
    return r.get("result", {}).get("value")

send("Runtime.enable")
send("Page.enable")
send("Network.enable")
send("Network.setCacheDisabled", {"cacheDisabled": True})
send("Page.navigate", {"url": B})
time.sleep(6)

# --- Login sbg admin ---
ev("""
(async () => {
  const tok = window.sessionStorage.getItem('sbs_session_token');
  if (tok) { const r = await fetch('/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'admin', password:'admin'})}); return r.ok; }
  return true;
})()
""")

# cek apakah sudah login (ada token) atau perlu form
token = ev("window.sessionStorage.getItem('sbs_session_token')")
if not token:
    ev("""
    (() => {
      const u = document.querySelector('input[name="username"], input[type="text"]');
      const p = document.querySelector('input[type="password"]');
      if (u) { u.value='admin'; u.dispatchEvent(new Event('input',{bubbles:true})); }
      if (p) { p.value='admin'; p.dispatchEvent(new Event('input',{bubbles:true})); }
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Masuk') || x.type==='submit');
      if (b) b.click();
      return true;
    })()
    """)
    time.sleep(4)

token = ev("window.sessionStorage.getItem('sbs_session_token'")
print('token:', (token or '')[:25], '...' if token else 'NONE')
title = ev("document.title")
print('title:', title)

# --- halaman utama: overflow ---
of = ev("document.documentElement.scrollWidth - document.documentElement.clientWidth")
print('overflow horizontal (dashboard):', of)

# --- navigasi ke laporan ---
ev("""
(() => {
  const el = [...document.querySelectorAll('a,button,[role="button"]')].find(x => /Laporan|Arsip Laporan/i.test(x.textContent));
  if (el) el.click();
  return true;
})()
""")
time.sleep(5)

of2 = ev("document.documentElement.scrollWidth - document.documentElement.clientWidth")
print('overflow horizontal (laporan):', of2)
rows = ev("document.querySelectorAll('.table-analytics tbody tr').length")
print('baris tabel laporan:', rows)
# drill-down: cara tombol BAST
bast = ev("document.querySelectorAll('.table-analytics button[title*=\"BAST\"]').length")
print('tombol drill-down BAST:', bast)

# --- navigasi ke equipment ---
ev("""
(() => {
  const el = [...document.querySelectorAll('a,button,[role="button"]')].find(x => /Manajemen Unit|Unit Alat/i.test(x.textContent));
  if (el) el.click();
  return true;
})()
""")
time.sleep(5)
of3 = ev("document.documentElement.scrollWidth - document.documentElement.clientWidth")
print('overflow horizontal (unit):', of3)
imgs = ev("document.querySelectorAll('img').length")
broke = ev("[...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length")
print('total img:', imgs, '| broken:', broke)

# --- konsol error ---
print('\nkonsol exception:', len(errors))
for e in errors[:6]: print('  ', e[:130])

ws.close()
print('\n=== SIKLUS 90 AUDIT SELESAI ===')
