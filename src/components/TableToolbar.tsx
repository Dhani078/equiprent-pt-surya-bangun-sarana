import React from 'react'
import { Search, FileSpreadsheet, FileText, Download, X } from 'lucide-react'
import type { ExportFormat } from '../lib/tableExport'
import { useTerjemahan } from '../lib/i18n'

/** Satu pilihan pada dropdown filter. */
export interface FilterOption {
	value: string
	label: string
}

/** Satu dropdown filter pada bilah alat. */
export interface ToolbarFilter {
	id: string
	label: string
	/** Nilai terpilih saat ini (`'SEMUA'` berarti tanpa filter). */
	value: string
	/** Daftar pilihan (opsi “Semua” ditambahkan otomatis). */
	options: readonly FilterOption[]
	onChange: (value: string) => void
}

interface TableToolbarProps {
	search: string
	onSearchChange: (value: string) => void
	searchPlaceholder?: string
	filters?: readonly ToolbarFilter[]
	onExport: (format: ExportFormat) => void
	/** Jumlah baris setelah filter. */
	shownCount: number
	/** Jumlah baris sebelum filter. */
	totalCount: number
	onReset: () => void
	/** Elemen tambahan di ujung kanan (mis. tombol “Tambah”). */
	children?: React.ReactNode
}

const GAYA_LABEL: React.CSSProperties = {
	display: 'block',
	fontSize: '10.5px',
	fontWeight: 700,
	letterSpacing: '0.04em',
	textTransform: 'uppercase',
	color: 'var(--color-secondary)',
	marginBottom: '4px',
}

/**
 * Bilah alat tabel: pencarian bebas, dropdown filter, penghitung baris,
 * tombol reset, dan tiga tombol ekspor (CSV, Excel, PDF).
 *
 * Komponen murni presentasi — seluruh keadaan dipegang halaman pemanggil
 * sehingga mudah diuji dan bisa dipakai ulang di semua tabel.
 *
 * T-0074: seluruh label lewat `t()` agar bilah alat ikut berbahasa
 * ID/EN bersama dashboard/login. Placeholder pencarian yang dipasangkan
 * halaman (string literal) tetap dihormati bila pengubah bahasa aktif.
 */
export const TableToolbar: React.FC<TableToolbarProps> = ({
	search,
	onSearchChange,
	searchPlaceholder,
	filters = [],
	onExport,
	shownCount,
	totalCount,
	onReset,
	children,
}) => {
	const { t } = useTerjemahan()
	const adaFilterAktif = search.trim() !== '' || filters.some((f) => f.value !== 'SEMUA' && f.value !== '')

	return (
		<div
			className="card-premium"
			role="search"
			style={{
				padding: '14px 16px',
				marginBottom: '16px',
				display: 'flex',
				flexWrap: 'wrap',
				alignItems: 'flex-end',
				gap: '12px',
			}}
		>
			<div style={{ flex: '1 1 260px', minWidth: '220px' }}>
				<label style={GAYA_LABEL} htmlFor="toolbar-search">
					{t('toolbar.pencarian')}
				</label>
				<div style={{ position: 'relative' }}>
					<Search
						size={15}
						color="var(--color-secondary)"
						aria-hidden="true"
						style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
					/>
					<input
						id="toolbar-search"
						type="text"
						role="searchbox"
						className="input-premium"
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={searchPlaceholder ?? t('toolbar.cari')}
						aria-label={t('toolbar.pencarian')}
						style={{ paddingLeft: '34px', width: '100%' }}
					/>
				</div>
			</div>

			{filters.map((f) => (
				<div key={f.id} style={{ flex: '0 1 172px', minWidth: '150px' }}>
					<label style={GAYA_LABEL} htmlFor={`toolbar-filter-${f.id}`}>
						{f.label}
					</label>
					<select
						id={`toolbar-filter-${f.id}`}
						className="input-premium"
						value={f.value}
						onChange={(e) => f.onChange(e.target.value)}
						style={{ width: '100%' }}
					>
						<option value="SEMUA">{t('toolbar.semua')}</option>
						{f.options.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				</div>
			))}

			<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto', paddingBottom: '2px' }}>
				<span
					aria-live="polite"
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: '11.5px',
						fontWeight: 700,
						color: 'var(--color-primary)',
						backgroundColor: 'rgba(0, 51, 102, 0.06)',
						padding: '8px 10px',
						borderRadius: '6px',
						whiteSpace: 'nowrap',
					}}
				>
					{t('toolbar.baris', { shown: shownCount, total: totalCount })}
				</span>
				{adaFilterAktif && (
					<button
						type="button"
						className="btn-secondary"
						onClick={onReset}
						title={t('toolbar.reset_judul')}
						style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
					>
						<X size={13} /> {t('toolbar.reset')}
					</button>
				)}
			</div>

			<div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '0 0 auto', paddingBottom: '2px' }}>
				<button
					type="button"
					className="btn-secondary"
					onClick={() => onExport('csv')}
					title={t('toolbar.csv_judul')}
					aria-label={t('toolbar.csv_judul')}
					style={{ padding: '8px 11px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
				>
					<Download size={13} aria-hidden="true" /> CSV
				</button>
				<button
					type="button"
					className="btn-secondary"
					onClick={() => onExport('excel')}
					title={t('toolbar.excel_judul')}
					aria-label={t('toolbar.excel_judul')}
					style={{ padding: '8px 11px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
				>
					<FileSpreadsheet size={13} color="#047857" aria-hidden="true" /> Excel
				</button>
				<button
					type="button"
					className="btn-primary"
					onClick={() => onExport('pdf')}
					title={t('toolbar.pdf_judul')}
					aria-label={t('toolbar.pdf_judul')}
					style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
				>
					<FileText size={13} aria-hidden="true" /> PDF
				</button>
				{children}
			</div>
		</div>
	)
}
