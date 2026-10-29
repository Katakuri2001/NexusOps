# NexusOps — UI/UX Design Upgrade Blueprint

> A complete, exhaustive document of the current frontend design system, every page, component, interaction pattern, and the prioritized improvements needed for a professional design upgrade.  
> **Source of truth for any UI work on NexusOps.**  
> Stack: Next.js 16.3.4 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion 13 · Lucide React 1.38

---

## 1. Design Tokens (globals.css)

### 1.1 Color Palette (dark-first, CSS custom properties)
| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#09090b` | Page background |
| `surface` | `#0c0c0e` | Card/panel base |
| `elevated` | `#111113` | Elevated surfaces, inputs |
| `overlay` | `#16161a` | Hover overlays, badges |
| `border` | `#1c1c22` | Default borders |
| `border-subtle` | `#151519` | Subtle dividers |
| `border-hover` | `#27272f` | Hover borders |
| `foreground` | `#e4e4e7` | Primary text |
| `foreground-secondary` | `#a1a1aa` | Secondary text |
| `muted` | `#52525b` | Muted/placeholder text |
| `primary` | `#6366f1` (indigo) | Primary actions, links, focus |
| `primary-hover` | `#4f46e5` | Primary hover |
| `primary-light` | `#818cf8` | Light primary text |
| `primary-subtle` | `rgba(99,102,241,0.08)` | Primary subtle bg |
| `primary-glow` | `rgba(99,102,241,0.15)` | Glow effects |
| `success` | `#22c55e` | Success/healthy |
| `success-subtle` | `rgba(34,197,94,0.08)` | Success subtle bg |
| `warning` | `#f59e0b` | Warning/attention |
| `warning-subtle` | `rgba(245,158,11,0.08)` | Warning subtle bg |
| `danger` | `#ef4444` | Danger/error |
| `danger-subtle` | `rgba(239,68,68,0.08)` | Danger subtle bg |
| `info` | `#06b6d4` | Info |
| `info-subtle` | `rgba(6,182,212,0.08)` | Info subtle bg |

### 1.2 Typography
- **Font family**: Geist Sans (primary), Geist Mono (code) — via `--font-sans`/`--font-mono`
- **Sizes used**: `text-[10px]`, `text-xs` (12px), `text-sm` (14px), `text-base`, `text-lg` (18px), `text-xl` (20px), `text-2xl`
- **Weights**: `font-medium`, `font-semibold`, `font-bold`
- **Tracking**: `tracking-tight` on headings
- **Antialiasing**: `-webkit-font-smoothing: antialiased`

### 1.3 Spacing & Radius
- **Spacing scale**: Tailwind default (4px base) — `gap-1.5`, `gap-2`, `gap-3`, `gap-4`, `px-3`, `px-4`, `px-5`, `py-2`, `py-2.5`, `py-3`
- **Border radius**: `rounded` (4px), `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-full`
- **Card radius**: `rounded-xl` / `rounded-2xl` for major cards
- **Button height**: `h-8` (32px), `h-10` (40px), `h-11`

### 1.4 Shadows & Effects
- **Glass**: `.glass` (blur 16px), `.glass-strong` (blur 24px)
- **Gradient borders**: `.border-gradient` (indigo linear gradient mask)
- **Selection**: indigo 30% background
- **Scrollbar**: 5px width, `#27272a` thumb, `#3f3f46` hover
- **Focus ring**: 2px solid primary, 2px offset, 6px radius

### 1.5 Animations (globals.css + Framer Motion)
| Name | Duration | Usage |
|------|----------|-------|
| `fade-in` | 0.2s ease-out | Page/section entrance (translateY 4px) |
| `slide-in-right` | 0.15s ease-out | Slide entrance |
| `pulse-dot` | 2s infinite | Status dot pulse |
| `shimmer` | 1.5s infinite | Skeleton loading |
| Framer Motion | `StaggerList`/`StaggerItem` | Staggered list entrance |
| Reduced motion | respected via `@media (prefers-reduced-motion: reduce)` |

