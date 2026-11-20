create or replace function public.staff_sees_member(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (_user_id = auth.uid() or public.is_staff())
    and public.current_tenant_id() is not null
    and exists (select 1 from public.profiles p where p.id = _user_id and p.tenant_id = public.current_tenant_id())
$$;
revoke execute on function public.staff_sees_member(uuid) from public, anon;
grant execute on function public.staff_sees_member(uuid) to authenticated, service_role;
alter policy "Somente a própria clínica ativa" on public.sessions
  with check (tenant_id = public.current_tenant_id() and public.tenant_is_active() and public.staff_sees_member(therapist_id));
alter policy "Somente a própria clínica ativa" on public.student_assignments
  with check (tenant_id = public.current_tenant_id() and public.tenant_is_active() and public.staff_sees_member(user_id)
    and exists (select 1 from public.students s where s.id = student_ref and s.tenant_id = public.current_tenant_id()));