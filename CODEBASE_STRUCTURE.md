# NexusOps — Codebase Structure & Overview

## What Is This Website?

**NexusOps** is a production-ready **Website Operations & Client Portal** platform designed for web engineers who develop and maintain websites for multiple clients. It provides a centralized dashboard for managing websites, customers, technicians, billing, notifications, and maintenance across an organization.

Think of it as a **SaaS operations panel** — a single-pane-of-glass system where an owner/operator can see every client website's health, assign technicians, track billing, and respond to issues from one interface.

---

## Who Needs It?

### Primary Users

| Role | Who | What They Need |
|------|-----|----------------|
| **OWNER** (Admin) | Agency/freelancer who manages multiple clients | Full control: create customers, technicians, websites, manage billing, send notifications, view all activity |
| **CUSTOMER** (Client) | Businesses/individuals who own websites | View their own websites' status, see billing, receive notifications, manage their profile |
| **TECHNICIAN** | Developers/ops engineers doing the work | See websites assigned to them, view maintenance history, update status |

### Business Context

- **Web development agencies** managing 10–100+ client sites
- **Freelance web developers** with multiple clients
- **Managed service providers (MSPs)** offering ongoing website maintenance
- **IT departments** overseeing external-facing web properties

---

## What Services Does It Provide?

### 1. Website Management
- Create, update, delete websites with domain, type, and status tracking
- Assign websites to customers and technicians
- Status lifecycle: `DEVELOPMENT → OPERATIONAL | MAINTENANCE | ATTENTION_REQUIRED | OFFLINE | SUSPENDED`
- Timeline of events for each website
- Status change history with reasons

### 2. Customer Management
- Create and manage customer accounts
- Track customer details (name, email, phone, company, address)
- Activate/deactivate customer accounts
- Reset customer passwords

### 3. Technician Management
- Create and manage technician accounts
- Assign websites to technicians
- Set granular permissions per website (VIEW_WEBSITE, VIEW_STATUS, VIEW_TECHNICAL_INFO, CREATE_MAINTENANCE)
- Activate/deactivate technician accounts

### 3. Service Monitoring (Hosting, Database, Server)
- Track hosting provider, cost, due dates
- Track database provider and monthly costs
- Track server provider, plan, and costs
- Due date alerts for renewals

### 4. Billing & Financial Tracking
- Monthly financial summary per website (plan + hosting + database + server + additional charges)
- Additional charge tracking (one-time, monthly, yearly)
- Upcoming due dates for all services
- Billing overview dashboard

### 5. Maintenance Management
- Create maintenance records for websites
- Track maintenance items, status, and notes
- Mark records as internal (hidden from customers)
- Maintenance history with filtering

### 6. Notification System
- Create and send notifications to customers about websites
- In-app notification panel with read/unread tracking
- Priority levels: NORMAL, IMPORTANT, URGENT
- Types: INFORMATION, BILLING, MAINTENANCE, WARNING, SYSTEM

### 7. Activity Logging & Audit
- Track all system actions (login, create, update, delete, status changes)
- Filter activity by entity
- Dashboard statistics overview

---

## Architecture Overview

```
nexusops/
├── frontend/                  # Next.js 16 + React 19 + TypeScript + Tailwind CSS (port 3000)
│   ├── src/
│   │   ├── app/              # App Router pages (Next.js 16)
│   │   │   ├── page.tsx      # Root redirect (role-based)
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/    # Customer portal
│   │   │   ├── admin/        # Owner/admin panel
│   │   │   └── technician/   # Technician panel
│   │   ├── components/       # React components
│   │   │   ├── layout/       # AppShell, Header, Sidebar
│   │   │   ├── ui/           # Shared UI (Card, Badge, Button, Dialog, etc.)
│   │   │   ├── search/       # Command palette search
│   │   │   └── *.dialog.tsx  # Modal dialogs for CRUD operations
│   │   ├── store/            # AuthProvider (React Context)
│   │   ├── services/         # API client layer
│   │   ├── lib/              # Utility functions (formatting, dates)
│   │   └── types/            # TypeScript type definitions
│   ├── package.json          # Next.js 16.3.4, React 19.2.8
│   └── tsconfig.json
│
├── backend/                   # Express.js + TypeScript + Prisma ORM (port 3001)
│   ├── src/
│   │   ├── config/           # Environment, database config
│   │   ├── middleware/       # Auth, Authorization, Validation, Error handling
│   │   ├── routes/           # REST API endpoints
│   │   ├── services/         # Business logic layer
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Database seed script
│   ├── prisma/schema.prisma  # 16-table database schema
│   ├── package.json          # Express 4.21, Prisma 5.22, bcryptjs, jsonwebtoken
│   └── tsconfig.json
│
├── shared/                    # Shared types (currently empty types/ directory)
│   └── types/
│
├── .env.example              # Environment variable template
├── README.md                 # Project documentation
└── .gitignore
```

---

