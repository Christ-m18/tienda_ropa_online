# Admin Panel Professional Overhaul - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `/admin` into a professional operations panel with realtime KPIs, bank transfer voucher workflow, user blocking, and improved order management.

**Architecture:** Extend Supabase schema with `payment_proofs` table and `profiles` blocking fields. Add Server Actions for voucher review, user blocking. Build realtime dashboard using Supabase Realtime subscriptions in client components. Maintain existing App Router conventions with Server Components for data fetching and Client Components for interactivity.

**Tech Stack:** Next.js 16.2.4, React 19, Supabase (DB + Realtime + Storage), Tailwind v4, shadcn/ui, lucide-react, zod, Server Actions.

---

## File Map

### New Files
- `supabase/migration-admin-overhaul.sql` - Idempotent migration for new tables/fields
- `src/types/admin.ts` - Admin-specific TypeScript types
- `src/lib/queries/admin-dashboard.ts` - Dashboard KPI queries
- `src/components/admin/DashboardKPIs.tsx` - KPI cards grid
- `src/components/admin/DashboardCharts.tsx` - SVG mini charts (client)
- `src/components/admin/RealtimeProvider.tsx` - Supabase Realtime wrapper (client)
- `src/components/admin/LiveIndicator.tsx` - "En vivo" indicator (client)
- `src/components/admin/RecentActivity.tsx` - Activity feed
- `src/components/admin/OrderFilters.tsx` - Order list filters (client)
- `src/components/admin/OrderTimeline.tsx` - Order detail timeline
- `src/components/admin/VoucherReview.tsx` - Voucher preview + approve/reject (client)
- `src/components/admin/UserFilters.tsx` - User list filters (client)
- `src/components/admin/BlockUserDialog.tsx` - Block user dialog (client)
- `src/components/checkout/BankTransferInstructions.tsx` - Bank info + voucher upload (client)
- `src/lib/actions/voucher.ts` - Voucher upload + review Server Actions
- `src/lib/actions/block-user.ts` - Block/unblock Server Actions

### Modified Files
- `supabase/schema.sql` - Append new tables/fields/policies
- `src/types/index.ts` - Add PaymentProof, extend Profile
- `src/lib/queries/admin.ts` - Extend metrics, add filtered queries
- `src/lib/actions/admin.ts` - Add payment review actions
- `src/app/(shop)/admin/layout.tsx` - Add live indicator, improve nav
- `src/app/(shop)/admin/page.tsx` - Full dashboard rewrite
- `src/app/(shop)/admin/ordenes/page.tsx` - Filters, payment status column
- `src/app/(shop)/admin/ordenes/[id]/page.tsx` - Timeline, voucher section, totals
- `src/app/(shop)/admin/ordenes/[id]/status-form.tsx` - Spanish labels
- `src/app/(shop)/admin/usuarios/page.tsx` - Blocking, filters, stats
- `src/app/(shop)/admin/usuarios/toggle-admin-button.tsx` - Keep, minor update
- `src/components/checkout/CheckoutFlow.tsx` - Bank transfer instructions step
- `src/utils/supabase/middleware.ts` - Blocked user enforcement
- `src/lib/actions/checkout.ts` - Set payment_status for bank_transfer

---

## Task 1: Database Schema Updates

**Files:**
- Create: `supabase/migration-admin-overhaul.sql`
- Modify: `supabase/schema.sql`

- [ ] **Step 1.1: Create migration file**

Create `supabase/migration-admin-overhaul.sql` with all new tables, columns, policies, and realtime publication. This file is also appended to `schema.sql` for the canonical schema.

