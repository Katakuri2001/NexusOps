# NexusOps — Current Capabilities & Offerings

> A comprehensive document of what NexusOps can do **today**, what it **offers**, and the **gaps/improvements** to target next.

---

## 🎯 What NexusOps Is & Who It's For

**NexusOps** is a **Website Operations & Client Portal** — a SaaS platform for web engineers who build and maintain websites for multiple clients.

**Target users:**
- **OWNER (Admin)** — Agency owner / freelancer managing many client websites.
- **CUSTOMER (Client)** — Business that owns the website(s); sees own status, billing, notifications.
- **TECHNICIAN** — Developer/ops engineer assigned to specific websites.

**Core value proposition:**
- Centralized view of all client websites (status, services, billing, maintenance, timeline).
- Role-based workflows (owner manages, customer consumes, technician executes).
- Customer portal + internal ops console in one platform.

---

## ✅ Current Capabilities — Feature by Feature

### 1. Authentication & Access Control
| Capability | Details |
|-----------|---------|
| JWT auth | Access token (15m) + refresh token (7d) |
| Password hashing | bcrypt (12 rounds) |
| Roles | `OWNER`, `CUSTOMER`, `TECHNICIAN` |
| Resource-level auth | Website/customer/technician scoped access |
| Customer isolation | Customer A cannot see Customer B |
| Technician isolation | Only assigned websites accessible |

### 2. Website Management (FULL — now supports owner-less websites)
| Capability | Details |
|-----------|---------|
| Create website | Name, domain (unique), description, developer, type, launchDate, status, **customer (optional)** |
| Update website | Partial updates; can **assign customer later** via `customerId` |
| Delete website | Cascades related services/records |
| Status management | `DEVELOPMENT`, `OPERATIONAL`, `MAINTENANCE`, `ATTENTION_REQUIRED`, `OFFLINE`, `SUSPENDED` |
| Status history | Audit trail per status change |
| Timeline | Events (create, status change, maintenance, charges) |
| Owner-less websites | ✅ **NEW**: create in `DEVELOPMENT` before customer exists; assign customer later |

### 3. Customer Management
- Create/list/get/update customers
- Activate / deactivate account
- Reset customer password

### 4. Technician Management
- Create/list technicians
- Assign website(s) to technician
- Remove assignment
- Per-website permissions: `VIEW_WEBSITE`, `VIEW_STATUS`, `VIEW_TECHNICAL_INFO`, `CREATE_MAINTENANCE`
- Activate / deactivate

### 5. Service & Infrastructure Monitoring
- **Hosting**: provider, cost, billing cycle, start/due dates, status
- **Database**: provider, monthlyCost, billing cycle, dates, status
- **Server**: provider, plan, cost, dates, status
- Due-date tracking (next 30 days)

### 6. Billing & Financials
- Monthly financial summary per website: plan + hosting + database + server + other recurring
- One-time charges (`ONE_TIME`, `MONTHLY`, `YEARLY`)
- Additional charges CRUD
- Upcoming due dates
- Monthly / yearly totals

### 7. Maintenance Management
- Create maintenance records (title, description, items, status, notes, internal flag)
- History per website
- Internal notes hidden from customers (API-level)

### 8. Notifications
- Create notifications (types: `INFORMATION`, `BILLING`, `MAINTENANCE`, `WARNING`, `SYSTEM`)
- Priorities: `NORMAL`, `IMPORTANT`, `URGENT`
- Read / unread / mark-all-read
- In-app only (no email/SMS yet)

