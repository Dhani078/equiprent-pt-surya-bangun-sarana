import json, time, urllib.request, websocket
BASE="https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
def conn():
    tabs=json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
    page=next(t for t in tabs if t.get('type')=='page')
    ws=websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True, timeout=90); ws.settimeout(90)
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
cmd('Page.navigate', url=BASE+"/?v=67d#/login"); time.sleep(5)
cmd('Page.reload', ignoreCache=True); time.sleep(5)
# role customer
ev("sessionStorage.clear(); 1"); cmd('Page.navigate', url=BASE+"/#/login"); time.sleep(4)
ok=False
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Staf');if(b)b.click();})()"); time.sleep(0.5)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'staff');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4+2*i)
    if ev("!!document.querySelector('aside')"): ok=True; break
print('login customer:', ok)
OVER = "(() => {const de=document.scrollingElement||document.documentElement; return de.scrollWidth-innerWidth;})()"
SMALL = """(() => {
  let n=0; const worst=[];
  document.querySelectorAll('main button, header button').forEach(b=>{
    const r=b.getBoundingClientRect(); if(r.width===0) return;
    if(r.height < 44 || r.width < 32){ n++; worst.push((b.getAttribute('aria-label')||b.textContent.trim().slice(0,18))+':'+Math.round(r.height)+'x'+Math.round(r.width)); }
  });
  return {n, worst: worst.slice(0,6)};
})()"""
cmd('Emulation.setDeviceMetricsOverride', width=360, height=640, deviceScaleFactor=2, mobile=True)
cmd('Emulation.setFocusEmulationEnabled', enabled=True)
menus=ev("[...document.querySelectorAll('.app-sidebar nav button')].map(b=>b.textContent.trim())")
bad={}
for m in menus:
    ev("(()=>{const b=[...document.querySelectorAll('.app-sidebar nav button')].find(x=>x.textContent.trim()===%s);if(b)b.click();})()" % json.dumps(m))
    time.sleep(2.2)
    o=ev(OVER)
    if o>0: bad[m]=o
    s=ev(SMALL)
    if s['n']>0: print('  halaman', m, '->', s['n'], 'target kecil:', s['worst'])
print('Customer 360:', 'overflow:', json.dumps(bad) if bad else 'BERSIH', '| halaman:', len(menus))
cmd('Emulation.setFocusEmulationEnabled', enabled=False); cmd('Emulation.clearDeviceMetricsOverride')
ws.close()
