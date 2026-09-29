# -*- coding: utf-8 -*-
"""Audit viewport CDP siklus 89: 375px & 1280px, overflow + target sentuh <44px."""
import json, time, urllib.request, websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
TABS = [("Dashboard", None), ("Inventaris", "Inventaris"), ("Transaksi", "Transaksi"),
        ("Perawatan", "Perawatan"), ("GPS", "Pelacakan"), ("Pengguna", "Pengguna"), ("Audit", "Audit"), ("Laporan", "Laporan")]

def connect():
    tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=10))
    page = next(t for t in tabs if t["type"] == "page")
    return websocket.create_connection(page["webSocketDebuggerUrl"], timeout=120, suppress_origin=True)

class CDP:
    def __init__(self):
        self.ws = connect(); self.id = 0
        for m in ("Page.enable", "Runtime.enable", "Network.enable"): self.send(m)
        self.send("Network.setCacheDisabled", cacheDisabled=True)
    def send(self, m, **p):
        self.id += 1
        self.ws.send(json.dumps({"id": self.id, "method": m, "params": p}))
        while True:
            x = json.loads(self.ws.recv())
            if x.get("id") == self.id: return x.get("result", {})
    def ev(self, expr, awaitp=True):
        r = self.send("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=awaitp)
        if "exceptionDetails" in r: return {"__exc__": str(r["exceptionDetails"])[:200]}
        res = r.get("result", {})
        return res.get("value", res.get("description"))

JS_LOGIN = """
(async () => {
  if (document.querySelector('h2') && !document.querySelector('input[type=password]')) return 'LOGGED';
  const setV = (el, v) => {
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', {bubbles: true}));
    el.dispatchEvent(new Event('change', {bubbles: true}));
  };
  const u = document.querySelector('input[autocomplete="username"]') || document.querySelectorAll('input[type=text]')[0];
  const p = document.querySelector('input[type=password]');
  if (!u || !p) return 'NO INPUTS';
  setV(u, 'admin'); setV(p, 'admin');
  const btn = [...document.querySelectorAll('button')].find(b => /masuk|login/i.test(b.textContent));
  btn.click();
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (!document.querySelector('input[type=password]') && document.querySelector('h2')) return 'LOGGED';
  }
  return 'TIMEOUT';
})()
"""

JS_CHECK = """
(() => {
  const de = document.documentElement;
  const overflow = de.scrollWidth - de.clientWidth;
  const small = [];
  for (const el of document.querySelectorAll('button, a[role="button"], input[type=submit], [role=switch], [role=checkbox], select')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.height < 44 && r.width < 44) small.push((el.getAttribute('aria-label') || el.textContent.trim().slice(0,24)) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  return { h1: (document.querySelector('h2')?.textContent || '').trim().slice(0, 46), overflow, smallCount: small.length, small: small.slice(0, 6) };
})()
"""

JS_NAV = """
(async (label) => {
  const el = [...document.querySelectorAll('nav a, nav button, aside a, aside button, [role=navigation] a, [role=navigation] button')]
    .find(e => e.textContent.trim().toLowerCase().includes(label));
  if (!el) return 'NAV NOT FOUND';
  el.click();
  await new Promise(r => setTimeout(r, 2000));
  return 'OK';
})('%s')
"""

out = []
for w, h in [(375, 812), (1280, 800)]:
    c = CDP()
    c.send("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=1, mobile=(w < 500))
    c.send("Page.navigate", url=BASE)
    time.sleep(6)
    login = c.ev(JS_LOGIN)
    if login != "LOGGED" and w == 1280:
        # sesi admin masih hidup dari tahap 375 -> langsung cek
        login = "ALREADY"
    out.append({"viewport": f"{w}x{h}", "login": login})
    if login not in ("LOGGED", "ALREADY"):
        continue
    for label_txt, key in TABS:
        if key:
            r = c.ev(JS_NAV % key.lower())
            if r == 'NAV NOT FOUND':
                out.append({"viewport": f"{w}x{h}", "tab": label_txt, "nav": r}); continue
        else:
            c.ev(JS_NAV % "dashboard")
        time.sleep(1)
        m = c.ev(JS_CHECK)
        m = m if isinstance(m, dict) else {"raw": m}
        out.append({"viewport": f"{w}x{h}", "tab": label_txt, **m})
    c.send("Emulation.clearDeviceMetricsOverride")

json.dump(out, open("STATE/_viewport_89.json", "w", encoding="utf-8"), indent=1)
for r in out:
    print(r.get("viewport"), r.get("tab", "LOGIN"),
          "ovf=" + str(r.get("overflow", "-")),
          "small=" + str(r.get("smallCount", r.get("login", r.get("nav", "-")))),
          (r.get("small") or "")[:3])
