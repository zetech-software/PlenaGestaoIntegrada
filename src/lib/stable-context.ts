import { createContext, type Context } from "react";

// Hot reload re-runs hook modules and would create a fresh context while the old provider
// is still mounted, so consumers throw "Provider is required". Reuse one context per key.
const registry = ((
  globalThis as { __plenaContexts?: Map<string, Context<unknown>> }
).__plenaContexts ??= new Map());

export function createStableContext<T>(key: string): Context<T | null> {
  const existing = registry.get(key);
  if (existing) return existing as Context<T | null>;
  const ctx = createContext<T | null>(null);
  ctx.displayName = key;
  registry.set(key, ctx as Context<unknown>);
  return ctx;
}
