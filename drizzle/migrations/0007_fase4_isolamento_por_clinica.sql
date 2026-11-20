create or replace function public.is_platform_operator() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'plataforma')
$$;

create or replace function public.current_tenant_id() returns uuid
language sql stable security definer set search_path = public as $$
  select case when public.has_role(auth.uid(), 'plataforma') then null
              else (select tenant_id from public.profiles where id = auth.uid()) end
$$;

create or replace function public.tenant_is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.tenants t where t.id = public.current_tenant_id() and t.status <> 'Suspenso')
$$;

create or replace function public.in_my_tenant(_user_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_tenant_id() is not null
     and exists (select 1 from public.profiles p where p.id = _user_id and p.tenant_id = public.current_tenant_id())
$$;

create or replace function public.is_tenant_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin') and public.current_tenant_id() is not null and public.tenant_is_active()
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'clinica'))
     and public.current_tenant_id() is not null and public.tenant_is_active()
$$;

create or replace function public.can_see_student(_student_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.tenant_is_active() and exists (
    select 1 from public.students s
    where s.id = _student_id and s.tenant_id = public.current_tenant_id()
      and (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'clinica')
           or exists (select 1 from public.student_assignments a where a.user_id = auth.uid() and a.student_ref = _student_id)))
$$;

create or replace function public.list_therapists() returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name from public.profiles p
  where public.tenant_is_active() and p.tenant_id = public.current_tenant_id()
    and exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'terapeuta')
  order by p.full_name
$$;

-- tenant_id preenchido pelo servidor nas inclusões
do $$ declare t text; begin
  foreach t in array array['students','sessions','anamneses','record_entries','intervention_plans','consents','audit_log','waitlist_entries','charges','student_assignments'] loop
    execute format('alter table public.%I alter column tenant_id set default public.current_tenant_id()', t);
  end loop;
end $$;

create or replace function public.audit_force_now() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.at = now();
  new.user_id = auth.uid();
  new.tenant_id = public.current_tenant_id();
  new.user_email = coalesce((select email from public.profiles where id = new.user_id), '');
  new.role = coalesce((select r.role::text from public.user_roles r where r.user_id = new.user_id
    order by case r.role when 'admin' then 1 when 'clinica' then 2 when 'terapeuta' then 3 else 4 end limit 1), '');
  return new;
end; $$;

-- Guarda por clínica (restritiva: soma-se às regras existentes)
do $$ declare t text; begin
  foreach t in array array['students','anamneses','record_entries','intervention_plans','consents','audit_log','waitlist_entries','charges'] loop
    execute format('create policy "Somente a própria clínica ativa" on public.%I as restrictive for all to authenticated using (tenant_id = public.current_tenant_id() and public.tenant_is_active()) with check (tenant_id = public.current_tenant_id() and public.tenant_is_active())', t);
  end loop;
end $$;
create policy "Somente a própria clínica ativa" on public.sessions as restrictive for all to authenticated
  using (tenant_id = public.current_tenant_id() and public.tenant_is_active())
  with check (tenant_id = public.current_tenant_id() and public.tenant_is_active() and public.in_my_tenant(therapist_id));
create policy "Somente a própria clínica ativa" on public.student_assignments as restrictive for all to authenticated
  using (tenant_id = public.current_tenant_id() and public.tenant_is_active())
  with check (tenant_id = public.current_tenant_id() and public.tenant_is_active() and public.in_my_tenant(user_id)
    and exists (select 1 from public.students s where s.id = student_ref and s.tenant_id = public.current_tenant_id()));
create policy "Somente a própria clínica ativa" on public.plan_goals as restrictive for all to authenticated
  using (public.tenant_is_active() and exists (select 1 from public.intervention_plans p where p.id = plan_id and p.tenant_id = public.current_tenant_id()))
  with check (public.tenant_is_active() and exists (select 1 from public.intervention_plans p where p.id = plan_id and p.tenant_id = public.current_tenant_id()));

