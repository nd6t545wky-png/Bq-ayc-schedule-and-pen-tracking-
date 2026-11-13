(() => {
// ---------- pen definitions (zones written for a RHP, pitcher's view; mirrored for LHP) ----------
const MIRROR = {1:3,3:1,4:6,6:4,7:9,9:7,11:12,12:11,13:14,14:13};
const P = (set,p,z,extra) => Object.assign({set,p,z},extra||{});
const rep = (n,fn) => Array.from({length:n},(_,i)=>fn(i));

// Planned pens are about half fastballs (FB and SI share them); the other half is split across the offspeed.
const CONTROL = [
 ...[5,6,4,9,7,3,1,8,2,5].map(z=>P("W","FB",z)),
 ...[8,9,6,7,14,13].map(z=>P("W","CH",z)),
 ...[8,7,13,9,4,14].map(z=>P("W","BB",z)),
 ...[["FB",3],["CH",9],["FB",6],["BB",7],["FB",1],["CH",14],["FB",11],["BB",13],["FB",12],["CH",8],["FB",4],["BB",9],["FB",5]].map(([p,z])=>P("S",p,z)),
];
const cmd1 = [...rep(6,()=>P("W","FB",5)),...rep(4,()=>P("W","CH",5)),...rep(4,()=>P("W","BB",5)),...rep(2,()=>P("W","FB",5)),
              ...rep(4,()=>P("S","FB",5)),...rep(4,()=>P("S","CH",5)),...rep(2,()=>P("S","FB",5)),...rep(4,()=>P("S","BB",5)),...rep(2,()=>P("S","FB",5))];
const cmd2 = [...[6,4,6,4,6,4,6,4].map(z=>P("W","FB",z,{side:1})),...[6,4,6,4].map(z=>P("W","CH",z,{side:1})),...[4,6,4,6].map(z=>P("W","BB",z,{side:1})),
              ...[6,4,6,4,6,4,6,4].map(z=>P("S","FB",z,{side:1})),...[6,4,6,4].map(z=>P("S","CH",z,{side:1})),...[4,6,4,6].map(z=>P("S","BB",z,{side:1}))];
const cmd3 = [...[1,3,7,9,1,3,7,9,2,2].map(z=>P("W","FB",z)),...[9,9,7,7,14,14,9,7].map(z=>P("W","CH",z)),
              ...[7,7,9,9,13,13,7,9].map((z,i)=>P(i<4?"W":"S","BB",z)),...[1,3,7,9,1,3,7,9].map(z=>P("S","FB",z))];
const tun1 = [...rep(6,i=>[P(i<3?"W":"S","FB",5,{grp:"a"+i}),P(i<3?"W":"S","CH",8,{grp:"a"+i})]).flat(),
              ...rep(6,i=>[P(i<3?"W":"S","FB",5,{grp:"b"+i}),P(i<3?"W":"S","BB",8,{grp:"b"+i})]).flat(),
              ...rep(2,i=>[P(i<1?"W":"S","CH",8,{grp:"c"+i}),P(i<1?"W":"S","BB",8,{grp:"c"+i})]).flat(),
              P("S","FB",5),P("S","FB",5),P("S","FB",5),P("S","FB",5)].map(x=>Object.assign(x,{gate:1}));
const T2 = [[["FB",2],["BB",8]],[["CH",9],["FB",3]],[["FB",2],["CH",8]],[["BB",4],["FB",6]]];
const tun2 = rep(16,i=>T2[i%4].map(([p,z])=>P(i<8?"W":"S",p,z,{grp:"p"+i,gate:1}))).flat();
const T3 = [[["BB",8],["FB",2],["CH",9]],[["FB",2],["CH",8],["FB",6]],[["FB",2],["BB",4],["CH",9]],[["FB",2],["BB",8],["FB",3]]];
const tun3 = rep(11,i=>T3[i%4].map(([p,z])=>P(i<6?"W":"S",p,z,{grp:"s"+i,gate:1}))).flat();
const des1 = [...rep(4,()=>P("W","FB",5)),...rep(28,i=>P("W","D",5,{shape:1,note:"Grip "+(Math.floor(i/7)+1)}))];
const des2 = [...rep(6,()=>P("W","FB",5)),...rep(26,i=>P(i<13?"W":"S","D",5,{shape:1,note:"Set "+(Math.floor(i/5)+1)}))];
const des3 = [...[4,6,4,6,4,6,4,6,8,8,8,8,13,14,13,14,8,8].map((z,i)=>P(i<9?"W":"S","D",z,{shape:1})),
              ...[1,3,7,9,5,2,6,4].map(z=>P("S","FB",z)),...[8,9,7,14,8,9,7,13].map(z=>P("S","OS",z))];
const D4 = [[["FB",2],["D",8]],[["D",8],["FB",3]],[["OS",9],["D",7]],[["D",4],["OS",9]]];
const des4 = rep(16,i=>D4[i%4].map(([p,z])=>P(i<8?"W":"S",p,z,{grp:"d"+i,gate:1,shape:p==="D"?1:0}))).flat();

// Base sequence: 8 FB glove side, then 2 FB + 2 CH and 2 FB + 2 breaking ball sets (2 of each = 24 pitches).
// Volume goes up by adding sets. "C"/"B" are the changeup / breaking-ball family, not any offspeed.
const baseSeq = sets => [...rep(8,()=>P("W","FB",4,{side:1})),
  ...rep(sets,()=>[P("W","FB",5),P("W","FB",5),P("W","C",8),P("W","C",8)]).flat(),
  ...rep(sets,()=>[P("W","FB",5),P("W","FB",5),P("W","B",8),P("W","B",8)]).flat()];

const COUNTS4 = ["0-0","1-0","0-1","1-1","2-1","0-2","3-2"];
const SITS = [
 {s:"Runner on 1st",c:["0-0","1-0","1-1"],r1:1},
 {s:"Runner on 2nd",c:["0-1","2-1","2-2"]},
 {s:"Runner on 3rd, less than 2 outs",c:["1-1","0-2","3-2"],outs:[0,1]},
 {s:"Runners on 1st and 3rd",c:["1-0","2-1","1-2"],r1:1},
 {s:"Bases loaded",c:["2-0","3-1","3-2"],loaded:1},
 {s:"Bases empty, 2 outs",c:["0-0","0-2","2-2"],outs:[2]},
];

const LV = {
 cmd:["Strike foundation","Zone halves","Corners and chase","Counts","Counts + runners"],
 tun:["Tunnel pairs","Split finishes","Three-pitch sequences","Counts","Counts + runners"],
 des:["Grip and feel","Shape consistency","Command the new shape","Tunnel with the arsenal","Counts + runners"],
};
const DESC = {
 base1:"Base sequence, 24 pitches at 80% to max intent: 8 fastballs to the glove side, then 2 FB + 2 CH x 2 sets and 2 FB + 2 breaking balls x 2 sets.",
 base2:"Base sequence plus a set of each (32 pitches): 8 FB glove side, 2 FB + 2 CH x 3 sets, 2 FB + 2 breaking balls x 3 sets. Intensity 80% to max.",
 base3:"Base sequence plus two sets of each (40 pitches): 8 FB glove side, 2 FB + 2 CH x 4 sets, 2 FB + 2 breaking balls x 4 sets. Intensity 80% to max. To add hitters instead, use a Command L4 pen.",
 control:"35 planned pitches, about half fastballs: fastball to every zone, changeups, breaking balls, then a mixed stretch block. Target: 60%+ of max points and 65%+ strikes.",
 cmd1:"32 pitches aimed at the middle, 16 FB / 8 CH / 8 BB. Target: 65%+ strikes, 60%+ strikes with each offspeed pitch.",
 cmd2:"32 pitches to called halves (arm side / glove side). Target: 60%+ to the called half with each pitch type.",
 cmd3:"34 pitches to corners, bottom of the zone and chase. Target: 60%+ of max points overall and with each offspeed pitch.",
 cmd4:"8 simulated hitters from drawn counts. You call each pitch. 40%+ offspeed. Target: win 6 of 8, max 1 walk.",
 cmd5:"Simulated hitters with situation cards (count, runners, outs). 40%+ offspeed. Target: win 6 of 8, no walks with bases loaded, time to plate under 1.5 s.",
 tun1:"32 pitches in tunnel pairs: FB-CH, FB-BB, CH-BB. Mark each pitch through the gate. Target: 60%+ pairs both through the gate.",
 tun2:"16 pairs that share a tunnel and split to different finishes. Target: 60%+ of pairs fully executed (gate + spot).",
 tun3:"11 three-pitch sequences through the gate. Target: 7 of 11 sequences fully executed.",
 tun4:"8 simulated hitters. Each sequence needs 2 offspeed pitches and a tunnel pair. Target: win 6 of 8, max 1 walk.",
 tun5:"Simulated hitters with situation cards, every sequence built off tunnels. Target: win 6 of 8, no walks with bases loaded, time to plate under 1.5 s.",
 des1:"4 FB, then 4 grip variations x 7 of the design pitch at 75-85% intent. Mark shape match on each. Goal: pick the best grip.",
 des2:"6 FB, then 26 design pitches in sets of 5. Judge shape, not location. Target: 70%+ shape match.",
 des3:"18 design pitches to spots plus 8 FB and 8 other offspeed. Target: 55%+ design pitches to the spot with 70%+ shape match.",
 des4:"16 pairs mixing the design pitch with the FB and other offspeed through the gate. Target: 60%+ of pairs fully executed.",
 des5:"Simulated hitters with situation cards. Design pitch 30%+ of the pen and used to put a hitter away. Target: win 6 of 8.",
 custom:"Blank pen: pick the pitch and intended zone before each pitch. Up to 35 pitches, no target.",
};

function penDef(fw, lvl){
  if (fw==="base"){ const l = Math.min(3, Math.max(1, lvl||1));
    return {key:"base"+l, name:"Base sequence"+(l>1 ? " +"+(l-1)+" set"+(l>2?"s":"") : ""), mode:"plan", plan:baseSeq(l+1)}; }
  if (fw==="control") return {key:"control",name:"Full control pen",mode:"plan",plan:CONTROL};
  if (fw==="custom") return {key:"custom",name:"Custom pen",mode:"called",max:35};
  const k = fw+lvl, nm = {cmd:"Command",tun:"Tunneling",des:"Pitch design"}[fw]+" L"+lvl+" - "+LV[fw][lvl-1];
  const plans = {cmd1,cmd2,cmd3,tun1,tun2,tun3,des1,des2,des3,des4};
  if (plans[k]) return {key:k,name:nm,mode:"plan",plan:plans[k]};
  return {key:k,name:nm,mode:"counts",hitters:8,sit:lvl===5,max:35};
}

// ---------- pitch catalogue ----------
const PITCHES = [
 {c:"FB",n:"4-seam fastball",f:"FB"},{c:"SI",n:"2-seam / sinker",f:"FB"},{c:"CT",n:"Cutter",f:"BB"},
 {c:"SL",n:"Slider",f:"BB"},{c:"SW",n:"Sweeper",f:"BB"},{c:"CB",n:"Curveball",f:"BB"},
 {c:"CH",n:"Changeup",f:"CH"},{c:"SPL",n:"Splitter",f:"CH"}];
const PNAME = Object.fromEntries(PITCHES.map(p=>[p.c,p.n]));
const FAM = Object.fromEntries(PITCHES.map(p=>[p.c,p.f]));
const ORDER = PITCHES.map(p=>p.c);
function mixOf(rec){ return (rec.mix && rec.mix.length) ? rec.mix : ["FB","CH",rec.bb||"CB"]; }
function families(mix){
  const sorted = ORDER.filter(c=>mix.includes(c));
  const f = {FB:sorted.filter(c=>FAM[c]==="FB"), CH:sorted.filter(c=>FAM[c]==="CH"), BB:sorted.filter(c=>FAM[c]==="BB")};
  if (!f.FB.length) f.FB = sorted.includes("CT") ? ["CT"] : [sorted[0]||"FB"];
  // missing families borrow from the other offspeed group, then the fastball
  if (!f.CH.length) f.CH = f.BB.length ? f.BB : f.FB;
  if (!f.BB.length) f.BB = f.CH.length ? f.CH : f.FB;
  return f;
}
const OS_ROLES = ["CH","BB","OS"];
function offspeedList(rec){ const mix = mixOf(rec); return ORDER.filter(c=>mix.includes(c) && FAM[c]!=="FB" && c!==rec.design); }
function rolePitch(role, k, rec){
  const mix = mixOf(rec), f = families(mix);
  if (role==="D") return rec.design;
  if (role==="C") return f.CH[k % f.CH.length];
  if (role==="B") return f.BB[k % f.BB.length];
  if (OS_ROLES.includes(role)){ const os = offspeedList(rec); return os.length ? os[k % os.length] : f.FB[k % f.FB.length]; }
  return f.FB[k % f.FB.length];
}

// ---------- throwing schedule ----------
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const T_GAME = "Pregame throw and bullpen, pitch count under 45";
const T_REC = "Play catch to max 90 ft (no more than 30 throws total)";
const T_LT = "Long toss to tolerance: throw on an arc, no pull-downs, +/- low-intent mound work";
const T_PEN = "Throw as needed to get hot, then bullpen (30 to 35 pitches)";
const PL_REC = "Reverse throws and pivot picks only";
const DAYTYPES = {
  game:{n:"Game day",i:"100%",pl:"Plyos",t:T_GAME,cls:"game"},
  game2:{n:"Game day",i:"100%",pl:"Plyos",t:T_GAME+", or play position",cls:"game"},
  pos:{n:"Game day - play position",i:"Position",pl:"Plyos",t:"Pregame throw, play position as selected (not pitching, no extra throwing)",cls:"game"},
  pospen:{n:"Game day - play position",i:"Position / 90%+",pl:"Plyos",t:"Pregame throw, play position. Bullpen option if not pitching (30 to 35 pitches)",cls:"pen",pen:true},
  off:{n:"No throw",i:"0%",pl:"-",t:"-",cls:"off"},
  rec:{n:"Recovery day",i:"50%",pl:PL_REC,t:T_REC,cls:""},
  lt:{n:"Low intent throwing day",i:"60-70%",pl:"Plyo balls (full routine)",t:T_LT,cls:""},
  pen:{n:"High intent bullpen",i:"90%+",pl:"Plyos (50% volume)",t:T_PEN,cls:"pen",pen:true},
  tol:{n:"Tolerance throw",i:"50-60%",pl:"Plyos (reverse throws and pivot picks only)",t:"Catch to tolerance: easy, no pull-downs",cls:""},
  light:{n:"Light bullpen",i:"70-80%",pl:"Plyos (50% volume)",t:"Throw as needed to get hot, then light bullpen (15 pitches)",cls:"pen",pen:true},
  // position players: the same week, with throwing days in place of bullpens
  phi:{n:"High intent throwing day",i:"90%+",pl:"Plyos (50% volume)",t:"Long toss, then position throws at game intent",cls:""},
  pmod:{n:"Moderate throwing day",i:"70-80%",pl:"Plyos (50% volume)",t:"Throw as needed to get loose, then position throws",cls:""},
};
// A pitcher's week turned into a position player's: no bullpens, and every game day is played in the field
const POS_DAY = {pen:"phi", light:"pmod", pospen:"pos", game:"pos", game2:"pos"};
const posWeek = d => Object.fromEntries(Object.entries(d).map(([k,t])=>[k, POS_DAY[t] || t]));
const isPosOnly = name => (athleteDocs[slug(name||"")]||{}).type==="POS";
const WEEKS = [
 {k:"fri",n:"Friday game",d:{Fri:"game",Sat:"off",Sun:"rec",Mon:"lt",Tue:"pen",Wed:"rec",Thu:"rec"}},
 {k:"sat",n:"Saturday game",d:{Sat:"game",Sun:"off",Mon:"rec",Tue:"lt",Wed:"pen",Thu:"rec",Fri:"rec"}},
 {k:"sun",n:"Sunday game",d:{Sun:"game",Mon:"off",Tue:"rec",Wed:"lt",Thu:"pen",Fri:"rec",Sat:"rec"}},
 {k:"fs1",n:"Friday + Sunday games - pitched Friday",d:{Fri:"game",Sat:"off",Sun:"pos",Mon:"lt",Tue:"pen",Wed:"rec",Thu:"rec"}},
 {k:"fs2",n:"Friday + Sunday games - pitched Sunday",d:{Fri:"pospen",Sat:"rec",Sun:"game",Mon:"off",Tue:"rec",Wed:"lt",Thu:"rec"}},
 {k:"fs3",n:"Friday + Sunday games - did not pitch",d:{Fri:"pospen",Sat:"rec",Sun:"pos",Mon:"off",Tue:"lt",Wed:"pen",Thu:"rec"}},
 {k:"ss1",n:"Saturday + Sunday games - pitched Saturday",d:{Sat:"game",Sun:"pos",Mon:"off",Tue:"lt",Wed:"pen",Thu:"rec",Fri:"rec"}},
 {k:"ss2",n:"Saturday + Sunday games - pitched Sunday",d:{Sat:"pos",Sun:"game",Mon:"off",Tue:"lt",Wed:"pen",Thu:"rec",Fri:"rec"}},
 {k:"ss3",n:"Saturday + Sunday games - did not pitch",d:{Sat:"pos",Sun:"pos",Mon:"off",Tue:"lt",Wed:"pen",Thu:"rec",Fri:"rec"}},
 {k:"fss1",n:"Friday, Saturday + Sunday games - pitched Friday",d:{Fri:"game",Sat:"pos",Sun:"pos",Mon:"lt",Tue:"pen",Wed:"rec",Thu:"rec"}},
 {k:"fss2",n:"Friday, Saturday + Sunday games - pitched Saturday",d:{Fri:"pos",Sat:"game",Sun:"pos",Mon:"off",Tue:"lt",Wed:"pen",Thu:"rec"}},
 {k:"fss3",n:"Friday, Saturday + Sunday games - pitched Sunday",d:{Fri:"pospen",Sat:"pos",Sun:"game",Mon:"off",Tue:"rec",Wed:"lt",Thu:"rec"}},
 {k:"fss4",n:"Friday, Saturday + Sunday games - did not pitch",d:{Fri:"pospen",Sat:"pos",Sun:"pos",Mon:"off",Tue:"lt",Wed:"pen",Thu:"rec"}},
];
// What the week picker offers: which days have games, then (for more than one) which one they pitched.
const GAME_SETS = [
  {k:"sat", n:"Saturday game", days:["Sat"]},
  {k:"fs", n:"Friday + Sunday games", days:["Fri","Sun"]},
  {k:"ss", n:"Saturday + Sunday games", days:["Sat","Sun"]},
  {k:"fss", n:"Friday, Saturday + Sunday games", days:["Fri","Sat","Sun"]},
];
function weekPattern(set, pitch){
  if (set==="sat") return "sat";
  const g = GAME_SETS.find(x=>x.k===set), i = g.days.indexOf(pitch);
  return set + (i>=0 ? i+1 : g.days.length+1);
}
// devices that picked one of the old options
const OLD_WEEKS = {fri:["fs","Fri"], sun:["ss","Sun"], fs1:["fs","Fri"], fs2:["fs","Sun"], fs3:["fs","none"], ss1:["ss","Sat"], ss2:["ss","Sun"], ss3:["ss","none"]};
// From 7 Dec 2026 (after the GBL break) U16/U18 weeks start as a no-games week and are
// rebuilt around the games added for each player, depending on whether they pitched.
const GAME_WEEK_FROM = "2026-12-07", GAME_WEEK_AGES = ["U16","U18"];
const BASE_WEEK = {Mon:"rec", Tue:"lt", Wed:"pen", Thu:"rec", Fri:"light", Sat:"rec", Sun:"off"};
// U16 throw their bullpen on Thursday (a BQ training day), with the low-intent day before it
const BASE_WEEK_U16 = {Mon:"rec", Tue:"rec", Wed:"lt", Thu:"pen", Fri:"rec", Sat:"light", Sun:"off"};
const baseWeek = age => age==="U16" ? BASE_WEEK_U16 : BASE_WEEK;
// where a full bullpen goes when its usual day can't be used, best first
const penOrder = age => age==="U16" ? ["Thu","Wed","Tue","Fri","Mon","Sat"] : ["Wed","Tue","Thu","Mon","Fri","Sat"];
// Moves a single-game week's bullpen to Thursday for U16. Not when they pitch on Friday:
// no bullpen the day before a start, so that week keeps its earlier bullpen.
function u16Thursday(d){
  if (d.Fri==="game" || d.Thu==="game") return d;
  const out = Object.assign({}, d);
  DAYS.forEach(([k])=>{ if (out[k]==="pen" || out[k]==="lt") out[k] = "rec"; if (out[k]==="pospen") out[k] = "pos"; });
  out.Wed = "lt"; out.Thu = "pen";
  return out;
}
// U18 throw every full bullpen on Wednesday (BQ training day), with the low-intent day on Tuesday.
// Only a game, day off or travel day on the Wednesday itself moves it.
function u18Wednesday(d){
  if (!DAYS.some(([k])=>d[k]==="pen") || ["game","game2","pos","pospen","off"].includes(d.Wed)) return d;
  const out = Object.assign({}, d);
  DAYS.forEach(([k])=>{ if (out[k]==="pen" || out[k]==="lt") out[k] = "rec"; });
  if (!["game","game2","pos","pospen","off"].includes(out.Tue)) out.Tue = "lt";
  out.Wed = "pen";
  return out;
}
const BQ_DAYS = {U16:["Mon","Thu"], U18:["Mon","Wed"], AYWC:[], AWC:[]};
// QLD season calendar ("Prepare to win" schedule). Inside CAL_FROM..CAL_TO the BQ training tag comes
// from here (a BQ weekday with no session shows no BQ tag); outside it, BQ_DAYS is used.
// [date, label, kind]; kinds: train (label = venue), game, camp, tour, event, off, travel
const CAL_FROM = "2026-10-01", CAL_TO = "2027-01-31";
function span(from, n, label, kind){   // n days in a row from "from"
  return rep(n, i=>{ const d = new Date(from+"T00:00:00"); d.setDate(d.getDate()+i);
    return [d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"), label, kind]; });
}
const CAL_ALL = [["2026-10-21","Coaches","event"],["2026-10-28","Induction","event"],["2026-11-30","All Stars","event"],
  ["2026-12-06","GBL finish","event"],["2026-12-12","Camp","camp"],["2026-12-13","Camp (TBA)","camp"],["2026-12-14","Game TBA","game"]];
const CAL = {
  U18: CAL_ALL.concat([
    ["2026-11-02","PH","train"],["2026-11-04","Hendra","train"],["2026-11-09","Redcliffe","train"],["2026-11-11","Hendra","train"],
    ["2026-11-16","TBA","train"],["2026-11-18","vs PH","game"],["2026-11-23","PH","train"],["2026-11-25","Hendra","train"],
    ["2026-11-26","Bandits (home)","game"],
    ["2026-12-02","Hendra","train"],["2026-12-05","Bandits","game"],["2026-12-07","Hendra","train"],["2026-12-09","Hendra","train"],
    ["2026-12-16","Hendra","train"],["2026-12-19","Camp","camp"],["2026-12-20","Camp","camp"],["2026-12-23","Hendra","train"],
    ["2026-12-28","Camp","camp"],["2026-12-30","Hendra","train"],
    ["2027-01-02","Camp","camp"],["2027-01-03","vs Padres","game"],["2027-01-05","TBA","event"],["2027-01-06","Off","off"],
    ["2027-01-07","Travel","travel"]], span("2027-01-08", 7, "Nationals", "tour")),
  U16: CAL_ALL.concat([
    ["2026-11-02","PH","train"],["2026-11-05","Hendra","train"],["2026-11-09","Redlands","train"],["2026-11-12","Hendra","train"],
    ["2026-11-16","Runcorn","train"],["2026-11-19","Hendra","train"],["2026-11-23","PH","train"],["2026-11-26","Hendra","train"],
    ["2026-12-03","Hendra","train"],["2026-12-05","Home game","game"],["2026-12-07","Hendra","train"],["2026-12-10","Hendra","train"]],
    span("2026-12-17", 4, "NZ", "tour"), [["2026-12-23","Hendra","train"],["2026-12-30","Hendra","train"],
    ["2027-01-02","Camp","camp"],["2027-01-03","Camp","camp"],["2027-01-04","Off","off"],["2027-01-05","Travel","travel"]],
    span("2027-01-06", 7, "Nationals", "tour")),
  AYWC: [], AWC: [],
};
// Schoolboys tournament: a game can be logged on any of these days (the throwing plan is unchanged)
const TOURNEYS = [{from:"2026-10-29", to:"2026-11-01", label:"Schoolboys tournament"}];
const tourneyOn = date => TOURNEYS.find(t => date >= t.from && date <= t.to);
const calEvent = (age, date) => { const e = (CAL[age]||[]).find(x=>x[0]===date); return e ? {label:e[1], kind:e[2]} : null; };
const inCal = date => date >= CAL_FROM && date <= CAL_TO;
// What a calendar day does to the throwing plan: play days are game days, off days are no-throw,
// travel days are recovery. Training sessions and other events leave the plan as it is.
const PLAY_KINDS = ["game","tour","camp"];
const calType = ev => !ev ? null : PLAY_KINDS.includes(ev.kind) ? "game" : ev.kind==="off" ? "off" : ev.kind==="travel" ? "rec" : null;
// Single-game-week patterns: put the week's calendar days in, then make sure the bullpen
// isn't on (or the day before) a game. Returns the moved-to day, if the bullpen had to move.
function applyCal(types, dates, age){
  const fixed = {}; let touched = false;
  const penWas = DAYS.map(([k])=>k).find(k=>types[k]==="pen");
  DAYS.forEach(([k])=>{ const t = calType(calEvent(age, dates[k])); if (!t) return;
    types[k] = t==="game" ? "game2" : t; fixed[k] = true; touched = true; });
  if (!touched) return null;
  const playing = k => ["game","game2","pos","pospen"].includes(types[k]);
  const next = k => { const i = DAYS.findIndex(([x])=>x===k); return i<6 ? DAYS[i+1][0] : null; };
  if (!penWas) return null;                       // this week had no full bullpen to begin with
  const penDay = types[penWas]==="pen" ? penWas : null;
  if (penDay && !playing(next(penDay))) return null;
  if (age==="U18" && penDay==="Wed") return null;   // U18 bullpen stays on Wednesday
  const ok = k => !fixed[k] && k!=="Sun" && ["rec","lt"].includes(types[k]) && !(next(k) && playing(next(k)));
  const to = penOrder(age).find(ok);
  if (penDay) types[penDay] = "rec";
  if (to) types[to] = "pen";
  return to || "none";
}
function calTag(ev){
  const cls = {train:"bq", game:"game", tour:"game", camp:"pen", off:"off"}[ev.kind] || "ev";
  return `<span class="tag ${cls}">${esc(ev.kind==="train" ? "BQ training · "+(ev.label==="TBA" ? "venue TBA" : ev.label) : ev.label)}</span>`;
}
const DAYS = [["Mon","Monday"],["Tue","Tuesday"],["Wed","Wednesday"],["Thu","Thursday"],["Fri","Friday"],["Sat","Saturday"],["Sun","Sunday"]];
const RECOVERY = [["Thoracic spine windmills","15 each direction"],["Pec minor release w/ active ER","2 min"],["Infraspinatus/teres minor self mobilization","2 min"],["Biceps tack and pump","2 min"],["Foam roll levered 90/90 to Y's","12 slides"]];
const ARM_A = [["Superset x3: Posterior wall angels","20"],["Superset x3: Arm bar banded ER (abduction)","12"],["Superset x3: Single arm serratus slides","15 each"],["Superset x3: Tripod rotations w/ oscillations, weighted ball","12"],["Superset x3: SA split stance serratus scoops","15 slow"]];
const ARM_B = [["Upward toss, green or blue ball (1 kg or 450 g)","2 x 30"],["Band pull-aparts, each direction","2 x 15"],["IR / ER at 90° with band","2 x 15"]];
const progList = (name, rows) => `<details class="plist"><summary>${name}</summary><ol>${rows.map(([a,b])=>`<li>${esc(a)}${b?` <span class="dose">· ${esc(b)}</span>`:""}</li>`).join("")}</ol></details>`;
// Bands every throwing day: the individual (Driveline) J Band routine from the BQ Team Preparation sheet
const BANDS = ["Reverse Fly to OH Reach","Forward Fly to OH Reach","External Rotations","Internal Rotations","Bicep Curls w/ Supination","Tricep Extensions w/ Pronation"];
// Plyos (BQ throwing drills sheet). Full routine on full days; 50% days halve each dose;
// recovery and tolerance days do the anchored drills only.
const PLYO_ANCHORED = [["Reverse Throw", "8-10 throws, 1-2 kg (green / pink / black ball)", "4-5 throws, 1-2 kg (green / pink / black ball)"],
  ["Oppo Feet Pivot Pick", "5 throws, 450 g (blue ball)", "2-3 throws, 450 g (blue ball)"]];
const PLYO_ATHLETIC = ["Toe Taps","Walking Wind Ups","Step Back / In / Behind / Stomp / Up mound","Quick Pick","Double Hop"];
const PLYO_EACH = "1-2 throws with each ball: blue, red, yellow, gray", PLYO_EACH_HALF = "1 throw with each ball: blue, red, yellow, gray";
function plyoHtml(pl, t){
  const half = /50%/.test(pl), anchoredOnly = /reverse throws and pivot picks only/i.test(pl);
  const game = ["game","game2","pos","pospen"].includes(t);   // game days: full anchored drills, 1 throw per ball on the rest
  if (!pl || pl==="-") return "";
  const rows = PLYO_ANCHORED.map(([n, full, h])=>[n, half ? h : full])
    .concat(anchoredOnly ? [] : PLYO_ATHLETIC.map(n=>[n, half || game ? PLYO_EACH_HALF : PLYO_EACH]));
  return progList("Plyos: "+(anchoredOnly ? "reverse throws and pivot picks only" : half ? "50% volume" : game ? "game day" : "full routine"), rows);
}
const prepHtml = () => progList("Bands: J Band routine", BANDS.map(x=>[x, "x10"]));
// ---------- individual throwing programs (replace an athlete's normal week from their start date) ----------
// Coaches assign one on the player's profile (athlete.prog = {k, from, moves}); rows are Mon..Sun, so a program starts on a Monday.
const PROGRAM_TEMPLATES = {
  rtt: {name: "Return to throwing (8 weeks)", note: "If any pain occurs while throwing, stop immediately and tap ‘Had pain while throwing’: the next throwing day goes back one level.",
    weeks: [
      ["No throw","No throw","No throw","No throw","Start bands","Bands","Bands"],
      ["Bands","Bands","Bands","Bands","60 ft|20 throws","Bands","75 ft|25 throws"],
      ["90 ft|30 throws","Bands","90 ft|40 throws","90 ft|40 throws","Bands","110 ft|55 throws","Bands"],
      ["120 ft|60 throws","Bands","90 ft|30 throws","120 ft|70 throws","Bands","Bands","GAME"],
      ["90 ft|30 throws","Bands","Hybrid B","150 ft|80 throws","Bands","90 ft|30 throws","GAME"],
      ["Hybrid B|Pen: 15 pitches","Bands","90 ft|30 throws","Hybrid A|Pen: 20 pitches, fastball","90 ft|30 throws","Hybrid B","Bands"],
      ["Hybrid B","Bands","90 ft|30 throws","Hybrid A|Pen: 25 pitches, fastball + changeup","90 ft|30 throws","Hybrid B","Bands"],
      ["Hybrid B","Bands","90 ft|30 throws","Hybrid A|Pen: 25 pitches, fastball + changeup","90 ft|30 throws","Hybrid B","Bands"]]}
};
// set before coaches could assign programs in the app; an assignment on the athlete (or "none") replaces it
const PROGRAM_DEFAULTS = {"zavier-leigh": {k: "rtt", from: "2026-11-09"}};
// -> null, or {k, from, moves, name, note, weeks} for this athlete
function athProgram(ath){
  const id = slug(ath||""), a = athleteDocs[id] || {}, pg = a.prog || PROGRAM_DEFAULTS[id];
  const t = pg && PROGRAM_TEMPLATES[pg.k]; if (!t || !pg.from) return null;
  return Object.assign({moves: {}}, pg, t);
}
// One sheet cell -> a day: {t, T, kind:"off"|"bands"|"throw", throws, pen, text}
function programCell(cell){
  if (cell==="No throw") return {t:"off", kind:"off", T:{n:"No throw",i:"0%",pl:"-",t:"-",cls:"off"}, text:"Full day off: no throwing, no bands."};
  if (cell==="Start bands" || cell==="Bands") return {t:"prog", kind:"bands", T:{n:"No throw",i:cell==="Start bands"?"Start bands":"Bands",pl:"-",t:"-",cls:""}, text: cell==="Start bands" ? "Start the J Band routine today. No throwing." : "J Band routine. No throwing."};
  if (cell==="GAME") return {t:"game2", kind:"throw", throws:true, game:true, T:{n:"Game day",i:"Game",pl:"-",t:"Game",cls:"game"}, text:"Game day."};
  const [a, b] = cell.split("|"), pen = /^Pen:/.test(b||"");
  return {t:"prog", kind:"throw", throws:true, pen, T:{n: pen ? "Bullpen" : (b || "Throwing day"), i:a, pl:"-", t:cell, cls: pen ? "pen" : "", pen},
    text: a + (b ? (pen ? ", then " + b.replace(/^Pen: /, "bullpen: ") : ": " + b) : "")};
}
const isLevel = c => c!=="No throw" && c!=="Start bands" && c!=="Bands" && c!=="GAME";   // a throwing step of the program
const painOn = (ath, date) => !!(getCheckin(ath, date) || {}).pain;
// -> null, or the day for this athlete and date. Pain on a throwing day sends the next throwing day back one step
// (the step before the one that hurt), and the program carries on from there; bands / no-throw days stay as on the sheet.
// While behind the sheet, game days become program throwing days (no pitching in the game).
function programDay(ath, date){
  const pr = athProgram(ath); if (!pr || date < pr.from) return null;
  const cells = pr.weeks.flat(), N = Math.round((new Date(date+"T00:00:00") - new Date(pr.from+"T00:00:00")) / 864e5);
  if (N >= cells.length) return null;
  const levels = cells.filter(isLevel);
  let ptr = 0, sched = 0, lastPain = null;
  for (let i = 0; i <= N; i++){
    const day = addDays(pr.from, i), cell = cells[i];
    if (pr.moves[day]) ptr = Math.max(0, Math.min(levels.length-1, ptr + pr.moves[day]));   // a coach moved them forward or back that day
    const behind = ptr < sched;
    const step = isLevel(cell) || (cell==="GAME" && behind);
    if (isLevel(cell)) sched++;
    if (!step){ if (i===N) return Object.assign(programCell(cell), {lastPain}); continue; }
    const shown = levels[ptr] || levels[levels.length-1], pain = painOn(ath, day);
    if (i===N) return Object.assign(programCell(shown), {step:true, pain, lastPain, behind: ptr < sched - (isLevel(cell)?1:0), sheet: cell, wasGame: cell==="GAME", level: ptr+1, levels: levels.length});
    if (pain) lastPain = day;
    ptr = pain ? Math.max(0, ptr - 1) : ptr + 1;
  }
  return null;
}
// Early work warm-up (Team Preparation sheet: Early Work Prep), first thing on every throwing day
const EARLY_WORK = [["World's Greatest Stretch","4 / side"],["Overhead Squat","8"],["Counter Rotations","6 / side"],
  ["Cross Body Reverse Lunge","4 / side"],["Bear Crawl","4 x 4, forwards and backwards"],["Arm Circles","10 each way"]];
const earlyHtml = () => progList("Early work: warm-up", EARLY_WORK);

// ---------- state ----------
const $ = id => document.getElementById(id);
let histDocs = [];
let setup = {age:"U16",hand:"R",mix:["FB","CH","CB"],fw:"base",lvl:1,des:"CH"};
try { const s = JSON.parse(localStorage.getItem("bqpen.setup")||"null"); if (s) Object.assign(setup,s); } catch(e){}
if (!Array.isArray(setup.mix) || !setup.mix.length) setup.mix = ["FB","CH","CB"];
let athleteDocs = {};
let role = null, playerName = null; // "coach", "player" or null (signed out / not linked)
let hitDocs = {}, hitDate = null, hitDraft = null, hitSeasonFor = null; // hitting rows by id (athlete slug + "_" + date)
let gameDocs = {}, gameEdit = null; // game logs by id (athlete slug + "_" + date); the date being edited
let checkinDocs = {};     // arm check-ins by id: athlete slug + "_" + date
let armBefore = null;     // arm score picked on the New pen form
let pen = null;           // current pen record
let live = null;          // runtime extras: {def, called:{p,z}, swung, gate, shape}

function plannedPitch(def, i, rec){
  const it = def.plan[i]; if (!it) return null;
  const isOS = OS_ROLES.includes(it.p);
  let k = 0; for (let j=0; j<i; j++) if (isOS ? OS_ROLES.includes(def.plan[j].p) : def.plan[j].p===it.p) k++;
  const p = rolePitch(it.p, k, rec);
  const z = rec.hand==="L" && MIRROR[it.z] ? MIRROR[it.z] : it.z;
  return {set:it.set, p, z, side:!!it.side, grp:it.grp||null, gate:!!it.gate, shape:!!it.shape, design:it.p==="D", note:it.note||""};
}
const isStrikeZone = z => z>=1 && z<=9;
const col = z => (z-1)%3, rowOf = z => Math.floor((z-1)/3);
function hitTarget(pt){
  if (pt.actual==null) return false;
  if (pt.side) return isStrikeZone(pt.actual) && isStrikeZone(pt.intended) && col(pt.actual)===col(pt.intended);
  return pt.actual===pt.intended;
}
const OS = p => p!=="FB";

// ---------- zone drawing ----------
const G = {x:80,y:50,w:160,h:200};               // strike zone
const S = {x:40,y:20,w:240,h:260};               // shadow / chase
function zoneCenter(z){
  if (isStrikeZone(z)) return [G.x+G.w*(col(z)+.5)/3, G.y+G.h*(rowOf(z)+.5)/3];
  const c = {11:[S.x+22,S.y+24],12:[S.x+S.w-22,S.y+24],13:[S.x+22,S.y+S.h-24],14:[S.x+S.w-22,S.y+S.h-24]}[z];
  return c || [S.x+S.w+16, S.y+S.h+30];
}
function zoneFromPoint(x,y){
  if (x>=G.x && x<=G.x+G.w && y>=G.y && y<=G.y+G.h){
    const c = Math.min(2,Math.floor((x-G.x)/(G.w/3))), r = Math.min(2,Math.floor((y-G.y)/(G.h/3)));
    return r*3+c+1;
  }
  if (x>=S.x && x<=S.x+S.w && y>=S.y && y<=S.y+S.h){
    const left = x < S.x+S.w/2, up = y < S.y+S.h/2;
    return up ? (left?11:12) : (left?13:14);
  }
  return 0;
}
function drawZone(svg, opts){
  const o = opts||{};
  let h = `<rect class="off" x="0" y="0" width="320" height="360"/>`;
  const mx = S.x+S.w/2, my = S.y+S.h/2;
  h += `<path class="chase" d="M${S.x},${S.y}H${mx}V${G.y}H${G.x}V${my}H${S.x}Z"/>`;
  h += `<path class="chase" d="M${mx},${S.y}H${S.x+S.w}V${my}H${G.x+G.w}V${G.y}H${mx}Z"/>`;
  h += `<path class="chase" d="M${S.x},${my}H${G.x}V${G.y+G.h}H${mx}V${S.y+S.h}H${S.x}Z"/>`;
  h += `<path class="chase" d="M${G.x+G.w},${my}H${S.x+S.w}V${S.y+S.h}H${mx}V${G.y+G.h}H${G.x+G.w}Z"/>`;
  for (let z=1; z<=9; z++){
    const x = G.x+G.w*col(z)/3, y = G.y+G.h*rowOf(z)/3;
    h += `<rect class="cell" x="${x}" y="${y}" width="${G.w/3}" height="${G.h/3}"/>`;
    if (o.numbers!==false) h += `<text class="zn" x="${x+G.w/6}" y="${y+G.h/6+6}" text-anchor="middle">${z}</text>`;
  }
  if (o.numbers!==false) [11,12,13,14].forEach(z=>{const [cx,cy]=zoneCenter(z); h+=`<text class="cn" x="${cx}" y="${cy+5}" text-anchor="middle">${z}</text>`;});
  // plate from the mound: flat front edge toward the pitcher
  const py = 300, pw = G.w*0.92, px = 160-pw/2;
  h += `<line class="box" x1="${px-14}" y1="290" x2="${px-14}" y2="352"/><line class="box" x1="${px+pw+14}" y1="290" x2="${px+pw+14}" y2="352"/>`;
  h += `<polygon class="plate" points="${px},${py+44} ${px+pw},${py+44} ${px+pw},${py+22} 160,${py+6} ${px},${py+22}"/>`;
  h += `<text class="side" x="10" y="${my+4}">LHH</text><text class="side" x="310" y="${my+4}" text-anchor="end">RHH</text>`;
  h += `<text class="side" x="8" y="350">1B side</text><text class="side" x="312" y="350" text-anchor="end">3B side</text>`;
  (o.dots||[]).forEach(d=>{const [x,y]=jitter(d); h+=`<circle cx="${x}" cy="${y}" r="${d.r||6}" fill="${d.fill||'currentColor'}" class="${d.cls||''}" opacity="${d.op||1}"/>`;});
  if (o.ring!=null){ const [x,y]=zoneCenter(o.ring); h+=`<circle class="ring" cx="${x}" cy="${y}" r="19"/>`; }
  if (o.lastX!=null){ const [x,y]=zoneCenter(o.lastX); h+=`<path class="lastx" d="M${x-9},${y-9}L${x+9},${y+9}M${x+9},${y-9}L${x-9},${y+9}"/>`; }
  svg.innerHTML = h;
}
function jitter(d){
  const [x,y] = zoneCenter(d.z); const a = (d.k*2.399)%(2*Math.PI), r = 4+((d.k*7)%14);
  return [x+Math.cos(a)*r, y+Math.sin(a)*r];
}

// ---------- arm check-ins ----------
const localDate = (d=new Date()) => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function weekDates(offset=0){
  const now = new Date(), mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay()+6)%7 + 7*offset), out = {};
  DAYS.forEach(([d],i)=>{ out[d] = localDate(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate()+i)); });
  return out;
}
// ---------- flat ground sprints (U18 pitcher-only) ----------
// Day 1 straight after the full bullpen, Day 2 (primer) after the light pen. The week's row moves on
// only once a Day 1 is done, so a missed week repeats. After week 12 it goes back to week 5.
const SPRINT_WEEKS = [
  ["4 × 20 m",0],["5 × 20 m",0],["6 × 20 m",0],["4 × 20 m (lighter week)",0],
  ["3 × 20 m + 2 × flying 10 m",2],["3 × 20 m + 3 × flying 10 m",3],["2 × 20 m + 4 × flying 10 m",4],["2 × 20 m + 2 × flying 10 m (lighter week)",2],
  ["2 × 20 m + 3 × 30 m",3],["2 × 20 m + 4 × 30 m",4],["2 × 20 m + 5 × 30 m",5],["2 × timed 20 m + 2 × 30 m (test week)",2]];
const SPRINT_DAY2 = "3 × 10 m from a staggered stance, 60 s rest";
const sprinter = name => { const a = athleteDocs[slug(name||"")]; return !!a && a.age==="U18" && a.type==="P"; };
const mondayOf = date => { const d = new Date(date+"T00:00:00"); d.setDate(d.getDate() - (d.getDay()+6)%7); return localDate(d); };
function sprintWeek(athlete, date){
  const s = slug(athlete), mon = mondayOf(date), done = new Set();
  Object.values(Object.assign({}, checkinDocs, outbox().checkins)).forEach(c=>{
    if (c && c.sprint==="d1" && slug(c.athlete||"")===s && c.date < mon) done.add(mondayOf(c.date)); });
  const n = done.size + 1;
  return n <= 12 ? n : 5 + (n-13) % 8;
}
function sprintHtml(athlete, date, day){
  const wk = sprintWeek(athlete, date), [reps, top] = SPRINT_WEEKS[wk-1], c = getCheckin(athlete, date) || {};
  const flying = /flying/.test(reps), d1 = day===1;
  const done = c.sprint ? `<div class="gnote" style="color:var(--hit)">✓ ${c.sprint==="swap" ? "Heavy pen: did 3 × 10 m instead (this week's row repeats next week)" : "Sprints done"}</div>
      <button type="button" class="small ghost" data-sprint="${date}|" style="align-self:flex-start">Undo</button>`
    : `<div class="row"><button type="button" class="small" data-sprint="${date}|${d1?"d1":"d2"}">Sprints done</button>${d1?`<button type="button" class="small ghost" data-sprint="${date}|swap">Heavy pen: did 3 × 10 m instead</button>`:""}</div>`;
  return `<div class="sprint"><div class="q">Sprints · week ${wk} · ${d1?"Day 1":"Day 2 (primer)"}</div>
    <div class="reps">${esc(d1 ? reps : SPRINT_DAY2)}</div>
    <ul><li>Straight after the bullpen, before any lifting. Re-warm 3–5 min first: A-skips, B-skips, then build-ups at 80% and 90%.</li>
      ${d1 ? `<li>Rest: 20 m 90 s–2 min${/30 m|flying/.test(reps)?", 30 m or flying 10 m 2.5–3 min":""}, 3–4 min between sets. Walk back; start the next rep only when fresh.</li>
      ${flying?`<li>Flying 10 m = 20 m build-up into 10 m at max speed.</li>`:""}
      ${top?`<li>${top} top-speed rep${top>1?"s":""} this week (max 5).</li>`:""}
      ${wk===12?`<li>Time the 20 m and compare it to week 1.</li>`:""}
      <li>Heavy or long pen and the legs feel flat: do 3 × 10 m instead.</li>` : ""}
      <li>Stop the session when a rep looks or feels flat.</li></ul>
    ${done}</div>`;
}
const checkinId = (athlete, date) => slug(athlete)+"_"+date;
function getCheckin(athlete, date){ const id = checkinId(athlete, date); return outbox().checkins[id] || checkinDocs[id] || null; }
function setCheckin(athlete, date, field, val){
  const id = checkinId(athlete, date), prev = getCheckin(athlete, date) || {id, athlete:athlete.trim(), date, before:null, after:null};
  const body = Object.assign({}, prev, {[field]:val, updatedAt:Date.now()});
  checkinDocs[id] = body;
  const ob = outbox(); ob.checkins[id] = body; saveOutbox(ob); flush();
}
function scaleHtml(key, val){
  let h = `<div class="scale" data-k="${key}" role="group">`;
  for (let i=1; i<=10; i++) h += `<button type="button" data-v="${i}" class="${val===i?'on':''}" aria-pressed="${val===i}">${i}</button>`;
  return h + `</div><div class="ends"><span>1 very sore / pain</span><span>10 feels great</span></div>`;
}
function deltaHtml(b, a){
  if (b==null || a==null) return "";
  const d = a-b, cls = d<0 ? "down" : d>0 ? "up" : "";
  return `<div class="delta">Before <b>${b}</b> → after <b>${a}</b> · <span class="${cls}">${d===0?"no change":(d>0?"+":"")+d}</span>${d<=-3?" · check in with the athlete":""}</div>`;
}
// ---------- hitting (position players) ----------
// result code, label, what it counts as
const HRES = [
  ["Hits"], ["1B","Single",{ab:1,h:1,tb:1,bip:1}], ["2B","Double",{ab:1,h:1,tb:2,bip:1}], ["3B","Triple",{ab:1,h:1,tb:3,bip:1}], ["HR","Home run",{ab:1,h:1,tb:4,bip:1}],
  ["BH","Bunt hit",{ab:1,h:1,tb:1,bip:1,bunt:1}],
  ["On base"], ["BB","Walk",{bb:1}], ["HBP","Hit by pitch",{hbp:1}], ["ROE","Reached on error",{ab:1,bip:1}], ["FC","Fielder's choice",{ab:1,bip:1}],
  ["Outs"], ["KS","K swinging",{ab:1,k:1}], ["KL","K looking",{ab:1,k:1}], ["GO","Ground out",{ab:1,bip:1}], ["FO","Fly out",{ab:1,bip:1}],
  ["LO","Line out",{ab:1,bip:1}], ["PO","Pop out",{ab:1,bip:1}], ["BO","Bunt out",{ab:1,bip:1,bunt:1}],
  ["Situation"], ["SF","Sac fly",{sf:1,bip:1}], ["SH","Sac bunt",{sh:1,bip:1,bunt:1}],
];
const HR_BY = Object.fromEntries(HRES.filter(r=>r[1]).map(r=>[r[0], r]));
// at-bats built from Ballclubz game totals (no detail on the type of out or strikeout)
Object.assign(HR_BY, {K:["K","Strikeout",{ab:1,k:1}], OUT:["OUT","Out",{ab:1,bip:1}], XPA:["XPA","HBP / sacrifice",{}]});
// days imported from Ballclubz arrive without the app's summary: work it out and save it (the live sheets read it)
function bzBackfill(games, hits){
  (games || []).forEach(g=>{ if (g && g.src==="ballclubz" && !g.summary) saveGame(Object.assign({}, g)); });
  (hits || []).forEach(h=>{ if (h && h.src==="ballclubz" && !h.summary) saveHit(Object.assign({}, h)); });
}
const isBunt = res => !!(HR_BY[res] && HR_BY[res][2].bunt);
// hard hit: thumb up / down on every result but a bunt (older at-bats used Hard / Medium / Weak contact)
// Quality at-bat: any one of these. The last three are quick taps on the at-bat screen.
const QAB_TAPS = [["p7","7+ pitches"]];   // "battled with 2 strikes" no longer counts as a QAB
// situation taps that go with any result, shown under Situation next to Sac fly / Sac bunt
const SIT_TAPS = [["adv","Moved the runner"],["r3","Scored runner from 3rd"],["hnr","Hit and run"],["sitx","Missed the situation"]];
// situational execution: executed = sac fly / sac bunt / moved the runner / scored from 3rd / hit and run; chances = those plus "Missed the situation"
const SIT_DONE = ["adv","r3","hnr"];
const sitDone = p => p.res==="SF" || p.res==="SH" || SIT_DONE.some(k=>p[k]);
function qabWhy(p){
  const c = (HR_BY[p.res]||[])[2] || {}, why = [];
  if (c.h) why.push("hit"); if (c.bb) why.push("walk"); if (c.hbp) why.push("HBP");
  if (hardOf(p)===1) why.push("hard hit"); if (p.rbi) why.push("RBI"); if (p.r3) why.push("runner from 3rd");
  if (c.sh || c.sf) why.push("sacrifice"); if (p.adv) why.push("moved the runner"); if (p.hnr) why.push("hit and run");
  QAB_TAPS.forEach(([k,l])=>{ if (p[k]) why.push(l.toLowerCase()); });
  return why;
}
const hardOf = p => p.hh!=null ? p.hh : p.qual && (HR_BY[p.res]||[])[2]?.bip ? (p.qual==="H" ? 1 : 0) : null;
const isHitter = name => { const a = athleteDocs[slug(name||"")]; return !!a && (a.type==="POS" || a.type==="TWO"); };
const hitId = (athlete, date) => slug(athlete)+"_"+date;
function getHit(athlete, date){ const id = hitId(athlete, date); return outbox().hits[id] || hitDocs[id] || null; }
function athleteHits(athlete){ const s = slug(athlete); return Object.values(Object.assign({}, hitDocs, outbox().hits)).filter(h=>h && slug(h.athlete)===s).sort((a,b)=>b.date.localeCompare(a.date)); }
function saveHit(body){ body.updatedAt = Date.now(); body.summary = hitSummary(body.pas||[]); hitDocs[body.id] = body; const ob = outbox(); ob.hits[body.id] = body; saveOutbox(ob); flush(); }
function hitStats(pas){
  const t = {pa:0,ab:0,h:0,tb:0,bb:0,hbp:0,k:0,sf:0,sh:0,bip:0,bunt:0,hard:0,rated:0,rbi:0,xbh:0,r3:0,qab:0,sit:0,sitn:0};
  pas.forEach(p=>{ const c = (HR_BY[p.res]||[])[2] || {}; t.pa++; for (const k in c) t[k] += c[k];
    const hh = hardOf(p); if (hh!=null){ t.rated++; t.hard += hh; }
    if (p.r3) t.r3++; if (qabWhy(p).length) t.qab++; if (sitDone(p)){ t.sit++; t.sitn++; } else if (p.sitx) t.sitn++; t.rbi += p.rbi||0; if (["2B","3B","HR"].includes(p.res)) t.xbh++; });
  const r = (a,b) => b ? a/b : null;
  t.avg = r(t.h,t.ab); t.obp = r(t.h+t.bb+t.hbp, t.ab+t.bb+t.hbp+t.sf); t.slg = r(t.tb,t.ab);
  t.ops = t.obp!=null && t.slg!=null ? t.obp+t.slg : null; t.kp = r(t.k,t.pa); t.bbp = r(t.bb,t.pa); t.hardp = r(t.hard,t.rated); t.qabp = r(t.qab,t.pa); t.sitp = r(t.sit,t.sitn);
  return t;
}
// every list of people is A to Z by surname (then first name), ignoring capitals
// names start with a capital: "zavier leigh" becomes "Zavier Leigh" (the rest is left as typed)
const capName = n => String(n||"").trim().replace(/\s+/g," ").replace(/(^|[ -])(\p{Ll})/gu, (m, a, b) => a + b.toUpperCase());
document.addEventListener("change", e=>{ const t = e.target;
  if (t.matches && t.matches("#w-ath,#f-ath,#h-ath,#cn-name,#j-name,#a-name,#p-name,input[data-cn]") && t.value !== capName(t.value)) t.value = capName(t.value); }, true);
const surname = n => String(n||"").trim().split(/\s+/).pop();
const byName = (a, b) => surname(a).localeCompare(surname(b), "en", {sensitivity:"base"}) || String(a||"").localeCompare(String(b||""), "en", {sensitivity:"base"});
const avgFmt = v => v==null ? "–" : (v>=1 ? v.toFixed(3) : v.toFixed(3).replace(/^0/,""));
const pctFmt = v => v==null ? "–" : Math.round(v*100)+"%";
// every at-bat of a game, read-only (result, hard hit, spray zone, RBI, situation taps, QAB)
function abListHtml(pas){
  return `<div class="palist">${pas.map((p,i)=>`<div class="prow"><div><b>${i+1}.</b> ${qabWhy(p).length?'<span class="qab">QAB ✓</span>':""}${esc((HR_BY[p.res]||[,p.res])[1])}${p.hh!=null ? (p.hh ? " · 👍" : " · 👎") : p.qual?` · ${({H:"hard",M:"medium",W:"weak"})[p.qual]}`:""}${p.zone?` · ${esc(p.zone)}`:""}${(m=>m.length?`<div class="m">${m.join(" · ")}</div>`:"")([p.rbi?p.rbi+" RBI":"", ...SIT_TAPS.concat(QAB_TAPS).filter(([k])=>p[k]).map(([,l])=>l)].filter(Boolean))}</div></div>`).join("")}</div>`;
}
// Direction of a ball in play, from home plate: negative is the left side. Up the middle is between where the
// shortstop and second baseman stand; pull and opposite field are everything outside them (by batting side).
const SS_2B_ANGLE = 15;
const sprayAngle = p => p.x==null ? null : Math.atan2(p.x*FIELD.w - FIELD.hx, FIELD.hy - p.y*FIELD.h)*180/Math.PI;
// Coaches' read on a hitter, once 5 games are logged: where they hit it, how they hit it, and how they go out
const TEND_GAMES = 5;
function hitTendencyHtml(games, bats){
  if (games.length < TEND_GAMES) return `<div class="gnote">Tendency shows once ${TEND_GAMES} games are logged (${games.length} so far).</div>`;
  const pas = games.flatMap(h=>h.pas||[]), t = hitStats(pas), n = c => pas.filter(p=>p.res===c).length, pc = (a,b) => Math.round(100*a/b), out = [];
  const ang = pas.filter(p=>p.zone && p.zone!=="Foul").map(sprayAngle).filter(a=>a!=null);
  if (ang.length >= 5){
    const l = ang.filter(a=>a < -SS_2B_ANGLE).length, r = ang.filter(a=>a > SS_2B_ANGLE).length, m = ang.length - l - r;
    const [pull, oppo] = bats==="L" ? [r, l] : [l, r], sided = bats==="R" || bats==="L";
    if (sided && pc(pull, ang.length) >= 50) out.push(`Pull hitter: ${pc(pull, ang.length)}% of balls in play pulled`);
    else if (sided && pc(oppo, ang.length) >= 45) out.push(`Goes the other way: ${pc(oppo, ang.length)}% to the opposite field`);
    else if (!sided && pc(Math.max(l, r), ang.length) >= 50) out.push(`Mostly to the ${l>r?"left":"right"} side: ${pc(Math.max(l, r), ang.length)}% of balls in play`);
    else if (pc(m, ang.length) >= 45) out.push(`Up the middle: ${pc(m, ang.length)}% of balls in play`);
    else out.push("Uses the whole field");
  }
  const ground = n("GO") + n("FC"), air = n("FO") + n("PO") + n("SF"), line = n("LO"), contact = ground + air + line;
  if (contact >= 5){
    if (pc(ground, contact) >= 50) out.push(`On the ground a lot: ${pc(ground, contact)}% of outs in play are ground balls`);
    else if (pc(air, contact) >= 50) out.push(`In the air a lot: ${pc(air, contact)}% of outs in play are fly or pop outs`);
  }
  if (t.rated >= 5){
    if (t.hardp >= .45) out.push(`Hits it hard: ${pctFmt(t.hardp)} hard-hit`);
    else if (t.hardp <= .2) out.push(`Soft contact: only ${pctFmt(t.hardp)} hard-hit`);
  }
  if (t.pa >= 10 && t.kp >= .25) out.push(`Strikes out ${pctFmt(t.kp)} of the time${n("KL") > n("KS") ? ", more often looking" : ""}`);
  else if (t.k >= 3 && n("KL") > n("KS")) out.push("Strikes out looking more than swinging");
  if (t.pa >= 10 && t.bbp >= .12) out.push(`Patient: walks ${pctFmt(t.bbp)} of the time`);
  if (t.pa >= 10) out.push(`QAB ${pctFmt(t.qabp)}`);
  return `<div class="label" style="margin-top:8px">Tendency <span>· ${games.length} games</span></div>
    <ul style="margin:0;padding-left:18px">${out.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
}
// A read of the coaches' game notes (not the results), once more than 3 games have notes: the things that
// come up in more than one game, then the latest notes word for word.
const NOTE_STOP = new Set("the a an and or but to of in on at for with from was were is are be been it its this that these those he she they his her their him them we our you your i me my not no so too very just than then there here when what which who how all any some more most less much many one two three got get gets had has have did does do out up down over into off again also only still well good bit lot really".split(" "));
function notesSummaryHtml(games){
  const noted = games.filter(g=>g.notes && g.notes.trim()).sort((x,y)=>y.date.localeCompare(x.date));
  if (noted.length <= 3) return noted.length ? `<div class="gnote" style="margin-top:8px">Notes summary shows once more than 3 games have notes (${noted.length} so far).</div>` : "";
  const seen = {};   // phrase -> set of game dates
  noted.forEach(g=>{
    const w = g.notes.toLowerCase().replace(/[^a-z0-9' ]+/g," ").split(/\s+/).filter(x=>x.length>2 && !NOTE_STOP.has(x));
    const grams = new Set();   // words and runs of up to 4 words
    for (let n = 1; n <= 4; n++) for (let i = 0; i + n <= w.length; i++) grams.add(w.slice(i, i+n).join(" "));
    grams.forEach(k=>{ (seen[k] = seen[k] || new Set()).add(g.date); });
  });
  let themes = Object.entries(seen).map(([k,d])=>[k, d.size]).filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1] || b[0].split(" ").length-a[0].split(" ").length);
  themes = themes.filter(([k,n])=>!themes.some(([k2,n2])=>k2!==k && n2>=n && (" "+k2+" ").includes(" "+k+" "))).slice(0,6);   // "front side flying open" over "front side"
  const dd = s => new Date(s+"T00:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short"});
  return `<div class="label" style="margin-top:10px">Notes summary <span>· ${noted.length} games with notes</span></div>
    ${themes.length ? `<div class="gnote">Comes up again and again: ${themes.map(([k,n])=>`<b>${esc(k)}</b> (${n} games)`).join(", ")}</div>` : `<div class="gnote">No theme comes up in more than one game yet.</div>`}
    <div class="palist">${noted.slice(0,3).map(g=>`<div class="prow"><div><div class="m">${dd(g.date)}${g.opp?` · vs ${esc(g.opp)}`:""}</div>${esc(g.notes)}</div></div>`).join("")}</div>`;
}
// season spray chart and a breakdown of results, where the ball went, and situations
function hitBreakdownHtml(pas, id, bats){
  const n = c => pas.filter(p=>p.res===c).length, row = (label, v, of) => v ? `<tr><td>${label}</td><td>${v}</td><td>${of ? Math.round(100*v/of)+"%" : ""}</td></tr>` : "";
  const pa = pas.length, bip = pas.filter(p=>p.zone && p.zone!=="Foul");
  const zones = ["LF","LC","CF","RC","RF","3B","SS","Up the middle","2B","1B"].map(z=>[z, bip.filter(p=>p.zone===z).length]).filter(([,v])=>v);
  const side = bip.map(p=>sprayAngle(p)).filter(a=>a!=null), left = side.filter(a=>a < -SS_2B_ANGLE).length,
    right = side.filter(a=>a > SS_2B_ANGLE).length, mid = side.length - left - right;
  const dots = pas.filter(p=>p.x!=null).map(p=>({x:p.x, y:p.y, c:dotColour(p.res), r:5}));
  const results = [["Single","1B"],["Double","2B"],["Triple","3B"],["Home run","HR"],["Bunt hit","BH"],["Walk","BB"],["Hit by pitch","HBP"],["Reached on error","ROE"],["Fielder's choice","FC"],
    ["K swinging","KS"],["K looking","KL"],["Ground out","GO"],["Fly out","FO"],["Line out","LO"],["Pop out","PO"],["Bunt out","BO"],["Sac fly","SF"],["Sac bunt","SH"]].map(([l,c])=>row(l, n(c), pa)).join("");
  const sit = [["RBI", pas.reduce((a,p)=>a+(p.rbi||0),0)], ...SIT_TAPS.concat(QAB_TAPS).map(([k,l])=>[l, pas.filter(p=>p[k]).length])].map(([l,v])=>row(l, v)).join("");
  return `${dots.length ? `<div class="label" style="margin-top:8px">Spray chart <span>· every ball in play</span></div>${fieldSvg(id, dots)}
      <div class="legend"><span><i style="background:var(--hit)"></i>Hit</span><span><i style="background:var(--miss)"></i>Out</span><span><i style="background:var(--gold)"></i>Error</span></div>` : ""}
    ${side.length ? `<div class="gnote">Balls in play: ${side.length} · ${(([pull, oppo], pc) => bats==="R" || bats==="L"
        ? `pull ${pc(pull)} · up the middle ${pc(mid)} · opposite field ${pc(oppo)}`
        : `left side ${pc(left)} · up the middle ${pc(mid)} · right side ${pc(right)}`)(bats==="L" ? [right, left] : [left, right], v=>Math.round(100*v/side.length)+"%")}</div>` : ""}
    <div class="label" style="margin-top:8px">Breakdown</div>
    <div class="scroll"><table class="log"><tr><th>Result</th><th>#</th><th>% of PA</th></tr>${results}</table></div>
    ${zones.length ? `<div class="scroll" style="margin-top:8px"><table class="log"><tr><th>Where it went</th><th>#</th><th>%</th></tr>${zones.map(([z,v])=>row(z, v, bip.length)).join("")}</table></div>` : ""}
    ${sit ? `<div class="scroll" style="margin-top:8px"><table class="log"><tr><th>Situations</th><th>#</th><th></th></tr>${sit}</table></div>` : ""}`;
}
function gameLine(pas){
  const t = hitStats(pas), extras = [];
  ["2B","3B","HR"].forEach(c=>{ const n = pas.filter(p=>p.res===c).length; if (n) extras.push((n>1?n:"")+c); });
  if (t.bb) extras.push((t.bb>1?t.bb:"")+"BB"); if (t.hbp) extras.push((t.hbp>1?t.hbp:"")+"HBP"); if (t.k) extras.push((t.k>1?t.k:"")+"K");
  return `${t.h}-for-${t.ab}${extras.length?", "+extras.join(", "):""}${t.rbi?` · ${t.rbi} RBI`:""}${t.pa?` · QAB ${t.qab}/${t.pa}`:""}`;
}
// Field from the hitter's view: home at the bottom, left field on the left. Points are stored 0-1.
const FIELD = {w:300, h:262, hx:150, hy:248, r:205};
function fieldZone(x, y){
  const dx = x*FIELD.w - FIELD.hx, dy = FIELD.hy - y*FIELD.h, ang = Math.atan2(dx, dy)*180/Math.PI, dist = Math.hypot(dx, dy);
  if (Math.abs(ang) > 45) return "Foul";
  if (dist < FIELD.r*155/330) return ang < -27 ? "3B" : ang < -6 ? "SS" : ang <= 6 ? "Up the middle" : ang <= 27 ? "2B" : "1B";
  return ang < -27 ? "LF" : ang < -9 ? "LC" : ang <= 9 ? "CF" : ang <= 27 ? "RC" : "RF";
}
function fieldSvg(id, dots){
  // to scale: fence at 330 ft = r; 90 ft basepaths, mound at 60.5 ft, infield dirt 95 ft around the mound
  const {w,h,hx,hy,r} = FIELD, ft = r/330, a = Math.PI/4, lx = hx - r*Math.sin(a), ly = hy - r*Math.cos(a), rx = hx + r*Math.sin(a);
  const bp = 90*ft*Math.SQRT1_2, B1 = [hx+bp, hy-bp], B2 = [hx, hy-2*bp], B3 = [hx-bp, hy-bp], M = [hx, hy-60.5*ft];
  const base = ([x,y])=>`<rect class="base" x="${x-3.5}" y="${y-3.5}" width="7" height="7" transform="rotate(45 ${x} ${y})"/>`;
  const fair = `M${hx},${hy} L${lx},${ly} A${r},${r} 0 0 1 ${rx},${ly} Z`;
  const c = [hx, hy-bp], pull = ([x,y], k) => [x+(c[0]-x)*k, y+(c[1]-y)*k];   // infield grass: inside the basepaths
  const ig = [pull([hx,hy],0.3), pull(B1,0.18), pull(B2,0.18), pull(B3,0.18)];
  let g = `<defs><clipPath id="${id}-fair"><path d="${fair}"/></clipPath></defs><path class="grass" d="${fair}"/>`;
  g += `<g clip-path="url(#${id}-fair)"><circle class="dirt" cx="${M[0]}" cy="${M[1]}" r="${95*ft}"/>`;
  g += `<path class="grass" d="M${ig.map(p=>p.join(",")).join(" L")} Z"/></g>`;
  g += `<circle class="dirt" cx="${M[0]}" cy="${M[1]}" r="${9*ft}"/><circle class="dirt" cx="${hx}" cy="${hy}" r="${13*ft}"/>`;
  g += `<path class="line" d="M${lx},${ly} L${hx},${hy} L${rx},${ly}"/>`;
  g += base(B1) + base(B2) + base(B3) + `<path class="base" d="M${hx-3.5},${hy-3} h7 v3 l-3.5,3 l-3.5,-3 z"/>`;
  g += [["LF",-36,170],["LC",-18,182],["CF",0,188],["RC",18,182],["RF",36,170]].map(([t,ang,dist])=>`<text class="lbl" text-anchor="middle" x="${hx+dist*Math.sin(ang*Math.PI/180)}" y="${hy-dist*Math.cos(ang*Math.PI/180)}">${t}</text>`).join("");
  g += (dots||[]).map(p=>`<circle cx="${p.x*w}" cy="${p.y*h}" r="${p.r||6}" fill="${p.c}" stroke="var(--surface)" stroke-width="1.5"/>`).join("");
  return `<svg class="field" id="${id}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Baseball field">${g}</svg>`;
}
const dotColour = res => ["1B","2B","3B","HR","BH"].includes(res) ? "var(--hit)" : res==="ROE" ? "var(--gold)" : "var(--miss)";
function hitAthlete(){ return role==="player" ? playerName : $("h-ath").value.trim(); }
function renderHit(){
  if ($("v-hit").hidden) return;
  const ath = hitAthlete(), date = hitDate || localDate(), coach = role!=="player";
  $("h-ath").readOnly = !coach; if (!coach) $("h-ath").value = playerName || "";
  $("h-date").value = date;
  const prof = ath ? athleteDocs[slug(ath)] : null, hitter = isHitter(ath);
  $("h-typewrap").hidden = !coach || !ath;
  $("h-type").querySelectorAll("button").forEach(b=>b.classList.toggle("on", !!prof && prof.type===b.dataset.v));
  $("h-batswrap").hidden = !coach || !hitter;
  $("h-bats").querySelectorAll("button").forEach(b=>b.classList.toggle("on", !!prof && prof.bats===b.dataset.v));
  $("h-note").textContent = !ath ? "Enter the player's name to track their at-bats."
    : !hitter ? (coach ? `Mark ${ath} as a position player or two-way to track hitting.` : "Hitting is tracked for position players. Ask your coach to set you up.") : "";
  ["h-game","h-entry","h-season"].forEach(id=>$(id).hidden = !hitter);
  const doc = hitter ? getHit(ath, date) : null, pas = doc ? doc.pas : [];
  const showOpp = hitter && (oppOpen || !!(doc && doc.opp));
  $("h-oppwrap").hidden = !showOpp; $("h-oppadd").hidden = !hitter || showOpp; $("h-noteswrap").hidden = !hitter;
  if (!hitter) return;
  $("h-opp").value = (doc && doc.opp) || "";
  $("h-noteswrap").hidden = false; $("h-gnotes").value = (doc && doc.notes) || "";
  // this game
  $("h-game").innerHTML = `<div class="livehead"><div><div class="label" style="margin:0">${new Date(date+"T00:00:00").toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"short"})}</div><div class="hitline">${pas.length ? gameLine(pas) : "No at-bats yet"}</div></div></div>
    ${pas.length ? `<div class="palist">${pas.map((p,i)=>`<div class="prow"><div><b>${i+1}.</b> ${qabWhy(p).length?'<span class="qab">QAB ✓</span>':""}${esc(HR_BY[p.res][1])}${p.hh!=null ? (p.hh ? " · 👍 hard hit" : " · 👎") : p.qual?` · ${({H:"hard",M:"medium",W:"weak"})[p.qual]}`:""}${p.zone?` · ${esc(p.zone)}`:""}${(m=>m.length?`<div class="m">${m.join(" · ")}</div>`:"")([p.rbi?p.rbi+" RBI":"", ...SIT_TAPS.concat(QAB_TAPS).filter(([k])=>p[k]).map(([,l])=>l)].filter(Boolean))}</div><button class="small ghost" data-parm="${i}">Remove</button></div>`).join("")}</div>` : ""}`;
  // new plate appearance
  const d = hitDraft = hitDraft || {res:null, hh:null, r3:0, p6:0, adv:0, two:0, x:null, y:null, zone:null, rbi:0};
  const bip = d.res && (HR_BY[d.res][2].bip);
  const segBtns = (key, n, label) => `<div><div class="label">${label}</div><div class="seg" data-hk="${key}">${Array.from({length:n},(_,i)=>`<button type="button" data-v="${i}" class="${d[key]===i?'on':''}">${i}</button>`).join("")}</div></div>`;
  $("h-entry").innerHTML = `<h2>At-bat ${pas.length+1}</h2>
    <div><div class="label">Result</div><div class="hres">${HRES.map(r=>r[1] ? `<button type="button" data-hres="${r[0]}" class="${d.res===r[0]?'on':''}">${r[1]}</button>` : `<div class="grp">${r[0]}</div>`).join("")}${SIT_TAPS.map(([k,l])=>`<button type="button" data-htog="${k}" class="${d[k]?'on':''}">${l}</button>`).join("")}</div></div>
    ${d.res && !isBunt(d.res) ? `<div><div class="label">Hard hit ball?</div><div class="seg" data-hk="hh">${[[1,"👍 Yes"],[0,"👎 No"]].map(([v,l])=>`<button type="button" data-v="${v}" class="${d.hh===v?'on':''}">${l}</button>`).join("")}</div></div>` : ""}
    ${bip ? `<div><div class="label">Where it went <span>· tap the field${d.zone?` · ${esc(d.zone)}`:""}</span></div>${fieldSvg("h-field", d.x!=null ? [{x:d.x, y:d.y, c:dotColour(d.res), r:8}] : [])}</div>` : ""}
    ${segBtns("rbi",5,"RBI")}
    ${d.res ? `<div><div class="label">Quality at-bat <span>· tap any that happened</span></div><div class="checklist">${QAB_TAPS.map(([k,l])=>`<button type="button" data-htog="${k}" class="${d[k]?'on':''}">${l}</button>`).join("")}</div>
      <div class="gnote" style="margin-top:8px">${(w=>w.length ? `<span class="qab">QAB ✓</span>${esc(w.join(", "))}` : `<span class="qab no">Not a QAB yet</span>`)(qabWhy(d))}</div></div>` : ""}
    <div class="notice" id="h-msg" hidden></div>
    <button class="primary" id="h-save" ${d.res?"":"disabled"}>Save at-bat</button>`;
  // season
  const all = athleteHits(ath), seasonPas = all.flatMap(h=>h.pas||[]), t = hitStats(seasonPas);
  const tiles = [["QAB %",pctFmt(t.qabp)],["Hard-hit %",pctFmt(t.hardp)],["Situational %",pctFmt(t.sitp)],["AVG",avgFmt(t.avg)],["OBP",avgFmt(t.obp)],["SLG",avgFmt(t.slg)],["OPS",avgFmt(t.ops)],["PA",t.pa],["K%",pctFmt(t.kp)],["BB%",pctFmt(t.bbp)]];
  const dots = seasonPas.filter(p=>p.x!=null).map(p=>({x:p.x, y:p.y, c:dotColour(p.res), r:5}));
  $("h-season").innerHTML = `<h2>${esc(ath)} · season</h2>
    <div class="gstats">${tiles.map(([k,v])=>`<div><b>${v}</b><span>${k}</span></div>`).join("")}</div>
    <div class="gnote">${t.h} H · ${t.xbh} XBH · ${t.rbi} RBI${t.bunt?` · ${t.bunt} bunt${t.bunt>1?"s":""}`:""}${t.r3?` · ${t.r3} runner${t.r3>1?"s":""} scored from 3rd`:""}</div>
    ${dots.length ? `<div class="label" style="margin-top:6px">Spray chart</div>${fieldSvg("h-spray", dots)}<div class="legend"><span><i style="background:var(--hit)"></i>Hit</span><span><i style="background:var(--miss)"></i>Out</span><span><i style="background:var(--gold)"></i>Error</span></div>` : ""}
    ${all.length ? `<div class="label" style="margin-top:6px">Games</div><div class="palist">${all.map(h=>`<div class="prow" data-hdate="${h.date}" style="cursor:pointer"><div>${new Date(h.date+"T00:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short"})}${h.opp?` · vs ${esc(h.opp)}`:""}</div><b>${gameLine(h.pas||[])}</b></div>`).join("")}</div>` : ""}`;
  if (hitSeasonFor !== slug(ath)) loadHitSeason(ath);
}
async function loadHitSeason(ath){
  hitSeasonFor = slug(ath);
  if (!sb || !role) return;
  const {data, error} = await sb.from("hitting").select("data").eq("athlete_slug", slug(ath)).order("day",{ascending:false}).limit(200);
  if (error) return;
  data.forEach(r=>{ hitDocs[r.data.id] = r.data; }); lsSet("bqpen.hits", hitDocs); renderHit();
}
function setAthleteType(name, type){ setAthleteField(name, {type}); }
function setAthleteField(name, patch){
  const id = slug(name), body = Object.assign({name}, athleteDocs[id] || {age:setup.age}, patch, {updatedAt:Date.now()});
  athleteDocs[id] = body; const ob = outbox(); ob.athletes[id] = body; saveOutbox(ob); flush();
}
const BATS_NAME = {R:"bats right", L:"bats left", S:"switch hitter"};
function renderTeamHits(dates){
  if (pitchingOnly()){ $("team-hits").innerHTML = ""; return; }
  const rows = Object.values(Object.assign({}, hitDocs, outbox().hits)).filter(h=>h && Object.values(dates).includes(h.date) && inGroup(h.athlete));
  const by = {}; rows.forEach(h=>{ (by[h.athlete] = by[h.athlete] || []).push(h); });
  const names = Object.keys(by).sort(byName);
  $("team-hits").innerHTML = names.length ? `<div class="label" style="margin-top:6px">Hitting ${teamWeek?"last":"this"} week</div><div class="scroll"><table class="log team"><tr><th>Player</th><th>H</th><th>BB</th><th>K</th><th>AVG</th><th>OPS</th><th>QAB</th><th title="Hard-hit %">👍</th></tr>${names.map(n=>{
    const t = hitStats(by[n].flatMap(h=>h.pas||[]));
    return `<tr data-ath="${esc(n)}" style="cursor:pointer"><td><b>${esc(n)}</b></td><td>${t.h}</td><td>${t.bb}</td><td>${t.k}</td><td>${avgFmt(t.avg)}</td><td>${avgFmt(t.ops)}</td><td>${pctFmt(t.qabp)}</td><td>${pctFmt(t.hardp)}</td></tr>`; }).join("")}</table></div>` : "";
}

// ---------- reliever weeks ----------
const addDays = (date, n) => { const d = new Date(date+"T00:00:00"); d.setDate(d.getDate()+n); return localDate(d); };
const usesGameWeeks = (age, monday) => GAME_WEEK_AGES.includes(age) && monday >= GAME_WEEK_FROM;
function athleteGames(athlete){
  const s = slug(athlete), ob = outbox(), out = {};
  Object.values(Object.assign({}, gameDocs, ob.games)).forEach(g=>{ if (g && slug(g.athlete)===s && !ob.gdel.includes(g.id)) out[g.date] = g; });
  return out;
}
// -> {types:{Mon:"rec",...}, unavailable:{date:previousOutingDate}}
function buildGameWeek(dates, games, age, forced){
  const BASE = baseWeek(age); forced = forced || {};
  // outings that count, oldest first, looking back far enough to catch down days that spill into Monday
  const counted = [], unavailable = {};
  Object.keys(games).filter(d=>d>=addDays(dates.Mon,-2) && d<=dates.Sun && games[d].pitched).sort().forEach(d=>{
    const last = counted[counted.length-1];
    if (last && d <= addDays(last, 2)) unavailable[d] = last; else counted.push(d);
  });
  const down = {};
  counted.forEach(d=>{ down[addDays(d,1)] = "tol"; down[addDays(d,2)] = "light"; });
  const types = {}, fixed = {};
  DAYS.forEach(([k])=>{ const dt = dates[k];
    if (games[dt]){ types[k] = "game"; fixed[k] = true; }
    else if (forced[k]){ types[k] = forced[k]; fixed[k] = true; }   // calendar off / travel days
    else if (down[dt]){ types[k] = down[dt]; fixed[k] = true; }
    else types[k] = BASE[k];
  });
  const pitched = counted.some(d=>d>=dates.Mon && d<=dates.Sun);
  const penDay = DAYS.map(([k])=>k).find(k=>types[k]==="pen");
  if (pitched){ if (penDay) types[penDay] = "rec"; }
  else {
    // keep the full bullpen, but never on a game day, a down day or the day before a game
    const ok = k => !fixed[k] && k!=="Sun" && (age==="U18" ? k==="Wed" || !games[addDays(dates[k],1)] : !games[addDays(dates[k],1)]);
    // U18: always Wednesday unless the Wednesday itself is a game, down day, day off or travel day
    if (!penDay || !ok(penDay)){
      const to = penOrder(age).find(ok);
      if (to){
        if (penDay) types[penDay] = types[to]==="pen" ? BASE[penDay] : types[to];
        types[to] = "pen";
        // U16: keep the order low intent → bullpen → recovery around the moved bullpen
        if (age==="U16"){
          const i = DAYS.findIndex(([k])=>k===to), prev = i>0 && DAYS[i-1][0], next = i<6 && DAYS[i+1][0];
          DAYS.forEach(([k])=>{ if (!fixed[k] && types[k]==="lt") types[k] = "rec"; });
          if (prev && !fixed[prev] && types[prev]==="rec") types[prev] = "lt";
          if (next && !fixed[next] && types[next]==="lt") types[next] = "rec";
        }
      }
    }
  }
  return {types, unavailable, pitched};
}
function canRemoveGame(date){ return role!=="player" || date >= localDate(); }
function toggleGameDay(athlete, date){
  const g = athleteGames(athlete)[date];
  if (!g){ saveGame({id: checkinId(athlete, date), athlete: athlete.trim(), date, pitched:false, updatedAt: Date.now()}); return; }
  if (!canRemoveGame(date)) return;
  delete gameDocs[g.id];
  const ob = outbox(); delete ob.games[g.id]; if (!ob.gdel.includes(g.id)) ob.gdel.push(g.id); saveOutbox(ob); flush();
}
const hasStats = g => GAME_FIELDS.some(([k])=>g[k]!=null);

// ---------- game logs ----------
const GAME_FIELDS = [
  ["ip","Innings","text","e.g. 4.2"],["pitches","Pitches"],["strikes","Strikes"],
  ["bf","Batters faced"],["fps","1st-pitch strikes"],["c11","1-1 counts"],["c11w","1-1 counts won"],
  ["r2k","Got to 2 strikes first"],["p2k","2-strike pitches"],["os2k","2-strike offspeed"],
  ["k","Strikeouts (K)"],["bb","Walks (BB)"],["h","Hits"],["topVelo","Top velo (mph)"],
  // under "More"
  ["hbp","Hit by pitch",,,1],
  ["r","Runs",,,1],["er","Earned runs",,,1],["hr","Home runs",,,1],["wp","Wild pitches",,,1],
];
// pitchers chase winning 70% of their 1-1 counts
const C11_TARGET = 70, STRIKE_GOAL = 60, FPS_GOAL = 60, OS2K_GOAL = 60, QAB_GOAL = 60, HARD_GOAL = 50, SIT_GOAL = 60;   // BQ approach goals
// Pitch Smart guidelines for 15-18 year olds (daily max by age; rest days by pitch count)
const PITCH_MAX = {U16:95, U18:105};
const restDays = n => n>=76 ? 4 : n>=61 ? 3 : n>=46 ? 2 : n>=31 ? 1 : 0;
function getGame(athlete, date){ const id = checkinId(athlete, date); return outbox().games[id] || gameDocs[id] || null; }
function ipOuts(ip){ const m = /^(\d+)(?:\.([012]))?$/.exec(String(ip||"").trim()); return m ? (+m[1])*3 + (+(m[2]||0)) : null; }
function athleteAge(athlete){ const a = athleteDocs[slug(athlete)]; return (a && a.age) || setup.age; }
function gameSummaryHtml(g, athlete){
  const outs = ipOuts(g.ip), inn = outs ? outs/3 : null, n = v => v==null ? null : +v;
  const P = n(g.pitches), S = n(g.strikes), B = g.balls!=null ? n(g.balls) : (P!=null && S!=null ? P-S : null);
  const pct = (a,b) => a!=null && b ? Math.round(100*a/b)+"%" : "–";
  const cells = [
    ["IP", g.ip || "–"], ["Pitches", P ?? "–"], ["Strike %", pct(S,P)], ["1st-pitch strike %", pct(n(g.fps), n(g.bf))], [`1-1 win % · goal ${C11_TARGET}`, pct(n(g.c11w), n(g.c11))],
    ["Race to 2K %", pct(n(g.r2k), n(g.bf))], [`2K offspeed % · goal ${OS2K_GOAL}`, pct(n(g.os2k), n(g.p2k))],
    ["K", g.k ?? "–"], ["BB", g.bb ?? "–"], ["H", g.h ?? "–"], ["R / ER", (g.r ?? "–")+" / "+(g.er ?? "–")],
    ["HBP", g.hbp ?? "–"], ["HR", g.hr ?? "–"], ["WHIP", inn && (g.bb!=null || g.h!=null) ? ((n(g.bb)||0)+(n(g.h)||0)) / inn : null],
    ["P / inning", inn && P!=null ? P/inn : null], ["Top velo", g.topVelo ? g.topVelo+" mph" : null],
  ].map(([k,v])=>[k, typeof v==="number" && (k==="WHIP" || k==="P / inning") ? v.toFixed(k==="WHIP"?2:1) : (v ?? "–")])
   .filter(([k,v])=>v!=="–" && v!=="– / –");   // only what was logged
  const max = PITCH_MAX[athleteAge(athlete)];
  let notes = [];
  if (S!=null && B!=null) notes.push(`${S} strikes, ${B} balls`);
  if (g.k!=null && g.bb) notes.push(`K/BB ${(g.k/g.bb).toFixed(1)}`);
  if (g.wp) notes.push(`${g.wp} wild pitch${g.wp==1?"":"es"}`);
  let warn = "";
  if (P!=null && max){
    if (P>max) warn = `Over the Pitch Smart daily max (${max} for ${athleteAge(athlete)})`;
    notes.push(`Pitch Smart rest: ${restDays(P)} day${restDays(P)===1?"":"s"}`);
  }
  return `${g.opp?`<div class="gnote">vs ${esc(g.opp)}</div>`:""}<div class="gstats">${cells.map(([k,v])=>`<div><b${k.startsWith("1-1") ? ` style="color:var(${parseInt(v)>=C11_TARGET?"--hit":"--miss"})"` : ""}>${esc(v)}</b><span>${k}</span></div>`).join("")}</div>
    ${notes.length?`<div class="gnote">${esc(notes.join(" · "))}</div>`:""}${warn?`<div class="gwarn">${esc(warn)}</div>`:""}${g.notes?`<div class="gnote">${esc(g.notes)}</div>`:""}`;
}
function gameFormHtml(g){
  g = g || {};
  return `<div class="gform">
    <label class="wide">Opponent<input data-f="opp" maxlength="60" value="${esc(g.opp||"")}" placeholder="e.g. Brisbane North"></label>
    ${GAME_FIELDS.filter(f=>!f[4]).map(([k,l,type,ph])=>`<label>${l}<input data-f="${k}" ${type==="text"?'inputmode="decimal"':'type="number" min="0" step="1" inputmode="numeric"'} value="${g[k]??""}" ${ph?`placeholder="${ph}"`:""}></label>`).join("")}
    <details class="gmore wide" ${GAME_FIELDS.some(f=>f[4] && g[f[0]]!=null) ? "open" : ""}><summary>More (runs, HR, HBP, wild pitches)</summary><div class="gform">
    ${GAME_FIELDS.filter(f=>f[4]).map(([k,l])=>`<label>${l}<input data-f="${k}" type="number" min="0" step="1" inputmode="numeric" value="${g[k]??""}"></label>`).join("")}</div></details>
    <label class="wide">Notes<input data-f="notes" maxlength="300" value="${esc(g.notes||"")}" placeholder="What worked, anything to follow up"></label>
  </div>
  <div class="notice gmsg" hidden></div>
  <div class="row"><button class="small primary" data-gsave>Save game</button><button class="small ghost" data-gcancel>Cancel</button></div>`;
}
function gameHtml(athlete, date){
  const g = getGame(athlete, date);
  if (gameEdit===date) return `<div class="glog" data-game="${date}"><div class="q">Game log · ${esc(athlete)}</div>${gameFormHtml(g)}</div>`;
  if (g && hasStats(g)) return `<div class="glog" data-game="${date}"><div class="q">Game log · ${esc(athlete)}</div>${gameSummaryHtml(g, athlete)}<button class="small ghost" data-gopen>Edit game log</button></div>`;
  return `<div class="glog" data-game="${date}"><button class="small" data-gopen>Log this game · ${esc(athlete)}</button></div>`;
}
function readGameForm(box, athlete, date){
  const val = f => (box.querySelector(`[data-f="${f}"]`).value || "").trim();
  const out = {id: checkinId(athlete, date), athlete: athlete.trim(), date, opp: val("opp") || null, notes: val("notes") || null};
  const prev = getGame(athlete, date);
  if (prev && prev.pitched!=null) out.pitched = prev.pitched;   // keep Pitched / Not used when saving the log
  for (const [k] of GAME_FIELDS){
    const v = val(k);
    if (k==="ip"){ if (v && ipOuts(v)==null) return {err:"Innings like 4, 4.1 or 4.2 (.1 and .2 are outs)."}; out.ip = v || null; continue; }
    if (v===""){ out[k] = null; continue; }
    const n = Number(v);
    if (!Number.isInteger(n) || n<0 || n>500) return {err:"Use whole numbers for "+GAME_FIELDS.find(f=>f[0]===k)[1].toLowerCase()+"."};
    out[k] = n;
  }
  out.balls = null;
  if (out.pitches!=null && out.strikes!=null){
    if (out.strikes>out.pitches) return {err:"Strikes can't be more than pitches."};
    out.balls = out.pitches - out.strikes;
  }
  if (out.er!=null && out.r!=null && out.er>out.r) return {err:"Earned runs can't be more than runs."};
  if (out.fps!=null && out.bf!=null && out.fps>out.bf) return {err:"First-pitch strikes can't be more than batters faced."};
  if (out.c11w!=null && out.c11!=null && out.c11w>out.c11) return {err:"1-1 counts won can't be more than 1-1 counts."};
  if (out.c11!=null && out.bf!=null && out.c11>out.bf) return {err:"1-1 counts can't be more than batters faced."};
  out.updatedAt = Date.now();
  return {game: out};
}
function saveGame(body){
  body.summary = gameSummary(body);
  gameDocs[body.id] = body;
  const ob = outbox(); ob.games[body.id] = body; ob.gdel = ob.gdel.filter(id=>id!==body.id); saveOutbox(ob); flush();
}
function renderTeamGames(dates){
  const all = Object.values(Object.assign({}, gameDocs, outbox().games)).filter(g=>g && Object.values(dates).includes(g.date) && (g.pitched!==false || hasStats(g)) && inGroup(g.athlete))
    .sort((a,b)=>byName(a.athlete, b.athlete) || a.date.localeCompare(b.date));
  const dayOf = d => (DAYS.find(([k])=>dates[k]===d)||["",""])[0];
  $("team-games").innerHTML = all.length ? `<div class="label" style="margin-top:6px">Games ${teamWeek?"last":"this"} week</div><div class="scroll"><table class="log team"><tr><th>Player</th><th>Day</th><th>IP</th><th>P</th><th>S%</th><th>K</th><th>BB</th><th>H</th><th>ER</th></tr>${all.map(g=>{
      const max = PITCH_MAX[athleteAge(g.athlete)], over = max && g.pitches>max;
      return `<tr data-ath="${esc(g.athlete)}"><td><b>${esc(g.athlete)}</b></td><td>${dayOf(g.date)}</td><td>${esc(g.ip||"–")}</td><td class="${over?'flag':''}">${g.pitches ?? "–"}</td><td>${g.pitches&&g.strikes!=null?Math.round(100*g.strikes/g.pitches)+"%":"–"}</td><td>${g.k ?? "–"}</td><td>${g.bb ?? "–"}</td><td>${g.h ?? "–"}</td><td>${g.er ?? "–"}</td></tr>`;
    }).join("")}</table></div>` : "";
}
let teamWeek = 0, playerNames = [];
// The schedule starts the day an athlete's account joined the team (slug -> local YYYY-MM-DD).
// Athletes without an account (entered by a coach) have no start date.
let joinDates = lsGet("bqpen.joined", {});
function setJoinDates(rows){ rows.forEach(r=>{ if (r.added_at) joinDates[r.athlete_slug] = localDate(new Date(r.added_at)); }); lsSet("bqpen.joined", joinDates); }
const joinedOn = ath => (ath && joinDates[slug(ath)]) || "";
const isFlag = c => c && (c.pain || (c.before!=null && c.before<=4) || (c.after!=null && c.after<=4) || (c.before!=null && c.after!=null && c.after-c.before<=-3));
// Coaches work one age group at a time: lists only show athletes in the selected age group
// (players only ever see their own data, so nothing is filtered for them).
function ageOfName(name){ const a = athleteDocs[slug(name||"")]; return (a && a.age) || ""; }
const inGroup = (name, fallbackAge) => role==="player" || (ageOfName(name) || fallbackAge || setup.age)===setup.age;
function renderTeam(){
  $("team").hidden = role!=="coach";
  if (role!=="coach") return;
  $("team-wk").querySelectorAll("button").forEach(b=>b.classList.toggle("on", +b.dataset.v===teamWeek));
  const dates = weekDates(teamWeek), byAth = {}, ob = outbox();
  // this week: just yesterday and today; last week: the whole week
  const today = localDate(), cols = teamWeek ? DAYS.map(([d,full])=>({date:dates[d], th:d, name:full}))
    : [{date:addDays(today,-1), th:"Yesterday", name:"yesterday"}, {date:today, th:"Today", name:"today"}];
  const colDates = cols.map(c=>c.date);
  const all = Object.assign({}, checkinDocs, ob.checkins);
  Object.values(all).forEach(c=>{ if (c && colDates.includes(c.date) && (c.before!=null || c.after!=null || c.pain)) (byAth[slug(c.athlete)] = byAth[slug(c.athlete)] || {name:c.athlete, days:{}}).days[c.date] = c; });
  playerNames.forEach(n=>{ if (!(joinedOn(n) > dates.Sun)) byAth[slug(n)] = byAth[slug(n)] || {name:n, days:{}}; });
  $("team-title").textContent = "Team arm check-ins · "+setup.age;
  const rows = Object.values(byAth).filter(r=>inGroup(r.name)).sort((a,b)=>byName(a.name, b.name));
  const sel = slug($("w-ath").value||"");
  const flags = [];
  $("team-tbl").innerHTML = `<tr><th>Player</th>${cols.map(c=>`<th>${c.th}</th>`).join("")}</tr>` + (rows.length ? rows.map(r=>`<tr data-ath="${esc(r.name)}" class="${slug(r.name)===sel?'sel':''}"><td><b>${esc(r.name)}</b></td>${cols.map(col=>{
      const c = r.days[col.date];
      if (!c) return `<td class="na">${col.date < joinedOn(r.name) ? "" : "–"}</td>`;
      if (isFlag(c)) flags.push(`${esc(r.name)}, ${col.name}: ${c.before ?? "–"} → ${c.after ?? "–"}${c.pain ? " · pain while throwing" : ""}`);
      return `<td class="${isFlag(c)?'flag':''}">${c.before ?? "–"}→${c.after ?? "–"}</td>`;
    }).join("")}</tr>`).join("")
    : `<tr><td colspan="${cols.length+1}" class="na">No check-ins ${teamWeek?"last week":"yesterday or today"} yet.</td></tr>`);
  renderTeamGames(dates); renderTeamHits(dates);
  const attn = teamWeek ? flags : flags.concat(needsAttention(rows.map(r=>r.name)));
  $("team-flags").innerHTML = attn.length ? `<div class="flags"><b>${teamWeek ? attn.length+" to follow up" : "Needs attention · "+attn.length}</b><ul>${attn.map(f=>`<li>${f}</li>`).join("")}</ul></div>` : "";
  renderTeamGoals(rows.map(r=>r.name));
}
// Throwing program card on the profile: coaches assign a program, set its start (a Monday) and move the player a level
// forward or back; players just see where they are.
function progNext(name){   // the next program throwing step from today: {date, cu} or null
  for (let i = 0; i < 60; i++){ const d = addDays(localDate(), i), cu = programDay(name, d); if (cu && cu.step) return {date: d, cu}; }
  return null;
}
function renderProgCard(name){
  const el = $("pf-prog"), pr = athProgram(name), a = athleteDocs[slug(name)] || {};
  if (!isCoach && !pr){ el.hidden = true; return; }
  if (a.type==="POS" && !pr){ el.hidden = true; return; }
  el.hidden = false;
  const nx = pr ? progNext(name) : null, dd = d => new Date(d+"T00:00:00").toLocaleDateString("en-AU",{weekday:"short", day:"numeric", month:"short"});
  const mon = d => { const x = new Date(d+"T00:00:00"); x.setDate(x.getDate() - ((x.getDay()+6)%7)); return localDate(x); };
  const end = pr ? addDays(pr.from, pr.weeks.length*7 - 1) : null, moved = pr ? Object.values(pr.moves).reduce((t,v)=>t+v, 0) : 0;
  el.innerHTML = `<h2>Throwing program</h2>`
    + (pr ? `<div class="pen">${esc(pr.name)} · ${dd(pr.from)} to ${dd(end)}</div>
        <div class="pen-desc">${nx ? `Next throw: ${dd(nx.date)}, ${esc(nx.cu.text)} (level ${nx.cu.level} of ${nx.cu.levels})${nx.cu.behind ? ", behind the sheet" : ""}.` : (localDate() > end ? "Finished: back on the usual schedule." : "No throwing days left on it.")}${moved ? ` Moved ${moved>0?"forward":"back"} ${Math.abs(moved)} level${Math.abs(moved)===1?"":"s"} by a coach.` : ""}</div>`
      : `<div class="pen-desc">On the usual team schedule. Assign a program to replace their throwing week from a start date.</div>`)
    + (isCoach ? `<div class="row" style="flex-wrap:wrap;gap:8px;margin-top:10px">
        <select id="pg-k" style="flex:2 1 180px"><option value="">Usual team schedule</option>${Object.entries(PROGRAM_TEMPLATES).map(([k,t])=>`<option value="${k}" ${pr && pr.k===k ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select>
        <input id="pg-from" type="date" style="flex:1 1 140px" value="${pr ? pr.from : mon(localDate())}" aria-label="Start (Monday)"></div>
        <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:8px"><button type="button" class="small primary" data-pg="save">Save program</button>
        ${pr && nx ? `<button type="button" class="small" data-pg="-1">Back a level</button><button type="button" class="small" data-pg="1">Forward a level</button>` : ""}
        ${pr && Object.keys(pr.moves).length ? `<button type="button" class="small ghost" data-pg="clear">Undo level changes</button>` : ""}</div>
        <div class="pen-desc">Starts on the Monday of the week you pick. Level changes apply from the next throwing day.</div>` : "");
}
$("pf-prog").addEventListener("click", e=>{
  const b = e.target.closest("[data-pg]"); if (!b || !isCoach || !profName) return;
  const name = profName, cur = athProgram(name), act = b.dataset.pg;
  const mon = d => { const x = new Date(d+"T00:00:00"); x.setDate(x.getDate() - ((x.getDay()+6)%7)); return localDate(x); };
  let prog;
  if (act==="save"){
    const k = $("pg-k").value, from = $("pg-from").value;
    prog = k && from ? {k, from: mon(from), moves: cur && cur.k===k && cur.from===mon(from) ? cur.moves : {}} : {k: "none"};
  } else if (!cur) return;
  else if (act==="clear") prog = {k: cur.k, from: cur.from, moves: {}};
  else { const nx = progNext(name); if (!nx) return;
    const moves = Object.assign({}, cur.moves); moves[nx.date] = (moves[nx.date]||0) + (+act); if (!moves[nx.date]) delete moves[nx.date];
    prog = {k: cur.k, from: cur.from, moves}; }
  setAthleteField(name, {prog}); renderProfile(); renderWeek();
});
// Arm scores over the last 4 weeks as a line (after throwing if logged, else before); the red band is 4 or lower
function armChartHtml(chk){
  const from = addDays(localDate(), -27), pts = chk.filter(c=>c.date>=from).map(c=>({d: Math.round((new Date(c.date) - new Date(from))/864e5), v: c.after ?? c.before, pain: c.pain})).filter(p=>p.v!=null).sort((a,b)=>a.d-b.d);
  if (pts.length < 2) return "";
  const W = 300, H = 90, x = d => 8 + d*(W-16)/27, y = v => H-8 - (v-1)*(H-16)/9;
  return `<svg class="armchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Arm scores, last 4 weeks">
    <rect x="0" y="${y(4)}" width="${W}" height="${H-y(4)}" fill="var(--miss)" opacity=".12"/>
    <line x1="0" x2="${W}" y1="${y(7)}" y2="${y(7)}" stroke="var(--line)" stroke-dasharray="3 4"/>
    <polyline points="${pts.map(p=>x(p.d).toFixed(1)+","+y(p.v).toFixed(1)).join(" ")}" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linejoin="round"/>
    ${pts.map(p=>`<circle cx="${x(p.d).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${p.pain?4:3}" fill="var(${p.pain || p.v<=4 ? "--miss" : "--gold"})"/>`).join("")}
  </svg><div class="pen-desc" style="margin-bottom:8px">Last 4 weeks. Dashed line is 7; the red band is 4 or lower.</div>`;
}
// Coaches' "Needs attention": what the logged data says is worth a conversation today
//   arm score falling over the last 3 check-ins · pitched on short rest (Pitch Smart) · over the daily pitch max ·
//   pain while throwing in the last 7 days · no arm check-in for 3 or more days
function needsAttention(names){
  const out = [], today = localDate(), ob = outbox(), dd = d => new Date(d+"T00:00:00").toLocaleDateString("en-AU",{weekday:"short", day:"numeric", month:"short"});
  const chk = Object.values(Object.assign({}, checkinDocs, ob.checkins)).filter(Boolean);
  names.forEach(name=>{
    const s = slug(name), e = esc(name);
    const mine = chk.filter(c=>slug(c.athlete)===s && (c.before!=null || c.after!=null)).sort((a,b)=>b.date.localeCompare(a.date));
    const sc = mine.slice(0,3).map(c=>c.after ?? c.before);
    if (sc.length===3 && sc[0] < sc[1] && sc[1] < sc[2] && mine[0].date >= addDays(today,-3)) out.push(`${e}: arm score falling (${sc[2]} → ${sc[1]} → ${sc[0]})`);
    chk.filter(c=>slug(c.athlete)===s && c.pain && c.date >= addDays(today,-7) && c.date < addDays(today,-1)).forEach(c=>out.push(`${e}: pain while throwing on ${dd(c.date)}`));
    // an account, joined 3+ days ago, and nothing logged for 3 days (players on a full day off still check in)
    if (playerNames.some(n=>slug(n)===s) && joinedOn(name) <= addDays(today,-3) && !(mine[0] && mine[0].date >= addDays(today,-2)))
      out.push(`${e}: no arm check-in ${mine[0] ? "since "+dd(mine[0].date) : "in the last 2 weeks"}`);
    const gs = Object.values(athleteGames(name)).filter(g=>g.pitched!==false && +g.pitches>0 && g.date >= addDays(today,-14)).sort((a,b)=>a.date.localeCompare(b.date));
    const max = PITCH_MAX[athleteAge(name)];
    gs.forEach((g,i)=>{
      if (max && +g.pitches > max) out.push(`${e}: ${g.pitches} pitches on ${dd(g.date)}, over the daily max of ${max}`);
      const prev = gs[i-1]; if (!prev) return;
      const need = restDays(+prev.pitches), had = Math.round((new Date(g.date) - new Date(prev.date))/864e5) - 1;
      if (had < need) out.push(`${e}: pitched ${dd(g.date)} on ${had} day${had===1?"":"s"} rest (needed ${need} after ${prev.pitches} pitches on ${dd(prev.date)})`);
    });
  });
  return out;
}
// Team goals (coaches): every player against the BQ approach goals this season, green at or above the goal, red below
function renderTeamGoals(names){
  const el = $("team-goals"); if (!el) return;
  const ob = outbox(), hitsBy = {};
  Object.values(Object.assign({}, hitDocs, ob.hits)).forEach(h=>{ if (h) (hitsBy[slug(h.athlete)] = hitsBy[slug(h.athlete)] || []).push(h); });
  const cols = GOALS.filter(g=>g[2]!=null && !(pitchingOnly() && !g[3]));
  const rows = names.map(n=>({n, m: goalMetrics(Object.values(athleteGames(n)), hitsBy[slug(n)] || [])})).filter(r=>cols.some(([k])=>r.m[k]!=null));
  const SHORT = {strike:"Str%", fps:"FPS%", c11:"1:1", os2k:"2K OS", qab:"QAB", hard:"Hard", sit:"Sit"};
  el.innerHTML = rows.length ? `<details class="plist"><summary>Team goals this season · ${rows.length} player${rows.length===1?"":"s"}</summary>
    <div class="scroll"><table class="log team"><tr><th>Player</th>${cols.map(([k,nm,g])=>`<th title="${nm}, goal ${g}%">${SHORT[k]}<div class="m" style="color:var(--muted);font-weight:400">${g}</div></th>`).join("")}</tr>
    ${rows.map(r=>`<tr data-ath="${esc(r.n)}" style="cursor:pointer"><td><b>${esc(r.n)}</b></td>${cols.map(([k,,g])=>r.m[k]==null ? `<td class="na">–</td>` : `<td style="color:var(${r.m[k]>=g?"--hit":"--miss"});font-weight:600">${r.m[k]}</td>`).join("")}</tr>`).join("")}</table></div>
    <div class="pen-desc">Season numbers from game logs and hitting. The small number is the goal. Tap a player for their profile.</div></details>` : "";
}
// pain while throwing on an individual program day: saved on that day's check-in, and the program steps back
$("w-days").addEventListener("click", e=>{
  const b = e.target.closest("[data-pain]"); if (!b) return;
  const ath = curAthlete(); if (!ath) return;
  const c = getCheckin(ath, b.dataset.pain) || {};
  setCheckin(ath, b.dataset.pain, "pain", c.pain ? null : true); renderWeek();
});
// coaches have one This week / Last week switch (on the team card) for the team and the player's week
$("team-wk").addEventListener("click", e=>{ const b = e.target.closest("button"); if (!b) return; teamWeek = schedWeek = +b.dataset.v; gameEdit = null; renderWeek(); });
// tapping a player in the team lists opens their profile
["team-tbl","team-games","team-hits","team-goals"].forEach(id=>$(id).addEventListener("click", e=>{
  const tr = e.target.closest("tr[data-ath]"); if (tr) openProfile(tr.dataset.ath);
}));
function curAthlete(){ return role==="player" ? playerName : $("w-ath").value.trim(); }

