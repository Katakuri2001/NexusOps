# NexusOps — Agent Instructions

> **IMPORTANT: Read this file at the start of every session involving code changes.**
> This document describes how the NexusOps platform works, the tech stack, and mandatory procedures for all code changes.

---

## 🏗️ What This Website Is

**NexusOps** is a **Website Operations & Client Portal** — a SaaS platform for web engineers who develop and maintain websites for multiple clients. It provides a centralized dashboard for managing websites, customers, technicians, billing, notifications, and maintenance.

### Core Value Proposition
- Monitor website health and status across all client properties
- Assign technicians to websites with granular permissions
- Track billing (plans, hosting, databases, servers, additional charges)
- Send and manage notifications
- Maintain an audit trail of all actions

---

## 👥 Users and Roles

| Role | Access Level | Pages |
|------|-------------|-------|
| **OWNER** (Admin) | Full system access | `/admin/*` — All websites, customers, technicians, billing, notifications, activity, profile |
| **CUSTOMER** | Own websites only | `/dashboard/*` — My websites, billing, notifications, profile |
| **TECHNICIAN** | Assigned websites only | `/technician/*` — Assigned websites, maintenance, activity, profile |

Unauthenticated users are redirected to `/login`.

---

## 📦 Tech Stack

### Frontend
- **Framework**: Next.js 16.3.4 (App Router)
- **Runtime**: React 19.2.8
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Animations**: Framer Motion 13.1.1
- **Icons**: Lucide React 1.38.0
- **Deployment Target**: Cloudflare Pages (via `@opennextjs/cloudflare`)
- **Build Adapter**: open-next (`opennextjs-cloudflare`)
- **State Management**: React Context (`AuthProvider` in `src/store/auth-provider.tsx`)
- **API Client**: Custom `ApiClient` class using native `fetch` (`src/services/api.ts`)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.21.0
- **Language**: TypeScript
- **ORM**: Prisma 5.22.0
- **Database**: PostgreSQL
- **Auth**: JWT (access + refresh tokens) + bcryptjs (12 rounds)
- **Validation**: Zod 3.23.8
- **Security**: Helmet, cookie-parser, express-rate-limit, cors
- **Deployment Target**: Railway (via Nixpacks builder)
- **Build**: `npx tsc` → `dist/` directory

### Shared
- **Shared Types**: `shared/types/` (currently empty — planned for shared TypeScript types between frontend and backend)
- **Workspace**: Monorepo with `frontend/`, `backend/`, `shared/` directories

---

## 🗂️ Project Structure

```
nexusops/
├── frontend/                          # Next.js app (port 3000)
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   │   ├── layout.tsx            # Root layout with AuthProvider
│   │   │   ├── page.tsx              # Root redirect (role-based)
│   │   │   ├── login/page.tsx        # Login page
│   │   │   ├── dashboard/            # Customer portal pages
│   │   │   ├── admin/                # Owner/admin pages
│   │   │   └── technician/           # Technician pages
│   │   ├── components/               # React components
│   │   │   ├── layout/               # AppShell, Header, Sidebar
│   │   │   ├── ui/                   # Shared UI components
│   │   │   ├── search/               # Command palette
│   │   │   └── *.dialog.tsx          # Modal dialogs
│   │   ├── store/                    # AuthProvider context
│   │   ├── services/                 # API client layer
│   │   ├── lib/                      # Utility functions
│   │   └── types/                    # TypeScript type definitions
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── .env.example
│
├── backend/                           # Express API (port 3001)
│   ├── src/
│   │   ├── config/                   # env.ts, database.ts
│   │   ├── middleware/               # auth.ts, authorization.ts, validate.ts, errorHandler.ts
│   │   ├── routes/                   # All API route handlers
│   │   ├── services/                 # Business logic (AuthService, WebsiteService, etc.)
│   │   ├── types/                    # TypeScript types
│   │   └── utils/                    # seed.ts
│   ├── prisma/schema.prisma          # 16-table database schema
│   ├── package.json
│   ├── tsconfig.json
│   ├── Procfile                      # Railway deployment
│   ├── railway.json                  # Railway configuration
│   ├── start.sh                      # Startup script (prisma generate → db push → node dist/index.js)
│   └── .env.example
│
├── shared/                            # Shared types (planned)
│   └── types/
│
├── .env.example                      # Root env template
├── README.md                         # Project overview
├── CODEBASE_STRUCTURE.md             # Detailed codebase documentation
├── BUG_CHECKLIST.md                  # Known bugs (NOT fixed)
├── UPGRADE_ROADMAP.md                # Improvement roadmap
└── AGENTS.md                         # This file
```

