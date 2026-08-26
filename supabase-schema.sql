create table if not exists public.door_batches (
  id bigint generated always as identity primary key,
  source_key text not null unique,
  record_date date,
  style text not null,
  series text,
  size text not null,
  opening text not null,
  side text not null check (side in ('左','右')),
  original_quantity integer not null default 0,
  stocked_quantity integer not null default 0,
  pending_quantity integer not null default 0,
  production_no text,
  estimated_shipping_date date,
  updated_at timestamptz not null default now()
);

create index if not exists door_batches_lookup_idx
on public.door_batches (style, size, opening, side, estimated_shipping_date);

alter table public.door_batches enable row level security;

drop policy if exists "public can read active door batches" on public.door_batches;
create policy "public can read active door batches"
on public.door_batches for select to anon, authenticated
using (pending_quantity > 0);

drop policy if exists "authenticated can manage door batches" on public.door_batches;
create policy "authenticated can manage door batches"
on public.door_batches for all to authenticated
using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select on public.door_batches to anon, authenticated;
grant insert, update, delete on public.door_batches to authenticated;