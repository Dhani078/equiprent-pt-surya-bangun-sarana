"""Siklus 70 E2E: antrean mutasi offline production.
1) admin login; 2) diputus -> tambah unit via form -> harus muncul pesan
antre + badge 'perubahan tertahan'; 3) dipulihkan -> flush otomatis -> unit
terkirim ke TiDB & tampil di tabel."""
import json, time, base64, urllib.request, websocket
BASE="https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
KODE="OFFQ-70-TEST"
NAMA="UJI ANTREAN OFFLINE 70"
def conn():
    tabs=json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
    page=next(t for t in tabs if t.get('type')=='page')
    ws=websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True, timeout=120); ws.settimeout(120)
    return ws
ws=conn(); _id=[0]
def cmd(m,**p):
    _id[0]+=1; ws.send(json.dumps({'id':_id[0],'method':m,'params':p}))
    while True:
        try: x=json.loads(ws.recv())
        except websocket.WebSocketTimeoutException: continue
        if x.get('id')==_id[0]: return x.get('result',{})
def ev(e):
    r=cmd('Runtime.evaluate',expression=e,awaitPromise=True,returnByValue=True)
    return r.get('result',{}).get('value')
cmd('Page.bringToFront'); cmd('Network.enable'); cmd('Network.setCacheDisabled', cacheDisabled=True)
cmd('Emulation.setFocusEmulationEnabled', enabled=True)
# bersihkan antrean lama
ev("localStorage.removeItem('sbs_mutasi_antrean'); 1")
ev("sessionStorage.clear(); 1")
cmd('Page.navigate', url=BASE+"/?v=70#/login"); time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Administrator');if(b)b.click();})()"); time.sleep(0.5)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4+2*i)
    if ev("!!document.querySelector('aside')"): break
print('login:', ev("!!document.querySelector('aside')"))
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Inventaris/i.test(x.textContent));if(b)b.click();})()")
time.sleep(3)

def isi_form():
    return ev("""(() => {
      const btn=[...document.querySelectorAll('button')].find(x=>/Tambah Alat Baru/.test(x.textContent));
      if(!btn) return 'NO-BTN';
      btn.click();
      return 'OK';
    })()""")
def set_input(label, val):
    return ev("""(() => {
      const d=document.querySelector('[role=dialog]'); if(!d) return 'NO-DIALOG';
      const els=[...d.querySelectorAll('input,select,textarea')];
      let target=null;
      for(const el of els){
        const lab=(el.getAttribute('aria-label')||'')+(el.placeholder||'')+
          (el.closest('div')?.querySelector('label')?.textContent||'');
        if(new RegExp(%s,'i').test(lab)){target=el;break;}
      }
      if(!target) return 'NF:'+els.length;
      const proto = target.tagName==='SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      const set=Object.getOwnPropertyDescriptor(proto,'value').set;
      set.call(target, %s);
      target.dispatchEvent(new Event('input',{bubbles:true}));
      target.dispatchEvent(new Event('change',{bubbles:true}));
      return 'OK';
    })()""" % (json.dumps(label), json.dumps(val)))
def submit():
    return ev("""(() => {
      const d=document.querySelector('[role=dialog]'); if(!d) return 'NO-DIALOG';
      const b=[...d.querySelectorAll('button')].find(x=>/Simpan|Tambah|Tampung/i.test(x.textContent.trim()));
      if(!b) return 'NO-SUBMIT:'+ [...d.querySelectorAll('button')].map(x=>x.textContent.trim()).join('|');
      b.click(); return 'CLICKED:'+b.textContent.trim();
    })()""")

print('buka form:', isi_form()); time.sleep(1.5)
set_input('Kode', KODE); set_input('Nama', NAMA)
print('isi kode/nama OK')
# PUTUSKAN JARINGAN
cmd('Network.emulateNetworkConditions', offline=True, latency=0, downloadThroughput=0, uploadThroughput=0)
print('submit saat offline:', submit())
time.sleep(3)
toast=ev("(() => {const t=document.querySelector('[role=status], [role=alert], [class*=toast]'); return [...document.querySelectorAll('div')].map(d=>d.textContent).filter(x=>/antrean|tertahan|Jaringan putus/.test(x||'')).slice(0,2);})()")
print('pesan antre:', json.dumps(toast, ensure_ascii=False)[:300])
badge=ev("(() => {const b=[...document.querySelectorAll('div')].find(x=>/perubahan tertahan/.test(x.textContent)&&x.children.length<=2); return b?b.textContent.trim():null;})()")
print('badge banner:', json.dumps(badge))
q=ev("JSON.parse(localStorage.getItem('sbs_mutasi_antrean')||'[]').length")
print('antrean localStorage:', q)
png=cmd('Page.captureScreenshot', format='png'); open('STATE/70_offline_queue.png','wb').write(base64.b64decode(png['data']))
# PULIHKAN
cmd('Network.emulateNetworkConditions', offline=False, latency=40, downloadThroughput=2*1094*1024, uploadThroughput=1024*1024)
ev("window.dispatchEvent(new Event('online')); 1")
time.sleep(6)
q2=ev("JSON.parse(localStorage.getItem('sbs_mutasi_antrean')||'[]').length")
print('antrean setelah pulih:', q2)
# cek via API (login luar)
req=urllib.request.Request(BASE+"/api/auth/login", data=json.dumps({"username":"admin","password":"admin"}).encode(), headers={"Content-Type":"application/json","User-Agent":"Mozilla/5.0"})
j=json.load(urllib.request.urlopen(req)); tok=j.get('token') or j.get('data',{}).get('token')
H={"X-SBS-Session":tok,"User-Agent":"Mozilla/5.0"}
arr=json.load(urllib.request.urlopen(urllib.request.Request(BASE+"/api/equipments", headers=H)))
arr=arr if isinstance(arr,list) else arr.get('data',[])
temu=[e for e in arr if e.get('equipment_code')==KODE]
print('unit di TiDB via API:', bool(temu), temu[0]['id'] if temu else '')
# dan tampil di tabel UI
nampak=ev("document.body.innerText.includes('%s')" % KODE)
print('terlihat di UI:', nampak)
# cleanup
if temu:
    urllib.request.urlopen(urllib.request.Request(BASE+"/api/equipments/"+str(temu[0]['id']), headers=H, method="DELETE")).read()
    print('cleanup OK')
print('KESIMPULAN:', 'OK' if (q and q>0 and q2==0 and temu) else 'CEK: q=%s q2=%s temu=%s' % (q,q2,bool(temu)))
