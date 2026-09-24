# NexusOps — Bug Checklist

> **Status**: Found but NOT fixed. This is a comprehensive inventory of bugs, inconsistencies, and potential issues discovered during codebase inspection.

---

## 🔴 Critical Bugs

### BUG-001: Environment Validation is Completely Bypassed
**File**: `backend/src/config/env.ts`
**Severity**: Critical

The Zod schema (`envSchema`) is defined but **never used**. The `env` object is constructed by directly reading `process.env` without calling `.parse()` or `.safeParse()`. This means:
- Missing required variables (like `DATABASE_URL`) won't throw errors — they'll silently use empty strings
- Invalid types won't be caught
- The app will start even with broken configuration

**Fix needed**: Replace manual `env` object construction with `envSchema.parse(process.env)` or `envSchema.safeParse(process.env)`.

---

### BUG-002: Routing Conflict — Charge Routes and Billing Routes Both Mounted at `/api/billing`
**File**: `backend/src/index.ts` (lines 50-51)
**Severity**: Critical

```ts
app.use('/api/billing', chargeRoutes);
app.use('/api/billing', billingRoutes);
```

Both `chargeRoutes` and `billingRoutes` are mounted at the same `/api/billing` prefix. While Express does technically allow this (route-specific paths differ: `/upcoming` vs `/due-dates`), this creates confusion and potential conflicts. The README references `GET /api/billing/due-dates` but `chargeRoutes` has `GET /upcoming` at the same prefix.

**Fix needed**: Mount `chargeRoutes` at `/api/charges` or rename/reorganize the route prefixes to be unambiguous.

---

### BUG-003: Prisma Client Singleton Not Used in Seed Script
**File**: `backend/src/utils/seed.ts`
**Severity**: Critical

The seed script creates a **new `PrismaClient()` instance** directly instead of using the singleton pattern from `database.ts`. The `database.ts` uses a `globalThis` pattern to prevent connection leaks in development, but the seed bypasses this entirely.

```ts
// seed.ts line 4
const prisma = new PrismaClient();  // Bypasses singleton
```

Additionally, `seed.ts` calls `prisma.$disconnect()` in `.finally()` but if an error occurs before `main()` completes, the disconnect may not work correctly.

**Fix needed**: Import `prisma` from `../config/database` instead of creating a new instance.

---

### BUG-004: No Environment Variable Validation on Startup
**File**: `backend/src/index.ts`
**Severity**: Critical

The Express server starts without validating that required environment variables are set. If `DATABASE_URL` is empty or `JWT_ACCESS_SECRET` is too short, the app will start but fail at runtime (database connection errors, JWT signing failures) instead of failing fast on startup.

**Fix needed**: Call `envSchema.parse(process.env)` before starting the server, or add a startup validation check.

---

## 🟠 High Severity Bugs

### BUG-005: `getAll()` Website Method Returns ALL Websites Without Role Filtering
**File**: `backend/src/services/website.service.ts` (line 42-54)
**Severity**: High

`WebsiteService.getAll()` fetches **all websites** from the database with no filtering. The route handler checks the role before calling this, but the service itself has no guard. If called directly (e.g., from a future endpoint or test), it could leak all customer data.

**Fix needed**: Either add a `role` and `userId` parameter to `getAll()`, or document that it must only be called after authorization checks.

---

### BUG-006: `authorizeResource` Does Not Protect All Website Routes
**File**: `backend/src/routes/website.routes.ts`
**Severity**: High

The `PATCH /:id/status` route uses `authorizeResource('website')` but does **not** use `requirePermission`. Any authenticated technician assigned to a website can change its status (e.g., mark it OFFLINE) without needing a specific permission like `EDIT_STATUS`. This could be abused by a technician with limited permissions.

**Fix needed**: Add `requirePermission('CHANGE_STATUS')` or similar to the status update route.

---

### BUG-007: Customer and Technician Routes Are Owner-Only — Customers Cannot Access Their Own Data
**File**: `backend/src/routes/customer.routes.ts` (line 9-10), `backend/src/routes/technician.routes.ts` (line 9-10)
**Severity**: High

