// Imports game logs from Ballclubz (public league pages) for athletes found there by name.
// Called by pg_cron (public.bz_kick) with the cron secret, or by a signed-in coach ("Sync now").
//   1. League player list (ballclubz.com/<league>/teams): surname, first name and player id.
//   2. Each athlete whose full name matches exactly one Ballclubz player: their player page,
//      "Batting Game Log" and "Pitching Game Log" tables.
//   3. Pitching lines go into games, batting lines into hitting (as at-bats built from the totals).
//      Anything typed in the app is never overwritten: a game or hitting day logged by hand is left alone
//      (pitching: only empty fields are filled in).
//   4. Each pitching game's box score (box.ts) adds strikes, batters faced, first-pitch strikes, 1-1 counts and
//      how many were won, getting to 2 strikes first, and pitches thrown with 2 strikes.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { gameFor, liveGameFileUrl, parseScheduleGames, pitchingFromGameFile, playerTeam, type ScheduleGame } from "./box.ts";

const LEAGUES = ["gbld1"];   // Baseball Queensland leagues on Ballclubz (GBL D1)
const BASE = "https://www.ballclubz.com";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const txt = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/\s+/g, " ").trim();
const num = (s: string | undefined) => { const n = parseFloat(s ?? ""); return Number.isFinite(n) ? n : 0; };

async function get(path: string): Promise<string> {
  const r = await fetch(path.startsWith("https://") ? path : BASE + path, {headers: {"User-Agent": "BQ-Weekly-sync"}});
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  const t = await r.text();
  if (t.length > 2_000_000) throw new Error(`${path}: too big`);
  return t;
}