// ---------- schedule view ----------
let weekKey = "sat", pitchKey = "none", schedWeek = 0; // 0 = this week, -1 = last week (to fill in weekend games and check-ins afterwards)
try{ weekKey = localStorage.getItem("bqpen.week") || "sat"; pitchKey = localStorage.getItem("bqpen.pitch") || "none"; }catch(e){}
if (OLD_WEEKS[weekKey]) [weekKey, pitchKey] = OLD_WEEKS[weekKey];
if (!GAME_SETS.some(x=>x.k===weekKey)) weekKey = "sat";
function saveWeekPick(){ try{ localStorage.setItem("bqpen.week", weekKey); localStorage.setItem("bqpen.pitch", pitchKey); }catch(e){} }
$("w-type").innerHTML = GAME_SETS.map(w=>`<option value="${w.k}">${w.n}</option>`).join("");
$("w-type").value = weekKey;
$("w-type").addEventListener("change", ()=>{ weekKey = $("w-type").value; saveWeekPick(); renderWeek(); });
$("w-pitch").addEventListener("click", e=>{ const b = e.target.closest("button"); if (!b) return; pitchKey = b.dataset.v; saveWeekPick(); renderWeek(); });
// ---------- score rings (player profile): arm, then the BQ goals: strike %, 1st-pitch strike %, 1:1 win; QAB %, hard hit %, situational ----------
function ringSvg(v, max, txt, col){
  const C = 2*Math.PI*42, f = v==null ? 0 : Math.max(0, Math.min(1, v/max));
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="tr" cx="50" cy="50" r="42"/>`+
    (v==null ? "" : `<circle class="arc" cx="50" cy="50" r="42" stroke="${col}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C*(1-f)).toFixed(1)}"/>`)+
    `<text class="num${v==null?' none':''}" x="50" y="51" text-anchor="middle" dominant-baseline="central">${txt}</text></svg>`;
}
// a ring with a goal: green at or above it, red below
const goalRing = (out, nm, v, g, sub) => out.push({nm, v, max:100, txt: v==null ? "–" : v+"%", col: v==null ? null : v>=g ? "var(--hit)" : "var(--miss)", sub: sub || `Goal ${g}%`});
// The BQ approach numbers for a set of games and hitting days: {strike, fps, c11, r2k, os2k, qab, hard, sit} (each a % or null)
function goalMetrics(games, hits){
  const sum = (k, d) => games.reduce((t,g)=>{ const a = +g[k], b = +g[d]; return (g[k]!=null && g[k]!=="" && b) ? [t[0]+a, t[1]+b] : t; }, [0,0]);
  const pc = ([a,b]) => b ? Math.round(100*a/b) : null, t = hitStats(hits.flatMap(h=>h.pas||[])), p = v => v==null ? null : Math.round(v*100);
  return {strike: pc(sum("strikes","pitches")), fps: pc(sum("fps","bf")), c11: pc(sum("c11w","c11")), r2k: pc(sum("r2k","bf")), os2k: pc(sum("os2k","p2k")),
    qab: p(t.qabp), hard: p(t.hardp), sit: p(t.sitp), pa: t.pa};
}
// [key, ring name, goal (null = no goal set), pitching?]
const GOALS = [["strike","Strike %",STRIKE_GOAL,1],["fps","1st pitch %",FPS_GOAL,1],["c11","1:1 win",C11_TARGET,1],["r2k","Race to 2K",null,1],["os2k","2K offspeed",OS2K_GOAL,1],
  ["qab","QAB %",QAB_GOAL,0],["hard","Hard hit",HARD_GOAL,0],["sit","Situational",SIT_GOAL,0]];
const TREND_DAYS = 28;   // trend arrow: the last 4 weeks against everything before
// src: {checkins, pens, games, hits} for this athlete, from their profile
function ringsData(ath, src){
  const a = athleteDocs[slug(ath)] || {}, type = a.type || "P", s = slug(ath), out = [];
  const good = "var(--hit)", mid = "var(--warn)", bad = "var(--miss)";
  {
    // arm (everyone): the latest check-in, whenever it was (after throwing if logged, else before)
    const recent = src.checkins
      .filter(c=>c && slug(c.athlete)===s && (c.before!=null || c.after!=null)).sort((x,y)=>y.date.localeCompare(x.date))[0];
    const arm = recent ? (recent.after ?? recent.before) : null;
    out.push({nm:"Arm", v:arm, max:10, txt:arm==null?"–":arm, col: arm==null?null: arm<=4?bad: arm<=6?mid:good,
      sub: arm==null ? "No check-ins yet" : recent.date===localDate() ? "Today" : new Date(recent.date+"T00:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short"})});
  }
  const cut = addDays(localDate(), -TREND_DAYS), m = goalMetrics(src.games, src.hits);
  const now = goalMetrics(src.games.filter(g=>g.date>=cut), src.hits.filter(h=>h.date>=cut)), was = goalMetrics(src.games.filter(g=>g.date<cut), src.hits.filter(h=>h.date<cut));
  GOALS.forEach(([k, nm, g, pit])=>{
    if (pit ? type==="POS" : type==="P") return;
    let v = m[k], sub = g==null ? "Season" : `Goal ${g}%`;
    if (k==="strike" && v==null){   // no game strikes logged yet: their last 3 bullpens
      const pens = src.pens.filter(r=>slug(r.athlete||"")===s && r.pitches && r.pitches.length).sort((x,y)=>y.createdAt-x.createdAt).slice(0,3).map(penSummary).filter(x=>x && x.strikePct!=null);
      if (pens.length){ v = Math.round(pens.reduce((t,x)=>t+x.strikePct,0)/pens.length); sub = `Pens · goal ${g}%`; }
    }
    if (k==="qab" && !m.pa) sub = "No at-bats yet";
    const d = now[k]!=null && was[k]!=null ? now[k]-was[k] : null;   // up or down over the last 4 weeks
    out.push({nm, v, max:100, txt: v==null ? "–" : v+"%", col: v==null ? null : g==null ? "var(--gold)" : v>=g ? good : bad, sub,
      trend: d==null || !d ? "" : `<span class="trend ${d>0?'up':'down'}" title="Last 4 weeks against before">${d>0?"▲":"▼"}${Math.abs(d)}</span>`});
  });
  return out;
}
function renderRings(ath, el, src){
  const show = !!ath && (role==="player" || isCoach);
  el.hidden = !show; if (!show) return;
  const d = ringsData(ath, src); el.style.setProperty("--n", d.length>4 && d.length%3===0 ? 3 : Math.min(d.length, 4));   // rows of 3 or 4, a short last row centred
  el.innerHTML = d.map(r=>`<div class="ring">${ringSvg(r.v, r.max, esc(String(r.txt)), r.col)}<div class="nm">${r.nm}${r.trend||""}</div><div class="sub">${esc(r.sub)}</div></div>`).join("");
}
function renderWeek(){
  $("w-age").querySelectorAll("button").forEach(b=>b.classList.toggle("on", b.dataset.v===setup.age));
  const bq = BQ_DAYS[setup.age] || [];
  const today = schedWeek ? "" : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
  const ath = curAthlete(), start = joinedOn(ath);
  const dates = weekDates(schedWeek), todayDate = localDate();
  const built = usesGameWeeks(setup.age, dates.Mon);
  const games = built && ath ? athleteGames(ath) : {};
  // calendar play days count as games (not pitched until marked); off / travel days are fixed
  const calGame = {}, forced = {};
  if (built) DAYS.forEach(([k])=>{ const t = calType(calEvent(setup.age, dates[k]));
    if (t==="game"){ calGame[dates[k]] = true; if (!games[dates[k]]) games[dates[k]] = {date:dates[k], pitched:false, cal:true}; }
    else if (t) forced[k] = t; });
  const plan = built ? buildGameWeek(dates, games, setup.age, forced) : null;
  const set = GAME_SETS.find(x=>x.k===weekKey) || GAME_SETS[0];
  if (pitchKey!=="none" && !set.days.includes(pitchKey)) pitchKey = "none";
  $("w-pitchwrap").hidden = built || set.days.length < 2;
  $("w-pitch").innerHTML = set.days.map(d=>[d, d]).concat([["none","Didn't pitch"]])
    .map(([v,l])=>`<button type="button" data-v="${v}" class="${pitchKey===v?'on':''}">${l}</button>`).join("");
  const pattern = WEEKS.find(x=>x.k===weekPattern(set.k, pitchKey)) || WEEKS[1];
  const w = built ? {d: plan.types} : {d: Object.assign({}, setup.age==="U16" ? u16Thursday(pattern.d) : setup.age==="U18" ? u18Wednesday(pattern.d) : pattern.d)};
  const calMoved = built ? null : applyCal(w.d, dates, setup.age);
  const posOnly = isPosOnly(ath);
  if (posOnly) w.d = posWeek(w.d);
  if (posOnly) $("w-pitchwrap").hidden = true;
  // A bullpen can't follow a game the player pitched in: once innings are logged for the day before, it becomes a recovery day
  let penDropped = null;
  if (ath && !posOnly) DAYS.forEach(([k])=>{ const g = w.d[k]==="pen" && getGame(ath, addDays(dates[k], -1));
    if (g && (ipOuts(g.ip) > 0 || +g.pitches > 0)){ w.d[k] = "rec"; penDropped = k; } });
  const penAt = DAYS.map(([k])=>k).find(k=>w.d[k]==="pen");
  const penNote = posOnly ? " Position player schedule."
    : penDropped ? " No bullpen on "+DAYS.find(([k])=>k===penDropped)[1]+": pitched in the game the day before."
    : calMoved==="none" ? " No full bullpen this week: the BQ schedule leaves no safe day for one."
    : calMoved ? " Bullpen on "+DAYS.find(([k])=>k===calMoved)[1]+" this week to fit the BQ schedule."
    : setup.age==="U18" && penAt==="Wed" ? " Bullpen on Wednesday."
    : setup.age!=="U16" || penAt==="Thu" ? (setup.age==="U16" ? " Bullpen on Thursday." : "")
    : !penAt ? (built && !plan.pitched ? " No full bullpen this week: no safe day around this week's games." : " No full bullpen this week because of pitching in a game.")
    : " Bullpen moved to "+DAYS.find(([k])=>k===penAt)[1]+" this week: "+(w.d.Fri==="game" ? "no bullpen the day before a game." : w.d.Thu==="game" ? "Thursday is a game day." : "Thursday is a recovery day after pitching.");
  $("w-typewrap").hidden = built; $("w-gpick").hidden = !built;
  if (built){
    $("w-gseg").innerHTML = DAYS.map(([d])=>{ const g = games[dates[d]];
      return `<button type="button" data-gday="${dates[d]}" class="${g?'on':''}" ${!ath || calGame[dates[d]] || (g && !canRemoveGame(dates[d])) ? "disabled" : ""}>${d}</button>`; }).join("");
    $("w-gnote").textContent = !ath ? "Enter the athlete's name above to add their games."
      : posOnly ? "Tap the days with games. Log hitting on the Hitting tab."
      : "Pitched: the next two days are a tolerance throw then a light bullpen, and there's no full bullpen that week. Not used: the full bullpen stays, moved off the day before a game.";
  }
  $("w-wk").querySelectorAll("button").forEach(b=>b.classList.toggle("on", +b.dataset.v===schedWeek));
  $("w-addgame").hidden = !ath;
  // any day of last week or this week
  $("w-gamedate").min = weekDates(-1).Mon; $("w-gamedate").max = weekDates(0).Sun;
  $("w-wk").hidden = role==="coach";
  $("w-note").textContent = setup.age+(bq.length ? " BQ training: "+bq.map(d=>DAYS.find(x=>x[0]===d)[1]).join(" and ") : ": no set BQ training days")+"."+penNote+" Soft tissue, bands and recovery every day except the no-throw day.";
  if (DAYS.some(([k])=>programDay(ath, dates[k]))) $("w-note").textContent = `${ath}'s own throwing program this week (it replaces the usual schedule). ${athProgram(ath).note}`;
  const gameDays = [];
  $("w-days").innerHTML = DAYS.map(([d,full])=>{
    const cu = programDay(ath, dates[d]);   // an individual program replaces the normal day
    const t = cu ? cu.t : w.d[d], T = cu ? cu.T : DAYTYPES[t], _g = ["game","game2","pos","pospen"].includes(t) || tourneyOn(dates[d]) ? gameDays.push(dates[d]) : 0, dayLabel = `<div class="dayname">${full}<span class="ddate">${new Date(dates[d]+"T00:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short"})}</span></div>`;
    const ev = calEvent(setup.age, dates[d]);
    const label = ev ? calTag(ev) : !inCal(dates[d]) && bq.includes(d) ? `<span class="tag bq">BQ training</span>` : t==="off" ? `<span class="tag off">Day off</span>` : `<span class="tag">On own</span>`;
    const on = t!=="off";
    const armA = t==="pen" || t==="light" || t==="phi" || t==="pmod", recProg = t==="rec" || t==="tol";
    const arm = armA ? progList("Arm care A", ARM_A) : t==="lt" ? progList("Arm care B", ARM_B) : "";
    const recov = recProg ? progList("Recovery / mobility program (before or after throwing)", RECOVERY) : "";
    const btn = T.pen ? `<button class="small" data-pen="${dates[d]}">${t==="pospen"?"Log bullpen (if not pitching)":"Log this bullpen"}</button>` : "";
    let check = "", game = "";
    if (built && t==="game" && !ath) game = `<div class="glog"><button class="small" data-gneedath>Log this game</button></div>`;
    else if (built && t==="game"){
      const g = games[dates[d]], un = plan.unavailable[dates[d]];
      game = `<div class="glog"><div class="q">Did ${esc(ath)} pitch?</div>
        <div class="seg" data-gp="${dates[d]}"><button type="button" data-v="0" class="${g.pitched?'':'on'}">Not used</button><button type="button" data-v="1" class="${g.pitched?'on':''}">Pitched</button></div>
        ${un ? `<div class="gwarn">Not available: still in down days after pitching on ${new Date(un+"T00:00:00").toLocaleDateString("en-AU",{weekday:"long", day:"numeric", month:"short"})}</div>` : ""}</div>`
        + (g.pitched || hasStats(g) ? gameHtml(ath, dates[d]) : "");
    }
    else if (t==="game" || t==="game2") game = ath ? gameHtml(ath, dates[d])
      : `<div class="glog"><button class="small" data-gneedath>Log this game</button></div>`;
    // position players log their games on the Hitting tab
    else if (posOnly && t==="pos" && ath) game = `<div class="glog"><button class="small" data-ghit="${dates[d]}">Log hitting for this game</button></div>`;
    // a game on any other day (picked with "+ Log a game", or already logged there)
    else if (ath && !posOnly && (gameEdit===dates[d] || hasStats(getGame(ath, dates[d]) || {}))) game = gameHtml(ath, dates[d]);
    else if (tourneyOn(dates[d])) game = !ath ? `<div class="glog"><button class="small" data-gneedath>Log a game</button></div>`
      : posOnly ? `<div class="glog"><button class="small" data-ghit="${dates[d]}">Log hitting for a game</button></div>`
      : gameHtml(ath, dates[d]);
    // before the athlete joined, the only thing to fill in is a game they played that day
    if (dates[d] < start) return `<div class="day pre ${game?'hasgame':''}"><div class="dayhead">${dayLabel}<span class="tag off">Before joining</span></div><div class="pen-desc">${esc(ath)}'s schedule starts ${new Date(start+"T00:00:00").toLocaleDateString("en-AU",{weekday:"long", day:"numeric", month:"short"})}, the day they joined.${game ? " You can still log this game." : ""}</div>${game}</div>`;
    // the 1-10 scales only on today's card; earlier days just show what was logged
    // no-throw days still get the morning arm check (one 1-10 scale, saved as "before")
    if ((!on || (cu && !cu.throws)) && dates[d] === todayDate){
      if (!ath) check = `<div class="armq"><div class="pen-desc">Enter the athlete's name at the top to log how their arm feels today.</div></div>`;
      else { const c = getCheckin(ath, dates[d]) || {};
        check = `<div class="armq"><div class="q">How does ${esc(ath)}'s arm feel today?</div>${scaleHtml("w:before:"+dates[d], c.before)}</div>`; }
    } else if (on && dates[d] === todayDate){
      if (!ath) check = `<div class="armq"><div class="pen-desc">Enter the athlete's name at the top to log how their arm feels before and after throwing.</div></div>`;
      else {
        const c = getCheckin(ath, dates[d]) || {};
        check = `<div class="armq"><div class="q">How does ${esc(ath)}'s arm feel?</div>
          <div class="label">Before throwing</div>${scaleHtml("w:before:"+dates[d], c.before)}
          <div class="label">After throwing</div>${scaleHtml("w:after:"+dates[d], c.after)}
          ${deltaHtml(c.before, c.after)}</div>`;
      }
    } else if (ath && dates[d] < todayDate){
      const c = getCheckin(ath, dates[d]);
      if (c && (c.before!=null || c.after!=null)) check = `<div class="armq">${deltaHtml(c.before, c.after) || `<div class="delta">Arm: before <b>${c.before ?? "–"}</b> · after <b>${c.after ?? "–"}</b></div>`}</div>`;
    }
    const closed = d!==today && !openDays.has(dates[d]) && gameEdit!==dates[d];
    return `<div class="day ${d===today?'today':''} ${closed?'closed':''}" data-date="${dates[d]}">
      <div class="dayhead" data-dtoggle><div class="dayname">${full}${d===today?"<small>Today</small>":""}<span class="ddate">${new Date(dates[d]+"T00:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short"})}</span></div>${tourneyOn(dates[d]) ? `<span class="tag game">${esc(tourneyOn(dates[d]).label)}</span>` : label}</div>
      <div class="dtype" data-dtoggle><span class="int">${T.i}</span><span class="tag ${T.cls}">${T.n}</span>${d!==today?'<span class="caret" aria-hidden="true"></span>':""}</div>
      ${cu ? (cu.kind==="off" ? `<div class="pen-desc">${esc(cu.text)}</div>`
        : `<dl class="items"><dt>Program</dt><dd>${esc(cu.text)}</dd>${cu.throws ? `<dt>Prep</dt><dd>Early work warm-up, bands</dd>` : ""}</dl>`
          + (cu.behind ? `<div class="gwarn">Behind the sheet${cu.lastPain ? " after pain" : ""}${cu.lastPain ? " on "+new Date(cu.lastPain+"T00:00:00").toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"short"}) : ""}${cu.wasGame ? ": no pitching in today's game" : ""}. The sheet had: ${esc(programCell(cu.sheet).text)}</div>` : "")
          + (cu.throws ? `<div class="pen-desc">${esc(athProgram(ath).note)}</div>` : "")
          + (cu.step && dates[d] <= todayDate ? `<div class="glog"><button type="button" class="small ${cu.pain?'on':''}" data-pain="${dates[d]}">${cu.pain ? "Pain logged: next throw goes back one level (tap to undo)" : "Had pain while throwing"}</button></div>` : ""))
      : on ? `<dl class="items"><dt>Prep</dt><dd>Early work warm-up, soft tissue (self manage), bands</dd><dt>Plyos</dt><dd>${esc(T.pl)}</dd><dt>Throwing</dt><dd>${esc(T.t)}</dd>${armA||t==="lt"?`<dt>Arm care</dt><dd>${armA?"Arm care A":"Arm care B"}</dd>`:""}<dt>Recovery</dt><dd>${recProg?"Recovery / mobility program":"Recovery"}</dd></dl>` : `<div class="pen-desc">Full day off from throwing. No plyos or bands.</div>`}
      ${cu ? (cu.kind==="off" ? "" : (cu.throws ? earlyHtml() : "") + prepHtml()) : on ? earlyHtml() + prepHtml() + plyoHtml(T.pl, t) : ""}${arm}${recov}${btn}${ath && sprinter(ath) && (t==="pen" || t==="light") ? sprintHtml(ath, dates[d], t==="pen" ? 1 : 2) : ""}${game}${check}
    </div>`;
  }).join("");
  if (role==="player" && schedWeek===0) pushGameDays(gameDays);
  renderTeam();
}
// days the person has opened (by date); today is always open, and tournament days start open
const openDays = new Set(TOURNEYS.flatMap(t => span(t.from, Math.round((new Date(t.to) - new Date(t.from)) / 864e5) + 1).map(x => x[0])));
$("w-days").addEventListener("click", e=>{
  const h = e.target.closest("[data-dtoggle]"); if (!h || e.target.closest("button,a,input")) return;
  const day = h.closest(".day"); if (day.classList.contains("today")) return;
  const date = day.dataset.date;
  if (openDays.has(date)) openDays.delete(date); else openDays.add(date);
  day.classList.toggle("closed", !openDays.has(date));
});
// + Log a game: pick the day, then the game log opens on that day (position players go to Hitting)
$("w-addgame").addEventListener("click", ()=>{
  const open = $("w-addday").hidden; $("w-addday").hidden = !open;
  if (open && !$("w-gamedate").value) $("w-gamedate").value = localDate();
});
$("w-gamego").addEventListener("click", ()=>{
  const date = $("w-gamedate").value; if (!date) return;
  if (date < weekDates(-1).Mon || date > weekDates(0).Sun){ $("w-gamedate").value = localDate(); return; }
  $("w-addday").hidden = true;
  // show the week the game is in
  schedWeek = teamWeek = date >= weekDates(0).Mon ? 0 : -1;
  if (isPosOnly(curAthlete())){ hitDate = date; hitDraft = null; setTab("hit"); return; }
  gameEdit = date; openDays.add(date); renderWeek();
  document.querySelector(`[data-game="${date}"]`)?.scrollIntoView({behavior:"smooth", block:"center"});
});
$("w-days").addEventListener("click", e=>{
  const b = e.target.closest("[data-sprint]"); if (!b) return;
  const [date, val] = b.dataset.sprint.split("|"), ath = curAthlete(); if (!ath) return;
  setCheckin(ath, date, "sprint", val || null); renderWeek();
});
$("w-days").addEventListener("click", e=>{
  const h = e.target.closest("[data-ghit]"); if (!h) return;
  hitDate = h.dataset.ghit; hitDraft = null; setTab("hit");
});
$("w-gseg").addEventListener("click", e=>{
  const b = e.target.closest("button[data-gday]"); if (!b || b.disabled) return;
  const ath = curAthlete(), date = b.dataset.gday, g = athleteGames(ath)[date];
  if (g && hasStats(g) && b.dataset.armed!=="1"){ b.dataset.armed = "1"; b.textContent = "Remove?"; return; }   // a logged game needs a second tap
  toggleGameDay(ath, date); gameEdit = null; renderWeek();
});
$("w-days").addEventListener("click", e=>{
  const b = e.target.closest("[data-gp] button"); if (!b) return;
  const ath = curAthlete(), date = b.parentElement.dataset.gp; if (!ath) return;
  const g = athleteGames(ath)[date] || {id: checkinId(ath, date), athlete: ath.trim(), date};   // a calendar game not saved yet
  saveGame(Object.assign({}, g, {pitched: b.dataset.v==="1", updatedAt: Date.now()})); renderWeek();
});
$("w-wk").addEventListener("click", e=>{ const b = e.target.closest("button"); if (!b) return; schedWeek = teamWeek = +b.dataset.v; gameEdit = null; renderWeek(); });
$("w-age").addEventListener("click", e=>{const b=e.target.closest("button"); if(!b) return; setup.age=b.dataset.v; saveSetup();
  if (role!=="player") ["w-ath","f-ath","h-ath"].forEach(id=>{ const v = $(id).value.trim(); if (v && !inGroup(v)) $(id).value = ""; });
  repaintAll(); renderWeek(); renderHist(); renderHit();});