---

## 2. Layout Architecture

### 2.1 AppShell (`src/components/layout/app-shell.tsx`)
- Wraps all authenticated pages
- Provides sidebar + header + main content area
- Responsive: sidebar hidden on mobile (`lg:hidden`), hamburger menu
- Max content width with padding

### 2.2 Sidebar (`src/components/layout/sidebar.tsx`)
- **Role-based navigation groups**:
  - **OWNER**: Overview (Dashboard) · Management (Websites, Customers, Technicians) · Operations (Billing, Notifications, Activity, Profile)
  - **CUSTOMER**: Overview (Dashboard) · Portal (My Websites, Notifications, Billing, Profile)
  - **TECHNICIAN**: Overview (Dashboard) · Work (Assigned Websites, Maintenance, Activity, Profile)
- Active state: indigo subtle bg + primary text
- Command palette trigger (search icon)
- User info at bottom with logout
- Collapsible on mobile (overlay)

### 2.3 Header (`src/components/layout/header.tsx`)
- Hamburger menu (mobile)
- Search/command palette trigger (Cmd+K)
- Notification bell with unread count badge (polls every 60s)
- Notification dropdown (last 8, mark read, mark all read)
- User avatar menu (profile, logout)

### 2.4 Command Palette (`src/components/search/command-palette.tsx`)
- Global search across websites, customers, technicians
- Keyboard navigation (↑↓, Enter, Esc)
- Role-scoped results

---

## 3. Component Inventory

### 3.1 UI Primitives (`src/components/ui/`)
| Component | Variants/Props | Notes |
|-----------|---------------|-------|
| `Button` | `primary`, `secondary`, `ghost`, `danger`; `sm`/`md`/`lg`; `loading`, `icon`, `disabled` | Consistent height (h-8/h-10) |
| `Badge` / `StatusBadge` | `default`, `success`, `warning`, `danger`, `info`, `outline`; `sm`/`md`; `dot` | Auto-maps status strings to variants |
| `Card` | `Card`, `CardHeader`, `CardTitle`, `CardContent`; `padding` prop | Rounded-xl, border, elevated bg |
| `Dialog` | `Dialog`, `DialogHeader`, `DialogContent`, `DialogFooter` | Modal overlay, focus trap |
| `Input` | text/email/password/number/date; `error`, `label` | Consistent h-10 styling |
| `EmptyState` | `icon`, `title`, `description`, `action` | Centered, muted |
| `Skeleton` | `StatCardSkeleton`, `CardSkeleton`, `PageSkeleton`, `TableSkeleton` | Shimmer animation |
| `Toast` | `success`, `error`, `info`, `warning` | Top-right, auto-dismiss |

### 3.2 Motion (`src/components/motion.tsx`)
- `StaggerList` / `StaggerItem` — staggered entrance animations
- Used on dashboard stat cards and lists

### 3.3 Dialogs (feature-specific)
| Dialog | Purpose |
|--------|---------|
| `create-website-dialog.tsx` | Create website (customer optional) |
| `create-customer-dialog.tsx` | Create customer |
| `create-technician-dialog.tsx` | Create technician |
| `add-charge-dialog.tsx` | Add billing charge |
| `add-maintenance-dialog.tsx` | Add maintenance record |
| `add-timeline-event-dialog.tsx` | Add timeline event |
| `service-editor-dialog.tsx` | Edit hosting/database/server/plan |
| `send-notification-dialog.tsx` | Send notification to customer |
| `change-password-dialog.tsx` | Change password |

---

## 4. Page Inventory

### 4.1 Authentication
| Route | Purpose | Key Elements |
|-------|---------|--------------|
| `/login` | Login page | Email/password form, role-based redirect |

