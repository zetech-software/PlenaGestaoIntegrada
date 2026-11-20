grant update (name, audience, min_seats, max_seats, included_seats, monthly_cents, annual_monthly_cents, extra_seat_cents, extra_seat_annual_cents) on public.subscription_tiers to authenticated;
create policy "Operador edita faixas" on public.subscription_tiers for update to authenticated
  using (public.is_platform_operator()) with check (public.is_platform_operator());
alter table public.subscription_tiers
  add constraint subscription_tiers_included_check check (included_seats >= min_seats and (max_seats is null or included_seats <= max_seats)),
  add constraint subscription_tiers_extra_check check (extra_seat_cents >= 0 and extra_seat_annual_cents >= 0);

create table public.tenant_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  amount_cents integer not null check (amount_cents <> 0 and abs(amount_cents) <= 100000000),
  paid_on date not null,
  method text not null check (method in ('Pix','Boleto','Cartão','Transferência','Dinheiro','Estorno')),
  plan_id uuid references public.billing_plans(id) on delete restrict,
  tier_id uuid references public.subscription_tiers(id) on delete restrict,
  period_start date,
  period_end date,
  notes text not null default '' check (char_length(notes) <= 300),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  check (period_end is null or period_start is null or period_end >= period_start)
);
grant select, insert on public.tenant_payments to authenticated;
grant all on public.tenant_payments to service_role;
alter table public.tenant_payments enable row level security;
create policy "Operador vê pagamentos" on public.tenant_payments for select to authenticated using (public.is_platform_operator());
create policy "Operador registra pagamentos" on public.tenant_payments for insert to authenticated
  with check (public.is_platform_operator() and created_by = auth.uid());
create index tenant_payments_tenant_idx on public.tenant_payments (tenant_id, paid_on desc);