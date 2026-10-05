
# STATE/final_audit_94d.py — audit interaksi: filter, tombol, modal (3 role, desktop+mobile)
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
report={"interactions":[]}
def log(**kw): report["interactions"].append(kw); print(json.dumps(kw,ensure_ascii=False))

def set_vp(w,h):
    send("Emulation.setDeviceMetricsOverride",{"width":w,"height":h,"deviceScaleFactor":1,"mobile":w<500}); time.sleep(0.7)

def navto(label):
    r=js(f"""(()=>{{const b=[...document.querySelectorAll('aside button, nav button')].find(e=>(e.textContent||'').trim().includes('{label}')); if(!b) return 'MISSING'; b.click(); return 'ok'}})()""")
    time.sleep(1.6); return r

def try_filter(page, kind):
    # input cari pertama yang terlihat
    r=js("""(()=>{
      const ins=[...document.querySelectorAll('main input[type=search], main input[type=text]')].filter(i=>i.offsetParent!==null);
      if(!ins.length) return {found:0};
      const el=ins[0]; const before=document.querySelectorAll('tbody tr').length;
      el.value='ZZZZ_TIDAK_ADA'; el.dispatchEvent(new Event('input',{bubbles:true}));
      return new Promise(res=>setTimeout(()=>{const after=document.querySelectorAll('tbody tr').length;
        const empty=!!document.querySelector('[class*=empty i]');
        el.value=''; el.dispatchEvent(new Event('input',{bubbles:true}));
        setTimeout(()=>res({found:ins.length, before, after, empty, reset_back:document.querySelectorAll('tbody tr').length}),400);},500));
    })()""")
    return r

def try_select_first(page):
    r=js("""(()=>{
      const sels=[...document.querySelectorAll('main select')].filter(s=>s.offsetParent!==null);
      if(!sels.length) return {found:0};
      const sel=sels[0]; const before=document.querySelectorAll('tbody tr').length;
      const opts=[...sel.options].filter(o=>o.value);
      if(!opts.length) return {found:sels.length, changed:0};
      sel.value=opts[0].value; sel.dispatchEvent(new Event('change',{bubbles:true}));
      return new Promise(res=>setTimeout(()=>{const after=document.querySelectorAll('tbody tr').length;
        sel.value=''; sel.dispatchEvent(new Event('change',{bubbles:true}));
        setTimeout(()=>res({found:sels.length, before, after, opts:opts.length, reset_back:document.querySelectorAll('tbody tr').length}),400);},500));
    })()""")
    return r

def try_buttons(page):
    # klik tombol "Reset"/"Bersihkan" & tombol toolbar non-destruktif
    r=js("""(()=>{
      const btns=[...document.querySelectorAll('main button')].filter(b=>b.offsetParent!==null);
      const safe=['reset','bersihkan','tutup','batal','selesai','lihat bukti','pratinjau','tinjau'];
      const target=btns.find(b=>safe.some(s=>(b.textContent||'').trim().toLowerCase().includes(s)));
      if(!target) return {candidates:btns.length, clicked:null};
      const label=(target.textContent||'').trim().slice(0,20);
      target.click();
      return new Promise(res=>setTimeout(()=>{
        const modal=!!document.querySelector('[role=dialog]');
        res({candidates:btns.length, clicked:label, modal_opened:modal});
      },700));
    })()""")
    return r

# ============ ADMIN ============
print("current path:", js("location.pathname"))
for page in ["Dashboard Utama","Inventaris Alat Berat","Transaksi Penyewaan","Perawatan & Servis","Pelacakan GPS","Laporan & Dokumen","Manajemen Pengguna","Audit Trail"]:
    navto(page); time.sleep(1.2)
    for vp in [(1280,800),(390,844)]:
        set_vp(*vp); time.sleep(0.8)
        f=try_filter(page,"search") or {}
        s=try_select_first(page) or {}
        log(page=page, vp=f"{vp[0]}x{vp[1]}", search=f, select=s)
    # interaksi tombol desktop saja (aman)
    set_vp(1280,800); time.sleep(0.6)
    b=try_buttons(page) or {}
    log(page=page, vp="1280x800", buttons=b)

json.dump(report,open(os.path.join(OUT,"final_audit_94d.json"),"w",encoding="utf-8"),indent=1,ensure_ascii=False)
print("DONE")
