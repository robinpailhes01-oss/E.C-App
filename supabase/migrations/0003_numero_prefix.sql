-- Numérotation alignée sur le carnet papier : EC-2026-0524.
create or replace function public.next_order_numero()
returns text
language sql
volatile
as $$
  select 'EC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_numero_seq')::text, 4, '0');
$$;
