#!/usr/bin/env bash
# Testes das regras de acesso (RLS) do banco. Cada caso impersonia um usuário e confere o resultado.
# Uso:  PSQL="psql -h /tmp -p 5432 -U postgres -d plena" ./docs/rls/casos.sh
# Pré-requisito: um Postgres com as migrações de drizzle/migrations/ já aplicadas, o stubs.sql (papéis e
# auth.uid() do Supabase) e o seed.sql (4 usuários, 2 alunos). Veja docs/revisao-banco.md.
set -u
: "${PSQL:?defina PSQL, por exemplo PSQL=\"psql -h /tmp -p 5432 -U postgres -d plena\"}"
A=a0000000-0000-0000-0000-000000000001   # admin
C=c0000000-0000-0000-0000-000000000001   # clínica
T1=b0000000-0000-0000-0000-000000000001  # terapeuta 1 (vinculado ao aluno 1)
T2=b0000000-0000-0000-0000-000000000002  # terapeuta 2 (vinculado ao aluno 2)
S1=51000000-0000-0000-0000-000000000001
S2=52000000-0000-0000-0000-000000000002
AB=ab000000-0000-0000-0000-000000000001  # admin da clínica B
TB=ab000000-0000-0000-0000-000000000002  # terapeuta da clínica B
AS=a5000000-0000-0000-0000-000000000001  # admin da clínica suspensa
OP=0e000000-0000-0000-0000-000000000001  # operador da plataforma
TA=00000000-0000-4000-8000-00000000a001  # clínica A (piloto)
TBID=0b000000-0000-4000-8000-00000000000b
fails=0
# Verificação prévia: o ambiente precisa ter as migrações e o seed aplicados, senão os casos
# "não deve acontecer" passariam sem provar nada.
for t in students record_entries anamneses intervention_plans consents charges; do
  n=$($PSQL -q -t -A -X -c "select count(*) from public.$t" 2>&1)
  case "$n" in 0) echo "Seed vazio em public.$t: os casos de exclusão não provariam nada. Aplique o seed.sql."; exit 2;; esac
  case "$n" in *[!0-9]*) echo "Ambiente incompleto: não consegui ler public.$t ($n). Aplique as migrações, o stubs.sql e o seed.sql."; exit 2;; esac
done
run() {
  $PSQL -q -t -A -X 2>&1 <<SQL | tr '\n' ' '
begin; set local role authenticated; select set_config('request.jwt.claim.sub','$1',true);
$2
rollback;
SQL
}
# check_su <nome> <sql> <match|nomatch> <regex>: roda como dono do banco (ex.: o servidor criando usuário)
check_su() {
  out=$($PSQL -q -t -A -X 2>&1 <<SQL | tr '\n' ' '
begin;
$2
rollback;
SQL
)
  if echo "$out" | grep -Eq "$4"; then found=1; else found=0; fi
  if { [ "$3" = match ] && [ $found = 1 ]; } || { [ "$3" = nomatch ] && [ $found = 0 ]; }; then
    echo "PASS  $1"; else echo "FAIL  $1"; echo "      saída: ${out:0:300}"; fails=$((fails + 1)); fi
}
# check <nome> <usuário> <sql> <match|nomatch> <regex>
check() {
  out=$(run "$2" "$3")
  if echo "$out" | grep -Eq "$5"; then found=1; else found=0; fi
  # Erro de objeto inexistente num caso "nomatch" é inconclusivo, não aprovação.
  if [ "$4" = nomatch ] && echo "$out" | grep -Eq "does not exist"; then
    echo "FAIL  $1"; echo "      inconclusivo (objeto inexistente): ${out:0:200}"; fails=$((fails + 1)); return
  fi
  if { [ "$4" = match ] && [ $found = 1 ]; } || { [ "$4" = nomatch ] && [ $found = 0 ]; }; then
    echo "PASS  $1"
  else
    echo "FAIL  $1"; echo "      saída: ${out:0:300}"; fails=$((fails + 1))
  fi
}

