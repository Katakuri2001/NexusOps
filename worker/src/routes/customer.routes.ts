import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { hashPassword } from '../db/crypto';
import { camelCaseKeys } from '../db/transform';
import { sendLoginInvitation } from '../services/email.service';

const customers = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

customers.use('/*', authenticate());
customers.use('/*', authorize('OWNER'));

customers.get('/', async (c) => {
  const result = await c.env.NEXUS_OPS.prepare(`
    SELECT c.id, c.phone, c.company, c.address, c.created_at, c.updated_at,
           u.id as user_id, u.email, u.name, u.role, u.is_active
    FROM customers c JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
  `).all();

  const customers = await Promise.all(
    (result.results || []).map(async (cu: any) => {
      const ws = await c.env.NEXUS_OPS.prepare('SELECT id FROM websites WHERE customer_id = ?').bind(cu.id).all();
      return {
        id: cu.id,
        phone: cu.phone,
        company: cu.company,
        address: cu.address,
        createdAt: cu.created_at,
        updatedAt: cu.updated_at,
        user: {
          id: cu.user_id,
          email: cu.email,
          name: cu.name,
          role: cu.role,
          isActive: cu.is_active === 1 || cu.is_active === true,
          createdAt: cu.created_at,
        },
        websites: (ws.results || []).map((w: any) => ({ id: w.id })),
      };
    })
  );

  return c.json(customers);
});

customers.get('/:id', async (c) => {
  const result = await c.env.NEXUS_OPS.prepare(`
    SELECT c.id, c.phone, c.company, c.address, c.created_at, c.updated_at,
           u.id as user_id, u.email, u.name, u.role, u.is_active
    FROM customers c JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Customer not found' }, 404);
  const websites = await c.env.NEXUS_OPS.prepare('SELECT * FROM websites WHERE customer_id = ?').bind(c.req.param('id')).all();
  return c.json({
    id: result.id,
    phone: result.phone,
    company: result.company,
    address: result.address,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    user: {
      id: result.user_id,
      email: result.email,
      name: result.name,
      role: result.role,
      isActive: result.is_active === 1 || result.is_active === true,
      createdAt: result.created_at,
    },
    websites: camelCaseKeys(websites.results || []),
  });
});

customers.post('/', async (c) => {
  const { email, password, name, phone, company, address } = await c.req.json();
  if (!email || !password || !name) return c.json({ error: 'Email, password, and name required' }, 400);

  const existing = await c.env.NEXUS_OPS.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return c.json({ error: 'Email already exists' }, 409);

  const userId = crypto.randomUUID();
  const customerId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await c.env.NEXUS_OPS.batch([
    c.env.NEXUS_OPS.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)').bind(userId, email, passwordHash, name, 'CUSTOMER'),
    c.env.NEXUS_OPS.prepare('INSERT INTO customers (id, user_id, phone, company, address) VALUES (?, ?, ?, ?, ?)').bind(customerId, userId, phone || null, company || null, address || null),
  ]);

  // Send login invitation email (best-effort; never fail the request on email error)
  const loginUrl = `${(c.env.APP_URL || c.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim()}/login`;
  const emailResult = await sendLoginInvitation(c.env, email, name, 'CUSTOMER', loginUrl, password);

  return c.json({ id: customerId, email, name, phone, company, address, emailSent: emailResult.success }, 201);
});

customers.put('/:id', async (c) => {
  const { name, email, phone, company, address } = await c.req.json();
  const customer = await c.env.NEXUS_OPS.prepare('SELECT user_id FROM customers WHERE id = ?').bind(c.req.param('id')).first();
  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  await c.env.NEXUS_OPS.batch([
    c.env.NEXUS_OPS.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), updated_at = datetime("now") WHERE id = ?').bind(name || null, email || null, customer.user_id),
    c.env.NEXUS_OPS.prepare('UPDATE customers SET phone = COALESCE(?, phone), company = COALESCE(?, company), address = COALESCE(?, address), updated_at = datetime("now") WHERE id = ?').bind(phone || null, company || null, address || null, c.req.param('id')),
  ]);

  // Send account-updated notice (best-effort; login link only, password unchanged)
  if (name || email) {
    const userRow = await c.env.NEXUS_OPS.prepare('SELECT email, name FROM users WHERE id = ?').bind(customer.user_id).first();
    if (userRow) {
      const loginUrl = `${(c.env.APP_URL || c.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim()}/login`;
      await sendLoginInvitation(c.env, userRow.email as string, (name || userRow.name) as string, 'CUSTOMER', loginUrl);
    }
  }

  return c.json({ message: 'Customer updated' });
});

customers.patch('/:id/toggle-active', async (c) => {
  const customer = await c.env.NEXUS_OPS.prepare('SELECT user_id FROM customers WHERE id = ?').bind(c.req.param('id')).first();
  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  await c.env.NEXUS_OPS.prepare('UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = datetime("now") WHERE id = ?').bind(customer.user_id).run();
  return c.json({ message: 'Customer toggled' });
});

export default customers;
