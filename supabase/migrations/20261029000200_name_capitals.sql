-- Names always start with a capital ("zavier leigh" -> "Zavier Leigh"); the rest is left as typed.
-- Applied on save, so old app versions are covered too, and existing names are fixed below.
create or replace function public.cap_name(n text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare res text := ''; c text; prev text := ' ';
begin
  if n is null then return null; end if;
  n := btrim(regexp_replace(n, '\s+', ' ', 'g'));
  for i in 1..char_length(n) loop
    c := substr(n, i, 1);
    if prev in (' ', '-') then c := upper(c); end if;
    res := res || c; prev := c;
  end loop;
  return res;
end $$;

create or replace function public.name_caps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'athletes' then
    if new.data ? 'name' then new.data := jsonb_set(new.data, '{name}', to_jsonb(public.cap_name(new.data->>'name'))); end if;
  elsif tg_table_name = 'coaches' then
    new.name := public.cap_name(new.name);
  elsif tg_table_name = 'players' then
    new.athlete := public.cap_name(new.athlete);
  else
    new.athlete := public.cap_name(new.athlete);
    if new.data ? 'athlete' then new.data := jsonb_set(new.data, '{athlete}', to_jsonb(public.cap_name(new.data->>'athlete'))); end if;
  end if;
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['athletes','coaches','players','pens','games','checkins','hitting'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_name_caps', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.name_caps()', t || '_name_caps', t);
  end loop;
end $$;

-- fix the names already saved
update public.athletes set data = data where data->>'name' is distinct from public.cap_name(data->>'name');
update public.coaches set name = name where name is distinct from public.cap_name(name);
update public.players set athlete = athlete where athlete is distinct from public.cap_name(athlete);
update public.pens set data = data where athlete is distinct from public.cap_name(athlete) or data->>'athlete' is distinct from public.cap_name(data->>'athlete');
update public.games set data = data where athlete is distinct from public.cap_name(athlete) or data->>'athlete' is distinct from public.cap_name(data->>'athlete');
update public.checkins set data = data where athlete is distinct from public.cap_name(athlete) or data->>'athlete' is distinct from public.cap_name(data->>'athlete');
update public.hitting set data = data where athlete is distinct from public.cap_name(athlete) or data->>'athlete' is distinct from public.cap_name(data->>'athlete');