Both `customerRoutes` and `technicianRoutes` use `router.use(authorize('OWNER'))`, meaning **only owners** can access these routes. Customers cannot view/edit their own profile or billing, and technicians cannot view their own assignments through these routes.

While the frontend may handle this differently (customers see their data through `api.getMe()` and related endpoints), the backend routes are completely locked down to owners.

**Fix needed**: Either add customer/technician access to their own routes, or ensure all customer/technician data is accessible through other properly authorized endpoints.

---

### BUG-008: Inconsistent `require` Usage Instead of Named Imports
**File**: `backend/src/routes/website.routes.ts` (lines 23, 208, 262, 276, 302, 331), `backend/src/routes/auth.routes.ts` (lines 49, 77)
**Severity**: High

Multiple route handlers use `const { prisma } = require('../config/database')` inside the handler function instead of importing `prisma` at the top of the file. This:
- Breaks tree-shaking
- Creates a performance hit on every request
- Is inconsistent with other files that use `import { prisma } from '../config/database'`
- Can cause issues with module resolution in some bundler configurations

**Fix needed**: Replace all inline `require()` calls with top-level `import` statements.

---

### BUG-009: Notification System Has No `websiteId` Requirement
**File**: `backend/prisma/schema.prisma` (line 223), `backend/src/services/notification.service.ts`
**Severity**: High

The `Notification` model has `websiteId` as optional (`String?`), and the `NotificationService.create()` method accepts `websiteId` as optional. This means notifications can be created without being linked to any website, making it impossible to query notifications by website context.

Additionally, in `website.routes.ts` line 309-312, when creating a notification for a website, the code passes `websiteId` to `NotificationService.create()`, but the service doesn't validate that the website exists before creating the notification.

**Fix needed**: Make `websiteId` required in the Notification model, or at minimum validate it in the service layer.

---

### BUG-010: Prisma `JSON` Fields Stored as Strings — Serialization Fragility
**File**: `backend/prisma/schema.prisma`, multiple services
**Severity**: High

Several fields store JSON as strings:
- `Plan.features: String @default("[]")` — stored as JSON string
- `MaintenanceRecord.items: String @default("[]")` — stored as JSON string
- `ActivityLog.metadata: String?` — stored as JSON string
- `TechnicianWebsiteAssignment` — no JSON fields

Services use `JSON.stringify()` before writing and `JSON.parse()` when reading. But Prisma's default behavior may return these as already-parsed objects or as strings depending on the database driver version. This creates a fragile double-parsing situation:

```ts
// maintenance.service.ts line 19
items: JSON.stringify(data.items),  // Array → String
// ...
// Then later:
items: JSON.parse(record.items || '[]'),  // String → Array
```

If Prisma auto-parses JSON strings, this will double-stringify the data.

**Fix needed**: Use Prisma's native `Json` type or ensure consistent handling. Add `@db.Json` or use Prisma's `Json` scalar type.

---

### BUG-011: Frontend `useParams()` Returns Promise in Next.js 16
**File**: Multiple frontend pages (`dashboard/websites/[id]/page.tsx`, `admin/websites/[id]/page.tsx`, etc.)
**Severity**: High

In Next.js 16 App Router, `useParams()` may return a `Promise<{ id: string }>` instead of a direct object. All pages use `params.id as string` without awaiting:

```ts
const params = useParams();
// ...
api.getWebsite(params.id as string)  // params.id may be a Promise
```

This could cause API calls to fail silently or make requests to `/api/websites/[object%20Promise]` instead of the actual ID.

**Fix needed**: Await `useParams()`: `const params = await useParams()`, or check Next.js 16 documentation for the correct usage pattern.

---

### BUG-012: Frontend `api.ts` 401 Refresh Logic Has Race Condition
**File**: `frontend/src/services/api.ts` (lines 47-74)
**Severity**: High

