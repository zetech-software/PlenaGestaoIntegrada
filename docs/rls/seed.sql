-- Dados de teste. Clínica A = clínica piloto criada pela migração; B = outra clínica com vagas lotadas;
-- S = clínica suspensa; OP = operador da plataforma (sem clínica).
insert into public.tenants(id,kind,name,document,owner_email,seats,status) values
 ('0b000000-0000-4000-8000-00000000000b','clinica','Clínica B','11111111000111','b@t.local',2,'Ativo'),
 ('05000000-0000-4000-8000-000000000005','clinica','Clínica S','22222222000122','s@t.local',5,'Suspenso')
 on conflict do nothing;
insert into auth.users(id,email) values
 ('a0000000-0000-0000-0000-000000000001','admin@t.local'),
 ('c0000000-0000-0000-0000-000000000001','clinica@t.local'),
 ('b0000000-0000-0000-0000-000000000001','t1@t.local'),
 ('b0000000-0000-0000-0000-000000000002','t2@t.local'),
 ('ab000000-0000-0000-0000-000000000001','adminb@t.local'),
 ('ab000000-0000-0000-0000-000000000002','tb@t.local'),
 ('a5000000-0000-0000-0000-000000000001','admins@t.local'),
 ('0e000000-0000-0000-0000-000000000001','op@t.local');
insert into public.profiles(id,email,full_name) values
 ('a0000000-0000-0000-0000-000000000001','admin@t.local','Admin'),
 ('c0000000-0000-0000-0000-000000000001','clinica@t.local','Clinica'),
 ('b0000000-0000-0000-0000-000000000001','t1@t.local','Terapeuta 1'),
 ('b0000000-0000-0000-0000-000000000002','t2@t.local','Terapeuta 2'),
 ('ab000000-0000-0000-0000-000000000001','adminb@t.local','Admin B'),
 ('ab000000-0000-0000-0000-000000000002','tb@t.local','Terapeuta B'),
 ('a5000000-0000-0000-0000-000000000001','admins@t.local','Admin S'),
 ('0e000000-0000-0000-0000-000000000001','op@t.local','Operador') on conflict do nothing;
update public.profiles set tenant_id='00000000-0000-4000-8000-00000000a001' where id in
 ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002');
update public.profiles set tenant_id='0b000000-0000-4000-8000-00000000000b' where id::text like 'ab000000%';
update public.profiles set tenant_id='05000000-0000-4000-8000-000000000005' where id='a5000000-0000-0000-0000-000000000001';
delete from public.user_roles;
insert into public.user_roles(user_id,role) values
 ('a0000000-0000-0000-0000-000000000001','admin'),
 ('c0000000-0000-0000-0000-000000000001','clinica'),
 ('b0000000-0000-0000-0000-000000000001','terapeuta'),
 ('b0000000-0000-0000-0000-000000000002','terapeuta'),
 ('ab000000-0000-0000-0000-000000000001','admin'),
 ('ab000000-0000-0000-0000-000000000002','terapeuta'),
 ('a5000000-0000-0000-0000-000000000001','admin'),
 ('0e000000-0000-0000-0000-000000000001','plataforma');

-- Clínica A (tenant_id vem do default, com o admin A como usuário corrente)
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000001',false);
insert into public.students(id,name,birth_date) values
 ('51000000-0000-0000-0000-000000000001','Aluno 1','2017-01-01'),
 ('52000000-0000-0000-0000-000000000002','Aluno 2','2016-01-01');
insert into public.student_assignments(user_id,student_ref) values
 ('b0000000-0000-0000-0000-000000000001','51000000-0000-0000-0000-000000000001'),
 ('b0000000-0000-0000-0000-000000000002','52000000-0000-0000-0000-000000000002');
insert into public.record_entries(student_id,date,specialty,objectives,observations,evolution) values
 ('51000000-0000-0000-0000-000000000001','2026-11-01','Psicologia','obj obj obj','obs obs obs','Estável'),
 ('52000000-0000-0000-0000-000000000002','2026-11-01','Psicologia','obj obj obj','obs obs obs','Estável');
insert into public.consents(student_id,purpose,guardian,granted_on,revoked_on) values
 ('51000000-0000-0000-0000-000000000001','ia','Resp 1','2026-10-01','2026-10-20');
insert into public.charges(student_id,description,amount_cents,due_date) values ('51000000-0000-0000-0000-000000000001','teste',1000,'2026-12-01');
insert into public.anamneses(student_id,specialty,main_complaint) values
 ('51000000-0000-0000-0000-000000000001','Psicologia','Queixa principal de teste');
insert into public.intervention_plans(student_id,kind,title,specialty,start_date,review_date) values
 ('51000000-0000-0000-0000-000000000001','PEI','Plano de teste','Psicopedagogia','2026-11-01','2026-12-01');

-- Clínica B
select set_config('request.jwt.claim.sub','ab000000-0000-0000-0000-000000000001',false);
insert into public.students(id,name,birth_date) values ('5b000000-0000-0000-0000-00000000000b','Aluno B','2015-01-01');
insert into public.student_assignments(user_id,student_ref) values ('ab000000-0000-0000-0000-000000000002','5b000000-0000-0000-0000-00000000000b');
insert into public.record_entries(student_id,date,specialty,objectives,observations,evolution) values
 ('5b000000-0000-0000-0000-00000000000b','2026-11-02','Psicologia','obj obj obj','obs obs obs','Estável');
insert into public.sessions(student_id,therapist_id,date,start,duration) values
 ('5b000000-0000-0000-0000-00000000000b','ab000000-0000-0000-0000-000000000002','2026-11-30','09:00',50);
insert into public.charges(student_id,description,amount_cents,due_date) values ('5b000000-0000-0000-0000-00000000000b','B',2000,'2026-12-01');
insert into public.audit_log(action,resource) values ('visualizou','aluno');

-- Clínica S (suspensa)
select set_config('request.jwt.claim.sub','a5000000-0000-0000-0000-000000000001',false);
insert into public.students(id,name,birth_date) values ('55000000-0000-0000-0000-000000000005','Aluno S','2015-01-01');
select set_config('request.jwt.claim.sub','',false);
