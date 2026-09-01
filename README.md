# NexusOps — Website Operations & Client Portal

A production-ready platform for web engineers who develop and maintain websites for multiple clients.

## Tech Stack

- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js, TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT (access + refresh tokens), bcrypt password hashing, RBAC

## Architecture

```
nexusops/
├── frontend/          Next.js app (port 3000)
├── backend/           Express API (port 3001)
├── shared/            Shared types
└── .env.example       Environment variables
```

## Quick Start

### 1. Database

You need PostgreSQL running. Create a database and update `.env`:

```bash
cd backend
cp ../.env.example .env
# Edit .env with your DATABASE_URL
```

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push      # Creates tables
npm run db:seed         # Seeds demo data
npm run dev             # Starts on port 3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev             # Starts on port 3000
```

### 4. Login

Open `http://localhost:3000` and use:

| Role       | Email                | Password     |
|------------|----------------------|--------------|
| Owner      | admin@nexusops.com   | admin123     |
| Customer   | john@example.com     | customer123  |
| Technician | mike@nexusops.com    | tech123      |

## Roles

- **OWNER** — Full access. Manages customers, technicians, websites, billing, notifications.
- **CUSTOMER** — Sees only their own websites, services, billing, and notifications.
- **TECHNICIAN** — Sees only websites explicitly assigned to them.

## Security Model

- JWT access + refresh token authentication
- Password hashing with bcrypt (12 rounds)
- Resource-level authorization (not just role checks)
- Customer isolation (Customer A cannot see Customer B's data)
- Technician isolation (only assigned websites accessible)
- Internal notes hidden from customers at the API level
- No sensitive credentials exposed to frontend
- Rate limiting on API and auth endpoints
- Helmet security headers

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/refresh | Public | Refresh tokens |
| GET | /api/auth/me | Any | Current user |
| GET | /api/customers | Owner | List customers |
| POST | /api/customers | Owner | Create customer |
| GET | /api/technicians | Owner | List technicians |
| POST | /api/technicians | Owner | Create technician |
| GET | /api/websites | Any | List websites (filtered by role) |
| POST | /api/websites | Owner | Create website |
| GET | /api/websites/:id | Owner/Customer/Tech | Website detail |
| PATCH | /api/websites/:id/status | Owner/Tech | Update status |
| GET | /api/websites/:id/financial | Owner/Customer/Tech | Financial summary |
| GET | /api/websites/:id/maintenance | Owner/Customer/Tech | Maintenance history |
| POST | /api/websites/:id/maintenance | Owner/Tech | Create maintenance |
| GET | /api/websites/:id/timeline | Owner/Customer/Tech | Timeline events |
| POST | /api/websites/:id/charges | Owner | Add charge |
| POST | /api/websites/:id/notifications | Owner | Create notification |
| GET | /api/notifications | Any | List notifications |
| POST | /api/notifications | Owner | Create notification |
| PATCH | /api/notifications/:id/read | Any | Mark read |
| POST | /api/notifications/read-all | Any | Mark all read |
| GET | /api/dashboard | Owner | Dashboard stats |
| GET | /api/admin/activity | Owner | Activity logs |
| GET | /api/billing/due-dates | Owner | Upcoming due dates |

## Database Schema

16 tables including: users, customers, technicians, websites, plans, hosting_services, database_services, server_services, additional_charges, maintenance_records, website_status_history, notifications, technician_website_assignments, technician_permissions, activity_logs, website_timeline.

## Known Limitations

- Manual status updates only (no automated monitoring yet)
- No email/SMS notifications (in-app only)
- No file uploads
- No real-time WebSocket updates

## Future Features

- Uptime monitoring integration
- SSL/domain expiration monitoring
- Email/SMS notification delivery
- WebSocket real-time updates
- Automated billing invoicing
