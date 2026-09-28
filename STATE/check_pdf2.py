import re
import zlib

data = open('STATE/62_cetak.pdf', 'rb').read()
streams = re.findall(rb'stream\r?\n(.*?)endstream', data, re.S)
teks = ''
for s in streams:
    try:
        teks += zlib.decompress(s).decode('latin1', errors='ignore')
    except Exception:
        pass
print('stream teks len:', len(teks))
print('TJ count:', teks.count('TJ'), 'Tj count:', teks.count('Tj'))
# contoh operator
ops = re.findall(r'.{0,60}Tj.{0,20}', teks)
for o in ops[:3]:
    print('Tj:', repr(o[:90]))
tj = re.findall(r'\[.{0,120}?\]\s*TJ', teks)
for o in tj[:3]:
    print('TJ:', repr(o[:120]))
# hex strings
hexs = re.findall(r'<([0-9A-Fa-f]{8,})>\s*Tj', teks)
print('hex strings:', len(hexs), hexs[:2])