When a 401 is received and the refresh token request succeeds but the retry fails, the code throws an error **after** potentially having already updated the tokens and headers. Additionally, if multiple requests fail simultaneously, each will try to refresh the token independently, causing multiple refresh requests.

**Fix needed**: Implement a token refresh queue/lock mechanism to prevent concurrent refresh attempts.

---

## 🟡 Medium Severity Issues

### BUG-013: No Input Validation on Login Route
**File**: `backend/src/routes/auth.routes.ts` (line 10-14)
**Severity**: Medium

The `/api/auth/login` route checks `if (!email || !password)` but does not use Zod validation (`validateBody`). This means:
- Email format is not validated
- Empty strings pass the check (since `""` is falsy, this actually works, but `null` and `undefined` would bypass)
- No rate limiting on the refresh endpoint
- The `changePasswordSchema` is defined but never used — the route manually checks `newPassword.length < 8` instead of using `validateBody(changePasswordSchema)`

**Fix needed**: Add `validateBody` middleware to login and change-password routes.

---

### BUG-014: `getDashboardStats()` Inefficient Customer Counting
**File**: `backend/src/services/activity.service.ts` (lines 78-83)
**Severity**: Medium

```ts
const users = await prisma.user.findMany({
  where: { role: 'CUSTOMER' },
  include: { customer: true },
});
const activeCustomers = users.filter(u => u.isActive && u.customer).length;
```

This fetches ALL customer users with their customer profiles, then filters in JavaScript. Since `Customer` has a one-to-one relationship with `User` via `userId`, `u.customer` should always exist. This means `activeCustomers` will always equal `totalCustomers` if all customers are active, or always equal the count of active users with customer profiles. The `activeCustomers` metric is likely redundant.

**Fix needed**: Use `prisma.customer.count({ where: { user: { isActive: true } } })` instead.

---

### BUG-015: `updateWebsiteSchema` Allows `customerId` to Be Changed
**File**: `backend/src/middleware/validate.ts` (line 14-22), `backend/src/routes/website.routes.ts` (line 85)
**Severity**: Medium

`updateWebsiteSchema` does NOT include `customerId`, which is good. However, `WebsiteService.update()` (line 141) passes `req.body` directly to `prisma.website.update()`, which means if a client sends an extra `customerId` field, it could be included in the update despite the schema validation. The `validateBody` middleware sanitizes `req.body` to only include schema-defined fields, so this should be handled — but the route handler passes `req.body` after validation, which should be clean.

Actually, looking more carefully, `validateBody` replaces `req.body` with `result.data`, so extra fields are stripped. This is fine, but it's worth noting that `updateWebsiteSchema` doesn't include `customerId` explicitly, so it's protected.

**Verdict**: Not actually a bug — the validation middleware handles this.

---

### BUG-016: `createCustomerSchema` Missing `role` Validation, But `UserService.createCustomer` Hardcodes It
**File**: `backend/src/middleware/validate.ts` (line 24-31), `backend/src/services/user.service.ts` (line 13-18)
**Severity**: Medium

The `createCustomerSchema` validates email, password, name, phone, company, address but does not include `role`. The `UserService.createCustomer` hardcodes `role: 'CUSTOMER'`. This is correct behavior but the schema could be more explicit about what it accepts.

**Verdict**: Not a bug — the role is correctly hardcoded server-side.

---

### BUG-017: Missing `app.use('/api/charges')` Route Registration
**File**: `backend/src/index.ts`
**Severity**: Medium

The `chargeRoutes` has endpoints like `GET /upcoming`, `GET /website/:websiteId`, `POST /website/:websiteId`, `PUT /:id`, `DELETE /:id`. These are mounted at `/api/billing` (not `/api/charges`). But the `website.routes.ts` has a route `GET /:id/charges` that calls `ChargeService.getByWebsite()`. The frontend calls `api.getWebsiteCharges(id)` which maps to `/api/websites/:id/charges`. This works, but the naming is inconsistent.

