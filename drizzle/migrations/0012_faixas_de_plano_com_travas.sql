create table public.subscription_tiers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  audience text not null,
  min_seats integer not null check (min_seats >= 1),
  max_seats integer check (max_seats is null or max_seats >= min_seats),
  included_seats integer not null,
  monthly_cents integer not null check (monthly_cents >= 0),
  annual_monthly_cents integer not null check (annual_monthly_cents >= 0),
  extra_seat_cents integer not null default 0,
  extra_seat_annual_cents integer not null default 0,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.subscription_tiers to authenticated;
grant all on public.subscription_tiers to service_role;
alter table public.subscription_tiers enable row level security;
create policy "Operador vê faixas" on public.subscription_tiers for select to authenticated using (public.is_platform_operator());
insert into public.subscription_tiers (code,name,audience,min_seats,max_seats,included_seats,monthly_cents,annual_monthly_cents,extra_seat_cents,extra_seat_annual_cents,position) values
 ('consultorio','Consultório','1 profissional',1,1,1,11900,9900,0,0,1),
 ('clinica','Clínica','até 5 terapeutas',1,6,6,34900,28900,0,0,2),
 ('multidisciplinar','Multidisciplinar','a partir de 6 terapeutas',7,null,7,49000,41650,3500,2975,3);

alter table public.tenants add column tier_id uuid references public.subscription_tiers(id) on delete restrict;

create or replace function public.check_tenant_tier() returns trigger
language plpgsql security definer set search_path = public as $$
declare t record; _used integer;
begin
  if new.tier_id is not null then
    select * into t from public.subscription_tiers where id = new.tier_id;
    if new.seats < t.min_seats or (t.max_seats is not null and new.seats > t.max_seats) then
      raise exception 'O plano % aceita de % a % vagas', t.name, t.min_seats, coalesce(t.max_seats::text, 'ilimitadas');
    end if;
  end if;
  if tg_op = 'UPDATE' and new.seats < old.seats then
    select count(*) into _used from public.profiles where tenant_id = new.id;
    if new.seats < _used then
      raise exception 'O cliente já tem % pessoas cadastradas; não dá para reduzir para % vagas', _used, new.seats;
    end if;
  end if;
  return new;
end; $$;
revoke execute on function public.check_tenant_tier() from public, anon, authenticated;
create trigger tenants_check_tier before insert or update of tier_id, seats on public.tenants
  for each row execute function public.check_tenant_tier();