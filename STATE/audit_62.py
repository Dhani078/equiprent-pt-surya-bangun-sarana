# -*- coding: utf-8 -*-
"""Siklus 62 — audit halaman Laporan + cetak BAST production:
preview dokumen, PDF CDP (PrintToPDF, tanpa dialog), export CSV via hook
URL.createObjectURL, pencarian+filter, nav BAST staff. Semua via UI asli."""
import base64
import json
import time
import urllib.request
import websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"

tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
page = next(t for t in tabs if t.get("type") == "page")
ws = websocket.create_connection(page["webSocketDebuggerUrl"], suppress_origin=True, timeout=120)
ws.settimeout(120)
_id = [0]


def cmd(method, **p):
    _id[0] += 1
    ws.send(json.dumps({"id": _id[0], "method": method, "params": p}))
    while True:
        try:
            m = json.loads(ws.recv())
        except websocket.WebSocketTimeoutException:
            continue
        if m.get("id") == _id[0]:
            if "error" in m:
                return {"__err__": m["error"]}
            return m.get("result", {})


def ev(expr):
    r = cmd("Runtime.evaluate", expression=expr, awaitPromise=True, returnByValue=True)
    if "exceptionDetails" in r:
        return "EXC " + json.dumps(r["exceptionDetails"])[:200]
    return r.get("result", {}).get("value")


def log(*a):
    print(*a, flush=True)


def login(user, pwd, role_btn):
    ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
    ev("location.href=%s; 1" % json.dumps(BASE + "/#/login"))
    time.sleep(1.5)
    ev("location.reload(); 1")
    time.sleep(3.5)
    for attempt in range(3):
        R = json.dumps(role_btn)
        ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===%s);if(b)b.click();})()" % R)
        time.sleep(0.5)
        ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,%s);el.dispatchEvent(new Event('input',{bubbles:true}))})()" % json.dumps(pwd))
        ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
        time.sleep(4 + attempt * 2)
        if ev("!!document.querySelector('aside')"):
            log("login", user, "OK")
            return True
    return False


def nav_click(label):
    L = json.dumps(label.lower())
    r = ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>x.textContent.toLowerCase().includes(%s));if(!b)return 'NF';b.click();return true;})()" % L)
    time.sleep(2.2)
    return r


HASIL = {}

# ---- ADMIN: Laporan ----
assert login("admin", "admin", "Administrator")
nav_click("Laporan")
time.sleep(1.5)
log("halaman laporan:", ev("(function(){var t=document.body.innerText;return {arsip:t.includes('Arsip'), rows:document.querySelectorAll('table tbody tr').length};})()"))

# 1) pencarian + filter
ev("(function(){var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;var el=[...document.querySelectorAll('input')].find(x=>/ari/.test(x.getAttribute('placeholder')||''));if(el){set.call(el,'BAST');el.dispatchEvent(new Event('input',{bubbles:true}))}})()")
time.sleep(1.2)
HASIL["1_filter"] = ev("(function(){return document.querySelectorAll('table tbody tr').length;})()")
log("baris setelah filter BAST:", HASIL["1_filter"])
ev("(function(){var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;var el=[...document.querySelectorAll('input')].find(x=>/ari/.test(x.getAttribute('placeholder')||''));if(el){set.call(el,'');el.dispatchEvent(new Event('input',{bubbles:true}))}})()")
time.sleep(1)

# 2) hook download (createObjectURL) untuk export CSV/Excel tanpa dialog
ev("""(function(){
  window.__dl=[];
  var oc=URL.createObjectURL;
  URL.createObjectURL=function(b){ try{ if(b instanceof Blob){ b.text().then(t=>window.__dl.push({size:b.size,head:t.slice(0,160)})); } }catch(e){} window.__dl.push({size:(b&&b.size)||0}); return oc.apply(URL,arguments); };
  const of=window.fetch;
  window.__net=[];
  window.fetch=async function(){var u=(typeof arguments[0]==='string'?arguments[0]:arguments[0]&&arguments[0].url)||'';var res=await of.apply(null,arguments);if(u.indexOf('/api/')!==-1)window.__net.push(u.split('/api/')[1]+'='+res.status);return res;};
})()""")

for label in ["CSV", "Excel"]:
    r = ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().endsWith(%s));if(!b)return 'NF';b.click();return 'CLICK';})()" % json.dumps(label))
    time.sleep(2)
log("export CSV/Excel:", r, "| blob tertangkap:", ev("(window.__dl||[]).length"))
log("isi awal blob:", json.dumps(ev("(function(){var d=window.__dl&&window.__dl[0];return d?d.head:null;})()"))[:220])
HASIL["2_export"] = bool(ev("(window.__dl||[]).length>=2"))

# 3) pratinjau dokumen
r = ev("""(function(){
  var b=[...document.querySelectorAll('button')].find(x=>(x.getAttribute('aria-label')||'').includes('Buka pratinjau dokumen'));
  if(!b) return 'NF'; b.click(); return 'CLICK';
})()""")
time.sleep(2)
HASIL["3_preview"] = ev("(function(){var d=document.querySelector('[role=dialog]');return d?d.textContent.length:0;})()")
log("preview modal chars:", HASIL["3_preview"])
png = cmd("Page.captureScreenshot", format="png")
open("STATE/62_preview.png", "wb").write(base64.b64decode(png["data"]))
ev("(function(){var b=[...document.querySelectorAll('[role=dialog] button')].find(x=>/Tutup|silang| Batal/i.test(x.textContent)||x.getAttribute('aria-label')==='Tutup dialog');if(b)b.click();})()")
time.sleep(1)

# 4) cetak via PrintToPDF CDP (tanpa dialog window.print)
pdf = cmd("Page.printToPDF", paperWidth=8.27, paperHeight=11.69, printBackground=True)  # A4
if "__err__" in pdf:
    pdf = cmd("Page.printToPDF")
ok_pdf = "data" in pdf and len(pdf.get("data", "")) > 3000
HASIL["4_pdf"] = ok_pdf
if ok_pdf:
    open("STATE/62_cetak.pdf", "wb").write(base64.b64decode(pdf["data"]))
    log("PDF A4:", len(base64.b64decode(pdf["data"])), "byte -> STATE/62_cetak.pdf")
else:
    log("PDF err:", json.dumps(pdf)[:160])

# 5) 4xx?
net = ev("(window.__net||[]).filter(x=>x.endsWith('=401')||x.endsWith('=403')||x.endsWith('=500')).join(',')||'BERSIH'")
log("API 4xx/5xx sesi admin:", net)
HASIL["5_4xx_admin"] = net

# ---- STAFF: Cetak Laporan BAST ----
assert login("staff", "staff", "Staf")
r = nav_click("Cetak Laporan")
HASIL["6_nav_bast_staff"] = bool(r is True)
log("staff nav BAST:", r)
time.sleep(1)
HASIL["7_staff_laporan_rows"] = ev("document.querySelectorAll('table tbody tr').length")
log("staff rows:", HASIL["7_staff_laporan_rows"])
net2 = ev("(function(){return 'n/a';})()")

# ---- error console? ----
log("== RINGKASAN ==")
for k, v in HASIL.items():
    log(" ", k, "->", v)
ws.close()
