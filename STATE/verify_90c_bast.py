"""Siklus 90c: setelah klik RNT, verifikasi dokumen BAST tampil."""
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
time.sleep(5)

# login
ev("""
(() => {
  const p = document.querySelector('input[type="password"]');
  if (!p) return false;
  const u = document.querySelector('input:not([type])') || document.querySelector('input[type="text"]');
  const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', {bubbles: true})); };
  if (u) set(u, 'admin');
  set(p, 'admin');
  const b = [...document.querySelectorAll('button')].find(x => x.type === 'submit' || /Masuk|Login/i.test(x.textContent));
  if (b) b.click();
  return true;
})()
""")
time.sleep(5)
print("token:", str(ev("window.sessionStorage.getItem('sbs_session_token')"))[:20])

# ke laporan
ev("""
(() => {
  const el = [...document.querySelectorAll('a,button,[role="button"]')].find(x => /Arsip Laporan|Laporan/i.test(x.textContent));
  if (el) el.click();
  return true;
})()
""")
time.sleep(5)
print("baris:", ev("document.querySelectorAll('.table-analytics tbody tr').length"))

# klik RNT pertama
ev("""
(() => {
  const b = [...document.querySelectorAll('.table-analytics button')].find(x => /RNT-/.test(x.textContent));
  if (b) b.click();
  return true;
})()
""")
time.sleep(4)

# apa yang muncul?
txt = ev("document.body.innerText")
print("\n--- teks mengandung BAST/dokumen ---")
for kw in ['BAST', 'Berita Acara', 'RNT-SBS', 'Kontrak', 'Cetak', 'Dokumen']:
    print(f"  {kw}: {kw in txt}")

# cari modal/dialog
modal = ev("""
(() => {
  const m = document.querySelector('[role="dialog"], .modal, [class*="modal" i]');
  if (!m) return "no-modal";
  return "modal: " + (m.innerText || '').slice(0, 220);
})()
""")
print("\nmodal:", modal)

# panel dokumen?
doc = ev("""
(() => {
  const els = [...document.querySelectorAll('*')].filter(e => /BAST|Berita Acara Serah Terima/i.test(e.textContent || '') && e.children.length < 30);
  return els.slice(0, 3).map(e => e.tagName + ':' + (e.textContent || '').slice(0, 80));
})()
""")
print("elemen BAST:", doc)

print("\nkonsol exception:", len(errors))
for e in errors[:6]:
    print("  ", e[:130])
ws.close()
print("\n=== SIKLUS 90c SELESAI ===")
