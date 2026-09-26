/**
 * Service Worker EquipRent MS — PT. SURYA BANGUN SARANA BANJARMASIN
 *
 * Service worker VANILLA (T-0062): tidak memakai Workbox karena kebutuhan
 * caching-nya sederhana (app shell saja) dan Workbox menambah ~100 kB
 * ke bundel untuk sesuatu yang 40 baris ini.
 *
 * STRATEGI:
 *   - precache APP SHELL saja (index.html + CSS + JS + manifest + ikon).
 *     Data armada, rental, pembayaran TIDAK pernah di-cache: data operasional
 *     harus selalu segar — menampilkan tagihan kemarin saat offline adalah
 *     bug, bukan fitur.
 *   - navigasi (HTML) → network-first, fallback ke shell tersimpan.
 *     Alasan: HTML adalah daftar aset yang bisa berubah setiap deploy;
 *     menyajikan HTML lama membuat pengguna memuat JS lama yang tidak cocok
 *     dengan API baru.
 *   - aset statis (JS/CSS/font) → cache-first (versi di-hash Vite, jadi
 *     nama berbeda = aset berbeda, tidak ada konflik versi).
 *   - API & font Google → network-only (selalu segar).
 *
 * SKIP DEV: service worker hanya didaftarkan saat `import.meta.env.PROD`
 * (lihat src/main.tsx). Vite dev server tidak menyajikan berkas ini.
 *
 *   ponytail: tidak ada "update available" banner. Versi baru diambil otomatis
 *   pada navigasi berikutnya lewat network-first HTML. Naik ke SkipWaiting +
 *   toast bila pengguna harus langsung pindah ke versi baru (mis. hotfix
 *   keamanan).
 */

const VERSI_CACHE = 'equiprent-shell-v1';

/** Daftar berkas app shell yang di-precache saat instalasi. */
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// ---------------------------------------------------------------------------
// Install: precache app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSI_CACHE);
      // addAll bersifat atomik: bila SATU berkas gagal, seluruh instalasi
      // gagal. Itu yang diinginkan — shell yang setengah ter-cache lebih
      // berbahaya daripada tidak ter-cache sama sekali.
      await cache.addAll(APP_SHELL);
      // Ambil alih segera (skip waiting) — strategi network-first HTML
      // menangani transisi versi dengan aman.
      await self.skipWaiting();
    })()
  );
});

// ---------------------------------------------------------------------------
// Activate: bersihkan cache versi lama
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const daftarCache = await caches.keys();
      await Promise.all(
        daftarCache
          .filter((nama) => nama !== VERSI_CACHE)
          .map((nama) => caches.delete(nama))
      );
      await self.clients.claim();
    })()
  );
});

// ---------------------------------------------------------------------------
// Fetch: strategi per jenis sumber daya
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Hanya tangani GET. POST/PATCH/PUT/DELETE tidak boleh di-cache.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API & font eksternal: selalu jaringan (data harus segar).
  // Blob/data URL tidak bisa di-cache.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  // HTML (navigasi): network-first, fallback shell.
  const isNavigasi =
    request.mode === 'navigate' ||
    (request.headers.get('accept') ?? '').includes('text/html');

  if (isNavigasi) {
    event.respondWith(
      (async () => {
        try {
          const respon = await fetch(request);
          // Salin navigasi sukses ke cache agar tersedia saat offline.
          const cache = await caches.open(VERSI_CACHE);
          cache.put(request, respon.clone());
          return respon;
        } catch {
          // Offline: sajikan shell tersimpan.
          const cache = await caches.open(VERSI_CACHE);
          const shell = await cache.match('/index.html');
          if (shell) return shell;
          return new Response(
            '<html><body style="font-family:sans-serif;padding:24px"><h2>Sedang luring</h2><p>Aplikasi belum tersimpan di perangkat ini. Sambungkan ke internet lalu buka kembali.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
          );
        }
      })()
    );
    return;
  }

  // Aset statis: cache-first, fallback jaringan.
  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSI_CACHE);
      const tersimpan = await cache.match(request);
      if (tersimpan) return tersimpan;

      try {
        const respon = await fetch(request);
        // Hanya simpan respon sukses (200) yang sehat.
        if (respon.ok && respon.type === 'basic') {
          cache.put(request, respon.clone());
        }
        return respon;
      } catch {
        // Aset tidak ada di cache & offline — kembali seadanya.
        return new Response('', { status: 408, statusText: 'Offline' });
      }
    })()
  );
});
