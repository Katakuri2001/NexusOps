# NexusOps — Upgrade & Improvement Roadmap

> A comprehensive plan for upgrading the NexusOps platform across multiple dimensions: performance, security, features, developer experience, and architecture.

---

## 🚀 Priority 1: Critical Infrastructure & Security Upgrades

### 1. Environment Variable Validation (Immediate)
**Why**: The app currently starts without validating required configuration, leading to silent runtime failures.

**What to do**:
- Replace manual `env` object construction with `envSchema.parse(process.env)` in `backend/src/config/env.ts`
- Add a startup validation middleware in `backend/src/index.ts` that fails fast if `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` are missing or invalid
- Add `.env.example` validation to the `npm run dev` script

**Impact**: Prevents production outages caused by missing configuration.

---

### 2. Environment-Specific Configuration (Immediate)
**Why**: `backend/.env.example` and `.env.example` at root have inconsistent formats. The `backend/src/config/env.ts` has hardcoded fallback secrets (`'dev-secret-min-32-chars-here-change-me'`) that are insecure.

**What to do**:
- Remove all hardcoded fallback secrets from `env.ts`
- Make `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` required with no defaults
- Create separate `.env.development`, `.env.staging`, `.env.production` files
- Add a `NODE_ENV` check that throws an error if running in production without proper secrets

**Impact**: Eliminates the risk of deploying with weak or default credentials.

---

### 3. JWT Refresh Token Rotation & Revocation (High Priority)
**Why**: Current refresh tokens never expire or get revoked. A stolen refresh token gives indefinite access.

**What to do**:
- Implement refresh token rotation (issue a new refresh token with each access token refresh)
- Add a `refreshToken` table or field to `User` model to track valid tokens
- Add token revocation on logout and password change
- Implement token binding (tie refresh tokens to IP/user-agent)
- Add `refreshTokenExpiry` (7d is fine) but make tokens single-use

**Impact**: Significantly reduces the blast radius of compromised tokens.

---

### 4. Database Connection Pooling & Error Handling (High Priority)
**Why**: The current `database.ts` uses a simple singleton but has no connection pool configuration. Prisma's default pool may not be optimized for production loads.

**What to do**:
- Add `datasources.db.url` with connection pool settings
- Configure Prisma with `datasource.url` from env and add `__experimental_connectionLimit` or use connection string parameters
- Add `Prisma.PrismaClientKnownRequestError` handling in `errorHandler.ts`
- Add `Prisma.PrismaClientRustPanicError` handling
- Add circuit breaker pattern for database failures

**Impact**: Prevents database connection exhaustion and provides meaningful error messages.

---

## 🔒 Priority 2: Security Hardening

### 5. CORS Configuration Tightening
**Why**: The current CORS config uses `env.FRONTEND_URL.split(',')` which allows any comma-separated list of origins. In production, this should be strict.

**What to do**:
- Validate that `FRONTEND_URL` matches a known list of allowed origins
- Disable CORS entirely in production if not needed (use a reverse proxy)
- Add `cors` middleware that only allows specific HTTP methods
- Remove `credentials: true` if not strictly needed

**Impact**: Prevents CSRF and unauthorized cross-origin requests.

---

### 6. SQL Injection & Input Sanitization
**Why**: While Prisma ORM prevents most SQL injection, the `require()` usage and dynamic queries could still be vulnerable.

**What to do**:
- Replace all `require()` calls with ES module imports
- Add Zod validation to ALL route parameters (not just body)
- Validate `req.params.id` is a valid UUID format before querying
- Add query sanitization for all string inputs passed to `prisma.*.findMany`, `findUnique`, etc.

**Impact**: Eliminates potential injection vectors.

---

### 7. Rate Limiting Expansion
**Why**: Currently only `POST /api/auth/login` has a dedicated rate limiter. Other critical endpoints are unprotected.

**What to do**:
- Add rate limiting to `/api/auth/refresh`, `/api/auth/change-password`
- Add per-user rate limiting for write operations (POST, PUT, PATCH, DELETE)
- Add IP-based rate limiting for all API routes
- Implement sliding window rate limiting instead of fixed window
- Add rate limit headers to all responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)

