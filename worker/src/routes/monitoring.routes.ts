import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { camelCaseKeys } from '../db/transform';
import { runCheck, getRecentChecks, computeHealth, MonitorLike } from '../services/monitoring.service';
import { openIncidentIfNeeded, resolveIncident } from '../services/incident.service';

const monitoring = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

monitoring.use('/*', authenticate());

interface MonitorRow {
  id: string;
  website_id: string;
  name: string;
  url: string;
  environment: string | null;
  enabled: number | null;
  interval_seconds: number | null;
  timeout_ms: number | null;
  expected_status_codes: string | null;
  expected_content: string | null;
  latency_warning_ms: number | null;
  latency_critical_ms: number | null;
  failure_threshold: number | null;
  recovery_threshold: number | null;
  ssl_enabled: number | null;
  ssl_expiry_threshold_days: number | null;
}

monitoring.get('/monitors', authorize('OWNER'), async (c) => {
  const result = await c.env.NEXUS_OPS.prepare(`SELECT * FROM monitors ORDER BY created_at DESC`).all();
  return c.json(camelCaseKeys(result.results));
});

monitoring.post('/monitors', authorize('OWNER'), async (c) => {
  const body = await c.req.json<Record<string, any>>();
  const { websiteId, name, url, environment, enabled, intervalSeconds, timeoutMs, expectedStatusCodes, expectedContent, latencyWarningMs, latencyCriticalMs, failureThreshold, recoveryThreshold, sslEnabled, sslExpiryThresholdDays } = body;

  if (!websiteId || !name || !url) {
    return c.json({ error: 'websiteId, name, and url are required' }, 400);
  }

  const id = crypto.randomUUID();
  await c.env.NEXUS_OPS.prepare(
    `INSERT INTO monitors (id, website_id, name, url, environment, enabled, interval_seconds, timeout_ms, expected_status_codes, expected_content, latency_warning_ms, latency_critical_ms, failure_threshold, recovery_threshold, ssl_enabled, ssl_expiry_threshold_days, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    websiteId,
    name,
    url,
    environment || 'PRODUCTION',
    enabled === undefined ? 1 : enabled ? 1 : 0,
    intervalSeconds || 300,
    timeoutMs || 10000,
    expectedStatusCodes || '[200]',
    expectedContent || null,
    latencyWarningMs ?? null,
    latencyCriticalMs ?? null,
    failureThreshold || 3,
    recoveryThreshold || 2,
    sslEnabled === undefined ? 1 : sslEnabled ? 1 : 0,
    sslExpiryThresholdDays || 30,
    new Date().toISOString(),
    new Date().toISOString()
  ).run();

  const monitor = await c.env.NEXUS_OPS.prepare(`SELECT * FROM monitors WHERE id = ?`).bind(id).first();
  return c.json(camelCaseKeys({ ...monitor, website: await c.env.NEXUS_OPS.prepare(`SELECT * FROM websites WHERE id = ?`).bind(websiteId).first() }), 201);
});

monitoring.get('/monitors/:id/checks', authorize('OWNER'), async (c) => {
  const monitor = (await c.env.NEXUS_OPS.prepare(`SELECT * FROM monitors WHERE id = ?`).bind(c.req.param('id')).first()) as MonitorRow | null;
  if (!monitor) return c.json({ error: 'Monitor not found' }, 404);
  const checks = await getRecentChecks(c.env.NEXUS_OPS, c.req.param('id') as string);
  const latest = checks[0];
  const health = computeHealth(
    {
      id: monitor.id,
      websiteId: monitor.website_id,
      name: monitor.name,
      url: monitor.url,
      environment: monitor.environment || 'PRODUCTION',
      enabled: !!monitor.enabled,
      intervalSeconds: Number(monitor.interval_seconds || 300),
      timeoutMs: Number(monitor.timeout_ms || 10000),
      expectedStatusCodes: monitor.expected_status_codes || '[200]',
      expectedContent: monitor.expected_content ?? null,
      latencyWarningMs: monitor.latency_warning_ms != null ? Number(monitor.latency_warning_ms) : null,
      latencyCriticalMs: monitor.latency_critical_ms != null ? Number(monitor.latency_critical_ms) : null,
      failureThreshold: Number(monitor.failure_threshold || 3),
      recoveryThreshold: Number(monitor.recovery_threshold || 2),
      sslEnabled: !!monitor.ssl_enabled,
      sslExpiryThresholdDays: Number(monitor.ssl_expiry_threshold_days || 30),
    },
    checks
  );
  return c.json({ checks, health, latest });
});

monitoring.post('/monitors/:id/checks', authorize('OWNER'), async (c) => {
  const monitor = (await c.env.NEXUS_OPS.prepare(`SELECT * FROM monitors WHERE id = ?`).bind(c.req.param('id')).first()) as MonitorRow | null;
  if (!monitor) return c.json({ error: 'Monitor not found' }, 404);

  const monitorLike: MonitorLike = {
    id: monitor.id,
    websiteId: monitor.website_id,
    name: monitor.name,
    url: monitor.url,
    environment: monitor.environment || 'PRODUCTION',
    enabled: !!monitor.enabled,
    intervalSeconds: Number(monitor.interval_seconds || 300),
    timeoutMs: Number(monitor.timeout_ms || 10000),
    expectedStatusCodes: monitor.expected_status_codes || '[200]',
    expectedContent: monitor.expected_content ?? null,
    latencyWarningMs: monitor.latency_warning_ms != null ? Number(monitor.latency_warning_ms) : null,
    latencyCriticalMs: monitor.latency_critical_ms != null ? Number(monitor.latency_critical_ms) : null,
    failureThreshold: Number(monitor.failure_threshold || 3),
    recoveryThreshold: Number(monitor.recovery_threshold || 2),
    sslEnabled: !!monitor.ssl_enabled,
    sslExpiryThresholdDays: Number(monitor.ssl_expiry_threshold_days || 30),
  };

  const result = await runCheck(c.env.NEXUS_OPS, monitorLike);

  if (!result.success) {
    await openIncidentIfNeeded(
      c.env.NEXUS_OPS,
      monitor.id,
      monitor.website_id,
      `Website down: ${monitor.name}`,
      'MEDIUM',
      result.checkedAt
    );
  }

  return c.json(result, result.success ? 200 : 207);
});

monitoring.get('/monitors/:id/incidents', authorize('OWNER'), async (c) => {
  const incidents = await c.env.NEXUS_OPS.prepare(`SELECT * FROM incidents WHERE monitor_id = ? ORDER BY created_at DESC`).bind(c.req.param('id')).all();
  return c.json(camelCaseKeys(incidents.results));
});

export default monitoring;
