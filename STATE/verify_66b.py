import json, time, urllib.request, websocket
BASE="https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
def conn():
    tabs=json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
    page=next(t for t in tabs if t.get('type')=='page')
    ws=websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True, timeout=150); ws.settimeout(150)
    return ws
ws=conn(); _id=[0]
def cmd(m,**p):
    global ws
    _id[0]+=1; ws.send(json.dumps({'id':_id[0],'method':m,'params':p}))
    while True:
        try: x=json.loads(ws.recv())
        except websocket.WebSocketTimeoutException: continue
        except websocket.WebSocketConnectionClosedException:
            ws=conn(); _id[0]+=1; ws.send(json.dumps({'id':_id[0],'method':m,'params':p})); continue
        if x.get('id')==_id[0]: return x.get('result',{})
def ev(e):
    r=cmd('Runtime.evaluate',expression=e,awaitPromise=True,returnByValue=True)
    return r.get('result',{}).get('value')
cmd('Page.bringToFront'); cmd('Network.enable'); cmd('Network.setCacheDisabled', cacheDisabled=True)
cmd('Page.navigate', url=BASE+"/?v=66c#/login"); time.sleep(5)
cmd('Page.reload', ignoreCache=True); time.sleep(5)
print('bundle:', ev("[...document.querySelectorAll('script[src]')].map(s=>s.src.split('/').pop())[0]"))
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Administrator');if(b)b.click();})()"); time.sleep(0.5)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4+2*i)
    if ev("!!document.querySelector('aside')"): break
print('login:', ev("!!document.querySelector('aside')"))
CEK = """(() => {
  const de=document.scrollingElement||document.documentElement;
  const sb=document.querySelector('.app-sidebar');
  const cs=sb?getComputedStyle(sb):null;
  const burger=document.querySelector('.sidebar-hamburger');
  const chip=document.querySelector('.navbar-role-chip');
  const uname=document.querySelector('.navbar-username');
  return {innerW:innerWidth, docOverflow: de.scrollWidth-innerWidth,
    asidePos: cs?cs.position:'-', transform: cs?cs.transform:'-',
    burger: burger?getComputedStyle(burger).display:'-',
    chip: chip?getComputedStyle(chip).display:'-', uname: uname?getComputedStyle(uname).display:'-'};
})()"""
for (w,h,mb,lab) in [(390,844,True,'HP-390'),(768,1024,False,'Tablet-768'),(1280,800,False,'PC-1280')]:
    cmd('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=2 if mb else 1, mobile=mb)
    cmd('Emulation.setFocusEmulationEnabled', enabled=True); time.sleep(1.5)
    print(lab, json.dumps(ev(CEK)))
for (w,h,mb,lab) in [(768,1024,False,'Transaksi-Tablet'),(1280,800,False,'Transaksi-PC'),(390,844,True,'Transaksi-HP')]:
    cmd('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=2 if mb else 1, mobile=mb); time.sleep(1.2)
    ev("(()=>{var b=[...document.querySelectorAll('.app-sidebar nav button')].find(x=>/Transaksi/i.test(x.textContent));if(b)b.click();})()"); time.sleep(3)
    print(lab, json.dumps(ev(CEK)))
cmd('Emulation.setFocusEmulationEnabled', enabled=False); cmd('Emulation.clearDeviceMetricsOverride')
ws.close(); print('selesai')
