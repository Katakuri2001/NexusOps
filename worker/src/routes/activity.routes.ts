import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';

const activity = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

activity.use('/*', authenticate());
activity.use('/*', authorize('OWNER'));

activity.get('/', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100').all();
  return c.json(result.results);
});

activity.get('/:entity/:entityId', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM activity_logs WHERE entity = ? AND entity_id = ? ORDER BY created_at DESC').bind(c.req.param('entity'), c.req.param('entityId')).all();
  return c.json(result.results);
});

export default activity;