echo "== Isolamento por perfil"
check "terapeuta vê só o aluno vinculado"            $T1 "select 'n=' || count(*) from students;" match "n=1"
check "terapeuta não vê aluno de outro terapeuta"    $T1 "update students set notes='x' where id='$S2' returning 'editou';" nomatch "editou"
check "terapeuta não cadastra aluno"                 $T1 "insert into students(name,birth_date) values ('X','2017-01-01');" match "row-level security"
check "terapeuta não vira admin"                     $T1 "insert into user_roles(user_id,role) values ('$T1','admin');" match "row-level security"
check "terapeuta não se vincula a outro aluno"       $T1 "insert into student_assignments(user_id,student_ref,student_id) values ('$T1','$S2','x');" match "row-level security"
check "terapeuta não vê financeiro"                  $T1 "select 'n=' || count(*) from charges;" match "n=0"
check "clínica vê financeiro"                        $C  "select 'n=' || count(*) from charges;" match "n=1"
check "consentimento de outro aluno não vale (IA)"   $T2 "select 'v=' || has_active_consent('$S1','ia');" match "v=f"

echo "== Guarda de prontuário (20 anos): dado clínico não pode ser apagado"
check "terapeuta não apaga registro de prontuário"   $T1 "delete from record_entries returning 'apagou';" nomatch "apagou"
check "terapeuta não apaga anamnese"                 $T1 "delete from anamneses returning 'apagou';" nomatch "apagou"
check "terapeuta não apaga plano de intervenção"      $T1 "delete from intervention_plans returning 'apagou';" nomatch "apagou"
check "apagar aluno não leva o prontuário junto"     $C  "delete from students where id='$S2'; select 'n=' || count(*) from record_entries where student_id='$S2';" nomatch "n=0"

echo "== Consentimento: histórico imutável"
check "revogação não pode ser desfeita"              $C  "update consents set revoked_on=null returning 'desfez';" nomatch "desfez"
check "data de concessão não pode ser reescrita"     $C  "update consents set granted_on='2020-01-01' returning 'reescreveu';" nomatch "reescreveu"

echo "== Diretório de terapeutas (para agendar)"
check "clínica lista terapeutas"                     $C  "select 'n=' || count(*) from list_therapists();" match "n=2"
check "terapeuta lista terapeutas"                   $T1 "select 'n=' || count(*) from list_therapists();" match "n=2"

echo "== Auditoria"
check "usuário comum registra evento (sem RETURNING)" $T1 "insert into audit_log(action,resource) values ('visualizou','aluno'); select 'ok';" match "ok"
check "usuário comum não lê a auditoria"             $T1 "select 'n=' || count(*) from audit_log;" match "n=0"
check "auditoria não pode ser apagada"               $T1 "delete from audit_log;" match "permission denied"
check "e-mail e perfil do evento vêm do servidor"    $T1 "insert into audit_log(user_email,role,action,resource) values ('falso@x','admin','visualizou','aluno'); select set_config('request.jwt.claim.sub','$A',true); select 'v=' || user_email from audit_log;" nomatch "falso@x"

echo "== Agenda e financeiro"
check "mesmo aluno não tem 2 sessões ao mesmo tempo" $C  "insert into sessions(student_id,therapist_id,date,start,duration) values ('$S1','$T1','2026-11-30','10:00',50),('$S1','$T2','2026-11-30','10:20',50);" match "exclusion constraint"
check "mesmo terapeuta não tem 2 sessões ao mesmo tempo" $C "insert into sessions(student_id,therapist_id,date,start,duration) values ('$S1','$T1','2026-11-30','10:00',50),('$S2','$T1','2026-11-30','10:20',50);" match "exclusion constraint"
check "cobrança paga exige data e forma"             $C  "update charges set status='Pago';" match "check constraint"
check "cobrança não é apagada"                       $C  "delete from charges;" match "permission denied"

