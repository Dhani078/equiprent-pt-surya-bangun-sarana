
# STATE/final_audit_94b.py — audit final tata letak & interaksi (admin, staff, customer)
import json, subprocess, time, os, urllib.request, sys, websocket, base64
PORT=9222
BASE="https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
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
def set_vp(w,h):
    send("Emulation.setDeviceMetricsOverride",{"width":w,"height":h,"deviceScaleFactor":1,"mobile":w<500})
    time.sleep(0.8)

EXTRACT = """(()=>{
  const out={};
  out.url=location.pathname;
  out.vw=document.documentElement.clientWidth;
  out.overflow=Math.max(0, document.documentElement.scrollWidth-document.documentElement.clientWidth);
  out.wide=[];
  document.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();
    if(r.width>out.vw+1&&r.width>0&&r.width<4000){const cls=(typeof e.className==='string'?e.className:'').split(' ')[0]; out.wide.push(e.tagName+'.'+cls+'='+Math.round(r.width));}});
  out.wide=[...new Set(out.wide)].slice(0,5);
  out.small=[];
  if(out.vw<500) document.querySelectorAll('button,a,[role=tab],input,select,textarea').forEach(e=>{const r=e.getBoundingClientRect();
    if(r.width>0&&r.height>0&&(r.width<44||r.height<44)) out.small.push(e.tagName+':'+((e.textContent||e.placeholder||e.getAttribute('aria-label')||'').trim().slice(0,22))+' '+Math.round(r.width)+'x'+Math.round(r.height));});
  out.small=out.small.slice(0,10);
  out.buttons=[...document.querySelectorAll('button')].map(b=>(b.textContent||'').trim().slice(0,18)||b.getAttribute('aria-label')||'[icon]').slice(0,40);
  out.filters=[...document.querySelectorAll('input[type=search],input[type=text],select,[role=tab],[class*=filter i] button,[class*=toolbar i] button')].map(e=>(e.placeholder||e.textContent||e.getAttribute('aria-label')||e.tagName).trim().slice(0,24));
  out.rows=document.querySelectorAll('tbody tr').length;
  out.cards=document.querySelectorAll('[class*=card i]').length;
  out.imgs=document.querySelectorAll('img').length;
  out.deadimg=[...document.querySelectorAll('img')].filter(i=>i.complete&&i.naturalWidth===0).length;
  out.headings=[...document.querySelectorAll('h1,h2,h3')].map(h=>h.textContent.trim().slice(0,40)).slice(0,4);
  // teks terpotong
  out.clipped=[];
  document.querySelectorAll('td,th,button,[class*=badge i]').forEach(e=>{ if(e.scrollWidth>e.clientWidth+3&&e.children.length===0) out.clipped.push((e.textContent||'').trim().slice(0,34)); });
  out.clipped=[...new Set(out.clipped)].slice(0,6);
  // elemen tumpang tindih (overlap kasar di main)
  out.overlap=[];
  const els=[...document.querySelectorAll('main button, main [class*=card i], main table')].slice(0,60);
  for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i].getBoundingClientRect(),b=els[j].getBoundingClientRect();
    if(a.width>0&&b.width>0&&a.left<b.right-2&&b.left<a.right-2&&a.top<b.bottom-2&&b.top<a.bottom-2&&!els[i].contains(els[j])&&!els[j].contains(els[i])){
      out.overlap.push(((els[i].textContent||'').trim().slice(0,14))+' <> '+((els[j].textContent||'').trim().slice(0,14))); if(out.overlap.length>4)break;}}
  return out;
})()"""

def shot(name):
    r=send("Page.captureScreenshot",{"format":"jpeg","quality":72})
    open(os.path.join(OUT,name),"wb").write(base64.b64decode(r["data"]))

report={"pages":[],"start":time.strftime("%F %T")}
def audit(name, vp, do_shot=False):
    set_vp(*vp); time.sleep(1.0)
    res=js(EXTRACT) or {}
    res["name"]=name; res["vp"]=f"{vp[0]}x{vp[1]}"
    report["pages"].append(res)
    print(json.dumps({"n":name,"vp":res["vp"],"ovf":res.get("overflow"),"wide":res.get("wide",[])[:3],"small_n":len(res.get("small",[])),"small":res.get("small",[])[:4],"rows":res.get("rows"),"btns":len(res.get("buttons",[])),"deadimg":res.get("deadimg"),"clip":res.get("clipped",[])[:3],"ovl":res.get("overlap",[])[:3],"head":res.get("headings",[])[:2]},ensure_ascii=False))
    if do_shot: shot(name+".jpg")

def navto(label):
    r=js(f"""(()=>{{const b=[...document.querySelectorAll('aside button, nav button')].find(e=>(e.textContent||'').trim().includes('{label}')); if(!b) return 'MISSING'; b.click(); return 'ok'}})()""")
    time.sleep(1.8); return r

def set_session(token, role_label):
    js(f"sessionStorage.setItem('sbs_session_token','{token}')")
    js(f"""(()=>{{try{{localStorage.setItem('sbs_active_user','{role_label}')}}catch(e){{}}}})()""")

# ============ ADMIN ============
NAV_ADMIN=["Dashboard Utama","Inventaris Alat Berat","Transaksi Penyewaan","Perawatan & Servis","Pelacakan GPS","Laporan & Dokumen","Manajemen Pengguna","Audit Trail","Pengaturan Sistem"]
for label in NAV_ADMIN:
    r=navto(label)
    audit("ADMIN:"+label, (1280,800))
    audit("ADMIN:"+label, (390,844), do_shot=True)
    # sub-tab Kontrak Digital
    if label=="Transaksi Penyewaan":
        js("""(()=>{const t=[...document.querySelectorAll('[role=tab]')].find(e=>(e.textContent||'').includes('Kontrak')); if(t)t.click(); return 1})()""")
        time.sleep(1.5)
        audit("ADMIN:Kontrak Digital", (1280,800))
        audit("ADMIN:Kontrak Digital", (390,844), do_shot=True)

json.dump(report,open(os.path.join(OUT,"final_audit_94b.json"),"w",encoding="utf-8"),indent=1,ensure_ascii=False)
print("DONE_ADMIN_PAGES", len(report["pages"]))
