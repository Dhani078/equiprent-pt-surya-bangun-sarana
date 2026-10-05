
# STATE/final_audit_94.py — Audit final tata letak, desain, tombol, filter (3 role, mobile+desktop)
import json, subprocess, time, os, urllib.request, urllib.error, sys

CHROME = os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe")
PROFILE = os.path.join(os.environ.get("LOCALAPPDATA", r"C:\Users\Anomali\AppData\Local"), "Temp", "cdp9222_f")
PORT = 9222
BASE = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"

def sh(c, **kw): return subprocess.run(c, shell=True, capture_output=True, text=True, **kw)

# 1. start chrome headless
subprocess.run('taskkill /F /IM chrome.exe', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
os.makedirs(PROFILE, exist_ok=True)
proc = subprocess.Popen([CHROME, f'--remote-debugging-port={PORT}', f'--user-data-dir={PROFILE}',
    '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1280,800', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(60):
    try:
        d = json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json/version', timeout=2))
        break
    except Exception: time.sleep(0.5)
else:
    print("CHROME_FAIL"); sys.exit(1)

import websocket, ssl
tab = json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json/list', timeout=5))[0]
wsurl = tab["webSocketDebuggerUrl"]
ws = websocket.create_connection(wsurl, suppress_origin=True, timeout=30)
mid = [0]
def send(method, params=None):
    mid[0]+=1
    ws.send(json.dumps({"id":mid[0], "method":method, "params":params or {}}))
    while True:
        m = json.loads(ws.recv())
        if m.get("id")==mid[0]: return m.get("result",{})
def js(expr):
    r = send("Runtime.evaluate", {"expression":expr,"returnByValue":True,"awaitPromise":True})
    if "exceptionDetails" in r: return {"__err__": r["exceptionDetails"].get("text","")+" "+str(r["exceptionDetails"].get("exception",{}).get("description",""))[:300]}
    return r.get("result",{}).get("value")

send("Page.enable"); send("Runtime.enable")
console_err=[]
send("Log.enable")

def goto(url):
    send("Page.navigate", {"url":url})
    time.sleep(2.5)

def set_vp(w,h):
    send("Emulation.setDeviceMetricsOverride", {"width":w,"height":h,"deviceScaleFactor":1,"mobile":w<500})

def login(user, pw, role_tab):
    goto(BASE+"/login")
    # role tab
    js(f"""(()=>{{const t=[...document.querySelectorAll('[role="tab"]')].find(e=>e.textContent.toLowerCase().includes('{role_tab}')); if(t)t.click(); return !!t}})()""")
    time.sleep(0.4)
    js(f"""(()=>{{const ins=document.querySelectorAll('input'); ins[0].value='{user}'; ins[0].dispatchEvent(new Event('input',{{bubbles:true}})); ins[1].value='{pw}'; ins[1].dispatchEvent(new Event('input',{{bubbles:true}})); return ins.length}})()""")
    time.sleep(0.3)
    js("""(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().toLowerCase().includes('masuk')||x.type==='submit'); if(b){b.click();return b.textContent.trim()} return null})()""")
    time.sleep(3.5)
    return js("location.href")

def collect_errors():
    return js("window.__errs||[]")

report = {"start": time.strftime("%Y-%m-%d %H:%M:%S"), "pages":[]}

def audit_page(name, viewport):
    set_vp(*viewport)
    time.sleep(1.2)
    res = js("""(()=>{
      const out={};
      out.title=(document.querySelector('h1,h2,[class*="heading"]')||{textContent:null}).textContent;
      out.url=location.href;
      out.scrollW=document.documentElement.scrollWidth; out.clientW=document.documentElement.clientWidth;
      out.bodyScrollW=document.body.scrollWidth;
      out.overflow=Math.max(0, document.documentElement.scrollWidth-document.documentElement.clientWidth);
      // elemen melebar
      const wide=[];
      document.querySelectorAll('*').forEach(e=>{
        const r=e.getBoundingClientRect();
        if(r.width>document.documentElement.clientWidth+1 && r.width>0){ wide.push(e.tagName+'.'+(e.className&&e.className.baseVal===undefined?String(e.className).split(' ')[0]:'')+' '+Math.round(r.width)); }
      });
      out.wide_top=wide.slice(0,6);
      // target kecil (mobile only)
      out.small=[];
      if(document.documentElement.clientWidth<500){
        document.querySelectorAll('button,a,[role=tab],input,select').forEach(e=>{
          const r=e.getBoundingClientRect();
          if(r.width>0 && r.height>0 && (r.width<44||r.height<44)) out.small.push(e.tagName+':'+(e.textContent||e.placeholder||e.getAttribute('aria-label')||'').trim().slice(0,30)+' '+Math.round(r.width)+'x'+Math.round(r.height));
        });
        out.small=out.small.slice(0,8);
      }
      // elemen terbaca
      out.buttons=[...document.querySelectorAll('button')].length;
      out.inputs=[...document.querySelectorAll('input,select,textarea')].length;
      out.tables=document.querySelectorAll('table').length;
      out.rows=document.querySelectorAll('tbody tr').length;
      out.imgs=document.querySelectorAll('img').length;
      out.deadimg=[...document.querySelectorAll('img')].filter(i=>i.complete&&i.naturalWidth===0).length;
      // teks terlalu kontras rendah / hex mentah
      out.rawhex=[];
      document.querySelectorAll('*').forEach(e=>{const s=getComputedStyle(e); [s.color,s.backgroundColor,s.borderColor].forEach(c=>{if(/^rgb\(255,255,255\)|rgb\(0,0,0\)/.test(c)&&e.children.length===0) out.rawhex.push(e.tagName+':'+c)}}); out.rawhex=out.rawhex.slice(0,5);
      // overflow teks (ellipsis vs pecah)
      out.clipped=[];
      document.querySelectorAll('td,th,.card,[class*="card"],button').forEach(e=>{
        if(e.scrollWidth>e.clientWidth+2 && e.children.length===0) out.clipped.push((e.textContent||'').trim().slice(0,40));
      });
      out.clipped=out.clipped.slice(0,6);
      return out;
    })()""")
    # console errors
    errs = js("window.__capturedErrs ? window.__capturedErrs.length : -1")
    res["name"]=name; res["vp"]=f"{viewport[0]}x{viewport[1]}"
    report["pages"].append(res)
    print(json.dumps({"name":name,"vp":res["vp"],"ovf":res.get("overflow"),"small":len(res.get("small",[])),"btn":res.get("buttons"),"rows":res.get("rows"),"deadimg":res.get("deadimg"),"wide":res.get("wide_top",[])[:3],"clipped":res.get("clipped",[])[:3]}))
    return res

def click_all_buttons(label_filter=None):
    # klik tombol aman (filter/export/close/reset) & catat hasil
    pass

# ---- ADMIN ----
print("LOGIN ADMIN:", login("admin","admin","admin"))
ADMIN_TABS = ["Dashboard","Inventaris","Transaksi","Kontrak","Servis","GPS","Pengguna","Laporan","Pengaturan","Audit"]
for tab in ADMIN_TABS:
    js(f"""(()=>{{const n=[...document.querySelectorAll('nav button,nav a,[class*="nav"] button')].find(e=>e.textContent.trim().toLowerCase().includes('{tab.lower()}')); if(n){{n.click();return n.textContent.trim()}} return 'NOTFOUND:'+{tab.lower()!r}}})()""")
    time.sleep(1.6)
    audit_page("ADMIN:"+tab, (1280,800))
    audit_page("ADMIN:"+tab, (390,844))

report["end"]=time.strftime("%Y-%m-%d %H:%M:%S")
with open(r"C:\xampp\htdocs\PT. SURYA BANGUN SARANA BANJARMASIN\STATE\final_audit_94.json","w",encoding="utf-8") as f:
    json.dump(report,f,indent=1,ensure_ascii=False)
print("DONE_ADMIN")
