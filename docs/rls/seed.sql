insert into auth.users(id,email) values
 ('a0000000-0000-0000-0000-000000000001','admin@t.local'),
 ('c0000000-0000-0000-0000-000000000001','clinica@t.local'),
 ('b0000000-0000-0000-0000-000000000001','t1@t.local'),
 ('b0000000-0000-0000-0000-000000000002','t2@t.local');
insert into public.profiles(id,email,full_name) values
 ('a0000000-0000-0000-0000-000000000001','admin@t.local','Admin'),
 ('c0000000-0000-0000-0000-000000000001','clinica@t.local','Clinica'),
 ('b0000000-0000-0000-0000-000000000001','t1@t.local','Terapeuta 1'),
 ('b0000000-0000-0000-0000-000000000002','t2@t.local','Terapeuta 2') on conflict do nothing;
delete from public.user_roles;
insert into public.user_roles(user_id,role) values
 ('a0000000-0000-0000-0000-000000000001','admin'),
 ('c0000000-0000-0000-0000-000000000001','clinica'),
 ('b0000000-0000-0000-0000-000000000001','terapeuta'),
 ('b0000000-0000-0000-0000-000000000002','terapeuta');
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
