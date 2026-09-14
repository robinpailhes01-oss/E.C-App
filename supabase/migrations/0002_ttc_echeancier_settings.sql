-- Lot 1 : saisie TTC, échéancier de paiement, délai d'installation, paramètres direction.

alter table public.orders rename column remise_ht to remise_ttc;
alter table public.orders add column if not exists delai_installation_mois integer;

-- Paramètres globaux (taux de crédit, assurance, durées proposées...), modifiables par la direction.
create table if not exists public.settings (
  id text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

alter table public.settings enable row level security;

drop policy if exists "settings: read all" on public.settings;
create policy "settings: read all" on public.settings
  for select using (auth.uid() is not null);

drop policy if exists "settings: directeur write" on public.settings;
create policy "settings: directeur write" on public.settings
  for all
  using (public.current_role_name() = 'directeur')
  with check (public.current_role_name() = 'directeur');
