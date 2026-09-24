import type { Contract, Maintenance, Payment, Rental, RoleName } from '../types'
import { formatRupiah, formatTanggal } from './businessRules'

/**
 * Penyusun isi Pusat Notifikasi.
 *
 * Modul murni: tidak menyentuh DOM maupun jaringan, sehingga bisa diuji dan
 * dipakai baik oleh navbar maupun dasbor.
 */

export type NotificationTone = 'danger' | 'warning' | 'info'

/** Kategori pengelompokan notifikasi di Pusat Notifikasi. */
export type NotificationKategori = 'pembayaran' | 'persetujuan' | 'perawatan' | 'kontrak' | 'pengembalian'

export interface NotificationItem {
	/** Id unik & stabil (dipakai sebagai key React). */
	id: string
	title: string
	detail: string
	tone: NotificationTone
	/** Kelompok notifikasi (dipakai untuk header pengelompokan di panel). */
	kategori: NotificationKategori
	/** Id tab tujuan saat notifikasi diklik. */
	tab: string
}

/** Label tampil per kategori (urutan pengelompokan mengikuti definisi tipe). */
export const LABEL_KATEGORI: Readonly<Record<NotificationKategori, string>> = {
	pembayaran: 'Pembayaran',
	persetujuan: 'Persetujuan Sewa',
	perawatan: 'Jadwal Perawatan',
	kontrak: 'Kontrak',
	pengembalian: 'Pengembalian Unit',
}

/** Urutan kelompok di panel: paling mendesak dulu. */
export const URUTAN_KATEGORI: readonly NotificationKategori[] = [
	'pembayaran',
	'persetujuan',
	'perawatan',
	'pengembalian',
	'kontrak',
]

/** Sumber data yang dibutuhkan untuk menyusun notifikasi. */
export interface NotificationSource {
	rentals: readonly Rental[]
	payments: readonly Payment[]
	maintenance: readonly Maintenance[]
	contracts: readonly Contract[]
}

/** Sewa yang berakhir dalam N hari dianggap mendekati jatuh tempo. */
export const AMBANG_JATUH_TEMPO_HARI = 3

/** Selisih hari kalender antara dua tanggal (positif bila `ke` setelah `dari`). */
export function selisihHari(dari: Date, ke: Date): number {
	const SEHARI = 24 * 60 * 60 * 1000
	const a = Date.UTC(dari.getFullYear(), dari.getMonth(), dari.getDate())
	const b = Date.UTC(ke.getFullYear(), ke.getMonth(), ke.getDate())
	return Math.round((b - a) / SEHARI)
}

/**
 * Menyusun daftar notifikasi sesuai peran.
 *
 * - ADMIN & STAFF: pembayaran menunggu verifikasi, sewa menunggu persetujuan,
 *   jadwal perawatan hari ini/terlewat, dan sewa telat/mendekati jatuh tempo.
 * - CUSTOMER: hanya miliknya sendiri — tagihan belum dibayar/gagal, kontrak
 *   belum ditandatangani, serta sewa telat/mendekati jatuh tempo.
 */
