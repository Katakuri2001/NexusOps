import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { hashPassword } from '../db/crypto';
import { camelCaseKeys } from '../db/transform';

const customers = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

customers.use('/*', authenticate());
customers.use('/*', authorize('OWNER'));

customers.get('/', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT c.id, c.phone, c.company, c.address, c.created_at, c.updated_at,
           u.id as user_id, u.email, u.name, u.role, u.is_active,
           (SELECT COUNT(*) FROM websites WHERE customer_id = c.id) as websites_count
    FROM customers c JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
  `).all();
  return c.json(camelCaseKeys(result.results));
});

customers.get('/:id', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT c.id, c.phone, c.company, c.address, c.created_at, c.updated_at,
           u.id as user_id, u.email, u.name, u.role, u.is_active
    FROM customers c JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Customer not found' }, 404);
  const websites = await c.env.DB.prepare('SELECT * FROM websites WHERE customer_id = ?').bind(c.req.param('id')).all();
  return c.json(camelCaseKeys({ ...result, websites: websites.results }));
});

customers.post('/', async (c) => {
  const { email, password, name, phone, company, address } = await c.req.json();
  if (!email || !password || !name) return c.json({ error: 'Email, password, and name required' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return c.json({ error: 'Email already exists' }, 409);

  const userId = crypto.randomUUID();
  const customerId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)').bind(userId, email, passwordHash, name, 'CUSTOMER'),
    c.env.DB.prepare('INSERT INTO customers (id, user_id, phone, company, address) VALUES (?, ?, ?, ?, ?)').bind(customerId, userId, phone || null, company || null, address || null),
  ]);

  return c.json({ id: customerId, email, name, phone, company, address }, 201);
});

customers.put('/:id', async (c) => {
  const { name, email, phone, company, address } = await c.req.json();
  const customer = await c.env.DB.prepare('SELECT user_id FROM customers WHERE id = ?').bind(c.req.param('id')).first();
  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), updated_at = datetime("now") WHERE id = ?').bind(name || null, email || null, customer.user_id),
    c.env.DB.prepare('UPDATE customers SET phone = COALESCE(?, phone), company = COALESCE(?, company), address = COALESCE(?, address), updated_at = datetime("now") WHERE id = ?').bind(phone || null, company || null, address || null, c.req.param('id')),
  ]);

  return c.json({ message: 'Customer updated' });
});

customers.patch('/:id/toggle-active', async (c) => {
  const customer = await c.env.DB.prepare('SELECT user_id FROM customers WHERE id = ?').bind(c.req.param('id')).first();
  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  await c.env.DB.prepare('UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = datetime("now") WHERE id = ?').bind(customer.user_id).run();
  return c.json({ message: 'Customer toggled' });
});

export default customers;
