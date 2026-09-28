# -*- coding: utf-8 -*-
"""Debug preview dokumen laporan: tombol mana yang ada & apa yang muncul."""
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
            return m.get("result", {})


def ev(expr):
    r = cmd("Runtime.evaluate", expression=expr, awaitPromise=True, returnByValue=True)
    if "exceptionDetails" in r:
        return "EXC " + json.dumps(r["exceptionDetails"])[:200]
    return r.get("result", {}).get("value")


print("url:", ev("location.href"))
# pastikan admin login + di Laporan
if not ev("!!document.querySelector('aside')"):
    ev("location.href=%s; 1" % json.dumps(BASE + "/#/login"))
    time.sleep(3)
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Administrator');if(b)b.click();})()")
    time.sleep(0.4)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4)
print("aside:", ev("!!document.querySelector('aside')"))
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/laporan/i.test(x.textContent));if(b)b.click();})()")
time.sleep(2)
print("btn preview:", ev("(function(){var bs=[...document.querySelectorAll('button')].filter(x=>(x.getAttribute('aria-label')||'').includes('Buka pratinjau'));return {n:bs.length, first: bs[0]?bs[0].getAttribute('aria-label'):null};})()"))
r = ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>(x.getAttribute('aria-label')||'').includes('Buka pratinjau'));if(!b)return 'NF';b.click();return 'CLICK';})()")
print("click:", r)
for t in (1, 2, 3):
    time.sleep(1)
    print("t%dialog:" % t, ev("(function(){var d=[...document.querySelectorAll('[role=dialog]')];return d.map(x=>({len:x.textContent.length, head:x.textContent.slice(0,60)}));})()"))
print("modal class?", ev("(function(){var m=[...document.querySelectorAll('div')].filter(x=>/modal|Modal/.test(x.className)&&x.textContent.length>100);return m.length?m[0].textContent.slice(0,120):'NONE';})()"))
print("body tail changed?", ev("(function(){return document.body.innerText.includes('Pratinjau')||document.body.innerText.includes('BAST');})()"))
ws.close()