**Impact**: Prevents brute-force attacks and API abuse.

---

### 8. Helmet Security Headers Enhancement
**Why**: `helmet()` is enabled but may not be configured with the most restrictive settings.

**What to do**:
- Configure `helmet.contentSecurityPolicy()` with strict directives
- Enable `helmet.hsts()` for HTTPS enforcement
- Add `helmet.crossOriginResourcePolicy()` to prevent unauthorized resource loading
- Add `helmet.referrerPolicy()` to control referrer information
- Audit all security headers with a tool like securityheaders.com

**Impact**: Hardens the application against various web vulnerabilities.

---

## ⚡ Priority 3: Performance Optimization

### 9. Prisma Query Optimization
**Why**: Several service methods fetch excessive data. For example, `getAll()` in `WebsiteService` fetches all relations including nested `customer.user`, `notifications`, `technicianAssignments`, etc.

**What to do**:
- Implement selective `include` based on user role
- Add pagination (`skip`/`take`) to all `findMany` queries
- Use `select` instead of `include` when only specific fields are needed
- Add database indexes for frequently queried fields (`status`, `customerId`, `websiteId`)
- Implement cursor-based pagination instead of offset-based for large datasets
- Add `@@index` directives in `schema.prisma` for common query patterns

**Impact**: Reduces query times from seconds to milliseconds as data grows.

---

### 10. API Response Caching
**Why**: Every API request hits the database, even for frequently accessed data like website lists and dashboard stats.

**What to do**:
- Implement Redis-based caching for:
  - Dashboard stats (cache for 30-60 seconds)
  - Website lists (cache per user role, invalidate on mutations)
  - Notification counts (cache for 15 seconds)
- Add `Cache-Control` headers to all GET responses
- Implement ETag-based conditional responses
- Add a `X-Cache-Status` header (`HIT`, `MISS`, `STALE`) for debugging

**Impact**: Reduces database load by 70%+ for read-heavy workloads.

---

### 11. Frontend Bundle Optimization
**Why**: The frontend includes heavy libraries (framer-motion, lucide-react, etc.) that may not be tree-shaken properly.

**What to do**:
- Run `npx next analyze` to identify bundle size contributors
- Replace `lucide-react` with targeted imports (e.g., `import { Globe } from 'lucide-react'` instead of importing all icons)
- Lazy-load heavy components (dialogs, command palette) using `next/dynamic`
- Add `next/image` optimization for any images
- Implement code splitting by route with `React.lazy()`
- Add bundle size budget in `package.json`

**Impact**: Reduces initial page load time by 40-60%.

---

### 12. Frontend Data Fetching Optimization
**Why**: Currently, multiple `useEffect` hooks trigger separate API calls on each page load, creating waterfall requests.

**What to do**:
- Implement React Query (TanStack Query) or SWR for data fetching
- Add automatic retry with exponential backoff
- Add request deduplication (same request within 1 second = one network call)
- Implement optimistic updates for mutations
- Add `Suspense` boundaries for loading states
- Replace manual loading states with `useTransition` for non-blocking updates

**Impact**: Faster perceived performance, fewer loading spinners, better user experience.

---

## 🏗️ Priority 4: Architecture Improvements

### 13. Shared Types Between Frontend and Backend
**Why**: The `shared/types/` directory exists but is empty. Currently, frontend and backend have duplicate type definitions.

**What to do**:
- Move shared interfaces (`User`, `Website`, `Customer`, `Notification`, `Plan`, etc.) to `shared/types/`
- Use `npm workspaces` or `pnpm workspaces` to make `shared` a workspace package
- Both frontend and backend import types from `@nexusops/shared`
- Generate TypeScript types from the Prisma schema using `prisma-generator-ts`

**Impact**: Eliminates type mismatches and reduces maintenance overhead.

---

### 14. API Versioning
**Why**: No API versioning exists. Future changes to the API will break existing clients.

**What to do**:
- Add URL prefix `/api/v1/` to all routes
- Add `Accept: application/vnd.nexusops.v1+json` header support
- Create a deprecation policy for old versions
- Add OpenAPI/Swagger documentation using `@apidevtools/swagger-express-mw` or `fast-glob` + `swagger-jsdoc`
- Generate client SDK from the OpenAPI spec

