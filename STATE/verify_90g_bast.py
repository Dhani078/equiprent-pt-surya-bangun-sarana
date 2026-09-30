"""Siklus 90g: cek kenapa drill-down tak buka modal — pesan error atau kandidat kosong."""
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

# cek tombol RNT yang benar (di dalam tabel, punya aria-label BAST)
r = ev("""
(() => {
  const btns = [...document.querySelectorAll('button')].filter(b => /RNT-/.test(b.textContent) && b.closest('table'));
  return { total: btns.length, pertama: btns[0] ? btns[0].textContent.trim() : null, aria: btns[0] ? btns[0].getAttribute('aria-label') : null };
})()
""")
print("tombol RNT di tabel:", json.dumps(r))

# klik dan tangkap semua alert/pesan
ev("""
(() => {
  const b = [...document.querySelectorAll('button')].filter(x => /RNT-/.test(x.textContent) && x.closest('table'))[0];
  if (b) b.click();
  return true;
})()
""")
time.sleep(4)

txt = ev("document.body.innerText")
# cari pesan error drill-down
pesan = ev("""
(() => {
  const el = [...document.querySelectorAll('*')].find(e => /belum memiliki dokumen resmi|tidak ditemukan|gagal|Error/i.test(e.textContent||'') && e.children.length < 5);
  return el ? (el.tagName + ': ' + el.textContent.trim().slice(0, 200)) : 'no-error-msg';
})()
""")
print("\npesan setelah klik:", pesan)

# apakah ada elemen dengan role dialog atau class modal apapun
print("dialog/modal:", ev("document.querySelectorAll('[role=dialog],.modal,[class*=modal i]').length"))
# apakah previewDocument ter-set? cek via state reaktif: cari heading "Dokumen Resmi"
print("heading Dokumen Resmi:", ev("[...document.querySelectorAll('h2,h3,h4')].some(h => /Dokumen Resmi/i.test(h.textContent))"))

ws.close()
print("\n=== SIKLUS 90g SELESAI ===")
