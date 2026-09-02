import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';

const websites = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

websites.use('/*', authenticate());

// GET / - List websites (role-based)
websites.get('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  let result;

  if (auth.role === 'OWNER') {
    result = await c.env.DB.prepare(`
      SELECT w.*, cu.company as customer_company, u.name as customer_name
      FROM websites w
      LEFT JOIN customers cu ON w.customer_id = cu.id
      LEFT JOIN users u ON cu.user_id = u.id
      ORDER BY w.created_at DESC
    `).all();
  } else if (auth.role === 'CUSTOMER') {
    const customer = await c.env.DB.prepare('SELECT id FROM customers WHERE user_id = ?').bind(auth.userId).first();
    if (!customer) return c.json([]);
    result = await c.env.DB.prepare('SELECT * FROM websites WHERE customer_id = ? ORDER BY created_at DESC').bind(customer.id).all();
  } else {
    const assignments = await c.env.DB.prepare(`
      SELECT w.* FROM websites w
      JOIN technician_website_assignments twa ON w.id = twa.website_id
      JOIN technicians t ON twa.technician_id = t.id
      WHERE t.user_id = ?
    `).bind(auth.userId).all();
    result = assignments;
  }

  return c.json(result.results);
});

// GET /:id - Get website by ID
websites.get('/:id', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT w.*, cu.company as customer_company, u.name as customer_name, u.email as customer_email
    FROM websites w
    LEFT JOIN customers cu ON w.customer_id = cu.id
    LEFT JOIN users u ON cu.user_id = u.id
    WHERE w.id = ?
  `).bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Website not found' }, 404);

  const auth = c.get('auth') as AuthContext;
  if (auth.role === 'TECHNICIAN') {
    const hasAccess = await c.env.DB.prepare('SELECT 1 FROM technician_website_assignments WHERE technician_id IN (SELECT id FROM technicians WHERE user_id = ?) AND website_id = ?').bind(auth.userId, c.req.param('id')).first();
    if (!hasAccess) return c.json({ error: 'Access denied' }, 403);
  }

  return c.json(result);
});

// POST / - Create website (OWNER only)
websites.post('/', authorize('OWNER'), async (c) => {
  const { name, domain, description, developerName, status, websiteType, launchDate, customerId } = await c.req.json();
  if (!name || !domain || !customerId) return c.json({ error: 'Name, domain, and customerId required' }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO websites (id, name, domain, description, developer_name, status, website_type, launch_date, customer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, name, domain, description || null, developerName || null, status || 'OPERATIONAL', websiteType || null, launchDate || null, customerId).run();

  return c.json({ id, name, domain }, 201);
});

// PUT /:id - Update website (OWNER only)
websites.put('/:id', authorize('OWNER'), async (c) => {
  const { name, domain, description, developerName, status, websiteType, launchDate } = await c.req.json();
  await c.env.DB.prepare(`
    UPDATE websites SET name = COALESCE(?, name), domain = COALESCE(?, domain),
    description = COALESCE(?, description), developer_name = COALESCE(?, developer_name),
    status = COALESCE(?, status), website_type = COALESCE(?, website_type),
    launch_date = COALESCE(?, launch_date), updated_at = datetime('now')
    WHERE id = ?
  `).bind(name || null, domain || null, description || null, developerName || null, status || null, websiteType || null, launchDate || null, c.req.param('id')).run();
  return c.json({ message: 'Website updated' });
});

// DELETE /:id
websites.delete('/:id', authorize('OWNER'), async (c) => {
  await c.env.DB.prepare('DELETE FROM websites WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ message: 'Website deleted' });
});

// PUT /:id/hosting
websites.put('/:id/hosting', authorize('OWNER'), async (c) => {
  const { provider, status, cost, billingCycle, startDate, dueDate, notes } = await c.req.json();
  const existing = await c.env.DB.prepare('SELECT id FROM hosting_services WHERE website_id = ?').bind(c.req.param('id')).first();
  if (existing) {
    await c.env.DB.prepare(`UPDATE hosting_services SET provider=COALESCE(?,provider), status=COALESCE(?,status),
      cost=COALESCE(?,cost), billing_cycle=COALESCE(?,billing_cycle), start_date=COALESCE(?,start_date),
      due_date=COALESCE(?,due_date), notes=COALESCE(?,notes), updated_at=datetime('now') WHERE website_id=?`
    ).bind(provider||null, status||null, cost, billingCycle||null, startDate||null, dueDate||null, notes||null, c.req.param('id')).run();
  } else {
    await c.env.DB.prepare(`INSERT INTO hosting_services (id,website_id,provider,status,cost,billing_cycle,start_date,due_date,notes)
      VALUES (?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(), c.req.param('id'), provider, status||'active', cost, billingCycle||'monthly', startDate, dueDate, notes||null).run();
  }
  return c.json({ message: 'Hosting updated' });
});

