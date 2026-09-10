/**
 * Uji mesin verifikasi pembayaran (src/lib/paymentWorkflow.ts) + T-0008.
 *
 * Fokus:
 *   1. Matriks transisi status pembayaran — status final & lompatan ditolak.
 *   2. Validasi berkas bukti — ekstensi, panjang, jalur berbahaya.
 *   3. RBAC — pelanggan hanya boleh menyentuh tagihannya sendiri.
 *   4. Gerbang pembayaran — ON_GOING terkunci sampai lunas, override ADMIN.
 *   5. Konsistensi data nyata — seluruh tagihan seed lolos aturan.
 */

import { webcrypto } from 'node:crypto';
const g = globalThis;
if (!g.crypto) g.crypto = webcrypto;

const pw = await import('../.tmp_paymentWorkflow.mjs');
const { stateStore } = await import('../.tmp_db.mjs');
const S = stateStore;

let pass = 0, fail = 0;
const t = (n, c) => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n}`)); };

// ---------------------------------------------------------------------------
console.log('\n== Validasi Status Pembayaran ==');
t('UNPAID dikenali', pw.isPaymentStatus('UNPAID'));
t('PENDING_VERIFICATION dikenali', pw.isPaymentStatus('PENDING_VERIFICATION'));
t('PAID dikenali', pw.isPaymentStatus('PAID'));
t('FAILED dikenali', pw.isPaymentStatus('FAILED'));
t('status palsu ditolak', !pw.isPaymentStatus('LUNAS'));
t('huruf kecil ditolak', !pw.isPaymentStatus('paid'));
t('angka ditolak', !pw.isPaymentStatus(1));
t('null ditolak', !pw.isPaymentStatus(null));
t('objek ditolak', !pw.isPaymentStatus({}));
t('daftar status = 4', pw.PAYMENT_STATUSES.length === 4);
t('setiap status punya label',
  pw.PAYMENT_STATUSES.every(s => typeof pw.getPaymentStatusLabel(s) === 'string' && pw.getPaymentStatusLabel(s).length > 0));
t('setiap status punya tone',
  pw.PAYMENT_STATUSES.every(s => ['neutral', 'info', 'success', 'warning', 'danger'].includes(pw.getPaymentStatusTone(s))));

// ---------------------------------------------------------------------------
console.log('\n== Matriks Transisi Status Pembayaran ==');
const boleh = (a, b) => pw.canChangePaymentStatus(a, b).allowed;

t('UNPAID → PENDING_VERIFICATION diizinkan', boleh('UNPAID', 'PENDING_VERIFICATION'));
t('PENDING_VERIFICATION → PAID diizinkan', boleh('PENDING_VERIFICATION', 'PAID'));
t('PENDING_VERIFICATION → FAILED diizinkan', boleh('PENDING_VERIFICATION', 'FAILED'));
t('FAILED → PENDING_VERIFICATION diizinkan', boleh('FAILED', 'PENDING_VERIFICATION'));
t('UNPAID → PAID ditolak (harus lewat verifikasi)', !boleh('UNPAID', 'PAID'));
t('FAILED → PAID ditolak (harus lampir ulang dulu)', !boleh('FAILED', 'PAID'));
t('PAID → FAILED ditolak (status akhir)', !boleh('PAID', 'FAILED'));
t('PAID → UNPAID ditolak (status akhir)', !boleh('PAID', 'UNPAID'));

const kode = (a, b) => pw.canChangePaymentStatus(a, b).code;
t('status sama → STATUS_PEMBAYARAN_TIDAK_VALID', kode('PAID', 'PAID') === 'STATUS_PEMBAYARAN_TIDAK_VALID');
t('transisi terlarang → PEMBAYARAN_SUDAH_FINAL', kode('PAID', 'FAILED') === 'PEMBAYARAN_SUDAH_FINAL');
t('transisi diizinkan tidak punya kode', pw.canChangePaymentStatus('UNPAID', 'PENDING_VERIFICATION').code === undefined);

t('PAID adalah status akhir', pw.isPaymentFinal('PAID'));
t('UNPAID bukan status akhir', !pw.isPaymentFinal('UNPAID'));
t('FAILED bukan status akhir (bisa lampir ulang)', !pw.isPaymentFinal('FAILED'));
t('PENDING_VERIFICATION bukan status akhir', !pw.isPaymentFinal('PENDING_VERIFICATION'));

console.log('\n== Status Lanjutan untuk Antarmuka ==');
t('dari UNPAID hanya PENDING_VERIFICATION',
  pw.getAllowedPaymentTransitions('UNPAID').length === 1 &&
  pw.getAllowedPaymentTransitions('UNPAID')[0] === 'PENDING_VERIFICATION');
t('dari PENDING_VERIFICATION ada 2 pilihan', pw.getAllowedPaymentTransitions('PENDING_VERIFICATION').length === 2);
t('dari PAID tidak ada pilihan', pw.getAllowedPaymentTransitions('PAID').length === 0);
t('dari FAILED hanya PENDING_VERIFICATION',
  pw.getAllowedPaymentTransitions('FAILED').length === 1 &&
  pw.getAllowedPaymentTransitions('FAILED')[0] === 'PENDING_VERIFICATION');

// ---------------------------------------------------------------------------
console.log('\n== Validasi Berkas Bukti Transfer ==');
const v = (nilai, opts = { required: true }) => pw.validatePaymentProofPath(nilai, opts);

t('nama berkas wajar diterima', v('bukti_transfer.png').ok === true);
t('subdirektori diterima', v('uploads/proofs/bukti_2026.jpg').ok === true);
t('ekstensi PDF diterima', v('bukti.pdf').ok === true);
t('ekstensi WEBP diterima', v('bukti.webp').ok === true);
t('nilai dirapikan (trim)', v('  bukti.png  ').value === 'bukti.png');
t('kosong ditolak bila wajib', v('').ok === false);
t('kosong diterima bila opsional', v('', { required: false }).ok === true);
t('bukan string ditolak', v(42).ok === false);
t('null ditolak', v(null).ok === false);
t('undefined ditolak', v(undefined).ok === false);
t('objek ditolak', v({}).ok === false);
t('ekstensi .txt ditolak', v('catatan.txt').ok === false);
t('tanpa ekstensi ditolak', v('bukti_transfer').ok === false);
t('path traversal ditolak', v('../../etc/passwd.png').ok === false);
t('path traversal tersembunyi ditolak', v('uploads/../rahasia.png').ok === false);
t('path absolut ditolak', v('/etc/passwd.png').ok === false);
t('backslash Windows ditolak', v('C:\\windows\\system32.png').ok === false);
t('skema javascript: ditolak', v('javascript:alert(1)//x.png').ok === false);
t('skema data: ditolak', v('data:image/png;base64,AAAA.png').ok === false);
t('spasi ditolak', v('bukti transfer.png').ok === false);
t('melebihi batas karakter ditolak', v(`${'a'.repeat(300)}.png`).ok === false);
t('batas karakter dipublikasikan', pw.LIMIT_BUKTI_CHARS_MAX === 255);
t('panjang tepat di batas diterima', v(`${'a'.repeat(251)}.png`).ok === true);
t('daftar ekstensi dipublikasikan', pw.EKSTENSI_BUKTI_DITERIMA.length === 5);
t('kode field bukti konsisten', pw.FIELD_BUKTI === 'paymentProofPath');
t('pesan galat menyebut ekstensi',
  v('bukti.txt').message.includes('.png'));

// ---------------------------------------------------------------------------
console.log('\n== RBAC Pembayaran ==');
t('admin boleh verifikasi', pw.mayVerifyPayment('ADMIN'));
t('staf boleh verifikasi', pw.mayVerifyPayment('STAFF'));
t('pelanggan tidak boleh verifikasi', !pw.mayVerifyPayment('CUSTOMER'));

const tagihan = { customer_id: 7 };
t('admin boleh sentuh tagihan siapa pun', pw.mayTouchPayment(tagihan, 'ADMIN', 99));
t('staf boleh sentuh tagihan siapa pun', pw.mayTouchPayment(tagihan, 'STAFF', 99));
t('pelanggan boleh sentuh tagihannya sendiri', pw.mayTouchPayment(tagihan, 'CUSTOMER', 7));
t('pelanggan tidak boleh sentuh tagihan orang lain', !pw.mayTouchPayment(tagihan, 'CUSTOMER', 8));
t('pelanggan tanpa ID cocok ditolak', !pw.mayTouchPayment(tagihan, 'CUSTOMER', 0));

// ---------------------------------------------------------------------------
console.log('\n== Gerbang Pembayaran → Sewa Beroperasi ==');
const gerbang = (status, bayar, opts) => pw.checkPaymentGate(status, bayar, opts);

t('ON_GOING dengan PAID diizinkan', gerbang('ON_GOING', 'PAID').allowed === true);
t('ON_GOING dengan PAID menandai butuh lunas', gerbang('ON_GOING', 'PAID').requiresPaid === true);
t('ON_GOING dengan PAID tanpa override', gerbang('ON_GOING', 'PAID').overrideUsed === false);
t('ON_GOING dengan UNPAID ditolak', gerbang('ON_GOING', 'UNPAID').allowed === false);
t('kode TAGIHAN_BELUM_LUNAS', gerbang('ON_GOING', 'UNPAID').code === 'TAGIHAN_BELUM_LUNAS');
t('ON_GOING dengan PENDING_VERIFICATION ditolak', !gerbang('ON_GOING', 'PENDING_VERIFICATION').allowed);
t('ON_GOING dengan FAILED ditolak', !gerbang('ON_GOING', 'FAILED').allowed);
t('ON_GOING tanpa tagihan sama sekali ditolak', !gerbang('ON_GOING', null).allowed);
t('override ADMIN membuka gerbang', gerbang('ON_GOING', 'UNPAID', { role: 'ADMIN', override: true }).allowed === true);
t('override ADMIN ditandai terpakai',
  gerbang('ON_GOING', 'UNPAID', { role: 'ADMIN', override: true }).overrideUsed === true);
t('override STAFF tetap ditolak', !gerbang('ON_GOING', 'UNPAID', { role: 'STAFF', override: true }).allowed);
t('override CUSTOMER tetap ditolak', !gerbang('ON_GOING', 'UNPAID', { role: 'CUSTOMER', override: true }).allowed);
t('tanpa override ADMIN pun tetap ditolak', !gerbang('ON_GOING', 'UNPAID', { role: 'ADMIN' }).allowed);
t('override tidak berlaku bila sudah lunas',
  gerbang('ON_GOING', 'PAID', { role: 'ADMIN', override: true }).overrideUsed === false);

console.log('\n== Status Sewa Lain Tidak Terkunci ==');
for (const s of ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']) {
  t(`${s} bebas walau belum lunas`, gerbang(s, 'UNPAID').allowed === true);
  t(`${s} tidak menandai butuh lunas`, gerbang(s, 'UNPAID').requiresPaid === false);
}
t('hanya ON_GOING yang butuh lunas', pw.STATUS_SEWA_BUTUH_LUNAS.length === 1);
t('ON_GOING tercantum sebagai butuh lunas', pw.STATUS_SEWA_BUTUH_LUNAS[0] === 'ON_GOING');

console.log('\n== Ringkasan Status Pembayaran Sewa ==');
const ringkas = (daftar, ids) => pw.summarizeRentalPayment(daftar, ids);
t('tanpa tagihan → null', ringkas([{ contract_id: 1, status: 'PAID' }], []) === null);
t('tagihan di luar kontrak diabaikan', ringkas([{ contract_id: 9, status: 'PAID' }], [1]) === null);
t('semua lunas → PAID',
  ringkas([{ contract_id: 1, status: 'PAID' }, { contract_id: 2, status: 'PAID' }], [1, 2]) === 'PAID');
t('ada UNPAID → UNPAID',
  ringkas([{ contract_id: 1, status: 'PAID' }, { contract_id: 2, status: 'UNPAID' }], [1, 2]) === 'UNPAID');
t('ada FAILED → FAILED (paling buruk menang)',
  ringkas([{ contract_id: 1, status: 'UNPAID' }, { contract_id: 2, status: 'FAILED' }], [1, 2]) === 'FAILED');
t('ada PENDING_VERIFICATION → PENDING_VERIFICATION',
  ringkas([{ contract_id: 1, status: 'PENDING_VERIFICATION' }, { contract_id: 2, status: 'PAID' }], [1, 2]) === 'PENDING_VERIFICATION');
t('hanya PAID yang dihitung lunas', pw.isPaid('PAID') === true);
t('UNPAID tidak dihitung lunas', pw.isPaid('UNPAID') === false);
t('null tidak dihitung lunas', pw.isPaid(null) === false);

console.log('\n== Ringkasan Antrean Verifikasi ==');
const antrean = pw.summarizePaymentQueue([
  { status: 'PENDING_VERIFICATION', amount: 100, payment_proof_path: 'a.png' },
  { status: 'PENDING_VERIFICATION', amount: 200, payment_proof_path: '' },
  { status: 'PAID', amount: 300, payment_proof_path: 'b.png' },
  { status: 'PAID', amount: 400, payment_proof_path: 'c.png' },
  { status: 'FAILED', amount: 500, payment_proof_path: 'd.png' },
  { status: 'UNPAID', amount: 600, payment_proof_path: '' },
]);
t('menunggu verifikasi = 2', antrean.pendingCount === 2);
t('nilai menunggu = 300', antrean.pendingAmount === 300);
t('siap diverifikasi = 1', antrean.readyToVerifyCount === 1);
t('menunggu bukti = 1', antrean.awaitingProofCount === 1);
t('siap + menunggu bukti = total menunggu',
  antrean.readyToVerifyCount + antrean.awaitingProofCount === antrean.pendingCount);
t('lunas = 2', antrean.paidCount === 2);
t('nilai lunas = 700', antrean.paidAmount === 700);
t('ditolak = 1', antrean.failedCount === 1);
t('UNPAID tidak masuk hitungan mana pun',
  antrean.pendingCount + antrean.paidCount + antrean.failedCount === 5);

const kosong = pw.summarizePaymentQueue([]);
t('daftar kosong aman', kosong.pendingCount === 0 && kosong.paidCount === 0 && kosong.failedCount === 0);
t('bukti berupa spasi dianggap belum ada',
  pw.summarizePaymentQueue([{ status: 'PENDING_VERIFICATION', amount: 1, payment_proof_path: '   ' }]).awaitingProofCount === 1);
t('nilai amount rusak tidak menghasilkan NaN',
  Number.isFinite(pw.summarizePaymentQueue([{ status: 'PAID', amount: 'abc', payment_proof_path: '' }]).paidAmount));
t('amount null tidak menghasilkan NaN',
  Number.isFinite(pw.summarizePaymentQueue([{ status: 'PAID', amount: null, payment_proof_path: '' }]).paidAmount));

// ---------------------------------------------------------------------------
console.log('\n== Konsistensi dengan Data Nyata ==');
{
  const semua = S.payments;
  const kontrak = S.contracts;

  t('ada data pembayaran', semua.length > 0);
  t('setiap status tagihan valid', semua.every(p => pw.isPaymentStatus(p.status)));
  t('setiap tagihan punya kode', semua.every(p => typeof p.payment_code === 'string' && p.payment_code.length > 0));
  t('setiap tagihan bernilai positif', semua.every(p => Number(p.amount) > 0));
  t('setiap tagihan terhubung ke kontrak', semua.every(p => kontrak.some(k => k.id === p.contract_id)));

  const antreanNyata = pw.summarizePaymentQueue(semua);
  t('ringkasan antrean data nyata konsisten',
    antreanNyata.pendingCount === semua.filter(p => p.status === 'PENDING_VERIFICATION').length);
  t('pembagian antrean data nyata konsisten',
    antreanNyata.readyToVerifyCount + antreanNyata.awaitingProofCount === antreanNyata.pendingCount);

  // Tagihan lunas tidak boleh punya transisi keluar.
  t('tagihan lunas tidak punya status lanjutan',
    semua.filter(p => p.status === 'PAID').every(p => pw.getAllowedPaymentTransitions(p.status).length === 0));

  // Setiap sewa ON_GOING semestinya sudah lunas (kecuali override memang dipakai).
  const sewaAktif = S.rentals.filter(r => r.status === 'ON_GOING');
  const tidakLunas = sewaAktif.filter(r => {
    const ids = kontrak.filter(k => k.rental_id === r.id).map(k => k.id);
    return ringkas(semua, ids) !== 'PAID';
  });
  t(`sewa ON_GOING sudah lunas (${sewaAktif.length - tidakLunas.length}/${sewaAktif.length})`, tidakLunas.length === 0);
}

// ---------------------------------------------------------------------------
console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