### 4.2 Owner (Admin) — `/admin/*`
| Route | Purpose | Key Sections |
|-------|---------|--------------|
| `/admin` | Dashboard | Greeting, 6 stat cards (Websites, Customers, Attention, Due Soon, Monitors, Open Incidents), attention queue, upcoming due dates, website overview, recent activity |
| `/admin/websites` | Website list | Search + status filter, table (desktop) / cards (mobile), create dialog |
| `/admin/websites/[id]` | Website detail | 7 tabs: Overview, Services, Billing, Maintenance, Timeline, Notify, Monitoring |
| `/admin/customers` | Customer list | Table with name/email/websites/status/joined, create dialog |
| `/admin/customers/[id]` | Customer detail | Profile, websites list, actions |
| `/admin/technicians` | Technician list | Cards with name/email/specialization/assignments, create dialog |
| `/admin/billing` | Billing overview | Due dates, charges |
| `/admin/notifications` | Notifications | List with mark read / mark all read |
| `/admin/activity` | Activity log | Timeline of actions |
| `/admin/profile` | Profile | User info, change password |

### 4.3 Customer — `/dashboard/*`
| Route | Purpose | Key Sections |
|-------|---------|--------------|
| `/dashboard` | Dashboard | Welcome, website summary, notifications |
| `/dashboard/websites` | My websites | List of owned websites |
| `/dashboard/websites/[id]` | Website detail | Status, services, billing, maintenance (customer-visible) |
| `/dashboard/billing` | Billing | Financial summary, charges |
| `/dashboard/notifications` | Notifications | List with mark read |
| `/dashboard/profile` | Profile | User info, change password |

### 4.4 Technician — `/technician/*`
| Route | Purpose | Key Sections |
|-------|---------|--------------|
| `/technician` | Dashboard | Assigned websites summary |
| `/technician/websites` | Assigned websites | List |
| `/technician/websites/[id]` | Website detail | Status, services, maintenance |
| `/technician/maintenance` | Maintenance | All maintenance across assigned sites |
| `/technician/activity` | Activity | Recent activity |
| `/technician/profile` | Profile | User info, change password |

---

## 5. Website Detail Tabs (`/admin/websites/[id]`)

| Tab | Content |
|-----|---------|
| **Overview** | Website info (domain, developer, type, status, launch date, last updated), Service health (website + hosting/db/server dots) |
| **Services** | Hosting, Database, Server cards with edit dialogs; empty state for unconfigured |
| **Billing** | Financial summary (Plan/Hosting/Database/Server/Other + Monthly Total), Additional charges list, Add charge dialog |
| **Maintenance** | Maintenance records (title, description, items, status, notes, internal flag), Add maintenance dialog |
| **Timeline** | Timeline events (create, status change, etc.), Add timeline event dialog |
| **Notify** | Send notification dialog, recent notifications sent |
| **Monitoring** | Monitor list, run check button, recent checks (status, latency), incidents |

---

## 6. Status System

### 6.1 Business Status (Website.status)
`OPERATIONAL` | `MAINTENANCE` | `ATTENTION_REQUIRED` | `OFFLINE` | `SUSPENDED` | `DEVELOPMENT`

### 6.2 Observed Health (Monitor) — NEW
`UP` | `DOWN` | `DEGRADED` | `PAUSED` | `UNKNOWN`

### 6.3 Badge Color Mapping (`getStatusVariant`)
- **Success (green)**: OPERATIONAL, ACTIVE, ONLINE, COMPLETED, PAID
- **Warning (amber)**: MAINTENANCE, PENDING, IN_PROGRESS, SCHEDULED, EXPIRING, DEVELOPMENT, ATTENTION_REQUIRED
- **Danger (red)**: OFFLINE, SUSPENDED, CANCELLED, OVERDUE, EXPIRED
- **Default (gray)**: everything else

### 6.4 Status Dot Colors
Same mapping as badge, used for service health indicators.

---

## 7. UX Patterns

### 7.1 Loading States
- **Page-level**: `PageSkeleton` / `StatCardSkeleton` / `CardSkeleton` / `TableSkeleton`
- **Inline**: spinner (`w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin`)
- **Button loading**: `loading` prop shows spinner inside button
- **Shimmer effect**: `.skeleton` class with gradient animation

