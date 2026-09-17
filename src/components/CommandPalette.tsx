import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search, CornerDownLeft } from 'lucide-react'
import type { RoleName } from '../types'

/** Satu perintah navigasi di palet. */
export interface PaletteCommand {
	/** Id tab tujuan. */
	id: string
	label: string
	keterangan: string
	/** Kata kunci tambahan agar mudah ditemukan. */
	alias: string
}

/** Daftar perintah per peran, mengikuti menu sidebar. */
export const PERINTAH: Record<RoleName, readonly PaletteCommand[]> = {
	ADMIN: [
		{ id: 'dashboard', label: 'Dashboard', keterangan: 'Ringkasan armada & pendapatan', alias: 'beranda home statistik' },
		{ id: 'equipment', label: 'Inventaris Alat', keterangan: 'Kelola unit alat berat', alias: 'unit excavator alat' },
		{ id: 'rentals', label: 'Transaksi Sewa', keterangan: 'Persetujuan & status sewa', alias: 'rental booking sewa' },
		{ id: 'maintenance', label: 'Perawatan', keterangan: 'Jadwal servis preventif', alias: 'servis maintenance bengkel' },
		{ id: 'tracking', label: 'Pelacakan GPS', keterangan: 'Posisi unit di lapangan', alias: 'gps peta lokasi' },
		{ id: 'reports', label: 'Laporan', keterangan: 'Laporan & analitik', alias: 'report analitik rekap' },
		{ id: 'users', label: 'Pengguna', keterangan: 'Manajemen akun & hak akses', alias: 'user akun rbac' },
		{ id: 'settings', label: 'Pengaturan Akun', keterangan: 'Profil & ganti password', alias: 'profil password setting' },
	],
	STAFF: [
		{ id: 'dashboard', label: 'Dashboard Staf', keterangan: 'Antrean kerja harian', alias: 'beranda home' },
		{ id: 'rentals', label: 'Transaksi Sewa', keterangan: 'Proses pengajuan sewa', alias: 'rental sewa' },
		{ id: 'contracts', label: 'Kontrak', keterangan: 'Pembuatan & tanda tangan', alias: 'kontrak perjanjian' },
		{ id: 'payments', label: 'Pembayaran', keterangan: 'Verifikasi bukti bayar', alias: 'bayar invoice transfer' },
		{ id: 'maintenance', label: 'Perawatan', keterangan: 'Jadwal servis unit', alias: 'servis maintenance' },
		{ id: 'tracking', label: 'Pelacakan GPS', keterangan: 'Posisi unit di lapangan', alias: 'gps peta' },
		{ id: 'reports', label: 'Laporan', keterangan: 'Rekap operasional', alias: 'report rekap' },
		{ id: 'settings', label: 'Pengaturan Akun', keterangan: 'Profil & ganti password', alias: 'profil password' },
	],
	CUSTOMER: [
		{ id: 'dashboard', label: 'Beranda', keterangan: 'Ringkasan sewa saya', alias: 'home beranda' },
		{ id: 'rentals', label: 'Sewa Saya', keterangan: 'Ajukan & pantau sewa', alias: 'rental pesan sewa' },
		{ id: 'contracts', label: 'Kontrak Saya', keterangan: 'Tanda tangan digital', alias: 'kontrak ttd' },
		{ id: 'payments', label: 'Pembayaran', keterangan: 'Unggah bukti transfer', alias: 'bayar invoice' },
		{ id: 'tracking', label: 'Pelacakan Unit', keterangan: 'Lokasi unit sewaan', alias: 'gps peta' },
		{ id: 'profile', label: 'Profil Saya', keterangan: 'Data akun perusahaan', alias: 'profil akun' },
	],
}

/** Menyaring perintah berdasarkan kata kunci bebas. */
export function saringPerintah(
	daftar: readonly PaletteCommand[],
	kueri: string
): readonly PaletteCommand[] {
	const q = kueri.trim().toLowerCase()
	if (!q) return daftar
	return daftar.filter((c) =>
		`${c.label} ${c.keterangan} ${c.alias}`.toLowerCase().includes(q)
	)
}

