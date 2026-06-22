-- =====================================================================
-- Cora Mely · Esquema completo (idempotente)
-- Ejecuta este archivo en el SQL editor de Supabase para crear todo.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ENUMS -------------------------------------------------------------
do $$ begin create type public.order_status      as enum ('pending','processing','shipped','delivered','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_method    as enum ('stripe','paypal','cod','bank_transfer'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status    as enum ('pending','paid','failed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.coupon_type       as enum ('percentage','fixed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.notification_type as enum ('order','promo','system','review'); exception when duplicate_object then null; end $$;

-- TABLES ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  phone       text,
  email       text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  image_url   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id                 uuid primary key default uuid_generate_v4(),
  category_id        uuid references public.categories(id) on delete set null,
  slug               text,
  name               text not null,
  description        text not null default '',
  price              numeric(10,2) not null check (price >= 0),
  discount_price     numeric(10,2) check (discount_price is null or discount_price >= 0),
  stock              integer not null default 0 check (stock >= 0),
  images             text[] not null default '{}',
  is_featured        boolean not null default false,
  rating             numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  sales_count        integer not null default 0,
  materials          text,
  dimensions         text,
  care_instructions  text,
  created_at         timestamptz not null default now()
);
-- Idempotente para bases ya existentes (ver tambien supabase/migration-product-details.sql)
alter table public.products add column if not exists materials text;
alter table public.products add column if not exists dimensions text;
alter table public.products add column if not exists care_instructions text;
create unique index if not exists products_slug_idx        on public.products(slug) where slug is not null;
create index        if not exists products_category_id_idx on public.products(category_id);
create index        if not exists products_is_featured_idx on public.products(is_featured) where is_featured;
create index        if not exists products_sales_count_idx on public.products(sales_count desc);

create table if not exists public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists reviews_product_id_idx on public.reviews(product_id);

create table if not exists public.addresses (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  address_line1   text not null,
  address_line2   text,
  city            text not null,
  province        text not null,
  zip_code        text,
  phone           text not null,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists addresses_user_id_idx on public.addresses(user_id);

create table if not exists public.coupons (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null unique,
  description     text,
  type            public.coupon_type not null,
  discount_value  numeric(10,2) not null check (discount_value > 0),
  min_purchase    numeric(10,2) not null default 0,
  max_uses        integer,
  used_count      integer not null default 0,
  valid_from      timestamptz not null default now(),
  valid_until     timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.orders (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  status           public.order_status   not null default 'pending',
  subtotal         numeric(10,2),
  shipping         numeric(10,2)         not null default 0,
  discount         numeric(10,2)         not null default 0,
  total            numeric(10,2)         not null check (total >= 0),
  payment_method   public.payment_method not null,
  payment_status   public.payment_status not null default 'pending',
  address_id       uuid references public.addresses(id) on delete set null,
  coupon_id        uuid references public.coupons(id)   on delete set null,
  tracking_number  text,
  created_at       timestamptz not null default now()
);
create index if not exists orders_user_id_idx on public.orders(user_id);

create table if not exists public.order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete restrict,
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(10,2) not null check (unit_price >= 0),
  created_at  timestamptz not null default now()
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

create table if not exists public.wishlists (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists wishlists_user_id_idx on public.wishlists(user_id);

create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  message     text not null,
  type        public.notification_type not null default 'system',
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, read);

create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_user_id_idx on public.audit_logs(user_id);
create index if not exists audit_logs_entity_idx  on public.audit_logs(entity_type, entity_id);

create table if not exists public.carts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create table if not exists public.cart_items (
  id          uuid primary key default uuid_generate_v4(),
  cart_id     uuid not null references public.carts(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  quantity    integer not null check (quantity > 0),
  created_at  timestamptz not null default now(),
  unique (cart_id, product_id)
);

-- RLS ---------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.categories    enable row level security;
alter table public.products      enable row level security;
alter table public.reviews       enable row level security;
alter table public.addresses     enable row level security;
alter table public.coupons       enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.wishlists     enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs    enable row level security;
alter table public.carts         enable row level security;
alter table public.cart_items    enable row level security;

-- POLICIES helper -- usuario admin
-- Reglas públicas
drop policy if exists "profiles_select_all"   on public.profiles;
drop policy if exists "profiles_update_own"   on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "categories_select_all" on public.categories;
drop policy if exists "products_select_all"   on public.products;
create policy "categories_select_all" on public.categories for select using (true);
create policy "products_select_all"   on public.products   for select using (true);

drop policy if exists "reviews_select_all"  on public.reviews;
drop policy if exists "reviews_insert_own"  on public.reviews;
drop policy if exists "reviews_update_own"  on public.reviews;
drop policy if exists "reviews_delete_own"  on public.reviews;
create policy "reviews_select_all" on public.reviews for select using (true);
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);

-- Direcciones, órdenes, items, wishlist, notifs, carts: dueño
drop policy if exists "addresses_select_own" on public.addresses;
drop policy if exists "addresses_insert_own" on public.addresses;
drop policy if exists "addresses_update_own" on public.addresses;
drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_select_own" on public.addresses for select using (auth.uid() = user_id);
create policy "addresses_insert_own" on public.addresses for insert with check (auth.uid() = user_id);
create policy "addresses_update_own" on public.addresses for update using (auth.uid() = user_id);
create policy "addresses_delete_own" on public.addresses for delete using (auth.uid() = user_id);

drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_select_own" on public.orders for select using (auth.uid() = user_id);
create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = user_id);

drop policy if exists "order_items_select_own" on public.order_items;
drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_select_own" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
);
create policy "order_items_insert_own" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
);

