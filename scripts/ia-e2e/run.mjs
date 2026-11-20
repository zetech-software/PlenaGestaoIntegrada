// Chama a função de servidor suggestActivities com tokens de cenários diferentes e mostra a resposta.
// Passos (da raiz do repositório):
//   node scripts/ia-e2e/fake-supabase.mjs &
//   SUPABASE_URL=http://127.0.0.1:9100 SUPABASE_PUBLISHABLE_KEY=sb_publishable_x \
//   VITE_SUPABASE_URL=http://127.0.0.1:9100 VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_x \
//   bunx vite dev --host 127.0.0.1 --port 8082 &
//   curl -s -o /dev/null http://127.0.0.1:8082/src/lib/activities.functions.ts   # registra a função no modo dev
//   node scripts/ia-e2e/run.mjs 8082 rate     # "rate" também testa o limite de uso
// Sem LOVABLE_API_KEY, "O serviço de IA não está configurado." significa que o acesso foi LIBERADO.
import { toJSON } from "seroval";
const PORT = process.argv[2] || "8082";
const URL_ = `http://127.0.0.1:${PORT}/_serverFn/eyJmaWxlIjoiL3NyYy9saWIvYWN0aXZpdGllcy5mdW5jdGlvbnMudHM_dHNzLXNlcnZlcmZuLXNwbGl0IiwiZXhwb3J0Ijoic3VnZ2VzdEFjdGl2aXRpZXNfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9`;
const jwt = (sub) =>
  "Bearer " +
  [
    Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
    Buffer.from(
      JSON.stringify({
        sub,
        aud: "authenticated",
        role: "authenticated",
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString("base64url"),
    "sig",
  ].join(".");
const body = (studentId, extra = {}) => ({
  data: {
    studentId,
    studentFirstName: "Lucas",
    age: 9,
    grade: "3º ano",
    observations: "Mantém atenção por dez minutos.",
    goals: "Ampliar o tempo de atenção.",
    ...extra,
  },
  context: {},
});
// extrai a mensagem de erro/resultado do formato seroval
const msg = (txt) => {
  const m = txt.match(/"message":\{"t":1,"s":"([^"]+)"|"error":\{[^}]*"s":"([^"]+)"/g);
  const all = [...txt.matchAll(/"s":"([^"]{6,})"/g)].map((x) => x[1]);
  return all.find((s) => !s.startsWith("$TSR")) || txt.slice(0, 160);
};
async function call(sub, studentId, extra) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tsr-serverFn": "true",
      origin: `http://127.0.0.1:${PORT}`,
      authorization: jwt(sub),
    },
    body: JSON.stringify(toJSON(body(studentId, extra))),
  });
  return `${r.status} ${msg(await r.text())}`;
}
const UUID_OK = "51000000-0000-0000-0000-000000000001",
  UUID_NO = "52000000-0000-0000-0000-000000000002";
const rows = [
  ["conta sem clínica (aluno UUID com consentimento)", "u-notenant", UUID_OK],
  ["clínica suspensa", "u-suspended", UUID_OK],
  ["clínica ativa, id 'x' (desvio antigo)", "u-tenant", "x"],
  ["clínica ativa, id 'demo-3'", "u-tenant", "demo-3"],
  ["clínica ativa, UUID SEM consentimento", "u-tenant", UUID_NO],
  ["clínica ativa, UUID COM consentimento", "u-tenant", UUID_OK],
  ["texto de 10 caracteres a menos (validação)", "u-tenant", UUID_OK, { observations: "curto" }],
];
for (const [nome, sub, id, extra] of rows)
  console.log(`  ${nome.padEnd(52)} -> ${await call(sub, id, extra)}`);
if (process.argv[3] === "rate") {
  let blocked = 0,
    first = -1;
  for (let i = 1; i <= 25; i++) {
    const out = await call("u-rate", UUID_OK);
    if (/Muitas solicitações/.test(out)) {
      blocked++;
      if (first < 0) first = i;
    }
  }
  console.log(
    `  25 chamadas seguidas do mesmo usuário: bloqueadas ${blocked}, a partir da chamada ${first}`,
  );
}
