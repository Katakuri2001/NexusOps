# NexusOps — Remaining Phases & Left To Do

> Companion to `CAPABILITIES.md`, `UPGRADE_ROADMAP.md`, and the design spec/plan under `docs/superpowers/`.  
> The **Website Monitoring Engine & Incident Management** phase (Tasks 1–8) is complete.  
> **Cloudflare deployment (worker + D1 migration + frontend) is complete.**  
> This document tracks what remains, in priority order.

---

## ✅ Completed (for reference)

- Website CRUD + owner-less websites (create without customer, assign later)
- Authentication & RBAC (JWT access/refresh, bcrypt/PBKDF2)
- Customer / technician management + assignments + permissions
- Service & infrastructure tracking (hosting/database/server)
- Billing & charges tracking
- Maintenance records + internal notes
- In-app notifications + activity logs
- Owner / customer / technician interfaces
- **Automated website monitoring** (Cloudflare Worker cron + D1, SSRF-safe checks, observed health states)
- **Incident lifecycle** (open/acknowledge/resolve/reopen, dedup, timeline)
- **Monitoring notifications/activity wiring** (incident open/recovery)
- **Cloudflare deployment** — Worker (Hono + D1) deployed with cron trigger; D1 migrated (nullable customer_id + monitoring tables, all data preserved); frontend (Next.js via OpenNext) deployed to Cloudflare Workers
- **Production URLs**: Worker `https://nexusops.kaungsethmue2001.workers.dev`, Frontend `https://nexusops-frontend.kaungsethmue2001.workers.dev`
- **Dashboard stats extension** (monitors/incidents counts)
- **Basic monitoring UI** (admin dashboard stat cards, website detail Monitoring tab)

---

## 🟡 Phase 4 — Dashboard Polish (NEXT)

Goal: turn the monitoring data into a dependable, usable admin experience.

- [ ] Fleet overview cards with real API data: up/down/degraded/paused/unknown, active incidents, SSL expiring soon, slow endpoints, overdue checks, recent recoveries
- [ ] Attention queue: prioritized list (website, customer, health, incident severity, duration, last checked, assigned technician, recommended next action) with search/filter (customer, environment, status, severity, technician)
- [ ] Website detail monitoring sections: overview, monitoring configuration, response-time history, uptime history, incidents, SSL info, services/costs, maintenance, activity
- [ ] Monitoring charts (response-time history, uptime) with accessible labels/tables
- [ ] Meaningful loading/empty/stale/error/permission-denied states
- [ ] Responsive + accessible (keyboard, focus, contrast, reduced motion)

## 🟠 Phase 5 — Operational Maturity

- [ ] Maintenance windows (start/end, timezone, scope, notification suppression, recurrence, audit)
- [ ] Observability: structured logging (pino), request/correlation IDs, redaction, metrics (checks completed, failures, overdue, scheduler lag, incidents, notification delivery)
- [ ] Health/readiness endpoints (DB connectivity) without exposing secrets
- [ ] Retention & cleanup jobs for raw `monitor_checks` (safe, observable)
- [ ] CI/CD: GitHub Actions for lint/typecheck/tests/build/migration check; deploy pipelines; preview deployments; rollback docs
- [ ] Test suite (Vitest + supertest): unit (URL validation, health calc, thresholds, SSL expiry, dedup, retry), integration (monitor CRUD, scheduled checks, persistence, incidents, notifications), authorization (isolation), E2E (owner journey with controlled test endpoints)
- [ ] Environment validation (fix BUG-001/BUG-004): `envSchema.parse(process.env)`, remove fallback secrets
- [ ] JWT refresh rotation & revocation (BUG-003 roadmap #3)
- [ ] DB connection pooling & Prisma error handling (BUG-018)
- [ ] Fix BUG-006 (status PATCH permission), BUG-011 (useParams Promise), BUG-012 (token refresh race)

## 🔵 Phase 6 — Advanced Features

- [ ] Customer self-service portal: current health, uptime history, customer-visible incidents, planned maintenance, billing history, maintenance requests
- [ ] Technician portal: assigned monitoring status, incident ack/investigation, maintenance workflow, incident notes
- [ ] Real-time dashboard updates (WebSocket / SSE)
- [ ] Email/SMS notification delivery (Resend/Twilio) with delivery status, retries, backoff, dedup, preferences
- [ ] Automated billing & invoicing (invoice model, PDF, payment gateway)
- [ ] Uptime reports, scheduled reports, exportable incident history
- [ ] DNS/domain health monitoring, API response validation
- [ ] Multi-region monitoring (if supported by deployment)
- [ ] Configurable escalation policies, webhooks (Slack/Discord/PagerDuty)

## ⚪ Phase 7 — Engineering Hygiene (ongoing)

- [ ] Shared types between frontend/backend (`shared/types/`)
- [ ] API versioning (`/api/v1/`) + OpenAPI/Swagger docs
- [ ] ESLint/Prettier/Husky pre-commit hooks; reduce `any` types
- [ ] Replace inline `require()` with ES module imports (BUG-008)
- [ ] Database migrations instead of `prisma db push` (roadmap #32)
- [ ] Docker containerization + backup/disaster recovery
- [ ] Dependency updates & security audits (BUG-021, #34)
- [ ] Accessibility audit (ARIA, keyboard, contrast) (#25)
- [ ] Dark mode toggle (#27), responsive polish (#28)

## ⚠️ Known Gaps Still Open

- No automated tests anywhere (BUG-022)
- No email/SMS delivery (in-app only)
- No real-time updates
- No automated billing/invoicing
- Env validation bypassed (BUG-001/BUG-004)
- Customer/technician routes owner-only (BUG-007)
- `useParams()` may return Promise in Next.js 16 (BUG-011)
- Token refresh race condition (BUG-012)

---

## 📄 Related Documents

- `README.md` — quick start, roles, API endpoints
- `CODEBASE_STRUCTURE.md` — architecture, schema, routing
- `BUG_CHECKLIST.md` — 30 known bugs (not fixed)
- `UPGRADE_ROADMAP.md` — 36-item improvement plan across 10 phases
- `CAPABILITIES.md` — current capabilities & offerings
- `AGENTS.md` — agent instructions & mandatory build/test procedure
- `docs/superpowers/specs/2026-10-28-website-monitoring-engine-design.md` — monitoring design spec
- `docs/superpowers/plans/2026-10-28-website-monitoring-engine.md` — monitoring implementation plan

---

## ✅ Final Statement

The **monitoring engine + incident handling** phase is complete and verified (worker typecheck + wrangler dry-run + frontend/backend typecheck & builds pass).  
Remaining work is **dashboard polish → operational maturity → advanced features → engineering hygiene**, in that order, per the master prompt's implementation sequence.
