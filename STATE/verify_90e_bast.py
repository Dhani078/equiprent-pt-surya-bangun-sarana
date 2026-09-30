"""Siklus 90e: klik salah satu dokumen di arsip, verifikasi BAST terbuka."""
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

# langsung ke arsip dokumen
ev("""
(() => {
  const el = [...document.querySelectorAll('a,button,[role="button"]')].find(x => /Arsip|Dokumen/i.test(x.textContent));
  if (el) el.click();
  return true;
})()
""")
time.sleep(5)
print("url:", ev("location.href"))
txt = ev("document.body.innerText")
print("BAST di arsip:", "BAST" in txt or "Serah Terima" in txt)

# cari kartu/item dokumen yang bisa diklik (selain tombol cetak)
item = ev("""
(() => {
  const els = [...document.querySelectorAll('a,button,[role="button"],div[class*="card" i]')]
    .filter(e => /RNT-SBS|BAST|Surat Jalan/i.test(e.textContent||'') && !/Cetak|PDF/i.test(e.textContent||''));
  if (!els.length) return "none";
  const e = els[0];
  const label = (e.textContent||'').trim().slice(0, 60);
  e.click();
  return "klik: " + label;
})()
""")
print("item dokumen:", item)
time.sleep(4)

txt2 = ev("document.body.innerText")
print("\n--- isi dokumen setelah klik ---")
for kw in ['BERITA ACARA', 'BAST', 'Serah Terima', 'Diserahkan', 'Diterima', 'Pihak Pertama', 'Pihak Kedua', 'Tanda Tangan', 'Material', 'Unit']:
    print(f"  {kw}: {kw in txt2}")

# screenshot untuk verifikasi visual
send("Page.captureScreenshot", {"format": "png"}).get("data", "")
import base64, io as _io
shot = send("Page.captureScreenshot", {"format": "png"}).get("data")
if shot:
    _io.open("C:/Users/Anomali/AppData/Local/Temp/bast_doc.png", "wb").write(base64.b64decode(shot))
    print("\nscreenshot: C:/Users/Anomali/AppData/Local/Temp/bast_doc.png")

print("overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
print("\nkonsol exception:", len(errors))
for e in errors[:6]:
    print("  ", e[:130])
ws.close()
print("\n=== SIKLUS 90e SELESAI ===")
