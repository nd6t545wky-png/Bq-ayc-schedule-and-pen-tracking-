-- A coach can be set to pitching only (by the owner): the app then leaves out hitting for them.
alter table public.coaches add column pitching_only boolean not null default false;
grant select (pitching_only) on public.coaches to authenticated;

create or replace function public.my_coach()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object('id', c.id, 'name', c.name, 'owner', c.owner, 'age_groups', c.age_groups, 'pitching_only', c.pitching_only)
  from auth.users u
  join public.coaches c on c.email = lower(u.email)
  where u.id = auth.uid() and u.email_confirmed_at is not null;
$$;

-- Owner only.
create or replace function public.set_coach_pitching_only(p_id uuid, p_on boolean)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then return 'not_allowed'; end if;
  update public.coaches set pitching_only = coalesce(p_on, false) where id = p_id and not owner;
  return case when found then 'ok' else 'not_found' end;
end;
$$;
revoke all on function public.set_coach_pitching_only(uuid, boolean) from public, anon;
grant execute on function public.set_coach_pitching_only(uuid, boolean) to authenticated;