### 9. Activity & Dashboard
- Activity logs: `LOGIN`, `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `ASSIGN_WEBSITE`, `ADD_CHARGE`, etc.
- Dashboard stats: total/operational/attention/maintenance websites, customers, technicians, unread notifications, upcoming due dates

### 10. Frontend Delivery
- Customer portal pages (`/dashboard/*`)
- Owner console pages (`/admin/*`)
- Technician pages (`/technician/*`)
- Command palette (search), notifications bell, toasts, skeletons, empty states, dialogs
- Responsive + dark theme hooks (CSS variables)

---

## 🚧 What We Cannot Do Yet (Capability Gaps → Improvement Targets)

These are the **most valuable gaps** to close next, aligned with the upgrade roadmap:

| # | Gap | Impact | Related Roadmap Item |
|---|-----|--------|----------------------|
| 1 | **Automated uptime / health monitoring** | ✅ **NEW** — Cloudflare Worker cron (every 5 min) + D1, SSRF-safe checks, observed health states | Automated Website Monitoring (#17) — done |
| 2 | **No external notification delivery** (email/SMS) | In-app only | Email/SMS (#18) |
| 3 | **No automated invoicing / payments** | Manual billing tracking | Automated Billing (#19) |
| 4 | **No real-time updates** (WebSocket) | Users refresh manually | Real-Time (#15) |
| 5 | **No shared types / monorepo coordination** | Frontend/backend types duplicated | Shared Types (#14) |
| 6 | **No automated tests / CI/CD** | High regression risk | Testing/CI (#21, #22) |
| 7 | **Env validation bypassed; weak error handling** | Silent failures | Security/Infra (#1, #3) |
| 8 | **No observability (logs/APM/alerts)** | Can't detect issues proactively | Observability (#30) |

---

## 🔄 Feature Evolution Paths (Current → Improved)

### Path A — Client Self-Service Growth
- Customer requests maintenance → technician triage → status changes.
- **Improvements**: self-service maintenance requests, customer billing history/invoices, support tickets.

### Path B — Ops Efficiency
- Owner monitors fleet of websites → attention queue → notifications → billing.
- **Improvements**: automated alerting, alerting rules, escalation policies.

### Path C — Revenue / Product
- Owner charges customers via plans/services → invoices.
- **Improvements**: automated invoicing, payment integration, subscription management.

### Path D — Engineering Excellence
- Better types, tests, CI, observability to support scale.
- **Improvements**: shared types, API versioning, microservices, Docker.

---

## 📊 Capability Coverage Summary

| Capability Area | Status | Notes |
|-----------------|--------|-------|
| Auth / RBAC | ✅ Complete | Solid foundation |
| Website CRUD + status | ✅ Complete | **Owner-less websites now supported** |
| Customer/Technician mgmt | ✅ Complete | |
| Service billing tracking | ✅ Complete | Manual |
| Maintenance records | ✅ Complete | Internal notes handled |
| Notifications | ✅ Partial | In-app only |
| Activity logs | ✅ Complete | |
| Dashboard stats | ✅ Complete | |
| Automated monitoring | ✅ **NEW** | HTTP/HTTPS checks via Worker cron + D1; incident lifecycle wired |
| Email/SMS delivery | ❌ Missing | Next priority |
| Real-time updates | ❌ Missing | |
| Automated billing/invoicing | ❌ Missing | |
| Self-service customer portal | 🟡 Partial | Limited billing history |

---

## 🎯 Recommended Next Capability Targets (for Better Improvements)

Based on current capabilities + user pain points, the highest-value near-term improvements are:

1. **Automated website monitoring** (uptime, SSL, response time) → closes the loop from status tracking to automated status changes.
2. **Email/SMS notification delivery** → makes notifications actionable outside the app.
3. **Customer self-service** (billing history, maintenance requests, support) → reduces owner workload.
4. **Real-time updates** → better ops responsiveness.
5. **Automated invoicing & payment tracking** → complete the revenue loop.

---

## 📄 Related Documents

- `README.md` — Quick start, roles, API endpoints, known limitations, future features.
- `CODEBASE_STRUCTURE.md` — Deep architecture, DB schema, routing, deployment.
- `BUG_CHECKLIST.md` — 30 known bugs (not yet fixed).
- `UPGRADE_ROADMAP.md` — 36-item improvement plan across 10 phases.
- `AGENTS.md` — Agent instructions, mandatory build/test procedure.

---

## ✅ Final Statement

**NexusOps today** provides a solid, role-aware website operations & client portal: website CRUD with status/timeline, customer & technician management, service/billing tracking, maintenance, notifications, activity logs, and dashboard stats — **plus the new owner-less website capability**.

**The biggest remaining capability gaps** for a truly "complete" improvement are **external notification delivery (email/SMS), real-time updates, and automated billing**.