$("w-days").addEventListener("click", e=>{
  const pb = e.target.closest("button[data-pen]");
  if (pb){ openPenFor(pb.dataset.pen); return; }
  if (e.target.closest("[data-gneedath]")){
    window.scrollTo({top:0, behavior:"smooth"}); $("w-ath").focus();
    $("w-ath").placeholder = "Enter the athlete's name first";
    return;
  }
  const box = e.target.closest("[data-game]"); if (!box) return;
  const date = box.dataset.game, ath = curAthlete();
  if (e.target.closest("[data-gopen]")){ gameEdit = date; renderWeek(); document.querySelector(`[data-game="${date}"] input`)?.focus(); return; }
  if (e.target.closest("[data-gcancel]")){ gameEdit = null; renderWeek(); return; }
  if (e.target.closest("[data-gsave]")){
    const r = readGameForm(box, ath, date);
    if (r.err){ const m = box.querySelector(".gmsg"); m.textContent = r.err; m.hidden = false; return; }
    saveGame(r.game); gameEdit = null; renderWeek();
  }
});
let tab = "sched";
function setTab(t){
  if (locked() && t!=="acct") t = "acct";
  tab = t;
  $("tabs").querySelectorAll("button").forEach(b=>b.classList.toggle("on", b.dataset.t===t));
  $("v-sched").hidden = t!=="sched"; $("v-hit").hidden = t!=="hit"; $("v-acct").hidden = t!=="acct"; $("v-prof").hidden = true; profMine = false;
  if (t!=="pens"){ ["v-setup","v-live","v-sum"].forEach(v=>$(v).hidden=true); }
  renderNudge();
  if (t==="acct"){ showMyProfile(); return; }
  if (t==="sched") renderWeek();
  if (t==="hit"){ if (role!=="player" && !$("h-ath").value) $("h-ath").value = $("w-ath").value; renderHit(); }
  else if (t==="pens" && $("v-live").hidden && $("v-sum").hidden) $("v-setup").hidden = false;
}
{
  let lastY = window.scrollY, ticking = false;
  window.addEventListener("scroll", ()=>{
    if (ticking) return; ticking = true;
    requestAnimationFrame(()=>{
      const y = window.scrollY, d = y - lastY;
      if (y < 40) $("tabs").classList.remove("mini");
      else if (d > 6) $("tabs").classList.add("mini");
      else if (d < -6) $("tabs").classList.remove("mini");
      if (Math.abs(d) > 6 || y < 40) lastY = y;
      ticking = false;
    });
  }, {passive:true});
}
// "Log this bullpen": carry on with a pen in progress (this session, or one saved on this phone),
// otherwise a new pen for that athlete and day
let penForDate = null;
function openPenFor(date){
  const ath = curAthlete();
  if (pen && pen.status==="live" && live){ setTab("pens"); show("v-live"); return; }
  const open = ath && Object.values(Object.assign({}, Object.fromEntries(histDocs.map(r=>[r.id, r])), outbox().pens))
    .filter(r=>r && r.status==="live" && slug(r.athlete||"")===slug(ath) && Date.now() - (r.updatedAt || r.createdAt) < 36*3600e3).sort((a,b)=>b.createdAt-a.createdAt)[0];
  setTab("pens");
  if (open){ openSummary(open); pen.status = "live"; openLive(); return; }
  penForDate = date;
  if (ath && role!=="player"){ $("f-ath").value = ath; loadAthlete(); }
  $("f-for").textContent = "Bullpen for "+new Date(date+"T00:00:00").toLocaleDateString("en-AU",{weekday:"long", day:"numeric", month:"short"});
  $("f-for").hidden = false;
  show("v-setup");
}
$("tabs").addEventListener("click", e=>{const b=e.target.closest("button"); if(!b) return;
  if (b.dataset.t==="pens"){ penForDate = null; $("f-for").hidden = true; }
  if (b.dataset.t==="pens" && pen && pen.status==="live" && live){ setTab("pens"); show("v-live"); return; }
  setTab(b.dataset.t);});

