import { Env } from '../types';

export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface IncidentLike {
  id: string;
  monitorId: string;
  websiteId: string;
  title: string;
  severity: string;
  status: string;
  startedAt: string;
  lastFailureAt: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_SEVERITY = 'MEDIUM';

export async function openIncidentIfNeeded(
  db: D1Database,
  monitorId: string,
  websiteId: string,
  title: string,
  severity: string,
  lastFailureAt: string
): Promise<IncidentLike | null> {
  // One active incident per monitor: if one is open, update it rather than create a new one.
  const open = await db
    .prepare(`SELECT * FROM incidents WHERE monitor_id = ? AND status = 'OPEN' ORDER BY created_at DESC LIMIT 1`)
    .bind(monitorId)
    .first();

  if (open) {
    await db
      .prepare(`UPDATE incidents SET last_failure_at = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(lastFailureAt, open.id)
      .run();
    return open as unknown as IncidentLike;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO incidents (id, monitor_id, website_id, title, severity, status, started_at, last_failure_at, resolved_at, resolved_by, resolution_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?, NULL, NULL, NULL, ?, ?)`
    )
    .bind(id, monitorId, websiteId, title, severity, now, lastFailureAt, now, now)
    .run();

  const created = await db
    .prepare(`SELECT * FROM incidents WHERE id = ?`)
    .bind(id)
    .first();

  return created as unknown as IncidentLike;
}

export async function acknowledgeIncident(
  db: D1Database,
  incidentId: string,
  actor: string,
  notes: string | null
): Promise<IncidentLike | null> {
  const incident = await db.prepare(`SELECT * FROM incidents WHERE id = ?`).bind(incidentId).first();
  if (!incident) return null;

  await db
    .prepare(`UPDATE incidents SET status = 'ACKNOWLEDGED', updated_at = datetime('now') WHERE id = ?`)
    .bind(incidentId)
    .run();

  await addIncidentEvent(db, incidentId, 'ACKNOWLEDGED', actor, notes);

  return incident as unknown as IncidentLike;
}

export async function resolveIncident(
  db: D1Database,
  incidentId: string,
  actor: string | null,
  resolutionNotes: string | null
): Promise<IncidentLike | null> {
  const incident = await db.prepare(`SELECT * FROM incidents WHERE id = ?`).bind(incidentId).first();
  if (!incident) return null;

  await db
    .prepare(
      `UPDATE incidents SET status = 'RESOLVED', resolved_at = ?, resolved_by = ?, resolution_notes = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .bind(new Date().toISOString(), actor, resolutionNotes, incidentId)
    .run();

  await addIncidentEvent(db, incidentId, 'RESOLVED', actor, resolutionNotes);

  return (await db.prepare(`SELECT * FROM incidents WHERE id = ?`).bind(incidentId).first()) as unknown as IncidentLike;
}

export async function addIncidentEvent(
  db: D1Database,
  incidentId: string,
  eventType: string,
  actor: string | null,
  notes: string | null
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO incident_events (id, incident_id, event_type, actor, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(crypto.randomUUID(), incidentId, eventType, actor, notes, new Date().toISOString())
    .run();
}
