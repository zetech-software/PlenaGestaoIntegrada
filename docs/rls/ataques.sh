#!/usr/bin/env bash
# Bateria de ataques ao banco. Cada caso tenta uma invasão e confere o resultado:
#   BLOQUEADO  = o sistema resistiu.
#   VULNERÁVEL = o ataque funcionou (ou não foi barrado); o caso deve passar a BLOQUEADO depois da correção.
# Uso:  PSQL="psql -h /tmp -p 5432 -U postgres -d plena" ./docs/rls/ataques.sh
# Mesmo ambiente do casos.sh (migrações + stubs.sql + seed.sql). Só em banco de teste, nunca em produção.
set -u
: "${PSQL:?defina PSQL, por exemplo PSQL=\"psql -h /tmp -p 5432 -U postgres -d plena\"}"
A=a0000000-0000-0000-0000-000000000001   # admin da clínica A
C=c0000000-0000-0000-0000-000000000001   # clínica A
T1=b0000000-0000-0000-0000-000000000001  # terapeuta da clínica A
S1=51000000-0000-0000-0000-000000000001
S2=52000000-0000-0000-0000-000000000002
AB=ab000000-0000-0000-0000-000000000001  # admin da clínica B
TB=ab000000-0000-0000-0000-000000000002  # terapeuta da clínica B
OP=0e000000-0000-0000-0000-000000000001  # operador da plataforma
SB=5b000000-0000-0000-0000-00000000000b  # aluno da clínica B
TBID=0b000000-0000-4000-8000-00000000000b
vuln=0
# run <papel> <usuário|-> <sql>: papel = authenticated | anon | superuser
run() {
  case "$1" in
    superuser) pre="begin;" ;;
    anon) pre="begin; set local role anon;" ;;
    *) pre="begin; set local role authenticated; select set_config('request.jwt.claim.sub','$2',true);" ;;
  esac
  $PSQL -q -t -A -X 2>&1 <<SQL | tr '\n' ' '
$pre
$3
rollback;
SQL
}
# atk <nome> <papel> <usuário> <sql> <bloqueado-se: match|nomatch> <regex>
atk() {
  out=$(run "$2" "$3" "$4")
  if echo "$out" | grep -Eq "$6"; then found=1; else found=0; fi
  if [ "$5" = nomatch ] && echo "$out" | grep -Eq "does not exist"; then
    echo "INCONCLUSIVO  $1 (objeto inexistente)"; vuln=$((vuln + 1)); return
  fi
  if { [ "$5" = match ] && [ $found = 1 ]; } || { [ "$5" = nomatch ] && [ $found = 0 ]; }; then
    echo "BLOQUEADO   $1"
  else
    echo "VULNERÁVEL  $1"; echo "              saída: ${out:0:220}"; vuln=$((vuln + 1))
  fi
}

echo "== Sem login (papel anon)"
for t in students sessions anamneses record_entries intervention_plans plan_goals consents audit_log waitlist_entries charges tenants profiles user_roles student_assignments; do
  atk "anon não lê $t" anon - "select count(*) from public.$t;" match "permission denied"
done
atk "anon não chama list_therapists"              anon - "select * from list_therapists();" match "permission denied"
atk "anon não descobre papéis (has_role)"         anon - "select 'v=' || has_role('$A','admin');" nomatch "v=true"

echo "== Descoberta de informação por usuário comum"
atk "terapeuta não descobre admin de outra clínica" authenticated $T1 "select 'v=' || has_role('$AB','admin');" nomatch "v=true"
atk "terapeuta não descobre o operador da plataforma" authenticated $T1 "select 'v=' || has_role('$OP','plataforma');" nomatch "v=true"
atk "erro igual para aluno inexistente e aluno alheio" authenticated $C "insert into consents(student_id,purpose,guardian) values ('$SB','ia','F');" match "violates row-level security policy for table \"consents\""
atk "erro igual para terapeuta alheio e inexistente"  authenticated $C "insert into sessions(student_id,therapist_id,date,start,duration) values ('$S1',gen_random_uuid(),'2027-05-01','10:00',50);" match "violates row-level security policy"