### 7.2 Empty States
- `EmptyState` component: icon + title + description + optional action button
- Used on: website list, notifications, maintenance, activity, monitors

### 7.3 Error Handling
- Toast notifications (`toast('error', ...)`) for API failures
- Inline error messages in forms
- `try/catch` around all API calls with `.catch(() => {})` fallback

### 7.4 Toast System
- Position: top-right
- Types: success (green), error (red), info (blue), warning (amber)
- Auto-dismiss after 4s
- Manual dismiss via X button

### 7.5 Dialogs
- Modal overlay with backdrop blur
- Focus trap (keyboard navigation)
- Esc to close
- Click outside to close
- Header with title + description + close button
- Footer with Cancel + Submit buttons

### 7.6 Responsive Behavior
- **Mobile (< 768px)**: sidebar hidden, hamburger menu, bottom navigation (partial), tables → horizontal scroll or card view
- **Tablet (768-1024px)**: sidebar collapsed, 2-column grids
- **Desktop (> 1024px)**: full sidebar, 3-4 column grids, tables visible

### 7.7 Keyboard Navigation
- Cmd+K: open command palette
- Esc: close dialogs/modals
- Tab: focus navigation (partial)
- Enter: submit forms

---

## 8. Accessibility Status & Gaps

### 8.1 Currently Implemented
- `prefers-reduced-motion` respected (animations disabled)
- Focus ring on focus-visible
- Semantic HTML (nav, main, header, button)
- ARIA labels on some icon buttons
- Color contrast: mostly WCAG AA (indigo on dark bg needs verification)

### 8.2 Gaps (from BUG_CHECKLIST)
- Missing `aria-label` on many icon buttons
- No `role="navigation"` on sidebar
- No skip-to-content link
- No `aria-live` regions for dynamic content (notifications, toasts)
- No focus management for modals (focus trap partial)
- No screen reader testing done
- Color contrast not formally audited

---

## 9. Data Flow & State Management

