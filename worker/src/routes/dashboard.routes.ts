import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';

const dashboard = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

dashboard.use('/*', authenticate());
dashboard.use('/*', authorize('OWNER'));

dashboard.get('/', async (c) => {
  const totalWebsites = await c.env.DB.prepare('SELECT COUNT(*) as count FROM websites').first();
  const totalCustomers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM customers').first();
  const operationalWebsites = await c.env.DB.prepare("SELECT COUNT(*) as count FROM websites WHERE status = 'OPERATIONAL'").first();
  const maintenanceWebsites = await c.env.DB.prepare("SELECT COUNT(*) as count FROM websites WHERE status = 'MAINTENANCE'").first();
  const attentionWebsites = await c.env.DB.prepare("SELECT COUNT(*) as count FROM websites WHERE status = 'ATTENTION_REQUIRED'").first();

  const recentActivity = await c.env.DB.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10').all();
  const upcomingDueDates = await c.env.DB.prepare(`
    SELECT hs.due_date, w.name as website_name, hs.provider, 'hosting' as type
    FROM hosting_services hs JOIN websites w ON hs.website_id = w.id
    WHERE hs.due_date <= date('now', '+30 days')
    UNION ALL
    SELECT ds.due_date, w.name as website_name, ds.provider, 'database' as type
    FROM database_services ds JOIN websites w ON ds.website_id = w.id
    WHERE ds.due_date <= date('now', '+30 days')
  `).all();

  return c.json({
    stats: {
      totalWebsites: totalWebsites?.count || 0,
      totalCustomers: totalCustomers?.count || 0,
      operationalWebsites: operationalWebsites?.count || 0,
      maintenanceWebsites: maintenanceWebsites?.count || 0,
      attentionWebsites: attentionWebsites?.count || 0,
    },
    recentActivity: recentActivity.results,
    upcomingDueDates: upcomingDueDates.results,
  });
});

export default dashboard;
