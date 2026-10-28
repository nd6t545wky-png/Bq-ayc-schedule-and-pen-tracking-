-- Players change their own age group and type (pitcher, position player, two-way) in the Account tab.
-- Returns 'ok' | 'bad_age' | 'bad_type' | 'not_a_player'.
create or replace function public.set_my_profile(p_age text, p_type text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare v_slug text := public.my_athlete_slug();
begin
  if v_slug is null then return 'not_a_player'; end if;
  if p_age is null or p_age not in ('U16','U18','AYWC','AWC') then return 'bad_age'; end if;
  if p_type is null or p_type not in ('P','POS','TWO') then return 'bad_type'; end if;
  update public.athletes
    set data = data || jsonb_build_object('age', p_age, 'type', p_type, 'updatedAt', (extract(epoch from now()) * 1000)::bigint)
    where id = v_slug;
  return case when found then 'ok' else 'not_a_player' end;
end;
$$;
revoke all on function public.set_my_profile(text, text) from public, anon;
grant execute on function public.set_my_profile(text, text) to authenticated;