---

## 🔧 Development Commands

### Backend
```bash
cd backend
npm install
npx prisma generate          # Generate Prisma client
npx prisma db push           # Push schema to database
npm run db:seed              # Seed demo data
npm run dev                  # Start dev server (ts-node-dev, port 3001)
npm run build                # TypeScript build → dist/
npm start                    # Start production server
```

### Frontend
```bash
cd frontend
npm install
npm run dev                  # Start dev server (Next.js, port 3000)
npm run build                # Production build
npm run build:cloudflare     # Build for Cloudflare Pages
npm run lint                 # ESLint
```

### Root
```bash
npm install                  # Install all workspace dependencies (if applicable)
```

---

## 🚨 MANDATORY PROCEDURE — Before Any Commit and Push

**Every agent MUST follow these steps before committing and pushing any branch:**

### Step 1: TypeCheck
Run the TypeScript type checker to ensure no type errors exist.

**Backend:**
```bash
cd backend && npx tsc --noEmit
```

**Frontend:**
```bash
cd frontend && npx tsc --noEmit
```

**If type errors are found:** FIX THEM before proceeding. Do not commit code with type errors.

---

### Step 2: Lint
Run the linter to catch code style issues and potential bugs.

**Frontend:**
```bash
cd frontend && npm run lint
```

**Backend:**
```bash
cd backend && npx eslint src/
```

**If lint errors are found:** FIX THEM before proceeding. Use `npx eslint --fix` if applicable.

---

### Step 3: Build
Ensure the project builds successfully end-to-end.

**Backend:**
```bash
cd backend && npm run build
```
Verify `dist/` directory is created with no errors.

**Frontend:**
```bash
cd frontend && npm run build
```
Verify the build completes without errors.

**If build fails:** FIX THE BUILD ERROR before proceeding. A broken build must never be committed.

---

### Step 4: Commit and Push
Only after all three steps pass:
```bash
git add .
git commit -m "description of changes"
git push origin <branch-name>
```

---

## ⚠️ Agent Awareness — Critical Notes

### 1. Environment Variables Are Required
The app **will not work** without proper `.env` files. Always create `.env` files from `.env.example` before running.

- Backend needs: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- Frontend needs: `NEXT_PUBLIC_API_URL`

### 2. Database Must Be Running
The backend requires a running PostgreSQL database. Use `npx prisma db push` after any schema changes.

### 3. Prisma Client Must Be Regenerated
After modifying `prisma/schema.prisma`, always run `npx prisma generate` before building.

### 4. The `start.sh` Script Runs Prisma Automatically
When deploying to Railway, `start.sh` runs `npx prisma generate` and `npx prisma db push`. Ensure these commands work without errors.

### 5. Frontend Uses Next.js 16 Specific APIs
- `useParams()` in Next.js 16 App Router — check if it returns a Promise or direct object
- `useRouter()` from `next/navigation` for client-side navigation
- `usePathname()` from `next/navigation` for current path detection
- The `app/layout.tsx` uses server components with client component boundaries (`'use client'`)

### 6. Known Bugs (Not Yet Fixed)
See `BUG_CHECKLIST.md` for a comprehensive list of known bugs. When working on code that touches these areas, be aware of the issues:
- Environment validation is completely bypassed (`backend/src/config/env.ts`)
- Both charge and billing routes mounted at `/api/billing` (`backend/src/index.ts`)
- Seed script uses standalone PrismaClient instead of singleton
- Inline `require()` calls instead of imports in multiple route files
- No Prisma error handling in the error handler
- No automated tests

