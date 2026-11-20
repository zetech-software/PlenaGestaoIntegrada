// Supabase FALSO só para testar a função de IA de ponta a ponta, sem tocar no Supabase real.
// O "usuário" é o campo sub do token: u-notenant (sem clínica), u-suspended (clínica suspensa), u-tenant (ativa).
// Não confere assinatura de token: serve para o encadeamento das checagens, não para a autenticação do Supabase.
// Uso:  node scripts/ia-e2e/fake-supabase.mjs   (porta 9100)
import http from "node:http";
const T = "00000000-0000-4000-8000-00000000a001";
const CONSENT_OK = "51000000-0000-0000-0000-000000000001";
const scenario = (auth) => {
  const token = (auth || "").replace(/^Bearer /, "");
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).sub;
  } catch {
    return "";
  }
};
http
  .createServer(async (req, res) => {
    let body = "";
    for await (const c of req) body += c;
    const sub = scenario(req.headers.authorization);
    const send = (code, obj) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    if (req.url.startsWith("/auth/v1/user"))
      return send(200, {
        id: sub,
        aud: "authenticated",
        role: "authenticated",
        email: sub + "@t.local",
      });
    if (req.url.includes("/rpc/current_tenant_id"))
      return send(200, sub === "u-notenant" ? null : T);
    if (req.url.includes("/rpc/tenant_is_active"))
      return send(200, sub !== "u-suspended" && sub !== "u-notenant");
    if (req.url.includes("/rpc/has_active_consent")) {
      const b = JSON.parse(body || "{}");
      console.log("rpc has_active_consent", b._student_id, b._purpose);
      return send(200, b._student_id === CONSENT_OK);
    }
    send(404, { message: "não simulado: " + req.url });
  })
  .listen(9100, "127.0.0.1", () => console.log("fake supabase em 9100"));
