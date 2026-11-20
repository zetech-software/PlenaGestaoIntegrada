create table public.consents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  purpose text not null check (purpose in ('tratamento','escola','ia')),
  guardian text not null,
  granted_on date not null default current_date,
  revoked_on date,
  term_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (revoked_on is null or revoked_on >= granted_on)
);
create unique index consents_one_active on public.consents (student_id, purpose) where revoked_on is null;
create trigger consents_touch before update on public.consents for each row execute function public.touch_updated_at();
grant select, insert, update on public.consents to authenticated;
grant all on public.consents to service_role;
alter table public.consents enable row level security;
create policy "Ver consentimentos" on public.consents for select to authenticated using (public.can_see_student(student_id));
create policy "Equipe concede" on public.consents for insert to authenticated with check (public.is_staff() and public.can_see_student(student_id));
create policy "Equipe revoga" on public.consents for update to authenticated using (public.is_staff()) with check (public.is_staff());

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  user_id uuid not null default auth.uid(),
  user_email text not null default '',
  role text not null default '',
  action text not null,
  resource text not null,
  student_id uuid,
  detail text not null default ''
);
create index on public.audit_log (at desc);
create index on public.audit_log (student_id);
create or replace function public.audit_force_now() returns trigger language plpgsql set search_path = public as $$
begin new.at = now(); new.user_id = auth.uid(); return new; end; $$;
create trigger audit_log_now before insert on public.audit_log for each row execute function public.audit_force_now();
grant select, insert on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "Registrar própria ação" on public.audit_log for insert to authenticated with check (user_id = auth.uid());
create policy "Admin lê auditoria" on public.audit_log for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.has_active_consent(_student_id uuid, _purpose text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_see_student(_student_id) and exists (
    select 1 from public.consents where student_id = _student_id and purpose = _purpose and revoked_on is null)
$$;