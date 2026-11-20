import { describe, expect, it } from "vitest";
import {
  EDITOR_ANCESTORS,
  baselineCsp,
  newNonce,
  sanitizeAncestors,
  securityHeaders,
  supabaseOrigins,
} from "@/lib/security-headers";

const base = {
  nonce: "abc123",
  supabaseUrl: "https://proj.supabase.co",
  enforceFullCsp: false,
  production: true,
};

describe("nonce", () => {
  it("é diferente a cada requisição e tem 128 bits", () => {
    const set = new Set(Array.from({ length: 200 }, () => newNonce()));
    expect(set.size).toBe(200);
    expect(atob([...set][0] ?? "")).toHaveLength(16);
    expect([...set].every((n) => /^[A-Za-z0-9+/]+=*$/.test(n))).toBe(true);
  });
});
describe("origens do Supabase", () => {
  it("libera https e o websocket correspondente", () => {
    expect(supabaseOrigins("https://proj.supabase.co/rest/v1")).toEqual([
      "https://proj.supabase.co",
      "wss://proj.supabase.co",
    ]);
    expect(supabaseOrigins("http://127.0.0.1:9100")).toEqual([
      "http://127.0.0.1:9100",
      "ws://127.0.0.1:9100",
    ]);
  });
  it("aceita mais de um endereço, sem repetir", () => {
    expect(
      supabaseOrigins([
        "https://a.supabase.co",
        undefined,
        "https://a.supabase.co/x",
        "https://b.co",
      ]),
    ).toEqual(["https://a.supabase.co", "wss://a.supabase.co", "https://b.co", "wss://b.co"]);
  });
  it("ignora valor ausente, inválido ou de outro esquema", () => {
    expect(supabaseOrigins(undefined)).toEqual([]);
    expect(supabaseOrigins("")).toEqual([]);
    expect(supabaseOrigins("nao-e-url")).toEqual([]);
    expect(supabaseOrigins("javascript:alert(1)")).toEqual([]);
    expect(supabaseOrigins("ftp://x.co")).toEqual([]);
  });
});
describe("cabeçalhos de segurança", () => {
  it("sempre aplica nosniff, referrer, permissões e as diretivas básicas", () => {
    const h = securityHeaders(base);
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Permissions-Policy"]).toMatch(/camera=\(\).*microphone=\(\).*geolocation=\(\)/);
    expect(h["Content-Security-Policy"]).toContain("object-src 'none'");
    expect(h["Content-Security-Policy"]).toContain("base-uri 'self'");
    expect(h["Content-Security-Policy"]).toContain("form-action 'self'");
  });
  it("permite que só o próprio site e os editores do Lovable embutam a página", () => {
    const csp = securityHeaders(base)["Content-Security-Policy"] ?? "";
    expect(csp).toContain("frame-ancestors 'self' https://lovable.dev");
    for (const a of EDITOR_ANCESTORS) expect(csp).toContain(a);
    expect(csp).not.toContain("*;");
  });
  it("a lista de quem embuta pode ser trocada e não aceita injetar outras diretivas", () => {
    const h = securityHeaders({ ...base, frameAncestors: "https://meu.app; script-src *\r\nX: y" });
    const csp = h["Content-Security-Policy"] ?? "";
    expect(csp).toContain("frame-ancestors https://meu.app");
    expect(csp).not.toContain("script-src");
    expect(csp).not.toContain("*");
    expect(csp).not.toMatch(/[\r\n]/);
  });
  it("só aceita fontes válidas em frame-ancestors", () => {
    expect(sanitizeAncestors("'self' https://a.com https://*.b.com http://localhost:3000")).toBe(
      "'self' https://a.com https://*.b.com http://localhost:3000",
    );
    for (const bad of [
      "*",
      "https://*",
      "javascript:alert(1)",
      "data:",
      "script-src",
      "https://a.com/caminho",
      "'unsafe-inline'",
    ]) {
      expect(sanitizeAncestors(bad)).toBe(sanitizeAncestors(undefined));
    }
    expect(sanitizeAncestors("https://ok.com *  'unsafe-eval'")).toBe("https://ok.com");
    expect(sanitizeAncestors("")).toContain("https://lovable.dev");
  });
  it("política completa só relata por padrão e passa a valer com enforceFullCsp", () => {
    const report = securityHeaders(base);
    expect(report["Content-Security-Policy-Report-Only"]).toContain(
      "script-src 'self' 'nonce-abc123'",
    );
    expect(report["Content-Security-Policy"]).toBe(
      baselineCsp(report["Content-Security-Policy"]?.split("frame-ancestors ")[1] ?? ""),
    );
    const enforced = securityHeaders({ ...base, enforceFullCsp: true });
    expect(enforced["Content-Security-Policy"]).toContain("script-src 'self' 'nonce-abc123'");
    expect(enforced["Content-Security-Policy-Report-Only"]).toBeUndefined();
  });
  it("scripts não aceitam inline nem eval, só nonce", () => {
    const full = securityHeaders(base)["Content-Security-Policy-Report-Only"] ?? "";
    const script = full.split("; ").find((d) => d.startsWith("script-src")) ?? "";
    expect(script).not.toContain("unsafe-inline");
    expect(script).not.toContain("unsafe-eval");
    expect(script).not.toContain("*");
  });
  it("conexões do navegador só para o próprio site e o Supabase", () => {
    const full = securityHeaders(base)["Content-Security-Policy-Report-Only"] ?? "";
    expect(full).toContain("connect-src 'self' https://proj.supabase.co wss://proj.supabase.co");
    expect(
      securityHeaders({ ...base, supabaseUrl: undefined })["Content-Security-Policy-Report-Only"],
    ).toContain("connect-src 'self';");
  });
  it("HSTS e upgrade-insecure-requests só em produção", () => {
    const prod = securityHeaders(base);
    expect(prod["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains");
    expect(prod["Content-Security-Policy-Report-Only"]).toContain("upgrade-insecure-requests");
    const dev = securityHeaders({ ...base, production: false });
    expect(dev["Strict-Transport-Security"]).toBeUndefined();
    expect(dev["Content-Security-Policy-Report-Only"]).not.toContain("upgrade-insecure-requests");
  });
});
