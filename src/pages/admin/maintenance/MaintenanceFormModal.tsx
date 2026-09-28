/**
 * Formulir penjadwalan perawatan unit alat berat.
 *
 * Komponen ini murni tampilan: keadaan form dimiliki induk supaya nilai yang
 * dikirim ke server selalu sama dengan yang tampil di layar.
 */
import { Modal } from '../../../components/Modal';
import { MAINTENANCE_TYPES, MAINTENANCE_TYPE_LABEL } from '../../../lib/validators';
import type { Equipment, Maintenance } from '../../../types';
import type { MaintenanceTypeValue } from '../../../lib/validators';

/** Nilai form penjadwalan servis. */
export interface MaintenanceFormValues {
  equipment_id: number;
  scheduled_date: string;
  completion_date: string;
  maintenance_type: Maintenance['maintenance_type'];
  hour_meter_at_maintenance: number;
  description: string;
  spareparts_replaced: string;
  cost: number;
  technician_id: number;
  status: Maintenance['status'];
}

interface Props {
  open: boolean;
  equipments: readonly Equipment[];
  values: MaintenanceFormValues;
  onChange: (values: MaintenanceFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const MaintenanceFormModal: React.FC<Props> = ({
  open: isModalOpen,
  equipments,
  values: formData,
  onChange: setFormData,
  onSubmit: handleFormSubmit,
  onClose,
}) => (
      <Modal
  isOpen={isModalOpen}
  onClose={onClose}
  title="Jadwalkan Perawatan Alat Berat"
>
  <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div>
      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
        Pilih Alat Berat
      </label>
      <select
        className="input-premium"
        value={formData.equipment_id}
        onChange={(e) => {
          const eq = equipments.find(item => item.id === Number(e.target.value));
          setFormData({
            ...formData,
            equipment_id: Number(e.target.value),
            hour_meter_at_maintenance: eq?.hour_meter || 0
          });
        }}
      >
        {equipments.map((e) => (
          <option key={e.id} value={e.id}>
            {e.equipment_code} - {e.name} (HM: {e.hour_meter} jam)
          </option>
        ))}
      </select>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
          Jenis Pemeliharaan
        </label>
        <select
          className="input-premium"
          value={formData.maintenance_type}
          onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value as MaintenanceTypeValue })}
        >
          {MAINTENANCE_TYPES.map((jenis) => (
            <option key={jenis} value={jenis}>
              {jenis} ({MAINTENANCE_TYPE_LABEL[jenis]})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
          Hour Meter (HM) Unit
        </label>
        <input
          type="number"
          step="0.1"
          className="input-premium"
          value={formData.hour_meter_at_maintenance}
          onChange={(e) => setFormData({ ...formData, hour_meter_at_maintenance: parseFloat(e.target.value) || 0 })}
        />
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
          Tanggal Terjadwal
        </label>
        <input
          type="date"
          required
          className="input-premium"
          value={formData.scheduled_date}
          onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
          Estimasi Biaya Servis (Rp)
        </label>
        <input
          type="number"
          className="input-premium"
          value={formData.cost}
          onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
        />
      </div>
    </div>

    <div>
      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
        Deskripsi & Keluhan Perbaikan
      </label>
      <textarea
        rows={2}
        className="input-premium"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
    </div>

    <div>
      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
        Suku Cadang yang Diganti
      </label>
      <input
        type="text"
        className="input-premium"
        value={formData.spareparts_replaced}
        onChange={(e) => setFormData({ ...formData, spareparts_replaced: e.target.value })}
      />
    </div>

    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
      <button
        type="button"
        onClick={onClose}
        className="btn-secondary"
      >
        Batal
      </button>
      <button
        type="submit"
        className="btn-primary"
      >
        Simpan Jadwal Servis
      </button>
    </div>
  </form>
</Modal>
);
