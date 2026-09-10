/**
 * Pencetak Dokumen Resmi — EquipRent MS
 * PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Memisahkan aksi yang menyentuh DOM (membuka jendela cetak) dari modul
 * murni `documents.ts`, sehingga penyusunan dokumen tetap dapat diuji
 * tanpa browser.
 */

import {
  buildDocumentFilename,
  renderDocumentHtml,
  type OfficialDocument,
} from './documents';

/**
 * Hasil percobaan membuka jendela cetak.
 * Discriminated union — pemanggil wajib mengecek `ok` sebelum lanjut.
 */
export type PrintResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Menulis HTML mentah ke jendela baru lalu memanggil dialog cetak.
 *
 * Dipakai untuk dokumen yang sudah jadi HTML-nya (misalnya kontrak yang
 * disusun server), sehingga tidak perlu mengikuti struktur `OfficialDocument`.
 * Tidak pernah melempar — selalu mengembalikan `PrintResult`.
 */
export function printHtmlDocument(input: { html: string; title: string }): PrintResult {
  if (typeof window === 'undefined') {
    return { ok: false, message: PESAN_TANPA_WINDOW };
  }

  const jendela = window.open('', '_blank', 'width=900,height=1200,noopener');
  if (!jendela) {
    return { ok: false, message: PESAN_POPUP_DIBLOKIR };
  }

  try {
    jendela.document.open();
    jendela.document.write(input.html);
    jendela.document.close();

    // Judul jendela dipakai peramban sebagai nama berkas bawaan saat
    // menyimpan ke PDF.
    jendela.document.title = input.title;

    // `print()` dipanggil setelah satu frame agar konten selesai dilayout.
    jendela.setTimeout(() => {
      jendela.focus();
      jendela.print();
    }, 120);

    return { ok: true };
  } catch {
    return { ok: false, message: 'Berkas cetak gagal dibuat. Silakan coba lagi.' };
  }
}

/** Fallback bila `window` tidak tersedia (render di server). */
const PESAN_TANPA_WINDOW = 'Pencetakan hanya dapat dilakukan dari dalam peramban.';

/** Pesan bila peramban memblokir jendela baru (popup blocker). */
const PESAN_POPUP_DIBLOKIR =
  'Jendela cetak diblokir oleh peramban. Izinkan jendela muncul (pop-up) untuk halaman ini, lalu coba lagi.';

/**
 * Menulis dokumen ke jendela baru lalu memanggil dialog cetak peramban.
 *
 * Dokumen dirender sebagai HTML mandiri dengan `@page size: A4`, sehingga
 * pengguna dapat langsung memilih "Simpan sebagai PDF" pada dialog cetak.
 * Tidak pernah melempar exception — selalu mengembalikan `PrintResult`.
 */
export function printDocument(doc: OfficialDocument, now: Date = new Date()): PrintResult {
  if (typeof window === 'undefined') {
    return { ok: false, message: PESAN_TANPA_WINDOW };
  }

  const jendela = window.open('', '_blank', 'width=900,height=1200,noopener');

  if (!jendela) {
    return { ok: false, message: PESAN_POPUP_DIBLOKIR };
  }

  try {
    jendela.document.open();
    jendela.document.write(renderDocumentHtml(doc));
    jendela.document.close();

    // Judul jendela dipakai peramban sebagai nama berkas bawaan saat
    // menyimpan ke PDF.
    jendela.document.title = buildDocumentFilename(doc, now);

    // `print()` dipanggil setelah satu frame agar konten selesai dilayout.
    jendela.setTimeout(() => {
      jendela.focus();
      jendela.print();
    }, 120);

    return { ok: true };
  } catch {
    return { ok: false, message: 'Berkas cetak gagal dibuat. Silakan coba lagi.' };
  }
}