### 7. Frontend API Client Has a 401 Refresh Flow
The `ApiClient` in `frontend/src/services/api.ts` handles token refresh automatically. When a 401 is received, it:
1. Sends refresh token to `/api/auth/refresh`
2. On success, retries the original request with new tokens
3. On failure, clears tokens and redirects to `/login`

### 8. Authentication Flow
- Login returns `{ user, accessToken, refreshToken }`
- Tokens stored in `localStorage` by `ApiClient`
- `AuthProvider` calls `api.getMe()` on init to restore session
- `Authorize` middleware checks role; `AuthorizeResource` checks resource-level access

### 9. CSS Variables and Theming
The project uses CSS custom properties (variables) defined in `globals.css`. Classes like `bg-background`, `text-foreground`, `border-border`, `text-muted`, `text-primary`, `text-danger`, `text-success`, `text-warning` are used throughout. Ensure any new CSS respects these variables.

### 10. Deployment Configuration
- **Backend**: Deployed to Railway using `railway.json` (Nixpacks builder)
- **Frontend**: Deployed to Cloudflare Pages using `wrangler.jsonc` and `@opennextjs/cloudflare`
- **Health check**: `/api/health` endpoint
- **Build command for Railway**: `npx tsc` then `node dist/index.js`

---

## 📋 After Fixing Bugs

When fixing bugs from `BUG_CHECKLIST.md`, **update this file** to:

1. **Remove the fixed bug** from the checklist (or mark it as fixed in `BUG_CHECKLIST.md`)
2. **Add a note** in this file under the relevant section describing what was fixed
3. **Add any new considerations** that the fix introduced

Example format for fixed items:
```
### FIXED: [Bug ID] - [Brief Description]
- Fixed on [date/branch]
- Changed: [what was changed]
- Note: [any follow-up considerations]
```

---

## 🧪 Testing

**No automated tests exist yet.** When adding tests, add them to the appropriate directory:
- Backend tests: `backend/__tests__/` or `backend/src/__tests__/`
- Frontend tests: `frontend/src/__tests__/`
- Use **Vitest** as the test runner (recommended for TypeScript projects)

---

## 📝 Documentation

All documentation files are at the project root:
- `README.md` — Quick start guide
- `CODEBASE_STRUCTURE.md` — Detailed architecture documentation
- `BUG_CHECKLIST.md` — Known bugs inventory
- `UPGRADE_ROADMAP.md` — Improvement plan
- `AGENTS.md` — This file

Keep documentation updated when making architectural changes.

---

## 🔑 Key File References

| File | Purpose |
|------|---------|
| `backend/src/index.ts` | Express server entry point — all routes registered here |
| `backend/src/config/env.ts` | Environment variable configuration |
| `backend/src/config/database.ts` | Prisma client singleton |
| `backend/prisma/schema.prisma` | Database schema definition |
| `backend/src/middleware/auth.ts` | JWT authentication middleware |
| `backend/src/middleware/authorization.ts` | Role-based and resource-level authorization |
| `backend/src/middleware/validate.ts` | Zod validation schemas |
| `backend/src/routes/` | All API route handlers |
| `backend/src/services/` | All business logic services |
| `frontend/src/app/layout.tsx` | Root layout with providers |
| `frontend/src/store/auth-provider.tsx` | Auth context and state management |
| `frontend/src/services/api.ts` | HTTP client with token refresh |
| `frontend/src/components/layout/sidebar.tsx` | Navigation sidebar with role-based menu |
| `frontend/src/components/layout/header.tsx` | Top bar with notifications and user menu |
| `frontend/src/lib/utils.ts` | Utility functions (formatting, dates) |
| `frontend/src/types/index.ts` | Frontend TypeScript type definitions |
