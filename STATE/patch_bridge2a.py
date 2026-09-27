# -*- coding: utf-8 -*-
"""Bridge db.ts mutator -> Edge API (browser jadi cermin TiDB)."""
import io

p = 'src/lib/db.ts'
s = io.open(p, encoding='utf-8', newline='').read()
NL = '\r\n' if '\r\n' in s[:2000] else '\n'

def A(x): return x.replace('\n', NL)

count = 0
def rep(old, new, cnt=1):
    global s, count
    o = A(old); n = A(new)
    assert s.count(o) == cnt, 'MISS/DUP(%d!=%d): %r' % (s.count(o), cnt, old[:70])
    s = s.replace(o, n, cnt)
    count += 1

# ---- 1) bridge: tulis via API, cermin stateStore, JANGAN ulangi wt() di browser
# helper: setelah kirimKeApi sukses, sinkron dari server. Ganti tiap mutator.

rep("""  addEquipment: async (eq: Omit<Equipment, 'id'>) => {
    const newEq: Equipment = { ...eq, id: nextId(stateStore.equipments) };
    await wt(""",
"""  addEquipment: async (eq: Omit<Equipment, 'id'>) => {
    if (typeof window !== 'undefined') {
      const item = (await kirimKeApi('POST', '/api/equipments', eq)) as Equipment;
      await sinkronCermin(['equipments']);
      return item;
    }
    const newEq: Equipment = { ...eq, id: nextId(stateStore.equipments) };
    await wt(""")

rep("""  updateEquipment: async (id: number, data: Partial<Equipment>) => {
    const eq = stateStore.equipments.find(e => e.id === id);
    if (eq) {
      const gabungan = { ...eq, ...data };""",
"""  updateEquipment: async (id: number, data: Partial<Equipment>) => {
    if (typeof window !== 'undefined') {
      await kirimKeApi('PUT', `/api/equipments/${id}`, data);
      await sinkronCermin(['equipments']);
      return stateStore.equipments.find(e => e.id === id);
    }
    const eq = stateStore.equipments.find(e => e.id === id);
    if (eq) {
      const gabungan = { ...eq, ...data };""")

rep("""    const unit = stateStore.equipments.find(e => e.id === id);
    if (!unit) return false;
    // Simpan jejak? (tidak ada kolom soft delete) -> hapus permanen.""",
"""    const unit = stateStore.equipments.find(e => e.id === id);
    if (!unit) return false;
    // Simpan jejak? (tidak ada kolom soft delete) -> hapus permanen.""")

# deleteEquipment: cek signature aslinya dulu
i = s.find('deleteEquipment: async')
seg = s[i:i + 1400]
print('== deleteEquipment segmen:'); print(seg.replace('\r\n', '\n')[:600])

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('part1 ok', count)
