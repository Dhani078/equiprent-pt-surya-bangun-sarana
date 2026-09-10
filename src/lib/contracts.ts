/**
 * Modul Kontrak Sewa Digital
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Menjadi SATU sumber kebenaran untuk:
 *   1. Penomoran kontrak — `SBS/CONTRACT/<YYYY>/<MM>/<SEQ-4digit>`
 *   2. Syarat & ketentuan baku yang tercetak pada dokumen
 *   3. Status penandatanganan & pratinjau kontrak siap cetak A4
 *
 * Modul ini MURNI (tanpa DOM, tanpa database, tanpa jaringan) sehingga
 * aman dipakai di browser, edge worker, maupun Node (untuk pengujian).
 * Karena penomoran dan penyusunan pratinjau hidup di sini, angka dan teks
 * yang tampil di layar tidak bisa menyimpang dari yang dihasilkan server.
 */

import type { Contract, Equipment, Rental, User } from '../types';
import { LATE_PENALTY_PER_DAY, formatRupiah, formatTanggal, formatWaktu } from './businessRules';

// ---------------------------------------------------------------------------
// Konstanta Perusahaan & Kontrak
// ---------------------------------------------------------------------------

/** Identitas perusahaan yang dicetak pada kop kontrak. */
const COMPANY = {
  name: 'PT. SURYA BANGUN SARANA BANJARMASIN',
  tagline: 'Heavy Equipment Rental, Earthmoving Contractor & Fleet Monitoring System',
  address: 'Jl. Ahmad Yani KM 5, Banjarmasin, Kalimantan Selatan',
  phone: '(0511) 7890123',
  /** Penandatangan di sisi perusahaan. */
  signatory: 'Hendra Wijaya',
  signatoryRole: 'Staf Operasional & Logistik',
} as const;

/** Awalan kode kontrak. */
const CONTRACT_PREFIX = 'SBS/CONTRACT';

/** Lebar nomor urut pada kode kontrak (4 digit, misal `0042`). */
const SEQUENCE_WIDTH = 4;

/** Nilai urut maksimal yang bisa ditampung 4 digit. */
const MAX_SEQUENCE = 9_999;

/** Tanggal dasar bila tanggal kontrak tidak valid (zona netral). */
const FALLBACK_DATE_UTC = '1970-01-01T00:00:00.000Z';
const FALLBACK_DATE = '1970-01-01';

/**
 * Syarat & ketentuan baku kontrak sewa alat berat.
 *
 * Disimpan sebagai array baris (bukan satu string panjang) supaya bisa
 * dirender sebagai daftar bernomor di layar maupun di dokumen cetak.
 *
 * Baris denda sengaja memakai tarif dari `LATE_PENALTY_PER_DAY` agar
 * mengikuti konstanta tunggal — tidak ada angka denda yang di-hardcode.
 */
export const CONTRACT_TERMS: readonly string[] = [
  'Penyewa wajib menyediakan operator bersertifikat yang berpengalaman pada unit yang disewa.',
  'Biaya bahan bakar, pelumas, dan operator sepenuhnya ditanggung oleh penyewa selama masa sewa.',
  'Kerusakan unit akibat kelalaian penyewa menjadi tanggung jawab penyewa, termasuk biaya perbaikan dan waktu henti operasional.',
  `Keterlambatan pengembalian unit dikenakan denda ${formatRupiah(LATE_PENALTY_PER_DAY)} per hari keterlambatan.`,
  'Perpanjangan masa sewa wajib dikonfirmasi paling lambat H-3 sebelum kontrak berakhir.',
  'Penyewa dilarang memindahkan unit ke lokasi di luar wilayah yang disepakati tanpa persetujuan tertulis.',
  'Pemeriksaan unit dilakukan bersama pada saat penyerahan (BAST OUT) dan pengembalian (BAST IN).',
];

/** Gabungan syarat & ketentuan dalam bentuk teks panjang (untuk kolom DB). */
export const CONTRACT_TERMS_TEXT: string = CONTRACT_TERMS.join('\n');

// ---------------------------------------------------------------------------
// Helper Internal
// ---------------------------------------------------------------------------

