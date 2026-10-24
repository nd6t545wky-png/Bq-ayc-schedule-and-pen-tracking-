# BQ Weekly Schedule and Tracking

Weekly throwing schedule, bullpen, game and hitting tracking for Baseball Queensland players.
It's an installable web app (PWA): open it on a phone, add it to the home screen, and it runs full-screen and works offline at the field.

## How it works

- `index.html`: the whole app.
- `sw.js`: caches the app so it opens with no signal. Bump `VERSION` in it whenever you change a file, so phones pick up the update.
- `manifest.webmanifest` and `icons/`: home-screen name and icon.
- `vendor/supabase-2.117.3.js`: Supabase client (MIT, see `vendor/supabase-LICENSE`).

Pens sync through the Supabase project `bq-pen-tracker` (ap-southeast-2). Each pen is saved on the phone first and uploads when there's a connection, so nothing is lost without signal.

Coaches sign in with email and password. Only signed-in coaches whose email is on the coach list can read or write pens. Anyone can create an account, but they see nothing until their email is added.

## How emails and passwords are protected

- Passwords go straight to Supabase over HTTPS and are stored only as bcrypt hashes. Nobody, including the admin, can read them.
- The app never saves a password on the phone, and clears the password box as soon as it's sent.
- The accounts table isn't reachable from the app, and the email columns of the coach and player lists aren't readable by anyone signed in, so no one can pull a list of emails. The app never shows an email address; people appear by name.
- Coaches are assigned to age groups and only see athletes (pens, check-ins, games, hitting, player accounts) in those groups. The owner sees all groups and is the only one who sees the coach list and the coach code.
- Pens store the athlete's name and an anonymous user id, not coach emails.
- Sign-in, sign-up and password reset show the same message whether or not an account exists, so the form can't be used to find out which emails are registered.
- Passwords must be at least 10 characters. Forgotten passwords are reset by an emailed link.
- A coach only gets access after confirming their email, enforced in the database itself (`supabase/migrations/`).

## Supabase settings (one-time)

1. Authentication → Sign In / Providers → Email: keep it on with **Confirm email** on, and set the minimum password length to 10.
2. Authentication → URL Configuration: set **Site URL** to the app's hosted URL and add it under **Redirect URLs**, so confirmation and reset links open the app.
3. Confirmation and password-reset emails are sent through Brevo (free, 300 emails a day); see [docs/brevo-setup.md](docs/brevo-setup.md). Until that's set up, Supabase's built-in sender only reaches members of the Supabase team, so create accounts by hand: Authentication → Users → **Add user** → **Create new user**, tick **Auto Confirm User**.

## Staying awake on the free plan

Free Supabase projects pause after about a week with little use. `.github/workflows/keepalive.yml` sends one harmless request a day (it calls `public.keepalive()`, which reads no data) so that doesn't happen. You can run it by hand from the repo's **Actions** tab → *Keep Supabase awake* → **Run workflow**. GitHub turns off scheduled jobs in a repo with no activity for 60 days; if that happens, re-enable it from the same page.

## Joining the team (no admin work)

People sign themselves up:

1. Open the app → Bullpens → **New account**, enter the **team code** (players also enter their full name), email and a password, and tap **Create account**.
2. Open the confirmation email, come back and **Sign in**. They're added to the team automatically. If the code was wrong, the app shows **Join your team** with the reason so they can fix it.

Coaches find the codes in Bullpens → **Team codes**: a player code and a separate coach code. Share them privately. **New code** replaces a code; people already on the team stay. Each player name can only be claimed by one account, 10 wrong codes in an hour locks that account out for the hour, and players only ever see their own data. Coaches can remove players in their age groups from the same card. The owner sees **Coaches** below it: tap U16/U18/AYWC/AWC to give or take away a coach's access, rename them, or remove them. New coaches start with no age group until the owner gives them one. New players pick their age group when they join. A player can still be linked by email by hand under "Link a player by email instead".

