-- supabase/migration-bank-accounts.sql
-- Idempotente: ejecuta sin errores en una base ya existente.

-- 1. Tabla bank_accounts
create table if not exists public.bank_accounts (
  id              uuid primary key default uuid_generate_v4(),
  bank_name       text not null,
  account_number  text not null,
  account_holder  text,
  account_type    text,
  display_color   text not null default '#1e40af',
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create unique index if not exists bank_accounts_bank_name_idx on public.bank_accounts(bank_name);
create index        if not exists bank_accounts_active_sort_idx on public.bank_accounts(is_active, sort_order);

alter table public.bank_accounts enable row level security;

drop policy if exists "bank_accounts_select_active" on public.bank_accounts;
create policy "bank_accounts_select_active" on public.bank_accounts
  for select using (is_active = true or public.is_admin_user());

drop policy if exists "bank_accounts_admin_all" on public.bank_accounts;
create policy "bank_accounts_admin_all" on public.bank_accounts
  for all using (public.is_admin_user());

-- 2. FK en payment_proofs
alter table public.payment_proofs
  add column if not exists bank_account_id uuid references public.bank_accounts(id) on delete set null;

create index if not exists payment_proofs_bank_account_id_idx
  on public.payment_proofs(bank_account_id);

-- 3. Seed (idempotente via ON CONFLICT DO NOTHING con unique en bank_name)
insert into public.bank_accounts
  (bank_name, account_number, account_holder, account_type, display_color, sort_order)
values
  ('Banco de Reservas', '9601750827',     'Cora Mely', 'Corriente', '#16a34a', 1),
  ('Banco BHD',         '38675820016',    'Cora Mely', 'Ahorro',    '#1d4ed8', 2),
  ('Banco Santa Cruz',  '11145000018017', 'Cora Mely', 'Corriente', '#b91c1c', 3)
on conflict (bank_name) do nothing;