// "GBL D1 2026-27" -> [2026, 2027]
function seasonYears(html: string): [number, number] {
  const m = html.match(/<h1>[^<]*?(20\d\d)-(\d\d)/);
  if (m) return [+m[1], 2000 + +m[2]];
  const y = new Date().getFullYear(); return [y, y + 1];
}
// "Fri 10/02 7:00pm" -> 2026-10-02 (July onwards is the season's first year)
function isoDate(s: string, [y1, y2]: [number, number]): string | null {
  const m = s.match(/(\d{1,2})\/(\d{1,2})/); if (!m) return null;
  const mo = +m[1], d = +m[2], y = mo >= 7 ? y1 : y2;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
// the table after a heading: header names -> rows of {HEADER: text}
function table(html: string, heading: string): Record<string, string>[] {
  const at = html.indexOf(heading); if (at < 0) return [];
  const end = html.indexOf("</table>", at); const t = html.slice(at, end < 0 ? undefined : end);
  const heads = [...t.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => txt(m[1]).toUpperCase());
  const body = (t.split(/<tbody>/)[1] || "").split(/<tfoot>/)[0];
  return [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(r => {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => txt(m[1]));
    return Object.fromEntries(heads.map((h, i) => [h, cells[i] ?? ""]));
  }).filter(r => r.DATE && /\d+\/\d+/.test(r.DATE));
}
const opp = (team: string) => team.replace(/^(@|vs\.?)\s*/i, "").trim() || null;
// innings "1.2" (outs) add up properly
const ipToOuts = (ip: string) => { const [w, f] = String(ip).split("."); return num(w) * 3 + Math.min(2, num(f)); };
const outsToIp = (o: number) => `${Math.floor(o / 3)}.${o % 3}`;

Deno.serve(async (req) => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // who may run it: pg_cron with the secret, or a signed-in coach
  const { data: cfg } = await db.rpc("push_config");
  let ok = !!cfg && req.headers.get("x-cron-secret") === cfg.push_cron_secret;
  if (!ok && req.headers.get("Authorization")) {
    const user = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {global: {headers: {Authorization: req.headers.get("Authorization")!}}});
    const { data } = await user.rpc("is_coach"); ok = data === true;
  }
  const cors = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Content-Type": "application/json"};
  if (req.method === "OPTIONS") return new Response("ok", {headers: cors});
  if (!ok) return new Response(JSON.stringify({error: "not allowed"}), {status: 401, headers: cors});

  const { dry } = await req.json().catch(() => ({}));   // dry: report what would be imported, write nothing
  const { data: aths, error } = await db.from("athletes").select("id,data");
  if (error) return new Response(JSON.stringify({error: error.message}), {status: 500, headers: cors});
  const report: Record<string, unknown>[] = [];

  for (const league of LEAGUES) {
    let listHtml: string;
    try { listHtml = await get(`/${league}/teams`); } catch (e) { report.push({league, error: String(e)}); continue; }
    const years = seasonYears(listHtml);
    // box scores: the schedule once per run, and each game's file once however many of our pitchers threw in it
    let schedule: ScheduleGame[] | null = null;
    const files = new Map<string, unknown>();
    const boxLine = async (date: string, team: string | null, opp: string | null, who: string) => {
      if (!team || !opp) return null;
      try {
        schedule = schedule ?? parseScheduleGames(await get(`/${league}/schedule`));
        const game = gameFor(schedule, date, team, opp); if (!game) return null;
        if (!files.has(game.path)) {
          const url = liveGameFileUrl(await get(game.path));
          files.set(game.path, url && url.startsWith("https://game.ballclubz.com/") ? JSON.parse(await get(url)) : null);
        }
        return pitchingFromGameFile(files.get(game.path), who);
      } catch (_e) { return null; }
    };
    const players = [...listHtml.matchAll(/<a href="\/[^"\/]+\/teams\/[^"\/]*\/(\d+)">([^<]+)<\/a><\/td><td[^>]*>([^<]*)<\/td>/g)]
      .map(m => ({id: m[1], last: txt(m[2]), first: txt(m[3])}));
    const byName = new Map<string, Set<string>>();
    for (const p of players) { const k = norm(p.first + p.last); (byName.get(k) ?? byName.set(k, new Set()).get(k)!).add(p.id); }

    for (const a of aths || []) {
      const name: string = a.data?.name || a.id, s = a.id;
      const ids = [...(byName.get(norm(name)) ?? [])];
      // a club name on the athlete (data.bzClub) is not needed until two Ballclubz players share a name
      const status = ids.length === 1 ? "linked" : ids.length ? "ambiguous" : "not_found";
      const prev = (await db.from("ballclubz_links").select("league,status").eq("athlete_slug", s).maybeSingle()).data;
      if (status !== "linked") {
        // keep a link found in another league
        if (!dry && (!prev || prev.league === league)) await db.from("ballclubz_links").upsert({athlete_slug: s, league, player_id: null, status, synced_at: new Date().toISOString()});
        if (status === "ambiguous") report.push({athlete: name, status, league});
        continue;
      }
      const pid = ids[0];
      let html: string;
      try { html = await get(`/${league}/teams//${pid}`); } catch (e) { report.push({athlete: name, error: String(e)}); continue; }
      const bzName = txt((html.match(/<h\d[^>]*>([^<]+)<\/h\d>\s*(?:<[^>]+>\s*)*AVG\/OBP\/SLG/) || [, ""])[1] as string) || name;
      const team = playerTeam(html);
      let gamesSaved = 0, hitsSaved = 0, boxes = 0;

      // ---- pitching: one game per day (a doubleheader's lines are added together)
      const pit = new Map<string, {outs: number; h: number; r: number; er: number; k: number; bb: number; hbp: number; pitches: number; opp: string | null}>();
      for (const row of table(html, "Pitching Game Log")) {
        const d = isoDate(row.DATE, years); if (!d) continue;
        const g = pit.get(d) ?? {outs: 0, h: 0, r: 0, er: 0, k: 0, bb: 0, hbp: 0, pitches: 0, opp: opp(row.TEAM)};
        g.outs += ipToOuts(row.IP); g.h += num(row.H); g.r += num(row.R); g.er += num(row.ER); g.k += num(row.K ?? row.SO);
        g.bb += num(row.BB); g.hbp += num(row.HBP); g.pitches += num(row.PIT ?? row.NP); pit.set(d, g);
      }
      for (const [d, g] of pit) {
        const id = `${s}_${d}`;
        const cur = (await db.from("games").select("data").eq("id", id).maybeSingle()).data?.data;
        const stats: Record<string, unknown> = {ip: outsToIp(g.outs), h: g.h, r: g.r, er: g.er, k: g.k, bb: g.bb, hbp: g.hbp, pitches: g.pitches || null};
        // the box score, read once per game (box: 1 marks it done)
        let box = cur?.box ? 1 : 0;
        if (!box) {
          const b = await boxLine(d, team, g.opp, bzName);
          if (b) { Object.assign(stats, {pitches: b.pitches, strikes: b.strikes, bf: b.bf, fps: b.fps, c11: b.c11, c11w: b.c11w, r2k: b.r2k, p2k: b.p2k}); box = 1; boxes++; }
        }
        let next: Record<string, unknown>;
        if (!cur) next = {id, athlete: name, date: d, pitched: true, opp: g.opp, ...stats, src: "ballclubz"};
        // (a game already read keeps its box-score numbers: stats then only carries the player-page line)
        else if (cur.src === "ballclubz") next = {...cur, ...stats, opp: cur.opp || g.opp, pitched: true};
        else {   // logged in the app: only fill what is empty
          next = {...cur}; for (const [k, v] of Object.entries(stats)) if ((cur[k] ?? "") === "" && v != null) next[k] = v;
          if (!cur.opp && g.opp) next.opp = g.opp; next.pitched = true;
        }
        if (box) next.box = 1;
        const changed = !cur || Object.keys(next).some(k => JSON.stringify(next[k]) !== JSON.stringify(cur[k]));
        if (!changed) continue;
        if (cur) delete next.summary;   // the app works the summary out again
        next.updatedAt = Date.now();
        if (dry){ gamesSaved++; continue; }
        const { error: e } = await db.from("games").upsert({id, data: next, day: d});
        if (!e) gamesSaved++; else report.push({athlete: name, date: d, error: e.message});
      }

      // ---- hitting: at-bats rebuilt from the day's totals (hits by type, walks, strikeouts, other outs)
      const bat = new Map<string, Record<string, number> & {opp?: string | null}>();
      for (const row of table(html, "Batting Game Log")) {
        const d = isoDate(row.DATE, years); if (!d) continue;
        const t = bat.get(d) ?? {pa: 0, ab: 0, h: 0, d2: 0, d3: 0, hr: 0, bb: 0, so: 0, rbi: 0};
        t.pa += num(row.PA); t.ab += num(row.AB); t.h += num(row.H); t.d2 += num(row["2B"]); t.d3 += num(row["3B"]); t.hr += num(row.HR);
        t.bb += num(row.BB); t.so += num(row.SO ?? row.K); t.rbi += num(row.RBI); t.opp = t.opp ?? opp(row.TEAM); bat.set(d, t);
      }
      for (const [d, t] of bat) {
        if (!t.pa) continue;
        const id = `${s}_${d}`;
        const cur = (await db.from("hitting").select("data").eq("id", id).maybeSingle()).data?.data;
        if (cur && (cur.pas || []).some((p: {bz?: number}) => !p.bz)) continue;   // at-bats typed in the app win
        const singles = Math.max(0, t.h - t.d2 - t.d3 - t.hr), outs = Math.max(0, t.ab - t.h - t.so), other = Math.max(0, t.pa - t.ab - t.bb);
        const pas: Record<string, unknown>[] = [
          ...Array(singles).fill("1B"), ...Array(t.d2).fill("2B"), ...Array(t.d3).fill("3B"), ...Array(t.hr).fill("HR"),
          ...Array(t.bb).fill("BB"), ...Array(t.so).fill("K"), ...Array(outs).fill("OUT"), ...Array(other).fill("XPA"),
        ].map(res => ({res, rbi: 0, bz: 1}));
        if (pas.length && t.rbi) pas[0].rbi = t.rbi;
        const next: Record<string, unknown> = {...(cur || {}), id, athlete: name, date: d, pas, opp: cur?.opp || t.opp || null, src: "ballclubz"};
        if (cur && JSON.stringify(cur.pas) === JSON.stringify(pas)) continue;
        delete next.summary; next.updatedAt = Date.now();
        if (dry){ hitsSaved++; continue; }
        const { error: e } = await db.from("hitting").upsert({id, data: next, day: d});
        if (!e) hitsSaved++; else report.push({athlete: name, date: d, error: e.message});
      }

      if (!dry) await db.from("ballclubz_links").upsert({athlete_slug: s, league, player_id: pid, bz_name: bzName, status, synced_at: new Date().toISOString()});
      report.push({athlete: name, league, player: pid, pitching: pit.size, batting: bat.size, gamesSaved, hitsSaved, boxes});
      await new Promise(r => setTimeout(r, 300));   // go easy on their site
    }
  }
  return new Response(JSON.stringify({ok: true, dry: !!dry, report}), {headers: cors});
});