drop policy if exists "wishlists_select_own" on public.wishlists;
drop policy if exists "wishlists_insert_own" on public.wishlists;
drop policy if exists "wishlists_delete_own" on public.wishlists;
create policy "wishlists_select_own" on public.wishlists for select using (auth.uid() = user_id);
create policy "wishlists_insert_own" on public.wishlists for insert with check (auth.uid() = user_id);
create policy "wishlists_delete_own" on public.wishlists for delete using (auth.uid() = user_id);

drop policy if exists "coupons_select_active" on public.coupons;
create policy "coupons_select_active" on public.coupons for select using (is_active = true);

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);

-- Funcion SECURITY DEFINER para verificar admin sin recursion RLS
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

drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin" on public.audit_logs for select using (public.is_admin_user());

drop policy if exists "carts_select_own" on public.carts;
drop policy if exists "carts_insert_own" on public.carts;
drop policy if exists "carts_update_own" on public.carts;
drop policy if exists "carts_delete_own" on public.carts;
create policy "carts_select_own" on public.carts for select using (auth.uid() = user_id);
create policy "carts_insert_own" on public.carts for insert with check (auth.uid() = user_id);
create policy "carts_update_own" on public.carts for update using (auth.uid() = user_id);
create policy "carts_delete_own" on public.carts for delete using (auth.uid() = user_id);

drop policy if exists "cart_items_select_own" on public.cart_items;
drop policy if exists "cart_items_insert_own" on public.cart_items;
drop policy if exists "cart_items_update_own" on public.cart_items;
drop policy if exists "cart_items_delete_own" on public.cart_items;
create policy "cart_items_select_own" on public.cart_items for select using (
  exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
);
create policy "cart_items_insert_own" on public.cart_items for insert with check (
  exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
);
create policy "cart_items_update_own" on public.cart_items for update using (
  exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
);
create policy "cart_items_delete_own" on public.cart_items for delete using (
  exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
);

-- Admin override (CRUD) — usa is_admin_user() SECURITY DEFINER para evitar recursion RLS
drop policy if exists "products_admin_all"   on public.products;
drop policy if exists "categories_admin_all" on public.categories;
drop policy if exists "orders_admin_all"     on public.orders;
drop policy if exists "order_items_admin_all" on public.order_items;
drop policy if exists "coupons_admin_all"    on public.coupons;
create policy "products_admin_all"    on public.products   for all using (public.is_admin_user());
create policy "categories_admin_all"  on public.categories for all using (public.is_admin_user());
create policy "orders_admin_all"      on public.orders     for all using (public.is_admin_user());
create policy "order_items_admin_all" on public.order_items for all using (public.is_admin_user());
create policy "coupons_admin_all"     on public.coupons    for all using (public.is_admin_user());

