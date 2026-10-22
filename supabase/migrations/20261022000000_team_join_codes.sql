-- Team join codes: people sign up on the website and join with a code instead of
-- a coach linking them by hand. One code for players, a separate one for coaches.
create table public.team_codes (
  role text primary key check (role in ('player','coach')),
  code text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
alter table public.team_codes enable row level security;
revoke all on public.team_codes from anon, authenticated;
grant select on public.team_codes to authenticated;
create policy "coaches read codes" on public.team_codes
  for select to authenticated using ((select public.is_coach()));

-- Failed join attempts, so a code can't be guessed by trying many times.
-- No policies on purpose: only join_team() touches it.
create table public.join_attempts (
  user_id uuid not null,
  at timestamptz not null default now()
);
create index join_attempts_user_at_idx on public.join_attempts (user_id, at desc);
alter table public.join_attempts enable row level security;
revoke all on public.join_attempts from anon, authenticated;

-- Random code from letters and digits that are hard to mix up (no 0/O, 1/I/L).
create or replace function public.new_join_code(len int)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid());
  out text := '';
begin
  for i in 0..len-1 loop
    out := out || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
  end loop;
  return out;
end;
$$;
revoke all on function public.new_join_code(int) from public, anon, authenticated;

insert into public.team_codes (role, code) values
  ('player', public.new_join_code(8)),
  ('coach', public.new_join_code(10));

-- Join the team with a code. Needs a signed-in account with a confirmed email.
-- Returns a status instead of raising, so failed attempts are recorded (an error would roll them back).
-- Returns: 'coach' | 'player' | 'bad_code' | 'too_many_attempts' | 'name_required' | 'name_taken'
--          | 'already_linked' | 'email_not_confirmed' | 'not_signed_in'
create or replace function public.join_team(p_code text, p_name text default null)
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

  if v_role = 'coach' then
    insert into public.coaches (email) values (v_email) on conflict do nothing;
    return 'coach';
  end if;

  if length(v_name) < 2 or length(v_name) > 60 then return 'name_required'; end if;
  v_slug := left(trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g')), 80);
  if v_slug = '' then return 'name_required'; end if;

  -- each player name can only be claimed by one account
  select p.email into v_existing from public.players p where p.athlete_slug = v_slug;
  if found and v_existing.email <> v_email then return 'name_taken'; end if;
  select p.athlete_slug into v_existing from public.players p where p.email = v_email;
  if found and v_existing.athlete_slug <> v_slug then return 'already_linked'; end if;

  insert into public.players (email, athlete, added_by) values (v_email, v_name, uid) on conflict (email) do nothing;
  return 'player';
end;
$$;
revoke all on function public.join_team(text, text) from public, anon;
grant execute on function public.join_team(text, text) to authenticated;

-- Coaches can replace a code; the old one stops working for new joins.
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
  v_code := public.new_join_code(case when p_role = 'coach' then 10 else 8 end);
  update public.team_codes set code = v_code, updated_at = now(), updated_by = auth.uid() where role = p_role;
  return v_code;
end;
$$;
revoke all on function public.rotate_join_code(text) from public, anon;
grant execute on function public.rotate_join_code(text) to authenticated;

-- Coaches can see and remove other coaches (not themselves, so the team is never left without one).
create policy "coaches see all coaches" on public.coaches
  for select to authenticated using ((select public.is_coach()));
create policy "coaches remove other coaches" on public.coaches
  for delete to authenticated
  using ((select public.is_coach()) and email <> lower(coalesce(auth.jwt()->>'email', '')));
grant select, delete on public.coaches to authenticated;
