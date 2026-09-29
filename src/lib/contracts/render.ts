import { COMPANY } from './constants';
import type { ContractParty, ContractPreview } from './preview';

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
    dan tercatat pada sistem resmi ${escapeContractHtml(COMPANY.name)}.
  </footer>
</body>
</html>`;
}

/** Nama berkas cetak kontrak, misal `KONTRAK_SBS-CONTRACT-2026-09-0042`. */
export function buildContractFilename(preview: ContractPreview): string {
  const slug = preview.code.replace(/[^A-Za-z0-9-]/g, '-');
  return `KONTRAK_${slug}`;
}
