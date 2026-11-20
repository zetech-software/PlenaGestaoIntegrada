alter table public.tenants
  add column subscription_id text,
  add column subscription_status text,
  add column subscription_env text;
alter table public.tenant_payments add column external_id text;
create unique index tenant_payments_external_id_key on public.tenant_payments(external_id) where external_id is not null;