**Impact**: Enables backward-compatible API evolution.

---

### 15. Microservices Readiness
**Why**: The current monolithic backend bundles all concerns (auth, CRUD, billing, notifications). As the platform grows, this becomes a bottleneck.

**What to do**:
- Extract authentication into a separate `auth-service` module
- Create a `notification-service` microservice that could later support email/SMS
- Implement an event bus (using Redis Pub/Sub or NATS) for cross-service communication
- Add message queue (RabbitMQ or Bull) for async operations (email sending, report generation)
- Containerize each service with Docker for independent deployment

**Impact**: Enables horizontal scaling of individual components.

---

### 16. Real-Time Features via WebSocket
**Why**: The README lists "No real-time WebSocket updates" as a known limitation. Currently, users must refresh to see status changes.

**What to do**:
- Integrate `socket.io` or `ws` library into the backend
- Emit events for: status changes, new notifications, maintenance updates, billing events
- Create a `WebSocketManager` service to handle connections per user
- Add `NotificationService` real-time subscription for customers
- Implement Socket.IO adapter for Redis in production for multi-server support
- Frontend: Create a `useWebSocket` hook that reconnects automatically

**Impact**: Users see updates in real-time without manual refresh.

---

## 📋 Priority 5: Feature Enhancements

### 17. Automated Website Monitoring
**Why**: Currently, status updates are manual. There's no automated uptime or health checking.

**What to do**:
- Add a `WebsiteMonitor` service that periodically checks website availability:
  - HTTP HEAD request to the website domain
  - SSL certificate expiration check
  - DNS resolution check
  - Response time measurement
- Store results in `website_status_history` automatically
- Trigger status changes (OPERATIONAL → ATTENTION_REQUIRED) based on failed checks
- Add a cron job or scheduled task (using `node-cron` or `bull`) to run checks every 5 minutes
- Add a `monitoring_config` table to allow per-website monitoring settings

**Impact**: Transforms the platform from a manual operations tool to an automated monitoring system.

---

### 18. Email/SMS Notification Delivery
**Why**: Currently notifications are in-app only. Users don't receive alerts outside the dashboard.

**What to do**:
- Integrate an email service:
  - Use `nodemailer` or `resend` (API-based)
  - Add email templates for maintenance alerts, billing reminders, status changes
  - Store sent emails in `notification_history` table
- Integrate SMS:
  - Use `twilio` or `vonage` for SMS delivery
  - Add `phone` field validation on Customer model
  - Add a `NotificationPreference` model to let users choose delivery channels
- Add a `NotificationDelivery` service that handles retry logic for failed deliveries
- Add webhook support for third-party integrations (Slack, Discord, PagerDuty)

**Impact**: Users receive critical alerts outside the dashboard, reducing response time.

---

### 19. Automated Billing & Invoicing
**Why**: Currently, billing is tracked but no invoices are generated automatically.

**What to do**:
- Add a `BillingCycle` model to track invoice periods
- Create automated invoice generation on schedule (monthly based on plan + service costs)
- Integrate with a payment gateway (Stripe, Paddle) for automatic charges
- Add `Invoice` model with fields: `invoiceNumber`, `status`, `total`, `dueDate`, `paidAt`
- Generate PDF invoices using `pdfkit` or `puppeteer`
- Add email delivery of invoices
- Create a billing dashboard showing invoice history and payment status

**Impact**: Eliminates manual billing processes and reduces revenue leakage.

---

### 20. User Dashboard for Customers (Enhancement)
**Why**: Customers can view websites and notifications but lack some essential features.

**What to do**:
- Add a "Request Maintenance" button on the customer website detail page
- Add a "View Billing History" page with downloadable invoices
- Add a "Contact Support" feature (integrated with notifications)
- Add a "Website Health Score" summary (combining uptime, status, and upcoming due dates)
- Add a comparison view showing websites side-by-side
- Add a "Share" feature for customers to grant temporary access to stakeholders

