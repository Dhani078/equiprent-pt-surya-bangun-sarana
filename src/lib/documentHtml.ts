/**
 * Render HTML dokumen resmi — EquipRent MS
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Merender model OfficialDocument menjadi satu berkas HTML mandiri
 * berukuran A4 siap cetak. Murni (pure): tidak menyentuh DOM.
 */

import type { OfficialDocument } from './documents';
import { COMPANY } from './documents';

// ---------------------------------------------------------------------------
// Render HTML Siap Cetak (A4)
// ---------------------------------------------------------------------------

/**
 * Mengamankan teks sebelum disisipkan ke dalam HTML.
 * Mencegah karakter `<`, `>`, `&`, `"`, `'` merusak struktur dokumen
 * (termasuk nama pelanggan yang mengandung karakter tersebut).
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Merender dokumen menjadi satu berkas HTML mandiri berukuran A4.
 *
 * Berkas ini sengaja memuat CSS sendiri (`@page size: A4`) agar hasil cetak
 * identik di semua browser dan tidak bergantung pada stylesheet aplikasi.
 */
export function renderDocumentHtml(doc: OfficialDocument): string {
  const baris = doc.fields
    .map(
      (f) =>
        `        <tr>\n` +
        `          <td class="label">${escapeHtml(f.label)}</td>\n` +
        `          <td class="pemisah">:</td>\n` +
        `          <td class="${f.mono === true ? 'nilai mono' : 'nilai'}">${escapeHtml(f.value)}</td>\n` +
        `        </tr>`
    )
    .join('\n');

  const judul = escapeHtml(`${doc.title} — ${doc.code}`);

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

    .isi {
      margin: 4mm 0 0 0;
      text-align: justify;
    }

    table.rincian {
      width: 100%;
      border-collapse: collapse;
      margin: 4mm 0 2mm 0;
      font-size: 10.5pt;
    }
    table.rincian td {
      padding: 1.6mm 0;
      vertical-align: top;
    }
    table.rincian td.label {
      width: 38%;
      color: #475569;
    }
    table.rincian td.pemisah {
      width: 2%;
      color: #475569;
    }
    table.rincian td.nilai {
      font-weight: 600;
      color: #1E293B;
    }
    table.rincian td.nilai.mono {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-weight: 700;
    }

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
      margin-top: 16mm;
      font-size: 10pt;
      text-align: center;
    }
    .tanda-tangan .pihak { width: 42%; }
    .tanda-tangan .ruang { height: 18mm; }
    .tanda-tangan .nama { font-weight: 700; text-decoration: underline; }
    .tanda-tangan .peran { font-size: 9pt; color: #64748B; }

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
    <p class="nama">${escapeHtml(COMPANY.name)}</p>
    <p class="tagline">${escapeHtml(COMPANY.tagline)}</p>
    <p class="alamat">${escapeHtml(COMPANY.address)} &bull; Telp: ${escapeHtml(COMPANY.phone)}</p>
  </header>

  <section class="judul">
    <h2>${escapeHtml(doc.title)}</h2>
    <span class="nomor">Nomor: ${escapeHtml(doc.code)}</span>
  </section>

  <section class="isi">
    <p>${escapeHtml(doc.intro)}</p>

    <table class="rincian">
      <tbody>
${baris}
      </tbody>
    </table>

    <p class="catatan">${escapeHtml(doc.notes)}</p>
  </section>

  <section class="tanda-tangan">
    <div class="pihak">
      <div>${escapeHtml(doc.signatures.left.label)}</div>
      <div class="ruang"></div>
      <div class="nama">( ${escapeHtml(doc.signatures.left.name)} )</div>
      <div class="peran">${escapeHtml(doc.signatures.left.role)}</div>
    </div>
    <div class="pihak">
      <div>${escapeHtml(doc.signatures.right.label)}</div>
      <div class="ruang"></div>
      <div class="nama">( ${escapeHtml(doc.signatures.right.name)} )</div>
      <div class="peran">${escapeHtml(doc.signatures.right.role)}</div>
    </div>
  </section>

  <footer class="footer">
    Dokumen ini diterbitkan secara digital oleh EquipRent MS pada ${escapeHtml(doc.issuedAtLabel)}
    dan tercatat pada sistem resmi ${escapeHtml(COMPANY.name)}.
  </footer>
</body>
</html>`;
}
