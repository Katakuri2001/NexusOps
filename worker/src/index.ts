import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';

import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import technicianRoutes from './routes/technician.routes';
import websiteRoutes from './routes/website.routes';
import notificationRoutes from './routes/notification.routes';
import activityRoutes from './routes/activity.routes';
import dashboardRoutes from './routes/dashboard.routes';
import chargeRoutes from './routes/charge.routes';
import billingRoutes from './routes/billing.routes';
import monitoringRoutes from './routes/monitoring.routes';
import { runCheck, getRecentChecks, MonitorLike } from './services/monitoring.service';
import { openIncidentIfNeeded, resolveIncident } from './services/incident.service';

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('*', cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/technicians', technicianRoutes);
app.route('/api/websites', websiteRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/admin/activity', activityRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/billing', chargeRoutes);
app.route('/api/billing', billingRoutes);
app.route('/api/monitoring', monitoringRoutes);

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const runningChecks = new Set<string>();

async function runDueChecks(env: Env): Promise<void> {
  const monitors = await env.NEXUS_OPS.prepare(`SELECT * FROM monitors WHERE enabled = 1`).all();
  const rows = (monitors.results || []) as any[];
  const now = Date.now();

  for (const m of rows) {
    const checks = await getRecentChecks(env.NEXUS_OPS, m.id, 1);
    const lastCheck = checks[0];
    const due = !lastCheck || now - new Date(lastCheck.checkedAt).getTime() > Number(m.interval_seconds) * 1000;
    if (!due) continue;
    if (runningChecks.has(m.id)) continue;
    runningChecks.add(m.id);
    try {
      const monitorLike: MonitorLike = {
        id: m.id,
        websiteId: m.website_id,
        name: m.name,
        url: m.url,
        environment: m.environment || 'PRODUCTION',
        enabled: !!m.enabled,
        intervalSeconds: Number(m.interval_seconds || 300),
        timeoutMs: Number(m.timeout_ms || 10000),
        expectedStatusCodes: m.expected_status_codes || '[200]',
        expectedContent: m.expected_content ?? null,
        latencyWarningMs: m.latency_warning_ms != null ? Number(m.latency_warning_ms) : null,
        latencyCriticalMs: m.latency_critical_ms != null ? Number(m.latency_critical_ms) : null,
        failureThreshold: Number(m.failure_threshold || 3),
        recoveryThreshold: Number(m.recovery_threshold || 2),
        sslEnabled: !!m.ssl_enabled,
        sslExpiryThresholdDays: Number(m.ssl_expiry_threshold_days || 30),
      };
      const result = await runCheck(env.NEXUS_OPS, monitorLike);
      if (!result.success) {
        await openIncidentIfNeeded(env.NEXUS_OPS, m.id, m.website_id, `Website down: ${m.name}`, 'MEDIUM', result.checkedAt);
      } else {
        const open = (await env.NEXUS_OPS.prepare(`SELECT id FROM incidents WHERE monitor_id = ? AND status = 'OPEN'`).bind(m.id).first()) as { id: string } | null;
        if (open) {
          await resolveIncident(env.NEXUS_OPS, open.id, null, 'Recovered');
        }
      }
    } finally {
      runningChecks.delete(m.id);
    }
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: any) {
    return app.fetch(request, env, ctx);
  },
  async scheduled(event: any, env: Env, ctx: any) {
    await runDueChecks(env);
  },
};
