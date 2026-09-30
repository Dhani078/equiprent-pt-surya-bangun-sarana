/**
 * Konstanta bersama untuk seluruh generator seed.
 * Dipakai lintas-domain: Maintenance, Rentals, Contracts, Payments.
 */

export const TEKNISI_IDS: readonly number[] = [4, 7, 8];

export const SPAREPARTS: readonly string[] = [
  'Oli Mesin Meditran SX 15W-40, Filter Oli, Filter Solar',
  'Filter Hidrolik Komatsu, Seal Kit Boom Cylinder',
  'Track Link Assembly, Sprocket Segment, Track Roller',
  'Baterai 12V 150Ah, Alternator Assembly',
  'Radiator Core, Water Pump, Thermostat',
  'Brake Pad Set, Brake Disc, Master Rem',
  'Boom Bushing, Swing Gear Grease, Hydraulic Hose',
  'Air Filter Element, Fuel Filter, Water Separator',
];

export const CATATAN: readonly string[] = [
  'Unit dikirim ke site Tambang Sebamban, Tanah Bumbu.',
  'Penggunaan untuk proyek normalisasi sungai di Banjarbaru.',
  'Mobilisasi alat ke pelabuhan Trisakti Banjarmasin.',
  'Diperlukan operator tambahan dari pihak penyewa.',
  'Unit beroperasi shift malam sesuai jadwal proyek.',
  'Pemakaian untuk land clearing kawasan industri.',
];

export const SYARAT_KONTRAK =
  '1. Penyewa wajib menyediakan operator bersertifikat.\n' +
  '2. Biaya bahan bakar dan operator ditanggung penyewa.\n' +
  '3. Kerusakan akibat kelalaian penyewa menjadi tanggung jawab penyewa.\n' +
  '4. Keterlambatan pengembalian dikenakan denda Rp 500.000 per hari.\n' +
  '5. Perpanjangan sewa wajib dikonfirmasi minimal H-3 sebelum berakhir.';
