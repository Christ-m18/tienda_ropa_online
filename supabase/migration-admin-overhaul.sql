-- =====================================================================
-- ADMIN OVERHAUL MIGRATION (idempotente)
-- Nuevas tablas: payment_proofs
-- Nuevos campos: profiles.is_blocked, blocked_reason, blocked_at, blocked_by
-- Nuevas policies: payment_proofs RLS, admin profiles, notifications insert
-- Realtime publication para tablas clave
-- =====================================================================

-- ENUM para estado de comprobante
do $$ begin create type public.payment_proof_status as enum ('pending','approved','rejected'); exception when duplicate_object then null; end $$;

-- Extender profiles con campos de bloqueo
alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.profiles add column if not exists blocked_reason text;
alter table public.profiles add column if not exists blocked_at timestamptz;
alter table public.profiles add column if not exists blocked_by uuid references auth.users(id) on delete set null;

-- Tabla de comprobantes de pago
create table if not exists public.payment_proofs (
  id               uuid primary key default uuid_generate_v4(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  file_path        text not null,
  bank_name        text,
  reference_number text,
  amount           numeric(10,2),
  notes            text,
  status           public.payment_proof_status not null default 'pending',
  reviewed_by      uuid references auth.users(id) on delete set null,
  reviewed_at      timestamptz,
  rejection_reason text,
  created_at       timestamptz not null default now()
);
create index if not exists payment_proofs_order_id_idx on public.payment_proofs(order_id);
create index if not exists payment_proofs_user_id_idx on public.payment_proofs(user_id);
create index if not exists payment_proofs_status_idx  on public.payment_proofs(status);

-- RLS para payment_proofs
alter table public.payment_proofs enable row level security;

drop policy if exists "payment_proofs_select_own" on public.payment_proofs;
create policy "payment_proofs_select_own" on public.payment_proofs for select using (auth.uid() = user_id);

drop policy if exists "payment_proofs_insert_own" on public.payment_proofs;
create policy "payment_proofs_insert_own" on public.payment_proofs for insert with check (auth.uid() = user_id);

drop policy if exists "payment_proofs_admin_all" on public.payment_proofs;
create policy "payment_proofs_admin_all" on public.payment_proofs for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Funcion SECURITY DEFINER para evitar recursion infinita en policies de profiles
create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  );
$$;
grant execute on function public.is_admin_user() to authenticated;

-- Admin puede modificar cualquier perfil (para bloqueo)
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles for all using (public.is_admin_user());

-- Admin puede insertar notificaciones para cualquier usuario
drop policy if exists "notifications_insert_admin" on public.notifications;
create policy "notifications_insert_admin" on public.notifications for insert with check (public.is_admin_user());

-- Admin puede insertar audit_logs
drop policy if exists "audit_logs_insert_admin" on public.audit_logs;
create policy "audit_logs_insert_admin" on public.audit_logs for insert with check (public.is_admin_user());

-- Usuario puede insertar sus propias notificaciones (desde checkout)
drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications for insert with check (auth.uid() = user_id);

-- Supabase Realtime: agregar tablas a la publicación
-- Nota: estas sentencias pueden fallar si la tabla ya está en la publicación.
-- En producción, ejecutar manualmente o verificar primero.
do $$ begin alter publication supabase_realtime add table public.orders;         exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.order_items;    exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.profiles;       exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.products;       exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.payment_proofs; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.audit_logs;     exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications;  exception when others then null; end $$;
