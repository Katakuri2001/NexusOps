import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { camelCaseKeys } from '../db/transform';

const billing = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

billing.use('/*', authenticate());
billing.use('/*', authorize('OWNER'));

billing.get('/due-dates', async (c) => {
  const result = await c.env.NEXUS_OPS.prepare(`
    SELECT w.name as website_name, w.id as website_id,
           hs.due_date as hosting_due, hs.provider as hosting_provider, hs.cost as hosting_cost,
           ds.due_date as database_due, ds.provider as database_provider, ds.monthly_cost as database_cost,
           srv.due_date as server_due, srv.provider as server_provider, srv.cost as server_cost
    FROM websites w
    LEFT JOIN hosting_services hs ON w.id = hs.website_id
    LEFT JOIN database_services ds ON w.id = ds.website_id
    LEFT JOIN server_services srv ON w.id = srv.website_id
    ORDER BY w.name
  `).all();
  return c.json(camelCaseKeys(result.results));
});

export default billing;
