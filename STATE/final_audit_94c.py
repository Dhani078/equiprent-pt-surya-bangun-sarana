
# STATE/final_audit_94c.py — staff + customer + interaksi tombol/filter
import json, time, os, urllib.request, websocket, base64
PORT=9222
OUT=r"C:\xampp\htdocs\PT. SURYA BANGUN SARANA BANJARMASIN\STATE"
def connect():
    tabs=json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json/list',timeout=5))
    tab=[t for t in tabs if t.get('type')=='page'][0]
    return websocket.create_connection(tab["webSocketDebuggerUrl"],suppress_origin=True,timeout=60)
ws=connect(); mid=[0]
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

def goto(u):
    send("Page.navigate",{"url":u}); time.sleep(2.2)

def set_vp(w,h):
    send("Emulation.setDeviceMetricsOverride",{"width":w,"height":h,"deviceScaleFactor":1,"mobile":w<500}); time.sleep(0.7)

EXTRACT = open(os.path.join(OUT,"final_audit_94b.py"),encoding="utf-8").read().split('EXTRACT = """')[1].split('"""')[0]

def audit(name, vp):
    set_vp(*vp); time.sleep(0.9)
    res=js(EXTRACT) or {}
    res["name"]=name; res["vp"]=f"{vp[0]}x{vp[1]}"
    report["pages"].append(res)
    print(json.dumps({"n":name,"vp":res["vp"],"ovf":res.get("overflow"),"wide":res.get("wide",[])[:2],"small":res.get("small",[])[:3],"rows":res.get("rows"),"btns":len(res.get("buttons",[])),"dead":res.get("deadimg"),"clip":res.get("clipped",[])[:3]},ensure_ascii=False))

report={"pages":[]}

def logout():
    js("""(()=>{const b=[...document.querySelectorAll('button')].find(e=>(e.textContent||'').trim().toLowerCase().startsWith('keluar')); if(b){b.click();return 'ok'} return 'no'})()""")
    time.sleep(1.6)
    js("sessionStorage.removeItem('sbs_session_token'); localStorage.removeItem('sbs_active_user'); return 1")
    goto("https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev/login")

def login_ui(role, user, pw):
    goto("https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev/login")
    time.sleep(1.0)
    js(f"""(()=>{{const t=[...document.querySelectorAll('[role=tab]')].find(e=>(e.textContent||'').toLowerCase().includes('{role}')); if(t)t.click(); return 1}})()""")
    time.sleep(0.5)
    js(f"""(()=>{{const ins=document.querySelectorAll('input'); ins[0].value='{user}'; ins[0].dispatchEvent(new Event('input',{{bubbles:true}})); ins[1].value='{pw}'; ins[1].dispatchEvent(new Event('input',{{bubbles:true}})); return ins.length}})()""")
    time.sleep(0.4)
    js("""(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim().toLowerCase().includes('masuk')); if(b){b.click();return 'ok'} return 'no'})()""")
    time.sleep(3.8)
    return js("location.pathname")

# ================= STAFF =================
print("LOGIN STAFF:", login_ui("staf","staff","staff"))
time.sleep(1.0)
# sub-tab staff
for sub in ["Verifikasi Pembayaran","Approval Booking","Kontrak Digital"]:
    r=js(f"""(()=>{{const t=[...document.querySelectorAll('[role=tab],aside button,main button')].find(e=>(e.textContent||'').trim().includes('{sub}')); if(t){{t.click();return 'ok'}} return 'MISSING'}})()""")
    time.sleep(1.4)
    audit("STAFF:"+sub,(1280,800)); audit("STAFF:"+sub,(390,844))

# ================= CUSTOMER =================
logout()
print("LOGIN CUSTOMER:", login_ui("pelanggan","user","user"))
time.sleep(1.5)
for sub in ["Katalog","Penyewaan Saya","Tagihan","Lacak Unit","Kontrak"]:
    r=js(f"""(()=>{{const t=[...document.querySelectorAll('nav button,[role=tab],main button')].find(e=>(e.textContent||'').trim().includes('{sub}')); if(t){{t.click();return 'ok'}} return 'MISSING'}})()""")
    time.sleep(1.4)
    audit("CUSTOMER:"+sub,(1280,800)); audit("CUSTOMER:"+sub,(390,844))

json.dump(report,open(os.path.join(OUT,"final_audit_94c.json"),"w",encoding="utf-8"),indent=1,ensure_ascii=False)
print("DONE", len(report["pages"]))