/** Mengembalikan tanggal yang valid; fallback bila input rusak. */
function toSafeDate(raw: string | null | undefined): Date {
  if (typeof raw !== 'string' || raw === '') return new Date(FALLBACK_DATE_UTC);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date(FALLBACK_DATE_UTC) : parsed;
}

/** `2026` dari `2026-09-04` — memakai UTC agar tidak bergeser karena zona. */
function yearOf(raw: string | null | undefined): string {
  return String(toSafeDate(raw).getUTCFullYear()).padStart(4, '0');
}

/** `09` dari `2026-09-04`. */
function monthOf(raw: string | null | undefined): string {
  return String(toSafeDate(raw).getUTCMonth() + 1).padStart(2, '0');
}

/** `2026-09` dari `2026-09-04`, dipakai sebagai kunci periode urut. */
export function contractPeriodKey(raw: string | null | undefined): string {
  return `${yearOf(raw)}-${monthOf(raw)}`;
}

// ---------------------------------------------------------------------------
// Penomoran Kontrak
// ---------------------------------------------------------------------------

/**
 * Menyusun kode kontrak: `SBS/CONTRACT/<YYYY>/<MM>/<SEQ-4digit>`.
 *
 * Contoh: `SBS/CONTRACT/2026/09/0042`
 *
 * Nomor urut dijaga tetap 4 digit dan diklem ke rentang 1..9999 sehingga
 * kode tidak pernah melebihi lebar kolom maupun menghasilkan `0000`.
 */
export function buildContractCode(rawDate: string | null | undefined, sequence: number): string {
  const nomorUrut = Math.floor(sequence);
  const aman = Number.isFinite(nomorUrut) ? Math.min(Math.max(nomorUrut, 1), MAX_SEQUENCE) : 1;
  const seq = String(aman).padStart(SEQUENCE_WIDTH, '0');

  return `${CONTRACT_PREFIX}/${yearOf(rawDate)}/${monthOf(rawDate)}/${seq}`;
}

/**
 * Menghitung nomor urut berikutnya untuk periode (tahun-bulan) tertentu.
 *
 * Nomor urut dihitung PER PERIODE, bukan global — sesuai format kode yang
 * menyematkan tahun & bulan. Bila sudah ada kontrak pada periode yang sama,
 * urut berikutnya adalah `maksimum + 1`.
 *
 * Sengaja memakai `maksimum + 1` (bukan `jumlah + 1`): bila sebuah kontrak
 * dihapus, `jumlah` menyusut dan nomor lama akan dipakai ulang — dua kontrak
 * berbeda lalu berbagi satu kode, yang akan merusak audit trail.
 */
export function nextContractSequence(
  existing: readonly Contract[],
  rawDate: string | null | undefined,
  periode: string = contractPeriodKey(rawDate)
): number {
  let maksimum = 0;

  for (const kontrak of existing) {
    if (contractPeriodKey(kontrak.contract_date) !== periode) continue;

    const bagian = kontrak.contract_code.split('/');
    const urut = Number(bagian[bagian.length - 1]);
    if (Number.isFinite(urut) && urut > maksimum) maksimum = urut;
  }

  return Math.min(maksimum + 1, MAX_SEQUENCE);
}

/**
 * Menyusun kode kontrak baru yang bebas bentrok.
 *
 * Menggabungkan `nextContractSequence()` dan `buildContractCode()` agar
 * pemanggil tidak bisa lupa salah satunya.
 */
export function generateContractCode(
  existing: readonly Contract[],
  rawDate: string | null | undefined
): string {
  return buildContractCode(rawDate, nextContractSequence(existing, rawDate));
}

/** Memeriksa apakah sebuah string sudah berformat kode kontrak yang sah. */
export function isValidContractCode(value: string): boolean {
  return new RegExp(`^${CONTRACT_PREFIX}/\\d{4}/\\d{2}/\\d{${SEQUENCE_WIDTH}}$`).test(value);
}

// ---------------------------------------------------------------------------
// Status Penandatanganan
// ---------------------------------------------------------------------------

