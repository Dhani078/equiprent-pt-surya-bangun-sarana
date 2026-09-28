# -*- coding: utf-8 -*-
"""Debug katalog customer: unit E61 terlihat? tombol apa?"""
import json
import time
import urllib.request
import websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def api_login(u, p):
    req = urllib.request.Request(BASE + "/api/auth/login", method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", UA)
    with urllib.request.urlopen(req, json.dumps({"username": u, "password": p}).encode(), timeout=60) as r:
        return json.loads(r.read().decode())["token"]


tok = api_login("admin", "admin")
req = urllib.request.Request(BASE + "/api/equipments")
req.add_header("User-Agent", UA)
req.add_header("X-SBS-Session", tok)
rows = json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
rows = rows.get("data", rows) if isinstance(rows, dict) else rows
e61 = [x for x in rows if x["equipment_code"].startswith("E61")]
print("unit E61 via API:", [(x["id"], x["status"], x["name"]) for x in e61])

tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
page = next(t for t in tabs if t.get("type") == "page")
ws = websocket.create_connection(page["webSocketDebuggerUrl"], suppress_origin=True, timeout=90)
ws.settimeout(90)
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
            return m.get("result", {})


def ev(expr):
    r = cmd("Runtime.evaluate", expression=expr, awaitPromise=True, returnByValue=True)
    if "exceptionDetails" in r:
        return "EXC " + json.dumps(r["exceptionDetails"])[:200]
    return r.get("result", {}).get("value")


# login Pelanggan
ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
ev("location.href=%s; 1" % json.dumps(BASE + "/#/login"))
time.sleep(1.5)
ev("location.reload(); 1")
time.sleep(3.5)
print("quick:", ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Pelanggan');if(b){b.click();return true}return false})()"))
time.sleep(0.4)
ev("(function(){var el=document.querySelector(\"input[type='password']\");var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'user');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click()})()")
time.sleep(3)
print("aside:", bool(ev("!!document.querySelector('aside')")))
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/katalog/i.test(x.textContent));if(b)b.click()})()")
time.sleep(2.5)
print("search box:", ev("(function(){var i=[...document.querySelectorAll('input')].map(x=>x.getAttribute('placeholder')||x.type).join(' | ');return i})()"))
ev("(function(){var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;var el=[...document.querySelectorAll('input')].find(x=>(x.getAttribute('placeholder')||'').includes('Nama'));if(el){set.call(el,'Siklus 61');el.dispatchEvent(new Event('input',{bubbles:true}));return true}return false})()")
time.sleep(1.5)
print("ada teks E61 di page:", ev("document.body.textContent.includes('Siklus 61')"))
print("card count:", ev("document.querySelectorAll('.card-premium').length"))
print(ev("""(() => {
  const cards=[...document.querySelectorAll('.card-premium')];
  const c=cards.find(x=>x.textContent.includes('Siklus 61'));
  if(!c) return 'KARTU TIDAK ADA; cards=' + cards.length + '; contoh=' + (cards[0]?cards[0].textContent.slice(0,120):'-');
  return 'KARTU: ' + c.textContent.slice(0,200) + ' ||| btns=' + [...c.querySelectorAll('button')].map(b=>b.textContent.trim()+':' + b.disabled).join(',');
})()"""))
ws.close()
