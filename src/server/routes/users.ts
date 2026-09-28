/**
 * Rute API domain users.
 *
 * Dipisah dari `server/index.ts` supaya berkas rute tetap ringkas dan
 * terbaca sebagai daftar endpoint; kerangka aplikasi (CORS, auth, error
 * handler, fallback aset) tetap tinggal di `index.ts`.
 */
import type { Hono } from 'hono';
import {
  BAD_ID,
  BAD_JSON,
  MIN_PASSWORD_LENGTH,
  auditActor,
  auditLog,
  badValidation,
  db,
  parseId,
  readJsonBody,
  toErrorBag,
  validateUserInput,
} from '../context';
import type {
  PublicUser,
  RoleName,
  User,
  ValidatedUserInput,
} from '../context';
import type { AppEnv } from '../http';

export function daftarUsers(app: Hono<AppEnv>): void {
// Users API
// Catatan: field sensitif (password hash) TIDAK pernah dikirim ke klien.

/**
 * Whitelist field pengguna yang boleh dikirim ke klien.
 *
 * Dibuat terpusat (bukan inline) agar tidak ada satu pun respons yang lupa
 * membuang `password_hash` — penyebab umum kebocoran kredensial.
 */
function ringkasUser(u: {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  company_name: string | null;
  role_id: number;
  role_name?: User['role_name'];
  status: User['status'];
}): PublicUser {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.full_name,
    phone: u.phone,
    address: u.address,
    company_name: u.company_name,
    role_id: u.role_id,
    role_name: u.role_name,
    status: u.status,
  };
}

app.get('/api/users', async (c) => {
  const items = await db.getUsers();
  return c.json(items.map(ringkasUser));
});

/**
 * Pendaftaran pengguna baru oleh Administrator.
 *
 * Password TIDAK diterima lewat endpoint ini: Admin mendaftarkan identitas,
 * lalu password ditetapkan lewat `POST /api/users/:id/password`. Karena itu
 * `password_hash` disetel `null` dan akun belum bisa login sampai password
 * ditetapkan.
 */
app.post('/api/users', async (c) => {
  const body = await readJsonBody<unknown>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  const hasil = validateUserInput(body);
  if (!hasil.ok) return c.json(badValidation(toErrorBag(hasil.errors)), 400);

  const input: ValidatedUserInput = hasil.value;
  const users = await db.getUsers();

  // Username & email harus unik — keduanya dipakai sebagai identitas login.
  const usernameBentrok = users.some(
    u => u.username.toLowerCase() === input.username.toLowerCase()
  );
  if (usernameBentrok) {
    return c.json(badValidation({ username: `Username ${input.username} sudah digunakan.` }), 409);
  }

  const emailBentrok = users.some(u => u.email.toLowerCase() === input.email.toLowerCase());
  if (emailBentrok) {
    return c.json(badValidation({ email: 'Alamat email sudah terdaftar.' }), 409);
  }

  const newUser = await db.addUser({
    role_id: input.role_id,
    role_name: input.role_id === 1 ? 'ADMIN' : input.role_id === 2 ? 'STAFF' : 'CUSTOMER',
    username: input.username,
    email: input.email,
    full_name: input.full_name,
    phone: input.phone,
    address: input.address,
    company_name: input.company_name,
    status: 'ACTIVE',
    password_hash: null,
  });

  // Audit trail: pendaftaran akun baru hanya oleh Administrator.
  auditLog({
    ...auditActor(c),
    action: 'USER_CREATE',
    entity: 'user',
    entity_id: newUser.id,
    detail: `Akun ${newUser.username} (${newUser.role_name}) didaftarkan oleh Administrator`,
  });

  return c.json({ success: true, item: ringkasUser(newUser) }, 201);
});

/**
 * Administrator menetapkan / mereset password sebuah akun.
 *
 * Tanpa endpoint ini, akun yang dibuat lewat `POST /api/users` tidak pernah
 * memiliki `password_hash` sehingga selamanya tidak bisa login.
 */
app.post('/api/users/:id/password', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return c.json(BAD_ID, 400);

  const body = await readJsonBody<{ password?: unknown }>(c);
  if (body === null) return c.json(BAD_JSON, 400);

  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return c.json(
      badValidation({ password: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.` }),
      400
    );
  }

  const updated = await db.setUserPassword(id, password);
  if (!updated) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' } }, 404);
  }

  auditLog({
    ...auditActor(c),
    action: 'PASSWORD_RESET',
    entity: 'user',
    entity_id: id,
    detail: `Password akun ${updated.username} ditetapkan ulang oleh Administrator`,
  });

  return c.json({ success: true, item: ringkasUser(updated) });
});
}
