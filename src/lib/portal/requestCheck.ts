import { Equipment, Rental } from '../../types';
import { buildEquipmentAvailability, isUnitOutOfService, normalizeBookingRange } from '../availability';
import { calculateRentalCost, formatTanggal } from '../businessRules';
import { BATAS_HARI_SEWA_MAKSIMAL, toSafeNumber, toSafeTime } from './core';

/** Hasil pemeriksaan kelayakan pengajuan sewa. */
export type RentalRequestCheck =
  | { ok: true; rentalDays: number; subtotal: number; totalDays: number }
  | { ok: false; code: 'UNIT_TIDAK_TERSEDIA' | 'PERIODE_TIDAK_VALID' | 'DURASI_MELEBIHI_BATAS'; message: string };

/**
 * Memeriksa kelayakan pengajuan sewa sebelum dikirim ke server.
 *
 * Validasi ini dijalankan ganda: di klien untuk umpan balik cepat, dan di
 * server sebagai sumber kebenaran (lihat `POST /api/rentals`). Keduanya
 * memanggil modul `availability` yang sama, sehingga pesannya identik.
 *
 * Biaya sewa dihitung oleh `calculateRentalCost()` — modul yang sama dengan
 * dokumen cetak & laporan, sehingga estimasi di layar tidak bisa berbeda
 * dengan angka pada tagihan.
 */
export function checkRentalRequest(
  equipment: Equipment | null | undefined,
  rentals: readonly Rental[],
  from: string,
  to: string
): RentalRequestCheck {
  if (!equipment) {
    return {
      ok: false,
      code: 'UNIT_TIDAK_TERSEDIA',
      message: 'Unit yang dipilih tidak tersedia. Silakan pilih unit lain pada katalog.',
    };
  }

  // Rentang tanggal terbalik DITOLAK: pada form pengajuan pelanggan,
  // `normalizeBookingRange` menukar tanggal secara diam-diam, sehingga
  // kesalahan ketik (selesai sebelum mulai) justru terkirim sebagai sewa
  // yang sah dan mengunci unit pada periode yang tidak diminta.
  const start = toSafeTime(from);
  const end = toSafeTime(to);
  if (start === null || end === null || start > end) {
    return {
      ok: false,
      code: 'PERIODE_TIDAK_VALID',
      message: 'Periode sewa tidak valid. Pastikan tanggal selesai tidak lebih awal dari tanggal mulai.',
    };
  }

  if (isUnitOutOfService(equipment.status)) {
    return {
      ok: false,
      code: 'UNIT_TIDAK_TERSEDIA',
      message: `${equipment.equipment_code} sedang dalam perawatan dan belum dapat disewa.`,
    };
  }

  const [availability] = buildEquipmentAvailability([equipment], rentals, from, to);
  if (!availability.isBookable) {
    const bentrok = availability.conflicts[0];
    return {
      ok: false,
      code: 'UNIT_TIDAK_TERSEDIA',
      message: bentrok
        ? `${equipment.equipment_code} sudah dipesan pada ${formatTanggal(bentrok.startDate)} – ${formatTanggal(bentrok.endDate)}. Silakan pilih periode lain.`
        : `${equipment.equipment_code} tidak tersedia pada periode tersebut.`,
    };
  }

  const biaya = calculateRentalCost(toSafeNumber(equipment.rental_price_per_day), from, to, null);

  if (biaya.days > BATAS_HARI_SEWA_MAKSIMAL) {
    return {
      ok: false,
      code: 'DURASI_MELEBIHI_BATAS',
      message: `Durasi sewa maksimal ${BATAS_HARI_SEWA_MAKSIMAL} hari. Silakan hubungi Account Manager Anda untuk kontrak jangka panjang.`,
    };
  }

  return {
    ok: true,
    rentalDays: biaya.days,
    subtotal: biaya.subtotal,
    totalDays: biaya.days,
  };
}
