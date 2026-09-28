/**
 * Kumpulan pendaftar rute API.
 *
 * `index.ts` hanya memanggil satu fungsi per domain, sehingga berkas utama
 * tetap fokus pada kerangka aplikasi (CORS, autentikasi, RBAC, error handler).
 */
export { daftarContracts } from './contracts';
export { daftarPayments } from './payments';
export { daftarUsers } from './users';
export { daftarUsers2 } from './users2';
export { daftarReports } from './reports';
export { daftarAudit } from './audit';
export { daftarTracking } from './tracking';
