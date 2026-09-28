# -*- coding: utf-8 -*-
"""Tambal STATE/e2e_bisnis.py: modal tanggal, alur bukti transfer, cleanup DELETE."""
import io

p = 'STATE/e2e_bisnis.py'
s = io.open(p, encoding='utf-8', newline='').read()
s = s.replace('\r\n', '\n')

# ---- 2) booking: klik Ajukan Sewa -> modal berisi 2 input date ----
old2 = """r = ev("(function(){var all=[...document.querySelectorAll('div,li,tr')];var card=all.find(x=>x.textContent.includes(%s));if(!card)return 'CARD-NF';var b=[...card.querySelectorAll('button')].find(x=>/Ajukan Sewa/.test(x.textContent));if(!b)return 'BTN-NF';b.click();return 'OK';})()" % json.dumps(NAME))"""
assert s.count(old2) == 1, 'anchor2'
new2 = """def klik_ajukan():
    return ev("(function(){var cards=[...document.querySelectorAll('.card-premium')];var c=cards.find(x=>x.textContent.includes(%s));if(!c)return 'CARD-NF';var b=[...c.querySelectorAll('button')].find(x=>/Ajukan Sewa/.test(x.textContent));if(!b)return 'BTN-NF';b.click();return 'OK';})()" % json.dumps(NAME))
r = klik_ajukan()
if r in ('CARD-NF', 'BTN-NF'):
    set_val("Nama, kode", NAME)
    time.sleep(1.2)
    r = klik_ajukan()"""
s = s.replace(old2, new2)
# buang fallback lama (setelah blok atas)
old2b = """log("Ajukan Sewa:", r)
if r != "OK":
    set_val("Nama, kode", NAME)
    time.sleep(1)
    r = ev("(function(){var b=[...document.querySelectorAll('button')].find(x=>/Ajukan Sewa/.test(x.textContent));if(!b)return 'NF2';b.click();return 'OK';})()")
    log("Ajukan Sewa (search):", r)
time.sleep(1)"""
assert s.count(old2b) == 1, 'anchor2b'
s = s.replace(old2b, """log("Ajukan Sewa:", r)
time.sleep(1.2)""")

# tanggal: modal booking = 2 input date di [role=dialog]
old2c = """log("tgl:", ev("(function(){var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;var ds=[...document.querySelectorAll('input[type=" + SQ + "date" + SQ + "]')];set.call(ds[0],'2026-10-02');ds[0].dispatchEvent(new Event('input',{bubbles:true}));set.call(ds[1],'2026-10-05');ds[1].dispatchEvent(new Event('input',{bubbles:true}));return ds.length;})()"))"""
assert s.count(old2c) == 1, 'anchor2c'
new2c = """log("tgl:", ev("(function(){var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;var ds=[...document.querySelectorAll('input[type=\\\\'date\\\\']')];if(ds.length<2)return 'NODATE';set.call(ds[0],'2026-10-02');ds[0].dispatchEvent(new Event('input',{bubbles:true}));set.call(ds[1],'2026-10-05');ds[1].dispatchEvent(new Event('input',{bubbles:true}));return ds.length;})()"))"""
s = s.replace(old2c, new2c)

# ---- 6) bukti transfer: TIDAK ada input file — modal = text field nama berkas ----
old6 = """    assert nav_click("Pembayaran")
    log("buka form bukti:", click_btn("(x.getAttribute('aria-label')||'').includes('Kirim bukti pembayaran')", 1.5))"""
assert s.count(old6) == 1, 'anchor6'
new6 = """    assert nav_click("Pembayaran")
    ALP = json.dumps("Unggah bukti transfer " + pay["payment_code"])
    log("buka modal bukti:", click_btn("x.getAttribute('aria-label')==="+ALP, 1.2))"""
s = s.replace(old6, new6)

old6b = """    b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=="
    fs = ev("(function(){var bin=atob(%s);var u8=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);var dt=new DataTransfer();dt.items.add(new File([u8],'bukti-e2e-61.png','image/png'));var inp=document.querySelector('input[type=" + SQ + "file" + SQ + "]');if(!inp)return 'INPUT-NF';inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}));return 'FILE-SET';})()" % json.dumps(b64))
    log("file:", fs)
    log("kirim:", click_btn("x.type==='submit'&&/Kirim|Unggah/.test(x.textContent)||/Kirim Bukti/.test(x.textContent)", 3))"""
assert s.count(old6b) == 1, 'anchor6b'
new6b = """    log("nama berkas:", set_val("Nama berkas bukti transfer", "bukti-transfer-e2e-61.png"))
    log("kirim:", click_btn("(x.getAttribute('aria-label')||'')==='Kirim bukti pembayaran untuk diverifikasi'", 3))"""
s = s.replace(old6b, new6b)

# ---- cleanup pakai DELETE routes baru (admin) ----
old9 = """tok = admin_token()
log("del payment:", api("DELETE", "/payments/%d" % pay["id"], tok=tok)[0] if pay else "-")
log("del contract:", api("DELETE", "/contracts/%d" % con["id"], tok=tok)[0])
log("del rental:", api("DELETE", "/rentals/%d" % my_rent["id"], tok=tok)[0])
log("del equipment:", api("DELETE", "/equipments/%d" % EQ_ID, tok=tok)[0])"""
assert s.count(old9) == 1, 'anchor9'
new9 = """tok = admin_token()
pay_ids = [x["id"] for x in get_coll("payments") if x.get("contract_id") == con["id"]]
for pid in pay_ids:
    log("del payment:", api("DELETE", "/payments/%d" % pid, tok=tok)[0])
log("del contract:", api("DELETE", "/contracts/%d" % con["id"], tok=tok)[0])
log("del rental:", api("DELETE", "/rentals/%d" % my_rent["id"], tok=tok)[0])
log("del equipment:", api("DELETE", "/equipments/%d" % EQ_ID, tok=tok)[0])"""
s = s.replace(old9, new9)

io.open(p, 'w', encoding='utf-8', newline='').write(s.replace('\n', '\r\n'))
import ast
ast.parse(s)
print('e2e ditambal + syntax OK')
