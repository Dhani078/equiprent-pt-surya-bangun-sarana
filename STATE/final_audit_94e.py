
# STATE/final_audit_94e.py — interaksi filter/tombol/modal sesudah login ADMIN
import json, time, os, urllib.request, websocket
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

def goto(u): send("Page.navigate",{"url":u}); time.sleep(2.2)
def set_vp(w,h):
    send("Emulation.setDeviceMetricsOverride",{"width":w,"height":h,"deviceScaleFactor":1,"mobile":w<500}); time.sleep(0.7)
def navto(label):
    r=js(f"""(()=>{{const b=[...document.querySelectorAll('aside button, nav button')].find(e=>(e.textContent||'').trim().includes('{label}')); if(!b) return 'MISSING'; b.click(); return 'ok'}})()""")
    time.sleep(1.6); return r

# login admin via UI
goto("https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev/login")
time.sleep(1.2)
js("""(()=>{const t=[...document.querySelectorAll('[role=tab]')].find(e=>(e.textContent||'').toLowerCase().includes('admin')); if(t)t.click(); return 1})()""")
time.sleep(0.5)
js("""(()=>{const ins=document.querySelectorAll('input'); ins[0].value='admin'; ins[0].dispatchEvent(new Event('input',{bubbles:true})); ins[1].value='admin'; ins[1].dispatchEvent(new Event('input',{bubbles:true})); return ins.length})()""")
time.sleep(0.4)
js("""(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim().toLowerCase().includes('masuk')); if(b){b.click();return 'ok'} return 'no'})()""")
time.sleep(4.0)
print("path after login:", js("location.pathname"), "sidebar:", js("!!document.querySelector('aside')"))

def probe(page):
    r=js("""(()=>{
      const ins=[...document.querySelectorAll('main input[type=search], main input[type=text]')].filter(i=>i.offsetParent!==null);
      const sels=[...document.querySelectorAll('main select')].filter(s=>s.offsetParent!==null);
      const btns=[...document.querySelectorAll('main button')].filter(b=>b.offsetParent!==null);
      return new Promise(res=>{
        const before=document.querySelectorAll('tbody tr').length;
        if(ins.length){
          const el=ins[0];
          el.value='ZZZZ_TIDAK_ADA'; el.dispatchEvent(new Event('input',{bubbles:true}));
        }
        setTimeout(()=>{
          const after=document.querySelectorAll('tbody tr').length;
          const empty=!!document.querySelector('[class*=empty i]');
          if(ins.length){ const el=ins[0]; el.value=''; el.dispatchEvent(new Event('input',{bubbles:true})); }
          setTimeout(()=>{
            const back=document.querySelectorAll('tbody tr').length;
            // select pertama dengan nilai
            const sel=sels.find(s=>s.options.length>1);
            let selResult=null;
            if(sel){
              const opts=[...sel.options].filter(o=>o.value);
              if(opts.length){
                sel.value=opts[0].value; sel.dispatchEvent(new Event('change',{bubbles:true}));
                setTimeout(()=>{
                  const afterSel=document.querySelectorAll('tbody tr').length;
                  sel.value=''; sel.dispatchEvent(new Event('change',{bubbles:true}));
                  setTimeout(()=>{
                    res({search_found:ins.length, rows_before:before, rows_after_fake:after, empty_state_shown:empty,
                          rows_after_reset:back, selects:sels.length, sel_changed:opts.length, rows_after_select:afterSel,
                          rows_after_sel_reset:document.querySelectorAll('tbody tr').length, buttons:btns.length});
                  },450);
                },550);
              } else res({search_found:ins.length, rows_before:before, rows_after_fake:after, empty_state_shown:empty, rows_after_reset:back, selects:sels.length, buttons:btns.length});
            } else res({search_found:ins.length, rows_before:before, rows_after_fake:after, empty_state_shown:empty, rows_after_reset:back, selects:sels.length, buttons:btns.length});
          },500);
        },600);
      });
    })()""")
    return r

def click_modal(page, keyword):
    r=js(f"""(()=>{{
      const btns=[...document.querySelectorAll('main button')].filter(b=>b.offsetParent!==null);
      const t=btns.find(b=>(b.textContent||'').trim().toLowerCase().includes('{keyword}') || (b.getAttribute('aria-label')||'').toLowerCase().includes('{keyword}'));
      if(!t) return {{clicked:null, total:btns.length}};
      const label=(t.textContent||t.getAttribute('aria-label')||'').trim().slice(0,26);
      t.click();
      return new Promise(res=>setTimeout(()=>{{
        const dlg=document.querySelector('[role=dialog]');
        res({{clicked:label, total:btns.length, modal:!!dlg, modal_title: dlg?(dlg.querySelector('h2,h3')||{{}}).textContent:null}});
      }},800));
    }})()""")
    return r

PAGES=["Dashboard Utama","Inventaris Alat Berat","Transaksi Penyewaan","Perawatan & Servis","Laporan & Dokumen","Manajemen Pengguna","Audit Trail"]
for page in PAGES:
    r=navto(page)
    set_vp(1280,800); time.sleep(0.9)
    p=probe(page) or {}
    log(page=page, vp="1280x800", nav=r, probe=p)

# klik modal non-destruktif per halaman
navto("Transaksi Penyewaan"); time.sleep(1.4)
log(page="Transaksi", modal_test=click_modal("Transaksi","selesai"))
navto("Laporan & Dokumen"); time.sleep(1.4)
log(page="Laporan", modal_test=click_modal("Laporan","buka dokumen"))
navto("Manajemen Pengguna"); time.sleep(1.4)
log(page="Users", modal_test=click_modal("Users","tambah"))
navto("Perawatan & Servis"); time.sleep(1.4)
log(page="Servis", modal_test=click_modal("Servis","jadwalkan"))

json.dump(report,open(os.path.join(OUT,"final_audit_94e.json"),"w",encoding="utf-8"),indent=1,ensure_ascii=False)
print("DONE")
