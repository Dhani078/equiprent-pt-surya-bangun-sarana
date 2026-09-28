"""Siklus 87 verifikasi: modal daftar akses Login setelah dipisah."""
import json, time, urllib.request, websocket

B = "https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev"
tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
page = next(t for t in tabs if t.get("type") == "page")
ws = websocket.create_connection(page["webSocketDebuggerUrl"], suppress_origin=True, timeout=120)
_id = [0]
def cmd(m, **p):
    _id[0] += 1
    ws.send(json.dumps({"id": _id[0], "method": m, "params": p}))
    while True:
        try: x = json.loads(ws.recv())
        except Exception: continue
        if x.get("id") == _id[0]: return x.get("result", {})
def ev(e):
    return cmd("Runtime.evaluate", expression=e, awaitPromise=True, returnByValue=True).get("result", {}).get("value")

cmd("Page.bringToFront"); cmd("Network.enable")
cmd("Network.setCacheDisabled", cacheDisabled=True)
ev("sessionStorage.clear(); localStorage.removeItem('sbs_session_token'); 1")
cmd("Page.navigate", url=B + "/?v=87#/login")
time.sleep(5)
print("A. halaman login render:", ev("""(()=>({masuk:/Masuk/.test(document.body.innerText),
 peran:[...document.querySelectorAll('button')].filter(x=>/Administrator|Staf|Pelanggan/.test(x.textContent)&&x.closest('form,[role=tabs],[class*=card]')).length>0}))()"""))
print("B. klik daftar:", ev("""(()=>{
const b=[...document.querySelectorAll('button')].find(x=>/Daftar|Permintaan Akses|Ajukan Akses/i.test(x.textContent));
if(!b)return 'no btn';b.click();return 'ok';})()"""))
time.sleep(1.5)
print("C. modal daftar:", ev("""(()=>{
const m=[...document.querySelectorAll('div')].find(x=>x.style.position==='fixed'&&/PT\\. SURYA BANGUN SARANA/.test(x.textContent));
if(!m)return 'tidak ada';
return {judul:/Pengajuan|Akses Mandiri|Daftar/i.test(m.textContent), field:[...m.querySelectorAll('input')].length,
 select:[...m.querySelectorAll('select')].length, hotline:/Hotline/.test(m.textContent)};})()"""))
print("D. isi & ajukan:", ev("""(()=>{
const m=[...document.querySelectorAll('div')].find(x=>x.style.position==='fixed'&&/PT\\. SURYA BANGUN SARANA/.test(x.textContent));
if(!m)return 'no modal';
const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
const ins=[...m.querySelectorAll('input')];
s.call(ins[0],'Tester Siklus 87');ins[0].dispatchEvent(new Event('input',{bubbles:true}));
s.call(ins[1],'PT Uji');ins[1].dispatchEvent(new Event('input',{bubbles:true}));
s.call(ins[2],'08115009999');ins[2].dispatchEvent(new Event('input',{bubbles:true}));
const b=[...m.querySelectorAll('button')].find(x=>/Ajukan Akses/.test(x.textContent));b.click();return 'ok';})()"""))
time.sleep(1.5)
print("E. toast sukses:", ev("""(()=>{
const m=[...document.querySelectorAll('div')].find(x=>x.style.position==='fixed'&&/PT\\. SURYA BANGUN SARANA/.test(x.textContent));
if(!m)return 'modal hilang';
return /Pengajuan Akses Berhasil Dikirim/.test(m.textContent);})()"""))
time.sleep(3.5)
print("F. auto-close:", ev("[...document.querySelectorAll('div')].filter(x=>x.style.position==='fixed'&&x.textContent.includes('PT. SURYA BANGUN SARANA BANJARMASIN')&&/Ajukan Akses|Berhasil/.test(x.textContent)).length"))
print("G. overflow:", ev("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
