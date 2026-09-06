import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { camelCaseKeys } from '../db/transform';

const dashboard = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

dashboard.use('/*', authenticate());
dashboard.use('/*', authorize('OWNER'));

dashboard.get('/', async (c) => {
  const totalWebsites = await c.env.NEXUS_OPS.prepare('SELECT COUNT(*) as count FROM websites').first();
  const totalCustomers = await c.env.NEXUS_OPS.prepare('SELECT COUNT(*) as count FROM customers').first();
  const activeCustomers = await c.env.NEXUS_OPS.prepare("SELECT COUNT(*) as count FROM customers c JOIN users u ON c.user_id = u.id WHERE u.is_active = 1").first();
  const operationalWebsites = await c.env.NEXUS_OPS.prepare("SELECT COUNT(*) as count FROM websites WHERE status = 'OPERATIONAL'").first();
  const maintenanceWebsites = await c.env.NEXUS_OPS.prepare("SELECT COUNT(*) as count FROM websites WHERE status = 'MAINTENANCE'").first();
  const attentionWebsites = await c.env.NEXUS_OPS.prepare("SELECT COUNT(*) as count FROM websites WHERE status = 'ATTENTION_REQUIRED'").first();

  const recentActivity = await c.env.NEXUS_OPS.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10').all();
  const upcomingDueDates = await c.env.NEXUS_OPS.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT hs.due_date FROM hosting_services hs WHERE hs.due_date <= date('now', '+30 days')
      UNION ALL
      SELECT ds.due_date FROM database_services ds WHERE ds.due_date <= date('now', '+30 days')
      UNION ALL
      SELECT srv.due_date FROM server_services srv WHERE srv.due_date <= date('now', '+30 days')
    )
  `).first();

  return c.json({
    stats: {
      totalWebsites: totalWebsites?.count || 0,
      activeCustomers: activeCustomers?.count || 0,
      totalCustomers: totalCustomers?.count || 0,
      operationalWebsites: operationalWebsites?.count || 0,
      maintenanceWebsites: maintenanceWebsites?.count || 0,
      attentionWebsites: attentionWebsites?.count || 0,
      upcomingDueDates: upcomingDueDates?.count || 0,
    },
    recentActivity: camelCaseKeys(recentActivity.results),
  });
});

export default dashboard;
