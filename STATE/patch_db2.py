# -*- coding: utf-8 -*-
"""Patch db.ts bagian 2: write-through di semua mutator."""
import io

p = 'src/lib/db.ts'
s = io.open(p, encoding='utf-8', newline='').read()
NL = '\r\n' if '\r\n' in s[:2000] else '\n'
def A(x): return x.replace('\n', NL)

def rep(old, new):
    global s
    o, n = A(old), A(new)
    assert s.count(o) == 1, "MISS/DUP: " + old[:80]
    s = s.replace(o, n, 1)

# ---------------------------------------------------------------- users
rep("""  setUserPassword: async (id: number, password: string) => {
    const user = stateStore.users.find(u => u.id === id);
    if (!user) return undefined;

    user.password_hash = await hashPassword(password, user.username);
    return user;
  },

  addUser: async (user: Omit<User, 'id'>) => {
    const newUser: User = { ...user, id: nextId(stateStore.users) };
    stateStore.users.push(newUser);
    return newUser;
  },""",
"""  setUserPassword: async (id: number, password: string) => {
    const user = stateStore.users.find(u => u.id === id);
    if (!user) return undefined;

    const hash = await hashPassword(password, user.username);
    await wt('UPDATE `users` SET `password` = ? WHERE `id` = ?', [hash, id], 'setUserPassword');
    user.password_hash = hash;
    return user;
  },
  addUser: async (user: Omit<User, 'id'>) => {
    const newUser: User = { ...user, id: nextId(stateStore.users) };
    await wt(
      'INSERT INTO `users` (`id`, `role_id`, `username`, `password`, `email`, `full_name`, `phone`, `address`, `company_name`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newUser.id, newUser.role_id, newUser.username, null, newUser.email, newUser.full_name, newUser.phone, newUser.address, newUser.company_name, newUser.status],
      'addUser'
    );
    stateStore.users.push(newUser);
    return newUser;
  },""")

rep("""    Object.assign(user, aman);
    return user;
  },

  toggleUserStatus: async (id: number) => {
    const u = stateStore.users.find(x => x.id === id);
    if (u) {
      u.status = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    }
    return u;
  },""",
"""    const gabungan = { ...user, ...aman };
    await wt(
      'UPDATE `users` SET `email` = ?, `full_name` = ?, `phone` = ?, `address` = ?, `company_name` = ? WHERE `id` = ?',
      [gabungan.email, gabungan.full_name, gabungan.phone, gabungan.address, gabungan.company_name, id],
      'updateUser'
    );
    Object.assign(user, aman);
    return user;
  },

  toggleUserStatus: async (id: number) => {
    const u = stateStore.users.find(x => x.id === id);
    if (u) {
      const baru = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await wt('UPDATE `users` SET `status` = ? WHERE `id` = ?', [baru, id], 'toggleUserStatus');
      u.status = baru;
    }
    return u;
  },""")

# ---------------------------------------------------------------- equipments
rep("""  addEquipment: async (eq: Omit<Equipment, 'id'>) => {
    const newEq: Equipment = { ...eq, id: nextId(stateStore.equipments) };
    stateStore.equipments.unshift(newEq);
    return newEq;
  },
  updateEquipment: async (id: number, data: Partial<Equipment>) => {
    const eq = stateStore.equipments.find(e => e.id === id);
    if (eq) {
      Object.assign(eq, data);
    }
    return eq;
  },""",
"""  addEquipment: async (eq: Omit<Equipment, 'id'>) => {
    const newEq: Equipment = { ...eq, id: nextId(stateStore.equipments) };
    await wt(
      'INSERT INTO `equipments` (`id`, `equipment_code`, `name`, `type`, `model`, `brand`, `hour_meter`, `rental_price_per_day`, `status`, `last_maintenance_date`, `thumbnail_url`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newEq.id, newEq.equipment_code, newEq.name, newEq.type, newEq.model, newEq.brand, newEq.hour_meter, newEq.rental_price_per_day, newEq.status, newEq.last_maintenance_date, newEq.thumbnail_url ?? null],
      'addEquipment'
    );
    stateStore.equipments.unshift(newEq);
    return newEq;
  },
  updateEquipment: async (id: number, data: Partial<Equipment>) => {
    const eq = stateStore.equipments.find(e => e.id === id);
    if (eq) {
      const gabungan = { ...eq, ...data };
      await wt(
        'UPDATE `equipments` SET `name` = ?, `type` = ?, `model` = ?, `brand` = ?, `hour_meter` = ?, `rental_price_per_day` = ?, `status` = ?, `last_maintenance_date` = ?, `thumbnail_url` = ? WHERE `id` = ?',
        [gabungan.name, gabungan.type, gabungan.model, gabungan.brand, gabungan.hour_meter, gabungan.rental_price_per_day, gabungan.status, gabungan.last_maintenance_date, gabungan.thumbnail_url ?? null, id],
        'updateEquipment'
      );
      Object.assign(eq, data);
    }
    return eq;
  },""")

