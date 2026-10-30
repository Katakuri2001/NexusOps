import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { camelCaseKeys } from '../db/transform';
import { sendNotificationAlert } from '../services/email.service';

const notifications = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

notifications.use('/*', authenticate());

notifications.get('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  let result;
  if (auth.role === 'OWNER') {
    result = await c.env.NEXUS_OPS.prepare(`
      SELECT n.*, w.name as website_name, u.name as customer_name
      FROM notifications n
      LEFT JOIN websites w ON n.website_id = w.id
      LEFT JOIN customers c ON n.customer_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY n.created_at DESC LIMIT 50
    `).all();
    const notifications = (result.results || []).map((n: any) => ({
      ...n,
      website: n.website_name ? { name: n.website_name, id: n.website_id, domain: null } : null,
      customer: n.customer_name ? { user: { name: n.customer_name } } : null,
    }));
    return c.json(camelCaseKeys(notifications));
  } else {
    const customer = await c.env.NEXUS_OPS.prepare('SELECT id FROM customers WHERE user_id = ?').bind(auth.userId).first();
    if (!customer) return c.json([]);
    result = await c.env.NEXUS_OPS.prepare(`
      SELECT n.*, w.name as website_name
      FROM notifications n
      LEFT JOIN websites w ON n.website_id = w.id
      WHERE n.customer_id = ?
      ORDER BY n.created_at DESC
    `).bind(customer.id).all();
    const notifications = (result.results || []).map((n: any) => ({
      ...n,
      website: n.website_name ? { name: n.website_name, id: n.website_id } : null,
    }));
    return c.json(camelCaseKeys(notifications));
  }
});

notifications.get('/unread-count', async (c) => {
  const auth = c.get('auth') as AuthContext;
  if (auth.role === 'OWNER') {
    const result = await c.env.NEXUS_OPS.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').first();
    return c.json({ count: result?.count || 0 });
  }
  const customer = await c.env.NEXUS_OPS.prepare('SELECT id FROM customers WHERE user_id = ?').bind(auth.userId).first();
  if (!customer) return c.json({ count: 0 });
  const result = await c.env.NEXUS_OPS.prepare('SELECT COUNT(*) as count FROM notifications WHERE customer_id = ? AND is_read = 0').bind(customer.id).first();
  return c.json({ count: result?.count || 0 });
});

notifications.post('/', authorize('OWNER'), async (c) => {
  const { websiteId, customerId, title, message, type, priority } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.NEXUS_OPS.prepare(`INSERT INTO notifications (id,website_id,customer_id,title,message,type,priority)
    VALUES (?,?,?,?,?,?,?)`).bind(id, websiteId||null, customerId, title, message, type||'INFORMATION', priority||'NORMAL').run();

  // Send notification alert emails to owner and assigned technicians (best-effort)
  try {
    const websiteName = websiteId
      ? ((await c.env.NEXUS_OPS.prepare('SELECT name FROM websites WHERE id = ?').bind(websiteId).first())?.name as string | null)
      : null;
    const notification = { title, message, type: type || 'INFORMATION', priority: priority || 'NORMAL' };

    // Owner (admin)
    const owners = await c.env.NEXUS_OPS.prepare("SELECT email, name FROM users WHERE role = 'OWNER' AND is_active = 1").all();
    for (const o of owners.results || []) {
      await sendNotificationAlert(c.env, o.email as string, o.name as string, notification, websiteName);
    }

    // Assigned technicians of the website
    if (websiteId) {
      const techs = await c.env.NEXUS_OPS.prepare(`
        SELECT u.email, u.name FROM technician_website_assignments twa
        JOIN technicians t ON twa.technician_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE twa.website_id = ? AND u.is_active = 1
      `).bind(websiteId).all();
      for (const t of techs.results || []) {
        await sendNotificationAlert(c.env, t.email as string, t.name as string, notification, websiteName);
      }
    }
  } catch (err: any) {
    console.error('[notification] email alert failed:', err?.message || err);
  }

  return c.json({ id }, 201);
});

notifications.patch('/:id/read', async (c) => {
  await c.env.NEXUS_OPS.prepare('UPDATE notifications SET is_read = 1, updated_at = datetime("now") WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ message: 'Notification marked as read' });
});

notifications.post('/read-all', async (c) => {
  const auth = c.get('auth') as AuthContext;
  if (auth.role === 'OWNER') {
    await c.env.NEXUS_OPS.prepare('UPDATE notifications SET is_read = 1, updated_at = datetime("now") WHERE is_read = 0').run();
  } else {
    const customer = await c.env.NEXUS_OPS.prepare('SELECT id FROM customers WHERE user_id = ?').bind(auth.userId).first();
    if (customer) {
      await c.env.NEXUS_OPS.prepare('UPDATE notifications SET is_read = 1, updated_at = datetime("now") WHERE customer_id = ?').bind(customer.id).run();
    }
  }
  return c.json({ message: 'All notifications marked as read' });
});

export default notifications;