**Verdict**: Functional but confusing naming. The charge routes should probably be at `/api/charges` instead of `/api/billing`.

---

### BUG-018: `PrismaClientKnownRequestError` Not Handled in Error Handler
**File**: `backend/src/middleware/errorHandler.ts`
**Severity**: Medium

The error handler only checks for `ValidationError` and `UnauthorizedError`. Prisma-specific errors like `Prisma.PrismaClientKnownRequestError` (e.g., unique constraint violations on `User.email` or `Website.domain`) are not caught. A duplicate email during registration would return a generic 500 error instead of a meaningful "Email already registered" message.

**Fix needed**: Add Prisma error handling with specific error codes (P2002 for unique constraint violation, etc.).

---

### BUG-019: `getUnreadCount` for OWNER Returns All Unread Notifications
**File**: `backend/src/routes/notification.routes.ts` (line 54)
**Severity**: Medium

When an OWNER requests `/api/notifications/unread-count`, the backend returns `prisma.notification.count({ where: { isRead: false } })` which counts **ALL** unread notifications across **ALL** customers. This means the owner sees a combined unread count that includes notifications meant for specific customers. While this might be intentional, it could be misleading.

**Fix needed**: Clarify whether owner should see total unread count or per-customer breakdown.

---

### BUG-020: Frontend `api.ts` Does Not Handle Non-JSON Error Responses
**File**: `frontend/src/services/api.ts` (line 77)
**Severity**: Medium

```ts
const error = await res.json().catch(() => ({ error: 'Request failed' }));
throw new Error(error.error || `HTTP ${res.status}`);
```

If the server returns a non-JSON response (e.g., HTML error page from a proxy or CORS error), `res.json()` will throw and the `.catch()` will return `{ error: 'Request failed' }`. This loses the actual HTTP status code context.

**Fix needed**: Handle non-JSON responses more gracefully, or include the status code in the error message.

---

## 🔵 Low Severity Issues / Best Practices

### BUG-021: Hardcoded Weak Passwords in Seed Script
**File**: `backend/src/utils/seed.ts` (lines 9-11)
**Severity**: Low

```ts
const ownerPassword = await bcrypt.hash('admin123', 12);
const customerPassword = await bcrypt.hash('customer123', 12);
const techPassword = await bcrypt.hash('tech123', 12);
```

These are weak, well-known passwords. While the seed is for development only, these credentials are documented in the README and should never appear in any version-controlled code.

**Fix needed**: Remove from version control, generate random passwords, or make the seed require environment variables for credentials.

---

### BUG-022: No Automated Tests Anywhere in the Codebase
**File**: All directories
**Severity**: Low

There are no test files (`*.test.ts`, `*.spec.ts`), no `jest.config`, no `vitest.config`, no `__tests__` directories, and no testing scripts in any `package.json`. The `backend/package.json` has `db:generate`, `db:push`, `db:migrate`, `db:reset` but no `test` script.

**Fix needed**: Add a testing framework (Vitest recommended for TypeScript) and create test suites for critical paths.

---

### BUG-023: `shared/types/` Directory Is Empty
**File**: `shared/types/`
**Severity**: Low

The `shared/` directory exists specifically for shared types between frontend and backend, but `shared/types/` is empty. The frontend has its own `src/types/index.ts` and the backend has `src/types/index.ts`, but there's no shared type definition.

**Fix needed**: Move shared interfaces (User, Website, Customer, etc.) to `shared/types/` and import from there in both frontend and backend.

---

### BUG-024: `NEXT_PUBLIC_API_URL` Defaults to `localhost:3001` in Production
**File**: `frontend/src/services/api.ts` (line 1)
**Severity**: Low

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

If `NEXT_PUBLIC_API_URL` is not set, the frontend will try to call `http://localhost:3001`, which won't work in production. The `.env.example` shows `NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app` but it's easy to forget to set this.

**Fix needed**: Add a build-time validation or warning if `NEXT_PUBLIC_API_URL` is not set for production builds.

---