// ---------- hitting events ----------
$("h-ath").addEventListener("change", ()=>{ hitDraft = null; hitSeasonFor = null; renderHit(); });
$("h-date").addEventListener("change", ()=>{ hitDate = $("h-date").value || null; hitDraft = null; oppOpen = false; renderHit(); });
var oppOpen = false;   // opponent box shown only once asked for, or when the game already has one
$("h-oppadd").addEventListener("click", ()=>{ oppOpen = true; renderHit(); $("h-opp").focus(); });
$("h-bats").addEventListener("click", e=>{ const b = e.target.closest("button"); const ath = hitAthlete(); if (!b || !ath) return; setAthleteField(ath, {bats: b.dataset.v}); renderHit(); });
$("h-type").addEventListener("click", e=>{ const b = e.target.closest("button"); const ath = hitAthlete(); if (!b || !ath) return; setAthleteType(ath, b.dataset.v); renderHit(); });
$("h-gnotes").addEventListener("change", ()=>{
  const ath = hitAthlete(), date = hitDate || localDate(); if (!isHitter(ath)) return;
  const doc = getHit(ath, date) || {id: hitId(ath, date), athlete: ath, date, pas: []};
  saveHit(Object.assign({}, doc, {notes: $("h-gnotes").value.trim() || null})); renderHit();
});
$("h-opp").addEventListener("change", ()=>{
  const ath = hitAthlete(), date = hitDate || localDate(); if (!isHitter(ath)) return;
  const doc = getHit(ath, date) || {id: hitId(ath, date), athlete: ath, date, pas: []};
  saveHit(Object.assign({}, doc, {opp: $("h-opp").value.trim() || null})); renderHit();
});
$("v-hit").addEventListener("click", e=>{
  const ath = hitAthlete(), date = hitDate || localDate(), d = hitDraft;
  const seg = e.target.closest("[data-hk] button");
  if (seg){ const k = seg.parentElement.dataset.hk; d[k] = +seg.dataset.v; renderHit(); return; }
  const tog = e.target.closest("[data-htog]");
  if (tog){ const k = tog.dataset.htog; d[k] = d[k] ? 0 : 1;
    // missed and executed don't go together on one at-bat
    if (d[k] && k==="sitx") SIT_DONE.forEach(x=>{ d[x] = 0; }); else if (d[k] && SIT_DONE.includes(k)) d.sitx = 0;
    renderHit(); return; }
  const r = e.target.closest("[data-hres]");
  if (r){ d.res = r.dataset.hres; if (isBunt(d.res)) d.hh = null; if (!HR_BY[d.res][2].bip){ d.x = d.y = d.zone = null; } renderHit(); return; }
  const svg = e.target.closest("#h-field");
  if (svg){ const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(svg.getScreenCTM().inverse());
    d.x = Math.min(1, Math.max(0, q.x/FIELD.w)); d.y = Math.min(1, Math.max(0, q.y/FIELD.h)); d.zone = fieldZone(d.x, d.y); renderHit(); return; }
  if (e.target.closest("#h-save")){
    if (!d.res) return;
    const doc = getHit(ath, date) || {id: hitId(ath, date), athlete: ath, date, opp: $("h-opp").value.trim() || null, pas: []};
    const pa = {res:d.res, rbi:d.rbi||0}; if (d.hh!=null && !isBunt(d.res)) pa.hh = d.hh; SIT_TAPS.concat(QAB_TAPS).forEach(([k])=>{ if (d[k]) pa[k] = 1; }); if (d.x!=null){ pa.x = +d.x.toFixed(3); pa.y = +d.y.toFixed(3); pa.zone = d.zone; }
    saveHit(Object.assign({}, doc, {pas: (doc.pas||[]).concat([pa])})); hitDraft = null; renderHit();
    $("h-game").scrollIntoView({behavior:"smooth", block:"start"}); return;
  }
  const rm = e.target.closest("[data-parm]");
  if (rm){ if (rm.dataset.armed!=="1"){ rm.dataset.armed = "1"; rm.textContent = "Tap again"; return; }
    const doc = getHit(ath, date); if (!doc) return; const pas = doc.pas.slice(); pas.splice(+rm.dataset.parm, 1);
    saveHit(Object.assign({}, doc, {pas})); renderHit(); return; }
  const g = e.target.closest("[data-hdate]");
  if (g){ hitDate = g.dataset.hdate; hitDraft = null; renderHit(); window.scrollTo({top:0, behavior:"smooth"}); }
});

