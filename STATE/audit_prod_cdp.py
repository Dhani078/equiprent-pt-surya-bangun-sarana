# -*- coding: utf-8 -*-
"""
Audit interaktif PRODUCTION EquipRent MS via CDP (Chrome debug 9222).
Kebijakan: klik semua tombol non-destruktif; destructive (hapus/setujui/tolak/
bayar/unggah/kirim/simpan/suspend/keluar) hanya dicek ada, tidak diklik —
kecuali tombol yang memunculkan modal (aman, di-Escape). Login via UI nyata.
Hasil: STATE/audit_prod.json
"""
import json, time, urllib.request, websocket, re, sys

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
OUT  = "STATE/audit_prod.json"

DESTRUCTIVE = re.compile(
    r'hapus|delete|setujui|tolak|approve|reject|bayar|unggah|upload|kirim|submit'
    r'|simpan|save|suspend|blokir|nonaktif|keluar|logout|sign\s*out|reset', re.I)

def connect():
    tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=10))
    page = next(t for t in tabs if t["type"] == "page")
    return websocket.create_connection(page["webSocketDebuggerUrl"], timeout=90, suppress_origin=True)

class CDP:
    def __init__(self):
        self.ws = connect(); self.id = 0; self.msgs = []
        self.send("Page.enable"); self.send("Runtime.enable"); self.send("Network.enable")
        self.send("Log.enable")
    def send(self, m, **p):
        self.id += 1
        self.ws.send(json.dumps({"id": self.id, "method": m, "params": p}))
        while True:
            x = json.loads(self.ws.recv())
            if x.get("id") == self.id: return x.get("result", {})
            if x.get("method"): self.msgs.append(x)
    def ev(self, expr, awaitp=False):
        r = self.send("Runtime.evaluate", expression=expr, returnByValue=True,
                      awaitPromise=awaitp)
        if "exceptionDetails" in r:
            return {"__exc__": str(r["exceptionDetails"])[:200]}
        res = r.get("result", {})
        return res.get("value", res.get("description"))
    def drain(self):
        """ambil pesan event yang tertinggal di socket tanpa blocking lama"""
        self.ws.settimeout(0.3)
        try:
            while True:
                x = json.loads(self.ws.recv())
                if x.get("method"): self.msgs.append(x)
        except Exception:
            pass
        self.ws.settimeout(90)
    def since(self, i):
        return self.msgs[i:]

def console_errors(new):
    out = []
    for m in new:
        if m["method"] == "Runtime.consoleAPICalled" and m["params"].get("type") == "error":
            txt = " ".join(str(a.get("value", a.get("description", "")))[:120]
                           for a in m["params"].get("args", [])[:3])
            out.append(txt)
        if m["method"] == "Runtime.exceptionThrown":
            d = m["params"]["exceptionDetails"]
            out.append("EXC:" + (d.get("exception", {}).get("description") or
                                 d.get("text") or "?")[:160])
    return out

def net_errors(new):
    out = []
    for m in new:
        if m["method"] == "Network.responseReceived":
            r = m["params"]["response"]
            if r["status"] >= 400:
                out.append("%d %s" % (r["status"], r["url"][:110]))
    return out

JS_CLICK_TEXT = """(() => {
  const sel = %s;
  const scope = sel ? document.querySelector(sel) : document.querySelector('main') || document.body;
  const t = %s;
  const el = [...scope.querySelectorAll('button,a[role=button],a[href^=\"#\"]')]
    .find(b => b.offsetParent !== null && b.textContent.trim().replace(/\\s+/g,' ').startsWith(t));
  if (!el) return 'NOTFOUND';
  el.click(); return 'CLICKED';
})()"""

def click(c, text, scope=None):
    return c.ev(JS_CLICK_TEXT % (json.dumps(scope) if scope else "null", json.dumps(text)))

def modal_open(c):
    return bool(c.ev("""(() => {
      const m = document.querySelector('[role=dialog],.modal-overlay,[class*="Modal"],[class*="modal"]');
      return m && m.offsetParent !== null ? true : false; })()"""))

def esc(c):
    c.send("Input.dispatchKeyEvent", type="keyDown", key="Escape", code="Escape",
           windowsVirtualKeyCode=27, nativeVirtualKeyCode=27)
    c.send("Input.dispatchKeyEvent", type="keyUp", key="Escape", code="Escape",
           windowsVirtualKeyCode=27, nativeVirtualKeyCode=27)

def page_buttons(c):
    return c.ev("""(() => [...(document.querySelector('main')||document.body)
      .querySelectorAll('button')].filter(b=>b.offsetParent!==null)
      .map(b=>b.textContent.trim().replace(/\\s+/g,' ').slice(0,42))
      .filter(Boolean))()""") or []

def sidebar_menus(c):
    return c.ev("""(() => [...document.querySelectorAll('aside button')]
      .map(b=>b.textContent.trim().replace(/\\s+/g,' '))
      .filter(Boolean))()""") or []

