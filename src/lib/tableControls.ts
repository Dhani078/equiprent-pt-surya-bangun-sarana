/**
 * Utilitas pencarian, penyaringan, dan pengurutan tabel.
 *
 * Semua fungsi murni (pure) sehingga bisa diuji tanpa DOM dan dipakai ulang
 * oleh setiap halaman tabel.
 */

export type SortDirection = 'asc' | 'desc'

export interface SortState {
	key: string
	direction: SortDirection
}

/** Menormalkan teks: huruf kecil, spasi rapat, tanpa spasi tepi. */
export function normalisasiTeks(nilai: unknown): string {
	if (nilai === null || nilai === undefined) return ''
	return String(nilai).toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Mencocokkan satu baris dengan kueri pencarian.
 *
 * Setiap kata pada kueri harus ditemukan (logika AND) di salah satu field,
 * sehingga “excavator ahmad” tetap menemukan baris walau kedua kata berada
 * pada kolom berbeda.
 */
export function cocokPencarian<T>(
	row: T,
	kueri: string,
	fields: ReadonlyArray<(row: T) => unknown>
): boolean {
	const kata = normalisasiTeks(kueri).split(' ').filter(Boolean)
	if (kata.length === 0) return true

	const korpus = fields.map((ambil) => normalisasiTeks(ambil(row))).join(' | ')
	return kata.every((k) => korpus.includes(k))
}

/** Membandingkan dua nilai apa pun secara stabil (angka, tanggal, teks). */
export function bandingkanNilai(a: unknown, b: unknown): number {
	const aKosong = a === null || a === undefined || a === ''
	const bKosong = b === null || b === undefined || b === ''
	if (aKosong && bKosong) return 0
	if (aKosong) return 1 // nilai kosong selalu di akhir
	if (bKosong) return -1

	if (typeof a === 'number' && typeof b === 'number') return a - b
	if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)

	const teksA = String(a)
	const teksB = String(b)

	// Tanggal ISO (YYYY-MM-DD) aman dibandingkan sebagai teks.
	return teksA.localeCompare(teksB, 'id-ID', { numeric: true, sensitivity: 'base' })
}

/**
 * Mengurutkan salinan baris berdasarkan `sort`.
 * Bila `sort` null atau kuncinya tidak dikenal, urutan asli dipertahankan.
 */
export function urutkanBaris<T>(
	rows: readonly T[],
	sort: SortState | null,
	accessors: Record<string, (row: T) => unknown>
): T[] {
	const salinan = [...rows]
	if (!sort) return salinan

	const ambil = accessors[sort.key]
	if (!ambil) return salinan

	const arah = sort.direction === 'asc' ? 1 : -1
	return salinan.sort((a, b) => bandingkanNilai(ambil(a), ambil(b)) * arah)
}

/**
 * Menentukan keadaan urut berikutnya saat header kolom diklik:
 * naik → turun → tanpa urut.
 */
export function sortBerikutnya(sekarang: SortState | null, key: string): SortState | null {
	if (!sekarang || sekarang.key !== key) return { key, direction: 'asc' }
	if (sekarang.direction === 'asc') return { key, direction: 'desc' }
	return null
}

/** Filter kesamaan sederhana; nilai `SEMUA`/kosong berarti tanpa filter. */
export function saringSamaDengan(nilai: unknown, pilihan: string): boolean {
	if (!pilihan || pilihan === 'SEMUA') return true
	return String(nilai ?? '') === pilihan
}

/** Filter rentang tanggal inklusif (format ISO `YYYY-MM-DD`); batas kosong diabaikan. */
export function saringRentangTanggal(tanggal: string | null | undefined, dari: string, sampai: string): boolean {
	if (!tanggal) return !dari && !sampai
	const hari = tanggal.slice(0, 10)
	if (dari && hari < dari) return false
	if (sampai && hari > sampai) return false
	return true
}

/** Ringkasan filter aktif untuk dicetak pada header ekspor. */
export function ringkasFilter(bagian: Record<string, string>): string {
	const aktif = Object.entries(bagian)
		.filter(([, nilai]) => nilai && nilai !== 'SEMUA')
		.map(([label, nilai]) => `${label}: ${nilai}`)
	return aktif.length > 0 ? aktif.join(' • ') : 'Tanpa filter'
}
