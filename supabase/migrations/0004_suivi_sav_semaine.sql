-- Lot suivi de dossier : rôle secrétariat, suivi des dossiers, agenda (poses), SAV, photos.

-- ---------------------------------------------------------------------------
-- Rôle « secretaire »
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('commercial', 'directeur', 'secretaire'));

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce(public.current_role_name() in ('directeur', 'secretaire'), false);
$$;

-- La secrétaire lit tous les profils (noms des commerciaux) et tous les bons.
drop policy if exists "profiles: staff read all" on public.profiles;
create policy "profiles: staff read all" on public.profiles
  for select using (public.is_staff());

drop policy if exists "orders: secretaire read" on public.orders;
create policy "orders: secretaire read" on public.orders
  for select using (public.current_role_name() = 'secretaire');

-- ---------------------------------------------------------------------------
-- Suivi de dossier (un enregistrement par bon)
-- ---------------------------------------------------------------------------
create table if not exists public.dossiers (
  order_id uuid primary key references public.orders (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists dossiers_set_updated_at on public.dossiers;
create trigger dossiers_set_updated_at
  before update on public.dossiers
  for each row execute function public.set_updated_at();

alter table public.dossiers enable row level security;

-- Direction et secrétariat : lecture et écriture. Commercial : lecture des dossiers de ses bons.
drop policy if exists "dossiers: staff all" on public.dossiers;
create policy "dossiers: staff all" on public.dossiers
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "dossiers: commercial read own" on public.dossiers;
create policy "dossiers: commercial read own" on public.dossiers
  for select using (exists (select 1 from public.orders o where o.id = order_id and o.commercial_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- SAV
-- ---------------------------------------------------------------------------
create sequence if not exists public.sav_numero_seq;

create or replace function public.next_sav_numero()
returns text
language sql
volatile
as $$
  select 'SAV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.sav_numero_seq')::text, 4, '0');
$$;

create table if not exists public.sav (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default public.next_sav_numero(),
  statut text not null default 'ouvert' check (statut in ('ouvert', 'en_cours', 'planifie', 'resolu')),
  urgence text not null default 'normale' check (urgence in ('normale', 'urgente')),
  order_id uuid references public.orders (id) on delete set null,
  commercial_id uuid references public.profiles (id),
  declared_by uuid not null references public.profiles (id),
  date_prevue date,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sav_statut_idx on public.sav (statut, created_at desc);

drop trigger if exists sav_set_updated_at on public.sav;
create trigger sav_set_updated_at
  before update on public.sav
  for each row execute function public.set_updated_at();

alter table public.sav enable row level security;

drop policy if exists "sav: staff all" on public.sav;
create policy "sav: staff all" on public.sav
  for all using (public.is_staff()) with check (public.is_staff());

-- Un commercial déclare un SAV et suit ceux qu'il a déclarés ou qui concernent ses bons.
drop policy if exists "sav: commercial read" on public.sav;
create policy "sav: commercial read" on public.sav
  for select using (declared_by = auth.uid() or commercial_id = auth.uid());

drop policy if exists "sav: commercial insert" on public.sav;
create policy "sav: commercial insert" on public.sav
  for insert with check (declared_by = auth.uid());

drop policy if exists "sav: commercial update own" on public.sav;
create policy "sav: commercial update own" on public.sav
  for update using (declared_by = auth.uid()) with check (declared_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Photos : bucket privé « dossiers » (documents clients, photos SAV)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('dossiers', 'dossiers', false)
on conflict (id) do nothing;

drop policy if exists "dossiers files: authenticated read" on storage.objects;
create policy "dossiers files: authenticated read" on storage.objects
  for select using (bucket_id = 'dossiers' and auth.uid() is not null);

drop policy if exists "dossiers files: authenticated insert" on storage.objects;
create policy "dossiers files: authenticated insert" on storage.objects
  for insert with check (bucket_id = 'dossiers' and auth.uid() is not null);

drop policy if exists "dossiers files: staff delete" on storage.objects;
create policy "dossiers files: staff delete" on storage.objects
  for delete using (bucket_id = 'dossiers' and public.is_staff());
