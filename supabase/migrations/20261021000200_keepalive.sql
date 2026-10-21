-- Pinged once a day by a GitHub Action so the free-plan project isn't paused for inactivity.
-- Reads no data; safe to expose to the public key.
create or replace function public.keepalive()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select 'ok'::text where (select count(*) from pg_catalog.pg_class where relname = 'pens') >= 0;
$$;
revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
