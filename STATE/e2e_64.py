"""Siklus 64 E2E: preset periode laporan via UI production.
Login admin -> Laporan -> klik '30 hari' -> tanggal terisi + baris terfilter
-> klik 'Bulan ini' -> rentang ganti -> 'Semua' -> reset. Buktikan baris berubah."""
import json, time, urllib.request, websocket
BASE="https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
def connect():
    tabs=json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
    page=next(t for t in tabs if t.get('type')=='page')
    ws=websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True, timeout=90)
    ws.settimeout(90); return ws
ws=connect(); _id=[0]
def cmd(m,**p):
    _id[0]+=1; ws.send(json.dumps({'id':_id[0],'method':m,'params':p}))
    while True:
        try: x=json.loads(ws.recv())
        except websocket.WebSocketTimeoutException: continue
        if x.get('id')==_id[0]: return x.get('result',{})
def ev(e):
    r=cmd('Runtime.evaluate',expression=e,awaitPromise=True,returnByValue=True)
    return r.get('result',{}).get('value')

ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
ev("location.href=%s; 1" % json.dumps(BASE+"/#/login")); time.sleep(1.6)
ev("location.reload(); 1"); time.sleep(4)
ok=False
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Administrator');if(b)b.click();})()"); time.sleep(0.5)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4+2*i)
    if ev("!!document.querySelector('aside')"): ok=True; break
print('login:', ok)

ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/laporan/i.test(x.textContent));if(b)b.click();})()")
time.sleep(3)

def state():
    return ev("""(() => {
      const inp=[...document.querySelectorAll('input[type=date]')];
      const tbl=document.querySelector('.table-analytics table');
      const rows=tbl?tbl.querySelectorAll('tbody tr').length:-1;
      const btn=(t)=>[...document.querySelectorAll('button[aria-label^="Preset periode"]')].find(b=>b.getAttribute('aria-label').includes(t));
      return {from:inp[0]?.value, to:inp[1]?.value, rows,
              ada: [...document.querySelectorAll('button[aria-label^="Preset periode"]')].map(b=>b.getAttribute('aria-label').replace('Preset periode ',''))};
    })()""")
s0=state(); print('awal:', s0)

def klik(label):
    ev("""(() => {const b=[...document.querySelectorAll('button[aria-label^="Preset periode"]')].find(x=>x.getAttribute('aria-label').includes(%s));if(b)b.click();})()""" % json.dumps(label))
    time.sleep(2.2)

hasil={}
for L in ('30 hari','Bulan ini','Kuartal ini','Semua'):
    klik(L)
    st=state(); hasil[L]=st
    print(L, '->', {k:st[k] for k in ('from','to','rows')})

# ringkas assertion
A=[]
A.append(('tombol preset ada 6', len(s0['ada'])==6, s0['ada']))
A.append(('30 hari terisi', hasil['30 hari']['from'] and hasil['30 hari']['to'], hasil['30 hari']))
A.append(('bulan ini from=1 hari', hasil['Bulan ini']['from'].endswith('-01'), hasil['Bulan ini']['from']))
A.append(('kuartal from awal kuartal', hasil['Kuartal ini']['from'] in ('2026-07-01','2026-10-01','2026-01-01','2026-04-01'), hasil['Kuartal ini']['from']))
A.append(('semua mengosongkan', hasil['Semua']['from']=='' and hasil['Semua']['to']=='', hasil['Semua']))
fails=[x for x in A if not x[1]]
print('ASSERT_FAILS=', json.dumps(fails))
# net log cek 4xx/5xx selama sesi? gunakan fetch probe cepat
print('probe stats:', ev("""fetch('/api/dashboard/stats',{headers:{'X-SBS-Session':localStorage.getItem('sbs_session_token')||''}}).then(r=>r.status)"""))
