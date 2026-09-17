import React, { useEffect, useRef, useState } from 'react'
import { Bell, BellOff, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import type { NotificationItem, NotificationTone } from '../lib/notifications'
import { hitungMendesak } from '../lib/notifications'

interface NotificationCenterProps {
	/** Daftar notifikasi hasil `buildNotifications`. */
	items: readonly NotificationItem[]
	/** Dipanggil dengan id tab tujuan saat notifikasi diklik. */
	onNavigate: (tab: string) => void
}

/** Warna per tingkat urgensi. */
const WARNA: Record<NotificationTone, { teks: string; latar: string; tepi: string }> = {
	danger: { teks: '#991B1B', latar: '#FEF2F2', tepi: '#FECACA' },
	warning: { teks: '#92400E', latar: '#FFFBEB', tepi: '#FDE68A' },
	info: { teks: '#1E40AF', latar: '#EFF6FF', tepi: '#BFDBFE' },
}

/** Ikon per tingkat urgensi. */
function IkonTone({ tone }: { tone: NotificationTone }) {
	const warna = WARNA[tone].teks
	if (tone === 'danger') return <AlertCircle size={15} color={warna} />
	if (tone === 'warning') return <AlertTriangle size={15} color={warna} />
	return <Info size={15} color={warna} />
}

/**
 * Pusat notifikasi di navbar: lonceng dengan angka jumlah, dan panel berisi
 * butir notifikasi yang bisa diklik untuk langsung melompat ke halaman terkait.
 *
 * Panel tertutup otomatis saat pengguna mengklik di luar area atau menekan Esc.
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({ items, onNavigate }) => {
	const [open, setOpen] = useState(false)
	const wadahRef = useRef<HTMLDivElement | null>(null)
	const mendesak = hitungMendesak(items)

	useEffect(() => {
		if (!open) return

		const klikLuar = (e: MouseEvent) => {
			if (wadahRef.current && !wadahRef.current.contains(e.target as Node)) setOpen(false)
		}
		const tekanEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false)
		}

		document.addEventListener('mousedown', klikLuar)
		document.addEventListener('keydown', tekanEsc)
		return () => {
			document.removeEventListener('mousedown', klikLuar)
			document.removeEventListener('keydown', tekanEsc)
		}
	}, [open])

	const buka = (tab: string) => {
		onNavigate(tab)
		setOpen(false)
	}

	return (
		<div ref={wadahRef} style={{ position: 'relative' }}>
			<button
				type="button"
				className="btn-secondary"
				onClick={() => setOpen((o) => !o)}
				aria-haspopup="true"
				aria-expanded={open}
				aria-label={`Pusat notifikasi — ${items.length} pemberitahuan, ${mendesak} mendesak`}
				title="Pusat notifikasi"
				style={{ padding: '7px 10px', position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}
			>
				{items.length === 0 ? <BellOff size={15} /> : <Bell size={15} />}
				{items.length > 0 && (
					<span
						style={{
							position: 'absolute',
							top: '-6px',
							right: '-6px',
							minWidth: '19px',
							height: '19px',
							padding: '0 5px',
							borderRadius: '999px',
							backgroundColor: mendesak > 0 ? '#DC2626' : '#F59E0B',
							color: '#FFFFFF',
							fontSize: '10.5px',
							fontWeight: 800,
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							lineHeight: 1,
							boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
						}}
					>
						{items.length > 99 ? '99+' : items.length}
					</span>
				)}
			</button>

			{open && (
				<div
					role="dialog"
					aria-label="Daftar notifikasi"
					className="animate-fade-in"
					style={{
						position: 'absolute',
						right: 0,
						top: '44px',
						width: '360px',
						maxWidth: 'calc(100vw - 32px)',
						backgroundColor: '#FFFFFF',
						borderRadius: 'var(--radius-eight)',
						border: '1px solid var(--color-border)',
						boxShadow: 'var(--shadow-lg)',
						zIndex: 1000,
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							padding: '12px 14px',
							borderBottom: '1px solid var(--color-border)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)' }}>Pusat Notifikasi</span>
						<span style={{ fontSize: '11px', color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}>
							{mendesak} mendesak
						</span>
					</div>

					<div style={{ maxHeight: '390px', overflowY: 'auto', padding: '8px' }}>
						{items.length === 0 ? (
							<div style={{ padding: '26px 14px', textAlign: 'center' }}>
								<CheckCircle2 size={26} color="var(--color-success)" />
								<p style={{ margin: '8px 0 0 0', fontSize: '12.5px', fontWeight: 600, color: 'var(--color-secondary)' }}>
									Tidak ada yang perlu ditindak. Semua beres.
								</p>
							</div>
						) : (
							items.map((n) => {
								const warna = WARNA[n.tone]
								return (
									<button
										key={n.id}
										type="button"
										onClick={() => buka(n.tab)}
										style={{
											display: 'flex',
											alignItems: 'flex-start',
											gap: '10px',
											width: '100%',
											textAlign: 'left',
											padding: '10px 11px',
											marginBottom: '6px',
											borderRadius: '7px',
											border: `1px solid ${warna.tepi}`,
											backgroundColor: warna.latar,
											cursor: 'pointer',
											transition: 'var(--transition-base)',
										}}
									>
										<span style={{ marginTop: '1px', flexShrink: 0 }}>
											<IkonTone tone={n.tone} />
										</span>
										<span style={{ flex: 1 }}>
											<span
												style={{
													display: 'block',
													fontSize: '12.5px',
													fontWeight: 700,
													color: warna.teks,
													lineHeight: 1.35,
												}}
											>
												{n.title}
											</span>
											<span
												style={{ display: 'block', fontSize: '11.5px', color: warna.teks, opacity: 0.85, marginTop: '2px' }}
											>
												{n.detail}
											</span>
										</span>
									</button>
								)
							})
						)}
					</div>
				</div>
			)}
		</div>
	)
}
