import re
import zlib

data = open('STATE/62_cetak.pdf', 'rb').read()
print('size', len(data))
print('pages:', data.count(b'/Type /Page') - data.count(b'/Type /Pages'))
streams = re.findall(rb'stream\r?\n(.*?)endstream', data, re.S)
teks = ''
for s in streams:
    try:
        teks += zlib.decompress(s).decode('latin1', errors='ignore')
    except Exception:
        pass
m = re.findall(r'\(((?:[^()\\]|\\.)*)\)\s*Tj', teks)
joined = ' '.join(m)
for kata in ['SURYA BANGUN SARANA', 'BAST', 'Laporan']:
    print(kata, '->', kata in joined)
print('awal:', joined[:260])