// ---------- setup view ----------
function segBind(id, key, after){
  const el = $(id);
  const paint = () => el.querySelectorAll("button").forEach(b=>b.classList.toggle("on", String(setup[key])===b.dataset.v));
  el.addEventListener("click", e=>{const b=e.target.closest("button"); if(!b) return; setup[key]= key==="lvl"?+b.dataset.v:b.dataset.v; paint(); after&&after(); saveSetup();});
  paint();
}
function saveSetup(){ try{ localStorage.setItem("bqpen.setup", JSON.stringify(setup)); }catch(e){} }
function paintSetup(){
  // the base sequence has three volumes instead of five levels
  const base = setup.fw==="base";
  if (base && setup.lvl>3) setup.lvl = 1;
  $("lvl-wrap").querySelector(".label").textContent = base ? "Volume" : "Level";
  $("f-lvl").querySelectorAll("button").forEach(b=>{ const v = +b.dataset.v;
    b.hidden = base && v>3; b.textContent = base ? ["Base","+1 set","+2 sets"][v-1] || v : v; b.classList.toggle("on", v===setup.lvl); });
  $("lvl-wrap").hidden = setup.fw==="control"||setup.fw==="custom";
  $("des-wrap").hidden = setup.fw!=="des";
  const k = (setup.fw==="control"||setup.fw==="custom") ? setup.fw : setup.fw+setup.lvl;
  let txt = DESC[k];
  const def = penDef(setup.fw, setup.lvl);
  if (def.mode==="plan"){
    const rec = {mix:setup.mix, design:setup.fw==="des"?setup.des:null, hand:setup.hand};
    const cnt = {}; def.plan.forEach((x,i)=>{ const p = plannedPitch(def,i,rec).p; cnt[p]=(cnt[p]||0)+1; });
    txt += " For this pitch mix: " + ORDER.filter(c=>cnt[c]).map(c=>c+" "+cnt[c]).join(" · ") + ".";
  }
  $("pen-desc").textContent = txt;
}
$("f-mix").innerHTML = PITCHES.map(p=>`<button data-v="${p.c}" aria-pressed="false">${p.n}</button>`).join("");
$("f-des").innerHTML = PITCHES.filter(p=>p.c!=="FB").map(p=>`<button data-v="${p.c}">${p.n}</button>`).join("");
function paintMix(){
  $("f-mix").querySelectorAll("button").forEach(b=>{const on=setup.mix.includes(b.dataset.v); b.classList.toggle("on",on); b.setAttribute("aria-pressed",on);});
  const os = ORDER.filter(c=>setup.mix.includes(c) && FAM[c]!=="FB");
  const fb = ORDER.filter(c=>setup.mix.includes(c) && FAM[c]==="FB");
  paintArsenal();
  $("mix-note").textContent = os.length ? "Offspeed reps are split evenly across "+os.map(c=>PNAME[c]).join(", ")+"."+(fb.length>1?" Fastball reps alternate "+fb.map(c=>PNAME[c]).join(" / ")+".":"") : "";
  paintSetup();
}
$("f-mix").addEventListener("click", e=>{const b=e.target.closest("button"); if(!b) return; const c=b.dataset.v;
  setup.mix = setup.mix.includes(c) ? setup.mix.filter(x=>x!==c) : ORDER.filter(x=>x===c||setup.mix.includes(x));
  paintMix(); saveSetup();});
["f-age:age","f-hand:hand","f-des:des"].forEach(s=>{const [id,k]=s.split(":"); segBind(id,k, id==="f-age" ? ()=>{ paintSetup(); renderWeek(); renderHist(); } : paintSetup);});
segBind("f-fw","fw",paintSetup); segBind("f-lvl","lvl",paintSetup); paintMix();
$("f-ath").addEventListener("change", loadAthlete);
renderWeek();
function slug(n){ return n.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80) || "athlete"; }
function loadAthlete(){
  arsenalOpen = false;
  const a = athleteDocs[slug($("f-ath").value)]; if (!a){ paintArsenal(); return; }
  Object.assign(setup, {age:a.age||setup.age, hand:a.hand||setup.hand, mix:(a.mix&&a.mix.length)?a.mix:setup.mix});
  saveSetup(); repaintAll(); paintMix();
}
// A pitcher whose throwing hand is already saved sees it as one line, with Change to edit
var arsenalOpen = false;   // var: paintMix() runs before this line on load
function paintArsenal(){
  const a = athleteDocs[slug($("f-ath").value||"")], known = !!(a && a.hand);
  $("f-arsenal-sum").hidden = !known || arsenalOpen; $("f-arsenal").hidden = known && !arsenalOpen;
  if (known) $("f-arsenal-txt").textContent = a.hand==="L" ? "LHP" : "RHP";
}
$("f-arsenal-edit").addEventListener("click", ()=>{ arsenalOpen = true; paintArsenal(); });
try{ $("f-ath").value = $("w-ath").value = localStorage.getItem("bqpen.ath")||""; }catch(e){}
$("w-ath").addEventListener("change", ()=>{
  const v = $("w-ath").value.trim(); $("w-ath").value = v;
  try{ localStorage.setItem("bqpen.ath", v); }catch(e){}
  if (v && $("f-ath").value.trim()!==v){ $("f-ath").value = v; loadAthlete(); }
  renderWeek();
});
$("f-ath").addEventListener("change", ()=>{ const v = $("f-ath").value.trim(); if (v){ $("w-ath").value = v; try{ localStorage.setItem("bqpen.ath", v); }catch(e){} } });
function paintArmBefore(){ $("f-armb").innerHTML = scaleHtml("f:before", armBefore); }
paintArmBefore();
// one handler for every 1-10 scale; tapping the chosen number again clears it
document.addEventListener("click", e=>{
  const b = e.target.closest(".scale button"); if (!b) return;
  const [where, field, date] = b.parentElement.dataset.k.split(":"), v = +b.dataset.v;
  if (where==="w"){ const ath = curAthlete(), cur = (getCheckin(ath, date)||{})[field]; setCheckin(ath, date, field, cur===v ? null : v); renderWeek(); }
  else if (where==="f"){ armBefore = armBefore===v ? null : v; paintArmBefore(); }
  else if (where==="s" && pen){
    pen.armAfter = pen.armAfter===v ? null : v; queueSave();
    setCheckin(pen.athlete, pen.date, "after", pen.armAfter);
    paintSummaryArm(pen);
  }
});

$("start").addEventListener("click", ()=>{
  const ath = $("f-ath").value.trim();
  if (!ath){ $("setup-err").textContent="Enter the athlete's name to start."; $("setup-err").hidden=false; $("f-ath").focus(); return; }
  if (!setup.mix.some(c=>FAM[c]==="FB") && !setup.mix.includes("CT")){ $("setup-err").textContent="Add at least one fastball to the pitch mix."; $("setup-err").hidden=false; return; }
  if (setup.mix.length<2){ $("setup-err").textContent="Pick at least two pitches in the pitch mix."; $("setup-err").hidden=false; return; }
  $("setup-err").hidden = true;
  try{ localStorage.setItem("bqpen.ath", ath); }catch(e){}
  if (role==="player") savePlayerArsenal(); else saveAthlete(ath);
  const def = penDef(setup.fw, setup.lvl);
  const now = new Date();
  pen = { id:"p"+now.getTime().toString(36)+Math.random().toString(36).slice(2,6), athlete:ath, age:setup.age, hand:setup.hand, mix:setup.mix.slice(),
          design: setup.fw==="des" ? setup.des : null, fw:setup.fw, lvl:(setup.fw==="control"||setup.fw==="custom")?null:setup.lvl,
          penKey:def.key, penName:def.name, mode:def.mode, date:penForDate || localDate(now), createdAt:now.getTime(),
          status:"live", pitches:[], hitters:[], armBefore, armAfter:null };
  if (armBefore!=null) setCheckin(ath, pen.date, "before", armBefore);
  armBefore = null; paintArmBefore(); penForDate = null; $("f-for").hidden = true;
  if (def.mode==="counts") newHitter();
  openLive();
  queueSave();
});

// ---------- live view ----------
function curDef(){ return penDef(pen.fw, pen.lvl||1); }
function total(){ const d=curDef(); return d.mode==="plan" ? d.plan.length : d.max; }
function curHitter(){ return pen.hitters[pen.hitters.length-1]; }
function newHitter(){
  const def = curDef(); const n = pen.hitters.length;
  let h;
  if (def.sit){
    const s = SITS[Math.floor(Math.random()*SITS.length)];
    const c = s.c[Math.floor(Math.random()*s.c.length)];
    const outs = s.outs ? s.outs[Math.floor(Math.random()*s.outs.length)] : Math.floor(Math.random()*3);
    h = {n:n+1, sit:s.s, start:c, outs, r1:!!s.r1, loaded:!!s.loaded, result:null, walk:false, ttp:null};
  } else {
    const c = COUNTS4[n % COUNTS4.length];
    const osFirst = pen.fw==="cmd" && (n===0||n===3||n===6);
    h = {n:n+1, start:c, osFirst, result:null, walk:false};
  }
  const [b,s] = h.start.split("-").map(Number); h.b=b; h.s=s; h.np=0;
  pen.hitters.push(h);
}
function openLive(){
  live = {def:curDef(), called:{p:null,z:null}, swung:false, gate:true, shape:true};
  show("v-live"); renderLive();
}
function show(id){ $("v-prof").hidden = true; $("v-sched").hidden = true; $("v-hit").hidden = true; $("v-acct").hidden = true; if (tab!=="pens"){ tab="pens"; $("tabs").querySelectorAll("button").forEach(b=>b.classList.toggle("on", b.dataset.t==="pens")); }
  ["v-setup","v-live","v-sum"].forEach(v=>$(v).hidden = v!==id); window.scrollTo(0,0); }

