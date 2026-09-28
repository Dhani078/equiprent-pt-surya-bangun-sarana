"use strict";

// src/lib/seedGenerator.ts
function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var rng = createRng(20260904);
var pick = (arr) => arr[Math.floor(rng() * arr.length)];
var between = (min, max) => min + rng() * (max - min);
var intBetween = (min, max) => Math.floor(between(min, max + 1));
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function addDays(base, days) {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}
function isoDateTime(d) {
  return d.toISOString().replace("T", " ").slice(0, 19);
}
var HARI_INI = /* @__PURE__ */ new Date();
var UNIT_SPECS = [
  { type: "Excavator", brand: "Komatsu", model: "PC200-8", prefix: "EXCA-KOM-PC200", rate: 25e5 },
  { type: "Excavator", brand: "Caterpillar", model: "320D", prefix: "EXCA-CAT-320D", rate: 27e5 },
  { type: "Excavator", brand: "Hitachi", model: "ZX200-5G", prefix: "EXCA-HIT-ZX200", rate: 26e5 },
  { type: "Excavator", brand: "Kobelco", model: "SK200-10", prefix: "EXCA-KOB-SK200", rate: 245e4 },
  { type: "Bulldozer", brand: "Komatsu", model: "D85ESS-2", prefix: "BULL-KOM-D85", rate: 32e5 },
  { type: "Bulldozer", brand: "Caterpillar", model: "D6R", prefix: "BULL-CAT-D6R", rate: 34e5 },
  { type: "Wheel Loader", brand: "Komatsu", model: "WA320-7", prefix: "LOAD-KOM-WA320", rate: 28e5 },
  { type: "Wheel Loader", brand: "Caterpillar", model: "966M", prefix: "LOAD-CAT-966M", rate: 3e6 },
  { type: "Crane", brand: "Kobelco", model: "CKE800", prefix: "CRAN-KOB-CKE800", rate: 45e5 },
  { type: "Crane", brand: "Tadano", model: "GR-500EX", prefix: "CRAN-TAD-GR500", rate: 48e5 },
  { type: "Vibro Roller", brand: "Bomag", model: "BW213D-5", prefix: "ROLL-BOM-BW213", rate: 18e5 },
  { type: "Vibro Roller", brand: "Dynapac", model: "CA602D", prefix: "ROLL-DYN-CA602", rate: 19e5 },
  { type: "Dump Truck", brand: "Hino", model: "FM260JD", prefix: "DUMP-HINO-FM260", rate: 22e5 },
  { type: "Dump Truck", brand: "Mitsubishi", model: "Fuso FV", prefix: "DUMP-MIT-FUSO", rate: 21e5 },
  { type: "Motor Grader", brand: "Komatsu", model: "GD655-5", prefix: "GRAD-KOM-GD655", rate: 29e5 }
];
var THUMBNAILS = {
  Excavator: "https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&auto=format&fit=crop&q=80",
  Bulldozer: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&auto=format&fit=crop&q=80",
  "Wheel Loader": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
  Crane: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=600&auto=format&fit=crop&q=80",
  "Vibro Roller": "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=600&auto=format&fit=crop&q=80",
  "Dump Truck": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80",
  "Motor Grader": "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=600&auto=format&fit=crop&q=80"
};
var NAMA_CUSTOMER = [
  "Budi Santoso",
  "Siti Aminah",
  "Ir. H. Gunawan Wibisono",
  "H. Akhmad Zaini",
  "Tomas Salim",
  "H. Syamsul Bahri",
  "Andi Wijaya Kusuma",
  "Rina Kartika Sari",
  "Drs. Muhammad Yasin",
  "Norhayati Rahmah",
  "Fajar Nugroho",
  "Dewi Anggraini",
  "Ir. Bambang Suryanto",
  "Hj. Nurul Hidayah",
  "Agus Salim Harahap",
  "Yuniarti Puspita",
  "Khalid bin Abdullah",
  "Sri Wahyuni",
  "Joko Susilo",
  "Maya Sari Dewi",
  "Rahmat Hidayat",
  "Nur Aini Rahmawati",
  "Sutrisno Wibowo",
  "Linda Septiani",
  "Hendra Gunawan",
  "Fitri Handayani",
  "Zulkifli Hasan",
  "Ratna Kusumawardani",
  "Bambang Pamungkas",
  "Endang Sulistyowati",
  "Arief Rahman Hakim",
  "Wulan Sari",
  "Imam Sopingi",
  "Retno Widyaningrum",
  "Slamet Riyadi",
  "Anisa Putri Ramadhani"
];
var PERUSAHAAN = [
  "PT. Aneka Tambang Kalimantan",
  "CV. Barito Putera Konstruksi",
  "PT. Adaro Indonesia",
  "PT. Banjar Indah Pembangunan",
  "PT. Meratus Coal Energy",
  "PT. Hasnur Riung Sinergi",
  "CV. Kalimantan Jaya Mandiri",
  "PT. Borneo Infrastruktur Nusantara",
  "PT. Tambang Batulicin Sejahtera",
  "CV. Karya Banua Baiman",
  "PT. Sumber Alam Kalimantan",
  "CV. Mitra Banjar Sejati"
];
var JALAN_BANJARMASIN = [
  "Jl. Ahmad Yani KM 5",
  "Jl. Sultan Adam",
  "Jl. Belitung Darat",
  "Jl. Gatot Subroto",
  "Jl. H. Hasan Basri",
  "Jl. Trisakti",
  "Jl. Aneka Tambang",
  "Jl. Pramuka",
  "Jl. Simpang Lima"
];
function generateUsers() {
  const users = [];
  users.push(
    { id: 1, role_id: 1, role_name: "ADMIN", username: "admin", email: "admin@suryabangun.co.id", full_name: "Muhammad Rizki Ramadhani, S.Kom (Admin)", phone: "081254321098", address: "Jl. Ahmad Yani KM 5, Banjarmasin", company_name: "PT. Surya Bangun Sarana", status: "ACTIVE" },
    { id: 2, role_id: 1, role_name: "ADMIN", username: "admin2", email: "lisa.indriani@suryabangun.co.id", full_name: "Lisa Indriani, S.E. (Head of Finance)", phone: "081255556666", address: "Jl. Sultan Adam Blok C, Banjarmasin", company_name: "PT. Surya Bangun Sarana", status: "ACTIVE" },
    { id: 3, role_id: 2, role_name: "STAFF", username: "staff", email: "hendra@suryabangun.co.id", full_name: "Hendra Wijaya (Staf Administrasi & Logistik)", phone: "082198765432", address: "Jl. Belitung Darat No. 45, Banjarmasin", company_name: "PT. Surya Bangun Sarana", status: "ACTIVE" },
    { id: 4, role_id: 2, role_name: "STAFF", username: "ahmad", email: "ahmad_mekanik@suryabangun.co.id", full_name: "Ahmad Ridwan (Mekanik Senior)", phone: "085345678901", address: "Jl. Liang Anggang KM 18, Banjarbaru", company_name: "PT. Surya Bangun Sarana", status: "ACTIVE" },
    { id: 5, role_id: 2, role_name: "STAFF", username: "siska", email: "siska.amanda@suryabangun.co.id", full_name: "Siska Amanda (Account Manager Executive)", phone: "082148564979", address: "Jl. Gatot Subroto No. 12, Banjarmasin", company_name: "PT. Surya Bangun Sarana", status: "ACTIVE" },
    { id: 6, role_id: 2, role_name: "STAFF", username: "eko", email: "eko.purwanto@suryabangun.co.id", full_name: "Eko Purwanto (Staf Lapangan & Surveyor)", phone: "085299990001", address: "Jl. Landasan Ulin Utara, Banjarbaru", company_name: "PT. Surya Bangun Sarana", status: "ACTIVE" },
    { id: 7, role_id: 2, role_name: "STAFF", username: "dwi", email: "dwi.haryono@suryabangun.co.id", full_name: "Dwi Haryono (Mekanik Junior)", phone: "081387654321", address: "Jl. Trans Kalimantan, Alalak, Batola", company_name: "PT. Surya Bangun Sarana", status: "ACTIVE" },
    { id: 8, role_id: 2, role_name: "STAFF", username: "rudi", email: "rudi.hartono@suryabangun.co.id", full_name: "Rudi Hartono (Operator Senior)", phone: "087822334455", address: "Jl. Handil Bakti, Batola", company_name: "PT. Surya Bangun Sarana", status: "ACTIVE" },
    { id: 9, role_id: 3, role_name: "CUSTOMER", username: "user", email: "logistik@anekatambang.com", full_name: "Budi Santoso (Logistik)", phone: "081122334455", address: "Jl. Trisakti Pelabuhan, Banjarmasin", company_name: "PT. Aneka Tambang Kalimantan", status: "ACTIVE" },
    { id: 10, role_id: 3, role_name: "CUSTOMER", username: "user2", email: "siti.aminah@baritoputera.co.id", full_name: "Siti Aminah, M.B.A (Direktur)", phone: "087855667788", address: "Jl. Sultan Adam No. 88, Banjarmasin", company_name: "CV. Barito Putera Konstruksi", status: "ACTIVE" },
    { id: 11, role_id: 3, role_name: "CUSTOMER", username: "adaro", email: "procurement@adaro.com", full_name: "Ir. H. Gunawan Wibisono", phone: "08115009001", address: "Kawasan Industri Tabalong, Kalsel", company_name: "PT. Adaro Indonesia", status: "ACTIVE" },
    { id: 12, role_id: 3, role_name: "CUSTOMER", username: "banjar_indah", email: "info@banjarindah.co.id", full_name: "H. Akhmad Zaini (Manajer Konstruksi)", phone: "085100112233", address: "Jl. Banjar Indah Permai No. 10, Banjarmasin", company_name: "PT. Banjar Indah Pembangunan", status: "ACTIVE" },
    { id: 13, role_id: 3, role_name: "CUSTOMER", username: "meratus_coal", email: "tomas.salim@meratuscoal.com", full_name: "Tomas Salim", phone: "081399887766", address: "Kawasan Tambang Sebamban, Tanah Bumbu", company_name: "PT. Meratus Coal Energy", status: "ACTIVE" },
    { id: 14, role_id: 3, role_name: "CUSTOMER", username: "wasaka_jaya", email: "dian.saputra@wasakajaya.com", full_name: "Dian Saputra", phone: "087712345678", address: "Jl. H. Hasan Basri, Kayutangi, Banjarmasin", company_name: "CV. Wasaka Jaya Mandiri", status: "ACTIVE" },
    { id: 15, role_id: 3, role_name: "CUSTOMER", username: "hasnur_group", email: "logistik@hasnurgroup.com", full_name: "H. Syamsul Bahri (Kasi Logistik)", phone: "0811998877", address: "Kawasan Pelabuhan Hasnur, Tapin", company_name: "PT. Hasnur Riung Sinergi", status: "ACTIVE" }
  );
  const dipakai = new Set(users.map((u) => u.username));
  for (let i = 16; i <= 50; i += 1) {
    const namaIdx = (i - 16) % NAMA_CUSTOMER.length;
    const nama = NAMA_CUSTOMER[namaIdx];
    const perusahaan = PERUSAHAAN[(i - 16) % PERUSAHAAN.length];
    let username = nama.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
    if (dipakai.has(username)) username = `${username}${i}`;
    dipakai.add(username);
    users.push({
      id: i,
      role_id: 3,
      role_name: "CUSTOMER",
      username,
      email: `${username}@${perusahaan.toLowerCase().replace(/[^a-z]/g, "")}.co.id`,
      full_name: `${nama} (${pick(["Logistik", "Direktur", "Manajer Proyek", "Kasi Operasional", "Pengadaan"])})`,
      phone: `0812${String(1e7 + intBetween(0, 89999999)).slice(0, 10)}`,
      address: `${pick(JALAN_BANJARMASIN)} No. ${intBetween(1, 120)}, Banjarmasin`,
      company_name: perusahaan,
      // 1 dari 12 pelanggan disuspend agar halaman manajemen user punya variasi
      status: i % 12 === 0 ? "SUSPENDED" : "ACTIVE",
      created_at: isoDate(addDays(/* @__PURE__ */ new Date("2025-01-15"), intBetween(0, 400)))
    });
  }
  return users;
}
function generateEquipments() {
  const equipments = [];
  const counter = {};
  for (let i = 1; i <= 50; i += 1) {
    const spec = UNIT_SPECS[(i - 1) % UNIT_SPECS.length];
    counter[spec.prefix] = (counter[spec.prefix] ?? 0) + 1;
    const code = `${spec.prefix}-${String(counter[spec.prefix]).padStart(2, "0")}`;
    const roll = rng();
    let status;
    if (roll < 0.5) status = "AVAILABLE";
    else if (roll < 0.78) status = "RENTED";
    else if (roll < 0.94) status = "MAINTENANCE";
    else status = "UNAVAILABLE";
    equipments.push({
      id: i,
      equipment_code: code,
      name: `${spec.type} ${spec.brand} ${spec.model}`,
      type: spec.type,
      model: spec.model,
      brand: spec.brand,
      hour_meter: Number(between(250, 4200).toFixed(2)),
      rental_price_per_day: spec.rate,
      status,
      last_maintenance_date: isoDate(addDays(/* @__PURE__ */ new Date("2026-01-05"), intBetween(0, 200))),
      thumbnail_url: THUMBNAILS[spec.type] ?? THUMBNAILS.Excavator,
      created_at: isoDate(addDays(/* @__PURE__ */ new Date("2024-06-01"), intBetween(0, 500)))
    });
  }
  return equipments;
}
var TEKNISI_IDS = [4, 7, 8];
var SPAREPARTS = [
  "Oli Mesin Meditran SX 15W-40, Filter Oli, Filter Solar",
  "Filter Hidrolik Komatsu, Seal Kit Boom Cylinder",
  "Track Link Assembly, Sprocket Segment, Track Roller",
  "Baterai 12V 150Ah, Alternator Assembly",
  "Radiator Core, Water Pump, Thermostat",
  "Brake Pad Set, Brake Disc, Master Rem",
  "Boom Bushing, Swing Gear Grease, Hydraulic Hose",
  "Air Filter Element, Fuel Filter, Water Separator"
];
function generateMaintenance(equipments) {
  const logs = [];
  for (let i = 1; i <= 25; i += 1) {
    const eq = equipments[intBetween(0, equipments.length - 1)];
    const isPreventive = rng() < 0.7;
    const status = rng() < 0.65 ? "COMPLETED" : rng() < 0.6 ? "SCHEDULED" : "IN_PROGRESS";
    const scheduled = addDays(/* @__PURE__ */ new Date("2026-02-01"), intBetween(0, 180));
    const completed = status === "COMPLETED" ? addDays(scheduled, intBetween(0, 3)) : null;
    const hmAtService = Number(Math.max(0, eq.hour_meter - between(0, 400)).toFixed(2));
    logs.push({
      id: i,
      maintenance_code: `MNT-SBS-${isoDate(scheduled).replace(/-/g, "")}-${String(i).padStart(3, "0")}`,
      equipment_id: eq.id,
      equipment_name: eq.name,
      equipment_code: eq.equipment_code,
      scheduled_date: isoDate(scheduled),
      completion_date: completed ? isoDate(completed) : null,
      maintenance_type: isPreventive ? "PREVENTIVE" : rng() < 0.7 ? "CORRECTIVE" : "OVERHAUL",
      hour_meter_at_maintenance: hmAtService,
      description: isPreventive ? "Servis preventif berkala sesuai interval 250 Hour Meter." : "Perbaikan kerusakan komponen yang ditemukan saat inspeksi lapangan.",
      spareparts_replaced: pick(SPAREPARTS),
      cost: isPreventive ? intBetween(25e5, 6e6) : intBetween(5e6, 18e6),
      technician_id: pick(TEKNISI_IDS),
      technician_name: pick(["Ahmad Ridwan", "Dwi Haryono", "Rudi Hartono"]),
      status
    });
  }
  return logs;
}
var CATATAN = [
  "Unit dikirim ke site Tambang Sebamban, Tanah Bumbu.",
  "Penggunaan untuk proyek normalisasi sungai di Banjarbaru.",
  "Mobilisasi alat ke pelabuhan Trisakti Banjarmasin.",
  "Diperlukan operator tambahan dari pihak penyewa.",
  "Unit beroperasi shift malam sesuai jadwal proyek.",
  "Pemakaian untuk land clearing kawasan industri."
];
function generateRentals(equipments, customerIds) {
  const rentals = [];
  const today = HARI_INI;
  const STATUS_ALOKASI = [
    ...Array(7).fill("PENDING"),
    ...Array(8).fill("APPROVED"),
    ...Array(10).fill("ON_GOING"),
    ...Array(21).fill("COMPLETED"),
    ...Array(4).fill("REJECTED")
  ];
  const unitTerpakai = /* @__PURE__ */ new Set();
  const kandidatAktif = equipments.filter((e) => e.status !== "MAINTENANCE");
  let putaranAktif = 0;
  for (let i = 1; i <= 50; i += 1) {
    const customerId = pick(customerIds);
    const status = STATUS_ALOKASI[i - 1] ?? "COMPLETED";
    const butuhUnitAktif = status === "ON_GOING" || status === "APPROVED";
    let eq;
    if (butuhUnitAktif) {
      let ditemukan;
      for (let percobaan = 0; percobaan < kandidatAktif.length; percobaan += 1) {
        const calon = kandidatAktif[(putaranAktif + percobaan) % kandidatAktif.length];
        if (calon && !unitTerpakai.has(calon.id)) {
          ditemukan = calon;
          putaranAktif = (putaranAktif + percobaan + 1) % kandidatAktif.length;
          break;
        }
      }
      eq = ditemukan ?? kandidatAktif[putaranAktif % kandidatAktif.length];
      unitTerpakai.add(eq.id);
    } else {
      eq = pick(equipments);
    }
    const durasi = intBetween(3, 30);
    const today2 = HARI_INI;
    let start;
    let end;
    if (status === "COMPLETED" || status === "REJECTED") {
      start = addDays(today2, -intBetween(40, 240));
      end = addDays(start, durasi);
    } else if (status === "ON_GOING") {
      start = addDays(today2, -intBetween(1, Math.max(1, durasi - 1)));
      end = addDays(start, durasi);
    } else if (status === "APPROVED") {
      start = addDays(today2, intBetween(0, 3));
      end = addDays(start, durasi);
    } else {
      start = addDays(today2, intBetween(3, 21));
      end = addDays(start, durasi);
    }
    const booking = status === "PENDING" ? addDays(today2, -intBetween(0, 3)) : addDays(start, -intBetween(3, 14));
    rentals.push({
      id: i,
      rental_code: `RNT-SBS-${isoDate(booking).replace(/-/g, "")}-${String(i).padStart(3, "0")}`,
      customer_id: customerId,
      equipment_id: eq.id,
      equipment_name: eq.name,
      equipment_code: eq.equipment_code,
      booking_date: isoDateTime(booking),
      start_date: isoDate(start),
      end_date: isoDate(end),
      total_days: durasi,
      subtotal: durasi * eq.rental_price_per_day,
      status,
      notes: rng() < 0.4 ? pick(CATATAN) : void 0
    });
  }
  return rentals;
}
var SYARAT_KONTRAK = "1. Penyewa wajib menyediakan operator bersertifikat.\n2. Biaya bahan bakar dan operator ditanggung penyewa.\n3. Kerusakan akibat kelalaian penyewa menjadi tanggung jawab penyewa.\n4. Keterlambatan pengembalian dikenakan denda Rp 500.000 per hari.\n5. Perpanjangan sewa wajib dikonfirmasi minimal H-3 sebelum berakhir.";
function generateContracts(rentals, users) {
  return rentals.map((r, idx) => {
    const customer = users.find((u) => u.id === r.customer_id);
    const start = new Date(r.start_date);
    return {
      id: idx + 1,
      contract_code: `SBS/CONTRACT/${start.getUTCFullYear()}/${String(start.getUTCMonth() + 1).padStart(2, "0")}/${String(idx + 1).padStart(4, "0")}`,
      rental_id: r.id,
      rental_code: r.rental_code,
      customer_id: r.customer_id,
      customer_name: customer?.full_name,
      contract_date: isoDate(addDays(start, -2)),
      valid_until: r.end_date,
      terms_conditions: SYARAT_KONTRAK,
      // Kontrak rental yang sudah berjalan cenderung sudah ditandatangani.
      is_signed_customer: r.status === "PENDING" ? 0 : rng() < 0.85 ? 1 : 0,
      signed_at: r.status === "PENDING" ? null : isoDateTime(addDays(start, -1))
    };
  });
}
function generatePayments(contracts, rentals) {
  return contracts.map((c, idx) => {
    const rental = rentals.find((r) => r.id === c.rental_id);
    const amount = rental?.subtotal ?? 0;
    let status;
    if (rental?.status === "COMPLETED") status = "PAID";
    else if (rental?.status === "ON_GOING") {
      rng();
      status = "PAID";
    } else if (rental?.status === "APPROVED") status = rng() < 0.5 ? "PAID" : "PENDING_VERIFICATION";
    else if (rental?.status === "REJECTED") status = "FAILED";
    else status = "UNPAID";
    if (idx % 9 === 3 && status !== "FAILED" && rental?.status !== "ON_GOING") {
      status = "PENDING_VERIFICATION";
    }
    const paid = status === "PAID";
    const verified = paid && rng() < 0.9;
    return {
      id: idx + 1,
      payment_code: `PAY-SBS-${c.contract_date.replace(/-/g, "")}-${String(idx + 1).padStart(3, "0")}`,
      contract_id: c.id,
      contract_code: c.contract_code,
      customer_id: c.customer_id,
      customer_name: c.customer_name,
      amount,
      payment_method: rng() < 0.7 ? "BANK_TRANSFER" : "QRIS",
      status,
      // Bukti transfer dilampirkan pelanggan untuk pembayaran yang sudah atau
      // sedang diproses. Sengaja disisakan ~1 dari 4 yang BELUM upload bukti
      // agar antrean verifikasi staf realistis (ada yang bisa diverifikasi,
      // ada yang masih menunggu pelanggan melampirkan bukti).
      payment_proof_path: status === "PAID" ? `uploads/proofs/bukti_${c.contract_code}.png` : status === "PENDING_VERIFICATION" && idx % 4 !== 1 ? `uploads/proofs/bukti_${c.contract_code}.png` : void 0,
      payment_date: paid ? isoDate(addDays(new Date(c.contract_date), intBetween(0, 5))) : isoDate(new Date(c.contract_date)),
      verified_by: verified ? pick(TEKNISI_IDS) : null,
      verified_by_name: verified ? pick(["Hendra Wijaya", "Siska Amanda"]) : void 0,
      verified_at: verified ? isoDateTime(addDays(new Date(c.contract_date), intBetween(1, 6))) : null
    };
  });
}
var GPS_SITES = [
  { lat: -3.3167, lng: 114.59, label: "Banjarmasin" },
  { lat: -3.44, lng: 114.83, label: "Banjarbaru" },
  { lat: -3.28, lng: 114.58, label: "Trisakti" },
  { lat: -3.7, lng: 115.2, label: "Tanah Bumbu" },
  { lat: -3.15, lng: 114.6, label: "Alalak" }
];
function generateGps(equipments) {
  const rows = [];
  for (let i = 1; i <= 55; i += 1) {
    const eq = equipments[(i - 1) % equipments.length];
    const site = GPS_SITES[i % GPS_SITES.length];
    const recorded = addDays(HARI_INI, -intBetween(0, 3));
    recorded.setHours(intBetween(6, 20), intBetween(0, 59), 0, 0);
    const aktif = eq.status === "RENTED" || eq.status === "MAINTENANCE";
    const engineOn = aktif ? rng() < 0.7 : rng() < 0.15;
    rows.push({
      id: i,
      equipment_id: eq.id,
      equipment_name: eq.name,
      equipment_code: eq.equipment_code,
      latitude: Number((site.lat + between(-0.035, 0.035)).toFixed(6)),
      longitude: Number((site.lng + between(-0.035, 0.035)).toFixed(6)),
      speed: engineOn ? Number(between(0, 42).toFixed(1)) : 0,
      engine_status: engineOn ? "ON" : "OFF",
      fuel_level_percent: intBetween(15, 100),
      recorded_at: isoDateTime(recorded)
    });
  }
  return rows;
}
function generateReports(rentals) {
  const types = ["BAST_OUT", "BAST_IN", "SURAT_JALAN", "FINANCIAL_SUMMARY"];
  const rows = [];
  for (let i = 1; i <= 20; i += 1) {
    const r = rentals[(i - 1) % rentals.length];
    const generated = addDays(new Date(r.start_date), intBetween(0, 5));
    rows.push({
      id: i,
      report_code: `DOC-SBS-${isoDate(generated).replace(/-/g, "")}-${String(i).padStart(3, "0")}`,
      rental_id: r.id,
      rental_code: r.rental_code,
      report_type: types[(i - 1) % types.length],
      generated_by: pick([3, 5]),
      generated_by_name: pick(["Hendra Wijaya", "Siska Amanda"]),
      file_path: `/dokumen/SBS/${isoDate(generated)}-${String(i).padStart(3, "0")}.pdf`,
      generated_at: isoDateTime(generated)
    });
  }
  return rows;
}
var USERS = generateUsers();
var CUSTOMER_IDS = USERS.filter((u) => u.role_id === 3).map((u) => u.id);
var EQUIPMENTS = generateEquipments();
var MAINTENANCE = generateMaintenance(EQUIPMENTS);
var RENTALS = generateRentals(EQUIPMENTS, CUSTOMER_IDS);
function sinkronkanStatusUnit(equipments, rentals, maintenance) {
  const unitSedangDisewa = /* @__PURE__ */ new Set();
  for (const r of rentals) {
    if (r.status === "ON_GOING" || r.status === "APPROVED") {
      unitSedangDisewa.add(r.equipment_id);
    }
  }
  const unitDalamServis = /* @__PURE__ */ new Set();
  for (const m of maintenance) {
    if (m.status === "IN_PROGRESS") unitDalamServis.add(m.equipment_id);
  }
  for (const eq of equipments) {
    if (unitDalamServis.has(eq.id)) {
      eq.status = "MAINTENANCE";
    } else if (unitSedangDisewa.has(eq.id)) {
      eq.status = "RENTED";
    } else if (eq.status === "RENTED") {
      eq.status = "AVAILABLE";
    }
  }
  return equipments;
}
sinkronkanStatusUnit(EQUIPMENTS, RENTALS, MAINTENANCE);
var CONTRACTS = generateContracts(RENTALS, USERS);
var PAYMENTS = generatePayments(CONTRACTS, RENTALS);
var GPS = generateGps(EQUIPMENTS);
var REPORTS = generateReports(RENTALS);

// .tmp_dump_seed.ts
console.log(JSON.stringify(PAYMENTS));
