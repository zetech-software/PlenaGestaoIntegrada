#!/usr/bin/env bash
# Tentativas de abuso contra o banco endurecido (funções, consentimento, auditoria, último admin, limites).
# Uso: igual ao casos.sh (mesmo PSQL, stubs.sql e seed.sql aplicados).
set -u
: "${PSQL:?defina PSQL}"
A=a0000000-0000-0000-0000-000000000001; C=c0000000-0000-0000-0000-000000000001
T1=b0000000-0000-0000-0000-000000000001; AB=ab000000-0000-0000-0000-000000000001
S1=51000000-0000-0000-0000-000000000001
fails=0
run() { $PSQL -q -t -A -X 2>&1 <<SQL | tr '\n' ' '
begin; set local role $1; select set_config('request.jwt.claim.sub','$2',true);
$3
rollback;
SQL
}
check() { # check <nome> <papel> <usuário> <sql> <match|nomatch> <regex>
  out=$(run "$2" "$3" "$4")
  if echo "$out" | grep -Eq "$6"; then f=1; else f=0; fi
  if { [ "$5" = match ] && [ $f = 1 ]; } || { [ "$5" = nomatch ] && [ $f = 0 ]; }; then echo "PASS  $1"
  else echo "FAIL  $1"; echo "      saída: ${out:0:300}"; fails=$((fails+1)); fi
}
au=authenticated
echo "== Funções"
check "anônimo não executa has_role"            anon "" "select has_role('$A','admin');" match "permission denied"
check "anônimo não executa list_therapists"     anon "" "select * from list_therapists();" match "permission denied"
check "anônimo não executa funções de gatilho"  anon "" "select keep_last_admin();" match "permission denied"
check "has_role de outro usuário é falso"       $au $T1 "select 'v=' || has_role('$A','admin');" match "v=f"
check "has_role do próprio usuário funciona"    $au $A  "select 'v=' || has_role('$A','admin');" match "v=t"
check "in_my_tenant de outro usuário é falso"   $au $A  "select 'v=' || in_my_tenant('$T1');" match "v=f"
check "admin ainda gerencia papéis da clínica"  $au $A  "insert into user_roles(user_id,role) values ('$T1','clinica'); select 'ok';" match "ok"
check "admin ainda vê papéis da clínica"        $au $A  "select 'n=' || count(*) from user_roles;" match "n=4"
check "clínica ainda agenda com terapeuta"      $au $C  "insert into sessions(student_id,therapist_id,date,start,duration) values ('$S1','$T1','2026-12-20','10:00',50); select 'ok';" match "ok"
echo "== Consentimento"
check "não cria consentimento já revogado"      $au $C "insert into consents(student_id,purpose,guardian,revoked_on) values ('$S1','escola','R',current_date);" match "já revogado"
check "data e versão vêm do servidor"           $au $C "insert into consents(student_id,purpose,guardian,granted_on,term_version) values ('$S1','escola','R','2000-01-01','falsa'); select 'v=' || (granted_on = current_date) || term_version from consents where purpose='escola';" match "v=truev1"
echo "== Auditoria"
check "ação fora da lista é recusada"           $au $T1 "insert into audit_log(action,resource) values ('apagou','aluno');" match "audit_log_action_check"
check "recurso fora da lista é recusado"        $au $T1 "insert into audit_log(action,resource) values ('criou','senha');" match "audit_log_resource_check"
check "detalhe acima de 500 é recusado"         $au $T1 "insert into audit_log(action,resource,detail) values ('criou','aluno',repeat('x',501));" match "audit_log_detail_len"
check "acima de 300 eventos/min é recusado"     $au $T1 "insert into audit_log(action,resource) select 'visualizou','aluno' from generate_series(1,301);" match "Limite de eventos"
check "300 eventos/min passam"                  $au $T1 "insert into audit_log(action,resource) select 'visualizou','aluno' from generate_series(1,300); select 'ok';" match "ok"
echo "== Último admin"
check "não remove o último admin"               $au $A  "delete from user_roles where user_id='$A' and role='admin';" match "pelo menos um administrador"
check "não rebaixa o último admin"              $au $AB "update user_roles set role='clinica' where user_id='$AB';" match "pelo menos um administrador"
check "remove admin quando há outro"            $au $A  "insert into user_roles(user_id,role) values ('$C','admin'); delete from user_roles where user_id='$A' and role='admin' returning 'removeu';" match "removeu"
echo "== Limites de texto"
check "observações do aluno até 4000"           $au $A "update students set notes=repeat('x',4001) where id='$S1';" match "students_notes_len"
check "prontuário até 8000 por campo"           $au $A "update record_entries set observations=repeat('x',8001);" match "record_entries_len"
check "anamnese até 8000 por campo"             $au $A "update anamneses set family=repeat('x',8001);" match "anamneses_len"
check "plano até 8000 por campo"                $au $A "update intervention_plans set summary=repeat('x',8001);" match "intervention_plans_len"
check "meta até 1000"                           $au $A "insert into plan_goals(plan_id,description,strategy,deadline) select id,repeat('x',1001),'',start_date from intervention_plans limit 1;" match "plan_goals_len"
check "responsável do consentimento até 160"    $au $C "insert into consents(student_id,purpose,guardian) values ('$S1','escola',repeat('x',161));" match "consents_guardian_len"
check "descrição da cobrança até 160"           $au $C "update charges set description=repeat('x',161);" match "charges_description_len"
echo
if [ $fails -eq 0 ]; then echo "Todos os ataques foram barrados."; else echo "$fails caso(s) falharam."; fi
exit $fails
