-- The sheet script shares each age group's spreadsheet with that group's coaches (and nobody
-- else), so the export now includes their names and emails. Only the export key's holder (the
-- owner's own sync script) ever receives them; they never go into the spreadsheet itself.
create or replace function public.sheet_export(p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_key is null or not exists (
    select 1 from public.sheet_keys k where k.key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex')
  ) then return null; end if;
  return jsonb_build_object(
    'generated_at', now(),
    'groups', jsonb_build_object(
      'U16', public.sheet_group('U16'), 'U18', public.sheet_group('U18'),
      'AYWC', public.sheet_group('AYWC'), 'AWC', public.sheet_group('AWC')),
    'viewers', (select jsonb_object_agg(g, coalesce((
        select jsonb_agg(jsonb_build_object('name', coalesce(c.name, 'Unnamed coach'), 'email', c.email) order by lower(coalesce(c.name, '')))
        from public.coaches c where not c.owner and g = any(c.age_groups)), '[]'::jsonb))
      from unnest(array['U16','U18','AYWC','AWC']) g));
end;
$$;
