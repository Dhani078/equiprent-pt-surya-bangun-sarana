
# STATE/final_audit_94g.py — dark mode sweep semua halaman (screenshot + kontras)
import json, time, os, urllib.request, websocket, base64
PORT=9222
OUT=r"C:\xampp\htdocs\PT. SURYA BANGUN SARANA BANJARMASIN\STATE"
tabs=json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json/list',timeout=5))
tab=[t for t in tabs if t.get('type')=='page'][0]
ws=websocket.create_connection(tab["webSocketDebuggerUrl"],suppress_origin=True,timeout=60)
mid=[0]
def send(m,p=None):
    mid[0]+=1; ws.send(json.dumps({"id":mid[0],"method":m,"params":p or {}}))
    while True:
        r=json.loads(ws.recv())
        if r.get("id")==mid[0]: return r.get("result",{})
def js(expr):
    r=send("Runtime.evaluate",{"expression":expr,"returnByValue":True,"awaitPromise":True})
    if "exceptionDetails" in r: return {"__err__":str(r.get("exceptionDetails"))[:300]}
    return r.get("result",{}).get("value")
send("Page.enable"); send("Runtime.enable")
def goto(u): send("Page.navigate",{"url":u}); time.sleep(2.5)
def set_vp(w,h):
    send("Emulation.setDeviceMetricsOverride",{"width":w,"height":h,"deviceScaleFactor":1,"mobile":w<500}); time.sleep(0.8)
def shot(name):
    r=send("Page.captureScreenshot",{"format":"jpeg","quality":70})
    open(os.path.join(OUT,name),"wb").write(base64.b64decode(r["data"]))
    return name

# kontras: elemen teks hitam di latar gelap atau putih mentah
CONTRAST = """(()=>{
  const dark=document.documentElement.dataset.theme==='dark';
  if(!dark) return {theme:'light'};
  const bad=[];
  document.querySelectorAll('main *').forEach(e=>{
    if(e.children.length) return;
    const s=getComputedStyle(e); const c=s.color, b=s.backgroundColor;
    if(c==='rgb(255, 255, 255)' && (b==='rgba(0, 0, 0, 0)' || b==='rgb(0,0,0)')) return;
    // teks gelap di atas latar terang/tembus
    if(/rgb\(30, 41, 59\)|rgb\(15, 23, 42\)/.test(c) && /rgb\(248, 250, 252\)|rgb\(255,255,255\)/.test(b)) {
      bad.push(e.tagName+':'+(e.textContent||'').trim().slice(0,24));
    }
  });
  // latar putih mentah (hex raw lolos token)
  const rawWhite=[];
  document.querySelectorAll('main *').forEach(e=>{
    const b=getComputedStyle(e).backgroundColor;
    if(b==='rgb(255, 255, 255)') rawWhite.push(e.tagName+'.'+(typeof e.className==='string'?e.className.split(' ')[0]:''));
  });
  return {theme:'dark', contrast_fail:bad.slice(0,6), raw_white:[...new Set(rawWhite)].slice(0,6)};
})()"""

def login(user,pw,role):
    goto("https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev/login")
    time.sleep(1.0)
    js(f"""(()=>{{const t=[...document.querySelectorAll('[role=tab]')].find(e=>(e.textContent||'').toLowerCase().includes('{role}')); if(t)t.click(); return 1}})()""")
    time.sleep(0.5)
    js(f"""(()=>{{const ins=document.querySelectorAll('input'); const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
      s.call(ins[0],'{user}'); ins[0].dispatchEvent(new Event('input',{{bubbles:true}})); s.call(ins[1],'{pw}'); ins[1].dispatchEvent(new Event('input',{{bubbles:true}})); return 1}})()""")
    time.sleep(0.4)
    js("""(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim().toLowerCase().includes('masuk')); if(b)b.click(); return 1})()""")
    time.sleep(4.2)
    return js("location.pathname")

def set_dark():
    js("""(()=>{const d=document.documentElement; if(d.dataset.theme!=='dark'){const b=[...document.querySelectorAll('button')].find(e=>(e.textContent||'').toLowerCase().includes('gelap')); if(b)b.click();} return d.dataset.theme||'light'})()""")
    time.sleep(0.9)

def navto(label):
    js(f"""(()=>{{const b=[...document.querySelectorAll('aside button, nav button')].find(e=>(e.textContent||'').trim().includes('{label}')); if(b)b.click(); return 1}})()""")
    time.sleep(1.8)

# ============ ADMIN dark sweep ============
print("login admin:", login("admin","admin","admin"))
set_dark()
set_vp(1280,800)
report={}
for page in ["Dashboard Utama","Inventaris Alat Berat","Transaksi Penyewaan","Perawatan & Servis","Pelacakan GPS","Laporan & Dokumen","Manajemen Pengguna","Pengaturan Sistem","Audit Trail"]:
    navto(page); time.sleep(0.9)
    c=js(CONTRAST) or {}
    name=f"audit_94_dark_{page.split()[0].lower()}.jpg"
    shot(name)
    ovf=js("document.documentElement.scrollWidth-document.documentElement.clientWidth")
    report[page]={"contrast":c,"shot":name,"ovf":ovf}
    print(page, "ovf=",ovf, json.dumps(c,ensure_ascii=False)[:220])
json.dump(report,open(os.path.join(OUT,"final_audit_94g.json"),"w",encoding="utf-8"),indent=1,ensure_ascii=False)
print("DONE_ADMIN_DARK")
