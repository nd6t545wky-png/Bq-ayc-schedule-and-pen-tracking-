-- At-bat-by-at-bat hitting, one row per player per game date. id = athlete slug + "_" + date.
create table public.hitting (
  id text primary key,
  data jsonb not null,
  athlete text generated always as (data->>'athlete') stored,
  athlete_slug text generated always as (split_part(id, '_', 1)) stored,
  day date not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create index hitting_day_idx on public.hitting (day desc);
create index hitting_athlete_slug_idx on public.hitting (athlete_slug);
create trigger hitting_touch before update on public.hitting for each row execute function public.touch_updated();
create or replace function public.hitting_day_from_id()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.day := split_part(new.id, '_', 2)::date;
  return new;
end;
$$;
create trigger hitting_day_from_id before insert or update on public.hitting
  for each row execute function public.hitting_day_from_id();

alter table public.hitting enable row level security;
revoke all on public.hitting from anon;
create policy "coaches manage hitting" on public.hitting
  for all to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));
create policy "players read own hitting" on public.hitting
  for select to authenticated
  using (athlete_slug = (select public.my_athlete_slug()));
create policy "players add own hitting" on public.hitting
  for insert to authenticated
  with check (athlete_slug = (select public.my_athlete_slug()));
create policy "players update own hitting" on public.hitting
  for update to authenticated
  using (athlete_slug = (select public.my_athlete_slug()))
  with check (athlete_slug = (select public.my_athlete_slug()));

alter publication supabase_realtime add table public.hitting;
