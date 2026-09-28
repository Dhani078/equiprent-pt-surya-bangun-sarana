import json, time, base64, urllib.request, websocket
BASE="https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
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
cmd('Page.bringToFront'); cmd('Network.setCacheDisabled', cacheDisabled=True)
ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
cmd('Page.navigate', url=BASE+"/?v=68b#/login"); time.sleep(5)
ok=False
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Administrator');if(b)b.click();})()"); time.sleep(0.5)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4+2*i)
    if ev("!!document.querySelector('aside')"): ok=True; break
print('login:', ok)
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Laporan/i.test(x.textContent));if(b)b.click();})()")
time.sleep(3.5)

tok=ev("sessionStorage.getItem('sbs_session_token')")
print('token ada:', bool(tok))
# daftar kode sewa berdokumen via API dari dalam page (fetch pakai header)
berdoc=ev("""(async () => {
  const res=await fetch('/api/reports',{headers:{'X-SBS-Session':sessionStorage.getItem('sbs_session_token')||''}});
  const j=await res.json();
  const arr=Array.isArray(j)?j:(j.data||[]);
  return [...new Set(arr.filter(r=>r.rental_code && r.report_type!=='FINANCIAL_SUMMARY').map(r=>r.rental_code))];
})()""")
print('kode berdokumen:', len(berdoc or []), (berdoc or [])[:4])
klik=False
for kode in (berdoc or []):
    got=ev("""(() => {const b=document.querySelector('button[aria-label="Buka dokumen BAST transaksi %s"]'); if(b){b.click();return true;} return false;})()""" % kode)
    if got:
        print('klik:', kode); time.sleep(2.5); klik=True; break
print('ketemu baris berdokumen di tabel:', klik)
d=ev("(() => {const d=document.querySelector('[role=dialog]'); return d? d.innerText.slice(0,320): null;})()")
print('dialog:', (d or 'NONE').replace('\r\n','|')[:280])
kode_ok = d and berdoc and any(k in d for k in berdoc)
print('dialog memuat kode sewa:', bool(kode_ok))
png=cmd('Page.captureScreenshot', format='png'); open('STATE/68_drilldown.png','wb').write(base64.b64decode(png['data']))
ev("(()=>{const d=document.querySelector('[role=dialog]'); if(d){const b=[...d.querySelectorAll('button')].find(x=>/Tutup/i.test(x.textContent)); if(b)b.click();}})()"); time.sleep(1.2)
# pindah laporan Utilisasi HM -> kolom kode sewa hilang
tab=ev("(()=>{const b=[...document.querySelectorAll('main button')].find(x=>/Utilisasi/i.test(x.textContent));if(b){b.click();return b.textContent.trim();}return 'NF';})()")
time.sleep(3.5)
print('tab:', tab[:20], '| tombol drill:', ev("document.querySelectorAll('button[aria-label^=\"Buka dokumen BAST\"]').length"))
print('kolom2:', ev("[...document.querySelectorAll('.table-analytics table thead th')].slice(0,5).map(t=>t.textContent).join('|')"))