```sql
-- =====================================================================
-- ADMIN OVERHAUL MIGRATION (idempotent)
-- New: payment_proofs table, profiles blocking fields, realtime publication
-- =====================================================================

-- ENUM for proof status
do $$ begin create type public.payment_proof_status as enum ('pending','approved','rejected'); exception when duplicate_object then null; end $$;

-- Extend profiles with blocking fields
alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.profiles add column if not exists blocked_reason text;
alter table public.profiles add column if not exists blocked_at timestamptz;
alter table public.profiles add column if not exists blocked_by uuid references auth.users(id) on delete set null;

-- Payment proofs table
create table if not exists public.payment_proofs (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  file_path       text not null,
  bank_name       text,
  reference_number text,
  amount          numeric(10,2),
  notes           text,
  status          public.payment_proof_status not null default 'pending',
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,
  rejection_reason text,
  created_at      timestamptz not null default now()
);
create index if not exists payment_proofs_order_id_idx on public.payment_proofs(order_id);
create index if not exists payment_proofs_user_id_idx on public.payment_proofs(user_id);
create index if not exists payment_proofs_status_idx on public.payment_proofs(status);

-- RLS for payment_proofs
alter table public.payment_proofs enable row level security;

drop policy if exists "payment_proofs_select_own" on public.payment_proofs;
create policy "payment_proofs_select_own" on public.payment_proofs for select using (auth.uid() = user_id);

drop policy if exists "payment_proofs_insert_own" on public.payment_proofs;
create policy "payment_proofs_insert_own" on public.payment_proofs for insert with check (auth.uid() = user_id);

drop policy if exists "payment_proofs_admin_all" on public.payment_proofs;
create policy "payment_proofs_admin_all" on public.payment_proofs for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Admin policies for profiles (admin can update any profile for blocking)
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Admin insert policy for notifications (admins send notifications to users)
drop policy if exists "notifications_insert_admin" on public.notifications;
create policy "notifications_insert_admin" on public.notifications for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Admin insert policy for audit_logs
drop policy if exists "audit_logs_insert_admin" on public.audit_logs;
create policy "audit_logs_insert_admin" on public.audit_logs for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- User insert policy for notifications (from checkout server action)
drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications for insert with check (auth.uid() = user_id);

-- Supabase Realtime publication
-- Enable realtime for key tables (idempotent via alter)
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.payment_proofs;
alter publication supabase_realtime add table public.audit_logs;
alter publication supabase_realtime add table public.notifications;

-- Storage bucket for vouchers (run via Supabase dashboard or API)
-- insert into storage.buckets (id, name, public) values ('payment-vouchers', 'payment-vouchers', false) on conflict (id) do nothing;
```

- [ ] **Step 1.2: Append migration to schema.sql**

Append the contents of the migration to the end of `supabase/schema.sql` so the canonical schema stays complete.

- [ ] **Step 1.3: Commit**

```
git add supabase/
git commit -m "feat(db): add payment_proofs table, profile blocking fields, realtime publication"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/types/admin.ts`

- [ ] **Step 2.1: Extend types/index.ts**

Add to `Profile` interface:
```typescript
is_blocked: boolean
blocked_reason?: string | null
blocked_at?: string | null
blocked_by?: string | null
```

Add `PaymentProofStatus` type and `PaymentProof` interface:
```typescript
export type PaymentProofStatus = 'pending' | 'approved' | 'rejected'

export interface PaymentProof {
  id: string
  order_id: string
  user_id: string
  file_path: string
  bank_name?: string | null
  reference_number?: string | null
  amount?: number | null
  notes?: string | null
  status: PaymentProofStatus
  reviewed_by?: string | null
  reviewed_at?: string | null
  rejection_reason?: string | null
  created_at: string
}
```

- [ ] **Step 2.2: Create admin types file**

Create `src/types/admin.ts` with dashboard-specific types:
```typescript
export interface AdminMetrics {
  totalRevenue: number
  revenueToday: number
  revenueLast7Days: number
  revenueLast30Days: number
  totalOrders: number
  pendingOrders: number
  awaitingTransferReview: number
  paidOrders: number
  failedOrders: number
  averageTicket: number
  lowStockProducts: number
  totalUsers: number
  newUsersLast7Days: number
  topProducts: Array<{ name: string; sales: number; revenue: number }>
  recentOrders: Array<{
    id: string; total: number; status: string;
    payment_status: string; payment_method: string; created_at: string;
    profiles?: { full_name?: string | null } | null
  }>
  ordersByStatus: Record<string, number>
  ordersByPaymentMethod: Record<string, number>
  revenueByDay: Array<{ date: string; revenue: number }>
}

export interface ActivityEvent {
  id: string
  action: string
  entity_type?: string | null
  entity_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
  user_id?: string | null
}
```