echo "== Cadastro de usuário"
atk "metadados do usuário não dão clínica nem papel" superuser - "insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values ('99000000-0000-0000-0000-000000000001','x@x','{\"tenant_id\":\"$TBID\",\"role\":\"admin\"}','{}'); select 'perfil=' || coalesce(tenant_id::text,'nulo') || ' papeis=' || coalesce((select string_agg(role::text,',') from user_roles where user_id='99000000-0000-0000-0000-000000000001'),'nenhum') from profiles where id='99000000-0000-0000-0000-000000000001';" match "perfil=nulo papeis=nenhum"
atk "usuário sem clínica não vê dado nenhum"        superuser - "insert into auth.users(id,email,raw_app_meta_data) values ('99000000-0000-0000-0000-000000000002','y@y','{}'); set local role authenticated; select set_config('request.jwt.claim.sub','99000000-0000-0000-0000-000000000002',true); select 'n=' || ((select count(*) from students) + (select count(*) from tenants) + (select count(*) from charges));" match "n=0"

echo "== Série de sessões (create_session_series)"
atk "série com 13 sessões é recusada"               authenticated $C "select count(*) from create_session_series((select jsonb_agg(jsonb_build_object('student_id','$S1','therapist_id','$C','date','2027-01-'||lpad(g::text,2,'0'),'start','10:00','duration',50)) from generate_series(1,13) g));" match "de 1 a 12"
atk "série com aluno de outra clínica é recusada"   authenticated $C "select count(*) from create_session_series('[{\"student_id\":\"$SB\",\"therapist_id\":\"$C\",\"date\":\"2027-02-01\",\"start\":\"10:00\",\"duration\":50}]'::jsonb);" match "row-level security"
atk "série com duração negativa é recusada"         authenticated $C "select count(*) from create_session_series('[{\"student_id\":\"$S1\",\"therapist_id\":\"$C\",\"date\":\"2027-03-01\",\"start\":\"10:00\",\"duration\":-5}]'::jsonb);" match "check constraint"
atk "injeção de SQL na série não executa"           authenticated $C "select count(*) from create_session_series('[{\"student_id\":\"$S1\",\"therapist_id\":\"$C\",\"date\":\"2027-04-01\",\"start\":\"11:00\",\"duration\":50,\"type\":\"x''); drop table students; --\"}]'::jsonb); reset role; select 'students=' || count(*) from students;" match "students=[1-9]"

echo "== Consentimento (prova do consentimento do responsável)"
atk "data de concessão é a de hoje, não a informada" authenticated $C "insert into consents(student_id,purpose,guardian,granted_on) values ('$S2','tratamento','Fulano','2020-01-01'); select case when granted_on = current_date then 'ok-hoje' else 'retroativo' end from consents where student_id='$S2' and purpose='tratamento';" match "ok-hoje"
atk "consentimento não nasce já revogado"           authenticated $C "insert into consents(student_id,purpose,guardian,revoked_on) values ('$S2','escola','Fulano','2026-12-01') returning 'nasceu revogado';" nomatch "nasceu revogado"
atk "versão do termo não é informada pelo cliente"   authenticated $C "insert into consents(student_id,purpose,guardian,term_version) values ('$S2','ia','Fulano','termo-inventado'); select 'v=' || term_version from consents where student_id='$S2' and purpose='ia';" nomatch "v=termo-inventado"

echo "== Auditoria"
atk "ação da auditoria só aceita valores conhecidos" authenticated $T1 "insert into audit_log(action,resource) values ('<script>alert(1)</script>','x');" match "check constraint"
atk "detalhe da auditoria tem tamanho máximo"       authenticated $T1 "insert into audit_log(action,resource,detail) values ('visualizou','aluno',repeat('x',100000));" match "check constraint"
atk "volume de eventos por usuário é limitado"      authenticated $T1 "do \$\$ declare n int; begin insert into audit_log(action,resource,detail) select 'visualizou','aluno','x' from generate_series(1,5000); get diagnostics n = row_count; raise notice 'inseridos=%', n; end \$\$;" nomatch "inseridos=5000"

echo "== Disponibilidade e consumo"
atk "texto livre tem tamanho máximo (notes)"        authenticated $T1 "update students set notes=repeat('A',1000000) where id='$S1' returning 'aceitou';" nomatch "aceitou"
atk "admin não remove o último admin da clínica"    authenticated $A "delete from user_roles where role='admin' and user_id='$A' returning 'removeu';" nomatch "removeu"

echo
if [ $vuln -eq 0 ]; then echo "Nenhuma vulnerabilidade encontrada."; else echo "$vuln caso(s) vulneráveis ou inconclusivos."; fi
exit $vuln
