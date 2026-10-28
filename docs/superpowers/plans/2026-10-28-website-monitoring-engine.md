# Website Monitoring Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the automated website monitoring engine and incident handling capability for NexusOps on the approved Cloudflare-first architecture, unblocking the dashboard-upgrade phases.

**Architecture:** Cloudflare-first — Hono Worker (`worker/`) + D1 (`NEXUS_OPS` D1 database) + Workers `scheduled` cron for checks; Next.js frontend on Cloudflare Pages. Observed health states are computed from persisted check results and kept separate from the business `Website.status` lifecycle.

**Tech Stack:** TypeScript on Cloudflare Workers runtime (`@cloudflare/workers-types`), Hono, `jose`, D1 (`D1Database`), Workers cron; frontend Next.js 16 / React 19 / Tailwind / existing UI kit.

**Spec:** `docs/superpowers/specs/2026-10-28-website-monitoring-engine-design.md`

## Global Constraints

- Business `Website.status` must not be auto-overwritten after a single failed check (health is computed; incidents drive alerts).
- SSRF protections are a release blocker (scheme allowlist, no embedded credentials, port restriction, private/loopback/metadata blocking, DNS validation, redirect revalidation, bounded timeouts/body size).
- Owner-less websites (`customerId` nullable) must remain supported in Worker/D1.
- Follow existing Worker patterns: Hono sub-routers, `authenticate()`/`authorize()` middleware, `camelCaseKeys`, D1 `prepare`/`bind`, Web Crypto PBKDF2 password hashing.
- Use D1 SQL dialect (SQLite) and respect Workers runtime limits.

## Review Focus

1. Owner-less website alert routing — behavior when no customer is assigned yet.
2. D1 vs. PostgreSQL semantics — datetime/timestamp handling differences.
3. Overlapping scheduled checks — concurrency lock correctness in Workers.
4. Redirect policy in outbound check `fetch`.
5. Customer isolation for monitor/incident visibility.

---

## Tasks

### Task 1: D1 schema + owner-less parity + auth surface

**Files:**
- Modify: `worker/src/db/schema.sql`
- Modify: `worker/src/types/index.ts`
- Modify: `worker/src/routes/website.routes.ts`

**Interfaces:**
- Consumes: design spec §5.1–§5.2; owner-less website feature shipped for Express backend this session.
- Produces: D1 tables `monitors`, `monitor_checks`, `incidents`, `incident_events`; nullable `websites.customer_id`; website create/update accepting optional `customerId`.

- [ ] **Step 1: Update D1 schema** — add monitoring tables (monitors, monitor_checks, incidents, incident_events) with indexes; make `websites.customer_id` nullable (remove NOT NULL / add FK semantics via nullable).

- [ ] **Step 2: Update Worker website routes** — `POST /api/websites` accepts optional `customerId` (status defaults sensibly); `PUT /api/websites/:id` supports `customerId` assignment.

- [ ] **Step 3: Verify** — run worker TypeScript check (`npx tsc -p worker/tsconfig.json`) and `wrangler deploy --dry-run` if feasible.

- [ ] **Step 4: Commit**

### Task 2: Monitor check execution service

**Files:**
- Create: `worker/src/services/monitoring.service.ts`

**Interfaces:**
- Consumes: `Env` from `worker/src/types`, D1 access pattern.
- Produces: `runCheck(monitor) -> check result`, health state computation from recent checks.

- [ ] **Step 1: Implement SSRF-safe check execution** — scheme allowlist, URL validation, timeout, status/latency capture, error categorization, no response body storage.

- [ ] **Step 2: Compute health** from recent `monitor_checks` (UP/DOWN/DEGRADED/PAUSED/UNKNOWN).

- [ ] **Step 3: Persist check result** to `monitor_checks`.

- [ ] **Step 4: Verify** — worker typecheck.

- [ ] **Step 5: Commit**

### Task 3: Incident lifecycle

**Files:**
- Create: `worker/src/services/incident.service.ts`

**Interfaces:**
- Consumes: monitoring check results.
- Produces: open / acknowledge / resolve / reopen incidents; one active incident per monitor; dedupe.

- [ ] **Step 1: Implement incident transitions** with failure threshold & recovery threshold.

- [ ] **Step 2: Record incident events** timeline.

- [ ] **Step 3: Verify** — worker typecheck.

- [ ] **Step 4: Commit**

### Task 4: Scheduler + run-now endpoint

**Files:**
- Modify: `worker/src/index.ts`
- Create: `worker/src/routes/monitoring.routes.ts`

**Interfaces:**
- Consumes: Task 2/3 services, due-monitor selection.
- Produces: Workers `scheduled` cron handler + authenticated internal run-now endpoint.

- [ ] **Step 1: Add `scheduled` handler** in worker entry (cron → due monitors → checks → incidents).

- [ ] **Step 2: Add monitoring routes** (`/api/monitors`, checks trigger).

- [ ] **Step 3: Verify** — worker typecheck, wrangler dry-run.

- [ ] **Step 4: Commit**

### Task 5: Notifications + activity wiring

**Files:**
- Modify: `worker/src/routes/notification.routes.ts` (or service layer)
- Modify: `worker/src/routes/activity.routes.ts` as needed

**Interfaces:**
- Consumes: incidents/checks; existing notification/activity stores.
- Produces: alert notifications + activity logs on down/recovered/SSL-expiry events.

- [ ] **Step 1: Wire alert creation** from incident lifecycle events.

- [ ] **Step 2: Verify** — worker typecheck.

- [ ] **Step 3: Commit**

### Task 6: Dashboard stats API extension

**Files:**
- Modify: `worker/src/routes/dashboard.routes.ts`

**Interfaces:**
- Consumes: existing stats + new monitoring/incident data.
- Produces: fleet stats incl. up/down/degraded/paused/unknown counts, active incidents, SSL expiring.

- [ ] **Step 1: Extend dashboard stats query.**

- [ ] **Step 2: Verify** — worker typecheck.

- [ ] **Step 3: Commit**

### Task 7: Frontend monitoring UI (admin)

**Files:**
- Modify: `frontend/src/services/api.ts`, `frontend/src/types/index.ts`
- Modify: `frontend/src/app/admin/page.tsx`, `frontend/src/app/admin/websites/[id]/page.tsx`

**Interfaces:**
- Consumes: new dashboard/monitor API shapes.
- Produces: fleet overview cards, attention queue, website detail monitoring sections.

- [ ] **Step 1: Extend API client + types** with monitor/incident/health types.

- [ ] **Step 2: Build admin dashboard** monitoring widgets.

- [ ] **Step 3: Build website detail** monitoring sections (monitor config, checks, incidents, SSL).

- [ ] **Step 4: Verify** — frontend `npx tsc --noEmit` and `npm run build`.

- [ ] **Step 5: Commit**

### Task 8: Verification, docs, rollout notes

**Files:**
- Modify: `CAPABILITIES.md`, `README.md`, `docs/superpowers/...` notes

**Interfaces:** none (docs/close-out).

- [ ] **Step 1:** Run backend/frontend typechecks, worker typecheck, builds; run live checks where possible.

- [ ] **Step 2:** Update capability docs.

- [ ] **Step 3:** Commit.

---

## Execution

After saving and self-reviewing the plan, ask the human partner for plan review and chosen execution method (see writing-plans skill).
