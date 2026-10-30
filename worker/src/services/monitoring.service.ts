import { Env } from '../types';
import { openIncidentIfNeeded, resolveIncident } from './incident.service';
import { sendNotificationAlert } from './email.service';

export type HealthState = 'UP' | 'DOWN' | 'DEGRADED' | 'PAUSED' | 'UNKNOWN';

export interface MonitorLike {
  id: string;
  websiteId: string;
  name: string;
  url: string;
  environment: string;
  enabled: boolean;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatusCodes: string;
  expectedContent?: string | null;
  latencyWarningMs?: number | null;
  latencyCriticalMs?: number | null;
  failureThreshold: number;
  recoveryThreshold: number;
  sslEnabled: boolean;
  sslExpiryThresholdDays: number;
}

export interface CheckResult {
  monitorId: string;
  websiteId: string;
  checkedAt: string;
  success: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  errorCategory: string | null;
  errorMessage: string | null;
  sslExpirationDate: string | null;
  sslValid: boolean;
}

const DEFAULT_TIMEOUT_MS = 10000;

function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost') || h.includes('metadata')) return true;

  if (h.includes(':')) {
    // IPv6 literal — block loopback / link-local / IPv4-mapped private ranges
    const clean = h.replace(/\[|\]/g, '');
    if (clean === '::1' || clean.startsWith('::ffff:127.') || clean.startsWith('fe80:')) return true;
  }

  const bare = h.split(':')[0];
  const parts = bare.split('.');
  if (parts.length === 4) {
    const a = parseInt(parts[0], 10);
    const b = parseInt(parts[1], 10);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }

  return false;
}

function parseExpectedStatuses(raw: string | undefined): number[] {
  if (!raw) return [200];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const codes = parsed.map((c) => Number(c)).filter((c) => Number.isFinite(c));
      if (codes.length > 0) return codes;
    }
  } catch {
    // fall through to default
  }
  const single = parseInt(raw, 10);
  return Number.isFinite(single) ? [single] : [200];
}