-- Perfis e papéis: admin só dentro da própria clínica
drop policy if exists "Own profile or admin" on public.profiles;
drop policy if exists "Admin updates profiles" on public.profiles;
create policy "Próprio perfil ou admin da clínica" on public.profiles for select to authenticated
  using (id = auth.uid() or (public.is_tenant_admin() and tenant_id = public.current_tenant_id()));
create policy "Admin da clínica edita perfis" on public.profiles for update to authenticated
  using (public.is_tenant_admin() and tenant_id = public.current_tenant_id())
  with check (public.is_tenant_admin() and tenant_id = public.current_tenant_id());
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

drop policy if exists "Own roles or admin" on public.user_roles;
drop policy if exists "Admin inserts roles" on public.user_roles;
drop policy if exists "Admin updates roles" on public.user_roles;
drop policy if exists "Admin deletes roles" on public.user_roles;
create policy "Próprios papéis ou admin da clínica" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or (public.is_tenant_admin() and public.in_my_tenant(user_id)));
create policy "Admin da clínica atribui papel" on public.user_roles for insert to authenticated
  with check (public.is_tenant_admin() and public.in_my_tenant(user_id) and role <> 'plataforma');
create policy "Admin da clínica altera papel" on public.user_roles for update to authenticated
  using (public.is_tenant_admin() and public.in_my_tenant(user_id) and role <> 'plataforma')
  with check (public.is_tenant_admin() and public.in_my_tenant(user_id) and role <> 'plataforma');
create policy "Admin da clínica remove papel" on public.user_roles for delete to authenticated
  using (public.is_tenant_admin() and public.in_my_tenant(user_id) and role <> 'plataforma');

drop policy if exists "Own assignments or admin" on public.student_assignments;
drop policy if exists "Admin assigns" on public.student_assignments;
drop policy if exists "Admin unassigns" on public.student_assignments;
create policy "Próprios vínculos ou admin da clínica" on public.student_assignments for select to authenticated
  using (user_id = auth.uid() or public.is_tenant_admin());
create policy "Admin da clínica vincula" on public.student_assignments for insert to authenticated
  with check (public.is_tenant_admin());
create policy "Admin da clínica desvincula" on public.student_assignments for delete to authenticated
  using (public.is_tenant_admin());

-- Clientes
create policy "Operador vê clientes" on public.tenants for select to authenticated
  using (public.is_platform_operator() or (public.has_role(auth.uid(),'admin') and id = public.current_tenant_id()));
create policy "Operador cadastra clientes" on public.tenants for insert to authenticated
  with check (public.is_platform_operator());
create policy "Operador edita clientes" on public.tenants for update to authenticated
  using (public.is_platform_operator()) with check (public.is_platform_operator());

-- Novos usuários: clínica vem de app_metadata (só o servidor define)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare _tenant uuid := nullif(new.raw_app_meta_data->>'tenant_id','')::uuid;
begin
  insert into public.profiles (id, email, full_name, tenant_id)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''), _tenant)
  on conflict (id) do nothing;
  if _tenant is not null then
    insert into public.user_roles (user_id, role) values (new.id, 'terapeuta') on conflict do nothing;
  end if;
  return new;
end; $$;

-- Vagas
create or replace function public.check_tenant_seats() returns trigger
language plpgsql security definer set search_path = public as $$
declare _seats integer; _used integer;
begin
  if new.tenant_id is null or (tg_op = 'UPDATE' and new.tenant_id is not distinct from old.tenant_id) then
    return new;
  end if;
  select seats into _seats from public.tenants where id = new.tenant_id for update;
  select count(*) into _used from public.profiles where tenant_id = new.tenant_id and id <> new.id;
  if _used >= _seats then
    raise exception 'Limite de vagas da clínica atingido (% de %)', _used, _seats;
  end if;
  return new;
end; $$;
create trigger profiles_check_seats before insert or update of tenant_id on public.profiles
  for each row execute function public.check_tenant_seats();