**Impact**: Makes the customer portal more self-service and reduces support tickets.

---

## 🧪 Priority 6: Developer Experience & Testing

### 21. Comprehensive Test Suite
**Why**: Zero tests exist. Every change is risky and untested.

**What to do**:
- Add **Vitest** as the test runner (fast, Vite-native, works with TypeScript)
- Write tests in this order:
  1. **Unit tests** for services (`AuthService`, `WebsiteService`, `NotificationService`)
  2. **Integration tests** for routes (using `supertest` or `node:test`)
  3. **E2E tests** using **Playwright** for critical user flows
  4. **Frontend tests** using **React Testing Library** + Vitest
- Target: 80% code coverage
- Add CI/CD integration (GitHub Actions) that runs tests on every PR
- Add snapshot testing for components
- Add API contract tests to ensure frontend/backend contract compatibility

**Impact**: Enables safe refactoring and catches regressions before production.

---

### 22. CI/CD Pipeline
**Why**: Deployment is manual. There's no automated testing, building, or deployment pipeline.

**What to do**:
- Create `.github/workflows/ci.yml` with:
  - Linting (`eslint`)
  - Type checking (`tsc --noEmit`)
  - Unit tests
  - Build (`npx tsc` for backend, `next build` for frontend)
  - Prisma migration check
- Create `.github/workflows/deploy.yml` with:
  - Deploy backend to Railway on main branch push
  - Deploy frontend to Cloudflare Pages on main branch push
- Add preview deployments for pull requests
- Add automatic database migrations on deploy
- Add rollback capability

**Impact**: Zero-touch deployment, instant feedback on code quality.

---

### 23. ESLint & Prettier Configuration
**Why**: No `.eslintrc` or `.prettierrc` files exist. Code style is inconsistent across the codebase.

**What to do**:
- Add `.eslintrc.json` with `next/core-webpack-types` rules
- Add `.prettierrc` with consistent formatting
- Add `.editorconfig` for IDE consistency
- Add lint-staged and husky for pre-commit hooks
- Run `npx eslint --fix` on all existing files
- Add `@typescript-eslint` rules for strict type checking

**Impact**: Consistent code quality and automatic formatting on every commit.

---

### 24. API Documentation (OpenAPI/Swagger)
**Why**: The README has an endpoint table, but it's not machine-readable and quickly gets out of date.

**What to do**:
- Integrate `swagger-express-mw` or `@nestjs/swagger` equivalent for Express
- Add JSDoc comments to all route handlers and service methods
- Generate OpenAPI 3.0 spec automatically
- Serve Swagger UI at `/api/docs` in development
- Add a documentation website (using Docusaurus or Nextra)
- Generate TypeScript client SDK from the OpenAPI spec

**Impact**: Self-documenting API, easier onboarding for new developers.

---

## 🎨 Priority 7: User Experience Enhancements

### 25. Accessibility (a11y) Improvements
**Why**: The current UI has no accessibility audit. Many interactive elements lack proper ARIA attributes.

**What to do**:
- Add `aria-label` to all icon buttons
- Add `role="navigation"` to sidebar
- Add keyboard navigation support (Tab, Enter, Escape)
- Add focus management for modals and dialogs
- Add skip-to-content link
- Ensure color contrast meets WCAG AA standards
- Add `aria-live` regions for dynamic content (notifications, toast messages)
- Test with screen reader (NVDA/VoiceOver)
- Run `npx eslint-plugin-jsx-a11y` or `@radix-ui/react-alert-dialog`

**Impact**: Makes the platform accessible to all users, including those with disabilities.

---

### 26. Error Boundary & Global Error Handling (Frontend)
**Why**: Frontend has no global error handling. A JavaScript error in one component could crash the entire app.

**What to do**:
- Add React Error Boundary component wrapping the app
- Add `window.onerror` and `window.onunhandledrejection` handlers
- Create a `toast.error` fallback for uncaught exceptions
- Add a global error page (`<ErrorPage>`) for 404 and 500 states
- Integrate with a frontend error tracking service (Sentry, LogRocket)
- Add user feedback button on error pages ("Report this issue")

**Impact**: Prevents complete app crashes and provides better error reporting.

