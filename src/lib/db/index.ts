/**
 * Lapisan data aplikasi (pintu masuk publik).
 *
 * Sebelumnya satu berkas 1.202 baris; kini dipecah per domain di `store/`.
 * Seluruh pemakai lama (`import { db } from '../lib/db'`) tetap bekerja tanpa
 * perubahan karena berkas ini menyatukan kembali seluruh permukaannya.
 */
import { users } from '../store/users';
import { equipments } from '../store/equipments';
import { rentals } from '../store/rentals';
import { contractDocs } from '../store/contractDocs';
import { payments } from '../store/payments';
import { ops } from '../store/ops';

export {
  configureDatabaseUrl,
  isDatabaseConnected,
  getDataMode,
  stateStore,
  executeSql,
  loginApi,
  setApiBridgeToken,
  flushAntreanOffline,
} from '../store/internal';
export type { DataMode, AuthCheck } from '../store/internal';

export { warmSettings } from '../store/settings';
export { hydrasiDariTiDB } from '../store/hidrasi';

/**
 * Satu permukaan data untuk seluruh aplikasi.
 *
 * Digabung dari objek per-domain; tiap domain bekerja langsung atas
 * `stateStore` bersama sehingga tidak ada ketergantungan antar-domain.
 */
export const db = {
  ...users,
  ...equipments,
  ...rentals,
  ...contractDocs,
  ...payments,
  ...ops,
};
