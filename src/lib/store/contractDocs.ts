/**
 * Operasi kontrak digital (terbit, perpanjang, tanda tangan).
 *
 * Dipisah dari `db.ts`; seluruh konteks bersama (stateStore, jalur tulis,
 * cermin TiDB) datang dari `./internal`.
 */
import { nextId, stateStore, tidbClient, wt } from './internal';
import { lewatJembatan, buatTagihanKontrak } from './internal';
import type { Contract } from '../../types';
import { buildContractTermsText, generateContractCode } from '../contracts';

export const contractDocs = {
  getContracts: async () => stateStore.contracts,

  /**
   * Menerbitkan kontrak baru untuk sebuah transaksi sewa.
   *
   * Kode kontrak disusun oleh `generateContractCode()` (satu-satunya
   * tempat aturan penomoran `SBS/CONTRACT/<YYYY>/<MM>/<SEQ>` hidup) agar
   * nomor yang tercetak di dokumen selalu identik dengan yang tersimpan.
   */
  createContract: async (rentalId: number) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Contract>('POST', '/api/contracts', { rentalId });
    }
    const rental = stateStore.rentals.find(r => r.id === rentalId);
    if (!rental) return undefined;

    // Satu kontrak per transaksi: menerbitkan ulang akan mengacaukan
    // rujukan pembayaran yang sudah terlanjur menunjuk kontrak lama.
    const existing = stateStore.contracts.find(c => c.rental_id === rentalId);
    if (existing) {
      throw new Error('KONTRAK_SUDAH_ADA');
    }

    const now = new Date();
    const contractDate = now.toISOString().slice(0, 10);
    const validUntil = rental.end_date;

    const id = nextId(stateStore.contracts);
    const contract: Contract = {
      id,
      contract_code: generateContractCode(stateStore.contracts, contractDate),
      rental_id: rental.id,
      rental_code: rental.rental_code,
      customer_id: rental.customer_id,
      customer_name: rental.customer_name,
      contract_date: contractDate,
      valid_until: validUntil,
      // Syarat & ketentuan baku diambil dari modul kontrak, bukan
      // ditulis ulang di sini, agar dokumen & pratinjau tidak menyimpang.
      terms_conditions: buildContractTermsText(),
      is_signed_customer: 0,
      signed_at: null,
      signer_name: null,
      signature_data_url: null,
    };

    await wt(
      'INSERT INTO `contracts` (`id`, `contract_code`, `rental_id`, `customer_id`, `contract_date`, `valid_until`, `terms_conditions`, `is_signed_customer`) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [contract.id, contract.contract_code, contract.rental_id, contract.customer_id, contract.contract_date, contract.valid_until, contract.terms_conditions],
      'createContract'
    );
    stateStore.contracts.push(contract);

    // Tagihan resmi dibuat SEKALIGUS dengan penerbitan kontrak. Tanpa ini
    // kontrak baru tidak pernah punya payment -> tab Pembayaran pelanggan
    // kosong dan alur verifikasi staf mustahil (temuan E2E siklus 61).
    const eq = stateStore.equipments.find(x => x.id === (rental as { equipment_id?: number }).equipment_id);
    const hari = Math.max(1, Math.round(
      (new Date(rental.end_date).getTime() - new Date(rental.start_date).getTime()) / 86_400_000
    ) + 1);
    const tarif = eq?.rental_price_per_day ?? 0;
    const tagihan = buatTagihanKontrak(stateStore.payments, contract, hari * tarif);
    await wt(
      'INSERT INTO `payments` (`id`, `payment_code`, `contract_id`, `customer_id`, `amount`, `payment_method`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tagihan.id, tagihan.payment_code, tagihan.contract_id, tagihan.customer_id, tagihan.amount, tagihan.payment_method, tagihan.status],
      'createContract:tagihan'
    );
    stateStore.payments.push(tagihan);
    return contract;
  },

  /**
   * Memperpanjang masa berlaku kontrak yang sudah lewat batasnya.
   *
   * Hanya mengubah `valid_until` — kode kontrak, penandatanganan, dan
   * tagihan yang sudah ada tetap utuh, sehingga riwayat keuangan tidak
   * berubah hanya karena masa sewa diperpanjang.
   */
  perpanjangKontrak: async (contractId: number, validUntil: string) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Contract>('POST', `/api/contracts/${contractId}/renew`, { validUntil });
    }
    const c = stateStore.contracts.find(x => x.id === contractId);
    if (!c) return undefined;

    // Kontrak yang sudah ditandatangani tidak diperpanjang diam-diam:
    // tanggal di dokumen yang beredar harus selalu sama dengan yang tersimpan.
    if (c.is_signed_customer === 1) {
      throw new Error('KONTRAK_SUDAH_DITANDATANGANI');
    }

    await wt(
      'UPDATE `contracts` SET `valid_until` = ? WHERE `id` = ?',
      [validUntil, contractId],
      'perpanjangKontrak'
    );
    c.valid_until = validUntil;
    return c;
  },

  /**
   * Membubuhkan tanda tangan elektronik pada kontrak.
   *
   * `signerName` & `signature` sudah divalidasi oleh `validateContractSignature()`
   * di lapisan API sebelum sampai ke sini.
   */
  signContract: async (contractId: number, signerName: string, signature: string) => {
    if (typeof window !== 'undefined') {
      return await lewatJembatan<Contract>('POST', `/api/contracts/${contractId}/sign`, { signerName, signature });
    }
    const c = stateStore.contracts.find(x => x.id === contractId);
    if (!c) return undefined;

    // Kontrak yang sudah ditandatangani tidak boleh ditandatangani ulang:
    // signed_at adalah bukti waktu yang dipakai sebagai audit trail.
    if (c.is_signed_customer === 1) {
      throw new Error('KONTRAK_SUDAH_DITANDATANGANI');
    }
    // Daur-hidup: kedaluwarsa -> tolak (identik dengan guard sisi Worker).
    if (typeof c.valid_until === 'string' && c.valid_until !== '') {
      const batas = new Date(c.valid_until);
      if (!Number.isNaN(batas.getTime()) && batas.getTime() < Date.now()) {
        throw new Error('KONTRAK_KEDALUWARSA');
      }
    }

    const signedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await wt(
      'UPDATE `contracts` SET `is_signed_customer` = 1, `signed_at` = ?, `signer_name` = ?, `signature_data_url` = ? WHERE `id` = ?',
      [signedAt, signerName, signature, contractId],
      'signContract'
    );
    c.is_signed_customer = 1;
    c.signed_at = signedAt;
    c.signer_name = signerName;
    c.signature_data_url = signature;
    return c;
  },

  // Payments
};
