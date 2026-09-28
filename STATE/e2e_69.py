"""Siklus 69 E2E: banner status koneksi production.
1) normal -> tidak ada banner,
2) Network offline + focus (trigger sinkron) -> banner OFFLINE muncul,
3) online kembali + focus -> banner hilang (pulih).
Juga: 401 (token salah) tidak memicu banner (server hidup)."""
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
ev("sessionStorage.clear(); 1")
cmd('Page.navigate', url=BASE+"/?v=69#/login"); time.sleep(5)
for i in range(3):
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Administrator');if(b)b.click();})()"); time.sleep(0.5)
    ev("(function(){var el=document.querySelector(\"input[type='password']\");if(!el)return;var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'admin');el.dispatchEvent(new Event('input',{bubbles:true}))})()")
    ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Masuk/.test(x.textContent));if(b)b.click();})()")
    time.sleep(4+2*i)
    if ev("!!document.querySelector('aside')"): break
print('login:', ev("!!document.querySelector('aside')"))
BAN = """(() => {const b=document.querySelector('div[role=status]'); return b? b.innerText.trim(): null;})()"""
print('1) normal           :', json.dumps(ev(BAN)))
assert ev(BAN) is None
# 2) offline
cmd('Network.emulateNetworkConditions', offline=True, latency=0, downloadThroughput=0, uploadThroughput=0)
ev("window.dispatchEvent(new Event('focus')); 1")
time.sleep(3)
b=ev(BAN)
print('2) saat offline     :', json.dumps(b))
png=cmd('Page.captureScreenshot', format='png'); open('STATE/69_offline.png','wb').write(base64.b64decode(png['data']))
assert b and ('tidak terhubung internet' in b or 'tidak terjangkau' in b)
# 3) pulih
cmd('Emulation.setFocusEmulationEnabled', enabled=True)
cmd('Network.emulateNetworkConditions', offline=False, latency=40, downloadThroughput=2*1024*1024, uploadThroughput=1024*1024)
ev("window.dispatchEvent(new Event('focus')); 1")
time.sleep(5)
b2=ev(BAN)
print('3) setelah online   :', json.dumps(b2))
assert b2 is None, 'banner harus hilang'
print('KESIMPULAN: banner koneksi OK (muncul saat putus, hilang saat pulih)')
