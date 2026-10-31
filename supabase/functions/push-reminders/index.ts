// Sends the players' reminders. Called by pg_cron (public.push_kick) with the cron secret:
//   {kind: "arm"}  every day 7:30am Brisbane: arm check-in, to every subscribed player
//   {kind: "game"} 3pm Brisbane on a player's game days, only if that game isn't logged yet
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const MSG: Record<string, {title: string; body: string}> = {
  arm: {title: "Arm check-in", body: "How does your arm feel today? Tap to log it before you throw."},
  game: {title: "Log your game", body: "It's game day. Tap to log today's game while it's fresh."},
};

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: cfg } = await db.rpc("push_config");
  if (!cfg || req.headers.get("x-cron-secret") !== cfg.push_cron_secret) return new Response("no", {status: 401});
  const { kind } = await req.json().catch(() => ({}));
  const msg = MSG[kind]; if (!msg) return new Response("bad kind", {status: 400});
  webpush.setVapidDetails("https://nd6t545wky-png.github.io/Bq-ayc-schedule-and-pen-tracking-/", cfg.vapid_public, cfg.vapid_private);
  const { data: subs, error } = await db.rpc("push_due", {p_kind: kind});
  if (error) return new Response(error.message, {status: 500});
  let sent = 0, gone = 0;
  for (const s of subs || []){
    try { await webpush.sendNotification(s.sub, JSON.stringify({...msg, tag: kind}), {TTL: 6*3600}); sent++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410){ await db.rpc("drop_push_sub", {p_endpoint: s.endpoint}); gone++; } }
  }
  return new Response(JSON.stringify({kind, sent, gone}), {headers: {"Content-Type": "application/json"}});
});
