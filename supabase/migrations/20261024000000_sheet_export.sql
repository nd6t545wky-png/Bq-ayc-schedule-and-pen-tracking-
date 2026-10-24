-- Live Google Sheets export: one spreadsheet per age group, refreshed by a script in the owner's
-- Google account (docs/sheets-sync.gs). The script holds a secret export key; only its hash is
-- stored here. The owner makes (or replaces) the key in the app.
--
-- The layout of every tab lives in sheet_group() below, so when the app changes, this is the
-- one place to update. Fields it doesn't know about still come through as extra columns.
-- No email addresses are ever exported.

create table public.sheet_keys (
  id int primary key default 1 check (id = 1),
  key_hash text not null,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
alter table public.sheet_keys enable row level security;
revoke all on public.sheet_keys from anon, authenticated;

-- Owner only: make a new export key (the old one stops working). Shown once, never stored in plain text.
create or replace function public.new_sheet_key()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare v_key text;
begin
  if not public.is_owner() then raise exception 'not_allowed'; end if;
  v_key := 'bqx_' || translate(encode(extensions.gen_random_bytes(24), 'base64'), '+/=', '-_');
  insert into public.sheet_keys (id, key_hash, created_at, created_by)
    values (1, encode(extensions.digest(v_key, 'sha256'), 'hex'), now(), auth.uid())
    on conflict (id) do update set key_hash = excluded.key_hash, created_at = excluded.created_at, created_by = excluded.created_by;
  return v_key;
end;
$$;
revoke all on function public.new_sheet_key() from public, anon;
grant execute on function public.new_sheet_key() to authenticated;

-- helpers
create or replace function public.sheet_num(t text)
returns numeric language sql immutable set search_path = ''
as $$ select case when t ~ '^-?\d+(\.\d+)?$' then t::numeric end; $$;
create or replace function public.sheet_yn(t text)
returns text language sql immutable set search_path = ''
as $$ select case t when 'true' then 'Yes' when 'false' then 'No' end; $$;
-- innings "4.2" -> 14 outs
create or replace function public.sheet_outs(ip text)
returns int language sql immutable set search_path = ''
as $$ select case when ip ~ '^\d+(\.[012])?$' then split_part(ip, '.', 1)::int * 3 + coalesce(nullif(split_part(ip, '.', 2), '')::int, 0) end; $$;
-- strike-zone cells as the app draws them (pitcher's view)
create or replace function public.sheet_zone(z text)
returns text language sql immutable set search_path = ''
as $$ select case z
  when '1' then 'Up, left' when '2' then 'Up, middle' when '3' then 'Up, right'
  when '4' then 'Middle, left' when '5' then 'Middle' when '6' then 'Middle, right'
  when '7' then 'Down, left' when '8' then 'Down, middle' when '9' then 'Down, right'
  when '11' then 'Chase up-left' when '12' then 'Chase up-right' when '13' then 'Chase down-left' when '14' then 'Chase down-right'
  when '0' then 'Wild' else z end; $$;
-- at-bat result codes (matches HRES in the app): label, AB, H, total bases, BB, HBP, K, SF
create or replace function public.sheet_res(code text)
returns table (label text, ab int, h int, tb int, bb int, hbp int, k int, sf int)
language sql immutable set search_path = ''
as $$ select v.label, v.ab, v.h, v.tb, v.bb, v.hbp, v.k, v.sf from (values
  ('1B','Single',1,1,1,0,0,0,0), ('2B','Double',1,1,2,0,0,0,0), ('3B','Triple',1,1,3,0,0,0,0), ('HR','Home run',1,1,4,0,0,0,0),
  ('BB','Walk',0,0,0,1,0,0,0), ('HBP','Hit by pitch',0,0,0,0,1,0,0), ('ROE','Reached on error',1,0,0,0,0,0,0), ('FC','Fielder''s choice',1,0,0,0,0,0,0),
  ('KS','K swinging',1,0,0,0,0,1,0), ('KL','K looking',1,0,0,0,0,1,0), ('GO','Ground out',1,0,0,0,0,0,0), ('FO','Fly out',1,0,0,0,0,0,0),
  ('LO','Line out',1,0,0,0,0,0,0), ('PO','Pop out',1,0,0,0,0,0,0), ('SF','Sac fly',0,0,0,0,0,0,1), ('SH','Sac bunt',0,0,0,0,0,0,0)
) v(code, label, ab, h, tb, bb, hbp, k, sf) where v.code = sheet_res.code; $$;

-- Every tab for one age group: {name, cols: [[key, label], ...], rows: [{key: value}, ...]}.
-- Rows are sorted by player name (A to Z), then newest first.
create or replace function public.sheet_group(p_age text)
returns jsonb
language sql
stable
set search_path = ''
as $$
with ath as (
  select a.id, coalesce(nullif(a.data->>'name', ''), a.id) as name, a.data
  from public.athletes a where a.data->>'age' = p_age
),
pens as (
  select p.data, ath.name from public.pens p join ath on ath.id = p.athlete_slug
),
games as (
  select g.data, g.day, ath.name from public.games g join ath on ath.id = g.athlete_slug
),
hits as (
  select h.data, h.day, ath.name from public.hitting h join ath on ath.id = h.athlete_slug
),
abs as (
  select hits.name, hits.day, hits.data->>'opp' as opp, x, i, r.*
  from hits, jsonb_array_elements(coalesce(hits.data->'pas', '[]')) with ordinality e(x, i)
  left join lateral public.sheet_res(x->>'res') r on true
)
select jsonb_build_array(
  jsonb_build_object('name', 'Players',
    'cols', '[["athlete","Player"],["age","Age group"],["type","Type"],["hand","Throws"],["mix","Pitch mix"],["joined","Joined"],["account","Has an account"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(r->>'athlete'), r->>'athlete') from (
      select jsonb_strip_nulls((ath.data - array['name','age','type','hand','mix','updatedAt']) || jsonb_build_object(
        'athlete', ath.name, 'age', p_age,
        'type', case ath.data->>'type' when 'P' then 'Pitcher' when 'POS' then 'Position' when 'TWO' then 'Two-way' end,
        'hand', case ath.data->>'hand' when 'L' then 'LHP' when 'R' then 'RHP' end,
        'mix', ath.data->'mix',
        'joined', to_char((pl.added_at at time zone 'Australia/Brisbane')::date, 'YYYY-MM-DD'),
        'account', case when pl.athlete_slug is null then 'No' else 'Yes' end)) r
      from ath left join public.players pl on pl.athlete_slug = ath.id) s), '[]')),

  jsonb_build_object('name', 'Season',
    'cols', '[["athlete","Player"],["pens","Bullpens"],["penStrikePct","Avg pen strike %"],["games","Games pitched"],["ip","IP"],["pitches","Pitches"],["strikePct","Game strike %"],["k","K"],["bb","BB"],["h","H allowed"],["er","ER"],["whip","WHIP"],["pa","PA"],["ab","AB"],["hits","Hits"],["avg","AVG"],["obp","OBP"],["slg","SLG"],["ops","OPS"],["hk","Hitting K"],["hbb","Hitting BB"],["rbi","RBI"],["lastArm","Last arm check"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(r->>'athlete'), r->>'athlete') from (
      select jsonb_strip_nulls(jsonb_build_object('athlete', ath.name)
        || coalesce((select jsonb_build_object('pens', count(*),
             'penStrikePct', round(avg(public.sheet_num(pens.data->'summary'->>'strikePct')))) from pens where pens.name = ath.name having count(*) > 0), '{}')
        || coalesce((select jsonb_build_object('games', count(*),
             'ip', (sum(public.sheet_outs(g.data->>'ip')) / 3)::text || '.' || (sum(public.sheet_outs(g.data->>'ip')) % 3)::text,
             'pitches', sum(public.sheet_num(g.data->>'pitches')),
             'strikePct', round(100 * sum(public.sheet_num(g.data->>'strikes')) / nullif(sum(public.sheet_num(g.data->>'pitches')) filter (where g.data ? 'strikes'), 0)),
             'k', sum(public.sheet_num(g.data->>'k')), 'bb', sum(public.sheet_num(g.data->>'bb')),
             'h', sum(public.sheet_num(g.data->>'h')), 'er', sum(public.sheet_num(g.data->>'er')),
             'whip', round(3 * (coalesce(sum(public.sheet_num(g.data->>'bb')), 0) + coalesce(sum(public.sheet_num(g.data->>'h')), 0)) / nullif(sum(public.sheet_outs(g.data->>'ip')), 0), 2))
           from games g where g.name = ath.name and coalesce(g.data->>'pitched', 'true') <> 'false' having count(*) > 0), '{}')
        || coalesce((select jsonb_build_object('pa', count(*), 'ab', sum(ab), 'hits', sum(h),
             'avg', round(sum(h)::numeric / nullif(sum(ab), 0), 3),
             'obp', round((sum(h) + sum(bb) + sum(hbp))::numeric / nullif(sum(ab) + sum(bb) + sum(hbp) + sum(sf), 0), 3),
             'slg', round(sum(tb)::numeric / nullif(sum(ab), 0), 3),
             'ops', round(coalesce((sum(h) + sum(bb) + sum(hbp))::numeric / nullif(sum(ab) + sum(bb) + sum(hbp) + sum(sf), 0), 0) + coalesce(sum(tb)::numeric / nullif(sum(ab), 0), 0), 3),
             'hk', sum(k), 'hbb', sum(bb), 'rbi', sum(public.sheet_num(x->>'rbi')))
           from abs where abs.name = ath.name having count(*) > 0), '{}')
        || coalesce((select jsonb_build_object('lastArm', to_char(c.day, 'DD Mon') || ': ' || coalesce(c.data->>'before', '–') || ' → ' || coalesce(c.data->>'after', '–'))
           from public.checkins c where c.athlete_slug = ath.id order by c.day desc limit 1), '{}')) r
      from ath) s), '[]')),

  jsonb_build_object('name', 'Arm check-ins',
    'cols', '[["athlete","Player"],["date","Date"],["before","Before (1-10)"],["after","After (1-10)"],["change","Change"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(r->>'athlete'), r->>'athlete', r->>'date' desc) from (
      select jsonb_strip_nulls((c.data - array['id','athlete','date','updatedAt']) || jsonb_build_object(
        'athlete', ath.name, 'date', c.day::text,
        'change', public.sheet_num(c.data->>'after') - public.sheet_num(c.data->>'before'))) r
      from public.checkins c join ath on ath.id = c.athlete_slug) s), '[]')),

  jsonb_build_object('name', 'Bullpens',
    'cols', '[["athlete","Player"],["date","Date"],["pen","Pen"],["status","Status"],["pitches","Pitches"],["strikePct","Strike %"],["hitZonePct","Hit zone %"],["points","Points"],["maxPoints","Max points"],["offspeedPct","Offspeed %"],["gatePct","Through gate %"],["shapePct","Shape match %"],["hittersWon","Hitters won"],["targetMet","Target met"],["target","Target"],["hand","Throws"],["mix","Pitch mix"],["design","Design pitch"],["armBefore","Arm before"],["armAfter","Arm after"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(r->>'athlete'), r->>'athlete', r->>'date' desc, (r->>'_t') desc) from (
      select jsonb_strip_nulls((pens.data - array['id','athlete','age','date','penName','penKey','mode','fw','lvl','pitches','hitters','createdAt','updatedAt','summary','hand','status'])
        || coalesce(pens.data->'summary', '{}') || jsonb_build_object(
        'athlete', pens.name, 'date', pens.data->>'date', 'pen', pens.data->>'penName', '_t', pens.data->>'createdAt',
        'status', case pens.data->>'status' when 'live' then 'In progress' when 'done' then 'Finished' else pens.data->>'status' end,
        'hand', case pens.data->>'hand' when 'L' then 'LHP' when 'R' then 'RHP' end)) r
      from pens) s), '[]')),

  jsonb_build_object('name', 'Pitches',
    'cols', '[["athlete","Player"],["date","Date"],["pen","Pen"],["n","#"],["pitch","Pitch"],["intended","Target"],["actual","Location"],["strike","Strike"],["pts","Points"],["swung","Swing"],["hitter","Hitter"],["count","Count"],["event","Event"],["gate","Through gate"],["shape","Shape match"],["stretch","Stretch"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(r->>'athlete'), r->>'athlete', r->>'date' desc, (r->>'_t') desc, (r->>'n')::int) from (
      select jsonb_strip_nulls((x - array['n','p','intended','actual','strike','swung','gate','shape','set','design','grp','side']) || jsonb_build_object(
        'athlete', pens.name, 'date', pens.data->>'date', 'pen', pens.data->>'penName', '_t', pens.data->>'createdAt',
        'n', coalesce(public.sheet_num(x->>'n'), i), 'pitch', x->>'p',
        'intended', public.sheet_zone(x->>'intended'), 'actual', public.sheet_zone(x->>'actual'),
        'strike', public.sheet_yn(x->>'strike'), 'swung', public.sheet_yn(x->>'swung'),
        'gate', public.sheet_yn(x->>'gate'), 'shape', public.sheet_yn(x->>'shape'),
        'stretch', case when x->>'set' = 'S' then 'Yes' end)) r
      from pens, jsonb_array_elements(coalesce(pens.data->'pitches', '[]')) with ordinality e(x, i)) s), '[]')),

  jsonb_build_object('name', 'Games',
    'cols', '[["athlete","Player"],["date","Date"],["opp","Opponent"],["pitched","Pitched"],["ip","IP"],["bf","Batters faced"],["pitches","Pitches"],["strikes","Strikes"],["balls","Balls"],["strikePct","Strike %"],["fps","1st-pitch strikes"],["fpsPct","1st-pitch strike %"],["k","K"],["bb","BB"],["hbp","HBP"],["h","H"],["r","R"],["er","ER"],["hr","HR"],["wp","WP"],["whip","WHIP"],["pitchesPerInning","Pitches / inning"],["restDays","Rest days"],["overMax","Over daily max"],["notes","Notes"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(r->>'athlete'), r->>'athlete', r->>'date' desc) from (
      select jsonb_strip_nulls((g.data - array['id','athlete','date','updatedAt','summary','pitched']) || coalesce(g.data->'summary', '{}') || jsonb_build_object(
        'athlete', g.name, 'date', g.day::text, 'pitched', public.sheet_yn(g.data->>'pitched'))) r
      from games g) s), '[]')),

  jsonb_build_object('name', 'Hitting games',
    'cols', '[["athlete","Player"],["date","Date"],["opp","Opponent"],["line","Line"],["pa","PA"],["ab","AB"],["h","H"],["doubles","2B"],["triples","3B"],["hr","HR"],["bb","BB"],["hbp","HBP"],["k","K"],["rbi","RBI"],["avg","AVG"],["obp","OBP"],["slg","SLG"],["hardPct","Hard-hit %"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(r->>'athlete'), r->>'athlete', r->>'date' desc) from (
      select jsonb_strip_nulls((h.data - array['id','athlete','date','updatedAt','summary','pas']) || coalesce(h.data->'summary', '{}') || jsonb_build_object(
        'athlete', h.name, 'date', h.day::text)) r
      from hits h) s), '[]')),

  jsonb_build_object('name', 'At-bats',
    'cols', '[["athlete","Player"],["date","Date"],["opp","Opponent"],["n","#"],["result","Result"],["count","Count"],["contact","Contact"],["spray","Spray zone"],["rbi","RBI"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(r->>'athlete'), r->>'athlete', r->>'date' desc, (r->>'n')::int) from (
      select jsonb_strip_nulls((x - array['b','s','res','qual','x','y','zone','rbi']) || jsonb_build_object(
        'athlete', abs.name, 'date', abs.day::text, 'opp', abs.opp, 'n', i,
        'result', coalesce(abs.label, x->>'res'),
        'count', case when x ? 'b' then (x->>'b') || '-' || (x->>'s') end,
        'contact', case x->>'qual' when 'H' then 'Hard' when 'M' then 'Medium' when 'W' then 'Weak' end,
        'spray', x->>'zone', 'rbi', public.sheet_num(x->>'rbi'))) r
      from abs) s), '[]'))
);
$$;
revoke all on function public.sheet_group(text) from public, anon, authenticated;

-- What the sheet script calls. Returns null for a wrong key.
create or replace function public.sheet_export(p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_key is null or not exists (
    select 1 from public.sheet_keys k where k.key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex')
  ) then return null; end if;
  return jsonb_build_object(
    'generated_at', now(),
    'groups', jsonb_build_object(
      'U16', public.sheet_group('U16'), 'U18', public.sheet_group('U18'),
      'AYWC', public.sheet_group('AYWC'), 'AWC', public.sheet_group('AWC')));
end;
$$;
revoke all on function public.sheet_export(text) from public;
grant execute on function public.sheet_export(text) to anon, authenticated;