interface CommandPaletteProps {
	role: RoleName
	open: boolean
	onClose: () => void
	onSelect: (tab: string) => void
}

/**
 * Palet perintah ala editor modern (Ctrl/⌘ + K) untuk berpindah halaman
 * tanpa mengangkat tangan dari papan ketik.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({ role, open, onClose, onSelect }) => {
	const [kueri, setKueri] = useState('')
	const [indeks, setIndeks] = useState(0)
	const inputRef = useRef<HTMLInputElement | null>(null)

	const hasil = useMemo(() => saringPerintah(PERINTAH[role] ?? PERINTAH.ADMIN, kueri), [role, kueri])

	useEffect(() => {
		if (open) {
			setKueri('')
			setIndeks(0)
			window.setTimeout(() => inputRef.current?.focus(), 20)
		}
	}, [open])

	if (!open) return null

	const pilih = (tab: string) => {
		onSelect(tab)
		onClose()
	}

	const tekan = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose()
			return
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setIndeks((i) => (hasil.length === 0 ? 0 : (i + 1) % hasil.length))
			return
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault()
			setIndeks((i) => (hasil.length === 0 ? 0 : (i - 1 + hasil.length) % hasil.length))
			return
		}
		if (e.key === 'Enter' && hasil[indeks]) {
			e.preventDefault()
			pilih(hasil[indeks].id)
		}
	}

	return (
		<div
			className="modal-overlay"
			role="presentation"
			onClick={onClose}
			style={{ alignItems: 'flex-start', paddingTop: '12vh', zIndex: 2000 }}
		>
			<div
				role="dialog"
				aria-label="Palet perintah"
				className="animate-fade-in"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={tekan}
				style={{
					width: '560px',
					maxWidth: 'calc(100vw - 32px)',
					backgroundColor: '#FFFFFF',
					borderRadius: '12px',
					boxShadow: 'var(--shadow-lg)',
					overflow: 'hidden',
					border: '1px solid var(--color-border)',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
					<Search size={17} color="var(--color-secondary)" />
					<input
						ref={inputRef}
						value={kueri}
						onChange={(e) => {
							setKueri(e.target.value)
							setIndeks(0)
						}}
						placeholder="Ketik untuk mencari halaman… (Esc untuk menutup)"
						aria-label="Cari perintah"
						style={{
							flex: 1,
							border: 'none',
							outline: 'none',
							fontSize: '14.5px',
							fontFamily: 'var(--font-primary)',
							backgroundColor: 'transparent',
							color: 'var(--color-primary)',
						}}
					/>
				</div>

				<div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
					{hasil.length === 0 ? (
						<p style={{ padding: '22px', textAlign: 'center', fontSize: '13px', color: 'var(--color-secondary)', margin: 0 }}>
							Tidak ada perintah yang cocok.
						</p>
					) : (
						hasil.map((c, i) => (
							<button
								key={c.id}
								type="button"
								onMouseEnter={() => setIndeks(i)}
								onClick={() => pilih(c.id)}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									width: '100%',
									textAlign: 'left',
									padding: '10px 12px',
									borderRadius: '8px',
									border: 'none',
									cursor: 'pointer',
									backgroundColor: i === indeks ? 'rgba(0, 51, 102, 0.07)' : 'transparent',
								}}
							>
								<span>
									<span style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--color-primary)' }}>
										{c.label}
									</span>
									<span style={{ display: 'block', fontSize: '11.5px', color: 'var(--color-secondary)' }}>
										{c.keterangan}
									</span>
								</span>
								{i === indeks && <CornerDownLeft size={14} color="var(--color-secondary)" />}
							</button>
						))
					)}
				</div>

				<div
					style={{
						padding: '9px 16px',
						borderTop: '1px solid var(--color-border)',
						fontSize: '11px',
						color: 'var(--color-secondary)',
						fontFamily: 'var(--font-mono)',
					}}
				>
					↑↓ pilih · Enter buka · Esc tutup · Ctrl/⌘ + K
				</div>
			</div>
		</div>
	)
}
