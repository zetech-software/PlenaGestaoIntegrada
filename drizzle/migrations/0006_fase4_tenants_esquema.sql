create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('clinica','autonomo')),
  name text not null,
  document text not null unique check (document ~ '^[0-9]{11}$|^[0-9]{14}$'),
  owner_name text not null default '',
  owner_email text not null unique,
  phone text not null default '',
  registration text not null default '',
  seats integer not null default 1 check (seats between 1 and 200),
  status text not null default 'Em implantação' check (status in ('Em implantação','Ativo','Suspenso')),
  created_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'autonomo' or seats = 1)
);
create trigger tenants_touch before update on public.tenants for each row execute function public.touch_updated_at();
grant select, insert, update on public.tenants to authenticated;
grant all on public.tenants to service_role;
alter table public.tenants enable row level security;

insert into public.tenants (id, kind, name, document, owner_name, owner_email, seats, status)
values ('00000000-0000-4000-8000-00000000a001', 'clinica', 'Clínica Piloto', '00000000000191', 'Equipe Plena', 'piloto@plenagestao.app', 20, 'Ativo');

alter table public.profiles add column tenant_id uuid references public.tenants(id) on delete restrict;
update public.profiles p set tenant_id = '00000000-0000-4000-8000-00000000a001'
  where not exists (select 1 from public.user_roles r where r.user_id = p.id and r.role::text = 'plataforma');
create index on public.profiles (tenant_id);

do $$ declare t text; begin
  foreach t in array array['students','sessions','anamneses','record_entries','intervention_plans','consents','audit_log','waitlist_entries','charges','student_assignments'] loop
    execute format('alter table public.%I add column tenant_id uuid references public.tenants(id) on delete restrict', t);
    execute format('update public.%I set tenant_id = %L', t, '00000000-0000-4000-8000-00000000a001');
    execute format('alter table public.%I alter column tenant_id set not null', t);
    execute format('create index on public.%I (tenant_id)', t);
  end loop;
end $$;