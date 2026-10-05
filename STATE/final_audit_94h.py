
# STATE/final_audit_94h.py — staff portal + register modal + dark persist
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
def goto(u): send("Page.navigate",{"url":u}); time.sleep(2.4)
def set_vp(w,h):
    send("Emulation.setDeviceMetricsOverride",{"width":w,"height":h,"deviceScaleFactor":1,"mobile":w<500}); time.sleep(0.8)
def shot(name):
    r=send("Page.captureScreenshot",{"format":"jpeg","quality":70})
    open(os.path.join(OUT,name),"wb").write(base64.b64decode(r["data"]))
report={}
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
    return js("!!document.querySelector('aside')")
def logout():
    js("""(()=>{const b=[...document.querySelectorAll('button')].find(e=>(e.textContent||'').trim().toLowerCase().startsWith('keluar')); if(b)b.click(); return 1})()""")
    time.sleep(1.5)
    js("sessionStorage.clear(); localStorage.clear(); return 1")

# ===== STAFF =====
report["staff_login"]=login("staff","staff","staf")
set_vp(1280,800)
report["staff_navs"]=js("[...document.querySelectorAll('aside button, nav button')].map(e=>(e.textContent||'').trim().slice(0,26))")
report["staff_ovf"]=js("document.documentElement.scrollWidth-document.documentElement.clientWidth")
report["staff_rows"]=js("document.querySelectorAll('tbody tr').length")
shot("audit_94_staff_dash.jpg")
# sub-tabs staff
for sub in ["Approval","Kontrak"]:
    js(f"""(()=>{{const t=[...document.querySelectorAll('[role=tab]')].find(e=>(e.textContent||'').includes('{sub}')); if(t)t.click(); return 1}})()""")
    time.sleep(1.5)
    report[f"staff_{sub}_rows"]=js("document.querySelectorAll('tbody tr').length")
    report[f"staff_{sub}_ovf"]=js("document.documentElement.scrollWidth-document.documentElement.clientWidth")
shot("audit_94_staff_approval.jpg")

# ===== REGISTER MODAL =====
logout()
goto("https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev/login")
time.sleep(1.2)
r=js("""(()=>{const b=[...document.querySelectorAll('button,a')].find(e=>/daftar|registrasi|register/i.test(e.textContent||'')); if(b){b.click();return (b.textContent||'').trim().slice(0,20)} return 'no'})()""")
report["register_open"]=r
time.sleep(1.2)
report["register_modal"]=js("""(()=>{const d=document.querySelector('[role=dialog]'); if(!d) return 'no-dialog';
  return {title:(d.querySelector('h2,h3')||{}).textContent, fields:[...d.querySelectorAll('input')].map(i=>({type:i.type,ph:i.placeholder}))}})()""")
shot("audit_94_register.jpg")
report["register_ovf"]=js("document.documentElement.scrollWidth-document.documentElement.clientWidth")
js("""(()=>{const d=document.querySelector('[role=dialog]'); if(d){const b=[...d.querySelectorAll('button')].find(e=>/batal|tutup/i.test(e.textContent||'')); if(b)b.click();} return 1})()""")
time.sleep(0.8)

# ===== dark persist =====
js("""(()=>{const b=[...document.querySelectorAll('button')].find(e=>/(gelap|dark)/i.test(e.textContent||'')); if(b){b.click();return 'ok'} return 'no'})()""")
time.sleep(0.8)
t1=js("document.documentElement.dataset.theme||'light'")
goto("https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev/login")
time.sleep(2.0)
t2=js("document.documentElement.dataset.theme||'light'")
report["dark_persist"]={"after_toggle":t1,"after_reload":t2}

json.dump(report,open(os.path.join(OUT,"final_audit_94h.json"),"w",encoding="utf-8"),indent=1,ensure_ascii=False)
print(json.dumps(report,ensure_ascii=False,indent=1)[:2000])
