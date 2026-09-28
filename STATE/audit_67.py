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
cmd('Page.navigate', url=BASE+"/?v=67c#/login"); time.sleep(5)
cmd('Page.reload', ignoreCache=True); time.sleep(5)

OVER = "(() => {const de=document.scrollingElement||document.documentElement; return de.scrollWidth-innerWidth;})()"
SMALL = """(() => {
  const bad={};
  document.querySelectorAll('main button, header button').forEach(b=>{
    const r=b.getBoundingClientRect();
    if(r.width===0) return;
    if(r.height < 44 || r.width < 32){
      const key=(b.getAttribute('aria-label')||b.textContent.trim().slice(0,22)||b.className||'btn');
      const h=Math.round(r.height), w=Math.round(r.width);
      if(!bad[key] || bad[key].h>h) bad[key]={h,w};
    }
  });
  return bad;
})()"""

def sweep(w,h,label):
    cmd('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=2, mobile=True)
    cmd('Emulation.setFocusEmulationEnabled', enabled=True); time.sleep(1.2)
    menus=ev("[...document.querySelectorAll('.app-sidebar nav button')].map(b=>b.textContent.trim())")
    overflow={}
    smallest={}
    for m in menus:
        ev("(()=>{const b=[...document.querySelectorAll('.app-sidebar nav button')].find(x=>x.textContent.trim()===%s);if(b)b.click();})()" % json.dumps(m))
        time.sleep(2.2)
        o=ev(OVER)
        if o>0: overflow[m]=o
        sm=ev(SMALL) or {}
        for k,v in sm.items():
            if k not in smallest or v['h']<smallest[k]['h']: smallest[k]=v
    print(label, '| overflow:', json.dumps(overflow) if overflow else 'BERSIH',
          '| tombol<44px:', len(smallest), json.dumps(dict(list(smallest.items())[:12]), ensure_ascii=False)[:900])
cmd('Page.navigate', url=BASE+"/#/login"); time.sleep(4.5)
ok=False
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Administrator');if(b)b.click();})()"); time.sleep(0.5)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4+2*i)
    if ev("!!document.querySelector('aside')"): ok=True; break
print('login admin:', ok)
sweep(360,640,'Android-kecil 360')
sweep(320,568,'iPhone-SE 320')
cmd('Emulation.setFocusEmulationEnabled', enabled=False); cmd('Emulation.clearDeviceMetricsOverride')
ws.close()
