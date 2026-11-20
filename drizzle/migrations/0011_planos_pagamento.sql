create table public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 60),
  duration_days integer not null check (duration_days between 1 and 3650),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.billing_plans to authenticated;
grant all on public.billing_plans to service_role;
alter table public.billing_plans enable row level security;
create policy "Operador vê planos" on public.billing_plans for select to authenticated using (public.is_platform_operator());
create policy "Operador cria planos" on public.billing_plans for insert to authenticated with check (public.is_platform_operator());
create policy "Operador edita planos" on public.billing_plans for update to authenticated using (public.is_platform_operator()) with check (public.is_platform_operator());
create trigger billing_plans_touch before update on public.billing_plans for each row execute function public.touch_updated_at();
insert into public.billing_plans (name, duration_days) values ('Plano Mensal', 30), ('Plano Anual', 365);

alter table public.tenants add column plan_id uuid references public.billing_plans(id) on delete restrict,
  add column valid_until date;