/** Status penandatanganan kontrak dalam bentuk terstruktur. */
export type ContractSignatureStatus = 'SIGNED' | 'AWAITING';

/**
 * Normalisasi `is_signed_customer`.
 *
 * Nilai kolom bisa berupa boolean (klien baru) maupun 0/1 (dari MySQL),
 * sehingga dibaca melalui helper ini agar tidak ada perbandingan yang
 * keliru di antara keduanya.
 */
export function isContractSigned(kontrak: Pick<Contract, 'is_signed_customer'>): boolean {
  return kontrak.is_signed_customer === 1 || kontrak.is_signed_customer === true;
}

/** Status penandatanganan kontrak. */
export function getContractSignatureStatus(
  kontrak: Pick<Contract, 'is_signed_customer'>
): ContractSignatureStatus {
  return isContractSigned(kontrak) ? 'SIGNED' : 'AWAITING';
}

/** Label siap tampil untuk status penandatanganan. */
export function getContractStatusLabel(status: ContractSignatureStatus): string {
  return status === 'SIGNED' ? 'Telah Ditandatangani' : 'Menunggu Tanda Tangan';
}

/** Nada warna badge mengikuti design system §7 (hijau=sah, kuning=pending). */
export function getContractStatusTone(status: ContractSignatureStatus): 'success' | 'warning' {
  return status === 'SIGNED' ? 'success' : 'warning';
}

/**
 * Apakah kontrak masih berlaku hari ini.
 *
 * Kontrak tanpa `valid_until` dianggap tidak memiliki batas akhir.
 */
export function isContractActive(kontrak: Pick<Contract, 'valid_until'>, now: Date = new Date()): boolean {
  if (typeof kontrak.valid_until !== 'string' || kontrak.valid_until === '') return true;
  const batas = new Date(kontrak.valid_until);
  if (Number.isNaN(batas.getTime())) return true;
  return batas.getTime() >= now.getTime();
}

// ---------------------------------------------------------------------------
// Model Pratinjau Kontrak
// ---------------------------------------------------------------------------

/** Baris keterangan pada badan kontrak. */
export interface ContractField {
  label: string;
  value: string;
  /** True bila nilai dicetak dengan font monospace (kode, nomor). */
  mono?: boolean;
}

/** Pihak yang menandatangani kontrak. */
export interface ContractParty {
  label: string;
  name: string;
  role: string;
  /** Data URL tanda tangan (opsional). */
  signature?: string | null;
  /** Waktu penandatanganan terformat (opsional). */
  signedAtLabel?: string | null;
}

/** Model kontrak siap pratinjau & cetak. */
export interface ContractPreview {
  /** Kode kontrak, misal `SBS/CONTRACT/2026/09/0042`. */
  code: string;
  /** Kode transaksi sewa yang menjadi dasar kontrak. */
  rentalCode: string;
  /** Judul resmi kontrak. */
  title: string;
  /** Paragraf pembuka kontrak. */
  intro: string;
  /** Baris keterangan para pihak & objek sewa. */
  fields: ContractField[];
  /** Syarat & ketentuan yang berlaku. */
  terms: readonly string[];
  /** Catatan penutup kontrak. */
  notes: string;
  /** Dua kolom tanda tangan: penyewa & perusahaan. */
  parties: { left: ContractParty; right: ContractParty };
  /** Nilai sewa (Rupiah). */
  rentalValue: number;
  /** Label nilai sewa terformat. */
  rentalValueLabel: string;
  /** Waktu terbit terformat. */
  issuedAtLabel: string;
  /** Status penandatanganan. */
  status: ContractSignatureStatus;
  /** Label status penandatanganan. */
  statusLabel: string;
}

/** Input penyusunan pratinjau kontrak. */
export interface ContractPreviewInput {
  /** Kontrak yang akan ditampilkan. */
  contract: Contract;
  /** Transaksi sewa terkait (opsional bila tidak ditemukan). */
  rental?: Rental | null;
  /** Unit terkait (opsional). */
  equipment?: Equipment | null;
  /** Pelanggan terkait (opsional). */
  customer?: User | null;
  /** Nama pihak perusahaan yang menandatangani. Default: staf operasional. */
  companySignatory?: string;
}

