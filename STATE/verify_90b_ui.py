"""Siklus 90b: login form CDP + navigasi panel setelah login."""
import json, time, urllib.request, websocket

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
tabs = json.load(urllib.request.urlopen(urllib.request.Request(
    "http://127.0.0.1:9222/json/new?about:blank", method="PUT")))
ws = websocket.create_connection(tabs["webSocketDebuggerUrl"], timeout=45, suppress_origin=True)
mid = [0]
errors = []

def send(m, p=None):
    mid[0] += 1
    ws.send(json.dumps({"id": mid[0], "method": m, "params": p or {}}))
    while True:
        r = json.loads(ws.recv())
        if r.get("id") == mid[0]:
            return r.get("result", {})
        if r.get("method") == "Runtime.exceptionThrown":
            errors.append(r["params"]["exceptionDetails"].get("text", ""))

def ev(e):
    return send("Runtime.evaluate", {"expression": e, "returnByValue": True, "awaitPromise": True}).get("result", {}).get("value")

send("Runtime.enable")
send("Page.enable")
send("Network.setCacheDisabled", {"cacheDisabled": True})
send("Page.navigate", {"url": B})
time.sleep(6)

print("url:", ev("location.href"))
print("ada form login:", ev("!!document.querySelector('input[type=password]')"))

r = ev("""
(() => {
  const p = document.querySelector('input[type="password"]');
  if (!p) return "no-pw-input";
  const u = document.querySelector('input:not([type])') || document.querySelector('input[type="text"]');
  const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); };
  if (u) set(u, 'admin');
  set(p, 'admin');
  const b = [...document.querySelectorAll('button')].find(x => x.type === 'submit' || /Masuk|Login/i.test(x.textContent));
  if (b) { b.click(); return "clicked"; }
  return "no-btn";
})()
""")
print("form login:", r)
time.sleep(5)
print("token:", str(ev("window.sessionStorage.getItem('sbs_session_token')"))[:30])
print("url after:", ev("location.href"))

# navigasi: laporan
ev("""
(() => {
  const el = [...document.querySelectorAll('a,button,[role="button"]')].find(x => /Arsip Laporan|Laporan/i.test(x.textContent));
  if (el) el.click();
  return true;
})()
""")
time.sleep(5)
print("di laporan:", ev("location.href"))
rows = ev("document.querySelectorAll('.table-analytics tbody tr').length")
print("baris laporan:", rows)
bast = ev("[...document.querySelectorAll('.table-analytics button')].filter(b => /RNT-/.test(b.textContent)).length")
print("tombol RNT drill:", bast)

# klik tombol BAST pertama
klik = ev("""
(() => {
  const b = [...document.querySelectorAll('.table-analytics button')].find(x => /RNT-/.test(x.textContent));
  if (!b) return "no-bast-btn";
  const kode = b.textContent.trim();
  b.click();
  return "klik:" + kode;
})()
""")
print("drill-down:", klik)
time.sleep(4)
print("url setelah drill:", ev("location.href"))
print("heading dokumen:", str(ev("(document.querySelector('h1,h2,h3')||{}).textContent || ''"))[:90])

print("\nkonsol exception:", len(errors))
for e in errors[:6]:
    print("  ", e[:130])
ws.close()
print("\n=== SIKLUS 90b SELESAI ===")