export async function runCheck(db: D1Database, monitor: MonitorLike): Promise<CheckResult> {
  const checkedAt = new Date().toISOString();
  const base: CheckResult = {
    monitorId: monitor.id,
    websiteId: monitor.websiteId,
    checkedAt,
    success: false,
    statusCode: null,
    latencyMs: null,
    errorCategory: null,
    errorMessage: null,
    sslExpirationDate: null,
    sslValid: true,
  };

  let url: URL;
  try {
    url = new URL(monitor.url);
  } catch {
    return { ...base, errorCategory: 'INVALID_URL', errorMessage: 'Malformed URL' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ...base, errorCategory: 'INVALID_SCHEME', errorMessage: `Unsupported scheme: ${url.protocol}` };
  }
  if (isPrivateHostname(url.hostname)) {
    return { ...base, errorCategory: 'BLOCKED', errorMessage: `Blocked host: ${url.hostname}` };
  }

  const expected = parseExpectedStatuses(monitor.expectedStatusCodes);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), monitor.timeoutMs || DEFAULT_TIMEOUT_MS);
  const start = performance.now();
  let statusCode: number | null = null;
  let success = false;
  let latencyMs: number | null = null;
  let errorCategory: string | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(url.toString(), { signal: controller.signal, method: 'GET', redirect: 'follow' });
    statusCode = response.status;
    success = expected.includes(response.status);
    clearTimeout(timer);
    latencyMs = Math.round(performance.now() - start);
    errorCategory = success ? null : 'HTTP_ERROR';
    errorMessage = success ? null : `Unexpected status ${response.status}`;
  } catch (err: any) {
    clearTimeout(timer);
    errorCategory = err?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR';
    errorMessage = err?.name === 'AbortError' ? `Timeout after ${monitor.timeoutMs}ms` : (err?.message || 'Network error');
  }

  const result: CheckResult = {
    ...base,
    success,
    statusCode,
    latencyMs,
    errorCategory,
    errorMessage,
  };

  await db
    .prepare(
      `INSERT INTO monitor_checks (id, monitor_id, website_id, checked_at, success, status_code, latency_ms, error_category, error_message, ssl_expiration_date, ssl_valid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      monitor.id,
      monitor.websiteId,
      checkedAt,
      result.success ? 1 : 0,
      result.statusCode,
      result.latencyMs,
      result.errorCategory,
      result.errorMessage,
      result.sslExpirationDate,
      result.sslValid ? 1 : 0
    )
    .run();

  return result;
}

export async function getRecentChecks(db: D1Database, monitorId: string, limit = 20): Promise<CheckResult[]> {
  const result = await db
    .prepare(`SELECT * FROM monitor_checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT ?`)
    .bind(monitorId, limit)
    .all();
  const rows = (result.results || []) as any[];
  return rows.map((r) => ({
    monitorId: r.monitor_id,
    websiteId: r.website_id,
    checkedAt: r.checked_at,
    success: !!r.success,
    statusCode: r.status_code ?? null,
    latencyMs: r.latency_ms != null ? Number(r.latency_ms) : null,
    errorCategory: r.error_category ?? null,
    errorMessage: r.error_message ?? null,
    sslExpirationDate: r.ssl_expiration_date ?? null,
    sslValid: r.ssl_valid !== 0,
  }));
}

export function computeHealth(monitor: MonitorLike, checks: CheckResult[], now: Date = new Date()): HealthState {
  if (!monitor.enabled) return 'PAUSED';
  const sorted = [...checks].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt));
  const latest = sorted[sorted.length - 1];
  if (!latest) return 'UNKNOWN';
  if (!latest.success) return 'DOWN';
  if (monitor.latencyCriticalMs != null && latest.latencyMs != null && latest.latencyMs > monitor.latencyCriticalMs) {
    return 'DEGRADED';
  }
  return 'UP';
}

export async function handleCheckOutcome(env: any, db: D1Database, monitor: MonitorLike, result: CheckResult): Promise<void> {
  const writeActivity = async (action: string, entityId: string, metadata: Record<string, unknown>) => {
    await db
      .prepare(`INSERT INTO activity_logs (id, user_id, action, entity, entity_id, metadata, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), null, action, 'Incident', entityId, JSON.stringify(metadata), null, new Date().toISOString())
      .run();
  };

  const writeNotification = async (type: string, title: string, message: string) => {
    const website = await db.prepare(`SELECT customer_id FROM websites WHERE id = ?`).bind(monitor.websiteId).first();
    const customerId = (website as any)?.customer_id ?? null;
    if (!customerId) return;
    await db
      .prepare(
        `INSERT INTO notifications (id, website_id, customer_id, title, message, type, priority, is_read, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
      )
      .bind(crypto.randomUUID(), monitor.websiteId, customerId, title, message, type, 'IMPORTANT', new Date().toISOString(), new Date().toISOString())
      .run();
  };

  if (!result.success) {
    const recent = await getRecentChecks(db, monitor.id, monitor.failureThreshold);
    let consecutiveFailures = 0;
    for (const c of recent) {
      if (!c.success) consecutiveFailures++;
      else break;
    }
    if (consecutiveFailures < monitor.failureThreshold) {
      // Below the configured failure threshold — no incident yet.
      return;
    }
    const incident = await openIncidentIfNeeded(db, monitor.id, monitor.websiteId, `Website down: ${monitor.name}`, 'MEDIUM', result.checkedAt);
    if (incident) {
      await writeNotification('WARNING', `Website down: ${monitor.name}`, `Automated monitoring detected a failed check for ${monitor.name} (${monitor.url}).`);
      await writeActivity('MONITOR_ALERT', incident.id, { monitorId: monitor.id, websiteId: monitor.websiteId, incidentId: incident.id, outcome: 'failed' });

      // Email alert to owner and assigned technicians (best-effort)
      try {
        const alert = { title: `Website down: ${monitor.name}`, message: `Automated monitoring detected a failed check for ${monitor.name} (${monitor.url}).`, type: 'WARNING', priority: 'IMPORTANT' };
        const owners = await db.prepare("SELECT email, name FROM users WHERE role = 'OWNER' AND is_active = 1").all();
        for (const o of owners.results || []) {
          await sendNotificationAlert(env, o.email as string, o.name as string, alert, monitor.name);
        }
        const techs = await db.prepare(`
          SELECT u.email, u.name FROM technician_website_assignments twa
          JOIN technicians t ON twa.technician_id = t.id
          JOIN users u ON t.user_id = u.id
          WHERE twa.website_id = ? AND u.is_active = 1
        `).bind(monitor.websiteId).all();
        for (const t of techs.results || []) {
          await sendNotificationAlert(env, t.email as string, t.name as string, alert, monitor.name);
        }
      } catch (err: any) {
        console.error('[monitoring] alert email failed:', err?.message || err);
      }
    }
    return;
  }

  const open = (await db.prepare(`SELECT id FROM incidents WHERE monitor_id = ? AND status = 'OPEN'`).bind(monitor.id).first()) as { id: string } | null;
  if (open) {
    const resolved = await resolveIncident(db, open.id, null, 'Recovered');
    if (resolved) {
      await writeNotification('INFORMATION', `Website recovered: ${monitor.name}`, `Automated monitoring detected recovery for ${monitor.name} (${monitor.url}).`);
      await writeActivity('MONITOR_RESOLVED', open.id, { monitorId: monitor.id, websiteId: monitor.websiteId, incidentId: open.id, outcome: 'recovered' });

      // Recovery email to owner and assigned technicians (best-effort)
      try {
        const alert = { title: `Website recovered: ${monitor.name}`, message: `Automated monitoring detected recovery for ${monitor.name} (${monitor.url}).`, type: 'INFORMATION', priority: 'NORMAL' };
        const owners = await db.prepare("SELECT email, name FROM users WHERE role = 'OWNER' AND is_active = 1").all();
        for (const o of owners.results || []) {
          await sendNotificationAlert(env, o.email as string, o.name as string, alert, monitor.name);
        }
        const techs = await db.prepare(`
          SELECT u.email, u.name FROM technician_website_assignments twa
          JOIN technicians t ON twa.technician_id = t.id
          JOIN users u ON t.user_id = u.id
          WHERE twa.website_id = ? AND u.is_active = 1
        `).bind(monitor.websiteId).all();
        for (const t of techs.results || []) {
          await sendNotificationAlert(env, t.email as string, t.name as string, alert, monitor.name);
        }
      } catch (err: any) {
        console.error('[monitoring] recovery email failed:', err?.message || err);
      }
    }
  }
}