- [ ] **Step 2.3: Commit**

```
git add src/types/
git commit -m "feat(types): add PaymentProof, Profile blocking fields, admin dashboard types"
```

---

## Task 3: Admin Dashboard Queries

**Files:**
- Create: `src/lib/queries/admin-dashboard.ts`
- Modify: `src/lib/queries/admin.ts`

- [ ] **Step 3.1: Create admin-dashboard.ts with full KPI queries**

Server-only module that fetches all dashboard metrics in parallel. Uses date arithmetic for time-windowed queries.

Key queries:
- Revenue totals (all time, today, 7d, 30d) from `orders` where status != cancelled
- Order counts by status and payment_status
- Awaiting transfer review: orders with `payment_method='bank_transfer'` and `payment_status='pending'`
- Average ticket from non-cancelled orders
- Low stock products (stock <= 5)
- User counts (total + new in last 7 days)
- Top 5 products by sales_count
- Revenue by day (last 14 days) for chart
- Orders by status distribution
- Orders by payment method distribution
- Recent activity from audit_logs (last 20)

- [ ] **Step 3.2: Update admin.ts queries**

Add `getAdminOrdersFiltered` that accepts filter params (status, payment_status, payment_method, date range, search term) and returns paginated results. Keep existing `getAdminOrders` for backwards compat.

Add `getAdminUsersFiltered` that accepts filter params (search, role, blocked status).

- [ ] **Step 3.3: Commit**

```
git add src/lib/queries/
git commit -m "feat(queries): add dashboard KPIs, filtered orders/users queries"
```

---

## Task 4: Voucher Server Actions

**Files:**
- Create: `src/lib/actions/voucher.ts`

- [ ] **Step 4.1: Create voucher.ts**

Server Actions for:
1. `uploadVoucher(formData)` - validates with zod (order_id, bank_name, reference_number, amount, notes, file), uploads file to Supabase Storage `payment-vouchers` bucket, creates `payment_proofs` row, sends notification, logs audit
2. `reviewPaymentProof(formData)` - admin-only, validates (proof_id, action: approve|reject, rejection_reason?), updates proof status, updates order payment_status/status, sends notification, logs audit

- [ ] **Step 4.2: Commit**

```
git add src/lib/actions/voucher.ts
git commit -m "feat(actions): add voucher upload and payment review server actions"
```

---

## Task 5: User Blocking Server Actions

**Files:**
- Create: `src/lib/actions/block-user.ts`

- [ ] **Step 5.1: Create block-user.ts**

Server Actions:
1. `blockUser(formData)` - admin-only, validates (user_id, reason), prevents self-blocking, updates profile (is_blocked, blocked_reason, blocked_at, blocked_by), sends notification, logs audit
2. `unblockUser(formData)` - admin-only, validates (user_id), clears blocking fields, sends notification, logs audit

- [ ] **Step 5.2: Commit**

```
git add src/lib/actions/block-user.ts
git commit -m "feat(actions): add user block/unblock server actions"
```

---

## Task 6: Admin Layout Improvements

**Files:**
- Modify: `src/app/(shop)/admin/layout.tsx`
- Create: `src/components/admin/LiveIndicator.tsx`

- [ ] **Step 6.1: Create LiveIndicator component**

Client component showing green dot + "En vivo" text. Uses Supabase Realtime connection status. Shows "Reconectando..." when disconnected.

- [ ] **Step 6.2: Update admin layout**

- Add `LiveIndicator` to the sidebar header
- Keep existing nav structure
- Minor: ensure responsive behavior works

- [ ] **Step 6.3: Commit**

