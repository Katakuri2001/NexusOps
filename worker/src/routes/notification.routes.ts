import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';

const notifications = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

notifications.use('/*', authenticate());

notifications.get('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  let result;
  if (auth.role === 'OWNER') {
    result = await c.env.DB.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all();
  } else {
    const customer = await c.env.DB.prepare('SELECT id FROM customers WHERE user_id = ?').bind(auth.userId).first();
    if (!customer) return c.json([]);
    result = await c.env.DB.prepare('SELECT * FROM notifications WHERE customer_id = ? ORDER BY created_at DESC').bind(customer.id).all();
  }
  return c.json(result.results);
});

notifications.get('/unread-count', async (c) => {
  const auth = c.get('auth') as AuthContext;
  if (auth.role === 'OWNER') {
    const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').first();
    return c.json({ count: result?.count || 0 });
  }
  const customer = await c.env.DB.prepare('SELECT id FROM customers WHERE user_id = ?').bind(auth.userId).first();
  if (!customer) return c.json({ count: 0 });
  const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM notifications WHERE customer_id = ? AND is_read = 0').bind(customer.id).first();
  return c.json({ count: result?.count || 0 });
});

notifications.post('/', authorize('OWNER'), async (c) => {
  const { websiteId, customerId, title, message, type, priority } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`INSERT INTO notifications (id,website_id,customer_id,title,message,type,priority)
    VALUES (?,?,?,?,?,?,?)`).bind(id, websiteId||null, customerId, title, message, type||'INFORMATION', priority||'NORMAL').run();
  return c.json({ id }, 201);
});

notifications.patch('/:id/read', async (c) => {
  await c.env.DB.prepare('UPDATE notifications SET is_read = 1, updated_at = datetime("now") WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ message: 'Notification marked as read' });
});

notifications.post('/read-all', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const customer = await c.env.DB.prepare('SELECT id FROM customers WHERE user_id = ?').bind(auth.userId).first();
  if (customer) {
    await c.env.DB.prepare('UPDATE notifications SET is_read = 1, updated_at = datetime("now") WHERE customer_id = ?').bind(customer.id).run();
  }
  return c.json({ message: 'All notifications marked as read' });
});

export default notifications;
