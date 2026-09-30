"""Siklus 90d: verifikasi isi dokumen BAST setelah drill-down."""
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

ev("""
(() => {
  const el = [...document.querySelectorAll('a,button,[role="button"]')].find(x => /Arsip Laporan|Laporan/i.test(x.textContent));
  if (el) el.click();
  return true;
})()
""")
time.sleep(5)

ev("""
(() => {
  const b = [...document.querySelectorAll('.table-analytics button')].find(x => /RNT-/.test(x.textContent));
  if (b) b.click();
  return true;
})()
""")
time.sleep(4)

txt = ev("document.body.innerText")
print("panjang teks:", len(txt))
# area dokumen
area = ev("""
(() => {
  const c = [...document.querySelectorAll('*')].find(e => /Berita Acara Serah Terima/i.test(e.textContent||'') && e.querySelector('*') === null);
  return c ? c.tagName + ':' + c.textContent.slice(0,120) : 'not-found';
})()
""")
print("judul BAST:", area)

# struktur dokumen
for kw in ['BERITA ACARA SERAH TERIMA', 'RNT-SBS-', 'Diserahkan oleh', 'Diterima oleh', 'Tanggal', 'Nilai Kontrak', 'Periode Sewa', 'Tanda Tangan']:
    print(f"  {kw}: {kw in txt}")

# tombol cetak
cetak = ev("[...document.querySelectorAll('button')].filter(b => /Cetak|Print|Unduh|Download|PDF/i.test(b.textContent)).map(b => b.textContent.trim().slice(0,30))")
print("tombol aksi:", cetak)

# verifikasi overflow di halaman BAST
print("overflow BAST:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))

print("\nkonsol exception:", len(errors))
for e in errors[:6]:
    print("  ", e[:130])
ws.close()
print("\n=== SIKLUS 90d SELESAI ===")
