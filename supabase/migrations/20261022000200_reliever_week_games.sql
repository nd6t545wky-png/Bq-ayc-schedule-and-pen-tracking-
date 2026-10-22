-- Games are now also added to a player's week (and removed again) before they're played.
-- Players can take a game off their week only if it hasn't happened yet (Brisbane date);
-- coaches keep full control through "coaches manage games".
create policy "players remove own games" on public.games
  for delete to authenticated
  using (
    athlete_slug = (select public.my_athlete_slug())
    and day >= (now() at time zone 'Australia/Brisbane')::date
  );

-- The game's date always comes from its id (athlete slug + "_" + YYYY-MM-DD), so a past
-- game can't be re-dated into the future and then removed.
create or replace function public.games_day_from_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.day := split_part(new.id, '_', 2)::date;
  return new;
end;
$$;
create trigger games_day_from_id before insert or update on public.games
  for each row execute function public.games_day_from_id();
