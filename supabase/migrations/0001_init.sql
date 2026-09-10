-- Énergies Concept · Bons de commande
-- Schéma initial : profils (commerciaux / direction) et bons de commande.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profils
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'commercial' check (role in ('commercial', 'directeur')),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Création automatique du profil à l'inscription (rôle commercial par défaut).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'commercial')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rôle de l'utilisateur courant (utilisé par les politiques RLS).
create or replace function public.current_role_name()
returns text
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Bons de commande
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_numero_seq;

create or replace function public.next_order_numero()
returns text
language sql
volatile
as $$
  select 'BC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_numero_seq')::text, 4, '0');
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default public.next_order_numero(),
  status text not null default 'brouillon' check (status in ('brouillon', 'signe', 'annule')),
  commercial_id uuid not null references public.profiles (id),
  commercial_name text not null default '',
  customer jsonb not null default '{}'::jsonb,
  customer_name text not null default '',
  lines jsonb not null default '[]'::jsonb,
  remise_ht numeric(12, 2) not null default 0,
  vat_rate numeric(5, 2) not null default 20,
  financing jsonb not null default '{}'::jsonb,
  total_ht numeric(12, 2) not null default 0,
  total_ttc numeric(12, 2) not null default 0,
  notes text,
  date_installation_prevue date,
  lieu_signature text,
  signature_client text,
  signature_commercial text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_commercial_idx on public.orders (commercial_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sécurité (RLS)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.orders enable row level security;

-- Profils : chacun lit le sien, la direction lit tout et gère l'équipe.
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles: directeur read all" on public.profiles;
create policy "profiles: directeur read all" on public.profiles
  for select using (public.current_role_name() = 'directeur');

drop policy if exists "profiles: directeur update" on public.profiles;
create policy "profiles: directeur update" on public.profiles
  for update using (public.current_role_name() = 'directeur');

-- Bons : un commercial voit et gère ses bons, la direction voit tout.
drop policy if exists "orders: commercial own" on public.orders;
create policy "orders: commercial own" on public.orders
  for all
  using (commercial_id = auth.uid())
  with check (commercial_id = auth.uid());

drop policy if exists "orders: directeur all" on public.orders;
create policy "orders: directeur all" on public.orders
  for all
  using (public.current_role_name() = 'directeur')
  with check (public.current_role_name() = 'directeur');

-- Un bon signé ne peut plus être modifié par un commercial (sauf annulation par la direction).
create or replace function public.protect_signed_orders()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'signe' and public.current_role_name() <> 'directeur' then
    raise exception 'Un bon de commande signé ne peut plus être modifié.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_protect_signed on public.orders;
create trigger orders_protect_signed
  before update or delete on public.orders
  for each row execute function public.protect_signed_orders();