// PUT /:id/database
websites.put('/:id/database', authorize('OWNER'), async (c) => {
  const { provider, status, monthlyCost, billingCycle, startDate, dueDate, notes } = await c.req.json();
  const existing = await c.env.DB.prepare('SELECT id FROM database_services WHERE website_id = ?').bind(c.req.param('id')).first();
  if (existing) {
    await c.env.DB.prepare(`UPDATE database_services SET provider=COALESCE(?,provider), status=COALESCE(?,status),
      monthly_cost=COALESCE(?,monthly_cost), billing_cycle=COALESCE(?,billing_cycle), start_date=COALESCE(?,start_date),
      due_date=COALESCE(?,due_date), notes=COALESCE(?,notes), updated_at=datetime('now') WHERE website_id=?`
    ).bind(provider||null, status||null, monthlyCost, billingCycle||null, startDate||null, dueDate||null, notes||null, c.req.param('id')).run();
  } else {
    await c.env.DB.prepare(`INSERT INTO database_services (id,website_id,provider,status,monthly_cost,billing_cycle,start_date,due_date,notes)
      VALUES (?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(), c.req.param('id'), provider, status||'active', monthlyCost, billingCycle||'monthly', startDate, dueDate, notes||null).run();
  }
  return c.json({ message: 'Database service updated' });
});

// PUT /:id/server
websites.put('/:id/server', authorize('OWNER'), async (c) => {
  const { provider, status, plan, cost, billingCycle, startDate, dueDate, notes } = await c.req.json();
  const existing = await c.env.DB.prepare('SELECT id FROM server_services WHERE website_id = ?').bind(c.req.param('id')).first();
  if (existing) {
    await c.env.DB.prepare(`UPDATE server_services SET provider=COALESCE(?,provider), status=COALESCE(?,status),
      plan=COALESCE(?,plan), cost=COALESCE(?,cost), billing_cycle=COALESCE(?,billing_cycle), start_date=COALESCE(?,start_date),
      due_date=COALESCE(?,due_date), notes=COALESCE(?,notes), updated_at=datetime('now') WHERE website_id=?`
    ).bind(provider||null, status||null, plan||null, cost, billingCycle||null, startDate||null, dueDate||null, notes||null, c.req.param('id')).run();
  } else {
    await c.env.DB.prepare(`INSERT INTO server_services (id,website_id,provider,status,plan,cost,billing_cycle,start_date,due_date,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(), c.req.param('id'), provider, status||'operational', plan||null, cost, billingCycle||'monthly', startDate, dueDate, notes||null).run();
  }
  return c.json({ message: 'Server service updated' });
});

// PUT /:id/plan
websites.put('/:id/plan', authorize('OWNER'), async (c) => {
  const { name, description, price, billingCycle, features, startDate, renewalDate } = await c.req.json();
  const existing = await c.env.DB.prepare('SELECT id FROM plans WHERE website_id = ?').bind(c.req.param('id')).first();
  if (existing) {
    await c.env.DB.prepare(`UPDATE plans SET name=COALESCE(?,name), description=COALESCE(?,description),
      price=COALESCE(?,price), billing_cycle=COALESCE(?,billing_cycle), features=COALESCE(?,features),
      start_date=COALESCE(?,start_date), renewal_date=COALESCE(?,renewal_date), updated_at=datetime('now') WHERE website_id=?`
    ).bind(name||null, description||null, price, billingCycle||null, features ? JSON.stringify(features) : null, startDate||null, renewalDate||null, c.req.param('id')).run();
  } else {
    await c.env.DB.prepare(`INSERT INTO plans (id,website_id,name,description,price,billing_cycle,features,start_date,renewal_date)
      VALUES (?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(), c.req.param('id'), name, description||null, price, billingCycle, features ? JSON.stringify(features) : '[]', startDate, renewalDate||null).run();
  }
  return c.json({ message: 'Plan updated' });
});

// GET /:id/financial
websites.get('/:id/financial', async (c) => {
  const plan = await c.env.DB.prepare('SELECT * FROM plans WHERE website_id = ?').bind(c.req.param('id')).first();
  const hosting = await c.env.DB.prepare('SELECT * FROM hosting_services WHERE website_id = ?').bind(c.req.param('id')).first();
  const db = await c.env.DB.prepare('SELECT * FROM database_services WHERE website_id = ?').bind(c.req.param('id')).first();
  const server = await c.env.DB.prepare('SELECT * FROM server_services WHERE website_id = ?').bind(c.req.param('id')).first();
  const charges = await c.env.DB.prepare('SELECT * FROM additional_charges WHERE website_id = ?').bind(c.req.param('id')).all();

  const monthlyTotal = (Number(plan?.price) || 0) + (Number(hosting?.cost) || 0) + (Number(db?.monthly_cost) || 0) + (Number(server?.cost) || 0);

  return c.json({ plan, hosting, database: db, server, charges: charges.results, monthlyTotal });
});

// GET /:id/maintenance
websites.get('/:id/maintenance', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM maintenance_records WHERE website_id = ? ORDER BY created_at DESC').bind(c.req.param('id')).all();
  return c.json(result.results.map(r => ({ ...r, items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items })));
});

// POST /:id/maintenance
websites.post('/:id/maintenance', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const { title, description, items, status, notes, isInternal } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`INSERT INTO maintenance_records (id,website_id,title,description,items,status,notes,is_internal,created_by_id)
    VALUES (?,?,?,?,?,?,?,?,?)`).bind(id, c.req.param('id'), title, description||null, JSON.stringify(items||[]), status||'completed', notes||null, isInternal?1:0, auth.userId).run();
  return c.json({ id }, 201);
});

// POST /:id/charges
websites.post('/:id/charges', authorize('OWNER'), async (c) => {
  const { description, amount, date, billingType, status, notes } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`INSERT INTO additional_charges (id,website_id,description,amount,date,billing_type,status,notes)
    VALUES (?,?,?,?,?,?,?,?)`).bind(id, c.req.param('id'), description, amount, date, billingType||'ONE_TIME', status||'pending', notes||null).run();
  return c.json({ id }, 201);
});

// GET /:id/charges
websites.get('/:id/charges', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM additional_charges WHERE website_id = ? ORDER BY date DESC').bind(c.req.param('id')).all();
  return c.json(result.results);
});

// GET /:id/timeline
websites.get('/:id/timeline', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM website_timeline WHERE website_id = ? ORDER BY created_at DESC').bind(c.req.param('id')).all();
  return c.json(result.results);
});

// POST /:id/timeline
websites.post('/:id/timeline', authorize('OWNER'), async (c) => {
  const { title, description, icon } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare('INSERT INTO website_timeline (id,website_id,title,description,icon) VALUES (?,?,?,?,?)').bind(id, c.req.param('id'), title, description||null, icon||null).run();
  return c.json({ id }, 201);
});

// POST /:id/notifications
websites.post('/:id/notifications', authorize('OWNER'), async (c) => {
  const { customerId, title, message, type, priority } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`INSERT INTO notifications (id,website_id,customer_id,title,message,type,priority)
    VALUES (?,?,?,?,?,?,?)`).bind(id, c.req.param('id'), customerId, title, message, type||'INFORMATION', priority||'NORMAL').run();
  return c.json({ id }, 201);
});

// GET /:id/notifications
websites.get('/:id/notifications', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM notifications WHERE website_id = ? ORDER BY created_at DESC').bind(c.req.param('id')).all();
  return c.json(result.results);
});

// PATCH /:id/status
websites.patch('/:id/status', async (c) => {
  const { status, reason, description } = await c.req.json();
  const auth = c.get('auth') as AuthContext;
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE websites SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(status, c.req.param('id')),
    c.env.DB.prepare('INSERT INTO website_status_history (id,website_id,status,reason,description,updated_by) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), c.req.param('id'), status, reason||null, description||null, auth.userId),
  ]);
  return c.json({ message: 'Status updated' });
});

export default websites;
