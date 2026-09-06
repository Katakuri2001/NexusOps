import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { hashPassword } from '../db/crypto';
import { camelCaseKeys } from '../db/transform';

const technicians = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

technicians.use('/*', authenticate());
technicians.use('/*', authorize('OWNER'));

technicians.get('/', async (c) => {
  const result = await c.env.NEXUS_OPS.prepare(`
    SELECT t.id, t.specialization, t.created_at, t.updated_at,
           u.id as user_id, u.email, u.name, u.role, u.is_active
    FROM technicians t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC
  `).all();
  
  const techniciansWithAssignments = await Promise.all(
    result.results.map(async (tech) => {
      const assignments = await c.env.NEXUS_OPS.prepare(`
        SELECT w.id, w.name, w.domain FROM websites w
        JOIN technician_website_assignments twa ON w.id = twa.website_id
        WHERE twa.technician_id = ?
      `).bind(tech.id).all();
      return { ...tech, assignments: assignments.results };
    })
  );
  
  return c.json(camelCaseKeys(techniciansWithAssignments));
});

technicians.get('/:id', async (c) => {
  const result = await c.env.NEXUS_OPS.prepare(`
    SELECT t.id, t.specialization, t.created_at, t.updated_at,
           u.id as user_id, u.email, u.name, u.role, u.is_active
    FROM technicians t JOIN users u ON t.user_id = u.id WHERE t.id = ?
  `).bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Technician not found' }, 404);
  
  const assignments = await c.env.NEXUS_OPS.prepare(`
    SELECT w.id, w.name, w.domain FROM websites w
    JOIN technician_website_assignments twa ON w.id = twa.website_id
    WHERE twa.technician_id = ?
  `).bind(c.req.param('id')).all();
  
  const permissions = await c.env.NEXUS_OPS.prepare(`
    SELECT website_id, permission FROM technician_permissions
    WHERE technician_id = ?
  `).bind(c.req.param('id')).all();
  
  return c.json(camelCaseKeys({ ...result, assignments: assignments.results, permissions: permissions.results }));
});

technicians.post('/', async (c) => {
  const { email, password, name, specialization } = await c.req.json();
  if (!email || !password || !name) return c.json({ error: 'Email, password, and name required' }, 400);

  const existing = await c.env.NEXUS_OPS.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return c.json({ error: 'Email already exists' }, 409);

  const userId = crypto.randomUUID();
  const techId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await c.env.NEXUS_OPS.batch([
    c.env.NEXUS_OPS.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)').bind(userId, email, passwordHash, name, 'TECHNICIAN'),
    c.env.NEXUS_OPS.prepare('INSERT INTO technicians (id, user_id, specialization) VALUES (?, ?, ?)').bind(techId, userId, specialization || null),
  ]);

  return c.json({ id: techId, email, name, specialization }, 201);
});

technicians.patch('/:id/toggle-active', async (c) => {
  const tech = await c.env.NEXUS_OPS.prepare('SELECT user_id FROM technicians WHERE id = ?').bind(c.req.param('id')).first();
  if (!tech) return c.json({ error: 'Technician not found' }, 404);
  await c.env.NEXUS_OPS.prepare('UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = datetime("now") WHERE id = ?').bind(tech.user_id).run();
  return c.json({ message: 'Technician toggled' });
});

technicians.post('/:id/assign-website', async (c) => {
  const { websiteId } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.NEXUS_OPS.prepare('INSERT OR IGNORE INTO technician_website_assignments (id, technician_id, website_id) VALUES (?, ?, ?)').bind(id, c.req.param('id'), websiteId).run();
  return c.json({ message: 'Website assigned' }, 201);
});

technicians.delete('/:id/assign-website/:websiteId', async (c) => {
  await c.env.NEXUS_OPS.prepare('DELETE FROM technician_website_assignments WHERE technician_id = ? AND website_id = ?').bind(c.req.param('id'), c.req.param('websiteId')).run();
  return c.json({ message: 'Assignment removed' });
});

technicians.post('/:id/permissions', async (c) => {
  const { websiteId, permission } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.NEXUS_OPS.prepare('INSERT OR IGNORE INTO technician_permissions (id, technician_id, website_id, permission) VALUES (?, ?, ?, ?)').bind(id, c.req.param('id'), websiteId, permission).run();
  return c.json({ message: 'Permission added' }, 201);
});

technicians.delete('/:id/permissions/:websiteId/:permission', async (c) => {
  await c.env.NEXUS_OPS.prepare('DELETE FROM technician_permissions WHERE technician_id = ? AND website_id = ? AND permission = ?').bind(c.req.param('id'), c.req.param('websiteId'), c.req.param('permission')).run();
  return c.json({ message: 'Permission removed' });
});

technicians.get('/:id/permissions/:websiteId', async (c) => {
  const result = await c.env.NEXUS_OPS.prepare('SELECT permission FROM technician_permissions WHERE technician_id = ? AND website_id = ?').bind(c.req.param('id'), c.req.param('websiteId')).all();
  return c.json(result.results.map(r => r.permission));
});

export default technicians;
