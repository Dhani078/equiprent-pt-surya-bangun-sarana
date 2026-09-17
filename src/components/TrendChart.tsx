import React, { useMemo, useState } from 'react'

/** Satu titik data pada grafik. */
export interface TrendPoint {
	/** Label sumbu X, mis. “Jan”. */
	label: string
	/** Nilai sumbu Y. */
	value: number
}

interface TrendChartProps {
	title: string
	subtitle?: string
	data: readonly TrendPoint[]
	/** Pemformat nilai untuk tooltip & sumbu Y (mis. formatRupiah). */
	formatValue: (value: number) => string
	variant?: 'area' | 'bar'
	color?: string
	height?: number
}

const LEBAR = 720
const PADDING = { atas: 16, kanan: 16, bawah: 28, kiri: 64 }

/** Meringkas angka besar pada sumbu Y: 1.500.000 → 1,5jt. */
export function ringkasAngka(nilai: number): string {
	const abs = Math.abs(nilai)
	if (abs >= 1_000_000_000) return `${(nilai / 1_000_000_000).toFixed(1).replace('.', ',')}M`
	if (abs >= 1_000_000) return `${(nilai / 1_000_000).toFixed(1).replace('.', ',')}jt`
	if (abs >= 1_000) return `${(nilai / 1_000).toFixed(0)}rb`
	return nilai.toFixed(0)
}

/**
 * Grafik tren SVG mandiri — tanpa pustaka chart pihak ketiga sehingga tidak
 * menambah ukuran bundel dan tetap tajam di layar beresolusi tinggi.
 *
 * Aksesibilitas: setiap titik punya `<title>` sehingga nilainya terbaca oleh
 * pembaca layar dan tampil sebagai tooltip bawaan peramban.
 */
export const TrendChart: React.FC<TrendChartProps> = ({
	title,
	subtitle,
	data,
	formatValue,
	variant = 'area',
	color = 'var(--color-primary)',
	height = 220,
}) => {
	const [sorot, setSorot] = useState<number | null>(null)

	const geometri = useMemo(() => {
		const nilai = data.map((d) => d.value)
		const maksimum = Math.max(1, ...nilai)
		const areaLebar = LEBAR - PADDING.kiri - PADDING.kanan
		const areaTinggi = height - PADDING.atas - PADDING.bawah
		const langkah = data.length > 1 ? areaLebar / (data.length - 1) : areaLebar

		const titik = data.map((d, i) => ({
			...d,
			x: PADDING.kiri + (data.length > 1 ? i * langkah : areaLebar / 2),
			y: PADDING.atas + areaTinggi - (d.value / maksimum) * areaTinggi,
		}))

		return { titik, maksimum, areaLebar, areaTinggi }
	}, [data, height])

	const { titik, maksimum, areaLebar, areaTinggi } = geometri

	const garis = titik.map((t) => `${t.x.toFixed(1)},${t.y.toFixed(1)}`).join(' ')
	const area =
		titik.length > 0
			? `${PADDING.kiri},${(PADDING.atas + areaTinggi).toFixed(1)} ${garis} ${(PADDING.kiri + areaLebar).toFixed(1)},${(PADDING.atas + areaTinggi).toFixed(1)}`
			: ''

	const kisi = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
		y: PADDING.atas + areaTinggi - f * areaTinggi,
		nilai: maksimum * f,
	}))

	const aktif = sorot !== null ? titik[sorot] : null
	const lebarBatang = titik.length > 0 ? Math.min(46, (areaLebar / titik.length) * 0.62) : 0

	return (
		<div className="card-premium animate-fade-in" style={{ padding: '18px 20px' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					gap: '12px',
					flexWrap: 'wrap',
				}}
			>
				<div>
					<h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: 'var(--color-primary)' }}>{title}</h3>
					{subtitle && (
						<p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--color-secondary)' }}>{subtitle}</p>
					)}
				</div>
				<div
					aria-live="polite"
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: '12px',
						fontWeight: 700,
						color: 'var(--color-primary)',
						backgroundColor: 'rgba(0, 51, 102, 0.06)',
						padding: '5px 10px',
						borderRadius: '6px',
						minHeight: '26px',
					}}
				>
					{aktif ? `${aktif.label}: ${formatValue(aktif.value)}` : `Puncak: ${formatValue(maksimum)}`}
				</div>
			</div>

			{data.length === 0 ? (
				<p style={{ padding: '32px 0', textAlign: 'center', fontSize: '13px', color: 'var(--color-secondary)' }}>
					Belum ada data untuk digambarkan.
				</p>
			) : (
				<svg
					viewBox={`0 0 ${LEBAR} ${height}`}
					role="img"
					aria-label={`${title}. ${data.map((d) => `${d.label}: ${formatValue(d.value)}`).join(', ')}`}
					style={{ width: '100%', height: 'auto', marginTop: '10px', overflow: 'visible' }}
				>
					{kisi.map((g, i) => (
						<g key={`kisi-${i}`}>
							<line
								x1={PADDING.kiri}
								y1={g.y}
								x2={PADDING.kiri + areaLebar}
								y2={g.y}
								stroke="var(--color-border)"
								strokeWidth={1}
								strokeDasharray={i === 0 ? '0' : '4 4'}
							/>
							<text
								x={PADDING.kiri - 8}
								y={g.y + 3.5}
								textAnchor="end"
								fontSize={9.5}
								fill="var(--color-secondary)"
								fontFamily="var(--font-mono)"
							>
								{ringkasAngka(g.nilai)}
							</text>
						</g>
					))}

					{variant === 'area' ? (
						<g>
							<polygon points={area} fill={color} opacity={0.12} />
							<polyline
								points={garis}
								fill="none"
								stroke={color}
								strokeWidth={2.5}
								strokeLinejoin="round"
								strokeLinecap="round"
							/>
						</g>
					) : (
						<g>
							{titik.map((t, i) => (
								<rect
									key={`bar-${t.label}`}
									x={t.x - lebarBatang / 2}
									y={t.y}
									width={lebarBatang}
									height={Math.max(1, PADDING.atas + areaTinggi - t.y)}
									rx={4}
									fill={color}
									opacity={sorot === null || sorot === i ? 0.9 : 0.45}
								/>
							))}
						</g>
					)}

					{titik.map((t, i) => (
						<g
							key={`titik-${t.label}`}
							onMouseEnter={() => setSorot(i)}
							onMouseLeave={() => setSorot(null)}
							style={{ cursor: 'pointer' }}
						>
							<title>{`${t.label}: ${formatValue(t.value)}`}</title>
							{variant === 'area' && (
								<circle
									cx={t.x}
									cy={t.y}
									r={sorot === i ? 5.5 : 3.5}
									fill="#FFFFFF"
									stroke={color}
									strokeWidth={2.5}
								/>
							)}
							<rect
								x={t.x - Math.max(14, lebarBatang / 2)}
								y={PADDING.atas}
								width={Math.max(28, lebarBatang)}
								height={areaTinggi}
								fill="transparent"
							/>
							<text
								x={t.x}
								y={height - 8}
								textAnchor="middle"
								fontSize={10}
								fontWeight={sorot === i ? 800 : 500}
								fill={sorot === i ? 'var(--color-primary)' : 'var(--color-secondary)'}
							>
								{t.label}
							</text>
						</g>
					))}
				</svg>
			)}
		</div>
	)
}