-- TRIGGERS / FUNCTIONS --------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.decrement_stock(p_id uuid, qty integer)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.products
  set stock = greatest(0, stock - qty), sales_count = sales_count + qty
  where id = p_id;
end;
$$;

create or replace function public.increment_coupon_use(c_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.coupons set used_count = used_count + 1 where id = c_id;
end;
$$;

grant execute on function public.decrement_stock(uuid, integer) to authenticated;
grant execute on function public.increment_coupon_use(uuid)     to authenticated;

-- Promover usuario a admin por correo (uso manual)
create or replace function public.promote_admin(p_email text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set is_admin = true
  where lower(email) = lower(p_email);
end;
$$;

-- LIMPIEZA DE SEED ANTERIOR (ropa urbana) -----------------------------
-- Quita el catálogo demo de la etapa "Cora Mely streetwear" antes del
-- pivote a decoración artesanal. Seguro de re-ejecutar.
delete from public.products where slug in (
  'camiseta-rd-flow', 'jogger-streetwear-negro', 'sudadera-capucha-roja',
  'top-corto-perreo', 'leggings-deportivos', 'gorra-snapback-rd'
);
delete from public.categories where slug in ('hombre', 'mujer', 'accesorios');

-- SEED CATEGORÍAS ----------------------------------------------------
insert into public.categories (name, slug, image_url) values
  ('Macramé',              'macrame',              'https://images.unsplash.com/photo-1633594308237-3dcfa56b4e69?q=80&w=2071'),
  ('Cuadros texturizados', 'cuadros-texturizados', 'https://images.unsplash.com/photo-1608158680747-943c02770c5e?q=80&w=2070'),
  ('Esculturas en yeso',   'esculturas-yeso',      'https://images.unsplash.com/photo-1447758902204-48010b87c24d?q=80&w=2070'),
  ('Decoración de mesa',   'decoracion-mesa',      'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=2070'),
  ('Piezas de pared',      'piezas-pared',         'https://images.unsplash.com/photo-1632761644913-0da6105863cb?q=80&w=2070')
on conflict (slug) do nothing;

-- SEED CUPONES --------------------------------------------------------
insert into public.coupons (code, description, type, discount_value, min_purchase, max_uses, valid_until)
values
  ('BIENVENIDA20', '20% de descuento en tu primera compra', 'percentage', 20, 1500, 500, now() + interval '60 days'),
  ('ENVIORD',      'Envío gratis en compras mayores a RD$2500', 'fixed', 250, 2500, null, now() + interval '90 days'),
  ('HOGAR10',      '10% extra al decorar tu hogar', 'percentage', 10, 0, null, now() + interval '30 days')
on conflict (code) do nothing;

update public.coupons set description = '10% extra al decorar tu hogar' where code = 'HOGAR10';

-- SEED PRODUCTOS ------------------------------------------------------
with cat as (select id, slug from public.categories where slug in ('macrame','cuadros-texturizados','esculturas-yeso','decoracion-mesa','piezas-pared'))
insert into public.products (category_id, slug, name, description, price, discount_price, stock, images, is_featured, rating, sales_count, materials, dimensions, care_instructions)
select (select id from cat where slug = p.cat_slug), p.slug, p.name, p.description, p.price, p.discount_price, p.stock, p.images, p.is_featured, p.rating, p.sales_count, p.materials, p.dimensions, p.care_instructions
from (values
  ('macrame',              'tapiz-macrame-brisa',
    'Tapiz de macramé "Brisa"',
    'Tapiz tejido a mano con nudos tradicionales de macramé. Una pieza ligera y aireada que aporta calidez y textura natural a cualquier pared.',
    2400, 1900, 14,
    array['https://images.unsplash.com/photo-1619808799783-db68de98fbe0?q=80&w=1200'],
    true, 4.9, 86,
    'Algodón 100% sin teñir, varilla de madera de pino',
    '90 x 60 cm',
    'Sacudir el polvo con brocha seca. Evitar humedad y luz solar directa.'),
  ('cuadros-texturizados', 'cuadro-texturizado-arena',
    'Cuadro texturizado "Arena"',
    'Cuadro con textura tipo estuco aplicada a mano, inspirado en las dunas y la arena del Caribe. Tonos cálidos que se integran a espacios modernos.',
    3200, null, 9,
    array['https://images.unsplash.com/photo-1614516960150-3edb5b923887?q=80&w=1200'],
    true, 4.8, 52,
    'Pasta de estuco sobre lienzo, marco de madera',
    '70 x 100 cm',
    'Limpiar con paño suave y seco. No frotar la textura ni usar productos líquidos.'),
  ('esculturas-yeso',      'escultura-yeso-luna',
    'Escultura en yeso "Luna"',
    'Escultura de mesa tallada y pulida a mano en yeso cerámico. Forma orgánica inspirada en las fases lunares, acabado mate.',
    1800, 1450, 11,
    array['https://images.unsplash.com/photo-1551047163-78c1a36ad573?q=80&w=1200'],
    true, 4.9, 64,
    'Yeso cerámico, base de fibra natural',
    '18 x 24 cm aprox.',
    'Limpiar con paño seco o ligeramente húmedo. No sumergir en agua.'),
  ('decoracion-mesa',      'centro-de-mesa-artesanal',
    'Centro de mesa artesanal',
    'Centro de mesa en fibras naturales trenzadas a mano, ideal para frutero o como pieza decorativa independiente.',
    1450, null, 20,
    array['https://images.unsplash.com/photo-1631125915597-adf46a94e436?q=80&w=1200'],
    false, 4.6, 38,
    'Fibras naturales (bejuco), base de madera',
    '30 cm de diámetro x 8 cm alto',
    'Mantener alejado de la humedad constante. Sacudir con paño seco.'),
  ('decoracion-mesa',      'set-portavelas-yeso',
    'Set de portavelas en yeso',
    'Set de 3 portavelas de yeso moldeados a mano, en distintos tamaños, con acabado artesanal ligeramente texturizado.',
    1200, 950, 16,
    array['https://images.unsplash.com/photo-1631125915671-e632fadad927?q=80&w=1200'],
    true, 4.7, 71,
    'Yeso cerámico',
    'Set de 3: 6, 9 y 12 cm de alto',
    'Limpiar el exceso de cera con un paño seco. Evitar golpes en los bordes.'),
  ('piezas-pared',         'pieza-mural-fibras-naturales',
    'Pieza mural de fibras naturales',
    'Pieza mural tejida con fibras naturales y ramas secas, pensada para dar profundidad y textura a paredes vacías.',
    2750, 2200, 7,
    array['https://images.unsplash.com/photo-1654636437732-897b94921f78?q=80&w=1200'],
    false, 4.8, 29,
    'Fibras naturales, ramas secas, hilo de algodón',
    '80 x 50 cm',
    'Colgar lejos de fuentes de calor directo. Sacudir suavemente para quitar el polvo.')
) as p(cat_slug, slug, name, description, price, discount_price, stock, images, is_featured, rating, sales_count, materials, dimensions, care_instructions)
on conflict (slug) where slug is not null do nothing;

-- =====================================================================
-- ADMIN OVERHAUL: payment_proofs, profile blocking, realtime
-- =====================================================================

do $$ begin create type public.payment_proof_status as enum ('pending','approved','rejected'); exception when duplicate_object then null; end $$;

alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.profiles add column if not exists blocked_reason text;
alter table public.profiles add column if not exists blocked_at timestamptz;
alter table public.profiles add column if not exists blocked_by uuid references auth.users(id) on delete set null;

create table if not exists public.payment_proofs (
  id               uuid primary key default uuid_generate_v4(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  file_path        text not n