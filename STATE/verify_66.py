import json, time, base64, urllib.request, websocket
BASE="https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
def conn():
    tabs=json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
    page=next(t for t in tabs if t.get('type')=='page')
    ws=websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True, timeout=150); ws.settimeout(150)
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
cmd('Page.navigate', url=BASE+"/#/login"); time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Administrator');if(b)b.click();})()"); time.sleep(0.5)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4+2*i)
    if ev("!!document.querySelector('aside')"): break
print('login:', ev("!!document.querySelector('aside')"))

CEK = """(() => {
  const de=document.scrollingElement||document.documentElement;
  const aside=document.querySelector('.app-sidebar');
  const cs=aside?getComputedStyle(aside):null;
  const burger=document.querySelector('.sidebar-hamburger');
  const chip=document.querySelector('.navbar-role-chip');
  const uname=document.querySelector('.navbar-username');
  const brand=document.querySelector('.navbar-company');
  return {innerW:innerWidth, overflowX: de.scrollWidth-innerWidth,
    asidePos: cs?cs.position:null, asideTransform: cs?cs.transform:null,
    burgerDisplay: burger?getComputedStyle(burger).display:null,
    chipDisplay: chip?getComputedStyle(chip).display:null,
    unameDisplay: uname?getComputedStyle(uname).display:null,
    brandFont: brand?getComputedStyle(brand).fontSize:null};
})()"""

def emul(w,h,mobile):
    cmd('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=2 if mobile else 1, mobile=mobile)
    cmd('Emulation.setFocusEmulationEnabled', enabled=True); time.sleep(1.5)

emul(390,844,True)
print('HP-390:', json.dumps(ev(CEK)))
png=cmd('Page.captureScreenshot', format='png'); open('STATE/66_hp_tertutup.png','wb').write(base64.b64decode(png['data']))
# buka drawer lewat hamburger
ev("(()=>{const b=document.querySelector('.sidebar-hamburger'); if(b) b.click();})()"); time.sleep(0.8)
drawer=ev("""(() => {
  const aside=document.querySelector('.app-sidebar');
  const cs=getComputedStyle(aside);
  const bd=document.querySelector('.sidebar-backdrop');
  return {isOpen: aside.classList.contains('is-open'), transform: cs.transform,
    left: aside.getBoundingClientRect().left, width: aside.getBoundingClientRect().width,
    backdrop: bd?getComputedStyle(bd).display:null};
})()""")
print('HP drawer terbuka:', json.dumps(drawer))
png=cmd('Page.captureScreenshot', format='png'); open('STATE/66_hp_drawer.png','wb').write(base64.b64decode(png['data']))
# pilih menu di drawer -> tertutup lagi, konten pindah
ev("(()=>{const b=[...document.querySelectorAll('.app-sidebar nav button')].find(x=>/Transaksi/i.test(x.textContent));if(b)b.click();})()"); time.sleep(2.5)
print('setelah pilih menu:', json.dumps(ev("""(() => {
  const aside=document.querySelector('.app-sidebar');
  return {open: aside.classList.contains('is-open'), judul: document.querySelector('main h1, main h2')?.textContent?.slice(0,24), overflowX: (document.scrollingElement||document.documentElement).scrollWidth-innerWidth};
})()""")))
# tablet & PC
emul(768,1024,False)
print('Tablet-768:', json.dumps(ev(CEK)))
emul(1280,800,False)
print('PC-1280:', json.dumps(ev(CEK)))
png=cmd('Page.captureScreenshot', format='png'); open('STATE/66_pc.png','wb').write(base64.b64decode(png['data']))
cmd('Emulation.setFocusEmulationEnabled', enabled=False); cmd('Emulation.clearDeviceMetricsOverride')
ws.close(); print('selesai')
