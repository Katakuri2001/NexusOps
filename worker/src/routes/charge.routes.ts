import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { camelCaseKeys } from '../db/transform';

const charges = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

charges.use('/*', authenticate());
charges.use('/*', authorize('OWNER'));

charges.get('/upcoming', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT ac.*, w.name as website_name FROM additional_charges ac
    JOIN websites w ON ac.website_id = w.id
    WHERE ac.status = 'pending' ORDER BY ac.date ASC
  `).all();
  return c.json(camelCaseKeys(result.results));
});

charges.get('/website/:websiteId', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM additional_charges WHERE website_id = ? ORDER BY date DESC').bind(c.req.param('websiteId')).all();
  return c.json(camelCaseKeys(result.results));
});

charges.post('/website/:websiteId', async (c) => {
  const { description, amount, date, billingType, status, notes } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`INSERT INTO additional_charges (id,website_id,description,amount,date,billing_type,status,notes)
    VALUES (?,?,?,?,?,?,?,?)`).bind(id, c.req.param('websiteId'), description, amount, date, billingType||'ONE_TIME', status||'pending', notes||null).run();
  return c.json({ id }, 201);
});

charges.put('/:id', async (c) => {
  const { description, amount, date, billingType, status, notes } = await c.req.json();
  await c.env.DB.prepare(`UPDATE additional_charges SET description=COALESCE(?,description), amount=COALESCE(?,amount),
    date=COALESCE(?,date), billing_type=COALESCE(?,billing_type), status=COALESCE(?,status),
    notes=COALESCE(?,notes), updated_at=datetime('now') WHERE id=?`
  ).bind(description||null, amount, date||null, billingType||null, status||null, notes||null, c.req.param('id')).run();
  return c.json({ message: 'Charge updated' });
});

charges.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM additional_charges WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ message: 'Charge deleted' });
});

export default charges;
