-- Coaches allowed to read and write pens. Add a row per coach email.
create table public.coaches (
  email text primary key check (email = lower(email)),
  added_at timestamptz not null default now()
);

create table public.pens (
  id text primary key,
  data jsonb not null,
  athlete text generated always as (data->>'athlete') stored,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create index pens_created_at_idx on public.pens (created_at desc);

create table public.athletes (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

create or replace function public.touch_updated()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
create trigger pens_touch before update on public.pens for each row execute function public.touch_updated();
create trigger athletes_touch before update on public.athletes for each row execute function public.touch_updated();

alter table public.coaches enable row level security;
alter table public.pens enable row level security;
alter table public.athletes enable row level security;

-- A signed-in user can see whether they themselves are on the list.
create policy "coaches see own row" on public.coaches
  for select to authenticated
  using (email = lower(coalesce(auth.jwt()->>'email', '')));

revoke all on public.coaches, public.pens, public.athletes from anon;

alter publication supabase_realtime add table public.pens, public.athletes;
