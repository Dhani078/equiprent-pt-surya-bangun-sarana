"""Siklus 86d: modal tanda tangan elektronik (ContractSignModal) via UI production."""
import json, time, urllib.request, websocket

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
page = next(t for t in tabs if t.get("type") == "page")
ws = websocket.create_connection(page["webSocketDebuggerUrl"], suppress_origin=True, timeout=120)
_id = [0]
def cmd(m, **p):
    _id[0] += 1
    ws.send(json.dumps({"id": _id[0], "method": m, "params": p}))
    while True:
        try: x = json.loads(ws.recv())
        except Exception: continue
        if x.get("id") == _id[0]: return x.get("result", {})
def ev(e):
    return cmd("Runtime.evaluate", expression=e, awaitPromise=True, returnByValue=True).get("result", {}).get("value")

ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
cmd("Page.navigate", url=B + "/?v=86d#/login")
time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Pelanggan|Customer/i.test(x.textContent));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'user');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break
print("A. login customer:", bool(ev("!!document.querySelector('aside')")))
ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Kontrak/.test(x.textContent));if(b)b.click();})()")
time.sleep(2.5)
print("B. baris awaiting muncul:", ev("/CTR-SBS-20260528-038|Tanda Tangani/.test(document.body.innerText)"))
print("C. klik Tanda Tangani:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Tanda Tangani|Tandatangani/i.test(x.textContent));
if(!b)return 'no btn';b.click();return 'ok';})()"""))
time.sleep(1.5)
print("D. modal sign:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]').values()].find(x=>/Penandatanganan Kontrak:/.test(x.textContent)&&x.offsetParent!==null);
if(!d)return 'tidak ada';
return {kode:(d.textContent.match(/CTR-\\S+/)||[''])[0], nama:!!d.querySelector('#signer-name'),
   nilaiNama:(d.querySelector('#signer-name')||{}).value||'', kanvas:!!d.querySelector('canvas'),
   ite:/UU ITE/.test(d.textContent), tombol:[...d.querySelectorAll('button')].map(x=>x.textContent.trim()).filter(t=>t).slice(0,4)};})()"""))
print("E. kosongkan nama -> submit -> error lokal:", ev("""(()=>{
const d=[...document.querySelectorAll('[role=dialog]').values()].find(x=>/Penandatanganan Kontrak:/.test(x.textContent));
if(!d)return 'no';
const inp=d.querySelector('#signer-name');
const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
s.call(inp,'');inp.dispatchEvent(new Event('input',{bubbles:true}));
const b=[...d.querySelectorAll('button')].find(x=>/Bubuhkan/.test(x.textContent));b.click();return 'ok';})()"""))
time.sleep(1.2)
print("F. pesan galat nama:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]').values()].find(x=>/Penandatanganan Kontrak:/.test(x.textContent));
if(!d)return 'dialog hilang';const p=d.querySelector('#signer-name-error');return p?p.textContent.trim().slice(0,70):'tanpa error';})()"""))
print("G. Tinjau Kembali -> tertutup:", ev("""(()=>{const d=[...document.querySelectorAll('[role=dialog]').values()].find(x=>/Penandatanganan Kontrak:/.test(x.textContent));
if(!d)return 'no dialog';const b=[...d.querySelectorAll('button')].find(x=>/Tinjau Kembali/.test(x.textContent));b.click();return 'ok';})()"""))
time.sleep(1.2)
print("H. dialog visible:", ev("[...document.querySelectorAll('[role=dialog]').values()].filter(x=>x.offsetParent!==null).length"))
print("I. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
