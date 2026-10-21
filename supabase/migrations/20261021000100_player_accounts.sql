-- Players: a coach links a player's sign-in email to their athlete name.
-- Slugs match the app's slug(): lowercase, non-alphanumerics to "-", trimmed, max 80.
create table public.players (
  email text primary key check (email = lower(email)),
  athlete text not null check (length(trim(athlete)) > 0),
  athlete_slug text generated always as (left(trim(both '-' from regexp_replace(lower(athlete), '[^a-z0-9]+', '-', 'g')), 80)) stored,
  added_at timestamptz not null default now(),
  added_by uuid default auth.uid()
);
alter table public.players enable row level security;
revoke all on public.players from anon;

-- The signed-in player's athlete name, once their email is confirmed; null otherwise.
create or replace function public.my_athlete()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.athlete
  from auth.users u
  join public.players p on p.email = lower(u.email)
  where u.id = auth.uid()
    and u.email_confirmed_at is not null
  limit 1;
$$;
create or replace function public.my_athlete_slug()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.athlete_slug
  from auth.users u
  join public.players p on p.email = lower(u.email)
  where u.id = auth.uid()
    and u.email_confirmed_at is not null
  limit 1;
$$;
revoke all on function public.my_athlete(), public.my_athlete_slug() from public, anon;
grant execute on function public.my_athlete(), public.my_athlete_slug() to authenticated;

create policy "coaches manage players" on public.players
  for all to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));
create policy "players see own link" on public.players
  for select to authenticated
  using (athlete_slug = (select public.my_athlete_slug()));

-- Slug columns so player rules can match rows to the signed-in player.
alter table public.checkins add column athlete_slug text generated always as (split_part(id, '_', 1)) stored;
alter table public.pens add column athlete_slug text generated always as (left(trim(both '-' from regexp_replace(lower(data->>'athlete'), '[^a-z0-9]+', '-', 'g')), 80)) stored;
create index checkins_athlete_slug_idx on public.checkins (athlete_slug);
create index pens_athlete_slug_idx on public.pens (athlete_slug);

-- Players read and fill in only their own check-ins.
create policy "players read own checkins" on public.checkins
  for select to authenticated
  using (athlete_slug = (select public.my_athlete_slug()));
create policy "players add own checkins" on public.checkins
  for insert to authenticated
  with check (athlete_slug = (select public.my_athlete_slug()));
create policy "players update own checkins" on public.checkins
  for update to authenticated
  using (athlete_slug = (select public.my_athlete_slug()))
  with check (athlete_slug = (select public.my_athlete_slug()));

-- Players can view their own pens and athlete profile, never change them.
create policy "players read own pens" on public.pens
  for select to authenticated
  using (athlete_slug = (select public.my_athlete_slug()));
create policy "players read own profile" on public.athletes
  for select to authenticated
  using (id = (select public.my_athlete_slug()));
