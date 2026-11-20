drop policy "Operador vê clientes" on public.tenants;
create policy "Operador vê clientes" on public.tenants for select to authenticated
  using (public.is_platform_operator() or (public.is_tenant_admin() and id = public.current_tenant_id()));