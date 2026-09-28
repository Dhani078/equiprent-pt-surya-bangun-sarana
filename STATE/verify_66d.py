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
cmd('Page.bringToFront')
OVER = "(() => {const de=document.scrollingElement||document.documentElement; return de.scrollWidth-innerWidth;})()"
PAGES = """(() => [...document.querySelectorAll('.app-sidebar nav button')].map(b=>b.textContent.trim()))()"""
def sweep(w,h,mb,label):
    cmd('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=2 if mb else 1, mobile=mb)
    cmd('Emulation.setFocusEmulationEnabled', enabled=True); time.sleep(1.2)
    menus=ev(PAGES)
    bad={}
    for m in menus:
        ev("(()=>{const b=[...document.querySelectorAll('.app-sidebar nav button')].find(x=>x.textContent.trim()===%s);if(b)b.click();})()" % json.dumps(m))
        time.sleep(2.2)
        o=ev(OVER)
        if o>0: bad[m]=o
    print(label, 'overflow per halaman:', json.dumps(bad) if bad else 'BERSIH semua', '| total halaman dicek:', len(menus))
sweep(390,844,True,'HP-390')
sweep(1280,800,False,'PC-1280')
cmd('Emulation.setFocusEmulationEnabled', enabled=False); cmd('Emulation.clearDeviceMetricsOverride')
ws.close()
