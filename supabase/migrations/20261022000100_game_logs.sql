-- One pitching line per athlete per game day. id = athlete slug + "_" + date, like checkins.
create table public.games (
  id text primary key,
  data jsonb not null,
  athlete text generated always as (data->>'athlete') stored,
  athlete_slug text generated always as (split_part(id, '_', 1)) stored,
  day date not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create index games_day_idx on public.games (day desc);
create index games_athlete_slug_idx on public.games (athlete_slug);
create trigger games_touch before update on public.games for each row execute function public.touch_updated();

alter table public.games enable row level security;
revoke all on public.games from anon;
create policy "coaches manage games" on public.games
  for all to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));
create policy "players read own games" on public.games
  for select to authenticated
  using (athlete_slug = (select public.my_athlete_slug()));
create policy "players add own games" on public.games
  for insert to authenticated
  with check (athlete_slug = (select public.my_athlete_slug()));
create policy "players update own games" on public.games
  for update to authenticated
  using (athlete_slug = (select public.my_athlete_slug()))
  with check (athlete_slug = (select public.my_athlete_slug()));

alter publication supabase_realtime add table public.games;
