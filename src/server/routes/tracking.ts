/**
 * Rute API domain Telemetri GPS (pelacakan armada).
 *
 * Dipisah dari `server/index.ts` supaya berkas rute tetap ringkas dan
 * terbaca sebagai daftar endpoint; kerangka aplikasi (CORS, auth, error
 * handler, fallback aset) tetap tinggal di `index.ts`.
 */
import type { Hono } from 'hono';
import {
  BAD_JSON,
  badValidation,
  buildFleetTelemetry,
  db,
  isUnitOutOfService,
  normalizeFleetFilter,
  summarizeAvailability,
} from '../context';
import type { AppEnv } from '../http';

export function daftarTracking(app: Hono<AppEnv>): void {
// GPS Telemetry API
}
