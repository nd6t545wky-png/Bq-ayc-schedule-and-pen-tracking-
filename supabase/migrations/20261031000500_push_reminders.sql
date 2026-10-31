-- Push reminders for players: arm check-in every day at 7:30am, and on game days a 3pm reminder to log
-- the game (only if it isn't logged yet). Phones subscribe from Account; the app sends each player's game
-- days for the week (it already knows them from the schedule). The VAPID keys and the cron secret live in
-- Vault (vapid_public, vapid_private, push_cron_secret) and are added outside migrations.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.push_subs (
  endpoint text primary key,
  user_id uuid not null,
  athlete_slug text not null,
  sub jsonb not null,
  game_days text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;   -- no policies: only the functions below touch it

create or replace function public.save_push_sub(p_sub jsonb)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare v_slug text := public.my_athlete_slug();
begin
  if v_slug is null then return 'not_a_player'; end if;
  if p_sub->>'endpoint' is null or left(p_sub->>'endpoint', 8) <> 'https://' then return 'bad_sub'; end if;
  insert into public.push_subs (endpoint, user_id, athlete_slug, sub)
    values (p_sub->>'endpoint', auth.uid(), v_slug, p_sub)
    on conflict (endpoint) do update set user_id = excluded.user_id, athlete_slug = excluded.athlete_slug, sub = excluded.sub;
  return 'ok';
end $$;

create or replace function public.delete_push_sub(p_endpoint text)
returns text language sql volatile security definer set search_path = '' as $$
  delete from public.push_subs where endpoint = p_endpoint and user_id = auth.uid(); select 'ok';
$$;

create or replace function public.set_my_game_days(p_days text[])
returns text language sql volatile security definer set search_path = '' as $$
  update public.push_subs set game_days = coalesce(p_days, '{}') where user_id = auth.uid(); select 'ok';
$$;

revoke all on function public.save_push_sub(jsonb), public.delete_push_sub(text), public.set_my_game_days(text[]) from public, anon;
grant execute on function public.save_push_sub(jsonb), public.delete_push_sub(text), public.set_my_game_days(text[]) to authenticated;

-- For the push-reminders edge function only (service role): the keys, and who to remind.
create or replace function public.push_config()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_object_agg(name, decrypted_secret) from vault.decrypted_secrets
  where name in ('vapid_public', 'vapid_private', 'push_cron_secret');
$$;

create or replace function public.push_due(p_kind text)
returns table (endpoint text, sub jsonb) language sql stable security definer set search_path = '' as $$
  with today as (select (now() at time zone 'Australia/Brisbane')::date as d)
  select s.endpoint, s.sub from public.push_subs s, today
  where p_kind = 'arm'
     or (p_kind = 'game' and today.d::text = any(s.game_days)
         and not exists (select 1 from public.games g where g.athlete_slug = s.athlete_slug and g.day = today.d
                          and (g.data ? 'pitches' or g.data ? 'ip' or g.data->>'pitched' = 'true'))
         and not exists (select 1 from public.hitting h where h.athlete_slug = s.athlete_slug and h.day = today.d
                          and jsonb_array_length(coalesce(h.data->'pas', '[]')) > 0));
$$;

create or replace function public.drop_push_sub(p_endpoint text)
returns void language sql volatile security definer set search_path = '' as $$
  delete from public.push_subs where endpoint = p_endpoint;
$$;

revoke all on function public.push_config(), public.push_due(text), public.drop_push_sub(text) from public, anon, authenticated;
grant execute on function public.push_config(), public.push_due(text), public.drop_push_sub(text) to service_role;

-- 7:30am and 3pm Brisbane (UTC+10, no daylight saving) = 21:30 and 05:00 UTC
create or replace function public.push_kick(p_kind text)
returns void language sql volatile security definer set search_path = '' as $$
  select net.http_post(
    url := 'https://icczlruovqfhqllnkohh.supabase.co/functions/v1/push-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')),
    body := jsonb_build_object('kind', p_kind));
$$;
revoke all on function public.push_kick(text) from public, anon, authenticated;

select cron.schedule('push-arm-checkin', '30 21 * * *', $$select public.push_kick('arm')$$);
select cron.schedule('push-game-log', '0 5 * * *', $$select public.push_kick('game')$$);
