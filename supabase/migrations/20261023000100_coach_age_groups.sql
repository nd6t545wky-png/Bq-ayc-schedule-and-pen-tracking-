-- Coaches are assigned to age groups and only see athletes in those groups.
-- One coach is the owner: sees and manages every coach and every age group.
-- Nobody can read an email address through the API: the email columns are not granted.
alter table public.coaches
  add column id uuid not null default gen_random_uuid(),
  add column name text check (name is null or length(btrim(name)) between 1 and 60),
  add column age_groups text[] not null default '{}' check (age_groups <@ array['U16','U18','AYWC','AWC']),
  add column owner boolean not null default false;
create unique index coaches_id_key on public.coaches (id);
create unique index coaches_one_owner on public.coaches (owner) where owner;
-- coaches already on the team keep the access they had until the owner changes it
update public.coaches set age_groups = array['U16','U18','AYWC','AWC'] where true;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.coaches c on c.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and c.owner
  );
$$;

-- Can the signed-in coach work with this age group / this athlete?
create or replace function public.coach_age_ok(p_age text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.coaches c on c.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and (c.owner or p_age = any(c.age_groups))
  );
$$;
create or replace function public.coach_sees(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.coaches c on c.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and (c.owner or exists (
        select 1 from public.athletes a
        where a.id = p_slug and a.data->>'age' = any(c.age_groups)))
  );
$$;
revoke all on function public.is_owner(), public.coach_age_ok(text), public.coach_sees(text) from public, anon;
grant execute on function public.is_owner(), public.coach_age_ok(text), public.coach_sees(text) to authenticated;

-- Athlete data: coaches only reach their own age groups (the owner reaches all).
alter policy "coaches manage athletes" on public.athletes
  using (public.coach_age_ok(data->>'age'))
  with check (public.coach_age_ok(data->>'age'));
alter policy "coaches manage pens" on public.pens
  using (public.coach_sees(athlete_slug)) with check (public.coach_sees(athlete_slug));
alter policy "coaches manage checkins" on public.checkins
  using (public.coach_sees(athlete_slug)) with check (public.coach_sees(athlete_slug));
alter policy "coaches manage games" on public.games
  using (public.coach_sees(athlete_slug)) with check (public.coach_sees(athlete_slug));
alter policy "coaches manage hitting" on public.hitting
  using (public.coach_sees(athlete_slug)) with check (public.coach_sees(athlete_slug));

-- Player accounts: coaches see names in their groups, never emails. Linking goes through link_player().
alter policy "coaches manage players" on public.players
  using (public.coach_sees(athlete_slug)) with check (public.coach_sees(athlete_slug));
revoke all on public.players from anon, authenticated;
grant select (athlete, athlete_slug, added_at) on public.players to authenticated;
grant delete on public.players to authenticated;

-- Coach list: only the owner sees it, by name. Changes go through set_coach().
alter policy "coaches see all coaches" on public.coaches using (public.is_owner());
alter policy "coaches remove other coaches" on public.coaches using (public.is_owner() and not owner);
revoke all on public.coaches from anon, authenticated;
grant select (id, name, age_groups, owner, added_at) on public.coaches to authenticated;
grant delete on public.coaches to authenticated;

-- The coach code is the owner's alone; other coaches only see and change the player code.
alter policy "coaches read codes" on public.team_codes
  using (public.is_coach() and (role = 'player' or public.is_owner()));