### 9.1 State Management
- **Auth**: React Context (`AuthProvider`) — user, loading, login/logout
- **Page state**: `useState` + `useEffect` + `useCallback` per page
- **No global state library** (no Redux/Zustand/TanStack Query yet — roadmap #12)
- **API client**: Custom `ApiClient` class with token refresh flow

### 9.2 Data Fetching Pattern
```tsx
const [data, setData] = useState<any>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const d = await api.getSomething();
      setData(d);
    } catch {} finally {
      setLoading(false);
    }
  };
  fetchData();
}, [deps]);
```

### 9.3 Loading → Empty → Content → Error flow
1. `loading` true → show skeleton
2. Data loaded → if empty → EmptyState
3. If error → toast + optional retry
4. Content rendered

---

## 10. Icon Usage (Lucide React)

### 10.1 Common Icons
`Globe`, `Users`, `Wrench`, `Bell`, `CreditCard`, `Activity`, `Server`, `Database`, `HardDrive`, `DollarSign`, `Clock`, `AlertTriangle`, `CheckCheck`, `Plus`, `Pencil`, `ArrowRight`, `ArrowLeft`, `Search`, `Command`, `Menu`, `X`, `LogOut`, `User`, `UserCircle`, `Settings`, `FileText`, `Shield`

### 10.2 Icon Sizing Convention
- Navigation: `w-4 h-4` (16px)
- Stat cards: `w-5 h-5` (20px)
- Empty states: `w-8 h-8` (32px)
- Inline: `w-3.5 h-3.5` (14px)
- Buttons: `w-3.5 h-3.5` or `w-4 h-4`

### 10.3 Icon Color Convention
- Primary actions: `text-primary`
- Status: `text-success`/`text-warning`/`text-danger`/`text-info`
- Muted: `text-muted`
- Default: `text-foreground-secondary`

---

## 11. Design Inconsistencies & Issues to Fix

### 11.1 Inconsistencies
1. **Mixed card padding**: Some cards use `px-5 py-3`, others `px-4 py-2` — standardize to `px-5 py-4`
2. **Inconsistent empty states**: Some use `EmptyState` component, others inline divs
3. **Button sizing**: Mix of `h-8` and `h-10` for same-level actions
4. **Status badge sizes**: `sm` (10px) vs `md` (12px) used inconsistently
5. **Icon colors**: Some status dots use `bg-success`, others use `text-success` for same meaning
6. **Spacing**: `gap-4` vs `gap-3` vs `gap-2` used inconsistently in similar layouts
7. **Font sizes**: `text-[10px]` vs `text-xs` (12px) used interchangeably for small text
8. **Border radius**: `rounded-lg` vs `rounded-xl` for similar elements

### 11.2 Missing Design Elements
1. **No light mode** — CSS has `dark` class but no toggle or light theme
2. **No skeleton for charts** — chart loading states not implemented
3. **No error boundary** — uncaught errors crash the app (roadmap #26)
4. **No offline indicator** — no network status detection
5. **No pagination UI** — tables don't have pagination controls
6. **No bulk actions** — no multi-select on tables
7. **No drag-and-drop** — no reorderable lists
8. **No inline editing** — all edits via dialogs
9. **No tooltips** — no hover tooltips on icons/buttons
10. **No breadcrumbs** — deep navigation lacks breadcrumbs

### 11.3 Accessibility Gaps (from BUG_CHECKLIST + audit)
1. Missing `aria-label` on icon-only buttons
2. No `role="navigation"` on sidebar
3. No skip-to-content link
4. No `aria-live` regions for toasts/notifications
5. Incomplete focus management in modals
6. No screen reader testing
7. Color contrast not formally audited (indigo on dark bg borderline)

---

## 12. Upgrade Priorities (for design work)

### Priority 1 — Critical (fix before any feature work)
1. **Accessibility**: Add `aria-label` to all icon buttons, `role="navigation"` to sidebar, skip-to-content link
2. **Error boundary**: Wrap app in React Error Boundary with fallback UI
3. **Focus management**: Proper focus trap in dialogs, restore focus on close
4. **Loading consistency**: Standardize skeleton components across all pages

### Priority 2 — High (significant UX improvement)
5. **Dark/light mode toggle**: Implement `next-themes` or custom theme system
6. **Responsive polish**: Mobile bottom nav, horizontal scroll tables, touch targets (44px min)
7. **Empty states**: Standardize all empty states to use `EmptyState` component
8. **Toast improvements**: Add `aria-live`, better positioning, action buttons
9. **Pagination**: Add pagination controls to all tables
10. **Breadcrumbs**: Add breadcrumb navigation to detail pages

### Priority 3 — Medium (nice-to-have)
11. **Tooltips**: Add hover tooltips on icon buttons and status indicators
12. **Inline editing**: Allow inline editing of simple fields (name, description)
13. **Bulk actions**: Multi-select on tables with bulk delete/update
14. **Drag-and-drop**: Reorderable lists for maintenance items, timeline
15. **Charts**: Add accessible charts with table alternatives for monitoring data
16. **Skeleton for charts**: Loading states for chart components

### Priority 4 — Low (future)
17. **Animations**: More sophisticated page transitions (view transitions API)
18. **Micro-interactions**: Button press feedback, card hover effects
19. **Illustrations**: Custom empty state illustrations
20. **Onboarding**: First-time user tour/guide

---

## 13. Page-Specific Upgrade Notes

### 13.1 Admin Dashboard
- **Current**: 6 stat cards, attention queue, upcoming due, website overview, recent activity
- **Upgrade**: Add monitoring fleet overview (up/down/degraded/paused/unknown), attention queue with filters, SSL expiring soon, slow endpoints, recent recoveries
- **Charts**: Add uptime/response-time trend charts (with accessible table alternative)

### 13.2 Website Detail
- **Current**: 7 tabs (Overview, Services, Billing, Maintenance, Timeline, Notify, Monitoring)
- **Upgrade**: Add breadcrumbs, better tab navigation (scrollable on mobile), monitoring charts in Monitoring tab, incident timeline visualization

### 13.3 Customer Portal
- **Current**: Basic dashboard, website list, billing, notifications
- **Upgrade**: Add website health score, uptime history, customer-visible incidents, maintenance requests, billing history with downloadable invoices

### 13.4 Technician Portal
- **Current**: Assigned websites, maintenance, activity
- **Upgrade**: Add incident assignment/acknowledgment, investigation notes, maintenance workflow integration

---

## 14. Component Upgrade Specifications

### 14.1 StatCard
- Add trend indicator (↑↓ with %)
- Add sparkline mini-chart
- Add click-through to filtered list
- Add loading skeleton variant
- Add tooltip on hover

### 14.2 Table
- Add sorting (click header)
- Add filtering (per-column)
- Add pagination (10/25/50 per page)
- Add row selection (checkbox)
- Add bulk actions toolbar
- Add responsive card view on mobile

### 14.3 Dialog
- Add focus trap (tab cycling)
- Add size variants (sm/md/lg/xl)
- Add scrollable content area
- Add sticky header/footer
- Add confirmation variant (danger dialog)

### 14.4 Form Inputs
- Add inline validation (real-time)
- Add helper text
- Add character count
- Add password strength indicator
- Add autocomplete attributes

### 14.5 Status Badge
- Add pulse animation for critical states
- Add tooltip with last-checked time
- Add size `xs` for dense tables
- Add icon variant (icon + text)

---

## 15. Color & Theme Recommendations

### 15.1 Current Issues
- Indigo (`#6366f1`) primary is good but could be more distinctive
- No light mode support despite CSS structure
- Status colors (green/amber/red) are standard but could be more nuanced
- No high-contrast mode

### 15.2 Recommendations
1. **Keep dark-first** — the current dark theme is well-executed
2. **Add light mode** — invert the color scale, use `next-themes`
3. **Add status color variants** — `success-emphasis`, `danger-emphasis` for critical states
4. **Add semantic tokens** — `--color-surface-raised`, `--color-text-disabled`
5. **Consider accent customization** — allow users to pick accent color (indigo/teal/violet)

---

## 16. Animation & Motion Guidelines

### 16.1 Current Animations
- Page entrance: fade-in + translateY (0.2s)
- List stagger: 0.05s delay per item
- Skeleton: shimmer (1.5s infinite)
- Status dot: pulse (2s infinite)
- Dialog: scale + fade (0.15s)

### 16.2 Recommendations
1. **Use View Transitions API** for page navigation (already in vercel-react-view-transitions skill)
2. **Add micro-interactions**: button press (scale 0.98), card hover (translateY -1px)
3. **Reduce animation on low-end devices**: check `navigator.hardwareConcurrency`
4. **Add loading progress bar**: top-of-page progress for route changes
5. **Respect reduced motion**: already implemented, verify all animations covered

---

## 17. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| `sm` | 640px | 2-column grids, larger padding |
| `md` | 768px | Sidebar visible, 3-column grids |
| `lg` | 1024px | Full sidebar, 4-column grids, tables visible |
| `xl` | 1280px | 5-6 column grids, wider containers |
| `2xl` | 1536px | Max content width |

### 17.1 Mobile-Specific
- Bottom tab bar for key sections (Dashboard, Websites, Notifications, Profile)
- Full-screen dialogs (not centered modals)
- Horizontal scroll for tables (or card view)
- Touch targets: minimum 44x44px
- Pull-to-refresh on list pages

---

## 18. Form Design Standards

### 18.1 Input Styling
- Height: `h-10` (40px)
- Border: `border-border`, focus: `border-primary/50` + `ring-2 ring-primary/30`
- Background: `bg-background`
- Padding: `px-3`
- Radius: `rounded-lg`
- Placeholder: `text-muted`

### 18.2 Validation
- Real-time validation on blur
- Error state: `border-danger` + `text-danger` helper text below
- Success state: `border-success` (optional)
- Required indicator: `*` in label (red)

### 18.3 Form Layout
- Single column on mobile, 2-column on desktop
- Label above input (not inline)
- Helper text below input
- Error message below helper text
- Submit button full-width on mobile, auto on desktop

---

## 19. Table Design Standards

### 19.1 Structure
- Header: `text-[10px] font-semibold uppercase tracking-wider text-muted`
- Row height: `py-3` (12px vertical padding)
- Hover: `hover:bg-overlay`
- Selected: `bg-primary-subtle`
- Borders: `divide-y divide-border`

### 19.2 Columns
- Primary identifier: left-aligned, font-medium
- Status: badge component
- Actions: right-aligned, icon buttons
- Dates: formatted (short month, day, year)
- Currency: formatted with $ and 2 decimals

### 19.3 Responsive
- Desktop: full table
- Tablet: hide less important columns
- Mobile: card view (each row becomes a card)

---

## 20. Summary: Design Upgrade Checklist

### Must-Have (before launch)
- [ ] Accessibility audit (aria-labels, focus management, contrast)
- [ ] Error boundary implementation
- [ ] Mobile responsive polish (bottom nav, touch targets)
- [ ] Dark/light mode toggle
- [ ] Loading state consistency (skeletons everywhere)
- [ ] Empty state standardization

### Should-Have (post-launch, high impact)
- [ ] Pagination on all tables
- [ ] Breadcrumbs on detail pages
- [ ] Tooltips on icon buttons
- [ ] Toast aria-live regions
- [ ] Focus trap in dialogs
- [ ] Inline editing for simple fields

### Nice-to-Have (future)
- [ ] Charts with accessible alternatives
- [ ] Bulk actions on tables
- [ ] Drag-and-drop reordering
- [ ] Micro-interactions (press feedback, hover effects)
- [ ] Custom illustrations for empty states
- [ ] Onboarding tour for new users

---

## 21. File Reference

| File | Purpose |
|------|---------|
| `frontend/src/app/globals.css` | Design tokens, animations, scrollbar, focus |
| `frontend/src/components/ui/badge.tsx` | Badge/StatusBadge component |
| `frontend/src/components/ui/button.tsx` | Button component |
| `frontend/src/components/ui/card.tsx` | Card component |
| `frontend/src/components/ui/dialog.tsx` | Dialog/modal component |
| `frontend/src/components/ui/empty-state.tsx` | Empty state component |
| `frontend/src/components/ui/input.tsx` | Input component |
| `frontend/src/components/ui/skeleton.tsx` | Skeleton loading components |
| `frontend/src/components/ui/toast.tsx` | Toast notification system |
| `frontend/src/components/layout/app-shell.tsx` | App shell layout |
| `frontend/src/components/layout/sidebar.tsx` | Navigation sidebar |
| `frontend/src/components/layout/header.tsx` | Top header bar |
| `frontend/src/components/motion.tsx` | Framer Motion wrappers |
| `frontend/src/components/search/command-palette.tsx` | Command palette |
| `frontend/src/lib/utils.ts` | Utility functions (formatting, dates) |
| `frontend/src/types/index.ts` | TypeScript type definitions |
| `frontend/src/services/api.ts` | API client |
| `frontend/tailwind.config.*` | Tailwind configuration (v4 uses CSS-based config) |

---

## 22. Design Principles for NexusOps

1. **Dark-first, professional** — The current dark theme is well-executed; preserve it
2. **Information density** — This is an ops tool; show data, don't hide it
3. **Role-aware** — Each role sees only what they need; don't clutter
4. **Status-driven** — Color and badges communicate state at a glance
5. **Progressive disclosure** — Show summary, expand for detail
6. **Consistent patterns** — Same interaction patterns across all pages
7. **Accessible by default** — WCAG AA minimum, keyboard navigable
8. **Fast perceived performance** — Skeletons, optimistic updates, minimal loading spinners
9. **No gratuitous decoration** — No AI-purple gradients, emoji icons, or excessive animation
10. **Mobile-aware** — Not mobile-first, but fully functional on mobile

---

*This document should be updated as design decisions are made and implemented.*
