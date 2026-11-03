# NexusOps — Agent Instructions

> Read this file before making changes to the repo. It describes the current product, architecture, and mandatory validation workflow for any code or documentation updates.

---

## What this project is

NexusOps is a website operations and client portal for agencies, freelancers, and managed-service teams. It combines website lifecycle management, customer/technician access controls, billing visibility, and automated monitoring in one product.

### Core user roles

| Role | Access level | Typical work |
| --- | --- | --- |
| OWNER | Full system access | Website fleet, customers, technicians, billing, notifications, incidents |
| CUSTOMER | Own websites only | Billing, notifications, website detail, support awareness |
| TECHNICIAN | Assigned websites only | Maintenance, incident awareness, status updates |

Unauthenticated users are redirected to `/login`.

---

## Current architecture

### Frontend
- Next.js 16 / React 19 / TypeScript
- Tailwind CSS
- Role-based client portal for owner, customer, and technician workflows
- API client with automatic token refresh and session restoration

### Backend
- Express + TypeScript
- Prisma + PostgreSQL
- JWT auth with access/refresh tokens and bcrypt password hashing
- Resource-level authorization and customer/technician isolation

### Worker
- Cloudflare Worker + Hono
- D1 database for monitoring data and incidents
- Cron-based URL health checks every 5 minutes
- Incident lifecycle and monitoring notifications

---

## Repository structure

```text
nexusops/
├── frontend/      # Portal and dashboard UI
├── backend/       # REST API and database layer
├── worker/         # Monitoring worker and D1 job engine
├── shared/         # Shared types / cross-cutting contracts
├── docs/          # Design specs, plans, and product docs
├── .env.example   # Root env template
├── README.md
├── CODEBASE_STRUCTURE.md
├── CAPABILITIES.md
├── REMAINING_PHASES.md
├── UPGRADE_ROADMAP.md
├── BUG_CHECKLIST.md
├── AGENTS.md
└── .gitignore
```

---

## Development commands

### Backend
```bash
cd backend
npm install
cp ../.env.example .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Worker
```bash
cd worker
npm install
cp .env.example .dev.vars
npm run db:init
npm run dev
```

### Validation before commit

Every agent must run the relevant project checks before committing any change.

#### Backend
```bash
cd backend && npx tsc --noEmit
```

#### Frontend
```bash
cd frontend && npx tsc --noEmit && npm run lint
```

#### Worker
```bash
cd worker && npx tsc --noEmit
```

If the platform is being changed in a way that affects deployment, a dry-run deployment check is also recommended:

```bash
cd worker && npx wrangler deploy --dry-run
```

---

## Critical product notes

- Environment files are required and should be created from the examples before running locally.
- PostgreSQL must be available for the backend Prisma app.
- Cloudflare Worker uses D1 and cron; local development should be done via Wrangler.
- The monitoring engine is intentionally separate from the main app API so operational checks do not interfere with the customer portal.
- Frontend auth flows rely on the API client refresh mechanism and role-aware route access.

---

## Documentation expectations

When improving the product or architecture, update the relevant docs in the root folder so they remain aligned with the codebase:

- `README.md` — top-level overview and startup instructions
- `CODEBASE_STRUCTURE.md` — architecture and file responsibilities
- `CAPABILITIES.md` — product capabilities and gaps
- `REMAINING_PHASES.md` — current remaining work and status
- `UPGRADE_ROADMAP.md` — strategic roadmap
- `BUG_CHECKLIST.md` — known issues and outstanding concerns

---

## Final reminder

This repo is no longer limited to a simple client portal. It includes a real operational monitoring layer and Cloudflare-first deployment model, so all project documentation should reflect that current state.
