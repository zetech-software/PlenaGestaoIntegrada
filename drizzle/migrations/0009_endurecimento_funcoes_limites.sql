-- 1. Funções: has_role / in_my_tenant só para o próprio usuário
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select _user_id = auth.uid() and exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.in_my_tenant(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _user_id = auth.uid() and public.current_tenant_id() is not null
     and exists (select 1 from public.profiles p where p.id = _user_id and p.tenant_id = public.current_tenant_id())
$$;
-- Políticas que checavam outro usuário passam a consultar profiles diretamente (sujeito ao RLS de profiles)
alter policy "Somente a própria clínica ativa" on public.sessions
  with check (tenant_id = public.current_tenant_id() and public.tenant_is_active()
    and exists (select 1 from public.profiles p where p.id = therapist_id and p.tenant_id = public.current_tenant_id()));
alter policy "Somente a própria clínica ativa" on public.student_assignments
  with check (tenant_id = public.current_tenant_id() and public.tenant_is_active()
    and exists (select 1 from public.profiles p where p.id = user_id and p.tenant_id = public.current_tenant_id())
    and exists (select 1 from public.students s where s.id = student_ref and s.tenant_id = public.current_tenant_id()));
alter policy "Próprios papéis ou admin da clínica" on public.user_roles
  using (user_id = auth.uid() or (public.is_tenant_admin()
    and exists (select 1 from public.profiles p where p.id = user_id and p.tenant_id = public.current_tenant_id())));
alter policy "Admin da clínica atribui papel" on public.user_roles
  with check (public.is_tenant_admin() and role <> 'plataforma'
    and exists (select 1 from public.profiles p where p.id = user_id and p.tenant_id = public.current_tenant_id()));
alter policy "Admin da clínica altera papel" on public.user_roles
  using (public.is_tenant_admin() and role <> 'plataforma'
    and exists (select 1 from public.profiles p where p.id = user_id and p.tenant_id = public.current_tenant_id()))
  with check (public.is_tenant_admin() and role <> 'plataforma'
    and exists (select 1 from public.profiles p where p.id = user_id and p.tenant_id = public.current_tenant_id()));
alter policy "Admin da clínica remove papel" on public.user_roles
  using (public.is_tenant_admin() and role <> 'plataforma'
    and exists (select 1 from public.profiles p where p.id = user_id and p.tenant_id = public.current_tenant_id()));

-- 2. consents: criação controlada pelo servidor
create or replace function public.current_term_version() returns text
language sql immutable set search_path = public as $$ select 'v1'::text $$;
create or replace function public.consents_on_insert() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.revoked_on is not null then
    raise exception 'Consentimento não pode ser criado já revogado';
  end if;
  new.granted_on = current_date;
  new.term_version = public.current_term_version();
  return new;
end; $$;
create trigger consents_on_insert before insert on public.consents
  for each row execute function public.consents_on_insert();

-- 3. audit_log
alter table public.audit_log
  add constraint audit_log_action_check check (action in ('visualizou','criou','editou','exportou','consentiu','revogou')),
  add constraint audit_log_resource_check check (resource in ('aluno','anamnese','prontuario','plano','consentimento','cobranca','dados do aluno')),
  add constraint audit_log_detail_len check (char_length(detail) <= 500);
create index if not exists audit_log_user_at_idx on public.audit_log (user_id, at);
create or replace function public.audit_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.audit_log where user_id = new.user_id and at > now() - interval '1 minute') >= 300 then
    raise exception 'Limite de eventos de auditoria por minuto atingido';
  end if;
  return new;
end; $$;
-- roda depois de audit_log_now (ordem alfabética), quando user_id já veio do servidor
create trigger audit_log_rate before insert on public.audit_log
  for each row execute function public.audit_rate_limit();

-- 4. user_roles: nunca remover o último admin da clínica
create or replace function public.keep_last_admin() returns trigger
language plpgsql security definer set search_path = public as $$
declare _tenant uuid;
begin
  if old.role <> 'admin' or (tg_op = 'UPDATE' and new.role = 'admin' and new.user_id = old.user_id) then
    return coalesce(new, old);
  end if;
  if not exists (select 1 from auth.users where id = old.user_id) then
    return coalesce(new, old); -- conta sendo apagada por completo
  end if;
  select tenant_id into _tenant from public.profiles where id = old.user_id;
  if _tenant is not null and not exists (
    select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.role = 'admin' and p.tenant_id = _tenant and r.id <> old.id) then
    raise exception 'A clínica precisa manter pelo menos um administrador';
  end if;
  return coalesce(new, old);
end; $$;
create trigger user_roles_keep_last_admin before update or delete on public.user_roles
  for each row execute function public.keep_last_admin();

-- 5. Limites de texto livre
alter table public.students add constraint students_notes_len check (char_length(notes) <= 4000);
alter table public.anamneses add constraint anamneses_len check (
  char_length(main_complaint) <= 8000 and char_length(referral) <= 8000 and char_length(gestation) <= 8000
  and char_length(development) <= 8000 and char_length(health) <= 8000 and char_length(family) <= 8000
  and char_length(school) <= 8000 and char_length(expectations) <= 8000 and char_length(specialty) <= 8000);
alter table public.record_entries add constraint record_entries_len check (
  char_length(objectives) <= 8000 and char_length(activities) <= 8000 and char_length(observations) <= 8000
  and char_length(evolution) <= 8000 and char_length(next_steps) <= 8000 and char_length(specialty) <= 8000);
alter table public.intervention_plans add constraint intervention_plans_len check (
  char_length(title) <= 8000 and char_length(summary) <= 8000 and char_length(specialty) <= 8000 and char_length(kind) <= 8000);
alter table public.plan_goals add constraint plan_goals_len check (char_length(description) <= 1000 and char_length(strategy) <= 1000);
alter table public.consents add constraint consents_guardian_len check (char_length(guardian) <= 160);
alter table public.charges add constraint charges_description_len check (char_length(description) <= 160);

-- 1. EXECUTE: nada para PUBLIC/anon; authenticated só onde é preciso
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon;
grant execute on function public.has_role(uuid, public.app_role), public.in_my_tenant(uuid),
  public.current_tenant_id(), public.tenant_is_active(), public.is_platform_operator(),
  public.is_staff(), public.is_tenant_admin(), public.can_see_student(uuid),
  public.has_active_consent(uuid, text), public.list_therapists(),
  public.create_session_series(jsonb), public.current_term_version() to authenticated;
grant execute on all functions in schema public to service_role;