/**
 * Menyusun model pratinjau kontrak dari kontrak + data terkait.
 *
 * Tidak pernah melempar exception: bila rental/unit/pelanggan tidak ada,
 * nilai terkait diganti '-' agar kontrak tetap dapat dipratinjau & dicetak.
 */
export function buildContractPreview(input: ContractPreviewInput): ContractPreview {
  const { contract } = input;
  const rental = input.rental ?? null;
  const equipment = input.equipment ?? null;
  const customer = input.customer ?? null;
  const companySignatory = input.companySignatory ?? COMPANY.signatory;

  const status = getContractSignatureStatus(contract);

  const customerName = contract.customer_name ?? customer?.full_name ?? rental?.customer_name ?? '-';
  const companyName = customer?.company_name ?? rental?.company_name ?? '';
  const pelanggan = companyName === '' ? customerName : `${customerName} — ${companyName}`;

  const unitName = rental?.equipment_name ?? equipment?.name ?? '-';
  const unitCode = rental?.equipment_code ?? equipment?.equipment_code ?? '-';

  const startDate = rental?.start_date ?? contract.contract_date;
  const endDate = rental?.end_date ?? contract.valid_until;

  const totalDays = rental?.total_days ?? 0;
  const periode =
    totalDays > 0
      ? `${formatTanggal(startDate)} s.d. ${formatTanggal(endDate)} (${totalDays} hari)`
      : `${formatTanggal(startDate)} s.d. ${formatTanggal(endDate)}`;

  const fields: ContractField[] = [
    { label: 'Nomor Kontrak', value: contract.contract_code, mono: true },
    { label: 'Kode Transaksi Sewa', value: contract.rental_code ?? rental?.rental_code ?? '-', mono: true },
    { label: 'Tanggal Kontrak', value: formatTanggal(contract.contract_date) },
    { label: 'Berlaku Sampai', value: formatTanggal(contract.valid_until) },
    { label: 'Pihak Penyewa', value: pelanggan },
    { label: 'Unit Alat Berat', value: unitName },
    { label: 'Kode Unit', value: unitCode, mono: true },
    {
      label: 'Merek / Model',
      value: equipment ? `${equipment.brand} ${equipment.model}`.trim() : '-',
    },
    { label: 'Periode Sewa', value: periode },
    { label: 'Nilai Sewa', value: formatRupiah(rental?.subtotal ?? 0) },
  ];

  const intro =
    `Pada hari ini ${formatTanggal(contract.contract_date)}, bertempat di Kantor Operasional ` +
    `${COMPANY.name}, kedua belah pihak sepakat mengadakan perjanjian sewa-menyewa unit alat ` +
    `berat dengan rincian sebagai berikut.`;

  const notes =
    status === 'SIGNED'
      ? 'Kontrak ini sah dan mengikat kedua belah pihak sejak dibubuhkannya tanda tangan elektronik, sesuai UU ITE Pasal 11 tentang Tanda Tangan Elektronik.'
      : 'Kontrak ini menunggu pembubuhan tanda tangan elektronik dari pihak penyewa sebelum dapat dinyatakan sah dan mengikat.';

  const signedAtLabel =
    typeof contract.signed_at === 'string' && contract.signed_at !== ''
      ? formatWaktu(contract.signed_at)
      : null;

  return {
    code: contract.contract_code,
    rentalCode: contract.rental_code ?? rental?.rental_code ?? '-',
    title: 'KONTRAK SEWA-MENYEWA ALAT BERAT',
    intro,
    fields,
    terms: CONTRACT_TERMS,
    notes,
    parties: {
      left: {
        label: 'Pihak Penyewa / Rekanan',
        name: contract.signer_name ?? customerName,
        role: 'Pimpinan Proyek Lapangan',
        signature: contract.signature_data_url ?? null,
        signedAtLabel,
      },
      right: {
        label: COMPANY.name,
        name: companySignatory,
        role: COMPANY.signatoryRole,
        signature: null,
        signedAtLabel: null,
      },
    },
    rentalValue: rental?.subtotal ?? 0,
    rentalValueLabel: formatRupiah(rental?.subtotal ?? 0),
    issuedAtLabel: formatWaktu(contract.contract_date),
    status,
    statusLabel: getContractStatusLabel(status),
  };
}

