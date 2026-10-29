-- NexusOps D1 Migration: monitoring engine + nullable customer_id
-- Applies to REMOTE D1 (nexusops). Data-preserving.
-- Run: wrangler d1 execute nexusops --remote --file=worker/src/db/migrate.sql

PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- 1. Recreate websites with nullable customer_id (preserves all rows)
CREATE TABLE websites_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  description TEXT,
  developer_name TEXT,
  status TEXT NOT NULL DEFAULT 'OPERATIONAL',
  website_type TEXT,
  launch_date TEXT,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO websites_new (id, name, domain, description, developer_name, status, website_type, launch_date, customer_id, created_at, updated_at)
SELECT id, name, domain, description, developer_name, status, website_type, launch_date, customer_id, created_at, updated_at
FROM websites;

DROP TABLE websites;

ALTER TABLE websites_new RENAME TO websites;

CREATE INDEX IF NOT EXISTS idx_websites_customer_id ON websites(customer_id);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites(domain);

-- 2. Monitoring tables (new)
CREATE TABLE IF NOT EXISTS monitors (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'PRODUCTION',
  enabled INTEGER NOT NULL DEFAULT 1,
  interval_seconds INTEGER NOT NULL DEFAULT 300,
  timeout_ms INTEGER NOT NULL DEFAULT 10000,
  expected_status_codes TEXT NOT NULL DEFAULT '[200]',
  expected_content TEXT,
  latency_warning_ms INTEGER,
  latency_critical_ms INTEGER,
  failure_threshold INTEGER NOT NULL DEFAULT 3,
  recovery_threshold INTEGER NOT NULL DEFAULT 2,
  ssl_enabled INTEGER NOT NULL DEFAULT 1,
  ssl_expiry_threshold_days INTEGER NOT NULL DEFAULT 30,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_monitors_website_id ON monitors(website_id);

CREATE TABLE IF NOT EXISTS monitor_checks (
  id TEXT PRIMARY KEY,
  monitor_id TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  success INTEGER NOT NULL,
  status_code INTEGER,
  latency_ms REAL,
  error_category TEXT,
  error_message TEXT,
  ssl_expiration_date TEXT,
  ssl_valid INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_monitor_checks_monitor_checked_at ON monitor_checks(monitor_id, checked_at);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  monitor_id TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'OPEN',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_failure_at TEXT,
  resolved_at TEXT,
  resolved_by TEXT,
  resolution_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_incidents_monitor_status ON incidents(monitor_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_website_status ON incidents(website_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_started_at ON incidents(started_at);

CREATE INDEX IF NOT EXISTS idx_incidents_open_unique ON incidents(monitor_id) WHERE status = 'OPEN';

CREATE TABLE IF NOT EXISTS incident_events (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id ON incident_events(incident_id, created_at);

COMMIT;

PRAGMA foreign_keys = ON;
