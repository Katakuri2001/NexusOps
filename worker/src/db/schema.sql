-- NexusOps D1 Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CUSTOMER',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT,
  company TEXT,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS technicians (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS websites (
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

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  website_id TEXT UNIQUE NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  billing_cycle TEXT NOT NULL,
  features TEXT DEFAULT '[]',
  start_date TEXT NOT NULL,
  renewal_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hosting_services (
  id TEXT PRIMARY KEY,
  website_id TEXT UNIQUE NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  cost REAL NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  start_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS database_services (
  id TEXT PRIMARY KEY,
  website_id TEXT UNIQUE NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  monthly_cost REAL NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  start_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS server_services (
  id TEXT PRIMARY KEY,
  website_id TEXT UNIQUE NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational',
  plan TEXT,
  cost REAL NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  start_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS additional_charges (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  billing_type TEXT NOT NULL DEFAULT 'ONE_TIME',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  items TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  is_internal INTEGER NOT NULL DEFAULT 0,
  created_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS website_status_history (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  reason TEXT,
  description TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  website_id TEXT REFERENCES websites(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFORMATION',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS technician_website_assignments (
  id TEXT PRIMARY KEY,
  technician_id TEXT NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(technician_id, website_id)
);

CREATE TABLE IF NOT EXISTS technician_permissions (
  id TEXT PRIMARY KEY,
  technician_id TEXT NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(technician_id, website_id, permission)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  metadata TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS website_timeline (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Monitoring tables
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_technicians_user_id ON technicians(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_customer_id ON websites(customer_id);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites(domain);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_website_id ON notifications(website_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_website_id ON maintenance_records(website_id);
CREATE INDEX IF NOT EXISTS idx_additional_charges_website_id ON additional_charges(website_id);
CREATE INDEX IF NOT EXISTS idx_website_timeline_website_id ON website_timeline(website_id, created_at);
CREATE INDEX IF NOT EXISTS idx_technician_website_assignments_technician_id ON technician_website_assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_website_assignments_website_id ON technician_website_assignments(website_id);
CREATE INDEX IF NOT EXISTS idx_technician_permissions_technician_id ON technician_permissions(technician_id);