export function buildNotifications(
	source: NotificationSource,
	role: RoleName,
	userId: number,
	now: Date = new Date()
): NotificationItem[] {
	const items: NotificationItem[] = []
	const internal = role === 'ADMIN' || role === 'STAFF'

	const sewaSaya = internal ? source.rentals : source.rentals.filter((r) => r.customer_id === userId)

	if (internal) {
		const perluVerifikasi = source.payments.filter((p) => p.status === 'PENDING_VERIFICATION')
		for (const p of perluVerifikasi) {
			items.push({
				id: `pay-verify-${p.id}`,
				title: `Pembayaran ${p.payment_code} menunggu verifikasi`,
				detail: `${formatRupiah(p.amount)} • ${p.payment_method} • ${formatTanggal(p.payment_date)}`,
				tone: 'warning',
				kategori: 'pembayaran',
				tab: 'payments',
			})
		}

		const sewaPending = source.rentals.filter((r) => r.status === 'PENDING')
		for (const r of sewaPending) {
			items.push({
				id: `rental-pending-${r.id}`,
				title: `Pengajuan sewa ${r.rental_code} menunggu persetujuan`,
				detail: `${r.customer_name ?? 'Pelanggan'} • ${r.equipment_name ?? 'Unit'} • ${formatTanggal(r.start_date)}`,
				tone: 'info',
				kategori: 'persetujuan',
				tab: 'rentals',
			})
		}

		const perawatan = source.maintenance.filter(
			(m) => m.status === 'SCHEDULED' && selisihHari(now, new Date(m.scheduled_date)) <= 0
		)
		for (const m of perawatan) {
			const selisih = selisihHari(new Date(m.scheduled_date), now)
			items.push({
				id: `maint-${m.id}`,
				title:
				selisih > 0
					? `Perawatan ${m.maintenance_code} terlewat ${selisih} hari`
					: `Perawatan ${m.maintenance_code} dijadwalkan hari ini`,
				detail: `${m.maintenance_type} • HM ${m.hour_meter_at_maintenance} • ${formatTanggal(m.scheduled_date)}`,
				tone: selisih > 0 ? 'danger' : 'warning',
				kategori: 'perawatan',
				tab: 'maintenance',
			})
		}
	} else {
		const tagihan = source.payments.filter(
			(p) => p.customer_id === userId && (p.status === 'UNPAID' || p.status === 'FAILED')
		)
		for (const p of tagihan) {
			items.push({
				id: `pay-due-${p.id}`,
				title:
				p.status === 'FAILED'
					? `Pembayaran ${p.payment_code} ditolak`
					: `Tagihan ${p.payment_code} belum dibayar`,
				detail: `${formatRupiah(p.amount)} • unggah ulang bukti transfer bila perlu`,
				tone: p.status === 'FAILED' ? 'danger' : 'warning',
				kategori: 'pembayaran',
				tab: 'payments',
			})
		}

		const kontrakBelumTtd = source.contracts.filter(
			(c) => c.customer_id === userId && !c.is_signed_customer
		)
		for (const c of kontrakBelumTtd) {
			items.push({
				id: `contract-${c.id}`,
				title: `Kontrak ${c.contract_code} belum ditandatangani`,
				detail: `Berlaku sampai ${formatTanggal(c.valid_until)}`,
				tone: 'info',
				kategori: 'kontrak',
				tab: 'contracts',
			})
		}
	}

	// Sewa berjalan yang telat atau mendekati jatuh tempo (berlaku semua peran).
	const berjalan = sewaSaya.filter((r) => r.status === 'ON_GOING' || r.status === 'APPROVED')
	for (const r of berjalan) {
		const sisa = selisihHari(now, new Date(r.end_date))
		if (sisa < 0) {
			items.push({
				id: `rental-late-${r.id}`,
				title: `Sewa ${r.rental_code} telat ${Math.abs(sisa)} hari`,
				detail: `${r.equipment_name ?? 'Unit'} • seharusnya kembali ${formatTanggal(r.end_date)} • denda berjalan`,
				tone: 'danger',
				kategori: 'pengembalian',
				tab: 'rentals',
			})
		} else if (sisa <= AMBANG_JATUH_TEMPO_HARI) {
			items.push({
				id: `rental-due-${r.id}`,
				title: sisa === 0 ? `Sewa ${r.rental_code} berakhir hari ini` : `Sewa ${r.rental_code} berakhir ${sisa} hari lagi`,
				detail: `${r.equipment_name ?? 'Unit'} • jadwal kembali ${formatTanggal(r.end_date)}`,
				tone: 'warning',
				kategori: 'pengembalian',
				tab: 'rentals',
			})
		}
	}

	// Urutan tampil: dikelompokkan & diurutkan oleh `urutkanPerKategori`.
	return urutkanPerKategori(items)
}

// Urutan tampil: dikelompokkan per kategori (paling mendesak dulu), lalu
// di dalam kelompok diurutkan dari tingkat urgensi tertinggi.
export function urutkanPerKategori(items: readonly NotificationItem[]): NotificationItem[] {
	const bobot: Record<NotificationTone, number> = { danger: 0, warning: 1, info: 2 }
	const urutan = new Map(URUTAN_KATEGORI.map((k, i) => [k, i]))
	return [...items].sort((a, b) => {
		const ka = urutan.get(a.kategori) ?? 99
		const kb = urutan.get(b.kategori) ?? 99
		return ka - kb || bobot[a.tone] - bobot[b.tone]
	})
}

/** Menghitung jumlah notifikasi mendesak (perlu tindakan segera). */
export function hitungMendesak(items: readonly NotificationItem[]): number {
	return items.filter((i) => i.tone === 'danger').length
}