def login(c, user, pw):
    """Login pakai tombol peran cepat (Administrator/Staf/Pelanggan) yang
    mengisi state React dengan benar, bukan native-setter (state tidak ikut)."""
    c.ev("(() => { sessionStorage.clear(); })()")
    c.send("Page.navigate", url=BASE + "/")
    time.sleep(3.5)
    for _ in range(3):
        if c.ev("!!document.querySelector('input[type=password]')"): break
        time.sleep(2)
    quick = {"admin": "Administrator", "staff": "Staf", "user": "Pelanggan"}.get(user)
    if not quick:
        return "NO-QUICK", False
    r = click(c, quick)   # tombol demo: mengisi state React dengan kredensial benar
    time.sleep(0.8)
    r = click(c, "Masuk")
    time.sleep(4.5)
    ok = c.ev("!!document.querySelector('aside')")
    return r, ok

def audit_role(c, res, name, creds, max_pages=9):
    entry = {"role": name, "pages": []}
    r, ok = login(c, *creds)
    entry["login"] = {"click": r, "aside": ok}
    if not ok:
        res.append(entry); print("!! LOGIN GAGAL", name); return
    menus = sidebar_menus(c)
    print("== %s: %d menu ==" % (name, len(menus)))
    for label in [m for m in menus if "Keluar" not in m][:max_pages]:
        idx0 = len(c.msgs)
        click(c, label, "aside")
        time.sleep(2.2)
        page = {"menu": label}
        btns = page_buttons(c)
        page["n_buttons"] = len(btns)
        page["heading"] = c.ev("""(() => { const h=[...(document.querySelector('main')||document.body).querySelectorAll('h2,h3')].slice(0,2).map(x=>x.textContent.trim().slice(0,48)); return h.join(' / '); })()""")
        page["blank"] = not c.ev("((document.querySelector('main')||document.body).innerText||'').trim().length>80")
        clicked, skipped, modalok, broke = [], [], 0, 0
        for t in btns[:28]:
            if DESTRUCTIVE.search(t) or len(t) < 2:
                skipped.append(t); continue
            i1 = len(c.msgs)
            if click(c, t) != "CLICKED": continue
            time.sleep(0.9)
            mo = modal_open(c)
            if mo:
                esc(c); time.sleep(0.6)
                if modal_open(c):  # Escape tak menutup -> tutup manual via tombol batal/tutup
                    for x in ("Tutup", "Batal", "Cancel"):
                        if click(c, x) == "CLICKED": break
                    time.sleep(0.4)
                    if modal_open(c): broke += 1; page.setdefault("modal_stuck", []).append(t)
                else: modalok += 1
            new = c.since(i1)
            ce, ne = console_errors(new), net_errors(new)
            if ce or ne:
                page.setdefault("click_issues", []).append(
                    {"btn": t[:40], "console": ce[:2], "net": ne[:2]})
            if c.ev("!!document.querySelector('aside')==false"):
                page["crashed_after"] = t; break
            clicked.append(t)
        newp = c.since(idx0)
        page["clicked"] = len(clicked); page["skipped_destructive"] = skipped
        page["modals_ok"] = modalok; page["modals_stuck"] = broke
        page["console_errors"] = console_errors(newp)[:5]
        page["net_errors"] = sorted(set(net_errors(newp)))[:6]
        entry["pages"].append(page)
        print("  %-28s btn=%2d clk=%2d mod=%d C:%d N:%d %s" % (
            label[:28], page["n_buttons"], page["clicked"], modalok,
            len(page["console_errors"]), len(page["net_errors"]), page["heading"][:36]))
    res.append(entry)

def main():
    c = CDP()
    res = []
    # ---- halaman login: validasi form ----
    p = {"role": "LOGIN", "pages": []}
    c.send("Page.navigate", url=BASE + "/"); time.sleep(3.5)
    i0 = len(c.msgs)
    click(c, "Masuk")  # submit kosong
    time.sleep(1.5)
    msg = c.ev("(document.body.innerText.match(/wajib|isi|kosong|password/i)||[''])[0]")
    pp = {"menu": "submit-kosong", "validation_msg": bool(msg),
          "console_errors": console_errors(c.since(i0))[:4]}
    p["pages"].append(pp)
    # password salah -> lewat HTTP murni (UI state tak bisa diisi kredensial
    # asing via CDP insertText tanpa onChange React; API-lah yg mengotorisasi)
    import urllib.request as _u, urllib.error as _e
    req = _u.Request(BASE + "/api/auth/login",
        data=json.dumps({"username": "admin", "password": "salah12345"}).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}, method="POST")
    try:
        code = _u.urlopen(req, timeout=30).status; denied = False
    except _e.HTTPError as e:
        code = e.code; denied = (code == 401)
    p["pages"].append({"menu": "password-salah-http", "status": code, "denied": denied})
    res.append(p)
    audit_role(c, res, "ADMIN",    ("admin", "admin"))
    audit_role(c, res, "STAFF",    ("staff", "staff"))
    audit_role(c, res, "CUSTOMER", ("user", "user"))
    json.dump(res, open(OUT, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    tot_c = sum(len(pg.get("console_errors", [])) for e in res for pg in e.get("pages", []))
    tot_n = sum(len(pg.get("net_errors", [])) for e in res for pg in e.get("pages", []))
    tot_ck = sum(len(pg.get("click_issues", [])) for e in res for pg in e.get("pages", []))
    print("\nRINGKASAN: console=%d net=%d click_issues=%d -> %s" % (tot_c, tot_n, tot_ck, OUT))

if __name__ == "__main__":
    main()
