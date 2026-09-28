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
cmd('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=2, mobile=True)
cmd('Emulation.setFocusEmulationEnabled', enabled=True); time.sleep(1.2)
ST = "(() => ({open: document.querySelector('.app-sidebar').classList.contains('is-open'), backdrop: (()=>{const b=document.querySelector('.sidebar-backdrop'); return b?getComputedStyle(b).display:null})()}))()"
print('mulai:', json.dumps(ev(ST)))
ev("document.querySelector('.sidebar-hamburger').click()"); time.sleep(0.7)
print('klik hamburger:', json.dumps(ev(ST)))
print('backdrop box:', json.dumps(ev("(() => {const b=document.querySelector('.sidebar-backdrop'); if(!b) return null; const r=b.getBoundingClientRect(); return {x:Math.round(r.x),w:Math.round(r.width),h:Math.round(r.height),z:getComputedStyle(b).zIndex};})()")))
ev("(()=>{const b=document.querySelector('.sidebar-backdrop'); if(b) b.click();})()"); time.sleep(0.7)
print('klik backdrop:', json.dumps(ev(ST)))
ev("document.querySelector('.sidebar-hamburger').click()"); time.sleep(0.7)
ev("(()=>{const b=[...document.querySelectorAll('.app-sidebar nav button')].find(x=>/Laporan/i.test(x.textContent));if(b)b.click();})()"); time.sleep(2.5)
print('setelah pilih menu:', json.dumps(ev(ST)), '| judul:', ev("document.querySelector('main h1, main h2')?.textContent?.slice(0,18)"))
cmd('Emulation.setFocusEmulationEnabled', enabled=False); cmd('Emulation.clearDeviceMetricsOverride')
ws.close()