rep("""    const idx = stateStore.equipments.findIndex(e => e.id === id);
    if (idx !== -1) {
      stateStore.equipments.splice(idx, 1);
      return true;
    }
    return false;""",
"""    const idx = stateStore.equipments.findIndex(e => e.id === id);
    if (idx !== -1) {
      await wt('DELETE FROM `equipments` WHERE `id` = ?', [id], 'deleteEquipment');
      stateStore.equipments.splice(idx, 1);
      return true;
    }
    return false;""")

# ---------------------------------------------------------------- rentals
rep("""    const newRental: Rental = {
      ...rental,
      id,
      rental_code: code,
      booking_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'PENDING'
    };
    stateStore.rentals.unshift(newRental);
    return newRental;""",
"""    const newRental: Rental = {
      ...rental,
      id,
      rental_code: code,
      booking_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'PENDING'
    };
    await wt(
      'INSERT INTO `rentals` (`id`, `rental_code`, `customer_id`, `equipment_id`, `booking_date`, `start_date`, `end_date`, `total_days`, `subtotal`, `status`, `notes`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newRental.id, newRental.rental_code, newRental.customer_id, newRental.equipment_id, newRental.booking_date, newRental.start_date, newRental.end_date, newRental.total_days, newRental.subtotal, newRental.status, newRental.notes ?? null],
      'addRental'
    );
    stateStore.rentals.unshift(newRental);
    return newRental;""")

rep("""    r.status = status;

    const dampak = getTransitionEffect(status);""",
"""    await wt('UPDATE `rentals` SET `status` = ? WHERE `id` = ?', [status, id], 'updateRentalStatus');
    r.status = status;

    const dampak = getTransitionEffect(status);""")

rep("""    if (dampak.equipmentStatus === 'RENTED') {
      const eq = stateStore.equipments.find(e => e.id === r.equipment_id);
      if (eq) eq.status = 'RENTED';
    } else if (dampak.equipmentStatus === 'AVAILABLE') {""",
"""    if (dampak.equipmentStatus === 'RENTED') {
      const eq = stateStore.equipments.find(e => e.id === r.equipment_id);
      if (eq) {
        await wt('UPDATE `equipments` SET `status` = ? WHERE `id` = ?', ['RENTED', eq.id], 'rentalKunciUnit');
        eq.status = 'RENTED';
      }
    } else if (dampak.equipmentStatus === 'AVAILABLE') {""")

rep("""      if (!masihBeroperasi) {
        const eq = stateStore.equipments.find(e => e.id === r.equipment_id);
        if (eq) eq.status = 'AVAILABLE';
      }""",
"""      if (!masihBeroperasi) {
        const eq = stateStore.equipments.find(e => e.id === r.equipment_id);
        if (eq) {
          await wt('UPDATE `equipments` SET `status` = ? WHERE `id` = ?', ['AVAILABLE', eq.id], 'rentalBebaskanUnit');
          eq.status = 'AVAILABLE';
        }
      }""")

