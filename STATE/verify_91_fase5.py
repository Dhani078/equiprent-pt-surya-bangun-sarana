"""Siklus 91: verifikasi Fase 5 production — PWA manifest/sw, toggle bahasa EN, dark mode."""
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

# PWA: manifest + sw terdaftar
send("Page.navigate", {"url": B})
time.sleep(5)
mf = ev("""
(async () => {
  const l = [...document.querySelectorAll('link[rel="manifest"]')];
  const m = l.length ? await fetch(l[0].href).then(r => r.json()).catch(() => null) : null;
  const reg = await navigator.serviceWorker.getRegistration('/').catch(() => null);
  return {
    manifestLink: l.length,
    manifestName: m ? m.name : null,
    swActive: !!(reg && reg.active),
    swUrl: reg && reg.active ? reg.active.scriptURL : null,
    standalone: window.matchMedia('(display-mode: standalone)').matches,
  };
})()
""")
print("PWA:", json.dumps(mf, ensure_ascii=False))

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
print("token:", bool(ev("window.sessionStorage.getItem('sbs_session_token')")))

# toggle EN
ev("""
(() => {
  const b = [...document.querySelectorAll('.navbar-lang')][0];
  if (b) b.click();
  return true;
})()
""")
time.sleep(2)
sebelum = ev("document.body.innerText.slice(0, 60)")
en = ev("""
(() => {
  const b = [...document.querySelectorAll('.navbar-lang')][0];
  return b ? b.textContent.trim() : 'no-btn';
})()
""")
print("\ntombol bahasa setelah klik:", en)
print("head body:", repr(sebelum[:80]))

# dark mode toggle
ev("""
(() => {
  const b = [...document.querySelectorAll('button')].find(x => /Gelap|Terang/.test(x.textContent));
  if (b) b.click();
  return true;
})()
""")
time.sleep(2)
dm = ev("document.documentElement.dataset.theme || document.body.className")
print("dark mode aktif:", dm)
print("overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))

shot = send("Page.captureScreenshot", {"format": "png"}).get("data")
if shot:
    _io.open("C:/Users/Anomali/AppData/Local/Temp/fase5.png", "wb").write(base64.b64decode(shot))
    print("screenshot: C:/Users/Anomali/AppData/Local/Temp/fase5.png")

print("\nkonsol exception:", len(errors))
for e in errors[:6]:
    print("  ", e[:130])
ws.close()
print("\n=== SIKLUS 91 SELESAI ===")
