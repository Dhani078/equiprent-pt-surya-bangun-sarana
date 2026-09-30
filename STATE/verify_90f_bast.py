"""Siklus 90f: drill-down RNT -> modal DocumentPreview BAST terbuka."""
import json, time, urllib.request, websocket, base64, io as _io

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

# login admin
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
print("token:", bool(ev("window.sessionStorage.getItem('sbs_session_token')")))

# ke laporan
ev("""
(() => {
  const el = [...document.querySelectorAll('a,button,[role="button"]')].find(x => /Arsip Laporan|Laporan/i.test(x.textContent));
  if (el) el.click();
  return true;
})()
""")
time.sleep(5)
print("baris laporan:", ev("document.querySelectorAll('.table-analytics tbody tr').length"))

# klik RNT pertama
ev("""
(() => {
  const b = [...document.querySelectorAll('.table-analytics button')].find(x => /RNT-/.test(x.textContent));
  if (b) b.click();
  return true;
})()
""")
time.sleep(4)

# modal DocumentPreview?
modal = ev("""
(() => {
  const m = document.querySelector('[role="dialog"]');
  if (!m) return "NO_MODAL";
  const t = (m.innerText || '');
  return {
    text: t.slice(0, 500),
    hasBast: /BAST|Berita Acara/i.test(t),
    hasRnt: /RNT-SBS/.test(t),
    hasTtd: /Tanda Tangan|Pihak/i.test(t),
  };
})()
""")
print("\nmodal:", json.dumps(modal, ensure_ascii=False)[:700] if isinstance(modal, dict) else modal)

if isinstance(modal, dict):
    print("\n--- keyword isi modal ---")
    t = modal.get("text", "")
    for kw in ["BAST", "Berita Acara", "RNT-SBS", "Pihak", "Tanda Tangan", "Tanggal", "Unit"]:
        print(f"  {kw}: {kw in t}")

shot = send("Page.captureScreenshot", {"format": "png"}).get("data")
if shot:
    _io.open("C:/Users/Anomali/AppData/Local/Temp/bast_modal.png", "wb").write(base64.b64decode(shot))
    print("\nscreenshot: C:/Users/Anomali/AppData/Local/Temp/bast_modal.png")

print("overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
print("\nkonsol exception:", len(errors))
for e in errors[:6]:
    print("  ", e[:130])
ws.close()
print("\n=== SIKLUS 90f SELESAI ===")
