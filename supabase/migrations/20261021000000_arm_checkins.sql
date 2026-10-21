-- One row per athlete per day: how the arm feels before and after throwing (1-10).
create table public.checkins (
  id text primary key,
  data jsonb not null,
  athlete text generated always as (data->>'athlete') stored,
  day date not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create index checkins_day_idx on public.checkins (day desc);
create trigger checkins_touch before update on public.checkins for each row execute function public.touch_updated();

alter table public.checkins enable row level security;
create policy "coaches manage checkins" on public.checkins
  for all to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));
revoke all on public.checkins from anon;

alter publication supabase_realtime add table public.checkins;
