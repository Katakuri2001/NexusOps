# NexusOps — Codebase Structure & Architecture

## Product overview

NexusOps is a SaaS platform for managing a fleet of client websites, supporting website operations, maintenance, billing, and automated health monitoring. The codebase is separated into three execution environments:

- Frontend: Next.js UI for owner, customer, and technician portals
- Backend: Express API and Prisma data layer for app logic and persistence
- Worker: Cloudflare Worker for scheduled monitoring, incident handling, and D1 storage

This repo is intentionally split so the product can use a highly responsive portal layer while retaining a strong operations backend and a Cloudflare-native monitoring engine.

---

## Repository map

```text
nexusops/
├── frontend/                     # Next.js app and portal experience
│   ├── src/
│   │   ├── app/                  # Route-level pages and dashboards
│   │   │   ├── admin/            # Owner/admin console
│   │   │   ├── dashboard/        # Customer portal
│   │   │   ├── technician/      # Technician portal
│   │   │   ├── login/            # Login page
│   │   │   ├── layout.tsx        # Global layout and providers
│   │   │   └── page.tsx          # Root route redirect
│   │   ├── components/           # Card/table/dialog/layout components
│   │   ├── services/             # ApiClient and API layer
│   │   ├── store/                # AuthProvider and session state
│   │   ├── lib/                  # Formatting/date helpers
│   │   └── types/                # Frontend TypeScript models
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── .env.example
│
├── backend/                      # Express API + Prisma + PostgreSQL
│   ├── src/
│   │   ├── config/              # env.ts, database.ts
│   │   ├── middleware/          # auth, authz, validation, error handling
│   │   ├── routes/              # REST route modules
│   │   ├── services/            # Business logic and data orchestration
│   │   ├── types/               # Shared backend types
│   │   ├── utils/               # Seed scripts and helpers
│   │   └── index.ts            # Express bootstrapping
│   ├── prisma/
│   │   └── schema.prisma        # Primary relational data model
│   ├── package.json
│   ├── tsconfig.json
│   ├── start.sh                # Runtime hook for Railway
│   └── .env.example
│
├── worker/                       # Cloudflare monitoring runtime
│   ├── src/
│   │   ├── db/                  # schema.sql, seed.sql, migration SQL
│   │   ├── routes/              # Monitoring + operational endpoints
│   │   ├── services/            # Monitoring logic and incident handling
│   │   ├── middleware/          # Auth and request middleware
│   │   ├── types/               # Worker data contracts
│   │   └── index.ts            # Hono app and cron trigger entrypoint
│   ├── package.json
│   ├── wrangler.toml
│   └── .env.example
│
├── shared/                       # Shared contracts for future reuse
│   └── types/
│
├── docs/                         # Product specs, plans, and design docs
├── .env.example                  # Root env template for backend/frontend
├── README.md
├── CAPABILITIES.md
├── REMAINING_PHASES.md
├── UPGRADE_ROADMAP.md
├── BUG_CHECKLIST.md
├── AGENTS.md
└── .gitignore
```

---

## Frontend structure

The frontend is a Next.js App Router project focused on role-aware UX.

### Key responsibilities
- Login and session restoration
- Owner dashboards and customer/technician portals
- Website detail pages, billing pages, maintenance views, and activity feeds
- UI for notifications and incident visibility

### Important entry points
- `frontend/src/app/layout.tsx` — global shell, providers, and app setup
- `frontend/src/store/auth-provider.tsx` — session state and auth refresh handling
- `frontend/src/services/api.ts` — network layer with token management and retry flow
- `frontend/src/components/layout/sidebar.tsx` — role-based navigation

---

## Backend structure

The backend is the main application API. It uses Prisma against PostgreSQL and serves the operational portal.

### Key responsibilities
- Auth and refresh-token flow
- User, customer, technician, and website CRUD
- Maintenance, charges, notifications, and activity management
- Role-based and resource-level authorization

### Important entry points
- `backend/src/index.ts` — Express app bootstrap and route registration
- `backend/src/middleware/auth.ts` — access-token validation
- `backend/src/middleware/authorization.ts` — role and resource checks
- `backend/src/routes/*.ts` — HTTP endpoints for each domain
- `backend/src/services/*.ts` — domain service layer and business logic
- `backend/prisma/schema.prisma` — relational schema for users, websites, services, notifications, and activity

### Notable domains
- `auth`
- `customers`
- `technicians`
- `websites`
- `notifications`
- `billing`
- `dashboard`
- `activity`

---

## Worker structure

The worker extends the platform with Cloudflare-native monitoring and incident management. It uses cron to run health checks and D1 to persist check results and incident state.

### Key responsibilities
- Periodic HTTP/HTTPS website checks
- SSL validation and response-time tracking
- Incident lifecycle management (open/acknowledge/resolve/reopen)
- Monitoring-related notifications and dashboard state updates

### Important entry points
- `worker/src/index.ts` — Hono app and cron-triggered scheduler
- `worker/src/services/monitoring.service.ts` — scheduled health checks and logic
- `worker/src/services/incident.service.ts` — incident state transitions
- `worker/src/routes/monitoring.routes.ts` — monitoring API endpoints
- `worker/src/db/schema.sql` — D1 schema for checks, incidents, and related data

### Cloudflare configuration
- `worker/wrangler.toml` — deployment config and cron trigger
- D1 database binding named `NEXUS_OPS`
- Cron schedule: every 5 minutes

---

## Typical data flow

1. User signs in through the frontend.
2. Frontend uses the API client to call the backend.
3. Backend validates JWTs and authorizes requests at the route/service layer.
4. Website status and operational data are stored in PostgreSQL.
5. Worker checks configured websites on a timer and writes monitoring results to D1.
6. Incident state and health events update the dashboard and relevant admin views.

---

## Database model summary

The backend schema covers the core operations domain. Core tables include:

- `users`
- `customers`
- `technicians`
- `websites`
- `plans`
- `hosting_services`
- `database_services`
- `server_services`
- `additional_charges`
- `maintenance_records`
- `website_status_history`
- `notifications`
- `technician_website_assignments`
- `technician_permissions`
- `activity_logs`
- `website_timeline`

The worker adds a separate monitoring-oriented D1 model for scheduled checks, health state, and incident records.

---

## Operational conventions

- Backend uses Prisma and should remain database-centric.
- Frontend is presentation and workflow oriented; it should not own critical business rules.
- Worker logic should stay SSRF-safe, cron-driven, and focused on health checks and incident state.
- Environment files should stay local-only and never be committed with real secrets.

---

## Related documentation

- `README.md` — project overview and quick-start steps
- `CAPABILITIES.md` — current product capabilities and gaps
- `REMAINING_PHASES.md` — what remains to build
- `UPGRADE_ROADMAP.md` — long-term product plan
- `BUG_CHECKLIST.md` — active known issues
