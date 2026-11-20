import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { nonceFor } from "./lib/csp-nonce";
import { securityHeaders } from "./lib/security-headers";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const env = (name: string) => {
  try {
    return process.env[name];
  } catch {
    return undefined;
  }
};

/** Acrescenta os cabeçalhos de segurança a qualquer resposta (página, função de servidor, erro). */
function withSecurityHeaders(response: Response, nonce: string): Response {
  const headers = new Headers(response.headers);
  const production = import.meta.env.PROD;
  // Em desenvolvimento o Vite injeta scripts e um websocket próprios: só os cabeçalhos simples valem.
  const set = securityHeaders({
    nonce,
    // Os dois endereços: o do servidor e o que o navegador usa (gravado no build). Se o servidor não
    // conseguir ler o ambiente, o segundo garante que o login não seja bloqueado pela política.
    supabaseUrl: [env("SUPABASE_URL"), import.meta.env["VITE_SUPABASE_URL"] as string | undefined],
    frameAncestors: env("CSP_FRAME_ANCESTORS"),
    enforceFullCsp: env("CSP_ENFORCE") === "true",
    production,
  });
  for (const [name, value] of Object.entries(set)) {
    if (!production && name.startsWith("Content-Security-Policy-Report-Only")) continue;
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, runtimeEnv: unknown, ctx: unknown) {
    const nonce = nonceFor(request);
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, runtimeEnv, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response), nonce);
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        nonce,
      );
    }
  },
};
