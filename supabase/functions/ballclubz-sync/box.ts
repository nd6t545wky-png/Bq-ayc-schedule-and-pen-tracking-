// Box scores: what a Ballclubz player page doesn't carry. The scorer's file for each game has the official strike
// count on the pitcher's line and a play-by-play, from which batters faced, first-pitch strikes, 1-1 counts (and how
// many were won), getting to 2 strikes first, and pitches thrown with 2 strikes are counted.
// (Same reading of the file as Dylan's Pitching OS: schedule -> box-score page -> game.ballclubz.com/<id>/<code>.json.)
const txt = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/\s+/g, " ").trim();

export interface ScheduleGame { monthDay: string; path: string; text: string }
// every game on the schedule page, with the day ("11/01") it sits under
export function parseScheduleGames(html: string): ScheduleGame[] {
  const games: ScheduleGame[] = [];
  let monthDay = "";
  const pattern = /class="bz-schedule-separator"[^>]*>\s*[A-Za-z]{3}\s+(\d{1,2})\/(\d{1,2})\s*<|class="bz-game-box(?:\s[^"]*)?"\s+data-href="(\/[a-z0-9]{2,40}\/live\/[0-9a-f]{1,16})"([\s\S]*?)(?=class="bz-game-box(?:\s[^"]*)?"\s+data-href|class="bz-schedule-separator"|<\/ul>|$)/gi;
  for (const m of html.matchAll(pattern)) {
    if (m[1]) monthDay = `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}`;
    else if (monthDay) games.push({monthDay, path: m[3], text: txt(`<x ${m[4]}`)});
  }
  return games;
}
// the schedule game a pitching line came from: same day, both teams named in the box
export function gameFor(games: ScheduleGame[], date: string, team: string, opp: string): ScheduleGame | null {
  const md = `${date.slice(5, 7)}/${date.slice(8, 10)}`, has = (g: ScheduleGame, n: string) => !!n && g.text.toLowerCase().includes(n.toLowerCase());
  return games.find((g) => g.monthDay === md && has(g, team) && has(g, opp)) ?? null;
}
// the player's team, from the player page header
export function playerTeam(html: string): string | null {
  const at = html.search(/bz-roster-header-player-info/i); if (at < 0) return null;
  const m = /<h2>[^<]+<\/h2>\s*<a [^>]*>([^<]+)<\/a>/i.exec(html.slice(at));
  return m ? txt(m[1]) : null;
}
// the scorer's file a box-score page loads: LoadLiveGame('343943', '…')
export function liveGameFileUrl(html: string): string | null {
  const m = /LoadLiveGame\(\s*'(\d{1,12})'\s*,\s*'([0-9a-f]{8,64})'\s*\)/i.exec(html);
  return m ? `https://game.ballclubz.com/${m[1]}/${m[2]}.json` : null;
}

// plays: a = plate appearance, pi = pitcher's lineup slot, g = kind (4 a pitch, 5-6 a pitch with a base-running event,
// 7 the plate appearance's result), r = outcome (on a pitch: -2 ball, -4 called strike, -5 swinging strike, -6 foul)
type Play = {a?: number; pi?: number; g?: number; r?: number};
const STRIKE_PITCH = new Set([-4, -5, -6]), BALL_RESULT = new Set([13, 14, 15]), INTENTIONAL_WALK = 14;
const isPitch = (p: Play) => p.g === 4 || p.g === 5 || p.g === 6 || (p.g === 7 && p.r !== INTENTIONAL_WALK);
const isStrike = (p: Play) => p.g === 7 ? !BALL_RESULT.has(Number(p.r)) : STRIKE_PITCH.has(Number(p.r));

export interface BoxLine { pitches: number; strikes: number; bf: number; fps: number; c11: number; c11w: number; r2k: number; p2k: number }
// a pitcher's line out of the scorer's file, found by name; null when they aren't in it
export function pitchingFromGameFile(file: any, name: string): BoxLine | null {
  if (!file || typeof file !== "object" || !file.lineup || !Array.isArray(file.plays)) return null;
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " "), wanted = norm(name);
  const entry = Object.entries(file.lineup as Record<string, any>).find(([, p]) => p && "pitch_pitches" in p && norm(`${p.firstname ?? ""} ${p.lastname ?? ""}`) === wanted);
  if (!entry) return null;
  const slot = Number(entry[0]), line = entry[1];
  const mine: Play[] = file.plays.filter((p: Play) => p && p.pi === slot), pitches = mine.filter(isPitch), results = mine.filter((p) => p.g === 7);
  let fps = 0, c11 = 0, c11w = 0, r2k = 0, p2k = 0;
  for (const pa of new Set(results.map((p) => p.a))) {
    let b = 0, s = 0, first = true, raced = false;
    for (const p of mine.filter((x) => x.a === pa && isPitch(x))) {
      const k = isStrike(p);
      if (first) { if (k) fps++; first = false; }
      if (b === 1 && s === 1) { c11++; if (k) c11w++; }   // the 1-1 pitch: won with a strike (or a ball in play)
      if (s === 2) p2k++;                                 // thrown with 2 strikes
      if (!k) b++; else if (!(p.g !== 7 && p.r === -6 && s === 2)) s++;   // a foul with 2 strikes stays at 2
      if (s >= 2 && b < 2 && !raced) { r2k++; raced = true; }             // 2 strikes before 2 balls
    }
  }
  const official = (key: string, fallback: number) => { const v = Number(line[key]); return Number.isFinite(v) && v >= 0 ? v : fallback; };
  return {pitches: official("pitch_pitches", pitches.length), strikes: official("pitch_strikes", pitches.filter(isStrike).length), bf: results.length, fps, c11, c11w, r2k, p2k};
}