```
git add src/components/admin/LiveIndicator.tsx src/app/(shop)/admin/layout.tsx
git commit -m "feat(admin): add live indicator and improved layout"
```

---

## Task 7: Realtime Provider

**Files:**
- Create: `src/components/admin/RealtimeProvider.tsx`

- [ ] **Step 7.1: Create RealtimeProvider**

Client component that:
- Subscribes to Supabase Realtime changes on `orders`, `profiles`, `products`, `payment_proofs`, `audit_logs`
- Calls `router.refresh()` on any change to trigger Server Component re-render
- Tracks connection status for LiveIndicator
- Uses React context to share connection state
- Debounces refresh calls (500ms) to avoid excessive re-renders

- [ ] **Step 7.2: Wrap admin layout children with RealtimeProvider**

- [ ] **Step 7.3: Commit**

```
git add src/components/admin/RealtimeProvider.tsx src/app/(shop)/admin/layout.tsx
git commit -m "feat(admin): add realtime provider with Supabase subscriptions"
```

---

## Task 8: Dashboard Page Rewrite

**Files:**
- Modify: `src/app/(shop)/admin/page.tsx`
- Create: `src/components/admin/DashboardKPIs.tsx`
- Create: `src/components/admin/DashboardCharts.tsx`
- Create: `src/components/admin/RecentActivity.tsx`

- [ ] **Step 8.1: Create DashboardKPIs component**

Server component rendering a grid of KPI cards. Each card shows:
- Icon (lucide-react)
- Value (formatted)
- Label
- Optional delta/trend indicator