### BUG-025: `app.use('/api/auth/login', authLimiter)` Only Limits Login, Not Refresh
**File**: `backend/src/index.ts` (line 41)
**Severity**: Low

The `authLimiter` is applied only to `/api/auth/login`. The `/api/auth/refresh` endpoint has no rate limiting, which could allow brute-force attacks on refresh tokens.

**Fix needed**: Add `app.use('/api/auth/refresh', authLimiter)`.

---

### BUG-026: `changePasswordSchema` Not Used in `validate.ts` Import
**File**: `backend/src/middleware/validate.ts` (lines 88-91)
**Severity**: Low

`changePasswordSchema` is defined in `validate.ts` but the `change-password` route in `auth.routes.ts` doesn't use `validateBody(changePasswordSchema)`. Instead, it manually checks `newPassword.length < 8`. This is inconsistent.

**Fix needed**: Use `validateBody(changePasswordSchema)` in the change-password route.

---

### BUG-027: `authorizeResource` Returns 403 for TECHNICIAN on Customer/Tech Access
**File**: `backend/src/middleware/authorization.ts` (lines 64-66, 81-83)
**Severity**: Low

When a TECHNICIAN tries to access a customer resource, they get `"Technicians cannot access customer data directly"`. When a CUSTOMER tries to access a technician resource, they get `"Customers cannot access technician data"`. These are hardcoded error messages that could be more informative.

**Verdict**: Functional but not a bug.

---

### BUG-028: `WebsiteService.delete()` Does Not Cascade Delete Timeline Events Properly
**File**: `backend/src/services/website.service.ts` (line 151-153), `backend/prisma/schema.prisma`
**Severity**: Low

When `WebsiteService.delete()` is called, it calls `prisma.website.delete()`. Due to `onDelete: Cascade` on the schema, related records in `Plan`, `HostingService`, `DatabaseService`, `ServerService`, `AdditionalCharge`, `MaintenanceRecord`, `WebsiteStatusHistory`, `Notification`, `TechnicianWebsiteAssignment`, and `WebsiteTimeline` should be deleted. However, `ActivityLog` has `onDelete: SetNull` on its `user` relation, not on the website relation, so activity logs related to deleted websites might remain.

**Verdict**: Expected behavior — activity logs are kept for audit purposes.

---

### BUG-029: Frontend `formatRelativeTime` Shows Negative Values for Future Dates
**File**: `frontend/src/lib/utils.ts` (line 36)
**Severity**: Low

```ts
const diff = now.getTime() - target.getTime();
```

If `target` is a future date (e.g., a hosting due date 30 days from now), `diff` will be negative. The function will calculate negative minutes/hours/days and return incorrect labels like `-5d ago` instead of something like `in 5 days`.

**Fix needed**: Handle future dates differently, or use `Math.abs(diff)`.

---

### BUG-030: `getDueDateLabel` Returns `overdue` for `days === 0` (Due Today)
**File**: `frontend/src/lib/utils.ts` (line 62)
**Severity**: Low

```ts
if (days === 0) return { label: 'Due today', urgency: 'overdue' };
```

"Due today" is categorized as `overdue` urgency, which maps to `text-danger` color. This should probably be `warning` or `soon` since the item isn't actually overdue yet — it's due today.

**Fix needed**: Change the urgency for `days === 0` to `warning` or `soon`.

---

## 📋 Summary Statistics

| Severity | Count |
|----------|-------|
| 🔴 Critical | 4 |
| 🟠 High | 8 |
| 🟡 Medium | 7 |
| 🔵 Low | 9 |
| **Total** | **28** |

---

## ⚠️ Notes

- **All bugs are documented but NOT fixed** per the user's request.
- This checklist was generated by a thorough codebase inspection covering all backend services, routes, middleware, frontend pages, components, API clients, and configuration files.
- Some items may be intentional design decisions rather than actual bugs — please review each one in context before fixing.
- The `shared/types/` directory being empty may be intentional for future use.
- Some route naming inconsistencies may be resolved in future refactoring.
