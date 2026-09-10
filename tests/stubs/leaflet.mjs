/**
 * Stub pustaka Leaflet untuk pengujian server-side.
 *
 * Leaflet asli menyentuh `window` dan `document` saat modul dimuat (deteksi
 * peramban), sehingga tidak bisa di-impor di Node. Untuk smoke render kita
 * hanya butuh modul yang BISA di-impor: `useEffect` — tempat Leaflet
 * dipanggil — tidak pernah berjalan pada `renderToStaticMarkup`.
 *
 * Jadi yang diuji adalah struktur & logika tampilan, bukan peta itu sendiri.
 */

class Stub {
  addTo() { return this; }
  bindPopup() { return this; }
  openPopup() { return this; }
  remove() { return this; }
  on() { return this; }
  flyTo() { return this; }
}

const leafletStub = {
  map: () => new Stub(),
  marker: () => new Stub(),
  tileLayer: () => new Stub(),
  divIcon: () => new Stub(),
  Map: Stub,
  Marker: Stub,
};

export default leafletStub;