function pitchChoices(){
  const arr = mixOf(pen).slice();
  if (pen.design && !arr.includes(pen.design)) arr.push(pen.design);
  return ORDER.filter(c=>arr.includes(c));
}
function renderLive(){
  const def = live.def, i = pen.pitches.length, tot = total();
  $("l-who").textContent = pen.athlete+" · "+pen.age+" · "+(pen.hand==="L"?"LHP":"RHP");
  $("l-pen").textContent = pen.penName;
  $("l-prog").style.width = Math.min(100, 100*i/tot)+"%";
  const done = i>=tot || (def.mode==="counts" && pen.hitters.length>=def.hitters && !!curHitter().result);
  $("l-num").innerHTML = Math.min(i+1,tot)+"<small>/"+tot+"</small>";
  const last = pen.pitches[i-1];
  let ring = null, hint = "Tap where the pitch finished";
  $("l-pick").hidden = true; $("l-count").hidden = true; $("l-outcome").hidden = true; $("l-ttp").hidden = true;
  if (def.mode==="plan"){
    const pp = plannedPitch(def,i,pen);
    if (pp){
      $("l-pitch").textContent = PNAME[pp.p] || pp.p;
      $("l-meta").textContent = (pp.set==="W"?"Windup":"Stretch") + (pp.side?" · "+sideName(pp.z)+" half":"") + (pp.note?" · "+pp.note:"") + (pp.grp?" · "+grpLabel(def,i):"");
      $("l-z").textContent = pp.z; ring = pp.z; $("l-zbadge").hidden = false;
    }
  } else {
    // called pitch: choose pitch type and intended zone first
    const c = live.called;
    $("l-pick").hidden = false;
    $("l-pick").innerHTML = pitchChoices().map(p=>`<button class="${c.p===p?'on':''}" data-p="${p}">${p}</button>`).join("");
    $("l-pitch").textContent = c.p ? (PNAME[c.p]||c.p) : "Pick pitch";
    $("l-meta").textContent = c.z==null ? "Then tap the intended zone" : "Intended zone set";
    $("l-z").textContent = c.z==null ? "–" : c.z; ring = c.z;
    hint = !c.p ? "Pick the pitch type above" : c.z==null ? "Tap the INTENDED zone" : "Now tap where the pitch FINISHED";
    if (def.mode==="counts"){
      const h = curHitter();
      $("l-count").hidden = false;
      $("l-bs").textContent = h.b+"-"+h.s;
      $("l-sit").innerHTML = "Hitter "+h.n+" of "+def.hitters + `<small>${h.sit? esc(h.sit)+" · "+h.outs+" out"+(h.outs===1?"":"s")+" · started "+h.start : "Started "+h.start+(h.osFirst?" · offspeed first":"")}</small>`;
      $("l-outcome").hidden = false;
      $("l-outcome").innerHTML = `<button class="small" data-o="W">Hitter out / weak contact (win)</button><button class="small" data-o="L">Hard contact (loss)</button>`;
      if (h.r1){ $("l-ttp").hidden = false; $("f-ttp").value = h.ttp ?? ""; }
      if (h.np>=4 && !h.result) hint = "4 pitches thrown: record the hitter result below";
    }
  }
  $("l-hint").textContent = done ? "Pen complete. Tap Finish pen for the summary." : hint;
  // toggles
  const pp = def.mode==="plan" ? plannedPitch(def,i,pen) : null;
  let t = "";
  if (def.mode!=="plan") t += `<button class="small ${live.swung?'on':''}" data-t="swung">Swung</button>`;
  if ((pp&&pp.gate) || (def.mode==="counts" && pen.fw==="tun")) t += `<button class="small ${live.gate?'on':''}" data-t="gate">Through gate</button>`;
  if ((pp&&pp.shape) || (def.mode==="counts" && pen.fw==="des" && live.called.p===pen.design)) t += `<button class="small ${live.shape?'on':''}" data-t="shape">Shape match</button>`;
  $("l-toggles").innerHTML = t;
  const trail = pen.pitches.map((p,k)=>({z:p.actual,k,fill:"currentColor",cls:"trail",r:4}));
  drawZone($("zone"), {ring, lastX: last ? last.actual : null, dots: trail});
  $("l-undo").disabled = !i;
  $("l-finish").textContent = done ? "Finish pen" : "Finish pen early";
  $("l-finish").classList.toggle("primary", done);
  // optional radar reading, for the pitch just logged
  const lastP = pen.pitches[pen.pitches.length-1];
  $("l-velo").hidden = !lastP;
  if (lastP){ $("l-velo-lbl").textContent = "Velo · pitch "+pen.pitches.length+" (optional)"; if (document.activeElement!==$("f-velo")) $("f-velo").value = lastP.v ?? ""; }
  const lst = computeStats(pen);
  renderStats($("l-stats"), lst);
  $("l-typecard").hidden = !lst.n;
  $("l-types").innerHTML = typeRows(lst, pen, false);
}
// Velo for one pitch type: top = highest reading, sat = where it sits (the middle reading)
function veloOf(vs){
  if (!vs || !vs.length) return null;
  const a = vs.slice().sort((x,y)=>x-y), m = a.length>>1;
  return {top: Math.max(...a), sat: Math.round(a.length % 2 ? a[m] : (a[m-1]+a[m])/2), n: a.length};
}
function typeRows(st, r, withTrend){
  const plannedN = {};
  const def = penDef(r.fw, r.lvl||1);
  if (def.mode==="plan") def.plan.forEach((x,i)=>{ const p = plannedPitch(def,i,r).p; plannedN[p]=(plannedN[p]||0)+1; });
  const codes = ORDER.filter(c=>st.types[c] || plannedN[c]);
  const anyV = Object.values(st.types).some(t=>t.vs.length);
  const trend = withTrend ? trendFor(r, st) : null;
  const velo = t => { if (!anyV) return ""; const v = veloOf(t.vs); return v ? `<td>${v.top}</td><td>${v.sat}</td>` : "<td>–</td><td>–</td>"; };
  return `<tr><th>Pitch</th><th>Thrown</th><th>Strike %</th><th>Hit zone %</th><th>Points</th>${anyV?"<th>Top velo</th><th>Sat velo</th>":""}</tr>` +
    codes.map(k=>{ const t = st.types[k] || {n:0,strikes:0,hit:0,pts:0,m:0,vs:[]};
      const thrown = plannedN[k] ? t.n+" / "+plannedN[k] : t.n;
      // pitch name and (in the summary) its miss tendency go on a line of their own so the table fits a phone
      const tr = trend && trend.types[k], miss = withTrend && t.n && tr ? missWords(tr, r.hand) : "";
      const sub = [PNAME[k]||"", miss && miss!=="–" ? trend.label+": "+miss.replace(/^Misses/,"misses").replace(/^On target/,"on target") : ""].filter(Boolean).join(" · ");
      return `<tr class="${sub?'has-sub':''}"><td><b>${k}</b></td><td>${thrown}</td><td>${t.n?pct(t.strikes,t.n)+"%":"–"}</td><td>${t.n?pct(t.hit,t.n)+"%":"–"}</td><td>${t.n?t.pts+" / "+(2*t.n):"–"}</td>${velo(t)}</tr>`
        + (sub ? `<tr class="sub"><td colspan="${anyV?7:5}">${esc(sub)}</td></tr>` : ""); }).join("");
}
function sideName(z){ const arm = pen.hand==="L" ? 0 : 2; return col(z)===arm ? "Arm side" : "Glove side"; }
function grpLabel(def,i){ const g = def.plan[i].grp; const idx = def.plan.filter((x,k)=>k<=i && x.grp===g).length; const n = def.plan.filter(x=>x.grp===g).length; return (n===3?"Sequence":"Pair")+" pitch "+idx+" of "+n; }

$("l-pick").addEventListener("click", e=>{const b=e.target.closest("button"); if(!b) return; live.called.p=b.dataset.p; live.shape = true; renderLive();});
$("l-toggles").addEventListener("click", e=>{const b=e.target.closest("button"); if(!b) return; const k=b.dataset.t; live[k]=!live[k]; renderLive();});
$("l-outcome").addEventListener("click", e=>{const b=e.target.closest("button"); if(!b) return; endHitter(b.dataset.o==="W"?"W":"L"); });
$("f-velo").addEventListener("change", ()=>{
  const last = pen && pen.pitches[pen.pitches.length-1]; if (!last) return;
  const v = parseFloat($("f-velo").value);
  if (isFinite(v) && v>=30 && v<=110) last.v = Math.round(v*10)/10; else { delete last.v; $("f-velo").value = ""; }
  queueSave();
  // refresh only the numbers: redrawing the zone here would swallow the tap that blurred this box
  const lst = computeStats(pen); renderStats($("l-stats"), lst); $("l-types").innerHTML = typeRows(lst, pen, false);
});
$("f-ttp").addEventListener("change", ()=>{ const h=curHitter(); const v=parseFloat($("f-ttp").value); h.ttp = isFinite(v)?v:null; queueSave(); });

$("zone").addEventListener("click", e=>{
  const svg = $("zone"), pt = svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  const z = zoneFromPoint(p.x,p.y);
  tapZone(z);
});
function tapZone(z){
  const def = live.def, i = pen.pitches.length;
  if (i>=total()) return;
  if (def.mode==="plan"){
    const pp = plannedPitch(def,i,pen); if (!pp) return;
    record({n:i+1,set:pp.set,p:pp.p,intended:pp.z,actual:z,side:pp.side,grp:pp.grp,
            gate: pp.gate ? live.gate : null, shape: pp.shape ? live.shape : null, design:pp.design, note:pp.note});
    live.gate = true; live.shape = true;
  } else {
    const c = live.called;
    if (!c.p) return;
    if (c.z==null){ c.z = z; renderLive(); return; }
    const h = def.mode==="counts" ? curHitter() : null;
    if (h && (h.result || h.np>=4)) return;
    const rec = {n:i+1,set:h&&(h.r1||h.sit&&h.sit!=="Bases empty, 2 outs")?"S":"",p:c.p,intended:c.z,actual:z,
                 swung:live.swung, gate: pen.fw==="tun" ? live.gate : null, shape: pen.fw==="des"&&c.p===pen.design ? live.shape : null, design: c.p===pen.design};
    if (h){ rec.hitter = h.n; rec.count = h.b+"-"+h.s; }
    record(rec);
    live.called = {p:c.p, z:null}; live.swung = false; live.gate = true; live.shape = true;
  }
}
function record(rec){
  const strike = isStrikeZone(rec.actual) || (!!rec.swung && rec.actual!==0);
  rec.strike = strike;
  let pts;
  if (hitTarget(rec)) pts = 2;
  else if (isStrikeZone(rec.actual)) pts = 1;
  else if (rec.actual!==0 && rec.count){ const [b,s]=rec.count.split("-").map(Number); pts = s>b ? 1 : 0; }
  else if (rec.actual!==0 && rec.intended>=11 && !rec.count) pts = 1;
  else pts = 0;
  if (rec.swung && !isStrikeZone(rec.actual) && rec.actual!==0) pts = Math.max(pts,1);
  rec.pts = pts;
  // count logic
  if (rec.hitter){
    const h = curHitter(); h.np++;
    if (strike){ if (h.s<2) h.s++; else { h.result="W"; rec.event="Strikeout"; } }
    else { h.b++; if (h.b>=4){ h.result="L"; h.walk=true; rec.pts=-1; rec.event="Walk"; } }
  }
  pen.pitches.push(rec);
  afterHitterCheck();
  queueSave(); renderLive();
}
function afterHitterCheck(){
  const def = live.def; if (def.mode!=="counts") return;
  const h = curHitter();
  if (h.result && pen.hitters.length < def.hitters) newHitter();
}
function endHitter(r){
  const h = curHitter(); if (h.result) return;
  h.result = r;
  const last = pen.pitches[pen.pitches.length-1];
  if (last && last.hitter===h.n && !last.event) last.event = r==="W" ? "Out / weak contact" : "Hard contact";
  afterHitterCheck(); queueSave(); renderLive();
}
$("l-wp").addEventListener("click", ()=>{
  const last = pen.pitches[pen.pitches.length-1]; if (!last) return;
  last.pts = -1; last.event = (last.event? last.event+", ":"")+"WP/HBP"; queueSave(); renderLive();
});
$("l-undo").addEventListener("click", ()=>{
  const rec = pen.pitches.pop(); if (!rec) return;
  if (rec.hitter){
    // rebuild hitters from scratch by replaying
    const hs = pen.hitters.slice(0, rec.hitter); // keep through this hitter
    pen.hitters = hs.map(h=>{ const [b,s]=h.start.split("-").map(Number); return Object.assign({},h,{b,s,np:0,result:null,walk:false}); });
    pen.pitches.filter(p=>p.hitter).forEach(p=>{
      const h = pen.hitters[p.hitter-1]; if (!h) return; h.np++;
      if (p.strike){ if (h.s<2) h.s++; else h.result="W"; } else { h.b++; if (h.b>=4){ h.result="L"; h.walk=true; } }
      if (p.event && /weak/.test(p.event)) h.result="W"; if (p.event && /Hard/.test(p.event)) h.result="L";
    });
  }
  if (live.def.mode!=="plan") live.called = {p:rec.p, z:rec.intended};
  queueSave(); renderLive();
});
$("l-exit").addEventListener("click", ()=>{ queueSave(); show("v-setup"); });
$("l-finish").addEventListener("click", ()=>{
  if (!pen.pitches.length){ show("v-setup"); return; }
  pen.status = "done"; queueSave(); openSummary(pen);
});

