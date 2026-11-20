import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createServerOnlyFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { nonceFor } from "./lib/csp-nonce";
import { routeTree } from "./routeTree.gen";

// Só roda no servidor: o nonce da requisição em andamento, para marcar os scripts da página.
const requestNonce = createServerOnlyFn(() => {
  const request = getRequest();
  return request ? nonceFor(request) : undefined;
});

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  const queryClient = new QueryClient();
  const nonce = typeof window === "undefined" ? requestNonce() : undefined;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Lets Query own freshness; set caching defaults on the QueryClient, not the router.
    defaultPreloadStaleTime: 0,
    ...(nonce ? { ssr: { nonce } } : {}),
  });

  return router;
};
