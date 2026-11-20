drop policy if exists "Apagar por aluno" on public.record_entries;
drop policy if exists "Apagar por aluno" on public.anamneses;
drop policy if exists "Apagar por aluno" on public.intervention_plans;
drop policy if exists "Metas pelo plano" on public.plan_goals;
revoke delete on public.record_entries, public.anamneses, public.intervention_plans, public.plan_goals from authenticated;

create policy "Ver metas pelo plano" on public.plan_goals for select to authenticated
  using (exists (select 1 from public.intervention_plans p where p.id = plan_id and public.can_see_student(p.student_id)));
create policy "Criar metas pelo plano" on public.plan_goals for insert to authenticated
  with check (exists (select 1 from public.intervention_plans p where p.id = plan_id and public.can_see_student(p.student_id)));
create policy "Editar metas pelo plano" on public.plan_goals for update to authenticated
  using (exists (select 1 from public.intervention_plans p where p.id = plan_id and public.can_see_student(p.student_id)))
  with check (exists (select 1 from public.intervention_plans p where p.id = plan_id and public.can_see_student(p.student_id)));

drop policy if exists "Equipe apaga alunos" on public.students;
revoke delete on public.students from authenticated;

alter table public.record_entries drop constraint record_entries_student_id_fkey,
  add constraint record_entries_student_id_fkey foreign key (student_id) references public.students(id) on delete restrict;
alter table public.anamneses drop constraint anamneses_student_id_fkey,
  add constraint anamneses_student_id_fkey foreign key (student_id) references public.students(id) on delete restrict;
alter table public.intervention_plans drop constraint intervention_plans_student_id_fkey,
  add constraint intervention_plans_student_id_fkey foreign key (student_id) references public.students(id) on delete restrict;
alter table public.consents drop constraint consents_student_id_fkey,
  add constraint consents_student_id_fkey foreign key (student_id) references public.students(id) on delete restrict;
alter table public.sessions drop constraint sessions_student_id_fkey,
  add constraint sessions_student_id_fkey foreign key (student_id) references public.students(id) on delete restrict;

create or replace function public.consents_only_revoke() returns trigger language plpgsql set search_path = public as $$
begin
  if old.revoked_on is not null then
    raise exception 'Consentimento já revogado não pode ser alterado';
  end if;
  if new.revoked_on is null or new.revoked_on < old.granted_on then
    raise exception 'Só é permitido registrar a revogação com data igual ou posterior à concessão';
  end if;
  if (new.id, new.student_id, new.purpose, new.guardian, new.granted_on, new.term_version, new.created_at)
     is distinct from (old.id, old.student_id, old.purpose, old.guardian, old.granted_on, old.term_version, old.created_at) then
    raise exception 'Só a data de revogação pode ser preenchida';
  end if;
  return new;
end; $$;
create trigger consents_only_revoke before update on public.consents for each row execute function public.consents_only_revoke();

create or replace function public.list_therapists() returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name from public.profiles p
  where exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'terapeuta')
  order by p.full_name
$$;
revoke execute on function public.list_therapists() from public, anon;
grant execute on function public.list_therapists() to authenticated;

create or replace function public.audit_force_now() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.at = now();
  new.user_id = auth.uid();
  new.user_email = coalesce((select email from public.profiles where id = new.user_id), '');
  new.role = coalesce((select r.role::text from public.user_roles r where r.user_id = new.user_id
    order by case r.role when 'admin' then 1 when 'clinica' then 2 when 'terapeuta' then 3 else 4 end limit 1), '');
  return new;
end; $$;