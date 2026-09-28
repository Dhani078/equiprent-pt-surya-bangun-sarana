import { Equipment, Rental } from '../../types';
import { buildEquipmentAvailability, isUnitOutOfService, normalizeBookingRange, EquipmentAvailability } from '../availability';
import { formatTanggal } from '../businessRules';
import { CatalogAvailabilityCode, CatalogFilter, CatalogItem, CatalogView, DEFAULT_CATALOG_FILTER, normalizeSearch, toSafeNumber } from './core';

/** Daftar kategori unik yang ada pada armada (diurutkan alfabetis). */
export function listCatalogCategories(equipments: readonly Equipment[]): string[] {
  const unik = new Set<string>();
  for (const eq of equipments) {
    const kategori = typeof eq.type === 'string' ? eq.type.trim() : '';
    if (kategori !== '') unik.add(kategori);
  }
  return [...unik].sort((a, b) => a.localeCompare(b, 'id-ID'));
}

/** Menormalkan filter katalog dari nilai yang tidak dapat dipercaya. */
export function normalizeCatalogFilter(raw: unknown): CatalogFilter {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_CATALOG_FILTER };
  const src = raw as Record<string, unknown>;

  const sortRaw = typeof src.sort === 'string' ? src.sort.toUpperCase() : '';
  const sort: CatalogFilter['sort'] =
    sortRaw === 'TERMAHAL' || sortRaw === 'TERBARU' ? sortRaw : 'TERMURAH';

  return {
    search: normalizeSearch(src.search),
    category: typeof src.category === 'string' ? src.category.trim().slice(0, 100) : '',
    sort,
  };
}

/**
 * Menyusun katalog: hanya unit yang BISA DISEWA yang tampil.
 *
 * Kriteria penerimaan T-0011: "Katalog hanya tampilkan unit available".
 * Implementasinya tidak cukup `status === 'AVAILABLE'` — status unit adalah
 * keadaan HARI INI, sedangkan pelanggan memesan untuk periode tertentu. Yang
 * benar: unit yang tidak dirawat/dinonaktifkan DAN tidak bentrok dengan sewa
 * lain pada periode yang dipilih.
 *
 * Unit yang bentrok TIDAK ditampilkan secara bawaan (`includeBlocked:
 * false`), sesuai kriteria penerimaan. Informasinya tidak hilang: jumlahnya
 * tetap dilaporkan pada `summary.blockedBySchedule` dan ditampilkan sebagai
 * keterangan di kepala katalog, sehingga pelanggan paham armada sedang sibuk
 * — bukan katalog yang kosong. `includeBlocked: true` mengembalikan unit
 * bentrok dengan badge "Sedang Disewa" dan tombol nonaktif.
 *
 * @param from Tanggal mulai sewa (YYYY-MM-DD) yang sedang dipilih pelanggan.
 * @param to   Tanggal selesai sewa (YYYY-MM-DD).
 */
