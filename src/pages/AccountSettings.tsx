import React, { useState } from 'react'
import { Save, KeyRound, ShieldCheck, Server, UserCog } from 'lucide-react'
import type { User } from '../types'
import { getDataMode } from '../lib/db'

/** Perubahan profil yang boleh disimpan pengguna sendiri. */
export interface ProfilePatch {
	full_name: string
	email: string
	phone: string
	address: string
	company_name: string | null
}

interface AccountSettingsProps {
	currentUser: User
	onSaveProfile: (patch: ProfilePatch) => Promise<void>
	onChangePassword: (passwordBaru: string) => Promise<void>
	onNotify: (message: string, tone: 'success' | 'error') => void
}

/** Panjang minimum password — selaras dengan aturan server. */
export const MIN_PANJANG_PASSWORD = 8

/** Memvalidasi perubahan profil; daftar kosong berarti valid. */
export function validasiProfil(patch: ProfilePatch): string[] {
	const galat: string[] = []
	if (patch.full_name.trim().length < 3) galat.push('Nama lengkap minimal 3 karakter.')
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(patch.email.trim())) galat.push('Format surel tidak valid.')
	if (!/^[0-9+\-\s()]{8,20}$/.test(patch.phone.trim())) galat.push('Nomor telepon harus 8–20 karakter angka.')
	if (patch.address.trim().length < 5) galat.push('Alamat minimal 5 karakter.')
	return galat
}

/** Memvalidasi penggantian password; daftar kosong berarti valid. */
export function validasiPassword(baru: string, ulangi: string): string[] {
	const galat: string[] = []
	if (baru.length < MIN_PANJANG_PASSWORD) galat.push(`Password baru minimal ${MIN_PANJANG_PASSWORD} karakter.`)
	if (!/[A-Za-z]/.test(baru) || !/[0-9]/.test(baru)) galat.push('Password harus memuat huruf dan angka.')
	if (baru !== ulangi) galat.push('Konfirmasi password tidak sama.')
	return galat
}

const GAYA_LABEL: React.CSSProperties = {
	display: 'block',
	fontSize: '11px',
	fontWeight: 700,
	letterSpacing: '0.03em',
	textTransform: 'uppercase',
	color: 'var(--color-secondary)',
	marginBottom: '5px',
}

const GAYA_KARTU: React.CSSProperties = { padding: '20px 22px', marginBottom: '18px' }

const GAYA_GALAT: React.CSSProperties = {
	margin: '0 0 14px 0',
	padding: '10px 14px 10px 30px',
	borderRadius: '7px',
	backgroundColor: '#FEF2F2',
	border: '1px solid #FECACA',
	color: '#991B1B',
	fontSize: '12.5px',
	fontWeight: 600,
}

/**
 * Halaman Pengaturan Akun — profil dan password benar-benar tersimpan
 * (sebelumnya tab “Pengaturan” hanya berisi teks statis).
 */