# ---------------------------------------------------------------- contracts
rep("""    stateStore.contracts.push(contract);
    return contract;""",
"""    await wt(
      'INSERT INTO `contracts` (`id`, `contract_code`, `rental_id`, `customer_id`, `contract_date`, `valid_until`, `terms_conditions`, `is_signed_customer`) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [contract.id, contract.contract_code, contract.rental_id, contract.customer_id, contract.contract_date, contract.valid_until, contract.terms_conditions],
      'createContract'
    );
    stateStore.contracts.push(contract);
    return contract;""")

rep("""    c.is_signed_customer = 1;
    c.signed_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    c.signer_name = signerName;
    c.signature_data_url = signature;
    return c;""",
"""    const signedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `contracts` SET `is_signed_customer` = 1, `signed_at` = ?, `signer_name` = ?, `signature_data_url` = ? WHERE `id` = ?',
      [signedAt, signerName, signature, contractId],
      'signContract'
    );
    c.is_signed_customer = 1;
    c.signed_at = signedAt;
    c.signer_name = signerName;
    c.signature_data_url = signature;
    return c;""")

# ---------------------------------------------------------------- payments
rep("""    p.status = 'PAID';
    p.verified_by = staffUserId;
    p.verified_by_name = staffName;
    p.verified_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return p;
  },""",
"""    const verifiedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `payments` SET `status` = ?, `verified_by` = ?, `verified_at` = ? WHERE `id` = ?',
      ['PAID', staffUserId, verifiedAt, paymentId],
      'verifyPayment'
    );
    p.status = 'PAID';
    p.verified_by = staffUserId;
    p.verified_by_name = staffName;
    p.verified_at = verifiedAt;
    return p;
  },""")

rep("""    p.status = 'FAILED';
    p.verified_by = staffUserId;
    p.verified_by_name = staffName;
    p.verified_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return p;
  },""",
"""    const verifiedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `payments` SET `status` = ?, `verified_by` = ?, `verified_at` = ? WHERE `id` = ?',
      ['FAILED', staffUserId, verifiedAt, paymentId],
      'rejectPayment'
    );
    p.status = 'FAILED';
    p.verified_by = staffUserId;
    p.verified_by_name = staffName;
    p.verified_at = verifiedAt;
    return p;
  },""")

rep("""    p.payment_proof_path = proofPath;
    p.status = 'PENDING_VERIFICATION';
    p.payment_date = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (buktiBerubah) {
      p.verified_by = null;
      p.verified_by_name = undefined;
      p.verified_at = null;
    }
    return p;""",
"""    const bayarPada = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `payments` SET `payment_proof_path` = ?, `status` = ?, `payment_date` = ?, `verified_by` = NULL, `verified_at` = NULL WHERE `id` = ?',
      [proofPath, 'PENDING_VERIFICATION', bayarPada, paymentId],
      'addPaymentProof'
    );
    p.payment_proof_path = proofPath;
    p.status = 'PENDING_VERIFICATION';
    p.payment_date = bayarPada;

    if (buktiBerubah) {
      p.verified_by = null;
      p.verified_by_name = undefined;
      p.verified_at = null;
    }
    return p;""")

# ---------------------------------------------------------------- maintenance
rep("""    stateStore.maintenance.unshift(newM);
    const eq = stateStore.equipments.find(e => e.id === item.equipment_id);
    if (eq) eq.status = 'MAINTENANCE';
    return newM;""",
"""    await wt(
      'INSERT INTO `maintenance` (`id`, `maintenance_code`, `equipment_id`, `scheduled_date`, `maintenance_type`, `hour_meter_at_maintenance`, `description`, `spareparts_replaced`, `cost`, `technician_id`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newM.id, newM.maintenance_code, newM.equipment_id, newM.scheduled_date, newM.maintenance_type, newM.hour_meter_at_maintenance, newM.description, newM.spareparts_replaced ?? null, newM.cost, newM.technician_id ?? null, newM.status],
      'scheduleMaintenance'
    );
    stateStore.maintenance.unshift(newM);
    const eq = stateStore.equipments.find(e => e.id === item.equipment_id);
    if (eq) {
      await wt('UPDATE `equipments` SET `status` = ? WHERE `id` = ?', ['MAINTENANCE', eq.id], 'servisKunciUnit');
      eq.status = 'MAINTENANCE';
    }
    return newM;""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('patch 2 ok, len:', len(s))