---

### 27. Dark Mode & Theme System
**Why**: The current CSS has `dark` class on the `<html>` element but there's no theme toggle or system preference detection.

**What to do**:
- Add a `useTheme` hook that detects system preference (`prefers-color-scheme`)
- Add a theme toggle button in the header
- Store theme preference in `localStorage`
- Add `next-themes` package or custom CSS variables for both themes
- Ensure all components work correctly in both light and dark modes
- Add `data-theme` attribute to `<html>` for CSS targeting

**Impact**: Better user experience for users who prefer dark mode.

---

### 28. Responsive Design Polish
**Why**: The sidebar is hidden on mobile (`lg:hidden`), but the overall layout may not be fully responsive.

**What to do**:
- Add mobile-specific navigation (bottom tab bar for key sections)
- Ensure all tables are horizontally scrollable on mobile
- Add touch-friendly tap targets (minimum 44x44px)
- Test on various screen sizes (320px, 768px, 1024px, 1440px)
- Add `@media` queries for common breakpoints
- Optimize the command palette for mobile (full-screen modal instead of centered)

**Impact**: Fully responsive experience across all devices.

---

## 📊 Priority 8: Analytics & Observability

### 29. Application Monitoring
**Why**: No observability exists. If the backend goes down, nobody knows until a customer reports it.

**What to do**:
- Add `pino` or `winston` for structured logging
- Integrate with a log aggregation service (Datadog, Grafana Loki, or Better Stack)
- Add APM (Application Performance Monitoring) using OpenTelemetry
- Add uptime monitoring (UptimeRobot or Heartbeat)
- Set up alerts for:
  - API error rate > 5%
  - Response time > 2 seconds
  - Database connection pool exhaustion
  - Unhandled exceptions
- Add a `/api/health` endpoint with database connectivity check (already exists but basic)

**Impact**: Proactive issue detection before customers are affected.

---

### 30. Usage Analytics & Telemetry
**Why**: No data on how users interact with the platform exists.

**What to do**:
- Add event tracking for key actions (website created, maintenance completed, payment made)
- Track feature usage (most visited pages, most used features)
- Track performance metrics (page load times, API response times)
- Add a `/api/analytics` endpoint (owner-only) for platform-wide statistics
- Use an analytics library (PostHog, Mixpanel, or self-hosted Plausible)
- Add conversion funnel tracking (signup → website created → billing)

**Impact**: Data-driven decisions for feature prioritization and UX improvements.

---

## 📦 Priority 9: DevOps & Infrastructure

### 31. Docker Containerization
**Why**: Current deployment relies on Railway's Nixpacks, which offers limited control.

**What to do**:
- Create `Dockerfile` for backend:
  ```dockerfile
  FROM node:22-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  RUN npx prisma generate
  RUN npx prisma db push
  CMD ["node", "dist/index.js"]
  ```
- Create `Dockerfile` for frontend
- Create `docker-compose.yml` for local development with PostgreSQL
- Add `.dockerignore` for optimized builds
- Set up multi-stage builds for both frontend and backend

**Impact**: Consistent deployment across all environments, easier local development.

---

### 32. Database Migrations & Version Control
**Why**: Currently using `prisma db push` which doesn't maintain a migration history. Schema changes are not tracked.

**What to do**:
- Switch from `prisma db push` to `prisma migrate dev` for development
- Create migration files for every schema change
- Use `prisma migrate deploy` for production
- Add a migration rollback strategy
- Store migrations in version control
- Add a `DATABASE_URL` check that prevents `db push` in production

**Impact**: Full audit trail of database changes, safe rollbacks.

---

### 33. Backup & Disaster Recovery
**Why**: No backup strategy exists. A database failure could result in complete data loss.

**What to do**:
- Configure automatic PostgreSQL backups (daily snapshots)
- Add backup retention policy (7 daily, 4 weekly, 12 monthly)
- Test backup restoration regularly
- Add a `/api/admin/backup` endpoint (owner-only) to trigger manual backups
- Store backups in a geographically separate location
- Add a disaster recovery plan document

**Impact**: Data safety and business continuity.

---

