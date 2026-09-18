-- 1) 在 Supabase SQL Editor 中运行
create extension if not exists pgcrypto;

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  row_no text,
  product_name text not null,
  size text,
  direction text,
  series text,
  system_stock integer not null default 0,
  actual_count integer,
  checked_at timestamptz,
  checked_by text,
  inventory_uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_audit (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid references public.inventory(id) on delete cascade,
  old_actual_count integer,
  new_actual_count integer,
  changed_at timestamptz not null default now(),
  visitor_id text
);

alter table public.inventory enable row level security;
alter table public.inventory_audit enable row level security;

drop policy if exists "public read inventory" on public.inventory;
create policy "public read inventory" on public.inventory
for select to anon, authenticated using (true);

drop policy if exists "authenticated manage inventory" on public.inventory;
create policy "authenticated manage inventory" on public.inventory
for all to authenticated using (true) with check (true);

grant insert, update, delete on public.inventory to authenticated;

-- 游客不能直接 UPDATE，只能通过这个 RPC 提交实际数量。
create or replace function public.submit_actual_count(
  p_id uuid, p_actual_count integer, p_visitor_id text default null
) returns public.inventory
language plpgsql security definer set search_path=public
as $$
declare old_count integer; result public.inventory;
begin
  if p_actual_count is null or p_actual_count < 0 then
    raise exception '实际数量必须是大于等于0的整数';
  end if;
  select actual_count into old_count from public.inventory where id=p_id for update;
  if not found then raise exception '库存记录不存在'; end if;

  update public.inventory
  set actual_count=p_actual_count, checked_at=now(),
      checked_by=coalesce(nullif(p_visitor_id,''),'游客'), updated_at=now()
  where id=p_id returning * into result;

  insert into public.inventory_audit(inventory_id,old_actual_count,new_actual_count,visitor_id)
  values(p_id,old_count,p_actual_count,p_visitor_id);
  return result;
end $$;

grant execute on function public.submit_actual_count(uuid,integer,text) to anon, authenticated;

create or replace function public.reset_actual_count(
  p_id uuid, p_visitor_id text default null
) returns public.inventory
language plpgsql security definer set search_path=public
as $$
declare old_count integer; result public.inventory;
begin
  select actual_count into old_count from public.inventory where id=p_id for update;
  if not found then raise exception '库存记录不存在'; end if;

  update public.inventory
  set actual_count=null, checked_at=null, checked_by=null, updated_at=now()
  where id=p_id returning * into result;

  insert into public.inventory_audit(inventory_id,old_actual_count,new_actual_count,visitor_id)
  values(p_id,old_count,null,p_visitor_id);
  return result;
end $$;

grant execute on function public.reset_actual_count(uuid,text) to anon, authenticated;

-- 实时同步
do $$ begin
  alter publication supabase_realtime add table public.inventory;
exception when duplicate_object then null;
end $$;

-- 管理员上传库存时，建议使用后端/Edge Function + service_role，
-- service_role 绝不能放在浏览器前端。