// ---------- stats ----------
function computeStats(r){
  const ps = r.pitches, n = ps.length;
  const st = {n, strikes:0, hit:0, pts:0, os:0, types:{}, osStrikeRates:[], gatePct:null, shapePct:null};
  ps.forEach(p=>{
    if (p.strike) st.strikes++; if (hitTarget(p)) st.hit++; st.pts += p.pts; if (OS(p.p)) st.os++;
    const t = st.types[p.p] || (st.types[p.p]={n:0,strikes:0,hit:0,pts:0,dx:0,dy:0,m:0,vs:[]});
    t.n++; if (p.strike) t.strikes++; if (hitTarget(p)) t.hit++; t.pts+=p.pts;
    if (typeof p.v==="number") t.vs.push(p.v);
    if (p.actual && p.intended){ const a=zoneCenter(p.actual), b=zoneCenter(p.intended); t.dx+=a[0]-b[0]; t.dy+=a[1]-b[1]; t.m++; }
  });
  const g = ps.filter(p=>p.gate!=null); if (g.length) st.gatePct = g.filter(p=>p.gate).length/g.length;
  const s = ps.filter(p=>p.shape!=null); if (s.length) st.shapePct = s.filter(p=>p.shape).length/s.length;
  // groups (pairs / sequences)
  const grps = {}; ps.forEach(p=>{ if(p.grp){ (grps[p.grp]=grps[p.grp]||[]).push(p);} });
  const def = penDef(r.fw, r.lvl||1);
  const size = {}; if (def.plan) def.plan.forEach(x=>{ if(x.grp) size[x.grp]=(size[x.grp]||0)+1; });
  const full = Object.entries(grps).filter(([k,a])=>a.length===size[k]);
  st.groups = full.length; st.groupsGate = full.filter(([k,a])=>a.every(p=>p.gate)).length;
  st.groupsExec = full.filter(([k,a])=>a.every(p=>p.gate && hitTarget(p))).length;
  st.groupSize = Object.values(size)[0] || 0;
  // hitters
  const hs = (r.hitters||[]).filter(h=>h.result);
  st.hitters = hs.length; st.wins = hs.filter(h=>h.result==="W").length; st.walks = hs.filter(h=>h.walk).length;
  st.loadedWalks = hs.filter(h=>h.walk && h.loaded).length;
  const tt = (r.hitters||[]).map(h=>h.ttp).filter(v=>typeof v==="number"); st.ttp = tt.length ? tt.reduce((a,b)=>a+b,0)/tt.length : null;
  st.max = 2*n;
  const des = ps.filter(p=>p.design); st.design = des.length; st.designHit = des.filter(hitTarget).length;
  const vs = ps.filter(p=>typeof p.v==="number"), fv = vs.filter(p=>FAM[p.p]==="FB");
  st.topVelo = vs.length ? Math.max(...vs.map(p=>p.v)) : null;
  st.fbVelo = fv.length ? Math.round(10*fv.reduce((a,p)=>a+p.v,0)/fv.length)/10 : null;
  return st;
}
const pct = (a,b) => b ? Math.round(100*a/b) : 0;
function renderStats(el, st){
  const cells = [["Pitches",st.n],["Strikes",pct(st.strikes,st.n)+"%"],["Hit zone",pct(st.hit,st.n)+"%"],["Points",st.pts+" / "+st.max],["Offspeed",pct(st.os,st.n)+"%"]];
  if (st.gatePct!=null) cells.push(["Through gate",Math.round(st.gatePct*100)+"%"]);
  if (st.shapePct!=null) cells.push(["Shape match",Math.round(st.shapePct*100)+"%"]);
  if (st.hitters) cells.push(["Hitters won",st.wins+"/"+st.hitters]);
  if (st.topVelo) cells.push(["Top velo",st.topVelo]);
  el.innerHTML = cells.slice(0,8).map(([k,v])=>`<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("");
}
function evaluate(r, st){
  const k = r.penKey, tr = st.types, osTypes = Object.keys(tr).filter(OS);
  const osRate = f => osTypes.every(t=>f(tr[t]));
  switch(k){
    case "control": return [pct(st.pts,st.max)>=60 && pct(st.strikes,st.n)>=65, "Target: 60%+ of max points and 65%+ strikes"];
    case "cmd1": return [pct(st.strikes,st.n)>=65 && osRate(t=>pct(t.strikes,t.n)>=60), "Target: 65%+ strikes overall, 60%+ strikes with each offspeed pitch"];
    case "cmd2": return [Object.values(tr).every(t=>pct(t.hit,t.n)>=60) && pct(st.strikes,st.n)>=65, "Target: 60%+ to the called half with each pitch type, 65%+ strikes"];
    case "cmd3": return [pct(st.pts,st.max)>=60 && osRate(t=>pct(t.pts,2*t.n)>=60), "Target: 60%+ of max points overall and with each offspeed pitch"];
    case "tun1": return [pct(st.groupsGate,st.groups)>=60 && osRate(t=>pct(t.strikes,t.n)>=60), "Target: 60%+ of pairs both through the gate, 60%+ strikes with each offspeed pitch"];
    case "tun2": case "des4": return [pct(st.groupsExec,st.groups)>=60, "Target: 60%+ of pairs fully executed (gate and spot)"];
    case "tun3": return [st.groupsExec>=7, "Target: 7 of 11 sequences fully executed"];
    case "des1": return [null, "Goal: pick the grip with the best shape match (see the log)"];
    case "des2": return [st.shapePct!=null && st.shapePct>=.7, "Target: 70%+ of design pitches match the goal shape"];
    case "des3": return [pct(st.designHit,st.design)>=55 && st.shapePct!=null && st.shapePct>=.7, "Target: 55%+ design pitches to the spot with 70%+ shape match"];
    case "cmd4": case "tun4": return [st.wins>=6 && st.walks<=1 && pct(st.os,st.n)>=40, "Target: win 6 of 8 hitters, max 1 walk, 40%+ offspeed"];
    case "cmd5": case "tun5": return [st.wins>=6 && st.loadedWalks===0 && (st.ttp==null||st.ttp<1.5) && pct(st.os,st.n)>=40, "Target: win 6 of 8, no walks with bases loaded, time to plate under 1.5 s, 40%+ offspeed"];
    case "des5": return [st.wins>=6 && st.loadedWalks===0 && pct(st.design,st.n)>=30, "Target: win 6 of 8, no walks with bases loaded, design pitch 30%+ of the pen"];
    case "base1": case "base2": case "base3": return [null, "Base sequence: intensity 80% to max, no set target"];
    default: return [null, "No target for a custom pen"];
  }
}
// Miss pattern per pitch for the summary. Until a pitcher has 3 pens logged it's a "Trend" from this pen
// alone; from the 3rd pen it's a "Tendency" from their recent pens (up to 5, this one included).
function trendFor(r, st){
  const me = slug(r.athlete||"");
  const mine = histDocs.filter(x=>slug(x.athlete||"")===me && x.id!==r.id && (x.pitches||[]).length && (x.createdAt||0) <= (r.createdAt||Infinity))
    .sort((a,b)=>b.createdAt-a.createdAt).slice(0,4);
  if (mine.length + 1 < 3) return {label:"Trend", types: st.types};
  const types = {};
  [st].concat(mine.map(computeStats)).forEach(s=>Object.entries(s.types).forEach(([c,t])=>{
    const a = types[c] || (types[c] = {dx:0, dy:0, m:0}); a.dx += t.dx; a.dy += t.dy; a.m += t.m; }));
  return {label:"Tendency", types, pens: mine.length + 1};
}
function missWords(t, hand){
  if (!t.m) return "–";
  const dx = t.dx/t.m, dy = t.dy/t.m, parts = [];
  if (Math.abs(dy)>=12) parts.push(dy<0?"up":"down");
  if (Math.abs(dx)>=12){ const armRight = hand!=="L"; parts.push((dx>0)===armRight ? "arm side" : "glove side"); }
  return parts.length ? "Misses "+parts.join(" and ") : "On target";
}

// ---------- summary ----------
const TYPE_COLORS = {FB:"#c0392b",SI:"#e07b39",CT:"#c2a00e",SL:"#8e44ad",SW:"#d0489a",CB:"#2f63c7",CH:"#1f8a5b",SPL:"#16839a"};
function openSummary(r){
  pen = r; show("v-sum");
  const st = computeStats(r), [ok, txt] = evaluate(r, st);
  $("s-title").textContent = r.athlete;
  $("s-sub").textContent = r.penName+" · "+r.date+" · "+r.age+" · "+(r.hand==="L"?"LHP":"RHP")+" · mix "+mixOf(r).join(", ")+(r.status==="live"?" · in progress":"");
  $("s-verdict").innerHTML = ok==null ? `<div class="pen-desc">${esc(txt)}</div>` :
    `<div class="verdict ${ok?'pass':'fail'}"><b>${ok?"Target met":"Target not met"}</b><span class="pen-desc">${esc(txt)}</span></div>`;
  paintSummaryArm(r);
  renderStats($("s-stats"), st);
  drawZone($("szone"), {dots: r.pitches.map((p,k)=>({z:p.actual,k,fill:TYPE_COLORS[p.p]||"#888",r:6,op:.9}))});
  $("s-legend").innerHTML = ORDER.filter(t=>st.types[t]).map(t=>`<span><i style="background:${TYPE_COLORS[t]||'#888'}"></i>${PNAME[t]}</span>`).join("");
  $("s-types").innerHTML = typeRows(st, r, true);
  const showGate = r.pitches.some(p=>p.gate!=null), showShape = r.pitches.some(p=>p.shape!=null), showH = r.pitches.some(p=>p.hitter);
  $("s-logwrap").open = false;
  $("s-log").innerHTML = `<tr><th>#</th><th>Pitch</th><th>Intended</th><th>Actual</th><th>Pts</th>${showGate?"<th>Gate</th>":""}${showShape?"<th>Shape</th>":""}${showH?"<th>Hitter</th><th>Count</th>":""}<th>Note</th></tr>` +
    r.pitches.map(p=>`<tr><td>${p.n}</td><td>${p.p}${p.set?" ("+p.set+")":""}</td><td>${p.intended}</td><td>${p.actual===0?"Off":p.actual}</td><td class="${p.pts===2?'pts2':p.pts===1?'pts1':p.pts<0?'ptsm':'pts0'}">${p.pts}</td>${showGate?`<td>${p.gate==null?"":p.gate?"Y":"N"}</td>`:""}${showShape?`<td>${p.shape==null?"":p.shape?"Y":"N"}</td>`:""}${showH?`<td>${p.hitter||""}</td><td>${p.count||""}</td>`:""}<td>${esc([p.note,p.event,p.swung?"swung":""].filter(Boolean).join(", "))}</td></tr>`).join("");
  $("s-resume").hidden = r.status!=="live";
  $("s-confirm").hidden = true; $("s-del").hidden = !isCoach;
  // players can resume and re-run their own pens; deleting stays with coaches
  $("s-again").hidden = false;
}
function paintSummaryArm(r){
  const b = r.armBefore ?? null, a = r.armAfter ?? null;
  $("s-arm").innerHTML = `<div class="armq"><div class="q">How does the arm feel now, after the pen?</div>${scaleHtml("s:after", a)}
    ${b==null ? `<div class="delta">No arm score was logged before this pen.</div>` : a==null ? `<div class="delta">Before the pen: <b>${b}</b></div>` : deltaHtml(b, a)}</div>`;
}
$("s-back").addEventListener("click", ()=>{ if (profReturn){ profReturn = false; if (role==="player") setTab("acct"); else { setTab("sched"); openProfile(profName); } } else show("v-setup"); });
$("s-resume").addEventListener("click", ()=>{ pen.status="live"; openLive(); });
$("s-again").addEventListener("click", ()=>{
  Object.assign(setup,{age:pen.age,hand:pen.hand,mix:mixOf(pen).slice(),fw:pen.fw,lvl:pen.lvl||1,des:pen.design||setup.des});
  $("f-ath").value = pen.athlete; saveSetup();
  repaintAll(); show("v-setup");
});
function repaintAll(){
  [["f-age","age"],["f-hand","hand"],["f-fw","fw"],["f-lvl","lvl"],["f-des","des"]].forEach(([id,k])=>$(id).querySelectorAll("button").forEach(b=>b.classList.toggle("on",String(setup[k])===b.dataset.v)));
  paintMix();
}
$("s-del").addEventListener("click", ()=>{ $("s-confirm").hidden=false; });
$("s-del-no").addEventListener("click", ()=>{ $("s-confirm").hidden=true; });
$("s-del-yes").addEventListener("click", ()=>{
  const ob = outbox(); delete ob.pens[pen.id]; if (!ob.del.includes(pen.id)) ob.del.push(pen.id); saveOutbox(ob);
  serverPens = serverPens.filter(r=>r.id!==pen.id); rebuildHist(); flush();
  show("v-setup");
});

// ---------- storage: Supabase, with an outbox so pens survive no signal ----------
const SB_URL = "https://icczlruovqfhqllnkohh.supabase.co";
const SB_KEY = "sb_publishable_wcCYY8iA-1odDWGP2MxgIw_t9DEyy1X";
// Implicit flow: confirmation and reset links carry the session in the URL itself, which still
// works when iOS opens the link in Safari rather than the home-screen app.
const sb = window.supabase ? window.supabase.createClient(SB_URL, SB_KEY, {auth:{flowType:"implicit", detectSessionInUrl:true, persistSession:true}}) : null;
let session = null, isCoach = false, coachInfo = null, chan = null, serverPens = [], flushing = false, again = false, syncErr = "";
function lsGet(k, d){ try{ const v = JSON.parse(localStorage.getItem(k)||"null"); return v==null ? d : v; }catch(e){ return d; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function outbox(){ const o = lsGet("bqpen.outbox", {}); return {pens:o.pens||{}, athletes:o.athletes||{}, checkins:o.checkins||{}, games:o.games||{}, gdel:o.gdel||[], hits:o.hits||{}, del:o.del||[]}; }
function saveOutbox(o){ lsSet("bqpen.outbox", o); }
function pendingCount(o){ o = o||outbox(); return Object.keys(o.pens).length + Object.keys(o.athletes).length + Object.keys(o.checkins).length + Object.keys(o.games).length + o.gdel.length + Object.keys(o.hits).length + o.del.length; }
serverPens = lsGet("bqpen.cache", []);

// The live spreadsheets read these summaries, so they always match what the app shows.
function penSummary(r){
  try{
    const st = computeStats(r), [ok, target] = evaluate(r, st), opt = v => v==null ? null : Math.round(v*100);
    return {pitches:st.n, strikePct:pct(st.strikes,st.n), hitZonePct:pct(st.hit,st.n), points:st.pts, maxPoints:st.max, offspeedPct:pct(st.os,st.n),
      gatePct:opt(st.gatePct), shapePct:opt(st.shapePct), hittersWon:st.hitters ? st.wins+"/"+st.hitters : null,
      targetMet: ok==null ? null : ok ? "Yes" : "No", target, topVelo: st.topVelo, fbVelo: st.fbVelo,
      velo: ORDER.map(c=>{ const v = st.types[c] && veloOf(st.types[c].vs); return v ? `${c} ${v.top} / ${v.sat}` : null; }).filter(Boolean).join(" · ") || null};
  }catch(e){ return null; }
}
function gameSummary(g){
  const n = v => v==null || v==="" ? null : +v, P = n(g.pitches), S = n(g.strikes), outs = ipOuts(g.ip), max = PITCH_MAX[athleteAge(g.athlete)];
  const r = (a,b,d) => a!=null && b ? +(a/b).toFixed(d) : null;
  return {strikePct: P && S!=null ? Math.round(100*S/P) : null, fpsPct: n(g.bf) && n(g.fps)!=null ? Math.round(100*n(g.fps)/n(g.bf)) : null,
    c11Pct: n(g.c11) && n(g.c11w)!=null ? Math.round(100*n(g.c11w)/n(g.c11)) : null,
    r2kPct: n(g.bf) && n(g.r2k)!=null ? Math.round(100*n(g.r2k)/n(g.bf)) : null,
    os2kPct: n(g.p2k) && n(g.os2k)!=null ? Math.round(100*n(g.os2k)/n(g.p2k)) : null,
    whip: outs && (g.bb!=null || g.h!=null) ? r(((n(g.bb)||0)+(n(g.h)||0))*3, outs, 2) : null, pitchesPerInning: P!=null ? r(P*3, outs, 1) : null,
    restDays: max && P!=null ? restDays(P) : null, overMax: max && P!=null ? (P>max ? "Yes" : "No") : null};
}
function hitSummary(pas){
  const t = hitStats(pas), c = code => pas.filter(p=>p.res===code).length, r3 = v => v==null ? null : +v.toFixed(3);
  return {line: gameLine(pas), pa:t.pa, ab:t.ab, h:t.h, doubles:c("2B"), triples:c("3B"), hr:c("HR"), bunts:t.bunt, bb:t.bb, hbp:t.hbp, k:t.k, rbi:t.rbi, r3Scored:t.r3, qab:t.qab, qabPct: t.qabp==null ? null : Math.round(t.qabp*100),
    sitDone: t.sitn ? t.sit : null, sitChances: t.sitn || null, sitPct: t.sitp==null ? null : Math.round(t.sitp*100),
    avg:r3(t.avg), obp:r3(t.obp), slg:r3(t.slg), hardPct: t.hardp==null ? null : Math.round(t.hardp*100)};
}
function queueSave(){
  if (!pen) return;
  const body = JSON.parse(JSON.stringify(pen)); body.updatedAt = Date.now(); body.summary = penSummary(body);
  const ob = outbox(); ob.pens[pen.id] = body; saveOutbox(ob);
  rebuildHist(); flush();
}
// A player can't write the athlete list, so their throwing hand / pitches go through set_my_arsenal
// (the saved pitch list only grows, as for coaches)
function savePlayerArsenal(){
  const prof = myProfile(), mix = ORDER.filter(c=>setup.mix.includes(c) || (prof.mix||[]).includes(c));
  if (prof.hand===setup.hand && JSON.stringify(prof.mix||[])===JSON.stringify(mix)) return;
  athleteDocs[slug(playerName)] = Object.assign({}, prof, {hand: setup.hand, mix}); lsSet("bqpen.athletes", athleteDocs);
  if (sb) sb.rpc("set_my_arsenal", {p_hand: setup.hand, p_mix: mix}).then(()=>{}, ()=>{});
}
function saveAthlete(name){
  const id = slug(name), prev = athleteDocs[id];
  // the saved mix is every pitch they throw: a pen that works on only some of them adds, never removes
  const mix = ORDER.filter(c=>setup.mix.includes(c) || (prev && (prev.mix||[]).includes(c)));
  const body = Object.assign({}, prev, {name, age:setup.age, hand:setup.hand, mix, updatedAt:Date.now()});
  if (prev && prev.age===body.age && prev.hand===body.hand && JSON.stringify(prev.mix)===JSON.stringify(body.mix) && prev.name===name) return;
  athleteDocs[id] = body;
  const ob = outbox(); ob.athletes[id] = body; saveOutbox(ob); flush();
}
// Server rows, overlaid with anything still waiting to upload, newest first.
// An athlete's velo by pitch from their pens: top = best reading in any pen, sat = where it sat in
// their most recent pen with readings for that pitch
function athleteVelo(name, pens){
  const id = slug(name||""), out = {};
  (pens || histDocs).filter(r=>slug(r.athlete||"")===id).sort((a,b)=>b.createdAt-a.createdAt).forEach(r=>{
    const by = {}; (r.pitches||[]).forEach(p=>{ if (typeof p.v==="number") (by[p.p] = by[p.p] || []).push(p.v); });
    Object.entries(by).forEach(([c, vs])=>{ const v = veloOf(vs), o = out[c];
      if (!o) out[c] = {top: v.top, sat: v.sat, date: r.date};
      else o.top = Math.max(o.top, v.top); });
  });
  return out;
}
function veloHtml(name, title, pens){
  const v = athleteVelo(name, pens), codes = ORDER.filter(c=>v[c]);
  if (!codes.length) return "";
  return `<h2>${esc(title)}</h2><div class="pen-desc">mph · top is the best reading in any pen, sat is where it sat in the latest pen</div>
    <div class="scroll"><table class="log"><tr><th>Pitch</th><th>Top</th><th>Sat</th><th>Latest pen</th></tr>${codes.map(c=>`<tr><td><b>${c}</b> <span class="m" style="color:var(--muted)">${PNAME[c]||""}</span></td><td>${v[c].top}</td><td>${v[c].sat}</td><td>${new Date(v[c].date+"T00:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short"})}</td></tr>`).join("")}</table></div>`;
}
function renderVelo(){
  const name = role==="player" ? playerName : $("f-ath").value.trim();
  const h = name ? veloHtml(name, (role==="player" ? "Your" : name+"'s")+" velo") : "";
  $("velo-card").innerHTML = h; $("velo-card").hidden = !h;
  $("me-velo").hidden = true;   // players see their velo on their profile at the top of Account
}
$("f-ath").addEventListener("change", ()=>renderVelo());
// ---------- player profile (coaches): everything logged for one player ----------
let profName = null, profData = null, profReturn = false;
const profOpen = new Set();   // games opened on the profile ("g"+date pitching, "h"+date hitting)
const TYPE_NAME = {P:"Pitcher", POS:"Position player", TWO:"Two-way"};
let profMine = false, profLoading = null;   // profMine: a player's own profile, shown at the top of their Account tab
async function openProfile(name){
  if (profName!==name) profData = null;
  profName = name; profReturn = false; profMine = false;
  $("v-sched").hidden = true; $("v-prof").hidden = false; window.scrollTo(0,0);
  renderProfile();
  loadProfile(name);
}
// players: the Account tab is their own profile (rings, pens, check-ins, games, hitting), with their account settings below
function showMyProfile(){
  const on = tab==="acct" && role==="player" && !!playerName && !!session;
  if (!on){ if (profMine){ profMine = false; $("v-prof").hidden = true; } return; }
  if (profName!==playerName){ profName = playerName; profData = null; }
  profMine = true; $("v-prof").hidden = false;
  renderProfile();
  if (!profData && profLoading!==playerName) loadProfile(playerName);
}
async function loadProfile(name){
  if (!sb || !role) return;
  profLoading = name;
  $("pf-load").textContent = profMine ? "Loading your full history…" : "Loading their full history…";
  const id = slug(name), q = (t, order) => sb.from(t).select("data").eq("athlete_slug", id).order(order, {ascending:false}).limit(300);
  const [p, c, g, h, j, bz] = await Promise.all([q("pens","created_at"), q("checkins","day"), q("games","day"), q("hitting","day"),
    sb.from("players").select("athlete_slug,added_at").eq("athlete_slug", id),
    sb.from("ballclubz_links").select("league,status,bz_name,synced_at").eq("athlete_slug", id)]);
  if (profLoading===name) profLoading = null;
  if (profName!==name) return;
  const ok = r => !r.error ? r.data.map(x=>x.data) : null;
  if (!j.error) setJoinDates(j.data);
  profData = {pens: ok(p), checkins: ok(c), games: ok(g), hits: ok(h), account: j.error ? null : j.data.length > 0, bz: bz.error ? null : (bz.data[0] || false)};
  bzBackfill(profData.games, profData.hits);
  $("pf-load").textContent = [p,c,g,h].some(r=>r.error) ? "Couldn't load everything. Showing what's on this phone." : "";
  renderProfile();
}
function closeProfile(){ $("v-prof").hidden = true; $("v-sched").hidden = tab!=="sched"; }
function profRows(server, local, name){
  // server copy, with anything still waiting to upload from this phone on top
  const id = slug(name), by = {};
  (server || Object.values(local[0])).forEach(r=>{ if (r && slug(r.athlete||"")===id) by[r.id] = r; });
  Object.values(local[1]).forEach(r=>{ if (r && slug(r.athlete||"")===id) by[r.id] = r; });
  return Object.values(by);
}
function renderProfile(){
  if ($("v-prof").hidden || !profName) return;
  const name = profName, a = athleteDocs[slug(name)] || {}, ob = outbox(), d = profData || {};
  const dd = s => new Date(s+"T00:00:00").toLocaleDateString("en-AU",{weekday:"short", day:"numeric", month:"short"});
  $("pf-name").textContent = name;
  $("pf-back").hidden = profMine; $("pf-week").hidden = profMine;
  renderProgCard(name);
  // Ballclubz: games from the GBL D1 league pages come in automatically, matched by name
  const bz = d.bz, BZ_LEAGUE = {gbld1:"GBL D1"};
  $("pf-bz").innerHTML = bz && bz.status==="linked" ? `Ballclubz (${esc(BZ_LEAGUE[bz.league]||bz.league)}): games import automatically, last checked ${new Date(bz.synced_at).toLocaleDateString("en-AU",{day:"numeric",month:"short"})}.${isCoach ? ' <button type="button" class="small ghost" data-bzsync>Check now</button>' : ""}`
    : bz && bz.status==="ambiguous" ? `Ballclubz: more than one player called ${esc(name)}. Tell Dylan their club so the right games come in.`
    : bz && bz.status==="not_found" ? (isCoach ? `Not found on Ballclubz (${esc(BZ_LEAGUE[bz.league]||bz.league)}), so games are logged by hand.` : "")
    : "";
  $("pf-sub").textContent = [a.age, TYPE_NAME[a.type], a.hand ? (a.hand==="L"?"LHP":"RHP") : "", (a.mix||[]).length ? "throws "+a.mix.join(", ") : "", BATS_NAME[a.bats] || ""].filter(Boolean).join(" · ");
  const joined = joinDates[slug(name)];
  $("pf-joined").textContent = joined ? "Joined the app "+new Date(joined+"T00:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"})
    : d.account===false && !profMine ? "Hasn't joined the app yet" : "";
  // pens
  const pens = profRows(d.pens, [Object.fromEntries(histDocs.map(r=>[r.id,r])), ob.pens], name).sort((x,y)=>y.createdAt-x.createdAt);
  const v = veloHtml(name, "Velo", pens); $("pf-velo").innerHTML = v; $("pf-velo").hidden = !v;
  $("pf-pens-card").hidden = a.type==="POS" && !pens.length;
  $("pf-pens").innerHTML = pens.length ? pens.map(r=>{ const st = computeStats(r), top = st.topVelo;
    return `<div class="prow" data-pfpen="${esc(r.id)}" style="cursor:pointer"><div><div class="n">${dd(r.date)} · ${esc(r.penName||"Pen")}</div><div class="m">${st.n} pitches · ${pct(st.strikes,st.n)}% strikes · hit zone ${pct(st.hit,st.n)}%${top?" · top "+top+" mph":""}${r.status==="live"?" · in progress":""}</div></div><span class="m">›</span></div>`; }).join("")
    : `<div class="empty">No bullpens logged yet.</div>`;
  // arm check-ins
  const chk = profRows(d.checkins, [checkinDocs, ob.checkins], name).filter(c=>c.before!=null || c.after!=null).sort((x,y)=>y.date.localeCompare(x.date));
  $("pf-arm").innerHTML = (chk.length>1 ? armChartHtml(chk) : "") + (chk.length ? `<div class="scroll"><table class="log"><tr><th>Day</th><th>Before</th><th>After</th><th>Change</th></tr>${chk.map(c=>{
    const ch = c.before!=null && c.after!=null ? c.after-c.before : null, flag = (c.before!=null && c.before<=4) || (c.after!=null && c.after<=4) || (ch!=null && ch<=-3);
    return `<tr class="${flag?'flagrow':''}"><td>${dd(c.date)}</td><td>${c.before ?? "–"}</td><td>${c.after ?? "–"}</td><td class="${flag?'flag':''}">${ch==null?"–":(ch>0?"+":"")+ch}</td></tr>`; }).join("")}</table></div>`
    : `<div class="empty">No arm check-ins yet.</div>`);
  // games
  const gms = profRows(d.games, [gameDocs, ob.games], name).filter(g=>hasStats(g) || g.pitched).sort((x,y)=>y.date.localeCompare(x.date));
  $("pf-games").innerHTML = gms.length ? `<div class="scroll"><table class="log"><tr><th>Day</th><th>IP</th><th>P</th><th>K</th><th>BB</th><th>H</th><th>Top</th></tr>${gms.map(g=>
    `<tr data-pfopen="g${g.date}" style="cursor:pointer"><td>${profOpen.has("g"+g.date)?"▾":"▸"} ${dd(g.date)}${g.opp?`<div class="m" style="color:var(--muted)">vs ${esc(g.opp)}</div>`:""}</td><td>${esc(g.ip||"–")}</td><td>${g.pitches ?? "–"}</td><td>${g.k ?? "–"}</td><td>${g.bb ?? "–"}</td><td>${g.h ?? "–"}</td><td>${g.topVelo ?? "–"}</td></tr>
     ${profOpen.has("g"+g.date) ? `<tr class="pfdetail"><td colspan="7">${gameSummaryHtml(g, name)}</td></tr>` : ""}`).join("")}</table></div>`
    : `<div class="empty">No games logged yet.</div>`;
  if (gms.length && role!=="player") $("pf-games").innerHTML += notesSummaryHtml(gms);
  // hitting
  const hts = profRows(d.hits, [hitDocs, ob.hits], name).filter(h=>(h.pas||[]).length).sort((x,y)=>y.date.localeCompare(x.date));
  renderRings(name, $("pf-rings"), {checkins: chk, pens, games: profRows(d.games, [gameDocs, ob.games], name), hits: hts});
  $("pf-hit-card").hidden = !hts.length && !isHitter(name);
  if (!$("pf-hit-card").hidden){
    const t = hitStats(hts.flatMap(h=>h.pas||[]));
    $("pf-hit").innerHTML = hts.length ? `<div class="gstats">${[["QAB %",pctFmt(t.qabp)],["Hard-hit %",pctFmt(t.hardp)],["Situational %",pctFmt(t.sitp)],["AVG",avgFmt(t.avg)],["OBP",avgFmt(t.obp)],["SLG",avgFmt(t.slg)],["OPS",avgFmt(t.ops)],["PA",t.pa],["K%",pctFmt(t.kp)],["BB%",pctFmt(t.bbp)]].map(([k,v])=>`<div><b>${v}</b><span>${k}</span></div>`).join("")}</div>
      ${role!=="player" ? hitTendencyHtml(hts, a.bats) + notesSummaryHtml(hts) : ""}
      ${hitBreakdownHtml(hts.flatMap(h=>h.pas||[]), "pf-spray", a.bats)}
      <div class="label" style="margin-top:8px">Games <span>· tap one to see every at-bat</span></div>
      <div class="palist">${hts.map(h=>`<div class="prow" data-pfopen="h${h.date}" style="cursor:pointer"><div>${profOpen.has("h"+h.date)?"▾":"▸"} ${dd(h.date)}${h.opp?` · vs ${esc(h.opp)}`:""}</div><b>${gameLine(h.pas||[])}</b></div>
        ${profOpen.has("h"+h.date) ? `<div class="pfdetail">${h.notes?`<div class="gnote"><b>Notes:</b> ${esc(h.notes)}</div>`:""}${abListHtml(h.pas||[])}${(h.pas||[]).some(p=>p.x!=null) ? fieldSvg("pf-gspray-"+h.date, h.pas.filter(p=>p.x!=null).map(p=>({x:p.x, y:p.y, c:dotColour(p.res), r:6}))) : ""}</div>` : ""}`).join("")}</div>`
      : `<div class="empty">No at-bats logged yet.</div>`;
  }
}
$("pf-back").addEventListener("click", closeProfile);
$("pf-week").addEventListener("click", ()=>{
  const name = profName; closeProfile();
  $("w-ath").value = name; $("w-ath").dispatchEvent(new Event("change"));
  document.querySelector(".day.today, #w-days .day")?.scrollIntoView({behavior:"smooth", block:"start"});
});
$("v-prof").addEventListener("click", async e=>{
  const sy = e.target.closest("[data-bzsync]");
  if (sy){ sy.disabled = true; sy.textContent = "Checking…";
    const r = await sb.functions.invoke("ballclubz-sync", {body: {}}).catch(err=>({error: err}));
    sy.textContent = r.error ? "Couldn't reach Ballclubz" : "Done";
    if (!r.error){ await loadAll(); if (profName) loadProfile(profName); }
    return; }
  const row = e.target.closest("[data-pfopen]"); if (!row) return;
  const k = row.dataset.pfopen; if (profOpen.has(k)) profOpen.delete(k); else profOpen.add(k); renderProfile();
});
$("pf-pens").addEventListener("click", e=>{
  const row = e.target.closest("[data-pfpen]"); if (!row) return;
  const id = row.dataset.pfpen, r = ((profData && profData.pens) || []).concat(histDocs, Object.values(outbox().pens)).find(x=>x && x.id===id);
  if (r){ profReturn = true; openSummary(r); }
});
function rebuildHist(){
  const ob = outbox(), byId = {};
  serverPens.forEach(r=>{ byId[r.id] = r; });
  Object.values(ob.pens).forEach(r=>{ byId[r.id] = r; });
  ob.del.forEach(id=>{ delete byId[id]; });
  histDocs = Object.values(byId).sort((a,b)=>b.createdAt-a.createdAt).slice(0,60);
  renderHist(); renderAcct(); renderVelo();
}
async function flush(){
  if (!sb || !role) { renderAcct(); return; }
  if (flushing){ again = true; return; }
  flushing = true;
  try{
    do {
      again = false;
      const ob = outbox();
      const coach = role==="coach";
      const pens = Object.values(ob.pens).filter(b=>coach || slug(b.athlete)===slug(playerName));   // players send their own pens
      const aths = coach ? Object.entries(ob.athletes) : [], del = coach ? ob.del.slice() : [];
      const chks = Object.values(ob.checkins).filter(b=>coach || slug(b.athlete)===slug(playerName));
      const gms = Object.values(ob.games).filter(b=>coach || slug(b.athlete)===slug(playerName));
      const gdel = ob.gdel.filter(id=>coach || id.startsWith(slug(playerName)+"_"));
      const hts = Object.values(ob.hits).filter(b=>coach || slug(b.athlete)===slug(playerName));
      // athletes go first: everything else is checked against the athlete's age group.
      // A permission refusal (e.g. an athlete outside this coach's age groups) is dropped
      // rather than retried, so it can't hold up the rest of the queue.
      const send = async q => { const {error} = await q; if (error && error.code!=="42501") throw error; };
      if (aths.length) await send(sb.from("athletes").upsert(aths.map(([id,b])=>({id, data:b}))));
      if (pens.length) await send(sb.from("pens").upsert(pens.map(b=>({id:b.id, data:b, created_at:b.createdAt}))));
      if (chks.length) await send(sb.from("checkins").upsert(chks.map(b=>({id:b.id, data:b, day:b.date}))));
      if (gms.length) await send(sb.from("games").upsert(gms.map(b=>({id:b.id, data:b, day:b.date}))));
      if (hts.length) await send(sb.from("hitting").upsert(hts.map(b=>({id:b.id, data:b, day:b.date}))));
      if (gdel.length) await send(sb.from("games").delete().in("id", gdel));
      if (del.length) await send(sb.from("pens").delete().in("id", del));
      // drop only what was sent and has not changed since
      const now = outbox();
      pens.forEach(b=>{ const cur = now.pens[b.id]; if (cur && cur.updatedAt===b.updatedAt) delete now.pens[b.id]; });
      aths.forEach(([id,b])=>{ const cur = now.athletes[id]; if (cur && cur.updatedAt===b.updatedAt) delete now.athletes[id]; });
      chks.forEach(b=>{ const cur = now.checkins[b.id]; if (cur && cur.updatedAt===b.updatedAt) delete now.checkins[b.id]; });
      gms.forEach(b=>{ const cur = now.games[b.id]; if (cur && cur.updatedAt===b.updatedAt) delete now.games[b.id]; });
      now.gdel = now.gdel.filter(id=>!gdel.includes(id));
      hts.forEach(b=>{ const cur = now.hits[b.id]; if (cur && cur.updatedAt===b.updatedAt) delete now.hits[b.id]; });
      now.del = now.del.filter(id=>!del.includes(id));
      saveOutbox(now);
      pens.forEach(b=>{ const i = serverPens.findIndex(r=>r.id===b.id); if (i>=0) serverPens[i]=b; else serverPens.push(b); });
      serverPens = serverPens.filter(r=>!del.includes(r.id));
    } while (again);
    syncErr = "";
  }catch(e){ syncErr = (e && e.message) || "offline"; }
  finally{ flushing = false; }
  renderAcct();
}
async function loadAll(){
  if (!sb || !role) return;
  const since = new Date(weekDates(-2).Mon+"T00:00:00");
  // games and hitting for the whole season (from 1 July): the goal numbers are season numbers
  const t0 = new Date(), season = (t0.getMonth()>=6 ? t0.getFullYear() : t0.getFullYear()-1)+"-07-01";
  const [p, a, c, g, h, sp, pn] = await Promise.all([
    sb.from("pens").select("data").order("created_at",{ascending:false}).limit(60),
    sb.from("athletes").select("id,data").limit(500),
    sb.from("checkins").select("data").gte("day", localDate(since)).limit(2000),
    sb.from("games").select("data").gte("day", season).limit(3000),
    sb.from("hitting").select("data").gte("day", season).limit(3000),
    // every finished sprint Day 1, older ones too: they set which week of the sprint program is next
    sb.from("checkins").select("data").eq("data->>sprint", "d1").limit(2000),
    // pain on an individual program day, older ones too: they set where the program is up to
    sb.from("checkins").select("data").eq("data->>pain", "true").limit(2000)]);
  if (!p.error){ serverPens = p.data.map(r=>r.data); lsSet("bqpen.cache", serverPens); }
  if (!a.error){ athleteDocs = {}; a.data.forEach(r=>{ athleteDocs[r.id] = r.data; }); lsSet("bqpen.athletes", athleteDocs); }
  if (!c.error){ checkinDocs = {}; c.data.concat(sp.error ? [] : sp.data, pn.error ? [] : pn.data).forEach(r=>{ checkinDocs[r.data.id] = r.data; }); lsSet("bqpen.checkins", checkinDocs); }
  if (!g.error){ gameDocs = {}; g.data.forEach(r=>{ gameDocs[r.data.id] = r.data; }); lsSet("bqpen.games", gameDocs); }
  if (!h.error){ h.data.forEach(r=>{ hitDocs[r.data.id] = r.data; }); lsSet("bqpen.hits", hitDocs); hitSeasonFor = null; }
  if (role==="player"){ const j = await sb.from("players").select("athlete_slug,added_at"); if (!j.error) setJoinDates(j.data); }
  rebuildHist(); paintArsenal(); if (role==="player") applyRole(); else renderWeek();
  renderHit();
  bzBackfill(Object.values(gameDocs), Object.values(hitDocs));
}
let roleBoot = lsGet("bqpen.role", null);   // set up below, once the account state exists
athleteDocs = lsGet("bqpen.athletes", {});
checkinDocs = lsGet("bqpen.checkins", {});
gameDocs = lsGet("bqpen.games", {});
hitDocs = lsGet("bqpen.hits", {});
renderWeek();
let reloadT = null;
function scheduleReload(){ clearTimeout(reloadT); reloadT = setTimeout(loadAll, 400); }
let authUid = null;   // the account the app is set up for (auth events for it again are just token refreshes)
async function afterAuth(){
  // work out who this is first, then switch over in one go: while the checks run the app keeps working as before
  // (setting role to null here used to lock the app for a moment and throw players off a live pen)
  let nRole = null, nName = null, nCoach = false, nInfo = null;
  if (!session) lsSet("bqpen.role", null);
  if (session){
    const {data, error} = await sb.rpc("is_coach");
    // no signal at the field: carry on as who they were last time on this phone
    const cached = lsGet("bqpen.role", null);
    if (error && cached && cached.uid===session.user.id){
      ({role, playerName, isCoach, coachInfo} = cached); authUid = session.user.id; applyRole(); renderAcct(); return;
    }
    nCoach = !error && data===true;
    if (nCoach){
      nRole = "coach";
      const c = await sb.rpc("my_coach");
      nInfo = (!c.error && c.data) || {name:null, owner:false, age_groups:[]};
    }
    else {
      const r = await sb.rpc("my_athlete");
      if (!r.error && r.data){ nRole = "player"; nName = capName(r.data); }
    }
    if (!nRole && await autoJoin()) return afterAuth();
    lsSet("bqpen.role", nRole ? {uid: session.user.id, role: nRole, playerName: nName, isCoach: nCoach, coachInfo: nInfo} : null);
  }
  role = nRole; playerName = nName; isCoach = nCoach; coachInfo = nInfo; authUid = session && role ? session.user.id : null;
  if (session && role) claimPhonePens();
  applyRole();
  if (chan){ sb.removeChannel(chan); chan = null; }
  if (role){
    chan = sb.channel("bqpen")
      .on("postgres_changes",{event:"*",schema:"public",table:"pens"}, scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"athletes"}, scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"checkins"}, scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"games"}, scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"hitting"}, scheduleReload)
      .subscribe();
    await flush(); await loadAll();
  }
  renderAcct();
  if (pen && $("v-sum").hidden===false) $("s-del").hidden = !isCoach;
  if (role==="coach") loadPlayers();
}
// Pens saved on this phone before anyone signed in go into the first account that signs in here
function claimPhonePens(){
  if (lsGet("bqpen.claimed", false)) return;
  lsSet("bqpen.claimed", true);
  if (role!=="player" || !playerName) return;   // a coach's sign-in uploads them as they are
  const ob = outbox(); let n = 0;
  Object.values(ob.pens).forEach(r=>{ if (r && slug(r.athlete||"")!==slug(playerName)){ r.athlete = playerName; r.updatedAt = Date.now(); n++; } });
  if (n){ saveOutbox(ob); rebuildHist(); }
}
// No account, no app: until someone is signed in and on a team, only the Account tab shows
const locked = () => !!sb && !role;
function applyLock(){
  const l = locked();
  $("tabs").querySelectorAll("button").forEach(b=>{ if (b.dataset.t!=="acct") b.classList.toggle("lockhide", l); });
  $("lock-note").hidden = !l;
  if (l && tab!=="acct"){ lockForced = tab; setTab("acct"); }
  else if (!l && lockForced){ const back = lockForced; lockForced = false;
    if (back==="pens" && pen && pen.status==="live" && live){ setTab("pens"); show("v-live"); } else setTab(back); }
}
let lockForced = false;
function applyRole(){
  const player = role==="player";
  $("newpen").hidden = !!(session && !role);   // players log their own pens too
  const coach = role==="coach", noGroups = coach && !myAges().length;
  $("players-card").hidden = !coach;
  $("coaches-wrap").hidden = !isOwner();
  $("coach-name-card").hidden = !(coach && !coachInfo.name);
  $("no-groups").hidden = !noGroups;
  if (noGroups) $("newpen").hidden = true;
  $("join-card").hidden = !(session && !role);
  limitAges();
  $("hist-title").textContent = player ? "Your pens" : "Recent pens";
  $("w-ath").readOnly = player;
  $("w-athwrap").hidden = $("h-athwrap").hidden = $("f-athwrap").hidden = player;
  if (player && playerName && $("f-ath").value.trim()!==playerName){ $("f-ath").value = playerName; loadAthlete(); }
  $("me-card").hidden = !player;
  if (player) renderMe();
  // position players don't pitch: no Bullpens tab, and their throwing week has no bullpens
  const posOnly = player && (athleteDocs[slug(playerName||"")]||{}).type==="POS";
  $("tabs").querySelector('[data-t="pens"]').hidden = posOnly;
  $("tab-hit").hidden = !posOnly && ((player && !isHitter(playerName)) || pitchingOnly());
  if ((posOnly && tab==="pens") || ($("tab-hit").hidden && tab==="hit")) setTab("sched");
  if (player){
    $("w-ath").value = playerName;
    const prof = athleteDocs[slug(playerName)];
    if (prof && prof.age){ setup.age = prof.age; }
    // a live pen left on screen from someone else (e.g. a coach on this phone) goes back to setup; never the player's own pen
    if (!$("v-live").hidden && !(pen && pen.status==="live" && slug(pen.athlete||"")===slug(playerName))) show("v-setup");
  }
  renderWeek();
  applyLock();
}
// points people at the Account tab while they still need to sign in, join, or get an age group
function renderNudge(){
  const t = !sb ? "" : !session ? "Sign in or create an account to save and sync."
    : !role ? "Join your team with your team code."
    : role==="coach" && coachInfo && !coachInfo.owner && !(coachInfo.age_groups||[]).length ? "You don't have an age group yet."
    : role==="coach" && coachInfo && !coachInfo.name ? "Add your name so the team owner knows who you are." : "";
  $("acct-nudge-t").textContent = t;
  $("acct-nudge").hidden = !t || tab==="acct";
}
$("acct-nudge-go").addEventListener("click", ()=>setTab("acct"));
function msg(t, warn){ const el = $("a-msg"); el.textContent = t; el.hidden = !t; el.className = warn===false ? "pen-desc" : "notice"; }
function renderAcct(){
  showMyProfile();
  const n = pendingCount();
  $("acct-out").hidden = !!session; $("acct-in").hidden = !session; $("acct-reset").hidden = !(session && recovering);
  if (!sb){ msg("Sync isn't available. Pens are kept on this phone."); return; }
  renderNudge();
  if (!session) return;
  // never show the email address, even to its owner (screens get shared and screenshotted)
  $("a-who").textContent = role==="coach" ? (coachInfo.name || "Coach") : role==="player" ? playerName : "Signed in";
  const wait = n ? n+" change"+(n===1?"":"s")+" waiting to upload"+(syncErr?" (no connection)":"") : "";
  const groups = isOwner() ? "Owner · all age groups" : "Coach · "+(myAges().join(", ") || "no age group yet");
  $("a-sync").textContent = role==="coach" ? groups+" · "+(wait || "all synced")
    : role==="player" ? "Player: "+playerName+(wait ? " · "+wait : "")
    : "Not on the team yet: enter your team code below";
  if (!role) msg("");
  else if (!$("a-msg").classList.contains("pen-desc")) msg("");
}
// ---------- age groups: coaches only work with the groups the owner gave them ----------
const AGES = ["U16","U18","AYWC","AWC"];
// a pitching-only coach (set by the owner) doesn't see hitting
function pitchingOnly(){ return role==="coach" && !!(coachInfo && coachInfo.pitching_only); }
function isOwner(){ return role==="coach" && !!(coachInfo && coachInfo.owner); }
function myAges(){ return role!=="coach" ? AGES : isOwner() ? AGES : AGES.filter(a=>(coachInfo.age_groups||[]).includes(a)); }
function limitAges(){
  const ok = myAges();
  ["w-age","f-age"].forEach(id=>$(id).querySelectorAll("button").forEach(b=>{ b.hidden = role==="coach" && !ok.includes(b.dataset.v); }));
  // players' age group is set in Account; a coach with one age group has nothing to pick
  const fixed = role==="player" || (role==="coach" && ok.length===1);
  ["w-age","f-age"].forEach(id=>$(id).parentElement.hidden = fixed);
  $("p-age").innerHTML = `<option value="">Age group</option>` + ok.map(a=>`<option>${a}</option>`).join("");
  if (role==="coach" && ok.length && !ok.includes(setup.age)){ setup.age = ok[0]; saveSetup(); repaintAll(); }
}
// ---------- a player's own details (Account tab) ----------
function myProfile(){ return athleteDocs[slug(playerName||"")] || {}; }
// ---------- push reminders (players): arm check-in 7:30am daily, log your game 3pm on game days ----------
const PUSH_KEY = "BGZfN12GjMItSJHTbX-O49K70mXACVUB93C_8pFSb2FJUMEHPtBbtxWB8efnaaqyCW8tumhdxYsgEzDBxJidUJQ";
const pushOK = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const installed = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints > 1);
async function pushSub(){ try{ const r = await navigator.serviceWorker.ready; return await r.pushManager.getSubscription(); }catch(e){ return null; } }
async function renderPush(){
  const note = $("push-note"), btn = $("push-btn");
  const when = "Every day at 7:30am: complete arm check-in and check schedule. On game days: a reminder to log your game.";
  if (!pushOK() || (isIOS() && !installed())){
    note.textContent = isIOS() && !installed() ? "To get reminders, add the app to your home screen (Share, then Add to Home Screen) and open it from there." : "This phone or browser can't show reminders.";
    btn.hidden = true; return; }
  const sub = Notification.permission==="granted" ? await pushSub() : null;
  if (Notification.permission==="denied"){ note.textContent = "Notifications are blocked for this app. Turn them on in your phone's settings, then come back here."; btn.hidden = true; return; }
  note.textContent = sub ? "Reminders are on. "+when : when;
  btn.hidden = false; btn.textContent = sub ? "Turn off reminders" : "Turn on reminders"; btn.dataset.on = sub ? "1" : "";
}
function b64key(s){ const p = "=".repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g,"+").replace(/_/g,"/")); return Uint8Array.from(b, c=>c.charCodeAt(0)); }
$("push-btn").addEventListener("click", async ()=>{
  const btn = $("push-btn"), note = $("push-note"); btn.disabled = true;
  try{
    if (btn.dataset.on){
      const sub = await pushSub(); if (sub){ await sb.rpc("delete_push_sub", {p_endpoint: sub.endpoint}); await sub.unsubscribe(); }
      lsSet("bqpen.push", false);
    } else {
      if (await Notification.requestPermission() !== "granted"){ btn.disabled = false; renderPush(); return; }
      const r = await navigator.serviceWorker.ready;
      const sub = await r.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: b64key(PUSH_KEY)});
      const {data, error} = await sb.rpc("save_push_sub", {p_sub: sub.toJSON()});
      if (error || data!=="ok") throw new Error("save");
      lsSet("bqpen.push", true); lsSet("bqpen.gamedays", ""); renderWeek();   // sends this week's game days
    }
  }catch(e){ note.textContent = "Couldn't change reminders. Check your connection and try again."; btn.disabled = false; return; }
  btn.disabled = false; renderPush();
});
// The schedule already knows a player's game days; the reminder server gets this week's whenever they change.
function pushGameDays(days){
  if (!sb || !lsGet("bqpen.push", false)) return;
  const key = days.join(","); if (lsGet("bqpen.gamedays", "") === key) return;
  sb.rpc("set_my_game_days", {p_days: days}).then(({error})=>{ if (!error) lsSet("bqpen.gamedays", key); });
}
function renderMe(){
  const prof = myProfile();
  $("me-name").textContent = "Your details";   // their name heads their profile above
  renderVelo(); renderPush();
  $("me-age").querySelectorAll("button").forEach(b=>b.classList.toggle("on", b.dataset.v===prof.age));
  $("me-type").querySelectorAll("button").forEach(b=>b.classList.toggle("on", b.dataset.v===prof.type));
  $("me-ars").hidden = $("me-ars-save").hidden = !pitches(prof.type);
  $("me-batswrap").hidden = !(prof.type==="POS" || prof.type==="TWO");
  $("me-bats").querySelectorAll("button").forEach(b=>b.classList.toggle("on", b.dataset.v===prof.bats));
  if (pitches(prof.type)) arsenalPaint("me-ars", {hand: prof.hand, mix: prof.mix});
}
$("me-ars-save").addEventListener("click", async ()=>{
  const a = arsenalRead("me-ars"), el = $("me-msg");
  if (arsenalPicks(a)){ el.textContent = arsenalPicks(a); return; }
  el.textContent = "Saving…";
  const {data, error} = await sb.rpc("set_my_arsenal", {p_hand: a.hand, p_mix: a.mix});
  if (error || data!=="ok"){ el.textContent = "Couldn't save. Check your connection and try again."; return; }
  athleteDocs[slug(playerName)] = Object.assign({}, myProfile(), a); lsSet("bqpen.athletes", athleteDocs);
  el.textContent = "Saved.";
});
async function saveMe(patch){
  const prof = myProfile(), next = {age: patch.age || prof.age, type: patch.type || prof.type};
  const el = $("me-msg");
  if (!next.age || !next.type){ Object.assign(prof, patch); athleteDocs[slug(playerName)] = prof; renderMe(); el.textContent = !next.age ? "Now pick your age group." : "Now pick pitcher, position player or two-way."; return; }
  el.textContent = "Saving…";
  const {data, error} = await sb.rpc("set_my_profile", {p_age: next.age, p_type: next.type});
  if (error || data!=="ok"){ el.textContent = "Couldn't save. Check your connection and try again."; renderMe(); return; }
  athleteDocs[slug(playerName)] = Object.assign({}, prof, next); lsSet("bqpen.athletes", athleteDocs);
  setup.age = next.age; saveSetup();
  el.textContent = "Saved.";
  applyRole(); renderHit();
}
$("me-bats").addEventListener("click", async e=>{ const b = e.target.closest("button"); if (!b) return; const el = $("me-msg");
  el.textContent = "Saving…";
  const {data, error} = await sb.rpc("set_my_bats", {p_bats: b.dataset.v});
  if (error || data!=="ok"){ el.textContent = "Couldn't save. Check your connection and try again."; return; }
  athleteDocs[slug(playerName)] = Object.assign({}, myProfile(), {bats: b.dataset.v}); lsSet("bqpen.athletes", athleteDocs);
  el.textContent = "Saved."; renderMe(); });