create or replace function public.rotate_join_code(p_role text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare v_code text;
begin
  if not public.is_coach() then raise exception 'not_allowed'; end if;
  if p_role not in ('player','coach') then raise exception 'bad_role'; end if;
  if p_role = 'coach' and not public.is_owner() then raise exception 'not_allowed'; end if;
  v_code := public.new_join_code(case when p_role = 'coach' then 10 else 8 end);
  update public.team_codes set code = v_code, updated_at = now(), updated_by = auth.uid() where role = p_role;
  return v_code;
end;
$$;

-- The signed-in coach's own details (no email).
create or replace function public.my_coach()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object('id', c.id, 'name', c.name, 'owner', c.owner, 'age_groups', c.age_groups)
  from auth.users u
  join public.coaches c on c.email = lower(u.email)
  where u.id = auth.uid() and u.email_confirmed_at is not null;
$$;
create or replace function public.set_my_coach_name(p_name text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if length(v_name) < 2 or length(v_name) > 60 then return 'name_required'; end if;
  update public.coaches c set name = v_name
  from auth.users u
  where u.id = auth.uid() and u.email_confirmed_at is not null and c.email = lower(u.email);
  return case when found then 'ok' else 'not_allowed' end;
end;
$$;
-- Owner only: rename a coach and set their age groups.
create or replace function public.set_coach(p_id uuid, p_name text, p_groups text[])
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if not public.is_owner() then return 'not_allowed'; end if;
  if v_name <> '' and (length(v_name) < 2 or length(v_name) > 60) then return 'name_required'; end if;
  if not (coalesce(p_groups, '{}') <@ array['U16','U18','AYWC','AWC']) then return 'bad_group'; end if;
  update public.coaches
    set name = coalesce(nullif(v_name, ''), name), age_groups = coalesce(p_groups, '{}')
    where id = p_id;
  return case when found then 'ok' else 'not_found' end;
end;
$$;
revoke all on function public.my_coach(), public.set_my_coach_name(text), public.set_coach(uuid, text, text[]) from public, anon;
grant execute on function public.my_coach(), public.set_my_coach_name(text), public.set_coach(uuid, text, text[]) to authenticated;

-- Make sure there is a profile (with an age group) for an athlete, without changing an existing one.
create or replace function public.ensure_athlete(p_slug text, p_name text, p_age text)
returns void
language sql
volatile
set search_path = ''
as $$
  insert into public.athletes (id, data)
  values (p_slug, jsonb_build_object('name', p_name, 'age', p_age, 'updatedAt', (extract(epoch from now()) * 1000)::bigint))
  on conflict (id) do nothing;
$$;
revoke all on function public.ensure_athlete(text, text, text) from public, anon, authenticated;

-- Join the team with a code. Coaches give their name (they start with no age groups until
-- the owner assigns some); players give their name and age group.
-- Returns: 'coach' | 'player' | 'bad_code' | 'too_many_attempts' | 'name_required' | 'age_required'
--          | 'name_taken' | 'already_linked' | 'email_not_confirmed' | 'not_signed_in'
create or replace function public.join_team(p_code text, p_name text, p_age text)
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
  v_slug := left(trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g')), 80);
  if v_slug = '' then return 'name_required'; end if;

  -- each player name can only be claimed by one account
  select p.email into v_existing from public.players p where p.athlete_slug = v_slug;
  if found and v_existing.email <> v_email then return 'name_taken'; end if;
  select p.athlete_slug into v_existing from public.players p where p.email = v_email;
  if found and v_existing.athlete_slug <> v_slug then return 'already_linked'; end if;

  insert into public.players (email, athlete, added_by) values (v_email, v_name, uid) on conflict (email) do nothing;
  perform public.ensure_athlete(v_slug, v_name, p_age);
  return 'player';
end;
$$;
revoke all on function public.join_team(text, text, text) from public, anon;
grant execute on function public.join_team(text, text, text) to authenticated;

-- The old two-argument version (pages cached before this change) asks for the new page.
create or replace function public.join_team(p_code text, p_name text default null)
returns text
language sql
stable
set search_path = ''
as $$ select 'update_app'::text; $$;

-- A coach links a player's email to a name by hand (for players who can't use a code).
-- Returns: 'ok' | 'name_required' | 'age_required' | 'bad_email' | 'name_taken' | 'already_linked' | 'not_allowed'
create or replace function public.link_player(p_email text, p_name text, p_age text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_slug text;
  v_existing record;
begin
  if not public.is_coach() then return 'not_allowed'; end if;
  if length(v_name) < 2 or length(v_name) > 60 then return 'name_required'; end if;
  if p_age is null or p_age not in ('U16','U18','AYWC','AWC') then return 'age_required'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return 'bad_email'; end if;
  v_slug := left(trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g')), 80);
  if v_slug = '' then return 'name_required'; end if;

  -- an existing athlete keeps their age group; the coach must cover it
  select a.data->>'age' as age into v_existing from public.athletes a where a.id = v_slug;
  if found then
    if not public.coach_age_ok(v_existing.age) then return 'not_allowed'; end if;
  elsif not public.coach_age_ok(p_age) then return 'not_allowed';
  end if;

  select p.email into v_existing from public.players p where p.athlete_slug = v_slug;
  if found and v_existing.email <> v_email then return 'name_taken'; end if;
  select p.athlete_slug into v_existing from public.players p where p.email = v_email;
  if found and v_existing.athlete_slug <> v_slug then return 'already_linked'; end if;

  insert into public.players (email, athlete, added_by) values (v_email, v_name, auth.uid()) on conflict (email) do nothing;
  perform public.ensure_athlete(v_slug, v_name, p_age);
  return 'ok';
end;
$$;
revoke all on function public.link_player(text, text, text) from public, anon;
grant execute on function public.link_player(text, text, text) to authenticated;
