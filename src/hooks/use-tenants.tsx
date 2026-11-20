import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";
import { DemoTenantService } from "@/services/tenant-service";
import { demoTenants } from "@/data/demo-tenants";
import { useAuth } from "@/hooks/use-auth";
import { canAccess } from "@/services/permissions";
import type { Tenant, TenantDraft, TenantService, TenantStatus } from "@/types/tenant";
interface Ctx {
  tenants: Tenant[];
  isLoading: boolean;
  error: Error | null;
  create: (draft: TenantDraft) => Promise<Tenant>;
  setStatus: (id: string, status: TenantStatus) => Promise<void>;
}
const TenantContext = createContext<Ctx | null>(null);
const tenantsKey = ["tenants"] as const;
export function TenantsProvider({ children }: { children: ReactNode }) {
  const [service] = useState<TenantService>(() => new DemoTenantService(demoTenants));
  const queryClient = useQueryClient();
  const { role } = useAuth();
  // Só o operador da plataforma lê a lista de clientes: nem a consulta é feita para os demais.
  const allowed = canAccess(role, "plataforma");
  const query = useQuery({ queryKey: tenantsKey, queryFn: () => service.list(), enabled: allowed });
  const refresh = { onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantsKey }) };
  const create = useMutation({ mutationFn: (d: TenantDraft) => service.create(d), ...refresh });
  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: TenantStatus }) => service.setStatus(v.id, v.status),
    ...refresh,
  });
  const value: Ctx = {
    tenants: allowed ? (query.data ?? []) : [],
    isLoading: allowed && query.isPending,
    error: query.error,
    create: (d) => create.mutateAsync(d),
    setStatus: (id, status) => setStatus.mutateAsync({ id, status }),
  };
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
export function useTenants() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("TenantsProvider is required");
  return ctx;
}