export function buildCatalog(
  equipments: readonly Equipment[],
  rentals: readonly Rental[],
  from: string,
  to: string,
  filter: CatalogFilter = DEFAULT_CATALOG_FILTER,
  options: { includeBlocked?: boolean } = {}
): CatalogView {
  const includeBlocked = options.includeBlocked === true;
  const rentangValid = normalizeBookingRange(from, to) !== null;
  const availability = buildEquipmentAvailability(equipments, rentals, from, to);

  const kataKunci = normalizeSearch(filter.search).toLowerCase();
  const kategori = filter.category.trim();

  const items: CatalogItem[] = [];

  for (const entry of availability) {
    const { equipment, isBookable, blockedReason, conflicts } = entry;

    // Unit yang dirawat / dinonaktifkan tidak pernah tampil di katalog
    // pelanggan (aturan bisnis §4.3 poin 2).
    if (isUnitOutOfService(equipment.status)) continue;

    // Unit yang sedang disewa pada periode yang dipilih tidak ditawarkan.
    const kode: CatalogAvailabilityCode = !rentangValid
      ? 'PERIODE_TIDAK_VALID'
      : blockedReason === 'DATE_CONFLICT'
        ? 'SEDANG_DISEWA'
        : 'TERSEDIA';

    // Ringkasan `blockedBySchedule` tetap menghitung unit ini walau tidak
    // ditampilkan, agar kepala katalog bisa menjelaskan ke mana unit hilang.
    if (kode !== 'TERSEDIA' && !includeBlocked) continue;

    if (kategori !== '' && equipment.type !== kategori) continue;

    if (kataKunci !== '') {
      const cocok =
        equipment.name.toLowerCase().includes(kataKunci) ||
        equipment.equipment_code.toLowerCase().includes(kataKunci) ||
        equipment.brand.toLowerCase().includes(kataKunci) ||
        equipment.model.toLowerCase().includes(kataKunci) ||
        equipment.type.toLowerCase().includes(kataKunci);
      if (!cocok) continue;
    }

    const bentrokPertama = conflicts[0] ?? null;

    items.push({
      equipment,
      isBookable: isBookable && rentangValid,
      availability: kode,
      conflictCount: conflicts.length,
      conflictRentalCode: bentrokPertama ? bentrokPertama.rentalCode : null,
      blockedMessage: buildBlockedMessage(kode, equipment, bentrokPertama),
    });
  }

  const urut = (a: CatalogItem, b: CatalogItem): number => {
    if (filter.sort === 'TERMAHAL') {
      return toSafeNumber(b.equipment.rental_price_per_day) - toSafeNumber(a.equipment.rental_price_per_day);
    }
    if (filter.sort === 'TERBARU') {
      return String(b.equipment.created_at ?? '').localeCompare(String(a.equipment.created_at ?? ''));
    }
    return toSafeNumber(a.equipment.rental_price_per_day) - toSafeNumber(b.equipment.rental_price_per_day);
  };

  items.sort(urut);

  // Ringkasan dihitung dari SELURUH armada (sebelum penyaringan kata kunci)
  // agar angka "N unit siap sewa" tidak berubah saat pelanggan mengetik.
  return {
    items,
    categories: listCatalogCategories(equipments),
    summary: summarizeCatalog(availability, rentangValid),
  };
}

/**
 * Ringkasan katalog: berapa unit yang benar-benar bisa diajukan.
 * Dipisah dari `buildCatalog` agar bisa diuji tanpa merender komponen.
 */
export function summarizeCatalog(
  availability: readonly EquipmentAvailability[],
  rentangValid = true
): CatalogView['summary'] {
  let bookable = 0;
  let blockedBySchedule = 0;
  let blockedByUnitStatus = 0;

  for (const entry of availability) {
    if (isUnitOutOfService(entry.equipment.status)) {
      blockedByUnitStatus += 1;
      continue;
    }
    if (!rentangValid) continue;
    if (entry.blockedReason === 'DATE_CONFLICT') {
      blockedBySchedule += 1;
      continue;
    }
    bookable += 1;
  }

  return {
    total: availability.length,
    bookable,
    blockedBySchedule,
    blockedByUnitStatus,
  };
}

/** Pesan siap tampil mengapa sebuah unit tidak dapat diajukan. */
function buildBlockedMessage(
  kode: CatalogAvailabilityCode,
  equipment: Equipment,
  bentrok: { rentalCode: string; startDate: string; endDate: string } | null
): string | null {
  switch (kode) {
    case 'TERSEDIA':
      return null;
    case 'PERIODE_TIDAK_VALID':
      return 'Periode sewa belum dipilih dengan benar. Lengkapi tanggal mulai dan tanggal selesai.';
    case 'TIDAK_DISEWA_KAN':
      return `${equipment.equipment_code} sedang dalam perawatan dan belum dapat disewa.`;
    case 'SEDANG_DISEWA':
      return bentrok
        ? `${equipment.equipment_code} sudah dipesan pada ${formatTanggal(bentrok.startDate)} – ${formatTanggal(bentrok.endDate)}. Silakan pilih periode lain.`
        : `${equipment.equipment_code} sudah dipesan pada periode tersebut.`;
  }
}
