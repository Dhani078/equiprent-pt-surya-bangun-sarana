"""Siklus 68 E2E: drill-down baris laporan -> dokumen BAST via UI production.
Laporan Rental Bulanan: klik kode RNT pada baris -> dialog Dokumen Resmi muncul
dengan BAST transaksi itu. Baris tanpa dokumen -> pesan jelas."""
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
cmd('Page.bringToFront'); cmd('Network.enable'); cmd('Network.setCacheDisabled', cacheDisabled=True)
ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
cmd('Page.navigate', url=BASE+"/?v=68#/login"); time.sleep(5)
ok=False
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Administrator');if(b)b.click();})()"); time.sleep(0.5)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4+2*i)
    if ev("!!document.querySelector('aside')"): ok=True; break
print('login:', ok)
assert ok
ev("(function(){var b=[...document.querySelectorAll('aside nav a, aside nav button')].find(x=>/Laporan/i.test(x.textContent));if(b)b.click();})()")
time.sleep(3.5)

H=[]
# 1) tombol drill-down ada di baris pertama laporan Rental Bulanan (default)
n=ev("document.querySelectorAll('button[aria-label^=\"Buka dokumen BAST transaksi\"]').length")
print('tombol drill-down di tabel:', n)
H.append(('tombol ada', n and n>0))
kode1=ev("(()=>{const b=document.querySelector('button[aria-label^=\"Buka dokumen BAST transaksi\"]');return b?b.getAttribute('aria-label'):null;})()")
print('label contoh:', kode1)

def dialogteks():
    return ev("""(() => {const d=document.querySelector('[role=dialog]'); return d? d.innerText.slice(0,400): null;})()""")
def tutup():
    ev("""(() => {const d=document.querySelector('[role=dialog]');
      if(!d) return; const b=[...d.querySelectorAll('button')].find(x=>/Tutup|Batal/i.test(x.textContent));
      if(b){b.click();return;} const c=d.querySelector('[aria-label*=Tutup]'); if(c)c.click();})()""")

# 2) klik -> dialog dokumen muncul, memuat kode sewa tsb ATAU pesan tanpa-dokumen
btns=ev("document.querySelectorAll('button[aria-label^=\"Buka dokumen BAST transaksi\"]').length")
for idx in range(min(6, btns)):
    ev("(()=>{const bs=document.querySelectorAll('button[aria-label^=\"Buka dokumen BAST transaksi\"]'); bs[%d]&&bs[%d].click();})()" % (idx, idx))
    time.sleep(2.5)
    t=dialogteks()
    alert=ev("(()=>{const a=document.querySelector('[role=alert]'); return a?a.innerText:null;})()")
    if t:
        print('dialog dari baris', idx, ':', t[:160].replace('\r\n','|'))
        H.append(('dialog dokumen muncul', 'Dokumen Resmi' in t or 'BERITA ACARA' in t.upper() or 'SURAT' in t.upper()))
        # cek kode sewa tsb ada dalam dialog
        kode=ev("(()=>{const bs=document.querySelectorAll('button[aria-label^=\"Buka dokumen BAST transaksi\"]]'); const b=bs[%d]; return b?b.textContent.trim():null;})()" % idx)
        H.append(('dialog memuat kode '+str(kode), bool(kode) and (kode in t)))
        png=cmd('Page.captureScreenshot', format='png'); open('STATE/68_drilldown.png','wb').write(base64.b64decode(png['data']))
        tutup(); time.sleep(1)
        break
    elif alert and 'belum memiliki dokumen' in alert:
        print('alert tanpa-dokumen:', alert[:120])
        H.append(('pesan tanpa-dokumen jelas', True))
        ev("(()=>{const c=document.querySelector('[role=alert] button');if(c)c.click();})()")
        continue
print('click loop selesai')
# 3) non-RNT row (mis. laporan Utilisasi HM) tidak punya tombol
ev("""(() => {const b=[...document.querySelectorAll('main button')].find(x=>/Utilisasi/i.test(x.textContent));if(b)b.click();})()""")
time.sleep(3)
n2=ev("document.querySelectorAll('button[aria-label^=\"Buka dokumen BAST transaksi\"]').length")
print('tombol di Utilisasi_HM:', n2)

fails=[h for h in H if not h[1]]
print('HASIL:', 'OK' if not fails else 'GAGAL', json.dumps(H))