["me-age","me-type"].forEach(id=>$(id).addEventListener("click", e=>{ const b = e.target.closest("button"); if (!b) return;
  saveMe(id==="me-age" ? {age: b.dataset.v} : {type: b.dataset.v}); }));
$("cn-save").addEventListener("click", async ()=>{
  const el = $("cn-msg"), name = $("cn-name").value.trim();
  const {data, error} = await sb.rpc("set_my_coach_name", {p_name: name});
  if (error || data!=="ok"){ el.textContent = data==="name_required" ? "Enter your name (2 to 60 characters)." : "Couldn't save. Check your connection."; el.hidden = false; return; }
  coachInfo.name = name; el.hidden = true; applyRole(); renderAcct();
  if (isOwner()) loadCoaches();
});
// ---------- player accounts (coaches only) ----------
const JOIN_MSG = {
  bad_code: "That code isn't right. Check it with your coach.",
  too_many_attempts: "Too many wrong codes. Wait an hour and try again.",
  name_required: "Enter your full name too.",
  age_required: "Players: pick your age group too.",
  type_required: "Players: pick pitcher, position player or two-way too.",
  update_app: "This page is out of date. Close the app fully and open it again.",
  name_taken: "That name is already on the team. If it's you, ask your coach to remove the old account first.",
  already_linked: "This account is already on the team under a different name. Ask your coach to fix it.",
  email_not_confirmed: "Confirm your email first: open the link we sent you, then sign in again.",
  not_signed_in: "Sign in first.",
};
const joinedMsg = type => type==="POS" ? "You're on the team. Your throwing week is on the Throwing week tab, and you log games on the Hitting tab." : "You're on the team. Log your arm check-ins on the Throwing week tab.";
// Player / Coach switch on the sign-up and join forms: players also pick age group and type
function whoOf(id){ const b = $(id).querySelector("button.on"); return b ? b.dataset.v : "player"; }
function setWho(id, v){ const seg = $(id); seg.querySelectorAll("button").forEach(b=>b.classList.toggle("on", b.dataset.v===v)); seg.parentElement.querySelectorAll(".pl-only").forEach(el=>el.hidden = v!=="player"); }
["a-who","j-who"].forEach(id=>$(id).addEventListener("click", e=>{ const b = e.target.closest("button"); if (b) setWho(id, b.dataset.v); }));
// Throws + pitch mix picker for pitchers and two-way players (sign-up, join and Your details)
function arsenalPaint(id, v){
  v = v || {};
  $(id).innerHTML = `<div class="label">Throws</div><div class="seg" data-ah>${[["R","RHP"],["L","LHP"]].map(([k,l])=>`<button type="button" data-v="${k}" class="${v.hand===k?'on':''}">${l}</button>`).join("")}</div>
    <div class="label">Pitches you throw</div><div class="checklist" data-am>${PITCHES.map(p=>`<button type="button" data-v="${p.c}" class="${(v.mix||[]).includes(p.c)?'on':''}">${p.n}</button>`).join("")}</div>`;
}
function arsenalRead(id){
  const h = $(id).querySelector("[data-ah] .on");
  return {hand: h ? h.dataset.v : "", mix: ORDER.filter(c=>$(id).querySelector(`[data-am] [data-v="${c}"].on`))};
}
const pitches = type => type==="P" || type==="TWO";
function arsenalPicks(a){ return !a.hand ? "Pick which hand you throw with." : a.mix.length < 2 ? "Tap at least two pitches you throw." : ""; }
["a-ars","j-ars","me-ars"].forEach(id=>{ arsenalPaint(id); $(id).addEventListener("click", e=>{ const b = e.target.closest("button"); if (!b) return;
  if (b.parentElement.matches("[data-ah]")) b.parentElement.querySelectorAll("button").forEach(x=>x.classList.toggle("on", x===b));
  else b.classList.toggle("on"); }); });
[["a-type","a-ars"],["j-type","j-ars"]].forEach(([t,a])=>$(t).addEventListener("change", ()=>{ $(a).hidden = !pitches($(t).value); }));
// after joining, a pitcher's throws and pitch mix from sign-up are saved to their profile
async function saveJoinArsenal(type, a){
  if (!pitches(type) || !a || !a.hand || !(a.mix||[]).length) return;
  await sb.rpc("set_my_arsenal", {p_hand: a.hand, p_mix: a.mix});
}
function playerPicks(age, type){ return !age ? "Pick your age group." : !type ? "Pick pitcher, position player or two-way." : ""; }
// Join with the code given at sign-up, once per page load. True if it worked.
let autoJoinTried = false;
async function autoJoin(){
  if (autoJoinTried || !session) return false;
  autoJoinTried = true;
  const meta = session.user.user_metadata || {}, local = lsGet("bqpen.join", {});
  const code = meta.join_code || local.code, name = meta.join_name || local.name || "", age = meta.join_age || local.age || "", type = meta.join_type || local.type || "";
  if (!code) return false;
  const {data, error} = await sb.rpc("join_team", {p_code: code, p_name: name || null, p_age: age || null, p_type: type || null});
  if (!error && (data==="coach" || data==="player")){
    if (data==="player") await saveJoinArsenal(type, {hand: meta.join_hand || local.hand, mix: meta.join_mix || local.mix});
    try{ localStorage.removeItem("bqpen.join"); }catch(e){}
    sb.auth.updateUser({data:{join_code:null, join_name:null, join_age:null, join_type:null, join_who:null, join_hand:null, join_mix:null}}).catch(()=>{});
    setTimeout(()=>msg(data==="coach" ? "You're on the team as a coach." : joinedMsg(type), false), 0);
    return true;
  }
  // show what went wrong in the join form, with their details filled in to fix
  $("j-code").value = code; $("j-name").value = name; $("j-age").value = age; $("j-type").value = type;
  arsenalPaint("j-ars", {hand: meta.join_hand || local.hand, mix: meta.join_mix || local.mix}); $("j-ars").hidden = !pitches(type);
  setWho("j-who", meta.join_who || local.who || "player");
  setTimeout(()=>{ const el = $("j-msg"); el.textContent = error ? "Couldn't join yet. Check your connection and tap Join team." : (JOIN_MSG[data] || "Couldn't join. Check the code and try again."); el.hidden = false; el.className = "notice"; }, 0);
  return false;
}
$("join-form").addEventListener("submit", async e=>{
  e.preventDefault();
  const player = whoOf("j-who")==="player";
  const code = $("j-code").value.trim(), name = $("j-name").value.trim(), age = player ? $("j-age").value : "", type = player ? $("j-type").value : "";
  const jm = (t, warn)=>{ const el = $("j-msg"); el.textContent = t; el.hidden = !t; el.className = warn===false ? "pen-desc" : "notice"; };
  if (player && playerPicks(age, type)){ jm(playerPicks(age, type)); return; }
  const ars = player && pitches(type) ? arsenalRead("j-ars") : null;
  if (ars && arsenalPicks(ars)){ jm(arsenalPicks(ars)); return; }
  if (!code){ jm("Enter the team code."); return; }
  $("j-go").disabled = true;
  const {data, error} = await sb.rpc("join_team", {p_code: code, p_name: name || null, p_age: age || null, p_type: type || null});
  $("j-go").disabled = false;
  if (error){ jm(/fetch|network/i.test(error.message) ? "No connection. Try again when you have signal." : "Couldn't join. Try again."); return; }
  if (data!=="coach" && data!=="player"){ jm(JOIN_MSG[data] || "Couldn't join. Try again."); return; }
  if (data==="player") await saveJoinArsenal(type, ars);
  $("j-code").value = ""; $("j-name").value = ""; $("j-age").value = ""; $("j-type").value = ""; jm("");
  try{ localStorage.removeItem("bqpen.join"); }catch(_){}
  sb.auth.updateUser({data:{join_code:null, join_name:null, join_age:null, join_type:null, join_who:null, join_hand:null, join_mix:null}}).catch(()=>{});
  await afterAuth();
  msg(data==="coach" ? "You're on the team as a coach." : joinedMsg(type), false);
});
async function loadCodes(){
  const {data, error} = await sb.from("team_codes").select("role,code");
  if (error){ $("codes").innerHTML = `<div class="empty">Couldn't load codes. Check your connection.</div>`; return; }
  const by = Object.fromEntries(data.map(r=>[r.role, r.code]));
  $("codes").innerHTML = [["player","Player code"],["coach","Coach code · only you see this; new coaches start with no age group"]].filter(([r])=>by[r]).map(([r,l])=>`<div class="codebox"><div><div class="lbl">${l}</div><div class="code">${esc(by[r]||"–")}</div></div><div><button class="small" data-copy="${esc(by[r]||"")}">Copy</button> <button class="small ghost" data-rot="${r}">New code</button></div></div>`).join("");
}
$("codes").addEventListener("click", async e=>{
  const c = e.target.closest("button[data-copy]");
  if (c){ try{ await navigator.clipboard.writeText(c.dataset.copy); c.textContent = "Copied"; }catch(_){ c.textContent = "Copy failed"; } setTimeout(()=>{ c.textContent = "Copy"; }, 1500); return; }
  const b = e.target.closest("button[data-rot]"); if (!b) return;
  if (b.dataset.armed!=="1"){ b.dataset.armed = "1"; b.textContent = "Tap again: old code stops working"; return; }
  const {error} = await sb.rpc("rotate_join_code", {p_role: b.dataset.rot});
  if (error){ pmsg("Couldn't change the code. Check your connection."); return; }
  pmsg("New code made. Share it with the team; the old one no longer works for new sign-ups.", false); loadCodes();
});
let coachRows = [];
async function loadCoaches(){
  if (!isOwner()) return;
  const {data, error} = await sb.from("coaches").select("id,name,age_groups,owner,pitching_only,added_at").order("added_at");
  if (error){ $("c-list").innerHTML = `<div class="empty">Couldn't load coaches.</div>`; return; }
  data.sort((a,b)=>(b.owner?1:0)-(a.owner?1:0) || byName(a.name, b.name));   // you first, then A to Z
  coachRows = data;
  $("c-list").innerHTML = data.map(r=>{
    const label = r.name ? esc(r.name) : "Unnamed coach · joined "+new Date(r.added_at).toLocaleDateString("en-AU",{day:"numeric",month:"short"});
    if (r.owner) return `<div class="prow"><div><div class="n">${label} (you)</div><div class="m">Owner · all age groups</div></div></div>`;
    const seg = AGES.map(a=>`<button type="button" data-cg="${r.id}" data-v="${a}" class="${(r.age_groups||[]).includes(a)?"on":""}">${a}</button>`).join("");
    return `<div class="prow" style="flex-wrap:wrap"><div style="flex:1 1 180px"><input value="${esc(r.name||"")}" placeholder="Coach name" data-cn="${r.id}" maxlength="60" style="width:100%"></div><button class="small ghost" data-rmc="${r.id}">Remove</button><div class="seg" style="flex:1 1 100%">${seg}</div><div class="seg" style="flex:1 1 100%"><button type="button" data-cpo="${r.id}" class="${r.pitching_only?"on":""}">Pitching only · no Hitting tab</button></div></div>`;
  }).join("");
}
async function saveCoach(id, patch){
  const r = coachRows.find(x=>x.id===id); if (!r) return;
  const next = Object.assign({}, r, patch);
  const {data, error} = await sb.rpc("set_coach", {p_id: id, p_name: next.name || "", p_groups: next.age_groups});
  if (error || data!=="ok"){ pmsg(data==="name_required" ? "Coach names are 2 to 60 characters." : "Couldn't save. Check your connection."); loadCoaches(); return; }
  Object.assign(r, patch); pmsg("Saved.", false);
}
$("c-list").addEventListener("click", async e=>{
  const po = e.target.closest("button[data-cpo]");
  if (po){
    const on = !po.classList.contains("on"); po.classList.toggle("on", on);
    const {data, error} = await sb.rpc("set_coach_pitching_only", {p_id: po.dataset.cpo, p_on: on});
    if (error || data!=="ok"){ pmsg("Couldn't save. Check your connection."); loadCoaches(); return; }
    const r = coachRows.find(x=>x.id===po.dataset.cpo); if (r) r.pitching_only = on;
    pmsg("Saved.", false); return;
  }
  const g = e.target.closest("button[data-cg]");
  if (g){
    const r = coachRows.find(x=>x.id===g.dataset.cg); if (!r) return;
    const on = !g.classList.contains("on"), groups = AGES.filter(a=>a===g.dataset.v ? on : (r.age_groups||[]).includes(a));
    g.classList.toggle("on", on); saveCoach(r.id, {age_groups: groups}); return;
  }
  const b = e.target.closest("button[data-rmc]"); if (!b) return;
  if (b.dataset.armed!=="1"){ b.dataset.armed = "1"; b.textContent = "Tap again to remove"; return; }
  const {error} = await sb.from("coaches").delete().eq("id", b.dataset.rmc);
  if (error){ pmsg("Couldn't remove. Check your connection."); return; }
  pmsg("Coach removed.", false); loadCoaches();
});
$("sk-new").addEventListener("click", async e=>{
  const b = e.currentTarget;
  if (b.dataset.armed!=="1"){ b.dataset.armed = "1"; b.textContent = "Tap again: any old key stops working"; return; }
  b.dataset.armed = ""; b.textContent = "Make export key";
  const {data, error} = await sb.rpc("new_sheet_key");
  if (error || !data){ pmsg("Couldn't make a key. Check your connection."); return; }
  $("sk-key").textContent = data; $("sk-box").hidden = false;
});
$("sk-copy").addEventListener("click", async e=>{
  const c = e.currentTarget;
  try{ await navigator.clipboard.writeText($("sk-key").textContent); c.textContent = "Copied"; }catch(_){ c.textContent = "Copy failed"; }
  setTimeout(()=>{ c.textContent = "Copy"; }, 1500);
});
$("c-list").addEventListener("change", e=>{
  const i = e.target.closest("input[data-cn]"); if (!i) return;
  const name = i.value.trim(); if (name) saveCoach(i.dataset.cn, {name});
});
async function loadPlayers(){
  loadCodes(); loadCoaches();
  const {data, error} = await sb.from("players").select("athlete,athlete_slug,added_at").order("athlete");
  if (error){ $("p-list").innerHTML = `<div class="empty">Couldn't load players. Check your connection.</div>`; return; }
  data.sort((a,b)=>byName(a.athlete, b.athlete));
  playerNames = data.map(r=>r.athlete); setJoinDates(data); renderWeek();
  $("p-title").textContent = isOwner() ? "Players" : "Players · "+(myAges().join(", ") || "no age group");
  // one section per age group, players A to Z within it
  const ageOf = r => (athleteDocs[r.athlete_slug] || {}).age || "No age group";
  const groups = AGES.concat(["No age group"]).filter(g=>data.some(r=>ageOf(r)===g));
  $("p-list").innerHTML = data.length ? groups.map(g=>`<div class="label" style="margin:10px 16px 2px">${esc(g)}</div>` + data.filter(r=>ageOf(r)===g).map(r=>
      `<div class="prow"><div class="n">${esc(r.athlete)}</div><button class="small ghost" data-rm="${esc(r.athlete_slug)}">Remove</button></div>`).join("")).join("")
    : `<div class="empty">No players yet. Share the player code above.</div>`;
}
function pmsg(t, warn){ const el = $("p-msg"); el.textContent = t; el.hidden = !t; el.className = warn===false ? "pen-desc" : "notice"; }
$("p-add").addEventListener("click", async ()=>{
  const athlete = $("p-name").value.trim(), email = $("p-email").value.trim().toLowerCase(), age = $("p-age").value;
  if (!athlete){ pmsg("Enter the player's name exactly as it's used for their pens."); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ pmsg("Enter a valid email address."); return; }
  if (!age){ pmsg("Pick the player's age group."); return; }
  $("p-add").disabled = true;
  const {data, error} = await sb.rpc("link_player", {p_email: email, p_name: athlete, p_age: age});
  $("p-add").disabled = false;
  if (error){ pmsg(/fetch|network/i.test(error.message) ? "No connection. Try again when you have signal." : "Couldn't link. Try again."); return; }
  if (data!=="ok"){ pmsg({name_taken:"That name is already linked to another account.", already_linked:"That email is already linked to a different player.", not_allowed:"That player isn't in one of your age groups.", bad_email:"Enter a valid email address."}[data] || "Couldn't link. Check the details."); return; }
  $("p-name").value = ""; $("p-email").value = "";
  // the email is cleared and not repeated back, so it never stays on screen
  pmsg(athlete+" is linked. They can now create an account with that email and sign in.", false);
  await loadAll();
  loadPlayers();
});
$("p-list").addEventListener("click", async e=>{
  const b = e.target.closest("button[data-rm]"); if (!b) return;
  if (b.dataset.armed!=="1"){ b.dataset.armed = "1"; b.textContent = "Tap again to remove"; return; }
  const {error} = await sb.from("players").delete().eq("athlete_slug", b.dataset.rm);
  if (error){ pmsg("Couldn't remove. Check your connection."); return; }
  pmsg("Removed. That account can no longer see any data.", false); loadPlayers();
});

// Passwords go straight to Supabase over HTTPS, where they are stored only as bcrypt hashes.
// This page never saves them, and every field is cleared as soon as a request is sent.
// Messages are deliberately the same whether or not an account exists, so the form
// can't be used to find out which emails are registered.
const BACK = location.origin + location.pathname;
let recovering = false;
function readCreds(){
  const email = $("a-email").value.trim().toLowerCase(), password = $("a-pass").value;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ msg("Enter a valid email address."); return null; }
  if (password.length < 10){ msg("Passwords are at least 10 characters."); return null; }
  $("a-pass").value = "";
  return {email, password};
}
function busy(on){ ["a-in","a-forgot","a-resend"].forEach(id=>$(id).disabled = on); }
let authMode = "in";
function setAuthMode(m){
  authMode = m;
  $("a-mode").querySelectorAll("button").forEach(b=>b.classList.toggle("on", b.dataset.v===m));
  $("up-fields").hidden = m!=="up"; $("a-forgot").hidden = $("a-resend").hidden = m==="up";
  $("a-in").textContent = m==="up" ? "Create account" : "Sign in";
  $("a-pass").autocomplete = m==="up" ? "new-password" : "current-password";
  $("a-pass").placeholder = m==="up" ? "New password" : "Password";
  msg("");
}
$("a-mode").addEventListener("click", e=>{ const b = e.target.closest("button"); if (b) setAuthMode(b.dataset.v); });
$("a-form").addEventListener("submit", async e=>{
  e.preventDefault();
  if (authMode==="up") return createAccount();
  const c = readCreds(); if (!c) return;
  busy(true);
  const {error} = await sb.auth.signInWithPassword(c);
  busy(false);
  if (error) msg(/rate|too many/i.test(error.message) ? "Too many attempts. Wait a few minutes and try again."
    : error.code==="email_not_confirmed" || /not confirmed/i.test(error.message) ? "This email hasn't been confirmed yet. Tap Resend confirmation email below, then tap the button in the email."
    : "Email or password is incorrect, or the email hasn't been confirmed yet.");
  else { $("a-email").value = ""; msg(""); }
});
async function createAccount(){
  const who = whoOf("a-who"), player = who==="player";
  const code = $("a-code").value.trim(), name = $("a-name").value.trim(), age = player ? $("a-age").value : "", type = player ? $("a-type").value : "";
  if (!code){ msg("Enter the team code from your coach."); $("a-code").focus(); return; }
  if (name.length < 2){ msg("Enter your full name."); $("a-name").focus(); return; }
  if (player && playerPicks(age, type)){ msg(playerPicks(age, type)); $(age ? "a-type" : "a-age").focus(); return; }
  const ars = player && pitches(type) ? arsenalRead("a-ars") : {hand:"", mix:[]};
  if (player && pitches(type) && arsenalPicks(ars)){ msg(arsenalPicks(ars)); return; }
  const c = readCreds(); if (!c) return;
  // the code rides along with the account, so joining works even if the confirmation
  // link opens in a different browser; join_team() checks it once the email is confirmed
  lsSet("bqpen.join", {code, name, age, type, who, hand: ars.hand, mix: ars.mix});
  busy(true);
  const {data, error} = await sb.auth.signUp({...c, options:{emailRedirectTo: BACK, data:{join_code: code, join_name: name || null, join_age: age || null, join_type: type || null, join_who: who, join_hand: ars.hand || null, join_mix: ars.mix.length ? ars.mix : null}}});
  busy(false);
  if (error && !/registered|exists/i.test(error.message)){ msg(/weak|password/i.test(error.message) ? error.message : "Couldn't create the account. Try again in a few minutes."); return; }
  if (!data || !data.session){ setAuthMode("in"); msg("Check your email (and junk). Tap the button in it, then tap Confirm. You'll be added to the team automatically.", false); }
}
$("a-forgot").addEventListener("click", async ()=>{
  const email = $("a-email").value.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ msg("Enter your email above first."); return; }
  busy(true);
  await sb.auth.resetPasswordForEmail(email, {redirectTo: BACK});
  busy(false);
  msg("If there's an account for that email, a reset email is on its way (check junk too). Tap the button in it, then tap Continue.", false);
});
$("a-resend").addEventListener("click", async ()=>{
  const email = $("a-email").value.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ msg("Enter your email above first."); $("a-email").focus(); return; }
  busy(true);
  const {error} = await sb.auth.resend({type: "signup", email, options:{emailRedirectTo: BACK}});
  busy(false);
  if (error && /rate|security purposes|seconds|too many/i.test(error.message)){ msg("An email was just sent. Wait a minute, then try again."); return; }
  msg("If that email has an account waiting to be confirmed, a new confirmation email is on its way (check junk too). Tap the button in it, then tap Confirm. Older confirmation emails no longer work.", false);
});
// The email links open the app with a Confirm button instead of confirming straight away: work email
// scanners (e.g. Microsoft Defender) open every link in an email, which used up the link before the person did.
{
  const q = new URLSearchParams(location.search), th = q.get("token_hash"), type = q.get("type");
  if (th && type && sb){
    history.replaceState(null, "", location.pathname);
    $("link-title").textContent = type==="recovery" ? "Reset your password" : "Confirm your email";
    $("link-go").textContent = type==="recovery" ? "Continue to set a new password" : "Confirm my email";
    $("link-box").hidden = false;
    setTimeout(()=>setTab("acct"), 0);
    $("link-go").addEventListener("click", async ()=>{
      $("link-go").disabled = true;
      const {error} = await sb.auth.verifyOtp({token_hash: th, type: type==="recovery" ? "recovery" : "email"});
      $("link-go").disabled = false; $("link-box").hidden = true;
      if (error){ msg("That link has expired or was already used. Request a new email: Resend confirmation email or Forgot password, below."); return; }
      if (type==="recovery"){ recovering = true; msg("Now set your new password below.", false); }
      else msg("Email confirmed. You're signed in.", false);
      renderAcct();
    });
  }
}
$("acct-reset").addEventListener("submit", async e=>{
  e.preventDefault();
  const password = $("a-new").value; $("a-new").value = "";
  if (password.length < 10){ msg("Use at least 10 characters."); return; }
  const {error} = await sb.auth.updateUser({password});
  if (error){ msg(error.message); return; }
  recovering = false; msg("Password updated.", false); renderAcct();
});
// Confirmation and reset links send errors back on the URL (e.g. an expired link)
{
  const q = new URLSearchParams(location.search + "&" + location.hash.slice(1));
  const err = q.get("error_description");
  if (err){ setTimeout(()=>msg("That link didn't work: "+err.replace(/\+/g," ")+". Request a new one."), 0); history.replaceState(null, "", location.pathname); }
}
$("a-out").addEventListener("click", async ()=>{
  recovering = false; autoJoinTried = false; await sb.auth.signOut(); msg("");
  $("sk-key").textContent = ""; $("sk-box").hidden = true;
  // shared phones: drop the signed-in person's synced data from this device
  ["bqpen.cache","bqpen.checkins","bqpen.athletes","bqpen.games","bqpen.hits","bqpen.joined"].forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
  serverPens = []; checkinDocs = {}; athleteDocs = {}; joinDates = {}; gameDocs = {}; hitDocs = {}; hitSeasonFor = null; rebuildHist(); renderWeek();
});
if (roleBoot && roleBoot.role){ ({role, playerName, isCoach, coachInfo} = roleBoot); applyRole(); }
applyLock();
if (sb){
  // supabase-js warns against awaiting its own calls inside this callback
  sb.auth.onAuthStateChange((ev, s)=>{ session = s; if (ev==="PASSWORD_RECOVERY"){ recovering = true; setTimeout(()=>setTab("acct"), 0); }
    // a refreshed token, or the same account signing in again when the app comes back, changes nothing: keep going
    if ((ev==="TOKEN_REFRESHED" || ev==="SIGNED_IN") && s && role && authUid===s.user.id) return;
    setTimeout(afterAuth, 0); });
  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", ()=>{ if (!document.hidden){ flush(); scheduleReload(); } });
  setInterval(()=>{ if (pendingCount()) flush(); }, 30000);
}
rebuildHist();
if ("serviceWorker" in navigator && location.protocol==="https:"){
  // when a new version takes over, reload once so it shows straight away (not mid-pen)
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", ()=>{
    if (hadController && !(pen && pen.status==="live" && !$("v-live").hidden)) location.reload();
  });
  navigator.serviceWorker.register("sw.js", {updateViaCache: "none"}).then(r=>r.update()).catch(()=>{});
}

function renderHist(){
  const el = $("hist");
  const names = [...new Set([...Object.values(athleteDocs).filter(a=>a.name && inGroup(a.name, a.age)).map(a=>a.name), ...histDocs.filter(r=>inGroup(r.athlete, r.age)).map(r=>r.athlete)])].sort(byName);
  $("athletes").innerHTML = names.map(n=>`<option value="${esc(n)}"></option>`).join("");
  if (role!=="player") $("hist-title").textContent = "Recent pens · "+setup.age;
  if (!histDocs.some(r=>inGroup(r.athlete, r.age))){ el.innerHTML = `<div class="empty">${histDocs.length && role!=="player" ? "No "+setup.age+" pens yet." : "Saved pens show here. Start a pen above and every pitch is saved as you log it."}</div>`; return; }
  el.innerHTML = histDocs.map((r,i)=>{
    if (!inGroup(r.athlete, r.age)) return "";
    const st = computeStats(r), [ok] = evaluate(r, st);
    const pill = r.status==="live" ? `<span class="pill">In progress</span>` : ok==null ? "" : `<span class="pill ${ok?'pass':'fail'}">${ok?"Target met":"Not met"}</span>`;
    return `<button data-i="${i}"><span class="n">${esc(r.athlete)} ${pill}</span><span class="s">${st.n? st.pts+" / "+st.max+" pts":"–"}</span><span class="m">${esc(r.penName)} · ${r.date} · ${st.n} pitches</span></button>`;
  }).join("");
}
$("hist").addEventListener("click", e=>{ const b=e.target.closest("button[data-i]"); if(!b) return; openSummary(JSON.parse(JSON.stringify(histDocs[+b.dataset.i]))); });

})();
