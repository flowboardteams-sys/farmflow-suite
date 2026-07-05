
# Smart Farm SaaS — Phased Build Plan

This spec covers 25+ modules. Building it in one turn would produce broken, shallow code. We will ship it in phases, each fully working before moving on. This plan covers **Phase 1 only** — the foundation everything else depends on. Later phases are listed at the end so you can see the roadmap.

---

## Phase 1 — Foundation (this iteration)

Goal: a signed-in Owner can create a farm, add locations, invite users with roles, switch active location, and see an empty-but-real dashboard. Every future module plugs into this shell.

### 1. Lovable Cloud + Email
- Enable Lovable Cloud (Postgres, Auth, Storage, Realtime, Cron).
- Set up email domain (needed for invites, password reset, verification).

### 2. Database schema (Phase 1 tables)
Multi-tenant core. UUIDs, `created_at`/`updated_at`, `deleted_at` (soft delete) on all business tables.

- `profiles` (1-1 with `auth.users`: name, avatar, locale)
- `farms` (owner_id, name, logo, details)
- `farm_locations` (farm_id, name, address, is_primary)
- `farm_members` (farm_id, user_id, status) — tenancy join
- `app_role` enum: `owner`, `farm_manager`, `veterinarian`, `accountant`, `inventory_manager`, `hr_manager`, `milker`, `worker`, `custom`
- `roles` (farm_id, name, is_system) — supports custom roles per farm
- `permissions` catalog (resource, action)
- `role_permissions` (role_id, permission_id)
- `user_roles` (user_id, farm_id, role_id) — **separate table, never on profiles**
- `invitations` (farm_id, email, role_id, token, expires_at, status)
- `plans` (code, name, price, limits jsonb)
- `subscriptions` (farm_id, plan_id, status, current_period_end) — stubbed, no payment
- `activity_logs` and `audit_logs` (farm_id, actor_id, action, entity, diff jsonb)
- `notifications` (farm_id, user_id, type, payload, read_at)
- `settings` (farm_id, key, value jsonb)

Empty **placeholder tables** created now so future phases don't need destructive migrations: `animals`, `products`, `orders`, `employees`, `expenses`, `income`, `inventory_items`, `assets`. Each has `id`, `farm_id`, timestamps, soft-delete — columns fill in during their module's phase.

### 3. Security (RLS everywhere)
- `has_role(_user_id, _farm_id, _role)` SECURITY DEFINER function to avoid recursive RLS.
- `is_farm_member(_user_id, _farm_id)` SECURITY DEFINER function.
- `has_permission(_user_id, _farm_id, _resource, _action)` SECURITY DEFINER for the permission matrix.
- RLS on every table scoped by `farm_id` → membership check. No cross-farm reads possible.
- Explicit `GRANT` blocks on every public-schema table.
- Storage buckets: `farm-logos` (public), `user-avatars` (public), `farm-private` (private, RLS by farm).

### 4. Auth flows
Email/password + Google OAuth (via Lovable broker). Routes:
- `/` landing, `/auth` (login+signup), `/auth/forgot`, `/reset-password`, `/verify-email`
- `/invite/:token` (accept invitation → join farm)
- `/onboarding` (first-time: create farm + primary location)
- `/subscription-expired`, `/choose-plan` (UI shell, stub billing)

Managed `_authenticated` layout gates the app; sign-out hygiene included; header reflects session.

### 5. App shell (inside `_authenticated`)
- Sidebar with **all 25 module entries** — each links to a real route rendering a "Coming soon" empty state so nothing 404s.
- Top bar: **farm switcher**, **location switcher**, notifications bell (realtime subscription), profile menu.
- Active farm/location stored in `settings` + React context; every query keys off it.
- Dark mode toggle, responsive (mobile drawer), skeletons, error boundaries.

### 6. Dashboard (real, but data-light)
- KPI cards (Animals, Milk today, Pregnant, Alerts) — read from placeholder tables, show 0 with empty state.
- Recharts revenue/expenses/milk charts wired to empty datasets with graceful empty UI.
- Recent activity feed from `activity_logs` (realtime).
- Quick actions (Add Animal, Add Milk Entry) — open module stubs.

### 7. Settings, Profile, Support, Admin shells
- `/profile`, `/settings/general|security|notifications|branding|localization|api-keys` — persist to `settings`/`profiles`.
- `/support` contact form → inserts into `support_tickets` table.
- `/admin` panel (super-admin only via role check): manage farms, users, plans, subscriptions — list views wired to real tables.

### 8. Cross-cutting infra
- TanStack Query + `createServerFn` patterns established.
- Zod schemas + RHF for every form.
- Framer Motion transitions on route change.
- Activity/audit logging trigger on tenant tables.
- Realtime notifications channel per user.
- CSV export helper, PDF export helper (stubs used later).
- SEO head() on every public route.

### Technical notes
- Stack: TanStack Start (per template) — not React Router DOM. Navigation uses `<Link>` from `@tanstack/react-router`.
- Roles: **all 7 predefined roles** seeded per farm on creation + full custom-role/permission-matrix UI under Settings → Roles.
- Payments: stubbed. `subscriptions` table + UI exist; `Choose Plan` writes a fake active subscription. Real Stripe/Paddle wires in Phase 6.
- Notifications: in-app (realtime) + transactional email only. WhatsApp/SMS deferred.
- Storage grants on `storage.objects`, not `storage.buckets` (buckets created via tool).

---

## Roadmap (future phases — separate iterations)

- **Phase 2** — Animals + Pedigree + Growth (registration, images, QR, family tree, weight tracking, bulk import).
- **Phase 3** — Health + Breeding + Milk Production (vaccinations, treatments, AI records, pregnancy tests, daily milk entry, quality).
- **Phase 4** — Inventory + Assets + Weaning (feed/medicine stock, purchase orders, suppliers, maintenance, feeding plans).
- **Phase 5** — Finance + HR (income/expense, cashbook, P&L, employees, attendance, payroll).
- **Phase 6** — Marketplace + Customer Portal + Orders + Real Payments (Stripe).
- **Phase 7** — Reports + Analytics + Enterprise consolidated dashboards + advanced Admin/CMS.

Each phase ends with a working, tested vertical slice.

---

**Approve this plan and I'll build Phase 1.** After it's live and you've clicked around, say "start Phase 2" and I'll continue.
