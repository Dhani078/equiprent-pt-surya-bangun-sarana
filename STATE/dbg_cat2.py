# -*- coding: utf-8 -*-
"""Debug: apakah cermin browser customer berisi E61, dan filter apa yang membuang."""
import json
import time
import urllib.request
import websocket

BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"

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
        return "EXC " + json.dumps(r["exceptionDetails"])[:250]
    return r.get("result", {}).get("value")


# customer masih login dari dbg_cat? cek aside
if not ev("!!document.querySelector('aside')"):
    ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
    ev("location.href=%s; 1" % json.dumps(BASE + "/#/login"))
    time.sleep(1.5)
    ev("location.reload(); 1")
    time.sleep(3.5)
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Pelanggan');if(b)b.click()})()")
    time.sleep(0.4)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'user');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click()})()")
    time.sleep(3)
print("aside:", bool(ev("!!document.querySelector('aside')")))

print("empty-state?", ev("document.body.textContent.includes('Tidak ada unit yang sesuai')"))
print("count badge?", ev("(function(){var t=[...document.querySelectorAll('div,p,span')].map(x=>x.textContent).find(x=>x&&x.includes('unit')&&x.length<120);return t})()"))

# fetch API langsung dari browser customer
print("API dari browser:", ev("""(async function(){
  var tok=localStorage.getItem('sbs_session_token');
  var r=await fetch('/api/equipments',{headers:{'X-SBS-Session':tok||''}});
  var j=await r.json();
  var rows=j.data||j;
  var e61=rows.filter(x=>String(x.equipment_code).startsWith('E61'));
  return {status:r.status, total:rows.length, e61:e61.map(x=>[x.id,x.status])};
})()"""))

# reset filter: hapus keyword, lihat jumlah kartu tanpa search
ev("(function(){var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;var el=[...document.querySelectorAll('input')].find(x=>(x.getAttribute('placeholder')||'').includes('Nama'));if(el){set.call(el,'');el.dispatchEvent(new Event('input',{bubbles:true}))}})()")
time.sleep(1.2)
print("kartu tanpa keyword:", ev("document.querySelectorAll('.card-premium').length"))
print("text E61 muncul?", ev("document.body.textContent.includes('Unit Uji Siklus 61')"))
# tanggal default: kosong?
print("values date:", ev("[...document.querySelectorAll('input[type=\\'date\\']')].map(d=>d.value).join('|')"))
ws.close()
