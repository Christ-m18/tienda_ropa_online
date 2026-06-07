-- =====================================================================
-- OAUTH SUPPORT
-- Actualiza handle_new_user para manejar metadata de Google y Facebook.
-- Google envía: name/full_name, picture/avatar_url
-- Facebook envía: name/full_name, picture/avatar_url
-- Supabase normaliza ambos a full_name y avatar_url en raw_user_meta_data,
-- pero se usa COALESCE como fallback por seguridad.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    new.email
  )
  on conflict (id) do update set
    email      = excluded.email,
    full_name  = coalesce(profiles.full_name,  excluded.full_name),
    avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$;

-- Consistencia: payment_proofs_admin_all debe usar is_admin_user() como el resto
drop policy if exists "payment_proofs_admin_all" on public.payment_proofs;
create policy "payment_proofs_admin_all" on public.payment_proofs
  for all using (public.is_admin_user());
