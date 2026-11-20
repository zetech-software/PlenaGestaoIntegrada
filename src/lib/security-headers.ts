/** Cabeçalhos de segurança das respostas do servidor. Puro, para testar sem rede. */

export const NONCE_HEADER = "x-csp-nonce";

/** Nonce de 128 bits, em base64, novo a cada requisição. */
export function newNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** Editores do Lovable que embutem a pré-visualização (mesma lista que o login por editor usa). */
export const EDITOR_ANCESTORS = [
  "https://lovable.dev",
  "https://*.lovable.dev",
  "https://gptengineer.app",
  "https://*.gptengineer.app",
];

const ANCESTOR_TOKEN = /^(?:'self'|'none'|https?:\/\/(?:\*\.)?[a-z0-9.-]+(?::\d+)?)$/i;
/** Fica só com fontes válidas (nunca "*" sozinho nem outra diretiva); sem nenhuma válida, usa o padrão. */
export function sanitizeAncestors(input: string | undefined): string {
  const tokens = (input ?? "").split(/[\s;,]+/).filter((t) => ANCESTOR_TOKEN.test(t));
  return tokens.length ? tokens.join(" ") : ["'self'", ...EDITOR_ANCESTORS].join(" ");
}

export interface HeaderOptions {
  nonce: string;
  /** Endereço(s) do Supabase (ex.: https://abc.supabase.co); libera as chamadas do navegador a eles. */
  supabaseUrl?: string | undefined | (string | undefined)[];
  /** Substitui a lista de quem pode embutir a página (CSP_FRAME_ANCESTORS, separada por espaço). */
  frameAncestors?: string | undefined;
  /** true = a política completa é aplicada; false = só relata no console (modo de implantação). */
  enforceFullCsp: boolean;
  /** Em produção, inclui HSTS e upgrade-insecure-requests. */
  production: boolean;
}

/** https://x.supabase.co -> https://x.supabase.co e wss://x.supabase.co. Ignora o que não for http(s) válido. */
export function supabaseOrigins(urls: string | undefined | (string | undefined)[]): string[] {
  const list = Array.isArray(urls) ? urls : [urls];
  const out = new Set<string>();
  for (const url of list) {
    if (!url) continue;
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" && u.protocol !== "http:") continue;
      out.add(u.origin);
      out.add(`${u.protocol === "https:" ? "wss:" : "ws:"}//${u.host}`);
    } catch {
      /* endereço inválido: ignora */
    }
  }
  return [...out];
}

/** Diretivas que raramente quebram algo: sempre aplicadas. */
export function baselineCsp(frameAncestors: string): string {
  return [
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
  ].join("; ");
}

/** Política completa. Scripts só com nonce; estilos aceitam inline porque a interface usa style=""; */
export function fullCsp(
  o: Pick<HeaderOptions, "nonce" | "supabaseUrl" | "production"> & { frameAncestors: string },
): string {
  const connect = ["'self'", ...supabaseOrigins(o.supabaseUrl)].join(" ");
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${o.nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    `connect-src ${connect}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${o.frameAncestors}`,
  ];
  if (o.production) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

export function securityHeaders(o: HeaderOptions): Record<string, string> {
  const frameAncestors = sanitizeAncestors(o.frameAncestors);
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    "Content-Security-Policy": baselineCsp(frameAncestors),
  };
  if (o.production) headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  const full = fullCsp({
    nonce: o.nonce,
    supabaseUrl: o.supabaseUrl,
    production: o.production,
    frameAncestors,
  });
  if (o.enforceFullCsp) headers["Content-Security-Policy"] = full;
  else headers["Content-Security-Policy-Report-Only"] = full;
  return headers;
}