echo "== Isolamento entre clínicas"
check "admin A não vê alunos da B"                  $A  "select 'n=' || count(*) from students where tenant_id='$TBID';" match "n=0"
check "admin A não vê sessões da B"                 $A  "select 'n=' || count(*) from sessions;" match "n=0"
check "admin A não vê cobranças da B"               $A  "select 'n=' || count(*) from charges;" match "n=1"
check "admin A não vê auditoria da B"               $A  "select 'n=' || count(*) from audit_log;" match "n=0"
check "admin A não vê perfis da B"                  $A  "select 'n=' || count(*) from profiles where tenant_id='$TBID';" match "n=0"
check "admin A não dá papel a usuário da B"         $A  "insert into user_roles(user_id,role) values ('$TB','clinica');" match "row-level security"
check "terapeuta A não vê nada da B"                $T1 "select 'n=' || ((select count(*) from students where tenant_id='$TBID') + (select count(*) from record_entries where tenant_id='$TBID'));" match "n=0"
check "terapeuta B vê o próprio aluno"              $TB "select 'n=' || count(*) from students;" match "n=1"
check "admin B não cria aluno na clínica A"         $AB "insert into students(name,birth_date,tenant_id) values ('X','2017-01-01','$TA');" match "row-level security"
check "operador lê clientes"                        $OP "select 'n=' || count(*) from tenants;" match "n=3"
check "operador não lê linhas clínicas"             $OP "select 'n=' || ((select count(*) from students)+(select count(*) from record_entries)+(select count(*) from sessions)+(select count(*) from charges)+(select count(*) from audit_log)+(select count(*) from consents));" match "n=0"
check "admin de clínica lê só o próprio cliente"    $A  "select 'n=' || count(*) from tenants;" match "n=1"
check "admin de clínica não edita cliente"          $A  "update tenants set seats=200 returning 'editou';" nomatch "editou"
check "ninguém apaga cliente"                       $OP "delete from tenants;" match "permission denied"
check "clínica suspensa não lê nada"                $AS "select 'n=' || ((select count(*) from students)+(select count(*) from tenants));" match "n=0"
check "admin de clínica não atribui 'plataforma'"   $A  "insert into user_roles(user_id,role) values ('$T1','plataforma');" match "row-level security"
check "admin não muda o próprio tenant_id"          $A  "update profiles set tenant_id='$TBID' where id='$A' returning 'mudou';" nomatch "mudou"
check_su "usuário acima das vagas falha"                "insert into auth.users(id,email,raw_app_meta_data) values (gen_random_uuid(),'extra@t.local','{\"tenant_id\":\"$TBID\"}');" match "Limite de vagas"

echo "== Tentativas de furar o isolamento (revisão independente)"
SB=5b000000-0000-0000-0000-00000000000b  # aluno da clínica B
check "clínica A não agenda com terapeuta da B"       $C  "insert into sessions(student_id,therapist_id,date,start,duration) values ('$S1','$TB','2026-12-10','10:00',50);" match "row-level security"
check "clínica A não registra consentimento de aluno da B" $C "insert into consents(student_id,purpose,guardian) values ('$SB','tratamento','Fulano');" match "row-level security"
check "admin A não vincula terapeuta ao aluno da B"   $A  "insert into student_assignments(user_id,student_ref) values ('$T1','$SB');" match "row-level security"
check "terapeuta A não move aluno para a clínica B"   $T1 "update students set tenant_id='$TBID' where id='$S1' returning 'moveu';" nomatch "moveu"
check "admin A não muda o próprio tenant_id"          $A  "update profiles set tenant_id='$TBID' where id='$A';" match "permission denied"
check "admin A não cria perfil em outra clínica"      $A  "insert into profiles(id,email,tenant_id) values (gen_random_uuid(),'x@x','$TBID');" match "permission denied"
check "admin de clínica não altera as próprias vagas" $A  "update tenants set seats=200 where id='$TA' returning 'editou';" nomatch "editou"
check "terapeuta não lê clientes"                     $T1 "select 'n=' || count(*) from tenants;" match "n=0"
check "operador não lista terapeutas de clínica"      $OP "select 'n=' || count(*) from list_therapists();" match "n=0"
check "operador vê só o próprio perfil"               $OP "select 'n=' || count(*) from profiles;" match "n=1"
check "operador vê só os próprios papéis"             $OP "select 'n=' || count(*) from user_roles;" match "n=1"
check "operador não escreve em tabela clínica"        $OP "insert into students(tenant_id,name,birth_date) values ('$TA','X','2017-01-01');" match "row-level security"
check "evento de auditoria usa a clínica do servidor" $A  "insert into audit_log(tenant_id,action,resource) values ('$TBID','visualizou','aluno'); select 'tenant=' || tenant_id from audit_log where user_id='$A' order by at desc limit 1;" match "tenant=$TA"

echo
if [ $fails -eq 0 ]; then echo "Todos os casos passaram."; else echo "$fails caso(s) falharam."; fi
exit $fails
