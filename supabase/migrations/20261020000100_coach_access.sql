-- A coach only gets access once they have proved they own the email address,
-- whatever the project's "Confirm email" setting is.
create or replace function public.is_coach()
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
  );
$$;
revoke all on function public.is_coach() from public, anon;
grant execute on function public.is_coach() to authenticated;

create policy "coaches manage pens" on public.pens
  for all to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));

create policy "coaches manage athletes" on public.athletes
  for all to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));