## 🔄 Priority 10: Maintenance & Cleanup

### 34. Dependency Updates
**Why**: The project has many dependencies that need regular updates for security patches.

**What to do**:
- Add `npm-check-updates` to the workflow
- Set up Dependabot or Renovate for automatic PRs
- Audit all dependencies (`npm audit`) and fix vulnerabilities
- Remove unused dependencies (check all imports)
- Pin exact versions in production (`package-lock.json` is already committed)

**Impact**: Security patches and latest features delivered automatically.

---

### 35. Code Cleanup & Technical Debt
**Why**: The codebase has accumulated technical debt (inline `require()`, unused imports, inconsistent patterns).

**What to do**:
- Replace all `require()` calls with ES module imports
- Remove unused imports and variables (run `eslint --fix`)
- Standardize error handling across all routes (try-catch pattern)
- Extract duplicate logic (e.g., `const { prisma } = require(...)`) into a shared utility
- Add consistent JSDoc comments to all public functions
- Create a `types` utility for `Request` augmentation instead of `any` types
- Remove `any` types and replace with proper TypeScript types

**Impact**: Cleaner, more maintainable codebase.

---

### 36. Documentation Improvements
**Why**: README is good but needs updating as features evolve.

**What to do**:
- Add `ARCHITECTURE.md` explaining the data flow and module responsibilities
- Add `CONTRIBUTING.md` with setup instructions and coding standards
- Add `DEPLOYMENT.md` with step-by-step deployment guide for Railway and Cloudflare
- Add inline code documentation for complex business logic
- Create API documentation in `/docs` folder or on a website
- Add a `CHANGELOG.md` to track version releases

**Impact**: Better onboarding for new contributors and maintainers.

---

## 📅 Suggested Timeline

| Phase | Timeline | Focus |
|-------|----------|-------|
| **Phase 1** | Week 1-2 | Security hardening, env validation, error handling |
| **Phase 2** | Week 3-4 | Performance (caching, query optimization), shared types |
| **Phase 3** | Week 5-6 | Testing, CI/CD, developer experience |
| **Phase 4** | Week 7-8 | Feature additions (monitoring, notifications, billing) |
| **Phase 5** | Week 9-10 | Real-time features, architecture improvements |
| **Phase 6** | Week 11-12 | UX polish, accessibility, responsive design |
| **Phase 7** | Ongoing | Monitoring, analytics, maintenance |

---

## 🛠️ Recommended Tools

| Category | Tool | Purpose |
|----------|------|---------|
| Testing | Vitest | Fast TypeScript test runner |
| E2E Testing | Playwright | Browser automation |
| Frontend State | TanStack Query | Data fetching and caching |
| Real-Time | Socket.io | WebSocket communication |
| Monitoring | Sentry + Grafana | Error tracking and APM |
| Logging | Pino | Structured logging |
| Email | Resend | Transactional email API |
| SMS | Twilio | SMS delivery |
| CI/CD | GitHub Actions | Automated pipelines |
| Containerization | Docker + Docker Compose | Local dev and deployment |
| Documentation | Docusaurus | Static docs site |
| Analytics | PostHog | Product analytics |
| Type Sharing | pnpm workspaces | Shared TypeScript types |
| Linting | ESLint + Prettier + Husky | Code quality |
| Bundles | Turbopack / Vite | Faster builds |
| Database | Neon / Supabase | Managed PostgreSQL |
| Secret Management | HashiCorp Vault / Doppler | Secret management |
| Feature Flags | Unleash | Gradual rollouts |

---

## 💰 Estimated Impact Summary

| Category | Improvement |
|----------|------------|
| **Performance** | 60-70% faster API responses with caching, 40-60% smaller frontend bundles |
| **Security** | Eliminate all critical vulnerabilities, add token rotation, input validation |
| **Reliability** | 99.9% uptime with monitoring, automated backups, error boundaries |
| **Developer Experience** | Zero manual deployment, instant test feedback, shared types |
| **User Experience** | Real-time updates, dark mode, mobile-friendly, accessible |
| **Business Value** | Automated billing, email/SMS alerts, monitoring = new revenue streams |