Cards: Ingresos totales, Ingresos hoy, Ingresos 7d, Ingresos 30d, Ordenes totales, Pendientes, Transferencias por revisar, Pagos aprobados, Pagos fallidos, Ticket promedio, Bajo stock, Usuarios registrados, Nuevos usuarios 7d

Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`

Visual style: compact cards with `bg-white rounded-2xl border border-zinc-200 p-4`, icon in colored pill, value in `font-display text-2xl`, label in `text-xs text-zinc-500 uppercase tracking-wider`.

- [ ] **Step 8.2: Create DashboardCharts component**

Client component with pure SVG mini charts (no heavy deps):
1. Revenue by day - simple bar chart (last 14 days)
2. Orders by status - horizontal bar chart
3. Orders by payment method - horizontal bar chart
4. Top products ranking - horizontal bars

All charts use inline SVG with the rd-* color palette. Responsive. Tooltips on hover via title attributes.

- [ ] **Step 8.3: Create RecentActivity component**

Server component showing last 20 audit_log entries with human-readable descriptions:
- `order.status_change` → "Pedido #XXX cambió a [status]"
- `payment_proof.approved` → "Pago aprobado para pedido #XXX"
- `payment_proof.rejected` → "Pago rechazado para pedido #XXX"
- `profile.blocked` → "Usuario [name] bloqueado"
- `profile.unblocked` → "Usuario [name] desbloqueado"
- `product.create` / `product.update` → "Producto [name] creado/actualizado"

Each entry shows relative time ("hace 5 min", "hace 2h") and links to relevant entity.

- [ ] **Step 8.4: Rewrite admin/page.tsx**

Compose: DashboardKPIs + DashboardCharts + alerts (pending orders, low stock, transfers awaiting review) + RecentActivity. Remove old implementation entirely.

- [ ] **Step 8.5: Commit**

```
git add src/app/(shop)/admin/page.tsx src/components/admin/Dashboard*.tsx src/components/admin/RecentActivity.tsx
git commit -m "feat(admin): professional dashboard with KPIs, charts, and activity feed"
```

---

## Task 9: Orders List Page Improvements

**Files:**
- Modify: `src/app/(shop)/admin/ordenes/page.tsx`
- Create: `src/components/admin/OrderFilters.tsx`

- [ ] **Step 9.1: Create OrderFilters component**

Client component with:
- Status filter dropdown (all, pending, processing, shipped, delivered, cancelled)
- Payment status filter (all, pending, paid, failed)
- Payment method filter (all, cod, bank_transfer, stripe, paypal)
- Search input (by order ID or client name/email)
- Date range (from/to date inputs)
- "Limpiar filtros" button
- Uses URL search params for server-side filtering via `useRouter` + `useSearchParams`

- [ ] **Step 9.2: Rewrite ordenes/page.tsx**

- Accept searchParams for filtering
- Use `getAdminOrdersFiltered` query
- Add payment_status column with colored badges
- Highlight bank_transfer orders with pending payment in amber
- Spanish status labels: Pendiente, En proceso, Enviado, Entregado, Cancelado
- Spanish payment status: Pendiente, Pagado, Fallido
- Keep ExportOrdersButton
- Responsive table with proper mobile behavior

Status badge colors map:
```
pending → bg-zinc-200 text-zinc-700
processing → bg-blue-100 text-blue-700
shipped → bg-amber-100 text-amber-700
delivered → bg-emerald-100 text-emerald-700
cancelled → bg-red-100 text-red-700
```

Payment status badges:
```
pending → bg-zinc-200 text-zinc-700
paid → bg-emerald-100 text-emerald-700
failed → bg-red-100 text-red-700
```

- [ ] **Step 9.3: Commit**

```
git add src/app/(shop)/admin/ordenes/page.tsx src/components/admin/OrderFilters.tsx
git commit -m "feat(admin): order list with filters, payment status, and Spanish labels"
```

---

## Task 10: Order Detail Page Improvements

**Files:**
- Modify: `src/app/(shop)/admin/ordenes/[id]/page.tsx`
- Modify: `src/app/(shop)/admin/ordenes/[id]/status-form.tsx`
- Create: `src/components/admin/OrderTimeline.tsx`
- Create: `src/components/admin/VoucherReview.tsx`

- [ ] **Step 10.1: Create OrderTimeline component**

Server component that shows order lifecycle:
- Created → status changes from audit_logs
- Payment proof submitted / approved / rejected
- Each step: icon, label, timestamp, actor name

Visual: vertical line with dots, matching status colors.

- [ ] **Step 10.2: Create VoucherReview component**

Client component for admin to review bank transfer vouchers:
- Shows voucher image/PDF preview (uses Supabase Storage signed URL)
- Bank name, reference number, amount, submission date
- "Abrir comprobante" link to download
- "Aprobar pago" button (green) → calls reviewPaymentProof(approve)
- "Rechazar pago" button (red) → opens textarea for rejection_reason, then calls reviewPaymentProof(reject)
- Shows current proof status with badge
- If already reviewed, shows reviewer info and decision

- [ ] **Step 10.3: Update status-form.tsx**

Add Spanish labels to status dropdown options.

- [ ] **Step 10.4: Rewrite order detail page**

Sections:
1. Header: order ID, date, total
2. OrderStatusForm (existing, improved)
3. VoucherReview section (only if payment_method === 'bank_transfer')
4. Grid: Client info | Shipping info | Payment info
5. Products list with images, quantities, unit prices, line totals
6. Totals breakdown: subtotal, shipping, discount, total
7. OrderTimeline (audit history)

- [ ] **Step 10.5: Commit**

```
git add src/app/(shop)/admin/ordenes/[id]/ src/components/admin/OrderTimeline.tsx src/components/admin/VoucherReview.tsx
git commit -m "feat(admin): order detail with timeline, voucher review, and totals breakdown"
```

---

## Task 11: Users Page Improvements

**Files:**
- Modify: `src/app/(shop)/admin/usuarios/page.tsx`
- Create: `src/components/admin/UserFilters.tsx`
- Create: `src/components/admin/BlockUserDialog.tsx`

- [ ] **Step 11.1: Create UserFilters component**

Client component with:
- Search input (name, email)
- Role filter (all, admin, client)
- Blocked filter (all, active, blocked)
- Uses URL search params

- [ ] **Step 11.2: Create BlockUserDialog component**

Client component using Dialog from shadcn/ui:
- "Bloquear usuario" button triggers dialog
- Shows user name/email
- Textarea for reason (required)
- Confirm button calls blockUser action
- For blocked users: shows "Desbloquear" button that calls unblockUser

- [ ] **Step 11.3: Rewrite usuarios/page.tsx**

- Accept searchParams for filtering
- Use `getAdminUsersFiltered` query with join to get order stats (total orders, total spent, last order date)
- Show columns: Avatar/Name/Email, Phone, Registered, Orders, Total spent, Role/Status, Actions
- Status badges: Admin (rd-red), Cliente (zinc), Bloqueado (red with strikethrough icon)
- Actions: ToggleAdminButton + BlockUserDialog
- Prevent self-blocking (compare current admin ID)
- Show blocked_reason on hover/tooltip for blocked users

- [ ] **Step 11.4: Commit**

```
git add src/app/(shop)/admin/usuarios/ src/components/admin/UserFilters.tsx src/components/admin/BlockUserDialog.tsx
git commit -m "feat(admin): user management with blocking, filters, and order stats"
```

---

## Task 12: Checkout Bank Transfer Flow

**Files:**
- Create: `src/components/checkout/BankTransferInstructions.tsx`
- Modify: `src/components/checkout/CheckoutFlow.tsx`
- Modify: `src/lib/actions/checkout.ts`

- [ ] **Step 12.1: Create BankTransferInstructions component**

Client component shown after order placement when payment_method is bank_transfer:
- Bank account details (BHD, Popular, Reservas) with copy-to-clipboard
- File upload input (accept image/*, .pdf, max 5MB)
- Form fields: bank_name (select), reference_number, amount, notes
- Submit button calls uploadVoucher action
- Success state showing "Comprobante enviado, pendiente de revisión"

- [ ] **Step 12.2: Update CheckoutFlow.tsx**

When `bank_transfer` is selected at step 2 (payment), show a note:
"Después de confirmar tu pedido, podrás subir el comprobante de transferencia."

In the confirmation step (step 3), add bank account info preview.

- [ ] **Step 12.3: Update checkout.ts**

When `payment_method === 'bank_transfer'`, ensure `payment_status` is explicitly set to `'pending'`. The existing flow already does this via the DB default, but make it explicit in the notification message: "Sube tu comprobante de transferencia para procesar el pedido."

- [ ] **Step 12.4: Commit**

```
git add src/components/checkout/ src/lib/actions/checkout.ts
git commit -m "feat(checkout): bank transfer instructions and voucher upload flow"
```

---

## Task 13: Blocked User Enforcement

**Files:**
- Modify: `src/utils/supabase/middleware.ts`

- [ ] **Step 13.1: Update middleware**

After the existing admin check, add blocked user check:
- For authenticated users hitting protected paths, query `profiles.is_blocked`
- If blocked, redirect to `/bloqueado` (or sign out and redirect to login with reason=blocked)
- This prevents blocked users from accessing checkout, profile, etc.

- [ ] **Step 13.2: Commit**

```
git add src/utils/supabase/middleware.ts
git commit -m "feat(auth): enforce blocked user restrictions in middleware"
```

---

## Task 14: Quality Checks

- [ ] **Step 14.1: Run lint**
```
npm run lint
```
Fix any errors.

- [ ] **Step 14.2: Run typecheck**
```
npm run typecheck
```
Fix any type errors.

- [ ] **Step 14.3: Run build**
```
npm run build
```
Fix any build errors.

- [ ] **Step 14.4: Final commit**
```
git add -A
git commit -m "fix: resolve lint, type, and build errors from admin overhaul"
```

---

## Execution Notes

- All SQL is idempotent (IF NOT EXISTS, DROP POLICY IF EXISTS, etc.)
- Supabase Storage bucket `payment-vouchers` must be created via dashboard or API
- Realtime publication ALTER statements may fail if tables are already in the publication - wrap in exception handler or run manually
- The `place_order_atomic` RPC already exists and is called from checkout - no changes needed there
- No new npm dependencies required - all charts are pure SVG
- All Server Actions use zod validation and requireAdmin guard
