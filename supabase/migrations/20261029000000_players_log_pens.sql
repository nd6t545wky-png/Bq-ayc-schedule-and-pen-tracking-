-- Players log their own bullpens (add and update; deleting stays with coaches).
create policy "players add own pens" on public.pens for insert to authenticated
  with check (athlete_slug = (select public.my_athlete_slug()));
create policy "players update own pens" on public.pens for update to authenticated
  using (athlete_slug = (select public.my_athlete_slug()))
  with check (athlete_slug = (select public.my_athlete_slug()));
