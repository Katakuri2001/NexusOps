# NexusOps — Website Operations & Monitoring Platform

NexusOps is a website operations and client portal built for agencies, freelancers, and managed-service teams that maintain multiple websites for different customers. The platform combines a role-based operations dashboard with Cloudflare-native automated monitoring, incident tracking, and customer-facing visibility.

## Current capabilities

- Website lifecycle management with status, timeline, and maintenance records
- Customer and technician management with assignment-based permissions
- Billing and service tracking for hosting, database, server, and additional charges
- In-app notifications and activity logging
- Automated website monitoring via Cloudflare Worker cron + D1
- Incident lifecycle tracking (open, acknowledge, resolve, reopen)
- Role-aware portals for owner, customer, and technician workflows

## Tech stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Node.js, Express, Prisma, PostgreSQL
- Monitoring runtime: Cloudflare Worker (Hono + D1 + cron)
- Auth: JWT access + refresh tokens, bcrypt password hashing
- Deployment: backend on Railway, frontend on Cloudflare Pages/Workers, worker on Cloudflare

## Architecture

```text
nexusops/
├── frontend/                  # Next.js portal and dashboard UI
├── backend/                   # Express API + Prisma + PostgreSQL
├── worker/                    # Cloudflare monitoring worker + cron + D1
├── shared/                    # Shared type layer (extends over time)
├── docs/                      # Product specs and implementation plans
├── .env.example               # Shared env template for backend/frontend
├── README.md                  # Project overview
├── CODEBASE_STRUCTURE.md      # Detailed architecture guide
├── CAPABILITIES.md            # Current product capabilities
├── REMAINING_PHASES.md        # Roadmap and remaining work
├── UPGRADE_ROADMAP.md         # Upgrade plan
├── BUG_CHECKLIST.md           # Known issues / open bugs
└── AGENTS.md                 # Agent operating conventions
```

## Role model

- OWNER: manages customers, technicians, websites, billing, notifications, and health operations
- CUSTOMER: sees only assigned websites, billing, notifications, and their own profile
- TECHNICIAN: works only on assigned websites and maintenance/incidents relevant to them

## Quick start

### 1) Backend

```bash
cd backend
npm install
cp ../.env.example .env
# Update DATABASE_URL / JWT secrets / frontend URL as needed
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Backend runs on `http://localhost:3001`.

### 2) Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3000`.

### 3) Monitoring worker

```bash
cd worker
npm install
cp .env.example .dev.vars
npm run db:init
npm run dev
```

The worker schedules monitoring checks every 5 minutes and stores results in Cloudflare D1.

## Demo login

Use the seeded accounts to log in from the frontend:

| Role | Email | Password |
| --- | --- | --- |
| Owner | admin@nexusops.com | admin123 |
| Customer | john@example.com | customer123 |
| Technician | mike@nexusops.com | tech123 |

## Key product areas

### Website operations
- CRUD for websites and lifecycle tracking
- Optional customer assignment after website creation
- Status history and timeline events

### Customer / technician operations
- Customer and technician profiles
- Website assignment and permission controls
- Internal notes and scoped access management

### Billing and services
- Hosting, database, and server tracking
- Additional charges and due date tracking
- Monthly and recurring charge summaries

### Monitoring and incidents
- Cron-based URL checks for uptime, SSL, and response-time health
- Incident creation, acknowledgment, and resolution
- Monitoring status surfaced in dashboard and website detail views

## Local development notes

- PostgreSQL must be running for the backend Prisma app.
- Cloudflare Worker development is powered by Wrangler and D1.
- Frontend expects the backend base URL via `NEXT_PUBLIC_API_URL`.
- Worker and backend both use environment variables from their respective project files.

## Deployment summary

- Backend: Railway / Node.js / Prisma / PostgreSQL
- Frontend: Cloudflare Pages / Next.js
- Worker: Cloudflare Workers / Hono / D1 / cron

## Related docs

- `CODEBASE_STRUCTURE.md` — deeper architecture and file map
- `CAPABILITIES.md` — current product capabilities and gaps
- `REMAINING_PHASES.md` — roadmap status and remaining work
- `UPGRADE_ROADMAP.md` — long-term improvement plan
- `BUG_CHECKLIST.md` — known issues and constraints
