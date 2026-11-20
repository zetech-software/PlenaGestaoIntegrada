create or replace function public.tenant_seat_usage()
returns table(tenant_id uuid, used integer)
language sql stable security definer set search_path = public as $$
  select p.tenant_id, count(*)::int from public.profiles p
  where p.tenant_id is not null and public.is_platform_operator()
  group by p.tenant_id
$$;
revoke execute on function public.tenant_seat_usage() from public, anon;
grant execute on function public.tenant_seat_usage() to authenticated;