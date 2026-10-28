# Design Spec — Website Monitoring Engine & Incident Management

- **Date:** 2026-10-28
- **Status:** Draft for review
- **Topic:** Automated website monitoring, incident handling, alerting for NexusOps

## 1. Context

NexusOps is a Website Operations & Client Portal (SaaS) with three roles:
`OWNER`, `CUSTOMER`, `TECHNICIAN`.

### 1.1 Existing state (verified in Phase 0 audit)

- **Backend (Express + Prisma + PostgreSQL)** on Railway — primary API used in local dev.
- **Backend (Hono + D1 / SQLite)** Cloudflare Worker — existing, previously added; `worker/` directory with Hono routes, jose JWT, D1 binding `NEXUS_OPS`.
- **Frontend (Next.js)** on Cloudflare Pages via OpenNext (`@opennextjs/cloudflare`) — deployed to Cloudflare.
- **Database:** dual — PostgreSQL (Express backend) and D1 SQLite (Worker backend).
- **Auth:** JWT access (15m) + refresh (7d); bcrypt (Express) / PBKDF2 via Web Crypto (Worker).
- **Website capability shipped this session:** websites can be created without a customer (`customerId` optional → status defaults `DEVELOPMENT`), and a customer can be assigned later via update.

### 1.2 Verified gaps relevant to this design

- **No automated monitoring whatsoever** — status is manual only.
- **No incident model** — no open/acknowledge/resolve lifecycle.
- **No check scheduler** — no cron/scheduled execution exists in either backend.
- **No SSL/performance monitoring**.
- **No external notification delivery** — in-app only.
- Worker-specific gaps: `websites.customer_id NOT NULL` (owner-less websites not yet supported in Worker), `PUT /:id` cannot assign customer, `PATCH /:id/status` lacks authorization checks, no rate limiting, no cron handler.

## 2. Goals

1. Automated HTTP/HTTPS monitoring for websites (including owner-less `DEVELOPMENT` websites).
2. Real incident lifecycle: open / acknowledge / resolve / reopen, with deduplication.
3. Reliable alerting (in-app notification + activity log now; email later).
4. Dashboard support: fleet overview, attention queue, health history, incidents.
5. Security: SSRF protection as a release blocker.

## 3. Non-Goals (for this design phase)

- Email/SMS delivery (deferred to Priority 2 notifications phase).
- Real-time WebSocket updates (deferred).
- DNS/geo/multi-region monitoring (deferred, Phase 3+).
- Migrating the Express/Prisma backend fully to Cloudflare (transition concern, out of scope here).

## 4. Architecture Decision (user-approved)

- **Backend runtime:** Cloudflare Worker using **Hono** — `worker/` already contains Hono routes + `jose` JWT + D1 binding.
- **Database:** Cloudflare **D1** (SQLite — a SQL database) accessed via D1 binding `NEXUS_OPS`. Raw SQL via `env.NEXUS_OPS.prepare(...).bind(...)` with `camelCaseKeys` transform (existing pattern).
- **Frontend:** Cloudflare Pages (Workers via OpenNext) — unchanged.
- **Scheduler:** Cloudflare Workers **`scheduled` cron trigger** (`wrangler.toml` cron) + internal "run now" endpoint for manual checks.
- **Auth:** Hono middleware + `jose` HS256 JWT (access/refresh with `type` claim), PBKDF2 password hashing via Web Crypto.

Rationale: the frontend and Worker backend are already Cloudflare-native; moving the monitoring engine to the Worker (with D1 + cron) is the most coherent path and aligns with the approved direction ("Cloudflare for this project").

## 5. Monitoring Domain Design

### 5.1 Observed health states

`UP`, `DOWN`, `DEGRADED`, `PAUSED`, `UNKNOWN` — computed from recent check results.

- `UP`: recent checks satisfy configured success criteria.
- `DOWN`: failure threshold reached (consecutive failures).
- `DEGRADED`: reachable but violating latency and/or content expectations.
- `PAUSED`: monitoring intentionally disabled.
- `UNKNOWN`: insufficient/stale results.

`Website.status` (business lifecycle: `OPERATIONAL` … `DEVELOPMENT`) remains **separate** from observed health; automated checks must not blindly overwrite business status.

### 5.2 Monitor configuration

- Fields: monitor name, target URL, associated website, environment (`PRODUCTION`/`STAGING`/`DEVELOPMENT`), enabled/paused, interval seconds (bounded), timeout ms, expected status codes, optional content marker, latency warning/critical thresholds, SSL expiry threshold, failure threshold, recovery threshold.

### 5.3 Check execution & results

- Scheduled/manual check: outbound HTTP(S) GET with SSRF protections, timeout, status/latency capture.
- Persist `MonitorCheck` rows (timestamp, success, status code, latency, error category, SSL info).
- Compute health; write status history; trigger incidents/alerts.

### 5.4 Incident lifecycle

- Open on failure threshold; severity assigned; start time; last failure; safe diagnostic summary; link monitor+website; alert event.
- One active incident per monitor (dedupe; update existing rather than duplicate).
- Resolve on recovery (idempotent); reopen as new incident after later failure.
- Events: open, acknowledge, resolve, reopen, notes.

### 5.5 Notifications & activity

- Create in-app `Notification` records (alert types: down / recovered / SSL expiring / degraded) + `ActivityLog` entries.
- Owner visibility; customer isolation preserved.

## 6. Security — SSRF (release blocker)

- Only `http`/`https` schemes; reject malformed URLs; no embedded credentials; restrict ports; block localhost/loopback/private/link-local/multicast/reserved; DNS resolve + validate; revalidate redirect destinations; block metadata endpoints; bounded redirects/timeouts/body size; sanitize errors; rate-limit monitor creation/manual checks; per-account limits.

## 7. Scheduling & reliability

- Workers `scheduled` handler; due-monitor selection; overlap lock; bounded concurrency; explicit timeouts; retries with backoff+jitter; temporary failure handling; scheduler failure logging; overdue check detection; SIGTERM-safe shutdown; internal run-now endpoint (auth-gated, rate-limited separately).

## 8. Phases (incremental delivery)

1. **Monitoring core** — Monitor CRUD, check execution, health computation, persistence.
2. **Incidents** — thresholds, lifecycle, dedupe, recovery, timeline.
3. **Notifications wiring** — in-app + activity alerts from incidents/checks (email deferred).
4. **Dashboard** — fleet overview, attention queue, website detail (monitoring sections).
5. **Operational hardening** — retention, cleanup jobs, observability, tests/CI.

## 9. Open questions / risks

- D1 (SQLite) limitations for high-volume check writes/queries (retention/cleanup strategy).
- Worker CPU/time limits for concurrent checks — bounded concurrency.
- Migration of existing Express/Prisma data semantics to D1 (SQL dialect differences).

## 10. Verification

- Phase 0: typecheck/build/lint baselines documented; runtime checks where possible.
- Phase N: unit/integration tests per Definition of Done; live scheduler verification.
