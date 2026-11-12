// Sends the players' reminders. Called by pg_cron (public.push_kick) with the cron secret:
//   {kind: "arm"}  every day 7:30am Brisbane: arm check-in, to every subscribed player
//   {kind: "game"} 3pm Brisbane on a player's game days, only if that game isn't logged yet
//   {kind: "week"} Sunday 6pm Brisbane: how many BQ approach goals the player met this week (only if they logged a game)
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const MSG: Record<string, {title: string; body: string}> = {
  arm: {title: "BQ Weekly", body: "Complete arm check-in and check schedule"},
  game: {title: "BQ Weekly", body: "Reminder to log your game"},
};
// the same goals as the app's score rings (index.html: GOALS, qabWhy, sitDone, hardOf)
const pct = (a: number, b: number) => b ? Math.round(100 * a / b) : null;
const HIT = ["1B", "2B", "3B", "HR", "BH"];
type PA = Record<string, any>;
const hard = (p: PA) => p.hh != null ? +p.hh : p.qual && !["BB", "HBP", "KS", "KL", "K", "XPA"].includes(p.res) ? (p.qual === "H" ? 1 : 0) : null;
const sitDone = (p: PA) => p.res === "SF" || p.res === "SH" || p.adv || p.r3 || p.hnr;
const qab = (p: PA) => HIT.includes(p.res) || ["BB", "HBP", "SF", "SH"].includes(p.res) || hard(p) === 1 || p.rbi > 0 || p.r3 || p.adv || p.hnr || p.p7;
function weekGoals(games: PA[], hits: PA[]) {
  const sum = (k: string, d: string) => games.reduce((t, g) => g[k] != null && g[k] !== "" && +g[d] ? [t[0] + +g[k], t[1] + +g[d]] : t, [0, 0]);
  const pas: PA[] = hits.flatMap((h) => h.pas || []), rated = pas.filter((p) => hard(p) != null), sit = pas.filter((p) => sitDone(p) || p.sitx);
  const rows: [string, number | null, number][] = [
    ["Strike %", pct(...(sum("strikes", "pitches") as [number, number])), 60], ["1st pitch %", pct(...(sum("fps", "bf") as [number, number])), 60],
    ["1:1 win", pct(...(sum("c11w", "c11") as [number, number])), 70], ["2K offspeed", pct(...(sum("os2k", "p2k") as [number, number])), 60],
    ["QAB %", pas.length ? pct(pas.filter(qab).length, pas.length) : null, 60], ["Hard hit", pct(rated.filter((p) => hard(p) === 1).length, rated.length), 50],
    ["Situational", pct(sit.filter(sitDone).length, sit.length), 60],
  ];
  return rows.filter((r) => r[1] != null) as [string, number, number][];
}

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: cfg } = await db.rpc("push_config");
  if (!cfg || req.headers.get("x-cron-secret") !== cfg.push_cron_secret) return new Response("no", {status: 401});
  const { kind } = await req.json().catch(() => ({}));
  webpush.setVapidDetails("https://nd6t545wky-png.github.io/Bq-ayc-schedule-and-pen-tracking-/", cfg.vapid_public, cfg.vapid_private);
  let sent = 0, gone = 0;
  const send = async (s: {sub: any; endpoint: string}, msg: {title: string; body: string}) => {
    try { await webpush.sendNotification(s.sub, JSON.stringify({...msg, tag: kind}), {TTL: 6*3600}); sent++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410){ await db.rpc("drop_push_sub", {p_endpoint: s.endpoint}); gone++; } }
  };

  if (kind === "week") {
    // the last 7 days in Brisbane (UTC+10)
    const day = (n: number) => new Date(Date.now() + 10*3600e3 - n*864e5).toISOString().slice(0, 10), from = day(6);
    const { data: subs } = await db.from("push_subs").select("endpoint,sub,athlete_slug").not("athlete_slug", "is", null);
    for (const s of subs || []) {
      const [g, h] = await Promise.all([
        db.from("games").select("data").eq("athlete_slug", s.athlete_slug).gte("day", from),
        db.from("hitting").select("data").eq("athlete_slug", s.athlete_slug).gte("day", from)]);
      const goals = weekGoals((g.data || []).map((r) => r.data), (h.data || []).map((r) => r.data));
      if (!goals.length) continue;   // nothing logged this week: no message
      const met = goals.filter(([, v, t]) => v >= t);
      await send(s, {title: "BQ Weekly", body: `This week: ${met.length} of ${goals.length} goals met. ` + goals.map(([n, v, t]) => `${n} ${v}${v >= t ? " ✓" : ""}`).join(", ")});
    }
    return new Response(JSON.stringify({kind, sent, gone}), {headers: {"Content-Type": "application/json"}});
  }

  const msg = MSG[kind]; if (!msg) return new Response("bad kind", {status: 400});
  const { data: subs, error } = await db.rpc("push_due", {p_kind: kind});
  if (error) return new Response(error.message, {status: 500});
  for (const s of subs || []) await send(s, msg);
  return new Response(JSON.stringify({kind, sent, gone}), {headers: {"Content-Type": "application/json"}});
});
