/**
 * Tab katalog sewa: baris penyaring (periode, kata kunci, kategori, urutan)
 * + grid kartu unit. Murni tampilan — seluruh state penyaring dimiliki induk
 * karena periode sewa juga menentukan isi modal pengajuan.
 */
import { getEquipmentImage } from '../../../lib/stitchAssets';
import { formatRupiah } from '../../../lib/businessRules';
import {
  CATALOG_AVAILABILITY_LABEL,
  CATALOG_AVAILABILITY_TONE,
  DEFAULT_CATALOG_FILTER,
} from '../../../lib/portal';
import type { CatalogView, CatalogFilter } from '../../../lib/portal';
import type { Equipment } from '../../../types';

interface Props {
  katalog: CatalogView;
  totalArmada: number;
  filter: CatalogFilter;
  onFilterChange: (f: CatalogFilter) => void;
  startDate: string;
  endDate: string;
  onChangeTanggal: (mulai: string, selesai: string) => void;
  tampilkanTerpesan: boolean;
  onToggleTerpesan: () => void;
  onSewa: (eq: Equipment) => void;
}

const LABEL = { fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' } as const;

export const CatalogTab: React.FC<Props> = ({
  katalog,
  totalArmada,
  filter,
  onFilterChange,
  startDate,
  endDate,
  onChangeTanggal,
  tampilkanTerpesan,
  onToggleTerpesan,
  onSewa,
}) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
        Katalog Alat Berat Siap Mobilisasi
      </h3>
      <span style={{ fontSize: '12.5px', color: 'var(--color-secondary)' }}>
        {katalog.summary.bookable} unit siap sewa dari {totalArmada} unit armada
      </span>
    </div>

    {/* Penyaring katalog: periode menentukan unit mana yang benar-benar
        bebas, sehingga dipasang di sini bukan di dalam modal pengajuan. */}
    <div
      className="card-premium"
      style={{ padding: '14px 16px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="portal-cari" style={LABEL}>Cari Unit</label>
        <input
          id="portal-cari"
          type="search"
          value={filter.search}
          onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
          placeholder="Nama, kode, merk, atau kategori"
          className="form-input"
          style={{ width: '220px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="portal-kategori" style={LABEL}>Kategori</label>
        <select
          id="portal-kategori"
          value={filter.category}
          onChange={(e) => onFilterChange({ ...filter, category: e.target.value })}
          className="form-input"
          style={{ width: '170px' }}
        >
          <option value="">Semua Kategori</option>
          {katalog.categories.map((kategori) => (
            <option key={kategori} value={kategori}>{kategori}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="portal-urut" style={LABEL}>Urutkan</label>
        <select
          id="portal-urut"
          value={filter.sort}
          onChange={(e) => onFilterChange({ ...filter, sort: e.target.value as CatalogFilter['sort'] })}
          className="form-input"
          style={{ width: '150px' }}
        >
          <option value="TERMURAH">Tarif Terendah</option>
          <option value="TERMAHAL">Tarif Tertinggi</option>
          <option value="TERBARU">Unit Terbaru</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="portal-mulai" style={LABEL}>Mulai Sewa</label>
        <input id="portal-mulai" type="date" value={startDate}
          onChange={(e) => onChangeTanggal(e.target.value, endDate)}
          className="form-input" style={{ width: '155px' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="portal-selesai" style={LABEL}>Selesai Sewa</label>
        <input id="portal-selesai" type="date" value={endDate}
          onChange={(e) => onChangeTanggal(startDate, e.target.value)}
          className="form-input" style={{ width: '155px' }} />
      </div>

      {(filter.search !== '' || filter.category !== '') && (
        <button type="button" className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12.5px' }}
          onClick={() => onFilterChange(DEFAULT_CATALOG_FILTER)}>
          Reset Filter
        </button>
      )}

      {/* Unit yang bentrok disembunyikan secara bawaan; tombol ini
          memunculkannya kembali tanpa membuka data perawatan. */}
      {katalog.summary.blockedBySchedule > 0 && (
        <button type="button" className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12.5px' }}
          aria-pressed={tampilkanTerpesan} onClick={onToggleTerpesan}>
          {tampilkanTerpesan
            ? `Sembunyikan ${katalog.summary.blockedBySchedule} unit terpesan`
            : `Tampilkan ${katalog.summary.blockedBySchedule} unit terpesan`}
        </button>
      )}
    </div>

    {katalog.items.length === 0 ? (
      <div className="card-premium" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
          Tidak ada unit yang sesuai
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--color-secondary)' }}>
          {katalog.summary.blockedBySchedule > 0
            ? `${katalog.summary.blockedBySchedule} unit sedang disewa pada periode ini. Coba geser tanggal mulai atau selesai.`
            : 'Coba ubah kata kunci, kategori, atau periode sewa Anda.'}
        </div>
      </div>
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {katalog.items.map(({ equipment: eq, isBookable, availability, blockedMessage }) => {
          const imgUrl = eq.thumbnail_url || getEquipmentImage(eq.equipment_code, eq.type);
          const nada = CATALOG_AVAILABILITY_TONE[availability];
          return (
            <div key={eq.id} className="card-premium" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ height: '175px', width: '100%', overflow: 'hidden', position: 'relative', backgroundColor: 'var(--color-border)' }}>
                <img src={imgUrl} alt={eq.name} onError={(e) => { const t = e.currentTarget; if (t.dataset.fb) return; t.dataset.fb = "1"; t.src = getEquipmentImage(eq.equipment_code, eq.type); }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                  <span className={`badge badge-${nada}`}>{CATALOG_AVAILABILITY_LABEL[availability]}</span>
                </div>
              </div>

              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <div className="serial-code" style={{ fontSize: '11px', color: 'var(--color-secondary)', marginBottom: '4px' }}>
                    {eq.equipment_code}
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-strong)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                    {eq.name}
                  </h4>
                  <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginBottom: '12px' }}>
                    Merk: <strong>{eq.brand}</strong> &bull; Model: <strong>{eq.model}</strong>
                  </div>
                </div>

                <div>
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Tarif Sewa:</div>
                      <div className="serial-code" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {formatRupiah(Number(eq.rental_price_per_day))}
                        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-secondary)' }}> /hari</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!isBookable}
                      onClick={() => onSewa(eq)}
                      className={isBookable ? 'btn-primary' : 'btn-secondary'}
                      style={{ padding: '7px 14px', fontSize: '12.5px', opacity: isBookable ? 1 : 0.6 }}
                    >
                      {isBookable ? 'Ajukan Sewa' : 'Tidak Tersedia'}
                    </button>
                  </div>

                  {/* Alasan penolakan ditampilkan di kartu — pelanggan tahu
                      unit ini sedang dipakai, bukan sekadar hilang. */}
                  {blockedMessage !== null && (
                    <div style={{ fontSize: '11.5px', color: 'var(--fg-warning-deep)', lineHeight: 1.4 }}>
                      {blockedMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
