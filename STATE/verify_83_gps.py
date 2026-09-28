"""Siklus 83 verifikasi: halaman Pelacakan GPS setelah banner+filter dipisah."""
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

cmd("Page.bringToFront"); cmd("Network.enable")
cmd("Network.setCacheDisabled", cacheDisabled=True)
ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
cmd("Page.navigate", url=B + "/?v=83#/login")
time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Administrator/.test(x.textContent));if(b)b.click();})()")
    time.sleep(0.6)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4 + 2 * i)
    if ev("!!document.querySelector('aside')"):
        break
print("A. login:", bool(ev("!!document.querySelector('aside')")))

print("B. klik GPS:", ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/GPS|Pelacakan/i.test(x.textContent));if(b){b.click();return 'clicked';}return 'no btn';})()"))
time.sleep(5)

print("C. judul:", ev("(()=>{const h=[...document.querySelectorAll('h1,h2')].map(x=>x.textContent).join(' ');return /Telemetri GPS|Pelacakan/.test(h);})()"))
print("D. panel filter:", ev("(()=>{const s=document.querySelector('#filter-engine');const f=document.querySelector('#filter-fuel');const c=document.querySelector('#filter-search');return {mesin:!!s,bbm:!!f,cari:!!c};})()"))
print("E. banner geofence:", ev("(()=>{const a=document.querySelector('[role=alert]');return a?a.textContent.replace(/\\s+/g,' ').slice(0,90):'tidak tampil (mungkin nihil pelanggaran)';})()"))
print("F. peta:", ev("(()=>{const m=document.querySelector('.leaflet-container');return !!m;})()"))
time.sleep(2)
print("G. marker:", ev("document.querySelectorAll('.leaflet-marker-icon').length"))
print("H. ubah filter mesin ON:", ev("""(()=>{
const sel=document.querySelector('#filter-engine');if(!sel)return 'no select';
const s=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;
s.call(sel,'ON');sel.dispatchEvent(new Event('change',{bubbles:true}));return 'ok';})()"""))
time.sleep(2)
print("I. setelah filter:", ev("(()=>{const t=document.body.innerText;const m=t.match(/Menampilkan\\s*\\d+\\s*unit/i);return m?m[0]:'tak ketemu';})()"))
print("J. reset filter:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Reset Filter/i.test(x.textContent));
if(!b)return 'no btn';b.click();return 'ok';})()"""))
time.sleep(2)
print("K. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
