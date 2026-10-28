-- Players pick their age group and whether they're a pitcher, position player or two-way when they join.
-- Returns as before, plus 'type_required'. The three-argument version (pages cached before this
-- change) asks for the new page.
drop function if exists public.join_team(text, text, text);
create or replace function public.join_team(p_code text, p_name text, p_age text, p_type text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  v_email text;
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_slug text;
  v_role text;
  v_existing record;
begin
  if uid is null then return 'not_signed_in'; end if;
  select lower(u.email) into v_email from auth.users u where u.id = uid and u.email_confirmed_at is not null;
  if v_email is null then return 'email_not_confirmed'; end if;

  if (select count(*) from public.join_attempts a where a.user_id = uid and a.at > now() - interval '1 hour') >= 10 then
    return 'too_many_attempts';
  end if;

  select c.role into v_role from public.team_codes c where c.code = v_code;
  if v_role is null then
    insert into public.join_attempts (user_id) values (uid);
    return 'bad_code';
  end if;

  if length(v_name) < 2 or length(v_name) > 60 then return 'name_required'; end if;

  if v_role = 'coach' then
    insert into public.coaches (email, name) values (v_email, v_name)
      on conflict (email) do update set name = coalesce(public.coaches.name, excluded.name);
    return 'coach';
  end if;

  if p_age is null or p_age not in ('U16','U18','AYWC','AWC') then return 'age_required'; end if;
  if p_type is null or p_type not in ('P','POS','TWO') then return 'type_required'; end if;
  v_slug := left(trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g')), 80);
  if v_slug = '' then return 'name_required'; end if;

  -- each player name can only be claimed by one account
  select p.email into v_existing from public.players p where p.athlete_slug = v_slug;
  if found and v_existing.email <> v_email then return 'name_taken'; end if;
  select p.athlete_slug into v_existing from public.players p where p.email = v_email;
  if found and v_existing.athlete_slug <> v_slug then return 'already_linked'; end if;

  insert into public.players (email, athlete, added_by) values (v_email, v_name, uid) on conflict (email) do nothing;
  perform public.ensure_athlete(v_slug, v_name, p_age);
  -- a type a coach already set stays; otherwise the player's choice is used
  update public.athletes
    set data = data || jsonb_build_object('type', p_type, 'updatedAt', (extract(epoch from now()) * 1000)::bigint)
    where id = v_slug and coalesce(data->>'type', '') = '';
  return 'player';
end;
$$;
revoke all on function public.join_team(text, text, text, text) from public, anon;
grant execute on function public.join_team(text, text, text, text) to authenticated;

create or replace function public.join_team(p_code text, p_name text, p_age text)
returns text
language sql
stable
set search_path = ''
as $$ select 'update_app'::text; $$;