// ---------------------------------------------------------------------------
// Render HTML Kontrak Siap Cetak (A4)
// ---------------------------------------------------------------------------

/**
 * Mengamankan teks sebelum disisipkan ke dalam HTML.
 * Mencegah karakter `<`, `>`, `&`, `"`, `'` merusak struktur dokumen.
 */
export function escapeContractHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Memastikan sebuah data URL aman untuk disematkan pada `src` gambar.
 *
 * Hanya `data:image/(png|jpeg|webp)` yang diterima — nilai lain (termasuk
 * `javascript:` atau URL eksternal) diganti string kosong agar penyerang
 * tidak bisa menyisipkan skrip melalui tanda tangan yang diunggah.
 */
export function isSafeSignatureDataUrl(value: string | null | undefined): boolean {
  return typeof value === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(value);
}

/**
 * Merender pratinjau kontrak menjadi satu berkas HTML mandiri ukuran A4.
 *
 * Berkas memuat CSS sendiri (`@page size: A4`) agar hasil cetak identik di
 * semua peramban dan tidak bergantung pada stylesheet aplikasi.
 */
export function renderContractHtml(preview: ContractPreview): string {
  const baris = preview.fields
    .map(
      (f) =>
        `        <tr>\n` +
        `          <td class="label">${escapeContractHtml(f.label)}</td>\n` +
        `          <td class="pemisah">:</td>\n` +
        `          <td class="${f.mono === true ? 'nilai mono' : 'nilai'}">${escapeContractHtml(f.value)}</td>\n` +
        `        </tr>`
    )
    .join('\n');

  const syarat = preview.terms
    .map(
      (teks, indeks) =>
        `        <li>${escapeContractHtml(teks)}</li>`
    )
    .join('\n');

  const tandaTangan = (pihak: ContractParty): string => {
    const gambar = isSafeSignatureDataUrl(pihak.signature)
      ? `          <img class="goresan" src="${pihak.signature as string}" alt="Tanda tangan ${escapeContractHtml(pihak.name)}" />\n`
      : '';
    const waktu =
      pihak.signedAtLabel === null || pihak.signedAtLabel === undefined
        ? ''
        : `          <div class="waktu">${escapeContractHtml(pihak.signedAtLabel)}</div>\n`;

    return (
      `      <div class="pihak">\n` +
      `        <div class="peran">${escapeContractHtml(pihak.label)}</div>\n` +
      `        <div class="ruang">\n` +
      gambar +
      `        </div>\n` +
      `        <div class="nama">( ${escapeContractHtml(pihak.name)} )</div>\n` +
      `        <div class="jabatan">${escapeContractHtml(pihak.role)}</div>\n` +
      waktu +
      `      </div>`
    );
  };

  const judul = escapeContractHtml(`${preview.title} — ${preview.code}`);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${judul}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 14mm;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 0;
      background: #FFFFFF;
      color: #1E293B;
      font-family: 'Hanken Grotesk', 'Inter', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.5;
    }

    .kop {
      text-align: center;
      border-bottom: 3px double #003366;
      padding-bottom: 8mm;
    }
    .kop .nama {
      margin: 0;
      font-size: 15pt;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: #003366;
    }
    .kop .tagline {
      margin: 2mm 0 0 0;
      font-size: 9pt;
      font-weight: 600;
      color: #475569;
    }
    .kop .alamat {
      margin: 1mm 0 0 0;
      font-size: 9pt;
      color: #64748B;
    }

    .judul {
      text-align: center;
      margin: 8mm 0 2mm 0;
    }
    .judul h2 {
      margin: 0;
      font-size: 13pt;
      font-weight: 800;
      text-transform: uppercase;
      text-decoration: underline;
      color: #003366;
    }
    .judul .nomor {
      display: block;
      margin-top: 2mm;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 9.5pt;
      color: #64748B;
    }

    .isi { margin: 4mm 0 0 0; text-align: justify; }

    table.rincian {
      width: 100%;
      border-collapse: collapse;
      margin: 4mm 0 2mm 0;
      font-size: 10.5pt;
    }
    table.rincian td { padding: 1.6mm 0; vertical-align: top; }
    table.rincian td.label { width: 38%; color: #475569; }
    table.rincian td.pemisah { width: 2%; color: #475569; }
    table.rincian td.nilai { font-weight: 600; color: #1E293B; }
    table.rincian td.nilai.mono {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-weight: 700;
    }

    h3.pasal {
      margin: 6mm 0 2mm 0;
      font-size: 11pt;
      font-weight: 800;
      color: #003366;
      text-transform: uppercase;
    }

    ol.syarat {
      margin: 0;
      padding-left: 6mm;
      font-size: 10pt;
      line-height: 1.6;
      text-align: justify;
    }
    ol.syarat li { margin-bottom: 1.6mm; }

    .catatan {
      margin: 4mm 0 0 0;
      padding: 3mm 4mm;
      background: #F1F5F9;
      border-left: 3px solid #003366;
      font-size: 9.5pt;
      color: #334155;
    }

    .tanda-tangan {
      display: flex;
      justify-content: space-between;
      margin-top: 14mm;
      font-size: 10pt;
      text-align: center;
    }
    .tanda-tangan .pihak { width: 42%; }
    .tanda-tangan .peran { font-size: 9pt; color: #64748B; }
    .tanda-tangan .ruang { height: 20mm; display: flex; align-items: center; justify-content: center; }
    .tanda-tangan .goresan { max-height: 20mm; max-width: 100%; }
    .tanda-tangan .nama { font-weight: 700; text-decoration: underline; }
    .tanda-tangan .jabatan { font-size: 9pt; color: #64748B; }
    .tanda-tangan .waktu { margin-top: 1mm; font-size: 8.5pt; color: #94A3B8; }

    .footer {
      margin-top: 10mm;
      padding-top: 3mm;
      border-top: 1px solid #E2E8F0;
      font-size: 8.5pt;
      color: #94A3B8;
      text-align: center;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .catatan { background: #F1F5F9 !important; }
    }
  </style>
</head>
<body>
  <header class="kop">
    <p class="nama">${escapeContractHtml(COMPANY.name)}</p>
    <p class="tagline">${escapeContractHtml(COMPANY.tagline)}</p>
    <p class="alamat">${escapeContractHtml(COMPANY.address)} &bull; Telp: ${escapeContractHtml(COMPANY.phone)}</p>
  </header>

  <section class="judul">
    <h2>${escapeContractHtml(preview.title)}</h2>
    <span class="nomor">Nomor: ${escapeContractHtml(preview.code)}</span>
  </section>

  <section class="isi">
    <p>${escapeContractHtml(preview.intro)}</p>

    <h3 class="pasal">Pasal 1 — Para Pihak & Objek Sewa</h3>
    <table class="rincian">
      <tbody>
${baris}
      </tbody>
    </table>

    <h3 class="pasal">Pasal 2 — Syarat & Ketentuan</h3>
    <ol class="syarat">
${syarat}
    </ol>

    <p class="catatan">${escapeContractHtml(preview.notes)}</p>
  </section>

  <section class="tanda-tangan">
${tandaTangan(preview.parties.left)}
${tandaTangan(preview.parties.right)}
  </section>

  <footer class="footer">
    Dokumen ini diterbitkan secara digital oleh EquipRent MS pada ${escapeContractHtml(preview.issuedAtLabel)}
    dan tercatat pada basis data TiDB Cloud ${escapeContractHtml(COMPANY.name)}.
  </footer>
</body>
</html>`;
}

/** Nama berkas cetak kontrak, misal `KONTRAK_SBS-CONTRACT-2026-09-0042`. */
export function buildContractFilename(preview: ContractPreview): string {
  const slug = preview.code.replace(/[^A-Za-z0-9-]/g, '-');
  return `KONTRAK_${slug}`;
}
