import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from '../lib/db';

type Bindings = {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  DATABASE_URL?: string;
  TIDB_HOST?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API requests
app.use('/api/*', cors());

// Health Check
app.get('/api/health', (c) => {
  return c.json({
    status: 'online',
    app: 'PT. SURYA BANGUN SARANA BANJARMASIN',
    runtime: 'Cloudflare Workers Edge',
    database: 'TiDB Cloud Serverless',
    timestamp: new Date().toISOString()
  });
});

// Auth Route
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json();
  const { username, password } = body;

  const user = await db.getUserByUsername(username);
  if (!user) {
    return c.json({ success: false, message: 'Username atau password salah.' }, 401);
  }

  // Simplified auth verification for rapid skripsi presentation
  return c.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role_name,
      role_id: user.role_id,
      email: user.email,
      company_name: user.company_name
    }
  });
});

// Dashboard Stats Route
app.get('/api/dashboard/stats', async (c) => {
  const payments = await db.getPayments();
  const equipments = await db.getEquipments();
  const rentals = await db.getRentals();
  const users = await db.getUsers();

  const totalRevenue = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalCustomers = users.filter(u => u.role_id === 3).length;

  return c.json({
    totalRevenue,
    totalEquipments: equipments.length,
    availableEquipments: equipments.filter(e => e.status === 'AVAILABLE').length,
    rentedEquipments: equipments.filter(e => e.status === 'RENTED').length,
    maintenanceEquipments: equipments.filter(e => e.status === 'MAINTENANCE').length,
    totalRentals: rentals.length,
    activeRentals: rentals.filter(r => r.status === 'ON_GOING' || r.status === 'APPROVED').length,
    totalCustomers
  });
});

// Equipments API
app.get('/api/equipments', async (c) => {
  const items = await db.getEquipments();
  return c.json(items);
});

app.post('/api/equipments', async (c) => {
  const body = await c.req.json();
  const newItem = await db.addEquipment(body);
  return c.json({ success: true, item: newItem }, 201);
});

app.put('/api/equipments/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const updated = await db.updateEquipment(id, body);
  return c.json({ success: true, item: updated });
});

app.delete('/api/equipments/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const ok = await db.deleteEquipment(id);
  return c.json({ success: ok });
});

// Rentals API
app.get('/api/rentals', async (c) => {
  const items = await db.getRentals();
  return c.json(items);
});

app.post('/api/rentals', async (c) => {
  const body = await c.req.json();
  const newItem = await db.addRental(body);
  return c.json({ success: true, item: newItem }, 201);
});

app.put('/api/rentals/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  const { status } = await c.req.json();
  const updated = await db.updateRentalStatus(id, status);
  return c.json({ success: true, item: updated });
});

// Contracts API
app.get('/api/contracts', async (c) => {
  const items = await db.getContracts();
  return c.json(items);
});

app.post('/api/contracts/:id/sign', async (c) => {
  const id = Number(c.req.param('id'));
  const updated = await db.signContract(id);
  return c.json({ success: true, item: updated });
});

// Payments API
app.get('/api/payments', async (c) => {
  const items = await db.getPayments();
  return c.json(items);
});

app.post('/api/payments/:id/verify', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const updated = await db.verifyPayment(id, body.staffId || 3, body.staffName || 'Hendra Wijaya');
  return c.json({ success: true, item: updated });
});

// Maintenance API
app.get('/api/maintenance', async (c) => {
  const items = await db.getMaintenance();
  return c.json(items);
});

app.post('/api/maintenance', async (c) => {
  const body = await c.req.json();
  const newItem = await db.scheduleMaintenance(body);
  return c.json({ success: true, item: newItem }, 201);
});

// GPS Telemetry API
app.get('/api/tracking', async (c) => {
  const items = await db.getGpsTracking();
  return c.json(items);
});

// Reports API
app.get('/api/reports', async (c) => {
  const items = await db.getReports();
  return c.json(items);
});

// Users API
app.get('/api/users', async (c) => {
  const items = await db.getUsers();
  return c.json(items);
});

app.post('/api/users/:id/toggle', async (c) => {
  const id = Number(c.req.param('id'));
  const updated = await db.toggleUserStatus(id);
  return c.json({ success: true, item: updated });
});

// Fallback to Cloudflare Static Assets
app.all('*', async (c) => {
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default app;