**From 7 December 2026 (after the GBL break), U16 and U18 weeks build themselves.** The week starts as a no-games week: Mon recovery, Tue long toss, Wed full bullpen, Thu recovery, Fri light 15-pitch bullpen, Sat recovery, Sun no throw. Tap a day in the Mon–Sun row to add (or remove) a game for the selected athlete; each game has a **Not used / Pitched** switch, starting on Not used.
- Pitched: the next two days become a tolerance throw then a light bullpen, and there's no full bullpen that week.
- Not used: the full bullpen stays, moved so it isn't on a game day or the day before a game.
- A pitched game inside the two down days after another outing is flagged "Not available".

Games are saved per player and synced, so the player sees the week the coach set. Players can add their own games but can't remove one once its day has passed. AYWC/AWC, and any week before 7 December, keep the single-game weeks.

**Hitting.** The **Hitting** tab tracks position players at-bat by at-bat. Coaches mark each player as Pitcher, Position or Two-way; only Position and Two-way players get hitting (players who are pitchers don't see the tab). For each at-bat: the count when it ended, the result (single, double, triple, home run, walk, HBP, error, fielder's choice, K swinging/looking, ground/fly/line/pop out, sac fly, sac bunt), contact quality and a tap on the field for where the ball went, plus RBI. Each game shows the batting line (e.g. 2-for-4, 2B, BB · 1 RBI); the season card shows AVG, OBP, SLG, OPS, PA, K%, BB%, hard-hit %, 2-strike hitting and a spray chart. Coaches see a Hitting table in the team card. Players can log and see only their own at-bats.

**Game logs.** Each game day on the Throwing week tab has **Log this game** for the selected athlete (players log their own): opponent, innings (4.2 = 4⅔), batters faced, pitches, strikes, balls (filled in from pitches − strikes if left blank), first-pitch strikes, K, BB, HBP, hits, runs, earned runs, home runs, wild pitches and notes. The summary works out strike %, first-pitch strike %, WHIP, pitches per inning and K/BB, and for U16/U18 shows Pitch Smart rest days and flags pitch counts over the daily max (95 for U16, 105 for U18). Use **Last week** at the top of the tab to log a weekend game (or arm check-ins) after the week has rolled over. Coaches see a **Games** table under Team arm check-ins.

**Live spreadsheets.** One Google Sheet per age group (Players, Season, Arm check-ins, Bullpens, Pitches, Games, Hitting games, At-bats), players A to Z, updating every 5 minutes; new players and new data fields show up on their own. The owner makes an export key in the app (Bullpens → Coaches → Live spreadsheets) and sets it up once with [docs/sheets-setup.md](docs/sheets-setup.md). Each sheet is shared view-only with that age group's coaches and nobody else; no email addresses appear in the sheets.

**Start date.** Each player's schedule starts the day their account joined the team: earlier days show as "Before joining" and the only thing that can be filled in on them is a game played that day (This week or Last week), and the team table leaves those days blank. Athletes a coach enters without an account have no start date.

Coaches see every player's scores in **Team arm check-ins** at the top of the Throwing week tab (this week or last week). Scores of 4 or lower, or a drop of 3 or more, are flagged in red and listed under "to follow up".

## Adding a coach by hand

Usually coaches just join with the coach code. To add one directly, in the Supabase dashboard → SQL editor:

```sql
insert into public.coaches (email, name, age_groups) values ('coach@example.com', 'Coach Name', array['U16']);
```

The coach then signs out and back in on the app.

You can see who has signed in under Supabase → Authentication → Users.

## Hosting

The app is plain static files, so any static host works. With GitHub Pages:

1. The repo must be public (Pages on a private repo needs a paid GitHub plan). The Supabase key in `index.html` is a publishable key, which is meant to be public; access is enforced by row-level security.
2. Settings → Pages → Build and deployment → Deploy from a branch → `main`, `/ (root)`.
3. Finish the Supabase settings above using the Pages URL.

## Install on a phone

- iPhone: open the link in Safari → Share → Add to Home Screen.
- Android: open in Chrome → menu → Install app.
