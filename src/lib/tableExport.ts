import { printHtmlDocument } from './documentPrinter'

/**
 * Ekspor tabel ke CSV, Excel (.xls berbasis HTML), dan PDF (lewat dialog
 * cetak peramban). Tidak memakai pustaka pihak ketiga sehingga ukuran bundel
 * tetap kecil dan ekspor tetap jalan walau offline.
 */

export const NAMA_PERUSAHAAN = 'PT. SURYA BANGUN SARANA'
export const SUB_PERUSAHAAN = 'Banjarmasin — Penyewaan Alat Berat'

export type ExportFormat = 'csv' | 'excel' | 'pdf'

/** Definisi satu kolom ekspor. */
export interface ExportColumn<T> {
	/** Judul kolom pada berkas hasil. */
	header: string
	/** Pengambil nilai sel. */
	value: (row: T) => string | number
	/** Tandai true agar sel disejajarkan kanan (kolom angka). */
	numeric?: boolean
}

/** Metadata dokumen ekspor. */
export interface ExportMeta {
	title: string
	subtitle?: string
	/** Dasar nama berkas; bila kosong diambil dari `title`. */
	filename?: string
}

export type ExportResult = { ok: true; message: string } | { ok: false; message: string }

/** Meloloskan karakter khusus HTML. */
export function escapeHtml(nilai: string | number): string {
	return String(nilai)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

/**
 * Meloloskan satu sel CSV.
 *
 * KEAMANAN: sel yang dimulai dengan `=`, `+`, `-`, atau `@` diberi awalan
 * kutip tunggal supaya Excel tidak mengeksekusinya sebagai formula
 * (CSV formula injection).
 */
export function escapeCsvCell(nilai: string | number): string {
	let teks = String(nilai ?? '')
	if (/^[=+\-@]/.test(teks)) teks = `'${teks}`
	if (/[";\n\r]/.test(teks)) teks = `"${teks.replace(/"/g, '""')}"`
	return teks
}

/** Menyusun isi CSV. Pemisah `;` agar langsung rapi di Excel berlokal Indonesia. */
export function buildCsv<T>(rows: readonly T[], columns: ReadonlyArray<ExportColumn<T>>): string {
	const baris = [columns.map((c) => escapeCsvCell(c.header)).join(';')]
	for (const row of rows) {
		baris.push(columns.map((c) => escapeCsvCell(c.value(row))).join(';'))
	}
	return baris.join('\r\n')
}

const GAYA = `
	body { font-family: 'Hanken Grotesk', Arial, sans-serif; color: #0f172a; margin: 0; padding: 22px; }
	.kop { border-bottom: 3px solid #003366; padding-bottom: 10px; margin-bottom: 14px; }
	.kop h1 { margin: 0; font-size: 17px; color: #003366; letter-spacing: 0.02em; }
	.kop p { margin: 2px 0 0 0; font-size: 11px; color: #475569; }
	.judul { margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #003366; }
	.sub { margin: 0 0 12px 0; font-size: 11px; color: #475569; }
	table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
	th { background: #003366; color: #ffffff; text-align: left; padding: 7px 8px; border: 1px solid #002244; }
	td { padding: 6px 8px; border: 1px solid #cbd5e1; }
	tr:nth-child(even) td { background: #f5f8fb; }
	td.angka, th.angka { text-align: right; }
	.kaki { margin-top: 12px; font-size: 9.5px; color: #64748b; }
`

function buildTabelHtml<T>(rows: readonly T[], columns: ReadonlyArray<ExportColumn<T>>): string {
	const thead = columns
		.map((c) => `<th class="${c.numeric ? 'angka' : ''}">${escapeHtml(c.header)}</th>`)
		.join('')
	const tbody = rows
		.map(
			(row) =>
				`<tr>${columns
					.map((c) => `<td class="${c.numeric ? 'angka' : ''}">${escapeHtml(c.value(row))}</td>`)
					.join('')}</tr>`
		)
		.join('')
	return `<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`
}

/** Menyusun dokumen HTML untuk berkas Excel (.xls). */
export function buildExcelHtml<T>(
	rows: readonly T[],
	columns: ReadonlyArray<ExportColumn<T>>,
	meta: ExportMeta,
	stempel: string
): string {
	return `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /><style>${GAYA}</style></head><body>
<div class="kop"><h1>${escapeHtml(NAMA_PERUSAHAAN)}</h1><p>${escapeHtml(SUB_PERUSAHAAN)}</p></div>
<p class="judul">${escapeHtml(meta.title)}</p>
<p class="sub">${escapeHtml(meta.subtitle ?? '')}</p>
${buildTabelHtml(rows, columns)}
<p class="kaki">Diekspor ${escapeHtml(stempel)} — ${rows.length} baris.</p>
</body></html>`
}

/** Menyusun dokumen HTML siap cetak (A4 lanskap) untuk PDF. */
export function buildPrintHtml<T>(
	rows: readonly T[],
	columns: ReadonlyArray<ExportColumn<T>>,
	meta: ExportMeta,
	stempel: string
): string {
	return `<html><head><meta charset="UTF-8" /><title>${escapeHtml(meta.title)}</title><style>@page { size: A4 landscape; margin: 12mm; }${GAYA}</style></head><body>
<div class="kop"><h1>${escapeHtml(NAMA_PERUSAHAAN)}</h1><p>${escapeHtml(SUB_PERUSAHAAN)}</p></div>
<p class="judul">${escapeHtml(meta.title)}</p>
<p class="sub">${escapeHtml(meta.subtitle ?? '')}</p>
${buildTabelHtml(rows, columns)}
<p class="kaki">Dicetak ${escapeHtml(stempel)} — ${rows.length} baris. Dokumen dihasilkan otomatis oleh sistem EquipRent.</p>
</body></html>`
}

/** Menyusun nama berkas: `sbs-<judul>-<YYYYMMDD>.<ext>`. */
export function buildExportFilename(dasar: string, ekstensi: 'csv' | 'xls', now: Date = new Date()): string {
	const slug =
		dasar
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 48) || 'data'
	const tanggal = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
	return `sbs-${slug}-${tanggal}.${ekstensi}`
}

/** Memicu unduhan berkas teks di peramban. */
function unduhBerkas(isi: string, namaBerkas: string, mime: string): boolean {
	if (typeof document === 'undefined' || typeof URL === 'undefined') return false

	// BOM agar Excel mengenali UTF-8 (nama pelanggan dengan aksen tetap benar).
	const blob = new Blob([`\uFEFF${isi}`], { type: mime })
	const url = URL.createObjectURL(blob)
	const tautan = document.createElement('a')
	tautan.href = url
	tautan.download = namaBerkas
	document.body.appendChild(tautan)
	tautan.click()
	document.body.removeChild(tautan)
	// Beri jeda agar unduhan sempat dimulai sebelum URL dilepas.
	window.setTimeout(() => URL.revokeObjectURL(url), 2000)
	return true
}

function stempelWaktu(now: Date): string {
	return now.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
}

/**
 * Mengekspor tabel ke format yang diminta.
 *
 * Mengembalikan pesan siap tampil sehingga pemanggil cukup meneruskannya ke
 * notifikasi toast.
 */
export function exportTable<T>(
	format: ExportFormat,
	rows: readonly T[],
	columns: ReadonlyArray<ExportColumn<T>>,
	meta: ExportMeta,
	now: Date = new Date()
): ExportResult {
	if (rows.length === 0) {
		return { ok: false, message: 'Tidak ada baris untuk diekspor. Longgarkan filter terlebih dahulu.' }
	}

	const dasar = meta.filename ?? meta.title
	const stempel = stempelWaktu(now)

	if (format === 'csv') {
		const berhasil = unduhBerkas(buildCsv(rows, columns), buildExportFilename(dasar, 'csv', now), 'text/csv;charset=utf-8')
		return berhasil
			? { ok: true, message: `CSV berisi ${rows.length} baris berhasil diunduh.` }
			: { ok: false, message: 'Peramban ini tidak mengizinkan unduhan berkas.' }
	}

	if (format === 'excel') {
		const berhasil = unduhBerkas(
			buildExcelHtml(rows, columns, meta, stempel),
			buildExportFilename(dasar, 'xls', now),
			'application/vnd.ms-excel;charset=utf-8'
		)
		return berhasil
			? { ok: true, message: `Berkas Excel berisi ${rows.length} baris berhasil diunduh.` }
			: { ok: false, message: 'Peramban ini tidak mengizinkan unduhan berkas.' }
	}

	const hasil = printHtmlDocument({
		html: buildPrintHtml(rows, columns, meta, stempel),
		title: meta.title,
	})
	return hasil.ok
		? { ok: true, message: 'Dialog cetak dibuka — pilih “Save as PDF” untuk menyimpan.' }
		: { ok: false, message: hasil.message }
}
