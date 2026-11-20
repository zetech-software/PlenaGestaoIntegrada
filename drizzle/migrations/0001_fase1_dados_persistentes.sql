create extension if not exists btree_gist with schema extensions;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  school text not null default '',
  grade text not null default '',
  guardian text not null default '',
  relationship text not null default '',
  phone text not null default '',
  email text not null default '',
  status text not null default 'Em avaliação' check (status in ('Ativo','Em avaliação','Inativo')),
  start_date date not null default current_date,
  notes text not null default '',
  tone text not null default 'green' check (tone in ('green','warm','info')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_assignments add column student_ref uuid references public.students(id) on delete cascade;
comment on column public.student_assignments.student_id is 'DEPRECATED: demo text id; replaced by student_ref';
alter table public.student_assignments alter column student_id set default '';

create or replace function public.can_see_student(_student_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'clinica')
    or exists (select 1 from public.student_assignments a where a.user_id = auth.uid() and a.student_ref = _student_id)
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'clinica')
$$;

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  therapist_id uuid not null references public.profiles(id),
  date date not null,
  start time not null,
  duration integer not null check (duration between 5 and 480),
  type text not null default '',
  status text not null default 'Pendente' check (status in ('Pendente','Confirmado','Realizado','Faltou','Cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_no_overlap exclude using gist (
    therapist_id with =,
    tsrange(date + start, date + start + make_interval(mins => duration)) with &&
  ) where (status <> 'Cancelado')
);

create table public.anamneses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  specialty text not null,
  main_complaint text not null,
  referral text not null default '',
  gestation text not null default '',
  development text not null default '',
  health text not null default '',
  family text not null default '',
  school text not null default '',
  expectations text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.record_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  specialty text not null,
  objectives text not null,
  activities text not null default '',
  observations text not null,
  evolution text not null check (evolution in ('Avançou','Estável','Precisa de atenção')),
  next_steps text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.intervention_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  kind text not null check (kind in ('PEI','PTI')),
  title text not null,
  specialty text not null,
  start_date date not null,
  review_date date not null,
  status text not null default 'Rascunho' check (status in ('Rascunho','Ativo','Concluído')),
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (review_date >= start_date)
);

create table public.plan_goals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.intervention_plans(id) on delete cascade,
  description text not null,
  strategy text not null default '',
  deadline date not null,
  progress integer not null default 0 check (progress between 0 and 100),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.check_goal_deadline() returns trigger language plpgsql set search_path = public as $$
declare p record;
begin
  select start_date, review_date into p from public.intervention_plans where id = new.plan_id;
  if new.deadline < p.start_date or new.deadline > p.review_date then
    raise exception 'Prazo da meta fora do período do plano';
  end if;
  return new;
end; $$;
create trigger plan_goals_deadline before insert or update on public.plan_goals for each row execute function public.check_goal_deadline();

create index on public.sessions (student_id, date);
create index on public.record_entries (student_id, date desc);
create index on public.intervention_plans (student_id);
create index on public.plan_goals (plan_id, position);
create index on public.student_assignments (student_ref);

do $$ declare t text; begin
  foreach t in array array['students','sessions','anamneses','record_entries','intervention_plans','plan_goals'] loop
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "Ver alunos permitidos" on public.students for select to authenticated using (public.can_see_student(id));
create policy "Equipe cadastra alunos" on public.students for insert to authenticated with check (public.is_staff());
create policy "Editar alunos permitidos" on public.students for update to authenticated using (public.can_see_student(id)) with check (public.can_see_student(id));
create policy "Equipe apaga alunos" on public.students for delete to authenticated using (public.is_staff());

do $$ declare t text; begin
  foreach t in array array['sessions','anamneses','record_entries','intervention_plans'] loop
    execute format('create policy "Ver por aluno" on public.%I for select to authenticated using (public.can_see_student(student_id))', t);
    execute format('create policy "Criar por aluno" on public.%I for insert to authenticated with check (public.can_see_student(student_id))', t);
    execute format('create policy "Editar por aluno" on public.%I for update to authenticated using (public.can_see_student(student_id)) with check (public.can_see_student(student_id))', t);
    execute format('create policy "Apagar por aluno" on public.%I for delete to authenticated using (public.can_see_student(student_id))', t);
  end loop;
end $$;

create policy "Metas pelo plano" on public.plan_goals for all to authenticated
  using (exists (select 1 from public.intervention_plans p where p.id = plan_id and public.can_see_student(p.student_id)))
  with check (exists (select 1 from public.intervention_plans p where p.id = plan_id and public.can_see_student(p.student_id)));