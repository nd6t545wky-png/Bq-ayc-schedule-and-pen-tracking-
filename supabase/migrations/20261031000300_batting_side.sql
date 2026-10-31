-- Batting side (R / L / S): coaches set it on the Hitting tab; players set their own in Account.
create or replace function public.set_my_bats(p_bats text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare v_slug text := public.my_athlete_slug();
begin
  if v_slug is null then return 'not_a_player'; end if;
  if p_bats is null or p_bats not in ('R','L','S') then return 'bad_bats'; end if;
  update public.athletes
    set data = data || jsonb_build_object('bats', p_bats, 'updatedAt', (extract(epoch from now()) * 1000)::bigint)
    where id = v_slug;
  return case when found then 'ok' else 'not_a_player' end;
end;
$$;
revoke all on function public.set_my_bats(text) from public, anon;
grant execute on function public.set_my_bats(text) to authenticated;

-- Players tab: Bats column
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
    'cols', '[["athlete","Player"],["age","Age group"],["type","Type"],["hand","Throws"],["mix","Pitch mix"],["bats","Bats"],["joined","Joined"],["account","Has an account"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(regexp_replace(btrim(r->>'athlete'), '^.*\s', '')), lower(r->>'athlete')) from (
      select jsonb_strip_nulls((ath.data - array['name','age','type','hand','mix','bats','updatedAt']) || jsonb_build_object(
        'athlete', ath.name, 'age', p_age,
        'type', case ath.data->>'type' when 'P' then 'Pitcher' when 'POS' then 'Position' when 'TWO' then 'Two-way' end,
        'hand', case ath.data->>'hand' when 'L' then 'LHP' when 'R' then 'RHP' end,
        'mix', ath.data->'mix',
        'bats', case ath.data->>'bats' when 'R' then 'Right' when 'L' then 'Left' when 'S' then 'Switch' end,
        'joined', to_char((pl.added_at at time zone 'Australia/Brisbane')::date, 'YYYY-MM-DD'),
        'account', case when pl.athlete_slug is null then 'No' else 'Yes' end)) r
      from ath left join public.players pl on pl.athlete_slug = ath.id) s), '[]')),

  jsonb_build_object('name', 'Season',
    'cols', '[["athlete","Player"],["pens","Bullpens"],["penStrikePct","Avg pen strike %"],["games","Games pitched"],["ip","IP"],["pitches","Pitches"],["strikePct","Game strike %"],["k","K"],["bb","BB"],["h","H allowed"],["er","ER"],["whip","WHIP"],["pa","PA"],["ab","AB"],["hits","Hits"],["avg","AVG"],["obp","OBP"],["slg","SLG"],["ops","OPS"],["hk","Hitting K"],["hbb","Hitting BB"],["rbi","RBI"],["lastArm","Last arm check"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(regexp_replace(btrim(r->>'athlete'), '^.*\s', '')), lower(r->>'athlete')) from (
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
    'rows', coalesce((select jsonb_agg(r order by lower(regexp_replace(btrim(r->>'athlete'), '^.*\s', '')), lower(r->>'athlete'), r->>'date' desc) from (
      select jsonb_strip_nulls((c.data - array['id','athlete','date','updatedAt','sprint']) || jsonb_build_object(
        'athlete', ath.name, 'date', c.day::text,
        'change', public.sheet_num(c.data->>'after') - public.sheet_num(c.data->>'before'))) r
      from public.checkins c join ath on ath.id = c.athlete_slug) s), '[]')),

  jsonb_build_object('name', 'Bullpens',
    'cols', '[["athlete","Player"],["date","Date"],["pen","Pen"],["status","Status"],["pitches","Pitches"],["strikePct","Strike %"],["hitZonePct","Hit zone %"],["points","Points"],["maxPoints","Max points"],["offspeedPct","Offspeed %"],["gatePct","Through gate %"],["shapePct","Shape match %"],["hittersWon","Hitters won"],["targetMet","Target met"],["target","Target"],["hand","Throws"],["mix","Pitch mix"],["design","Design pitch"],["topVelo","Top velo (mph)"],["velo","Velo by pitch (top / sat mph)"],["fbVelo","Avg fastball velo (mph)"],["armBefore","Arm before"],["armAfter","Arm after"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(regexp_replace(btrim(r->>'athlete'), '^.*\s', '')), lower(r->>'athlete'), r->>'date' desc, (r->>'_t') desc) from (
      select jsonb_strip_nulls((pens.data - array['id','athlete','age','date','penName','penKey','mode','fw','lvl','pitches','hitters','createdAt','updatedAt','summary','hand','status'])
        || coalesce(pens.data->'summary', '{}') || jsonb_build_object(
        'athlete', pens.name, 'date', pens.data->>'date', 'pen', pens.data->>'penName', '_t', pens.data->>'createdAt',
        'status', case pens.data->>'status' when 'live' then 'In progress' when 'done' then 'Finished' else pens.data->>'status' end,
        'hand', case pens.data->>'hand' when 'L' then 'LHP' when 'R' then 'RHP' end)) r
      from pens) s), '[]')),

  jsonb_build_object('name', 'Games',
    'cols', '[["athlete","Player"],["date","Date"],["opp","Opponent"],["pitched","Pitched"],["ip","IP"],["bf","Batters faced"],["pitches","Pitches"],["strikes","Strikes"],["balls","Balls"],["strikePct","Strike %"],["fps","1st-pitch strikes"],["fpsPct","1st-pitch strike %"],["c11","1-1 counts"],["c11w","1-1 counts won"],["c11Pct","1-1 win %"],["k","K"],["bb","BB"],["hbp","HBP"],["h","H"],["r","R"],["er","ER"],["hr","HR"],["wp","WP"],["topVelo","Top velo (mph)"],["whip","WHIP"],["pitchesPerInning","Pitches / inning"],["restDays","Rest days"],["overMax","Over daily max"],["notes","Notes"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(regexp_replace(btrim(r->>'athlete'), '^.*\s', '')), lower(r->>'athlete'), r->>'date' desc) from (
      select jsonb_strip_nulls((g.data - array['id','athlete','date','updatedAt','summary','pitched']) || coalesce(g.data->'summary', '{}') || jsonb_build_object(
        'athlete', g.name, 'date', g.day::text, 'pitched', public.sheet_yn(g.data->>'pitched'))) r
      from games g) s), '[]')),

  jsonb_build_object('name', 'Hitting games',
    'cols', '[["athlete","Player"],["date","Date"],["opp","Opponent"],["line","Line"],["pa","PA"],["ab","AB"],["h","H"],["doubles","2B"],["triples","3B"],["hr","HR"],["bb","BB"],["hbp","HBP"],["k","K"],["rbi","RBI"],["bunts","Bunts"],["r3Scored","Runners scored from 3rd"],["qab","QAB"],["qabPct","QAB %"],["avg","AVG"],["obp","OBP"],["slg","SLG"],["hardPct","Hard-hit %"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(regexp_replace(btrim(r->>'athlete'), '^.*\s', '')), lower(r->>'athlete'), r->>'date' desc) from (
      select jsonb_strip_nulls((h.data - array['id','athlete','date','updatedAt','summary','pas']) || coalesce(h.data->'summary', '{}') || jsonb_build_object(
        'athlete', h.name, 'date', h.day::text)) r
      from hits h) s), '[]')),

  jsonb_build_object('name', 'At-bats',
    'cols', '[["athlete","Player"],["date","Date"],["opp","Opponent"],["n","#"],["result","Result"],["qab","QAB"],["hardHit","Hard hit"],["contact","Contact"],["r3","Scored runner from 3rd"],["adv","Moved the runner"],["hnr","Hit and run"],["p7","7+ pitches"],["two","Battled with 2 strikes"],["spray","Spray zone"],["rbi","RBI"]]'::jsonb,
    'rows', coalesce((select jsonb_agg(r order by lower(regexp_replace(btrim(r->>'athlete'), '^.*\s', '')), lower(r->>'athlete'), r->>'date' desc, (r->>'n')::int) from (
      select jsonb_strip_nulls((x - array['b','s','res','qual','hh','r3','adv','hnr','p7','two','x','y','zone','rbi']) || jsonb_build_object(
        'athlete', abs.name, 'date', abs.day::text, 'opp', abs.opp, 'n', i,
        'result', coalesce(abs.label, x->>'res'),
        'contact', case x->>'qual' when 'H' then 'Hard' when 'M' then 'Medium' when 'W' then 'Weak' end,
        'hardHit', case x->>'hh' when '1' then 'Yes' when '0' then 'No' end,
        'r3', case when x->>'r3' = '1' then 'Yes' end,
        'adv', case when x->>'adv' = '1' then 'Yes' end, 'hnr', case when x->>'hnr' = '1' then 'Yes' end,
        'p7', case when x->>'p7' = '1' then 'Yes' end, 'two', case when x->>'two' = '1' then 'Yes' end,
        -- same rule as the app (qabWhy): a hit, walk, HBP, sacrifice, hard hit, RBI or any situation / QAB tap
        'qab', case when coalesce(abs.h, 0) + coalesce(abs.bb, 0) + coalesce(abs.hbp, 0) + coalesce(abs.sf, 0) > 0
          or x->>'res' = 'SH' or x->>'hh' = '1' or (x->>'hh' is null and x->>'qual' = 'H')
          or coalesce(public.sheet_num(x->>'rbi'), 0) > 0
          or '1' in (x->>'r3', x->>'adv', x->>'hnr', x->>'p7', x->>'two') then 'Yes' else 'No' end,
        'spray', x->>'zone', 'rbi', public.sheet_num(x->>'rbi'))) r
      from abs) s), '[]'))
);
$$;
