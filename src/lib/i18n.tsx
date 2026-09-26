/**
 * Internasionalisasi ringan ID/EN — tanpa pustaka eksternal.
 *
 * Ponytail: kamus object + React context. Cukup untuk 2 bahasa; kalau
 * bahasa bertambah banyak (>5) atau butuh pluralization/interpolasi
 * kompleks, migrasi ke i18next (+~30KB bundle).
 *
 * Pakai: const t = useTerjemahan(); t('dashboard.judul')
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type Bahasa = 'id' | 'en';

/** Kunci nested dot-notation → terjemahan. */
const KAMUS: Record<Bahasa, Record<string, string>> = {
	id: {
		'app.nama': 'EquipRent MS',
		'app.tagline': 'Sistem Monitoring & Rental Alat Berat',

		'login.selamat_datang': 'Selamat Datang Kembali',
		'login.instruksi': 'Pilih peran dan masukkan kredensial untuk masuk ke sistem.',
		'login.nama_pengguna': 'Nama Pengguna',
		'login.kata_sandi': 'Kata Sandi',
		'login.masuk': 'Masuk',
		'login.ingat_saya': 'Ingat saya di perangkat ini',
		'login.lupa_sandi': 'Lupa Kata Sandi?',
		'login.daftar_pelanggan': 'Daftar Akun Pelanggan',

		'dashboard.utama': 'Dashboard Utama',
		'dashboard.judul': 'Dashboard Eksekutif Administrator',
		'dashboard.total_pendapatan': 'Total Pendapatan Terbayar',
		'dashboard.total_armada': 'Total Armada Alat Berat',
		'dashboard.sewa_aktif': 'Transaksi Sewa Aktif',
		'dashboard.servis_mendesak': 'Jadwal Servis Mendesak',
		'dashboard.menunggu_verifikasi': 'Menunggu Verifikasi',
		'dashboard.pelanggan_terdaftar': 'Pelanggan Terdaftar',
		'dashboard.pengajuan_masuk': 'Pengajuan Masuk',
		'dashboard.utilisasi': 'Tingkat Utilisasi Armada',

		'menu.inventaris': 'Inventaris Alat Berat',
		'menu.transaksi': 'Transaksi Penyewaan',
		'menu.perawatan': 'Perawatan & Servis',
		'menu.gps': 'Pelacakan GPS Telemetri',
		'menu.laporan': 'Laporan & Dokumen',
		'menu.pengguna': 'Manajemen Pengguna',
		'menu.audit': 'Audit Trail',
		'menu.pengaturan': 'Pengaturan Sistem',

		'geofence.di_dalam': 'Di dalam zona',
		'geofence.di_luar': 'Di luar zona',
		'geofence.pelanggaran': 'Pelanggaran Zona',
		'geofence.judul_alert': 'Unit keluar dari zona site',

		'pengaturan.bahasa': 'Bahasa Tampilan',
		'pengaturan.bahasa_id': 'Bahasa Indonesia',
		'pengaturan.bahasa_en': 'English',
	},
	en: {
		'app.nama': 'EquipRent MS',
		'app.tagline': 'Heavy Equipment Monitoring & Rental System',

		'login.selamat_datang': 'Welcome Back',
		'login.instruksi': 'Select a role and enter your credentials to sign in.',
		'login.nama_pengguna': 'Username',
		'login.kata_sandi': 'Password',
		'login.masuk': 'Sign In',
		'login.ingat_saya': 'Remember me on this device',
		'login.lupa_sandi': 'Forgot Password?',
		'login.daftar_pelanggan': 'Register Customer Account',

		'dashboard.utama': 'Main Dashboard',
		'dashboard.judul': 'Administrator Executive Dashboard',
		'dashboard.total_pendapatan': 'Total Paid Revenue',
		'dashboard.total_armada': 'Total Heavy Equipment Fleet',
		'dashboard.sewa_aktif': 'Active Rental Transactions',
		'dashboard.servis_mendesak': 'Urgent Service Schedule',
		'dashboard.menunggu_verifikasi': 'Pending Verification',
		'dashboard.pelanggan_terdaftar': 'Registered Customers',
		'dashboard.pengajuan_masuk': 'Incoming Requests',
		'dashboard.utilisasi': 'Fleet Utilization Rate',

		'menu.inventaris': 'Heavy Equipment Inventory',
		'menu.transaksi': 'Rental Transactions',
		'menu.perawatan': 'Maintenance & Service',
		'menu.gps': 'GPS Telematics Tracking',
		'menu.laporan': 'Reports & Documents',
		'menu.pengguna': 'User Management',
		'menu.audit': 'Audit Trail',
		'menu.pengaturan': 'System Settings',

		'geofence.di_dalam': 'Inside zone',
		'geofence.di_luar': 'Outside zone',
		'geofence.pelanggaran': 'Zone Violation',
		'geofence.judul_alert': 'Unit left the site zone',

		'pengaturan.bahasa': 'Display Language',
		'pengaturan.bahasa_id': 'Bahasa Indonesia',
		'pengaturan.bahasa_en': 'English',
	},
};

interface KonteksI18n {
	bahasa: Bahasa;
	aturBahasa: (b: Bahasa) => void;
	t: (kunci: string) => string;
}

const KonteksBahasa = createContext<KonteksI18n | null>(null);

/** Penyedia bahasa — bungkus di root aplikasi. */
export function PenyediaBahasa({ children }: { children: React.ReactNode }) {
	const [bahasa, setBahasa] = useState<Bahasa>('id');

	const t = useCallback(
		(kunci: string) => KAMUS[bahasa][kunci] ?? KAMUS.id[kunci] ?? kunci,
		[bahasa],
	);

	const nilai = useMemo(() => ({ bahasa, aturBahasa: setBahasa, t }), [bahasa, t]);

	return <KonteksBahasa.Provider value={nilai}>{children}</KonteksBahasa.Provider>;
}

/** Hook terjemahan. Fallback ke kunci itu sendiri bila tidak ada kamus. */
export function useTerjemahan(): KonteksI18n {
	const ctx = useContext(KonteksBahasa);
	if (!ctx) {
		// Render di luar provider: kembalikan default aman (tidak lempar —
		// komponen halaman mungkin di-render terisolasi saat testing).
		return {
			bahasa: 'id',
			aturBahasa: () => {},
			t: (k: string) => KAMUS.id[k] ?? k,
		};
	}
	return ctx;
}
