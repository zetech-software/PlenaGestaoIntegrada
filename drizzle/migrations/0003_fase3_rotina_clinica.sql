create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  specialty text not null,
  period text not null default 'Qualquer' check (period in ('Manhã','Tarde','Qualquer')),
  notes text not null default '',
  status text not null default 'Aguardando' check (status in ('Aguardando','Agendado')),
  created_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index waitlist_one_waiting on public.waitlist_entries (student_id, specialty) where status = 'Aguardando';
create trigger waitlist_entries_touch before update on public.waitlist_entries for each row execute function public.touch_updated_at();
grant select, insert, update, delete on public.waitlist_entries to authenticated;
grant all on public.waitlist_entries to service_role;
alter table public.waitlist_entries enable row level security;
create policy "Ver espera" on public.waitlist_entries for select to authenticated using (public.can_see_student(student_id));
create policy "Incluir espera" on public.waitlist_entries for insert to authenticated with check (public.can_see_student(student_id));
create policy "Atualizar espera" on public.waitlist_entries for update to authenticated using (public.can_see_student(student_id)) with check (public.can_see_student(student_id));
create policy "Remover espera" on public.waitlist_entries for delete to authenticated using (public.can_see_student(student_id));

create table public.charges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  due_date date not null,
  status text not null default 'Em aberto' check (status in ('Em aberto','Pago','Cancelado')),
  paid_on date,
  method text check (method in ('PIX','Dinheiro','Cartão','Transferência')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'Pago') = (paid_on is not null and method is not null)),
  check (status = 'Pago' or (paid_on is null and method is null))
);
create index on public.charges (student_id);
create index on public.charges (due_date);
create trigger charges_touch before update on public.charges for each row execute function public.touch_updated_at();
grant select, insert, update on public.charges to authenticated;
grant all on public.charges to service_role;
alter table public.charges enable row level security;
create policy "Equipe vê cobranças" on public.charges for select to authenticated using (public.is_staff());
create policy "Equipe cria cobranças" on public.charges for insert to authenticated with check (public.is_staff());
create policy "Equipe atualiza cobranças" on public.charges for update to authenticated using (public.is_staff()) with check (public.is_staff());

alter table public.sessions add constraint sessions_no_student_overlap exclude using gist (
  student_id with =,
  tsrange(date + start, date + start + make_interval(mins => duration)) with &&
) where (status <> 'Cancelado');

create or replace function public.create_session_series(_sessions jsonb) returns setof public.sessions
language plpgsql security invoker set search_path = public as $$
begin
  if jsonb_array_length(_sessions) = 0 or jsonb_array_length(_sessions) > 12 then
    raise exception 'A série deve ter de 1 a 12 sessões';
  end if;
  return query
  insert into public.sessions (student_id, therapist_id, date, start, duration, type)
  select (s->>'student_id')::uuid, (s->>'therapist_id')::uuid, (s->>'date')::date,
         (s->>'start')::time, (s->>'duration')::int, coalesce(s->>'type','')
  from jsonb_array_elements(_sessions) s
  returning *;
end; $$;
grant execute on function public.create_session_series(jsonb) to authenticated;