export const AccountSettings: React.FC<AccountSettingsProps> = ({
	currentUser,
	onSaveProfile,
	onChangePassword,
	onNotify,
}) => {
	const [profil, setProfil] = useState<ProfilePatch>({
		full_name: currentUser.full_name,
		email: currentUser.email,
		phone: currentUser.phone,
		address: currentUser.address,
		company_name: currentUser.company_name,
	})
	const [galatProfil, setGalatProfil] = useState<string[]>([])
	const [menyimpanProfil, setMenyimpanProfil] = useState(false)

	const [passwordBaru, setPasswordBaru] = useState('')
	const [ulangiPassword, setUlangiPassword] = useState('')
	const [galatPassword, setGalatPassword] = useState<string[]>([])
	const [menggantiPassword, setMenggantiPassword] = useState(false)

	const modeData = getDataMode()

	const simpanProfil = async (e: React.FormEvent) => {
		e.preventDefault()
		const galat = validasiProfil(profil)
		setGalatProfil(galat)
		if (galat.length > 0) {
			onNotify('Periksa kembali data profil Anda.', 'error')
			return
		}
		setMenyimpanProfil(true)
		try {
			await onSaveProfile({
				full_name: profil.full_name.trim(),
				email: profil.email.trim(),
				phone: profil.phone.trim(),
				address: profil.address.trim(),
				company_name: profil.company_name?.trim() ? profil.company_name.trim() : null,
			})
			onNotify('Profil berhasil diperbarui.', 'success')
		} catch {
			onNotify('Profil gagal disimpan. Silakan coba lagi.', 'error')
		} finally {
			setMenyimpanProfil(false)
		}
	}

	const gantiPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		const galat = validasiPassword(passwordBaru, ulangiPassword)
		setGalatPassword(galat)
		if (galat.length > 0) {
			onNotify('Password baru belum memenuhi syarat.', 'error')
			return
		}
		setMenggantiPassword(true)
		try {
			await onChangePassword(passwordBaru)
			setPasswordBaru('')
			setUlangiPassword('')
			onNotify('Password berhasil diganti.', 'success')
		} catch {
			onNotify('Password gagal diganti. Silakan coba lagi.', 'error')
		} finally {
			setMenggantiPassword(false)
		}
	}

	return (
		<div className="animate-fade-in">
			{/* --- Profil ---------------------------------------------------- */}
			<form className="card-premium" style={GAYA_KARTU} onSubmit={simpanProfil}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px' }}>
					<UserCog size={17} color="var(--color-primary)" />
					<h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)' }}>Profil Akun</h3>
				</div>

				{galatProfil.length > 0 && (
					<ul role="alert" style={GAYA_GALAT}>
						{galatProfil.map((g) => (
							<li key={g}>{g}</li>
						))}
					</ul>
				)}

				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
					<div>
						<label style={GAYA_LABEL} htmlFor="set-nama">
							Nama Lengkap
						</label>
						<input
							id="set-nama"
							className="input-premium"
							style={{ width: '100%' }}
							value={profil.full_name}
							onChange={(e) => setProfil({ ...profil, full_name: e.target.value })}
						/>
					</div>
					<div>
						<label style={GAYA_LABEL} htmlFor="set-surel">
							Surel
						</label>
						<input
							id="set-surel"
							type="email"
							className="input-premium"
							style={{ width: '100%' }}
							value={profil.email}
							onChange={(e) => setProfil({ ...profil, email: e.target.value })}
						/>
					</div>
					<div>
						<label style={GAYA_LABEL} htmlFor="set-telepon">
							Telepon
						</label>
						<input
							id="set-telepon"
							className="input-premium"
							style={{ width: '100%' }}
							value={profil.phone}
							onChange={(e) => setProfil({ ...profil, phone: e.target.value })}
						/>
					</div>
					<div>
						<label style={GAYA_LABEL} htmlFor="set-perusahaan">
							Nama Perusahaan
						</label>
						<input
							id="set-perusahaan"
							className="input-premium"
							style={{ width: '100%' }}
							value={profil.company_name ?? ''}
							placeholder="— tidak diisi —"
							onChange={(e) => setProfil({ ...profil, company_name: e.target.value })}
						/>
					</div>
				</div>

				<div style={{ marginTop: '14px' }}>
					<label style={GAYA_LABEL} htmlFor="set-alamat">
						Alamat
					</label>
					<textarea
						id="set-alamat"
						className="input-premium"
						rows={2}
						style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--font-primary)' }}
						value={profil.address}
						onChange={(e) => setProfil({ ...profil, address: e.target.value })}
					/>
				</div>

				<div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
					<button
						type="submit"
						className="btn-primary"
						disabled={menyimpanProfil}
						style={{ display: 'flex', alignItems: 'center', gap: '7px' }}
					>
						<Save size={14} /> {menyimpanProfil ? 'Menyimpan…' : 'Simpan Perubahan'}
					</button>
					<span style={{ fontSize: '11.5px', color: 'var(--color-secondary)' }}>
						Username <strong style={{ fontFamily: 'var(--font-mono)' }}>{currentUser.username}</strong> dan peran{' '}
						<strong style={{ fontFamily: 'var(--font-mono)' }}>{currentUser.role_name}</strong> hanya dapat diubah
						administrator.
					</span>
				</div>
			</form>

			{/* --- Password -------------------------------------------------- */}
			<form className="card-premium" style={GAYA_KARTU} onSubmit={gantiPassword}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px' }}>
					<KeyRound size={17} color="var(--color-primary)" />
					<h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)' }}>Ganti Password</h3>
				</div>

				{galatPassword.length > 0 && (
					<ul role="alert" style={GAYA_GALAT}>
						{galatPassword.map((g) => (
							<li key={g}>{g}</li>
						))}
					</ul>
				)}

				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
					<div>
						<label style={GAYA_LABEL} htmlFor="set-pw-baru">
							Password Baru
						</label>
						<input
							id="set-pw-baru"
							type="password"
							autoComplete="new-password"
							className="input-premium"
							style={{ width: '100%' }}
							value={passwordBaru}
							onChange={(e) => setPasswordBaru(e.target.value)}
						/>
					</div>
					<div>
						<label style={GAYA_LABEL} htmlFor="set-pw-ulang">
							Ulangi Password Baru
						</label>
						<input
							id="set-pw-ulang"
							type="password"
							autoComplete="new-password"
							className="input-premium"
							style={{ width: '100%' }}
							value={ulangiPassword}
							onChange={(e) => setUlangiPassword(e.target.value)}
						/>
					</div>
				</div>

				<button
					type="submit"
					className="btn-primary"
					disabled={menggantiPassword}
					style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}
				>
					<ShieldCheck size={14} /> {menggantiPassword ? 'Memproses…' : 'Ganti Password'}
				</button>
			</form>

			{/* --- Informasi sistem ------------------------------------------ */}
			<div className="card-premium" style={GAYA_KARTU}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
					<Server size={17} color="var(--color-primary)" />
					<h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)' }}>
						Informasi Sistem
					</h3>
				</div>

				<div
					style={{
						padding: '14px 16px',
						borderRadius: '8px',
						border: '1px solid var(--color-border)',
						backgroundColor: 'rgba(0, 51, 102, 0.04)',
						fontSize: '12.5px',
						fontFamily: 'var(--font-mono)',
						lineHeight: 1.7,
					}}
				>
					<div>
						<strong>Runtime:</strong> Cloudflare Workers (V8 Edge)
					</div>
					<div>
						<strong>Basis data:</strong> TiDB Cloud Serverless (kompatibel MySQL 8.0)
					</div>
					<div>
						<strong>Mode data:</strong>{' '}
						<span style={{ color: modeData === 'TIDB' ? '#047857' : '#B45309', fontWeight: 700 }}>
							{modeData === 'TIDB' ? 'TIDB (tersambung)' : 'IN_MEMORY_DEMO (data contoh)'}
						</span>
					</div>
					<div>
						<strong>Organisasi:</strong> PT. Surya Bangun Sarana Banjarmasin
					</div>
				</div>

				{modeData !== 'TIDB' && (
					<p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#B45309', fontWeight: 600, lineHeight: 1.6 }}>
						Mode data contoh aktif karena <code>DATABASE_URL</code> belum diisi. Perubahan yang Anda simpan hanya
						bertahan selama sesi peramban ini.
					</p>
				)}
			</div>
		</div>
	)
}
