"""Siklus 90h: verifikasi pesan 'belum memiliki dokumen resmi' muncul saat drill-down baris tanpa dokumen."""
import json, time, urllib.request, websocket

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
tabs = json.load(urllib.request.urlopen(urllib.request.Request(
    "http://127.0.0.1:9222/json/new?about:blank", method="PUT")))
ws = websocket.create_connection(tabs["webSocketDebuggerUrl"], timeout=45, suppress_origin=True)
mid = [0]

def send(m, p=None):
    mid[0] += 1
    ws.send(json.dumps({"id": mid[0], "method": m, "params": p or {}}))
    while True:
        r = json.loads(ws.recv())
        if r.get("id") == mid[0]:
            return r.get("result", {})

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
time.sleep(6)

# klik RNT pertama (RNT-SBS-20260526-020, TANPA dokumen)
ev("""
(() => {
  const b = [...document.querySelectorAll('button')].filter(x => /RNT-/.test(x.textContent) && x.closest('table'))[0];
  if (b) b.click();
  return true;
})()
""")
time.sleep(3)
err = ev("""
(() => {
  const a = document.querySelector('[role="alert"]');
  return a ? a.textContent.trim().slice(0, 200) : "no-alert";
})()
""")
print("pesan alert (baris tanpa dokumen):", err)

# cari baris YANG punya dokumen: RNT-SBS-20260501-001
ev("""
(() => {
  const b = [...document.querySelectorAll('button')].filter(x => /RNT-/.test(x.textContent) && x.closest('table'))
    .find(x => /RNT-SBS-20260501-001/.test(x.textContent));
  if (!b) return "no-row";
  b.click();
  return "clicked-001";
})()
""")
time.sleep(4)
modal = ev("""
(() => {
  const m = document.querySelector('[role="dialog"]');
  if (!m) return "NO_MODAL";
  const t = (m.innerText || '');
  return { hasBast: /BAST|Berita Acara/i.test(t), hasRnt: /RNT-SBS-20260501-001/.test(t), len: t.length, head: t.slice(0,180) };
})()
""")
print("\nmodal BAST untuk RNT-SBS-20260501-001:", json.dumps(modal, ensure_ascii=False)[:400] if isinstance(modal, dict) else modal)
ws.close()
print("\n=== SIKLUS 90h SELESAI ===")