## Tech Stack Details

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | Next.js (App Router) | 16.3.4 |
| **Frontend Runtime** | React | 19.2.8 |
| **Frontend Styling** | Tailwind CSS v4 | @tailwindcss/postcss |
| **Frontend Animations** | Framer Motion | 13.1.1 |
| **Frontend Icons** | Lucide React | 1.38.0 |
| **Backend Framework** | Express.js | 4.21.0 |
| **Backend Language** | TypeScript | 5.6.2 |
| **ORM** | Prisma | 5.22.0 |
| **Database** | PostgreSQL | — |
| **Authentication** | JWT (access + refresh) + bcrypt (12 rounds) | jsonwebtoken 9.0.2, bcryptjs 2.4.3 |
| **Validation** | Zod | 3.23.8 |
| **API Client** | Native fetch | — |
| **Deployment** | Railway (backend) + Cloudflare Pages (frontend) | — |
| **Build Tool** | open-next (Cloudflare adapter) | @opennextjs/cloudflare 1.20.5 |

---

## Database Schema (16 Tables)

| Table | Purpose |
|-------|---------|
| `users` | Authentication (email, password hash, role) |
| `customers` | Customer profiles linked to users |
| `technicians` | Technician profiles linked to users |
| `websites` | Core website records |
| `plans` | Service plans per website |
| `hosting_services` | Hosting provider/cost per website |
| `database_services` | Database provider/cost per website |
| `server_services` | Server provider/plan/cost per website |
| `additional_charges` | Extra billing charges per website |
| `maintenance_records` | Maintenance history |
| `website_status_history` | Status change audit trail |
| `notifications` | User notifications |
| `technician_website_assignments` | Many-to-many technician-website links |
| `technician_permissions` | Per-website permission records |
| `activity_logs` | System activity audit |
| `website_timeline` | Website event timeline |

---

## Routing Structure

### Backend API Routes

| Prefix | Role | Description |
|--------|------|-------------|
| `/api/auth/login` | Public | Login |
| `/api/auth/refresh` | Public | Refresh tokens |
| `/api/auth/me` | Any | Get current user |
| `/api/auth/change-password` | Any (authenticated) | Change password |
| `/api/customers` | Owner | CRUD customers |
| `/api/technicians` | Owner | CRUD technicians |
| `/api/websites` | Any (filtered) | List websites by role |
| `/api/websites/:id` | Owner/Customer/Tech | Website detail |
| `/api/websites/:id/status` | Owner/Tech | Update status |
| `/api/websites/:id/maintenance` | Owner/Tech | Maintenance CRUD |
| `/api/websites/:id/charges` | Owner | Add charges |
| `/api/websites/:id/notifications` | Owner | Send notifications |
| `/api/notifications` | Any | List notifications |
| `/api/admin/activity` | Owner | Activity logs |
| `/api/billing/due-dates` | Owner | Upcoming due dates |

### Frontend Pages

| Path | Role | Page |
|------|------|------|
| `/` | All | Redirect (role-based) |
| `/login` | All | Login page |
| `/admin` | OWNER | Admin dashboard |
| `/admin/websites` | OWNER | All websites |
| `/admin/websites/:id` | OWNER | Website detail (full) |
| `/admin/customers` | OWNER | Customer list |
| `/admin/customers/:id` | OWNER | Customer detail |
| `/admin/technicians` | OWNER | Technician list |
| `/admin/billing` | OWNER | Billing overview |
| `/admin/notifications` | OWNER | All notifications |
| `/admin/activity` | OWNER | Activity logs |
| `/admin/profile` | OWNER | Profile + change password |
| `/dashboard` | CUSTOMER | Customer dashboard |
| `/dashboard/websites` | CUSTOMER | My websites list |
| `/dashboard/websites/:id` | CUSTOMER | Website detail |
| `/dashboard/billing` | CUSTOMER | Billing overview |
| `/dashboard/notifications` | CUSTOMER | My notifications |
| `/dashboard/profile` | CUSTOMER | Profile + change password |
| `/technician` | TECHNICIAN | Technician dashboard |
| `/technician/websites` | TECHNICIAN | My assigned websites |
| `/technician/websites/:id` | TECHNICIAN | Website detail |
| `/technician/maintenance` | TECHNICIAN | Maintenance history |
| `/technician/activity` | TECHNICIAN | Activity log |
| `/technician/profile` | TECHNICIAN | Profile + change password |

---

## Security Model

- **JWT authentication** with access (15min) + refresh (7d) tokens
- **Role-based access control** (OWNER, CUSTOMER, TECHNICIAN)
- **Resource-level authorization** — customers can only see their own websites, technicians only assigned ones
- **Internal notes hidden** from customers at the API level
- **Password hashing** with bcrypt (12 rounds)
- **Rate limiting** on API (200/15min) and auth endpoints (20/15min)
- **Helmet security headers**
- **CORS** configured for frontend origin

---

## Known Limitations

- Manual status updates only (no automated uptime monitoring)
- In-app notifications only (no email/SMS delivery)
- No file uploads
- No real-time WebSocket updates
- No automated billing invoicing
- No proper automated testing suite
- `shared/types/` directory is empty (no shared types between frontend and backend)

---

## Environment Variables

### Backend (`.env` in `backend/`)
```
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=... (min 32 chars)
JWT_REFRESH_SECRET=... (min 32 chars)
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=development|production
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env.local` in `frontend/`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Deployment

- **Backend**: Railway (uses `railway.json`, `Procfile`, `start.sh`)
- **Frontend**: Cloudflare Pages (uses `wrangler.jsonc`, `build-cloudflare.sh`)
- **Database**: PostgreSQL (Prisma `db push` or migrations)
- **Build**: `npx tsc` for backend, `next build` for frontend
